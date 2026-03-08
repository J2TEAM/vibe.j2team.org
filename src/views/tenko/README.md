# Token Visualizer (Tenko)

Công cụ trực quan hóa token hiện đại dành cho các mô hình OpenAI, được tích hợp vào dự án `vibe.j2team.org`.

## Tính năng

- **Trực quan hóa Token**: Xem cách văn bản được chia thành các token bằng thuật toán xấp xỉ lấy cảm hứng từ BPE.
- **Tính toán chi tiết theo Model**: Ước tính chi phí cho các mô hình GPT-5, GPT-4.1, GPT-4o-mini và GPT-3.5-turbo.
- **Tạo Lorem Ipsum**: Tạo văn bản mẫu với số lượng token chính xác theo yêu cầu.
- **Giao diện Hiện đại**: Được tùy chỉnh theo hệ thống thiết kế "Retro-Futuristic Editorial" của dự án.

## Chi tiết tích hợp

- **Đường dẫn**: `src/views/tenko/`
- **Component chính**: `index.vue`
- **Metadata**: `meta.ts`
- **Tác giả**: ltpppp

## Công nghệ sử dụng (Trong trang này)

- Vue 3 (Composition API)
- TypeScript
- Tailwind CSS (Project Theme)
- Quản lý trạng thái bằng Reactive (Vue Refs/Computed)

## Hướng dẫn sử dụng

1. Truy cập vào "Token Visualizer" từ danh sách trang ở trang chủ.
2. Sử dụng tab **Text → Tokenize** để phân tích văn bản của bạn.
3. Sử dụng tab **Token Count → Generate** để tạo văn bản mẫu phục vụ việc test hoặc thiết kế.
