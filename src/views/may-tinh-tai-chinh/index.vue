<script setup lang="ts">
import { RouterLink } from 'vue-router'

interface Calculator {
  title: string
  desc: string
  url: string
}

interface Category {
  id: string
  title: string
  emoji: string
  accent: string
  borderHover: string
  calculators: Calculator[]
}

const BASE = 'https://maytinhtaichinh.com/cong-cu'

const STORE_URLS = {
  android: 'https://play.google.com/store/apps/details?id=com.thaptaisan.mobile&pcampaignid=web_share',
  ios: 'https://apps.apple.com/vn/app/50-máy-tính-tài-chính/id6759550075?l=vi',
  chrome: 'https://chromewebstore.google.com/detail/elkcnfiekdidhhinbkkonjadkcbfodlm?utm_source=item-share-cb',
} as const

const categories: Category[] = [
  {
    id: 'luong',
    title: 'Lương - Bảo Hiểm - Thuế',
    emoji: '💰',
    accent: 'text-accent-coral',
    borderHover: 'hover:border-accent-coral',
    calculators: [
      { title: 'Tính Lương Gross ↔ Net', desc: 'Công cụ 2 chiều: tính NET từ GROSS hoặc GROSS từ NET mong muốn. Chính xác ±1₫ theo luật 2026.', url: `${BASE}/tinh-luong-gross-net` },
    ],
  },
  {
    id: 'vay',
    title: 'Vay - Nhà - Xe',
    emoji: '🏠',
    accent: 'text-accent-amber',
    borderHover: 'hover:border-accent-amber',
    calculators: [
      { title: 'So Sánh Mua Nhà vs Thuê Nhà', desc: 'So sánh 5 năm và 10 năm. Break-even point khi nên mua vs tiếp tục thuê.', url: `${BASE}/so-sanh-mua-nha-vs-thue-nha` },
      { title: 'Tỷ Lệ Nợ An Toàn (DTI)', desc: 'Kiểm tra Debt-to-Income ratio theo chuẩn ngân hàng VN (<40%).', url: `${BASE}/tinh-ty-le-no-an-toan` },
      { title: 'Chiến Lược Trả Nợ', desc: 'Mô phỏng Snowball vs Avalanche. Tính tiết kiệm lãi với từng chiến lược.', url: `${BASE}/chien-luoc-tra-no` },
      { title: 'Tiền Vay Mua Xe', desc: 'Tính tiền trả hàng tháng và tổng chi phí sở hữu xe.', url: `${BASE}/tinh-tien-vay-mua-xe` },
    ],
  },
  {
    id: 'dautu',
    title: 'Đầu Tư - Tiết Kiệm',
    emoji: '📈',
    accent: 'text-accent-sky',
    borderHover: 'hover:border-accent-sky',
    calculators: [
      { title: 'Tra Cứu Giá Vàng Hôm Nay', desc: 'Giá vàng SJC, 9999, nhẫn trơn real-time. Chuyển đổi đơn vị, tính lãi/lỗ.', url: `${BASE}/gia-vang` },
      { title: 'Tỷ Giá Ngoại Tệ Hôm Nay', desc: 'Tra cứu tỷ giá USD, EUR, GBP, JPY real-time. Chuyển đổi nhanh.', url: `${BASE}/currency-calculator` },
      { title: 'Đầu Tư Định Kỳ DCA', desc: 'Backtest DCA vs Lump Sum với dữ liệu VN-Index.', url: `${BASE}/tinh-dau-tu-dinh-ky-dca` },
      { title: 'Quỹ Dự Phòng Khẩn Cấp', desc: 'Tính quỹ dự phòng cần thiết (3-6 tháng) và lộ trình tiết kiệm.', url: `${BASE}/tinh-quy-du-phong` },
    ],
  },
  {
    id: 'baove',
    title: 'Bảo Vệ - Rủi Ro',
    emoji: '🛡️',
    accent: 'text-accent-coral',
    borderHover: 'hover:border-accent-coral',
    calculators: [
      { title: 'Điểm Sức Khỏe Tài Chính', desc: 'Đánh giá 8 yếu tố tài chính theo chuẩn CFPB. Điểm 0-100 và lộ trình cải thiện.', url: `${BASE}/diem-suc-khoe-tai-chinh` },
    ],
  },
  {
    id: 'fire',
    title: 'FIRE - Nghỉ Hưu Sớm',
    emoji: '🔥',
    accent: 'text-accent-amber',
    borderHover: 'hover:border-accent-amber',
    calculators: [
      { title: 'FIRE Calculator', desc: 'Tính số tiền cần để nghỉ hưu sớm (Financial Independence, Retire Early).', url: `${BASE}/tinh-fire-nghi-huu-som` },
    ],
  },
]

</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <!-- Nav -->
    <nav class="fixed top-0 left-0 right-0 z-40 bg-bg-deep/80 backdrop-blur-sm border-b border-border-default">
      <div class="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-accent-coral"
        >
          &larr; Về trang chủ
        </RouterLink>
        <a
          href="https://maytinhtaichinh.com"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs font-display tracking-widest text-accent-amber transition hover:text-accent-coral"
        >
          maytinhtaichinh.com &nearr;
        </a>
      </div>
    </nav>

    <!-- Hero -->
    <header class="pt-28 pb-16 px-6">
      <div class="max-w-5xl mx-auto text-center">
        <!-- J2TEAM Launch Badge — TOP -->
        <a
          href="https://launch.j2team.dev/products/50-cong-cu-tai-chinh-quan-ly-tai-chinh-khong-can-phuc-tap-1"
          target="_blank"
          rel="noopener noreferrer"
          class="mb-8 inline-flex items-center gap-3 border border-accent-amber/30 bg-accent-amber/5 px-5 py-3 transition-all duration-300 hover:border-accent-amber hover:bg-accent-amber/10 hover:-translate-y-0.5 group animate-fade-up"
        >
          <span class="flex items-center justify-center w-10 h-10 bg-accent-amber/15 text-accent-amber">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </span>
          <span class="text-left">
            <span class="block font-display text-sm font-bold text-accent-amber group-hover:text-accent-coral transition-colors">
              🏆 #1 Product of the Month
            </span>
            <span class="block text-text-dim text-[11px] mt-0.5">
              J2TEAM Launch · February 2026
            </span>
          </span>
        </a>

        <div class="animate-fade-up animate-delay-1">
          <span class="inline-block bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 mb-6">
            MIỄN PHÍ 100%
          </span>
        </div>
        <h1 class="font-display text-4xl min-[375px]:text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight animate-fade-up animate-delay-2">
          <span class="text-accent-coral">50+</span><br>
          <span class="text-text-primary">Máy Tính Tài Chính</span>
        </h1>
        <p class="mt-6 text-text-secondary text-lg max-w-2xl mx-auto animate-fade-up animate-delay-3">
          Công cụ tính toán tài chính cá nhân miễn phí dành cho người Việt.
        </p>
      </div>
    </header>

    <!-- Personal Story -->
    <section class="px-6 pb-16">
      <div class="max-w-3xl mx-auto animate-fade-up animate-delay-4">
        <div class="border border-border-default bg-bg-surface p-8 sm:p-10 space-y-5 text-text-secondary text-sm leading-relaxed">
          <p class="text-text-primary text-base font-semibold">
            Xin chào mọi Người 👋
          </p>
          <p>
            Nhà mình vừa làm một app nhỏ — tổng hợp <span class="text-accent-amber font-semibold">50+ máy tính</span> tính toán tài chính cá nhân miễn phí cho người Việt.
          </p>
          <p>
            Nhà mình từng đứng trước rất nhiều quyết định tài chính lớn: có nên mua nhà hay tiếp tục thuê? Vay mua xe thì trả bao nhiêu mỗi tháng? Chi phí nuôi con từ lúc sinh đến hết đại học là bao nhiêu? Nợ đang vay có đang quá sức không? Rồi khi nào thì được nghỉ hưu...
          </p>
          <p>
            Và mỗi lần, câu trả lời đều là... <span class="text-accent-coral font-semibold">cảm tính</span>.
          </p>
          <p>
            Bài học đắt nhất nhà mình rút ra: phần lớn những quyết định tài chính sai lầm không phải vì thiếu tiền — mà vì <span class="text-text-primary font-medium">thiếu một con số cụ thể</span> để nhìn vào trước khi quyết định.
          </p>

          <div class="border-l-2 border-accent-amber/30 pl-5 py-1 space-y-3">
            <p class="text-text-primary font-semibold text-sm">
              App tập trung vào bối cảnh Việt Nam. Bạn chỉ cần nhập các con số cơ bản:
            </p>
            <ul class="space-y-2 text-xs text-text-secondary">
              <li><span class="text-accent-coral">①</span> Trợ lí AI hỗ trợ thắc mắc về tài chính cá nhân</li>
              <li><span class="text-accent-coral">②</span> Quản lý tài chính: FIRE Number, Barista FIRE, quỹ dự phòng, chấm điểm sức khỏe tài chính</li>
              <li><span class="text-accent-coral">③</span> Đầu tư &amp; Tiết kiệm: DCA Calculator, so sánh đầu tư vs gửi tiết kiệm, giá vàng real-time</li>
              <li><span class="text-accent-coral">④</span> Bất động sản: Mua nhà vs thuê nhà, lãi vay mua nhà, ROI bất động sản</li>
              <li><span class="text-accent-coral">⑤</span> Vay &amp; Nợ: Tỷ lệ nợ an toàn (DTI), Snowball vs Avalanche, tiền vay mua xe</li>
              <li><span class="text-accent-coral">⑥</span> Lương &amp; Thuế: Lương Gross Net 2026, thuế TNCN chi tiết, BHXH hưu trí</li>
            </ul>
          </div>

          <p>
            Đây là dự án xuất phát từ nhu cầu thực tế của gia đình mình — nhà mình tự làm để dùng trước, rồi chia sẻ lại vì tin rằng <span class="text-text-primary font-medium">mỗi gia đình Việt Nam đều xứng đáng có một công cụ tham khảo tử tế</span> — để nhìn bằng số liệu, chứ không chỉ bằng cảm tính — trước khi quyết định những việc lớn trong cuộc đời.
          </p>
          <p class="text-text-dim text-xs italic">
            Sắp tới sẽ mở rộng thêm: chi phí nuôi con chi tiết, kế hoạch nghỉ hưu toàn diện, phân tích danh mục đầu tư, bảo hiểm nhân thọ...
          </p>
          <p class="text-accent-sky text-xs">
            Nhà mình rất cần feedback từ anh chị em — đặc biệt nếu bạn thấy công thức chưa sát, chưa hợp lý, hoặc còn thiếu công cụ nào hữu ích. Mọi góp ý đều quý giá ❤️
          </p>
        </div>
      </div>
    </section>

    <!-- Dot divider -->
    <div class="flex justify-center gap-1.5 pb-16">
      <span
        v-for="n in 40"
        :key="n"
        class="w-1 h-1 rounded-full bg-border-default"
      />
    </div>

    <!-- Categories -->
    <main class="px-6 pb-20">
      <div class="max-w-5xl mx-auto space-y-16">
        <section
          v-for="(cat, catIndex) in categories"
          :key="cat.id"
          class="animate-fade-up"
          :class="`animate-delay-${Math.min(catIndex + 1, 7)}`"
        >
          <h2 class="font-display text-2xl font-semibold text-text-primary mb-2 flex items-center gap-3">
            <span :class="cat.accent" class="font-display text-sm tracking-widest">//</span>
            <span class="mr-2">{{ cat.emoji }}</span>
            {{ cat.title }}
          </h2>
          <p class="text-text-dim text-sm mb-6 ml-10">
            {{ cat.calculators.length }} công cụ đã hoạt động
          </p>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a
              v-for="(calc, calcIndex) in cat.calculators"
              :key="calcIndex"
              :href="calc.url"
              target="_blank"
              rel="noopener noreferrer"
              class="border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 group relative overflow-hidden no-underline"
              :class="cat.borderHover"
            >
              <span class="absolute top-2 right-3 font-display text-4xl font-bold text-accent-amber/5 select-none pointer-events-none">
                {{ String(calcIndex + 1).padStart(2, '0') }}
              </span>
              <h3 class="font-display text-sm font-semibold text-text-primary group-hover:text-accent-coral transition-colors leading-snug">
                {{ calc.title }}
              </h3>
              <p class="mt-2 text-text-secondary text-xs leading-relaxed">
                {{ calc.desc }}
              </p>
              <span class="mt-3 inline-block text-accent-sky text-xs font-display tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
                Mở công cụ &rarr;
              </span>
            </a>
          </div>
        </section>
      </div>
    </main>

    <!-- Dot divider 2 -->
    <div class="flex justify-center gap-1.5 pb-16">
      <span
        v-for="n in 40"
        :key="n"
        class="w-1 h-1 rounded-full bg-border-default"
      />
    </div>

    <!-- Download Platforms — BOTTOM -->
    <section class="px-6 pb-20">
      <div class="max-w-5xl mx-auto">
        <h2 class="font-display text-2xl font-semibold text-text-primary mb-8 flex items-center gap-3">
          <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
          Tải Ứng Dụng
        </h2>
        <div class="grid gap-5 sm:grid-cols-3">
          <!-- Android -->
          <a
            :href="STORE_URLS.android"
            target="_blank"
            rel="noopener noreferrer"
            class="border border-border-default bg-bg-surface p-6 flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:border-green-400 hover:bg-bg-elevated hover:shadow-lg hover:shadow-green-500/5 group no-underline"
          >
            <div class="w-14 h-14 flex items-center justify-center bg-green-500/10 text-green-400">
              <svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.523 15.341a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm-9.546 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zM3.513 9.15l-1.8-3.117a.375.375 0 0 1 .65-.376l1.823 3.158A11.956 11.956 0 0 1 12 7.5c2.668 0 5.13.868 7.114 2.315l1.823-3.158a.375.375 0 0 1 .65.376l-1.8 3.117A11.955 11.955 0 0 1 24 19.5H0a11.955 11.955 0 0 1 3.513-10.35z" />
              </svg>
            </div>
            <h3 class="font-display text-base font-semibold text-text-primary group-hover:text-green-400 transition-colors">Android</h3>
            <p class="text-text-dim text-xs text-center">Quản lý tài sản mọi lúc mọi nơi</p>
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://play.google.com/store/apps/details?id=com.thaptaisan.mobile"
              alt="QR Code Android"
              class="w-24 h-24 mt-1"
              loading="lazy"
            >
            <span class="inline-flex bg-green-500/15 text-green-400 px-5 py-2 text-xs font-display font-semibold tracking-wide transition group-hover:bg-green-500 group-hover:text-bg-deep">
              Tải về
            </span>
            <p class="text-text-dim text-[10px]">Google Play Store</p>
          </a>

          <!-- iOS -->
          <a
            :href="STORE_URLS.ios"
            target="_blank"
            rel="noopener noreferrer"
            class="border border-border-default bg-bg-surface p-6 flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:border-text-primary hover:bg-bg-elevated hover:shadow-lg hover:shadow-white/5 group no-underline"
          >
            <div class="w-14 h-14 flex items-center justify-center bg-text-primary/10 text-text-primary">
              <svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.08.05c-.52.31-2.1 1.22-2.1 3.32 0 2.49 2.19 3.38 2.21 3.39-.02.06-.34 1.15-1.12 2.37zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            </div>
            <h3 class="font-display text-base font-semibold text-text-primary">iOS</h3>
            <p class="text-text-dim text-xs text-center">Trực tiếp trên iPhone &amp; iPad</p>
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://apps.apple.com/vn/app/50-may-tinh-tai-chinh/id6759550075"
              alt="QR Code iOS"
              class="w-24 h-24 mt-1"
              loading="lazy"
            >
            <span class="inline-flex bg-text-primary/10 text-text-primary px-5 py-2 text-xs font-display font-semibold tracking-wide transition group-hover:bg-text-primary group-hover:text-bg-deep">
              Tải về
            </span>
            <p class="text-text-dim text-[10px]">App Store</p>
          </a>

          <!-- Chrome Extension -->
          <a
            :href="STORE_URLS.chrome"
            target="_blank"
            rel="noopener noreferrer"
            class="border border-border-default bg-bg-surface p-6 flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:border-accent-sky hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-sky/5 group no-underline"
          >
            <div class="w-14 h-14 flex items-center justify-center bg-accent-sky/10 text-accent-sky">
              <svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm8.88 5.166a3.636 3.636 0 1 0 2.378 0 3.636 3.636 0 0 0-2.378 0zM12 17.455a5.446 5.446 0 0 1-4.723-2.732L3.324 21.57A11.956 11.956 0 0 0 12 24c3.32 0 6.348-1.35 8.524-3.531l-3.953-6.848A5.44 5.44 0 0 1 12 17.455zM16.723 14.723A5.446 5.446 0 0 1 12 17.455V24a12 12 0 0 0 11.864-10.189l-7.141-3.088z" />
              </svg>
            </div>
            <h3 class="font-display text-base font-semibold text-text-primary group-hover:text-accent-sky transition-colors">Chrome Extension</h3>
            <p class="text-text-dim text-xs text-center">Tính toán nhanh trên thanh công cụ</p>
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://chromewebstore.google.com/detail/elkcnfiekdidhhinbkkonjadkcbfodlm"
              alt="QR Code Chrome"
              class="w-24 h-24 mt-1"
              loading="lazy"
            >
            <span class="inline-flex bg-accent-sky/15 text-accent-sky px-5 py-2 text-xs font-display font-semibold tracking-wide transition group-hover:bg-accent-sky group-hover:text-bg-deep">
              Cài đặt
            </span>
            <p class="text-text-dim text-[10px]">Chrome Web Store</p>
          </a>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="px-6 pb-20">
      <div class="max-w-5xl mx-auto text-center border border-border-default bg-bg-surface p-10">
        <h2 class="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-4">
          Sẵn sàng kiểm soát tài chính?
        </h2>
        <p class="text-text-secondary mb-8 max-w-lg mx-auto">
          Tất cả công cụ đều miễn phí, không cần đăng ký.
          Dữ liệu cập nhật theo luật Việt Nam 2026.
        </p>
        <a
          href="https://maytinhtaichinh.com"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 bg-accent-coral text-bg-deep font-display font-bold text-sm tracking-wide px-8 py-3.5 transition hover:bg-accent-amber"
        >
          Truy cập maytinhtaichinh.com &rarr;
        </a>
      </div>
    </section>

    <!-- Footer -->
    <footer class="px-6 pb-10">
      <div class="max-w-5xl mx-auto text-center">
        <p class="text-text-dim text-xs">
          Được tạo bởi
          <a
            href="https://www.facebook.com/hoangthequyen96/"
            target="_blank"
            rel="noopener noreferrer"
            class="text-text-secondary link-underline"
          >
            Quyền Hoàng
          </a>
          · Dự án
          <a
            href="https://maytinhtaichinh.com"
            target="_blank"
            rel="noopener noreferrer"
            class="text-text-secondary link-underline"
          >
            Máy Tính Tài Chính
          </a>
        </p>
      </div>
    </footer>
  </div>
</template>

