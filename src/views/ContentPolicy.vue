<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-24">
      <AppBreadcrumb :items="[{ label: 'Chính sách nội dung' }]" />

      <h1
        class="mt-8 font-display text-3xl sm:text-4xl font-bold text-text-primary flex items-center gap-3"
      >
        <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
        Chính sách nội dung
      </h1>

      <p class="mt-6 text-text-secondary leading-relaxed">
        Dự án vibe.j2team.org là nơi các thành viên cộng đồng J2TEAM cùng nhau sáng tạo. Để giữ cho
        không gian này lành mạnh và hữu ích, tất cả trang con đóng góp vào dự án cần tuân thủ các
        quy định dưới đây.
      </p>

      <!-- Nội dung được phép -->
      <section class="mt-12">
        <h2 class="font-display text-xl font-semibold text-accent-amber flex items-center gap-3">
          Nội dung được phép
        </h2>
        <ul class="mt-4 space-y-3 text-text-secondary text-sm leading-relaxed">
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            Ứng dụng web, công cụ tiện ích, trò chơi
          </li>
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            Thử nghiệm sáng tạo, demo công nghệ
          </li>
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            Trang cá nhân giới thiệu bản thân (không quảng cáo dịch vụ bên ngoài)
          </li>
          <li class="flex gap-3">
            <span class="text-accent-amber shrink-0">+</span>
            Nội dung giáo dục, hướng dẫn, chia sẻ kiến thức
          </li>
        </ul>
      </section>

      <!-- Nội dung không được phép -->
      <section class="mt-12">
        <h2 class="font-display text-xl font-semibold text-accent-coral flex items-center gap-3">
          Nội dung không được phép
        </h2>
        <ul class="mt-4 space-y-3 text-text-secondary text-sm leading-relaxed">
          <li class="flex gap-3">
            <span class="text-accent-coral shrink-0">&times;</span>
            Nội dung khiêu dâm, bạo lực, hoặc không phù hợp (NSFW)
          </li>
          <li class="flex gap-3">
            <span class="text-accent-coral shrink-0">&times;</span>
            Spam, quảng cáo thương mại, hoặc tiếp thị liên kết (affiliate)
          </li>
          <li class="flex gap-3">
            <span class="text-accent-coral shrink-0">&times;</span>
            Vi phạm bản quyền — không sao chép nội dung, hình ảnh, hoặc mã nguồn của người khác mà
            không có quyền sử dụng
          </li>
          <li class="flex gap-3">
            <span class="text-accent-coral shrink-0">&times;</span>
            Mã độc, phishing, hoặc bất kỳ hình thức tấn công nào
          </li>
          <li class="flex gap-3">
            <span class="text-accent-coral shrink-0">&times;</span>
            Thu thập dữ liệu cá nhân của người dùng mà không có sự đồng ý
          </li>
          <li class="flex gap-3">
            <span class="text-accent-coral shrink-0">&times;</span>
            Landing page, trang giới thiệu cho sản phẩm, dịch vụ, hoặc thương hiệu bên ngoài
          </li>
          <li class="flex gap-3">
            <span class="text-accent-coral shrink-0">&times;</span>
            Trang có mục đích chính là dẫn người dùng tới website hoặc dịch vụ khác
          </li>
          <li class="flex gap-3">
            <span class="text-accent-coral shrink-0">&times;</span>
            Nội dung vi phạm pháp luật Việt Nam
          </li>
          <li class="flex gap-3">
            <span class="text-accent-coral shrink-0">&times;</span>
            Nội dung phân biệt đối xử, kích động thù hận, hoặc quấy rối
          </li>
        </ul>
      </section>

      <!-- Xử lý vi phạm -->
      <section class="mt-12">
        <h2 class="font-display text-xl font-semibold text-text-primary flex items-center gap-3">
          Xử lý vi phạm
        </h2>
        <div class="mt-4 space-y-4 text-text-secondary text-sm leading-relaxed">
          <div class="flex gap-4 items-start">
            <span class="font-display text-lg font-bold text-accent-amber/50 shrink-0 w-8">01</span>
            <p>Cảnh báo và yêu cầu chỉnh sửa nội dung vi phạm</p>
          </div>
          <div class="flex gap-4 items-start">
            <span class="font-display text-lg font-bold text-accent-amber/50 shrink-0 w-8">02</span>
            <p>Gỡ trang vi phạm khỏi dự án nếu không chỉnh sửa</p>
          </div>
          <div class="flex gap-4 items-start">
            <span class="font-display text-lg font-bold text-accent-amber/50 shrink-0 w-8">03</span>
            <p>Cấm đóng góp trong trường hợp vi phạm nghiêm trọng hoặc tái phạm</p>
          </div>
        </div>
      </section>

      <!-- Báo cáo vi phạm -->
      <section class="mt-12">
        <h2 class="font-display text-xl font-semibold text-text-primary flex items-center gap-3">
          Báo cáo vi phạm
        </h2>
        <p class="mt-4 text-text-secondary text-sm leading-relaxed">
          Nếu bạn phát hiện nội dung vi phạm chính sách, vui lòng tạo
          <a
            href="https://github.com/J2TEAM/vibe.j2team.org/issues"
            target="_blank"
            rel="noopener noreferrer nofollow"
            class="text-accent-coral link-underline"
            >issue trên GitHub</a
          >
          hoặc liên hệ qua
          <a
            href="https://www.facebook.com/groups/j2team.community/"
            target="_blank"
            rel="noopener noreferrer nofollow"
            class="text-accent-coral link-underline"
            >J2TEAM Community</a
          >.
        </p>
      </section>

      <div class="mt-16 pt-8 border-t border-border-default">
        <p class="text-xs text-text-dim">
          Chính sách này có thể được cập nhật theo thời gian. Việc tiếp tục đóng góp đồng nghĩa với
          việc bạn đồng ý tuân thủ phiên bản mới nhất của chính sách.
        </p>
        <p class="mt-4 text-xs text-text-dim flex items-center gap-2 flex-wrap">
          <RouterLink
            to="/terms"
            class="text-text-dim hover:text-text-secondary transition-colors link-underline"
          >
            Điều khoản sử dụng
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
