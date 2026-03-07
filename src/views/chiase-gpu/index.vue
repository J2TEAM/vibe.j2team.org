<script setup lang="ts">
import { RouterLink } from 'vue-router'

const features = [
  {
    icon: 'gpu',
    title: 'GPU Cao Cấp',
    description: 'NVIDIA RTX 3090, 4090, A100... sẵn sàng cho AI/ML training',
  },
  {
    icon: 'container',
    title: 'Docker Container',
    description: 'Khởi tạo môi trường GPU container chỉ trong vài phút',
  },
  {
    icon: 'vps',
    title: 'VPS Giá Rẻ',
    description: 'Server ảo mạnh mẽ với giá cả phải chăng nhất thị trường',
  },
  {
    icon: 'passive',
    title: 'Kiếm Tiền Thụ Động',
    description: 'Chia sẻ GPU nhàn rỗi của bạn và nhận thu nhập hàng tháng',
  },
]

const services = [
  {
    name: 'GPU Shared',
    description: 'Thuê GPU theo GB VRAM',
    highlight: 'Từ 100 VND/giờ',
    badge: null,
    specs: [
      'Chia sẻ GPU với nhiều container',
      'Pricing: GB VRAM × Giá/GB/giờ × 20%',
      'Auto-pause khi vượt VRAM limit',
      'Real-time GPU metrics',
      'Tunnel miễn phí',
    ],
  },
  {
    name: 'GPU Dedicated',
    description: 'Thuê toàn bộ GPU device',
    highlight: 'Từ 300 VND/giờ',
    badge: 'Phổ biến nhất',
    specs: [
      'Toàn bộ GPU device độc quyền',
      'Pricing: GPU/giờ × Số lượng GPU',
      'Không giới hạn VRAM',
      'Full GPU utilization',
      'Tunnel miễn phí',
    ],
  },
  {
    name: 'CPU Container',
    description: 'Container chỉ sử dụng CPU',
    highlight: 'Từ 50 VND/giờ',
    badge: null,
    specs: [
      'CPU, RAM, Storage resources',
      'Không giới hạn bandwidth',
      'Tối ưu cho web services',
      'Real-time metrics',
      'Tunnel miễn phí',
    ],
  },
  {
    name: 'Virtual Machine',
    description: 'Máy ảo Linux hoặc Windows',
    highlight: 'Từ 70 VND/giờ',
    badge: null,
    specs: [
      'Linux VMs (Ubuntu 22.04, 24.04)',
      'Windows VMs (Win10 Pro)',
      'Fast provisioning',
      'SSH access (Linux) / RDP access (Windows)',
      'Không giới hạn CPU & RAM',
    ],
  },
]

const stats = [
  { value: '1000+', label: 'GPU Sẵn Sàng' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Hỗ Trợ' },
  { value: '<5 phút', label: 'Khởi Tạo' },
]
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-40 bg-bg-deep/90 backdrop-blur-sm border-b border-border-default">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <RouterLink to="/" class="text-text-secondary hover:text-text-primary transition-colors text-sm">
          &larr; vibe.j2team.org
        </RouterLink>
        <a
          href="https://chiasegpu.vn/"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 bg-accent-coral text-bg-deep font-display font-semibold px-4 py-2 text-sm cursor-pointer transition-all hover:bg-accent-coral/90 hover:shadow-lg hover:shadow-accent-coral/20"
        >
          Bắt Đầu Ngay
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="pt-32 pb-20 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="flex flex-col lg:flex-row items-center gap-12">
          <!-- Hero Content -->
          <div class="flex-1 text-center lg:text-left">
            <div class="animate-fade-up">
              <span class="inline-block bg-accent-sky/10 text-accent-sky font-display text-xs tracking-widest px-3 py-1.5 mb-6 border border-accent-sky/30">
                DỊCH VỤ CLOUD GPU & VPS #1 VIỆT NAM
              </span>
            </div>

            <h1 class="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight animate-fade-up animate-delay-1">
              Thuê GPU & VPS
              <span class="block text-accent-coral">Nhanh Chóng, Dễ Dàng</span>
            </h1>

            <p class="mt-6 text-text-secondary text-lg lg:text-xl max-w-xl animate-fade-up animate-delay-2">
              Hệ thống chia sẻ tài nguyên GPU, CPU và Virtual Machine phân tán.
              Khởi tạo container Docker với GPU hoặc máy ảo chỉ trong vài phút.
            </p>

            <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-up animate-delay-3">
              <a
                href="https://chiasegpu.vn/"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center gap-2 bg-accent-coral text-bg-deep font-display font-semibold px-6 py-3.5 text-base cursor-pointer transition-all hover:bg-accent-coral/90 hover:shadow-xl hover:shadow-accent-coral/30 hover:-translate-y-0.5"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Bắt Đầu Ngay
              </a>
              <a
                href="https://chiasegpu.vn/#pricing"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center gap-2 border border-border-default bg-bg-surface text-text-primary font-display font-medium px-6 py-3.5 text-base cursor-pointer transition-all hover:border-accent-amber hover:bg-bg-elevated"
              >
                Xem Bảng Giá
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
          </div>

          <!-- Hero Visual -->
          <div class="flex-1 w-full max-w-lg animate-fade-up animate-delay-4">
            <div class="relative">
              <!-- Decorative background -->
              <div class="absolute inset-0 bg-accent-coral/5 border border-accent-coral/20 -rotate-3 translate-x-2 translate-y-2" />

              <!-- Main card -->
              <div class="relative bg-bg-surface border border-border-default p-6 sm:p-8">
                <!-- Terminal header -->
                <div class="flex items-center gap-2 mb-4 pb-4 border-b border-border-default">
                  <div class="w-3 h-3 rounded-full bg-accent-coral" />
                  <div class="w-3 h-3 rounded-full bg-accent-amber" />
                  <div class="w-3 h-3 rounded-full bg-accent-sky" />
                  <span class="ml-auto text-text-dim text-xs font-display">terminal</span>
                </div>

                <!-- Terminal content -->
                <div class="font-mono text-sm space-y-3">
                  <div>
                    <span class="text-accent-sky">$</span>
                    <span class="text-text-secondary ml-2">chiasegpu deploy --gpu rtx4090</span>
                  </div>
                  <div class="text-text-dim">
                    → Đang khởi tạo container...
                  </div>
                  <div class="text-accent-amber">
                    ✓ Container đã sẵn sàng trong 2 phút 34 giây
                  </div>
                  <div>
                    <span class="text-accent-sky">$</span>
                    <span class="text-text-secondary ml-2">nvidia-smi</span>
                  </div>
                  <div class="text-text-dim text-xs leading-relaxed">
                    NVIDIA RTX 4090 | 24GB | CUDA 12.4<br />
                    Driver: 550.54.14 | PyTorch: 2.2.0
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 animate-fade-up animate-delay-5">
          <div
            v-for="(stat, index) in stats"
            :key="index"
            class="text-center p-6 border border-border-default bg-bg-surface/50"
          >
            <div class="font-display text-3xl sm:text-4xl font-bold text-accent-coral">
              {{ stat.value }}
            </div>
            <div class="mt-2 text-text-secondary text-sm">
              {{ stat.label }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 px-6 bg-bg-surface/30">
      <div class="max-w-6xl mx-auto">
        <h2 class="font-display text-2xl sm:text-3xl font-semibold text-text-primary mb-4 flex items-center gap-3 animate-fade-up">
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          Tại Sao Chọn ChiaSe GPU?
        </h2>
        <p class="text-text-secondary max-w-2xl mb-12 animate-fade-up animate-delay-1">
          Giải pháp cloud GPU toàn diện cho AI/ML developers, researchers và startups Việt Nam.
        </p>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="(feature, index) in features"
            :key="index"
            class="group relative border border-border-default bg-bg-surface p-6 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 animate-fade-up"
            :class="`animate-delay-${index + 2}`"
          >
            <!-- Icon -->
            <div class="w-12 h-12 flex items-center justify-center bg-accent-coral/10 text-accent-coral mb-4 transition-colors group-hover:bg-accent-coral group-hover:text-bg-deep">
              <!-- GPU Icon -->
              <svg v-if="feature.icon === 'gpu'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <!-- Container Icon -->
              <svg v-else-if="feature.icon === 'container'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <!-- VPS Icon -->
              <svg v-else-if="feature.icon === 'vps'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
              <!-- Passive Income Icon -->
              <svg v-else-if="feature.icon === 'passive'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h3 class="font-display text-lg font-semibold text-text-primary mb-2 group-hover:text-accent-coral transition-colors">
              {{ feature.title }}
            </h3>
            <p class="text-text-secondary text-sm leading-relaxed">
              {{ feature.description }}
            </p>

            <!-- Background number -->
            <span class="absolute top-3 right-4 font-display text-5xl font-bold text-accent-coral/5 select-none pointer-events-none">
              0{{ index + 1 }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Services Section -->
    <section class="py-20 px-6">
      <div class="max-w-6xl mx-auto">
        <h2 class="font-display text-2xl sm:text-3xl font-semibold text-text-primary mb-4 flex items-center gap-3 animate-fade-up">
          <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
          Sản Phẩm Của Chúng Tôi
        </h2>
        <p class="text-text-secondary max-w-2xl mb-12 animate-fade-up animate-delay-1">
          Chọn loại tài nguyên phù hợp với nhu cầu của bạn: GPU Containers cho AI/ML,
          CPU Containers cho web services, hoặc Virtual Machines cho môi trường hoàn toàn tách biệt.
        </p>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="(service, index) in services"
            :key="index"
            class="group relative flex flex-col border border-border-default bg-bg-surface transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-accent-amber hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-amber/5 animate-fade-up"
            :class="`animate-delay-${index + 2}`"
          >
            <!-- Popular badge -->
            <div v-if="service.badge" class="absolute -top-3 left-1/2 -translate-x-1/2">
              <span class="bg-accent-amber text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1 whitespace-nowrap">
                {{ service.badge }}
              </span>
            </div>

            <!-- Header -->
            <div class="p-6 border-b border-border-default">
              <div class="text-text-dim text-xs font-display tracking-wide mb-2">
                {{ service.description }}
              </div>
              <h3 class="font-display text-lg font-semibold text-text-primary group-hover:text-accent-amber transition-colors">
                {{ service.name }}
              </h3>
              <div class="mt-3 font-display text-2xl font-bold text-accent-amber">
                {{ service.highlight }}
              </div>
            </div>

            <!-- Specs -->
            <div class="p-6 flex-1">
              <ul class="space-y-2.5">
                <li
                  v-for="(spec, specIndex) in service.specs"
                  :key="specIndex"
                  class="flex items-start gap-2.5 text-sm"
                >
                  <svg class="w-4 h-4 text-accent-amber shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-text-secondary">{{ spec }}</span>
                </li>
              </ul>
            </div>

            <!-- CTA -->
            <div class="p-6 pt-0">
              <a
                href="https://chiasegpu.vn/"
                target="_blank"
                rel="noopener noreferrer"
                class="block w-full text-center border border-accent-amber/50 text-accent-amber font-display font-medium px-4 py-3 text-sm cursor-pointer transition-all hover:bg-accent-amber hover:text-bg-deep"
              >
                Bắt Đầu
              </a>
            </div>
          </div>
        </div>

        <p class="mt-6 text-text-dim text-xs text-center animate-fade-up animate-delay-7">
          Lưu ý: Giá có thể thay đổi tùy theo máy chủ và tài nguyên được cấp phát. Tính phí theo giờ sử dụng thực tế.
        </p>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="py-20 px-6 bg-bg-surface/30">
      <div class="max-w-6xl mx-auto">
        <h2 class="font-display text-2xl sm:text-3xl font-semibold text-text-primary mb-4 flex items-center gap-3 animate-fade-up">
          <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
          Bắt Đầu Chỉ Với 3 Bước
        </h2>
        <p class="text-text-secondary max-w-2xl mb-12 animate-fade-up animate-delay-1">
          Quy trình đơn giản, nhanh chóng để bạn có ngay môi trường GPU/VPS mong muốn.
        </p>

        <div class="grid gap-8 sm:grid-cols-3">
          <div class="relative animate-fade-up animate-delay-2">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-10 h-10 flex items-center justify-center bg-accent-sky text-bg-deep font-display font-bold text-lg">
                1
              </div>
              <div class="flex-1 h-px bg-border-default hidden sm:block" />
            </div>
            <h3 class="font-display text-lg font-semibold text-text-primary mb-2">
              Đăng Ký Tài Khoản
            </h3>
            <p class="text-text-secondary text-sm leading-relaxed">
              Tạo tài khoản miễn phí trong 30 giây. Hỗ trợ đăng nhập qua Google, GitHub.
            </p>
          </div>

          <div class="relative animate-fade-up animate-delay-3">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-10 h-10 flex items-center justify-center bg-accent-sky text-bg-deep font-display font-bold text-lg">
                2
              </div>
              <div class="flex-1 h-px bg-border-default hidden sm:block" />
            </div>
            <h3 class="font-display text-lg font-semibold text-text-primary mb-2">
              Chọn Cấu Hình
            </h3>
            <p class="text-text-secondary text-sm leading-relaxed">
              Lựa chọn GPU, CPU, RAM và storage phù hợp với workload của bạn.
            </p>
          </div>

          <div class="relative animate-fade-up animate-delay-4">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-10 h-10 flex items-center justify-center bg-accent-sky text-bg-deep font-display font-bold text-lg">
                3
              </div>
            </div>
            <h3 class="font-display text-lg font-semibold text-text-primary mb-2">
              Deploy & Code
            </h3>
            <p class="text-text-secondary text-sm leading-relaxed">
              Container sẵn sàng trong vài phút. Jupyter Lab, SSH, VS Code đều hỗ trợ.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-24 px-6">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-6 animate-fade-up">
          Sẵn Sàng Bắt Đầu?
        </h2>
        <p class="text-text-secondary text-lg max-w-2xl mx-auto mb-10 animate-fade-up animate-delay-1">
          Đăng ký ngay và tham gia nhóm Zalo/Telegram để nhận GIFT CODE dùng thử miễn phí!
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up animate-delay-2">
          <a
            href="https://chiasegpu.vn/"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center gap-2 bg-accent-coral text-bg-deep font-display font-semibold px-8 py-4 text-base cursor-pointer transition-all hover:bg-accent-coral/90 hover:shadow-xl hover:shadow-accent-coral/30 hover:-translate-y-0.5"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Bắt Đầu Ngay
          </a>
          <a
            href="https://chiasegpu.vn/"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center gap-2 border border-accent-amber text-accent-amber font-display font-medium px-8 py-4 text-base cursor-pointer transition-all hover:bg-accent-amber hover:text-bg-deep"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Chia Sẻ GPU Của Bạn
          </a>
        </div>

        <!-- Trust badges -->
        <div class="mt-16 flex flex-wrap items-center justify-center gap-6 text-text-dim text-sm animate-fade-up animate-delay-3">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Bảo Mật Cao</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>Thanh Toán Linh Hoạt</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Hỗ Trợ 24/7</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Fixed Social Buttons -->
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <!-- Zalo -->
      <a
        href="https://zalo.me/g/megmrj936"
        target="_blank"
        rel="noopener noreferrer"
        title="Tham gia nhóm Zalo"
        class="group flex items-center gap-0 overflow-hidden bg-[#0068FF] text-white cursor-pointer shadow-lg shadow-black/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#0068FF]/30 hover:pr-3"
      >
        <div class="w-12 h-12 flex items-center justify-center shrink-0">
          <!-- Zalo SVG icon -->
          <svg class="w-6 h-6" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 4C12.954 4 4 12.954 4 24C4 29.012 5.836 33.59 8.88 37.13L6 44L13.154 41.424C16.536 43.422 20.138 44 24 44C35.046 44 44 35.046 44 24C44 12.954 35.046 4 24 4Z" fill="white"/>
            <path d="M13 19H22L13 29H23M26 19V29M26 19C26 19 26 22.5 29.5 22.5C33 22.5 33 19 33 19M29.5 22.5V29" stroke="#0068FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap transition-all duration-300 text-sm font-display font-semibold">
          Zalo Group
        </span>
      </a>

      <!-- Telegram -->
      <a
        href="https://t.me/chiasegpu"
        target="_blank"
        rel="noopener noreferrer"
        title="Tham gia nhóm Telegram"
        class="group flex items-center gap-0 overflow-hidden bg-[#229ED9] text-white cursor-pointer shadow-lg shadow-black/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#229ED9]/30 hover:pr-3"
      >
        <div class="w-12 h-12 flex items-center justify-center shrink-0">
          <!-- Telegram SVG icon -->
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        </div>
        <span class="max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap transition-all duration-300 text-sm font-display font-semibold">
          Telegram
        </span>
      </a>
    </div>

    <!-- Footer -->
    <footer class="py-8 px-6 border-t border-border-default">
      <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="text-text-dim text-sm">
          © 2026 <a href="https://chiasegpu.vn/" target="_blank" rel="noopener noreferrer" class="text-text-secondary hover:text-text-primary transition-colors link-underline">ChiaSe GPU</a>. Tất cả quyền được bảo lưu.
        </div>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Về trang chủ vibe.j2team.org
        </RouterLink>
      </div>
    </footer>
  </div>
</template>
