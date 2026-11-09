/**
 * Cloudflare Worker + Global SQLite Durable Object for Wedding Invitation Analytics (v57)
 * - Level 2A: Summary KPIs (Total Opens, Unique Guests, Envelope Unseals, Country Breakdown VN/TW)
 * - Level 2B (Detailed Unmerged Session Log): Every single open / device session is recorded
 *   individually with detailed Device Model + OS + Browser/App (Zalo, LINE, Safari, Chrome...) + City + Timestamp.
 * - Permanent Server-Side Saved Guest List: Remembers all generated guest links across reloads & devices.
 */

function parseDetailedDevice(ua = "", screen = "") {
  const s = String(ua);

  // 1. Detect In-App Browser or Standalone Browser
  let appOrBrowser = "Trình duyệt Web";
  if (/Zalo/i.test(s)) {
    appOrBrowser = "App Zalo";
  } else if (/\bLine\//i.test(s)) {
    appOrBrowser = "App LINE";
  } else if (/FBAN|FBAV|FB_IAB|Messenger/i.test(s)) {
    appOrBrowser = /Messenger/i.test(s) ? "App Messenger" : "App Facebook";
  } else if (/Instagram/i.test(s)) {
    appOrBrowser = "App Instagram";
  } else if (/MicroMessenger/i.test(s)) {
    appOrBrowser = "App WeChat";
  } else if (/TikTok|BytedanceWebview/i.test(s)) {
    appOrBrowser = "App TikTok";
  } else if (/CocCoc|coc_coc_browser/i.test(s)) {
    appOrBrowser = "Cốc Cốc";
  } else if (/SamsungBrowser/i.test(s)) {
    appOrBrowser = "Samsung Internet";
  } else if (/Edg\/|EdgiOS|EdgA/i.test(s)) {
    appOrBrowser = "Microsoft Edge";
  } else if (/CriOS|Chrome\//i.test(s) && !/Edg/i.test(s)) {
    appOrBrowser = "Chrome";
  } else if (/FxiOS|Firefox\//i.test(s)) {
    appOrBrowser = "Firefox";
  } else if (/Safari\//i.test(s) && /Version\//i.test(s)) {
    appOrBrowser = "Safari";
  } else if (/iPhone|iPad/i.test(s)) {
    appOrBrowser = "Safari / WebKit";
  }

  // 2. Detect Device Hardware & OS Version
  let deviceHardware = "Thiết bị khác";
  if (/iPhone/i.test(s)) {
    const iosMatch = s.match(/OS (\d+)[._](\d+)/);
    const iosVer = iosMatch ? `iOS ${iosMatch[1]}.${iosMatch[2]}` : "iOS";
    deviceHardware = `📱 iPhone (${iosVer})`;
  } else if (/iPad/i.test(s)) {
    const iosMatch = s.match(/OS (\d+)[._](\d+)/);
    const iosVer = iosMatch ? `iPadOS ${iosMatch[1]}.${iosMatch[2]}` : "iPadOS";
    deviceHardware = `📱 iPad (${iosVer})`;
  } else if (/Android/i.test(s)) {
    const verMatch = s.match(/Android\s+([0-9.]+)/i);
    const andVer = verMatch ? `Android ${verMatch[1]}` : "Android";
    let model = "";
    const modelMatch = s.match(/Android[^;)]*;\s*([^;)]+?)(?:\s+Build\/|\))/i);
    if (modelMatch && modelMatch[1]) {
      const rawModel = modelMatch[1].trim();
      if (rawModel && !/^K$/i.test(rawModel) && !/wv/i.test(rawModel)) {
        model = rawModel;
      }
    }
    if (!model) {
      if (/Samsung|SM-/i.test(s)) model = "Samsung";
      else if (/Xiaomi|Redmi|POCO/i.test(s)) model = "Xiaomi";
      else if (/OPPO|CPH/i.test(s)) model = "OPPO";
      else if (/Vivo/i.test(s)) model = "Vivo";
      else if (/Pixel/i.test(s)) model = "Google Pixel";
    }
    deviceHardware = model ? `📱 ${model} (${andVer})` : `📱 Điện thoại ${andVer}`;
  } else if (/Macintosh|Mac OS X/i.test(s)) {
    deviceHardware = "💻 Máy tính Mac (macOS)";
  } else if (/Windows NT 10\.0/i.test(s)) {
    deviceHardware = "💻 Máy tính Windows 10/11";
  } else if (/Windows/i.test(s)) {
    deviceHardware = "💻 Máy tính Windows";
  } else if (/Linux/i.test(s)) {
    deviceHardware = "💻 Máy tính Linux";
  }

  const screenNote = screen ? ` [${screen}]` : "";
  return `${deviceHardware} • ${appOrBrowser}${screenNote}`;
}

function isBotUserAgent(ua = "") {
  return /bot|crawler|spider|crawling|facebookexternalhit|Facebot|Twitterbot|TelegramBot|Discordbot|Slackbot|WhatsApp|LinkedInBot|Applebot|Googlebot|bingbot|ZaloPC-win32|Line-Poker|HeadlessChrome/i.test(
    String(ua)
  );
}

function normalizeGuestKey(name = "") {
  return String(name || "")
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// Pre-printed numbered QR bookmark codes look like "7-k3x9" (number + 4-char checksum)
function isValidSlotCode(code = "") {
  return /^\d{1,4}-[a-z0-9]{4}$/.test(String(code));
}

function slotNumFromCode(code = "") {
  return parseInt(String(code).split("-")[0], 10) || 0;
}

function makeSlotCode(num) {
  const n = Math.max(1, Math.min(9999, parseInt(num, 10) || 1));
  let h = (n * 2654435761) ^ 0x5a3c9e17;
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  const unsigned = (h ^ (h >>> 16)) >>> 0;
  const hash4 = unsigned.toString(36).padStart(4, "0").slice(0, 4).toLowerCase();
  return `${n}-${hash4}`;
}

function normalizeSlotsAndGuests(stored) {
  if (!stored || !Array.isArray(stored.savedGuests)) return;
  if (!stored.slots || typeof stored.slots !== "object") stored.slots = {};

  // 1. If any legacy guest lacks .slot, assign their sequential index first (1..N)
  stored.savedGuests.forEach((g, idx) => {
    if (g && (!g.slot || Number(g.slot) < 1)) {
      g.slot = idx + 1;
    }
  });

  // 2. Deduplicate colliding slot numbers in order so #1..#N each own a unique 1-to-1 QR slot
  const usedSlots = new Set();
  stored.savedGuests.forEach((g) => {
    if (!g) return;
    let sNum = Number(g.slot) || 1;
    if (usedSlots.has(sNum)) {
      let cand = 1;
      while (usedSlots.has(cand)) cand++;
      sNum = cand;
    }
    usedSlots.add(sNum);
    g.slot = sNum;
    g.slotCode = makeSlotCode(sNum);

    const prevSlot = stored.slots[g.slotCode] || {};
    stored.slots[g.slotCode] = {
      ...prevSlot,
      num: sNum,
      name: g.name || prevSlot.name || "",
      lang: g.lang || prevSlot.lang || (/[\u4e00-\u9fff]/.test(g.name || "") ? "zh" : "vi"),
      mode: g.mode || prevSlot.mode || "invite",
      group: g.group || prevSlot.group || "",
      table: g.table || prevSlot.table || "",
      pax: Math.max(1, parseInt(g.pax || prevSlot.pax || "1", 10) || 1),
      assignedAt: prevSlot.assignedAt || g.createdAt || new Date().toISOString()
    };
  });
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function defaultSeatingConfig() {
  return {
    totalTables: 38, // Sảnh Seine (Riverside Palace): 38 tables standard layout
    seatsPerTable: 10,
    showTableGuests: true,
    tableMeta: {}
  };
}

function defaultState(existingSavedGuests = [], existingSiteConfig = null, existingSeatingConfig = null) {
  return {
    totalViews: 0,
    openedEnvelopeTotal: 0,
    flippedBackTotal: 0,
    countries: {},
    visitors: {}, // key -> aggregated guest summary
    visitLogs: [], // unmerged array of every individual visit/device session
    savedGuests: Array.isArray(existingSavedGuests) ? existingSavedGuests : [],
    siteConfig:
      existingSiteConfig && typeof existingSiteConfig === "object"
        ? existingSiteConfig
        : {
            globalMode: "invite",
            globalThankYou: false,
            globalDirections: false,
            driveUrl: "",
            thankYouVI: "",
            thankYouZH: ""
          },
    seatingConfig:
      existingSeatingConfig && typeof existingSeatingConfig === "object"
        ? { ...defaultSeatingConfig(), ...existingSeatingConfig }
        : defaultSeatingConfig(),
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
    if (!stored || typeof stored !== "object") {
      return defaultState();
    }
    if (!Array.isArray(stored.visitLogs)) {
      stored.visitLogs = [];
      // Backfill visitLogs from existing visitors if upgrading from v1
      const existingVisitors = Object.values(stored.visitors || {});
      existingVisitors.forEach((v) => {
        stored.visitLogs.push({
          sid: "legacy_" + v.key,
          guestName: v.guestName,
          hasCustomName: Boolean(v.hasCustomName),
          lang: v.lang || "vi",
          mode: v.mode || "invite",
          country: v.country || "VN",
          city: v.city || "",
          deviceDetail: v.deviceDetail || v.device || "Thiết bị di động",
          openedEnvelope: Boolean(v.openedEnvelope),
          flippedBack: Boolean(v.flippedBack),
          openedAt: v.lastSeenAt || v.firstSeenAt || new Date().toISOString(),
          lastActionAt: v.lastSeenAt || new Date().toISOString()
        });
      });
    }
    if (!Array.isArray(stored.savedGuests)) {
      stored.savedGuests = [];
      // Automatically preserve any named guest already seen in visitors
      Object.values(stored.visitors || {}).forEach((v) => {
        if (v && v.hasCustomName && v.guestName) {
          const k = normalizeGuestKey(v.guestName);
          if (!stored.savedGuests.some((g) => normalizeGuestKey(g.name) === k)) {
            stored.savedGuests.push({
              name: v.guestName,
              lang: v.lang || "vi",
              mode: v.mode || "invite",
              driveUrl: "",
              createdAt: v.firstSeenAt || new Date().toISOString()
            });
          }
        }
      });
    }
    if (!stored.siteConfig || typeof stored.siteConfig !== "object") {
      stored.siteConfig = {
        globalMode: "invite",
        globalThankYou: false,
        globalDirections: false,
        driveUrl: "",
        thankYouVI: "",
        thankYouZH: ""
      };
    }
    if (!stored.slots || typeof stored.slots !== "object") {
      stored.slots = {};
    }
    if (!stored.seatingConfig || typeof stored.seatingConfig !== "object") {
      stored.seatingConfig = defaultSeatingConfig();
    } else {
      stored.seatingConfig = { ...defaultSeatingConfig(), ...stored.seatingConfig };
    }
    normalizeSlotsAndGuests(stored);
    return stored;
  }

  resolveGuestConfig(data, guestName = "", slotCode = "") {
    const cfg = data.siteConfig || {};
    const seatingCfg = data.seatingConfig || defaultSeatingConfig();
    const k = normalizeGuestKey(guestName);
    const rawSlotCode = String(slotCode || "").trim().toLowerCase();
    const slotNum = rawSlotCode ? slotNumFromCode(rawSlotCode) : 0;

    // 1. Match guest by slotCode/slotNum first (fixed URL ?s=5-7n19), or by current name, or by previous name (aliases)
    let saved = null;
    if (rawSlotCode && Array.isArray(data.savedGuests)) {
      saved = data.savedGuests.find(
        (g) => g && (g.slotCode === rawSlotCode || (slotNum > 0 && Number(g.slot) === slotNum))
      );
    }
    if (!saved && k && Array.isArray(data.savedGuests)) {
      saved =
        data.savedGuests.find((g) => g && normalizeGuestKey(g.name) === k) ||
        data.savedGuests.find(
          (g) =>
            g &&
            Array.isArray(g.aliases) &&
            g.aliases.some((alias) => normalizeGuestKey(alias) === k)
        ) ||
        null;
    }

    const cleanSlotCode = String(rawSlotCode || (saved && saved.slotCode) || "").trim().toLowerCase();
    const slotObj =
      cleanSlotCode && data.slots && data.slots[cleanSlotCode]
        ? data.slots[cleanSlotCode]
        : null;

    if (!saved && slotObj && slotObj.name && Array.isArray(data.savedGuests)) {
      const sk = normalizeGuestKey(slotObj.name);
      saved = data.savedGuests.find((g) => g && normalizeGuestKey(g.name) === sk) || null;
    }

    const resolvedName = String(
      (saved && saved.name) || (slotObj && slotObj.name) || guestName || ""
    ).trim();
    const resolvedLang =
      (saved && saved.lang) ||
      (slotObj && slotObj.lang) ||
      (/[\u4e00-\u9fff]/.test(resolvedName) ? "zh" : "vi");

    let effectiveMode = "invite";
    if (
      cfg.globalMode === "thankyou" ||
      cfg.globalThankYou ||
      (saved && saved.mode === "thankyou") ||
      (slotObj && slotObj.mode === "thankyou")
    ) {
      effectiveMode = "thankyou";
    } else if (
      cfg.globalMode === "directions" ||
      cfg.globalDirections ||
      (saved && saved.mode === "directions") ||
      (slotObj && slotObj.mode === "directions")
    ) {
      effectiveMode = "directions";
    }

    const driveUrl = (saved && saved.driveUrl) || cfg.driveUrl || "";
    const table = String((saved && saved.table) || (slotObj && slotObj.table) || "").trim();
    const tMeta = (table && seatingCfg.tableMeta && seatingCfg.tableMeta[table]) || {};
    const group =
      String((saved && saved.group) || (slotObj && slotObj.group) || tMeta.group || "").trim();
    const pax = Math.max(
      1,
      parseInt((saved && saved.pax) || (slotObj && slotObj.pax) || "1", 10) || 1
    );

    // Aggregate per-table occupancy & companions across savedGuests + unassigned slots
    const tableOccupancy = {};
    const seenKeys = new Set();
    const tableGuests = [];
    (data.savedGuests || []).forEach((g) => {
      if (!g || !g.table) return;
      const gk = normalizeGuestKey(g.name || "");
      if (gk) seenKeys.add(gk);
      const t = String(g.table).trim();
      const p = Math.max(1, parseInt(g.pax || "1", 10) || 1);
      tableOccupancy[t] = (tableOccupancy[t] || 0) + p;
      if (table && t === table && g.name) {
        tableGuests.push({ name: g.name, pax: p, slot: g.slot || null });
      }
    });
    Object.values(data.slots || {}).forEach((s) => {
      if (!s || !s.table) return;
      const sk = s.name ? normalizeGuestKey(s.name) : "";
      if (sk && seenKeys.has(sk)) return;
      const t = String(s.table).trim();
      const p = Math.max(1, parseInt(s.pax || "1", 10) || 1);
      tableOccupancy[t] = (tableOccupancy[t] || 0) + p;
      if (table && t === table) {
        tableGuests.push({
          name: s.name || `QR #${String(s.num || "").padStart(2, "0")}`,
          pax: p,
          slot: s.num || null
        });
      }
    });

    return {
      resolvedName,
      resolvedLang,
      slotCode: cleanSlotCode,
      mode: effectiveMode,
      thankYouMode: effectiveMode === "thankyou",
      directionsMode: effectiveMode === "directions",
      driveUrl,
      thankYouVI: cfg.thankYouVI || "",
      thankYouZH: cfg.thankYouZH || "",
      table,
      group,
      pax,
      tableLabel: tMeta.label || "",
      tableGuests: seatingCfg.showTableGuests !== false ? tableGuests : [],
      tableOccupancy,
      seatingConfig: {
        totalTables: seatingCfg.totalTables || 38,
        seatsPerTable: seatingCfg.seatsPerTable || 10,
        showTableGuests: seatingCfg.showTableGuests !== false,
        tableMeta: seatingCfg.tableMeta || {}
      }
    };
  }

  async saveData(data) {
    normalizeSlotsAndGuests(data);
    data.updatedAt = new Date().toISOString();
    await this.state.storage.put("analytics_v1", data);
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Reset analytics counters & logs (keeps savedGuests, siteConfig, seatingConfig & pre-printed QR slots intact)
    if (url.pathname === "/api/reset" && request.method === "POST") {
      const current = await this.loadData();
      const fresh = defaultState(
        current.savedGuests || [],
        current.siteConfig || null,
        current.seatingConfig || null
      );
      fresh.slots = current.slots || {};
      await this.saveData(fresh);
      return Response.json({ ok: true, stats: this.formatStats(fresh) }, { headers: CORS_HEADERS });
    }

    // Public lookup for a pre-printed numbered QR bookmark (?s=7-ab3x) -> assigned guest name, mode & table seat
    if (url.pathname === "/api/slot" && request.method === "GET") {
      const code = String(url.searchParams.get("code") || "").trim().toLowerCase();
      const valid = isValidSlotCode(code);
      const data = await this.loadData();
      const num = valid ? slotNumFromCode(code) : 0;
      const slot = valid ? (data.slots || {})[code] : null;
      const guestBySlot =
        valid && Array.isArray(data.savedGuests)
          ? data.savedGuests.find(
              (g) => g && (g.slotCode === code || (num > 0 && Number(g.slot) === num))
            )
          : null;
      const resolvedSlotName = String(
        (guestBySlot && guestBySlot.name) || (slot && slot.name) || ""
      ).trim();
      const resolvedSlotLang =
        (guestBySlot && guestBySlot.lang) ||
        (slot && slot.lang) ||
        (/[\u4e00-\u9fff]/.test(resolvedSlotName) ? "zh" : "vi");
      const cfg = data.siteConfig || {};
      const globalMode =
        cfg.globalMode === "thankyou" || cfg.globalThankYou
          ? "thankyou"
          : cfg.globalMode === "directions" || cfg.globalDirections
            ? "directions"
            : "";
      const seatInfo = valid
        ? this.resolveGuestConfig(data, resolvedSlotName, code)
        : null;
      return Response.json(
        {
          ok: true,
          slot: valid
            ? {
                num: slot ? slot.num : num,
                name: resolvedSlotName,
                lang: resolvedSlotLang,
                mode:
                  globalMode ||
                  (guestBySlot && guestBySlot.mode) ||
                  (slot && slot.mode) ||
                  "invite",
                group: (seatInfo && seatInfo.group) || "",
                table: (seatInfo && seatInfo.table) || "",
                pax: (seatInfo && seatInfo.pax) || 1
              }
            : null,
          config: seatInfo
        },
        {
          headers: {
            ...CORS_HEADERS,
            "Cache-Control": "no-store, no-cache, must-revalidate"
          }
        }
      );
    }

    // Assign / clear / switch mode / assign table seat of a pre-printed numbered QR bookmark
    if (url.pathname === "/api/slots" && request.method === "POST") {
      let body = {};
      try {
        body = await request.json();
      } catch (_) {}
      const code = String(body.code || "").trim().toLowerCase();
      if (!isValidSlotCode(code)) {
        return Response.json(
          { ok: false, error: "Invalid slot code" },
          { status: 400, headers: CORS_HEADERS }
        );
      }
      const num = slotNumFromCode(code);
      const data = await this.loadData();
      const prev = data.slots[code] || null;
      const name = String(body.name !== undefined ? body.name : (prev && prev.name) || "")
        .trim()
        .slice(0, 120);
      const action = String(body.action || "assign");
      const validModes = ["invite", "directions", "thankyou"];
      const requestedMode = validModes.includes(body.mode)
        ? body.mode
        : (prev && prev.mode) || "invite";
      const requestedGroup =
        body.group !== undefined ? String(body.group || "").trim() : (prev && prev.group) || "";
      const requestedTable =
        body.table !== undefined ? String(body.table || "").trim() : (prev && prev.table) || "";
      const requestedPax = Math.max(
        1,
        Math.min(
          20,
          parseInt(body.pax !== undefined ? body.pax : (prev && prev.pax) || "1", 10) || 1
        )
      );

      // Drop the slot link from the previously assigned guest record
      const detachPrevGuest = () => {
        if (!prev || !prev.name) return;
        const pk = normalizeGuestKey(prev.name);
        data.savedGuests.forEach((g) => {
          if (normalizeGuestKey(g.name) === pk && g.slotCode === code) {
            delete g.slot;
            delete g.slotCode;
          }
        });
      };

      if (action === "set_mode" || action === "set_seat") {
        data.slots[code] = {
          num,
          name: (prev && prev.name) || "",
          lang: (prev && prev.lang) || "vi",
          mode: requestedMode,
          group: requestedGroup,
          table: requestedTable,
          pax: requestedPax,
          assignedAt: (prev && prev.assignedAt) || new Date().toISOString()
        };
        if (prev && prev.name) {
          const pk = normalizeGuestKey(prev.name);
          const idx = data.savedGuests.findIndex((g) => normalizeGuestKey(g.name) === pk);
          if (idx >= 0) {
            data.savedGuests[idx].mode = requestedMode;
            data.savedGuests[idx].group = requestedGroup;
            data.savedGuests[idx].table = requestedTable;
            data.savedGuests[idx].pax = requestedPax;
          } else {
            data.savedGuests.push({
              name: prev.name,
              lang: prev.lang || "vi",
              mode: requestedMode,
              group: requestedGroup,
              table: requestedTable,
              pax: requestedPax,
              slot: num,
              slotCode: code,
              driveUrl: "",
              createdAt: new Date().toISOString()
            });
          }
        }
      } else if (action === "clear" || !name) {
        detachPrevGuest();
        if (
          prev &&
          ((prev.mode && prev.mode !== "invite") || prev.group || prev.table)
        ) {
          data.slots[code] = {
            num,
            name: "",
            lang: "vi",
            mode: prev.mode || "invite",
            group: prev.group || "",
            table: prev.table || "",
            pax: prev.pax || 1,
            assignedAt: prev.assignedAt || new Date().toISOString()
          };
        } else {
          delete data.slots[code];
        }
      } else {
        if (prev && prev.name && normalizeGuestKey(prev.name) !== normalizeGuestKey(name)) {
          detachPrevGuest();
        }
        const lang = body.lang === "zh" || /[\u4e00-\u9fff]/.test(name) ? "zh" : "vi";
        const note = String(body.note || "").trim().slice(0, 200);
        data.slots[code] = {
          num,
          name,
          lang,
          mode: requestedMode,
          group: requestedGroup,
          table: requestedTable,
          pax: requestedPax,
          assignedAt: new Date().toISOString()
        };
        // Upsert into the permanent guest list so tracking / mode switches / notes / seating work as usual
        const k = normalizeGuestKey(name);
        const idx = data.savedGuests.findIndex((g) => normalizeGuestKey(g.name) === k);
        if (idx >= 0) {
          const g = data.savedGuests[idx];
          g.slot = num;
          g.slotCode = code;
          g.lang = lang;
          if (validModes.includes(body.mode)) g.mode = body.mode;
          if (body.group !== undefined || requestedGroup) g.group = requestedGroup;
          if (body.table !== undefined || requestedTable) g.table = requestedTable;
          if (body.pax !== undefined || requestedPax) g.pax = requestedPax;
          if (note) g.note = note;
        } else {
          data.savedGuests.push({
            name,
            lang,
            mode: requestedMode,
            driveUrl: "",
            note,
            group: requestedGroup,
            table: requestedTable,
            pax: requestedPax,
            slot: num,
            slotCode: code,
            createdAt: new Date().toISOString()
          });
        }
      }

      await this.saveData(data);
      return Response.json(
        { ok: true, slots: data.slots, savedGuests: data.savedGuests, stats: this.formatStats(data) },
        { headers: CORS_HEADERS }
      );
    }

    // Update Sảnh Seine Seating Map Config (totalTables, seatsPerTable, showTableGuests, tableMeta, bulk assign)
    if (url.pathname === "/api/seating" && request.method === "POST") {
      let body = {};
      try {
        body = await request.json();
      } catch (_) {}
      const data = await this.loadData();
      const prevCfg = data.seatingConfig || defaultSeatingConfig();
      if (body.totalTables !== undefined) {
        prevCfg.totalTables = Math.max(4, Math.min(60, parseInt(body.totalTables, 10) || 38));
      }
      if (body.seatsPerTable !== undefined) {
        prevCfg.seatsPerTable = Math.max(4, Math.min(20, parseInt(body.seatsPerTable, 10) || 10));
      }
      if (body.showTableGuests !== undefined) {
        prevCfg.showTableGuests = Boolean(body.showTableGuests);
      }
      if (body.tableMeta && typeof body.tableMeta === "object") {
        prevCfg.tableMeta = { ...(prevCfg.tableMeta || {}), ...body.tableMeta };
      }
      if (body.groups && typeof body.groups === "object") {
        prevCfg.groups = { ...(prevCfg.groups || {}), ...body.groups };
      }
      data.seatingConfig = prevCfg;

      // Support atomic bulk group / table / mode assignment for multiple guests & numbered QR slots
      if (body.action === "bulk_assign") {
        const nextGroup = body.group !== undefined ? String(body.group || "").trim() : undefined;
        const nextTable = body.table !== undefined ? String(body.table || "").trim() : undefined;
        const nextPax =
          body.pax !== undefined
            ? Math.max(1, Math.min(20, parseInt(body.pax || "1", 10) || 1))
            : undefined;
        const validModes = ["invite", "directions", "thankyou"];
        const nextMode = validModes.includes(body.mode) ? body.mode : undefined;

        if (Array.isArray(body.guestNames)) {
          const targetKeys = new Set(body.guestNames.map((n) => normalizeGuestKey(n)).filter(Boolean));
          data.savedGuests.forEach((g) => {
            if (!g || !targetKeys.has(normalizeGuestKey(g.name))) return;
            if (nextGroup !== undefined) g.group = nextGroup;
            if (nextTable !== undefined) g.table = nextTable;
            if (nextPax !== undefined) g.pax = nextPax;
            if (nextMode !== undefined) g.mode = nextMode;
            if (g.slotCode && data.slots && data.slots[g.slotCode]) {
              if (nextGroup !== undefined) data.slots[g.slotCode].group = nextGroup;
              if (nextTable !== undefined) data.slots[g.slotCode].table = nextTable;
              if (nextPax !== undefined) data.slots[g.slotCode].pax = nextPax;
              if (nextMode !== undefined) data.slots[g.slotCode].mode = nextMode;
            }
          });
        }

        if (Array.isArray(body.slotItems)) {
          if (!data.slots) data.slots = {};
          body.slotItems.forEach((item) => {
            const code = String((item && item.code) || "").trim().toLowerCase();
            const num = parseInt((item && item.num) || code.split("-")[0], 10) || 0;
            if (!code || num < 1) return;
            const prev = data.slots[code] || {
              num,
              name: "",
              lang: "vi",
              mode: "invite",
              group: "",
              table: "",
              pax: 1,
              assignedAt: new Date().toISOString()
            };
            if (nextGroup !== undefined) prev.group = nextGroup;
            if (nextTable !== undefined) prev.table = nextTable;
            if (nextPax !== undefined) prev.pax = nextPax;
            if (nextMode !== undefined) prev.mode = nextMode;
            data.slots[code] = prev;

            if (prev.name) {
              const gk = normalizeGuestKey(prev.name);
              const g = data.savedGuests.find((x) => normalizeGuestKey(x.name) === gk);
              if (g) {
                if (nextGroup !== undefined) g.group = nextGroup;
                if (nextTable !== undefined) g.table = nextTable;
                if (nextPax !== undefined) g.pax = nextPax;
                if (nextMode !== undefined) g.mode = nextMode;
              }
            }
          });
        }
      }

      await this.saveData(data);
      return Response.json(
        {
          ok: true,
          seatingConfig: data.seatingConfig,
          savedGuests: data.savedGuests,
          slots: data.slots,
          stats: this.formatStats(data)
        },
        { headers: CORS_HEADERS }
      );
    }

    // Update global Mode (Invite / Wedding-Day Directions / Thank-You) & Google Drive settings for already-sent links
    if (url.pathname === "/api/config" && request.method === "POST") {
      let body = {};
      try {
        body = await request.json();
      } catch (_) {}
      const data = await this.loadData();
      const requestedMode =
        body.globalMode === "thankyou" || body.globalMode === "directions" || body.globalMode === "invite"
          ? body.globalMode
          : body.globalThankYou
            ? "thankyou"
            : body.globalDirections
              ? "directions"
              : "invite";
      data.siteConfig = {
        globalMode: requestedMode,
        globalThankYou: requestedMode === "thankyou",
        globalDirections: requestedMode === "directions",
        driveUrl: String(body.driveUrl ?? data.siteConfig.driveUrl ?? "").trim(),
        thankYouVI: String(body.thankYouVI ?? data.siteConfig.thankYouVI ?? "").trim(),
        thankYouZH: String(body.thankYouZH ?? data.siteConfig.thankYouZH ?? "").trim()
      };
      await this.saveData(data);
      return Response.json(
        { ok: true, siteConfig: data.siteConfig, stats: this.formatStats(data) },
        { headers: CORS_HEADERS }
      );
    }

    // Lightweight endpoint for any already-sent guest link (?to=...) to check if Thank-You or Directions mode or Table Seat was enabled
    if (url.pathname === "/api/guest-config") {
      const guest = url.searchParams.get("guest") || "";
      const slot = url.searchParams.get("slot") || "";
      const data = await this.loadData();
      return Response.json(
        { ok: true, config: this.resolveGuestConfig(data, guest, slot) },
        {
          headers: {
            ...CORS_HEADERS,
            "Cache-Control": "no-store, no-cache, must-revalidate"
          }
        }
      );
    }

    // Manage permanent saved guest list on server
    if (url.pathname === "/api/guests" && request.method === "POST") {
      let body = {};
      try {
        body = await request.json();
      } catch (_) {}

      const data = await this.loadData();
      const action = String(body.action || "add");
      const validModes = ["invite", "directions", "thankyou"];

      if (action === "add" && Array.isArray(body.guests)) {
        body.guests.forEach((item) => {
          const name = String(item && item.name ? item.name : "").trim();
          if (!name) return;
          const k = normalizeGuestKey(name);
          const existingIdx = data.savedGuests.findIndex(
            (g) => normalizeGuestKey(g.name) === k
          );
          const existing = existingIdx >= 0 ? data.savedGuests[existingIdx] : null;
          const resolvedSlot = Number(item.slot || (existing && existing.slot) || 0);
          const resolvedSlotCode = String(
            item.slotCode ||
              (existing && existing.slotCode) ||
              (resolvedSlot > 0 ? makeSlotCode(resolvedSlot) : "")
          )
            .trim()
            .toLowerCase();
          const mergedAliases = Array.from(
            new Set([
              ...(existing && Array.isArray(existing.aliases) ? existing.aliases : []),
              ...(Array.isArray(item.aliases) ? item.aliases : [])
            ])
          ).filter(Boolean);
          const record = {
            name,
            lang: item.lang === "zh" || /[\u4e00-\u9fff]/.test(name) ? "zh" : "vi",
            mode: validModes.includes(item.mode) ? item.mode : existing?.mode || "invite",
            driveUrl: String(item.driveUrl ?? existing?.driveUrl ?? "").trim(),
            note: String(item.note !== undefined ? item.note : existing?.note || "").trim(),
            group: String(item.group !== undefined ? item.group : existing?.group || "").trim(),
            table: String(item.table !== undefined ? item.table : existing?.table || "").trim(),
            pax: Math.max(
              1,
              Math.min(20, parseInt(item.pax !== undefined ? item.pax : existing?.pax || "1", 10) || 1)
            ),
            ...(resolvedSlot > 0 ? { slot: resolvedSlot, slotCode: resolvedSlotCode } : {}),
            ...(mergedAliases.length ? { aliases: mergedAliases } : {}),
            createdAt:
              existing && existing.createdAt
                ? existing.createdAt
                : new Date().toISOString()
          };
          if (existingIdx >= 0) {
            data.savedGuests[existingIdx] = record;
          } else {
            data.savedGuests.push(record);
          }
        });
      } else if (action === "rename") {
        const oldName = String(body.oldName || "").trim();
        const newName = String(body.newName || "").trim().slice(0, 120);
        const oldKey = normalizeGuestKey(oldName);
        const newKey = normalizeGuestKey(newName);
        const slotNum = parseInt(body.slot, 10) || 0;
        const slotCode = String(body.slotCode || (slotNum > 0 ? makeSlotCode(slotNum) : ""))
          .trim()
          .toLowerCase();

        if (newName) {
          let idx = -1;
          if (slotCode) {
            idx = data.savedGuests.findIndex(
              (g) => g && (g.slotCode === slotCode || (slotNum > 0 && Number(g.slot) === slotNum))
            );
          }
          if (idx < 0 && oldKey) {
            idx = data.savedGuests.findIndex((g) => g && normalizeGuestKey(g.name) === oldKey);
          }
          const newLang = body.lang === "zh" || /[\u4e00-\u9fff]/.test(newName) ? "zh" : "vi";
          if (idx >= 0) {
            const g = data.savedGuests[idx];
            const prevName = String(g.name || oldName || "").trim();
            const aliases = Array.isArray(g.aliases) ? [...g.aliases] : [];
            if (prevName && normalizeGuestKey(prevName) !== newKey) {
              aliases.push(prevName);
            }
            if (oldName && normalizeGuestKey(oldName) !== newKey) {
              aliases.push(oldName);
            }
            g.name = newName;
            g.lang = newLang;
            if (slotNum > 0) g.slot = slotNum;
            if (slotCode) g.slotCode = slotCode;
            if (body.note !== undefined) g.note = String(body.note || "").trim();
            g.aliases = Array.from(new Set(aliases));
          } else {
            data.savedGuests.push({
              name: newName,
              lang: newLang,
              mode: "invite",
              driveUrl: "",
              note: String(body.note || "").trim(),
              group: "",
              table: "",
              pax: 1,
              ...(slotNum > 0 ? { slot: slotNum, slotCode } : {}),
              ...(oldName && oldKey !== newKey ? { aliases: [oldName] } : {}),
              createdAt: new Date().toISOString()
            });
          }

          if (slotCode && data.slots) {
            const prevSlot = data.slots[slotCode] || {};
            const matchedG =
              data.savedGuests.find((g) => g && g.slotCode === slotCode) || {};
            data.slots[slotCode] = {
              ...prevSlot,
              num: slotNum || prevSlot.num || slotNumFromCode(slotCode),
              name: newName,
              lang: newLang,
              mode: matchedG.mode || prevSlot.mode || "invite",
              group: matchedG.group || prevSlot.group || "",
              table: matchedG.table || prevSlot.table || "",
              pax: matchedG.pax || prevSlot.pax || 1,
              assignedAt: prevSlot.assignedAt || new Date().toISOString()
            };
          }

          // Migrate existing visitLogs & visitors from oldName / unassigned slot to newName so history stays intact
          const unassignedSlotKey =
            slotNum > 0 ? normalizeGuestKey(`QR số ${slotNum} (chưa gán tên)`) : "";
          if (Array.isArray(data.visitLogs)) {
            data.visitLogs.forEach((log) => {
              if (!log || !log.guestName) return;
              const lk = normalizeGuestKey(log.guestName);
              if ((oldKey && lk === oldKey) || (unassignedSlotKey && lk === unassignedSlotKey)) {
                log.guestName = newName;
                log.hasCustomName = true;
              }
            });
          }
          if (data.visitors && typeof data.visitors === "object") {
            Object.values(data.visitors).forEach((v) => {
              if (!v || !v.guestName) return;
              const vk = normalizeGuestKey(v.guestName);
              if ((oldKey && vk === oldKey) || (unassignedSlotKey && vk === unassignedSlotKey)) {
                v.guestName = newName;
                v.hasCustomName = true;
              }
            });
          }
        }
      } else if (action === "update_note") {
        const targetKey = normalizeGuestKey(body.name || "");
        if (targetKey) {
          const idx = data.savedGuests.findIndex(
            (g) => normalizeGuestKey(g.name) === targetKey
          );
          if (idx >= 0) {
            data.savedGuests[idx].note = String(body.note || "").trim();
          }
        }
      } else if (action === "update_seat") {
        const targetKey = normalizeGuestKey(body.name || "");
        if (targetKey) {
          const idx = data.savedGuests.findIndex(
            (g) => normalizeGuestKey(g.name) === targetKey
          );
          const cleanGroup = body.group !== undefined ? String(body.group || "").trim() : "";
          const cleanTable = body.table !== undefined ? String(body.table || "").trim() : "";
          const cleanPax = body.pax !== undefined ? Math.max(1, Math.min(20, parseInt(body.pax, 10) || 1)) : 1;

          if (idx >= 0) {
            const g = data.savedGuests[idx];
            if (body.group !== undefined) g.group = cleanGroup;
            if (body.table !== undefined) g.table = cleanTable;
            if (body.pax !== undefined) g.pax = cleanPax;
            const sc = g.slotCode;
            if (sc && data.slots && data.slots[sc]) {
              data.slots[sc].group = g.group || "";
              data.slots[sc].table = g.table || "";
              data.slots[sc].pax = g.pax || 1;
            }
          } else {
            data.savedGuests.push({
              name: String(body.name || "").trim(),
              lang: /[\u4e00-\u9fff]/.test(body.name) ? "zh" : "vi",
              mode: "invite",
              group: cleanGroup,
              table: cleanTable,
              pax: cleanPax,
              driveUrl: "",
              createdAt: new Date().toISOString()
            });
          }

          // Also check if any slot has this name and update it
          if (data.slots) {
            Object.values(data.slots).forEach((s) => {
              if (s && s.name && normalizeGuestKey(s.name) === targetKey) {
                if (body.group !== undefined) s.group = cleanGroup;
                if (body.table !== undefined) s.table = cleanTable;
                if (body.pax !== undefined) s.pax = cleanPax;
              }
            });
          }
        }
      } else if (action === "toggle_mode") {
        const targetKey = normalizeGuestKey(body.name || "");
        if (targetKey) {
          const idx = data.savedGuests.findIndex(
            (g) => normalizeGuestKey(g.name) === targetKey
          );
          if (idx >= 0) {
            const nextMode = validModes.includes(body.mode)
              ? body.mode
              : data.savedGuests[idx].mode === "thankyou"
                ? "invite"
                : "thankyou";
            data.savedGuests[idx].mode = nextMode;
            if (body.driveUrl !== undefined) {
              data.savedGuests[idx].driveUrl = String(body.driveUrl || "").trim();
            }
            const sc = data.savedGuests[idx].slotCode;
            if (sc && data.slots && data.slots[sc]) {
              data.slots[sc].mode = nextMode;
            }
          }
        }
      } else if (action === "remove") {
        const targetKey = normalizeGuestKey(body.name || "");
        if (targetKey) {
          data.savedGuests = data.savedGuests.filter(
            (g) => normalizeGuestKey(g.name) !== targetKey
          );
        }
      } else if (action === "clear") {
        data.savedGuests = [];
      }

      await this.saveData(data);
      return Response.json(
        { ok: true, savedGuests: data.savedGuests, stats: this.formatStats(data) },
        { headers: CORS_HEADERS }
      );
    }

    // Track guest open & envelope interaction (unmerged per session + aggregated per guest)
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
      const slotCode = String(body.slot || "").trim().toLowerCase();
      const guestName =
        rawGuest ||
        (isValidSlotCode(slotCode)
          ? `QR số ${slotNumFromCode(slotCode)} (chưa gán tên)`
          : "Khách mở link chung (không kèm tên)");
      const vid = String(body.vid || "anon").slice(0, 64);
      const sid = String(body.sid || `${vid}_${Date.now()}`).slice(0, 80);
      const screen = String(body.screen || "").slice(0, 24);
      const lang = body.lang === "zh" ? "zh" : "vi";
      const mode = body.mode === "thankyou" ? "thankyou" : "invite";
      const country = String(body.country || "VN").toUpperCase();
      const city = String(body.city || "").trim();
      const deviceDetail = parseDetailedDevice(ua, screen);
      const now = new Date().toISOString();

      const data = await this.loadData();

      // Match guest by slotCode, current name, or previous alias (if renamed from an old ?to=... link)
      let matchedGuest = null;
      const slotNum = isValidSlotCode(slotCode) ? slotNumFromCode(slotCode) : 0;
      if (slotCode && Array.isArray(data.savedGuests)) {
        matchedGuest = data.savedGuests.find(
          (g) => g && (g.slotCode === slotCode || (slotNum > 0 && Number(g.slot) === slotNum))
        );
      }
      if (!matchedGuest && rawGuest && Array.isArray(data.savedGuests)) {
        const gk = normalizeGuestKey(rawGuest);
        matchedGuest =
          data.savedGuests.find((g) => g && normalizeGuestKey(g.name) === gk) ||
          data.savedGuests.find(
            (g) =>
              g &&
              Array.isArray(g.aliases) &&
              g.aliases.some((alias) => normalizeGuestKey(alias) === gk)
          ) ||
          null;
      }

      // Auto-register named guest in savedGuests only if not already saved under current name or alias
      if (rawGuest && !matchedGuest) {
        const gk = normalizeGuestKey(rawGuest);
        if (!data.savedGuests.some((g) => normalizeGuestKey(g.name) === gk)) {
          data.savedGuests.push({
            name: rawGuest,
            lang,
            mode,
            driveUrl: "",
            createdAt: now
          });
        }
      }

      const effectiveGuestName = (matchedGuest && matchedGuest.name) || guestName;
      const effectiveHasCustomName = Boolean(matchedGuest || rawGuest);

      // 1. Update Individual Unmerged Session Log (data.visitLogs)
      let sessionEntry = data.visitLogs.find((item) => item.sid === sid);
      if (!sessionEntry) {
        sessionEntry = {
          sid,
          vid,
          guestName: effectiveGuestName,
          hasCustomName: effectiveHasCustomName,
          lang,
          mode,
          country,
          city,
          deviceDetail,
          openedEnvelope: false,
          flippedBack: false,
          openedAt: now,
          lastActionAt: now
        };
        data.visitLogs.unshift(sessionEntry);
        if (eventType !== "view") {
          // In case open_envelope arrived without prior view event
          data.totalViews = (data.totalViews || 0) + 1;
          data.countries[country] = (data.countries[country] || 0) + 1;
        }
      }

      sessionEntry.guestName = effectiveGuestName;
      sessionEntry.lang = lang;
      sessionEntry.mode = mode;
      if (country) sessionEntry.country = country;
      if (city) sessionEntry.city = city;
      if (deviceDetail) sessionEntry.deviceDetail = deviceDetail;
      sessionEntry.lastActionAt = now;

      if (eventType === "view") {
        data.totalViews = (data.totalViews || 0) + 1;
        data.countries[country] = (data.countries[country] || 0) + 1;
      } else if (eventType === "open_envelope") {
        sessionEntry.openedEnvelope = true;
      } else if (eventType === "flip_back") {
        sessionEntry.flippedBack = true;
      }

      // Keep latest 500 detailed session logs
      if (data.visitLogs.length > 500) {
        data.visitLogs = data.visitLogs.slice(0, 500);
      }

      // 2. Also maintain per-guest summary for unique guest KPI & quick lookup
      const key = effectiveHasCustomName
        ? "guest:" + normalizeGuestKey(effectiveGuestName)
        : "anon:" + vid;
      let rec = data.visitors[key];
      if (!rec) {
        rec = {
          key,
          guestName: effectiveGuestName,
          hasCustomName: effectiveHasCustomName,
          vid,
          lang,
          mode,
          country,
          city,
          device: deviceDetail,
          views: 0,
          openedEnvelope: false,
          flippedBack: false,
          firstSeenAt: now,
          lastSeenAt: now
        };
        data.visitors[key] = rec;
      }

      rec.guestName = effectiveGuestName;
      rec.lang = lang;
      rec.mode = mode;
      if (country) rec.country = country;
      if (city) rec.city = city;
      if (deviceDetail) rec.device = deviceDetail;
      rec.lastSeenAt = now;

      if (eventType === "view") {
        rec.views = (rec.views || 0) + 1;
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
    const visitorsList = Object.values(data.visitors || {}).sort((a, b) =>
      String(b.lastSeenAt || "").localeCompare(String(a.lastSeenAt || ""))
    );
    const visitLogs = Array.isArray(data.visitLogs) ? data.visitLogs : [];
    const uniqueVisitors = visitorsList.length;
    const openedEnvelopeCount = visitLogs.filter((r) => r.openedEnvelope).length;
    const flippedBackCount = visitLogs.filter((r) => r.flippedBack).length;

    return {
      totalViews: data.totalViews || visitLogs.length || 0,
      uniqueVisitors,
      openedEnvelopeCount,
      flippedBackCount,
      countries: data.countries || {},
      visitLogs: visitLogs.slice(0, 300),
      guests: visitorsList.slice(0, 200),
      savedGuests: Array.isArray(data.savedGuests) ? data.savedGuests : [],
      slots: data.slots && typeof data.slots === "object" ? data.slots : {},
      siteConfig: data.siteConfig || {
        globalThankYou: false,
        driveUrl: "",
        thankYouVI: "",
        thankYouZH: ""
      },
      seatingConfig: data.seatingConfig || defaultSeatingConfig(),
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
