# The Page That Judges You (Advanced Experience)

Một trang web tương tác tâm lý học đỉnh cao, tính toán và đưa ra phán xét theo thời gian thực dựa trên thói quen và hành vi của người dùng (từ cách họ nhấp chuột, di chuyển con trỏ, cho đến việc họ đứng yên). Dự án tạo ra ảo giác rằng hệ thống "hiểu" và có "trí tuệ nhân tạo", nhưng thực chất mọi kỹ thuật đều là Rule-based Behavior Tracking và nằm hoàn toàn ở Client-site.

## 🎯 Tính năng nâng cao (Core Features)

1. **Rule-based Judgment System & Mirror Behavior:** Kịch bản phản hồi nếu người dùng đứng im quá lâu, click thiết bị vô tội vạ, hoặc di chuyển trỏ chuột quá nhanh hoảng loạn. Đặc biệt hệ thống ngầm bắt luôn cả tốc độ lướt tay (Swipe & Spam Tap) phân tích trên Mobile.
2. **Fake Memory System:** Ghi nhớ số lượng lần người truy cập bị mắc kẹt tại trang và thời gian trải nghiệm session trước đó để chào mừng lại họ (sử dụng Native `localStorage`).
3. **Phase Progression (9 Cấp độ Tâm lý):** Trải nghiệm bắt đầu từ góc nhìn Trung lập (Neutral), Quan sát, Áp lực, Mắc kẹt ngầm (Trap Scroll), Thao túng ngược (Reverse Control), Phá huỷ không gian (Collapse), và Cuộc kết thúc giả (Fake Ending)... Mỗi cấp độ là một bộ UI Mutation thay đổi hoàn toàn hình dạng, độ trễ và hiệu ứng tĩnh của giao diện.
4. **Dynamic Lighting & Perspective Tilt 3D:** Khung cảnh trang web bẻ cong theo tỷ lệ góc tọa độ di chuyển chuột mô phỏng Perspective 3D. Chuột tạo ra vùng Radial Spotlight dần đóng sập ánh sáng màn hình xung quanh.
5. **Personality Mode:** Thay đổi linh hoạt thái độ trang. Tính cách của hệ thống sẽ quay random mỗi lần tải lại trang trải dài ở 3 thái cực: Bình Năng (Calm), Khích Bác (Sarcastic), và Gắt Gỏng (Aggressive). Kèm theo đó hệ thống độ trễ ngập ngừng (Self-Doubt Delay) khi sinh chữ mô phỏng như người thật.

## 🧠 Chuyển động Kỹ thuật

Trang web hoàn toàn **không** gửi đi bất kỳ dữ liệu nào đến Internet hay Server. Mọi tác vụ được xử lý an toàn tại Browser Local:
- Những cảm biến từ `@vueuse/core` bắt và lưu trữ nhịp click, tọa độ `(x,y)` của chuột, hay kéo cuộn scroll. 
- Ở background, *Pinia Store* sẽ tự động tổng hợp sự kiện thành `score`. Khi `score` vượt giới hạn, hệ thống tự động đẩy **Phase** và biến dị UI bằng CSS thông qua biến Store nội bộ một cách mượt mà và Real-time.

## 🧩 Cơ cấu File

- `index.vue`: Tầng View chính chứa Layout, Header, hiệu ứng Dynamic Spotlight, hiệu ứng bẻ cong giao diện Tilt 3D và các rào cản thao tác trượt trang.
- `useBehaviorStore.ts`: Kho State Store Quản trị bằng Pinia (Điểm Clicks, Idle Time, Điều phối 9 Phases, LocalStorage State, và trạng thái Thao Túng/Dự Đoán...).
- `BehaviorTracker.ts`: Tập hợp Hooks lắng nghe và nhận diện cử chỉ (`mousemove`, `mousedown`, `click`, `idle`) tính toán liên tục hành vi mà không cần trigger thủ công.
- `components/MessageSystem.vue`: Chịu trách nhiệm render UI "Fake AI", xuất ra màn hình lời phán xét kèm Animation theo thời gian thực thay đổi tùy thuộc thái độ ngẫu nhiên.
- `meta.ts`: Meta Page để tự động kích hoạt Router theo core Auto-Routing của dự án Vibe.

## 🕵️ Bí mật: Làm sao để "Thoát" khỏi hệ thống? (The Escape)

Hệ thống sẽ thử thao túng bạn, thậm chí trong giao đoạn mất kiểm soát (Collapse & Fake Endings), nhưng bạn có quyền năng phá vỡ kịch bản bằng bí mật giấu kín.

**Để có thể tìm lối ra (Escape Mechanism):**
👉 **Từ Cấp độ 3 (Phase 3 Judgment) trở đi, bạn đừng hoảng loạn chạy theo nút bấm. Chỉ cần nhấn và GIỮ CHẶT chuột trái (hoặc giữ tay liên tục trên màn hình điện thoại) liên tục trong `3 giây`.** Trang web sẽ đánh giá cao sự tĩnh lặng và thưởng cho bạn lối thoát bí mật ra khỏi ngõ cụt: *"So you found a way out..."*.

