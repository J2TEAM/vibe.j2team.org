# Hướng dẫn đóng góp

Cảm ơn bạn đã quan tâm đến dự án **vibe.j2team.org**! Dưới đây là hướng dẫn để bạn có thể tham gia.

## Yêu cầu

- [Node.js](https://nodejs.org/) phiên bản `^20.19.0` hoặc `>=22.12.0`
- [pnpm](https://pnpm.io/) (bắt buộc, không dùng npm/yarn)

## Bắt đầu

```sh
# 1. Fork repo trên GitHub

# 2. Clone về máy
git clone https://github.com/<username>/vibe.j2team.org.git
cd vibe.j2team.org

# 3. Cài đặt dependencies
pnpm install

# 4. Chạy dev server
pnpm dev
```

## Tạo trang mới

1. Tạo thư mục `src/views/<tên-trang-của-bạn>/` với file `index.vue`
2. Tạo file `meta.ts` trong cùng thư mục để khai báo tên, mô tả và tác giả (route tự động được tạo)
3. Xem trang mẫu: `src/views/hello-world/`

## Cấu trúc thư mục khuyến nghị

Mỗi trang là một thư mục độc lập trong `src/views/<tên-trang>/`. Với trang đơn giản, chỉ cần `index.vue` + `meta.ts`. Với trang phức tạp (4+ file), nên tổ chức như sau:

```
src/views/<tên-trang>/
  index.vue              # Bắt buộc: component chính
  meta.ts                # Bắt buộc: metadata (tên, mô tả, tác giả)
  components/            # Khuyến nghị: các Vue component con
  composables/           # Khuyến nghị: composition functions (use-*.ts)
  types.ts               # Khuyến nghị: định nghĩa TypeScript types
  utils/                 # Khuyến nghị: các hàm tiện ích
  assets/                # Khuyến nghị: hình ảnh, âm thanh, CSS (được Vite tối ưu)
```

### Tài nguyên tĩnh (Static Assets)

- `src/views/<tên-trang>/assets/` — hình ảnh, âm thanh, CSS sẽ được Vite hash và tối ưu. **Dùng cho hầu hết trường hợp.**
- `public/<tên-trang>/` — file media lớn (video, bộ ảnh lớn) phục vụ trực tiếp, không qua Vite.

### Tiện ích dùng chung (opt-in)

Code dùng chung bởi 3+ trang có thể đặt tại:

```
src/components/shared/     # Component UI dùng chung
src/composables/shared/    # Composables dùng chung
src/utils/shared/          # Hàm tiện ích dùng chung
```

Các trang có thể import từ đây nhưng không bắt buộc. Mỗi trang vẫn hoạt động độc lập.

## Edge Toolbar

Mỗi trang con mặc định sẽ hiển thị một **Edge Toolbar** ở cạnh phải màn hình, cung cấp các nút: xem mã nguồn, yêu thích, và về trang chủ.

Nếu toolbar ảnh hưởng đến trang của bạn (ví dụ: game toàn màn hình), bạn có thể tắt nó bằng cách thêm `showToolbar: false` vào `meta.ts`:

```ts
const meta: PageMeta = {
  // ...các trường khác
  showToolbar: false,
}
```

Mặc định là `true` — toolbar sẽ hiển thị nếu không khai báo.

## Quy tắc code

- Sử dụng `<script setup lang="ts">` cho tất cả Vue component
- Sử dụng Composition API (không dùng Options API)
- Không sử dụng `any` hoặc `unknown` trong TypeScript
- Không sử dụng `class` trong TypeScript trừ khi bắt buộc
- Tuân thủ [Design System](docs/DESIGN_SYSTEM.md)
- Tiếng Việt phải có dấu

## Commit convention

Dự án sử dụng [Conventional Commits](https://www.conventionalcommits.org/). Commit message phải theo định dạng:

```
<type>: <mô tả>

Ví dụ:
feat: thêm trang game-2048
fix: sửa lỗi routing trang hello-world
docs: cập nhật README
style: format code
chore: cập nhật dependencies
```

Các type hợp lệ: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

## Quy tắc về branch

- **KHÔNG** làm việc trực tiếp trên branch `main`
- Luôn tạo branch mới từ `main` trước khi bắt đầu code
- Đặt tên branch theo format: `<type>/<mô-tả-ngắn>`
  - Ví dụ: `feat/trang-game-2048`, `fix/routing-hello-world`, `docs/cap-nhat-readme`
- Mỗi Pull Request chỉ nên chứa **một** thay đổi logic (một trang mới, một bug fix, ...)

## Tạo Pull Request

1. Tạo branch mới từ `main`: `git checkout -b feat/tên-trang`
2. Commit thay đổi theo convention ở trên
3. Push branch và tạo Pull Request vào `main`
4. Đảm bảo CI pass (lint, type-check, test, build)
5. Chờ review và merge!

## Các lệnh thường dùng

| Lệnh | Mô tả |
|------|-------|
| `pnpm dev` | Chạy dev server |
| `pnpm build` | Build production |
| `pnpm test:unit` | Chạy unit tests |
| `pnpm lint` | Lint code (có auto-fix) |
| `pnpm format` | Format code |
