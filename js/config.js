/* ==========================================================================
   CẤU HÌNH THIỆP CƯỚI: TRIỆU THUẬN TƯỜNG & LƯ TIỂU DINH (06.01.2027)
   Bạn có thể chỉnh sửa link nhạc nền tại đây.
   ========================================================================== */
window.WEDDING_CONFIG = {
  groomName: "Triệu Thuận Tường",
  brideName: "Lư Tiểu Dinh",
  shortCouple: "Thuận Tường & Tiểu Dinh",
  weddingDateISO: "2027-01-06T18:00:00+07:00",
  ceremonyDateISO: "2027-01-06T05:30:00+07:00",
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
    ceremonyTime: "05:30",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Riverside+Palace+360D+Ben+Van+Don+Ho+Chi+Minh",
    googleMapsEmbed: "https://maps.google.com/maps?q=Riverside%20Palace%20360D%20B%E1%BA%BFn%20V%C3%A2n%20%C4%90%E1%BB%93n%20H%E1%BB%93%20Ch%C3%AD%20Minh&t=&z=16&ie=UTF8&iwloc=&output=embed"
  },

  /* Địa chỉ tư gia & lộ trình chi tiết dành riêng cho khách mời tham dự Lễ Sáng (05:30) */
  morningVenues: {
    groom: {
      nameVI: "Tư Gia Nhà Trai",
      nameZH: "男方府上（新郎家）",
      addressVI: "80/99/7 Đường Hoàng Ngân, Phường Phú Định, TP. Hồ Chí Minh",
      addressZH: "胡志明市富定坊黃銀街 80/99/7 號（80/99/7 Đường Hoàng Ngân, P. Phú Định）",
      landmarkVI: "Gần đại lộ Võ Văn Kiệt & Khách sạn La Chateau",
      landmarkZH: "鄰近武文傑大道（Võ Văn Kiệt）與 La Chateau 飯店",
      mapPinUrl: "https://share.google/gwDmGCmMs2WfCNkfK",
      directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=80%2F99%2F7+%C4%90%C6%B0%E1%BB%9Dng+Ho%C3%A0ng+Ng%C3%A2n,+Ph%C3%BA+%C4%90%E1%BB%8Bnh,+H%E1%BB%93+Ch%C3%AD+Minh",
      embedUrl: "https://maps.google.com/maps?q=80/99/7+%C4%90%C6%B0%E1%BB%9Dng+Ho%C3%A0ng+Ng%C3%A2n,+Ph%C3%BA+%C4%90%E1%BB%8Bnh,+H%E1%BB%93+Ch%C3%AD+Minh&t=&z=17&ie=UTF8&iwloc=&output=embed"
    },
    bride: {
      nameVI: "Tư Gia Nhà Gái",
      nameZH: "女方府上（新娘家）",
      addressVI: "302 Chung cư Âu Cơ (Lô D), Phường Hòa Bình, TP. Hồ Chí Minh",
      addressZH: "胡志明市和平坊 Âu Cơ 公寓 D 棟 302 室（302 Chung cư Âu Cơ, Lô D）",
      mapAddressVI: "279/005 Lô D Trịnh Đình Trọng, Phường Hòa Bình, TP. Hồ Chí Minh",
      mapAddressZH: "地圖定位入口：279/005 Lô D Trịnh Đình Trọng, P. Hòa Bình",
      mapNoteVI: "Vị trí Google Maps chuẩn nằm ở đường Trịnh Đình Trọng (tìm \"302 Chung cư Âu Cơ\" trên Maps không ra đúng vị trí).",
      mapNoteZH: "Google 地圖精準入口定位於 Trịnh Đình Trọng 街（直接搜尋 302 Chung cư Âu Cơ 易偏移，請直接點擊導航）。",
      lat: 10.7743392,
      lng: 106.6442479,
      mapPinUrl: "https://maps.app.goo.gl/Aa97a3aPuXLTLUZw6",
      directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=10.7743392,106.6442479",
      embedUrl: "https://maps.google.com/maps?q=10.7743392,106.6442479&t=&z=17&ie=UTF8&iwloc=&output=embed"
    },
    routeGroomToBrideUrl:
      "https://www.google.com/maps/dir/?api=1&origin=80%2F99%2F7+%C4%90%C6%B0%E1%BB%9Dng+Ho%C3%A0ng+Ng%C3%A2n,+Ph%C3%BA+%C4%90%E1%BB%8Bnh,+H%E1%BB%93+Ch%C3%AD+Minh&destination=10.7743392,106.6442479&travelmode=driving",
    routeBrideToGroomUrl:
      "https://www.google.com/maps/dir/?api=1&origin=10.7743392,106.6442479&destination=80%2F99%2F7+%C4%90%C6%B0%E1%BB%9Dng+Ho%C3%A0ng+Ng%C3%A2n,+Ph%C3%BA+%C4%90%E1%BB%8Bnh,+H%E1%BB%93+Ch%C3%AD+Minh&travelmode=driving",
    routeFullDayUrl:
      "https://www.google.com/maps/dir/?api=1&origin=80%2F99%2F7+%C4%90%C6%B0%E1%BB%9Dng+Ho%C3%A0ng+Ng%C3%A2n,+Ph%C3%BA+%C4%90%E1%BB%8Bnh,+H%E1%BB%93+Ch%C3%AD+Minh&waypoints=10.7743392,106.6442479&destination=Riverside+Palace+360D+Ben+Van+Don+Ho+Chi+Minh&travelmode=driving"
  },

  /* Nhạc nền mặc định: Tặng Em Đoá Hoa Hồng (assets/tang-em-doa-hoa-hong.mp3).
     Nếu muốn đổi sang bài MP3 khác, chỉ cần chép file vào thư mục assets/ và sửa tên file bên dưới: */
  customAudioSrc: "assets/tang-em-doa-hoa-hong.mp3?v=43",

  /* ==========================================================================
     QUẢN LÝ TRUY CẬP & CHẾ ĐỘ THIỆP CẢM ƠN SAU NGÀY CƯỚI (06.01.2027)
     - isPublished: true (mở thiệp bình thường) | false (tạm đóng/khóa thiệp)
     - thankYouMode: false (Thiệp Mời) | true (bật Thiệp Cảm Ơn + Kho Ảnh cho toàn bộ khách)
       (Mẹo: Có thể thêm ?mode=thankyou vào cuối link để mở chế độ Thiệp Cảm Ơn bất kỳ lúc nào)
     - googleDrivePhotoUrl: Dán link thư mục Google Drive chứa ảnh/video buổi tiệc vào đây
     ========================================================================== */
  isPublished: true,
  thankYouMode: false,
  googleDrivePhotoUrl: "",
  thankYouMessageVI:
    "Sự hiện diện, lời chúc phúc và tình cảm nồng ấm của Quý Khách trong ngày chung đôi 06.01.2027 là niềm vinh hạnh và món quà vô giá đối với gia đình chúng tôi. Thuận Tường & Tiểu Dinh xin gửi lời cảm ơn chân thành nhất, kính chúc Quý Khách cùng Gia đình luôn dồi dào sức khỏe, bình an và hạnh phúc!",
  thankYouMessageZH:
    "誠摯感謝您於 2027 年 1 月 6 日蒞臨參與我們的婚禮，您的祝福與陪伴是我們最珍貴的禮物。順祥 & 小瑩 謹致上最深切的謝意，敬祝 闔家平安、身體健康、萬事如意！"
};
