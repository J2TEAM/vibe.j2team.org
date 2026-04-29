# Illusion Playground (Khu Vực Ảo Giác)

Một trang trải nghiệm tương tác với 10 ảo ảnh thị giác (Optical Illusions) siêu kinh điển. Điểm đặc biệt của dự án con này là tất cả các hiệu ứng ảo giác **được xây dựng hoàn toàn bằng Native HTML, SVG và thuật toán CSS**, hoàn toàn không sử dụng hình ảnh tĩnh (`.png`/`.jpg`), không cần vẽ trực tiếp qua cấu trúc phức tạp của Canvas JS, và cũng không xài tới thư viện bên ngoài.

## 📖 Cảm hứng
Lấy cảm hứng và ý tưởng từ bài viết [10 Bức Hình Đánh Lừa Thị Giác Siêu Kinh Điển](https://phongkhamductaman.com/10-buc-hinh-danh-lua-thi-giac/) của *Phòng Khám Đức Tâm An*. Lớp áo giao diện (UI) vừa được tái thiết kế theo phong cách Pixel Arcade (Cỗ máy game Retro) với hệ thống 10 Level chơi.

## 🎮 Cách hoạt động
- Màn hình chính là "Select A Level", mỗi thẻ tương ứng một Ảo giác kèm các Icon gợi nhớ.
- Khi người dùng click vào một Ảo giác, giao diện Modal sẽ bật lên dưới dạng Overlay. Modal chứa cấu trúc tương tác để bật/tắt (Toggle) sự thật đằng sau những hiện tượng thị giác kỳ lạ nhằm giải thích cho não bộ hiểu mình đã bị lừa ra sao.
- Khi đóng Modal, toàn bộ state (Vòng chạy Troxler nhấp nháy, Animation xoay, Viền highlight) sẽ tự động được reset lại.

## 🧠 Bóc tách kỹ thuật 10 Ảo Giác

1. **Cái Nĩa Ma Quỷ (Impossible Fork / Blivet):** Được dựng hình bằng ngôn ngữ đường kẻ `SVG Path`. Việc giấu đi điểm giao tự nhiên tạo ra mâu thuẫn hình học 3D trong não thất.
2. **Điểm Chuyển Động (Motion Dots):** Sử dụng các khuyên tròn có viền đổ màu bất đối xứng. Bằng việc lặp đi lặp lại gradient và kết hợp CSS Keyframes tự động thay đổi `contrast`, những chấm tĩnh bỗng nhiên tự cuộn xoắn.
3. **Ảo Giác Kích Thước (Ebbinghaus):** Hai tâm cam bằng nhau nhưng tâm nằm giữa lưới siêu khổng lồ lại trông nhỏ bé hơn. Tái tạo bằng `transform: rotate` trên v-for để tạo khối tròn bao quanh đồng nguyên.
4. **Tường Cà Phê (Cafe Wall):** Đóng các hàng gạch vuông đen trắng nằm xen kẽ lệch pha nhau (`margin-left` điều chỉnh) để ép màng lưới não nhìn thấy các dải line xám chia làn nằm xiên góc.
5. **Lưới Ma Hermann (Hermann Grid):** Đặt mạng lưới cực đơn giản bằng CSS Grid với `gap` trắng trên nền đen để hiện thực hệ quả "ức chế bên" (Lateral Inhibition), tạo bóng mờ ở các ngã tư.
6. **Ảo Giác Ouchi (Hidden Motion):** Gradient họa tiết vuông kẻ sọc cắt nhau (`repeating-linear-gradient`) giữa vật thể lơ lửng và nền background.
7. **Đường Ray Ponzo (Ponzo Perspective):** Khả năng tái tạo đường ray quy tụ đằng xa siêu thực thông qua hiệu ứng ảo ảnh 3D `transform: perspective(600px)` và gập tọa độ theo góc `rotateX(65deg)`.
8. **Biến Dạng Xoắn Ốc (Fraser Spiral):** Đây thực chất là các vòng khuyên rỗng ruột (donut) không dính vào nhau. Thuật toán sử dụng các lớp cắt `mask-image / radial-gradient` xen kẽ với nền xéo góc `repeating-conic-gradient` sinh ảo giác dây xoắn ốc đang cuốn vào lõi.
9. **Hội Tụ Tập Trung (Troxler's Fading):** Mô phỏng hội chứng Troxler qua việc trễ nhịp thời gian (`animation-delay`) để tắt hình 1 chấm tròn trong cấu trúc vòng lặp Pac-Man 12 điểm. Cảm biến mắt tự in nốt màu nghịch đảo (xanh lục) lên nền xám.
10. **Lộn Xộn Góc Độ (Zöllner Illusion):** Các vạch ngắn nằm xiên chéo 45 độ gắn trên khung đường ngang đánh lừa não bộ tính toán tỷ lệ góc sai.

## 🛠 Tech Stack & Thư viện
- Được phát triển với **Vue 3** và **Tailwind CSS v4**.
- Sử dụng trực tiếp Hook của gói thư viện chính `@vueuse/core`:
  - `useScrollLock`: Đóng băng màn hình nền, chống hiệu ứng cuộn kép khi bật lên Modal.
  - `onKeyStroke`: Bắt sự kiện nhấn phím tắt `Esc` để đóng khung chơi rất chuyên nghiệp.
- **Iconify (`@iconify/vue` - Lucide):** Gói Icon có sẵn trong bộ Vibe project.

Tất cả chạy chuẩn xác hoàn toàn Native, tối ưu hóa bundle size, gọn gàng, đẹp mắt và siêu đáp ứng (Mobile-responsive).
