---
target: link-khach-moi.html (post-fix verification round 2)
total_score: 33
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 0
target_identity: "file:C:\\Users\\ADMIN\\Desktop\\Wedding-TuongDinh\\link-khach-moi.html"
target_fingerprint: "sha256:0dcf48f7632319ca1bf2521097461fe38dcaa47829b7da2e8ae311af3d11d5a7"
target_path: "C:\\Users\\ADMIN\\Desktop\\Wedding-TuongDinh\\link-khach-moi.html"
timestamp: 2026-11-25T09-08-36Z
slug: link-khach-moi-html
---
Method: 16 Worker Durable Object unit tests (`test-worker.mjs`) + Chrome CDP across `1280x800` & `390x844` (`verify-round2.mjs`) + `impeccable detect` (static & URL scans) + visual inspection of Tab 1, Tab 4, Tab 5 screenshots. Baseline: `18/40` (combined `19/40`).

## Design Health Score (Round 2)

| # | Heuristic | Round 1 | Round 2 | Delta & Verification Notes |
|---|-----------|---------|---------|--------------------------|
| 1 | Visibility of System Status | 2 | 4 | Stopped swallowing `catch (_) {}`; `adminApiFetch` verifies `res.ok`, surfaces explicit errors/rollbacks, handles `401` unlock banner, warns on table overcapacity, fixes `VN 0` / `TW 0` flag duplication. |
| 2 | Match System / Real World | 3 | 3 | Tab 4 dynamically synchronizes `6–24` cards-per-sheet copy & `35`/`18` A4 math; localhost "Xem thử" opens local preview while preserving production links for QR/Zalo. |
| 3 | User Control & Freedom | 2 | 4 | Added `confirm()` + 6s Undo toast on delete (`✕`), fixed `effectiveGroup` reset back to `""` even on labeled tables, raised stats capacity to `500` logs / `1000` guests. |
| 4 | Consistency & Standards | 2 | 3 | Eliminated contradictory `18`/`20`/`12` A4 numbers, enforced uniform CSRF/CORS/`ADMIN_KEY` across Worker admin APIs, stripped dead `#slot-*` code. |
| 5 | Error Prevention | 1 | 4 | `worker.js` enforces `X-Admin-Action: 1`, strict CORS origin allowlist, optional constant-time `ADMIN_KEY`, `RESET_ANALYTICS` / `CLEAR_ALL_GUESTS` confirmation tokens, and placeholder Drive URL stripping. |
| 6 | Recognition Rather Than Recall | 2 | 3 | Tab 1 defaults to `named` guests (`411` unnamed QR slots separated under chip), guest rows collapsed to `<= 5` controls + `.js-row-drawer`. |
| 7 | Flexibility & Efficiency | 3 | 3 | Tab 1 bulk filtering, Tab 4 dynamic preset preview, and Tab 5 Sảnh Seine inspector work cleanly at `0px` horizontal overflow across desktop & mobile. |
| 8 | Aesthetic & Minimalist Design | 2 | 3 | Flattened nested Tab 1 cards (`border-radius: 0`; `nested-cards` cut from `53–54x` down to `1` desktop / `3` mobile), fixed mobile `390px` Tab 4 `<select>`/`button` clipping, raised Tab 5 Seine mobile aisle (`9.5px`) & table (`10.5px`) legibility. |
| 9 | Error Recovery | 1 | 3 | 6s Undo toast restores deleted guests cleanly on-click; failed API writes preserve prior state and inform admin clearly. |
| 10 | Help & Documentation | 2 | 3 | Updated `HUONG_DAN_SU_DUNG.md` accurately covers Cloudflare Worker, `?s=`, Morning Ceremony `both|groom|bride`, Tab 4 A4 presets, and `wrangler secret put ADMIN_KEY`. |
| **Total** | | **18 / 40** | **33 / 40** | **Solid (`+15` pts · `P0: 0`, `P1: 0`)** |

## Verification Metrics

- `test-worker.mjs`: `16/16` unit tests passing (`403` missing CSRF/bad Origin, Origin reflection, `401` `ADMIN_KEY` enforcement while public routes stay `200`, `mode="directions"` tracking preservation, `450+` stats capacity, placeholder Drive URL sanitization, `update_seat` group reset, confirmation tokens).
- Chrome CDP round 2 (`verify-round2.mjs`): Tab 1 default `named`, `<= 5` controls, drawer toggle, delete + Undo restore, `0px` overflow desktop & mobile (`selRight: 367`, `btnRight: 367` inside `390px`), Tab 4 `35` -> `18` sheet math, Tab 5 aisle `9.5px` / table `10.5px`, `0` console/page errors.
- `impeccable detect`: `URL admin desktop 1280x800` = `3` findings (`nested-cards:1`, `cream-palette:1`, `codex-grid-background:1`); `URL admin mobile 390x844` = `5` findings (`nested-cards:3`, `cream-palette:1`, `codex-grid-background:1`).
