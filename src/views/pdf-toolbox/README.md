# Bộ công cụ PDF - Đặc tả Kỹ thuật & Tài liệu Hướng dẫn

## Tổng quan

Bộ công cụ PDF là một phòng thí nghiệm xử lý tệp tin kỹ thuật số trực tiếp trên trình duyệt, ưu tiên hiệu năng và tính riêng tư. Toàn bộ logic xử lý văn bản được thực hiện trong môi trường biệt lập (sandbox) của trình duyệt, đảm bảo dữ liệu nhạy cảm không bao giờ rời khỏi sự kiểm soát của người dùng.

## Đặc tả Kỹ thuật

- **Công nghệ cốt lõi**: Vue 3 (Composition API) kết hợp với TypeScript.
- **Xử lý PDF**: Sử dụng thư viện `pdf-lib` để thao tác tệp PDF cấp cao (hợp nhất, tách file).
- **Nén dữ liệu**: Sử dụng thư viện `jszip` để nén các tệp đã tách thành định dạng ZIP.
- **Hệ thống biểu tượng**: `@iconify/vue` kết hợp với bộ biểu tượng Lucide.
- **Giao diện**: Tailwind CSS (phiên bản 4) với hệ thống thiết kế cao cấp tùy chỉnh.
- **Quản lý trạng thái**: Sử dụng Vue `ref` và `useLocalStorage` từ bộ công cụ `@vueuse/core`.
- **Hiệu năng**: Hỗ trợ Web Worker cho các tác vụ xử lý PDF nặng.
- **Môi trường vận hành**: Hoàn toàn tại máy khách (100% Client-Side).

## Kiến trúc Hệ thống

Dự án tuân theo phương pháp tiếp cận "Chống Nguyên khối" (Anti-Monolithic), đảm bảo mỗi thành phần đều nhỏ gọn, tập trung và dễ bảo trì.

### Cấu trúc Thành phần (Components)

- `index.vue`: Điều phối chính, quản lý trạng thái toàn cục và điều hướng tab.
- `ToolHeader.vue`: Thanh đầu trang cao cấp với các huy hiệu dữ liệu và điều hướng.
- `ProjectInfo.vue`: Giới thiệu tổng quan dự án và hướng dẫn sử dụng nhanh.
- `MergerTab.vue`: Logic và giao diện cho việc hợp nhất nhiều tệp PDF.
- `SplitterTab.vue`: Logic và giao diện để tách PDF theo khoảng trang hoặc trang đơn lẻ.
- `HistoryTab.vue`: Lớp lưu trữ sử dụng IndexedDB và LocalStorage để lưu lại lịch sử hoạt động.
- `HistoryModal.vue`: Chế độ xem chi tiết các hoạt động trong quá khứ kèm xem trước PDF.

### Luồng Dữ liệu

1. **Đầu vào**: Người dùng thả hoặc chọn tệp qua các vùng tải lên chuyên biệt.
2. **Xử lý**: `pdf-lib` đọc dữ liệu nhị phân (ArrayBuffer) của tệp, thực hiện các thao tác và trả về một khối dữ liệu (Blob) mới.
3. **Lưu trữ**: Các tệp kết quả được lưu vào IndexedDB để duy trì lâu dài; dữ liệu mô tả (metadata) được lưu vào LocalStorage.
4. **Đầu ra**: Người dùng có thể xem trước hoặc tải tệp đã xử lý trực tiếp về máy.

## Thành viên & Công cụ hỗ trợ

Dự án này được phát triển bằng các kỹ thuật lập trình tác nhân tiên tiến:

- **Người phát triển**: [Arter](https://github.com/Arter)
- **AI Model**: Gemini 3.
- **Công cụ hỗ trợ**:
  - **Antigravity**: Chuyển đổi dự án từ React sang Vue và hoàn thiện các tính năng.
  - **Google AI Studio**: Tạo cấu trúc và khung sườn giao diện cho dự án.
- **Công cụ quy trình**:
  - **Vite**: Công cụ xây dựng giao diện cực nhanh.
  - **PNPM**: Trình quản lý gói hiệu quả, tiết kiệm dung lượng đĩa.

## Hướng dẫn nhanh

1. **Hợp nhất**: Tải lên nhiều tệp PDF, sắp xếp lại thứ tự nếu cần và nhấn "Hợp nhất".
2. **Tách file**: Tải lên một tệp PDF duy nhất, xác định khoảng trang (ví dụ: "1-3, 5") và nhấn "Tách file".
3. **Lịch sử**: Xem lại các hoạt động cũ và tải lại tệp từ tab "Lịch sử".
