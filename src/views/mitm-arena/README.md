# Tin Nhắn Giữa Đường — MITM Arena

Game giáo dục tiếng Việt cho **đúng 3 người trên 3 trình duyệt hoặc thiết bị**, tác giả **Duc**. Trang `/mitm-arena`, danh mục `game`. Không có bot, database hay lịch sử lưu trên dịch vụ ngoài.

## Chạy và kết nối

Yêu cầu Node theo `.node-version`/`package.json`, pnpm **10.31.0** (trường `packageManager`).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Mở `/mitm-arena` trên cả ba thiết bị bằng cùng phiên bản ứng dụng. Dùng **HTTPS** hoặc `localhost`: Web Crypto cần secure context. HTTP qua địa chỉ IP LAN thường không đủ cho chế độ AES-GCM.

1. Người đầu nhập tên, chọn chế độ và **Tạo phòng**. Người này là host tin cậy, giữ trang mở suốt ván.
2. Trong sảnh, host tạo mã mời **ghế 2** rồi gửi đầy đủ mã cho người thứ hai bằng kênh trao đổi có sẵn.
3. Người thứ hai nhập tên, dán mã mời và tham gia. Sao chép **mã trả lời** gửi lại host.
4. Host dán mã trả lời và xác nhận. Chờ tên người chơi hiện kết nối.
5. Làm tương tự với **ghế 3** và mã mời riêng. Không tái sử dụng mã của ghế đã kết nối.
6. Cả ba nhấn **Sẵn sàng**. Host chỉ bắt đầu được khi đủ ba người đã sẵn sàng.

Mã phòng ngắn chỉ giúp đối chiếu; **không thể join chỉ bằng mã phòng**. Cần trao đổi đầy đủ offer/answer vì không có dịch vụ signaling tự động. Mã có SDP và thông tin kết nối/IP; chỉ chia sẻ với người được mời. Mã sai, khác phòng/ghế, trùng hay hết hạn được từ chối; có nút hủy rồi tạo mã mới.

### P2P, signaling, STUN và giới hạn NAT

- Dữ liệu game chạy trên **WebRTC DataChannel reliable/ordered**, topology sao: host kết nối riêng với hai khách. Không dùng BroadcastChannel/localStorage để kết nối.
- **Signaling** là trao đổi SDP offer/answer thủ công, không phải dữ liệu game.
- Ô **STUN tùy chọn** nhận địa chỉ công khai dạng `stun:tên-miền:cổng`. Mặc định để trống: kết nối bằng ICE host candidates có thể hoạt động trong LAN hoặc môi trường cho phép kết nối trực tiếp.
- Khi chơi khác mạng, người chơi tự nhập STUN phù hợp trước lúc tạo/join kết nối. STUN giúp tìm địa chỉ công khai, **không relay dữ liệu** và không bảo đảm vượt mọi NAT/firewall.
- Bản này **không cung cấp TURN**. NAT đối xứng, mạng doanh nghiệp hoặc mạng chặn UDP có thể không kết nối được dù có STUN. Không có cơ chế relay dự phòng hoặc cam kết hoạt động trên mọi mạng Internet.
- Không tự triển khai backend, không tạo tài khoản dịch vụ, không nhúng API key hay TURN credential. Nếu dùng STUN, vẫn phụ thuộc dịch vụ hỗ trợ đó; không tuyên bố mọi tình huống đều “không cần server”.

## Luật chơi

Mỗi ván chọn một chế độ, có **3 vòng**. Người chơi lần lượt đổi vai để mỗi người đều chơi A, B, C. Kết thúc có thể chọn chế độ khác và cùng sẵn sàng cho ván mới.

- **A — Người gửi:** nhận riêng nhiệm vụ yêu cầu B chọn một trong ba cửa, rồi viết tin dài 1–180 ký tự trong **60 giây**. A tiếp tục thấy bản gốc mình đã gửi.
- **C — Người đứng giữa:** có **45 giây** để chuyển nguyên bản hoặc can thiệp theo chế độ. C không được nhận nhiệm vụ bí mật của A qua projection.
- **B — Người nhận:** chỉ thấy tin được chuyển đến rồi chọn cửa trong **45 giây**. Trước công bố, A/B không nhận câu đố hay thao tác sửa của C.
- **Chấm điểm:** B chọn đúng nhiệm vụ: A và B mỗi người +1; B thực sự chọn sai: C +1. Không cộng điểm chỉ vì sửa tin, hết giờ hoặc làm xác thực thất bại. Không dùng AI phân tích lời nhắn.
- A hết giờ: bỏ vòng, không ai có điểm. C hết giờ: tự chuyển bản gốc. B hết giờ: không ai có điểm; phân biệt chưa xác nhận nhận tin với đã nhận nhưng chưa chọn cửa.
- Cuối vòng công bố nhiệm vụ, bản gốc, bản nhận, quyết định, lý do điểm, diễn biến và bài học. Host chuyển vòng; sau vòng ba xem tổng kết.

### Ba chế độ

1. **Tin nhắn rõ:** C đọc ngay và có thể sửa. Bài học: kênh thiếu bảo vệ nội dung cho phép nghe và sửa tin.
2. **Caesar:** chỉ dịch `A–Z/a–z` không kèm dấu tổ hợp; ký tự có dấu, chữ có combining mark theo sau, số, dấu câu và emoji giữ nguyên, không normalize Unicode. Khóa 1–25. C thấy ciphertext và manh mối cặp `HELLO`/bản dịch; công cụ tương tác chỉ dịch manh mối trước khi mở khóa. Phải nộp đúng khóa mới đọc/sửa được tin. Đây là mật mã cổ điển, không mô phỏng phá AES.
3. **Có xác thực:** A/B tạo cặp ECDH P-256 mới mỗi vòng, trao đổi **khóa công khai** qua host và suy ra khóa AES-GCM-256 bằng HKDF-SHA-256. Khóa riêng và AES không export, không gửi cho C, kể cả khi host đang là C. Mỗi bản tin có IV ngẫu nhiên 96 bit mới và AAD ràng buộc phòng, vòng, A, B. C chỉ nhận envelope công khai (IV/bản mã), có thể chuyển nguyên hoặc lật một bit ciphertext. B gọi `crypto.subtle.decrypt` thực tế: bản gốc giải mã được, bản sửa bị từ chối xác thực. Không có câu đố mở quyền phá AES. Plaintext gốc giữ tại A và plaintext giải mã giữ tại B cho tới công bố; A chỉ gửi bản gốc cho replay sau khi vòng kết thúc.

## Kiến trúc và mô hình tin cậy

- `utils/engine.ts`: luật thuần, host duy nhất quyết định phase, deadline, nhiệm vụ, điểm và đổi vai. Đồng hồ khách hiệu chỉnh theo giờ host.
- `types.ts`: command/projection/result; `projectRoom` tạo đối tượng riêng theo người nhận, không gửi cả trạng thái rồi giấu bằng CSS.
- `utils/crypto.ts`: Caesar, ECDH/HKDF và AES-GCM Web Crypto thật.
- `composables/use-transport.ts`: WebRTC/SDP độc lập luật; ghế gắn với kết nối, tối đa hai khách. Có giới hạn độ dài mã/bản tin, thời gian chờ kết nối và cleanup.
- `composables/use-arena.ts`: host chạy engine, relay projection và khóa công khai; khách gửi command. Mọi command có ID/phòng/vòng/phase; host xác minh người gửi từ link và vai hiện tại, loại trùng và đến muộn. Nhịp kiểm tra kết nối phát hiện host/khách không phản hồi; host hủy ván khi có người rời, tải lại hoặc mất kết nối.
- `components/`: kết nối, roster, giao diện riêng từng vai và kết quả. Vue chỉ render nội dung người chơi như văn bản, không dùng `v-html`.

**Đây là mô hình giáo dục với host tin cậy**, không phải ứng dụng chat E2EE hoàn chỉnh hay hệ thống chống gian lận. Host biết nhiệm vụ và điều phối khóa công khai; việc xác thực host/danh tính người trao đổi là vấn đề riêng. Người kiểm soát client/host có thể sửa mã hoặc khai báo kết quả giải mã sai; không có backend chống gian lận. Tính bí mật, toàn vẹn và xác thực danh tính là các thuộc tính khác nhau.

C chỉ can thiệp vào **bản tin mô phỏng bên trong game**. Game không nghe lén hoặc phá mã hóa WebRTC/TLS thực tế.

Phiên chỉ tồn tại trong bộ nhớ. Không host migration, không reconnect hay khôi phục sau tải lại. Khi ván bị hủy, rời phòng và tạo phòng mới. Kết nối, callback/listener và timer được dọn khi hủy/rời/chuyển trang; tab nền bị trình duyệt đình chỉ có thể bị coi là mất kết nối. Chế độ 2 người với bot và hơn 3 người chưa được hỗ trợ.

## Kiểm thử

```sh
pnpm test:unit --run src/views/mitm-arena/__tests__
pnpm test:unit --run
pnpm lint:ci
pnpm build
```

Unit tests bao phủ chuyển giai đoạn/đổi vai, quyền theo link/vai/phòng/vòng, scoring theo lựa chọn B, timeout/trùng/đến muộn, projection bí mật, Caesar/Unicode, ECDH và AES-GCM chấp nhận bản gốc/từ chối tamper, kiểm tra binding mã SDP. Nếu dự án lớn vượt giới hạn heap mặc định, chạy `NODE_OPTIONS=--max-old-space-size=8192 pnpm build`.

Kịch bản Playwright trong `__tests__/browser_flow.py` dùng Chromium và ba browser context độc lập, chạy với ứng dụng dev đang mở. Script cần Python Playwright/Chromium được cài riêng trong môi trường kiểm thử, không thêm dependency vào ứng dụng. Xem phần đầu script để biết lệnh chạy và các kịch bản đã thực hiện. Kết quả ba context trên cùng máy/mạng **không chứng minh** kết nối giữa các thiết bị/mạng Internet độc lập; cần thử thêm trên các mạng thực tế, đặc biệt NAT cần TURN.
