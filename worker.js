/**
 * Cloudflare Worker + Global SQLite Durable Object for Wedding Invitation Analytics
 * Tracks both Level 2A (Total Views, Unique Visitors, Envelope Opens, Country Breakdown VN/TW)
 * and Level 2B (Per-Guest real-time activity log: Guest Name, Open Status, Device, Location, Time).
 */

function parseDeviceLabel(ua = "") {
  const s = String(ua);
  if (/iPhone/i.test(s)) return "iPhone";
  if (/iPad/i.test(s)) return "iPad";
  if (/Android/i.test(s)) return "Android";
  if (/Macintosh|Mac OS X/i.test(s)) return "Mac";
  if (/Windows/i.test(s)) return "Windows PC";
  return "Thiết bị khác";
}

function isBotUserAgent(ua = "") {
  return /bot|crawler|spider|crawling|facebookexternalhit|Facebot|Twitterbot|TelegramBot|Discordbot|Slackbot|WhatsApp|LinkedInBot|Applebot|Googlebot|bingbot|ZaloPC-win32|Line-Poker|HeadlessChrome/i.test(
    String(ua)
  );
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function defaultState() {
  return {
    totalViews: 0,
    openedEnvelopeTotal: 0,
    flippedBackTotal: 0,
    countries: {},
    visitors: {}, // key -> guest/visitor record
    recentEvents: [], // latest 250 guest records sorted by lastSeenAt
    updatedAt: new Date().toISOString()
  };
}

export class WeddingAnalytics {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async loadData() {
    const stored = await this.state.storage.get("analytics_v1");
    return stored && typeof stored === "object" ? stored : defaultState();
  }

  async saveData(data) {
    data.updatedAt = new Date().toISOString();
    await this.state.storage.put("analytics_v1", data);
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === "/api/reset" && request.method === "POST") {
      const fresh = defaultState();
      await this.saveData(fresh);
      return Response.json({ ok: true, stats: this.formatStats(fresh) }, { headers: CORS_HEADERS });
    }

    if (url.pathname === "/api/track" && request.method === "POST") {
      let body = {};
      try {
        body = await request.json();
      } catch (_) {}

      const ua = body.ua || request.headers.get("user-agent") || "";
      if (isBotUserAgent(ua)) {
        return Response.json({ ok: true, skipped: "bot" }, { headers: CORS_HEADERS });
      }

      const eventType = String(body.event || "view");
      const rawGuest = String(body.guest || "").trim();
      const guestName = rawGuest || "Khách mở link chung (không kèm tên)";
      const vid = String(body.vid || "anon").slice(0, 64);
      const lang = body.lang === "zh" ? "zh" : "vi";
      const mode = body.mode === "thankyou" ? "thankyou" : "invite";
      const country = String(body.country || "VN").toUpperCase();
      const city = String(body.city || "").trim();
      const device = parseDeviceLabel(ua);
      const now = new Date().toISOString();

      const data = await this.loadData();

      // Group key: if guest has a specific name (?to=...), group by normalized guest name; otherwise by visitor ID
      const key = rawGuest
        ? "guest:" + rawGuest.toLowerCase().replace(/\s+/g, " ")
        : "anon:" + vid;

      let rec = data.visitors[key];
      if (!rec) {
        rec = {
          key,
          guestName,
          hasCustomName: Boolean(rawGuest),
          vid,
          lang,
          mode,
          country,
          city,
          device,
          views: 0,
          openedEnvelope: false,
          flippedBack: false,
          firstSeenAt: now,
          lastSeenAt: now
        };
        data.visitors[key] = rec;
      }

      rec.guestName = guestName;
      rec.lang = lang;
      rec.mode = mode;
      if (country) rec.country = country;
      if (city) rec.city = city;
      if (device) rec.device = device;
      rec.lastSeenAt = now;

      if (eventType === "view") {
        data.totalViews = (data.totalViews || 0) + 1;
        rec.views = (rec.views || 0) + 1;
        data.countries[country] = (data.countries[country] || 0) + 1;
      } else if (eventType === "open_envelope") {
        if (!rec.openedEnvelope) {
          rec.openedEnvelope = true;
          data.openedEnvelopeTotal = (data.openedEnvelopeTotal || 0) + 1;
        }
      } else if (eventType === "flip_back") {
        if (!rec.flippedBack) {
          rec.flippedBack = true;
          data.flippedBackTotal = (data.flippedBackTotal || 0) + 1;
        }
      }

      // Keep max 400 visitor records so storage stays fast and compact
      const allKeys = Object.keys(data.visitors);
      if (allKeys.length > 400) {
        const sorted = allKeys
          .map((k) => data.visitors[k])
          .sort((a, b) => String(b.lastSeenAt).localeCompare(String(a.lastSeenAt)));
        const nextMap = {};
        sorted.slice(0, 350).forEach((item) => {
          nextMap[item.key] = item;
        });
        data.visitors = nextMap;
      }

      await this.saveData(data);
      return Response.json({ ok: true }, { headers: CORS_HEADERS });
    }

    if (url.pathname === "/api/stats") {
      const data = await this.loadData();
      return Response.json(
        { ok: true, stats: this.formatStats(data) },
        {
          headers: {
            ...CORS_HEADERS,
            "Cache-Control": "no-store, no-cache, must-revalidate"
          }
        }
      );
    }

    return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
  }

  formatStats(data) {
    const list = Object.values(data.visitors || {}).sort((a, b) =>
      String(b.lastSeenAt || "").localeCompare(String(a.lastSeenAt || ""))
    );
    const uniqueVisitors = list.length;
    const openedEnvelopeCount = list.filter((r) => r.openedEnvelope).length;
    const flippedBackCount = list.filter((r) => r.flippedBack).length;

    return {
      totalViews: data.totalViews || 0,
      uniqueVisitors,
      openedEnvelopeCount,
      flippedBackCount,
      countries: data.countries || {},
      guests: list.slice(0, 200),
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }

      if (env.WEDDING_ANALYTICS) {
        try {
          const id = env.WEDDING_ANALYTICS.idFromName("global-wedding-tuong-dinh");
          const stub = env.WEDDING_ANALYTICS.get(id);

          // Enrich /api/track with Cloudflare Edge GeoIP (Country + City)
          if (url.pathname === "/api/track" && request.method === "POST") {
            let payload = {};
            try {
              payload = await request.json();
            } catch (_) {}
            payload.country = request.cf?.country || payload.country || "VN";
            payload.city = request.cf?.city || payload.city || "";
            payload.ua = request.headers.get("user-agent") || "";

            const forwardReq = new Request(url.toString(), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            return await stub.fetch(forwardReq);
          }

          return await stub.fetch(request);
        } catch (err) {
          return Response.json(
            { ok: false, error: String(err && err.message ? err.message : err) },
            { status: 500, headers: CORS_HEADERS }
          );
        }
      }

      return Response.json(
        { ok: false, error: "WEDDING_ANALYTICS binding not available" },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
