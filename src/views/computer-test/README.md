# Computer Test - Keyboard Module

Module này cung cấp công cụ kiểm tra bàn phím trực tuyến tương tự `keytest.vn`, nhưng được tích hợp vào hệ thống thiết kế của `vibe.j2team.org`.

## Chức năng chính
- **Kiểm tra phím (Key Event):** Nhận diện `keydown` và `keyup` để thay đổi trạng thái màu sắc trên bàn phím ảo.
- **Hỗ trợ nhiều Layout:** 
  - **100%:** Full-size keyboard với Numpad.
  - **80% (TKL):** Lược bỏ Numpad.
  - **60%:** Lược bỏ Numpad, hàng phím Function (F1-F12) và cụm phím điều hướng.
- **Thống kê (Stats):** 
  - Số lượng phím đang được giữ (Active Keys).
  - Tổng số lần nhấn phím (Total Presses).
  - Phím được nhấn nhiều nhất.
  - Mã phím (Key Code) cuối cùng và khoảng thời gian giữa các lần nhấn.
- **Tính năng mở rộng:** Cấu hình hệ điều hành (Windows/Mac), loại máy (Desktop/Laptop), âm thanh và ô nhập liệu để test gõ văn bản thực tế.

## Cấu trúc thư mục
- `components/`:
  - `KeyboardKey.vue`: Component hiển thị từng phím đơn lẻ.
  - `KeyboardLayout.vue`: Component chính quản lý toàn bộ sơ đồ bàn phím và logic hiển thị.
- `composables/`:
  - `useKeyboardState.ts`: Quản lý logic sự kiện bàn phím, trạng thái các phím và thống kê.
- `constants/`:
  - `keyboard.ts`: Khai báo dữ liệu cấu trúc cho các hàng phím.
- `index.vue`: Trang chủ của Computer Test, tích hợp module Keyboard.
- `meta.ts`: Khai báo metadata cho hệ thống router của dự án.

## Cách chạy
Truy cập route `/computer-test` trên trình duyệt.

## Lưu ý
- Các phím hệ thống (như F1, F3, Alt, Tab) có thể bị trình duyệt chặn một số hành động mặc định.
- Giao diện sử dụng phong cách **Retro-Futuristic Editorial** với các góc nhọn và màu nhấn đặc trưng (Coral, Amber, Sky).
