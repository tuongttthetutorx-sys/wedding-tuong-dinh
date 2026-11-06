/* ==========================================================================
   MAIN INTERACTIVE CONTROLLER — THIỆP CƯỚI THUẬN TƯỜNG & TIỂU DINH
   ========================================================================== */
(function () {
  const CFG = window.WEDDING_CONFIG || {};
  const SVGS = window.WEDDING_SVGS || {};
  const STORAGE_KEY_WISHES = "tuong_dinh_wedding_wishes_v1";

  /* Complete VI / 台灣道地繁體中文 (zh-TW) Bilingual UI Dictionary */
  const I18N = {
    vi: {
      docTitle: "Thiệp Cưới Thuận Tường & Tiểu Dinh • 06.01.2027",
      musicAria: "Bật / Tắt nhạc nền cưới",
      envAria: "Chạm hoặc vuốt để lật và mở phong bì thiệp cưới",
      mapTitle: "Bản đồ Riverside Palace - 360D Bến Vân Đồn",
      envEyebrow: "Thiệp Mời Hôn Lễ • 06.01.2027",
      btnOpenEnv: "✨ Chạm Mở Thiệp Mời",
      btnFlipFront: "↺ Lật xem mặt sau vỏ thiệp",
      btnFlipBack: "↺ Lật lại mặt trước vỏ thiệp",
      envCreditHint: "Thiết kế thủ công bởi Cô dâu Tiểu Dinh & Chú rể Thuận Tường",
      navEnv: "Phong bì",
      navCardsMobile: "Thiệp mời",
      navCard1: "Thiệp mời tiệc",
      navCard2: "Lễ thành hôn",
      navCard3: "喜帖 (Hoa)",
      navVenue: "Bản đồ",
      heroTag: "06 • 01 • 2027",
      heroTitle: "Thuận Tường & Tiểu Dinh",
      capCard1: "Thiệp Mời Tiệc Chung Vui",
      capCard2: "Lễ Thành Hôn",
      capCard3: "Hỷ Thiếp Truyền Thống (傳統喜帖)",
      defaultGuest: "Quý Khách",
      cdEyebrow: "Đếm Ngược Ngày Chung Đôi",
      cdTitle: "Hẹn Gặp Quý Khách Tại Buổi Tiệc",
      cdSub: "18:00 • Thứ Tư, ngày 06 tháng 01 năm 2027 (Nhằm ngày 29 tháng 11 năm Bính Ngọ)",
      cdVenueLine: "Riverside Palace — Sảnh Seine • 360D Bến Vân Đồn, TP. Hồ Chí Minh",
      cdDays: "Ngày",
      cdHours: "Giờ",
      cdMins: "Phút",
      cdSecs: "Giây",
      calMonthTitle: "THÁNG 01 • 2027",
      calFooterNote: "Thứ Tư • 06.01.2027 • 18:00",
      venueEyebrow: "Thời Gian & Địa Điểm",
      venueTitle: "Lịch Trình Hôn Lễ & Chỉ Đường",
      venueSub: "Sự hiện diện của Quý Khách là niềm vinh hạnh lớn lao cho gia đình chúng tôi.",
      dayBadge: "Trọn Ngày Hỷ Sự",
      dayMainDate: "Thứ Tư • 06.01.2027",
      dayLunarDate: "Nhằm ngày 29 tháng 11 năm Bính Ngọ",
      tl1Period: "Buổi sáng • 06:00",
      tl1Title: "Lễ Thành Hôn Tại Tư Gia",
      tl1Desc: "Nhà Trai (P. Phú Định) & Nhà Gái (P. Hoà Bình), TP. Hồ Chí Minh.",
      tl2Period: "Buổi tối cùng ngày • Đón khách 18:00 · Khai tiệc 19:00",
      tl2Title: "Tiệc Cưới — Riverside Palace (Sảnh Seine)",
      tl2Desc: "360D Bến Vân Đồn, Phường Vĩnh Hội, TP. Hồ Chí Minh.",
      dpbTag: "CHẾ ĐỘ CHỈ ĐƯỜNG NGÀY CƯỚI • 06.01.2027",
      dpbTitle: "Chào mừng Quý Khách đến chung vui cùng Thuận Tường & Tiểu Dinh!",
      dpbDesc:
        "Sơ đồ đường đi, hướng dẫn gửi xe và vị trí Sảnh Seine (Riverside Palace — 360D Bến Vân Đồn) đã được đưa lên đầu trang để thuận tiện di chuyển.",
      btnOpenGmapsNav: "🧭 Mở Google Maps dẫn đường ngay",
      btnJumpToCards: "💌 Xem 3 tấm thiệp mời bên dưới ↓",
      btnStartRoute: "🧭 Chỉ đường Google Maps",
      btnCopyAddr: "📋 Copy địa chỉ",
      copiedAddr: "✅ Đã copy địa chỉ nhà hàng Riverside Palace (360D Bến Vân Đồn)!",
      imapBadge: "SƠ ĐỒ VẼ CHI TIẾT • WEDDING ROUTE MAP",
      imapTitle: "Sơ Đồ Đường Đi Đến Riverside Palace (Sảnh Seine)",
      imapSub:
        "Nằm ngay mặt tiền 360D Bến Vân Đồn (đoạn giữa Cầu Nguyễn Văn Cừ và Cầu Ông Lãnh, dọc bờ Kênh Tàu Hủ). Chạm vào sơ đồ để phóng to.",
      btnZoomImap: "🔍 Phóng to sơ đồ",
      rg1Title: "Hướng từ Quận 1, Quận 3, Phú Nhuận",
      rg1Body:
        "Đi đường Nguyễn Thái Học qua Cầu Ông Lãnh → vừa xuống chân cầu rẽ phải ngay vào đường Bến Vân Đồn → đi thẳng dọc bờ kênh khoảng 900m là tới Riverside Palace (360D Bến Vân Đồn) bên tay trái.",
      rg2Title: "Hướng từ Quận 5, Quận 10, Quận 8",
      rg2Body:
        "Qua Cầu Nguyễn Văn Cừ hướng về Quận 4 → xuống nhánh cầu rẽ vào đường Bến Vân Đồn → đi thẳng dọc bờ kênh khoảng 400m là thấy tòa nhà trắng Riverside Palace (360D Bến Vân Đồn) ngay bên tay phải.",
      rg3Title: "Hướng từ Quận 7, Nhà Bè, Thủ Đức",
      rg3Body:
        "Qua Cầu Kênh Tẻ đi thẳng hết đường Khánh Hội → gặp bờ sông rẽ trái vào Bến Vân Đồn → đi thẳng qua giao lộ Nguyễn Khoái khoảng 250m là tới Riverside Palace.",
      rg4Title: "Hướng dẫn Gửi xe & Vào Sảnh Seine",
      rg4Body:
        "🚗 Gửi xe & Taxi/Grab: Cổng giữ xe máy & ô tô nằm ngay mặt tiền 360D Bến Vân Đồn (Taxi/Grab chạy thẳng vào sảnh đón có mái che). 🏛️ Sảnh tiệc: Tiến vào sảnh chính tầng trệt theo bảng đón khách Thuận Tường & Tiểu Dinh — Sảnh Seine (Đón khách 18:00 · Khai tiệc 19:00).",
      scrollCue: "Vuốt xuống xem tiếp thiệp",
      footerCredit: "Personally designed by the Bride & Groom — Tiểu Dinh & Thuận Tường",
      footerToolLink: "🔗 Công cụ tạo link tên Khách Mời (dành cho Cô dâu & Chú rể)"
    },
    zh: {
      docTitle: "囍 趙順祥 & 盧小瑩 婚禮喜帖 • 2027.01.06",
      musicAria: "開啟 / 關閉背景音樂",
      envAria: "輕觸或滑動以翻轉並開啟喜帖",
      mapTitle: "Riverside Palace 婚宴地圖 — 胡志明市",
      envEyebrow: "謹訂良辰 • 喜帖敬邀 • 2027.01.06",
      btnOpenEnv: "✨ 輕觸開啟喜帖",
      btnFlipFront: "↺ 翻看信封背面",
      btnFlipBack: "↺ 返回信封正面",
      envCreditHint: "新娘盧小瑩 & 新郎趙順祥 親手設計製作",
      navEnv: "喜帖信封",
      navCardsMobile: "喜帖",
      navCard3: "中文喜帖",
      navCard1: "晚宴邀卡",
      navCard2: "成婚誌喜",
      navVenue: "婚宴地圖",
      heroTag: "二〇二七年 • 一月六日",
      heroTitle: "趙順祥 & 盧小瑩",
      capCard3: "傳統中文喜帖｜囍 永結同心",
      capCard1: "晚宴邀請卡｜Riverside Palace",
      capCard2: "成婚誌喜",
      defaultGuest: "摯愛親友",
      cdEyebrow: "良辰吉日 • 婚宴倒數",
      cdTitle: "誠摯邀請您 蒞臨見證我們的幸福",
      cdSub: "國曆 2027 年 1 月 6 日（星期三）18:00 迎賓・19:00 開席（農曆丙午年十一月二十九日）",
      cdVenueLine: "RIVERSIDE PALACE — Seine 宴會廳 • 胡志明市永會坊檳雲屯街 360D 號",
      cdDays: "天",
      cdHours: "時",
      cdMins: "分",
      cdSecs: "秒",
      calMonthTitle: "二〇二七年 • 一月",
      calFooterNote: "星期三 • 2027.01.06 • 18:00 迎賓",
      venueEyebrow: "婚禮流程與婚宴地點",
      venueTitle: "RIVERSIDE PALACE • Seine 宴會廳",
      venueSub: "地址：胡志明市永會坊檳雲屯街 360D 號（360D Bến Vân Đồn, P. Vĩnh Hội, TP. Hồ Chí Minh）",
      dayBadge: "婚禮當日完整流程",
      dayMainDate: "2027 年 1 月 6 日（星期三）",
      dayLunarDate: "農曆丙午年十一月二十九日",
      tl1Period: "當日上午 • 06:00",
      tl1Title: "府上迎親暨結婚典禮",
      tl1Desc: "於男方府上（胡志明市富定坊）與女方府上（和平坊）舉行傳統迎親暨結婚典禮。",
      tl2Period: "同日晚間 • 18:00 迎賓入席 · 19:00 準時開席",
      tl2Title: "婚禮晚宴 — RIVERSIDE PALACE（Seine 宴會廳）",
      tl2Desc: "胡志明市永會坊檳雲屯街 360D 號（Sảnh Seine）• 敬備喜筵，誠摯恭候蒞臨。",
      dpbTag: "婚宴當日快速導航模式 • 2027.01.06",
      dpbTitle: "誠摯歡迎 Quý Khách 蒞臨順祥 & 小瑩的婚禮晚宴！",
      dpbDesc:
        "為方便您乘車或自駕前往，我們已將「Riverside Palace（Seine 宴會廳 — 360D Bến Vân Đồn）」手繪路線圖與交通指引置於頁面最上方。",
      btnOpenGmapsNav: "🧭 立即開啟 Google Maps 路線導航",
      btnJumpToCards: "💌 下滑瀏覽 3 張結婚喜帖 ↓",
      btnStartRoute: "🧭 開啟 Google 導航",
      btnCopyAddr: "📋 複製餐廳地址",
      copiedAddr: "✅ 已複製 Riverside Palace 餐廳地址（360D Bến Vân Đồn）！",
      imapBadge: "手繪交通路線圖 • WEDDING ROUTE MAP",
      imapTitle: "Riverside Palace（Seine 宴會廳）手繪交通指引圖",
      imapSub: "位於 360D Bến Vân Đồn 大道（介於 Nguyễn Văn Cừ 橋與 Ông Lãnh 橋之間）。點擊地圖可放大檢視。",
      btnZoomImap: "🔍 放大檢視路線圖",
      rg1Title: "路線 1：由第一郡、第三郡、富潤郡前往",
      rg1Body:
        "沿 Nguyễn Thái Học 街過「Ông Lãnh 橋（Cầu Ông Lãnh）」→ 下橋立即右轉進入「Bến Vân Đồn 大道」→ 沿河岸直行約 900 公尺，左側即達 Riverside Palace（360D Bến Vân Đồn）。",
      rg2Title: "路線 2：由第五郡、第十郡、第八郡前往",
      rg2Body:
        "過「Nguyễn Văn Cừ 橋（Cầu Nguyễn Văn Cừ）」往第四郡方向 → 下匝道轉入「Bến Vân Đồn 大道」→ 沿河岸直行約 400 公尺，右側白色歐式建築即為 Riverside Palace。",
      rg3Title: "路線 3：由第七郡、芽皮、守德前往",
      rg3Body:
        "過「Kênh Tẻ 橋」沿 Khánh Hội 街直行到底 → 遇河岸左轉進入「Bến Vân Đồn 大道」→ 經過 Nguyễn Khoái 路口直行約 250 公尺即達。",
      rg4Title: "停車與進入「Seine 宴會廳（Sảnh Seine）」指引",
      rg4Body:
        "🚗 停車與計程車/Grab：360D Bến Vân Đồn 正門設有汽車與機車停車場（Grab 可直達正門有頂迎賓處）。🏛️ 宴會廳位置：進入一樓大廳後請依「順祥 & 小瑩 — Sảnh Seine（Seine 宴會廳）」指示牌入席（18:00 迎賓 · 19:00 開席）。",
      scrollCue: "下滑繼續瀏覽喜帖",
      footerCredit: "Personally designed by the Bride & Groom — Tiểu Dinh & Thuận Tường",
      footerToolLink: "🔗 賓客專屬喜帖連結產生器（新人專用）"
    }
  };

  /* State */
  const params = new URLSearchParams(window.location.search);
  const rawGuest =
    params.get("to") ||
    params.get("guest") ||
    params.get("khach") ||
    params.get("name") ||
    "";
  let guestName = rawGuest.trim();
  const explicitLang = (params.get("lang") || "").toLowerCase();
  let currentLang =
    explicitLang === "zh"
      ? "zh"
      : explicitLang === "vi"
        ? "vi"
        : /[\u4e00-\u9fff]/.test(guestName)
          ? "zh"
          : "vi";
  let envelopeOpened =
    params.get("open") === "1" ||
    params.get("mode") === "directions" ||
    params.get("map") === "1";
  let envelopeFlipped = false;
  let toastTimeout = null;
  let syncTopbarNavUI = null;

  /* Real-time Guest Visit & Envelope Open Tracker (Cloudflare Edge /api/track) */
  const VISIT_SESSION_ID =
    "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);

  function getVisitorId() {
    try {
      let vid = localStorage.getItem("td_wedding_vid");
      if (!vid) {
        vid = "v_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);
        localStorage.setItem("td_wedding_vid", vid);
      }
      return vid;
    } catch (_) {
      return "v_anon";
    }
  }

  function trackGuestActivity(eventType) {
    try {
      if (params.get("notrack") === "1" || params.get("debug_env")) return;
      const cfg = window.WEDDING_CONFIG || {};
      const isThankYou =
        cfg.thankYouMode === true ||
        params.get("mode") === "thankyou" ||
        params.get("thankyou") === "1";
      const screenStr =
        window.screen && window.screen.width && window.screen.height
          ? `${window.screen.width}×${window.screen.height}`
          : "";
      const payload = JSON.stringify({
        event: eventType || "view",
        guest: guestName || "",
        slot: params.get("s") || "",
        lang: currentLang,
        mode: isThankYou ? "thankyou" : "invite",
        vid: getVisitorId(),
        sid: VISIT_SESSION_ID,
        screen: screenStr
      });
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true
      }).catch(() => {});
    } catch (_) {}
  }

  /* Auto-fit long Guest Names cleanly inside Envelope & Card 1 dotted lines on narrow mobile screens */
  function fitGuestNameElement(textEl, slotEl, minPx) {
    if (!textEl) return;
    textEl.style.fontSize = textEl.dataset.baseFont || "";
    const containerW = slotEl ? slotEl.clientWidth : textEl.clientWidth;
    if (!containerW || containerW <= 12) return;
    const maxW = Math.floor(containerW * 0.985);
    const initialScrollW = textEl.scrollWidth;
    if (initialScrollW <= maxW) return;

    const computedPx = parseFloat(window.getComputedStyle(textEl).fontSize) || 17;
    let nextPx = Math.max(minPx, computedPx * (maxW / initialScrollW) * 0.975);
    textEl.style.fontSize = nextPx.toFixed(2) + "px";

    let guard = 0;
    while (textEl.scrollWidth > maxW && nextPx > minPx && guard++ < 6) {
      nextPx = Math.max(minPx, nextPx - 0.55);
      textEl.style.fontSize = nextPx.toFixed(2) + "px";
    }
  }

  function fitAllGuestNames() {
    const envGuest = document.getElementById("env-guest-name");
    fitGuestNameElement(envGuest, envGuest, 11);

    const c1Guest = document.getElementById("card1-guest-name");
    const c1Slot = c1Guest ? c1Guest.closest(".card1-guest-slot") : null;
    fitGuestNameElement(c1Guest, c1Slot, 11);

    const pullGuest = document.querySelector("#env-pullout-svg .card1-guest-text");
    const pullSlot = pullGuest ? pullGuest.closest(".card1-guest-slot") : null;
    fitGuestNameElement(pullGuest, pullSlot, 9.5);
  }

  function syncPulloutCardPreview() {
    const pullWrap = document.getElementById("env-pullout-svg");
    if (!pullWrap) return;
    if (currentLang === "zh" && SVGS.card3) {
      pullWrap.innerHTML = SVGS.card3.replace(/\bc3_/g, "pull3_");
    } else if (SVGS.card1) {
      const display = guestName || I18N[currentLang].defaultGuest;
      const hasHanzi = /[\u4e00-\u9fff]/.test(display);
      const safeName = String(display)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const cls = hasHanzi ? "card1-guest-text has-hanzi-guest" : "card1-guest-text";
      pullWrap.innerHTML =
        `<div class="card1-guest-slot"><span class="${cls}" data-base-font="clamp(12px,2.8vw,19px)" style="font-size:clamp(12px,2.8vw,19px);">${safeName}</span></div>` +
        SVGS.card1.replace(/\bc1_/g, "pull1_");
      const pullGuest = pullWrap.querySelector(".card1-guest-text");
      const pullSlot = pullWrap.querySelector(".card1-guest-slot");
      fitGuestNameElement(pullGuest, pullSlot, 9.5);
    }
  }

  /* 1. Inject Original Vector Artwork SVGs */
  function mountArtworkSVGs() {
    const map = [
      ["svg-vo-front", SVGS.voFront],
      ["svg-vo-back", SVGS.voBack],
      ["svg-card-1", SVGS.card1],
      ["svg-card-2", SVGS.card2],
      ["svg-card-3", SVGS.card3]
    ];
    map.forEach(([id, svgMarkup]) => {
      const el = document.getElementById(id);
      if (el && svgMarkup) {
        el.innerHTML = svgMarkup;
      }
    });

    syncPulloutCardPreview();
    indexCard2BorderGlyphs();
    bindCard1EasterEggs();
    bindCard3EasterEggs();
  }

  /* Group Card 2's 248 handwritten border strokes into their exact 50 English words (--wi: 0..49)
     so the golden foil spotlight steps word-by-word: "We" -> "began" -> "as" -> "classmates"... */
  function indexCard2BorderGlyphs() {
    const svg2 = document.getElementById("svg-card-2");
    if (!svg2) return;

    const topG = svg2.querySelector(".c2-border-top");
    const rightG = svg2.querySelector(".c2-border-right");
    const bottomG = svg2.querySelector(".c2-border-bottom");
    const leftG = svg2.querySelector(".c2-border-left");
    if (!topG || !rightG || !bottomG || !leftG) return;

    // Reunite the 4 corner paths ("pter" of "chapter") from end of rightG onto end of bottomG
    const rightPathsInitial = Array.from(rightG.querySelectorAll(":scope > path"));
    if (rightPathsInitial.length === 74) {
      rightPathsInitial.slice(70).forEach((p) => bottomG.appendChild(p));
    }

    const SVG_NS = "http://www.w3.org/2000/svg";
    const WORD_SLICES = [
      // Top (12 words): We(2) began(4) as(2) classmates(10) in(2) high(3) school(6) and(3) became(6) each(4) other’s(7) love.(5)
      [topG, [2, 4, 2, 10, 2, 3, 6, 3, 6, 4, 7, 5]],
      // Right (12 words): We(2) grew(4) together,(9) understood(10) each(4) other,(6) and(3) found(5) happiness(9) in(2) our(3) relationship.(13)
      [rightG, [2, 4, 9, 10, 4, 6, 3, 5, 9, 2, 3, 13]],
      // Bottom (11 words): Despite(7) many(4) arguments(9) and(3) challenges,(11) we(2) made(4) it(2) through(7) that(4) chapter(7)
      [bottomG, [7, 4, 9, 3, 11, 2, 4, 2, 7, 4, 7]],
      // Left (15 words): After(5) seven(5) and(3) a(1) half(4) years,(6) our(3) story(5) continues—(10) now(3) as(2) husband(7) and(3) wife.(4) T&D(3)
      [leftG, [5, 5, 3, 1, 4, 6, 3, 5, 10, 3, 2, 7, 3, 4, 3]]
    ];

    let wi = 0;
    WORD_SLICES.forEach(([groupEl, counts]) => {
      const paths = Array.from(groupEl.querySelectorAll(":scope > path"));
      if (!paths.length) return;
      let cursor = 0;
      counts.forEach((cnt) => {
        const slice = paths.slice(cursor, cursor + cnt);
        cursor += cnt;
        if (!slice.length) return;
        const wordG = document.createElementNS(SVG_NS, "g");
        wordG.setAttribute("class", "c2-word");
        wordG.style.setProperty("--wi", String(wi++));
        slice.forEach((p) => wordG.appendChild(p));
        groupEl.appendChild(wordG);
      });
      // Safety fallback if any trailing paths remain
      if (cursor < paths.length) {
        const restG = document.createElementNS(SVG_NS, "g");
        restG.setAttribute("class", "c2-word");
        restG.style.setProperty("--wi", String(wi++));
        paths.slice(cursor).forEach((p) => restG.appendChild(p));
        groupEl.appendChild(restG);
      }
    });
  }

  /* 2. Quiet-Luxury Floating Whispers on Card 1 (Couple & 5 Puppies) */
  const CHARACTER_WHISPERS = {
    couple: {
      ornament: "♡",
      vi: [
        { words: "Hẹn gặp bạn đêm 06.01 nhé" },
        { words: "Bảy năm rưỡi, một chữ Thương" },
        { words: "Cùng nâng ly tại Sảnh Seine nhé" },
        { words: "Từ bạn cùng lớp, thành người một nhà" },
        { words: "Niềm vui trọn vẹn khi có bạn" },
        { words: "Cảm ơn vì đã đến chung vui" }
      ],
      zh: [
        { words: "1 月 6 日，期待與您舉杯" },
        { words: "七年半的默契，化作一輩子" },
        { words: "謝謝您來見證我們的幸福" },
        { words: "Seine 宴會廳，不見不散" },
        { words: "從同班同學，到攜手一生" },
        { words: "有您的祝福，這一天更圓滿" }
      ]
    },
    xiuxiu: {
      ornament: "✦",
      vi: [
        { speaker: "Xíu Xíu", words: "Hẹn gặp tối 06.01 nha" },
        { speaker: "Xíu Xíu", words: "Canh chữ Song Hỷ cho Ba Mẹ" },
        { speaker: "Xíu Xíu", words: "Giữ chỗ đẹp chờ bạn rồi" },
        { speaker: "Xíu Xíu", words: "Nhớ diện thật xinh nhé" },
        { speaker: "Xíu Xíu", words: "Gâu nhẹ một lời mời" }
      ],
      zh: [
        { speaker: "Xíu Xíu", words: "1 月 6 日等你來喔" },
        { speaker: "Xíu Xíu", words: "替爸媽守護雙喜" },
        { speaker: "Xíu Xíu", words: "幫您留好位子囉" },
        { speaker: "Xíu Xíu", words: "記得盛裝來喝喜酒" },
        { speaker: "Xíu Xíu", words: "輕輕汪一聲邀請您" }
      ]
    },
    rightDogs: {
      ornament: "✦",
      vi: [
        { speaker: "KiKi", words: "Tối 06.01 nhớ ghé chung vui nha" },
        { speaker: "Chip", words: "Đợi bạn ở Sảnh Seine nhé" },
        { speaker: "Dâu", words: "Mong được gặp bạn đêm tiệc" },
        { speaker: "Cherry", words: "Cùng nâng ly mừng Ba Mẹ nha" },
        { speaker: "KiKi · Chip · Dâu · Cherry", words: "Hẹn gặp tại Riverside Palace" }
      ],
      zh: [
        { speaker: "KiKi", words: "婚宴當晚一定要來喔" },
        { speaker: "Chip", words: "在 Seine 宴會廳等您" },
        { speaker: "Dâu", words: "期待 1 月 6 日與您相見" },
        { speaker: "Cherry", words: "一起為爸媽舉杯祝福" },
        { speaker: "四隻毛孩", words: "Riverside Palace 見囉" }
      ]
    }
  };

  function createPhrasePicker(clusterKey) {
    let bag = [];
    let lastPickedIdx = -1;

    return function pickNext() {
      const cfg = CHARACTER_WHISPERS[clusterKey];
      const list = cfg[currentLang === "zh" ? "zh" : "vi"] || cfg.vi;
      if (!bag.length) {
        bag = list.map((_, idx) => idx);
        for (let i = bag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = bag[i];
          bag[i] = bag[j];
          bag[j] = tmp;
        }
        // Guarantee no back-to-back repeat across reshuffles
        if (bag.length > 1 && bag[bag.length - 1] === lastPickedIdx) {
          const swap = bag[0];
          bag[0] = bag[bag.length - 1];
          bag[bag.length - 1] = swap;
        }
      }
      const idx = bag.pop();
      lastPickedIdx = idx;
      return { ornament: cfg.ornament, ...list[idx % list.length] };
    };
  }

  let hasPlayedWelcomeGreeting = false;
  let triggerWelcomeGreetingIfReady = null;
  const activeWhispers = [];

  function spawnFloatingWhisper(anchorEl, e, phraseObj, isTallFigure, customDurSec) {
    // Gracefully dissolve older whispers when clicked rapidly so lines never pile up on top of each other
    while (activeWhispers.length >= 1) {
      const older = activeWhispers.shift();
      if (older && older.isConnected) {
        older.classList.add("is-retiring");
        setTimeout(() => older.remove(), 420);
      }
    }

    const vw = window.innerWidth || 390;
    const rect = anchorEl ? anchorEl.getBoundingClientRect() : null;
    const rawX =
      e && e.clientX
        ? e.clientX
        : rect
          ? rect.left + rect.width / 2
          : vw / 2;
    const rawY = rect
      ? isTallFigure
        ? rect.top - 4
        : rect.top - 8
      : (e && e.clientY ? e.clientY - 18 : 320);

    const pill = document.createElement("div");
    pill.className = "floating-whisper";

    const orn = document.createElement("span");
    orn.className = "fw-ornament";
    orn.setAttribute("aria-hidden", "true");
    orn.textContent = phraseObj.ornament || "♡";
    pill.appendChild(orn);

    if (phraseObj.speaker) {
      const spk = document.createElement("span");
      spk.className = "fw-speaker";
      spk.textContent = phraseObj.speaker;
      pill.appendChild(spk);

      const dot = document.createElement("span");
      dot.className = "fw-dot";
      dot.setAttribute("aria-hidden", "true");
      dot.textContent = "·";
      pill.appendChild(dot);
    }

    const words = document.createElement("span");
    words.className = "fw-words";
    words.textContent = phraseObj.words;
    pill.appendChild(words);

    // Poised upward breeze staying inside the open cream sky above the arch (never crashing into 18:00 | 06.01.2027)
    // Steer breeze gently inward when tapped near left (Xíu Xíu) or right (4 puppies) mobile screen edges
    const dir =
      rawX < vw * 0.36 ? 1 : rawX > vw * 0.64 ? -1 : Math.random() < 0.5 ? -1 : 1;
    const dx1Val = dir * (9 + Math.random() * 14);
    const dx2Val = -dir * (5 + Math.random() * 12) + (Math.random() * 10 - 5);
    const dx1 = dx1Val.toFixed(1) + "px";
    const dx2 = dx2Val.toFixed(1) + "px";
    const rise = -(175 + Math.random() * 48).toFixed(1) + "px";
    const durSec = customDurSec || 3.9 + Math.random() * 0.55;
    const rot1 = (dir * (0.45 + Math.random() * 0.9)).toFixed(2) + "deg";
    const rot2 = (-dir * (0.35 + Math.random() * 0.85)).toFixed(2) + "deg";

    pill.style.setProperty("--dx1", dx1);
    pill.style.setProperty("--dx2", dx2);
    pill.style.setProperty("--rise", rise);
    pill.style.setProperty("--dur", durSec.toFixed(2) + "s");
    pill.style.setProperty("--rot1", rot1);
    pill.style.setProperty("--rot2", rot2);

    document.body.appendChild(pill);
    activeWhispers.push(pill);

    // Measure actual width + lateral flight drift so the floating line NEVER clips off mobile left/right screen edges
    const w = pill.offsetWidth || 210;
    const jitterX = Math.random() * 20 - 10;
    const jitterY = Math.random() * 12 - 6;
    const leftPad = Math.max(12, 10 - Math.min(0, dx1Val, dx2Val));
    const rightPad = Math.max(12, 10 + Math.max(0, dx1Val, dx2Val));
    const minX = Math.min(vw / 2, w / 2 + leftPad);
    const maxX = Math.max(vw / 2, vw - w / 2 - rightPad);
    const clampedClientX = Math.max(minX, Math.min(maxX, rawX + jitterX));
    const pageX = clampedClientX + window.scrollX;
    const pageY = rawY + jitterY + window.scrollY;

    pill.style.left = pageX.toFixed(1) + "px";
    pill.style.top = pageY.toFixed(1) + "px";

    // Sparkling champagne-gold / crimson heart motes drifting alongside
    const moteGlyphs = ["♥", "✦", "♡", "♥"];
    for (let i = 0; i < 4; i++) {
      const m = document.createElement("span");
      m.className = "floating-mote";
      m.setAttribute("aria-hidden", "true");
      m.textContent = moteGlyphs[i % moteGlyphs.length];
      const side = i % 2 === 0 ? -1 : 1;
      const mx = pageX + side * (22 + Math.random() * 48);
      const my = pageY + 4 + Math.random() * 12;
      m.style.left = mx.toFixed(1) + "px";
      m.style.top = my.toFixed(1) + "px";
      m.style.setProperty("--dx", (side * (16 + Math.random() * 28)).toFixed(1) + "px");
      m.style.setProperty("--dy", -(185 + Math.random() * 75).toFixed(1) + "px");
      m.style.setProperty("--dur", (3.2 + Math.random() * 0.8).toFixed(2) + "s");
      m.style.setProperty("--sz", (13 + Math.random() * 4).toFixed(1) + "px");
      m.style.setProperty("--clr", i % 2 === 0 ? "#d42232" : "#c8923b");
      document.body.appendChild(m);
      setTimeout(() => m.remove(), 4200);
    }

    setTimeout(() => pill.remove(), Math.ceil(durSec * 1000) + 120);
  }

  /* Bespoke Hand-Sketched Calligraphic Hearts for Bride, Groom & Banquet Guests ("thả tim") */
  const HAND_DRAWN_HEART_SVGS = [
    // 1. Vibrant Ruby-Crimson Filled Heart
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#c81922" d="M12.1 20.6c-.3 0-.6-.1-.8-.3C7.2 16.9 3.4 13.4 3.1 9.1 2.9 6.2 5.1 4 7.8 4c1.7 0 3.3.9 4.2 2.3C12.9 4.9 14.5 4 16.2 4c2.8 0 4.9 2.2 4.7 5.1-.3 4.3-4.1 7.8-8 11.2-.2.2-.5.3-.8.3z"/></svg>',
    // 2. Deep Velvet Burgundy Heart
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#8c141b" d="M12 20.4C7.9 17 3.8 13.5 3.5 9.2 3.3 6.5 5.3 4.4 7.9 4.4c1.7 0 3.2.9 4.1 2.3.9-1.4 2.4-2.3 4.1-2.3 2.6 0 4.6 2.1 4.4 4.8-.3 4.3-4.4 7.8-8.5 11.2z"/></svg>',
    // 3. Romantic Rose-Coral Heart
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#e04352" d="M12 20.4C7.9 17 3.8 13.5 3.5 9.2 3.3 6.5 5.3 4.4 7.9 4.4c1.7 0 3.2.9 4.1 2.3.9-1.4 2.4-2.3 4.1-2.3 2.6 0 4.6 2.1 4.4 4.8-.3 4.3-4.4 7.8-8.5 11.2z"/></svg>',
    // 4. 24K Champagne-Gold Filled Heart
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#d69428" d="M12 20.4C7.9 17 3.8 13.5 3.5 9.2 3.3 6.5 5.3 4.4 7.9 4.4c1.7 0 3.2.9 4.1 2.3.9-1.4 2.4-2.3 4.1-2.3 2.6 0 4.6 2.1 4.4 4.8-.3 4.3-4.4 7.8-8.5 11.2z"/></svg>',
    // 5. Champagne-Gold Calligraphic Outline Heart
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="rgba(255,246,232,0.75)" stroke="#c28322" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" d="M12 20.1C8 16.8 4 13.4 3.7 9.2 3.5 6.5 5.5 4.5 8 4.5c1.7 0 3.1.9 4 2.3.9-1.4 2.3-2.3 4-2.3 2.5 0 4.5 2 4.3 4.7-.3 4.2-4.3 7.6-8.3 10.9z"/></svg>'
  ];

  function spawnGuestHearts(anchorEl, e, customCount) {
    const rect = anchorEl ? anchorEl.getBoundingClientRect() : null;
    const baseClientX =
      e && e.clientX
        ? e.clientX
        : rect
          ? rect.left + rect.width / 2
          : (window.innerWidth || 390) / 2;
    const baseClientY =
      e && e.clientY
        ? Math.min(e.clientY - 10, rect ? rect.top + rect.height * 0.22 : e.clientY - 10)
        : rect
          ? rect.top + rect.height * 0.16
          : 340;

    const basePageX = baseClientX + window.scrollX;
    const basePageY = baseClientY + window.scrollY;
    const count = customCount || 16;

    for (let i = 0; i < count; i++) {
      const heart = document.createElement("span");
      heart.className = "guest-heart-mote";
      heart.setAttribute("aria-hidden", "true");
      heart.innerHTML = HAND_DRAWN_HEART_SVGS[i % HAND_DRAWN_HEART_SVGS.length];

      const spreadRange = Math.min(220, Math.max(90, count * 9));
      const spreadX =
        ((i / Math.max(1, count - 1)) - 0.5) * spreadRange + (Math.random() * 26 - 13);
      const spreadY = Math.random() * 24 - 12;
      const dir = (i % 2 === 0 ? 1 : -1) * (Math.random() < 0.28 ? -1 : 1);
      const dx1 = (dir * (16 + Math.random() * 34)).toFixed(1) + "px";
      const dx2 = (-dir * (12 + Math.random() * 32) + (Math.random() * 20 - 10)).toFixed(1) + "px";
      const rise = -(195 + Math.random() * 145).toFixed(1) + "px";
      const dur = (2.85 + Math.random() * 1.25).toFixed(2) + "s";
      const delay = (i * 0.045 + Math.random() * 0.08).toFixed(2) + "s";
      const sz = (16 + (i % 4) * 3.2 + Math.random() * 3.5).toFixed(1) + "px";
      const rot1 = (dir * (7 + Math.random() * 12)).toFixed(1) + "deg";
      const rot2 = (-dir * (6 + Math.random() * 14)).toFixed(1) + "deg";

      heart.style.left = (basePageX + spreadX).toFixed(1) + "px";
      heart.style.top = (basePageY + spreadY).toFixed(1) + "px";
      heart.style.setProperty("--dx1", dx1);
      heart.style.setProperty("--dx2", dx2);
      heart.style.setProperty("--rise", rise);
      heart.style.setProperty("--dur", dur);
      heart.style.setProperty("--delay", delay);
      heart.style.setProperty("--sz", sz);
      heart.style.setProperty("--rot1", rot1);
      heart.style.setProperty("--rot2", rot2);

      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 4800);
    }
  }

  function bindCard1EasterEggs() {
    const svgWrap = document.getElementById("svg-card-1");
    if (!svgWrap) return;

    const svgEl = svgWrap.querySelector("svg");
    const xiuxiu = svgWrap.querySelector(".c1-dog-xiuxiu");
    const rightDogs = svgWrap.querySelector(".c1-dogs-right");
    const couple = svgWrap.querySelector(".c1-couple");

    // Mount invisible vector hit-zones over the Left & Right Banquet Table Guests behind the arch
    if (svgEl && couple && !svgEl.querySelector(".c1-guests-hit-layer")) {
      const SVG_NS = "http://www.w3.org/2000/svg";
      const hitLayer = document.createElementNS(SVG_NS, "g");
      hitLayer.setAttribute("class", "c1-guests-hit-layer");

      [
        { table: "left", x: "70", y: "314", width: "46", height: "44" },
        { table: "right", x: "224", y: "312", width: "46", height: "44" }
      ].forEach((zone) => {
        const rect = document.createElementNS(SVG_NS, "rect");
        rect.setAttribute("class", "c1-guest-hit");
        rect.setAttribute("data-table", zone.table);
        rect.setAttribute("x", zone.x);
        rect.setAttribute("y", zone.y);
        rect.setAttribute("width", zone.width);
        rect.setAttribute("height", zone.height);
        rect.setAttribute("rx", "6");
        rect.addEventListener("click", (e) => {
          e.stopPropagation();
          spawnGuestHearts(rect, e, 16);
        });
        hitLayer.appendChild(rect);
      });

      couple.parentNode.insertBefore(hitLayer, couple);
    }

    const pickCouple = createPhrasePicker("couple");
    const pickXiu = createPhrasePicker("xiuxiu");
    const pickRight = createPhrasePicker("rightDogs");

    if (xiuxiu) {
      xiuxiu.addEventListener("click", (e) => {
        e.stopPropagation();
        spawnFloatingWhisper(xiuxiu, e, pickXiu(), false);
        spawnGuestHearts(xiuxiu, e, 12);
      });
    }

    if (rightDogs) {
      rightDogs.addEventListener("click", (e) => {
        e.stopPropagation();
        spawnFloatingWhisper(rightDogs, e, pickRight(), false);
        spawnGuestHearts(rightDogs, e, 14);
      });
    }

    if (couple) {
      couple.addEventListener("click", (e) => {
        e.stopPropagation();
        spawnFloatingWhisper(couple, e, pickCouple(), true);
        spawnGuestHearts(couple, e, 26);
      });
    }

    // One-time Welcome Thank-You Whisper & Lush Heart Shower from Bride & Groom right when viewer enters
    triggerWelcomeGreetingIfReady = function () {
      if (hasPlayedWelcomeGreeting || !envelopeOpened) return;
      if (document.body.classList.contains("is-table-preparing")) return;
      if (!couple) return;
      const r = couple.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      if (r.width <= 0 || r.top > vh - 25 || r.bottom < 30) return;

      hasPlayedWelcomeGreeting = true;
      const isZh = currentLang === "zh";
      const welcomePhrase = isZh
        ? {
            ornament: "♡",
            speaker: "小瑩 & 順祥",
            words: guestName
              ? `謝謝 ${guestName} 開啟我們的喜帖，期待相見 ♥`
              : "謝謝您開啟我們的喜帖，期待與您相見 ♥"
          }
        : {
            ornament: "♡",
            speaker: "Tiểu Dinh & Thuận Tường",
            words: guestName
              ? `Cảm ơn ${guestName} đã ghé xem thiệp của tụi mình nhé ♥`
              : "Cảm ơn bạn đã ghé xem thiệp cưới của tụi mình nhé ♥"
          };

      spawnFloatingWhisper(couple, null, welcomePhrase, true, 5.2);
      spawnGuestHearts(couple, null, 24);

      const leftGuests = svgWrap.querySelector('.c1-guest-hit[data-table="left"]');
      const rightGuests = svgWrap.querySelector('.c1-guest-hit[data-table="right"]');
      setTimeout(() => {
        if (leftGuests) spawnGuestHearts(leftGuests, null, 14);
        if (rightGuests) spawnGuestHearts(rightGuests, null, 14);
      }, 340);
      setTimeout(() => {
        if (couple) spawnGuestHearts(couple, null, 20);
        if (xiuxiu) spawnGuestHearts(xiuxiu, null, 8);
        if (rightDogs) spawnGuestHearts(rightDogs, null, 8);
      }, 780);
      setTimeout(() => {
        if (couple) spawnGuestHearts(couple, null, 18);
      }, 1350);
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!hasPlayedWelcomeGreeting && triggerWelcomeGreetingIfReady) {
          triggerWelcomeGreetingIfReady();
        }
      },
      { passive: true }
    );

    if (params.get("debug_whisper") === "1") {
      setTimeout(() => {
        if (couple) spawnFloatingWhisper(couple, null, pickCouple(), true);
        const leftGuests = svgWrap.querySelector('.c1-guest-hit[data-table="left"]');
        const rightGuests = svgWrap.querySelector('.c1-guest-hit[data-table="right"]');
        if (leftGuests) spawnGuestHearts(leftGuests, null);
        setTimeout(() => {
          if (rightGuests) spawnGuestHearts(rightGuests, null);
        }, 220);
      }, 300);
    }
  }

  function bindCard3EasterEggs() {
    const svgWrap3 = document.getElementById("svg-card-3");
    if (!svgWrap3) return;
    const crane = svgWrap3.querySelector(".c3-crane");
    const xi = svgWrap3.querySelector(".c3-xi-emblem");

    const triggerCraneBlessing = (anchor, ev) => {
      const isZh = currentLang === "zh";
      const phrase = isZh
        ? { ornament: "囍", speaker: "仙鶴獻瑞", words: "百年好合 · 永結同心 ♥" }
        : { ornament: "囍", speaker: "Hạc Tiên Chúc Phúc", words: "Trăm năm hạnh phúc · Vĩnh kết đồng tâm ♥" };
      spawnFloatingWhisper(anchor, ev, phrase, false, 3.8);
      spawnGuestHearts(anchor, ev, 8);
    };

    if (crane) {
      crane.addEventListener("click", (e) => {
        e.stopPropagation();
        svgWrap3.classList.remove("is-playing-entrance");
        void crane.offsetWidth;
        svgWrap3.classList.add("is-playing-entrance");
        triggerCraneBlessing(crane, e);
      });
    }
    if (xi) {
      xi.addEventListener("click", (e) => {
        e.stopPropagation();
        triggerCraneBlessing(xi, e);
      });
    }
  }

  function showToast(msg) {
    const toast = document.getElementById("puppy-toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-shown");
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove("is-shown");
    }, 3800);
  }

  /* 3. Render Guest Name onto Envelope & Card 1 Dotted Lines */
  function updateGuestNameDisplay() {
    const dict = I18N[currentLang];
    const display = guestName || dict.defaultGuest;
    const hasHanzi = /[\u4e00-\u9fff]/.test(display);
    const envGuest = document.getElementById("env-guest-name");
    const c1Guest = document.getElementById("card1-guest-name");

    if (envGuest) {
      envGuest.textContent = display;
      envGuest.classList.toggle("has-hanzi-guest", hasHanzi);
    }
    if (c1Guest) {
      c1Guest.textContent = display;
      c1Guest.classList.toggle("has-hanzi-guest", hasHanzi);
    }
    fitAllGuestNames();
  }

  /* Render January 2027 Calendar Grid with Localized Weekday Headers (VI vs 台灣繁體中文) */
  function triggerCalendarDay6Celebration(anchorEl, ev) {
    if (!anchorEl) return;
    const isZh = currentLang === "zh";
    const dict = I18N[currentLang];
    const displayGuest = guestName || dict.defaultGuest;

    const phrase = isZh
      ? {
          ornament: "♡",
          speaker: "Save the Date · 2027.01.06",
          words: guestName
            ? `期待與 ${displayGuest} 於 18:00 婚宴相見 ♥`
            : "期待於 2027.01.06 18:00 婚宴與您相見 ♥"
        }
      : {
          ornament: "♡",
          speaker: "Save the Date · 06.01.2027",
          words: `Hẹn gặp ${displayGuest} lúc 18:00 ngày 06.01.2027 nhé ♥`
        };
    spawnFloatingWhisper(anchorEl, ev || null, phrase, true, 4.4);
    spawnGuestHearts(anchorEl, ev || null, 22);
  }

  function renderJan2027Calendar() {
    const calGrid = document.getElementById("jan-2027-grid");
    if (!calGrid) return;
    const dows =
      currentLang === "zh"
        ? ["一", "二", "三", "四", "五", "六", "日"]
        : ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    let html = dows.map((d) => `<div class="cal-dow">${d}</div>`).join("");
    // Jan 1 2027 = Friday (index 4 in Mon=0..Sun=6)
    for (let e = 0; e < 4; e++) {
      html += `<div class="cal-day"></div>`;
    }
    const inkRingSvg = `<svg class="cal-ink-ring-svg" viewBox="0 0 48 48" aria-hidden="true">
      <path class="cal-ink-ring-path" d="M 24 4.5 C 36.5 3.8, 44.5 12.2, 43.8 24.4 C 43.1 36.8, 34.4 44.2, 22.8 43.6 C 11.2 43.0, 3.8 34.8, 4.6 22.6 C 5.3 11.8, 13.8 4.8, 26.5 5.2" />
      <path class="cal-ink-ring-gold" d="M 22 3.2 C 35.2 2.8, 45.4 11.8, 44.8 24.8 C 44.1 37.6, 34.8 45.2, 22.2 44.6 C 10.4 44.0, 2.8 34.6, 3.8 21.8" />
    </svg>`;
    for (let day = 1; day <= 31; day++) {
      if (day === 6) {
        html += `<div class="cal-day is-wedding-day" data-day="6" style="--day-idx: 6" title="06.01.2027 — Chạm để thả tim Save the Date">${inkRingSvg}<span>6</span></div>`;
      } else {
        html += `<div class="cal-day" data-day="${day}" style="--day-idx: ${day}">${day}</div>`;
      }
    }
    calGrid.innerHTML = html;

    const weddingDayCell = calGrid.querySelector(".cal-day.is-wedding-day");
    if (weddingDayCell) {
      weddingDayCell.addEventListener("click", (e) => {
        e.stopPropagation();
        weddingDayCell.classList.remove("is-replaying-ring");
        void weddingDayCell.offsetWidth;
        weddingDayCell.classList.add("is-replaying-ring");
        triggerCalendarDay6Celebration(weddingDayCell, e);
      });
    }
  }

  /* Update Google Calendar Event Link Dynamically for VI vs 台灣繁體中文 */
  function updateGoogleCalendarLink() {
    const gcalBtn = document.getElementById("btn-google-cal");
    if (!gcalBtn) return;
    const isZh = currentLang === "zh";
    const title = encodeURIComponent(
      isZh
        ? "囍 趙順祥 & 盧小瑩 婚禮晚宴（Riverside Palace）"
        : "Tiệc Cưới Thuận Tường & Tiểu Dinh (囍)"
    );
    const details = encodeURIComponent(
      isZh
        ? "18:00 迎賓入席・19:00 準時開席｜地點：越南胡志明市 RIVERSIDE PALACE — Seine 宴會廳（Sảnh Seine），地址：360D Bến Vân Đồn, Phường Vĩnh Hội, TP. Hồ Chí Minh。誠摯期待您的蒞臨！"
        : "Đón khách 18:00 - Khai tiệc 19:00 tại Riverside Palace (Sảnh Seine), 360D Bến Vân Đồn, P. Vĩnh Hội, TP. Hồ Chí Minh."
    );
    const loc = encodeURIComponent(
      "Riverside Palace (Sảnh Seine), 360D Bến Vân Đồn, Phường Vĩnh Hội, TP. Hồ Chí Minh"
    );
    gcalBtn.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=20270106T110000Z/20270106T143000Z&details=${details}&location=${loc}`;
  }

  /* Post-Wedding Thank You Card + Google Drive Photo Album & Access Toggle */
  let remoteGuestConfig = null;

  function resolveLocalFallbackSeating() {
    try {
      const slotParam = (params.get("s") || "").trim().toLowerCase();
      const seatCfgRaw = localStorage.getItem("td_seating_config_v1");
      const seatCfg = seatCfgRaw ? JSON.parse(seatCfgRaw) : null;
      const customGroupsRaw = localStorage.getItem("td_seat_groups_v1");
      const customGroups = customGroupsRaw ? JSON.parse(customGroupsRaw) : null;
      const finalCfg = seatCfg || { totalTables: 40, seatsPerTable: 10, showTableGuests: true };
      if (customGroups) {
        finalCfg.groups = { ...(finalCfg.groups || {}), ...customGroups };
      }
      const guestsRaw = localStorage.getItem("td_saved_guests_v2");
      const guestsList = guestsRaw ? JSON.parse(guestsRaw) : [];
      const slotsRaw = localStorage.getItem("td_saved_slots_v1");
      const slotsMap = slotsRaw ? JSON.parse(slotsRaw) : {};

      const norm = (s) =>
        String(s || "")
          .normalize("NFC")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ");
      const gKey = norm(guestName);
      const slotNum = slotParam ? parseInt(slotParam.split("-")[0], 10) || 0 : 0;
      let saved = null;
      if (slotParam && Array.isArray(guestsList)) {
        saved = guestsList.find(
          (g) =>
            g &&
            (String(g.slotCode || "").toLowerCase() === slotParam ||
              (slotNum > 0 && Number(g.slot) === slotNum))
        );
      }
      if (!saved && gKey && Array.isArray(guestsList)) {
        saved =
          guestsList.find((g) => g && norm(g.name) === gKey) ||
          guestsList.find(
            (g) =>
              g &&
              Array.isArray(g.aliases) &&
              g.aliases.some((alias) => norm(alias) === gKey)
          ) ||
          null;
      }
      const sObj =
        slotParam && slotsMap && slotsMap[slotParam]
          ? slotsMap[slotParam]
          : saved && saved.slotCode && slotsMap && slotsMap[saved.slotCode]
            ? slotsMap[saved.slotCode]
            : null;
      const resolvedName = String(
        (saved && saved.name) || (sObj && sObj.name) || guestName || ""
      ).trim();
      const resolvedLang =
        (saved && saved.lang) ||
        (sObj && sObj.lang) ||
        (/[\u4e00-\u9fff]/.test(resolvedName) ? "zh" : "vi");
      const table = String((saved && saved.table) || (sObj && sObj.table) || "").trim();
      if (!table && !resolvedName) return null;
      const tMeta = (table && seatCfg && seatCfg.tableMeta && seatCfg.tableMeta[table]) || {};
      const group = String(
        (saved && saved.group) || (sObj && sObj.group) || tMeta.group || ""
      ).trim();
      const pax = Math.max(
        1,
        parseInt((saved && saved.pax) || (sObj && sObj.pax) || "1", 10) || 1
      );
      const companions = [];
      if (table && Array.isArray(guestsList)) {
        guestsList.forEach((g) => {
          if (g && String(g.table || "").trim() === table && g.name) {
            companions.push({ name: g.name, pax: g.pax || 1 });
          }
        });
      }
      return {
        resolvedName,
        resolvedLang,
        table,
        group,
        pax,
        tableLabel: tMeta.label || "",
        tableGuests: companions,
        seatingConfig: finalCfg
      };
    } catch (_) {
      return null;
    }
  }

  function applyResolvedGuestIdentity(cfgObj) {
    if (!cfgObj) return;
    // Canonicalize legacy ?to=... URLs in the browser address bar to their permanent fixed ?s=slotCode link
    if (cfgObj.slotCode && !params.get("s") && window.history && window.history.replaceState) {
      try {
        params.set("s", cfgObj.slotCode);
        const cleanSearch = `?s=${encodeURIComponent(cfgObj.slotCode)}`;
        window.history.replaceState(null, "", window.location.pathname + cleanSearch + window.location.hash);
      } catch (_) {}
    }
    if (!cfgObj.resolvedName) return;
    const nextName = String(cfgObj.resolvedName).trim();
    if (!nextName) return;
    if (nextName !== guestName) {
      guestName = nextName;
      document.body.classList.add("is-guest-mode");
      const nextLang =
        cfgObj.resolvedLang === "zh" || /[\u4e00-\u9fff]/.test(nextName) ? "zh" : "vi";
      if (!explicitLang && nextLang !== currentLang) {
        applyLanguage(nextLang);
      } else {
        updateGuestNameDisplay();
      }
    }
  }

  function fetchRemoteGuestConfig() {
    try {
      const localSeat = resolveLocalFallbackSeating();
      if (localSeat) {
        remoteGuestConfig = { ...(remoteGuestConfig || {}), ...localSeat };
        applyResolvedGuestIdentity(localSeat);
        syncPostWeddingAndAccessMode();
      }
      const qs = new URLSearchParams();
      if (guestName) qs.set("guest", guestName);
      const slotCode = (params.get("s") || "").trim().toLowerCase();
      if (slotCode) qs.set("slot", slotCode);
      qs.set("t", String(Date.now()));
      const isLoc = /^(file:|https?:\/\/(localhost|127\.0\.0\.1))/i.test(window.location.href);
      const apiOrigin = isLoc ? "https://thuantuongtieudinh.io.vn" : "";
      fetch(`${apiOrigin}/api/guest-config?${qs.toString()}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && data.config) {
            remoteGuestConfig = data.config;
            if (!remoteGuestConfig.table && localSeat && localSeat.table) {
              remoteGuestConfig = { ...remoteGuestConfig, ...localSeat };
            }
            applyResolvedGuestIdentity(remoteGuestConfig);
            syncPostWeddingAndAccessMode();
          }
        })
        .catch(() => {});
    } catch (_) {}
  }

  const SEAT_ZONE_I18N = {
    groom_family: { vi: "Gia Đình Nhà Trai", zh: "男方主家席" },
    bride_family: { vi: "Gia Đình Nhà Gái", zh: "女方主家席" },
    groom_relatives: { vi: "Họ Hàng Nhà Trai", zh: "男方親友區" },
    bride_relatives: { vi: "Họ Hàng Nhà Gái", zh: "女方親友區" },
    friends_colleagues: { vi: "Bạn Bè & Đồng Nghiệp", zh: "摯友與同事區" },
    honored_guests: { vi: "Khách Quý Gia Đình", zh: "貴賓席" }
  };

  function renderArchitecturalRoundTablesSvg(activeTableNum, isZh) {
    // Draws a refined cream-and-gold architectural layout (inspired by classical wedding table plans):
    // Head Stage at top, Center Ceremony Aisle, and 12 representative 10-chair round tables (3 rows x 4 columns).
    // If activeTableNum > 12, the row containing activeTableNum is dynamically labeled with its exact row numbers!
    const tNum = activeTableNum > 0 ? activeTableNum : 0;
    const activeRow = tNum > 0 ? Math.ceil(Math.ceil(tNum / 2) / 2) : 0;
    const baseStartRow = activeRow > 3 ? activeRow - 1 : 1;
    const rows = [baseStartRow, baseStartRow + 1, baseStartRow + 2];

    const stageLabel = isZh ? "STAGE • 主舞台" : "STAGE • SÂN KHẤU CHÍNH";
    const aisleLabel = isZh ? "紅毯主走道" : "LỐI ĐI LỄ ĐƯỜNG";
    let tablesSvg = "";

    const colX = [82, 178, 342, 438];
    const rowY = [126, 224, 322];

    rows.forEach((r, rIdx) => {
      const cy = rowY[rIdx];
      // Left wing odd tables: (r-1)*4 + 1, (r-1)*4 + 3
      // Right wing even tables: (r-1)*4 + 2, (r-1)*4 + 4
      const tblNums = [(r - 1) * 4 + 1, (r - 1) * 4 + 3, (r - 1) * 4 + 2, (r - 1) * 4 + 4];

      tblNums.forEach((num, cIdx) => {
        const cx = colX[cIdx];
        const isMine = tNum > 0 && num === tNum;
        const padded = String(num).padStart(2, "0");

        // 10 delicate chairs arranged in a circle around each round table (like classical architectural plan)
        let chairs = "";
        for (let ch = 0; ch < 10; ch++) {
          const deg = ch * 36 - 90;
          const rad = (deg * Math.PI) / 180;
          const chX = (cx + Math.cos(rad) * 30.5).toFixed(1);
          const chY = (cy + Math.sin(rad) * 30.5).toFixed(1);
          const chairStroke = isMine ? "#841518" : "rgba(164, 112, 42, 0.48)";
          const chairFill = isMine ? "rgba(198, 125, 8, 0.24)" : "rgba(250, 245, 234, 0.92)";
          chairs += `<g transform="translate(${chX},${chY}) rotate(${deg + 90})">
            <rect x="-4.6" y="-3.2" width="9.2" height="6.4" rx="2.4" fill="${chairFill}" stroke="${chairStroke}" stroke-width="${isMine ? "1.25" : "0.9"}" />
          </g>`;
        }

        const halo = isMine
          ? `<circle class="svg-my-table-halo" cx="${cx}" cy="${cy}" r="38" fill="none" stroke="rgba(198, 125, 8, 0.55)" stroke-width="1.6" stroke-dasharray="3 3" />`
          : "";

        const tableFill = isMine ? "#841518" : "#fdfaf3";
        const tableStroke = isMine ? "#c67d08" : "rgba(164, 112, 42, 0.58)";
        const innerStroke = isMine ? "rgba(255, 244, 214, 0.45)" : "rgba(164, 112, 42, 0.22)";
        const textFill = isMine ? "#fffbf2" : "#6e4f3a";
        const labelStr = isZh ? `第${padded}桌` : `Bàn ${padded}`;

        tablesSvg += `
          <g class="svg-round-table ${isMine ? "is-mine" : ""}">
            ${halo}
            ${chairs}
            <circle cx="${cx}" cy="${cy}" r="23" fill="${tableFill}" stroke="${tableStroke}" stroke-width="${isMine ? "1.8" : "1.15"}" />
            <circle cx="${cx}" cy="${cy}" r="18.5" fill="none" stroke="${innerStroke}" stroke-width="0.75" />
            <text x="${cx}" y="${cy + 3.5}" text-anchor="middle" font-family="Cormorant Garamond, Noto Serif TC, serif" font-size="${isMine ? "10.5" : "10"}" font-weight="700" fill="${textFill}">${labelStr}</text>
          </g>
        `;
      });
    });

    // 6 chairs behind the head stage table (classical architectural motif)
    let headChairs = "";
    for (let i = 0; i < 6; i++) {
      const hx = 190 + i * 28;
      headChairs += `<rect x="${hx - 6}" y="16" width="12" height="7" rx="2.5" fill="#faf5ea" stroke="rgba(164, 112, 42, 0.52)" stroke-width="0.95" />`;
    }

    return `
      <svg viewBox="0 0 520 382" xmlns="http://www.w3.org/2000/svg" role="img">
        <!-- Head Stage Table -->
        ${headChairs}
        <rect x="164" y="25" width="192" height="28" rx="3" fill="#fdfaf3" stroke="rgba(132, 21, 23, 0.42)" stroke-width="1.15" />
        <rect x="168" y="28.5" width="184" height="21" rx="2" fill="none" stroke="rgba(198, 125, 8, 0.32)" stroke-width="0.75" />
        <text x="260" y="42.5" text-anchor="middle" font-family="Cormorant Garamond, Noto Serif TC, serif" font-size="10.5" font-weight="700" letter-spacing="2.2" fill="#841518">${stageLabel}</text>

        <!-- Center Ceremony Aisle -->
        <line x1="234" y1="68" x2="234" y2="366" stroke="rgba(132, 21, 23, 0.18)" stroke-width="1" stroke-dasharray="4 4" />
        <line x1="286" y1="68" x2="286" y2="366" stroke="rgba(132, 21, 23, 0.18)" stroke-width="1" stroke-dasharray="4 4" />
        <text x="260" y="224" text-anchor="middle" font-family="Cormorant Garamond, Noto Serif TC, serif" font-size="9.5" font-weight="700" letter-spacing="2.5" fill="rgba(132, 21, 23, 0.42)" transform="rotate(-90 260 224)">${aisleLabel}</text>

        <!-- 10-Chair Round Tables -->
        ${tablesSvg}
      </svg>
    `;
  }

  function syncGuestSeatingUI() {
    const secEl = document.getElementById("section-seating");
    if (!secEl) return;
    const rCfg = remoteGuestConfig || {};
    const tableStr = String(params.get("table") || rCfg.table || "").trim();
    const isZh = currentLang === "zh";
    const dict = I18N[currentLang];
    const displayGuest = guestName || dict.defaultGuest;

    const navSeatEl = document.getElementById("nav-seating-pill");
    if (navSeatEl) {
      navSeatEl.textContent = isZh ? "席位" : "Bàn tiệc";
    }

    const eyebrowEl = document.getElementById("seating-eyebrow");
    const mainTitleEl = document.getElementById("seating-main-title");
    const mainSubEl = document.getElementById("seating-main-sub");
    const badgeEl = document.getElementById("seating-badge");
    const heroHeadingEl = document.getElementById("seating-hero-heading");
    const guestLineEl = document.getElementById("seating-guest-line");
    const n1PeriodEl = document.getElementById("seating-node1-period");
    const n1TitleEl = document.getElementById("seating-node1-title");
    const n1DescEl = document.getElementById("seating-node1-desc");
    const n2PeriodEl = document.getElementById("seating-node2-period");
    const n2TitleEl = document.getElementById("seating-node2-title");
    const n2DescEl = document.getElementById("seating-node2-desc");
    const compLineEl = document.getElementById("seating-companions-line");
    const chartKickerEl = document.getElementById("seating-chart-kicker");
    const chartNoteEl = document.getElementById("seating-chart-note");
    const chartFooterEl = document.getElementById("seating-chart-footer");
    const svgWrapEl = document.getElementById("seating-svg-container");

    if (eyebrowEl) {
      eyebrowEl.textContent = isZh
        ? "婚宴席位指引 • Seine 宴會廳（一樓）"
        : "Sơ Đồ Bàn Tiệc • Sảnh Seine (Tầng Trệt)";
    }
    if (mainTitleEl) {
      mainTitleEl.textContent = isZh
        ? "貴賓席位與宴會廳平面圖"
        : "Vị Trí Bàn Tiệc Của Quý Khách";
    }
    if (mainSubEl) {
      mainSubEl.textContent = isZh
        ? "Riverside Palace 一樓 Seine 宴會廳採 10 人圓桌對稱配置，誠摯恭候您的蒞臨。"
        : "Không gian tiệc cưới bàn tròn 10 khách bố trí đối xứng qua lối đi lễ đường tại Sảnh Seine.";
    }
    if (chartKickerEl) {
      chartKickerEl.textContent = "RIVERSIDE PALACE • SEINE HALL";
    }
    if (chartFooterEl) {
      chartFooterEl.textContent = isZh
        ? "Seine 宴會廳獨立迎賓入口（一樓）↑"
        : "Cổng Đón Khách Sảnh Seine (Tầng Trệt) ↑";
    }

    if (!tableStr) {
      // STATE A: NO TABLE ASSIGNED YET -> Graceful editorial notice on the main invitation
      if (badgeEl) {
        badgeEl.textContent = isZh ? "SEINE 宴會廳 • 席位安排中" : "SẢNH SEINE • ĐANG XẾP BÀN";
      }
      if (heroHeadingEl) {
        heroHeadingEl.textContent = isZh ? "席位安排中" : "Đang Cập Nhật";
      }
      if (guestLineEl) {
        guestLineEl.textContent = isZh
          ? `為 ${displayGuest} 預留席位`
          : `Dành riêng cho ${displayGuest}`;
      }
      if (n1PeriodEl) {
        n1PeriodEl.textContent = isZh ? "宴會廳空間配置 • 18:00 迎賓" : "Không gian sảnh tiệc • Đón khách 18:00";
      }
      if (n1TitleEl) {
        n1TitleEl.textContent = isZh ? "Sảnh Seine — 10 人圓桌席位" : "Sảnh Seine — Bàn Tròn 10 Khách";
      }
      if (n1DescEl) {
        n1DescEl.textContent = isZh
          ? "10人圓桌，同桌自由入座。"
          : "Bàn tròn 10 khách, ngồi tự do trong bàn.";
      }
      if (n2PeriodEl) {
        n2PeriodEl.textContent = isZh ? "透過此 QR 碼或連結查看桌號" : "Tra cứu số bàn ngay trên mã QR này";
      }
      if (n2TitleEl) {
        n2TitleEl.textContent = isZh ? "請於婚禮前夕再次開啟查看" : "Mời Quý Khách Xem Lại Sát Ngày Cưới";
      }
      if (n2DescEl) {
        n2DescEl.textContent = isZh
          ? "婚禮前夕再次掃描 QR 碼即可查看桌號。"
          : "Mở lại link hoặc quét QR sát ngày cưới để xem số bàn.";
      }
      if (compLineEl) compLineEl.hidden = true;
      if (chartNoteEl) {
        chartNoteEl.textContent = isZh ? "10人圓桌配置示意圖" : "Sơ đồ minh họa bàn tròn 10 ghế";
      }
      if (svgWrapEl) {
        svgWrapEl.innerHTML = renderArchitecturalRoundTablesSvg(0, isZh);
      }
      return;
    }

    // STATE B: TABLE ASSIGNED -> Clean editorial ledger + highlighted round table
    const tNum = parseInt(tableStr, 10) || 1;
    const padded = String(tNum).padStart(2, "0");
    const isLeftWing = tNum % 2 === 1;
    const wingOrder = Math.ceil(tNum / 2);
    const rowNum = Math.ceil(wingOrder / 2);
    const grpKey = params.get("group") || rCfg.group || "honored_guests";
    const customGrp =
      (rCfg.seatingConfig && rCfg.seatingConfig.groups && rCfg.seatingConfig.groups[grpKey]) ||
      (window.SEAT_GROUPS && window.SEAT_GROUPS[grpKey]);
    const zInfo = SEAT_ZONE_I18N[grpKey] || SEAT_ZONE_I18N.honored_guests;
    const groupDisplay = customGrp ? (customGrp.label || customGrp.short) : (isZh ? zInfo.zh : zInfo.vi);
    const customLabel = rCfg.tableLabel ? ` (${rCfg.tableLabel})` : "";
    const pax = Math.max(1, parseInt(params.get("pax") || rCfg.pax || "1", 10) || 1);

    if (badgeEl) {
      badgeEl.textContent = isZh ? "SEINE 宴會廳 • 您的專屬桌次" : "SẢNH SEINE • VỊ TRÍ BÀN CỦA BẠN";
    }
    if (heroHeadingEl) {
      heroHeadingEl.textContent = isZh ? `第 ${padded} 桌` : `Bàn ${padded}`;
    }
    if (guestLineEl) {
      guestLineEl.textContent = isZh
        ? `${displayGuest} 的席位`
        : `Kính mời ${displayGuest}`;
    }
    if (n1PeriodEl) {
      n1PeriodEl.textContent = isZh
        ? `席位分區 • 已預留 ${pax} 席位（10人圓桌）`
        : `Khu vực bàn tiệc • Đã xếp ${String(pax).padStart(2, "0")} ghế (Bàn 10 khách)`;
    }
    if (n1TitleEl) {
      n1TitleEl.textContent = groupDisplay + customLabel;
    }
    if (n1DescEl) {
      n1DescEl.textContent = isZh
        ? `第 ${padded} 桌，10席自由入座。`
        : `Bàn ${padded} • 10 ghế, ngồi tự do.`;
    }
    if (n2PeriodEl) {
      n2PeriodEl.textContent = isZh ? "迎賓入口動線指引" : "Hướng di chuyển từ cổng sảnh tầng trệt";
    }
    if (n2TitleEl) {
      n2TitleEl.textContent = isZh
        ? `${isLeftWing ? "舞台左側（單號區）" : "舞台右側（雙號區）"} • 第 ${rowNum} 排`
        : `${isLeftWing ? "Cánh Trái Sân Khấu" : "Cánh Phải Sân Khấu"} • Hàng Bàn Thứ ${rowNum}`;
    }
    if (n2DescEl) {
      n2DescEl.textContent = isZh
        ? `${isLeftWing ? "左側" : "右側"}第 ${rowNum} 排 → 第 ${padded} 桌。`
        : `${isLeftWing ? "Cánh trái" : "Cánh phải"}, hàng ${rowNum} → Bàn ${padded}.`;
    }

    const companions = Array.isArray(rCfg.tableGuests) ? rCfg.tableGuests : [];
    if (compLineEl) {
      if (companions.length > 0) {
        const namesStr = companions.map((c) => c.name).join(" · ");
        compLineEl.hidden = false;
        compLineEl.textContent = isZh
          ? `同桌親友：${namesStr}`
          : `Khách cùng Bàn ${padded}: ${namesStr}`;
      } else {
        compLineEl.hidden = true;
      }
    }

    if (chartNoteEl) {
      chartNoteEl.textContent = isZh ? `已標示：第 ${padded} 桌` : `Đang đánh dấu: Bàn ${padded}`;
    }
    if (svgWrapEl) {
      svgWrapEl.innerHTML = renderArchitecturalRoundTablesSvg(tNum, isZh);
    }
  }

  function syncPostWeddingAndAccessMode() {
    const cfg = window.WEDDING_CONFIG || {};
    const rCfg = remoteGuestConfig || {};
    const isPaused = cfg.isPublished === false || params.get("preview") === "paused";
    const pausedEl = document.getElementById("access-paused-overlay");
    if (pausedEl) {
      pausedEl.hidden = !isPaused;
    }

    const isZh = currentLang === "zh";
    const dict = I18N[currentLang];
    const displayGuest = guestName || dict.defaultGuest;

    syncGuestSeatingUI();

    // 1. Wedding-Day Priority Directions Mode (Elevates Map & Illustrated Route Guide to top of page)
    const isDirectionsPriority =
      cfg.directionsMode === true ||
      rCfg.directionsMode === true ||
      rCfg.mode === "directions" ||
      params.get("mode") === "directions" ||
      params.get("map") === "1";

    document.body.classList.toggle("is-directions-priority-mode", isDirectionsPriority);
    const dpbBanner = document.getElementById("directions-priority-banner");
    if (dpbBanner) {
      dpbBanner.hidden = !isDirectionsPriority;
      const dpbTitle = document.getElementById("dpb-guest-title");
      if (dpbTitle) {
        dpbTitle.textContent = isZh
          ? `誠摯歡迎 ${displayGuest} 蒞臨順祥 & 小瑩的婚禮晚宴！`
          : `Chào mừng ${displayGuest} đến chung vui cùng Thuận Tường & Tiểu Dinh!`;
      }
    }

    if (isDirectionsPriority && !envelopeOpened) {
      const stageEl = document.getElementById("envelope-stage");
      if (stageEl) {
        stageEl.classList.add("is-dismissed", "is-gone");
        stageEl.classList.remove("is-opening");
      }
      document.body.classList.remove("envelope-locked", "is-unsealing-env");
      envelopeOpened = true;
      const locSec = document.getElementById("section-location");
      if (locSec) {
        locSec.classList.remove("will-reveal");
        locSec.classList.add("is-visible");
      }
      const seatSec = document.getElementById("section-seating");
      if (seatSec) {
        seatSec.classList.remove("will-reveal");
        seatSec.classList.add("is-visible");
      }
      window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
      triggerScrollRevealCheck();
    }

    // 2. Post-Wedding Thank You Card & Google Drive Photo Album
    const isThankYou =
      cfg.thankYouMode === true ||
      rCfg.thankYouMode === true ||
      rCfg.mode === "thankyou" ||
      params.get("mode") === "thankyou" ||
      params.get("thankyou") === "1";
    const tySection = document.getElementById("thank-you-showcase");
    if (!tySection) return;
    tySection.hidden = !isThankYou;
    if (!isThankYou) return;

    const eyebrow = document.getElementById("ty-eyebrow");
    const heading = document.getElementById("ty-heading");
    const body = document.getElementById("ty-body");
    const driveWrap = document.getElementById("ty-drive-wrap");
    const driveBtn = document.getElementById("ty-drive-btn");
    const driveLabel = document.getElementById("ty-drive-label");
    const driveHint = document.getElementById("ty-drive-hint");

    if (eyebrow) {
      eyebrow.textContent = isZh
        ? "婚禮感謝卡 • THANK YOU & PHOTO GALLERY"
        : "THIỆP CẢM ƠN • THANK YOU & PHOTO GALLERY";
    }
    if (heading) {
      heading.textContent = isZh
        ? `誠摯感謝 ${displayGuest}`
        : `Trân trọng cảm ơn ${displayGuest}`;
    }
    if (body) {
      const rawVi =
        rCfg.thankYouVI ||
        cfg.thankYouMessageVI ||
        "Sự hiện diện, lời chúc phúc và tình cảm nồng ấm của Quý Khách trong ngày chung đôi 06.01.2027 là niềm vinh hạnh và món quà vô giá đối với gia đình chúng tôi. Thuận Tường & Tiểu Dinh xin gửi lời cảm ơn chân thành nhất, kính chúc Quý Khách cùng Gia đình luôn dồi dào sức khỏe, bình an và hạnh phúc!";
      const rawZh =
        rCfg.thankYouZH ||
        cfg.thankYouMessageZH ||
        "誠摯感謝您於 2027 年 1 月 6 日蒞臨參與我們的婚禮，您的祝福與陪伴是我們最珍貴的禮物。順祥 & 小瑩 謹致上最深切的謝意，敬祝 闔家平安、身體健康、萬事如意！";

      body.textContent = isZh
        ? rawZh.replace(/\{guest\}|\{ten\}|貴賓/gi, displayGuest)
        : rawVi.replace(/Quý\s+Khách|\{guest\}|\{ten\}/gi, displayGuest);
    }

    const driveUrl = (params.get("drive") || rCfg.driveUrl || cfg.googleDrivePhotoUrl || "").trim();
    if (driveWrap && driveBtn) {
      if (driveUrl) {
        driveWrap.style.display = "";
        driveBtn.href = driveUrl;
        if (driveLabel) {
          driveLabel.textContent = isZh
            ? "📸 點此瀏覽與下載婚禮現場相簿（Google 雲端硬碟）"
            : "📸 Xem & Tải Ảnh / Video Buổi Tiệc (Google Drive)";
        }
        if (driveHint) {
          driveHint.textContent = isZh
            ? "點擊上方按鈕即可開啟 Google Drive 婚禮高畫質照片與精彩紀錄"
            : "Bấm vào nút trên để mở kho ảnh & video kỷ niệm ngày cưới trên Google Drive";
        }
      } else {
        driveWrap.style.display = "none";
      }
    }
  }

  /* 4. Apply Language (VI / 台灣繁體中文) & Reorder Cards Smoothly */
  function applyLanguage(lang) {
    currentLang = lang === "zh" ? "zh" : "vi";
    document.body.classList.toggle("lang-zh", currentLang === "zh");
    document.documentElement.lang = currentLang === "zh" ? "zh-TW" : "vi";

    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.lang === currentLang);
    });

    const dict = I18N[currentLang];
    if (dict.docTitle) {
      document.title = dict.docTitle;
    }

    const musicBtn = document.getElementById("music-toggle");
    if (musicBtn && dict.musicAria) {
      musicBtn.setAttribute("aria-label", dict.musicAria);
      musicBtn.setAttribute("title", dict.musicAria);
    }

    const env3d = document.getElementById("envelope-3d");
    if (env3d && dict.envAria) {
      env3d.setAttribute("aria-label", dict.envAria);
    }

    const mapIframe = document.getElementById("venue-map-iframe");
    if (mapIframe && dict.mapTitle) {
      mapIframe.setAttribute("title", dict.mapTitle);
    }

    const scrollCueEl = document.getElementById("scroll-invite-cue");
    if (scrollCueEl && dict.scrollCue) {
      scrollCueEl.setAttribute("aria-label", dict.scrollCue);
    }

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      if (dict[key] !== undefined) {
        let text = dict[key];
        if (guestName && currentLang === "vi") {
          text = text.replace(/Quý\s+Khách/gi, guestName);
        }
        el.textContent = text;
      }
    });

    updateGuestNameDisplay();
    renderJan2027Calendar();
    updateGoogleCalendarLink();
    syncPulloutCardPreview();
    syncPostWeddingAndAccessMode();
    requestAnimationFrame(() => {
      fitAllGuestNames();
      if (syncTopbarNavUI) syncTopbarNavUI();
      if (envelopeOpened) triggerScrollRevealCheck();
    });
  }

  /* 5. Pure 2-Tap & Swipe Tactile Envelope Ritual:
        Tap / Swipe 1 (Front) -> 120fps 3D Lift, Gilded Edge Turn, Specular Sheen & Velvet Landing on Back
        Tap / Swipe-Up 2 (Back / Wax Seal) -> Break Wax Seal, Hinge Top Flap & Pull Card Out of V-Pocket */
  function setupEnvelopeInteractions() {
    const stage = document.getElementById("envelope-stage");
    const env3d = document.getElementById("envelope-3d");
    const flapStage = document.getElementById("env-flap-stage");
    const topFlap = document.getElementById("env-top-flap");
    const waxSeal = document.getElementById("env-wax-seal");
    const pulloutCard = document.getElementById("env-pullout-card");
    const touchCue = document.getElementById("env-touch-cue");
    const btnReplayEnv = document.getElementById("nav-replay-envelope");
    const musicBtn = document.getElementById("music-toggle");
    const scrollCueBtn = document.getElementById("scroll-invite-cue");

    let isFlipping = false;
    let flipStartedAt = 0;
    let flipTimer = null;
    let handoffTimers = [];
    let lastGestureAt = 0;

    function queueHandoff(fn, delayMs) {
      const id = setTimeout(fn, delayMs);
      handoffTimers.push(id);
      return id;
    }

    function clearHandoffState() {
      handoffTimers.forEach((id) => clearTimeout(id));
      handoffTimers = [];
      const existingFly = document.getElementById("hero-flying-card");
      if (existingFly) existingFly.remove();
      document.querySelectorAll(".stationery-card.is-handoff-target").forEach((c) => {
        c.classList.remove("is-handoff-target");
      });
      if (pulloutCard) pulloutCard.classList.remove("is-handed-off");
      document.body.classList.remove("is-unsealing-env", "is-table-preparing", "is-table-cascading");
    }

    function spawnWaxSealSparkles(anchorEl) {
      let cx = window.innerWidth / 2;
      let cy = window.innerHeight / 2;
      if (anchorEl) {
        const r = anchorEl.getBoundingClientRect();
        if (r.width > 0) {
          cx = r.left + r.width / 2;
          cy = r.top + r.height / 2;
        }
      }
      const glyphs = ["", "", "✦", "", "✧", "", "囍", "", "✦", "", "", "✧", "", "✦"];
      for (let i = 0; i < glyphs.length; i++) {
        const g = glyphs[i];
        const el = document.createElement("span");
        el.className = g ? "seal-sparkle-mote" : "seal-sparkle-mote is-orb";
        if (g) el.textContent = g;
        const angle = (Math.PI * 2 * i) / glyphs.length + (Math.random() * 0.28 - 0.14);
        const dist = 42 + Math.random() * 54;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist - 18;
        const x0 = (cx + Math.cos(angle) * 10).toFixed(1) + "px";
        const y0 = (cy + Math.sin(angle) * 10).toFixed(1) + "px";
        const x1 = (cx + dx).toFixed(1) + "px";
        const y1 = (cy + dy).toFixed(1) + "px";
        el.style.setProperty("--x0", x0);
        el.style.setProperty("--y0", y0);
        el.style.setProperty("--x1", x1);
        el.style.setProperty("--y1", y1);
        el.style.setProperty("--sz", g ? (g === "囍" ? "13px" : "12px") : (5 + (i % 3) * 2) + "px");
        el.style.setProperty("--dur", (1.18 + (i % 4) * 0.12).toFixed(2) + "s");
        el.style.setProperty("--rot", ((i % 2 === 0 ? 1 : -1) * (20 + i * 3)) + "deg");
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1750);
      }
    }

    function buildFlyingHeroCard(targetCard) {
      const fly = document.createElement("div");
      fly.id = "hero-flying-card";
      fly.className = "stationery-card hero-flying-card is-revealed-done";
      fly.setAttribute("aria-hidden", "true");
      // Rewrite internal SVG <defs> IDs & DOM IDs so zero duplicate ID collision occurs during flight
      fly.innerHTML =
        targetCard.innerHTML
          .replace(/id="card1-guest-name"/g, 'id="fly-card1-guest-name"')
          .replace(/id="svg-card-[123]"/g, "")
          .replace(/\bc1_/g, "fly1_")
          .replace(/\bc3_/g, "fly3_") +
        '<div class="flying-card-sheen" aria-hidden="true"></div>';
      return fly;
    }

    if (scrollCueBtn) {
      scrollCueBtn.addEventListener("click", () => {
        scrollCueBtn.classList.remove("is-visible");
        const nextSelector =
          currentLang === "zh" ? "#card-wrap-reception" : "#card-wrap-ceremony";
        const nextBlock = document.querySelector(nextSelector);
        if (nextBlock) {
          nextBlock.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.scrollBy({ top: Math.round(window.innerHeight * 0.78), behavior: "smooth" });
        }
      });

      window.addEventListener(
        "scroll",
        () => {
          if (window.scrollY > 65 && scrollCueBtn.classList.contains("is-visible")) {
            scrollCueBtn.classList.remove("is-visible");
          }
        },
        { passive: true }
      );
    }

    if (envelopeOpened) {
      document.body.classList.remove("envelope-locked");
      if (stage) stage.classList.add("is-dismissed", "is-gone");
    } else {
      document.body.classList.add("envelope-locked");
      const dbg = params.get("debug_env");
      if (
        dbg === "flipped" ||
        dbg === "pullout" ||
        dbg === "flap_lifting" ||
        dbg === "flap_opened" ||
        dbg === "card_rising" ||
        dbg === "expanding" ||
        dbg === "landed"
      ) {
        envelopeFlipped = true;
        if (stage) stage.classList.add("is-flipped", "is-back-ready");
      }
      if (dbg === "flap_lifting" && stage && topFlap) {
        const liftRig = stage.querySelector(".envelope-lift-rig");
        if (liftRig) liftRig.style.transition = "none";
        document.body.classList.add("is-unsealing-env");
        stage.classList.add("is-opening");
        topFlap.style.transition = "none";
        topFlap.style.transform = "rotateX(54deg)";
        if (pulloutCard) {
          pulloutCard.style.transition = "none";
          pulloutCard.style.transform = "translate3d(0, 0%, 0) scale3d(0.985, 0.985, 1)";
        }
      } else if (dbg === "flap_opened" && stage && topFlap) {
        const liftRig = stage.querySelector(".envelope-lift-rig");
        const flapShadow = stage.querySelector(".env-top-flap-shadow");
        if (liftRig) liftRig.style.transition = "none";
        if (flapShadow) flapShadow.style.transition = "none";
        document.body.classList.add("is-unsealing-env");
        stage.classList.add("is-opening");
        topFlap.style.transition = "none";
        topFlap.style.transform = "rotateX(174deg)";
        if (flapStage) flapStage.classList.add("is-behind");
        if (pulloutCard) {
          pulloutCard.style.transition = "none";
          pulloutCard.style.transform = "translate3d(0, 0%, 0) scale3d(0.985, 0.985, 1)";
        }
      } else if (dbg === "card_rising" && stage && topFlap) {
        const liftRig = stage.querySelector(".envelope-lift-rig");
        const flapShadow = stage.querySelector(".env-top-flap-shadow");
        if (liftRig) liftRig.style.transition = "none";
        if (flapShadow) flapShadow.style.transition = "none";
        document.body.classList.add("is-unsealing-env");
        stage.classList.add("is-opening");
        topFlap.style.transition = "none";
        topFlap.style.transform = "rotateX(174deg)";
        if (flapStage) flapStage.classList.add("is-behind");
        if (pulloutCard) {
          pulloutCard.style.transition = "none";
          pulloutCard.style.transform = "translate3d(0, -54%, 0) scale3d(1, 1, 1)";
        }
      } else if (dbg === "pullout" && stage) {
        document.body.classList.add("is-unsealing-env");
        stage.classList.add("is-opening");
        if (flapStage) flapStage.classList.add("is-behind");
      }
      if (dbg === "expanding" || dbg === "landed") {
        setTimeout(() => unsealAndPullOut(), 60);
      }
      // Also support ?debug_flip_pct=36.05 for headless mid-flip frame inspection
      const dbgPct = parseFloat(params.get("debug_flip_pct"));
      if (!Number.isNaN(dbgPct) && stage) {
        envelopeFlipped = true;
        const delaySec = -(Math.max(0, Math.min(100, dbgPct)) / 100) * 1.08;
        stage.classList.add("is-flipping-to-back");
        stage.querySelectorAll("*").forEach((el) => {
          el.style.animationPlayState = "paused";
          el.style.animationDelay = delaySec.toFixed(4) + "s";
        });
      }
    }

    function clearFlipTimer() {
      if (flipTimer) {
        clearTimeout(flipTimer);
        flipTimer = null;
      }
    }

    function flipToBack(dir = -1) {
      if (!stage || isFlipping || stage.classList.contains("is-opening")) return;
      clearFlipTimer();
      isFlipping = true;
      flipStartedAt = Date.now();
      envelopeFlipped = true;
      trackGuestActivity("flip_back");

      stage.style.setProperty("--flip-dir", String(dir >= 0 ? 1 : -1));
      stage.classList.remove(
        "is-pressing",
        "is-flipping-to-front",
        "is-flipped",
        "is-back-ready"
      );
      if (env3d) void env3d.offsetWidth;
      stage.classList.add("is-flipping-to-back");

      flipTimer = setTimeout(() => {
        isFlipping = false;
        if (envelopeFlipped && !stage.classList.contains("is-opening")) {
          stage.classList.add("is-flipped", "is-back-ready");
          stage.classList.remove("is-flipping-to-back");
        }
      }, 1090);
    }

    function flipToFront(dirOverride) {
      if (!stage || isFlipping || stage.classList.contains("is-opening")) return;
      clearFlipTimer();
      isFlipping = true;
      flipStartedAt = Date.now();
      envelopeFlipped = false;

      if (typeof dirOverride === "number") {
        stage.style.setProperty("--flip-dir", String(dirOverride >= 0 ? 1 : -1));
      }
      stage.classList.remove(
        "is-pressing",
        "is-flipping-to-back",
        "is-flipped",
        "is-back-ready"
      );
      if (env3d) void env3d.offsetWidth;
      stage.classList.add("is-flipping-to-front");

      flipTimer = setTimeout(() => {
        isFlipping = false;
        if (!envelopeFlipped && !stage.classList.contains("is-opening")) {
          stage.classList.remove("is-flipping-to-front");
        }
      }, 1090);
    }

    function unsealAndPullOut() {
      if (!stage || stage.classList.contains("is-opening")) return;
      clearFlipTimer();
      clearHandoffState();
      isFlipping = false;
      trackGuestActivity("open_envelope");

      const prefersReducedMotion =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Beat 1 (0ms): Lock back face, glide topbar clear, burst champagne-gold wax sparkles & hinge open 3D flap + wax seal
      document.body.classList.add("is-unsealing-env");
      stage.classList.remove("is-pressing", "is-flipping-to-back", "is-flipping-to-front");
      stage.classList.add("is-flipped", "is-back-ready");
      if (env3d) void env3d.offsetWidth;
      stage.classList.add("is-opening");
      if (!prefersReducedMotion) {
        spawnWaxSealSparkles(waxSeal);
      }

      if (window.weddingMusic) {
        window.weddingMusic.startFromGesture();
      }

      // Beat 2 (722ms): Analytical 90.0° vertical crossing of 1.65s cubic-bezier(0.48, 0.06, 0.36, 1) -> tuck flap stage behind rising card layer
      queueHandoff(() => {
        if (flapStage) flapStage.classList.add("is-behind");
      }, 722);

      if (prefersReducedMotion) {
        queueHandoff(() => {
          stage.classList.add("is-dismissed", "is-gone");
          stage.classList.remove("is-opening");
          document.body.classList.remove("envelope-locked", "is-unsealing-env");
          envelopeOpened = true;
          window.scrollTo(0, 0);
          triggerScrollRevealCheck();
          if (triggerWelcomeGreetingIfReady) {
            setTimeout(() => triggerWelcomeGreetingIfReady(), 160);
          }
        }, 420);
        return;
      }

      // Beat 3 (3420ms): After flap + wax seal slowly unfold (0..1650ms) AND inner card glides out of pocket (1620..3260ms) + brief poised breath, seamless FLIP handoff onto table!
      queueHandoff(() => {
        const fromRect = pulloutCard ? pulloutCard.getBoundingClientRect() : null;

        // Unlock scroll layout underneath at scrollTop=0 so target card assumes its true resting geometry
        document.body.classList.add("is-table-preparing");
        document.body.classList.remove("envelope-locked", "is-unsealing-env");
        envelopeOpened = true;
        window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });

        const firstBlockId =
          currentLang === "zh" ? "card-wrap-chinese" : "card-wrap-reception";
        const firstBlock = document.getElementById(firstBlockId);
        const firstCard = firstBlock ? firstBlock.querySelector(".stationery-card") : null;

        if (!fromRect || !firstCard || fromRect.width < 20) {
          // Graceful fallback if measurements unavailable
          stage.classList.add("is-curtain-bloom", "is-dismissed");
          document.body.classList.remove("is-table-preparing");
          triggerScrollRevealCheck();
          queueHandoff(() => {
            stage.classList.add("is-gone");
            stage.classList.remove("is-opening", "is-curtain-bloom");
          }, 1100);
          return;
        }

        // Freeze firstCard at exact resting geometry (opacity: 0, transform: none) for 0.0px FLIP measurement
        firstCard.classList.add("is-handoff-target");
        const toRect = firstCard.getBoundingClientRect();

        const flyingCard = buildFlyingHeroCard(firstCard);
        flyingCard.style.left = toRect.left.toFixed(2) + "px";
        flyingCard.style.top = toRect.top.toFixed(2) + "px";
        flyingCard.style.width = toRect.width.toFixed(2) + "px";
        flyingCard.style.height = toRect.height.toFixed(2) + "px";

        const s = fromRect.width / toRect.width;
        const cxTo = toRect.left + toRect.width / 2;
        const cyTo = toRect.top + toRect.height / 2;
        const dx = fromRect.left + fromRect.width / 2 - cxTo;
        // Uniform portrait scale aligned cleanly to fromRect.top (zero vertical squish!)
        const dy = fromRect.top + (toRect.height * s) / 2 - cyTo;
        const fullScaledH = Math.max(1, toRect.height * s);
        const hiddenBottomPct = Math.max(
          0,
          Math.min(54, ((fullScaledH - fromRect.height) / fullScaledH) * 100)
        );

        const startTransform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale3d(${s.toFixed(4)}, ${s.toFixed(4)}, 1) rotate(0deg)`;
        const midArcY = Math.min(dy * 0.2 - 14, -14);
        const midTransform = `translate3d(${(dx * 0.2).toFixed(2)}px, ${midArcY.toFixed(2)}px, 0) scale3d(1.02, 1.02, 1) rotate(-0.6deg)`;
        const endTransform = "translate3d(0px, 0px, 0) scale3d(1, 1, 1) rotate(0deg)";

        flyingCard.style.transform = startTransform;
        document.body.appendChild(flyingCard);

        // Simultaneously hide pocket preview card, slip burgundy envelope downward & bloom sunlit champagne curtain
        if (pulloutCard) pulloutCard.classList.add("is-handed-off");
        stage.classList.add("is-pulling-free", "is-curtain-bloom");

        if (typeof flyingCard.animate === "function") {
          const anim = flyingCard.animate(
            [
              {
                transform: startTransform,
                clipPath: `inset(0% 0% ${hiddenBottomPct.toFixed(1)}% 0% round 6px)`,
                offset: 0
              },
              {
                transform: midTransform,
                clipPath: "inset(0% 0% 0% 0% round 6px)",
                offset: 0.44
              },
              {
                transform: endTransform,
                clipPath: "inset(0% 0% 0% 0% round 6px)",
                offset: 1
              }
            ],
            {
              duration: 1360,
              easing: "cubic-bezier(0.25, 0.92, 0.34, 1)",
              fill: "forwards"
            }
          );
          if (params.get("debug_env") === "expanding") {
            setTimeout(() => anim.pause(), 560);
            return;
          }
        } else {
          void flyingCard.offsetWidth;
          flyingCard.style.transition = "transform 1.36s cubic-bezier(0.25, 0.92, 0.34, 1)";
          flyingCard.style.transform = endTransform;
        }

        // Beat 4a (+720ms into flight): Cascade in top navigation, header prelude, card caption & interactive hint
        queueHandoff(() => {
          flyingCard.classList.add("is-settling");
          document.body.classList.add("is-table-cascading");
          if (syncTopbarNavUI) syncTopbarNavUI();
        }, 720);

        // Beat 4b (+1370ms, exact landing on toRect): Seamless 0.0px handoff to real scrollable card + show scroll cue
        queueHandoff(() => {
          firstCard.classList.remove("will-reveal", "is-handoff-target");
          firstCard.classList.add("is-visible", "is-revealed-done");
          revealCard(firstCard);
          triggerScrollRevealCheck();

          flyingCard.classList.add("is-fading-handoff");
          if (scrollCueBtn && window.scrollY < 60) {
            scrollCueBtn.classList.add("is-visible");
          }
        }, 1370);

        // Cleanup temporary overlay layers once full table cascade completes
        queueHandoff(() => {
          flyingCard.remove();
          stage.classList.add("is-dismissed", "is-gone");
          stage.classList.remove("is-opening", "is-pulling-free", "is-curtain-bloom");
          if (pulloutCard) pulloutCard.classList.remove("is-handed-off");
          document.body.classList.remove("is-table-preparing", "is-table-cascading");
          if (triggerWelcomeGreetingIfReady) {
            setTimeout(() => triggerWelcomeGreetingIfReady(), 120);
          }
        }, 1820);
      }, 3420);
    }

    if (env3d && stage) {
      let ptrActive = false;
      let startX = 0;
      let startY = 0;

      env3d.addEventListener("pointerdown", (e) => {
        if (stage.classList.contains("is-opening")) return;
        ptrActive = true;
        startX = e.clientX;
        startY = e.clientY;
        if (!isFlipping) {
          stage.classList.add("is-pressing");
        }
      });

      const releasePress = () => {
        ptrActive = false;
        stage.classList.remove("is-pressing");
      };

      env3d.addEventListener("pointercancel", releasePress);
      env3d.addEventListener("pointerleave", () => {
        stage.classList.remove("is-pressing");
      });

      // Synchronous iOS Safari / LINE / Zalo / Android gesture unlock on first touch
      env3d.addEventListener(
        "touchend",
        () => {
          if (window.weddingMusic) window.weddingMusic.startFromGesture();
        },
        { passive: true }
      );

      env3d.addEventListener("pointerup", (e) => {
        if (window.weddingMusic) window.weddingMusic.startFromGesture();
        stage.classList.remove("is-pressing");
        if (!ptrActive) return;
        ptrActive = false;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        // Horizontal swipe -> directional 3D flip!
        if (Math.abs(dx) >= 24 && Math.abs(dx) > Math.abs(dy) * 1.15) {
          lastGestureAt = Date.now();
          const swipeDir = dx > 0 ? 1 : -1;
          if (!envelopeFlipped) {
            flipToBack(swipeDir);
          } else if (!isFlipping) {
            // Reverse along the swipe direction
            flipToFront(-swipeDir);
          }
          return;
        }

        // Upward swipe -> flip on Front face, or unseal & pull card upward out of pocket on Back face!
        if (dy <= -26 && Math.abs(dy) > Math.abs(dx)) {
          lastGestureAt = Date.now();
          if (!envelopeFlipped) {
            flipToBack(-1);
          } else if (!isFlipping || Date.now() - flipStartedAt >= 660) {
            unsealAndPullOut();
          }
          return;
        }

        // Direct touch tap (< 24px movement) -> eliminates 10px-24px mobile WebKit click-suppression dead zone
        if (e.pointerType === "touch" && Math.hypot(dx, dy) < 24) {
          lastGestureAt = Date.now();
          if (!envelopeFlipped) {
            flipToBack(-1);
          } else if (!isFlipping || Date.now() - flipStartedAt >= 660) {
            unsealAndPullOut();
          }
        }
      });

      env3d.addEventListener("click", () => {
        if (window.weddingMusic) window.weddingMusic.startFromGesture();
        if (Date.now() - lastGestureAt < 380) return;
        if (!envelopeFlipped) {
          flipToBack(-1);
        } else {
          // Guard against accidental double-tap during first 660ms of flip
          if (isFlipping && Date.now() - flipStartedAt < 660) return;
          unsealAndPullOut();
        }
      });

      env3d.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (window.weddingMusic) window.weddingMusic.startFromGesture();
          if (!envelopeFlipped) flipToBack(-1);
          else if (!isFlipping || Date.now() - flipStartedAt >= 660) unsealAndPullOut();
        }
      });
    }

    if (touchCue) {
      touchCue.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isFlipping) return;
        if (!envelopeFlipped) {
          flipToBack(-1);
        } else {
          flipToFront();
        }
      });
    }

    if (btnReplayEnv) {
      btnReplayEnv.addEventListener("click", (e) => {
        e.preventDefault();
        if (!stage) return;
        clearFlipTimer();
        clearHandoffState();
        isFlipping = false;
        envelopeFlipped = false;
        envelopeOpened = false;
        hasPlayedWelcomeGreeting = false;
        document.querySelectorAll(".card-svg-stage").forEach((s) => {
          delete s.dataset.entrancePlayed;
          s.classList.remove("is-playing-entrance");
          if (s.id === "svg-card-2" || s.id === "svg-card-3") {
            s.classList.add("is-awaiting-entrance");
          }
        });
        document.querySelectorAll(".stationery-card").forEach((c) => {
          delete c.dataset.revealed;
        });
        const cdSec = document.getElementById("section-countdown");
        if (cdSec) {
          delete cdSec.dataset.entrancePlayed;
          cdSec.classList.remove("is-playing-entrance");
          cdSec.classList.add("is-awaiting-entrance");
        }
        const locSec = document.getElementById("section-location");
        if (locSec) {
          delete locSec.dataset.entrancePlayed;
          locSec.classList.remove("is-playing-entrance");
          locSec.classList.add("is-awaiting-entrance");
        }
        const imapSec = document.getElementById("illustrated-map-section");
        if (imapSec) {
          delete imapSec.dataset.entrancePlayed;
          imapSec.classList.remove("is-playing-map-entrance");
          imapSec.classList.add("is-awaiting-map-entrance");
        }
        if (scrollCueBtn) scrollCueBtn.classList.remove("is-visible");
        if (flapStage) flapStage.classList.remove("is-behind");
        if (topFlap) topFlap.classList.remove("is-behind");
        stage.classList.remove(
          "is-gone",
          "is-opening",
          "is-pulling-free",
          "is-curtain-bloom",
          "is-pressing",
          "is-flipping-to-back",
          "is-flipping-to-front",
          "is-flipped",
          "is-back-ready"
        );
        void stage.offsetWidth;
        stage.classList.remove("is-dismissed");
        window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
        document.body.classList.add("envelope-locked");
        if (syncTopbarNavUI) syncTopbarNavUI();
        requestAnimationFrame(fitAllGuestNames);
      });
    }

    if (musicBtn) {
      musicBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!window.weddingMusic) return;
        const playing = window.weddingMusic.toggleFromGesture();
        musicBtn.classList.toggle("is-playing", playing);
      });
    }

    // Fallback first-touch unlock if visitor entered via ?open=1 (skipping envelope)
    const unlockOnce = (e) => {
      if (e.target && e.target.closest && e.target.closest("#music-toggle")) return;
      if (window.weddingMusic) window.weddingMusic.startFromGesture();
      document.removeEventListener("touchend", unlockOnce);
      document.removeEventListener("click", unlockOnce);
    };
    document.addEventListener("touchend", unlockOnce, { passive: true });
    document.addEventListener("click", unlockOnce, { passive: true });
  }

  /* 6. Scroll Reveal Observer for Stationery Cards & First-Open Artwork Entrance Choreography */
  let cardObserver = null;
  function revealCard(card) {
    if (!card) return;
    const svgStage = card.querySelector(".card-svg-stage");
    if (svgStage && !svgStage.dataset.entrancePlayed) {
      svgStage.dataset.entrancePlayed = "1";
      svgStage.classList.remove("is-awaiting-entrance");
      svgStage.classList.add("is-playing-entrance");

      // When Card 3 (Chinese Traditional Card) Crane finishes its unhurried 3.5s glide, release auspicious hearts!
      if (svgStage.id === "svg-card-3") {
        setTimeout(() => {
          const craneEl = svgStage.querySelector(".c3-crane");
          if (craneEl) {
            spawnGuestHearts(craneEl, null, 8);
          }
        }, 3550);
      }
    }
    if (card.dataset.revealed === "1") return;
    card.dataset.revealed = "1";
    card.classList.add("is-visible");
    setTimeout(() => {
      card.classList.remove("will-reveal");
      card.classList.add("is-revealed-done");
    }, 4200);
  }

  function setupScrollReveal() {
    const cards = document.querySelectorAll(".stationery-card");
    const svg2 = document.getElementById("svg-card-2");
    const svg3 = document.getElementById("svg-card-3");
    if (svg2) svg2.classList.add("is-awaiting-entrance");
    if (svg3) svg3.classList.add("is-awaiting-entrance");

    if (!("IntersectionObserver" in window)) {
      cards.forEach((c) => {
        c.classList.add("is-visible", "is-revealed-done");
      });
      return;
    }
    cards.forEach((c) => c.classList.add("will-reveal"));
    cardObserver = new IntersectionObserver(
      (entries) => {
        if (!envelopeOpened || document.body.classList.contains("is-table-preparing")) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealCard(entry.target);
          }
        });
      },
      { threshold: 0.28 }
    );
    cards.forEach((c) => cardObserver.observe(c));
    window.addEventListener("scroll", triggerScrollRevealCheck, { passive: true });
  }

  /* 6b. Card 2 Quiet-Luxury Fountain-Pen Handwriting, Hot-Foil Glint & Editorial Epigraph
         (Zero pushy prompts, zero translation — draws the eye naturally through living ink & foil) */
  function setupCard2BorderSecret() {
    const card2 = document.getElementById("card-2-article");
    const secretWrap = document.getElementById("c2-border-secret");
    const whisperBtn = document.getElementById("c2-border-whisper-btn");
    const reader = document.getElementById("c2-border-reader");
    const copyEnBtn = document.getElementById("btn-copy-border-en");
    const copyLabel = document.getElementById("c2-copy-label");
    const closeEnBtn = document.getElementById("btn-close-border-en");
    const foldSigBtn = document.getElementById("btn-fold-sig");
    if (!card2 || !secretWrap || !whisperBtn || !reader) return;

    const EDGES = ["top", "right", "bottom", "left"];
    const lineEls = Array.from(reader.querySelectorAll(".c2-verse-line"));
    const hitEls = Array.from(card2.querySelectorAll(".c2-edge-hit"));
    const reducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let penStarted = false;
    let penTimer = null;
    let activeEdge = "top";
    let tourInterval = null;
    let manualPauseUntil = 0;
    let copyResetTimer = null;

    function finishPenImmediately() {
      penStarted = true;
      if (penTimer) {
        clearTimeout(penTimer);
        penTimer = null;
      }
      card2.classList.remove("is-awaiting-pen", "is-writing-pen");
      card2.classList.add("is-pen-done");
    }

    function startPenWrite() {
      if (penStarted) return;
      penStarted = true;
      if (reducedMotion) {
        finishPenImmediately();
        return;
      }
      card2.classList.remove("is-awaiting-pen");
      card2.classList.add("is-writing-pen");
      penTimer = setTimeout(() => {
        card2.classList.remove("is-writing-pen");
        card2.classList.add("is-pen-done");
      }, 3680);
    }

    if (reducedMotion || !("IntersectionObserver" in window)) {
      finishPenImmediately();
      card2.classList.add("is-in-view");
    } else {
      card2.classList.add("is-awaiting-pen");
      const penObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            card2.classList.toggle("is-in-view", entry.isIntersecting);
            if (
              envelopeOpened &&
              !document.body.classList.contains("is-table-preparing") &&
              entry.isIntersecting &&
              entry.intersectionRatio >= 0.25
            ) {
              startPenWrite();
            }
          });
        },
        { threshold: [0.05, 0.25] }
      );
      penObserver.observe(card2);
      window.addEventListener(
        "scroll",
        () => {
          if (
            !penStarted &&
            envelopeOpened &&
            !document.body.classList.contains("is-table-preparing")
          ) {
            const r = card2.getBoundingClientRect();
            const vh = window.innerHeight || 800;
            if (r.top < vh * 0.72 && r.bottom > vh * 0.25) {
              startPenWrite();
            }
          }
        },
        { passive: true }
      );
    }

    function focusEdge(edge, pauseMs) {
      if (!EDGES.includes(edge)) edge = "top";
      activeEdge = edge;
      finishPenImmediately();
      card2.classList.remove("will-reveal");
      card2.classList.add("is-visible", "is-revealed-done");
      card2.dataset.revealed = "1";
      card2.dataset.focusEdge = edge;

      lineEls.forEach((p) => {
        p.classList.toggle("is-active", p.dataset.edge === edge);
      });

      if (pauseMs && pauseMs > 0) {
        manualPauseUntil = Date.now() + pauseMs;
      }
    }

    function startClockwiseTour() {
      stopClockwiseTour();
      if (reducedMotion) return;
      tourInterval = setInterval(() => {
        if (Date.now() < manualPauseUntil) return;
        const idx = EDGES.indexOf(activeEdge);
        const nextEdge = EDGES[(idx + 1) % EDGES.length];
        focusEdge(nextEdge, 0);
      }, 3800);
    }

    function stopClockwiseTour() {
      if (tourInterval) {
        clearInterval(tourInterval);
        tourInterval = null;
      }
    }

    function openReader(initialEdge, isManualPick) {
      secretWrap.classList.add("is-open");
      reader.hidden = false;
      whisperBtn.setAttribute("aria-expanded", "true");
      focusEdge(initialEdge || "top", isManualPick ? 10000 : 0);
      startClockwiseTour();
    }

    function closeReader() {
      secretWrap.classList.remove("is-open");
      reader.hidden = true;
      whisperBtn.setAttribute("aria-expanded", "false");
      stopClockwiseTour();
      manualPauseUntil = 0;
      delete card2.dataset.focusEdge;
    }

    whisperBtn.addEventListener("click", () => {
      openReader("top", false);
    });

    if (closeEnBtn) closeEnBtn.addEventListener("click", closeReader);
    if (foldSigBtn) foldSigBtn.addEventListener("click", closeReader);

    hitEls.forEach((hit) => {
      hit.addEventListener("click", (e) => {
        e.stopPropagation();
        const edge = hit.dataset.edge || "top";
        if (!secretWrap.classList.contains("is-open")) {
          openReader(edge, true);
          requestAnimationFrame(() => {
            if (reader.scrollIntoView) {
              reader.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
          });
        } else {
          focusEdge(edge, 10000);
        }
      });
    });

    lineEls.forEach((p) => {
      p.addEventListener("click", () => {
        focusEdge(p.dataset.edge || "top", 10000);
      });
    });

    if (copyEnBtn) {
      copyEnBtn.addEventListener("click", async () => {
        const originalEn =
          "“We began as classmates in high school and became each other’s love. " +
          "We grew together, understood each other, and found happiness in our relationship. " +
          "Despite many arguments and challenges, we made it through that chapter. " +
          "After seven and a half years, our story continues — now as husband and wife.” — T&D";
        try {
          await navigator.clipboard.writeText(originalEn);
        } catch (_) {
          const ta = document.createElement("textarea");
          ta.value = originalEn;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        if (copyLabel) {
          copyLabel.textContent = "Copied";
          if (copyResetTimer) clearTimeout(copyResetTimer);
          copyResetTimer = setTimeout(() => {
            copyLabel.textContent = "Copy";
          }, 2400);
        }
      });
    }

    const debugBorder = params.get("debug_border");
    if (debugBorder === "done") {
      finishPenImmediately();
    } else if (debugBorder) {
      const requestedEdge = EDGES.includes(debugBorder) ? debugBorder : "top";
      openReader(requestedEdge, true);
    }
  }

  let checkAct3UtilitiesEntrance = null;

  function triggerScrollRevealCheck() {
    if (!envelopeOpened || document.body.classList.contains("is-table-preparing")) return;
    const vh = window.innerHeight || 900;
    document.querySelectorAll(".stationery-card").forEach((card) => {
      const rect = card.getBoundingClientRect();
      if (rect.top < vh * 0.68 && rect.bottom > 60) {
        revealCard(card);
      }
    });
    if (checkAct3UtilitiesEntrance) {
      checkAct3UtilitiesEntrance();
    }
  }

  /* 7. Countdown Timer & Keepsake January 2027 Calendar + .ics / Google Calendar */
  function setupCountdownAndCalendar() {
    const targetTime = new Date(CFG.weddingDateISO || "2027-01-06T18:00:00+07:00").getTime();
    const elD = document.getElementById("cd-days");
    const elH = document.getElementById("cd-hours");
    const elM = document.getElementById("cd-mins");
    const elS = document.getElementById("cd-secs");
    let isRollingUpCountdown = false;

    function getRemainingParts() {
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);
      return {
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000)
      };
    }

    function tick() {
      if (isRollingUpCountdown) return;
      const { d, h, m, s } = getRemainingParts();
      if (elD) elD.textContent = String(d).padStart(2, "0");
      if (elH) elH.textContent = String(h).padStart(2, "0");
      if (elM) elM.textContent = String(m).padStart(2, "0");
      if (elS) elS.textContent = String(s).padStart(2, "0");
    }
    tick();
    setInterval(tick, 1000);

    function runCountdownSlotRollUp() {
      const prefersReducedMotion =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) {
        tick();
        return;
      }
      isRollingUpCountdown = true;
      const target = getRemainingParts();
      const duration = 1220;
      const startTs = performance.now();

      function stepRoll(nowTs) {
        const t = Math.min(1, (nowTs - startTs) / duration);
        // Cubic ease-out for luxury horology slot-reel deceleration
        const eased = 1 - Math.pow(1 - t, 3);
        const curD = Math.round(target.d * eased);
        const curH = Math.round(target.h * eased);
        const curM = Math.round(target.m * eased);
        const curS = Math.round(target.s * eased);

        if (elD) elD.textContent = String(curD).padStart(2, "0");
        if (elH) elH.textContent = String(curH).padStart(2, "0");
        if (elM) elM.textContent = String(curM).padStart(2, "0");
        if (elS) elS.textContent = String(curS).padStart(2, "0");

        if (t < 1) {
          requestAnimationFrame(stepRoll);
        } else {
          isRollingUpCountdown = false;
          tick();
        }
      }
      requestAnimationFrame(stepRoll);
    }

    renderJan2027Calendar();
    updateGoogleCalendarLink();

    // One-Time Luxury Entrance Choreography for #section-countdown, #section-location & #illustrated-map-section
    const cdSec = document.getElementById("section-countdown");
    const locSec = document.getElementById("section-location");
    const imapSec = document.getElementById("illustrated-map-section");
    const imapLandmark = document.getElementById("imap-riverside-landmark");

    const reducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reducedMotion) {
      if (cdSec) cdSec.classList.add("is-awaiting-entrance");
      if (locSec) locSec.classList.add("is-awaiting-entrance");
      if (imapSec) imapSec.classList.add("is-awaiting-map-entrance");
    }

    function playCountdownSectionEntrance() {
      if (!cdSec || cdSec.dataset.entrancePlayed === "1") return;
      cdSec.dataset.entrancePlayed = "1";
      cdSec.classList.remove("is-awaiting-entrance");
      cdSec.classList.add("is-playing-entrance");
      runCountdownSlotRollUp();

      setTimeout(() => {
        const day6El = cdSec.querySelector(".cal-day.is-wedding-day");
        if (day6El) {
          triggerCalendarDay6Celebration(day6El, null);
        }
      }, 680);
    }

    function playLocationSectionEntrance() {
      if (!locSec || locSec.dataset.entrancePlayed === "1") return;
      locSec.dataset.entrancePlayed = "1";
      locSec.classList.remove("is-awaiting-entrance");
      locSec.classList.add("is-playing-entrance");

      setTimeout(() => {
        const eveningNode = locSec.querySelector(".timeline-node.is-evening");
        if (eveningNode) {
          spawnGuestHearts(eveningNode, null, 14);
        }
      }, 640);
    }

    function triggerRiversideLandmarkCelebration(ev) {
      const pinAnchor =
        document.getElementById("imap-riverside-pin-dot") || imapLandmark;
      if (!pinAnchor) return;
      const isZh = currentLang === "zh";
      const phrase = isZh
        ? {
            ornament: "囍",
            speaker: "Riverside Palace · Seine 宴會廳",
            words: "360D Bến Vân Đồn · 18:00 迎賓 · 19:00 開席 ♥"
          }
        : {
            ornament: "囍",
            speaker: "Riverside Palace · Sảnh Seine",
            words: "360D Bến Vân Đồn · Đón khách 18:00 · Khai tiệc 19:00 ♥"
          };
      spawnFloatingWhisper(pinAnchor, ev || null, phrase, true, 4.4);
      spawnGuestHearts(pinAnchor, ev || null, 20);
    }

    function playIllustratedMapEntrance() {
      if (!imapSec || imapSec.dataset.entrancePlayed === "1") return;
      imapSec.dataset.entrancePlayed = "1";
      imapSec.classList.remove("is-awaiting-map-entrance");
      imapSec.classList.add("is-playing-map-entrance");

      setTimeout(() => {
        triggerRiversideLandmarkCelebration(null);
      }, 660);
    }

    if (imapLandmark) {
      imapLandmark.addEventListener("click", (e) => {
        e.stopPropagation();
        triggerRiversideLandmarkCelebration(e);
      });
    }

    checkAct3UtilitiesEntrance = function () {
      if (!envelopeOpened || document.body.classList.contains("is-table-preparing")) return;
      const vh = window.innerHeight || 860;
      if (cdSec && cdSec.dataset.entrancePlayed !== "1") {
        const r = cdSec.getBoundingClientRect();
        if (r.top < vh * 0.8 && r.bottom > 60) {
          playCountdownSectionEntrance();
        }
      }
      if (locSec && locSec.dataset.entrancePlayed !== "1") {
        const r = locSec.getBoundingClientRect();
        if (r.top < vh * 0.82 && r.bottom > 60) {
          playLocationSectionEntrance();
        }
      }
      if (imapSec && imapSec.dataset.entrancePlayed !== "1") {
        const r = imapSec.getBoundingClientRect();
        if (r.top < vh * 0.84 && r.bottom > 50) {
          playIllustratedMapEntrance();
        }
      }
    };

    if ("IntersectionObserver" in window && !reducedMotion) {
      const act3Observer = new IntersectionObserver(
        (entries) => {
          if (!envelopeOpened || document.body.classList.contains("is-table-preparing")) return;
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            if (entry.target === cdSec) {
              playCountdownSectionEntrance();
            } else if (entry.target === locSec) {
              playLocationSectionEntrance();
            } else if (entry.target === imapSec) {
              playIllustratedMapEntrance();
            }
          });
        },
        { threshold: 0.16 }
      );
      if (cdSec) act3Observer.observe(cdSec);
      if (locSec) act3Observer.observe(locSec);
      if (imapSec) act3Observer.observe(imapSec);
    }

    // Download .ics Calendar File (Localized for VI & 台灣繁體中文)
    const icsBtn = document.getElementById("btn-ics-cal");
    if (icsBtn) {
      icsBtn.addEventListener("click", () => {
        const isZh = currentLang === "zh";
        const summary = isZh
          ? "囍 趙順祥 & 盧小瑩 婚禮晚宴（Riverside Palace — Seine 宴會廳）"
          : "Tiệc Cưới Thuận Tường & Tiểu Dinh (Riverside Palace - Sảnh Seine)";
        const description = isZh
          ? "18:00 迎賓入席・19:00 準時開席｜越南胡志明市 RIVERSIDE PALACE — Seine 宴會廳（Sảnh Seine）。誠摯期待您的蒞臨！"
          : "Đón khách 18:00 - Khai tiệc 19:00. Sự hiện diện của Quý Khách là niềm vinh hạnh cho gia đình chúng tôi!";
        const icsLines = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          isZh
            ? "PRODID:-//ThuanTuong-TieuDinh//Wedding//ZH-TW"
            : "PRODID:-//ThuanTuong-TieuDinh//Wedding//VI",
          "BEGIN:VEVENT",
          "UID:wedding-tuong-dinh-20270106@riversidepalace",
          "DTSTAMP:20261101T120000Z",
          "DTSTART:20270106T110000Z",
          "DTEND:20270106T143000Z",
          `SUMMARY:${summary}`,
          "LOCATION:Riverside Palace (Sảnh Seine)\\, 360D Bến Vân Đồn\\, Phường Vĩnh Hội\\, TP. Hồ Chí Minh",
          `DESCRIPTION:${description}`,
          "END:VEVENT",
          "END:VCALENDAR"
        ].join("\r\n");

        const blob = new Blob([icsLines], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = isZh
          ? "Tuong-Dinh-Wedding-2027-01-06.ics"
          : "Dam-Cuoi-ThuanTuong-TieuDinh-06-01-2027.ics";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
    }

    // Copy Venue Address button (Grab-ready bilingual format)
    const copyAddrBtn = document.getElementById("btn-copy-address");
    if (copyAddrBtn) {
      copyAddrBtn.addEventListener("click", async () => {
        const addr =
          "Riverside Palace (Sảnh Seine) - 360D Bến Vân Đồn, Phường Vĩnh Hội, TP. Hồ Chí Minh";
        try {
          await navigator.clipboard.writeText(addr);
        } catch (_) {
          const ta = document.createElement("textarea");
          ta.value = addr;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        showToast(I18N[currentLang].copiedAddr);
      });
    }

    // Illustrated Wedding Map Fullscreen Lightbox & Jump-to-Cards Button
    const zoomBtn = document.getElementById("btn-zoom-imap");
    const imapTrigger = document.getElementById("imap-canvas-trigger");
    const lightbox = document.getElementById("imap-lightbox");
    const lightboxBody = document.getElementById("imap-lightbox-body");
    const closeLbBtn = document.getElementById("btn-close-imap-lightbox");
    const closeLbBg = document.getElementById("imap-lightbox-close-bg");

    const openImapLightbox = () => {
      if (!lightbox || !lightboxBody || !imapTrigger) return;
      const svgEl = imapTrigger.querySelector("svg");
      if (svgEl) {
        lightboxBody.innerHTML = "";
        const clone = svgEl.cloneNode(true);
        clone.style.minWidth = "720px";
        clone.style.width = "100%";
        clone.style.height = "auto";
        lightboxBody.appendChild(clone);
      }
      lightbox.hidden = false;
    };

    const closeImapLightbox = () => {
      if (lightbox) lightbox.hidden = true;
    };

    if (zoomBtn) zoomBtn.addEventListener("click", openImapLightbox);
    if (imapTrigger) {
      imapTrigger.addEventListener("click", openImapLightbox);
      imapTrigger.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openImapLightbox();
        }
      });
    }
    if (closeLbBtn) closeLbBtn.addEventListener("click", closeImapLightbox);
    if (closeLbBg) closeLbBg.addEventListener("click", closeImapLightbox);

    const jumpCardsBtn = document.getElementById("btn-jump-to-cards");
    if (jumpCardsBtn) {
      jumpCardsBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = currentLang === "zh" ? "card-wrap-chinese" : "card-wrap-reception";
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(triggerScrollRevealCheck, 400);
        }
      });
    }
  }

  /* 7b. Smart Scroll-Direction Topbar (Fade on Scroll Down / Reappear on Scroll Up),
         1-Tap Mobile Map Jump, Silk Edge-Fade Mask & Active Section Scroll-Spy */
  function setupTopbarNavigationUX() {
    const topbar = document.querySelector(".floating-topbar");
    const nav = document.querySelector(".topbar-nav");
    if (!nav || !topbar) return;

    const primaryCardsPill = document.getElementById("nav-primary-cards");
    const mapPill = document.getElementById("nav-map-pill");

    const sectionPairs = [
      ["card-wrap-reception", 'a.nav-pill[href="#card-wrap-reception"]'],
      ["card-wrap-ceremony", 'a.nav-pill[href="#card-wrap-ceremony"]'],
      ["card-wrap-chinese", 'a.nav-pill[href="#card-wrap-chinese"]'],
      ["section-location", 'a.nav-pill[href="#section-location"]']
    ]
      .map(([secId, pillSel]) => [
        document.getElementById(secId),
        nav.querySelector(pillSel)
      ])
      .filter(([sec, pill]) => sec && pill);

    let lastActivePill = null;
    let lastClampedY = Math.max(0, window.scrollY || 0);
    let downAccum = 0;
    let upAccum = 0;
    let navJumpLockUntil = 0;

    // Progressive scroll-scrubbed fade state (0 = 100% visible, 1 = 100% dissolved)
    const FADE_DOWN_DISTANCE = 440; // px of downward scrolling to gradually dissolve 1 -> 0
    const MAX_DOWN_RATE = 1.05; // max progress/sec when fading out (~0.98s smooth S-curve dissolve)
    const MAX_UP_RATE = 2.15; // max progress/sec when reappearing (~0.48s smooth glide-in)
    const TAU_FOLLOW_MS = 140; // micro-smoothing for discrete mouse-wheel steps
    const reducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let targetHide = 0;
    let renderedHide = 0;
    let fadeRafId = 0;
    let lastFadeTs = 0;

    function applyRenderedFade(rawP) {
      const p = Math.max(0, Math.min(1, rawP));
      // Smoothstep S-curve: gentle start (zero abrupt drop), clear mid-fade, soft finish
      const eased = p * p * (3 - 2 * p);
      const alpha = 1 - eased;
      const shift = reducedMotion ? 0 : -6 * eased;
      const scale = reducedMotion ? 1 : 1 - 0.012 * eased;
      topbar.style.setProperty("--tb-alpha", alpha.toFixed(3));
      topbar.style.setProperty("--tb-shift", shift.toFixed(2) + "px");
      topbar.style.setProperty("--tb-scale", scale.toFixed(4));
      topbar.classList.toggle("is-scroll-faded", eased >= 0.72);
    }

    function stepFadeAnimation(ts) {
      fadeRafId = 0;
      const dt = lastFadeTs ? Math.min(64, Math.max(4, ts - lastFadeTs)) : 16.67;
      lastFadeTs = ts;

      const diff = targetHide - renderedHide;
      if (Math.abs(diff) <= 0.002) {
        renderedHide = targetHide;
        lastFadeTs = 0;
        applyRenderedFade(renderedHide);
        return;
      }

      const maxRate = diff > 0 ? MAX_DOWN_RATE : MAX_UP_RATE;
      const maxDelta = (dt / 1000) * maxRate;
      const dampedDelta = diff * (1 - Math.exp(-dt / TAU_FOLLOW_MS));
      const actualDelta =
        diff > 0
          ? Math.min(dampedDelta, maxDelta)
          : Math.max(dampedDelta, -maxDelta);

      renderedHide += actualDelta;
      applyRenderedFade(renderedHide);
      fadeRafId = requestAnimationFrame(stepFadeAnimation);
    }

    function ensureFadeLoop() {
      if (!fadeRafId && Math.abs(targetHide - renderedHide) > 0.002) {
        lastFadeTs = 0;
        fadeRafId = requestAnimationFrame(stepFadeAnimation);
      }
    }

    function resetTopbarImmediate() {
      targetHide = 0;
      renderedHide = 0;
      downAccum = 0;
      upAccum = 0;
      if (fadeRafId) {
        cancelAnimationFrame(fadeRafId);
        fadeRafId = 0;
      }
      lastFadeTs = 0;
      applyRenderedFade(0);
    }

    function lockTopbarVisibleForJump(ms) {
      navJumpLockUntil = Date.now() + (ms || 1000);
      downAccum = 0;
      upAccum = 0;
      targetHide = 0;
      ensureFadeLoop();
    }

    // Mobile unified "Thiệp mời / 喜帖" pill jumps to the top card in current language order
    if (primaryCardsPill) {
      primaryCardsPill.addEventListener("click", (e) => {
        lockTopbarVisibleForJump(900);
        if (window.innerWidth <= 620) {
          e.preventDefault();
          const targetId =
            currentLang === "zh" ? "card-wrap-chinese" : "card-wrap-reception";
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            targetEl.classList.remove("will-reveal");
            targetEl.classList.add("is-visible");
            const topY = Math.max(
              0,
              window.scrollY + targetEl.getBoundingClientRect().top - 64
            );
            window.scrollTo({ top: topY, behavior: "smooth" });
          }
        }
      });
    }

    // 1-tap "Bản đồ / 婚宴地圖" pill: on mobile 1-column layout, frame the evening banquet address
    // AND 100% of the interactive Google Map immediately in view without requiring a second scroll
    if (mapPill) {
      mapPill.addEventListener("click", (e) => {
        e.preventDefault();
        lockTopbarVisibleForJump(950);

        const locSec = document.getElementById("section-location");
        const mapFrame = document.querySelector("#section-location .venue-map-frame");
        if (!locSec) return;

        locSec.classList.remove("will-reveal");
        locSec.classList.add("is-visible");

        const vh = window.innerHeight || 680;
        if (window.innerWidth <= 820 && mapFrame) {
          const hlItem = locSec.querySelector(".timeline-item:last-child");
          const mapRect = mapFrame.getBoundingClientRect();
          const mapTop = window.scrollY + mapRect.top;
          const mapBottom = mapTop + mapRect.height;
          const idealTop = hlItem
            ? window.scrollY + hlItem.getBoundingClientRect().top - 60
            : mapTop - 74;
          const minScrollForFullMap = mapBottom - (vh - 18);
          const maxScrollForMapTop = mapTop - 62;
          const targetY = Math.max(
            0,
            Math.min(maxScrollForMapTop, Math.max(idealTop, minScrollForFullMap))
          );
          window.scrollTo({ top: targetY, behavior: "smooth" });
        } else {
          const secTop = Math.max(
            0,
            window.scrollY + locSec.getBoundingClientRect().top - 68
          );
          window.scrollTo({ top: secTop, behavior: "smooth" });
        }
      });
    }

    // Keep topbar bright when clicking desktop card pills or switching VI / 中文 while mid-fade
    nav.querySelectorAll(".is-desktop-pill").forEach((pill) => {
      pill.addEventListener("click", () => lockTopbarVisibleForJump(950));
    });
    topbar.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => lockTopbarVisibleForJump(800));
    });

    function updateScrollDirectionVisibility() {
      const bodyCl = document.body.classList;
      if (
        bodyCl.contains("envelope-locked") ||
        bodyCl.contains("is-table-preparing") ||
        bodyCl.contains("is-table-cascading")
      ) {
        lastClampedY = 0;
        resetTopbarImmediate();
        return;
      }

      const rawY = window.scrollY || window.pageYOffset || 0;
      const docMax = Math.max(
        0,
        document.documentElement.scrollHeight - (window.innerHeight || 0)
      );
      // Clamp top/bottom iOS rubber-band overshoot so bounce-back never triggers false direction flips
      const y = Math.max(0, Math.min(rawY, docMax));
      const dy = y - lastClampedY;
      lastClampedY = y;

      if (y <= 28 || Date.now() < navJumpLockUntil) {
        downAccum = 0;
        upAccum = 0;
        targetHide = 0;
        ensureFadeLoop();
        return;
      }

      if (dy > 0.2) {
        downAccum += dy;
        upAccum = 0;
        const effectiveDy = Math.min(dy, Math.max(0, y - 28));
        // Progressively scrub opacity downward over FADE_DOWN_DISTANCE (280px)
        targetHide = Math.min(1, targetHide + effectiveDy / FADE_DOWN_DISTANCE);
        ensureFadeLoop();
      } else if (dy < -0.2) {
        upAccum += -dy;
        downAccum = 0;
        if (upAccum >= 30) {
          targetHide = 0;
          ensureFadeLoop();
        } else if (upAccum >= 6) {
          targetHide = Math.max(0, targetHide + dy / 110);
          ensureFadeLoop();
        }
      }
    }

    function updateNavMask() {
      const maxScroll = nav.scrollWidth - nav.clientWidth;
      if (maxScroll <= 3) {
        nav.classList.remove("has-fade-left", "has-fade-right");
        return;
      }
      nav.classList.toggle("has-fade-left", nav.scrollLeft > 4);
      nav.classList.toggle("has-fade-right", nav.scrollLeft < maxScroll - 4);
    }

    function updateActiveSectionPill() {
      if (document.body.classList.contains("envelope-locked") || !sectionPairs.length) {
        return;
      }
      const readingLine = (window.innerHeight || 700) * 0.38;
      let chosenPill = null;
      let bestDist = Infinity;

      // Also map #section-countdown smoothly toward #section-location when scrolled deep into Act III
      const cdEl = document.getElementById("section-countdown");
      const locPair = sectionPairs.find(([sec]) => sec.id === "section-location");

      for (const [sec, pill] of sectionPairs) {
        const r = sec.getBoundingClientRect();
        if (r.top <= readingLine && r.bottom >= readingLine * 0.45) {
          chosenPill = pill;
          bestDist = 0;
          break;
        }
        const dist = Math.min(Math.abs(r.top - readingLine), Math.abs(r.bottom - readingLine));
        if (dist < bestDist) {
          bestDist = dist;
          chosenPill = pill;
        }
      }

      if (cdEl && locPair) {
        const cr = cdEl.getBoundingClientRect();
        if (cr.top <= readingLine * 0.85 && cr.bottom >= readingLine * 0.5) {
          chosenPill = locPair[1];
        }
      }

      // On compact mobile viewports (<= 620px), map hidden desktop card pills onto unified "Thiệp mời / 喜帖"
      if (
        chosenPill &&
        window.innerWidth <= 620 &&
        chosenPill.classList.contains("is-desktop-pill") &&
        primaryCardsPill
      ) {
        chosenPill = primaryCardsPill;
      }

      if (chosenPill && chosenPill !== lastActivePill) {
        lastActivePill = chosenPill;
        nav.querySelectorAll(".nav-pill").forEach((p) => {
          p.classList.toggle("is-active", p === chosenPill);
        });
        const maxScroll = nav.scrollWidth - nav.clientWidth;
        if (maxScroll > 4) {
          const targetLeft = Math.max(
            0,
            Math.min(
              maxScroll,
              chosenPill.offsetLeft - (nav.clientWidth - chosenPill.offsetWidth) / 2
            )
          );
          nav.scrollTo({ left: targetLeft, behavior: "smooth" });
        }
      }
    }

    let rafPending = false;
    function scheduleSync() {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        updateScrollDirectionVisibility();
        updateNavMask();
        updateActiveSectionPill();
      });
    }

    nav.addEventListener("scroll", updateNavMask, { passive: true });
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync, { passive: true });
    syncTopbarNavUI = () => {
      lastActivePill = null;
      scheduleSync();
    };
    scheduleSync();
  }

  /* 8. Subtle Floating Golden Motes & Romantic Petals Canvas */
  function setupAmbientCanvas() {
    const canvas = document.getElementById("ambient-canvas");
    if (!canvas) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const ctx = canvas.getContext("2d");
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    window.addEventListener(
      "resize",
      () => {
        const nw = window.innerWidth;
        const nh = window.innerHeight;
        // Ignore minor mobile URL-bar height retractions (< 90px) so scrolling never clears canvas buffer
        if (nw !== w || Math.abs(nh - h) > 90) {
          w = canvas.width = nw;
          h = canvas.height = nh;
        }
      },
      { passive: true }
    );

    const count = Math.min(26, Math.max(14, Math.floor(w / 55)));
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1.4 + Math.random() * 2.8,
      vy: 0.22 + Math.random() * 0.42,
      vx: (Math.random() - 0.5) * 0.3,
      phase: Math.random() * Math.PI * 2,
      isPetal: Math.random() > 0.58
    }));

    const stageEl = document.getElementById("envelope-stage");

    function draw() {
      // Pause canvas repaints when tab is hidden or during active 3D flip so mobile GPU runs locked 120fps
      if (
        document.hidden ||
        (stageEl &&
          (stageEl.classList.contains("is-flipping-to-back") ||
            stageEl.classList.contains("is-flipping-to-front")))
      ) {
        requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.phase += 0.014;
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.phase) * 0.25;
        if (p.y > h + 12) {
          p.y = -10;
          p.x = Math.random() * w;
        }
        if (p.x > w + 12) p.x = -10;
        if (p.x < -12) p.x = w + 10;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.sin(p.phase) * 0.6);

        if (p.isPetal) {
          // Warm champagne-blush petal on red envelope stage; soft crimson petal on cream cards
          ctx.fillStyle = envelopeOpened
            ? "rgba(152, 28, 34, 0.13)"
            : "rgba(255, 224, 182, 0.16)";
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r * 1.55, p.r * 0.92, 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Warm golden candlelight dust mote
          ctx.fillStyle = envelopeOpened
            ? "rgba(208, 158, 84, 0.22)"
            : "rgba(255, 236, 198, 0.26)";
          ctx.beginPath();
          ctx.arc(0, 0, p.r * 0.88, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* Boot */
  document.addEventListener("DOMContentLoaded", () => {
    const requestedWhisperTheme = (params.get("whisper_theme") || "").toLowerCase();
    if (["gold", "olive", "velvet"].includes(requestedWhisperTheme)) {
      document.body.dataset.whisperTheme = requestedWhisperTheme;
    }

    if (guestName) {
      document.body.classList.add("is-guest-mode");
    }

    // Localize Google Maps embed UI labels to Traditional Chinese (zh-TW) when opened in 中文 mode
    const mapIframe = document.getElementById("venue-map-iframe");
    if (mapIframe && currentLang === "zh") {
      const baseSrc = mapIframe.getAttribute("src") || "";
      if (baseSrc && !baseSrc.includes("hl=")) {
        mapIframe.setAttribute("src", baseSrc + "&hl=zh-TW");
      }
    }

    mountArtworkSVGs();
    setupEnvelopeInteractions();
    setupScrollReveal();
    setupCard2BorderSecret();
    setupCountdownAndCalendar();
    setupTopbarNavigationUX();
    setupAmbientCanvas();

    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => applyLanguage(btn.dataset.lang));
    });

    applyLanguage(currentLang);
    fetchRemoteGuestConfig();
    const startVisitTracking = () => {
      trackGuestActivity("view");
      if (envelopeOpened) {
        trackGuestActivity("open_envelope");
      }
    };
    // Numbered QR bookmark still resolving its assigned guest name -> wait (page may redirect to ?to=Name)
    if (window.__TD_SLOT_PENDING) {
      window.__TD_SLOT_READY = startVisitTracking;
    } else {
      startVisitTracking();
    }

    // Re-fit Guest Names once Google Fonts (Dancing Script / Noto Serif TC) finish swapping AND on viewport resize
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        fitAllGuestNames();
        if (syncTopbarNavUI) syncTopbarNavUI();
      });
    }
    let resizeFitTimer = null;
    window.addEventListener(
      "resize",
      () => {
        if (resizeFitTimer) clearTimeout(resizeFitTimer);
        resizeFitTimer = setTimeout(fitAllGuestNames, 90);
      },
      { passive: true }
    );
    if (envelopeOpened) {
      if (window.location.hash) {
        try {
          const hashTarget = document.querySelector(window.location.hash);
          if (hashTarget) {
            hashTarget.classList.remove("will-reveal");
            hashTarget.classList.add("is-visible");
            hashTarget.scrollIntoView({ behavior: "instant", block: "center" });
          }
        } catch (_) {}
      }
      triggerScrollRevealCheck();
      if (triggerWelcomeGreetingIfReady) {
        setTimeout(() => triggerWelcomeGreetingIfReady(), 480);
      }
    }
  });
})();
