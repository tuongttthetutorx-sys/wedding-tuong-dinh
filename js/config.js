/* ==========================================================================
   CẤU HÌNH THIỆP CƯỚI: TRIỆU THUẬN TƯỜNG & LƯ TIỂU DINH (06.01.2027)
   Bạn có thể chỉnh sửa link nhạc nền tại đây.
   ========================================================================== */
window.WEDDING_CONFIG = {
  groomName: "Triệu Thuận Tường",
  brideName: "Lư Tiểu Dinh",
  shortCouple: "Thuận Tường & Tiểu Dinh",
  weddingDateISO: "2027-01-06T18:00:00+07:00",
  ceremonyDateISO: "2027-01-06T06:00:00+07:00",
  displayDate: "06.01.2027",
  lunarDateVI: "Nhằm ngày 29 tháng 11 năm Bính Ngọ",
  lunarDateZH: "農曆 二〇二六年十一月二十九日（星期三）",

  venue: {
    name: "RIVERSIDE PALACE",
    hallVI: "Sảnh Seine",
    hallZH: "Seine 宴會廳",
    addressVI: "360D Bến Vân Đồn, P. Vĩnh Hội, TP. Hồ Chí Minh",
    addressZH: "胡志明市永會坊檳雲屯街 360D 號",
    welcomeTime: "18:00",
    banquetTime: "19:00",
    ceremonyTime: "06:00",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Riverside+Palace+360D+Ben+Van+Don+Ho+Chi+Minh",
    googleMapsEmbed: "https://maps.google.com/maps?q=Riverside%20Palace%20360D%20B%E1%BA%BFn%20V%C3%A2n%20%C4%90%E1%BB%93n%20H%E1%BB%93%20Ch%C3%AD%20Minh&t=&z=16&ie=UTF8&iwloc=&output=embed"
  },

  /* Nhạc nền mặc định: Bản hòa tấu Acoustic Grand Piano, Harp & Strings — Canon in D (assets/wedding-canon.mp3).
     Nếu muốn đổi sang bài MP3 khác, chỉ cần chép file vào thư mục assets/ và sửa tên file bên dưới: */
  customAudioSrc: "assets/wedding-canon.mp3",

  /* ==========================================================================
     QUẢN LÝ TRUY CẬP & CHẾ ĐỘ THIỆP CẢM ƠN SAU NGÀY CƯỚI (06.01.2027)
     - isPublished: true (mở thiệp bình thường) | false (tạm đóng/khóa thiệp)
     - thankYouMode: false (Thiệp Mời) | true (bật Thiệp Cảm Ơn + Kho Ảnh cho toàn bộ khách)
       (Mẹo: Có thể thêm ?mode=thankyou vào cuối link để mở chế độ Thiệp Cảm Ơn bất kỳ lúc nào)
     - googleDrivePhotoUrl: Dán link thư mục Google Drive chứa ảnh/video buổi tiệc vào đây
     ========================================================================== */
  isPublished: true,
  thankYouMode: false,
  googleDrivePhotoUrl: "https://drive.google.com/drive/folders/1ExampleWeddingPhotosTuongDinh2027",
  thankYouMessageVI:
    "Sự hiện diện, lời chúc phúc và tình cảm nồng ấm của Quý Khách trong ngày chung đôi 06.01.2027 là niềm vinh hạnh và món quà vô giá đối với gia đình chúng tôi. Thuận Tường & Tiểu Dinh xin gửi lời cảm ơn chân thành nhất, kính chúc Quý Khách cùng Gia đình luôn dồi dào sức khỏe, bình an và hạnh phúc!",
  thankYouMessageZH:
    "誠摯感謝您於 2027 年 1 月 6 日蒞臨參與我們的婚禮，您的祝福與陪伴是我們最珍貴的禮物。順祥 & 小瑩 謹致上最深切的謝意，敬祝 闔家平安、身體健康、萬事如意！"
};
