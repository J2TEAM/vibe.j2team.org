<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-24">
      <AppBreadcrumb :items="[{ label: 'Chính sách bảo mật' }]" />

      <h1
        class="mt-8 font-display text-3xl sm:text-4xl font-bold text-text-primary flex items-center gap-3"
      >
        <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
        Chính sách bảo mật
      </h1>

      <p class="mt-6 text-text-secondary leading-relaxed">
        Chúng tôi tôn trọng quyền riêng tư của bạn. Trang này giải thích cách vibe.j2team.org xử lý
        dữ liệu khi bạn truy cập.
      </p>

      <!-- Dữ liệu chúng tôi KHÔNG thu thập -->
      <section class="mt-12">
        <h2 class="font-display text-xl font-semibold text-accent-amber flex items-center gap-3">
          Dữ liệu chúng tôi không thu thập
        </h2>
        <ul class="mt-4 space-y-3 text-text-secondary text-sm leading-relaxed">
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            Không có tài khoản đăng nhập — chúng tôi không thu thập tên, email, hay thông tin cá
            nhân
          </li>
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            Không có cơ sở dữ liệu — không dữ liệu nào của bạn được lưu trên máy chủ
          </li>
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            Không yêu cầu đăng ký hay đăng nhập để sử dụng
          </li>
        </ul>
      </section>

      <!-- Dữ liệu lưu trên thiết bị -->
      <section class="mt-12">
        <h2 class="font-display text-xl font-semibold text-text-primary flex items-center gap-3">
          Dữ liệu lưu trên thiết bị của bạn
        </h2>
        <p class="mt-4 text-text-secondary text-sm leading-relaxed">
          Một số tính năng sử dụng <strong class="text-text-primary">localStorage</strong> của trình
          duyệt để lưu dữ liệu trực tiếp trên thiết bị của bạn. Dữ liệu này không được gửi đến bất
          kỳ máy chủ nào.
        </p>
        <ul class="mt-4 space-y-3 text-text-secondary text-sm leading-relaxed">
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            Danh sách trang yêu thích (bookmarks)
          </li>
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            Lịch sử xem gần đây
          </li>
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            Tuỳ chọn và dữ liệu của từng ứng dụng con
          </li>
        </ul>
        <p class="mt-4 text-text-secondary text-sm leading-relaxed">
          Bạn có thể xoá dữ liệu này bất cứ lúc nào bằng cách xoá dữ liệu trình duyệt hoặc
          localStorage của trang.
        </p>
      </section>

      <!-- Dịch vụ bên thứ ba -->
      <section class="mt-12">
        <h2 class="font-display text-xl font-semibold text-text-primary flex items-center gap-3">
          Dịch vụ bên thứ ba
        </h2>
        <p class="mt-4 text-text-secondary text-sm leading-relaxed">
          Trang web sử dụng một số dịch vụ bên thứ ba. Mỗi dịch vụ có chính sách bảo mật riêng:
        </p>
        <ul class="mt-4 space-y-3 text-text-secondary text-sm leading-relaxed">
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            <span>
              <strong class="text-text-primary">Google Analytics</strong> — chúng tôi sử dụng Google
              Analytics 4 để phân tích lưu lượng truy cập (số lượt xem trang, thời gian truy cập,
              thiết bị, quốc gia). Google có thể sử dụng cookie và thu thập dữ liệu kỹ thuật như địa
              chỉ IP (được ẩn danh). Xem thêm
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer nofollow"
                class="text-accent-coral link-underline"
                >chính sách bảo mật của Google</a
              >
            </span>
          </li>
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            <span>
              <strong class="text-text-primary">Cloudflare</strong> — hosting và CDN. Cloudflare có
              thể thu thập dữ liệu kỹ thuật (địa chỉ IP, thông tin trình duyệt) để bảo vệ và tối ưu
              dịch vụ
            </span>
          </li>
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            <span>
              <strong class="text-text-primary">Giscus</strong> — hệ thống bình luận dựa trên GitHub
              Discussions. Khi bạn bình luận, dữ liệu được xử lý qua GitHub
            </span>
          </li>
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            <span>
              <strong class="text-text-primary">Iconify CDN</strong> — tải biểu tượng (icons) theo
              yêu cầu
            </span>
          </li>
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            <span>
              <strong class="text-text-primary">Các API bên ngoài</strong> — một số ứng dụng con có
              thể gọi đến API công khai (thời tiết, từ điển, v.v.). Dữ liệu gửi đi tuỳ thuộc vào
              từng ứng dụng cụ thể
            </span>
          </li>
        </ul>
      </section>

      <!-- Ứng dụng do cộng đồng đóng góp -->
      <section class="mt-12">
        <h2 class="font-display text-xl font-semibold text-accent-coral flex items-center gap-3">
          Ứng dụng do cộng đồng đóng góp
        </h2>
        <p class="mt-4 text-text-secondary text-sm leading-relaxed">
          Các trang con được tạo bởi thành viên cộng đồng và có thể sử dụng thêm dịch vụ bên thứ ba
          khác. Mặc dù chúng tôi kiểm duyệt mã nguồn trước khi chấp nhận, chúng tôi không thể đảm
          bảo hoàn toàn về hành vi của từng ứng dụng. Nếu bạn phát hiện ứng dụng nào có hành vi đáng
          ngờ, vui lòng
          <a
            href="https://github.com/J2TEAM/vibe.j2team.org/issues"
            target="_blank"
            rel="noopener noreferrer nofollow"
            class="text-accent-coral link-underline"
            >báo cáo trên GitHub</a
          >.
        </p>
      </section>

      <div class="mt-16 pt-8 border-t border-border-default">
        <p class="text-xs text-text-dim">
          Chính sách bảo mật này có thể được cập nhật theo thời gian. Việc tiếp tục sử dụng trang
          web đồng nghĩa với việc bạn chấp nhận phiên bản mới nhất.
        </p>
        <p class="mt-4 text-xs text-text-dim flex items-center gap-2 flex-wrap">
          <RouterLink
            to="/content-policy"
            class="text-text-dim hover:text-text-secondary transition-colors link-underline"
          >
            Chính sách nội dung
          </RouterLink>
          <span class="text-border-default">·</span>
          <RouterLink
            to="/terms"
            class="text-text-dim hover:text-text-secondary transition-colors link-underline"
          >
            Điều khoản sử dụng
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
