# Computer Test

Công cụ kiểm tra phần cứng máy tính trực tuyến, tích hợp vào hệ thống thiết kế của `vibe.j2team.org`.

Route: `/computer-test`

---

## Các module kiểm tra

### ⌨️ Bàn phím (Keyboard)
Kiểm tra từng phím có hoạt động không
- Nhận diện sự kiện `keydown` / `keyup`, đổi màu phím trên bàn phím ảo khi nhấn
- Hỗ trợ 3 layout: **100%** (Full + Numpad), **80% TKL** (không Numpad), **60%** (compact)
- Thống kê phím đang giữ, tổng lần nhấn, phím nhấn nhiều nhất, key code, thời gian giữa 2 nhấn
- Cấu hình Windows/Mac, Desktop/Laptop, bật/tắt âm thanh gõ phím

### 🖥️ Màn hình (Screen)
Kiểm tra dead pixel và stuck pixel
- Hiển thị toàn màn hình với từng màu thuần (đen, trắng, đỏ, xanh lá, xanh dương...)
- Điều hướng bằng phím `←` `→` hoặc click chuột để đổi màu
- Nhấn `ESC` để thoát chế độ kiểm tra

### 📷 Webcam
Kiểm tra camera có hoạt động không
- Tự động yêu cầu quyền truy cập camera
- Hiển thị danh sách camera, xem hình ảnh trực tiếp (live preview)
- Hỗ trợ nhiều camera, có nút "Quét lại" khi kết nối camera mới

### 🎙️ Micro (Microphone)
Kiểm tra micro có thu âm được không
- Quét danh sách micro, ưu tiên chọn micro mặc định (Default)
- Hiển thị thanh âm lượng realtime (Web Audio API)
- Điều chỉnh gain (âm lượng thu), thu âm và phát lại để nghe kết quả

### 🔊 Loa (Speaker)
Kiểm tra loa/tai nghe
- Phát các âm thanh thử nghiệm: kênh trái, kênh phải, stereo, bass, mid, treble
- Điều chỉnh âm lượng trước khi phát
- Giúp phát hiện mất kênh, tiếng rè, hoặc vấn đề dải tần

### 🔋 Pin (Battery)
Xem trạng thái pin hiện tại (laptop)
- Đọc thông tin qua Battery Status API: mức pin (%), đang sạc hay xả, thời gian còn lại
- Phát hiện trường hợp không có pin (PC, laptop tháo pin, pin hỏng, hoặc trình duyệt chặn API)
- Cảnh báo khi pin yếu (≤ 20%)
- Kèm lệnh PowerShell (`irm j2c.cc/batterycheck | iex`) để kiểm tra sức khỏe pin chi tiết trên Windows

---

## Cấu trúc thư mục

```
computer-test/
├── index.vue                    # Trang chính, điều hướng giữa các tab
├── meta.ts                      # Metadata cho router (title, description...)
├── components/
│   ├── KeyboardKey.vue          # Component hiển thị từng phím đơn
│   ├── KeyboardLayout.vue       # Layout bàn phím + logic hiển thị
│   ├── ScreenTest.vue           # Kiểm tra màn hình (dead pixel)
│   ├── WebcamTest.vue           # Kiểm tra webcam
│   ├── MicTest.vue              # Kiểm tra micro + thu âm
│   ├── SpeakerTest.vue          # Kiểm tra loa
│   └── BatteryTest.vue          # Kiểm tra pin
├── composables/
│   └── useKeyboardState.ts      # Logic sự kiện bàn phím, thống kê
└── constants/
    └── keyboard.ts              # Dữ liệu cấu trúc hàng phím
```

---

## Lưu ý

- **Webcam / Micro:** Trình duyệt yêu cầu cấp quyền, và chỉ hoạt động trên HTTPS hoặc `localhost`
- **Battery API:** Chrome desktop đã tắt Battery API vì lý do riêng tư — kết quả có thể không hiển thị đầy đủ. Dùng Firefox hoặc trình duyệt mobile để có kết quả tốt hơn
- **Phím hệ thống:** Một số phím như `F1`, `Alt`, `Tab` có thể bị trình duyệt chặn hành động mặc định
- **Giao diện:** Áp dụng phong cách **Retro-Futuristic Editorial** theo `DESIGN_SYSTEM.md` với màu nhấn Coral, Amber, Sky.
