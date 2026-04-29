<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-24">
      <AppBreadcrumb :items="[{ label: 'Điều khoản sử dụng' }]" />

      <h1
        class="mt-8 font-display text-3xl sm:text-4xl font-bold text-text-primary flex items-center gap-3"
      >
        <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
        Điều khoản sử dụng
      </h1>

      <p class="mt-6 text-text-secondary leading-relaxed">
        Bằng việc truy cập và sử dụng vibe.j2team.org, bạn đồng ý tuân thủ các điều khoản dưới đây.
        Vui lòng đọc kỹ trước khi sử dụng.
      </p>

      <!-- Giới thiệu -->
      <section class="mt-12">
        <h2 class="font-display text-xl font-semibold text-accent-amber flex items-center gap-3">
          Giới thiệu
        </h2>
        <p class="mt-4 text-text-secondary text-sm leading-relaxed">
          vibe.j2team.org là một dự án mã nguồn mở của cộng đồng J2TEAM, nơi các thành viên cùng
          nhau tạo các ứng dụng web nhỏ (sub-apps). Dự án được vận hành phi lợi nhuận và phục vụ mục
          đích học tập, sáng tạo.
        </p>
      </section>

      <!-- Quyền và trách nhiệm của người dùng -->
      <section class="mt-12">
        <h2 class="font-display text-xl font-semibold text-accent-amber flex items-center gap-3">
          Quyền và trách nhiệm của người dùng
        </h2>
        <ul class="mt-4 space-y-3 text-text-secondary text-sm leading-relaxed">
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            Bạn được tự do truy cập và sử dụng tất cả các ứng dụng trên trang web
          </li>
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            Bạn có thể đóng góp trang con theo hướng dẫn của dự án
          </li>
          <li class="flex gap-3">
            <span class="text-accent-coral shrink-0">&times;</span>
            Không sử dụng trang web cho mục đích bất hợp pháp hoặc gây hại
          </li>
          <li class="flex gap-3">
            <span class="text-accent-coral shrink-0">&times;</span>
            Không cố gắng tấn công, khai thác lỗ hổng, hoặc làm gián đoạn dịch vụ
          </li>
        </ul>
      </section>

      <!-- Nội dung do cộng đồng đóng góp -->
      <section class="mt-12">
        <h2 class="font-display text-xl font-semibold text-text-primary flex items-center gap-3">
          Nội dung do cộng đồng đóng góp
        </h2>
        <ul class="mt-4 space-y-3 text-text-secondary text-sm leading-relaxed">
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            Các trang con (sub-apps) được tạo bởi thành viên cộng đồng, không phải bởi đội ngũ quản
            trị
          </li>
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            Tác giả chịu trách nhiệm về nội dung trang con của mình
          </li>
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            Chúng tôi có quyền gỡ bỏ bất kỳ trang con nào vi phạm
            <RouterLink to="/content-policy" class="text-accent-coral link-underline"
              >chính sách nội dung</RouterLink
            >
          </li>
        </ul>
      </section>

      <!-- Sở hữu trí tuệ -->
      <section class="mt-12">
        <h2 class="font-display text-xl font-semibold text-text-primary flex items-center gap-3">
          Sở hữu trí tuệ
        </h2>
        <ul class="mt-4 space-y-3 text-text-secondary text-sm leading-relaxed">
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            Mã nguồn dự án được phát hành theo giấy phép mã nguồn mở trên
            <a
              href="https://github.com/J2TEAM/vibe.j2team.org"
              target="_blank"
              rel="noopener noreferrer nofollow"
              class="text-accent-coral link-underline"
              >GitHub</a
            >
          </li>
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            Nội dung do từng tác giả tạo ra thuộc quyền sở hữu của tác giả đó
          </li>
        </ul>
      </section>

      <!-- Miễn trừ trách nhiệm -->
      <section class="mt-12">
        <h2 class="font-display text-xl font-semibold text-accent-coral flex items-center gap-3">
          Miễn trừ trách nhiệm
        </h2>
        <ul class="mt-4 space-y-3 text-text-secondary text-sm leading-relaxed">
          <li class="flex gap-3">
            <span class="text-accent-coral shrink-0">&times;</span>
            Trang web được cung cấp nguyên trạng ("as is"), không có bảo đảm nào về tính khả dụng
            hoặc chính xác
          </li>
          <li class="flex gap-3">
            <span class="text-accent-coral shrink-0">&times;</span>
            Chúng tôi không chịu trách nhiệm cho bất kỳ thiệt hại nào phát sinh từ việc sử dụng các
            ứng dụng do cộng đồng đóng góp
          </li>
          <li class="flex gap-3">
            <span class="text-accent-coral shrink-0">&times;</span>
            Các ứng dụng có thể gọi đến dịch vụ bên thứ ba — việc sử dụng các dịch vụ đó tuân theo
            điều khoản riêng của họ
          </li>
        </ul>
      </section>

      <div class="mt-16 pt-8 border-t border-border-default">
        <p class="text-xs text-text-dim">
          Điều khoản này có thể được cập nhật theo thời gian. Việc tiếp tục sử dụng trang web đồng
          nghĩa với việc bạn chấp nhận phiên bản mới nhất của điều khoản.
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
            to="/privacy"
            class="text-text-dim hover:text-text-secondary transition-colors link-underline"
          >
            Chính sách bảo mật
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
