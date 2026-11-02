# 囍 Thiệp Cưới Online — Triệu Thuận Tường & Lư Tiểu Dinh (06.01.2027)

Bộ thiệp cưới Web được chuyển thể **nguyên bản 100% nét vẽ vector & vân giấy mỹ thuật** từ bộ file Illustrator (`Ruột Thiệp(5)(chỉ sửa trang 3).ai` & `Vỏ 100c.ai`) do chính Cô dâu **Tiểu Dinh** & Chú rể **Thuận Tường** tự tay thiết kế.

---

## 1. Mở xem ngay trên máy tính
- Bạn có thể bấm đúp trực tiếp vào file **`index.html`** (hoặc **`Mo-Xem-Thu-Thiep.bat`**) trong thư mục `Wedding-TuongDinh` ngoài Desktop để mở xem ngay trên trình duyệt — không cần cài đặt thêm bất kỳ phần mềm nào!
- Mở file **`link-khach-moi.html`** để gõ danh sách khách mời → tự động tạo link riêng viết tên từng khách lên vỏ phong bì & dòng chấm *"Trân trọng kính mời..."* (hỗ trợ cả Tiếng Việt & Tiếng Hoa `?lang=zh`).

---

## 2. Cấu trúc các tính năng & hiệu ứng đã tích hợp
1. **Phong bì đỏ đô 3D (`Vỏ 100c`)**:
   - Hiển thị tên khách mời viết tay trên dòng chấm mặt trước.
   - Bấm **"Lật xem mặt sau vỏ thiệp"** để xem con dấu sáp `囍 T&D` và chữ ký *"personally designed by the Bride & Groom — Dinh and Tuong"*.
   - Bấm **"Chạm Mở Thiệp Mời"** (hoặc chạm vào phong bì) để rút thiệp giấy mỹ thuật ra kèm tiếng chuông & nhạc nền lãng mạn.
2. **Trọn bộ 3 tờ Ruột Thiệp sống động**:
   - **Tờ 01 (Mời tiệc Riverside Palace - Sảnh Seine):** Pháo hoa nở lấp lánh, dải đèn vàng cổng hoa nhấp nháy, Cô dâu Chú rể và **5 bé cún (`Xíu Xíu`, `KiKi`, `Chip`, `Dâu`, `Cherry`)** lắc lư dễ thương — **chạm vào từng bé cún hoặc Cô dâu Chú rể sẽ nảy tim & hiện lời chào riêng!**
   - **Tờ 02 (Lễ Thành Hôn & Chuyện tình 7.5 năm):** 3 ngọn lửa nến lung linh thật trên chân nến, bọt champagne bay nhẹ, viền chữ tiếng Anh 4 cạnh hiện tuần tự theo chiều kim đồng hồ + ngăn mở rộng đọc bản dịch Tiếng Việt & Tiếng Hoa dễ dàng trên điện thoại.
   - **Tờ 03 (Hỷ Thiếp Truyền Thống chữ Hoa `囍 永結同心`):** Chim hạc bay nhẹ, dải lụa gợn sóng, các cột chữ Hán hiện tuần tự từ **Phải sang Trái** đúng chuẩn cổ điển, khóm trúc đỏ đung đưa trong gió + bản dịch Tiếng Việt.
3. **Song ngữ Việt – Hoa (`VI` / `中文` & `?lang=zh`)**:
   - Khi bấm nút **`中文`** ở góc trên hoặc gửi link có `&lang=zh` cho khách người Hoa, tờ **Hỷ Thiếp chữ Hoa (Trang 3)** tự động được đưa lên vị trí đầu tiên và toàn bộ giao diện (Đếm ngược, Bản đồ, Lời chúc) chuyển sang chữ Hoa phồn thể trang trọng.
4. **Đếm ngược 06.01.2027 + Lưu Lịch + Bản đồ Google Maps + Sổ Lưu Bút RSVP**.

---

## 3. Đổi bài hát MP3 yêu thích (Tuỳ chọn)
Mặc định thiệp đã tích hợp sẵn bộ hộp nhạc Piano Waltz lãng mạn (chạy mượt cả khi không có mạng). Nếu hai bạn muốn phát một bài hát `.mp3` riêng:
1. Chép file nhạc (ví dụ `nhac-cuoi.mp3`) vào thư mục `assets/`.
2. Mở file `js/config.js` bằng Notepad, sửa dòng:
   ```js
   customAudioSrc: "assets/nhac-cuoi.mp3",
   ```

---

## 4. Đưa thiệp lên mạng miễn phí trong 30 giây (Để gửi Zalo / Messenger)
- **Cách dễ nhất (Netlify Drop / Cloudflare Pages):**
  1. Truy cập [https://app.netlify.com/drop](https://app.netlify.com/drop) (hoặc Cloudflare Pages / Vercel).
  2. Kéo thả nguyên thư mục **`Wedding-TuongDinh`** ngoài Desktop vào ô tải lên.
  3. Bạn sẽ có ngay đường link `https://ten-cua-ban.netlify.app` (có thể đổi sang tên đẹp như `https://tuongdinh-wedding.netlify.app`).
  4. Mở `https://tuongdinh-wedding.netlify.app/link-khach-moi.html` để tạo hàng loạt link mời riêng cho từng khách và gửi qua Zalo / Messenger (khi dán link vào Zalo sẽ tự hiện ảnh bìa phong bì đỏ rất sang!).

