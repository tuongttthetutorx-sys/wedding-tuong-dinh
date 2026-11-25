# Hướng Dẫn Vận Hành Thiệp Cưới - Thuận Tường & Tiểu Dinh

## 1. Kiến trúc & Triển khai (Cloudflare Workers)

Dự án chạy bằng **Cloudflare Workers + Static Assets + Durable Object** (`WeddingAnalytics` lưu bằng SQLite):

- File cấu hình: `wrangler.jsonc`, `worker.js`, `js/config.js`
- Trang khách mời: `https://thuantuongtieudinh.io.vn/` (`index.html`)
- Trang quản lý (CRM & In QR): `https://thuantuongtieudinh.io.vn/link-khach-moi.html`

Lệnh triển khai lên Cloudflare:

```bash
npx wrangler deploy
```

### Bảo mật Trang Quản Lý (Khuyến nghị bật trước khi phát hành)

Các endpoint ghi/xóa trên `worker.js` yêu cầu header `X-Admin-Action: 1`, kiểm tra origin hợp lệ và token xác nhận cho thao tác phá hủy (`RESET_ANALYTICS`, `CLEAR_ALL_GUESTS`). Để khóa hoàn toàn quyền chỉnh sửa danh sách khách & bàn tiệc bằng mật khẩu:

```bash
npx wrangler secret put ADMIN_KEY
```

Sau khi đặt `ADMIN_KEY`, mở `/link-khach-moi.html` -> nhập khóa vào banner xác thực ở đầu trang (khóa được giữ tạm theo phiên trình duyệt trong `sessionStorage`).

---

## 2. Gửi thiệp & Quản lý QR cố định (`?s=`)

Mở trang quản lý `link-khach-moi.html` với 5 tab chính:

1. **Tab 1 - Khách mời & Tạo link:**
   - Mặc định hiển thị các khách **Đã có tên** để tránh rối danh sách phôi QR.
   - Bấm **Tạo link**, **Chép mẫu Zalo/LINE** hoặc gán nhanh **Bàn tiệc** (38 bàn Sảnh Seine) và **Chế độ Lễ Sáng**.
   - Nếu đổi tên khách hoặc đổi bàn sau khi đã in thiệp, bấm sửa tên ngay tại thẻ khách - mã ngắn `?s=...` và mã QR giữ nguyên không đổi.
   - Bấm `×` để xóa có hộp xác nhận + thanh **Hoàn tác** trong 6 giây.

2. **Tab 2 & Tab 3 - Theo dõi & Lời chúc:**
   - Xem tổng lượt mở thiệp, số khách xem sơ đồ bàn, lượt tải lịch `.ics` và lời chúc gửi từ trang chính.
   - Ghi chú `?notrack=1` khi mở xem thử để không cộng vào thống kê.

3. **Tab 4 - Phòng In QR Hàng Loạt (A4):**
   - Hỗ trợ lưới **6 / 8 / 12 / 15 / 18 / 20 / 24** tem mỗi tờ A4 (`Ctrl+P` / xuất PDF trực tiếp).
   - Hệ thống tự đồng bộ số trang A4 và tạo sẵn bộ mã slot `?s=...` cố định trước khi in.

4. **Tab 5 - Sơ đồ 38 Bàn (Sảnh Seine - Riverside Palace):**
   - Xem mật độ từng bàn theo thời gian thực (`cánh Tả`, `lối đi giữa`, `cánh Hữu`), cảnh báo khi xếp vượt số ghế chuẩn.

---

## 3. Các Tham Số & Chế Độ Hiển Thị

| Tham số URL | Giá trị | Tác dụng |
| --- | --- | --- |
| `?s=<code>` | Mã slot 4-6 ký tự | Gọi đúng tên khách, ngôn ngữ, bàn tiệc và chế độ từ Worker |
| `?lang=` | `vi` hoặc `zh` | Tiếng Việt hoặc 台灣繁體中文 (tự đưa Hỷ thiếp 囍 lên đầu khi chọn `zh`) |
| `?morning=` | `both`, `groom`, `bride` | Hiện lịch trình Lễ Sáng chi tiết & bản đồ chuyển 3 điểm (05:30 Nhà Trai -> ~06:30 Nhà Gái -> <09:00 về Nhà Trai -> 18:00 Riverside Palace; mặc định `bride` đi từ Nhà Gái lúc 06:00 -> về Nhà Trai ~09:00). Khách thường không thấy địa chỉ tư gia. |
| `?mode=` | `directions`, `thankyou` | `directions`: màn hình Ngày Cưới gọn nhẹ, đẩy Lịch trình + Bản đồ + Tra bàn tiệc lên đầu. `thankyou`: hiển thị Thiệp Cảm Ơn & nút mở Album Google Drive, tự ẩn đếm ngược/chỉ đường/bàn tiệc (chặn bật nếu URL Drive còn là link mẫu). |
| `?notrack=1` | `1` | Không ghi nhận lượt xem vào thống kê |

---

## 4. Dự phòng Mạng & Chạy Thử Local

- **Dự phòng bản đồ khi ngoại tuyến:** Nếu Google Maps nhúng bị chặn hoặc mất kết nối, thiệp tự chuyển sang bản đồ tĩnh (`assets/ban-do-riverside-palace.png`) kèm nút mở thẳng ứng dụng Google Maps và nút thử tải lại.
- **Xem thử trên máy tính:** Chạy file `Mo-Xem-Thu-Thiep.bat` hoặc mở local HTTP server. Khi truy cập qua `localhost` / `127.0.0.1`, nút **Xem thử** trên Admin mở đúng bản local để kiểm tra, còn link copy & mã QR luôn xuất domain chính thức `https://thuantuongtieudinh.io.vn/`.
