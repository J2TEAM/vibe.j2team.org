# 🎲 DICE (Provably Fair)

Trò chơi xúc xắc minh bạch dựa trên thuật toán mã hóa

## 🚀 Tính năng chính

- **Cơ chế Provably Fair**: Sử dụng HMAC-SHA512 để đảm bảo kết quả hoàn toàn ngẫu nhiên và không thể can thiệp. Người dùng có thể kiểm tra lại mọi ván đấu
- **Slider trượt**: Điều chỉnh ngưỡng dự đoán (Prediction) từ 2 đến 98
- **Hiệu ứng Big Win**: Hiệu ứng bùng cháy toàn màn hình khi thắng ở các ván có tỉ lệ thấp (<= 10%)
- **Responsive**: Giao diện tối ưu hoàn hảo cho cả thiết bị di động và máy tính
- **Lịch sử ván đấu**: Theo dõi kết quả gần đây và xem chi tiết lịch sử đầy đủ
- **Point ảo**: Chơi bằng POINT miễn phí (1000 POINT khởi đầu), không có giá trị tiền tệ thật

## 🛠 Công nghệ sử dụng

- **Framework**: Vue.js 3 (Composition API)
- **Styling**: Tailwind CSS
- **Animation**: CSS Keyframes & Tailwind Animations
- **Crypto**: Web Crypto API (SubtleCrypto)

## 📁 Cấu trúc thư mục

- `components/`: Chứa các component như `FairnessModal` và `HistoryList`
- `composables/`: Logic game chính tách biệt (`useDiceGame.ts`)
- `utils/`: Các hàm mã hóa (`crypto.ts`)
- `types.ts`: Định nghĩa kiểu dữ liệu TypeScript

## 📖 Cách triển khai trong dự án

Trang Dice được thiết kế như một module độc lập trong thư mục `src/views/dice`. Để sử dụng, chỉ cần cấu hình route trỏ đến `index.vue`

---

_Vibe code bởi mhqb365.com_
