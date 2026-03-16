# Blackjack Game (Xì Dách) - VOL.01 / 2026

Dự án này là một trò chơi Blackjack (Xì Dách) được xây dựng bằng Vue 3, TypeScript và Tailwind CSS, tuân thủ các yêu cầu trong `GEMINI.md`.

## 🚀 Chức năng chính

- **Luật chơi chuẩn:** Blackjack với các quy tắc cơ bản (Dealer rút đến 17, Ace là 1 hoặc 11).
- **Hệ thống đặt cược:** Người chơi bắt đầu với $1000 và có thể đặt cược linh hoạt.
- **Giao diện hiện đại:** Thiết kế lấy cảm hứng từ Duel, sử dụng Tailwind CSS cho phong cách tối giản và sang trọng.
- **Responsive:** Hiển thị tốt trên cả máy tính và điện thoại di động.
- **Hiệu ứng mượt mà:** Sử dụng Vue transitions và CSS 3D transforms cho việc lật bài.

## 📁 Cấu trúc thư mục

```text
blackjack/
├── components/          # Các component giao diện
│   ├── BlackjackTable.vue  # Bàn chơi chính
│   ├── PlayingCard.vue     # Component quân bài (lật 3D)
│   └── BetControl.vue      # Giao diện đặt cược
├── composables/         # Logic xử lý (Game engine)
│   └── useBlackjack.ts     # Hook điều khiển trạng thái game
├── types/               # Định nghĩa kiểu dữ liệu
│   └── blackjack.ts
├── index.vue            # Trang chính (Page entry)
├── meta.ts              # Metadata của trang
└── README.MD            # Hướng dẫn dự án
```

## 🛠 Triển khai

Để tích hợp trang này vào dự án chính:
1. Đảm bảo Tailwind CSS đã được cấu hình.
2. Import `index.vue` vào hệ thống routing của bạn.
3. Các file ảnh hỗ trợ (nếu có) cần được đặt đúng đường dẫn.

## 📝 Nhật ký thay đổi (Versioning)

### v1.0.0 (2026-03-10)
- Khởi tạo dự án Blackjack.
- Triển khai logic game cơ bản.
- Hoàn thiện giao diện Table và Card.
- Thêm nút Home và Back to Top.
- Hỗ trợ responsive mobile.

---
*Ghi chú: Project này được thực hiện độc lập trong thư mục `blackjack` theo yêu cầu.*
