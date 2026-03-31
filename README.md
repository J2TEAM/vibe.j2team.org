# vibe.j2team.org

**Sẽ thế nào nếu cả nhóm [J2TEAM Community](https://www.facebook.com/groups/j2team.community/) vibe code cùng nhau?**

Trang chủ là một Launcher, dẫn link tới các trang con do thành viên tạo ra. Mọi người tự do vibe code thoải mái trên trang của mình!

> 🚀 **[J2TEAM Launch](https://launch.j2team.dev?utm_source=github&utm_medium=readme&utm_campaign=vibe)** - Nền tảng ra mắt sản phẩm dành cho developer

## Tech Stack

- [Vue 3](https://vuejs.org/) - Progressive JavaScript Framework
- [TypeScript](https://www.typescriptlang.org/) - JavaScript với static typing
- [Vite](https://vite.dev/) - Build tool thế hệ mới
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Vue Router](https://router.vuejs.org/) - Routing
- [Pinia](https://pinia.vuejs.org/) - State management
- [VueUse](https://vueuse.org/) - 200+ composables cho Vue
- [Iconify](https://iconify.design/) - 200,000+ icons từ 150+ bộ icon

## Trang nổi bật

| Trang | Mô tả | Tác giả |
|-------|-------|---------|
| [Project 42](https://vibe.j2team.org/project-42?utm_source=github&utm_medium=readme&utm_campaign=featured) | Where does everything begin? | [sanghynh](https://vibe.j2team.org/author/sanghynh?utm_source=github&utm_medium=readme&utm_campaign=featured) |
| [Cờ Tướng Online](https://vibe.j2team.org/co-tuong?utm_source=github&utm_medium=readme&utm_campaign=featured) | Cờ Tướng P2P với webcam — chơi online qua WebRTC, có chế độ xem | [hwg](https://vibe.j2team.org/author/hwg?utm_source=github&utm_medium=readme&utm_campaign=featured) |
| [Cuộc sống hàng ngày của AI](https://vibe.j2team.org/cuoc-song-hang-ngay-cua-ai?utm_source=github&utm_medium=readme&utm_campaign=featured) | Mô tả cuộc sống của AI bằng giao diện pixel | [ngducnhatt](https://vibe.j2team.org/author/ngducnhatt?utm_source=github&utm_medium=readme&utm_campaign=featured) |
| [Gạch Bông đi cảnh](https://vibe.j2team.org/gach-bong?utm_source=github&utm_medium=readme&utm_campaign=featured) | Game nối gạch bông truyền thống — Relaxing Music Video | [hidang](https://vibe.j2team.org/author/hidang?utm_source=github&utm_medium=readme&utm_campaign=featured) |
| [CanChi](https://vibe.j2team.org/canchi?utm_source=github&utm_medium=readme&utm_campaign=featured) | Lá số Tử Vi Đẩu Số — lập lá số theo ngày tháng năm sinh | [duckocancode](https://vibe.j2team.org/author/duckocancode?utm_source=github&utm_medium=readme&utm_campaign=featured) |
| [What if?](https://vibe.j2team.org/what-if?utm_source=github&utm_medium=readme&utm_campaign=featured) | Tương lai là muôn vàn ngã rẽ và lựa chọn, nếu là bạn, bạn sẽ chọn con đường nào? | [Nhật ký học tập của Khang - KBOT](https://vibe.j2team.org/author/nhật-ký-học-tập-của-khang---kbot?utm_source=github&utm_medium=readme&utm_campaign=featured) |
| [Đập Bug](https://vibe.j2team.org/whack-a-bug?utm_source=github&utm_medium=readme&utm_campaign=featured) | Đập bug để giải tỏa áp lực coding! Đập càng nhanh, vibe càng cao | [Jimmy Trần](https://vibe.j2team.org/author/jimmy-trần?utm_source=github&utm_medium=readme&utm_campaign=featured) |
| [Flash Card](https://vibe.j2team.org/flash-card?utm_source=github&utm_medium=readme&utm_campaign=featured) | Học từ vựng hoặc kiến thức mới với thẻ ghi nhớ | [ldblckrs-258](https://vibe.j2team.org/author/ldblckrs-258?utm_source=github&utm_medium=readme&utm_campaign=featured) |
| [Resume Builder](https://vibe.j2team.org/resume-builder?utm_source=github&utm_medium=readme&utm_campaign=featured) | Soạn thảo CV bằng Markdown và xem preview đẹp real-time | [Nguyen Hoang Thong](https://vibe.j2team.org/author/nguyen-hoang-thong?utm_source=github&utm_medium=readme&utm_campaign=featured) |
| [Piano ảo](https://vibe.j2team.org/piano?utm_source=github&utm_medium=readme&utm_campaign=featured) | Chơi đàn piano ngay trên trình duyệt — dùng chuột hoặc bàn phím | [Dinh San](https://vibe.j2team.org/author/dinh-san?utm_source=github&utm_medium=readme&utm_campaign=featured) |

[Xem thêm...](https://vibe.j2team.org?utm_source=github&utm_medium=readme&utm_campaign=featured)

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
   - `shiki` — Syntax highlighter

   Các thư viện sau được **chấp thuận sẵn** và có thể thêm mà không cần approve:
   - `vue-konva` — Thư viện canvas 2D cho vẽ, game, đồ hoạ tương tác
8. **Ghi rõ tên tác giả** trong file `meta.ts` của trang

## Cách tham gia

1. Fork repo và clone về máy
2. Tạo branch mới từ `main` (ví dụ: `git checkout -b feat/tên-trang`)
3. Tạo trang mới bằng script:
   ```sh
   pnpm create:page <tên-trang>
   ```
   Script sẽ hỏi tên hiển thị, mô tả, tác giả, Facebook URL (tuỳ chọn) và danh mục, rồi tự tạo `src/views/<tên-trang>/index.vue` + `meta.ts`.
4. Code trang của bạn trong `index.vue`
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
| `pnpm create:page <slug>` | Tạo trang mới từ template |

## IDE

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## Contributors

<a href="https://github.com/J2TEAM/vibe.j2team.org/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=J2TEAM/vibe.j2team.org" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## Star History

<a href="https://www.star-history.com/?repos=J2TEAM%2Fvibe.j2team.org&type=date&legend=bottom-right">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/image?repos=J2TEAM/vibe.j2team.org&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/image?repos=J2TEAM/vibe.j2team.org&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/image?repos=J2TEAM/vibe.j2team.org&type=date&legend=top-left" />
 </picture>
</a>
