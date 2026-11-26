(function () {
  const STORAGE_SAVED_GUESTS = "td_saved_guests_v2";
  const langSelect = document.getElementById("default-lang");
  const listArea = document.getElementById("guest-list");
  const cardsContainer = document.getElementById("guest-cards-container");
  const savedCountEl = document.getElementById("saved-guest-count");
  const badgeSavedEl = document.getElementById("badge-saved-count");
  const badgeLogsEl = document.getElementById("badge-logs-count");
  const searchInput = document.getElementById("guest-search-input");
  const toast = document.getElementById("puppy-toast");
  let timer = null;

  let savedGuests = [];
  let visitLogsByGuest = {};
  let currentFilter = "named";
  // Numbered QR bookmarks (print first, assign guest later): code -> { num, name, lang, assignedAt }
  let serverSlots = {};
  const TOTAL_INVITE_TARGET = 414;
  const STORAGE_SLOT_MAX_PRINTED = "td_slot_max_printed_v1";
  const STORAGE_ADMIN_KEY = "td_admin_key_v1";
  let slotMaxPrinted = TOTAL_INVITE_TARGET;
  try {
    slotMaxPrinted = Math.max(
      TOTAL_INVITE_TARGET,
      parseInt(localStorage.getItem(STORAGE_SLOT_MAX_PRINTED) || "414", 10) || TOTAL_INVITE_TARGET
    );
  } catch (_) {}
  let globalSiteConfig = {
    globalMode: "invite",
    globalThankYou: false,
    globalDirections: false,
    driveUrl: "",
    thankYouVI: "",
    thankYouZH: ""
  };
  let globalConfigLoadedOnce = false;

  const VALID_TABLE_LABEL_MODES = ["none", "own_only", "same_label", "all"];
  const STORAGE_SEATING_CFG = "td_seating_config_v1";
  const STORAGE_LAST_RESTRICTED_LABEL_MODE = "td_last_restricted_label_mode_v1";
  let seatingConfig = {
    totalTables: 38,
    seatsPerTable: 10,
    showTableGuests: true,
    tableLabelMode: "same_label",
    tableMeta: {}
  };
  try {
    const rawSeat = localStorage.getItem(STORAGE_SEATING_CFG);
    if (rawSeat) {
      const parsedSeat = JSON.parse(rawSeat);
      if (parsedSeat && typeof parsedSeat === "object") {
        seatingConfig = { ...seatingConfig, ...parsedSeat };
      }
    }
    if (!localStorage.getItem("td_seine_38_migrated_v1")) {
      if (seatingConfig.totalTables === 40) {
        seatingConfig.totalTables = 38;
      }
      localStorage.setItem("td_seine_38_migrated_v1", "1");
      localStorage.setItem(STORAGE_SEATING_CFG, JSON.stringify(seatingConfig));
    }
  } catch (_) {}
  let selectedSeineTable = localStorage.getItem("td_admin_selected_table_v1") || "1";

  const DEFAULT_SEAT_GROUPS = {
    "": { label: "⚪ Chưa phân nhóm", short: "Chưa gán", bg: "#f2ebe1", color: "#5c4338" },
    groom_family: { label: "👑 Gia đình Nhà Trai", short: "👑 GĐ Trai", bg: "#f9e6e6", color: "#7d1518" },
    bride_family: { label: "👑 Gia đình Nhà Gái", short: "👑 GĐ Gái", bg: "#fde8e8", color: "#961717" },
    groom_relatives: { label: "🏮 Họ hàng Nhà Trai", short: "🏮 Họ Trai", bg: "#faeedb", color: "#7a4508" },
    bride_relatives: { label: "🏮 Họ hàng Nhà Gái", short: "🏮 Họ Gái", bg: "#fcebd9", color: "#8e3e08" },
    friends_colleagues: { label: "🥂 Bạn bè & Đồng nghiệp", short: "🥂 Bạn & ĐN", bg: "#e3f5ee", color: "#135742" },
    honored_guests: { label: "✨ Khách mời / Khách quý", short: "✨ Khách quý", bg: "#efeaf8", color: "#5b3e85" }
  };

  const LEGACY_CHIP_COLOR_UPGRADE = {
    "#9a5b13": "#7a4508",
    "#b85d19": "#8e3e08",
    "#1b6b52": "#135742",
    "#a61c1c": "#961717"
  };

  function normalizeGroupFgColor(hex) {
    const k = String(hex || "").trim().toLowerCase();
    return LEGACY_CHIP_COLOR_UPGRADE[k] || hex || "#5c4338";
  }

  const STORAGE_SEAT_GROUPS = "td_seat_groups_v1";
  let SEAT_GROUPS = { ...DEFAULT_SEAT_GROUPS };
  try {
    const rawGroups = localStorage.getItem(STORAGE_SEAT_GROUPS);
    if (rawGroups) {
      const parsed = JSON.parse(rawGroups);
      if (parsed && typeof parsed === "object") {
        SEAT_GROUPS = { ...DEFAULT_SEAT_GROUPS, ...parsed };
      }
    }
  } catch (_) {}

  const COLOR_PALETTES = {
    wine: { bg: "#f9e6e6", color: "#7d1518", icon: "🍷" },
    crimson: { bg: "#fde8e8", color: "#961717", icon: "🌹" },
    amber: { bg: "#faeedb", color: "#7a4508", icon: "🏮" },
    orange: { bg: "#fcebd9", color: "#8e3e08", icon: "🍊" },
    emerald: { bg: "#e3f5ee", color: "#135742", icon: "🌿" },
    blue: { bg: "#e8f0fe", color: "#1a5276", icon: "🌊" },
    purple: { bg: "#efeaf8", color: "#5b3e85", icon: "🔮" },
    pink: { bg: "#fcebf2", color: "#8f215c", icon: "🌸" },
    brown: { bg: "#f2ece6", color: "#5e3e2c", icon: "🪵" },
    slate: { bg: "#edeef1", color: "#374151", icon: "🌫️" }
  };

  function persistCustomGroups() {
    try {
      localStorage.setItem(STORAGE_SEAT_GROUPS, JSON.stringify(SEAT_GROUPS));
    } catch (_) {}
    if (!seatingConfig.groups) seatingConfig.groups = {};
    seatingConfig.groups = { ...SEAT_GROUPS };
    saveSeatingConfigToServer(false);
  }

  function refreshAllGroupSelects() {
    const groupKeys = Object.keys(SEAT_GROUPS).filter(Boolean);

    // 1. guest-group-filter (Danh sách khách)
    const grpFilterEl = document.getElementById("guest-group-filter");
    if (grpFilterEl) {
      const prev = grpFilterEl.value || "all";
      let html = `<option value="all">👥 Tất cả ${groupKeys.length} nhóm khách</option><option value="unassigned_group">⚪ Chưa phân nhóm</option>`;
      groupKeys.forEach((k) => {
        html += `<option value="${k}">${SEAT_GROUPS[k].label}</option>`;
      });
      grpFilterEl.innerHTML = html;
      grpFilterEl.value = prev;
    }

    // 2. bulk-assign-group & bulk-float-group
    const topBulkGrp = document.getElementById("bulk-assign-group");
    const floatBulkGrp = document.getElementById("bulk-float-group");
    let bulkOpts = `<option value="__keep__">-- Giữ nguyên Nhóm khách --</option>`;
    groupKeys.forEach((k) => {
      bulkOpts += `<option value="${k}">Gán: ${SEAT_GROUPS[k].label}</option>`;
    });
    bulkOpts += `<option value="">⚪ Xóa phân nhóm (Về trống)</option>`;
    if (topBulkGrp) {
      const p = topBulkGrp.value || "__keep__";
      topBulkGrp.innerHTML = bulkOpts;
      topBulkGrp.value = p;
    }
    if (floatBulkGrp) {
      const p = floatBulkGrp.value || "__keep__";
      floatBulkGrp.innerHTML = bulkOpts;
      floatBulkGrp.value = p;
    }

    // 3. seine-insp-group (Chi tiết bàn)
    const seineInspGrp = document.getElementById("seine-insp-group");
    if (seineInspGrp) {
      const p = seineInspGrp.value || "";
      let html = `<option value="">⚪ Chưa phân nhóm</option>`;
      groupKeys.forEach((k) => {
        html += `<option value="${k}">${SEAT_GROUPS[k].label}</option>`;
      });
      seineInspGrp.innerHTML = html;
      seineInspGrp.value = p;
    }

    // 4. seine-unassigned-group-filter (Lọc thêm khách)
    const unassignedFilter = document.getElementById("seine-unassigned-group-filter");
    if (unassignedFilter) {
      const p = unassignedFilter.value || "all";
      let html = `<option value="all">Tất cả nhóm</option>`;
      groupKeys.forEach((k) => {
        html += `<option value="${k}">${SEAT_GROUPS[k].short || SEAT_GROUPS[k].label}</option>`;
      });
      unassignedFilter.innerHTML = html;
      unassignedFilter.value = p;
    }

    // 5. default-add-group (Thêm khách mời)
    const defAddGrp = document.getElementById("default-add-group");
    if (defAddGrp) {
      const p = defAddGrp.value || "";
      let html = `<option value="">⚪ Chưa phân nhóm (Chọn sau)</option>`;
      groupKeys.forEach((k) => {
        html += `<option value="${k}">${SEAT_GROUPS[k].label}</option>`;
      });
      defAddGrp.innerHTML = html;
      defAddGrp.value = p;
    }

    renderCustomGroupsChips();
  }

  function renderCustomGroupsChips() {
    const container = document.getElementById("custom-groups-chips-list");
    const countBadge = document.getElementById("custom-groups-count-badge");
    if (!container) return;
    const keys = Object.keys(SEAT_GROUPS).filter(Boolean);
    if (countBadge) countBadge.textContent = `${keys.length} nhóm`;
    container.innerHTML = "";

    const groupCounts = {};
    const seenGuestKeys = new Set();
    const seenSlotCodes = new Set();

    savedGuests.forEach((g) => {
      if (!g || !g.name) return;
      const gk = normalizeNameKey(g.name);
      if (gk) seenGuestKeys.add(gk);
      const sc = String(g.slotCode || (g.slot ? makeSlotCode(g.slot) : "")).trim().toLowerCase();
      if (sc) seenSlotCodes.add(sc);
      const slotObj = sc && serverSlots[sc] ? serverSlots[sc] : null;
      const grp = String(g.group || (slotObj && slotObj.group) || "").trim();
      const pax = Math.max(1, parseInt(g.pax || (slotObj && slotObj.pax) || "1", 10) || 1);
      if (grp) groupCounts[grp] = (groupCounts[grp] || 0) + pax;
    });

    Object.keys(serverSlots).forEach((code) => {
      const s = serverSlots[code];
      if (!s) return;
      const normCode = String(code).trim().toLowerCase();
      if (seenSlotCodes.has(normCode)) return;
      const sk = s.name ? normalizeNameKey(s.name) : "";
      if (sk && seenGuestKeys.has(sk)) return;
      const grp = String(s.group || "").trim();
      const pax = Math.max(1, parseInt(s.pax || "1", 10) || 1);
      if (grp) groupCounts[grp] = (groupCounts[grp] || 0) + pax;
    });

    keys.forEach((k) => {
      const gInfo = SEAT_GROUPS[k];
      const cnt = groupCounts[k] || 0;
      const safeLabel = String(gInfo.label || k).replace(/"/g, "&quot;");
      const chip = document.createElement("div");
      chip.className = "custom-group-chip";
      chip.style.setProperty("--chip-bg", gInfo.bg);
      chip.style.setProperty("--chip-fg", normalizeGroupFgColor(gInfo.color));
      chip.innerHTML = `
        <span>${gInfo.label}</span>
        <span class="custom-group-chip-count">(${cnt} ghế)</span>
        <button type="button" class="btn-group-delete" aria-label="Xóa nhóm ${safeLabel}" title="Xóa nhóm này">✕</button>
      `;

      const delBtn = chip.querySelector(".btn-group-delete");
      if (delBtn) {
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!confirm(`Bạn có chắc muốn xóa nhóm "${gInfo.label}" không?\nKhách thuộc nhóm này sẽ chuyển về "Chưa phân nhóm".`)) return;
          delete SEAT_GROUPS[k];
          savedGuests = savedGuests.map((g) => g.group === k ? { ...g, group: "" } : g);
          Object.keys(serverSlots).forEach((code) => {
            if (serverSlots[code].group === k) serverSlots[code].group = "";
          });
          persistLocalGuests();
          persistLocalSlots();
          persistCustomGroups();
          refreshAllGroupSelects();
          buildRows();
          renderSeineFloorplan();
          notify(`🗑️ Đã xóa nhóm "${gInfo.label}".`);
        });
      }

      container.appendChild(chip);
    });
  }

  // Group Form Toggle & Add Logic
  const btnToggleAddGroup = document.getElementById("btn-toggle-add-group");
  const addGroupForm = document.getElementById("add-group-form");
  const btnCancelAddGroup = document.getElementById("btn-cancel-add-group");
  const btnSaveNewGroup = document.getElementById("btn-save-new-group");
  const btnResetGroups = document.getElementById("btn-reset-groups");
  const newGroupNameInput = document.getElementById("new-group-name");
  const newGroupColorSelect = document.getElementById("new-group-color");

  if (btnToggleAddGroup && addGroupForm) {
    btnToggleAddGroup.addEventListener("click", () => {
      const isOpen = addGroupForm.style.display !== "none";
      addGroupForm.style.display = isOpen ? "none" : "block";
      if (!isOpen && newGroupNameInput) {
        newGroupNameInput.value = "";
        newGroupNameInput.focus();
      }
    });
  }

  if (btnCancelAddGroup && addGroupForm) {
    btnCancelAddGroup.addEventListener("click", () => {
      addGroupForm.style.display = "none";
      if (newGroupNameInput) newGroupNameInput.value = "";
    });
  }

  if (btnSaveNewGroup && newGroupNameInput && newGroupColorSelect) {
    btnSaveNewGroup.addEventListener("click", () => {
      const name = newGroupNameInput.value.trim();
      if (!name) {
        alert("Vui lòng nhập tên nhóm khách mới!");
        newGroupNameInput.focus();
        return;
      }
      const colorKey = newGroupColorSelect.value || "wine";
      const pal = COLOR_PALETTES[colorKey] || COLOR_PALETTES.wine;
      // Generate key from name
      const slug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || ("grp_" + Date.now());
      const groupKey = "custom_" + slug;

      SEAT_GROUPS[groupKey] = {
        label: `${pal.icon} ${name}`,
        short: `${pal.icon} ${name.length > 10 ? name.slice(0, 10) + '…' : name}`,
        bg: pal.bg,
        color: pal.color
      };

      persistCustomGroups();
      refreshAllGroupSelects();
      buildRows();
      if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();

      newGroupNameInput.value = "";
      if (addGroupForm) addGroupForm.style.display = "none";
      notify(`🎉 Đã tạo nhóm "${name}" thành công!`);
    });

    newGroupNameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        btnSaveNewGroup.click();
      }
    });
  }

  if (btnResetGroups) {
    btnResetGroups.addEventListener("click", () => {
      if (!confirm("Khôi phục danh sách nhóm về mặc định ban đầu?")) return;
      SEAT_GROUPS = { ...DEFAULT_SEAT_GROUPS };
      persistCustomGroups();
      refreshAllGroupSelects();
      buildRows();
      if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
      notify("↺ Đã khôi phục các nhóm mặc định.");
    });
  }

  function persistLocalSeating() {
    try {
      localStorage.setItem(STORAGE_SEATING_CFG, JSON.stringify(seatingConfig));
    } catch (_) {}
  }

  function computeTableStats() {
    const occ = {};
    const byTable = {};
    const seenGuestKeys = new Set();
    let totalSeatedRecords = 0;
    let totalSeatedPax = 0;

    savedGuests.forEach((g) => {
      if (!g || !g.name) return;
      const gk = normalizeNameKey(g.name);
      const slotObj = g.slotCode && serverSlots[g.slotCode] ? serverSlots[g.slotCode] : null;
      const t = String(g.table || (slotObj && slotObj.table) || "").trim();
      const grp = String(g.group || (slotObj && slotObj.group) || "").trim();
      const pax = Math.max(1, parseInt(g.pax || (slotObj && slotObj.pax) || "1", 10) || 1);
      if (gk) seenGuestKeys.add(gk);
      if (t) {
        occ[t] = (occ[t] || 0) + pax;
        if (!byTable[t]) byTable[t] = [];
        byTable[t].push({
          type: "guest",
          name: g.name,
          slot: g.slot || (slotObj && slotObj.num) || null,
          slotCode: g.slotCode || "",
          group: grp,
          pax,
          note: g.note || guestNotesMap[gk] || ""
        });
        totalSeatedRecords++;
        totalSeatedPax += pax;
      }
    });

    Object.keys(serverSlots).forEach((code) => {
      const s = serverSlots[code];
      if (!s) return;
      const sk = s.name ? normalizeNameKey(s.name) : "";
      if (sk && seenGuestKeys.has(sk)) return;
      const t = String(s.table || "").trim();
      const grp = String(s.group || "").trim();
      const pax = Math.max(1, parseInt(s.pax || "1", 10) || 1);
      if (t) {
        occ[t] = (occ[t] || 0) + pax;
        if (!byTable[t]) byTable[t] = [];
        byTable[t].push({
          type: "slot",
          name: s.name || `QR Số ${s.num}`,
          slot: s.num,
          slotCode: code,
          group: grp,
          pax,
          note: ""
        });
        totalSeatedRecords++;
        totalSeatedPax += pax;
      }
    });

    return { occ, byTable, totalSeatedRecords, totalSeatedPax };
  }

  const VALID_MORNING_MODES = ["", "both", "groom", "bride"];
  function normalizeMorningMode(val) {
    if (val === true || val === 1 || val === "1" || val === "morning") return "both";
    const s = String(val || "").trim().toLowerCase();
    return VALID_MORNING_MODES.includes(s) ? s : "";
  }

  function buildMorningSelectOptions(selectedMorning = "") {
    const cur = normalizeMorningMode(selectedMorning);
    const opts = [
      { value: "", label: "🌙 Chỉ Tiệc Tối (18:00)" },
      { value: "both", label: "🌅 Mời Sáng (05:30) + Tối" },
      { value: "groom", label: "🏠 Sáng Nhà Trai + Tối" },
      { value: "bride", label: "🏡 Sáng Nhà Gái + Tối" }
    ];
    return opts
      .map(
        (o) =>
          `<option value="${o.value}" ${o.value === cur ? "selected" : ""}>${o.label}</option>`
      )
      .join("");
  }

  function getMorningBadgeText(morningMode) {
    const m = normalizeMorningMode(morningMode);
    if (m === "groom") return "🏠 Sáng Nhà Trai 05:30";
    if (m === "bride") return "🏡 Sáng Nhà Gái 05:30";
    if (m === "both") return "🌅 Lễ Sáng 05:30 + Tối";
    return "";
  }

  function buildGroupSelectOptions(selectedGroup = "") {
    return Object.keys(SEAT_GROUPS)
      .map(
        (k) =>
          `<option value="${k}" ${k === (selectedGroup || "") ? "selected" : ""}>${SEAT_GROUPS[k].label}</option>`
      )
      .join("");
  }

  function buildTableSelectOptions(selectedTable = "", occMap = {}) {
    const total = seatingConfig.totalTables || 40;
    const cap = seatingConfig.seatsPerTable || 10;
    const meta = seatingConfig.tableMeta || {};
    const opts = [`<option value="" ${!selectedTable ? "selected" : ""}>🪑 Chưa xếp bàn</option>`];
    for (let i = 1; i <= total; i++) {
      const tKey = String(i);
      const used = occMap[tKey] || 0;
      const m = meta[tKey] || {};
      const grpShort = m.group && SEAT_GROUPS[m.group] ? ` • ${SEAT_GROUPS[m.group].short}` : "";
      const lbl = m.label ? ` (${m.label})` : "";
      opts.push(
        `<option value="${tKey}" ${tKey === String(selectedTable || "") ? "selected" : ""}>Bàn ${String(i).padStart(2, "0")} (${used}/${cap})${grpShort}${lbl}</option>`
      );
    }
    return opts.join("");
  }

  const globalTySelect = document.getElementById("global-thankyou-select");
  const globalDriveInput = document.getElementById("global-drive-url");
  const globalTyViInput = document.getElementById("global-ty-vi");
  const globalTyZhInput = document.getElementById("global-ty-zh");
  const globalStatusEl = document.getElementById("global-config-status");

  const isLocal = /^(file:|https?:\/\/(localhost|127\.0\.0\.1))/i.test(window.location.href);
  const isLocalHttp = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(window.location.origin);
  const baseOrigin = isLocal
    ? "https://thuantuongtieudinh.io.vn/"
    : window.location.origin + "/";
  const previewOrigin = isLocalHttp
    ? window.location.origin + "/"
    : /^file:/i.test(window.location.href)
      ? "index.html"
      : baseOrigin;
  const apiBase = isLocal ? "https://thuantuongtieudinh.io.vn" : "";

  function isPlaceholderDriveUrl(val = "") {
    return /1ExampleWeddingPhotos/i.test(String(val || "").trim());
  }

  function getSessionAdminKey() {
    try {
      return String(sessionStorage.getItem(STORAGE_ADMIN_KEY) || "").trim();
    } catch (_) {
      return "";
    }
  }

  function setSessionAdminKey(k) {
    try {
      if (k) sessionStorage.setItem(STORAGE_ADMIN_KEY, String(k).trim());
      else sessionStorage.removeItem(STORAGE_ADMIN_KEY);
    } catch (_) {}
  }

  const adminAuthBannerEl = document.getElementById("admin-auth-banner");
  const adminAuthFormEl = document.getElementById("admin-auth-form");
  const adminAuthKeyInp = document.getElementById("admin-auth-key-input");
  const adminAuthMsgEl = document.getElementById("admin-auth-msg");

  function showAdminAuthBanner(msg) {
    if (!adminAuthBannerEl) return;
    adminAuthBannerEl.hidden = false;
    if (adminAuthMsgEl && msg) adminAuthMsgEl.textContent = msg;
    if (adminAuthKeyInp) {
      adminAuthKeyInp.focus();
    }
  }

  function hideAdminAuthBanner() {
    if (adminAuthBannerEl) adminAuthBannerEl.hidden = true;
  }

  if (adminAuthFormEl) {
    adminAuthFormEl.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = (adminAuthKeyInp ? adminAuthKeyInp.value : "").trim();
      if (!val) {
        notify("⚠️ Hãy nhập mã khóa Admin.");
        if (adminAuthKeyInp) adminAuthKeyInp.focus();
        return;
      }
      setSessionAdminKey(val);
      fetchAnalytics(true);
    });
  }

  async function adminApiFetch(path, { method = "GET", body, cache } = {}) {
    const headers = { "X-Admin-Action": "1" };
    const adminKey = getSessionAdminKey();
    if (adminKey) headers["X-Admin-Key"] = adminKey;
    const init = { method, headers };
    if (cache) init.cache = cache;
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
    try {
      const res = await fetch(`${apiBase}${path}`, init);
      let data = null;
      try {
        data = await res.json();
      } catch (_) {}
      if (res.status === 401 || (data && data.authRequired)) {
        const msg = (data && data.error) || "Cần nhập mã khóa Admin để tiếp tục.";
        showAdminAuthBanner(msg);
        return { ok: false, status: 401, authRequired: true, error: msg, data };
      }
      if (!res.ok || (data && data.ok === false)) {
        const errMsg = (data && data.error) || `Lỗi máy chủ (HTTP ${res.status})`;
        return { ok: false, status: res.status, error: errMsg, data };
      }
      if (path.startsWith("/api/stats")) {
        hideAdminAuthBanner();
      }
      return { ok: true, status: res.status, data };
    } catch (_) {
      return {
        ok: false,
        status: 0,
        error: "Không thể kết nối máy chủ"
      };
    }
  }

  // TAB SWITCHING WITH CLEAN "/" URL ROUTING & RELOAD PERSISTENCE
  const TAB_TO_SLUG = {
    "tab-guests": "khach-moi",
    "tab-logs": "nhat-ky",
    "tab-thankyou": "che-do",
    "tab-qr": "in-qr",
    "tab-seating": "so-do-ban"
  };
  const SLUG_TO_TAB = {
    "khach-moi": "tab-guests",
    "guests": "tab-guests",
    "nhat-ky": "tab-logs",
    "logs": "tab-logs",
    "che-do": "tab-thankyou",
    "thankyou": "tab-thankyou",
    "in-qr": "tab-qr",
    "qr": "tab-qr",
    "so-do-ban": "tab-seating",
    "seating": "tab-seating"
  };
  const STORAGE_ACTIVE_TAB = "td_admin_active_tab_v1";
  let activeAdminTabId = "tab-guests";
  let latestVisitLogs = [];
  let guestsRenderLimit = 40;
  let adminBootCompleted = false;

  function resolveTabFromUrlOrStorage() {
    try {
      const pathParts = window.location.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
      const lastSeg = (pathParts[pathParts.length - 1] || "").toLowerCase();
      if (SLUG_TO_TAB[lastSeg]) return SLUG_TO_TAB[lastSeg];

      const hashClean = window.location.hash.replace(/^#\/?/, "").trim().toLowerCase();
      if (SLUG_TO_TAB[hashClean]) return SLUG_TO_TAB[hashClean];

      const qTab = (new URLSearchParams(window.location.search).get("tab") || "").trim().toLowerCase();
      if (SLUG_TO_TAB[qTab]) return SLUG_TO_TAB[qTab];
      if (TAB_TO_SLUG[qTab]) return qTab;

      const savedTab = localStorage.getItem(STORAGE_ACTIVE_TAB);
      if (savedTab && TAB_TO_SLUG[savedTab]) return savedTab;
    } catch (_) {}
    return "tab-guests";
  }

  function activateAdminTab(targetId, updateHistory = true, replaceHistory = false) {
    const validId = TAB_TO_SLUG[targetId] ? targetId : "tab-guests";
    activeAdminTabId = validId;
    const slug = TAB_TO_SLUG[validId];
    document.querySelectorAll(".adm-tab-btn").forEach((b) => {
      const isSelected = b.dataset.tab === validId;
      b.classList.toggle("is-active", isSelected);
      b.setAttribute("aria-selected", String(isSelected));
      b.setAttribute("tabindex", isSelected ? "0" : "-1");
    });
    document.querySelectorAll(".adm-panel").forEach((p) => {
      const isActive = p.id === validId;
      p.classList.toggle("is-active", isActive);
      p.hidden = !isActive;
    });
    try {
      localStorage.setItem(STORAGE_ACTIVE_TAB, validId);
    } catch (_) {}

    if (updateHistory) {
      try {
        if (window.location.protocol === "file:") {
          const targetHash = "#/" + slug;
          if (window.location.hash !== targetHash) {
            if (replaceHistory) history.replaceState({ tab: validId }, "", targetHash);
            else history.pushState({ tab: validId }, "", targetHash);
          }
        } else {
          const targetPath = "/link-khach-moi/" + slug;
          if (window.location.pathname !== targetPath) {
            if (replaceHistory) history.replaceState({ tab: validId }, "", targetPath + window.location.search);
            else history.pushState({ tab: validId }, "", targetPath + window.location.search);
          }
        }
      } catch (_) {}
    }

    // Lazy-render active tab's DOM on demand to keep DOM lean (< 2,500 nodes)
    if (adminBootCompleted) {
      if (validId === "tab-guests" && typeof buildRows === "function") {
        buildRows();
      } else if (validId === "tab-logs" && typeof renderVisitLogsTable === "function") {
        renderVisitLogsTable(latestVisitLogs);
      } else if (validId === "tab-seating" && typeof renderSeineFloorplan === "function") {
        renderSeineFloorplan();
      }
      // Clear hidden heavy tab containers so inactive DOM stays minimal
      if (validId !== "tab-guests" && cardsContainer && cardsContainer.childElementCount > 0) {
        cardsContainer.innerHTML = "";
      }
      if (validId !== "tab-logs") {
        const tb = document.getElementById("guest-activity-tbody");
        if (tb && tb.childElementCount > 0) tb.innerHTML = "";
      }
      if (validId !== "tab-seating" && typeof renderSeineFloorplan === "function") {
        renderSeineFloorplan();
      }
    }
  }

  const admTabBtns = Array.from(document.querySelectorAll(".adm-tab-btn"));
  admTabBtns.forEach((btn, idx) => {
    btn.addEventListener("click", () => {
      activateAdminTab(btn.dataset.tab, true, false);
    });
    btn.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const nextIdx = (idx + (e.key === "ArrowRight" ? 1 : -1) + admTabBtns.length) % admTabBtns.length;
        const nextBtn = admTabBtns[nextIdx];
        if (nextBtn) {
          nextBtn.focus();
          activateAdminTab(nextBtn.dataset.tab, true, false);
        }
      }
    });
  });

  window.addEventListener("popstate", () => {
    activateAdminTab(resolveTabFromUrlOrStorage(), false, false);
  });
  window.addEventListener("hashchange", () => {
    activateAdminTab(resolveTabFromUrlOrStorage(), false, false);
  });

  // Immediately restore active tab on initial load
  activateAdminTab(resolveTabFromUrlOrStorage(), true, true);

  // QUICK INSERT TAIWAN SAMPLE NAMES
  document.querySelectorAll("[data-insert]").forEach((el) => {
    el.addEventListener("click", () => {
      const sample = el.getAttribute("data-insert");
      const cur = listArea.value.trim();
      listArea.value = cur ? cur + "\n" + sample : sample;
      listArea.focus();
      notify(`📋 Đã chép mẫu "${sample}" vào ô nhập!`);
    });
  });

  // FILTER CHIPS, GROUP FILTER, SEARCH & BULK ACTIONS
  document.querySelectorAll("#guest-filter-chips .filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      currentFilter = chip.dataset.filter || "all";
      guestsRenderLimit = 40;
      document.querySelectorAll("#guest-filter-chips .filter-chip").forEach((c) =>
        c.classList.toggle("is-active", c === chip)
      );
      buildRows();
    });
  });
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      guestsRenderLimit = 40;
      buildRows();
    });
  }
  const grpFilterSelectEl = document.getElementById("guest-group-filter");
  if (grpFilterSelectEl) {
    grpFilterSelectEl.addEventListener("change", () => {
      guestsRenderLimit = 40;
      buildRows();
    });
  }

  const btnBulkSelectVisible = document.getElementById("btn-bulk-select-visible");
  const btnBulkSelectNamed = document.getElementById("btn-bulk-select-named");
  const btnBulkClearSel = document.getElementById("btn-bulk-clear-selection");
  const btnApplyBulkAssign = document.getElementById("btn-apply-bulk-assign");

  // Floating Bulk Action Dock Elements
  const bulkFloatBadge = document.getElementById("bulk-float-badge");
  const bulkFloatingDock = document.getElementById("bulk-floating-dock");
  const btnFloatApply = document.getElementById("btn-float-apply");
  const btnFloatClear = document.getElementById("btn-float-clear");
  const bulkFloatGroup = document.getElementById("bulk-float-group");
  const bulkFloatTable = document.getElementById("bulk-float-table");
  const bulkFloatMode = document.getElementById("bulk-float-mode");
  const bulkFloatMorning = document.getElementById("bulk-float-morning");

  function updateBulkBadgeUI() {
    const count = (window._bulkSelectedSet && window._bulkSelectedSet.size) || 0;
    const b = document.getElementById("bulk-selected-badge");
    if (b) b.textContent = `Đã tích: ${count} mục`;
    if (bulkFloatBadge) bulkFloatBadge.textContent = `⚡ Đã chọn: ${count} mục`;
    if (bulkFloatingDock) bulkFloatingDock.classList.toggle("is-visible", count > 0);
  }
  window.updateBulkBadgeUI = updateBulkBadgeUI;
  const updateBulkBadge = updateBulkBadgeUI;

  if (btnBulkSelectVisible) {
    btnBulkSelectVisible.addEventListener("click", () => {
      window._bulkSelectedSet = window._bulkSelectedSet || new Set();
      (window._visibleBulkItems || []).forEach((it) => window._bulkSelectedSet.add(it.token));
      buildRows();
      notify(`☑️ Đã tích chọn ${(window._visibleBulkItems || []).length} mục đang hiển thị!`);
    });
  }
  if (btnBulkSelectNamed) {
    btnBulkSelectNamed.addEventListener("click", () => {
      window._bulkSelectedSet = new Set();
      (window._visibleBulkItems || []).forEach((it) => {
        if (it.type === "guest") window._bulkSelectedSet.add(it.token);
      });
      buildRows();
      notify(`✅ Đã tích chọn ${window._bulkSelectedSet.size} khách Đã có tên!`);
    });
  }
  if (btnBulkClearSel) {
    btnBulkClearSel.addEventListener("click", () => {
      window._bulkSelectedSet = new Set();
      const rFrom = document.getElementById("bulk-range-from");
      const rTo = document.getElementById("bulk-range-to");
      if (rFrom) rFrom.value = "";
      if (rTo) rTo.value = "";
      buildRows();
      notify("✕ Đã bỏ tích chọn toàn bộ.");
    });
  }
  if (btnFloatClear) {
    btnFloatClear.addEventListener("click", () => {
      window._bulkSelectedSet = new Set();
      const rFrom = document.getElementById("bulk-range-from");
      const rTo = document.getElementById("bulk-range-to");
      if (rFrom) rFrom.value = "";
      if (rTo) rTo.value = "";
      buildRows();
      notify("✕ Đã bỏ tích chọn toàn bộ.");
    });
  }

  // Sync selections between Top Bulk Bar and Floating Dock
  const bulkAssignGrp = document.getElementById("bulk-assign-group");
  const bulkAssignTbl = document.getElementById("bulk-assign-table");
  const bulkAssignMod = document.getElementById("bulk-assign-mode");
  const bulkAssignMorning = document.getElementById("bulk-assign-morning");

  if (bulkAssignGrp && bulkFloatGroup) {
    bulkAssignGrp.addEventListener("change", () => { bulkFloatGroup.value = bulkAssignGrp.value; });
    bulkFloatGroup.addEventListener("change", () => { bulkAssignGrp.value = bulkFloatGroup.value; });
  }
  if (bulkAssignTbl && bulkFloatTable) {
    bulkAssignTbl.addEventListener("change", () => { bulkFloatTable.value = bulkAssignTbl.value; });
    bulkFloatTable.addEventListener("change", () => { bulkAssignTbl.value = bulkFloatTable.value; });
  }
  if (bulkAssignMod && bulkFloatMode) {
    bulkAssignMod.addEventListener("change", () => { bulkFloatMode.value = bulkAssignMod.value; });
    bulkFloatMode.addEventListener("change", () => { bulkAssignMod.value = bulkFloatMode.value; });
  }
  if (bulkAssignMorning && bulkFloatMorning) {
    bulkAssignMorning.addEventListener("change", () => { bulkFloatMorning.value = bulkAssignMorning.value; });
    bulkFloatMorning.addEventListener("change", () => { bulkAssignMorning.value = bulkFloatMorning.value; });
  }

  async function executeBulkAssignment({ grpVal, tblVal, modeVal, morningVal = "__keep__", fromNum, toNum, rangeMode }) {
    if (grpVal === "__keep__" && tblVal === "__keep__" && modeVal === "__keep__" && morningVal === "__keep__") {
      notify("⚠️ Hãy chọn ít nhất 1 mục cần gán (Nhóm khách, Bàn tiệc, Loại thiệp hoặc Lễ Sáng)!");
      return false;
    }

    const targetGuestKeys = new Set();
    const targetSlotNums = new Set();

    if (fromNum >= 1 && toNum >= fromNum) {
      if (rangeMode === "slot") {
        for (let s = fromNum; s <= Math.min(9999, toNum); s++) {
          targetSlotNums.add(s);
        }
      } else {
        (window._visibleBulkItems || []).forEach((it) => {
          if (it.orderIdx >= fromNum && it.orderIdx <= toNum) {
            if (it.type === "guest") targetGuestKeys.add(it.key);
            else if (it.slotNum) targetSlotNums.add(it.slotNum);
          }
        });
      }
    }

    window._bulkSelectedSet = window._bulkSelectedSet || new Set();
    window._bulkSelectedSet.forEach((tok) => {
      if (tok.startsWith("guest:")) targetGuestKeys.add(tok.slice(6));
      else if (tok.startsWith("slot:")) {
        const sn = parseInt(tok.slice(5), 10);
        if (sn >= 1) targetSlotNums.add(sn);
      }
    });

    const totalSelected = targetGuestKeys.size + targetSlotNums.size;
    if (totalSelected === 0) {
      notify("⚠️ Hãy tích chọn ít nhất 1 dòng bên dưới hoặc nhập khoảng số (Từ → Đến) nhé!");
      return false;
    }

    const nextGroup = grpVal === "__keep__" ? undefined : grpVal;
    const nextTable = tblVal === "__keep__" ? undefined : tblVal;
    const nextMode = modeVal === "__keep__" ? undefined : modeVal;
    const nextMorning = morningVal === "__keep__" ? undefined : normalizeMorningMode(morningVal);

    if (nextMode === "thankyou") {
      const candidateDrive =
        (globalDriveInput && globalDriveInput.value.trim()) || globalSiteConfig.driveUrl || "";
      if (isPlaceholderDriveUrl(candidateDrive)) {
        notify("⚠️ Link Google Drive vẫn là link mẫu. Hãy xóa hoặc dán link thật trước khi bật Cảm Ơn!");
        return false;
      }
    }

    const prevSavedGuestsSnap = savedGuests.map((g) => ({ ...g }));
    const prevSlotsSnap = {};
    Object.keys(serverSlots).forEach((k) => {
      prevSlotsSnap[k] = { ...serverSlots[k] };
    });

    const guestNamesToUpdate = [];
    savedGuests = savedGuests.map((g) => {
      const k = normalizeNameKey(g.name);
      const matchedByGuest = targetGuestKeys.has(k);
      const matchedBySlot = g.slot && targetSlotNums.has(Number(g.slot));
      if (!matchedByGuest && !matchedBySlot) return g;
      guestNamesToUpdate.push(g.name);
      const updated = { ...g };
      if (nextGroup !== undefined) updated.group = nextGroup;
      if (nextTable !== undefined) updated.table = nextTable;
      if (nextMode !== undefined) updated.mode = nextMode;
      if (nextMorning !== undefined) updated.morning = nextMorning;
      if (g.slotCode && serverSlots[g.slotCode]) {
        if (nextGroup !== undefined) serverSlots[g.slotCode].group = nextGroup;
        if (nextTable !== undefined) serverSlots[g.slotCode].table = nextTable;
        if (nextMode !== undefined) serverSlots[g.slotCode].mode = nextMode;
        if (nextMorning !== undefined) serverSlots[g.slotCode].morning = nextMorning;
      }
      return updated;
    });

    const slotItemsToUpdate = [];
    targetSlotNums.forEach((n) => {
      const code = makeSlotCode(n);
      const prev = serverSlots[code] || {
        num: n,
        name: "",
        lang: "vi",
        mode: "invite",
        morning: "",
        group: "",
        table: "",
        pax: 1,
        assignedAt: new Date().toISOString()
      };
      if (nextGroup !== undefined) prev.group = nextGroup;
      if (nextTable !== undefined) prev.table = nextTable;
      if (nextMode !== undefined) prev.mode = nextMode;
      if (nextMorning !== undefined) prev.morning = nextMorning;
      serverSlots[code] = prev;
      slotItemsToUpdate.push({ code, num: n });
    });

    const selectedSnap = Array.from(window._bulkSelectedSet);
    window._bulkSelectedSet.clear();
    const rFrom = document.getElementById("bulk-range-from");
    const rTo = document.getElementById("bulk-range-to");
    if (rFrom) rFrom.value = "";
    if (rTo) rTo.value = "";

    persistLocalGuests();
    if (typeof persistLocalSlots === "function") persistLocalSlots();
    buildRows();
    if (typeof renderSlotsTable === "function") renderSlotsTable();
    if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();

    const apiRes = await adminApiFetch("/api/seating", {
      method: "POST",
      body: {
        action: "bulk_assign",
        guestNames: guestNamesToUpdate,
        slotItems: slotItemsToUpdate,
        ...(nextGroup !== undefined ? { group: nextGroup } : {}),
        ...(nextTable !== undefined ? { table: nextTable } : {}),
        ...(nextMode !== undefined ? { mode: nextMode } : {}),
        ...(nextMorning !== undefined ? { morning: nextMorning } : {})
      }
    });

    if (!apiRes.ok) {
      savedGuests = prevSavedGuestsSnap;
      serverSlots = prevSlotsSnap;
      window._bulkSelectedSet = new Set(selectedSnap);
      persistLocalGuests();
      if (typeof persistLocalSlots === "function") persistLocalSlots();
      buildRows();
      if (typeof renderSlotsTable === "function") renderSlotsTable();
      if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
      notify(`⚠️ Chưa lưu được lên máy chủ (${apiRes.error}). Vui lòng thử lại!`);
      return false;
    }

    const cap = seatingConfig.seatsPerTable || 10;
    const occAfter = nextTable ? computeTableStats().occ : null;
    if (nextTable && occAfter && (occAfter[nextTable] || 0) > cap) {
      notify(
        `⚠️ Đã xếp ${totalSelected} mục vào Bàn ${String(nextTable).padStart(2, "0")} — lưu ý bàn đang có ${occAfter[nextTable]}/${cap} ghế (vượt sức chứa)!`
      );
    } else {
      notify(`⚡ Đã áp dụng hàng loạt cho ${totalSelected} mục thành công!`);
    }
    return true;
  }

  if (btnApplyBulkAssign) {
    btnApplyBulkAssign.addEventListener("click", () => {
      const grpSel = document.getElementById("bulk-assign-group");
      const tblSel = document.getElementById("bulk-assign-table");
      const modeSel = document.getElementById("bulk-assign-mode");
      const morningSel = document.getElementById("bulk-assign-morning");
      const rangeTypeEl = document.getElementById("bulk-range-type");
      const rangeFromEl = document.getElementById("bulk-range-from");
      const rangeToEl = document.getElementById("bulk-range-to");

      const grpVal = grpSel ? grpSel.value : "__keep__";
      const tblVal = tblSel ? tblSel.value : "__keep__";
      const modeVal = modeSel ? modeSel.value : "__keep__";
      const morningVal = morningSel ? morningSel.value : "__keep__";
      const fromNum = parseInt(rangeFromEl ? rangeFromEl.value : "", 10);
      const toNum = parseInt(rangeToEl ? rangeToEl.value : "", 10);
      const rangeMode = rangeTypeEl ? rangeTypeEl.value : "order";

      executeBulkAssignment({ grpVal, tblVal, modeVal, morningVal, fromNum, toNum, rangeMode });
    });
  }

  if (btnFloatApply) {
    btnFloatApply.addEventListener("click", () => {
      const grpVal = bulkFloatGroup ? bulkFloatGroup.value : "__keep__";
      const tblVal = bulkFloatTable ? bulkFloatTable.value : "__keep__";
      const modeVal = bulkFloatMode ? bulkFloatMode.value : "__keep__";
      const morningVal = bulkFloatMorning ? bulkFloatMorning.value : "__keep__";
      executeBulkAssignment({ grpVal, tblVal, modeVal, morningVal, fromNum: NaN, toNum: NaN, rangeMode: "order" });
    });
  }

  const STORAGE_GUEST_NOTES = "td_guest_notes_v1";
  let guestNotesMap = {};

  function normalizeNameKey(name) {
    return String(name || "")
      .normalize("NFC")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  try {
    const rawNotes = localStorage.getItem(STORAGE_GUEST_NOTES);
    if (rawNotes) {
      const parsedNotes = JSON.parse(rawNotes);
      if (parsedNotes && typeof parsedNotes === "object") {
        guestNotesMap = parsedNotes;
      }
    }
  } catch (_) {}

  try {
    const rawV2 = localStorage.getItem(STORAGE_SAVED_GUESTS);
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      if (Array.isArray(parsed)) {
        savedGuests = parsed.map((g) => {
          const k = normalizeNameKey(g && g.name);
          const noteVal = String((g && g.note) || guestNotesMap[k] || "").trim();
          if (k && noteVal) guestNotesMap[k] = noteVal;
          return { ...g, note: noteVal };
        });
      }
    }
  } catch (_) {}

  function persistLocalGuests() {
    try {
      savedGuests.forEach((g) => {
        if (g && g.name) {
          const k = normalizeNameKey(g.name);
          if (g.note) guestNotesMap[k] = String(g.note).trim();
        }
      });
      localStorage.setItem(STORAGE_GUEST_NOTES, JSON.stringify(guestNotesMap));
      localStorage.setItem(STORAGE_SAVED_GUESTS, JSON.stringify(savedGuests));
    } catch (_) {}
  }

  function ensureGuestSlotsNormalized() {
    if (!Array.isArray(savedGuests) || savedGuests.length === 0) return false;
    let changed = false;

    // 1. Give sequential slot numbers (1..N) to any legacy guests missing .slot
    savedGuests.forEach((g, idx) => {
      if (g && (!g.slot || Number(g.slot) < 1)) {
        g.slot = idx + 1;
        changed = true;
      }
    });

    // 2. Deduplicate colliding slot numbers in order so #1..#N each own a unique 1-to-1 QR slot
    const usedSlots = new Set();
    savedGuests.forEach((g) => {
      if (!g) return;
      let sNum = Number(g.slot) || 1;
      if (usedSlots.has(sNum)) {
        let cand = 1;
        while (usedSlots.has(cand)) cand++;
        sNum = cand;
        changed = true;
      }
      usedSlots.add(sNum);
      const expectedCode = makeSlotCode(sNum);
      if (g.slot !== sNum || g.slotCode !== expectedCode) {
        g.slot = sNum;
        g.slotCode = expectedCode;
        changed = true;
      }

      if (serverSlots && typeof serverSlots === "object") {
        const prevS = serverSlots[expectedCode] || {};
        if (prevS.name !== g.name || prevS.num !== sNum) {
          changed = true;
        }
        const resolvedMorning = normalizeMorningMode(
          g.morning !== undefined ? g.morning : prevS.morning
        );
        g.morning = resolvedMorning;
        serverSlots[expectedCode] = {
          ...prevS,
          num: sNum,
          name: g.name,
          lang: g.lang || (/[\u4e00-\u9fff]/.test(g.name || "") ? "zh" : "vi"),
          mode: g.mode || prevS.mode || "invite",
          morning: resolvedMorning,
          group: g.group || prevS.group || "",
          table: g.table || prevS.table || "",
          pax: Math.max(1, parseInt(g.pax || prevS.pax || "1", 10) || 1),
          assignedAt: prevS.assignedAt || g.createdAt || new Date().toISOString()
        };
      }
    });

    // Sort savedGuests by their fixed slot number so #1..#414 are always in clean ascending order
    savedGuests.sort((a, b) => (Number(a?.slot) || 9999) - (Number(b?.slot) || 9999));

    if (changed) {
      persistLocalGuests();
      if (typeof persistLocalSlots === "function") persistLocalSlots();
      if (!window._slotNormSyncedOnce && savedGuests.length > 0) {
        window._slotNormSyncedOnce = true;
        setTimeout(async () => {
          for (const g of savedGuests) {
            if (!g || !g.slotCode || !g.name) continue;
            await adminApiFetch("/api/slots", {
              method: "POST",
              body: {
                action: "assign",
                code: g.slotCode,
                name: g.name,
                lang: g.lang || (/[\u4e00-\u9fff]/.test(g.name) ? "zh" : "vi"),
                note: g.note || "",
                mode: g.mode || "invite",
                morning: normalizeMorningMode(g.morning),
                group: g.group || "",
                table: g.table || "",
                pax: g.pax || 1
              }
            });
          }
        }, 300);
      }
    }
    return changed;
  }

  function mergeServerGuests(serverList) {
    if (!Array.isArray(serverList)) return;
    const localByKey = new Map();
    savedGuests.forEach((g) => {
      if (g && g.name) localByKey.set(normalizeNameKey(g.name), g);
    });
    const map = new Map();
    serverList.forEach((g) => {
      if (g && g.name) {
        const k = normalizeNameKey(g.name);
        const loc = localByKey.get(k);
        const mergedNote = String(g.note || (loc && loc.note) || guestNotesMap[k] || "").trim();
        if (mergedNote) guestNotesMap[k] = mergedNote;

        const mergedTable =
          g.table !== undefined && g.table !== ""
            ? String(g.table)
            : loc && loc.table !== undefined && loc.table !== ""
              ? String(loc.table)
              : "";
        const mergedGroup =
          g.group !== undefined && g.group !== ""
            ? String(g.group)
            : loc && loc.group !== undefined && loc.group !== ""
              ? String(loc.group)
              : "";
        const mergedPax =
          g.pax && Number(g.pax) >= 1
            ? Number(g.pax)
            : loc && loc.pax && Number(loc.pax) >= 1
              ? Number(loc.pax)
              : 1;
        const mergedSlot = g.slot || (loc ? loc.slot : null);
        const mergedSlotCode = g.slotCode || (loc ? loc.slotCode : "");
        const mergedMode = g.mode || (loc ? loc.mode : "invite") || "invite";
        const mergedMorning = normalizeMorningMode(
          g.morning !== undefined ? g.morning : loc ? loc.morning : ""
        );
        const mergedAliases = Array.from(
          new Set([
            ...(loc && Array.isArray(loc.aliases) ? loc.aliases : []),
            ...(Array.isArray(g.aliases) ? g.aliases : [])
          ])
        ).filter(Boolean);

        map.set(k, {
          ...loc,
          ...g,
          table: mergedTable,
          group: mergedGroup,
          pax: mergedPax,
          slot: mergedSlot,
          slotCode: mergedSlotCode,
          mode: mergedMode,
          morning: mergedMorning,
          note: mergedNote,
          ...(mergedAliases.length ? { aliases: mergedAliases } : {})
        });
      }
    });
    savedGuests.forEach((g) => {
      if (g && g.name) {
        const k = normalizeNameKey(g.name);
        if (!map.has(k)) {
          const mergedNote = String(g.note || guestNotesMap[k] || "").trim();
          if (mergedNote) guestNotesMap[k] = mergedNote;
          map.set(k, { ...g, note: mergedNote });
        }
      }
    });
    savedGuests = Array.from(map.values());
    ensureGuestSlotsNormalized();
    persistLocalGuests();
    const batchTa = document.getElementById("qr-batch-guests");
    if (batchTa && !batchTa.value.trim() && savedGuests.length > 0) {
      batchTa.value = savedGuests.map((g) => g.name).filter(Boolean).join("\n");
      if (typeof updateBatchLiveSummary === "function") updateBatchLiveSummary();
    }
  }

  let noteSaveTimers = {};
  function saveGuestPrivateNote(name, noteValue, showToastNow = false) {
    const key = normalizeNameKey(name);
    const cleanNote = String(noteValue || "").trim();
    if (cleanNote) {
      guestNotesMap[key] = cleanNote;
    } else {
      delete guestNotesMap[key];
    }
    let targetRecord = null;
    savedGuests = savedGuests.map((g) => {
      if (normalizeNameKey(g.name) === key) {
        targetRecord = { ...g, note: cleanNote };
        return targetRecord;
      }
      return g;
    });
    persistLocalGuests();

    clearTimeout(noteSaveTimers[key]);
    noteSaveTimers[key] = setTimeout(async () => {
      const apiRes = await adminApiFetch("/api/guests", {
        method: "POST",
        body: {
          action: "update_note",
          name,
          note: cleanNote
        }
      });
      if (!apiRes.ok) {
        notify(`⚠️ Chưa lưu được ghi chú cho "${name}" (${apiRes.error}).`);
        return;
      }
      if (targetRecord) {
        await adminApiFetch("/api/guests", {
          method: "POST",
          body: {
            action: "add",
            guests: [targetRecord]
          }
        });
      }
    }, showToastNow ? 50 : 450);

    if (showToastNow) {
      notify(
        cleanNote
          ? `📝 Đã lưu ghi chú riêng cho "${name}": ${cleanNote}`
          : `📝 Đã xóa ghi chú riêng của "${name}".`
      );
    }
  }

  function notify(msg) {
    toast.innerHTML = "";
    toast.textContent = msg;
    toast.classList.add("is-shown");
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove("is-shown"), 3200);
  }

  function notifyWithUndo(msg, onUndo) {
    toast.innerHTML = "";
    const span = document.createElement("span");
    span.textContent = msg;
    toast.appendChild(span);
    if (typeof onUndo === "function") {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "toast-undo-btn";
      btn.textContent = "↩️ Hoàn tác";
      btn.addEventListener("click", () => {
        toast.classList.remove("is-shown");
        clearTimeout(timer);
        onUndo();
      });
      toast.appendChild(btn);
    }
    toast.classList.add("is-shown");
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove("is-shown"), 6000);
  }

  async function copyText(str, okMsg) {
    try {
      await navigator.clipboard.writeText(str);
    } catch (_) {
      const ta = document.createElement("textarea");
      ta.value = str;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    notify(okMsg);
  }

  function formatCountryFlag(code) {
    const c = String(code || "VN").toUpperCase();
    if (c === "VN") return "VN - Việt Nam";
    if (c === "TW") return "TW - Đài Loan";
    if (c === "US") return "US - Mỹ";
    if (c === "SG") return "SG - Singapore";
    if (c === "AU") return "AU - Úc";
    if (c === "JP") return "JP - Nhật Bản";
    if (c === "KR") return "KR - Hàn Quốc";
    return c;
  }

  function formatExactAndRelativeTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
    const exactStr = d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit"
    });
    let rel = "";
    if (diffSec < 45) rel = "Vừa xong";
    else if (diffSec < 3600) rel = `${Math.floor(diffSec / 60)} phút trước`;
    else if (diffSec < 86400) rel = `${Math.floor(diffSec / 3600)} giờ trước`;
    else rel = `${Math.floor(diffSec / 86400)} ngày trước`;
    return `${exactStr} (${rel})`;
  }

  async function setGuestModeOnServer(name, nextMode) {
    const key = normalizeNameKey(name);
    const driveVal = (globalDriveInput && globalDriveInput.value.trim()) || "";
    if (nextMode === "thankyou" && isPlaceholderDriveUrl(driveVal || globalSiteConfig.driveUrl)) {
      notify("⚠️ Link Google Drive vẫn là link mẫu, hãy xóa hoặc dán link thật trước khi bật Cảm Ơn!");
      return false;
    }

    const prevSaved = savedGuests.map((g) => ({ ...g }));
    const prevSlotsSnap = {};
    Object.keys(serverSlots).forEach((k) => {
      prevSlotsSnap[k] = { ...serverSlots[k] };
    });

    let linkedSlotCode = "";
    savedGuests = savedGuests.map((g) => {
      if (normalizeNameKey(g.name) === key) {
        if (g.slotCode) linkedSlotCode = g.slotCode;
        return { ...g, mode: nextMode, driveUrl: driveVal || g.driveUrl || "" };
      }
      return g;
    });
    if (linkedSlotCode && serverSlots[linkedSlotCode]) {
      serverSlots[linkedSlotCode].mode = nextMode;
      persistLocalSlots();
    }
    persistLocalGuests();
    buildRows();
    if (typeof renderSlotsTable === "function") renderSlotsTable();

    const apiRes = await adminApiFetch("/api/guests", {
      method: "POST",
      body: {
        action: "toggle_mode",
        name,
        mode: nextMode,
        driveUrl: driveVal
      }
    });
    if (!apiRes.ok) {
      savedGuests = prevSaved;
      serverSlots = prevSlotsSnap;
      persistLocalGuests();
      persistLocalSlots();
      buildRows();
      if (typeof renderSlotsTable === "function") renderSlotsTable();
      notify(`⚠️ Chưa đổi được chế độ trên máy chủ (${apiRes.error}).`);
      return false;
    }
    notify(
      nextMode === "thankyou"
        ? `📸 Đã bật "Thiệp Cảm Ơn" cho link của "${name}"!`
        : nextMode === "directions"
          ? `📍 Đã bật "Chế Độ Chỉ Đường Ngày Cưới" cho "${name}"!`
          : `💌 Đã chuyển link của "${name}" về chế độ Thiệp Mời!`
    );
    return true;
  }

  async function setGuestMorningOnServer(name, nextMorningRaw) {
    const key = normalizeNameKey(name);
    const nextMorning = normalizeMorningMode(nextMorningRaw);
    const prevSaved = savedGuests.map((g) => ({ ...g }));
    const prevSlotsSnap = {};
    Object.keys(serverSlots).forEach((k) => {
      prevSlotsSnap[k] = { ...serverSlots[k] };
    });

    let linkedSlotCode = "";
    savedGuests = savedGuests.map((g) => {
      if (normalizeNameKey(g.name) === key) {
        if (g.slotCode) linkedSlotCode = g.slotCode;
        return { ...g, morning: nextMorning };
      }
      return g;
    });
    if (linkedSlotCode && serverSlots[linkedSlotCode]) {
      serverSlots[linkedSlotCode].morning = nextMorning;
    }
    Object.keys(serverSlots).forEach((code) => {
      const s = serverSlots[code];
      if (s && s.name && normalizeNameKey(s.name) === key) {
        s.morning = nextMorning;
      }
    });
    persistLocalSlots();
    persistLocalGuests();
    buildRows();
    if (typeof renderSlotsTable === "function") renderSlotsTable();

    const apiRes = await adminApiFetch("/api/guests", {
      method: "POST",
      body: {
        action: "toggle_morning",
        name,
        morning: nextMorning
      }
    });
    if (!apiRes.ok) {
      savedGuests = prevSaved;
      serverSlots = prevSlotsSnap;
      persistLocalSlots();
      persistLocalGuests();
      buildRows();
      if (typeof renderSlotsTable === "function") renderSlotsTable();
      notify(`⚠️ Chưa lưu được chế độ Lễ Sáng (${apiRes.error}).`);
      return false;
    }
    notify(
      nextMorning === "groom"
        ? `🏠 Đã bật mời "Lễ Sáng Nhà Trai (05:30) + Tiệc Tối" cho "${name}"!`
        : nextMorning === "bride"
          ? `🏡 Đã bật mời "Lễ Sáng Nhà Gái (06:00) + Tiệc Tối" cho "${name}"!`
          : nextMorning === "both"
            ? `🌅 Đã bật mời "Lễ Sáng (05:30) + Tiệc Tối (Cả 2 nhà)" cho "${name}"!`
            : `🌙 Đã chuyển "${name}" về chế độ Chỉ Tiệc Tối (18:00)!`
    );
    return true;
  }

  async function updateGuestSeatOnServer(name, nextGroup, nextTable, nextPax, showToast = true, options = {}) {
    const key = normalizeNameKey(name);
    let linkedSlotCode = "";
    const cleanPax = Math.max(1, Math.min(20, parseInt(nextPax || "1", 10) || 1));
    const cleanTable = String(nextTable || "");
    const tMeta = (cleanTable && seatingConfig.tableMeta && seatingConfig.tableMeta[cleanTable]) || {};
    const explicitGroup = options && options.source === "group";
    const effectiveGroup = explicitGroup
      ? String(nextGroup || "").trim()
      : String(nextGroup || "").trim() || tMeta.group || "";

    const prevSaved = savedGuests.map((g) => ({ ...g }));
    const prevSlotsSnap = {};
    Object.keys(serverSlots).forEach((k) => {
      prevSlotsSnap[k] = { ...serverSlots[k] };
    });

    let matched = false;
    savedGuests = savedGuests.map((g) => {
      if (normalizeNameKey(g.name) === key) {
        matched = true;
        linkedSlotCode = g.slotCode || (g.slot ? makeSlotCode(g.slot) : "");
        return { ...g, group: effectiveGroup, table: cleanTable, pax: cleanPax, slotCode: linkedSlotCode || g.slotCode };
      }
      return g;
    });
    if (!matched && name) {
      savedGuests.push({
        name,
        group: effectiveGroup,
        table: cleanTable,
        pax: cleanPax,
        mode: "invite"
      });
    }
    if (linkedSlotCode && serverSlots[linkedSlotCode]) {
      serverSlots[linkedSlotCode].group = effectiveGroup;
      serverSlots[linkedSlotCode].table = cleanTable;
      serverSlots[linkedSlotCode].pax = cleanPax;
    }
    Object.keys(serverSlots).forEach((code) => {
      const s = serverSlots[code];
      if (s && s.name && normalizeNameKey(s.name) === key) {
        s.group = effectiveGroup;
        s.table = cleanTable;
        s.pax = cleanPax;
      }
    });

    persistLocalSlots();
    persistLocalGuests();
    buildRows();
    if (typeof renderSlotsTable === "function") renderSlotsTable();
    if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();

    const apiRes = await adminApiFetch("/api/guests", {
      method: "POST",
      body: {
        action: "update_seat",
        name,
        group: effectiveGroup,
        table: cleanTable,
        pax: cleanPax
      }
    });
    if (!apiRes.ok) {
      savedGuests = prevSaved;
      serverSlots = prevSlotsSnap;
      persistLocalSlots();
      persistLocalGuests();
      buildRows();
      if (typeof renderSlotsTable === "function") renderSlotsTable();
      if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
      notify(`⚠️ Chưa lưu được xếp bàn cho "${name}" (${apiRes.error}).`);
      return false;
    }

    const data = apiRes.data;
    if (data && Array.isArray(data.savedGuests)) {
      mergeServerGuests(data.savedGuests);
      buildRows();
      if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
    }

    if (showToast) {
      const cap = seatingConfig.seatsPerTable || 10;
      const occAfter = cleanTable ? computeTableStats().occ : {};
      const usedAfter = cleanTable ? occAfter[cleanTable] || 0 : 0;
      if (cleanTable && usedAfter > cap) {
        notify(
          `⚠️ Đã xếp "${name}" vào Bàn ${String(cleanTable).padStart(2, "0")} — lưu ý bàn hiện có ${usedAfter}/${cap} ghế (vượt ${usedAfter - cap} ghế)!`
        );
      } else {
        notify(
          cleanTable
            ? `🪑 Đã xếp "${name}" vào Bàn ${String(cleanTable).padStart(2, "0")} (${cleanPax} ghế)!`
            : `🪑 Đã gỡ "${name}" khỏi bàn tiệc!`
        );
      }
    }
    return true;
  }

  async function renameGuestKeepSlot(slotNum, oldName, newName) {
    const cleanNew = String(newName || "").trim();
    const cleanOld = String(oldName || "").trim();
    if (!cleanNew) {
      notify("⚠️ Tên khách mới không được để trống!");
      return false;
    }
    const n = Math.max(1, parseInt(slotNum, 10) || 1);
    const code = makeSlotCode(n);
    const oldKey = normalizeNameKey(cleanOld);
    const newKey = normalizeNameKey(cleanNew);
    const hasHanzi = /[\u4e00-\u9fff]/.test(cleanNew);
    const newLang = hasHanzi ? "zh" : "vi";

    if (oldKey && oldKey !== newKey && guestNotesMap[oldKey] && !guestNotesMap[newKey]) {
      guestNotesMap[newKey] = guestNotesMap[oldKey];
    }

    let updatedRecord = null;
    savedGuests = savedGuests.map((g) => {
      if (
        (g && Number(g.slot) === n) ||
        (g && g.slotCode === code) ||
        (oldKey && g && normalizeNameKey(g.name) === oldKey)
      ) {
        const aliases = Array.from(
          new Set([...(Array.isArray(g.aliases) ? g.aliases : []), cleanOld].filter(Boolean))
        ).filter((a) => normalizeNameKey(a) !== newKey);
        updatedRecord = {
          ...g,
          name: cleanNew,
          lang: newLang,
          slot: n,
          slotCode: code,
          ...(aliases.length ? { aliases } : {})
        };
        return updatedRecord;
      }
      return g;
    });

    const prevSlot = serverSlots[code] || {};
    serverSlots[code] = {
      ...prevSlot,
      num: n,
      name: cleanNew,
      lang: newLang,
      mode: (updatedRecord && updatedRecord.mode) || prevSlot.mode || "invite",
      morning: normalizeMorningMode((updatedRecord && updatedRecord.morning) || prevSlot.morning),
      group: (updatedRecord && updatedRecord.group) || prevSlot.group || "",
      table: (updatedRecord && updatedRecord.table) || prevSlot.table || "",
      pax: (updatedRecord && updatedRecord.pax) || prevSlot.pax || 1,
      assignedAt: prevSlot.assignedAt || new Date().toISOString()
    };

    // Keep local visitLogsByGuest attached under newKey
    if (oldKey && oldKey !== newKey && visitLogsByGuest[oldKey]) {
      visitLogsByGuest[newKey] = (visitLogsByGuest[newKey] || []).concat(visitLogsByGuest[oldKey]);
    }

    const prevSaved = savedGuests.map((g) => ({ ...g }));
    const prevSlotsSnap = {};
    Object.keys(serverSlots).forEach((k) => {
      prevSlotsSnap[k] = { ...serverSlots[k] };
    });

    persistLocalGuests();
    if (typeof persistLocalSlots === "function") persistLocalSlots();
    buildRows();
    if (typeof renderSlotsTable === "function") renderSlotsTable();
    if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();

    const rRes = await adminApiFetch("/api/guests", {
      method: "POST",
      body: {
        action: "rename",
        oldName: cleanOld,
        newName: cleanNew,
        slot: n,
        slotCode: code,
        lang: newLang,
        note: (updatedRecord && updatedRecord.note) || ""
      }
    });
    if (!rRes.ok) {
      savedGuests = prevSaved;
      serverSlots = prevSlotsSnap;
      persistLocalGuests();
      if (typeof persistLocalSlots === "function") persistLocalSlots();
      buildRows();
      if (typeof renderSlotsTable === "function") renderSlotsTable();
      if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
      notify(`⚠️ Chưa đổi được tên trên máy chủ (${rRes.error}).`);
      return false;
    }

    const sRes = await adminApiFetch("/api/slots", {
      method: "POST",
      body: {
        action: "assign",
        code,
        name: cleanNew,
        lang: newLang,
        note: (updatedRecord && updatedRecord.note) || "",
        mode: (updatedRecord && updatedRecord.mode) || "invite",
        morning: normalizeMorningMode(updatedRecord && updatedRecord.morning),
        group: (updatedRecord && updatedRecord.group) || "",
        table: (updatedRecord && updatedRecord.table) || "",
        pax: (updatedRecord && updatedRecord.pax) || 1
      }
    });
    if (!sRes.ok) {
      notify(`⚠️ Đã đổi tên khách nhưng đồng bộ thẻ #${n} báo lỗi (${sRes.error}).`);
      return true;
    }
    notify(
      `✅ Đã đổi tên thành "${cleanNew}" — Link & Mã QR #${n} (?s=${code}) giữ nguyên cố định 100%!`
    );
    return true;
  }

  async function removeGuestFromList(name, slotNum, skipConfirm = false) {
    const key = normalizeNameKey(name);
    const targetGuest = savedGuests.find(
      (g) => (slotNum && Number(g.slot) === Number(slotNum)) || normalizeNameKey(g.name) === key
    );
    const resolvedSlot = Number(slotNum || (targetGuest && targetGuest.slot) || 0);
    const resolvedCode = resolvedSlot > 0 ? makeSlotCode(resolvedSlot) : "";

    if (!skipConfirm) {
      const msg =
        resolvedSlot > 0
          ? `Xóa tên "${name}" khỏi thẻ #${resolvedSlot}?\n(Link & Mã QR #${resolvedSlot} sẽ trở về mục Chưa có tên.)`
          : `Xác nhận xóa "${name}" khỏi danh sách?`;
      if (!window.confirm(msg)) return false;
    }

    const backupGuest = targetGuest ? { ...targetGuest } : null;
    const backupSlot = resolvedCode && serverSlots[resolvedCode] ? { ...serverSlots[resolvedCode] } : null;
    const prevSaved = savedGuests.map((g) => ({ ...g }));
    const prevSlotsSnap = {};
    Object.keys(serverSlots).forEach((k) => {
      prevSlotsSnap[k] = { ...serverSlots[k] };
    });

    savedGuests = savedGuests.filter(
      (g) => !(resolvedSlot > 0 && Number(g.slot) === resolvedSlot) && normalizeNameKey(g.name) !== key
    );
    if (resolvedCode && serverSlots[resolvedCode]) {
      delete serverSlots[resolvedCode];
      if (typeof persistLocalSlots === "function") persistLocalSlots();
    }
    persistLocalGuests();
    buildRows();
    if (typeof renderSlotsTable === "function") renderSlotsTable();
    if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();

    const rRes = await adminApiFetch("/api/guests", {
      method: "POST",
      body: { action: "remove", name }
    });
    if (!rRes.ok) {
      savedGuests = prevSaved;
      serverSlots = prevSlotsSnap;
      persistLocalGuests();
      if (typeof persistLocalSlots === "function") persistLocalSlots();
      buildRows();
      if (typeof renderSlotsTable === "function") renderSlotsTable();
      if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
      notify(`⚠️ Chưa xóa được trên máy chủ (${rRes.error}).`);
      return false;
    }

    if (resolvedCode) {
      await adminApiFetch("/api/slots", {
        method: "POST",
        body: { action: "clear", code: resolvedCode }
      });
    }

    const doneText =
      resolvedSlot > 0
        ? `🗑️ Đã xóa "${name}" khỏi thẻ #${resolvedSlot}.`
        : `🗑️ Đã xóa "${name}" khỏi danh sách.`;

    if (backupGuest) {
      notifyWithUndo(doneText, async () => {
        savedGuests.push(backupGuest);
        if (resolvedCode && backupSlot) serverSlots[resolvedCode] = backupSlot;
        persistLocalGuests();
        if (typeof persistLocalSlots === "function") persistLocalSlots();
        buildRows();
        if (typeof renderSlotsTable === "function") renderSlotsTable();
        if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
        const undoRes = await adminApiFetch("/api/guests", {
          method: "POST",
          body: { action: "add", guests: [backupGuest] }
        });
        if (!undoRes.ok) {
          notify(`⚠️ Không hoàn tác được lên máy chủ (${undoRes.error}).`);
          return;
        }
        if (resolvedCode) {
          await adminApiFetch("/api/slots", {
            method: "POST",
            body: {
              action: "assign",
              code: resolvedCode,
              name: backupGuest.name,
              lang: backupGuest.lang || "vi",
              note: backupGuest.note || "",
              mode: backupGuest.mode || "invite",
              morning: normalizeMorningMode(backupGuest.morning),
              group: backupGuest.group || "",
              table: backupGuest.table || "",
              pax: backupGuest.pax || 1
            }
          });
        }
        notify(`↩️ Đã khôi phục "${backupGuest.name}" về thẻ #${resolvedSlot || "?"}!`);
      });
    } else {
      notify(doneText);
    }
    return true;
  }

  function buildRows() {
    ensureGuestSlotsNormalized();
    const base = baseOrigin.replace(/\?.*$/, "");
    const previewBase = previewOrigin.replace(/\?.*$/, "");
    const isGuestsTabActive = activeAdminTabId === "tab-guests";
    if (!isGuestsTabActive) {
      if (cardsContainer.childElementCount > 0) cardsContainer.innerHTML = "";
    } else {
      cardsContainer.innerHTML = "";
    }
    const unnamedCount = Math.max(0, TOTAL_INVITE_TARGET - savedGuests.length);
    savedCountEl.textContent = String(savedGuests.length);
    const unnamedCountEl = document.getElementById("unnamed-slot-count");
    if (unnamedCountEl) unnamedCountEl.textContent = String(unnamedCount);
    const chipUnnamedEl = document.getElementById("chip-unnamed-count");
    if (chipUnnamedEl) chipUnnamedEl.textContent = String(unnamedCount);
    badgeSavedEl.textContent = `${savedGuests.length}/${TOTAL_INVITE_TARGET}`;

    const q = (searchInput ? searchInput.value : "").trim().toLowerCase();
    const grpFilterEl = document.getElementById("guest-group-filter");
    const activeGrpFilter = grpFilterEl ? grpFilterEl.value : "all";
    const rowsData = [];
    const { occ: tableOccMap } = computeTableStats();
    let visibleCount = 0;
    let renderedCardCount = 0;
    const effectiveLimit = q ? Math.max(guestsRenderLimit, 80) : guestsRenderLimit;
    const frag = document.createDocumentFragment();

    window._bulkSelectedSet = window._bulkSelectedSet || new Set();
    window._visibleBulkItems = [];
    const updateBulkBadge = () => {
      updateBulkBadgeUI();
    };
    updateBulkBadge();

    const bulkTableSel = document.getElementById("bulk-assign-table");
    const bulkFloatTableSel = document.getElementById("bulk-float-table");
    if (bulkTableSel || bulkFloatTableSel) {
      const prevVal = bulkTableSel ? bulkTableSel.value || "__keep__" : "__keep__";
      const prevFloatVal = bulkFloatTableSel ? bulkFloatTableSel.value || "__keep__" : "__keep__";
      const total = seatingConfig.totalTables || 40;
      const cap = seatingConfig.seatsPerTable || 10;
      const opts = [
        `<option value="__keep__">-- Giữ nguyên Bàn --</option>`,
        `<option value="">🪑 Gỡ khỏi bàn (Chưa xếp)</option>`
      ];
      for (let i = 1; i <= total; i++) {
        const tKey = String(i);
        const used = tableOccMap[tKey] || 0;
        opts.push(
          `<option value="${tKey}">🪑 Xếp vào Bàn ${String(i).padStart(2, "0")} (${used}/${cap})</option>`
        );
      }
      const htmlOpts = opts.join("");
      if (bulkTableSel) {
        bulkTableSel.innerHTML = htmlOpts;
        bulkTableSel.value = prevVal;
      }
      if (bulkFloatTableSel) {
        bulkFloatTableSel.innerHTML = htmlOpts;
        bulkFloatTableSel.value = prevFloatVal;
      }
    }

    savedGuests.forEach((guestObj, idx) => {
      const name = guestObj.name;
      const key = normalizeNameKey(name);
      const slotNum = Number(guestObj.slot) || idx + 1;
      const slotCode = guestObj.slotCode || makeSlotCode(slotNum);

      // Combine visit sessions from current name, any previous renamed aliases, and unassigned QR slot logs
      const sessionMap = new Map();
      const addSessionsForKey = (kStr) => {
        (visitLogsByGuest[kStr] || []).forEach((s) => {
          if (s) sessionMap.set(s.sid || `${s.openedAt}_${s.deviceDetail}`, s);
        });
      };
      addSessionsForKey(key);
      if (Array.isArray(guestObj.aliases)) {
        guestObj.aliases.forEach((al) => addSessionsForKey(normalizeNameKey(al)));
      }
      addSessionsForKey(normalizeNameKey(`QR số ${slotNum} (chưa gán tên)`));
      const sessions = Array.from(sessionMap.values());

      const hasOpened = sessions.length > 0;
      const anyOpenedEnv = sessions.some((s) => s.openedEnvelope);
      const hasHanzi = /[\u4e00-\u9fff]/.test(name);
      const effectiveLang = guestObj.lang === "zh" || hasHanzi ? "zh" : "vi";
      const mode = guestObj.mode || "invite";
      const linkedSlotObj =
        slotCode && serverSlots[slotCode] ? serverSlots[slotCode] : null;
      const guestMorning = normalizeMorningMode(
        guestObj.morning !== undefined ? guestObj.morning : linkedSlotObj && linkedSlotObj.morning
      );
      const guestGroup = String(
        guestObj.group || (linkedSlotObj && linkedSlotObj.group) || ""
      ).trim();
      const guestTable = String(
        guestObj.table || (linkedSlotObj && linkedSlotObj.table) || ""
      ).trim();
      const guestPax = Math.max(
        1,
        parseInt(guestObj.pax || (linkedSlotObj && linkedSlotObj.pax) || "1", 10) || 1
      );
      const globalMode =
        globalSiteConfig.globalMode ||
        (globalSiteConfig.globalThankYou
          ? "thankyou"
          : globalSiteConfig.globalDirections
            ? "directions"
            : "invite");
      const effectiveMode =
        globalMode === "thankyou" || mode === "thankyou"
          ? "thankyou"
          : globalMode === "directions" || mode === "directions"
            ? "directions"
            : "invite";
      const isTyEffective = effectiveMode === "thankyou";
      const isDirEffective = effectiveMode === "directions";
      const driveUrl = guestObj.driveUrl || globalSiteConfig.driveUrl || "";

      // Permanent Fixed Slot URL (?s=5-7n19) — NEVER changes when adding or editing guest name!
      const fullUrl = getSlotUrl(slotNum);

      const previewQs = new URLSearchParams();
      previewQs.set("s", slotCode);
      previewQs.set("to", name);
      if (effectiveLang === "zh") previewQs.set("lang", "zh");
      if (guestMorning) previewQs.set("morning", guestMorning);
      if (guestTable) {
        previewQs.set("table", guestTable);
        if (guestGroup) previewQs.set("group", guestGroup);
        if (guestPax > 1) previewQs.set("pax", String(guestPax));
      }
      if (effectiveMode === "directions" || effectiveMode === "thankyou") {
        previewQs.set("mode", effectiveMode);
      }
      previewQs.set("notrack", "1");
      const previewUrl = `${previewBase}?${previewQs.toString()}`;

      const inviteMsg =
        isTyEffective
          ? effectiveLang === "zh"
            ? `囍 婚禮感謝卡與現場相簿｜${name} 您好：\n誠摯感謝您蒞臨參與順祥與小瑩的婚禮！我們已整理好婚禮現場高畫質照片與紀錄（Google Drive），歡迎點擊專屬感謝卡瀏覽與下載：\n${fullUrl}`
            : `📸 Thiệp Cảm Ơn & Album Ảnh Cưới｜Trân trọng cảm ơn ${name},\nThuận Tường & Tiểu Dinh xin gửi lời cảm ơn chân thành nhất đến ${name} đã đến chung vui cùng gia đình. Mời ${name} mở Thiệp Cảm Ơn và xem / tải ảnh kỷ niệm buổi tiệc trên Google Drive tại đây nhé:\n${fullUrl}`
          : guestMorning
            ? effectiveLang === "zh"
              ? guestMorning === "bride"
                ? `🌅 全日婚禮敬邀｜${name} 您好：\n順祥與小瑩誠摯邀請您於 2027.01.06（星期三）參與全日喜事：\n• 06:00 - 06:30 女方家集合迎親：302 Chung cư Âu Cơ (Lô D), P. Hòa Bình（地圖定位：279/005 Lô D Trịnh Đình Trọng）\n• 09:00 前至男方家行成婚禮 & 約 10:00 用餐：80/99/7 Đường Hoàng Ngân, P. Phú Định\n• 18:00 婚禮晚宴：Riverside Palace（Seine 宴會廳）- 360D Bến Vân Đồn, P. Vĩnh Hội\n點擊查看專屬喜帖與導航：\n${fullUrl}`
                : `🌅 全日婚禮敬邀｜${name} 您好：\n順祥與小瑩誠摯邀請您於 2027.01.06（星期三）參與全日喜事：\n• 05:30 男方家集合、約 06:00 出發：80/99/7 Đường Hoàng Ngân, P. Phú Định\n• 約 06:30 女方家迎親：302 Chung cư Âu Cơ (Lô D), P. Hòa Bình（地圖定位：279/005 Lô D Trịnh Đình Trọng）\n• 09:00 前返男方家行成婚禮，約 10:00 邀請共進午宴\n• 18:00 婚禮晚宴：Riverside Palace（Seine 宴會廳）- 360D Bến Vân Đồn, P. Vĩnh Hội\n點擊查看專屬喜帖與導航：\n${fullUrl}`
              : guestMorning === "bride"
                ? `🌅 Trân trọng kính mời riêng ${name},\nThuận Tường & Tiểu Dinh thân mời ${name} chung vui trọn ngày cưới Thứ Tư, 06.01.2027:\n• 06:00 - 06:30 Tập trung & đón dâu tại Nhà Gái: 302 Chung cư Âu Cơ (Lô D), P. Hòa Bình (ghim Maps: 279/005 Lô D Trịnh Đình Trọng)\n• Trước 09:00 Về Nhà Trai làm Lễ Thành Hôn & dùng tiệc thân mật (~10:00): 80/99/7 Đường Hoàng Ngân, P. Phú Định\n• 18:00 Tiệc Cưới: Riverside Palace (Sảnh Seine) - 360D Bến Vân Đồn, P. Vĩnh Hội\nMời xem thiệp và bản đồ chỉ đường tại đây nhé:\n${fullUrl}`
                : `🌅 Trân trọng kính mời riêng ${name},\nThuận Tường & Tiểu Dinh thân mời ${name} chung vui trọn ngày cưới Thứ Tư, 06.01.2027:\n• 05:30 Tập trung Nhà Trai (~06:00 xuất phát): 80/99/7 Đường Hoàng Ngân, P. Phú Định\n• ~06:30 Lễ & đón dâu tại Nhà Gái: 302 Chung cư Âu Cơ (Lô D), P. Hòa Bình (ghim Maps: 279/005 Lô D Trịnh Đình Trọng)\n• Trước 09:00 Về Nhà Trai làm Lễ Thành Hôn & mời dùng tiệc thân mật (~10:00)\n• 18:00 Tiệc Cưới: Riverside Palace (Sảnh Seine) - 360D Bến Vân Đồn, P. Vĩnh Hội\nMời xem thiệp và bản đồ chỉ đường tại đây nhé:\n${fullUrl}`
            : effectiveLang === "zh"
              ? `囍 婚禮喜帖敬邀｜${name} 您好：\n順祥與小瑩謹訂於 2027 年 1 月 6 日（星期三）晚間六時，於越南胡志明市 RIVERSIDE PALACE（Seine 宴會廳）敬備喜筵。\n誠摯邀請您開啟專屬電子喜帖，與我們分享這份喜悅：\n${fullUrl}`
              : `💌 Trân trọng kính mời ${name},\nThuận Tường & Tiểu Dinh rất hạnh phúc được mời ${name} đến dự buổi tiệc cưới chung vui vào lúc 18:00 Thứ Tư, 06.01.2027 tại Riverside Palace (Sảnh Seine).\nMời xem thiệp cưới dành riêng cho ${name} tại đây nhé:\n${fullUrl}`;

      const devicesSummary = sessions.length
        ? sessions.map((s) => s.deviceDetail || "Thiết bị").join(" | ")
        : "Chưa mở";
      const privateNote = String(guestObj.note || guestNotesMap[key] || "").trim();

      rowsData.push({
        idx: slotNum,
        name,
        privateNote,
        effectiveLang,
        morning: guestMorning,
        fullUrl,
        inviteMsg,
        openCount: sessions.length,
        devicesSummary
      });

      // Apply UI Filter & Search (search matches Guest Name, Slot Number, AND Private Note!)
      if (currentFilter === "unnamed") return;
      if (activeGrpFilter !== "all") {
        if (activeGrpFilter === "unassigned_group" && guestGroup) return;
        if (activeGrpFilter !== "unassigned_group" && guestGroup !== activeGrpFilter) return;
      }
      if (q) {
        const slotStr = String(slotNum);
        const matchName = name.toLowerCase().includes(q);
        const matchNote = privateNote.toLowerCase().includes(q);
        const matchSlot =
          slotStr === q ||
          `#${slotStr}` === q ||
          `số ${slotStr}`.includes(q) ||
          slotCode.includes(q);
        if (!matchName && !matchNote && !matchSlot) return;
      }
      if (currentFilter === "opened" && !hasOpened) return;
      if (currentFilter === "pending" && hasOpened) return;
      if (currentFilter === "directions" && !isDirEffective) return;
      if (currentFilter === "morning" && !guestMorning) return;
      if (currentFilter === "thankyou" && !isTyEffective) return;

      visibleCount++;
      const bulkToken = `guest:${key}`;
      window._visibleBulkItems.push({
        token: bulkToken,
        type: "guest",
        name,
        key,
        orderIdx: slotNum,
        slotNum
      });

      if (!isGuestsTabActive || renderedCardCount >= effectiveLimit) return;
      renderedCardCount++;

      const safeAttrName = String(name).replace(/"/g, "&quot;");
      const statusBadgeHtml = !hasOpened
        ? `<span class="status-badge is-pending">⏳ Chưa mở thiệp</span>`
        : anyOpenedEnv
          ? `<span class="status-badge is-opened">✨ Đã mở phong bì (${sessions.length} lần)</span>`
          : `<span class="status-badge is-viewed">👀 Đã mở link (${sessions.length} lần)</span>`;

      const card = document.createElement("div");
      card.className = "guest-item-card";
      const msgBtnLabel = effectiveLang === "zh" ? "💬 LINE" : "💬 Zalo";
      window._expandedGuestRows = window._expandedGuestRows || {};
      const isRowDrawerOpen = Boolean(window._expandedGuestRows[key]);
      const tableSummaryText = guestTable
        ? `🪑 Bàn ${String(guestTable).padStart(2, "0")}${guestPax > 1 ? ` (${guestPax})` : ""}`
        : "";
      const modeBadgeHtml = isTyEffective
        ? `<span class="guest-summary-chip">📸 Cảm Ơn</span>`
        : isDirEffective
          ? `<span class="guest-summary-chip">📍 Chỉ Đường</span>`
          : "";

      card.innerHTML = `
        <div class="guest-top-row">
          <div class="guest-main-info">
            <div class="guest-title-row">
              <input
                type="checkbox"
                class="js-bulk-chk"
                aria-label="Chọn khách ${safeAttrName} (#${slotNum})"
                ${window._bulkSelectedSet.has(bulkToken) ? "checked" : ""}
                title="Tích chọn để phân nhóm hoặc xếp bàn hàng loạt"
              />
              <span class="guest-idx" title="Số thứ tự thẻ & Mã QR cố định">#${slotNum}</span>
              <span class="guest-name-text js-guest-name" title="Bấm ⚙️ Tùy chỉnh hoặc nhấp đúp để sửa tên"></span>
              <span class="lang-tag">${effectiveLang === "zh" ? "繁體中文" : "VI"}</span>
              ${guestMorning ? `<span class="morning-status-badge">${getMorningBadgeText(guestMorning)}</span>` : ""}
              ${tableSummaryText ? `<span class="guest-summary-chip">${tableSummaryText}</span>` : ""}
              ${modeBadgeHtml}
              ${privateNote ? `<span class="guest-summary-chip js-note-preview" title="Ghi chú riêng">📝</span>` : ""}
              ${statusBadgeHtml}
            </div>
            <div class="guest-url-line js-url-preview"></div>
          </div>

          <div class="guest-actions-col">
            <div class="guest-btn-group">
              <button type="button" class="btn-adm primary js-copy-link" title="Copy link cố định (?s=${slotCode})">📋 Copy Link</button>
              <button type="button" class="btn-adm js-copy-msg" title="Copy lời mời kèm link cố định">${msgBtnLabel}</button>
              <a class="btn-adm js-preview" target="_blank" rel="noopener" title="Mở xem thử (Không tính vào lượt xem)">👁️ Xem thử</a>
              <button type="button" class="btn-adm js-toggle-drawer" aria-expanded="${isRowDrawerOpen ? "true" : "false"}" title="Sửa tên, ghi chú, xếp bàn, đổi chế độ, mã QR hoặc xóa">⚙️ Tùy chỉnh</button>
            </div>
          </div>
        </div>

        <div class="guest-card-drawer js-row-drawer" ${isRowDrawerOpen ? "" : "hidden"}>
          <div class="guest-drawer-left">
            <button
              type="button"
              class="btn-adm js-edit-name-btn"
              style="height:30px; padding:0 10px; font-size:12px;"
              title="Sửa tên khách (Link ?s=${slotCode} & QR giữ nguyên 100%)"
            >✏️ Sửa tên</button>
            <span class="js-edit-name-wrap" style="display:none; align-items:center; gap:5px;">
              <input
                type="text"
                class="slot-inline-input js-edit-name-input"
                aria-label="Nhập tên mới cho thẻ #${slotNum}"
                style="width:195px; height:32px; font-weight:700;"
                placeholder="Nhập tên khách mới..."
              />
              <button type="button" class="btn-adm primary js-save-name-btn" style="height:32px; padding:0 10px; font-size:12px;">💾 Lưu</button>
              <button type="button" class="btn-adm js-cancel-name-btn" style="height:32px; padding:0 8px; font-size:12px;">Hủy</button>
            </span>

            <label class="guest-private-note-wrap ${privateNote ? "has-note" : ""}" title="Ghi chú riêng cho Cô Dâu & Chú Rể (Khách không thấy)">
              <span class="guest-private-note-icon" aria-hidden="true">📝</span>
              <input
                type="text"
                class="guest-private-note-input js-guest-note-input"
                aria-label="Ghi chú riêng cho ${safeAttrName}"
                placeholder="Ghi chú riêng..."
              />
            </label>

            <div class="seat-inline-bar" title="Phân nhóm khách & xếp vào Bàn Tiệc Sảnh Seine">
              <select class="seat-inline-select js-guest-group-select" aria-label="Nhóm khách của ${safeAttrName}">
                ${buildGroupSelectOptions(guestGroup)}
              </select>
              <select class="seat-inline-select ${guestTable ? "has-table" : ""} js-guest-table-select" aria-label="Bàn tiệc của ${safeAttrName}">
                ${buildTableSelectOptions(guestTable, tableOccMap)}
              </select>
              <input
                type="number"
                min="1"
                max="15"
                class="seat-inline-pax js-guest-pax-input"
                aria-label="Số ghế của ${safeAttrName}"
                value="${guestPax}"
                title="Số ghế (Pax)"
              />
            </div>
          </div>

          <div class="guest-drawer-right">
            <div class="mode-switch-pill" title="Chuyển đổi trực tiếp trên link đã gửi">
              <button type="button" class="mode-switch-btn js-mode-invite ${effectiveMode === "invite" ? "is-active-invite" : ""}">💌 Thiệp Mời</button>
              <button type="button" class="mode-switch-btn js-mode-dir ${isDirEffective ? "is-active-dir" : ""}">📍 Chỉ Đường</button>
              <button type="button" class="mode-switch-btn js-mode-ty ${isTyEffective ? "is-active-ty" : ""}">📸 Cảm Ơn</button>
            </div>
            <select
              class="morning-inline-select ${guestMorning ? "has-morning" : ""} js-guest-morning-select"
              aria-label="Chế độ mời Lễ Sáng cho ${safeAttrName}"
            >
              ${buildMorningSelectOptions(guestMorning)}
            </select>
            <button type="button" class="btn-adm js-open-guest-qr">📱 Mã QR</button>
            <button type="button" class="btn-adm danger js-remove-guest" aria-label="Xóa tên ${safeAttrName} khỏi thẻ #${slotNum}">🗑️ Xóa tên</button>
          </div>
        </div>
        <div class="guest-sessions-wrap js-sessions-wrap"></div>
      `;

      const nameSpanEl = card.querySelector(".js-guest-name");
      const rowDrawerEl = card.querySelector(".js-row-drawer");
      const toggleDrawerBtn = card.querySelector(".js-toggle-drawer");
      const editBtnEl = card.querySelector(".js-edit-name-btn");
      const editWrapEl = card.querySelector(".js-edit-name-wrap");
      const editInputEl = card.querySelector(".js-edit-name-input");
      const saveNameBtnEl = card.querySelector(".js-save-name-btn");
      const cancelNameBtnEl = card.querySelector(".js-cancel-name-btn");

      nameSpanEl.textContent = name;
      card.querySelector(".js-url-preview").textContent = fullUrl;
      card.querySelector(".js-preview").href = previewUrl;
      const noteChipEl = card.querySelector(".js-note-preview");
      if (noteChipEl) noteChipEl.textContent = `📝 ${privateNote}`;

      if (toggleDrawerBtn && rowDrawerEl) {
        toggleDrawerBtn.addEventListener("click", () => {
          const nextOpen = rowDrawerEl.hidden;
          rowDrawerEl.hidden = !nextOpen;
          window._expandedGuestRows[key] = nextOpen;
          toggleDrawerBtn.setAttribute("aria-expanded", nextOpen ? "true" : "false");
        });
      }

      const openInlineRename = () => {
        if (rowDrawerEl && rowDrawerEl.hidden) {
          rowDrawerEl.hidden = false;
          window._expandedGuestRows[key] = true;
          if (toggleDrawerBtn) toggleDrawerBtn.setAttribute("aria-expanded", "true");
        }
        nameSpanEl.style.display = "none";
        editBtnEl.style.display = "none";
        editWrapEl.style.display = "inline-flex";
        editInputEl.value = name;
        editInputEl.focus();
        editInputEl.select();
      };
      const closeInlineRename = () => {
        editWrapEl.style.display = "none";
        nameSpanEl.style.display = "";
        editBtnEl.style.display = "";
      };
      const commitInlineRename = () => {
        const nextVal = (editInputEl.value || "").trim();
        if (!nextVal || nextVal === name) {
          closeInlineRename();
          return;
        }
        renameGuestKeepSlot(slotNum, name, nextVal);
      };

      editBtnEl.addEventListener("click", openInlineRename);
      nameSpanEl.style.cursor = "pointer";
      nameSpanEl.addEventListener("dblclick", openInlineRename);
      saveNameBtnEl.addEventListener("click", commitInlineRename);
      cancelNameBtnEl.addEventListener("click", closeInlineRename);
      editInputEl.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          commitInlineRename();
        } else if (ev.key === "Escape") {
          ev.preventDefault();
          closeInlineRename();
        }
      });

      const bulkChkEl = card.querySelector(".js-bulk-chk");
      if (bulkChkEl) {
        bulkChkEl.addEventListener("change", () => {
          if (bulkChkEl.checked) window._bulkSelectedSet.add(bulkToken);
          else window._bulkSelectedSet.delete(bulkToken);
          updateBulkBadge();
        });
      }
      const noteInputEl = card.querySelector(".js-guest-note-input");
      const noteWrapEl = card.querySelector(".guest-private-note-wrap");
      if (noteInputEl) {
        noteInputEl.value = privateNote;
        noteInputEl.addEventListener("input", () => {
          const v = noteInputEl.value;
          if (noteWrapEl) noteWrapEl.classList.toggle("has-note", Boolean(v.trim()));
          saveGuestPrivateNote(name, v, false);
        });
        noteInputEl.addEventListener("change", () => {
          saveGuestPrivateNote(name, noteInputEl.value, true);
        });
        noteInputEl.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            noteInputEl.blur();
          }
        });
      }

      const grpSelectEl = card.querySelector(".js-guest-group-select");
      const tblSelectEl = card.querySelector(".js-guest-table-select");
      const paxInputEl = card.querySelector(".js-guest-pax-input");
      const triggerGuestSeatChange = (sourceField) => {
        updateGuestSeatOnServer(
          name,
          grpSelectEl ? grpSelectEl.value : "",
          tblSelectEl ? tblSelectEl.value : "",
          paxInputEl ? paxInputEl.value : "1",
          true,
          { source: sourceField }
        );
      };
      if (grpSelectEl) grpSelectEl.addEventListener("change", () => triggerGuestSeatChange("group"));
      if (tblSelectEl) tblSelectEl.addEventListener("change", () => triggerGuestSeatChange("table"));
      if (paxInputEl) paxInputEl.addEventListener("change", () => triggerGuestSeatChange("pax"));

      const sessionsWrap = card.querySelector(".js-sessions-wrap");
      if (!sessions.length) {
        sessionsWrap.style.display = "none";
      } else {
        window._expandedGuestSessions = window._expandedGuestSessions || {};
        const isExpanded = Boolean(window._expandedGuestSessions[key]);
        const visibleLimit = 2;
        const shownSessions = isExpanded ? sessions : sessions.slice(0, visibleLimit);

        const gridEl = document.createElement("div");
        gridEl.className = "guest-sessions-grid";

        shownSessions.forEach((s, sIdx) => {
          const num = sessions.length - sIdx;
          const pill = document.createElement("div");
          pill.className = "session-row-pill";
          const actText =
            (s.openedEnvelope ? "✨ Mở phong bì" : "👀 Mở link") +
            (s.flippedBack ? " · ↺ Lật sau" : "");
          const locText = s.city ? ` • ${s.city}` : "";
          const compactDev = String(s.deviceDetail || "Thiết bị di động").replace("Máy tính ", "");
          pill.innerHTML = `
            <span class="session-num">Lần ${num}:</span>
            <span class="session-dev js-s-dev"></span>
            <span class="session-act">${actText}</span>
            <span class="session-time">${formatExactAndRelativeTime(s.lastActionAt || s.openedAt)}${locText}</span>
          `;
          pill.querySelector(".js-s-dev").textContent = compactDev;
          gridEl.appendChild(pill);
        });
        sessionsWrap.appendChild(gridEl);

        if (sessions.length > visibleLimit) {
          const toggleBtn = document.createElement("button");
          toggleBtn.type = "button";
          toggleBtn.className = "btn-toggle-sessions";
          toggleBtn.textContent = isExpanded
            ? `▴ Thu gọn lịch sử (${sessions.length} lần mở)`
            : `▾ Xem thêm ${sessions.length - visibleLimit} lần mở trước đó`;
          toggleBtn.addEventListener("click", () => {
            window._expandedGuestSessions[key] = !window._expandedGuestSessions[key];
            buildRows();
          });
          sessionsWrap.appendChild(toggleBtn);
        }
      }

      card.querySelector(".js-mode-invite").addEventListener("click", () => {
        if (effectiveMode !== "invite") setGuestModeOnServer(name, "invite");
      });
      card.querySelector(".js-mode-dir").addEventListener("click", () => {
        if (effectiveMode !== "directions") setGuestModeOnServer(name, "directions");
      });
      card.querySelector(".js-mode-ty").addEventListener("click", () => {
        if (effectiveMode !== "thankyou") setGuestModeOnServer(name, "thankyou");
      });
      const morningSelEl = card.querySelector(".js-guest-morning-select");
      if (morningSelEl) {
        morningSelEl.addEventListener("change", () => {
          setGuestMorningOnServer(name, morningSelEl.value);
        });
      }
      card.querySelector(".js-copy-link").addEventListener("click", () =>
        copyText(fullUrl, `✅ Đã copy link cố định (#${slotNum}) của "${name}"!`)
      );
      card.querySelector(".js-copy-msg").addEventListener("click", () =>
        copyText(inviteMsg, `💌 Đã copy lời mời + link cố định cho "${name}"!`)
      );
      card.querySelector(".js-open-guest-qr").addEventListener("click", () => {
        openGuestInQrStudio(name, fullUrl, effectiveLang);
      });
      card.querySelector(".js-remove-guest").addEventListener("click", () =>
        removeGuestFromList(name, slotNum)
      );

      frag.appendChild(card);
    });

    // =====================================================================
    // PHẦN 2 (Ở PHÍA DƯỚI): CÁC SỐ QR CHƯA GÁN TÊN — BÙ ĐỦ TỔNG 414 MỤC
    // =====================================================================
    if (currentFilter !== "named" && unnamedCount > 0) {
      const usedSlotNums = new Set();
      savedGuests.forEach((g) => {
        if (g && g.slot) usedSlotNums.add(Number(g.slot));
      });
      Object.keys(serverSlots).forEach((code) => {
        const s = serverSlots[code];
        if (s && s.name && String(s.name).trim()) {
          usedSlotNums.add(Number(s.num || parseInt(code.split("-")[0], 10)));
        }
      });

      const unnamedSlotNumbers = [];
      let candidateN = 1;
      while (unnamedSlotNumbers.length < unnamedCount && candidateN <= 9999) {
        if (!usedSlotNums.has(candidateN)) {
          unnamedSlotNumbers.push(candidateN);
        }
        candidateN++;
      }

      const globalMode =
        globalSiteConfig.globalMode ||
        (globalSiteConfig.globalThankYou
          ? "thankyou"
          : globalSiteConfig.globalDirections
            ? "directions"
            : "invite");

      unnamedSlotNumbers.forEach((n, uIdx) => {
        const overallIdx = savedGuests.length + uIdx + 1;
        const code = makeSlotCode(n);
        const slotObj = serverSlots[code] || {};
        const rowGroup = String(slotObj.group || "").trim();
        const rowTable = String(slotObj.table || "").trim();
        const rowPax = Math.max(1, parseInt(slotObj.pax || "1", 10) || 1);
        const rawMode = slotObj.mode || "invite";
        const rowMorning = normalizeMorningMode(slotObj.morning);
        const effectiveMode =
          globalMode === "thankyou" || rawMode === "thankyou"
            ? "thankyou"
            : globalMode === "directions" || rawMode === "directions"
              ? "directions"
              : "invite";
        const isTyEffective = effectiveMode === "thankyou";
        const isDirEffective = effectiveMode === "directions";

        const unassignedLogKey = normalizeNameKey(`QR số ${n} (chưa gán tên)`);
        const sessions = visitLogsByGuest[unassignedLogKey] || [];
        const hasOpened = sessions.length > 0;

        if (activeGrpFilter !== "all") {
          if (activeGrpFilter === "unassigned_group" && rowGroup) return;
          if (activeGrpFilter !== "unassigned_group" && rowGroup !== activeGrpFilter) return;
        }
        if (q) {
          const numMatch =
            String(n) === q ||
            `số ${n}`.includes(q) ||
            `qr số ${n}`.includes(q) ||
            `#${n}` === q ||
            `#${String(n).padStart(2, "0")}` === q;
          const tblMatch = rowTable && (`bàn ${rowTable}` === q || `ban ${rowTable}` === q);
          if (!numMatch && !tblMatch) return;
        }
        if (currentFilter === "opened" && !hasOpened) return;
        if (currentFilter === "pending" && hasOpened) return;
        if (currentFilter === "directions" && !isDirEffective) return;
        if (currentFilter === "morning" && !rowMorning) return;
        if (currentFilter === "thankyou" && !isTyEffective) return;

        visibleCount++;
        const bulkToken = `slot:${n}`;
        window._visibleBulkItems.push({
          token: bulkToken,
          type: "slot",
          slotNum: n,
          slotCode: code,
          orderIdx: overallIdx
        });

        if (!isGuestsTabActive || renderedCardCount >= effectiveLimit) return;
        renderedCardCount++;

        const slotUrl = getSlotUrl(n);
        const slotPreviewParams = new URLSearchParams();
        slotPreviewParams.set("s", code);
        if (rowMorning) slotPreviewParams.set("morning", rowMorning);
        if (rowTable) {
          slotPreviewParams.set("table", rowTable);
          if (rowGroup) slotPreviewParams.set("group", rowGroup);
          if (rowPax > 1) slotPreviewParams.set("pax", String(rowPax));
        }
        if (effectiveMode === "directions" || effectiveMode === "thankyou") {
          slotPreviewParams.set("mode", effectiveMode);
        }
        slotPreviewParams.set("notrack", "1");
        const previewUrl = `${previewBase}?${slotPreviewParams.toString()}`;

        const statusBadgeHtml = hasOpened
          ? `<span class="status-badge is-viewed">👀 Đã quét (${sessions.length} lần • Chưa có tên)</span>`
          : `<span class="status-badge is-pending">⚪ Chưa gán tên</span>`;

        const card = document.createElement("div");
        card.className = "guest-item-card is-unnamed-slot";
        card.innerHTML = `
          <div class="guest-top-row">
            <div class="guest-main-info">
              <div class="guest-title-row">
                <div class="mob-slot-header">
                  <input
                    type="checkbox"
                    class="js-u-bulk-chk"
                    aria-label="Chọn QR Số ${n}"
                    ${window._bulkSelectedSet.has(bulkToken) ? "checked" : ""}
                    title="Tích chọn để phân nhóm hoặc xếp bàn hàng loạt"
                  />
                  <span class="guest-idx" title="Thứ tự trong tổng 414 thiệp">#${overallIdx}</span>
                  <span class="slot-num-pill">🔢 QR Số ${n}</span>
                  ${rowMorning ? `<span class="morning-status-badge">${getMorningBadgeText(rowMorning)}</span>` : ""}
                  ${statusBadgeHtml}
                  <button type="button" class="mob-toggle-details js-mob-toggle" aria-expanded="false">▾ Mở</button>
                </div>
                <div class="mob-slot-details">
                  <div class="mob-slot-name-row">
                    <input
                      type="text"
                      class="slot-inline-input js-u-slot-name"
                      aria-label="Tên khách cho QR Số ${n}"
                      placeholder="✍️ Gõ tên khách cho QR Số ${n}..."
                    />
                    <input
                      type="text"
                      class="slot-inline-input js-u-slot-note"
                      aria-label="Ghi chú riêng cho QR Số ${n}"
                      style="max-width:185px;"
                      placeholder="📝 Ghi chú..."
                    />
                    <button type="button" class="btn-adm primary js-u-slot-save">
                      💾 Lưu tên
                    </button>
                  </div>
                  <div class="seat-inline-bar" title="Xếp trước Nhóm khách & Bàn tiệc Sảnh Seine cho QR Số ${n}">
                    <select class="seat-inline-select js-u-slot-group" aria-label="Nhóm khách cho QR Số ${n}">
                      ${buildGroupSelectOptions(rowGroup)}
                    </select>
                    <select class="seat-inline-select ${rowTable ? "has-table" : ""} js-u-slot-table" aria-label="Bàn tiệc cho QR Số ${n}">
                      ${buildTableSelectOptions(rowTable, tableOccMap)}
                    </select>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      class="seat-inline-pax js-u-slot-pax"
                      aria-label="Số ghế của QR Số ${n}"
                      value="${rowPax}"
                      title="Số ghế (Pax) của QR Số ${n}"
                    />
                  </div>
                  <div class="mob-slot-actions">
                    <div class="mode-switch-pill" title="Chuyển đổi trực tiếp giữa Thiệp Mời, Chỉ Đường Ngày Cưới và Thiệp Cảm Ơn cho QR Số ${n}">
                      <button type="button" class="mode-switch-btn js-u-mode-invite ${effectiveMode === "invite" ? "is-active-invite" : ""}">💌 Thiệp Mời</button>
                      <button type="button" class="mode-switch-btn js-u-mode-dir ${isDirEffective ? "is-active-dir" : ""}">📍 Chỉ Đường</button>
                      <button type="button" class="mode-switch-btn js-u-mode-ty ${isTyEffective ? "is-active-ty" : ""}">📸 Cảm Ơn</button>
                    </div>
                    <select
                      class="morning-inline-select ${rowMorning ? "has-morning" : ""} js-u-slot-morning"
                      aria-label="Chế độ mời Lễ Sáng 05:30 cho QR Số ${n}"
                    >
                      ${buildMorningSelectOptions(rowMorning)}
                    </select>
                    <button type="button" class="btn-adm js-u-copy-link">📋 Copy Link</button>
                    <a class="btn-adm" href="${previewUrl}" target="_blank" rel="noopener">👁️ Xem thử</a>
                  </div>
                  <div class="guest-url-line">${slotUrl}</div>
                </div>
              </div>
            </div>
          </div>
        `;

        const nameInp = card.querySelector(".js-u-slot-name");
        const noteInp = card.querySelector(".js-u-slot-note");
        const saveBtn = card.querySelector(".js-u-slot-save");
        const uBulkChk = card.querySelector(".js-u-bulk-chk");
        if (uBulkChk) {
          uBulkChk.addEventListener("change", () => {
            if (uBulkChk.checked) window._bulkSelectedSet.add(bulkToken);
            else window._bulkSelectedSet.delete(bulkToken);
            updateBulkBadge();
          });
        }
        const doSaveSlotName = () => {
          const typedName = (nameInp ? nameInp.value : "").trim();
          const typedNote = (noteInp ? noteInp.value : "").trim();
          if (!typedName) {
            notify(`⚠️ Hãy gõ tên khách cho QR Số ${n} trước khi bấm Lưu nhé!`);
            if (nameInp) nameInp.focus();
            return;
          }
          assignSlotByNumber(n, typedName, typedNote, true);
        };
        if (saveBtn) saveBtn.addEventListener("click", doSaveSlotName);
        [nameInp, noteInp].forEach((inp) => {
          if (!inp) return;
          inp.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              doSaveSlotName();
            }
          });
        });

        const uGrpSel = card.querySelector(".js-u-slot-group");
        const uTblSel = card.querySelector(".js-u-slot-table");
        const uPaxInp = card.querySelector(".js-u-slot-pax");
        const triggerUSlotSeat = (sourceField) => {
          setSlotSeat(
            n,
            uGrpSel ? uGrpSel.value : "",
            uTblSel ? uTblSel.value : "",
            uPaxInp ? uPaxInp.value : "1",
            true,
            { source: sourceField }
          );
        };
        if (uGrpSel) uGrpSel.addEventListener("change", () => triggerUSlotSeat("group"));
        if (uTblSel) uTblSel.addEventListener("change", () => triggerUSlotSeat("table"));
        if (uPaxInp) uPaxInp.addEventListener("change", () => triggerUSlotSeat("pax"));

        
        // Mobile collapsible toggle for unnamed slot card
        const mobToggleBtn = card.querySelector(".js-mob-toggle");
        if (mobToggleBtn) {
          const mobDetails = card.querySelector(".mob-slot-details");
          mobToggleBtn.addEventListener("click", () => {
            const isExpanded = mobDetails.classList.toggle("is-expanded");
            mobToggleBtn.textContent = isExpanded ? "▴ Đóng" : "▾ Mở";
            mobToggleBtn.setAttribute("aria-expanded", String(isExpanded));
          });
        }

        card.querySelector(".js-u-mode-invite").addEventListener("click", () => setSlotMode(n, "invite"));
        card.querySelector(".js-u-mode-dir").addEventListener("click", () => setSlotMode(n, "directions"));
        card.querySelector(".js-u-mode-ty").addEventListener("click", () => setSlotMode(n, "thankyou"));
        const uMorningSel = card.querySelector(".js-u-slot-morning");
        if (uMorningSel) {
          uMorningSel.addEventListener("change", () => setSlotMorning(n, uMorningSel.value));
        }
        card.querySelector(".js-u-copy-link").addEventListener("click", () =>
          copyText(slotUrl, `📋 Đã copy link của QR Số ${n}!`)
        );

        frag.appendChild(card);
      });
    }

    if (isGuestsTabActive) {
      cardsContainer.appendChild(frag);

      if (visibleCount === 0) {
        cardsContainer.innerHTML = `
          <div class="empty-state">
            Không tìm thấy khách mời nào khớp với bộ lọc hiện tại.
          </div>
        `;
      } else if (visibleCount > renderedCardCount) {
        const remaining = visibleCount - renderedCardCount;
        const step = Math.min(40, remaining);
        const moreBar = document.createElement("div");
        moreBar.className = "adm-load-more-bar";
        moreBar.innerHTML = `
          <span class="adm-load-more-info">Đang hiển thị <strong>${renderedCardCount}</strong> / <strong>${visibleCount}</strong> thiệp</span>
          <div class="adm-load-more-actions">
            <button type="button" class="btn-adm primary js-load-more-step">Xem thêm ${step} mục</button>
            <button type="button" class="btn-adm js-load-more-all">Hiện tất cả (${visibleCount})</button>
          </div>
        `;
        moreBar.querySelector(".js-load-more-step").addEventListener("click", () => {
          guestsRenderLimit = renderedCardCount + 40;
          buildRows();
        });
        moreBar.querySelector(".js-load-more-all").addEventListener("click", () => {
          guestsRenderLimit = visibleCount;
          buildRows();
        });
        cardsContainer.appendChild(moreBar);
      }
    }

    if (typeof updateAddGuestNextSlotHint === "function") {
      updateAddGuestNextSlotHint();
    }

    return rowsData;
  }

  function getAvailableUnnamedSlots(countNeeded = 1) {
    const usedSlotNums = new Set();
    savedGuests.forEach((g) => {
      if (g && g.slot) usedSlotNums.add(Number(g.slot));
    });
    Object.keys(serverSlots).forEach((code) => {
      const s = serverSlots[code];
      if (s && s.name && String(s.name).trim()) {
        const n = Number(s.num || (s.slotCode && parseInt(s.slotCode.split("-")[0], 10)));
        if (n >= 1) usedSlotNums.add(n);
      }
    });

    const available = [];
    let candidate = 1;
    while (available.length < countNeeded && candidate <= 414) {
      if (!usedSlotNums.has(candidate)) {
        available.push(candidate);
      }
      candidate++;
    }
    while (available.length < countNeeded && candidate <= 9999) {
      if (!usedSlotNums.has(candidate)) {
        available.push(candidate);
      }
      candidate++;
    }
    return available;
  }

  function updateAddGuestNextSlotHint() {
    const badgeEl = document.getElementById("add-guest-next-slot-badge");
    const hintEl = document.getElementById("add-guest-remaining-hint");
    const avail = getAvailableUnnamedSlots(1);
    const nextSlot = avail[0] || (savedGuests.length + 1);
    const totalSlots = 414;
    const namedCount = savedGuests.filter((g) => g && g.name).length;
    const remaining = Math.max(0, totalSlots - namedCount);

    if (badgeEl) {
      badgeEl.textContent = `⚡ Gán từ số #${String(nextSlot).padStart(2, "0")}`;
    }
    if (hintEl) {
      hintEl.textContent = `Còn ${remaining}/${totalSlots} thẻ QR chưa gán tên (Bắt đầu từ #${String(nextSlot).padStart(2, "0")})`;
    }
  }

  async function handleAddGuests() {
    const lang = langSelect.value;
    const defaultAddGrpEl = document.getElementById("default-add-group");
    const defaultAddMorningEl = document.getElementById("default-add-morning");
    const batchGroup = defaultAddGrpEl ? defaultAddGrpEl.value : "";
    const batchMorning = normalizeMorningMode(defaultAddMorningEl ? defaultAddMorningEl.value : "");
    const names = (listArea.value || "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!names.length) {
      notify("⚠️ Bạn hãy nhập ít nhất 1 tên khách mời vào ô trống nhé!");
      listArea.focus();
      return;
    }

    const neededSlots = getAvailableUnnamedSlots(names.length);
    const newOrUpdatedGuests = [];
    const slotsToUpdate = [];

    names.forEach((rawLine, idx) => {
      let name = rawLine;
      let inlineNote = "";
      if (rawLine.includes("|")) {
        const parts = rawLine.split("|");
        name = parts[0].trim();
        inlineNote = parts.slice(1).join("|").trim();
      } else if (rawLine.includes("//")) {
        const parts = rawLine.split("//");
        name = parts[0].trim();
        inlineNote = parts.slice(1).join("//").trim();
      }
      if (!name) return;

      const key = normalizeNameKey(name);
      const existingIdx = savedGuests.findIndex((g) => normalizeNameKey(g.name) === key);
      const existing = existingIdx >= 0 ? savedGuests[existingIdx] : null;
      const finalNote = inlineNote || (existing ? existing.note : "") || guestNotesMap[key] || "";
      if (finalNote) guestNotesMap[key] = finalNote;

      const hasHanzi = /[\u4e00-\u9fff]/.test(name);
      const effectiveLang = lang === "zh" || hasHanzi ? "zh" : "vi";
      const effectiveGrp = batchGroup || (existing && existing.group ? existing.group : "");
      const effectiveMorning = batchMorning || normalizeMorningMode(existing && existing.morning);

      // Find slot: keep existing slot if already assigned, or assign from next available
      let slotNum = existing && existing.slot ? existing.slot : neededSlots[idx];
      let slotCode = slotNum ? makeSlotCode(slotNum) : (existing && existing.slotCode ? existing.slotCode : "");

      const record = {
        name,
        lang: effectiveLang,
        mode: existing && existing.mode ? existing.mode : "invite",
        morning: effectiveMorning,
        driveUrl: existing && existing.driveUrl ? existing.driveUrl : "",
        note: finalNote,
        group: effectiveGrp,
        table: existing && existing.table ? existing.table : "",
        pax: existing && existing.pax ? existing.pax : 1,
        slot: slotNum,
        slotCode: slotCode,
        createdAt: existing && existing.createdAt ? existing.createdAt : new Date().toISOString()
      };

      if (existingIdx >= 0) {
        savedGuests[existingIdx] = record;
      } else {
        savedGuests.push(record);
      }
      newOrUpdatedGuests.push(record);

      if (slotNum && slotCode) {
        const prevS = serverSlots[slotCode] || {};
        serverSlots[slotCode] = {
          num: slotNum,
          name,
          lang: effectiveLang,
          mode: record.mode,
          morning: effectiveMorning,
          group: effectiveGrp,
          table: record.table,
          pax: record.pax,
          assignedAt: prevS.assignedAt || new Date().toISOString()
        };
        slotsToUpdate.push({
          code: slotCode,
          num: slotNum,
          name,
          lang: effectiveLang,
          note: finalNote,
          group: effectiveGrp,
          morning: effectiveMorning
        });
      }
    });

    const prevSaved = savedGuests.map((g) => ({ ...g }));
    const prevSlotsSnap = {};
    Object.keys(serverSlots).forEach((k) => {
      prevSlotsSnap[k] = { ...serverSlots[k] };
    });

    persistLocalGuests();
    persistLocalSlots();
    listArea.value = "";
    buildRows();
    if (typeof renderSlotsTable === "function") renderSlotsTable();
    if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
    updateAddGuestNextSlotHint();

    const gRes = await adminApiFetch("/api/guests", {
      method: "POST",
      body: { action: "add", guests: newOrUpdatedGuests }
    });
    if (!gRes.ok) {
      savedGuests = prevSaved;
      serverSlots = prevSlotsSnap;
      persistLocalGuests();
      persistLocalSlots();
      listArea.value = names.join("\n");
      buildRows();
      if (typeof renderSlotsTable === "function") renderSlotsTable();
      if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
      updateAddGuestNextSlotHint();
      notify(`⚠️ Chưa lưu được khách lên máy chủ (${gRes.error}).`);
      return;
    }

    for (const s of slotsToUpdate) {
      await adminApiFetch("/api/slots", {
        method: "POST",
        body: { action: "set_name", code: s.code, name: s.name, lang: s.lang, note: s.note, group: s.group, morning: s.morning }
      });
    }
    notify(`✨ Đã thêm ${newOrUpdatedGuests.length} khách vào danh sách & đồng bộ máy chủ!`);
  }

  async function fetchAnalytics(showToast) {
    const subLabel = document.getElementById("stats-updated-label");
    try {
      const apiRes = await adminApiFetch(`/api/stats?t=${Date.now()}`, { cache: "no-store" });
      if (!apiRes.ok) {
        if (apiRes.authRequired) {
          subLabel.textContent = "🔐 Cần nhập mã khóa Admin để xem thống kê trực tuyến.";
        } else {
          subLabel.textContent = `⚠️ Không thể đồng bộ (${apiRes.error}) - Hiển thị dữ liệu đã lưu trên máy.`;
          if (showToast) notify(`⚠️ ${apiRes.error}`);
        }
        return;
      }
      const data = apiRes.data;
      if (!data || !data.stats) throw new Error("Invalid stats");
      const st = data.stats;

      if (st.siteConfig && typeof st.siteConfig === "object") {
        globalSiteConfig = st.siteConfig;
        const resolvedGlobalMode =
          globalSiteConfig.globalMode ||
          (globalSiteConfig.globalThankYou
            ? "thankyou"
            : globalSiteConfig.globalDirections
              ? "directions"
              : "invite");
        if (!globalConfigLoadedOnce) {
          globalConfigLoadedOnce = true;
          if (globalTySelect) globalTySelect.value = resolvedGlobalMode;
          if (globalDriveInput && globalSiteConfig.driveUrl && !isPlaceholderDriveUrl(globalSiteConfig.driveUrl)) {
            globalDriveInput.value = globalSiteConfig.driveUrl;
          }
          if (globalTyViInput && globalSiteConfig.thankYouVI) globalTyViInput.value = globalSiteConfig.thankYouVI;
          if (globalTyZhInput && globalSiteConfig.thankYouZH) globalTyZhInput.value = globalSiteConfig.thankYouZH;
        }
        if (globalStatusEl) {
          globalStatusEl.textContent =
            resolvedGlobalMode === "thankyou"
              ? "✅ Đang bật Thiệp Cảm Ơn đồng loạt trên TẤT CẢ link đã gửi!"
              : resolvedGlobalMode === "directions"
                ? "📍 Đang bật Chế Độ Chỉ Đường Ngày Cưới (Đẩy Bản Đồ lên đầu trang) trên TẤT CẢ link đã gửi!"
                : "💌 Đang ở chế độ theo từng khách (hoặc bật riêng Chỉ Đường / Cảm Ơn ở Tab 1).";
        }
      }

      if (Array.isArray(st.savedGuests) && st.savedGuests.length > 0) {
        mergeServerGuests(st.savedGuests);
      } else if (savedGuests.length > 0) {
        adminApiFetch("/api/guests", {
          method: "POST",
          body: { action: "add", guests: savedGuests }
        });
      }

      if (st.slots && typeof st.slots === "object") {
        mergeServerSlots(st.slots);
      }
      if (st.seatingConfig && typeof st.seatingConfig === "object") {
        seatingConfig = { ...seatingConfig, ...st.seatingConfig };
        if (st.seatingConfig.groups && typeof st.seatingConfig.groups === "object") {
          SEAT_GROUPS = { ...DEFAULT_SEAT_GROUPS, ...st.seatingConfig.groups };
          try {
            localStorage.setItem(STORAGE_SEAT_GROUPS, JSON.stringify(SEAT_GROUPS));
          } catch (_) {}
          refreshAllGroupSelects();
        }
        persistLocalSeating();
      }

      const visitLogs = Array.isArray(st.visitLogs) ? st.visitLogs : [];
      latestVisitLogs = visitLogs;
      badgeLogsEl.textContent = String(visitLogs.length);

      visitLogsByGuest = {};
      visitLogs.forEach((log) => {
        if (log && log.guestName) {
          const k = normalizeNameKey(log.guestName);
          if (!visitLogsByGuest[k]) visitLogsByGuest[k] = [];
          visitLogsByGuest[k].push(log);
        }
      });

      document.getElementById("kpi-total-views").textContent = String(st.totalViews || visitLogs.length || 0);
      document.getElementById("kpi-unique-guests").textContent = String(st.uniqueVisitors || 0);
      document.getElementById("kpi-guest-ratio").textContent =
        `Trên tổng số ${savedGuests.length} khách đã tạo`;
      document.getElementById("kpi-opened-env").textContent = String(st.openedEnvelopeCount || 0);
      document.getElementById("kpi-flipped-back").textContent = `${st.flippedBackCount || 0} lần đã lật xem mặt sau`;

      const countries = st.countries || {};
      const vnCount = countries.VN || 0;
      const twCount = countries.TW || 0;
      const otherCount = Object.keys(countries)
        .filter((k) => k !== "VN" && k !== "TW")
        .reduce((acc, k) => acc + (countries[k] || 0), 0);

      document.getElementById("kpi-countries").innerHTML = `
        <span class="country-pill"><span class="country-code-badge">VN</span> ${vnCount}</span>
        <span class="country-pill"><span class="country-code-badge">TW</span> ${twCount}</span>
        ${otherCount > 0 ? `<span class="country-pill">Khác: ${otherCount}</span>` : ""}
      `;

      renderVisitLogsTable(visitLogs);

      // Do not rebuild guest cards or floorplan while user is actively interacting inside them
      const activeEl = document.activeElement;
      const isEditingCard = activeEl && cardsContainer && cardsContainer.contains(activeEl);
      const isTypingSlot = activeEl && activeEl.classList && activeEl.classList.contains("slot-inline-input");
      const inspBoxEl = document.getElementById("seine-inspector-box");
      const isEditingSeine = activeEl && inspBoxEl && inspBoxEl.contains(activeEl);
      if (!isEditingCard || showToast) {
        buildRows();
      }
      if (!isTypingSlot || showToast) {
        renderSlotsTable();
      }
      if (typeof renderSeineFloorplan === "function" && (!isEditingSeine || showToast)) {
        renderSeineFloorplan();
      }
      subLabel.textContent =
        "Đang đồng bộ trực tiếp • Cập nhật lúc " + new Date().toLocaleTimeString("vi-VN");
      if (showToast) notify("✅ Đã cập nhật số liệu mới nhất!");
    } catch (_) {
      subLabel.textContent = "⚠️ Không thể kết nối máy chủ - Đang dùng dữ liệu lưu tạm trên máy.";
    }
  }

  function renderVisitLogsTable(visitLogs) {
    const emptyEl = document.getElementById("guest-activity-empty");
    const tableWrap = document.getElementById("guest-activity-table-wrap");
    const actTbody = document.getElementById("guest-activity-tbody");
    if (!emptyEl || !tableWrap || !actTbody) return;

    if (activeAdminTabId !== "tab-logs") {
      if (actTbody.childElementCount > 0) actTbody.innerHTML = "";
      return;
    }

    const list = Array.isArray(visitLogs) ? visitLogs : [];
    if (!list.length) {
      emptyEl.style.display = "block";
      tableWrap.style.display = "none";
      actTbody.innerHTML = "";
      return;
    }

    emptyEl.style.display = "none";
    tableWrap.style.display = "block";
    actTbody.innerHTML = "";
    const frag = document.createDocumentFragment();
    list.forEach((log, i) => {
      const tr = document.createElement("tr");
      const statusHtml = log.openedEnvelope
        ? `<span class="status-badge is-opened">✨ Đã mở phong bì</span>`
        : `<span class="status-badge is-viewed">👀 Đã mở link</span>`;
      const flipNote = log.flippedBack
        ? `<div style="font-size:11.5px; color:var(--adm-muted); margin-top:4px;">↺ Đã lật xem mặt sau bao thư</div>`
        : "";
      const locStr = formatCountryFlag(log.country) + (log.city ? ` (${log.city})` : "");
      const langLabel = log.lang === "zh" ? "Bản 繁體中文" : "Bản Tiếng Việt";
      const openOrderNumber = list.length - i;
      const logKey = normalizeNameKey(log.guestName || "");
      const matchedGuest = savedGuests.find((g) => normalizeNameKey(g.name) === logKey);
      const logNote = String((matchedGuest && matchedGuest.note) || guestNotesMap[logKey] || "").trim();

      tr.innerHTML = `
        <td><strong>#${openOrderNumber}</strong></td>
        <td>
          <div style="display:flex; flex-wrap:wrap; align-items:center; gap:4px;">
            <strong class="js-log-guest" style="font-size:14px;"></strong>
            <span class="log-private-note-tag js-log-note" style="display:none;"></span>
          </div>
          <div style="font-size:11.2px; color:var(--adm-muted); margin-top:2px;">${langLabel}</div>
        </td>
        <td>${statusHtml}${flipNote}</td>
        <td><span class="device-badge js-log-device"></span></td>
        <td>
          <div><strong>${locStr}</strong></div>
          <div style="font-size:11.6px; color:var(--adm-muted); margin-top:2px;">${formatExactAndRelativeTime(log.lastActionAt || log.openedAt)}</div>
        </td>
      `;
      tr.querySelector(".js-log-guest").textContent = log.guestName || "Khách mời";
      const logNoteEl = tr.querySelector(".js-log-note");
      if (logNote && logNoteEl) {
        logNoteEl.textContent = `📝 ${logNote}`;
        logNoteEl.style.display = "inline-flex";
      }
      tr.querySelector(".js-log-device").textContent =
        log.deviceDetail || log.device || "Thiết bị di động";
      frag.appendChild(tr);
    });
    actTbody.appendChild(frag);
  }

  document.getElementById("btn-refresh-stats").addEventListener("click", () => fetchAnalytics(true));

  document.getElementById("btn-reset-stats").addEventListener("click", async () => {
    if (
      !window.confirm(
        "Xóa lịch sử lượt xem thử về 0? (Danh sách khách mời đã tạo vẫn được giữ nguyên!)"
      )
    ) {
      return;
    }
    const apiRes = await adminApiFetch("/api/reset", {
      method: "POST",
      body: { confirm: "RESET_ANALYTICS" }
    });
    if (!apiRes.ok) {
      notify(`⚠️ Không xóa được lịch sử lượt xem (${apiRes.error}).`);
      return;
    }
    await fetchAnalytics(false);
    notify("🗑️ Đã đặt bộ đếm lượt xem về 0!");
  });

  document.getElementById("btn-clear-guests").addEventListener("click", async () => {
    if (!savedGuests.length) return;
    if (!window.confirm("Bạn có chắc muốn xóa toàn bộ danh sách khách mời đã lưu không?")) return;
    const prevSaved = savedGuests.map((g) => ({ ...g }));
    savedGuests = [];
    persistLocalGuests();
    buildRows();
    if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
    const apiRes = await adminApiFetch("/api/guests", {
      method: "POST",
      body: { action: "clear", confirm: "CLEAR_ALL_GUESTS" }
    });
    if (!apiRes.ok) {
      savedGuests = prevSaved;
      persistLocalGuests();
      buildRows();
      if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
      notify(`⚠️ Chưa xóa được trên máy chủ (${apiRes.error}).`);
      return;
    }
    notify("🗑️ Đã xóa trống danh sách khách mời.");
  });

  document.getElementById("btn-save-global-config").addEventListener("click", async () => {
    const selectedMode = (globalTySelect && globalTySelect.value) || "invite";
    const rawDriveUrl = globalDriveInput ? globalDriveInput.value.trim() : "";
    if (isPlaceholderDriveUrl(rawDriveUrl)) {
      notify("⚠️ Link Google Drive đang là link mẫu, vui lòng xóa hoặc dán link thư mục thật!");
      if (globalDriveInput) globalDriveInput.focus();
      return;
    }
    if (
      selectedMode === "thankyou" &&
      !rawDriveUrl &&
      !window.confirm(
        "Chưa nhập link thư mục Google Drive — Thiệp Cảm Ơn sẽ tạm ẩn nút Xem Ảnh cho đến khi bạn cập nhật link. Vẫn bật Thiệp Cảm Ơn?"
      )
    ) {
      return;
    }
    const payload = {
      globalMode: selectedMode,
      globalThankYou: selectedMode === "thankyou",
      globalDirections: selectedMode === "directions",
      driveUrl: rawDriveUrl,
      thankYouVI: globalTyViInput ? globalTyViInput.value.trim() : "",
      thankYouZH: globalTyZhInput ? globalTyZhInput.value.trim() : ""
    };
    const apiRes = await adminApiFetch("/api/config", {
      method: "POST",
      body: payload
    });
    if (!apiRes.ok) {
      notify(`⚠️ Chưa lưu được cài đặt chế độ (${apiRes.error}).`);
      return;
    }
    globalConfigLoadedOnce = false;
    await fetchAnalytics(false);
    notify(
      selectedMode === "thankyou"
        ? "📸 Đã bật Lời Cảm Ơn trên TẤT CẢ các link đã gửi!"
        : selectedMode === "directions"
          ? "📍 Đã bật Chế Độ Chỉ Đường Ngày Cưới cho TẤT CẢ các link đã gửi!"
          : "💾 Đã lưu cài đặt chế độ link & Kho Ảnh!"
    );
  });

  document.getElementById("btn-generate").addEventListener("click", handleAddGuests);

  document.getElementById("btn-export-csv").addEventListener("click", () => {
    const rows = buildRows();
    const header = [
      "STT",
      "Ten Khach Moi",
      "Ghi Chu Rieng (Co Dau Chu Re)",
      "Moi Le Sang (05:30)",
      "So Lan Mo",
      "Chi Tiet Thiet Bi Da Mo",
      "Ngon Ngu",
      "Link Thiep",
      "Tin Nhan Moi Mau"
    ];
    const csvLines = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.idx,
          r.name,
          r.privateNote || "",
          r.morning ? getMorningBadgeText(r.morning) : "Chỉ Tiệc Tối",
          r.openCount,
          r.devicesSummary,
          r.effectiveLang,
          r.fullUrl,
          r.inviteMsg.replace(/\n/g, " ")
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
    ];
    const blob = new Blob(["\uFEFF" + csvLines.join("\r\n")], {
      type: "text/csv;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Danh-Sach-Link-Thiep-Cuoi-Tuong-Dinh.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  /* =====================================================================
     LUXURY WEDDING QR STUDIO & A4 FRAMELESS MINI INSERT CARD GENERATOR
     ===================================================================== */
  const qrLayoutStyle = document.getElementById("qr-layout-style");
  const qrPresetSelect = document.getElementById("qr-preset-select");
  const qrUrlInput = document.getElementById("qr-url-input");
  const qrCaptionStyle = document.getElementById("qr-caption-style");
  const qrGuestBadge = document.getElementById("qr-guest-badge");
  const qrCanvas = document.getElementById("qr-studio-canvas");
  const btnDownloadQr = document.getElementById("btn-download-qr-png");
  const btnPrintQrSheet = document.getElementById("btn-print-qr-sheet");
  const qrBatchGuests = document.getElementById("qr-batch-guests");
  const qrBatchGenericCount = document.getElementById("qr-batch-generic-count");
  const qrBatchNamePos = document.getElementById("qr-batch-name-pos");
  const btnFillSavedGuestsQr = document.getElementById("btn-fill-saved-guests-qr");
  const btnPrintMixedA4 = document.getElementById("btn-print-mixed-a4");

  const QR_PRESET_URLS = {
    directions: "https://thuantuongtieudinh.io.vn/?mode=directions",
    gmaps:
      "https://www.google.com/maps/dir/?api=1&destination=Riverside+Palace+360D+Ben+Van+Don+Ho+Chi+Minh",
    invite: "https://thuantuongtieudinh.io.vn/"
  };

  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function isFinderPattern(r, c, count) {
    if (r < 7 && c < 7) return true;
    if (r < 7 && c >= count - 7) return true;
    if (r >= count - 7 && c < 7) return true;
    return false;
  }

  function drawFinderEye(ctx, ox, oy, cellSize, holeFillColor) {
    const outerSize = 7 * cellSize;
    const innerGap = 1 * cellSize;
    const midSize = 5 * cellSize;
    const coreOffset = 2 * cellSize;
    const coreSize = 3 * cellSize;

    ctx.fillStyle = "#6e1414";
    drawRoundedRect(ctx, ox, oy, outerSize, outerSize, cellSize * 1.65);
    ctx.fill();

    if (holeFillColor === "transparent") {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      drawRoundedRect(
        ctx,
        ox + innerGap,
        oy + innerGap,
        midSize,
        midSize,
        cellSize * 1.15
      );
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = holeFillColor || "#fbf7ef";
      drawRoundedRect(
        ctx,
        ox + innerGap,
        oy + innerGap,
        midSize,
        midSize,
        cellSize * 1.15
      );
      ctx.fill();
    }

    ctx.fillStyle = "#8a181c";
    drawRoundedRect(
      ctx,
      ox + coreOffset,
      oy + coreOffset,
      coreSize,
      coreSize,
      cellSize * 0.85
    );
    ctx.fill();
  }

  function getLayoutSheetConfig(layoutMode) {
    if (layoutMode === "square_qr_xl") {
      return {
        cols: 2,
        rows: 3,
        itemsPerSheet: 6,
        cellWmm: 90,
        cellHmm: 90,
        gridWmm: 180,
        gridHmm: 270,
        marginXmm: 15,
        marginYmm: 13.5,
        safePadMm: 4.0,
        sheetWidth: "180mm",
        pageMargin: "13.5mm 15mm",
        cellPadding: "0",
        cellWidth: "90mm",
        cellHeight: "90mm",
        name: "Thẻ Vuông QR + Bản Đồ Cỡ Rộng (9×9cm • 1 hàng 2 thẻ • 6 thẻ/tờ A4)",
        shortName: "6 Thẻ Vuông 9×9cm (1 hàng 2 thẻ)"
      };
    }
    if (layoutMode === "square_qr" || layoutMode === "square_qr_lg") {
      return {
        cols: 3,
        rows: 4,
        itemsPerSheet: 12,
        cellWmm: 60,
        cellHmm: 60,
        gridWmm: 180,
        gridHmm: 240,
        marginXmm: 15,
        marginYmm: 28.5,
        safePadMm: 3.5,
        sheetWidth: "180mm",
        pageMargin: "28.5mm 15mm",
        cellPadding: "0",
        cellWidth: "60mm",
        cellHeight: "60mm",
        name: "Thẻ Vuông QR Cỡ Lớn (6×6cm • 1 hàng 3 thẻ • 12 thẻ/tờ A4)",
        shortName: "12 Thẻ Vuông 6×6cm (1 hàng 3 thẻ)"
      };
    }
    if (layoutMode === "square_qr_sm") {
      return {
        cols: 4,
        rows: 6,
        itemsPerSheet: 24,
        cellWmm: 45,
        cellHmm: 45,
        gridWmm: 180,
        gridHmm: 270,
        marginXmm: 15,
        marginYmm: 13.5,
        safePadMm: 2.5,
        sheetWidth: "180mm",
        pageMargin: "13.5mm 15mm",
        cellPadding: "0",
        cellWidth: "45mm",
        cellHeight: "45mm",
        name: "Thẻ Vuông QR Tiết Kiệm (4.5×4.5cm • 1 hàng 4 thẻ • 24 thẻ/tờ A4)",
        shortName: "24 Thẻ Vuông 4.5×4.5cm"
      };
    }
    if (layoutMode === "pinterest_strip") {
      return {
        cols: 6,
        rows: 3,
        itemsPerSheet: 18,
        cellWmm: 32.5,
        cellHmm: 93.7,
        gridWmm: 195,
        gridHmm: 281.1,
        marginXmm: 7.5,
        marginYmm: 7.95,
        safePadMm: 2.2,
        sheetWidth: "195mm",
        pageMargin: "7.95mm 7.5mm",
        cellPadding: "0",
        cellWidth: "32.5mm",
        cellHeight: "93.7mm",
        name: "Dải Bookmark Dọc Thon Dài (3.25×9.37cm • 18 dải/tờ A4)",
        shortName: "18 Dải Bookmark Dọc"
      };
    }
    return {
      cols: 4,
      rows: 5,
      itemsPerSheet: 20,
      cellWmm: 48,
      cellHmm: 56,
      gridWmm: 192,
      gridHmm: 280,
      marginXmm: 9,
      marginYmm: 8.5,
      safePadMm: 3.0,
      sheetWidth: "192mm",
      pageMargin: "8.5mm 9mm",
      cellPadding: "1.8mm 2.2mm",
      cellWidth: "48mm",
      cellHeight: "56mm",
      name: "Thẻ Phụ Chữ Nhật Không Khung (4.8×5.6cm • 20 thẻ/tờ A4)",
      shortName: "20 Thẻ Phụ Chữ Nhật"
    };
  }

  function getBackMapAssetUrl() {
    if (window.location.protocol === "file:") {
      return new URL("./assets/ban-do-riverside-palace-card.svg", window.location.href).href;
    }
    return new URL("/assets/ban-do-riverside-palace-card.svg", window.location.origin).href;
  }

  function getBackMapMasterSvgDefHtml() {
    return `<svg aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden;" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="td-map-frame-clip">
      <rect x="18" y="114" width="964" height="868" rx="18" ry="18" />
    </clipPath>
    <g id="td-traffic-light">
      <rect x="-5.5" y="-13.5" width="11" height="27" rx="5.5" fill="#2c1d1c" stroke="#ffffff" stroke-width="1.2" />
      <circle cx="0" cy="-7" r="2.7" fill="#e53935" />
      <circle cx="0" cy="0" r="2.7" fill="#fbc02d" />
      <circle cx="0" cy="7" r="2.7" fill="#43a047" />
    </g>
    <g id="td-arrow-r">
      <path d="M-11,0 L8,0 M3.5,-4 L9,0 L3.5,4" fill="none" stroke="#6c2b2c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
    </g>
    <g id="td-arrow-l">
      <path d="M11,0 L-8,0 M-3.5,-4 L-9,0 L-3.5,4" fill="none" stroke="#6c2b2c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
    </g>
    <g id="td-arrow-u">
      <path d="M0,11 L0,-8 M-4,-3.5 L0,-9 L4,-3.5" fill="none" stroke="#6c2b2c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
    </g>
    <g id="td-arrow-d">
      <path d="M0,-11 L0,8 M-4,3.5 L0,9 L4,3.5" fill="none" stroke="#6c2b2c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </defs>
  <g id="td-back-map-master" text-rendering="geometricPrecision" shape-rendering="geometricPrecision">
    <text x="500" y="56" text-anchor="middle" font-family="'Cormorant Garamond', Georgia, serif" font-size="60" font-weight="700" fill="#8e1e30" letter-spacing="0.5">Riverside Palace</text>
    <text x="500" y="92" text-anchor="middle" font-family="'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif" font-size="27" font-weight="700" fill="#3a201e">360D Bến Vân Đồn, Quận 4 · Sảnh Seine</text>
    <rect x="18" y="114" width="964" height="868" rx="18" ry="18" fill="#ffffff" />
    <g clip-path="url(#td-map-frame-clip)">
      <polygon points="0,382 1000,388 1000,498 0,486" fill="#b7ddf0" />
      <polygon points="0,664 1000,828 1000,906 0,742" fill="#b7ddf0" />
      <polygon points="274,772 344,784 282,1000 212,1000" fill="#b7ddf0" />
      <text x="485" y="446" text-anchor="middle" font-family="'Be Vietnam Pro', sans-serif" font-size="21" font-weight="700" font-style="italic" fill="#185978">Kênh Bến Nghé</text>
      <text x="500" y="796" text-anchor="middle" transform="rotate(9.3 500 796)" font-family="'Be Vietnam Pro', sans-serif" font-size="20" font-weight="700" font-style="italic" fill="#185978">Kênh Tẻ</text>
      <text x="278" y="916" text-anchor="middle" transform="rotate(-74 278 916)" font-family="'Be Vietnam Pro', sans-serif" font-size="18" font-weight="700" font-style="italic" fill="#185978">Rạch Ông Lớn</text>
      <g font-family="'Be Vietnam Pro', sans-serif" font-size="18.5" font-weight="700" fill="#6b504b" letter-spacing="0.6">
        <text x="116" y="242" text-anchor="middle">QUẬN 5</text>
        <text x="502" y="242" text-anchor="middle">QUẬN 1</text>
        <text x="606" y="616" text-anchor="middle" font-size="14.5">QUẬN 4</text>
        <text x="108" y="886" text-anchor="middle">QUẬN 8</text>
        <text x="846" y="882" text-anchor="middle">QUẬN 7</text>
      </g>
      <rect x="0" y="152" width="1000" height="36" fill="#e6c0bc" />
      <line x1="0" y1="152" x2="1000" y2="152" stroke="#c9958f" stroke-width="1.2" />
      <line x1="0" y1="188" x2="1000" y2="188" stroke="#c9958f" stroke-width="1.2" />
      <line x1="0" y1="170" x2="1000" y2="170" stroke="#ffffff" stroke-width="2.2" stroke-dasharray="10 9" />
      <use href="#td-arrow-l" x="120" y="161" />
      <use href="#td-arrow-r" x="120" y="179" />
      <use href="#td-arrow-l" x="528" y="161" />
      <use href="#td-arrow-r" x="528" y="179" />
      <use href="#td-arrow-l" x="945" y="161" />
      <use href="#td-arrow-r" x="945" y="179" />
      <rect x="0" y="302" width="1000" height="64" fill="#e6c0bc" />
      <line x1="0" y1="302" x2="1000" y2="302" stroke="#c9958f" stroke-width="1.2" />
      <line x1="0" y1="366" x2="1000" y2="366" stroke="#c9958f" stroke-width="1.2" />
      <rect x="0" y="331" width="1000" height="6" fill="#ffffff" />
      <use href="#td-arrow-l" x="72" y="317" />
      <use href="#td-arrow-r" x="72" y="350" />
      <use href="#td-arrow-l" x="524" y="317" />
      <use href="#td-arrow-r" x="524" y="350" />
      <rect x="200" y="512" width="800" height="44" fill="#e6c0bc" />
      <line x1="200" y1="512" x2="1000" y2="512" stroke="#c9958f" stroke-width="1.2" />
      <line x1="200" y1="556" x2="1000" y2="556" stroke="#c9958f" stroke-width="1.2" />
      <line x1="200" y1="534" x2="1000" y2="534" stroke="#ffffff" stroke-width="2.4" />
      <use href="#td-arrow-l" x="325" y="523" />
      <use href="#td-arrow-r" x="325" y="545" />
      <use href="#td-arrow-l" x="595" y="523" />
      <use href="#td-arrow-r" x="595" y="545" />
      <use href="#td-arrow-l" x="722" y="523" />
      <use href="#td-arrow-r" x="722" y="545" />
      <rect x="665" y="638" width="335" height="34" fill="#e6c0bc" />
      <line x1="665" y1="638" x2="1000" y2="638" stroke="#c9958f" stroke-width="1.2" />
      <line x1="665" y1="672" x2="1000" y2="672" stroke="#c9958f" stroke-width="1.2" />
      <line x1="665" y1="655" x2="1000" y2="655" stroke="#ffffff" stroke-width="2" stroke-dasharray="9 8" />
      <path d="M 272,642 L 1010,766" fill="none" stroke="#c9958f" stroke-width="38.5" stroke-linecap="round" />
      <path d="M 272,642 L 1010,766" fill="none" stroke="#e6c0bc" stroke-width="36" stroke-linecap="round" />
      <use href="#td-arrow-l" x="515" y="674" transform="rotate(9.3 515 674)" />
      <use href="#td-arrow-r" x="515" y="690" transform="rotate(9.3 515 690)" />
      <use href="#td-arrow-l" x="804" y="721" transform="rotate(9.3 804 721)" />
      <use href="#td-arrow-r" x="804" y="738" transform="rotate(9.3 804 738)" />
      <rect x="538" y="546" width="28" height="145" fill="#e6c0bc" />
      <line x1="538" y1="556" x2="538" y2="680" stroke="#c9958f" stroke-width="1.2" />
      <line x1="566" y1="556" x2="566" y2="685" stroke="#c9958f" stroke-width="1.2" />
      <use href="#td-arrow-u" x="524" y="618" />
      <use href="#td-arrow-d" x="510" y="618" />
      <rect x="424" y="546" width="20" height="122" fill="#e6c0bc" />
      <path d="M 426,570 L 404,570" fill="none" stroke="#e6c0bc" stroke-width="11" />
      <path d="M 419,549 L 419,570 L 402,570" fill="none" stroke="#841826" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 407,566 L 400,570 L 407,574" fill="none" stroke="#841826" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
      <rect x="446" y="562" width="12" height="14" fill="#e6c0bc" />
      <rect x="456" y="556" width="32" height="32" rx="7" fill="#175987" />
      <text x="472" y="579" text-anchor="middle" font-family="'Be Vietnam Pro', sans-serif" font-size="20" font-weight="700" fill="#ffffff">P</text>
      <text x="472" y="606" text-anchor="middle" font-family="'Be Vietnam Pro', sans-serif" font-size="16" font-weight="700" fill="#175987">Bãi xe</text>
      <rect x="658" y="546" width="32" height="454" fill="#e6c0bc" />
      <line x1="658" y1="556" x2="658" y2="1000" stroke="#c9958f" stroke-width="1.2" />
      <line x1="690" y1="556" x2="690" y2="1000" stroke="#c9958f" stroke-width="1.2" />
      <line x1="674" y1="546" x2="674" y2="1000" stroke="#ffffff" stroke-width="2" stroke-dasharray="9 8" />
      <use href="#td-arrow-u" x="706" y="608" />
      <use href="#td-arrow-d" x="694" y="608" />
      <g>
        <rect x="654" y="758" width="40" height="72" fill="#d9a8a3" stroke="#8a4444" stroke-width="2" />
        <line x1="674" y1="758" x2="674" y2="830" stroke="#ffffff" stroke-width="2" stroke-dasharray="8 7" />
        <path d="M 650,752 L 654,758 L 690,758 L 694,752" fill="none" stroke="#8a4444" stroke-width="2" stroke-linecap="round" />
        <path d="M 650,836 L 654,830 L 690,830 L 694,836" fill="none" stroke="#8a4444" stroke-width="2" stroke-linecap="round" />
      </g>
      <rect x="760" y="114" width="32" height="580" fill="#e6c0bc" />
      <line x1="760" y1="114" x2="760" y2="694" stroke="#c9958f" stroke-width="1.2" />
      <line x1="792" y1="114" x2="792" y2="694" stroke="#c9958f" stroke-width="1.2" />
      <line x1="776" y1="114" x2="776" y2="694" stroke="#ffffff" stroke-width="2" stroke-dasharray="9 8" />
      <use href="#td-arrow-u" x="783" y="228" />
      <use href="#td-arrow-d" x="769" y="228" />
      <rect x="756" y="376" width="40" height="142" fill="#d5a09a" stroke="#7d3b3b" stroke-width="2.2" />
      <line x1="776" y1="376" x2="776" y2="518" stroke="#ffffff" stroke-width="2.2" stroke-dasharray="9 8" />
      <path d="M 751,370 L 756,376 L 796,376 L 801,370" fill="none" stroke="#7d3b3b" stroke-width="2.2" stroke-linecap="round" />
      <path d="M 751,524 L 756,518 L 796,518 L 801,524" fill="none" stroke="#7d3b3b" stroke-width="2.2" stroke-linecap="round" />
      <rect x="884" y="114" width="32" height="580" fill="#e6c0bc" />
      <line x1="884" y1="114" x2="884" y2="694" stroke="#c9958f" stroke-width="1.2" />
      <line x1="916" y1="114" x2="916" y2="694" stroke="#c9958f" stroke-width="1.2" />
      <line x1="900" y1="114" x2="900" y2="694" stroke="#ffffff" stroke-width="2" stroke-dasharray="9 8" />
      <path d="M 885,432 Q 885,522 814,528 L 814,550 Q 906,544 906,432 Z" fill="#d5a09a" stroke="#7d3b3b" stroke-width="1.8" />
      <path d="M 915,432 Q 915,522 962,528 L 962,550 Q 894,544 894,432 Z" fill="#d5a09a" stroke="#7d3b3b" stroke-width="1.8" />
      <path d="M 880,455 Q 875,515 824,522" fill="none" stroke="#781822" stroke-width="2.2" stroke-linecap="round" />
      <path d="M 831,517 L 823,522 L 832,526" fill="none" stroke="#781822" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 920,455 Q 925,515 954,522" fill="none" stroke="#781822" stroke-width="2.2" stroke-linecap="round" />
      <path d="M 947,517 L 955,522 L 947,526" fill="none" stroke="#781822" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      <rect x="880" y="376" width="40" height="142" fill="#d5a09a" stroke="#7d3b3b" stroke-width="2.2" />
      <line x1="900" y1="376" x2="900" y2="518" stroke="#ffffff" stroke-width="2.2" stroke-dasharray="9 8" />
      <path d="M 875,370 L 880,376 L 920,376 L 925,370" fill="none" stroke="#7d3b3b" stroke-width="2.2" stroke-linecap="round" />
      <path d="M 875,524 L 880,518 L 920,518 L 925,524" fill="none" stroke="#7d3b3b" stroke-width="2.2" stroke-linecap="round" />
      <g transform="rotate(6.2 225 500)">
        <rect x="206" y="100" width="42" height="920" fill="#e6c0bc" />
        <line x1="206" y1="100" x2="206" y2="1020" stroke="#c9958f" stroke-width="1.2" />
        <line x1="248" y1="100" x2="248" y2="1020" stroke="#c9958f" stroke-width="1.2" />
        <line x1="227" y1="100" x2="227" y2="1020" stroke="#ffffff" stroke-width="2.2" stroke-dasharray="10 9" />
      </g>
      <path d="M 225,512 L 136,512 C 62,512 58,610 136,610 L 222,610" fill="none" stroke="#7d3b3b" stroke-width="40" stroke-linecap="round" />
      <path d="M 225,512 L 136,512 C 62,512 58,610 136,610 L 222,610" fill="none" stroke="#e0b2ad" stroke-width="35" stroke-linecap="round" />
      <path d="M 225,512 L 136,512 C 62,512 58,610 136,610 L 222,610" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="9 8" />
      <path d="M 155,512 L 128,512" fill="none" stroke="#781822" stroke-width="2.4" stroke-linecap="round" />
      <path d="M 134,507.5 L 126,512 L 134,516.5" fill="none" stroke="#781822" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 126,610 L 160,610" fill="none" stroke="#781822" stroke-width="2.4" stroke-linecap="round" />
      <path d="M 154,605.5 L 162,610 L 154,614.5" fill="none" stroke="#781822" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 232,442 Q 246,356 306,350 L 306,328 Q 222,334 210,442 Z" fill="#d5a09a" stroke="#7d3b3b" stroke-width="1.8" />
      <path d="M 226,476 Q 238,522 288,528 L 288,548 Q 222,542 204,476 Z" fill="#d5a09a" stroke="#7d3b3b" stroke-width="1.8" />
      <g transform="rotate(6.2 225 500)">
        <rect x="202" y="250" width="50" height="512" fill="#d5a09a" stroke="#7d3b3b" stroke-width="2.4" />
        <line x1="227" y1="250" x2="227" y2="762" stroke="#ffffff" stroke-width="2.4" stroke-dasharray="10 9" />
        <path d="M 196,244 L 202,250 L 252,250 L 258,244" fill="none" stroke="#7d3b3b" stroke-width="2.4" stroke-linecap="round" />
        <path d="M 196,768 L 202,762 L 252,762 L 258,768" fill="none" stroke="#7d3b3b" stroke-width="2.4" stroke-linecap="round" />
        <use href="#td-arrow-u" x="237" y="210" />
        <use href="#td-arrow-d" x="217" y="210" />
        <use href="#td-arrow-d" x="216" y="704" />
        <use href="#td-arrow-u" x="238" y="704" />
      </g>
      <path d="M 238,392 Q 254,352 292,344" fill="none" stroke="#781822" stroke-width="2.4" stroke-linecap="round" />
      <path d="M 284,340 L 293,344 L 285,349" fill="none" stroke="#781822" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 224,492 Q 242,520 278,524" fill="none" stroke="#781822" stroke-width="2.4" stroke-linecap="round" />
      <path d="M 271,519 L 280,524 L 270,528" fill="none" stroke="#781822" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
      <use href="#td-traffic-light" x="236" y="198" />
      <use href="#td-traffic-light" x="444" y="514" />
      <use href="#td-traffic-light" x="576" y="562" />
      <use href="#td-traffic-light" x="698" y="562" />
      <use href="#td-traffic-light" x="698" y="688" />
      <use href="#td-traffic-light" x="794" y="688" />
      <g font-family="'Be Vietnam Pro', -apple-system, sans-serif" font-weight="700" fill="#2d1716">
        <text x="122" y="143" text-anchor="middle" font-size="18.5">TRẦN HƯNG ĐẠO</text>
        <text x="528" y="143" text-anchor="middle" font-size="19">TRẦN HƯNG ĐẠO</text>
        <text x="126" y="294" text-anchor="middle" font-size="17.5">ĐẠI LỘ VÕ VĂN KIỆT</text>
        <text x="524" y="294" text-anchor="middle" font-size="19.5">ĐẠI LỘ VÕ VĂN KIỆT</text>
        <text x="562" y="503" text-anchor="middle" font-size="22" letter-spacing="0.4">BẾN VÂN ĐỒN</text>
        <text x="826" y="630" text-anchor="middle" font-size="18.5">HOÀNG DIỆU</text>
        <text x="518" y="707" text-anchor="middle" transform="rotate(9.3 518 707)" font-size="18">TÔN THẤT THUYẾT</text>
        <text x="434" y="622" text-anchor="middle" transform="rotate(-90 434 622)" font-size="14.2">Hẻm 360</text>
        <text x="556" y="624" text-anchor="middle" transform="rotate(-90 556 624)" font-size="15.8">NGUYỄN KHOÁI</text>
        <text x="653" y="612" text-anchor="middle" transform="rotate(-90 653 612)" font-size="16.5">KHÁNH HỘI</text>
        <text x="678" y="794" text-anchor="middle" transform="rotate(-90 678 794)" font-size="16">CẦU KÊNH TẺ</text>
        <text x="647" y="896" text-anchor="middle" transform="rotate(-90 647 896)" font-size="15.8">NGUYỄN HỮU THỌ</text>
        <text x="275" y="238" text-anchor="middle" transform="rotate(-83.8 275 238)" font-size="16.5">NGUYỄN VĂN CỪ</text>
        <text x="190" y="426" text-anchor="middle" transform="rotate(-83.8 190 426)" font-size="16.5">CẦU NGUYỄN VĂN CỪ</text>
        <text x="178" y="882" text-anchor="middle" transform="rotate(-83.8 178 882)" font-size="17">DƯƠNG BÁ TRẠC</text>
        <text x="747" y="236" text-anchor="middle" transform="rotate(-90 747 236)" font-size="17">NGUYỄN THÁI HỌC</text>
        <text x="744" y="446" text-anchor="middle" transform="rotate(-90 744 446)" font-size="17">CẦU ÔNG LÃNH</text>
        <text x="872" y="236" text-anchor="middle" transform="rotate(-90 872 236)" font-size="17.5">CALMETTE</text>
        <text x="935" y="434" text-anchor="middle" transform="rotate(-90 935 434)" font-size="15.5">CẦU CALMETTE</text>
      </g>
      <rect x="330" y="544" width="84" height="36" rx="7" fill="#fae8eb" stroke="#8e1e30" stroke-width="2.2" />
      <rect x="200" y="591" width="218" height="54" rx="10" fill="rgba(110, 20, 30, 0.14)" />
      <rect x="198" y="588" width="218" height="54" rx="10" fill="#ffffff" stroke="#8e1e30" stroke-width="2.6" />
      <text x="307" y="611" text-anchor="middle" font-family="'Be Vietnam Pro', sans-serif" font-size="19" font-weight="700" fill="#8e1e30" letter-spacing="0.3">RIVERSIDE PALACE</text>
      <text x="307" y="632" text-anchor="middle" font-family="'Be Vietnam Pro', sans-serif" font-size="13.2" font-weight="700" fill="#3a201e">Sảnh Seine · Lối vào Hẻm 360</text>
      <g transform="translate(396, 560)">
        <path d="M 0,0 C -16,-19 -23,-32 -23,-43 A 23,23 0 1,1 23,-43 C 23,-32 16,-19 0,0 Z" fill="#8e1e30" stroke="#ffffff" stroke-width="2.8" />
        <path d="M 0,-32 C -3.8,-37 -11,-37 -11,-29.5 C -11,-23 -3.8,-18 0,-14.5 C 3.8,-18 11,-23 11,-29.5 C 11,-37 3.8,-37 0,-32 Z" fill="#ffffff" />
      </g>
      <g transform="translate(708, 906)">
        <rect x="0" y="0" width="264" height="68" rx="10" fill="#faf7f3" stroke="#cbb3a6" stroke-width="1.6" />
        <g transform="translate(24, 21)">
          <rect x="-11" y="-5.5" width="22" height="11" fill="#d5a09a" stroke="#7d3b3b" stroke-width="1.6" />
          <path d="M-15,-8.5 L-11,-5.5 L11,-5.5 L15,-8.5 M-15,8.5 L-11,5.5 L11,5.5 L15,8.5" fill="none" stroke="#7d3b3b" stroke-width="1.6" stroke-linecap="round" />
        </g>
        <text x="46" y="25.5" font-family="'Be Vietnam Pro', sans-serif" font-size="14.5" font-weight="700" fill="#3a201e">Cầu vượt</text>
        <use href="#td-arrow-r" x="148" y="21" />
        <text x="166" y="25.5" font-family="'Be Vietnam Pro', sans-serif" font-size="14.5" font-weight="700" fill="#3a201e">Chiều đường</text>
        <path d="M 14,49 L 33,49 M 28,44.5 L 34,49 L 28,53.5" fill="none" stroke="#8e1e30" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" />
        <text x="46" y="53.5" font-family="'Be Vietnam Pro', sans-serif" font-size="14.5" font-weight="700" fill="#3a201e">Nhánh cầu</text>
        <g transform="translate(148, 49) scale(0.75)">
          <rect x="-5.5" y="-13.5" width="11" height="27" rx="5.5" fill="#2c1d1c" />
          <circle cx="0" cy="-7" r="2.7" fill="#e53935" />
          <circle cx="0" cy="0" r="2.7" fill="#fbc02d" />
          <circle cx="0" cy="7" r="2.7" fill="#43a047" />
        </g>
        <text x="166" y="53.5" font-family="'Be Vietnam Pro', sans-serif" font-size="14.5" font-weight="700" fill="#3a201e">Đèn tín hiệu</text>
      </g>
    </g>
    <rect x="18" y="114" width="964" height="868" rx="18" ry="18" fill="none" stroke="#bfa599" stroke-width="2.5" />
  </g>
</svg>`;
  }

  function buildDuplexCropMarksHtml(cfg) {
    // Crisp guillotine crop marks placed strictly OUTSIDE the card grid in the white waste margin
    // (only rendered on Front QR pages so Back Map stays 100% clean with zero mark bleed!)
    const marks = [];
    const offset = 1.6;
    const len = 4.6;
    const topEnd = Math.max(0.5, cfg.marginYmm - offset);
    const topStart = Math.max(0.2, topEnd - len);
    const botStart = Math.min(296.5, cfg.marginYmm + cfg.gridHmm + offset);
    const botEnd = Math.min(296.8, botStart + len);
    const leftEnd = Math.max(0.5, cfg.marginXmm - offset);
    const leftStart = Math.max(0.2, leftEnd - len);
    const rightStart = Math.min(209.5, cfg.marginXmm + cfg.gridWmm + offset);
    const rightEnd = Math.min(209.8, rightStart + len);

    for (let c = 0; c <= cfg.cols; c++) {
      const x = (cfg.marginXmm + c * cfg.cellWmm).toFixed(2);
      marks.push(
        `<span class="crop-v" style="left:${x}mm; top:${topStart.toFixed(2)}mm; height:${(topEnd - topStart).toFixed(2)}mm;"></span>`,
        `<span class="crop-v" style="left:${x}mm; top:${botStart.toFixed(2)}mm; height:${(botEnd - botStart).toFixed(2)}mm;"></span>`
      );
    }
    for (let r = 0; r <= cfg.rows; r++) {
      const y = (cfg.marginYmm + r * cfg.cellHmm).toFixed(2);
      marks.push(
        `<span class="crop-h" style="top:${y}mm; left:${leftStart.toFixed(2)}mm; width:${(leftEnd - leftStart).toFixed(2)}mm;"></span>`,
        `<span class="crop-h" style="top:${y}mm; left:${rightStart.toFixed(2)}mm; width:${(rightEnd - rightStart).toFixed(2)}mm;"></span>`
      );
    }
    return marks.join("");
  }

  function buildDuplexFrontQrHtml({
    title,
    toolbarTitle,
    toolbarDesc,
    sheetsCells,
    cfg,
    isSquareQr,
    isPinterestStrip
  }) {
    const totalSheets = sheetsCells.length;
    const cropMarks = buildDuplexCropMarksHtml(cfg);
    const cellBg = isPinterestStrip || isSquareQr ? "#faf8f4" : "transparent";
    const pagesHtml = sheetsCells
      .map((chunk, idx) => {
        const isLast = idx === totalSheets - 1;
        return `<div class="a4-page${isLast ? " is-last" : ""}">
  <div class="sheet-orient-tag">▲ ĐẦU TRÊN - MẶT 1 (QR) · Tờ ${idx + 1}/${totalSheets}</div>
  ${cropMarks}
  <div class="a4-grid">${chunk.join("")}</div>
</div>`;
      })
      .join("\n");

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
@page { size: A4 portrait; margin: 0; }
* {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
html, body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #f4efe6;
  color: #2c1e1e;
}
.print-toolbar {
  max-width: 210mm;
  margin: 12px auto;
  padding: 14px 18px;
  background: #fff;
  border: 1px solid #d9c3a3;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}
.print-btn {
  background: #7d1518;
  color: #fff;
  border: none;
  padding: 11px 20px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}
.a4-page {
  position: relative;
  width: 210mm;
  height: 297mm;
  margin: 0 auto 18px;
  background: #ffffff;
  overflow: hidden;
  page-break-after: always;
  break-after: page;
}
.a4-page.is-last {
  page-break-after: auto;
  break-after: auto;
}
.sheet-orient-tag {
  position: absolute;
  top: 3.5mm;
  left: ${cfg.marginXmm}mm;
  font-size: 7.5pt;
  font-weight: 600;
  color: #9e877e;
  letter-spacing: 0.3px;
  user-select: none;
}
.crop-v {
  position: absolute;
  width: 0;
  border-left: 0.22mm solid #8f6b62;
  pointer-events: none;
}
.crop-h {
  position: absolute;
  height: 0;
  border-top: 0.22mm solid #8f6b62;
  pointer-events: none;
}
.a4-grid {
  position: absolute;
  left: ${cfg.marginXmm}mm;
  top: ${cfg.marginYmm}mm;
  width: ${cfg.gridWmm}mm;
  height: ${cfg.gridHmm}mm;
  display: grid;
  grid-template-columns: repeat(${cfg.cols}, ${cfg.cellWmm}mm);
  grid-template-rows: repeat(${cfg.rows}, ${cfg.cellHmm}mm);
  gap: 0;
}
.sticker-cell {
  width: ${cfg.cellWmm}mm;
  height: ${cfg.cellHmm}mm;
  padding: ${cfg.cellPadding};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${cellBg};
  overflow: hidden;
  box-shadow: inset 0 0 0 0.14mm rgba(176, 123, 114, 0.72);
  page-break-inside: avoid;
  break-inside: avoid;
}
.sticker-cell img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
@media screen {
  .a4-page {
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.12);
  }
}
@media print {
  html, body { background: #ffffff; }
  .print-toolbar { display: none !important; }
  .a4-page { margin: 0; box-shadow: none; }
}
  </style>
</head>
<body>
  <div class="print-toolbar">
    <div>
      <strong>${toolbarTitle}</strong>
      <div style="font-size:12.4px; color:#5c4747; margin-top:4px; line-height:1.52;">
        ${toolbarDesc}
        <br/>• <strong>Khóa tọa độ 2 mặt đối xứng tâm A4:</strong> Lưới ${cfg.cols}×${cfg.rows} ô (${cfg.cellWmm}×${cfg.cellHmm}mm), lề trái/phải <strong>${cfg.marginXmm}mm</strong>, lề trên/dưới <strong>${cfg.marginYmm}mm</strong>, có sẵn dấu xén ngoài lề.
        <br/>• <strong>Bắt buộc khi in:</strong> Khổ giấy <strong>A4</strong> · Tỷ lệ (Scale) <strong>100% / Mặc định</strong> · Lề (Margins) <strong>None / Không có</strong>.
      </div>
    </div>
    <button class="print-btn" onclick="window.print()">🖨️ In Ngay / Lưu File PDF</button>
  </div>
  ${pagesHtml}
</body>
</html>`;
  }

  function openBacksideMapPrintWindow({ layoutMode, pageCount = 1, testPairQrDataUrl = "" }) {
    const cfg = getLayoutSheetConfig(layoutMode);
    const isTestMode = Boolean(testPairQrDataUrl);
    const safePages = isTestMode ? 1 : Math.max(1, Math.min(80, parseInt(pageCount, 10) || 1));

    const win = window.open("", "_blank");
    if (!win) {
      notify("⚠️ Trình duyệt chặn cửa sổ bật lên. Hãy cho phép Popup để mở trang in Mặt Bản Đồ nhé!");
      return;
    }

    const totalCells = cfg.cols * cfg.rows;
    let mapCellsHtml = "";
    for (let i = 0; i < totalCells; i++) {
      mapCellsHtml += `<div class="map-cell"><svg viewBox="0 0 1000 1000" role="img" aria-label="Bản đồ Riverside Palace"><use href="#td-back-map-master" /></svg></div>`;
    }

    let testFrontHtml = "";
    if (isTestMode) {
      const cropMarks = buildDuplexCropMarksHtml(cfg);
      let qrCellsHtml = "";
      for (let i = 0; i < totalCells; i++) {
        qrCellsHtml += `<div class="sticker-cell"><img src="${testPairQrDataUrl}" alt="Test QR" /></div>`;
      }
      testFrontHtml = `<div class="a4-page is-front-test">
  <div class="sheet-orient-tag">▲ ĐẦU TRÊN - MẶT 1 (QR TEST) · Trang 1/2</div>
  ${cropMarks}
  <div class="a4-grid">${qrCellsHtml}</div>
</div>`;
    }

    const pageTitle = isTestMode
      ? `Test Khớp 2 Mặt (QR + Bản Đồ • ${cfg.shortName}) — Riverside Palace`
      : `Mặt Sau Bản Đồ Riverside Palace (${cfg.shortName}) — Khớp 100% Mặt QR`;

    win.document.open();
    win.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>${pageTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600;700&family=Cormorant+Garamond:wght@700&display=swap" rel="stylesheet" />
  <style>
@page { size: A4 portrait; margin: 0; }
:root {
  --dx: 0mm;
  --dy: 0mm;
  --safe-pad: ${cfg.safePadMm}mm;
  --sheet-bg: #FBF7F2;
  --cell-rot: 0deg;
}
* {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
html, body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #ece5dc;
  color: #2c1e1e;
}
.print-toolbar {
  max-width: 210mm;
  margin: 12px auto;
  padding: 14px 18px;
  background: #fff;
  border: 1.5px solid #9e2f42;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tb-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.tb-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  padding-top: 8px;
  border-top: 1px dashed #e2d1c4;
  font-size: 12.5px;
}
.tb-field {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  color: #4a2e2e;
}
.tb-field input[type="number"] {
  width: 66px;
  height: 30px;
  padding: 2px 6px;
  border: 1px solid #c9b2a4;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}
.tb-check {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  color: #4a2e2e;
  cursor: pointer;
}
.print-btn {
  background: #8e2b3a;
  color: #fff;
  border: none;
  padding: 11px 20px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}
.reset-btn {
  background: #f5eee6;
  color: #5c3a3a;
  border: 1px solid #d2beb0;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.a4-page {
  position: relative;
  width: 210mm;
  height: 297mm;
  margin: 0 auto 18px;
  background: var(--sheet-bg);
  overflow: hidden;
  page-break-after: always;
  break-after: page;
}
.a4-page.is-front-test {
  background: #ffffff;
}
.a4-page:last-of-type {
  page-break-after: auto;
  break-after: auto;
}
.sheet-orient-tag {
  position: absolute;
  top: 3.5mm;
  left: ${cfg.marginXmm}mm;
  font-size: 7.5pt;
  font-weight: 600;
  color: #a99389;
  letter-spacing: 0.3px;
  user-select: none;
}
.crop-v {
  position: absolute;
  width: 0;
  border-left: 0.22mm solid #8f6b62;
  pointer-events: none;
}
.crop-h {
  position: absolute;
  height: 0;
  border-top: 0.22mm solid #8f6b62;
  pointer-events: none;
}
.a4-grid {
  position: absolute;
  left: ${cfg.marginXmm}mm;
  top: ${cfg.marginYmm}mm;
  width: ${cfg.gridWmm}mm;
  height: ${cfg.gridHmm}mm;
  display: grid;
  grid-template-columns: repeat(${cfg.cols}, ${cfg.cellWmm}mm);
  grid-template-rows: repeat(${cfg.rows}, ${cfg.cellHmm}mm);
  gap: 0;
}
.a4-page.is-map-back .a4-grid {
  transform: translate(var(--dx), var(--dy));
}
.sticker-cell {
  width: ${cfg.cellWmm}mm;
  height: ${cfg.cellHmm}mm;
  padding: ${cfg.cellPadding};
  display: flex;
  align-items: center;
  justify-content: center;
  background: #faf8f4;
  overflow: hidden;
  box-shadow: inset 0 0 0 0.14mm rgba(176, 123, 114, 0.72);
}
.sticker-cell img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.map-cell {
  width: ${cfg.cellWmm}mm;
  height: ${cfg.cellHmm}mm;
  padding: var(--safe-pad);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  /* Không vẽ khung viền cắt ở mặt sau để máy in lệch 1-2mm vẫn mịn đẹp tuyệt đối! */
}
.map-cell img,
.map-cell svg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  transform: rotate(var(--cell-rot));
}
@media screen {
  .a4-page {
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.14);
  }
  .a4-page.is-map-back .map-cell {
    outline: 0.25px dashed rgba(158, 47, 66, 0.22);
  }
}
@media print {
  html, body { background: transparent; }
  .print-toolbar { display: none !important; }
  .a4-page { margin: 0; box-shadow: none; }
  .a4-page.is-map-back .map-cell { outline: none !important; }
}
  </style>
</head>
<body>
  ${getBackMapMasterSvgDefHtml()}
  <div class="print-toolbar">
    <div class="tb-top">
      <div>
        <strong>${isTestMode ? "🧪 Tờ Test Khớp 2 Mặt (Trang 1: Mặt QR · Trang 2: Mặt Bản Đồ Vector)" : `🗺️ Mặt Sau A4: Bản Đồ Riverside Palace (${cfg.name})`}</strong>
        <div style="font-size:12.2px; color:#5c4747; margin-top:4px; line-height:1.5;">
          • <strong>Bản đồ Vector siêu nét ∞ DPI:</strong> Nét đường &amp; chữ đậm rõ, khóa khớp tâm A4 ${cfg.cols}×${cfg.rows} ô (${cfg.cellWmm}×${cfg.cellHmm}mm · lề ${cfg.marginXmm}/${cfg.marginYmm}mm).<br/>
          • <strong>Bắt buộc khi in:</strong> Khổ giấy <strong>A4</strong> · Tỷ lệ <strong>100% (Actual Size)</strong> · Lề <strong>None</strong>. ${isTestMode ? "In Trang 1 trước, lật giấy đút lại in Trang 2 rồi đưa lên soi đèn!" : "Mẹo: Chỉ cần để 1 tờ rồi chỉnh Số bản (Copies) trên máy in bằng số tờ QR đã in."}
        </div>
      </div>
      <button class="print-btn" onclick="window.print()">🖨️ In Ngay / Lưu File PDF</button>
    </div>
    <div class="tb-controls">
      ${isTestMode ? "" : `<label class="tb-field">Số tờ A4: <input type="number" id="cal-pages" min="1" max="80" step="1" value="${safePages}" /></label>`}
      <label class="tb-field" title="Dịch toàn bộ lưới bản đồ sang phải (+) hoặc sang trái (-) nếu máy in bị lệch ngang khi đút giấy lần 2">Bù ngang X (mm): <input type="number" id="cal-dx" min="-8" max="8" step="0.5" value="0" /></label>
      <label class="tb-field" title="Dịch toàn bộ lưới bản đồ xuống dưới (+) hoặc lên trên (-) nếu máy in bị lệch dọc khi đút giấy lần 2">Bù dọc Y (mm): <input type="number" id="cal-dy" min="-8" max="8" step="0.5" value="0" /></label>
      <label class="tb-field" title="Khoảng đệm an toàn quanh mỗi ô bản đồ để khi cắt không bao giờ phạm vào chữ">Lề an toàn (mm): <input type="number" id="cal-pad" min="1.5" max="7" step="0.5" value="${cfg.safePadMm}" /></label>
      <label class="tb-check"><input type="checkbox" id="cal-bleed" checked /> Phủ nền kem tràn tờ (#FBF7F2)</label>
      <label class="tb-check"><input type="checkbox" id="cal-rot" /> Xoay 180° (nếu máy lật ngược)</label>
      <button type="button" class="reset-btn" id="cal-reset">↺ Về mặc định</button>
    </div>
  </div>
  ${testFrontHtml}
  <div id="map-pages-host"></div>
  <script>
    (function() {
      var mapCells = ${JSON.stringify(mapCellsHtml)};
      var host = document.getElementById("map-pages-host");
      var inpPages = document.getElementById("cal-pages");
      var inpDx = document.getElementById("cal-dx");
      var inpDy = document.getElementById("cal-dy");
      var inpPad = document.getElementById("cal-pad");
      var chkBleed = document.getElementById("cal-bleed");
      var chkRot = document.getElementById("cal-rot");
      var btnReset = document.getElementById("cal-reset");
      var defaultPad = ${cfg.safePadMm};
      var isTest = ${isTestMode ? "true" : "false"};

      function renderPages(count) {
        var n = Math.max(1, Math.min(80, parseInt(count, 10) || 1));
        var html = "";
        for (var p = 0; p < n; p++) {
          var tag = isTest ? "▲ ĐẦU TRÊN - MẶT 2 (BẢN ĐỒ TEST) · Trang 2/2" : ("▲ ĐẦU TRÊN - MẶT 2 (BẢN ĐỒ)" + (n > 1 ? " · Tờ " + (p + 1) + "/" + n : ""));
          html += '<div class="a4-page is-map-back"><div class="sheet-orient-tag">' + tag + '</div><div class="a4-grid">' + mapCells + '</div></div>';
        }
        host.innerHTML = html;
      }

      function applyCal() {
        var root = document.documentElement.style;
        var dx = parseFloat(inpDx.value) || 0;
        var dy = parseFloat(inpDy.value) || 0;
        var pad = Math.max(0, parseFloat(inpPad.value) || defaultPad);
        root.setProperty("--dx", dx + "mm");
        root.setProperty("--dy", dy + "mm");
        root.setProperty("--safe-pad", pad + "mm");
        root.setProperty("--sheet-bg", chkBleed.checked ? "#FBF7F2" : "#ffffff");
        root.setProperty("--cell-rot", chkRot.checked ? "180deg" : "0deg");
      }

      renderPages(${safePages});
      applyCal();

      if (inpPages) inpPages.addEventListener("input", function() { renderPages(inpPages.value); });
      inpDx.addEventListener("input", applyCal);
      inpDy.addEventListener("input", applyCal);
      inpPad.addEventListener("input", applyCal);
      chkBleed.addEventListener("change", applyCal);
      chkRot.addEventListener("change", applyCal);
      btnReset.addEventListener("click", function() {
        inpDx.value = "0";
        inpDy.value = "0";
        inpPad.value = String(defaultPad);
        chkBleed.checked = true;
        chkRot.checked = false;
        if (inpPages) { inpPages.value = "1"; renderPages(1); }
        applyCal();
      });
    })();
  <\/script>
</body>
</html>`);
    win.document.close();
  }

  function renderLuxuryWeddingQR(forPrintTransparent = false, overrideOpts = null) {
    if (!qrCanvas || typeof window.qrcode !== "function") return;
    const layoutMode =
      (overrideOpts && overrideOpts.layoutMode) ||
      (qrLayoutStyle && qrLayoutStyle.value) ||
      "square_qr";
    const targetUrl =
      (overrideOpts && overrideOpts.targetUrl) ||
      (qrUrlInput && qrUrlInput.value.trim()) ||
      "https://thuantuongtieudinh.io.vn/?mode=directions";
    const capMode =
      (overrideOpts && overrideOpts.capMode) ||
      (qrCaptionStyle && qrCaptionStyle.value) ||
      "bilingual";
    const guestText =
      overrideOpts && typeof overrideOpts.guestText === "string"
        ? overrideOpts.guestText.trim()
        : (qrGuestBadge && qrGuestBadge.value.trim()) || "";
    const namePosMode =
      (overrideOpts && overrideOpts.namePosMode) ||
      (qrBatchNamePos && qrBatchNamePos.value) ||
      "flap_only";
    const slotNum = overrideOpts && overrideOpts.slotNum ? overrideOpts.slotNum : 0;

    const isSquareQr = layoutMode.startsWith("square_qr");
    const isPinterestStrip = layoutMode === "pinterest_strip";
    // Square: 800 x 800 (1:1 True Square) -> at 3x = 2400 x 2400 px Ultra-HD
    // Pinterest strip: 460 x 1326 -> at 3x = 1380 x 3978 px
    // Frameless wide: 900 x 1120 -> at 3x = 2700 x 3360 px
    const W = isPinterestStrip ? 460 : isSquareQr ? 800 : 900;
    const H = isPinterestStrip ? 1326 : isSquareQr ? 800 : 1120;
    const SCALE = 3;
    const physW = W * SCALE;
    const physH = H * SCALE;
    if (qrCanvas.width !== physW) qrCanvas.width = physW;
    if (qrCanvas.height !== physH) qrCanvas.height = physH;

    const ctx = qrCanvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, physW, physH);
    ctx.scale(SCALE, SCALE);

    // Generate QR Matrix (Error Correction Level H for 30% redundancy around center 囍 seal)
    const qr = window.qrcode(0, "H");
    qr.addData(targetUrl);
    qr.make();
    const count = qr.getModuleCount();
    const centerMin = count * 0.39;
    const centerMax = count * 0.61;
    const eyeHoleFill = forPrintTransparent ? "transparent" : "#faf8f4";
    const champagneBg = "#faf8f4";

    // =====================================================================
    // MODE 0: DEDICATED SQUARE QR CARD (1:1 Ratio • 4.5×4.5cm hoặc 5.8×5.8cm)
    // Hiển thị rõ: "Mời Quý Khách" (hoặc Tên Khách) + Mã QR + "Quét mã..."
    // =====================================================================
    if (isSquareQr) {
      ctx.fillStyle = champagneBg;
      if (!forPrintTransparent) {
        drawRoundedRect(ctx, 0, 0, W, H, 16);
        ctx.fill();
        ctx.save();
        ctx.strokeStyle = "rgba(110, 20, 20, 0.12)";
        ctx.lineWidth = 1.2;
        drawRoundedRect(ctx, 0.6, 0.6, W - 1.2, H - 1.2, 16);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.fillRect(0, 0, W, H);
        // Crisp outer cut guide border directly on the canvas for printing
        ctx.save();
        ctx.strokeStyle = "#c89f88";
        ctx.lineWidth = 1.4;
        ctx.strokeRect(0.7, 0.7, W - 1.4, H - 1.4);
        ctx.restore();
      }

      // Delicate hairline inner couture double-frame
      ctx.save();
      ctx.strokeStyle = "rgba(110, 20, 20, 0.18)";
      ctx.lineWidth = 1.0;
      drawRoundedRect(ctx, 14, 14, W - 28, H - 28, 8);
      ctx.stroke();
      ctx.restore();

      // Corner display: show #01 only for unnamed slots; named or generic cards keep symmetric 囍
      const hasGuestName = Boolean(guestText);
      const showSlotNum = Boolean(slotNum && !hasGuestName);
      ctx.save();
      if (showSlotNum) {
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#681115";
        ctx.font = '600 22px "Be Vietnam Pro", sans-serif';
        ctx.fillText(`#${String(slotNum).padStart(2, "0")}`, 28, 48);

        ctx.textAlign = "right";
        ctx.fillStyle = "#7a3b0c";
        ctx.font = '700 20px "Noto Serif TC", serif';
        ctx.fillText("囍", W - 28, 48);
      } else {
        ctx.fillStyle = "#7a3b0c";
        ctx.font = '700 19px "Noto Serif TC", serif';
        ctx.textAlign = "left";
        ctx.fillText("囍", 28, 48);
        ctx.textAlign = "right";
        ctx.fillText("囍", W - 28, 48);
      }
      ctx.restore();

      // 1. TOP HEADER SECTION (THANH LỊCH, GỌN GÀNG, BỎ CHỮ MỜI Ở TRÊN ĐỂ DỒN TRỌNG TÂM VÀO QR)
      ctx.textAlign = "center";
      ctx.fillStyle = "#7a3b0c";
      if (capMode === "zh") {
        ctx.font = '600 21px "Noto Serif TC", serif';
        ctx.fillText("誠   摯   敬   邀", W / 2, 48);
      } else {
        ctx.font = '700 19px "Cormorant Garamond", "Noto Serif TC", serif';
        ctx.fillText("✦   06  ·  01  ·  2027   ✦", W / 2, 48);
      }

      // 2. CENTER SQUARE QR MATRIX (MÃ QR PHÓNG TO TỐI ĐA 490px ĐỂ QUÉT CỰC NHANH & NÉT)
      const qrBoxSize = 490;
      const qrX = (W - qrBoxSize) / 2;
      const qrY = 82;
      const pad = 15;
      const innerQrSize = qrBoxSize - pad * 2;
      const cellSize = innerQrSize / count;
      const startX = qrX + pad;
      const startY = qrY + pad;

      drawFinderEye(ctx, startX, startY, cellSize, champagneBg);
      drawFinderEye(ctx, startX + (count - 7) * cellSize, startY, cellSize, champagneBg);
      drawFinderEye(ctx, startX, startY + (count - 7) * cellSize, cellSize, champagneBg);

      ctx.fillStyle = "#681115";
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (isFinderPattern(r, c, count)) continue;
          if (r > centerMin && r < centerMax && c > centerMin && c < centerMax) continue;
          if (qr.isDark(r, c)) {
            const cx = startX + (c + 0.5) * cellSize;
            const cy = startY + (r + 0.5) * cellSize;
            ctx.beginPath();
            ctx.arc(cx, cy, cellSize * 0.44, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Center 囍 Medallion
      const sealCx = qrX + qrBoxSize / 2;
      const sealCy = qrY + qrBoxSize / 2;
      const sealR = qrBoxSize * 0.096;

      ctx.fillStyle = champagneBg;
      ctx.beginPath();
      ctx.arc(sealCx, sealCy, sealR + 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#681115";
      ctx.beginPath();
      ctx.arc(sealCx, sealCy, sealR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#e5be77";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(sealCx, sealCy, sealR - 3.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#ffdf9e";
      ctx.textAlign = "center";
      ctx.font = `700 ${Math.round(sealR * 1.08)}px "Noto Serif TC", serif`;
      ctx.textBaseline = "middle";
      ctx.fillText("囍", sealCx, sealCy + 2);
      ctx.textBaseline = "alphabetic";

      // 3. BOTTOM CALL-TO-ACTION (LỰA CHỌN 1B - NGẮN GỌN, HIỆN ĐẠI, CHỮ TO RÕ NHÌN RẤT SANG)
      let line1 = "";
      let line2 = "";

      if (capMode === "zh") {
        if (guestText) {
          const raw = guestText.trim();
          line1 = /^(敬邀|誠摯敬邀)/.test(raw) ? raw : `敬邀 ${raw}`;
        } else {
          line1 = "誠摯敬邀貴賓";
        }
        line2 = "掃碼開啟喜帖、地圖與婚宴桌次";
      } else {
        // Vietnamese (default & bilingual)
        if (guestText) {
          const raw = guestText.trim();
          if (/^(mời|kính mời)/i.test(raw)) {
            line1 = raw;
          } else if (
            /^(anh|chị|bạn|em|cô|chú|bác|dì|ông|bà|gia đình|gđ|vợ chồng|vc|hia|chế|thím|cậu|mợ|dượng|thầy|sếp|quý)/i.test(
              raw
            )
          ) {
            line1 = `Mời ${raw}`;
          } else if (/[\u4e00-\u9fff]/.test(raw)) {
            line1 = `敬邀 ${raw}`;
          } else {
            line1 = `Mời bạn ${raw}`;
          }
        } else {
          line1 = "Mời Quý khách";
        }
        line2 = "quét mã xem thiệp cưới, bản đồ & chỗ ngồi";
      }

      ctx.textAlign = "center";
      // Dòng 1: Lời mời / Tên khách (Tự co nhẹ nếu tên dài để luôn nằm gọn trong khung 800px)
      ctx.fillStyle = "#681115";
      const len1 = line1.length;
      let size1 = len1 > 28 ? 24 : len1 > 18 ? 28 : 33;
      const setLine1Font = (sz) => {
        ctx.font =
          capMode === "zh"
            ? `700 ${sz}px "Noto Serif TC", serif`
            : `700 ${sz}px "Be Vietnam Pro", sans-serif`;
      };
      setLine1Font(size1);
      while (size1 > 18 && ctx.measureText(line1).width > W - 84) {
        size1 -= 1;
        setLine1Font(size1);
      }
      ctx.fillText(line1, W / 2, 638);

      // Dòng 2: Hành động (Font rõ ràng, sắc nét, dễ đọc từ xa)
      ctx.fillStyle = "#7a3b0c";
      const size2 = capMode === "zh" ? 24 : 23.5;
      ctx.font = capMode === "zh"
        ? `600 ${size2}px "Noto Serif TC", serif`
        : `600 ${size2}px "Be Vietnam Pro", sans-serif`;
      ctx.fillText(line2, W / 2, 680);
      return;
    }

    // =====================================================================
    // MODE A: PINTEREST SLENDER VERTICAL BOOKMARK STRIP (~3.28cm x 9.46cm)
    // Exact Milk-Ivory Off-White (#FAF8F4 / #FBF9F5) sampled directly from the user's invitation card!
    // =====================================================================
    if (isPinterestStrip) {
      const champagneBg = "#faf8f4";
      const foldY = 260; // Deeper ~1.9cm top fold-over tab so it hooks firmly onto the back of the card!

      // Fill edge-to-edge with delicate Milk-Ivory (#FAF8F4) matching the actual invitation card!
      ctx.fillStyle = champagneBg;
      if (!forPrintTransparent) {
        drawRoundedRect(ctx, 0, 0, W, H, 12);
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, W, H);
        // Crisp outer cut guide border directly on the 1,060-DPI canvas so it is 100% visible in PDF & Print
        ctx.save();
        ctx.strokeStyle = "#b07b72";
        ctx.lineWidth = 1.6;
        ctx.strokeRect(0.8, 0.8, W - 1.6, H - 1.6);
        ctx.restore();
      }

      // Clear dashed fold line (-------------) across the width with 2mm safe inner margin at both ends
      ctx.save();
      ctx.strokeStyle = "rgba(110, 20, 20, 0.55)";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([12, 9]);
      ctx.beginPath();
      ctx.moveTo(26, foldY);
      ctx.lineTo(W - 26, foldY);
      ctx.stroke();
      ctx.restore();

      if (slotNum && !guestText) {
        // Numbered QR bookmark (chỉ hiện số góc khi chưa có tên khách):
        // 1. Tiny, discreet number in the top-left corner so guests barely notice it, while bride/groom can identify it!
        // 2. Delicate couture ornament in the center of the back-folded flap.
        if (!forPrintTransparent) {
          ctx.fillStyle = "rgba(110, 20, 20, 0.045)";
          ctx.fillRect(0, 0, W, foldY);
        }
        const flapStyleEl = document.getElementById("slot-flap-center-style");
        const flapCenterMode =
          (overrideOpts && overrideOpts.flapCenterMode) ||
          (flapStyleEl && flapStyleEl.value) ||
          "xi_emblem";

        ctx.save();
        // Crisp, print-safe micro serial number in the left corner:
        // Uses solid ink (#681115, no halftone opacity) + uniform-stroke sans-serif (Be Vietnam Pro 600, 23px = ~5pt / 1.65mm on paper)
        // so any laser/offset printer prints every digit 100% sharp without losing thin strokes, while staying discreet in the corner!
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#681115";
        ctx.font = '600 23px "Be Vietnam Pro", sans-serif';
        const paddedNum = String(slotNum).padStart(2, "0");
        ctx.fillText(`#${paddedNum}`, 26, 46);

        // Center of the back-folded flap (y = 144) — larger, prominent couture ornament in solid ink
        const cy = 144;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (flapCenterMode === "xi_emblem") {
          // Symmetric ornamental wings + ✦ 囍 ✦ (looks balanced both upright and upside-down when folded!)
          ctx.strokeStyle = "#8c4a27";
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(W / 2 - 148, cy);
          ctx.lineTo(W / 2 - 66, cy);
          ctx.moveTo(W / 2 + 66, cy);
          ctx.lineTo(W / 2 + 148, cy);
          ctx.stroke();

          // Flanking 4-point stars
          ctx.fillStyle = "#7a3b0c";
          ctx.font = '700 21px "Noto Serif TC", "Cormorant Garamond", serif';
          ctx.fillText("✦", W / 2 - 44, cy);
          ctx.fillText("✦", W / 2 + 44, cy);

          // Prominent Double Happiness 囍 centerpiece
          ctx.fillStyle = "#681115";
          ctx.font = '700 34px "Noto Serif TC", "Cormorant Garamond", serif';
          ctx.fillText("囍", W / 2, cy + 1);
        } else if (flapCenterMode === "with_love") {
          ctx.fillStyle = "#681115";
          ctx.font = 'italic 600 28px "Cormorant Garamond", serif';
          ctx.fillText("✦   With Love  ·  T & D   ✦", W / 2, cy);
        } else if (flapCenterMode === "monogram_date") {
          ctx.fillStyle = "#681115";
          ctx.font = '700 25px "Cormorant Garamond", "Be Vietnam Pro", serif';
          ctx.fillText("✦   Tường & Dinh  ·  06.01.2027   ✦", W / 2, cy);
        }
        ctx.restore();
      } else if (!forPrintTransparent) {
        // Subtle shaded preview of the 1.9cm top fold-over tab on screen
        ctx.fillStyle = "rgba(110, 20, 20, 0.045)";
        ctx.fillRect(0, 0, W, foldY);

        ctx.textAlign = "center";
        if (guestText) {
          ctx.fillStyle = "#681115";
          ctx.font = '700 27px "Be Vietnam Pro", "Noto Serif TC", sans-serif';
          ctx.fillText(guestText, W / 2, 125);
          ctx.fillStyle = "rgba(110, 20, 20, 0.55)";
          ctx.font = '500 13px "Be Vietnam Pro", sans-serif';
          ctx.fillText("(Phần gập ra sau lưng thiệp)", W / 2, 165);
        } else {
          ctx.fillStyle = "rgba(110, 20, 20, 0.65)";
          ctx.font = '600 14.5px "Be Vietnam Pro", sans-serif';
          ctx.fillText("▴ NẾP GẬP RA SAU (~1.9CM) ▴", W / 2, 115);
          ctx.font = '400 13px "Be Vietnam Pro", sans-serif';
          ctx.fillText("Gập theo đường  - - - - -  máng vô đầu thiệp", W / 2, 145);
        }
      } else {
        // If this strip has a personalized guest QR, print a BIG, CLEAR guest label on the back-folded flap
        if (guestText) {
          ctx.textAlign = "center";
          ctx.fillStyle = "#681115";
          const flapFontSize = guestText.length > 18 ? 22 : guestText.length > 13 ? 25 : 28;
          ctx.font = `700 ${flapFontSize}px "Be Vietnam Pro", "Noto Serif TC", sans-serif`;
          ctx.fillText(guestText, W / 2, 142);
        }
      }

      // Upper Body (y = 275..815): Long, Slender Vertical Editorial Typography
      ctx.save();
      ctx.translate(W / 2, 545);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";

      const hasFrontGuest = Boolean(guestText && namePosMode === "flap_and_front");
      const mainLineOffsetY = hasFrontGuest ? -32 : -12;
      const dateLineOffsetY = hasFrontGuest ? 14 : 32;

      ctx.fillStyle = "#681115";
      if (capMode === "zh") {
        ctx.font = '700 41px "Noto Serif TC", serif';
        ctx.fillText("趙  順  祥   &   盧  小  瑩", 0, mainLineOffsetY);
      } else {
        ctx.font = '700 43px "Cormorant Garamond", "Noto Serif TC", serif';
        ctx.fillText("T Ư Ờ N G   &   D I N H", 0, mainLineOffsetY);
      }

      // Full-height lining numbers so 06.01.2027 is super clear along the long vertical shaft
      ctx.fillStyle = "#7a3b0c";
      ctx.font = '700 24px "Noto Serif TC", "Be Vietnam Pro", serif';
      ctx.fillText("06   ·   01   ·   2027", 0, dateLineOffsetY);

      if (hasFrontGuest) {
        ctx.fillStyle = "#6e1414";
        ctx.font = '600 20.5px "Be Vietnam Pro", "Noto Serif TC", sans-serif';
        ctx.fillText(`✦  ${guestText}  ✦`, 0, 52);
      }
      ctx.restore();

      // Lower Body (y = 826..1122): Compact Frameless Minimalist QR Code with generous ~6.5mm left/right safe cut margin
      const qrBoxSize = 296;
      const qrX = (W - qrBoxSize) / 2;
      const qrY = 826;
      const pad = 12;
      const innerQrSize = qrBoxSize - pad * 2;
      const cellSize = innerQrSize / count;
      const startX = qrX + pad;
      const startY = qrY + pad;

      drawFinderEye(ctx, startX, startY, cellSize, champagneBg);
      drawFinderEye(ctx, startX + (count - 7) * cellSize, startY, cellSize, champagneBg);
      drawFinderEye(ctx, startX, startY + (count - 7) * cellSize, cellSize, champagneBg);

      ctx.fillStyle = "#681115";
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (isFinderPattern(r, c, count)) continue;
          if (r > centerMin && r < centerMax && c > centerMin && c < centerMax) continue;
          if (qr.isDark(r, c)) {
            const cx = startX + (c + 0.5) * cellSize;
            const cy = startY + (r + 0.5) * cellSize;
            ctx.beginPath();
            ctx.arc(cx, cy, cellSize * 0.44, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Small 囍 Center Medallion
      const sealCx = qrX + qrBoxSize / 2;
      const sealCy = qrY + qrBoxSize / 2;
      const sealR = qrBoxSize * 0.095;
      ctx.fillStyle = champagneBg;
      ctx.beginPath();
      ctx.arc(sealCx, sealCy, sealR + 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#681115";
      ctx.beginPath();
      ctx.arc(sealCx, sealCy, sealR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#e5be77";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sealCx, sealCy, sealR - 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#ffdf9e";
      ctx.textAlign = "center";
      ctx.font = `700 ${Math.round(sealR * 1.1)}px "Noto Serif TC", serif`;
      ctx.textBaseline = "middle";
      ctx.fillText("囍", sealCx, sealCy + 1.5);
      ctx.textBaseline = "alphabetic";

      // Crisp, Easy-to-Read Concise Footer Caption below QR ("THIỆP & BẢN ĐỒ")
      ctx.textAlign = "center";
      ctx.fillStyle = "#681115";
      if (capMode === "zh") {
        ctx.font = '700 21px "Noto Serif TC", serif';
        ctx.fillText("喜 帖 ＆ 婚 宴 地 圖", W / 2, 1176);
        ctx.fillStyle = "#7a3b0c";
        ctx.font = '600 16.5px "Noto Serif TC", serif';
        ctx.fillText("掃碼開啟導航 · 06.01.2027", W / 2, 1206);
      } else if (capMode === "vi") {
        ctx.font = '700 21.5px "Cormorant Garamond", "Be Vietnam Pro", serif';
        ctx.fillText("T H I Ệ P   &   B Ả N   Đ Ồ", W / 2, 1176);
        ctx.fillStyle = "#7a3b0c";
        ctx.font = '600 16px "Be Vietnam Pro", sans-serif';
        ctx.fillText("Quét mã xem thiệp & chỉ đường", W / 2, 1206);
      } else {
        ctx.font = '700 21.5px "Cormorant Garamond", "Be Vietnam Pro", serif';
        ctx.fillText("T H I Ệ P   &   B Ả N   Đ Ồ", W / 2, 1174);
        ctx.fillStyle = "#7a3b0c";
        ctx.font = '600 17px "Noto Serif TC", serif';
        ctx.fillText("喜 帖 與 婚 宴 地 圖 導 航", W / 2, 1206);
      }

      // Couture Signature Footer ("Personally designed by the Bride & Groom — Tiểu Dinh & Thuận Tường")
      ctx.fillStyle = "#633939";
      ctx.font = 'italic 500 16.5px "Cormorant Garamond", serif';
      ctx.fillText("Personally designed by the Bride & Groom", W / 2, 1244);
      ctx.fillStyle = "#681115";
      ctx.font = '600 15.5px "Cormorant Garamond", "Be Vietnam Pro", serif';
      ctx.fillText("—  Tiểu Dinh & Thuận Tường  —", W / 2, 1270);
      return;
    }

    // =====================================================================
    // MODE B: WIDE MINI INSERT CARD (4.8cm x 5.6cm)
    // =====================================================================
    const isFoldTab = layoutMode === "fold_tab";
    const isFlapSeal = layoutMode === "flap_seal";
    const shiftY = isFoldTab ? 78 : 0;

    if (!forPrintTransparent) {
      ctx.fillStyle = "#fbf7ef";
      drawRoundedRect(ctx, 0, 0, W, H, 24);
      ctx.fill();
    }

    // Optional Top Fold-Over Bookmark Tab Guide (0đ no-paperclip solution!)
    if (isFoldTab) {
      ctx.save();
      ctx.strokeStyle = "rgba(110, 20, 20, 0.28)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(40, 142);
      ctx.lineTo(W - 40, 142);
      ctx.stroke();
      ctx.restore();

      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(125, 21, 24, 0.45)";
      ctx.font = '500 16px "Be Vietnam Pro", sans-serif';
      ctx.fillText("▴  Nếp gấp 1.2cm ra mặt sau để máng lên đầu tờ thiệp số 1 (0đ ghim)  ▴", W / 2, 92);
    }

    // Only draw thin ornamental border if user explicitly picks "flap_seal"
    if (isFlapSeal) {
      ctx.strokeStyle = "rgba(176, 128, 56, 0.42)";
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, 32, 32, W - 64, H - 64, 18);
      ctx.stroke();
    }

    // 2. Frameless Minimalist Editorial Typography Header
    ctx.textAlign = "center";
    ctx.fillStyle = "#9a6316";
    ctx.font = '600 20px "Cormorant Garamond", "Noto Serif TC", serif';
    ctx.fillText("囍    06  ·  01  ·  2027    囍", W / 2, 96 + shiftY);

    ctx.fillStyle = "#6e1414";
    if (capMode === "zh") {
      ctx.font = '600 40px "Noto Serif TC", serif';
      ctx.fillText("趙順祥   &   盧小瑩", W / 2, 152 + shiftY);
    } else {
      ctx.font = '600 45px "Cormorant Garamond", serif';
      ctx.fillText("Thuận Tường  &  Tiểu Dinh", W / 2, 152 + shiftY);
    }

    if (guestText) {
      ctx.fillStyle = "#8a181c";
      ctx.font = '500 22px "Cormorant Garamond", "Noto Serif TC", serif';
      ctx.fillText(`—  ${guestText}  —`, W / 2, 192 + shiftY);
    } else {
      ctx.fillStyle = "#9a6316";
      ctx.font = '500 18.5px "Be Vietnam Pro", "Noto Serif TC", sans-serif';
      ctx.fillText(
        capMode === "zh"
          ? "RIVERSIDE PALACE · Seine 宴會廳 · 18:00"
          : "RIVERSIDE PALACE · Sảnh Seine · 18:00",
        W / 2,
        190 + shiftY
      );
    }

    // 3. Position QR Matrix for Wide Card
    const qrBoxSize = isFoldTab ? 580 : 620;
    const qrX = (W - qrBoxSize) / 2;
    const qrY = (isFoldTab ? 210 : 224) + shiftY;
    const pad = 20;
    const innerQrSize = qrBoxSize - pad * 2;
    const cellSize = innerQrSize / count;
    const startX = qrX + pad;
    const startY = qrY + pad;

    // Draw 3 Ornate Rounded Finder Eyes
    drawFinderEye(ctx, startX, startY, cellSize, eyeHoleFill);
    drawFinderEye(ctx, startX + (count - 7) * cellSize, startY, cellSize, eyeHoleFill);
    drawFinderEye(ctx, startX, startY + (count - 7) * cellSize, cellSize, eyeHoleFill);

    // Draw Rounded Crimson Dots for Data Modules
    ctx.fillStyle = "#6e1414";
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (isFinderPattern(r, c, count)) continue;
        if (r > centerMin && r < centerMax && c > centerMin && c < centerMax) {
          continue;
        }
        if (qr.isDark(r, c)) {
          const cx = startX + (c + 0.5) * cellSize;
          const cy = startY + (r + 0.5) * cellSize;
          const radius = cellSize * 0.43;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 4. Center 囍 Crimson & 24K Gold Medallion
    const sealCx = qrX + qrBoxSize / 2;
    const sealCy = qrY + qrBoxSize / 2;
    const sealR = qrBoxSize * 0.095;

    if (!forPrintTransparent) {
      ctx.fillStyle = "#fbf7ef";
      ctx.beginPath();
      ctx.arc(sealCx, sealCy, sealR + 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#6e1414";
    ctx.beginPath();
    ctx.arc(sealCx, sealCy, sealR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#e5be77";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(sealCx, sealCy, sealR - 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#ffdf9e";
    ctx.font = `700 ${Math.round(sealR * 1.1)}px "Noto Serif TC", serif`;
    ctx.textBaseline = "middle";
    ctx.fillText("囍", sealCx, sealCy + 2);
    ctx.textBaseline = "alphabetic";

    // 5. Bottom Frameless Editorial Call-To-Action & Venue Address
    const footBaseY = qrY + qrBoxSize + (isFoldTab ? 42 : 52);
    ctx.fillStyle = "#6e1414";
    if (capMode === "bilingual") {
      ctx.font = '600 24px "Cormorant Garamond", "Be Vietnam Pro", serif';
      ctx.fillText("Quét mã mở Bản Đồ Chỉ Đường & Thiệp Cưới Online", W / 2, footBaseY);
      ctx.fillStyle = "#9a590d";
      ctx.font = '500 20px "Noto Serif TC", serif';
      ctx.fillText("掃碼開啟 Google 婚宴地圖與電子喜帖", W / 2, footBaseY + 34);
    } else if (capMode === "zh") {
      ctx.font = '600 26px "Noto Serif TC", serif';
      ctx.fillText("掃碼開啟 Google 婚宴地圖導航", W / 2, footBaseY + 4);
      ctx.fillStyle = "#9a590d";
      ctx.font = '500 19px "Noto Serif TC", serif';
      ctx.fillText("胡志明市永會坊檳雲屯街 360D 號（Seine 宴會廳）", W / 2, footBaseY + 38);
    } else {
      ctx.font = '600 26px "Cormorant Garamond", "Be Vietnam Pro", serif';
      ctx.fillText("Quét mã mở Bản Đồ Chỉ Đường & Thiệp Cưới", W / 2, footBaseY + 4);
      ctx.fillStyle = "#9a590d";
      ctx.font = '500 19px "Be Vietnam Pro", sans-serif';
      ctx.fillText("Thứ Tư · 06.01.2027 · Đón khách 18:00 — Khai tiệc 19:00", W / 2, footBaseY + 36);
    }

    // Subtle 60px center hairline ornament instead of a full box divider
    ctx.strokeStyle = "rgba(154, 99, 22, 0.35)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 70, footBaseY + 58);
    ctx.lineTo(W / 2 + 70, footBaseY + 58);
    ctx.stroke();

    ctx.fillStyle = "#5a3232";
    ctx.font = '500 19px "Be Vietnam Pro", sans-serif';
    ctx.fillText("360D Bến Vân Đồn, P. Vĩnh Hội, TP.HCM", W / 2, footBaseY + 88);

    ctx.fillStyle = "#6e4242";
    ctx.font = 'italic 500 19px "Cormorant Garamond", serif';
    ctx.fillText(
      "Personally designed by the Bride & Groom — Tiểu Dinh & Thuận Tường",
      W / 2,
      footBaseY + 118
    );
  }

  function openGuestInQrStudio(guestNameStr, guestUrlStr, langCode) {
    const qrTabBtn = document.querySelector('.adm-tab-btn[data-tab="tab-qr"]');
    if (qrTabBtn) qrTabBtn.click();
    if (qrPresetSelect) qrPresetSelect.value = "custom";
    if (qrUrlInput) qrUrlInput.value = guestUrlStr;
    if (qrGuestBadge) qrGuestBadge.value = guestNameStr;
    if (qrCaptionStyle) {
      qrCaptionStyle.value = langCode === "zh" ? "zh" : "bilingual";
    }
    renderLuxuryWeddingQR(false);
    notify(`📱 Đã tạo Thẻ Phụ QR riêng cho khách "${guestNameStr}"!`);
  }

  if (qrLayoutStyle) {
    qrLayoutStyle.addEventListener("change", () => {
      updateBatchLiveSummary();
      renderLuxuryWeddingQR(false);
    });
  }
  if (qrPresetSelect) {
    qrPresetSelect.addEventListener("change", () => {
      const v = qrPresetSelect.value;
      if (QR_PRESET_URLS[v] && qrUrlInput) {
        qrUrlInput.value = QR_PRESET_URLS[v];
      }
      renderLuxuryWeddingQR(false);
    });
  }
  if (qrUrlInput) qrUrlInput.addEventListener("input", () => renderLuxuryWeddingQR(false));
  if (qrCaptionStyle) qrCaptionStyle.addEventListener("change", () => renderLuxuryWeddingQR(false));
  if (qrGuestBadge) qrGuestBadge.addEventListener("input", () => renderLuxuryWeddingQR(false));
  if (qrBatchNamePos) qrBatchNamePos.addEventListener("change", () => renderLuxuryWeddingQR(false));

  const qrBatchSlotStart = document.getElementById("qr-batch-slot-start");
  const qrBatchFillMode = document.getElementById("qr-batch-fill-mode");
  const qrBatchNamedCount = document.getElementById("qr-batch-named-count");
  const qrBatchLiveSummary = document.getElementById("qr-batch-live-summary");

  function getBatchNamedList() {
    const rawNames = (qrBatchGuests && qrBatchGuests.value) || "";
    return rawNames
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function updateBatchLiveSummary() {
    const names = getBatchNamedList();
    const namedCount = names.length;
    if (qrBatchNamedCount) qrBatchNamedCount.textContent = String(namedCount);

    const layoutMode = (qrLayoutStyle && qrLayoutStyle.value) || "square_qr";
    const cfg = getLayoutSheetConfig(layoutMode);
    const targetTotal = Math.max(
      namedCount,
      parseInt((qrBatchGenericCount && qrBatchGenericCount.value) || "414", 10) || 414
    );
    const startSlot = Math.max(
      1,
      parseInt((qrBatchSlotStart && qrBatchSlotStart.value) || "1", 10) || 1
    );
    const fillMode = (qrBatchFillMode && qrBatchFillMode.value) || "numbered";
    const remainder = Math.max(0, targetTotal - namedCount);
    const sheets = Math.ceil(targetTotal / cfg.itemsPerSheet);

    // Compute unassigned slots sequence without duplicating any named guest or server slot
    ensureGuestSlotsNormalized();
    const usedSlotNums = getAllUsedSlotNums();
    let manualCursor = 1;
    names.forEach((gName) => {
      const matchedG = savedGuests.find(
        (g) => g && normalizeNameKey(g.name) === normalizeNameKey(gName)
      );
      if (matchedG && Number(matchedG.slot)) {
        usedSlotNums.add(Number(matchedG.slot));
      } else {
        while (usedSlotNums.has(manualCursor)) manualCursor++;
        usedSlotNums.add(manualCursor);
        manualCursor++;
      }
    });

    let startSlotAuto = startSlot > 1 && !usedSlotNums.has(startSlot) ? startSlot : 1;
    const remainingSlots = [];
    let cur = startSlotAuto;
    while (remainingSlots.length < remainder) {
      if (!usedSlotNums.has(cur)) {
        remainingSlots.push(cur);
      }
      cur++;
    }
    const firstRemSlot = remainingSlots.length > 0 ? remainingSlots[0] : startSlot;
    const lastRemSlot = remainingSlots.length > 0 ? remainingSlots[remainingSlots.length - 1] : startSlot;

    if (qrBatchLiveSummary) {
      if (fillMode === "numbered") {
        qrBatchLiveSummary.innerHTML =
          remainder > 0
            ? `📊 <strong>Tổng in: ${targetTotal} thẻ (${sheets} tờ A4 • ${cfg.name})</strong> = <strong>${namedCount} thẻ Đã Có Tên</strong> + <strong>${remainder} thẻ QR Đánh Số (từ <code>#${String(firstRemSlot).padStart(2, "0")}</code> → <code>#${String(lastRemSlot).padStart(2, "0")}</code>)</strong>`
            : `📊 <strong>Tổng in: ${targetTotal} thẻ (${sheets} tờ A4 • ${cfg.name})</strong> = <strong>${namedCount} thẻ Đã Có Tên</strong> (Đã đủ số lượng, không cần bù thêm)`;
      } else {
        qrBatchLiveSummary.innerHTML = `📊 <strong>Tổng in: ${targetTotal} thẻ (${sheets} tờ A4 • ${cfg.name})</strong> = <strong>${namedCount} thẻ Đã Có Tên</strong> + <strong>${remainder} thẻ QR Chung</strong>`;
      }
    }
    if (btnPrintMixedA4) {
      btnPrintMixedA4.textContent =
        fillMode === "numbered" && remainder > 0
          ? `🖨️ Xuất Đủ ${targetTotal} Thẻ Ra ${sheets} Tờ A4 (${namedCount} Có Tên + ${remainder} QR Đánh Số #${String(firstRemSlot).padStart(2, "0")}→#${String(lastRemSlot).padStart(2, "0")})`
          : `🖨️ Xuất Đủ ${targetTotal} Thẻ Ra ${sheets} Tờ A4 (${namedCount} Có Tên + ${remainder} QR Chung)`;
    }
    if (btnPrintQrSheet) {
      btnPrintQrSheet.textContent = `🖨️ Xuất Tờ A4 Theo Đúng Cấu Hình Đang Xem (${cfg.shortName} / Tờ A4)`;
    }
    const batchTitleSync = document.getElementById("qr-batch-title-sync");
    if (batchTitleSync) {
      batchTitleSync.textContent = `✨ In Gộp Đủ ${targetTotal} Chiếc (${sheets} Tờ A4): Ghép "Khách Đã Có Tên" + "QR Đánh Số"`;
    }
    const batchDescSync = document.getElementById("qr-batch-desc-sync");
    if (batchDescSync) {
      batchDescSync.innerHTML =
        remainder > 0
          ? `Điền danh sách khách <strong>đã có tên</strong> bên dưới. Hệ thống in <strong>${namedCount} khách</strong> trước rồi tự bù <strong>${remainder} Bookmark QR Đánh Số</strong> cho đủ <strong>${targetTotal} thẻ (${sheets} tờ A4 · ${cfg.itemsPerSheet} thẻ/tờ)</strong>.`
          : `Đang in đủ <strong>${namedCount} thẻ có tên</strong> trên <strong>${sheets} tờ A4</strong> (${cfg.itemsPerSheet} thẻ/tờ).`;
    }
    document.querySelectorAll(".js-batch-total-preset").forEach((btn) => {
      const t = parseInt(btn.getAttribute("data-total") || "414", 10) || 414;
      const s = Math.ceil(t / cfg.itemsPerSheet);
      btn.textContent = `${t} cái (${s} tờ A4)`;
    });
    document.querySelectorAll(".js-slot-quick-range").forEach((btn) => {
      const sheetsMult = parseInt(btn.getAttribute("data-sheets") || "0", 10);
      if (sheetsMult > 0) {
        btn.textContent = `${sheetsMult} tờ A4 (${sheetsMult * cfg.itemsPerSheet} chiếc)`;
      } else {
        const rawC = parseInt(btn.getAttribute("data-count") || "414", 10) || 414;
        btn.textContent = `Toàn bộ (${rawC} chiếc · ${Math.ceil(rawC / cfg.itemsPerSheet)} tờ)`;
      }
    });
    const mapBackSyncInfo = document.getElementById("map-back-sync-info");
    if (mapBackSyncInfo) {
      const sizeNote =
        cfg.cellWmm >= 85
          ? "Cỡ rộng đọc bản đồ rất rõ nét."
          : cfg.cellWmm >= 58
            ? "Mẹo: muốn chữ bản đồ to rõ nhất cho khách lớn tuổi, bạn có thể chọn kiểu 9×9cm (6 thẻ/tờ A4)."
            : "Lưu ý: khổ thẻ nhỏ nên cân nhắc chọn 6×6cm hoặc 9×9cm để tên đường dễ đọc.";
      mapBackSyncInfo.innerHTML =
        `Đang khóa khớp lưới đối xứng tâm A4: <strong>${cfg.shortName} (${cfg.cols}×${cfg.rows} ô · Lề ${cfg.marginXmm}mm / ${cfg.marginYmm}mm)</strong>. Phủ tràn nền kem + vùng an toàn <strong>${cfg.safePadMm}mm</strong> mỗi ô để máy in lệch 1-2mm cắt vẫn không phạm chữ. ${sizeNote}`;
    }
    const btnPrintMapBackEl = document.getElementById("btn-print-map-back");
    if (btnPrintMapBackEl) {
      btnPrintMapBackEl.textContent = `🗺️ Xuất Tờ A4 Mặt Sau - Bản Đồ (${cfg.shortName})`;
    }
  }

  if (qrBatchGuests && !qrBatchGuests.value.trim() && Array.isArray(savedGuests) && savedGuests.length > 0) {
    qrBatchGuests.value = savedGuests.map((g) => g.name).filter(Boolean).join("\n");
  }
  updateBatchLiveSummary();

  if (qrBatchGuests) qrBatchGuests.addEventListener("input", updateBatchLiveSummary);
  if (qrBatchGenericCount) qrBatchGenericCount.addEventListener("input", updateBatchLiveSummary);
  if (qrBatchSlotStart) qrBatchSlotStart.addEventListener("input", updateBatchLiveSummary);
  if (qrBatchFillMode) qrBatchFillMode.addEventListener("change", updateBatchLiveSummary);

  document.querySelectorAll(".js-batch-total-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      const total = parseInt(btn.getAttribute("data-total") || "414", 10) || 414;
      if (qrBatchGenericCount) qrBatchGenericCount.value = String(total);
      updateBatchLiveSummary();
    });
  });

  if (btnFillSavedGuestsQr) {
    btnFillSavedGuestsQr.addEventListener("click", () => {
      if (!savedGuests || savedGuests.length === 0) {
        notify("⚠️ Danh sách khách mời đang trống. Bạn có thể tự gõ tên vào ô nhé!");
        return;
      }
      const lines = savedGuests.map((g) => g.name).filter(Boolean);
      if (qrBatchGuests) qrBatchGuests.value = lines.join("\n");
      updateBatchLiveSummary();
      notify(`📥 Đã điền ${lines.length} khách từ Danh Sách Khách Mời!`);
    });
  }

  if (btnPrintMixedA4) {
    btnPrintMixedA4.addEventListener("click", () => {
      const layoutMode = (qrLayoutStyle && qrLayoutStyle.value) || "square_qr";
      const cfg = getLayoutSheetConfig(layoutMode);
      const isSquareQr = layoutMode.startsWith("square_qr");
      const isPinterestStrip = layoutMode === "pinterest_strip";
      const capMode = (qrCaptionStyle && qrCaptionStyle.value) || "bilingual";
      const namePosMode = (qrBatchNamePos && qrBatchNamePos.value) || "flap_only";
      const presetVal = (qrPresetSelect && qrPresetSelect.value) || "directions";
      const fillMode = (qrBatchFillMode && qrBatchFillMode.value) || "numbered";
      const startSlot = Math.max(
        1,
        parseInt((qrBatchSlotStart && qrBatchSlotStart.value) || "1", 10) || 1
      );
      const flapStyleEl = document.getElementById("slot-flap-center-style");
      const flapCenterMode = (flapStyleEl && flapStyleEl.value) || "xi_emblem";

      const personalNames = getBatchNamedList();
      const targetTotal = Math.max(
        personalNames.length,
        parseInt((qrBatchGenericCount && qrBatchGenericCount.value) || "414", 10) || 414
      );
      const remainderCount = Math.max(0, targetTotal - personalNames.length);

      if (personalNames.length === 0 && remainderCount === 0) {
        notify("⚠️ Hãy nhập tổng số lượng thẻ QR muốn in!");
        return;
      }

      const win = window.open("", "_blank");
      if (!win) {
        notify("⚠️ Trình duyệt chặn cửa sổ bật lên. Hãy cho phép Popup để mở trang in A4 nhé!");
        return;
      }

      win.document.write(
        `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Đang dàn trang ${targetTotal} Thẻ QR...</title></head><body style="font-family:sans-serif;padding:40px;text-align:center;background:#f4efe6;color:#5a1818;"><h2>⏳ Đang tạo ${targetTotal} Thẻ QR độ nét cao 1.060 DPI (${Math.ceil(targetTotal / cfg.itemsPerSheet)} tờ A4 • ${cfg.name})...</h2><p>Chỉ mất khoảng 1 giây, vui lòng đợi xíu nhé!</p></body></html>`
      );

      setTimeout(() => {
        const cells = [];

        // 1. Render Personalized QR cards for each named guest (cái nào có tên thì hiện tên, không hiện số)
        ensureGuestSlotsNormalized();
        const usedSlotNums = getAllUsedSlotNums();
        let manualSlotCursor = 1;
        personalNames.forEach((gName) => {
          const hasCjk = /[\u4e00-\u9fff]/.test(gName);
          const matchedG = savedGuests.find(
            (g) => g && normalizeNameKey(g.name) === normalizeNameKey(gName)
          );
          let slotNum = matchedG && Number(matchedG.slot);
          if (!slotNum) {
            while (usedSlotNums.has(manualSlotCursor)) manualSlotCursor++;
            slotNum = manualSlotCursor;
            manualSlotCursor++;
          }
          usedSlotNums.add(slotNum);
          const gUrl = getSlotUrl(slotNum);

          renderLuxuryWeddingQR(true, {
            layoutMode,
            targetUrl: gUrl,
            capMode: hasCjk ? "zh" : capMode,
            guestText: gName,
            namePosMode,
            slotNum
          });
          const dUrl = (isPinterestStrip || isSquareQr)
            ? qrCanvas.toDataURL("image/jpeg", 0.95)
            : qrCanvas.toDataURL("image/png");
          const safeAltName = String(gName).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
          cells.push(
            `<div class="sticker-cell"><img src="${dUrl}" alt="Thẻ QR ${safeAltName}" /></div>`
          );
        });

        // 2. Fill the remaining slots up to targetTotal (e.g. 414) without duplicate slot numbers
        let firstRemSlot = startSlot;
        let lastRemSlot = startSlot;
        if (remainderCount > 0) {
          if (fillMode === "numbered") {
            let curSlot = startSlot > 1 && !usedSlotNums.has(startSlot) ? startSlot : 1;
            const remainingSlots = [];
            while (remainingSlots.length < remainderCount) {
              if (!usedSlotNums.has(curSlot)) {
                remainingSlots.push(curSlot);
              }
              curSlot++;
            }
            firstRemSlot = remainingSlots[0] || startSlot;
            lastRemSlot = remainingSlots[remainingSlots.length - 1] || startSlot;

            remainingSlots.forEach((n) => {
              const sUrl = getSlotUrl(n);
              renderLuxuryWeddingQR(true, {
                layoutMode,
                targetUrl: sUrl,
                capMode,
                guestText: "",
                slotNum: n,
                flapCenterMode
              });
              const dUrl = (isPinterestStrip || isSquareQr)
                ? qrCanvas.toDataURL("image/jpeg", 0.95)
                : qrCanvas.toDataURL("image/png");
              cells.push(
                `<div class="sticker-cell"><img src="${dUrl}" alt="Thẻ QR Số ${n}" /></div>`
              );
            });
            if (lastRemSlot > slotMaxPrinted) {
              slotMaxPrinted = lastRemSlot;
              try {
                localStorage.setItem(STORAGE_SLOT_MAX_PRINTED, String(slotMaxPrinted));
              } catch (_) {}
            }
            if (typeof renderSlotsTable === "function") renderSlotsTable();
          } else {
            const genericUrl =
              (qrUrlInput && qrUrlInput.value.trim()) ||
              "https://thuantuongtieudinh.io.vn/?mode=directions";
            renderLuxuryWeddingQR(true, {
              layoutMode,
              targetUrl: genericUrl,
              capMode,
              guestText: "",
              namePosMode
            });
            const genericDataUrl = (isPinterestStrip || isSquareQr)
              ? qrCanvas.toDataURL("image/jpeg", 0.95)
              : qrCanvas.toDataURL("image/png");
            for (let i = 0; i < remainderCount; i++) {
              cells.push(
                `<div class="sticker-cell"><img src="${genericDataUrl}" alt="Thẻ QR Chung" /></div>`
              );
            }
          }
        }

        // Restore normal preview on screen
        renderLuxuryWeddingQR(false);

        const totalCount = cells.length;
        const sheetsCells = [];
        for (let i = 0; i < totalCount; i += cfg.itemsPerSheet) {
          sheetsCells.push(cells.slice(i, i + cfg.itemsPerSheet));
        }

        const remainderDesc =
          fillMode === "numbered" && remainderCount > 0
            ? `${remainderCount} QR Đánh Số (#${String(firstRemSlot).padStart(2, "0")} → #${String(lastRemSlot).padStart(2, "0")})`
            : `${remainderCount} QR Chung`;

        win.document.open();
        win.document.write(
          buildDuplexFrontQrHtml({
            title: `In Tờ A4 Gộp (${personalNames.length} Có Tên + ${remainderDesc} = ${totalCount} Thẻ) - Thuận Tường & Tiểu Dinh`,
            toolbarTitle: `🖨️ Mặt 1 (QR): ${personalNames.length} Có Tên + ${remainderDesc} = Tổng ${totalCount} thẻ (${sheetsCells.length} tờ A4 • ${cfg.name})`,
            toolbarDesc: `• Khách đã có tên xếp ở các ô đầu, tiếp nối liền mạch bởi <strong>${remainderDesc}</strong> không trùng số.`,
            sheetsCells,
            cfg,
            isSquareQr,
            isPinterestStrip
          })
        );
        win.document.close();
      }, 50);
    });
  }

  if (btnDownloadQr) {
    btnDownloadQr.addEventListener("click", () => {
      renderLuxuryWeddingQR(false);
      const dataUrl = qrCanvas.toDataURL("image/png");
      const guestSlug = (qrGuestBadge && qrGuestBadge.value.trim())
        ? "-" + qrGuestBadge.value.trim().replace(/\s+/g, "-")
        : "";
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `The-Phu-QR-Tuong-Dinh${guestSlug}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      notify("⬇️ Đã tải file ảnh Thẻ Phụ QR (.PNG sắc nét)!");
    });
  }

  if (btnPrintQrSheet) {
    btnPrintQrSheet.addEventListener("click", () => {
      renderLuxuryWeddingQR(true);
      const layoutMode = (qrLayoutStyle && qrLayoutStyle.value) || "square_qr";
      const cfg = getLayoutSheetConfig(layoutMode);
      const isSquareQr = layoutMode.startsWith("square_qr");
      const isPinterestStrip = layoutMode === "pinterest_strip";
      const printDataUrl = (isPinterestStrip || isSquareQr)
        ? qrCanvas.toDataURL("image/jpeg", 0.95)
        : qrCanvas.toDataURL("image/png");
      renderLuxuryWeddingQR(false);

      const totalItems = cfg.itemsPerSheet;

      const win = window.open("", "_blank");
      if (!win) {
        notify("⚠️ Trình duyệt chặn cửa sổ bật lên. Hãy cho phép Popup để mở trang in A4 nhé!");
        return;
      }
      const cells = [];
      for (let i = 0; i < totalItems; i++) {
        cells.push(`<div class="sticker-cell"><img src="${printDataUrl}" alt="Thẻ Phụ QR Thiệp Cưới" /></div>`);
      }
      win.document.open();
      win.document.write(
        buildDuplexFrontQrHtml({
          title: `In Tờ A4 (${totalItems} ${cfg.name}) - Thuận Tường & Tiểu Dinh`,
          toolbarTitle: `🖨️ Mặt 1 (QR): ${totalItems} Thẻ (${cfg.name})`,
          toolbarDesc: "• Đã căn giữa tuyệt đối theo tâm tờ A4 để in mặt 2 Bản Đồ khớp 100%.",
          sheetsCells: [cells],
          cfg,
          isSquareQr,
          isPinterestStrip
        })
      );
      win.document.close();
    });
  }

  const btnPrintMapBack = document.getElementById("btn-print-map-back");
  if (btnPrintMapBack) {
    btnPrintMapBack.addEventListener("click", () => {
      const layoutMode = (qrLayoutStyle && qrLayoutStyle.value) || "square_qr";
      openBacksideMapPrintWindow({ layoutMode, pageCount: 1 });
    });
  }

  const btnPrintDuplexTest = document.getElementById("btn-print-duplex-test");
  if (btnPrintDuplexTest) {
    btnPrintDuplexTest.addEventListener("click", () => {
      const layoutMode = (qrLayoutStyle && qrLayoutStyle.value) || "square_qr";
      const isSquareQr = layoutMode.startsWith("square_qr");
      const isPinterestStrip = layoutMode === "pinterest_strip";
      const assigned1 = getSlotGuestRecord(1);
      renderLuxuryWeddingQR(true, {
        layoutMode,
        targetUrl: getSlotUrl(1),
        guestText: assigned1 ? assigned1.name : "",
        capMode:
          assigned1 && /[\u4e00-\u9fff]/.test(assigned1.name)
            ? "zh"
            : (qrCaptionStyle && qrCaptionStyle.value) || "bilingual",
        slotNum: 1
      });
      const sampleQrUrl = (isPinterestStrip || isSquareQr)
        ? qrCanvas.toDataURL("image/jpeg", 0.95)
        : qrCanvas.toDataURL("image/png");
      renderLuxuryWeddingQR(false);
      openBacksideMapPrintWindow({
        layoutMode,
        pageCount: 1,
        testPairQrDataUrl: sampleQrUrl
      });
    });
  }

  // =======================================================================
  // NUMBERED QR BOOKMARKS (PRINT FIRST, ASSIGN GUEST NAME LATER)
  // =======================================================================
  const STORAGE_SAVED_SLOTS = "td_saved_slots_v1";
  const badgeSlotsEl = document.getElementById("badge-slots-count");
  const slotPrintFromInput = document.getElementById("slot-print-from");
  const slotPrintToInput = document.getElementById("slot-print-to");
  const btnPrintSlots = document.getElementById("btn-print-slots");

  // Deterministic 4-char alphanumeric code for slot number N (e.g. 1 -> "1-k3x9")
  function makeSlotCode(num) {
    const n = Math.max(1, Math.min(9999, parseInt(num, 10) || 1));
    let h = (n * 2654435761) ^ 0x5a3c9e17;
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const unsigned = (h ^ (h >>> 16)) >>> 0;
    const hash4 = unsigned.toString(36).padStart(4, "0").slice(0, 4).toLowerCase();
    return `${n}-${hash4}`;
  }

  try {
    const rawSlots = localStorage.getItem(STORAGE_SAVED_SLOTS);
    if (rawSlots) {
      const parsedSlots = JSON.parse(rawSlots);
      if (parsedSlots && typeof parsedSlots === "object") {
        serverSlots = parsedSlots;
      }
    }
  } catch (_) {}

  function persistLocalSlots() {
    try {
      localStorage.setItem(STORAGE_SAVED_SLOTS, JSON.stringify(serverSlots));
      localStorage.setItem(STORAGE_SLOT_MAX_PRINTED, String(slotMaxPrinted));
    } catch (_) {}
  }

  function mergeServerSlots(remoteSlots) {
    if (!remoteSlots || typeof remoteSlots !== "object") return;
    const merged = { ...serverSlots };
    Object.keys(remoteSlots).forEach((code) => {
      const r = remoteSlots[code];
      if (r) {
        const loc = serverSlots[code] || {};
        const mergedTable =
          r.table !== undefined && r.table !== ""
            ? String(r.table)
            : loc.table !== undefined && loc.table !== ""
              ? String(loc.table)
              : "";
        const mergedGroup =
          r.group !== undefined && r.group !== ""
            ? String(r.group)
            : loc.group !== undefined && loc.group !== ""
              ? String(loc.group)
              : "";
        const mergedPax =
          r.pax && Number(r.pax) >= 1
            ? Number(r.pax)
            : loc.pax && Number(loc.pax) >= 1
              ? Number(loc.pax)
              : 1;
        const mergedName =
          r.name !== undefined && r.name !== ""
            ? r.name
            : loc.name || "";
        const mergedMode = r.mode || loc.mode || "invite";
        const mergedMorning = normalizeMorningMode(
          r.morning !== undefined ? r.morning : loc.morning
        );

        merged[code] = {
          ...loc,
          ...r,
          name: mergedName,
          mode: mergedMode,
          morning: mergedMorning,
          table: mergedTable,
          group: mergedGroup,
          pax: mergedPax
        };
        const n = parseInt(r.num, 10) || parseInt(code.split("-")[0], 10) || 0;
        if (n > slotMaxPrinted) slotMaxPrinted = n;
      }
    });
    serverSlots = merged;
    ensureGuestSlotsNormalized();
    persistLocalSlots();
    const batchTa = document.getElementById("qr-batch-guests");
    if (batchTa && !batchTa.value.trim()) {
      const slotNamesMap = new Map();
      (Array.isArray(savedGuests) ? savedGuests : []).forEach((g) => {
        if (g && g.name && String(g.name).trim()) {
          slotNamesMap.set(normalizeNameKey(g.name), String(g.name).trim());
        }
      });
      Object.values(serverSlots || {})
        .filter((s) => s && s.name && String(s.name).trim())
        .sort((a, b) => (Number(a.num) || 9999) - (Number(b.num) || 9999))
        .forEach((s) => {
          const clean = String(s.name).trim();
          const k = normalizeNameKey(clean);
          if (!slotNamesMap.has(k)) slotNamesMap.set(k, clean);
        });
      if (slotNamesMap.size > 0) {
        batchTa.value = Array.from(slotNamesMap.values()).join("\n");
        if (typeof updateBatchLiveSummary === "function") updateBatchLiveSummary();
      }
    }
  }

  // Advance default print range if already printed earlier
  if (slotMaxPrinted > 0 && slotPrintFromInput && slotPrintToInput) {
    const nextStart = slotMaxPrinted + 1;
    const defaultCfg = getLayoutSheetConfig((qrLayoutStyle && qrLayoutStyle.value) || "square_qr");
    slotPrintFromInput.value = String(nextStart);
    slotPrintToInput.value = String(nextStart + defaultCfg.itemsPerSheet - 1);
  }

  function getSlotGuestRecord(num) {
    const n = Number(num);
    if (!n || n < 1) return null;
    const code = makeSlotCode(n);
    const slotObj = serverSlots && serverSlots[code];
    if (slotObj && slotObj.name && String(slotObj.name).trim()) {
      return {
        name: String(slotObj.name).trim(),
        lang: slotObj.lang || (/[\u4e00-\u9fff]/.test(slotObj.name) ? "zh" : "vi")
      };
    }
    const guestObj = Array.isArray(savedGuests)
      ? savedGuests.find((g) => g && Number(g.slot) === n && g.name && String(g.name).trim())
      : null;
    if (guestObj) {
      return {
        name: String(guestObj.name).trim(),
        lang: guestObj.lang || (/[\u4e00-\u9fff]/.test(guestObj.name) ? "zh" : "vi")
      };
    }
    return null;
  }

  function getAllUsedSlotNums() {
    const used = new Set();
    if (Array.isArray(savedGuests)) {
      savedGuests.forEach((g) => {
        if (g && g.slot && g.name && String(g.name).trim()) {
          used.add(Number(g.slot));
        }
      });
    }
    Object.keys(serverSlots || {}).forEach((code) => {
      const s = serverSlots[code];
      if (s && s.name && String(s.name).trim()) {
        const sn = Number(s.num || parseInt(code.split("-")[0], 10));
        if (sn >= 1) used.add(sn);
      }
    });
    return used;
  }

  function getSlotUrl(num) {
    const code = makeSlotCode(num);
    const base = baseOrigin.replace(/\?.*$/, "");
    return `${base}?s=${encodeURIComponent(code)}`;
  }

  async function setSlotSeat(num, nextGroup, nextTable, nextPax, showToast = true, options = {}) {
    const n = parseInt(num, 10);
    if (!n || n < 1 || n > 9999) return false;
    const code = makeSlotCode(n);
    const prev = serverSlots[code] || {};
    const assignedName = prev.name ? String(prev.name).trim() : "";
    const lang = prev.lang || (/[\u4e00-\u9fff]/.test(assignedName) ? "zh" : "vi");
    const cleanPax = Math.max(1, Math.min(20, parseInt(nextPax || "1", 10) || 1));
    const cleanTable = String(nextTable || "");
    const tMeta = (cleanTable && seatingConfig.tableMeta && seatingConfig.tableMeta[cleanTable]) || {};
    const explicitGroup = options && options.source === "group";
    const effectiveGroup = explicitGroup
      ? String(nextGroup || "").trim()
      : String(nextGroup || "").trim() || tMeta.group || "";

    const prevSaved = savedGuests.map((g) => ({ ...g }));
    const prevSlotsSnap = {};
    Object.keys(serverSlots).forEach((k) => {
      prevSlotsSnap[k] = { ...serverSlots[k] };
    });

    serverSlots[code] = {
      num: n,
      name: assignedName,
      lang,
      mode: prev.mode || "invite",
      morning: normalizeMorningMode(prev.morning),
      group: effectiveGroup,
      table: cleanTable,
      pax: cleanPax,
      assignedAt: prev.assignedAt || new Date().toISOString()
    };

    if (assignedName) {
      const pk = normalizeNameKey(assignedName);
      let guestFound = false;
      savedGuests = savedGuests.map((g) => {
        if (normalizeNameKey(g.name) === pk) {
          guestFound = true;
          return { ...g, group: effectiveGroup, table: cleanTable, pax: cleanPax, slot: n, slotCode: code };
        }
        return g;
      });
      if (!guestFound) {
        savedGuests.push({
          name: assignedName,
          lang,
          mode: prev.mode || "invite",
          group: effectiveGroup,
          table: cleanTable,
          pax: cleanPax,
          slot: n,
          slotCode: code,
          createdAt: new Date().toISOString()
        });
      }
      persistLocalGuests();
      buildRows();
    }

    persistLocalSlots();
    renderSlotsTable();
    if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();

    const apiRes = await adminApiFetch("/api/slots", {
      method: "POST",
      body: {
        action: "set_seat",
        code,
        group: effectiveGroup,
        table: cleanTable,
        pax: cleanPax
      }
    });
    if (!apiRes.ok) {
      savedGuests = prevSaved;
      serverSlots = prevSlotsSnap;
      persistLocalSlots();
      persistLocalGuests();
      renderSlotsTable();
      buildRows();
      if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
      notify(`⚠️ Chưa lưu được xếp bàn QR Số ${n} (${apiRes.error}).`);
      return false;
    }

    const data = apiRes.data;
    if (data && data.slots) mergeServerSlots(data.slots);
    if (data && Array.isArray(data.savedGuests)) mergeServerGuests(data.savedGuests);
    renderSlotsTable();
    buildRows();
    if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();

    if (showToast) {
      const displayName = assignedName || `QR #${String(n).padStart(2, "0")}`;
      const cap = seatingConfig.seatsPerTable || 10;
      const occAfter = cleanTable ? computeTableStats().occ : {};
      const usedAfter = cleanTable ? occAfter[cleanTable] || 0 : 0;
      if (cleanTable && usedAfter > cap) {
        notify(
          `⚠️ Đã xếp "${displayName}" vào Bàn ${String(cleanTable).padStart(2, "0")} — lưu ý bàn hiện có ${usedAfter}/${cap} ghế (vượt ${usedAfter - cap} ghế)!`
        );
      } else {
        notify(
          cleanTable
            ? `🪑 Đã xếp "${displayName}" vào Bàn ${String(cleanTable).padStart(2, "0")} (${cleanPax} ghế)!`
            : `🪑 Đã gỡ "${displayName}" khỏi bàn tiệc!`
        );
      }
    }
    return true;
  }

  async function setSlotMode(num, nextMode) {
    const n = parseInt(num, 10);
    if (!n || n < 1 || n > 9999) return false;
    if (
      nextMode === "thankyou" &&
      isPlaceholderDriveUrl((globalDriveInput && globalDriveInput.value.trim()) || globalSiteConfig.driveUrl)
    ) {
      notify("⚠️ Link Google Drive vẫn là link mẫu, hãy xóa hoặc dán link thật trước khi bật Cảm Ơn!");
      return false;
    }
    const code = makeSlotCode(n);
    const prev = serverSlots[code] || {};
    const assignedName = prev.name ? String(prev.name).trim() : "";
    const lang = prev.lang || (/[\u4e00-\u9fff]/.test(assignedName) ? "zh" : "vi");

    const prevSaved = savedGuests.map((g) => ({ ...g }));
    const prevSlotsSnap = {};
    Object.keys(serverSlots).forEach((k) => {
      prevSlotsSnap[k] = { ...serverSlots[k] };
    });

    serverSlots[code] = {
      num: n,
      name: assignedName,
      lang,
      mode: nextMode,
      morning: normalizeMorningMode(prev.morning),
      group: prev.group || "",
      table: prev.table || "",
      pax: prev.pax || 1,
      assignedAt: prev.assignedAt || new Date().toISOString()
    };

    if (assignedName) {
      const pk = normalizeNameKey(assignedName);
      savedGuests = savedGuests.map((g) => {
        if (normalizeNameKey(g.name) === pk) {
          return { ...g, mode: nextMode, slot: n, slotCode: code };
        }
        return g;
      });
      persistLocalGuests();
      buildRows();
    }

    persistLocalSlots();
    renderSlotsTable();

    const apiRes = await adminApiFetch("/api/slots", {
      method: "POST",
      body: {
        action: "set_mode",
        code,
        mode: nextMode
      }
    });
    if (!apiRes.ok) {
      savedGuests = prevSaved;
      serverSlots = prevSlotsSnap;
      persistLocalSlots();
      persistLocalGuests();
      renderSlotsTable();
      buildRows();
      notify(`⚠️ Chưa đổi được chế độ cho QR Số ${n} (${apiRes.error}).`);
      return false;
    }

    const data = apiRes.data;
    if (data && data.slots) mergeServerSlots(data.slots);
    if (data && Array.isArray(data.savedGuests)) mergeServerGuests(data.savedGuests);
    renderSlotsTable();
    buildRows();

    const targetLabel = assignedName ? `QR Số ${n} (${assignedName})` : `QR Số ${n}`;
    notify(
      nextMode === "thankyou"
        ? `📸 Đã bật "Thiệp Cảm Ơn" cho ${targetLabel}!`
        : nextMode === "directions"
          ? `📍 Đã bật "Chỉ Đường Ngày Cưới" cho ${targetLabel}!`
          : `💌 Đã chuyển ${targetLabel} về chế độ Thiệp Mời!`
    );
    return true;
  }

  async function setSlotMorning(num, nextMorningRaw) {
    const n = parseInt(num, 10);
    if (!n || n < 1 || n > 9999) return false;
    const code = makeSlotCode(n);
    const prev = serverSlots[code] || {};
    const assignedName = prev.name ? String(prev.name).trim() : "";
    const lang = prev.lang || (/[\u4e00-\u9fff]/.test(assignedName) ? "zh" : "vi");
    const nextMorning = normalizeMorningMode(nextMorningRaw);

    const prevSaved = savedGuests.map((g) => ({ ...g }));
    const prevSlotsSnap = {};
    Object.keys(serverSlots).forEach((k) => {
      prevSlotsSnap[k] = { ...serverSlots[k] };
    });

    serverSlots[code] = {
      num: n,
      name: assignedName,
      lang,
      mode: prev.mode || "invite",
      morning: nextMorning,
      group: prev.group || "",
      table: prev.table || "",
      pax: prev.pax || 1,
      assignedAt: prev.assignedAt || new Date().toISOString()
    };

    if (assignedName) {
      const pk = normalizeNameKey(assignedName);
      savedGuests = savedGuests.map((g) => {
        if (normalizeNameKey(g.name) === pk) {
          return { ...g, morning: nextMorning, slot: n, slotCode: code };
        }
        return g;
      });
      persistLocalGuests();
      buildRows();
    }

    persistLocalSlots();
    renderSlotsTable();

    const apiRes = await adminApiFetch("/api/slots", {
      method: "POST",
      body: {
        action: "set_morning",
        code,
        morning: nextMorning
      }
    });
    if (!apiRes.ok) {
      savedGuests = prevSaved;
      serverSlots = prevSlotsSnap;
      persistLocalSlots();
      persistLocalGuests();
      renderSlotsTable();
      buildRows();
      notify(`⚠️ Chưa lưu được chế độ Lễ Sáng QR Số ${n} (${apiRes.error}).`);
      return false;
    }

    const data = apiRes.data;
    if (data && data.slots) mergeServerSlots(data.slots);
    if (data && Array.isArray(data.savedGuests)) mergeServerGuests(data.savedGuests);
    renderSlotsTable();
    buildRows();

    const targetLabel = assignedName ? `QR Số ${n} (${assignedName})` : `QR Số ${n}`;
    notify(
      nextMorning === "groom"
        ? `🏠 Đã bật mời "Lễ Sáng Nhà Trai (05:30) + Tiệc Tối" cho ${targetLabel}!`
        : nextMorning === "bride"
          ? `🏡 Đã bật mời "Lễ Sáng Nhà Gái (06:00) + Tiệc Tối" cho ${targetLabel}!`
          : nextMorning === "both"
            ? `🌅 Đã bật mời "Lễ Sáng (05:30) + Tiệc Tối" cho ${targetLabel}!`
            : `🌙 Đã chuyển ${targetLabel} về Chỉ Tiệc Tối (18:00)!`
    );
    return true;
  }

  async function assignSlotByNumber(num, rawName, rawNote, showToast = true) {
    const n = parseInt(num, 10);
    if (!n || n < 1 || n > 9999) {
      notify("⚠️ Số QR không hợp lệ (hãy nhập từ 1 đến 9999).");
      return false;
    }
    const code = makeSlotCode(n);
    const name = String(rawName || "").trim();
    const note = String(rawNote || "").trim();
    const prevSlot = serverSlots[code];
    const prevSaved = savedGuests.map((g) => ({ ...g }));
    const prevSlotsSnap = {};
    Object.keys(serverSlots).forEach((k) => {
      prevSlotsSnap[k] = { ...serverSlots[k] };
    });

    if (!name) {
      if (prevSlot && prevSlot.name) {
        const pk = normalizeNameKey(prevSlot.name);
        savedGuests = savedGuests.map((g) => {
          if (normalizeNameKey(g.name) === pk && g.slotCode === code) {
            const copy = { ...g };
            delete copy.slot;
            delete copy.slotCode;
            return copy;
          }
          return g;
        });
      }
      if (prevSlot && prevSlot.mode && prevSlot.mode !== "invite") {
        serverSlots[code] = {
          num: n,
          name: "",
          lang: "vi",
          mode: prevSlot.mode,
          assignedAt: prevSlot.assignedAt || new Date().toISOString()
        };
      } else {
        delete serverSlots[code];
      }
      persistLocalSlots();
      persistLocalGuests();
      renderSlotsTable();
      buildRows();
      if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
      const clrRes = await adminApiFetch("/api/slots", {
        method: "POST",
        body: { action: "clear", code }
      });
      if (!clrRes.ok) {
        savedGuests = prevSaved;
        serverSlots = prevSlotsSnap;
        persistLocalSlots();
        persistLocalGuests();
        renderSlotsTable();
        buildRows();
        if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
        notify(`⚠️ Chưa xóa được tên khỏi QR Số ${n} (${clrRes.error}).`);
        return false;
      }
      if (showToast) notify(`🗑️ Đã xóa tên khách khỏi QR Số ${n}.`);
      return true;
    }

    if (n > slotMaxPrinted) slotMaxPrinted = n;
    const hasHanzi = /[\u4e00-\u9fff]/.test(name);
    const lang = hasHanzi ? "zh" : "vi";

    if (prevSlot && prevSlot.name && normalizeNameKey(prevSlot.name) !== normalizeNameKey(name)) {
      const pk = normalizeNameKey(prevSlot.name);
      savedGuests = savedGuests.map((g) => {
        if (normalizeNameKey(g.name) === pk && g.slotCode === code) {
          const copy = { ...g };
          delete copy.slot;
          delete copy.slotCode;
          return copy;
        }
        return g;
      });
    }

    const key = normalizeNameKey(name);
    if (note) guestNotesMap[key] = note;
    const existingIdx = savedGuests.findIndex((g) => normalizeNameKey(g.name) === key);
    const finalNote = note || (existingIdx >= 0 ? savedGuests[existingIdx].note : "") || guestNotesMap[key] || "";
    const preservedMode =
      (prevSlot && prevSlot.mode) ||
      (existingIdx >= 0 && savedGuests[existingIdx].mode) ||
      "invite";
    const preservedMorning = normalizeMorningMode(
      (prevSlot && prevSlot.morning) ||
      (existingIdx >= 0 && savedGuests[existingIdx].morning) ||
      ""
    );
    const preservedGroup =
      (prevSlot && prevSlot.group) ||
      (existingIdx >= 0 && savedGuests[existingIdx].group) ||
      "";
    const preservedTable =
      (prevSlot && prevSlot.table) ||
      (existingIdx >= 0 && savedGuests[existingIdx].table) ||
      "";
    const preservedPax =
      (prevSlot && prevSlot.pax) ||
      (existingIdx >= 0 && savedGuests[existingIdx].pax) ||
      1;
    serverSlots[code] = {
      num: n,
      name,
      lang,
      mode: preservedMode,
      morning: preservedMorning,
      group: preservedGroup,
      table: preservedTable,
      pax: preservedPax,
      assignedAt: new Date().toISOString()
    };
    const guestRecord = {
      name,
      lang,
      mode: preservedMode,
      morning: preservedMorning,
      driveUrl: existingIdx >= 0 && savedGuests[existingIdx].driveUrl ? savedGuests[existingIdx].driveUrl : "",
      note: finalNote,
      group: preservedGroup,
      table: preservedTable,
      pax: preservedPax,
      slot: n,
      slotCode: code,
      createdAt:
        existingIdx >= 0 && savedGuests[existingIdx].createdAt
          ? savedGuests[existingIdx].createdAt
          : new Date().toISOString()
    };
    if (existingIdx >= 0) {
      savedGuests[existingIdx] = guestRecord;
    } else {
      savedGuests.push(guestRecord);
    }

    persistLocalSlots();
    persistLocalGuests();
    renderSlotsTable();
    buildRows();
    if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();

    const apiRes = await adminApiFetch("/api/slots", {
      method: "POST",
      body: {
        action: "assign",
        code,
        name,
        note: finalNote,
        lang,
        mode: preservedMode,
        morning: preservedMorning
      }
    });
    if (!apiRes.ok) {
      savedGuests = prevSaved;
      serverSlots = prevSlotsSnap;
      persistLocalSlots();
      persistLocalGuests();
      renderSlotsTable();
      buildRows();
      if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
      notify(`⚠️ Chưa lưu được gán QR Số ${n} (${apiRes.error}).`);
      return false;
    }

    const data = apiRes.data;
    if (data && data.slots) mergeServerSlots(data.slots);
    if (data && Array.isArray(data.savedGuests)) mergeServerGuests(data.savedGuests);
    renderSlotsTable();
    buildRows();
    if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();

    if (showToast) {
      notify(`✅ Đã gán QR Số ${n} cho khách "${name}"!`);
    }
    return true;
  }

  function renderSlotsTable() {
    const assignedCount = Object.values(serverSlots).filter((s) => s && s.name).length;
    if (badgeSlotsEl) badgeSlotsEl.textContent = String(assignedCount);
  }

  const slotFlapCenterStyle = document.getElementById("slot-flap-center-style");

  function buildSlotQrOptions(n, overrideLayout) {
    const layoutMode = overrideLayout || (qrLayoutStyle && qrLayoutStyle.value) || "square_qr";
    const baseCapMode = (qrCaptionStyle && qrCaptionStyle.value) || "bilingual";
    const namePosMode = (qrBatchNamePos && qrBatchNamePos.value) || "flap_only";
    const flapCenterMode = (slotFlapCenterStyle && slotFlapCenterStyle.value) || "xi_emblem";
    const assigned = getSlotGuestRecord(n);
    const gName = assigned ? assigned.name : "";
    const hasCjk = Boolean(gName && /[\u4e00-\u9fff]/.test(gName));
    return {
      layoutMode,
      targetUrl: getSlotUrl(n),
      capMode: hasCjk ? "zh" : baseCapMode,
      guestText: gName,
      namePosMode,
      flapCenterMode,
      slotNum: n,
      assignedName: gName
    };
  }

  document.querySelectorAll(".js-slot-quick-range").forEach((btn) => {
    btn.addEventListener("click", () => {
      const layoutMode = (qrLayoutStyle && qrLayoutStyle.value) || "square_qr";
      const cfg = getLayoutSheetConfig(layoutMode);
      const sheetsMult = parseInt(btn.getAttribute("data-sheets") || "0", 10);
      const rawCount = parseInt(btn.getAttribute("data-count") || "0", 10);
      const count = sheetsMult > 0 ? (cfg.itemsPerSheet * sheetsMult) : (rawCount || cfg.itemsPerSheet);
      const fromN = Math.max(1, parseInt(slotPrintFromInput ? slotPrintFromInput.value : "1", 10) || 1);
      const toN = fromN + count - 1;
      if (slotPrintToInput) slotPrintToInput.value = String(toN);
      renderLuxuryWeddingQR(false, buildSlotQrOptions(fromN, layoutMode));
      notify(`📐 Đã chọn in từ Số ${fromN} → Số ${toN} (${count} chiếc = ${Math.ceil(count / cfg.itemsPerSheet)} tờ A4)!`);
    });
  });

  if (slotFlapCenterStyle) {
    slotFlapCenterStyle.addEventListener("change", () => {
      const fromN = Math.max(1, parseInt(slotPrintFromInput ? slotPrintFromInput.value : "1", 10) || 1);
      renderLuxuryWeddingQR(false, buildSlotQrOptions(fromN, "pinterest_strip"));
    });
  }

  if (slotPrintFromInput) {
    slotPrintFromInput.addEventListener("input", () => {
      const layoutMode = (qrLayoutStyle && qrLayoutStyle.value) || "square_qr";
      const fromN = Math.max(1, parseInt(slotPrintFromInput.value || "1", 10) || 1);
      renderLuxuryWeddingQR(false, buildSlotQrOptions(fromN, layoutMode));
    });
  }

  if (btnPrintSlots) {
    btnPrintSlots.addEventListener("click", () => {
      ensureGuestSlotsNormalized();
      const layoutMode = (qrLayoutStyle && qrLayoutStyle.value) || "square_qr";
      const cfg = getLayoutSheetConfig(layoutMode);
      const isSquareQr = layoutMode.startsWith("square_qr");
      const isPinterestStrip = layoutMode === "pinterest_strip";
      const fromN = Math.max(1, parseInt(slotPrintFromInput ? slotPrintFromInput.value : "1", 10) || 1);
      const toN = Math.max(
        fromN,
        Math.min(
          fromN + 479,
          parseInt(slotPrintToInput ? slotPrintToInput.value : String(fromN + cfg.itemsPerSheet - 1), 10) || (fromN + cfg.itemsPerSheet - 1)
        )
      );

      const win = window.open("", "_blank");
      if (!win) {
        notify("⚠️ Trình duyệt chặn cửa sổ bật lên. Hãy cho phép Popup để mở trang in A4 nhé!");
        return;
      }

      const itemsHtml = [];
      let namedInRange = 0;
      let numberedInRange = 0;
      let firstNumbered = null;
      let lastNumbered = null;

      for (let n = fromN; n <= toN; n++) {
        const opts = buildSlotQrOptions(n, layoutMode);
        if (opts.assignedName) {
          namedInRange++;
        } else {
          numberedInRange++;
          if (firstNumbered === null) firstNumbered = n;
          lastNumbered = n;
        }
        renderLuxuryWeddingQR(true, opts);
        const dUrl = (isPinterestStrip || isSquareQr)
          ? qrCanvas.toDataURL("image/jpeg", 0.95)
          : qrCanvas.toDataURL("image/png");
        const safeAlt = opts.assignedName
          ? `Thẻ QR ${String(opts.assignedName).replace(/&/g, "&amp;").replace(/"/g, "&quot;")}`
          : `Thẻ QR Số ${n}`;
        itemsHtml.push(
          `<div class="sticker-cell"><img src="${dUrl}" alt="${safeAlt}" /></div>`
        );
      }

      // Restore preview canvas
      renderLuxuryWeddingQR(false);

      if (toN > slotMaxPrinted) {
        slotMaxPrinted = toN;
        persistLocalSlots();
        renderSlotsTable();
      }
      if (slotPrintFromInput && slotPrintToInput) {
        slotPrintFromInput.value = String(toN + 1);
        slotPrintToInput.value = String(toN + cfg.itemsPerSheet);
      }

      const totalCount = itemsHtml.length;
      const sheetsCells = [];
      for (let i = 0; i < totalCount; i += cfg.itemsPerSheet) {
        sheetsCells.push(itemsHtml.slice(i, i + cfg.itemsPerSheet));
      }
      const numSheets = sheetsCells.length;
      const padN = (v) => `#${String(v).padStart(2, "0")}`;
      const rangeSummary =
        namedInRange > 0 && numberedInRange > 0
          ? `${namedInRange} Đã Có Tên + ${numberedInRange} Đánh Số (${padN(firstNumbered)} → ${padN(lastNumbered)})`
          : namedInRange > 0
            ? `${namedInRange} Đã Có Tên`
            : `${totalCount} thẻ (${padN(fromN)} → ${padN(toN)})`;

      win.document.open();
      win.document.write(
        buildDuplexFrontQrHtml({
          title: `In ${numSheets} Tờ A4 Thẻ QR (${rangeSummary} • ${cfg.name}) - Thuận Tường & Tiểu Dinh`,
          toolbarTitle: `🖨️ Mặt 1 (QR): ${rangeSummary} gồm ${numSheets} tờ A4 (${cfg.name})`,
          toolbarDesc: "• Thẻ đã có tên tự hiện Tên Khách (không in số); thẻ chưa có tên đánh số góc để điền tên sau.",
          sheetsCells,
          cfg,
          isSquareQr,
          isPinterestStrip
        })
      );
      win.document.close();
    });
  }

  // =======================================================================
  // SẢNH SEINE (RIVERSIDE PALACE) INTERACTIVE SEATING FLOORPLAN
  // =======================================================================
  const badgeSeatedEl = document.getElementById("badge-seated-count");
  const seineTotalTablesInput = document.getElementById("seine-total-tables");
  const seineShowCompanionsChk = document.getElementById("seine-show-companions");
  const seineTableLabelModeSel = document.getElementById("seine-table-label-mode");
  const seineShowAllLabelsToggle = document.getElementById("seine-show-all-labels-toggle");
  const seineLabelModeHintEl = document.getElementById("seine-label-mode-hint");

  function syncTableLabelModeUI() {
    const mode = VALID_TABLE_LABEL_MODES.includes(seatingConfig.tableLabelMode)
      ? seatingConfig.tableLabelMode
      : "same_label";
    seatingConfig.tableLabelMode = mode;
    if (seineTableLabelModeSel && document.activeElement !== seineTableLabelModeSel) {
      seineTableLabelModeSel.value = mode;
    }
    if (seineShowAllLabelsToggle) {
      seineShowAllLabelsToggle.checked = mode === "all";
    }
    if (seineLabelModeHintEl) {
      const hints = {
        same_label: "Khách chỉ thấy tên các bàn trùng tên với bàn của mình (link chung không lộ tên bàn).",
        own_only: "Khách chỉ thấy tên đúng bàn mình ngồi; toàn bộ các bàn còn lại ẩn tên.",
        none: "Ẩn hoàn toàn tên mọi bàn trên thiệp mời khách (chỉ hiển thị số bàn 01, 02...).",
        all: "Đang bật hiện tên tất cả các bàn trên sơ đồ thiệp khách (tắt nút gạt để ẩn lại ngay)."
      };
      seineLabelModeHintEl.textContent = hints[mode] || hints.same_label;
    }
  }
  const seineKpiSummary = document.getElementById("seine-kpi-summary");
  const seineLeftWing = document.getElementById("seine-left-wing");
  const seineRightWing = document.getElementById("seine-right-wing");
  const seineInspTitle = document.getElementById("seine-insp-title");
  const seineInspBadge = document.getElementById("seine-insp-badge");
  const seineInspGroup = document.getElementById("seine-insp-group");
  const seineInspLabel = document.getElementById("seine-insp-label");
  const seineInspCount = document.getElementById("seine-insp-count");
  const seineInspSeatedList = document.getElementById("seine-insp-seated-list");
  const seineUnassignedSearch = document.getElementById("seine-unassigned-search");
  const seineUnassignedGroupFilter = document.getElementById("seine-unassigned-group-filter");
  const seineUnassignedList = document.getElementById("seine-unassigned-list");

  async function saveSeatingConfigToServer(showToast = false) {
    persistLocalSeating();
    const apiRes = await adminApiFetch("/api/seating", {
      method: "POST",
      body: seatingConfig
    });
    if (!apiRes.ok) {
      notify(`⚠️ Chưa lưu được cấu hình sơ đồ bàn (${apiRes.error}).`);
      return false;
    }
    if (showToast) notify("✅ Đã lưu cấu hình Sơ Đồ Bàn Tiệc Sảnh Seine!");
    return true;
  }

  // === Mobile Drawer for Seine Inspector ===
  const seineDrawerBackdrop = document.getElementById("seine-drawer-backdrop");
  const seineInspBox = document.getElementById("seine-inspector-box");

  function openSeineDrawer() {
    if (!seineInspBox) return;
    seineInspBox.classList.add("is-drawer-open");
    if (seineDrawerBackdrop) seineDrawerBackdrop.classList.add("is-visible");
    document.body.style.overflow = "hidden";
  }
  function closeSeineDrawer() {
    if (!seineInspBox) return;
    seineInspBox.classList.remove("is-drawer-open");
    if (seineDrawerBackdrop) seineDrawerBackdrop.classList.remove("is-visible");
    document.body.style.overflow = "";
  }
  // Expose globally for inline onclick
  window.closeSeineDrawer = closeSeineDrawer;
  if (seineDrawerBackdrop) {
    seineDrawerBackdrop.addEventListener("click", closeSeineDrawer);
  }
  // Swipe down & Escape key to close drawer
  (function() {
    let touchStartY = 0;
    if (!seineInspBox) return;
    const resetSwipe = () => {
      touchStartY = 0;
    };
    seineInspBox.addEventListener("touchstart", (e) => {
      if (seineInspBox.scrollTop <= 0 && e.touches && e.touches.length) {
        touchStartY = e.touches[0].clientY;
      } else {
        touchStartY = 0;
      }
    }, { passive: true });
    seineInspBox.addEventListener("touchmove", (e) => {
      if (touchStartY > 0 && e.touches && e.touches.length && e.touches[0].clientY - touchStartY > 60) {
        closeSeineDrawer();
        touchStartY = 0;
      }
    }, { passive: true });
    seineInspBox.addEventListener("touchend", resetSwipe, { passive: true });
    seineInspBox.addEventListener("touchcancel", resetSwipe, { passive: true });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && seineInspBox.classList.contains("is-drawer-open")) {
        closeSeineDrawer();
      }
    });
  })();

  function renderSeineFloorplan() {
    if (!seineLeftWing || !seineRightWing) return;
    const total = Math.max(4, Math.min(52, parseInt(seatingConfig.totalTables || "38", 10) || 38));
    const cap = seatingConfig.seatsPerTable || 10;
    if (seineTotalTablesInput && document.activeElement !== seineTotalTablesInput) {
      seineTotalTablesInput.value = String(total);
    }
    if (seineShowCompanionsChk) {
      seineShowCompanionsChk.checked = seatingConfig.showTableGuests !== false;
    }
    syncTableLabelModeUI();

    const { occ, byTable, totalSeatedRecords, totalSeatedPax } = computeTableStats();
    if (badgeSeatedEl) badgeSeatedEl.textContent = String(totalSeatedRecords);
    if (seineKpiSummary) {
      seineKpiSummary.textContent = `Đã xếp bàn: ${totalSeatedRecords} khách/nhóm • ${totalSeatedPax} / ${total * cap} ghế (${total} bàn × ${cap} ghế)`;
    }

    if (activeAdminTabId !== "tab-seating") {
      if (seineLeftWing.childElementCount > 0) seineLeftWing.innerHTML = "";
      if (seineRightWing.childElementCount > 0) seineRightWing.innerHTML = "";
      if (seineUnassignedList && seineUnassignedList.childElementCount > 0) seineUnassignedList.innerHTML = "";
      return;
    }

    if (typeof renderCustomGroupsChips === "function") {
      renderCustomGroupsChips();
    }

    seineLeftWing.innerHTML = "";
    seineRightWing.innerHTML = "";

    function buildTableWrap(i) {
      const tKey = String(i);
      const used = occ[tKey] || 0;
      const isFull = used >= cap;
      const isPartial = used > 0 && used < cap;
      const meta = (seatingConfig.tableMeta && seatingConfig.tableMeta[tKey]) || {};
      const grpKey = meta.group || "";
      const grpInfo = SEAT_GROUPS[grpKey] || SEAT_GROUPS[""];
      const isSelected = selectedSeineTable === tKey;

      const wrap = document.createElement("div");
      wrap.className = "seine-table-wrap" + (isSelected ? " is-selected" : "");
      wrap.setAttribute("role", "button");
      wrap.setAttribute("tabindex", "0");
      wrap.setAttribute("aria-pressed", String(isSelected));

      let dotsHtml = "";
      for (let s = 0; s < cap; s++) {
        const angle = (s / cap) * Math.PI * 2 - Math.PI / 2;
        const px = (50 + 43.5 * Math.cos(angle)).toFixed(1);
        const py = (50 + 43.5 * Math.sin(angle)).toFixed(1);
        const dotCls = isFull ? "is-full" : s < used ? "is-occupied" : "";
        dotsHtml += `<span class="seine-seat-dot ${dotCls}" style="left:${px}%; top:${py}%; transform:translate(-50%, -50%);"></span>`;
      }

      const customLabel = (meta.label || "").trim();
      const safeCustomLabel = customLabel
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      wrap.setAttribute(
        "aria-label",
        `Bàn ${String(i).padStart(2, "0")}${customLabel ? " - " + customLabel : ""}, ${used} trên ${cap} ghế`
      );

      const isMobile = window.innerWidth <= 640;

      const nameStickerHtml = safeCustomLabel
        ? `<div class="seine-table-name-sticker" title="Tên bàn: ${safeCustomLabel}">${isMobile ? safeCustomLabel : "🏷️ " + safeCustomLabel}</div>`
        : "";

      const rawGroupShort = grpKey
        ? grpInfo.short
        : customLabel
          ? ""
          : "Chưa đặt tên";
      const groupTagText = isMobile && rawGroupShort
        ? rawGroupShort.replace(/^[^\wÀ-ỹ]+\s*/, "")
        : rawGroupShort;

      const isDefaultTag = !grpKey && !customLabel;
      const groupTagHtml = groupTagText
        ? `<div class="seine-table-tag${isDefaultTag ? " is-default-tag" : ""}" style="background:${grpInfo.bg}; color:${normalizeGroupFgColor(grpInfo.color)};">${groupTagText}</div>`
        : "";

      wrap.innerHTML = `
        <div class="seine-table-ring">
          ${dotsHtml}
          <div class="seine-table-circle ${isFull ? "is-full" : isPartial ? "is-partial" : ""}">
            <div class="seine-table-num">${isMobile ? String(i).padStart(2, "0") : "Bàn " + String(i).padStart(2, "0")}</div>
            <div class="seine-table-cap">${used}/${cap}</div>
          </div>
        </div>
        ${nameStickerHtml}
        ${groupTagHtml}
      `;

      const selectTable = () => {
        selectedSeineTable = tKey;
        try {
          localStorage.setItem("td_admin_selected_table_v1", tKey);
        } catch (_) {}
        renderSeineFloorplan();
        // On mobile (<=640px): open drawer panel
        if (window.innerWidth <= 640) {
          openSeineDrawer();
        } else if (window.innerWidth <= 1024) {
          const inspBox = document.getElementById("seine-inspector-box");
          if (inspBox) inspBox.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };

      wrap.addEventListener("click", selectTable);
      wrap.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectTable();
        }
      });

      return wrap;
    }

    // Map extra tables (37+) to gaps between base rows (from bottom up: Row 8-9, Row 7-8, Row 5-6...)
    const baseRows = 9;
    const baseTables = baseRows * 4; // 36
    const extraCount = Math.max(0, total - baseTables);
    const gapOrder = [7, 6, 4, 3, 2, 1, 0, 5];
    const extraByGap = {}; // gapIdx -> { left: tableNum, right: tableNum }

    for (let e = 0; e < extraCount; e++) {
      const tableNum = baseTables + e + 1;
      const isOdd = tableNum % 2 === 1;
      const pairIdx = Math.floor(e / 2);
      const gapIdx = gapOrder[pairIdx % gapOrder.length];
      if (!extraByGap[gapIdx]) extraByGap[gapIdx] = {};
      if (isOdd) extraByGap[gapIdx].left = tableNum;
      else extraByGap[gapIdx].right = tableNum;
    }

    // Render 9 base rows sequentially left-to-right (Row 1: 01,02 left | 03,04 right)
    for (let row = 0; row < baseRows; row++) {
      const leftOuter = row * 4 + 1;
      const leftInner = row * 4 + 2;
      const rightInner = row * 4 + 3;
      const rightOuter = row * 4 + 4;

      if (leftOuter <= total) seineLeftWing.appendChild(buildTableWrap(leftOuter));
      if (leftInner <= total) seineLeftWing.appendChild(buildTableWrap(leftInner));
      if (rightInner <= total) seineRightWing.appendChild(buildTableWrap(rightInner));
      if (rightOuter <= total) seineRightWing.appendChild(buildTableWrap(rightOuter));

      // Right after Row 6 (row === 5): insert L-shaped aisle entrance from Door 2
      if (row === 5 && total >= 24) {
        const leftCorridor = document.createElement("div");
        leftCorridor.className = "seine-l-corridor is-left-marker";
        seineLeftWing.appendChild(leftCorridor);

        const rightCorridor = document.createElement("div");
        rightCorridor.className = "seine-l-corridor is-right-door2";
        rightCorridor.innerHTML = `
          <span>⤴ LỐI CHỮ L</span>
          <span class="seine-l-door-badge">🚪 CỔNG 2 ◀</span>
        `;
        seineRightWing.appendChild(rightCorridor);
      }

      // If there is an interleaved center table between row and row+1
      const gapExtra = extraByGap[row];
      if (gapExtra && (gapExtra.left || gapExtra.right)) {
        const leftCenterSlot = document.createElement("div");
        leftCenterSlot.className = "seine-center-interleaved-slot";
        if (gapExtra.left) {
          leftCenterSlot.appendChild(buildTableWrap(gapExtra.left));
        }
        seineLeftWing.appendChild(leftCenterSlot);

        const rightCenterSlot = document.createElement("div");
        rightCenterSlot.className = "seine-center-interleaved-slot";
        if (gapExtra.right) {
          rightCenterSlot.appendChild(buildTableWrap(gapExtra.right));
        }
        seineRightWing.appendChild(rightCenterSlot);
      }
    }

    renderSeineInspector(occ, byTable);
  }

  function renderSeineInspector(occ, byTable) {
    if (!seineInspTitle) return;
    const tKey = String(selectedSeineTable || "1");
    const cap = seatingConfig.seatsPerTable || 10;
    const used = (occ && occ[tKey]) || 0;
    const seatedArr = (byTable && byTable[tKey]) || [];
    const meta = (seatingConfig.tableMeta && seatingConfig.tableMeta[tKey]) || {};

    const customLbl = (meta.label || "").trim();
    const isMobInsp = window.innerWidth <= 640;
    seineInspTitle.textContent = customLbl && !isMobInsp
      ? `🪑 Bàn ${String(tKey).padStart(2, "0")} · ${customLbl}`
      : `🪑 Bàn ${String(tKey).padStart(2, "0")}`;
    if (seineInspBadge) {
      seineInspBadge.textContent = `${used}/${cap} ghế`;
      seineInspBadge.className =
        "status-badge " + (used >= cap ? "is-viewed" : used > 0 ? "is-opened" : "is-pending");
    }
    if (seineInspGroup && document.activeElement !== seineInspGroup) {
      seineInspGroup.value = meta.group || "";
    }
    if (seineInspLabel && document.activeElement !== seineInspLabel) {
      seineInspLabel.value = meta.label || "";
    }
    if (seineInspCount) {
      seineInspCount.textContent = `${seatedArr.length} khách • ${used} ghế`;
    }

    const btnPreviewTable = document.getElementById("btn-preview-seine-table");
    const btnCopyTableLink = document.getElementById("btn-copy-seine-table-link");
    const sampleGuestName =
      (seatedArr[0] && seatedArr[0].name) || "Anh Minh & Chị Lan (Khách Demo)";
    const sampleGroup =
      (seatedArr[0] && seatedArr[0].group) || meta.group || "friends_colleagues";
    const samplePax = (seatedArr[0] && seatedArr[0].pax) || 2;
    const baseClean = baseOrigin.replace(/\?.*$/, "").replace(/\/+$/, "");
    const demoParams = new URLSearchParams();
    demoParams.set("to", sampleGuestName);
    demoParams.set("table", tKey);
    if (sampleGroup) demoParams.set("group", sampleGroup);
    demoParams.set("pax", String(samplePax));
    demoParams.set("mode", "directions");
    const liveTableDemoUrl = `${baseClean}/?${demoParams.toString()}`;
    const localTableDemoUrl = `./index.html?${demoParams.toString()}&notrack=1`;

    if (btnPreviewTable) {
      btnPreviewTable.href =
        window.location.protocol === "file:"
          ? localTableDemoUrl
          : `${liveTableDemoUrl}&notrack=1`;
      btnPreviewTable.textContent = isMobInsp
        ? "👁️ Xem"
        : `👁️ Xem Bàn ${String(tKey).padStart(2, "0")}`;
    }
    if (btnCopyTableLink) {
      btnCopyTableLink.onclick = () => {
        copyText(
          liveTableDemoUrl,
          `✅ Đã copy link Bàn ${String(tKey).padStart(2, "0")}!`
        );
      };
    }

    if (seineInspSeatedList) {
      seineInspSeatedList.innerHTML = "";
      if (!seatedArr.length) {
        seineInspSeatedList.innerHTML = `<div style="font-size:11.5px; color:var(--adm-muted); padding:4px 0;">Chưa có khách ở bàn này.</div>`;
      } else {
        seatedArr.forEach((item) => {
          const row = document.createElement("div");
          row.className = "seine-guest-pill";
          row.innerHTML = `
            <div style="min-width:0; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              <strong class="js-sp-name"></strong>
              ${item.slot ? `<span class="lang-tag" style="margin-left:4px;">#${String(item.slot).padStart(2, "0")}</span>` : ""}
              <span style="font-size:11px; color:var(--adm-muted); margin-left:4px;">(${item.pax} ghế)</span>
            </div>
            <button type="button" class="btn-adm danger seine-pill-btn js-sp-remove" title="Gỡ khỏi bàn này">✕ Gỡ</button>
          `;
          row.querySelector(".js-sp-name").textContent = item.name;
          row.querySelector(".js-sp-remove").addEventListener("click", async () => {
            if (item.slot) {
              await setSlotSeat(item.slot, item.group || "", "", item.pax || 1, false);
            }
            if (item.name && !item.name.startsWith("QR Số")) {
              await updateGuestSeatOnServer(item.name, item.group || "", "", item.pax || 1, false);
            }
            persistLocalGuests();
            persistLocalSlots();
            buildRows();
            renderSlotsTable();
            renderSeineFloorplan();
            notify(`🪑 Đã gỡ "${item.name}" khỏi Bàn ${String(tKey).padStart(2, "0")}!`);
          });
          seineInspSeatedList.appendChild(row);
        });
      }
    }

    if (seineUnassignedList) {
      const q = (seineUnassignedSearch ? seineUnassignedSearch.value : "").trim().toLowerCase();
      const grpFilter = (seineUnassignedGroupFilter ? seineUnassignedGroupFilter.value : "all") || "all";
      seineUnassignedList.innerHTML = "";

      const candidates = [];
      const seenKeys = new Set();
      savedGuests.forEach((g) => {
        if (!g || !g.name) return;
        const gk = normalizeNameKey(g.name);
        seenKeys.add(gk);
        const slotObj = g.slotCode && serverSlots[g.slotCode] ? serverSlots[g.slotCode] : null;
        const tbl = String(g.table || (slotObj && slotObj.table) || "").trim();
        if (tbl === tKey) return;
        const grp = String(g.group || (slotObj && slotObj.group) || "").trim();
        const pax = Math.max(1, parseInt(g.pax || (slotObj && slotObj.pax) || "1", 10) || 1);
        const note = String(g.note || guestNotesMap[gk] || "").trim();
        candidates.push({
          type: "guest",
          name: g.name,
          slot: g.slot || (slotObj && slotObj.num) || null,
          group: grp,
          table: tbl,
          pax,
          note
        });
      });

      // Also include numbered QR slots up to 414 (total cards) that have no table yet
      const maxSlot = Math.max(414, slotMaxPrinted);
      for (let n = 1; n <= maxSlot; n++) {
        const code = makeSlotCode(n);
        const s = serverSlots[code];
        const sName = s && s.name ? String(s.name).trim() : "";
        if (sName && seenKeys.has(normalizeNameKey(sName))) continue;
        const tbl = s && s.table ? String(s.table).trim() : "";
        if (tbl === tKey) continue;
        const grp = s && s.group ? String(s.group).trim() : "";
        const pax = Math.max(1, parseInt((s && s.pax) || "1", 10) || 1);
        candidates.push({
          type: "slot",
          name: sName || `QR Số ${n} (Chưa gán tên)`,
          slot: n,
          group: grp,
          table: tbl,
          pax,
          note: ""
        });
      }

      const filtered = candidates.filter((c) => {
        if (grpFilter !== "all" && c.group !== grpFilter) return false;
        if (q) {
          const mName = c.name.toLowerCase().includes(q);
          const mNote = c.note.toLowerCase().includes(q);
          const mSlot = c.slot && (`số ${c.slot}` === q || `#${c.slot}` === q || String(c.slot) === q);
          if (!mName && !mNote && !mSlot) return false;
        }
        return true;
      });

      filtered.slice(0, 60).forEach((c) => {
        const row = document.createElement("div");
        row.className = "seine-guest-pill";
        const grpShort = c.group && SEAT_GROUPS[c.group] ? SEAT_GROUPS[c.group].short : "";
        const curTblBadge = c.table ? ` (Bàn ${c.table})` : "";
        row.innerHTML = `
          <div style="min-width:0; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            <strong class="js-cand-name"></strong>
            ${c.slot ? `<span class="lang-tag" style="margin-left:4px;">#${String(c.slot).padStart(2, "0")}</span>` : ""}
            ${grpShort ? `<span style="font-size:10.5px; color:var(--adm-muted); margin-left:4px;">• ${grpShort}</span>` : ""}
            <span style="font-size:11px; color:var(--adm-amber-ink);">${curTblBadge}</span>
          </div>
          <button type="button" class="btn-adm primary seine-pill-btn js-cand-assign">+ Bàn ${String(tKey).padStart(2, "0")}</button>
        `;
        row.querySelector(".js-cand-name").textContent = c.name;
        row.querySelector(".js-cand-assign").addEventListener("click", async () => {
          const targetGrp = c.group || meta.group || "";
          const targetPax = Math.max(1, parseInt(c.pax || "1", 10) || 1);
          if (c.slot) {
            await setSlotSeat(c.slot, targetGrp, tKey, targetPax, false);
          }
          if (c.name && !c.name.startsWith("QR Số")) {
            await updateGuestSeatOnServer(c.name, targetGrp, tKey, targetPax, false);
          }
          persistLocalGuests();
          persistLocalSlots();
          buildRows();
          renderSlotsTable();
          renderSeineFloorplan();
          notify(`🪑 Đã xếp "${c.name}" vào Bàn ${String(tKey).padStart(2, "0")} (${targetPax} ghế)!`);
        });
        seineUnassignedList.appendChild(row);
      });
    }
  }

  if (seineTotalTablesInput) {
    seineTotalTablesInput.addEventListener("change", () => {
      seatingConfig.totalTables = Math.max(
        4,
        Math.min(52, parseInt(seineTotalTablesInput.value || "40", 10) || 40)
      );
      renderSeineFloorplan();
      buildRows();
      renderSlotsTable();
      saveSeatingConfigToServer(true);
    });
  }

  document.querySelectorAll(".js-seine-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      const t = parseInt(btn.getAttribute("data-tables") || "40", 10) || 40;
      seatingConfig.totalTables = t;
      if (seineTotalTablesInput) seineTotalTablesInput.value = String(t);
      renderSeineFloorplan();
      buildRows();
      renderSlotsTable();
      saveSeatingConfigToServer(true);
    });
  });

  if (seineShowCompanionsChk) {
    seineShowCompanionsChk.addEventListener("change", () => {
      seatingConfig.showTableGuests = seineShowCompanionsChk.checked;
      saveSeatingConfigToServer(true);
    });
  }

  function applyTableLabelMode(nextMode) {
    const valid = VALID_TABLE_LABEL_MODES.includes(nextMode) ? nextMode : "same_label";
    if (valid !== "all") {
      try {
        localStorage.setItem(STORAGE_LAST_RESTRICTED_LABEL_MODE, valid);
      } catch (_) {}
    }
    seatingConfig.tableLabelMode = valid;
    syncTableLabelModeUI();
    saveSeatingConfigToServer(false);
    const toastMap = {
      same_label: "👥 Đã chuyển thiệp khách sang: Chỉ hiện các bàn cùng tên!",
      own_only: "🎯 Đã chuyển thiệp khách sang: Chỉ hiện tên bàn của khách!",
      none: "🙈 Đã ẩn hoàn toàn tên bàn trên thiệp mời khách!",
      all: "👁️ Đã bật hiện tên tất cả các bàn trên thiệp mời khách!"
    };
    notify(toastMap[valid] || "✅ Đã lưu chế độ hiển thị tên bàn!");
  }

  if (seineTableLabelModeSel) {
    seineTableLabelModeSel.addEventListener("change", () => {
      applyTableLabelMode(seineTableLabelModeSel.value);
    });
  }

  if (seineShowAllLabelsToggle) {
    seineShowAllLabelsToggle.addEventListener("change", () => {
      if (seineShowAllLabelsToggle.checked) {
        applyTableLabelMode("all");
      } else {
        let fallback = "same_label";
        try {
          const savedLast = localStorage.getItem(STORAGE_LAST_RESTRICTED_LABEL_MODE);
          if (savedLast && savedLast !== "all" && VALID_TABLE_LABEL_MODES.includes(savedLast)) {
            fallback = savedLast;
          }
        } catch (_) {}
        applyTableLabelMode(fallback);
      }
    });
  }

  if (seineInspGroup) {
    seineInspGroup.addEventListener("change", () => {
      const tKey = String(selectedSeineTable || "1");
      if (!seatingConfig.tableMeta) seatingConfig.tableMeta = {};
      seatingConfig.tableMeta[tKey] = {
        ...(seatingConfig.tableMeta[tKey] || {}),
        group: seineInspGroup.value
      };
      renderSeineFloorplan();
      buildRows();
      renderSlotsTable();
      saveSeatingConfigToServer(true);
    });
  }

  function applyTableLabelForSelected(newLabel, showToastMsg = true) {
    const tKey = String(selectedSeineTable || "1");
    const cleanLbl = String(newLabel || "").trim();
    if (!seatingConfig.tableMeta) seatingConfig.tableMeta = {};
    seatingConfig.tableMeta[tKey] = {
      ...(seatingConfig.tableMeta[tKey] || {}),
      label: cleanLbl
    };
    if (seineInspLabel) seineInspLabel.value = cleanLbl;
    renderSeineFloorplan();
    buildRows();
    renderSlotsTable();
    saveSeatingConfigToServer(false);
    if (showToastMsg) {
      notify(
        cleanLbl
          ? `🏷️ Đã đặt tên Bàn ${String(tKey).padStart(2, "0")}: "${cleanLbl}"`
          : `🏷️ Đã xóa tên riêng của Bàn ${String(tKey).padStart(2, "0")}`
      );
    }
  }

  if (seineInspLabel) {
    seineInspLabel.addEventListener("change", () => {
      applyTableLabelForSelected(seineInspLabel.value, true);
    });
    seineInspLabel.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyTableLabelForSelected(seineInspLabel.value, true);
      }
    });
  }

  const btnSaveSeineLabel = document.getElementById("btn-save-seine-label");
  if (btnSaveSeineLabel && seineInspLabel) {
    btnSaveSeineLabel.addEventListener("click", () => {
      applyTableLabelForSelected(seineInspLabel.value, true);
    });
  }

  const btnClearSeineLabel = document.getElementById("btn-clear-seine-label");
  if (btnClearSeineLabel) {
    btnClearSeineLabel.addEventListener("click", () => {
      applyTableLabelForSelected("", true);
    });
  }

  if (seineUnassignedSearch) {
    seineUnassignedSearch.addEventListener("input", () => renderSeineFloorplan());
  }
  if (seineUnassignedGroupFilter) {
    seineUnassignedGroupFilter.addEventListener("change", () => renderSeineFloorplan());
  }

  adminBootCompleted = true;
  refreshAllGroupSelects();
  renderSlotsTable();
  renderSeineFloorplan();

  setTimeout(renderLuxuryWeddingQR, 250);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(renderLuxuryWeddingQR);
  }

  buildRows();

  // Restore scroll position on reload so user doesn't jump back to top of guest list
  const STORAGE_SCROLL_Y = "td_admin_scroll_y_v1";
  const initialSavedScrollY = parseInt(sessionStorage.getItem(STORAGE_SCROLL_Y) || "0", 10) || 0;
  let userHasManuallyScrolled = false;

  function restoreSavedScrollIfNeeded() {
    if (initialSavedScrollY > 0 && !userHasManuallyScrolled) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: initialSavedScrollY, behavior: "instant" });
      });
    }
  }

  restoreSavedScrollIfNeeded();

  let scrollSaveTimer = null;
  window.addEventListener("wheel", () => { userHasManuallyScrolled = true; }, { passive: true });
  window.addEventListener("touchmove", () => { userHasManuallyScrolled = true; }, { passive: true });
  window.addEventListener("scroll", () => {
    if (scrollSaveTimer) clearTimeout(scrollSaveTimer);
    scrollSaveTimer = setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_SCROLL_Y, String(Math.round(window.scrollY || 0)));
      } catch (_) {}
    }, 120);
  }, { passive: true });

  fetchAnalytics(false).finally(() => {
    restoreSavedScrollIfNeeded();
  });
  setInterval(() => {
    if (!document.hidden) fetchAnalytics(false);
  }, 15000);
})();
  