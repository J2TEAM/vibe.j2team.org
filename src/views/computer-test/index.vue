<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import KeyboardLayout from './components/KeyboardLayout.vue'
import ScreenTest from './components/ScreenTest.vue'
import WebcamTest from './components/WebcamTest.vue'
import MicTest from './components/MicTest.vue'
import SpeakerTest from './components/SpeakerTest.vue'
import BatteryTest from './components/BatteryTest.vue'
import BackToTop from '@/components/BackToTop.vue'

const currentTest = ref<'keyboard' | 'screen' | 'webcam' | 'micro' | 'speaker' | 'battery'>(
  'keyboard',
)
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col pt-20">
    <!-- Header -->
    <header class="relative max-w-5xl mx-auto px-6 w-full mb-12">
      <!-- Issue badge -->
      <div
        class="absolute top-0 right-6 bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3 animate-fade-up animate-delay-2 z-10"
      >
        VOL.01 / 2026
      </div>

      <!-- Back to home -->
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-text-secondary hover:text-accent-coral transition-colors mb-8 animate-fade-up"
      >
        <Icon icon="lucide:arrow-left" class="w-4 h-4" />
        <span class="font-display text-sm tracking-widest uppercase">Trang chủ</span>
      </RouterLink>

      <h1
        class="font-display text-6xl md:text-8xl font-bold tracking-tight text-text-primary animate-fade-up"
      >
        Computer<span class="text-accent-coral">.</span>Test
      </h1>

      <div
        class="mt-8 border-l-4 border-accent-amber pl-5 max-w-2xl animate-fade-up animate-delay-3"
      >
        <p class="text-lg text-text-secondary leading-relaxed">
          Công cụ kiểm tra phần cứng máy tính trực tuyến
        </p>
      </div>

      <!-- Navigation Tabs -->
      <nav class="mt-12 flex flex-wrap gap-4 animate-fade-up animate-delay-4">
        <button
          v-for="tab in [
            { key: 'keyboard', label: '⌨️ Bàn phím' },
            { key: 'screen', label: '🖥️ Màn hình' },
            { key: 'webcam', label: '📷 Webcam' },
            { key: 'micro', label: '🎙️ Micro' },
            { key: 'speaker', label: '🔊 Loa' },
            { key: 'battery', label: '🔋 Pin' },
          ] as const"
          :key="tab.key"
          class="px-6 py-3 font-display font-semibold transition-all duration-300 border focus:outline-none"
          :class="
            currentTest === tab.key
              ? 'bg-accent-coral border-accent-coral text-bg-deep'
              : 'border-border-default bg-bg-surface/50 text-text-secondary hover:border-accent-coral hover:text-accent-coral'
          "
          @click="currentTest = tab.key"
        >
          {{ tab.label }}
        </button>
      </nav>

      <!-- Dot divider -->
      <div class="mt-12 flex flex-wrap gap-1.5 animate-fade-up animate-delay-5">
        <span v-for="n in 40" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
      </div>
    </header>

    <!-- Content Area -->
    <main class="flex-1 w-full max-w-6xl mx-auto px-6">
      <div v-if="currentTest === 'keyboard'">
        <KeyboardLayout />
      </div>
      <div v-else-if="currentTest === 'screen'">
        <ScreenTest />
      </div>
      <div v-else-if="currentTest === 'webcam'">
        <WebcamTest />
      </div>
      <div v-else-if="currentTest === 'micro'">
        <MicTest />
      </div>
      <div v-else-if="currentTest === 'speaker'">
        <SpeakerTest />
      </div>
      <div v-else-if="currentTest === 'battery'">
        <BatteryTest />
      </div>
    </main>

    <!-- Footer-like section for SEO/Info -->
    <footer class="bg-bg-surface/30 border-t border-border-default py-16">
      <div class="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
        <!-- Keyboard instructions -->
        <template v-if="currentTest === 'keyboard'">
          <div>
            <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
              <span class="text-accent-sky text-sm tracking-widest font-display">//</span>
              Hướng dẫn sử dụng
            </h2>
            <div class="space-y-4 text-text-secondary text-sm leading-relaxed">
              <p>
                1. <strong class="text-accent-sky">Nhấn phím:</strong> Phím trên màn hình sẽ đổi màu
                khi bạn nhấn phím vật lý tương ứng
              </p>
              <p>
                2. <strong class="text-accent-sky">Màu sắc:</strong> Màu cam biểu thị phím đang
                nhấn, màu vàng biểu thị phím đã được nhấn
              </p>
              <p>
                3. <strong class="text-accent-sky">Bố cục:</strong> Chuyển đổi giữa các bố cục bàn
                phím khác nhau
              </p>
              <p>
                4. <strong class="text-accent-sky">Âm thanh:</strong> Bật âm thanh để nghe tiếng gõ
                phím
              </p>
              <p>5. <strong class="text-accent-sky">Đặt lại:</strong> Xóa toàn bộ phím đã nhấn</p>
            </div>
          </div>
          <div>
            <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
              <span class="text-accent-amber text-sm tracking-widest font-display">//</span>
              Tại sao cần test bàn phím?
            </h2>
            <div class="text-text-secondary text-sm leading-relaxed space-y-4">
              <p>
                Kiểm tra bàn phím giúp bạn phát hiện các phím bị liệt, bị kẹt hoặc hiện tượng
                ghosting (không nhận tổ hợp phím)
              </p>
              <p>
                Công cụ này hữu ích khi bạn muốn kiểm tra xem bàn phím laptop hoặc bàn phím rời có
                hoạt động hoàn hảo không
              </p>
            </div>
          </div>
        </template>

        <!-- Screen test instructions -->
        <template v-else-if="currentTest === 'screen'">
          <div>
            <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
              <span class="text-accent-sky text-sm tracking-widest font-display">//</span>
              Hướng dẫn sử dụng
            </h2>
            <div class="space-y-4 text-text-secondary text-sm leading-relaxed">
              <p>
                1. <strong class="text-accent-sky">Chọn màu:</strong> Nhấp vào ô màu muốn bắt đầu
                kiểm tra
              </p>
              <p>
                2. <strong class="text-accent-sky">Bắt đầu:</strong> Nhấn nút "Bắt đầu kiểm tra"
              </p>
              <p>
                3. <strong class="text-accent-sky">Điều hướng:</strong> Nhấn phím
                <kbd
                  class="px-1.5 py-0.5 bg-bg-deep border border-border-default text-text-dim text-xs font-display"
                  >←</kbd
                >
                <kbd
                  class="px-1.5 py-0.5 bg-bg-deep border border-border-default text-text-dim text-xs font-display"
                  >→</kbd
                >
                hoặc click chuột để đổi màu
              </p>
              <p>
                4. <strong class="text-accent-sky">Thoát:</strong> Nhấn
                <kbd
                  class="px-1.5 py-0.5 bg-bg-deep border border-border-default text-text-dim text-xs font-display"
                  >ESC</kbd
                >
                để thoát khỏi chế độ kiểm tra
              </p>
            </div>
          </div>
          <div>
            <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
              <span class="text-accent-amber text-sm tracking-widest font-display">//</span>
              Dead pixel và Stuck pixel
            </h2>
            <div class="text-text-secondary text-sm leading-relaxed space-y-4">
              <p>
                <strong class="text-accent-coral">Điểm chết (Dead pixel)</strong> là điểm ảnh hoàn
                toàn không hoạt động, thường hiển thị dưới dạng chấm đen trên mọi nền màu
              </p>
              <p>
                <strong class="text-accent-amber">Điểm kẹt (Stuck pixel)</strong> là điểm ảnh bị kẹt
                ở một màu cố định (đỏ, xanh, hoặc trắng) do sub-pixel luôn trong trạng thái bật
              </p>
              <p>
                Hãy quan sát kỹ màn hình khi hiển thị từng màu thuần, tìm các điểm bất thường có màu
                khác biệt hoặc không đổi màu khi nền chuyển sang màu mới
              </p>
            </div>
          </div>
        </template>

        <!-- Webcam test instructions -->
        <template v-else-if="currentTest === 'webcam'">
          <div>
            <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
              <span class="text-accent-sky text-sm tracking-widest font-display">//</span>
              Hướng dẫn sử dụng
            </h2>
            <div class="space-y-4 text-text-secondary text-sm leading-relaxed">
              <p>
                1. <strong class="text-accent-sky">Cấp quyền:</strong> Cho phép trình duyệt truy cập
                camera khi được yêu cầu
              </p>
              <p>
                2. <strong class="text-accent-sky">Chọn camera:</strong> Chọn camera muốn kiểm tra,
                hình ảnh trực tiếp sẽ hiện ngay bên dưới
              </p>
              <p>
                3. <strong class="text-accent-sky">Quét lại:</strong> Nhấn nút "Quét lại" nếu bạn
                vừa kết nối thêm camera mới
              </p>
            </div>
          </div>
          <div>
            <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
              <span class="text-accent-amber text-sm tracking-widest font-display">//</span>
              Tại sao cần test webcam?
            </h2>
            <div class="text-text-secondary text-sm leading-relaxed space-y-4">
              <p>
                Kiểm tra webcam giúp bạn xác nhận camera hoạt động bình thường trước khi tham gia
                cuộc họp trực tuyến hoặc ghi hình
              </p>
              <p>
                Công cụ này cũng hữu ích để kiểm tra chất lượng hình ảnh, góc quay và khả năng nhận
                diện của từng camera
              </p>
            </div>
          </div>
        </template>

        <!-- Mic test instructions -->
        <template v-else-if="currentTest === 'micro'">
          <div>
            <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
              <span class="text-accent-sky text-sm tracking-widest font-display">//</span>
              Hướng dẫn sử dụng
            </h2>
            <div class="space-y-4 text-text-secondary text-sm leading-relaxed">
              <p>
                1. <strong class="text-accent-sky">Cấp quyền:</strong> Cho phép trình duyệt truy cập
                micro khi được yêu cầu
              </p>
              <p>
                2. <strong class="text-accent-sky">Chọn micro:</strong> Có thể máy tính có nhiều
                micro
              </p>
              <p>
                3. <strong class="text-accent-sky">Âm thanh:</strong> Nói vào micro, thanh màu xanh
                lá sẽ phản hồi trực tiếp
              </p>
              <p>
                4. <strong class="text-accent-sky">Âm lượng:</strong> Dùng thanh trượt để tăng/giảm
                âm lượng khi thu âm
              </p>
              <p>
                5. <strong class="text-accent-sky">Thu âm:</strong> Nhấn "Thu âm" để ghi lại âm
                thanh, sau đó nhấn "Dừng thu" và phát lại để nghe
              </p>
            </div>
          </div>
          <div>
            <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
              <span class="text-accent-amber text-sm tracking-widest font-display">//</span>
              Tại sao cần test micro?
            </h2>
            <div class="text-text-secondary text-sm leading-relaxed space-y-4">
              <p>
                Kiểm tra micro giúp bạn đảm bảo chất lượng âm thanh tốt trước khi tham gia cuộc họp,
                gọi điện hoặc thu âm
              </p>
              <p>
                Bạn cũng có thể nghe lại và so sánh chất lượng giữa các micro để chọn micro phù hợp
                nhất
              </p>
            </div>
          </div>
        </template>

        <!-- Speaker test instructions -->
        <template v-else-if="currentTest === 'speaker'">
          <div>
            <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
              <span class="text-accent-sky text-sm tracking-widest font-display">//</span>
              Hướng dẫn sử dụng
            </h2>
            <div class="space-y-4 text-text-secondary text-sm leading-relaxed">
              <p>
                1. <strong class="text-accent-sky">Âm lượng:</strong> Chỉnh thanh trượt âm lượng
                trước khi phát
              </p>
              <p>
                2. <strong class="text-accent-sky">Chọn bài thử:</strong> Nhấn vào từng ô để phát,
                nhấn lại để dừng
              </p>
              <p>
                3. <strong class="text-accent-sky">Khảo sát:</strong> Nghe xem có tiếng rè, mất
                tiếng, hoặc lệch kênh không
              </p>
              <p>
                4. <strong class="text-accent-sky">Không nghe kênh trái/phải:</strong> Kiểm tra cài
                đặt âm thanh Stereo trong Windows/macOS
              </p>
            </div>
          </div>
          <div>
            <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
              <span class="text-accent-amber text-sm tracking-widest font-display">//</span>
              Cách đọc kết quả
            </h2>
            <div class="text-text-secondary text-sm leading-relaxed space-y-4">
              <p>
                <strong class="text-accent-coral">Tiếng rè:</strong> Thường xảy ra ở tần số thấp
                (Bass) — có thể do màng loa bị hỏng hoặc bụi bám vào
              </p>
              <p>
                <strong class="text-accent-amber">Mất kênh:</strong> Nếu không nghe được khên trái
                hoặc phải — kiểm tra cài đặt Stereo trên hệ thống hoặc dây jack 3.5mm
              </p>
              <p>
                <strong class="text-text-secondary">Bình thường:</strong> Nghe được rõ tất cả dải
                tần số và cả hai kênh — loa đang hoạt động tốt
              </p>
            </div>
          </div>
        </template>

        <!-- Battery test instructions -->
        <template v-else-if="currentTest === 'battery'">
          <div>
            <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
              <span class="text-accent-sky text-sm tracking-widest font-display">//</span>
              Hướng dẫn sử dụng
            </h2>
            <div class="space-y-4 text-text-secondary text-sm leading-relaxed">
              <p>
                1. <strong class="text-accent-sky">Xem thông tin:</strong> Trang tự động đọc thông
                tin pin từ trình duyệt (nếu được hỗ trợ)
              </p>
              <p>
                2. <strong class="text-accent-sky">Kiểm tra nhiều hơn:</strong> Chạy lệnh PowerShell
                để xem sức khỏe pin trên Windows
              </p>
            </div>
          </div>
          <div>
            <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
              <span class="text-accent-amber text-sm tracking-widest font-display">//</span>
              Tại sao cần test pin?
            </h2>
            <div class="text-text-secondary text-sm leading-relaxed space-y-4">
              <p>Pin laptop theo thời gian sẽ giảm dung lượng</p>
              <p>
                Kiểm tra định kỳ giúp bạn biết tình trạng hiện tại của pin thôi chứ lúc nó đột tử
                thì bạn cũng phải đi thay mới à
              </p>
            </div>
          </div>
        </template>
      </div>
    </footer>

    <BackToTop />
  </div>
</template>

<style scoped>
/* Custom scrollbar for keyboard container if needed */
.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}
.overflow-x-auto::-webkit-scrollbar-track {
  background: var(--color-bg-deep);
}
.overflow-x-auto::-webkit-scrollbar-thumb {
  background: var(--color-border-default);
}
.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-dim);
}
</style>
