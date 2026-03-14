# 🎲 Dice Game

Dự án Dice Game (Quay số) được xây dựng với mục tiêu mang lại trải nghiệm giải trí công bằng, minh bạch và giao diện hiện đại

## ✨ Tính năng nổi bật

1. **Hệ thống Provably Fair (Công bằng tuyệt đối):**
   - Sử dụng thuật toán HMAC-SHA256 để đảm bảo kết quả hoàn toàn ngẫu nhiên và không thể can thiệp
   - Người chơi có thể tự kiểm tra (Verify) tính minh bạch của mỗi ván đấu thông qua Client Seed, Server Seed và Nonce

2. **Chế độ chơi đa dạng:**
   - **Manual (Thủ công):** Tự mình điều chỉnh ngân sách và dự đoán
   - **Auto (Tự động):** Thiết lập chiến thuật thông minh (tăng/giảm % khi thắng hoặc thua, dừng khi đạt mục tiêu hoặc cắt lỗ)

3. **Giao diện Wheel:**
   - Vòng quay trực quan hiển thị vùng Thắng (Xanh) và vùng Thua (Đỏ)
   - "Mũi giáo" (The Spear) chỉ định kết quả sắc lẹm, thay đổi màu sắc theo trạng thái thắng thua

4. **Trải nghiệm người dùng đỉnh cao:**
   - **Integrated Slider:** Phóng đại thanh trượt giúp thao tác dự đoán cực kỳ mượt mà
   - **Intelligence Board:** Thống kê trực tiếp số trận thắng, thua và tỷ lệ thắng trong phiên làm việc
   - **Responsive:** Tối ưu hóa hiển thị hoàn hảo trên các thiết bị di động
   - **History & Logs:** Lưu trữ lịch sử chi tiết, hỗ trợ tra cứu nhanh chóng

5. **Hướng dẫn & Cảnh báo:**
   - Tích hợp bộ hướng dẫn chơi bằng tiếng Việt trực quan
   - Modal cảnh báo trách nhiệm khi truy cập lần đầu nhằm đảm bảo mục tiêu giải trí lành mạnh

## 📁 Cấu trúc thư mục

```text
dice/
├── components/          # Các thành phần UI (Modal, History, v.v.)
│   ├── FairnessModal.vue  # Modal kiểm tra công bằng
│   └── HistoryList.vue    # Bảng lịch sử ván đấu
├── composables/        # Logic xử lý chính (Reused logic)
│   └── useDiceGame.ts  # State management cho toàn bộ logic game
├── utils/              # Các hàm bổ trợ
│   └── crypto.ts       # Xử lý thuật toán mã hóa SHA-256
├── types.ts            # Định nghĩa kiểu dữ liệu TypeScript
├── meta.ts             # Metadata của trang (Author, Category)
└── index.vue           # Trang chính (Main Layout & UI)
```

## ⚠️ Lưu ý quan trọng

Đây là trò chơi mô phỏng, **không phải nền tảng cờ bạc**. Số dư trong game không có giá trị tiền tệ, không thể quy đổi hay rút tiền. Mục đích duy nhất của dự án là trình diễn công nghệ và giải trí