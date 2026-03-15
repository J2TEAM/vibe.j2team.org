# Web3 Tracker

Công cụ theo dõi danh mục đầu tư phi tập trung đa chuỗi mạnh mẽ, bảo mật và hiệu suất cao

## ✨ Tính năng nổi bật

- **Multi-Wallet Support**: Hỗ trợ quét đồng thời nhiều địa chỉ ví. Tự động phân loại tài sản theo từng ví với bộ lọc thông minh
- **Data Engine**: Tích hợp **Moralis Data API (v2.2)** - Cung cấp dữ liệu Token, giá USD thời gian thực và biến động thị trường 24h
- **9 Mạng lưới EVM**: Truy vấn song song các chuỗi phổ biến nhất: Ethereum, BSC, Polygon, Arbitrum, Base, Optimism, Linea, Avalanche, Fantom
- **Ghi nhớ địa chỉ ví**: Tùy chọn lưu trữ danh sách ví vào bộ nhớ trình duyệt, giúp tự động điền thông tin cho các phiên làm việc sau
- **Phân bổ tài sản (Portfolio Allocation)**: Biểu đồ trực quan hóa tỷ trọng tài sản theo từng chuỗi kèm theo phần trăm (%) phân bổ chi tiết
- **Bảo mật API Key**: Người dùng sử dụng API Key cá nhân, lưu trữ an toàn trong `localStorage` của trình duyệt, không thông qua server trung gian
- **Giao diện Chuyên nghiệp (Editorial Style)**: Thiết kế theo phong cách tạp chí công nghệ, hỗ trợ Responsive hoàn hảo trên Mobile

## 📂 Cấu trúc dự án

```
web3-tracker/
├── index.vue                   # Giao diện chính, bộ lọc và quản lý State UI
├── meta.ts                     # Cấu hình Metadata SEO và Routing
├── types.ts                    # Interface dữ liệu: TokenAsset, WalletStats...
├── composables/
│   └── useWeb3Scanner.ts       # Logic cốt lõi: Kết nối Moralis API, xử lý dữ liệu ví
└── README.md                   # Tài liệu hướng dẫn
```

## 🚀 Hướng dẫn sử dụng

1.  **Lấy API Key**: Đăng ký và lấy key miễn phí tại [Moralis Admin Panel](https://admin.moralis.com)
2.  **Cấu hình**: 
    - Mở phần **"Cấu hình Moralis API"** tại giao diện chính
    - Dán API Key của bạn và lưu lại
3.  **Bắt đầu quét**:
    - Nhập một địa chỉ ví hoặc danh sách nhiều ví (ngăn cách bằng dấu phẩy hoặc xuống dòng)
    - Nhấn **"Truy vấn"** để xem tổng tài sản đa chuỗi
4.  **Quản lý hạn mức**: 
    - Do chính sách bảo mật từ Moralis, thông tin hạn mức (Compute Units - CU) cần được kiểm tra trực tiếp tại [Moralis Dashboard](https://admin.moralis.com)

## ⚠️ Lưu ý

- Công cụ này chỉ truy vấn dữ liệu công khai trên Blockchain, không yêu cầu kết nối ví (Connect Wallet) hay ký giao dịch, đảm bảo an toàn tuyệt đối cho tài sản của bạn
- Hạn mức quét phụ thuộc vào gói (Plan) Moralis của API Key bạn đang sử dụng
