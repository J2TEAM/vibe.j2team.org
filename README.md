# vibe.j2team.org

**Sẽ thế nào nếu cả nhóm [J2TEAM Community](https://www.facebook.com/groups/j2team.community/) vibe code cùng nhau?**

Trang chủ là một Launcher, dẫn link tới các trang con do thành viên tạo ra. Mọi người tự do vibe code thoải mái trên trang của mình!

## Tech Stack

- [Vue 3](https://vuejs.org/) - Progressive JavaScript Framework
- [TypeScript](https://www.typescriptlang.org/) - JavaScript với static typing
- [Vite](https://vite.dev/) - Build tool thế hệ mới
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Vue Router](https://router.vuejs.org/) - Routing
- [Pinia](https://pinia.vuejs.org/) - State management
- [VueUse](https://vueuse.org/) - 200+ composables cho Vue
- [Iconify](https://iconify.design/) - 200,000+ icons từ 150+ bộ icon

## Bắt đầu

```sh
pnpm install
pnpm dev
```

## Nguyên tắc

1. **Không có database** — dự án không sử dụng database
2. **Luôn có link về trang chủ** — mỗi trang con phải có link quay lại trang chủ
3. **Ngôn ngữ: tiếng Việt (ưu tiên) hoặc tiếng Anh**
4. **Không trùng ứng dụng con đã có** — kiểm tra danh sách trang trước khi tạo mới
5. **Mỗi trang con hoạt động độc lập** — chỉ làm việc trong thư mục trang của mình
6. **Responsive** — trang phải hiển thị tốt trên mobile
7. **Không thêm dependency mới** trừ khi thật sự cần và được approve. Các thư viện sau đã được **cài sẵn** — tự do sử dụng:
   - `@vueuse/core` — 200+ composables cho Vue
   - `@iconify/vue` — 200,000+ icons từ 150+ bộ icon

   Các thư viện sau được **chấp thuận sẵn** và có thể thêm mà không cần approve:
   - `vue-konva` — Thư viện canvas 2D cho vẽ, game, đồ hoạ tương tác
   - `shiki` — Syntax highlighter
8. **Ghi rõ tên tác giả** trong file `meta.ts` của trang

## Cách tham gia

1. Fork repo và clone về máy
2. Tạo branch mới từ `main` (ví dụ: `git checkout -b feat/tên-trang`)
3. Tạo thư mục mới trong `src/views/<tên-trang>/` với file `index.vue`
4. Tạo file `meta.ts` trong cùng thư mục để khai báo tên, mô tả và tác giả (route tự động được tạo)
5. Tạo Pull Request và chờ merge!

Xem trang mẫu: [`src/views/hello-world/`](src/views/hello-world/)

Xem hướng dẫn thiết kế: [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)

## Cấu trúc dự án

```
src/
  views/
    HomePage.vue                 # Trang chủ (launcher)
    hello-world/
      index.vue                  # Trang mẫu
      meta.ts                    # Thông tin trang (tên, mô tả, tác giả)
    <tên-của-bạn>/
      index.vue                  # Trang của bạn
      meta.ts                    # Thông tin trang của bạn
  router/index.ts                # Cấu hình routes
  stores/                        # Pinia stores
```

## Các lệnh thường dùng

| Lệnh | Mô tả |
|------|-------|
| `pnpm dev` | Chạy dev server |
| `pnpm build` | Build production |
| `pnpm test:unit` | Chạy unit tests |
| `pnpm lint` | Lint code |
| `pnpm format` | Format code |

## IDE

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## Contributors

<a href="https://github.com/J2TEAM/vibe.j2team.org/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=J2TEAM/vibe.j2team.org" />
</a>

Made with [contrib.rocks](https://contrib.rocks).
