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
  let envelopeOpened = params.get("open") === "1";
  let envelopeFlipped = false;
  let toastTimeout = null;
  let syncTopbarNavUI = null;

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

  const activeWhispers = [];

  function spawnFloatingWhisper(anchorEl, e, phraseObj, isTallFigure) {
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
    orn.textContent = phraseObj.ornament || "✦";
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
    const rise = -(66 + Math.random() * 22).toFixed(1) + "px";
    const durSec = 3.05 + Math.random() * 0.45;
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

    // Two whisper-delicate champagne-gold / crimson motes drifting alongside (no cartoon emojis)
    const moteGlyphs = phraseObj.ornament === "♡" ? ["♡", "✦"] : ["✦", "♡"];
    for (let i = 0; i < 2; i++) {
      const m = document.createElement("span");
      m.className = "floating-mote";
      m.setAttribute("aria-hidden", "true");
      m.textContent = moteGlyphs[i];
      const mx = pageX + (i === 0 ? -1 : 1) * (18 + Math.random() * 26);
      const my = pageY + 4 + Math.random() * 10;
      m.style.left = mx.toFixed(1) + "px";
      m.style.top = my.toFixed(1) + "px";
      m.style.setProperty("--dx", ((i === 0 ? -1 : 1) * (12 + Math.random() * 20)).toFixed(1) + "px");
      m.style.setProperty("--dy", -(98 + Math.random() * 42).toFixed(1) + "px");
      m.style.setProperty("--dur", (2.6 + Math.random() * 0.6).toFixed(2) + "s");
      m.style.setProperty("--sz", (10 + Math.random() * 2.5).toFixed(1) + "px");
      m.style.setProperty("--clr", i === 0 ? "#c8923b" : "rgba(132, 21, 23, 0.52)");
      document.body.appendChild(m);
      setTimeout(() => m.remove(), 3400);
    }

    setTimeout(() => pill.remove(), Math.ceil(durSec * 1000) + 120);
  }

  /* Bespoke Hand-Sketched Calligraphic Hearts for Background Banquet Guests ("thả tim") */
  const HAND_DRAWN_HEART_SVGS = [
    // 1. Velvet crimson hand-drawn filled heart
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#8c171c" d="M12.1 20.6c-.3 0-.6-.1-.8-.3C7.2 16.9 3.4 13.4 3.1 9.1 2.9 6.2 5.1 4 7.8 4c1.7 0 3.3.9 4.2 2.3C12.9 4.9 14.5 4 16.2 4c2.8 0 4.9 2.2 4.7 5.1-.3 4.3-4.1 7.8-8 11.2-.2.2-.5.3-.8.3z"/></svg>',
    // 2. Warm rose-claret sketched heart
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#b2383d" d="M12 20.4C7.9 17 3.8 13.5 3.5 9.2 3.3 6.5 5.3 4.4 7.9 4.4c1.7 0 3.2.9 4.1 2.3.9-1.4 2.4-2.3 4.1-2.3 2.6 0 4.6 2.1 4.4 4.8-.3 4.3-4.4 7.8-8.5 11.2z"/></svg>',
    // 3. Champagne-gold calligraphic outline heart
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="rgba(250,246,238,0.55)" stroke="#c28322" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 20.1C8 16.8 4 13.4 3.7 9.2 3.5 6.5 5.5 4.5 8 4.5c1.7 0 3.1.9 4 2.3.9-1.4 2.3-2.3 4-2.3 2.5 0 4.5 2 4.3 4.7-.3 4.2-4.3 7.6-8.3 10.9z"/></svg>'
  ];

  function spawnGuestHearts(anchorEl, e) {
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
          ? rect.top + rect.height * 0.14
          : 340;

    const basePageX = baseClientX + window.scrollX;
    const basePageY = baseClientY + window.scrollY;
    const count = 6;

    for (let i = 0; i < count; i++) {
      const heart = document.createElement("span");
      heart.className = "guest-heart-mote";
      heart.setAttribute("aria-hidden", "true");
      heart.innerHTML = HAND_DRAWN_HEART_SVGS[i % HAND_DRAWN_HEART_SVGS.length];

      const spreadX = (i - (count - 1) / 2) * 7.5 + (Math.random() * 10 - 5);
      const spreadY = Math.random() * 10 - 5;
      const dir = (i % 2 === 0 ? 1 : -1) * (Math.random() < 0.25 ? -1 : 1);
      const dx1 = (dir * (10 + Math.random() * 18)).toFixed(1) + "px";
      const dx2 = (-dir * (7 + Math.random() * 18) + (Math.random() * 12 - 6)).toFixed(1) + "px";
      const rise = -(102 + Math.random() * 54).toFixed(1) + "px";
      const dur = (2.15 + Math.random() * 0.75).toFixed(2) + "s";
      const delay = (i * 0.065 + Math.random() * 0.04).toFixed(2) + "s";
      const sz = (13.5 + (i % 3) * 2.8 + Math.random() * 2.2).toFixed(1) + "px";
      const rot1 = (dir * (6 + Math.random() * 10)).toFixed(1) + "deg";
      const rot2 = (-dir * (5 + Math.random() * 11)).toFixed(1) + "deg";

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
      setTimeout(() => heart.remove(), 3500);
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
          spawnGuestHearts(rect, e);
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
      });
    }

    if (rightDogs) {
      rightDogs.addEventListener("click", (e) => {
        e.stopPropagation();
        spawnFloatingWhisper(rightDogs, e, pickRight(), false);
      });
    }

    if (couple) {
      couple.addEventListener("click", (e) => {
        e.stopPropagation();
        spawnFloatingWhisper(couple, e, pickCouple(), true);
      });
    }

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
    for (let day = 1; day <= 31; day++) {
      const cls = day === 6 ? "cal-day is-wedding-day" : "cal-day";
      html += `<div class="${cls}">${day}</div>`;
    }
    calGrid.innerHTML = html;
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
  function syncPostWeddingAndAccessMode() {
    const cfg = window.WEDDING_CONFIG || {};
    const isPaused = cfg.isPublished === false || params.get("preview") === "paused";
    const pausedEl = document.getElementById("access-paused-overlay");
    if (pausedEl) {
      pausedEl.hidden = !isPaused;
    }

    const isThankYou =
      cfg.thankYouMode === true ||
      params.get("mode") === "thankyou" ||
      params.get("thankyou") === "1";
    const tySection = document.getElementById("thank-you-showcase");
    if (!tySection) return;
    tySection.hidden = !isThankYou;
    if (!isThankYou) return;

    const isZh = currentLang === "zh";
    const dict = I18N[currentLang];
    const displayGuest = guestName || dict.defaultGuest;

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
      body.textContent = isZh
        ? cfg.thankYouMessageZH ||
          "誠摯感謝您蒞臨參與我們的婚禮，您的祝福與陪伴是我們最珍貴的禮物。順祥 & 小瑩 謹致上最深切的謝意！"
        : cfg.thankYouMessageVI ||
          "Sự hiện diện, lời chúc phúc và tình cảm nồng ấm của Quý Khách trong ngày chung đôi 06.01.2027 là món quà vô giá đối với gia đình chúng tôi.";
    }

    const driveUrl = (params.get("drive") || cfg.googleDrivePhotoUrl || "").trim();
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
        el.textContent = dict[key];
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

      stage.style.setProperty("--flip-dir", String(dir >= 0 ? 1 : -1));
      stage.classList.remove(
        "is-pressing",
        "is-flipping-to-front",
        "is-flipped",
        "is-back-ready"
      );
      if (env3d) void env3d.offsetWidth;
      stage.classList.add("is-flipping-to-back");

      if (window.weddingMusic) window.weddingMusic.playFlipChime();

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

      if (window.weddingMusic) window.weddingMusic.playFlipChime();

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
        window.weddingMusic.playOpenChime();
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
          firstCard.dataset.revealed = "1";
          firstCard.classList.remove("will-reveal", "is-handoff-target");
          firstCard.classList.add("is-visible", "is-revealed-done");
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

  /* 6. Scroll Reveal Observer for Stationery Cards & Card 2 Handwritten Border Secret */
  let cardObserver = null;
  function revealCard(card) {
    if (!card || card.dataset.revealed === "1") return;
    card.dataset.revealed = "1";
    card.classList.add("is-visible");
    setTimeout(() => {
      card.classList.remove("will-reveal");
      card.classList.add("is-revealed-done");
    }, 1650);
  }

  function setupScrollReveal() {
    const cards = document.querySelectorAll(".stationery-card");
    if (!("IntersectionObserver" in window)) {
      cards.forEach((c) => {
        c.classList.add("is-visible", "is-revealed-done");
      });
      return;
    }
    cards.forEach((c) => c.classList.add("will-reveal"));
    cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealCard(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    cards.forEach((c) => cardObserver.observe(c));
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
            if (entry.isIntersecting && entry.intersectionRatio >= 0.32) {
              startPenWrite();
            }
          });
        },
        { threshold: [0.05, 0.32] }
      );
      penObserver.observe(card2);
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

  function triggerScrollRevealCheck() {
    const vh = window.innerHeight || 900;
    document.querySelectorAll(".stationery-card").forEach((card) => {
      const rect = card.getBoundingClientRect();
      if (rect.top < vh * 0.98 && rect.bottom > -50) {
        revealCard(card);
      }
    });
  }

  /* 7. Countdown Timer & Keepsake January 2027 Calendar + .ics / Google Calendar */
  function setupCountdownAndCalendar() {
    const targetTime = new Date(CFG.weddingDateISO || "2027-01-06T18:00:00+07:00").getTime();
    const elD = document.getElementById("cd-days");
    const elH = document.getElementById("cd-hours");
    const elM = document.getElementById("cd-mins");
    const elS = document.getElementById("cd-secs");

    function tick() {
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      if (elD) elD.textContent = String(d).padStart(2, "0");
      if (elH) elH.textContent = String(h).padStart(2, "0");
      if (elM) elM.textContent = String(m).padStart(2, "0");
      if (elS) elS.textContent = String(s).padStart(2, "0");
    }
    tick();
    setInterval(tick, 1000);

    renderJan2027Calendar();
    updateGoogleCalendarLink();

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
    }
  });
})();
