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
  let currentFilter = "all";
  // Numbered QR bookmarks (print first, assign guest later): code -> { num, name, lang, assignedAt }
  let serverSlots = {};
  const TOTAL_INVITE_TARGET = 414;
  const STORAGE_SLOT_MAX_PRINTED = "td_slot_max_printed_v1";
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

  const STORAGE_SEATING_CFG = "td_seating_config_v1";
  let seatingConfig = {
    totalTables: 38,
    seatsPerTable: 10,
    showTableGuests: true,
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
    bride_family: { label: "👑 Gia đình Nhà Gái", short: "👑 GĐ Gái", bg: "#fde8e8", color: "#a61c1c" },
    groom_relatives: { label: "🏮 Họ hàng Nhà Trai", short: "🏮 Họ Trai", bg: "#faeedb", color: "#9a5b13" },
    bride_relatives: { label: "🏮 Họ hàng Nhà Gái", short: "🏮 Họ Gái", bg: "#fcebd9", color: "#b85d19" },
    friends_colleagues: { label: "🥂 Bạn bè & Đồng nghiệp", short: "🥂 Bạn & ĐN", bg: "#e3f5ee", color: "#1b6b52" },
    honored_guests: { label: "✨ Khách mời / Khách quý", short: "✨ Khách quý", bg: "#efeaf8", color: "#5b3e85" }
  };

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
    crimson: { bg: "#fde8e8", color: "#a61c1c", icon: "🌹" },
    amber: { bg: "#faeedb", color: "#9a5b13", icon: "🏮" },
    orange: { bg: "#fcebd9", color: "#b85d19", icon: "🍊" },
    emerald: { bg: "#e3f5ee", color: "#1b6b52", icon: "🌿" },
    blue: { bg: "#e8f0fe", color: "#1a5276", icon: "🌊" },
    purple: { bg: "#efeaf8", color: "#5b3e85", icon: "🔮" },
    pink: { bg: "#fcebf2", color: "#9b2c67", icon: "🌸" },
    brown: { bg: "#f2ece6", color: "#6e4b37", icon: "🪵" },
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
      chip.style.setProperty("--chip-fg", gInfo.color);
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
  const baseOrigin = isLocal
    ? "https://thuantuongtieudinh.io.vn/"
    : window.location.origin + "/";
  const apiBase = isLocal ? "https://thuantuongtieudinh.io.vn" : "";

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

  async function executeBulkAssignment({ grpVal, tblVal, modeVal, fromNum, toNum, rangeMode }) {
    if (grpVal === "__keep__" && tblVal === "__keep__" && modeVal === "__keep__") {
      notify("⚠️ Hãy chọn ít nhất 1 mục cần gán (Nhóm khách, Bàn tiệc hoặc Loại thiệp)!");
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
      if (g.slotCode && serverSlots[g.slotCode]) {
        if (nextGroup !== undefined) serverSlots[g.slotCode].group = nextGroup;
        if (nextTable !== undefined) serverSlots[g.slotCode].table = nextTable;
        if (nextMode !== undefined) serverSlots[g.slotCode].mode = nextMode;
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
        group: "",
        table: "",
        pax: 1,
        assignedAt: new Date().toISOString()
      };
      if (nextGroup !== undefined) prev.group = nextGroup;
      if (nextTable !== undefined) prev.table = nextTable;
      if (nextMode !== undefined) prev.mode = nextMode;
      serverSlots[code] = prev;
      slotItemsToUpdate.push({ code, num: n });
    });

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

    try {
      await fetch(`${apiBase}/api/seating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_assign",
          guestNames: guestNamesToUpdate,
          slotItems: slotItemsToUpdate,
          ...(nextGroup !== undefined ? { group: nextGroup } : {}),
          ...(nextTable !== undefined ? { table: nextTable } : {}),
          ...(nextMode !== undefined ? { mode: nextMode } : {})
        })
      });
    } catch (_) {}

    notify(`⚡ Đã áp dụng hàng loạt cho ${totalSelected} mục thành công!`);
    return true;
  }

  if (btnApplyBulkAssign) {
    btnApplyBulkAssign.addEventListener("click", () => {
      const grpSel = document.getElementById("bulk-assign-group");
      const tblSel = document.getElementById("bulk-assign-table");
      const modeSel = document.getElementById("bulk-assign-mode");
      const rangeTypeEl = document.getElementById("bulk-range-type");
      const rangeFromEl = document.getElementById("bulk-range-from");
      const rangeToEl = document.getElementById("bulk-range-to");

      const grpVal = grpSel ? grpSel.value : "__keep__";
      const tblVal = tblSel ? tblSel.value : "__keep__";
      const modeVal = modeSel ? modeSel.value : "__keep__";
      const fromNum = parseInt(rangeFromEl ? rangeFromEl.value : "", 10);
      const toNum = parseInt(rangeToEl ? rangeToEl.value : "", 10);
      const rangeMode = rangeTypeEl ? rangeTypeEl.value : "order";

      executeBulkAssignment({ grpVal, tblVal, modeVal, fromNum, toNum, rangeMode });
    });
  }

  if (btnFloatApply) {
    btnFloatApply.addEventListener("click", () => {
      const grpVal = bulkFloatGroup ? bulkFloatGroup.value : "__keep__";
      const tblVal = bulkFloatTable ? bulkFloatTable.value : "__keep__";
      const modeVal = bulkFloatMode ? bulkFloatMode.value : "__keep__";
      executeBulkAssignment({ grpVal, tblVal, modeVal, fromNum: NaN, toNum: NaN, rangeMode: "order" });
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
        serverSlots[expectedCode] = {
          ...prevS,
          num: sNum,
          name: g.name,
          lang: g.lang || (/[\u4e00-\u9fff]/.test(g.name || "") ? "zh" : "vi"),
          mode: g.mode || prevS.mode || "invite",
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
          try {
            for (const g of savedGuests) {
              if (!g || !g.slotCode || !g.name) continue;
              await fetch(`${apiBase}/api/slots`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "assign",
                  code: g.slotCode,
                  name: g.name,
                  lang: g.lang || (/[\u4e00-\u9fff]/.test(g.name) ? "zh" : "vi"),
                  note: g.note || "",
                  mode: g.mode || "invite",
                  group: g.group || "",
                  table: g.table || "",
                  pax: g.pax || 1
                })
              }).catch(() => {});
            }
          } catch (_) {}
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
      try {
        await fetch(`${apiBase}/api/guests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_note",
            name,
            note: cleanNote
          })
        });
        if (targetRecord) {
          await fetch(`${apiBase}/api/guests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "add",
              guests: [targetRecord]
            })
          });
        }
      } catch (_) {}
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
    toast.textContent = msg;
    toast.classList.add("is-shown");
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove("is-shown"), 2600);
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
    if (c === "VN") return "🇻🇳 Việt Nam";
    if (c === "TW") return "🇹🇼 Đài Loan";
    if (c === "US") return "🇺🇸 Mỹ";
    if (c === "SG") return "🇸🇬 Singapore";
    if (c === "AU") return "🇦🇺 Úc";
    if (c === "JP") return "🇯🇵 Nhật Bản";
    if (c === "KR") return "🇰🇷 Hàn Quốc";
    return "🌍 " + c;
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
    try {
      await fetch(`${apiBase}/api/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_mode",
          name,
          mode: nextMode,
          driveUrl: driveVal
        })
      });
    } catch (_) {}
    notify(
      nextMode === "thankyou"
        ? `📸 Đã bật "Thiệp Cảm Ơn" cho link của "${name}"!`
        : nextMode === "directions"
          ? `📍 Đã bật "Chế Độ Chỉ Đường Ngày Cưới (Đẩy Bản Đồ lên đầu)" cho "${name}"!`
          : `💌 Đã chuyển link của "${name}" về chế độ Thiệp Mời!`
    );
  }

  async function updateGuestSeatOnServer(name, nextGroup, nextTable, nextPax, showToast = true) {
    const key = normalizeNameKey(name);
    let linkedSlotCode = "";
    const cleanPax = Math.max(1, Math.min(20, parseInt(nextPax || "1", 10) || 1));
    const cleanTable = String(nextTable || "");
    const tMeta = (cleanTable && seatingConfig.tableMeta && seatingConfig.tableMeta[cleanTable]) || {};
    const effectiveGroup = nextGroup || tMeta.group || "";

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
      persistLocalSlots();
    }
    Object.keys(serverSlots).forEach((code) => {
      const s = serverSlots[code];
      if (s && s.name && normalizeNameKey(s.name) === key) {
        s.group = effectiveGroup;
        s.table = cleanTable;
        s.pax = cleanPax;
        persistLocalSlots();
      }
    });

    persistLocalGuests();
    buildRows();
    if (typeof renderSlotsTable === "function") renderSlotsTable();
    if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();

    if (showToast) {
      notify(
        cleanTable
          ? `🪑 Đã xếp "${name}" vào Bàn ${String(cleanTable).padStart(2, "0")} (${cleanPax} ghế)!`
          : `🪑 Đã gỡ "${name}" khỏi bàn tiệc!`
      );
    }

    try {
      const res = await fetch(`${apiBase}/api/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_seat",
          name,
          group: effectiveGroup,
          table: cleanTable,
          pax: cleanPax
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.savedGuests)) {
          mergeServerGuests(data.savedGuests);
          buildRows();
          if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
        }
      }
    } catch (_) {}
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
      group: (updatedRecord && updatedRecord.group) || prevSlot.group || "",
      table: (updatedRecord && updatedRecord.table) || prevSlot.table || "",
      pax: (updatedRecord && updatedRecord.pax) || prevSlot.pax || 1,
      assignedAt: prevSlot.assignedAt || new Date().toISOString()
    };

    // Keep local visitLogsByGuest attached under newKey
    if (oldKey && oldKey !== newKey && visitLogsByGuest[oldKey]) {
      visitLogsByGuest[newKey] = (visitLogsByGuest[newKey] || []).concat(visitLogsByGuest[oldKey]);
    }

    persistLocalGuests();
    if (typeof persistLocalSlots === "function") persistLocalSlots();
    buildRows();
    if (typeof renderSlotsTable === "function") renderSlotsTable();
    if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();

    notify(
      `✅ Đã đổi tên thành "${cleanNew}" — Link & Mã QR #${n} (?s=${code}) giữ nguyên cố định 100%!`
    );

    try {
      await fetch(`${apiBase}/api/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rename",
          oldName: cleanOld,
          newName: cleanNew,
          slot: n,
          slotCode: code,
          lang: newLang,
          note: (updatedRecord && updatedRecord.note) || ""
        })
      });
      await fetch(`${apiBase}/api/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          code,
          name: cleanNew,
          lang: newLang,
          note: (updatedRecord && updatedRecord.note) || "",
          mode: (updatedRecord && updatedRecord.mode) || "invite",
          group: (updatedRecord && updatedRecord.group) || "",
          table: (updatedRecord && updatedRecord.table) || "",
          pax: (updatedRecord && updatedRecord.pax) || 1
        })
      });
    } catch (_) {}
    return true;
  }

  async function removeGuestFromList(name, slotNum) {
    const key = normalizeNameKey(name);
    const targetGuest = savedGuests.find(
      (g) => (slotNum && Number(g.slot) === Number(slotNum)) || normalizeNameKey(g.name) === key
    );
    const resolvedSlot = Number(slotNum || (targetGuest && targetGuest.slot) || 0);
    const resolvedCode = resolvedSlot > 0 ? makeSlotCode(resolvedSlot) : "";

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
    try {
      await fetch(`${apiBase}/api/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", name })
      });
      if (resolvedCode) {
        await fetch(`${apiBase}/api/slots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "clear", code: resolvedCode })
        });
      }
    } catch (_) {}
    notify(
      resolvedSlot > 0
        ? `🗑️ Đã xóa tên "${name}" — Thẻ #${resolvedSlot} (?s=${resolvedCode}) đã trở về danh sách Chưa có tên.`
        : `🗑️ Đã xóa "${name}" khỏi danh sách.`
    );
  }

  function buildRows() {
    ensureGuestSlotsNormalized();
    const base = baseOrigin.replace(/\?.*$/, "");
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
      if (guestTable) {
        previewQs.set("table", guestTable);
        if (guestGroup) previewQs.set("group", guestGroup);
        if (guestPax > 1) previewQs.set("pax", String(guestPax));
      }
      if (effectiveMode === "directions" || effectiveMode === "thankyou") {
        previewQs.set("mode", effectiveMode);
      }
      previewQs.set("notrack", "1");
      const previewUrl = `${base}?${previewQs.toString()}`;

      const inviteMsg =
        isTyEffective
          ? effectiveLang === "zh"
            ? `囍 婚禮感謝卡與現場相簿｜${name} 您好：\n誠摯感謝您蒞臨參與順祥與小瑩的婚禮！我們已整理好婚禮現場高畫質照片與紀錄（Google Drive），歡迎點擊專屬感謝卡瀏覽與下載：\n${fullUrl}`
            : `📸 Thiệp Cảm Ơn & Album Ảnh Cưới｜Trân trọng cảm ơn ${name},\nThuận Tường & Tiểu Dinh xin gửi lời cảm ơn chân thành nhất đến ${name} đã đến chung vui cùng gia đình. Mời ${name} mở Thiệp Cảm Ơn và xem / tải ảnh kỷ niệm buổi tiệc trên Google Drive tại đây nhé:\n${fullUrl}`
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
      const msgBtnLabel = effectiveLang === "zh" ? "💬 Copy lời mời LINE" : "💬 Copy lời mời Zalo";

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
              <span class="guest-name-text js-guest-name" title="Bấm ✏️ Sửa tên để đổi tên khách (Link & QR giữ nguyên cố định)"></span>
              <button
                type="button"
                class="btn-adm js-edit-name-btn"
                style="height:26px; padding:0 8px; font-size:11.5px;"
                title="Sửa tên khách này (Link ?s=${slotCode} và mã QR đã in vẫn giữ nguyên cố định 100%)"
              >✏️ Sửa tên</button>
              <span class="js-edit-name-wrap" style="display:none; align-items:center; gap:5px;">
                <input
                  type="text"
                  class="slot-inline-input js-edit-name-input"
                  aria-label="Nhập tên mới cho thẻ #${slotNum}"
                  style="width:195px; height:30px; font-weight:700;"
                  placeholder="Nhập tên khách mới..."
                />
                <button type="button" class="btn-adm primary js-save-name-btn" style="height:30px; padding:0 10px; font-size:11.5px;">💾 Lưu</button>
                <button type="button" class="btn-adm js-cancel-name-btn" style="height:30px; padding:0 8px; font-size:11.5px;">Hủy</button>
              </span>
              <span class="lang-tag">${effectiveLang === "zh" ? "繁體中文" : "VI"}</span>
              <span class="lang-tag" title="Mã QR & Link cố định vĩnh viễn: ?s=${slotCode}">🔢 QR số ${slotNum} · Link cố định</span>
              ${statusBadgeHtml}
              <label class="guest-private-note-wrap ${privateNote ? "has-note" : ""}" title="Ghi chú riêng cho Cô Dâu & Chú Rể (Khách mời tuyệt đối KHÔNG thấy ghi chú này)">
                <span class="guest-private-note-icon" aria-hidden="true">📝</span>
                <input
                  type="text"
                  class="guest-private-note-input js-guest-note-input"
                  aria-label="Ghi chú riêng cho ${safeAttrName}"
                  placeholder="Ghi chú riêng (VD: Con dì Ý, bạn ĐH...)"
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
                  title="Số ghế (Pax) của khách/gia đình này trong bàn"
                />
              </div>
            </div>
            <div class="guest-url-line js-url-preview"></div>
          </div>

          <div class="guest-actions-col">
            <div class="guest-btn-group">
              <div class="mode-switch-pill" title="Chuyển đổi trực tiếp giữa Thiệp Mời, Chỉ Đường Ngày Cưới (Đẩy Bản Đồ lên đầu) và Thiệp Cảm Ơn ngay trên link cũ đã gửi">
                <button type="button" class="mode-switch-btn js-mode-invite ${effectiveMode === "invite" ? "is-active-invite" : ""}">💌 Thiệp Mời</button>
                <button type="button" class="mode-switch-btn js-mode-dir ${isDirEffective ? "is-active-dir" : ""}" title="Đẩy Sơ Đồ Đường Đi & Google Maps lên đầu trang, tự động mở sẵn bao thư">📍 Chỉ Đường</button>
                <button type="button" class="mode-switch-btn js-mode-ty ${isTyEffective ? "is-active-ty" : ""}">📸 Cảm Ơn</button>
              </div>
              <button type="button" class="btn-adm primary js-copy-link">📋 Copy Link</button>
              <button type="button" class="btn-adm js-copy-msg">${msgBtnLabel}</button>
              <button type="button" class="btn-adm js-open-guest-qr" title="Tạo & tải Mã QR đẹp riêng cho khách này">📱 Mã QR</button>
              <a class="btn-adm js-preview" target="_blank" rel="noopener" title="Mở xem thử (Không tính vào lượt xem)">👁️ Xem thử</a>
              <button type="button" class="btn-adm danger js-remove-guest" aria-label="Xóa tên ${safeAttrName} khỏi thẻ #${slotNum}" title="Xóa tên khách khỏi thẻ #${slotNum} (Đưa thẻ #${slotNum} về mục Chưa có tên)">✕</button>
            </div>
          </div>
        </div>
        <div class="guest-sessions-wrap js-sessions-wrap"></div>
      `;

      const nameSpanEl = card.querySelector(".js-guest-name");
      const editBtnEl = card.querySelector(".js-edit-name-btn");
      const editWrapEl = card.querySelector(".js-edit-name-wrap");
      const editInputEl = card.querySelector(".js-edit-name-input");
      const saveNameBtnEl = card.querySelector(".js-save-name-btn");
      const cancelNameBtnEl = card.querySelector(".js-cancel-name-btn");

      nameSpanEl.textContent = name;
      card.querySelector(".js-url-preview").textContent = fullUrl;
      card.querySelector(".js-preview").href = previewUrl;

      const openInlineRename = () => {
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
      const triggerGuestSeatChange = () => {
        updateGuestSeatOnServer(
          name,
          grpSelectEl ? grpSelectEl.value : "",
          tblSelectEl ? tblSelectEl.value : "",
          paxInputEl ? paxInputEl.value : "1",
          true
        );
      };
      if (grpSelectEl) grpSelectEl.addEventListener("change", triggerGuestSeatChange);
      if (tblSelectEl) tblSelectEl.addEventListener("change", triggerGuestSeatChange);
      if (paxInputEl) paxInputEl.addEventListener("change", triggerGuestSeatChange);

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
        if (rowTable) {
          slotPreviewParams.set("table", rowTable);
          if (rowGroup) slotPreviewParams.set("group", rowGroup);
          if (rowPax > 1) slotPreviewParams.set("pax", String(rowPax));
        }
        if (effectiveMode === "directions" || effectiveMode === "thankyou") {
          slotPreviewParams.set("mode", effectiveMode);
        }
        slotPreviewParams.set("notrack", "1");
        const previewUrl = `${base}?${slotPreviewParams.toString()}`;

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
        const triggerUSlotSeat = () => {
          setSlotSeat(
            n,
            uGrpSel ? uGrpSel.value : "",
            uTblSel ? uTblSel.value : "",
            uPaxInp ? uPaxInp.value : "1",
            true
          );
        };
        if (uGrpSel) uGrpSel.addEventListener("change", triggerUSlotSeat);
        if (uTblSel) uTblSel.addEventListener("change", triggerUSlotSeat);
        if (uPaxInp) uPaxInp.addEventListener("change", triggerUSlotSeat);

        
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
    const batchGroup = defaultAddGrpEl ? defaultAddGrpEl.value : "";
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

      // Find slot: keep existing slot if already assigned, or assign from next available
      let slotNum = existing && existing.slot ? existing.slot : neededSlots[idx];
      let slotCode = slotNum ? makeSlotCode(slotNum) : (existing && existing.slotCode ? existing.slotCode : "");

      const record = {
        name,
        lang: effectiveLang,
        mode: existing && existing.mode ? existing.mode : "invite",
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
          group: effectiveGrp
        });
      }
    });

    persistLocalGuests();
    persistLocalSlots();
    listArea.value = "";
    buildRows();
    if (typeof renderSlotsTable === "function") renderSlotsTable();
    if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
    updateAddGuestNextSlotHint();

    notify(`✨ Đã gán tên cho ${newOrUpdatedGuests.length} khách vào các số QR tiếp theo thành công!`);

    try {
      await fetch(`${apiBase}/api/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", guests: newOrUpdatedGuests })
      });
      for (const s of slotsToUpdate) {
        await fetch(`${apiBase}/api/slots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "set_name", code: s.code, name: s.name, lang: s.lang, note: s.note, group: s.group })
        }).catch(() => {});
      }
    } catch (_) {}
  }

  async function fetchAnalytics(showToast) {
    const subLabel = document.getElementById("stats-updated-label");
    try {
      const res = await fetch(`${apiBase}/api/stats?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
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
          if (globalDriveInput && globalSiteConfig.driveUrl) globalDriveInput.value = globalSiteConfig.driveUrl;
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
        fetch(`${apiBase}/api/guests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "add", guests: savedGuests })
        }).catch(() => {});
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
        <span class="country-pill">🇻🇳 VN: ${vnCount}</span>
        <span class="country-pill">🇹🇼 TW: ${twCount}</span>
        ${otherCount > 0 ? `<span class="country-pill">🌍 Khác: ${otherCount}</span>` : ""}
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
      subLabel.textContent = "Đang đồng bộ dữ liệu máy chủ...";
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
    try {
      const res = await fetch(`${apiBase}/api/reset`, { method: "POST" });
      if (res.ok) {
        await fetchAnalytics(false);
        notify("🗑️ Đã đặt bộ đếm lượt xem về 0!");
      }
    } catch (_) {
      notify("⚠️ Không thể kết nối máy chủ, vui lòng thử lại.");
    }
  });

  document.getElementById("btn-clear-guests").addEventListener("click", async () => {
    if (!savedGuests.length) return;
    if (!window.confirm("Bạn có chắc muốn xóa toàn bộ danh sách khách mời đã lưu không?")) return;
    savedGuests = [];
    persistLocalGuests();
    buildRows();
    if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
    try {
      await fetch(`${apiBase}/api/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" })
      });
    } catch (_) {}
    notify("🗑️ Đã xóa trống danh sách khách mời.");
  });

  document.getElementById("btn-save-global-config").addEventListener("click", async () => {
    const selectedMode = (globalTySelect && globalTySelect.value) || "invite";
    const payload = {
      globalMode: selectedMode,
      globalThankYou: selectedMode === "thankyou",
      globalDirections: selectedMode === "directions",
      driveUrl: globalDriveInput ? globalDriveInput.value.trim() : "",
      thankYouVI: globalTyViInput ? globalTyViInput.value.trim() : "",
      thankYouZH: globalTyZhInput ? globalTyZhInput.value.trim() : ""
    };
    try {
      const res = await fetch(`${apiBase}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        globalConfigLoadedOnce = false;
        await fetchAnalytics(false);
        notify(
          selectedMode === "thankyou"
            ? "📸 Đã bật Lời Cảm Ơn trên TẤT CẢ các link đã gửi!"
            : selectedMode === "directions"
              ? "📍 Đã bật Chế Độ Chỉ Đường Ngày Cưới (Đẩy Bản Đồ lên đầu) cho TẤT CẢ các link đã gửi!"
              : "💾 Đã lưu cài đặt chế độ link & Kho Ảnh!"
        );
      }
    } catch (_) {
      notify("⚠️ Không thể kết nối máy chủ, vui lòng thử lại.");
    }
  });

  document.getElementById("btn-generate").addEventListener("click", handleAddGuests);

  document.getElementById("btn-export-csv").addEventListener("click", () => {
    const rows = buildRows();
    const header = [
      "STT",
      "Ten Khach Moi",
      "Ghi Chu Rieng (Co Dau Chu Re)",
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
    if (layoutMode === "square_qr" || layoutMode === "square_qr_lg") {
      return {
        cols: 3,
        rows: 4,
        itemsPerSheet: 12,
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
        sheetWidth: "197mm",
        pageMargin: "6.5mm",
        cellPadding: "0",
        cellWidth: "auto",
        cellHeight: "auto",
        name: "Dải Bookmark Dọc Thon Dài (3.1×9cm • 18 dải/tờ A4)",
        shortName: "18 Dải Bookmark Dọc"
      };
    }
    return {
      cols: 4,
      rows: 5,
      itemsPerSheet: 20,
      sheetWidth: "197mm",
      pageMargin: "6.5mm",
      cellPadding: "1.8mm 2.2mm",
      cellWidth: "auto",
      cellHeight: "auto",
      name: "Thẻ Phụ Chữ Nhật Không Khung (4.6×5.4cm • 20 thẻ/tờ A4)",
      shortName: "20 Thẻ Phụ Chữ Nhật"
    };
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

      // Discreet Corner Index (#01, #14) or ornamental corner accents
      ctx.save();
      if (slotNum) {
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
          } else if (/^(anh|chị|bạn|em|cô|chú|bác|dì|ông|bà|gia đình)/i.test(raw)) {
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
      // Dòng 1: Lời mời / Tên khách (Font to, nổi bật, trang trọng)
      ctx.fillStyle = "#681115";
      const len1 = line1.length;
      const size1 = len1 > 28 ? 24 : len1 > 18 ? 28 : 33;
      ctx.font = capMode === "zh"
        ? `700 ${size1}px "Noto Serif TC", serif`
        : `700 ${size1}px "Be Vietnam Pro", sans-serif`;
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

      if (slotNum) {
        // Numbered QR bookmark:
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

    // Compute unassigned slots sequence without duplicating named guests' slots
    const usedSlotNums = new Set();
    ensureGuestSlotsNormalized();
    names.forEach((gName, pIdx) => {
      const matchedG = savedGuests.find(
        (g) => g && normalizeNameKey(g.name) === normalizeNameKey(gName)
      );
      const sNum = (matchedG && Number(matchedG.slot)) || pIdx + 1;
      usedSlotNums.add(sNum);
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
        const usedSlotNums = new Set();

        // 1. Render Personalized QR cards for each named guest
        ensureGuestSlotsNormalized();
        personalNames.forEach((gName, pIdx) => {
          const hasCjk = /[\u4e00-\u9fff]/.test(gName);
          const matchedG = savedGuests.find(
            (g) => g && normalizeNameKey(g.name) === normalizeNameKey(gName)
          );
          const slotNum = (matchedG && Number(matchedG.slot)) || pIdx + 1;
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
          cells.push(
            `<div class="sticker-cell"><img src="${dUrl}" alt="Thẻ QR #${slotNum} ${gName}" /></div>`
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
        const sheetsHtml = [];
        for (let i = 0; i < totalCount; i += cfg.itemsPerSheet) {
          const chunk = cells.slice(i, i + cfg.itemsPerSheet);
          const isLast = i + cfg.itemsPerSheet >= totalCount;
          sheetsHtml.push(
            `<div class="a4-sheet${isLast ? "" : " page-break"}">${chunk.join("")}</div>`
          );
        }

        const remainderDesc =
          fillMode === "numbered" && remainderCount > 0
            ? `${remainderCount} QR Đánh Số (#${String(firstRemSlot).padStart(2, "0")} → #${String(lastRemSlot).padStart(2, "0")})`
            : `${remainderCount} QR Chung`;

        win.document.open();
        win.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>In Tờ A4 Gộp (${personalNames.length} Có Tên + ${remainderDesc} = ${totalCount} Thẻ) — Thuận Tường & Tiểu Dinh</title>
  <style>
@page { size: A4 portrait; margin: ${cfg.pageMargin}; }
* {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
body {
  margin: 0;
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
.a4-sheet {
  width: ${cfg.sheetWidth};
  margin: 0 auto 20px;
  background: transparent;
  display: grid;
  grid-template-columns: repeat(${cfg.cols}, 1fr);
  gap: 0;
  border-top: 0.25mm solid #b07b72;
  border-left: 0.25mm solid #b07b72;
}
.a4-sheet.page-break {
  page-break-after: always;
  break-after: page;
}
.sticker-cell {
  border-right: 0.25mm solid #b07b72;
  border-bottom: 0.25mm solid #b07b72;
  padding: ${cfg.cellPadding};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${isPinterestStrip || isSquareQr ? "#faf8f4" : "transparent"};
  page-break-inside: avoid;
  break-inside: avoid;
}
.sticker-cell img {
  width: 100%;
  height: auto;
  display: block;
}
@media screen {
  .a4-sheet {
    background: transparent;
    box-shadow: 0 10px 28px rgba(0,0,0,0.08);
  }
}
@media print {
  body { background: transparent; }
  .print-toolbar { display: none !important; }
  .a4-sheet { width: 100%; margin: 0; padding: 0; box-shadow: none; background: transparent !important; }
}
  </style>
</head>
<body>
  <div class="print-toolbar">
<div>
  <strong>🖨️ Bản Dàn Trang A4 Đủ Số Lượng: ${personalNames.length} Thẻ Đã Có Tên + ${remainderDesc} = Tổng ${totalCount} chiếc (${sheetsHtml.length} tờ A4 • ${cfg.name})</strong>
  <div style="font-size:12.5px; color:#5c4747; margin-top:4px; line-height:1.5;">
    • Những khách đã có tên được xếp ở các ô đầu tiên, tiếp nối liền mạch bởi <strong>${remainderDesc}</strong> mà không trùng lặp số.<br/>
    • Khi bấm In / Lưu PDF nhớ chọn <strong>Tỷ lệ (Scale): Mặc định / 100%</strong>.
  </div>
</div>
<button class="print-btn" onclick="window.print()">🖨️ In Ngay / Lưu File PDF</button>
  </div>
  ${sheetsHtml.join("\n")}
</body>
</html>`);
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
      let stickersHtml = "";
      for (let i = 0; i < totalItems; i++) {
        stickersHtml += `<div class="sticker-cell"><img src="${printDataUrl}" alt="Thẻ Phụ QR Thiệp Cưới" /></div>`;
      }
      win.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>In Tờ A4 (${totalItems} ${cfg.name}) — Thuận Tường & Tiểu Dinh</title>
  <style>
@page { size: A4 portrait; margin: ${cfg.pageMargin}; }
* {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
body {
  margin: 0;
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
.a4-sheet {
  width: ${cfg.sheetWidth};
  margin: 0 auto 20px;
  background: transparent;
  display: grid;
  grid-template-columns: repeat(${cfg.cols}, 1fr);
  gap: 0;
  border-top: 0.25mm solid #b07b72;
  border-left: 0.25mm solid #b07b72;
}
.sticker-cell {
  border-right: 0.25mm solid #b07b72;
  border-bottom: 0.25mm solid #b07b72;
  padding: ${cfg.cellPadding};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${isPinterestStrip || isSquareQr ? "#faf8f4" : "transparent"};
  page-break-inside: avoid;
  break-inside: avoid;
}
.sticker-cell img {
  width: 100%;
  height: auto;
  display: block;
}
@media screen {
  .a4-sheet {
    background: transparent;
    box-shadow: 0 10px 28px rgba(0,0,0,0.08);
  }
}
@media print {
  body { background: transparent; }
  .print-toolbar { display: none !important; }
  .a4-sheet { width: 100%; margin: 0; padding: 0; box-shadow: none; background: transparent !important; }
}
  </style>
</head>
<body>
  <div class="print-toolbar">
<div>
  <strong>🖨️ Tờ A4 Gồm ${totalItems} Thẻ (${cfg.name})</strong>
  <div style="font-size:12.5px; color:#5c4747; margin-top:4px; line-height:1.5;">
    • <strong>Chống mất mép 100%:</strong> Đã căn chỉnh lề an toàn ở cả 4 cạnh tờ A4 để in trọn vẹn, không bị mất nét.<br/>
    • <strong>Tỷ lệ in:</strong> Khi bấm In / Lưu PDF nhớ chọn <strong>Tỷ lệ (Scale): Mặc định / 100%</strong>.
  </div>
</div>
<button class="print-btn" onclick="window.print()">🖨️ In Ngay / Lưu File PDF</button>
  </div>
  <div class="a4-sheet">${stickersHtml}</div>
</body>
</html>`);
      win.document.close();
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
  const slotAssignNumInput = document.getElementById("slot-assign-num");
  const slotAssignNameInput = document.getElementById("slot-assign-name");
  const slotAssignNoteInput = document.getElementById("slot-assign-note");
  const btnAssignSlot = document.getElementById("btn-assign-slot");
  const slotAssignPreview = document.getElementById("slot-assign-preview");
  const slotSearchInput = document.getElementById("slot-search-input");
  const slotTableBody = document.getElementById("slot-table-body");
  const btnJumpToSlots = document.getElementById("btn-jump-to-slots");

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

        merged[code] = {
          ...loc,
          ...r,
          name: mergedName,
          mode: mergedMode,
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
  }

  // Advance default print range if already printed earlier
  if (slotMaxPrinted > 0 && slotPrintFromInput && slotPrintToInput) {
    const nextStart = slotMaxPrinted + 1;
    slotPrintFromInput.value = String(nextStart);
    slotPrintToInput.value = String(nextStart + 17);
  }

  function getSlotUrl(num) {
    const code = makeSlotCode(num);
    const base = baseOrigin.replace(/\?.*$/, "");
    return `${base}?s=${encodeURIComponent(code)}`;
  }

  async function setSlotSeat(num, nextGroup, nextTable, nextPax, showToast = true) {
    const n = parseInt(num, 10);
    if (!n || n < 1 || n > 9999) return;
    const code = makeSlotCode(n);
    const prev = serverSlots[code] || {};
    const assignedName = prev.name ? String(prev.name).trim() : "";
    const lang = prev.lang || (/[\u4e00-\u9fff]/.test(assignedName) ? "zh" : "vi");
    const cleanPax = Math.max(1, Math.min(20, parseInt(nextPax || "1", 10) || 1));
    const cleanTable = String(nextTable || "");
    const tMeta = (cleanTable && seatingConfig.tableMeta && seatingConfig.tableMeta[cleanTable]) || {};
    const effectiveGroup = nextGroup || tMeta.group || "";

    serverSlots[code] = {
      num: n,
      name: assignedName,
      lang,
      mode: prev.mode || "invite",
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

    if (showToast) {
      const displayName = assignedName || `QR #${String(n).padStart(2, "0")}`;
      notify(
        cleanTable
          ? `🪑 Đã xếp "${displayName}" vào Bàn ${String(cleanTable).padStart(2, "0")} (${cleanPax} ghế)!`
          : `🪑 Đã gỡ "${displayName}" khỏi bàn tiệc!`
      );
    }

    try {
      const res = await fetch(`${apiBase}/api/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_seat",
          code,
          group: effectiveGroup,
          table: cleanTable,
          pax: cleanPax
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.slots) mergeServerSlots(data.slots);
        if (Array.isArray(data.savedGuests)) mergeServerGuests(data.savedGuests);
        renderSlotsTable();
        buildRows();
        if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
      }
    } catch (_) {}
  }

  async function setSlotMode(num, nextMode) {
    const n = parseInt(num, 10);
    if (!n || n < 1 || n > 9999) return;
    const code = makeSlotCode(n);
    const prev = serverSlots[code] || {};
    const assignedName = prev.name ? String(prev.name).trim() : "";
    const lang = prev.lang || (/[\u4e00-\u9fff]/.test(assignedName) ? "zh" : "vi");

    serverSlots[code] = {
      num: n,
      name: assignedName,
      lang,
      mode: nextMode,
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

    try {
      const res = await fetch(`${apiBase}/api/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_mode",
          code,
          mode: nextMode
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.slots) mergeServerSlots(data.slots);
        if (Array.isArray(data.savedGuests)) mergeServerGuests(data.savedGuests);
        renderSlotsTable();
        buildRows();
      }
    } catch (_) {}

    const targetLabel = assignedName ? `QR Số ${n} (${assignedName})` : `QR Số ${n}`;
    notify(
      nextMode === "thankyou"
        ? `📸 Đã bật "Thiệp Cảm Ơn" cho ${targetLabel}!`
        : nextMode === "directions"
          ? `📍 Đã bật "Chỉ Đường Ngày Cưới" cho ${targetLabel}!`
          : `💌 Đã chuyển ${targetLabel} về chế độ Thiệp Mời!`
    );
  }

  async function assignSlotByNumber(num, rawName, rawNote, showToast = true) {
    const n = parseInt(num, 10);
    if (!n || n < 1 || n > 9999) {
      notify("⚠️ Số QR không hợp lệ (hãy nhập từ 1 đến 9999).");
      return;
    }
    const code = makeSlotCode(n);
    const name = String(rawName || "").trim();
    const note = String(rawNote || "").trim();
    const prevSlot = serverSlots[code];

    if (!name) {
      // Clear slot assignment
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
      try {
        await fetch(`${apiBase}/api/slots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "clear", code })
        });
      } catch (_) {}
      if (showToast) notify(`🗑️ Đã xóa tên khách khỏi QR Số ${n}.`);
      return;
    }

    if (n > slotMaxPrinted) slotMaxPrinted = n;
    const hasHanzi = /[\u4e00-\u9fff]/.test(name);
    const lang = hasHanzi ? "zh" : "vi";

    // Detach old guest if reassigned to someone else
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
      group: preservedGroup,
      table: preservedTable,
      pax: preservedPax,
      assignedAt: new Date().toISOString()
    };
    const guestRecord = {
      name,
      lang,
      mode: preservedMode,
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
    updateSlotAssignPreview();
    if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();

    try {
      const res = await fetch(`${apiBase}/api/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          code,
          name,
          note: finalNote,
          lang,
          mode: preservedMode
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.slots) mergeServerSlots(data.slots);
        if (Array.isArray(data.savedGuests)) mergeServerGuests(data.savedGuests);
        renderSlotsTable();
        buildRows();
        if (typeof renderSeineFloorplan === "function") renderSeineFloorplan();
      }
    } catch (_) {}

    if (showToast) {
      notify(`✅ Đã gán QR Số ${n} cho khách "${name}"!`);
    }
  }

  function updateSlotAssignPreview() {
    if (!slotAssignPreview || !slotAssignNumInput) return;
    const n = parseInt(slotAssignNumInput.value, 10);
    if (!n || n < 1) {
      slotAssignPreview.textContent = "Gõ số QR (VD: 1, 2, 3...) để xem số đó đang trống hay đã gán cho ai.";
      slotAssignPreview.classList.remove("is-taken");
      return;
    }
    const code = makeSlotCode(n);
    const existing = serverSlots[code];
    if (existing && existing.name) {
      const k = normalizeNameKey(existing.name);
      const noteStr = guestNotesMap[k] || "";
      slotAssignPreview.textContent = `⚠️ QR Số ${n} hiện đang gán cho "${existing.name}"${noteStr ? ` (${noteStr})` : ""}. Nhập tên mới để đổi người khác.`;
      slotAssignPreview.classList.add("is-taken");
    } else {
      slotAssignPreview.textContent = `✨ QR Số ${n} đang trống — sẵn sàng gán tên khách!`;
      slotAssignPreview.classList.remove("is-taken");
    }
  }

  function renderSlotsTable() {
    const assignedCount = Object.values(serverSlots).filter((s) => s && s.name).length;
    if (badgeSlotsEl) badgeSlotsEl.textContent = String(assignedCount);
    if (!slotTableBody) return;

    let maxN = Math.max(TOTAL_INVITE_TARGET, slotMaxPrinted);
    Object.keys(serverSlots).forEach((code) => {
      const n = parseInt(code.split("-")[0], 10) || 0;
      if (n > maxN) maxN = n;
    });

    const q = (slotSearchInput ? slotSearchInput.value : "").trim().toLowerCase();
    const { occ: slotTableOccMap } = computeTableStats();
    slotTableBody.innerHTML = "";

    // Sort: Named QR numbers on top, Unnamed QR numbers below!
    const assignedNums = [];
    const unassignedNums = [];
    for (let n = 1; n <= maxN; n++) {
      const code = makeSlotCode(n);
      const s = serverSlots[code];
      if (s && s.name && String(s.name).trim()) {
        assignedNums.push(n);
      } else {
        unassignedNums.push(n);
      }
    }
    const orderedNums = assignedNums.concat(unassignedNums);
    const frag = document.createDocumentFragment();

    for (let idxOrder = 0; idxOrder < orderedNums.length; idxOrder++) {
      const n = orderedNums[idxOrder];
      const code = makeSlotCode(n);
      const slotObj = serverSlots[code] || null;
      const assignedName = slotObj && slotObj.name ? String(slotObj.name).trim() : "";
      const nameKey = assignedName ? normalizeNameKey(assignedName) : "";
      const matchedGuest = nameKey
        ? savedGuests.find((g) => normalizeNameKey(g.name) === nameKey)
        : null;
      const privateNote = String(
        (matchedGuest && matchedGuest.note) || (nameKey ? guestNotesMap[nameKey] : "") || ""
      ).trim();
      const rowGroup = String(
        (slotObj && slotObj.group) || (matchedGuest && matchedGuest.group) || ""
      ).trim();
      const rowTable = String(
        (slotObj && slotObj.table) || (matchedGuest && matchedGuest.table) || ""
      ).trim();
      const rowPax = Math.max(
        1,
        parseInt((slotObj && slotObj.pax) || (matchedGuest && matchedGuest.pax) || "1", 10) || 1
      );

      if (q) {
        const numMatch = String(n) === q || `số ${n}`.includes(q) || `#${n}` === q;
        const nameMatch = assignedName.toLowerCase().includes(q);
        const noteMatch = privateNote.toLowerCase().includes(q);
        const tblMatch = rowTable && (`bàn ${rowTable}` === q || `ban ${rowTable}` === q);
        if (!numMatch && !nameMatch && !noteMatch && !tblMatch) continue;
      }

      const unassignedLogKey = normalizeNameKey(`QR số ${n} (chưa gán tên)`);
      const sessions = nameKey
        ? (visitLogsByGuest[nameKey] || []).concat(visitLogsByGuest[unassignedLogKey] || [])
        : visitLogsByGuest[unassignedLogKey] || [];
      const hasOpened = sessions.length > 0;
      const anyOpenedEnv = sessions.some((s) => s.openedEnvelope);

      let statusHtml = `<span class="status-badge is-pending">⚪ Chưa gán tên</span>`;
      if (assignedName) {
        if (!hasOpened) {
          statusHtml = `<span class="status-badge is-pending">⏳ Đã gán • Chờ mở</span>`;
        } else if (anyOpenedEnv) {
          statusHtml = `<span class="status-badge is-opened">✨ Đã mở phong bì (${sessions.length} lần)</span>`;
        } else {
          statusHtml = `<span class="status-badge is-viewed">👀 Đã mở link (${sessions.length} lần)</span>`;
        }
      } else if (hasOpened) {
        statusHtml = `<span class="status-badge is-viewed">👀 Đã quét (${sessions.length} lần • Chưa gán tên)</span>`;
      }

      const slotUrl = getSlotUrl(n);
      const rawMode =
        (slotObj && slotObj.mode) ||
        (matchedGuest && matchedGuest.mode) ||
        "invite";
      const globalMode =
        globalSiteConfig.globalMode ||
        (globalSiteConfig.globalThankYou
          ? "thankyou"
          : globalSiteConfig.globalDirections
            ? "directions"
            : "invite");
      const effectiveMode =
        globalMode === "thankyou" || rawMode === "thankyou"
          ? "thankyou"
          : globalMode === "directions" || rawMode === "directions"
            ? "directions"
            : "invite";
      const isDirEffective = effectiveMode === "directions";
      const isTyEffective = effectiveMode === "thankyou";
      const slotPreviewParams = new URLSearchParams();
      slotPreviewParams.set("s", code);
      if (assignedName) slotPreviewParams.set("to", assignedName);
      if (rowTable) {
        slotPreviewParams.set("table", rowTable);
        if (rowGroup) slotPreviewParams.set("group", rowGroup);
        if (rowPax > 1) slotPreviewParams.set("pax", String(rowPax));
      }
      if (effectiveMode === "directions" || effectiveMode === "thankyou") {
        slotPreviewParams.set("mode", effectiveMode);
      }
      slotPreviewParams.set("notrack", "1");
      const previewUrl = `${baseOrigin.replace(/\?.*$/, "")}?${slotPreviewParams.toString()}`;

      const tr = document.createElement("tr");
      if (!assignedName) tr.className = "is-empty-slot";
      tr.innerHTML = `
        <td><span class="slot-num-pill">Số ${n}</span></td>
        <td>
          <input
            type="text"
            class="slot-inline-input js-slot-row-name"
            placeholder="Gõ tên khách cho QR Số ${n}..."
          />
        </td>
        <td>
          <input
            type="text"
            class="slot-inline-input js-slot-row-note"
            placeholder="Ghi chú riêng (VD: Bạn ĐH, cô chú...)"
          />
        </td>
        <td>
          <div class="seat-inline-bar">
            <select class="seat-inline-select js-slot-group-select">
              ${buildGroupSelectOptions(rowGroup)}
            </select>
            <select class="seat-inline-select ${rowTable ? "has-table" : ""} js-slot-table-select">
              ${buildTableSelectOptions(rowTable, slotTableOccMap)}
            </select>
            <input
              type="number"
              min="1"
              max="15"
              class="seat-inline-pax js-slot-pax-input"
              value="${rowPax}"
              title="Số ghế (Pax) của khách này"
            />
          </div>
        </td>
        <td>
          <div class="mode-switch-pill" title="Chuyển đổi trực tiếp giữa Thiệp Mời, Chỉ Đường Ngày Cưới và Thiệp Cảm Ơn cho QR Số ${n}">
            <button type="button" class="mode-switch-btn js-slot-mode-invite ${effectiveMode === "invite" ? "is-active-invite" : ""}">💌 Thiệp Mời</button>
            <button type="button" class="mode-switch-btn js-slot-mode-dir ${isDirEffective ? "is-active-dir" : ""}" title="Đẩy Sơ Đồ Đường Đi & Google Maps lên đầu trang, tự động mở sẵn bao thư">📍 Chỉ Đường</button>
            <button type="button" class="mode-switch-btn js-slot-mode-ty ${isTyEffective ? "is-active-ty" : ""}">📸 Cảm Ơn</button>
          </div>
        </td>
        <td>${statusHtml}</td>
        <td class="slot-actions">
          <div style="display:inline-flex; gap:5px; align-items:center;">
            <button type="button" class="btn-adm primary js-slot-save" title="Lưu tên khách cho Số ${n}">💾 Lưu</button>
            <button type="button" class="btn-adm js-slot-copy" title="Copy link của QR Số ${n}">📋 Link</button>
            <a class="btn-adm js-slot-preview" target="_blank" rel="noopener" title="Xem thử QR Số ${n}">👁️</a>
            ${assignedName ? `<button type="button" class="btn-adm danger js-slot-clear" title="Xóa tên khỏi Số ${n}">✕</button>` : ""}
          </div>
        </td>
      `;

      const nameInput = tr.querySelector(".js-slot-row-name");
      const noteInput = tr.querySelector(".js-slot-row-note");
      nameInput.value = assignedName;
      noteInput.value = privateNote;
      tr.querySelector(".js-slot-preview").href = previewUrl;

      const sGrpSel = tr.querySelector(".js-slot-group-select");
      const sTblSel = tr.querySelector(".js-slot-table-select");
      const sPaxInp = tr.querySelector(".js-slot-pax-input");
      const triggerSlotSeatChange = () => {
        setSlotSeat(
          n,
          sGrpSel ? sGrpSel.value : "",
          sTblSel ? sTblSel.value : "",
          sPaxInp ? sPaxInp.value : "1",
          true
        );
      };
      if (sGrpSel) sGrpSel.addEventListener("change", triggerSlotSeatChange);
      if (sTblSel) sTblSel.addEventListener("change", triggerSlotSeatChange);
      if (sPaxInp) sPaxInp.addEventListener("change", triggerSlotSeatChange);

      tr.querySelector(".js-slot-mode-invite").addEventListener("click", () => {
        setSlotMode(n, "invite");
      });
      tr.querySelector(".js-slot-mode-dir").addEventListener("click", () => {
        setSlotMode(n, "directions");
      });
      tr.querySelector(".js-slot-mode-ty").addEventListener("click", () => {
        setSlotMode(n, "thankyou");
      });

      const triggerSaveRow = () => {
        assignSlotByNumber(n, nameInput.value, noteInput.value, true);
      };

      tr.querySelector(".js-slot-save").addEventListener("click", triggerSaveRow);
      nameInput.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          triggerSaveRow();
        }
      });
      noteInput.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          triggerSaveRow();
        }
      });
      tr.querySelector(".js-slot-copy").addEventListener("click", () => {
        copyText(slotUrl, `📋 Đã copy link của QR Số ${n}!`);
      });
      const clearBtn = tr.querySelector(".js-slot-clear");
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          assignSlotByNumber(n, "", "", true);
        });
      }

      frag.appendChild(tr);
    }
    slotTableBody.appendChild(frag);
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
      renderLuxuryWeddingQR(false, {
        layoutMode,
        targetUrl: getSlotUrl(fromN),
        slotNum: fromN
      });
      notify(`📐 Đã chọn in từ Số ${fromN} → Số ${toN} (${count} chiếc = ${Math.ceil(count / cfg.itemsPerSheet)} tờ A4)!`);
    });
  });

  const slotFlapCenterStyle = document.getElementById("slot-flap-center-style");
  if (slotFlapCenterStyle) {
    slotFlapCenterStyle.addEventListener("change", () => {
      const fromN = Math.max(1, parseInt(slotPrintFromInput ? slotPrintFromInput.value : "1", 10) || 1);
      renderLuxuryWeddingQR(false, {
        layoutMode: "pinterest_strip",
        targetUrl: getSlotUrl(fromN),
        slotNum: fromN
      });
    });
  }

  if (slotPrintFromInput) {
    slotPrintFromInput.addEventListener("input", () => {
      const fromN = Math.max(1, parseInt(slotPrintFromInput.value || "1", 10) || 1);
      renderLuxuryWeddingQR(false, {
        layoutMode: "pinterest_strip",
        targetUrl: getSlotUrl(fromN),
        slotNum: fromN
      });
    });
  }

  if (slotAssignNumInput) {
    slotAssignNumInput.addEventListener("input", () => {
      updateSlotAssignPreview();
      const n = parseInt(slotAssignNumInput.value, 10);
      if (n >= 1) {
        const code = makeSlotCode(n);
        const existing = serverSlots[code];
        if (existing && existing.name && slotAssignNameInput && !slotAssignNameInput.value) {
          slotAssignNameInput.placeholder = `Đang gán: ${existing.name}`;
        } else if (slotAssignNameInput) {
          slotAssignNameInput.placeholder = "VD: Gia Đình Dì Ý hoặc 林子惟";
        }
      }
    });
  }

  if (btnAssignSlot) {
    btnAssignSlot.addEventListener("click", () => {
      const n = parseInt(slotAssignNumInput ? slotAssignNumInput.value : "0", 10);
      const name = slotAssignNameInput ? slotAssignNameInput.value.trim() : "";
      const note = slotAssignNoteInput ? slotAssignNoteInput.value.trim() : "";
      if (!n || n < 1) {
        notify("⚠️ Hãy nhập Số QR (VD: 1, 2, 3...)!");
        if (slotAssignNumInput) slotAssignNumInput.focus();
        return;
      }
      if (!name) {
        notify("⚠️ Hãy nhập Tên khách mời cần gán cho QR Số " + n + "!");
        if (slotAssignNameInput) slotAssignNameInput.focus();
        return;
      }
      assignSlotByNumber(n, name, note, true);
      // Advance to next number automatically for fast batch entry!
      if (slotAssignNumInput) slotAssignNumInput.value = String(n + 1);
      if (slotAssignNameInput) slotAssignNameInput.value = "";
      if (slotAssignNoteInput) slotAssignNoteInput.value = "";
      updateSlotAssignPreview();
      if (slotAssignNameInput) slotAssignNameInput.focus();
    });
  }

  [slotAssignNumInput, slotAssignNameInput, slotAssignNoteInput].forEach((inp) => {
    if (!inp) return;
    inp.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && btnAssignSlot) {
        ev.preventDefault();
        btnAssignSlot.click();
      }
    });
  });

  if (slotSearchInput) {
    slotSearchInput.addEventListener("input", renderSlotsTable);
  }

  if (btnPrintSlots) {
    btnPrintSlots.addEventListener("click", () => {
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
      const capMode = (qrCaptionStyle && qrCaptionStyle.value) || "bilingual";

      const win = window.open("", "_blank");
      if (!win) {
        notify("⚠️ Trình duyệt chặn cửa sổ bật lên. Hãy cho phép Popup để mở trang in A4 nhé!");
        return;
      }

      const itemsHtml = [];
      for (let n = fromN; n <= toN; n++) {
        const slotUrl = getSlotUrl(n);
        renderLuxuryWeddingQR(true, {
          layoutMode,
          targetUrl: slotUrl,
          capMode,
          guestText: "",
          slotNum: n
        });
        const dUrl = (isPinterestStrip || isSquareQr)
          ? qrCanvas.toDataURL("image/jpeg", 0.95)
          : qrCanvas.toDataURL("image/png");
        itemsHtml.push(
          `<div class="sticker-cell"><img src="${dUrl}" alt="Thẻ QR Số ${n}" /></div>`
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
      const sheetsHtml = [];
      for (let i = 0; i < totalCount; i += cfg.itemsPerSheet) {
        const chunk = itemsHtml.slice(i, i + cfg.itemsPerSheet);
        const isLast = i + cfg.itemsPerSheet >= totalCount;
        sheetsHtml.push(
          `<div class="a4-sheet${isLast ? "" : " page-break"}">${chunk.join("")}</div>`
        );
      }
      const numSheets = sheetsHtml.length;

      win.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>In ${numSheets} Tờ A4 Thẻ QR Đánh Số (Số ${fromN} → Số ${toN} • ${cfg.name}) — Thuận Tường & Tiểu Dinh</title>
  <style>
@page { size: A4 portrait; margin: ${cfg.pageMargin}; }
* {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
body {
  margin: 0;
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
.a4-sheet {
  width: ${cfg.sheetWidth};
  margin: 0 auto 20px;
  background: transparent;
  display: grid;
  grid-template-columns: repeat(${cfg.cols}, 1fr);
  gap: 0;
  border-top: 0.25mm solid #b07b72;
  border-left: 0.25mm solid #b07b72;
}
.a4-sheet.page-break {
  page-break-after: always;
  break-after: page;
}
.sticker-cell {
  border-right: 0.25mm solid #b07b72;
  border-bottom: 0.25mm solid #b07b72;
  padding: ${cfg.cellPadding};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${isPinterestStrip || isSquareQr ? "#faf8f4" : "transparent"};
  page-break-inside: avoid;
  break-inside: avoid;
}
.sticker-cell img {
  width: 100%;
  height: auto;
  display: block;
}
@media screen {
  .a4-sheet {
    background: transparent;
    box-shadow: 0 10px 28px rgba(0,0,0,0.08);
  }
}
@media print {
  body { background: transparent; }
  .print-toolbar { display: none !important; }
  .a4-sheet { width: 100%; margin: 0; padding: 0; box-shadow: none; background: transparent !important; }
}
  </style>
</head>
<body>
  <div class="print-toolbar">
<div>
  <strong>🖨️ Xuất In ${totalCount} Thẻ QR Đánh Số (#${String(fromN).padStart(2, "0")} → #${String(toN).padStart(2, "0")}) Gồm ${numSheets} Tờ A4 (${cfg.name})</strong>
  <div style="font-size:12.5px; color:#5c4747; margin-top:4px; line-height:1.5;">
    • <strong>Mã QR chuyên dụng:</strong> Mỗi thẻ có mã QR riêng và số thứ tự ở góc để đối soát với link cố định.<br/>
    • Khi bấm In / Lưu PDF nhớ chọn <strong>Tỷ lệ (Scale): Mặc định / 100%</strong>.
  </div>
</div>
<button class="print-btn" onclick="window.print()">🖨️ In Ngay / Lưu File PDF</button>
  </div>
  ${sheetsHtml.join("")}
</body>
</html>`);
      win.document.close();
    });
  }

  // =======================================================================
  // SẢNH SEINE (RIVERSIDE PALACE) INTERACTIVE SEATING FLOORPLAN
  // =======================================================================
  const badgeSeatedEl = document.getElementById("badge-seated-count");
  const seineTotalTablesInput = document.getElementById("seine-total-tables");
  const seineShowCompanionsChk = document.getElementById("seine-show-companions");
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
    try {
      await fetch(`${apiBase}/api/seating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seatingConfig)
      });
    } catch (_) {}
    if (showToast) notify("✅ Đã lưu cấu hình Sơ Đồ Bàn Tiệc Sảnh Seine!");
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
        ? `<div class="seine-table-tag${isDefaultTag ? " is-default-tag" : ""}" style="background:${grpInfo.bg}; color:${grpInfo.color};">${groupTagText}</div>`
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
          <span class="seine-l-door-badge">🚪 CỬA 2 ◀</span>
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
  updateSlotAssignPreview();
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
  