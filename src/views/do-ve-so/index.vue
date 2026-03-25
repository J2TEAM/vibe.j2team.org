<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import BackToTop from '@/components/BackToTop.vue'

// Tên các tỉnh/thành phố theo miền
type RegionKey = 'north' | 'central' | 'south'

interface RegionData {
  name: string
  provinces: string[]
}

const regions: Record<RegionKey, RegionData> = {
  north: {
    name: 'Miền Bắc',
    provinces: ['Truyền thống'],
  },
  central: {
    name: 'Miền Trung',
    provinces: [
      'Đà Nẵng',
      'Quảng Nam',
      'Đắk Lắk',
      'Quảng Ngãi',
      'Đắk Nông',
      'Kon Tum',
      'Phú Yên',
      'Thừa Thiên Huế',
      'Khánh Hòa',
      'Bình Định',
      'Quảng Bình',
      'Quảng Trị',
      'Gia Lai',
      'Ninh Thuận',
    ],
  },
  south: {
    name: 'Miền Nam',
    provinces: [
      'TP.HCM',
      'Đồng Nai',
      'Bình Dương',
      'Vũng Tàu',
      'Long An',
      'Tiền Giang',
      'Tây Ninh',
      'An Giang',
      'Vĩnh Long',
      'Trà Vinh',
      'Bình Thuận',
      'Bình Phước',
      'Hậu Giang',
      'Kiên Giang',
      'Đà Lạt',
      'Bến Tre',
      'Bạc Liêu',
      'Cần Thơ',
      'Sóc Trăng',
      'Đồng Tháp',
      'Cà Mau',
    ],
  },
}

// Form data
const form = reactive({
  region: 'south' as RegionKey,
  province: 'TP.HCM',
  date: new Date().toISOString().split('T')[0] as string,
  number: '',
})

// Trạng thái tìm kiếm
const isSearching = ref(false)
const hasResult = ref(false)
const searchError = ref('')
const rawPrizes = ref<Record<string, string[]>>({})
const winResults = ref<Array<{ prizeName: string; matchedNumber: string }>>([])
const fetchProvStr = ref('')
const fetchDateStr = ref('')

// Effect states
const showWinEffect = ref(false)
const showLoseEffect = ref(false)
const winMessage = ref('')

const confettis = Array.from({ length: 100 }).map(() => ({
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 2.5}s`,
  rotation: `${Math.random() * 360}deg`,
  color: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#f7fff7', '#a06cd5'][Math.floor(Math.random() * 5)],
}))

const provinceCodes: Record<string, string> = {
  'Truyền thống': 'mien-bac',
  'Đà Nẵng': 'da-nang',
  'Quảng Nam': 'quang-nam',
  'Đắk Lắk': 'dak-lak',
  'Quảng Ngãi': 'quang-ngai',
  'Đắk Nông': 'dak-nong',
  'Kon Tum': 'kon-tum',
  'Phú Yên': 'phu-yen',
  'Thừa Thiên Huế': 'thua-thien-hue',
  'Khánh Hòa': 'khanh-hoa',
  'Bình Định': 'binh-dinh',
  'Quảng Bình': 'quang-binh',
  'Quảng Trị': 'quang-tri',
  'Gia Lai': 'gia-lai',
  'Ninh Thuận': 'ninh-thuan',
  'TP.HCM': 'tp-hcm',
  'Đồng Nai': 'dong-nai',
  'Bình Dương': 'binh-duong',
  'Vũng Tàu': 'vung-tau',
  'Long An': 'long-an',
  'Tiền Giang': 'tien-giang',
  'Tây Ninh': 'tay-ninh',
  'An Giang': 'an-giang',
  'Vĩnh Long': 'vinh-long',
  'Trà Vinh': 'tra-vinh',
  'Bình Thuận': 'binh-thuan',
  'Bình Phước': 'binh-phuoc',
  'Hậu Giang': 'hau-giang',
  'Kiên Giang': 'kien-giang',
  'Đà Lạt': 'da-lat',
  'Bến Tre': 'ben-tre',
  'Bạc Liêu': 'bac-lieu',
  'Cần Thơ': 'can-tho',
  'Sóc Trăng': 'soc-trang',
  'Đồng Tháp': 'dong-thap',
  'Cà Mau': 'ca-mau',
}

// Intercept HTML từ mã JS của Minh Ngọc
const interceptData = (province: string, dmy: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const win = window as unknown as Record<string, unknown>
    const original$ = win.$
    let interceptedHtml = ''

    win.bgcolor = ''
    win.titlecolor = ''
    win.dbcolor = ''
    win.kqwidth = ''
    win.fsize = ''

    win.$ = (selector: string | object) => {
      return {
        html: () => {},
        append: (htmlStr: string) => {
          if (selector === '#box_kqxs_minhngoc') {
            interceptedHtml += htmlStr
          }
        },
        css: () => {},
        val: () => '',
        height: () => 0,
      }
    }

    const script = document.createElement('script')
    script.src = `https://www.minhngoc.net.vn/getkqxs/${province}/${dmy}.js`

    script.onload = () => {
      win.$ = original$
      document.body.removeChild(script)
      resolve(interceptedHtml)
    }

    script.onerror = () => {
      win.$ = original$
      document.body.removeChild(script)
      reject(new Error('Lỗi kết nối đến máy chủ xổ số. Vui lòng chọn đài/ngày khác.'))
    }

    document.body.appendChild(script)
  })
}

const checkWin = (ticket: string, prizes: Record<string, string[]>) => {
  const result: { prizeName: string; matchedNumber: string }[] = []
  const rules = [
    { key: 'db', name: 'Giải Đặc Biệt' },
    { key: '1', name: 'Giải Nhất' },
    { key: '2', name: 'Giải Nhì' },
    { key: '3', name: 'Giải Ba' },
    { key: '4', name: 'Giải Tư' },
    { key: '5', name: 'Giải Năm' },
    { key: '6', name: 'Giải Sáu' },
    { key: '7', name: 'Giải Bảy' },
    { key: '8', name: 'Giải Tám' },
  ]

  for (const rule of rules) {
    const nums = prizes[rule.key] || []
    for (const num of nums) {
      if (ticket.endsWith(num)) {
        result.push({ prizeName: rule.name, matchedNumber: num })
      }
    }
  }
  return result
}

// Gọi API và phân tích
const checkResult = async () => {
  if (!form.number || form.number.length < 5) {
    searchError.value = 'Vui lòng nhập đầy đủ số vé (5 hoặc 6 chữ số)'
    return
  }

  searchError.value = ''
  isSearching.value = true
  hasResult.value = false
  winResults.value = []
  rawPrizes.value = {}

  try {
    const code = provinceCodes[form.province] || ''
    const dateParts = form.date.split('-')
    const dmy = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`

    // setTimeout để UI update state loading
    await new Promise((r) => setTimeout(r, 100))

    const htmlStr = await interceptData(code, dmy)
    if (!htmlStr.includes('class="giaidb"')) {
      throw new Error('Không có kết quả xổ số cho ngày & đài này (hoặc chưa xổ)')
    }

    const prizes: Record<string, string[]> = {}
    ;['db', '1', '2', '3', '4', '5', '6', '7', '8'].forEach((p) => {
      const regex = new RegExp(`<td class="giai${p}[^"]*">([\\s\\S]*?)<\\/td>`)
      const m = htmlStr.match(regex)
      if (m && m[1]) {
        prizes[p] = m[1]
          .split('-')
          .map((s) =>
            s
              .trim()
              .replace(/&nbsp;/g, '')
              .replace(/<[^>]+>/g, ''),
          )
          .filter((s) => s)
      }
    })

    fetchProvStr.value = form.province
    fetchDateStr.value = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
    rawPrizes.value = prizes
    winResults.value = checkWin(form.number, prizes)
    hasResult.value = true

    // Trigger full screen effects
    if (winResults.value.length > 0) {
      const isJackpot = winResults.value.some((w) => w.prizeName === 'Giải Đặc Biệt')
      winMessage.value = isJackpot ? 'ĐỔI ĐỜI RỒI' : 'TRÚNG RỒI'

      showWinEffect.value = true
      setTimeout(() => {
        showWinEffect.value = false
      }, 3500)
    } else {
      showLoseEffect.value = true
      setTimeout(() => {
        showLoseEffect.value = false
      }, 2500)
    }

    setTimeout(() => {
      const resultEl = document.getElementById('results-section')
      if (resultEl) resultEl.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  } catch (err: unknown) {
    searchError.value = (err as Error).message || 'Đã xảy ra lỗi khi lấy kết quả'
  } finally {
    isSearching.value = false
  }
}

// Reset form chọn tỉnh khi đổi miền
const onRegionChange = () => {
  const province = regions[form.region].provinces[0]
  if (province) {
    form.province = province
  }
}

onMounted(() => {
  // Logic khởi tạo nếu cần
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body selection:bg-accent-coral/30">
    <!-- Header / Navigation -->
    <nav
      class="fixed top-0 left-0 right-0 z-40 bg-bg-deep/80 backdrop-blur-md border-b border-border-default h-16"
    >
      <div class="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
        <RouterLink
          to="/"
          class="flex items-center gap-2 group transition-colors hover:text-accent-coral"
        >
          <Icon
            icon="lucide:arrow-left"
            class="size-5 transition-transform group-hover:-translate-x-1"
          />
          <span class="font-display font-bold tracking-tight text-lg">TRANG CHỦ</span>
        </RouterLink>

        <!-- Issue Badge (VOL.01 / 2026) -->
        <div
          class="bg-accent-coral text-bg-deep font-display font-bold text-[10px] sm:text-xs tracking-widest px-3 py-1.5 rotate-3 shadow-lg shadow-accent-coral/20"
        >
          VOL.01 / 2026
        </div>
      </div>
    </nav>

    <main class="max-w-5xl mx-auto px-6 pt-32 pb-24">
      <!-- Hero Section -->
      <header class="mb-12 relative">
        <div
          class="absolute -top-10 -left-6 text-9xl font-display font-extrabold text-white/[0.02] select-none pointer-events-none"
        >
          LOTTO
        </div>

        <!-- Mèo thần tài trang trí -->
        <img
          src="https://png.pngtree.com/recommend-works/png-clipart/20251225/ourmid/pngtree-lucky-png-image_18294236.webp"
          alt="Mèo thần tài"
          class="hidden md:block absolute -top-6 right-0 w-36 lg:w-44 object-contain select-none pointer-events-none drop-shadow-xl opacity-90 animate-fade-up"
        />

        <h1
          class="font-display text-5xl md:text-7xl font-bold tracking-tighter mb-4 animate-fade-up"
        >
          Dò Vé
          <span
            class="text-accent-coral underline decoration-accent-coral/30 decoration-8 underline-offset-8"
            >Số</span
          >
        </h1>

        <div class="flex items-center gap-3 animate-fade-up animate-delay-1">
          <span class="text-accent-amber font-display text-sm tracking-widest font-bold">//</span>
          <p class="text-text-secondary max-w-xl leading-relaxed">
            Tra cứu kết quả xổ số kiến thiết 3 miền nhanh chóng và chính xác
          </p>
        </div>
      </header>

      <!-- Search Form Section -->
      <section class="grid lg:grid-cols-12 gap-8 animate-fade-up animate-delay-2">
        <div class="lg:col-span-12">
          <div
            class="bg-bg-surface border border-border-default p-6 md:p-10 relative overflow-hidden"
          >
            <!-- Decorative corner -->
            <div
              class="absolute top-0 right-0 w-24 h-24 bg-accent-amber/5 -rotate-45 translate-x-12 -translate-y-12"
            ></div>

            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <!-- Region Select -->
              <div class="space-y-2">
                <label
                  class="block font-display text-xs font-bold tracking-widest text-text-dim uppercase"
                  >Miền</label
                >
                <div class="relative group">
                  <select
                    v-model="form.region"
                    @change="onRegionChange"
                    class="w-full bg-bg-elevated border border-border-default px-4 py-3 text-text-primary focus:border-accent-coral focus:outline-none appearance-none transition"
                  >
                    <option value="south">Miền Nam</option>
                    <option value="central">Miền Trung</option>
                    <option value="north">Miền Bắc</option>
                  </select>
                  <Icon
                    icon="lucide:chevron-down"
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none group-hover:text-accent-coral transition-colors"
                  />
                </div>
              </div>

              <!-- Province Select -->
              <div class="space-y-2">
                <label
                  class="block font-display text-xs font-bold tracking-widest text-text-dim uppercase"
                  >Tỉnh / Đài</label
                >
                <div class="relative group">
                  <select
                    v-model="form.province"
                    class="w-full bg-bg-elevated border border-border-default px-4 py-3 text-text-primary focus:border-accent-coral focus:outline-none appearance-none transition"
                  >
                    <option
                      v-for="prov in regions[form.region as keyof typeof regions].provinces"
                      :key="prov"
                      :value="prov"
                    >
                      {{ prov }}
                    </option>
                  </select>
                  <Icon
                    icon="lucide:chevron-down"
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none group-hover:text-accent-coral transition-colors"
                  />
                </div>
              </div>

              <!-- Date Selection -->
              <div class="space-y-2">
                <label
                  class="block font-display text-xs font-bold tracking-widest text-text-dim uppercase"
                  >Ngày quay số</label
                >
                <input
                  v-model="form.date"
                  type="date"
                  class="w-full bg-bg-elevated border border-border-default px-4 py-3 text-text-primary focus:border-accent-coral focus:outline-none transition [color-scheme:dark]"
                />
              </div>

              <!-- Ticket Number -->
              <div class="space-y-2">
                <label
                  class="block font-display text-xs font-bold tracking-widest text-text-dim uppercase"
                  >Số vé</label
                >
                <input
                  v-model="form.number"
                  type="text"
                  placeholder="Ví dụ: 123456"
                  maxlength="6"
                  class="w-full bg-bg-elevated border border-border-default px-4 py-3 text-text-primary focus:border-accent-coral focus:outline-none transition placeholder:text-text-dim font-mono tracking-widest"
                  @keypress="(e) => !/[0-9]/.test(e.key) && e.preventDefault()"
                />
              </div>
            </div>

            <!-- Error Message -->
            <p
              v-if="searchError"
              class="mt-4 text-accent-coral text-sm font-medium flex items-center gap-2"
            >
              <Icon icon="lucide:alert-circle" />
              {{ searchError }}
            </p>

            <!-- Action Button -->
            <div class="mt-10 flex justify-end">
              <button
                @click="checkResult"
                :disabled="isSearching"
                class="group relative overflow-hidden bg-accent-coral px-10 py-4 font-display font-bold text-bg-deep tracking-wider transition-all hover:pr-14 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="relative z-10 flex items-center gap-2 uppercase">
                  <Icon v-if="isSearching" icon="lucide:loader-2" class="animate-spin size-5" />
                  <Icon v-else icon="lucide:search" class="size-5" />
                  {{ isSearching ? 'Đang tìm...' : 'Dò kết quả' }}
                </span>
                <Icon
                  icon="lucide:arrow-right"
                  class="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300"
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Results Display (Mock) -->
      <section v-if="hasResult || isSearching" id="results-section" class="mt-16 animate-fade-up">
        <div class="flex items-center gap-3 mb-8">
          <span class="text-accent-sky font-display text-sm tracking-widest font-bold">//</span>
          <h2 class="font-display text-2xl font-bold uppercase tracking-tight">
            Kết quả quay thưởng
          </h2>
          <div class="h-px flex-1 bg-border-default ml-4"></div>
        </div>

        <!-- Skeleton loader -->
        <div v-if="isSearching" class="grid grid-cols-1 gap-6">
          <div
            v-for="i in 3"
            :key="i"
            class="h-16 bg-bg-surface border border-border-default animate-pulse-border"
          ></div>
        </div>

        <!-- Result Table -->
        <div v-else class="bg-bg-surface border border-border-default overflow-hidden">
          <div
            class="p-6 bg-bg-elevated/50 border-b border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <h3 class="font-display font-bold text-xl text-accent-amber">{{ fetchProvStr }}</h3>
              <p class="text-text-dim text-sm tabular-nums">Ngày: {{ fetchDateStr }}</p>
            </div>
            <div class="flex flex-col items-end">
              <span class="text-xs font-bold tracking-widest text-text-dim uppercase"
                >Vé của bạn</span
              >
              <span class="text-3xl font-mono font-bold text-text-primary tracking-[0.2em]">{{
                form.number
              }}</span>
            </div>
          </div>

          <!-- Thông báo trúng giải -->
          <div
            v-if="winResults.length === 0"
            class="p-8 text-center bg-accent-coral/5 border-b border-border-default italic text-text-secondary"
          >
            <Icon icon="lucide:info" class="inline size-4 mr-2 -mt-0.5" />
            Rất tiếc, vé số của bạn không trúng giải trong lượt quay này. Chúc bạn may mắn lần sau!
          </div>
          <div
            v-else
            class="p-8 text-center bg-accent-sky/10 border-b border-border-default space-y-4"
          >
            <div
              class="flex items-center justify-center gap-2 text-accent-sky font-bold uppercase tracking-widest"
            >
              <Icon icon="lucide:party-popper" class="size-6" />
              <span>Chúc mừng bạn đã trúng thưởng!</span>
              <Icon icon="lucide:party-popper" class="size-6" />
            </div>
            <div class="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span
                v-for="(w, idx) in winResults"
                :key="idx"
                class="px-4 py-2 bg-bg-elevated border border-accent-sky text-text-primary font-display text-sm font-bold rounded-sm shadow-md shadow-accent-sky/20"
              >
                {{ w.prizeName }} (số {{ w.matchedNumber }})
              </span>
            </div>
          </div>

          <!-- Bảng kết quả xổ số -->
          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border-default"
          >
            <div
              v-if="rawPrizes['db'] && rawPrizes['db'].length > 0"
              class="col-span-1 md:col-span-2 lg:col-span-4 p-4 flex flex-col items-center justify-center gap-1 border-b border-border-default bg-accent-coral/5"
            >
              <span class="text-xs font-bold tracking-widest uppercase text-accent-coral"
                >Giải Đặc Biệt</span
              >
              <div class="flex flex-wrap justify-center gap-4">
                <span
                  v-for="num in rawPrizes['db']"
                  :key="num"
                  class="text-4xl font-mono font-bold text-accent-coral tracking-widest drop-shadow-md"
                  >{{ num }}</span
                >
              </div>
            </div>

            <div
              v-if="rawPrizes['1'] && rawPrizes['1'].length > 0"
              class="col-span-1 md:col-span-2 p-4 flex flex-col items-center justify-center gap-1 border-b border-border-default bg-bg-elevated/20"
            >
              <span class="text-[10px] font-bold tracking-widest uppercase text-text-dim"
                >Giải Nhất</span
              >
              <div class="flex flex-wrap justify-center gap-3">
                <span
                  v-for="num in rawPrizes['1']"
                  :key="num"
                  class="text-2xl font-mono font-bold tracking-wider"
                  >{{ num }}</span
                >
              </div>
            </div>

            <div
              v-if="rawPrizes['2'] && rawPrizes['2'].length > 0"
              class="col-span-1 md:col-span-2 p-4 flex flex-col items-center justify-center gap-1 border-b border-border-default bg-bg-elevated/20"
            >
              <span class="text-[10px] font-bold tracking-widest uppercase text-text-dim"
                >Giải Nhì</span
              >
              <div class="flex flex-wrap justify-center gap-3">
                <span
                  v-for="num in rawPrizes['2']"
                  :key="num"
                  class="text-2xl font-mono font-bold tracking-wider"
                  >{{ num }}</span
                >
              </div>
            </div>

            <div
              v-if="rawPrizes['3'] && rawPrizes['3'].length > 0"
              class="col-span-1 md:col-span-2 lg:col-span-4 p-4 flex flex-col items-center justify-center gap-2 border-b border-border-default"
            >
              <span class="text-[10px] font-bold tracking-widest uppercase text-text-dim"
                >Giải Ba</span
              >
              <div class="flex flex-wrap justify-center gap-4">
                <span
                  v-for="num in rawPrizes['3']"
                  :key="num"
                  class="text-xl font-mono font-bold tracking-wide"
                  >{{ num }}</span
                >
              </div>
            </div>

            <div
              v-if="rawPrizes['4'] && rawPrizes['4'].length > 0"
              class="col-span-1 md:col-span-2 lg:col-span-4 p-4 flex flex-col items-center justify-center gap-2 border-b border-border-default bg-bg-elevated/20"
            >
              <span class="text-[10px] font-bold tracking-widest uppercase text-text-dim"
                >Giải Tư</span
              >
              <div class="flex flex-wrap justify-center gap-x-6 gap-y-2">
                <span
                  v-for="num in rawPrizes['4']"
                  :key="num"
                  class="text-xl font-mono font-medium tracking-wide"
                  >{{ num }}</span
                >
              </div>
            </div>

            <div
              v-if="rawPrizes['5'] && rawPrizes['5'].length > 0"
              class="col-span-1 md:col-span-2 p-4 flex flex-col items-center justify-center gap-2 border-b border-border-default"
            >
              <span class="text-[10px] font-bold tracking-widest uppercase text-text-dim"
                >Giải Năm</span
              >
              <div class="flex flex-wrap justify-center gap-x-6 gap-y-2">
                <span
                  v-for="num in rawPrizes['5']"
                  :key="num"
                  class="text-xl font-mono font-medium tracking-wide"
                  >{{ num }}</span
                >
              </div>
            </div>

            <div
              v-if="rawPrizes['6'] && rawPrizes['6'].length > 0"
              class="col-span-1 md:col-span-2 p-4 flex flex-col items-center justify-center gap-2 border-b border-border-default"
            >
              <span class="text-[10px] font-bold tracking-widest uppercase text-text-dim"
                >Giải Sáu</span
              >
              <div class="flex flex-wrap justify-center gap-4">
                <span
                  v-for="num in rawPrizes['6']"
                  :key="num"
                  class="text-xl font-mono font-medium tracking-wide"
                  >{{ num }}</span
                >
              </div>
            </div>

            <div
              v-if="rawPrizes['7'] && rawPrizes['7'].length > 0"
              class="col-span-1 md:col-span-2 lg:col-span-4 p-4 flex flex-col items-center justify-center gap-2 border-b border-border-default bg-bg-elevated/20"
            >
              <span class="text-[10px] font-bold tracking-widest uppercase text-text-dim"
                >Giải Bảy</span
              >
              <div class="flex flex-wrap justify-center gap-4">
                <span
                  v-for="num in rawPrizes['7']"
                  :key="num"
                  class="text-xl font-mono font-medium tracking-wide text-accent-amber"
                  >{{ num }}</span
                >
              </div>
            </div>

            <div
              v-if="rawPrizes['8'] && rawPrizes['8'].length > 0"
              class="col-span-1 md:col-span-2 lg:col-span-4 p-4 flex flex-col items-center justify-center gap-2 border-b border-border-default bg-bg-elevated/30"
            >
              <span class="text-[10px] font-bold tracking-widest uppercase text-text-dim"
                >Giải Tám</span
              >
              <div class="flex flex-wrap justify-center gap-4">
                <span
                  v-for="num in rawPrizes['8']"
                  :key="num"
                  class="text-2xl font-mono font-bold tracking-wide text-accent-coral drop-shadow-sm"
                  >{{ num }}</span
                >
              </div>
            </div>
          </div>

          <div class="p-4 text-center border-t border-border-default">
            <button
              @click="hasResult = false"
              class="text-sm text-text-dim hover:text-accent-coral transition-colors"
            >
              Ẩn kết quả & dò số khác
            </button>
          </div>
        </div>
      </section>

      <!-- How to Section -->
      <section class="mt-24 grid md:grid-cols-3 gap-8 scroll-reveal">
        <div
          class="p-6 bg-bg-surface border border-border-default hover:border-accent-coral group transition-all duration-500"
        >
          <Icon
            icon="lucide:list-ordered"
            class="size-8 text-accent-coral mb-4 group-hover:scale-110 transition-transform"
          />
          <h4 class="font-display font-bold text-lg mb-2">Bước 1</h4>
          <p class="text-text-secondary text-sm leading-relaxed">
            Chọn miền, chọn đài và ngày quay số ghi trên tờ vé
          </p>
        </div>
        <div
          class="p-6 bg-bg-surface border border-border-default hover:border-accent-amber group transition-all duration-500"
        >
          <Icon
            icon="lucide:keyboard"
            class="size-8 text-accent-amber mb-4 group-hover:scale-110 transition-transform"
          />
          <h4 class="font-display font-bold text-lg mb-2">Bước 2</h4>
          <p class="text-text-secondary text-sm leading-relaxed">Nhập đầy đủ bộ số in trên vé</p>
        </div>
        <div
          class="p-6 bg-bg-surface border border-border-default hover:border-accent-sky group transition-all duration-500"
        >
          <Icon
            icon="lucide:check-circle"
            class="size-8 text-accent-sky mb-4 group-hover:scale-110 transition-transform"
          />
          <h4 class="font-display font-bold text-lg mb-2">Bước 3</h4>
          <p class="text-text-secondary text-sm leading-relaxed">
            Nhấn nút "Dò kết quả" để biết bạn có đổi đời hay không
          </p>
        </div>
      </section>
    </main>

    <!-- Win Effect Overlay -->
    <div
      v-if="showWinEffect"
      class="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-bg-deep/90 backdrop-blur-md transition-opacity duration-500 animate-fade-in cursor-pointer"
      @click="showWinEffect = false"
    >
      <div class="absolute inset-0 pointer-events-none">
        <div
          v-for="(cf, i) in confettis"
          :key="'cf-' + i"
          class="confetti"
          :style="{
            '--delay': cf.delay,
            '--left': cf.left,
            '--rotation': cf.rotation,
            '--color': cf.color,
          }"
        ></div>
      </div>

      <div
        class="relative z-10 flex flex-col items-center gap-6 animate-bounce-in text-center px-4"
      >
        <Icon
          icon="lucide:party-popper"
          class="size-24 md:size-32 text-accent-amber animate-pulse"
        />
        <h2
          class="text-3xl md:text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-accent-amber to-accent-coral uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(255,107,107,0.5)]"
        >
          {{ winMessage }}
        </h2>
        <p
          class="text-xl md:text-2xl font-bold tracking-widest text-text-primary uppercase drop-shadow-md"
        >
          Chúc mừng, bạn đã lụm lúa
        </p>
      </div>
    </div>

    <!-- Lose Effect Overlay -->
    <div
      v-if="showLoseEffect"
      class="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/95 backdrop-blur-md transition-opacity duration-500 animate-fade-in cursor-pointer"
      @click="showLoseEffect = false"
    >
      <div
        class="relative z-10 flex flex-col items-center gap-6 text-center px-4 animate-bounce-in"
      >
        <Icon icon="lucide:frown" class="size-24 md:size-32 text-text-dim opacity-50 grayscale" />
        <h2
          class="text-3xl md:text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-text-secondary to-border-default uppercase tracking-tighter mix-blend-screen drop-shadow-lg"
        >
          TRẬT LẤT
        </h2>
        <p class="text-lg md:text-xl tracking-widest text-text-dim uppercase">
          Chúc bạn may mắn lần sau
        </p>
      </div>
    </div>

    <BackToTop />
  </div>
</template>

<style scoped>
/* Tuỳ chỉnh cho input date */
input[type='date']::-webkit-calendar-picker-indicator {
  cursor: pointer;
  filter: invert(0.8);
  transition: filter 0.3s ease;
}

input[type='date']::-webkit-calendar-picker-indicator:hover {
  filter: invert(1);
}

/* Hiệu ứng focus chung */
select:focus-visible,
input:focus-visible {
  outline: none;
}

/* Custom overlay animations */
@keyframes floatDown {
  0% {
    transform: translateY(-10vh) rotate(0deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(110vh) rotate(var(--rotation)) scale(0.5);
    opacity: 0;
  }
}
.confetti {
  position: absolute;
  top: -10vh;
  left: var(--left);
  width: 14px;
  height: 24px;
  background-color: var(--color);
  opacity: 0;
  animation: floatDown 2.5s ease-in infinite;
  animation-delay: var(--delay);
  border-radius: 2px;
}
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(8px);
  }
}
.animate-bounce-in {
  animation: bounceIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
