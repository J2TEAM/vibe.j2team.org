<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import { getTermContent } from './content'
import type { SolarTerm } from './types'
import GlobalBackground from './components/GlobalBackground.vue'
import SolarWheel from './components/SolarWheel.vue'
import AudioController from './components/AudioController.vue'
import SolarCardGenerator from './components/SolarCardGenerator.vue'

const solarTerms = ref<SolarTerm[]>([
  {
    id: '1',
    name: 'Lập Xuân',
    translation: 'Khúc Dạo Đầu Của Hy Vọng',
    description: 'Đông phong khởi động, vạn vật hồi sinh.',
    season: 'Xuân',
    approxDate: '02-04',
    displayDate: '04/02',
    tips: 'Nên ăn thực phẩm tươi mới, giữ ấm đôi chân.',
    proverb: 'Lập xuân hoa nở rộ, gió hiền đưa hương bay.',
  },
  {
    id: '2',
    name: 'Vũ Thủy',
    translation: 'Dòng Chảy Của Sự Sống',
    description: 'Xuân vũ nhuận hoa, cỏ cây tươi mới.',
    season: 'Xuân',
    approxDate: '02-19',
    displayDate: '19/02',
    tips: 'Phòng tránh ẩm thấp, bồi bổ tỳ vị.',
    proverb: 'Vũ thủy mưa về cho lúa trổ, rồng thiêng vờn mây đón xuân sang.',
  },
  {
    id: '3',
    name: 'Kinh Trập',
    translation: 'Tiếng Sấm Xuân Đánh Thức Vạn Vật',
    description: 'Lôi thanh khởi động, sinh linh bừng tỉnh.',
    season: 'Xuân',
    approxDate: '03-05',
    displayDate: '05/03',
    tips: 'Ăn lê để dưỡng phổi, tránh làm việc quá sức.',
    proverb: 'Kinh trập sấm vang ngàn dặm hỉ, đào hồng hé nụ đón lời chim.',
  },
  {
    id: '4',
    name: 'Xuân Phân',
    translation: 'Điểm Cân Bằng Của Vũ Trụ',
    description: 'Nhật nguyệt cân bằng, xuân quang rực rỡ.',
    season: 'Xuân',
    approxDate: '03-20',
    displayDate: '20/03',
    tips: 'Giữ cân bằng sinh hoạt, vận động nhẹ nhàng.',
    proverb: 'Xuân phân nhật nguyệt cân bằng sắc, cỏ nội hoa ngàn rực rỡ tươi.',
  },
  {
    id: '5',
    name: 'Thanh Minh',
    translation: 'Bầu Trời Trong Sáng - Lễ Tảo Mộ Tri Ân',
    description: 'Trời quang gió nhẹ, mây tạnh lòng trong.',
    season: 'Xuân',
    approxDate: '04-04',
    displayDate: '04/04',
    tips: 'Đi dạo ngoài trời, hít thở không khí trong lành.',
    proverb: 'Thanh minh trong tiết tháng ba, lễ là tảo mộ hội là đạp thanh.',
  },
  {
    id: '6',
    name: 'Cốc Vũ',
    translation: 'Sự Trưởng Thành Của Vạn Vật',
    description: 'Xuân vũ rơi cuối, đồng nội thêm xanh.',
    season: 'Xuân',
    approxDate: '04-20',
    displayDate: '20/04',
    tips: 'Uống trà Thanh Minh, bảo vệ thị lực.',
    proverb: 'Cốc vũ mưa rơi đầy ngõ nhỏ, lúa chiêm xanh mướt trải tầng tầng.',
  },
  {
    id: '7',
    name: 'Lập Hạ',
    translation: 'Sự Trưởng Thành & Nhiệt Huyết',
    description: 'Dương quang bừng nở, sinh khí đầy trời.',
    season: 'Hạ',
    approxDate: '05-05',
    displayDate: '05/05',
    tips: 'Tránh ăn đồ quá nóng, chú ý dưỡng tâm.',
    proverb: 'Lập hạ nắng vàng bừng sức sống, ve sầu cất tiếng gọi mùa sang.',
  },
  {
    id: '8',
    name: 'Tiểu Mãn',
    translation: 'Triết Lý Của Sự Vừa Đủ',
    description: 'Hạt thóc căng tròn, mùa màng chớm đủ.',
    season: 'Hạ',
    approxDate: '05-21',
    displayDate: '21/05',
    tips: 'Ăn thực phẩm thanh nhiệt, tránh đồ cay nóng.',
    proverb: 'Tiểu mãn nước về đầy ruộng thấp, lúa ngô hớn hở đợi ngày thu.',
  },
  {
    id: '9',
    name: 'Mang Chủng',
    translation: 'Khúc Giao Hưởng Của Mùa Gieo Gặt',
    description: 'Gieo mạ khắp đồng, ca dao vọng núi.',
    season: 'Hạ',
    approxDate: '06-05',
    displayDate: '05/06',
    tips: 'Uống nhiều nước, bổ sung muối khoáng.',
    proverb: 'Mang chũng gieo chiêm cho kịp vụ, tay làm hàm nhai chẳng ngại công.',
  },
  {
    id: '10',
    name: 'Hạ Chí',
    translation: 'Đỉnh Cao Của Mùa Hạ',
    description: 'Nhật quang cực thịnh, hạ khí bừng dâng.',
    season: 'Hạ',
    approxDate: '06-21',
    displayDate: '21/06',
    tips: 'Tránh ánh nắng gắt, nghỉ ngơi hợp lý.',
    proverb: 'Tua rua thì mặc tua rua, mạ già ruộng ngấu không thua bạn điền.',
  },
  {
    id: '11',
    name: 'Tiểu Thử',
    translation: 'Khúc Dạo Đầu Của Mùa Nắng Lửa',
    description: 'Ve sầu râm ran, gió hè phả nóng.',
    season: 'Hạ',
    approxDate: '07-07',
    displayDate: '07/07',
    tips: 'Ăn dưa hấu, đậu xanh để giải nhiệt.',
    proverb: 'Tiểu thử gió hè hầm hập nóng, bóng cây kẽ lá đón làn mây.',
  },
  {
    id: '12',
    name: 'Đại Thử',
    translation: 'Đỉnh Điểm Mùa Nắng Lửa',
    description: 'Hỏa khí nung trời, bóng mát hóa ngọc.',
    season: 'Hạ',
    approxDate: '07-22',
    displayDate: '22/07',
    tips: 'Hạn chế ra ngoài lúc trưa, tránh sốc nhiệt.',
    proverb: 'Đại thử hỏa nung trời đất đỏ, bát chè đậu biếc giải lòng ta.',
  },
  {
    id: '13',
    name: 'Lập Thu',
    translation: 'Khúc Giao Mùa Dịu Dàng',
    description: 'Thu phong se lạnh, lá úa nhẹ rơi.',
    season: 'Thu',
    approxDate: '08-07',
    displayDate: '07/08',
    tips: 'Bồi bổ phổi, ăn nhiều rau quả màu trắng.',
    proverb: 'Lập thu sương sớm vừa chớm lạnh, lá phong rực đỏ nhuộm chiều tà.',
  },
  {
    id: '14',
    name: 'Xử Thử',
    translation: 'Khi Cái Nóng "Ẩn Mình"',
    description: 'Nhiệt hạ dần tàn, khí trời khoan khoái.',
    season: 'Thu',
    approxDate: '08-23',
    displayDate: '23/08',
    tips: 'Ngủ sớm dậy sớm, giữ tinh thần thư thái.',
    proverb: 'Xử thử nhiệt tàn vơi cái nóng, gió thu nhè nhẹ thổi lòng yên.',
  },
  {
    id: '15',
    name: 'Bạch Lộ',
    translation: 'Nỗi Niềm Của Mùa Thu',
    description: 'Sương trắng vương thảo, đêm thu thêm lạnh.',
    season: 'Thu',
    approxDate: '09-07',
    displayDate: '07/09',
    tips: 'Chú ý giữ ấm cổ và vùng bụng.',
    proverb: 'Bạch lộ sương rơi nhành thảo mộc, đêm thu man mác nỗi niềm xưa.',
  },
  {
    id: '16',
    name: 'Thu Phân',
    translation: 'Bình Thản & Quân Bình',
    description: 'Nhật nguyệt ngang hàng, tiết thu điều hòa.',
    season: 'Thu',
    approxDate: '09-23',
    displayDate: '23/09',
    tips: 'Ăn thực phẩm bổ âm mỡ, tránh đồ khô nóng.',
    proverb: 'Thu phân trăng sáng gương soi chiếu, đất trời hòa hợp đón trùng dương.',
  },
  {
    id: '17',
    name: 'Hàn Lộ',
    translation: 'Nét Vẽ Trầm Mặc Của Mùa Thu',
    description: 'Sương lạnh rơi dày, phong thu khô tái.',
    season: 'Thu',
    approxDate: '10-08',
    displayDate: '08/10',
    tips: 'Ngâm chân nước ấm trước khi ngủ.',
    proverb: 'Hàn lộ sương dày vương lối nhỏ, áo bào se lạnh tiễn người đi.',
  },
  {
    id: '18',
    name: 'Sương Giáng',
    translation: 'Sương Giá Phủ Trắng',
    description: 'Giọt sương rơi nặng, trời đất sang đông.',
    season: 'Thu',
    approxDate: '10-23',
    displayDate: '23/10',
    tips: 'Ăn hồng, lê để dưỡng họng và phổi.',
    proverb: 'Sương giáng tuyết sa mờ đỉnh núi, cúc vàng rực rỡ đón đông sang.',
  },
  {
    id: '19',
    name: 'Lập Đông',
    translation: 'Nuôi Dưỡng Nội Lực',
    description: 'Đông phong nổi dậy, vạn vật quy tàng.',
    season: 'Đông',
    approxDate: '11-07',
    displayDate: '07/11',
    tips: 'Ăn thực phẩm giàu năng lượng, giữ ấm cơ thể.',
    proverb: 'Lập đông gió bấc lùa khe cửa, nhà nhà nhóm lửa đợi xuân về.',
  },
  {
    id: '20',
    name: 'Tiểu Tuyết',
    translation: 'Khúc Dạo Đầu Mùa Đông Tĩnh Lặng',
    description: 'Hoa tuyết chớm rơi, sơn xuyên nhuộm bạc.',
    season: 'Đông',
    approxDate: '11-22',
    displayDate: '22/11',
    tips: 'Tránh trầm cảm mùa đông, tiếp xúc ánh nắng.',
    proverb: 'Tiểu tuyết trắng trời mây xám ngắt, trà thơm bên bếp ấm lòng nhau.',
  },
  {
    id: '21',
    name: 'Đại Tuyết',
    translation: 'Tuyết Phủ Trắng Trời',
    description: 'Băng tuyết dày đặc, thiên địa ngủ yên.',
    season: 'Đông',
    approxDate: '12-07',
    displayDate: '07/12',
    tips: 'Giữ ấm đầu và ngực, bồi bổ thận.',
    proverb: 'Đại tuyết tuyết rơi đầy ngõ vắng, mai vàng ấp ủ đợi giao thừa.',
  },
  {
    id: '22',
    name: 'Đông Chí',
    translation: 'Khởi Đầu Của Sự Hồi Sinh',
    description: 'Dạ trường cực điểm, dương quang tái sinh.',
    season: 'Đông',
    approxDate: '12-21',
    displayDate: '21/12',
    tips: 'Lễ hội gia đình, ăn đồ ấm nóng.',
    proverb: 'Đông chí đêm dài sương lạnh buốt, chén chè trôi nước ấm tình thân.',
  },
  {
    id: '23',
    name: 'Tiểu Hàn',
    translation: 'Sự Kiên Cường Trước Bình Minh',
    description: 'Gió rét căm căm, bếp lửa sưởi lòng.',
    season: 'Đông',
    approxDate: '01-05',
    displayDate: '05/01',
    tips: 'Tăng cường vận động để sinh nhiệt.',
    proverb: 'Tiểu hàn giá rét tê đôi bàn tay, bếp hồng củi lửa đượm hương nồng.',
  },
  {
    id: '24',
    name: 'Đại Hàn',
    translation: 'Đỉnh Điểm Của Giá Lạnh',
    description: 'Hàn khí chí cực, xuân quang chực đến.',
    season: 'Đông',
    approxDate: '01-20',
    displayDate: '20/01',
    tips: 'Dọn dẹp nhà cửa, chuẩn bị tâm thế mới.',
    proverb: 'Đại hàn nén sức chờ xuân tới, vạn vật chuyển mình đón bình minh.',
  },
])

const searchQuery = ref('')
const selectedSeason = ref<string | null>(null)
const selectedDate = ref('')
const showModal = ref(false)
const activeTerm = ref<SolarTerm | null>(null)
const activeModalTab = ref<'content' | 'share'>('content')

const nextTermCountdown = computed(() => {
  const target = currentMonthDay.value
  const sorted = [...solarTerms.value].sort((a, b) => a.approxDate.localeCompare(b.approxDate))
  let next = sorted.find((t) => t.approxDate > target)
  if (!next) next = sorted[0]

  if (!next) return ''

  // Simple day calculation (approx)
  const dateParts = next.approxDate.split('-').map(Number)
  const m = dateParts[0]
  const d = dateParts[1]

  if (m === undefined || d === undefined) return ''

  const now = new Date()
  const year = now.getFullYear()
  const nextDate = new Date(year, m - 1, d)
  if (nextDate < now) nextDate.setFullYear(year + 1)

  const diffTime = Math.abs(nextDate.getTime() - now.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return `Còn ${diffDays} ngày nữa là đến Tiết ${next.name}`
})

// Solar term content is lazy-loaded from content.ts instead of statically importing all 24 HTML files
const modalContent = ref('')
const loadingContent = `
  <div style="background: #111; color: #fff; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">
    <h1>Đang tải nội dung...</h1>
  </div>
`
const fallbackContent = `
  <div style="background: #111; color: #fff; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">
    <h1>Nội dung đang được cập nhật...</h1>
  </div>
`

watch(
  () => activeTerm.value?.name,
  async (termName) => {
    if (!termName) {
      modalContent.value = ''
      return
    }
    modalContent.value = loadingContent
    const content = await getTermContent(termName)
    modalContent.value = content ?? fallbackContent
  },
)

const currentMonthDay = computed(() => {
  if (selectedDate.value) return selectedDate.value.slice(5)
  return new Date().toISOString().slice(5, 10)
})

const filteredTerms = computed(() => {
  return solarTerms.value.filter((term) => {
    const matchesSearch =
      term.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      term.translation.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesSeason = !selectedSeason.value || term.season === selectedSeason.value
    return matchesSearch && matchesSeason
  })
})

const selectedTermIndex = ref(-1)

const activeTermIndex = computed({
  get: () => {
    if (selectedTermIndex.value !== -1) return selectedTermIndex.value
    const target = currentMonthDay.value
    let bestIndex = -1
    const sorted = [...solarTerms.value].sort((a, b) => a.approxDate.localeCompare(b.approxDate))
    for (let i = 0; i < sorted.length; i++) {
      const term = sorted[i]
      if (term && term.approxDate <= target) bestIndex = i
    }
    if (bestIndex === -1) bestIndex = sorted.length - 1
    const activeTermRaw = sorted[bestIndex]
    return solarTerms.value.findIndex((t) => t.id === (activeTermRaw?.id || ''))
  },
  set: (val) => {
    selectedTermIndex.value = val
  },
})

const handleTermSelect = (index: number) => {
  activeTermIndex.value = index
  // Scroll to the selected term in the grid if it exists
  const term = solarTerms.value[index]
  if (term) {
    const el = document.getElementById(`term-${term.id}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const currentSeason = computed(() => {
  const index = activeTermIndex.value
  if (index !== -1 && solarTerms.value[index]) return solarTerms.value[index].season
  return 'Xuân'
})

const getSeasonColor = (season: string) => {
  switch (season) {
    case 'Xuân':
      return 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30'
    case 'Hạ':
      return 'from-orange-500/20 to-red-500/20 text-orange-400 border-orange-500/30'
    case 'Thu':
      return 'from-amber-600/20 to-orange-600/20 text-amber-400 border-amber-600/30'
    case 'Đông':
      return 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30'
    default:
      return 'from-white/10 to-white/5 text-white border-white/10'
  }
}

const getBgDynamic = computed(() => {
  switch (currentSeason.value) {
    case 'Xuân':
      return 'bg-[#0a1a10]'
    case 'Hạ':
      return 'bg-[#1a0a0a]'
    case 'Thu':
      return 'bg-[#1a120a]'
    case 'Đông':
      return 'bg-[#0a121a]'
    default:
      return 'bg-bg-deep'
  }
})

const openDetail = (term: SolarTerm) => {
  activeTerm.value = term
  activeModalTab.value = 'content'
  showModal.value = true
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  showModal.value = false
  document.body.style.overflow = 'auto'
}

const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

const isZenMode = ref(false)
const toggleZenMode = () => {
  isZenMode.value = !isZenMode.value
  if (isZenMode.value) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const observeSections = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed')
          // Tùy chọn: ngừng theo dõi sau khi hiện ra
          // observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
  )

  document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
    observer.observe(el)
  })
}

watch(
  filteredTerms,
  () => {
    nextTick(() => {
      observeSections()
    })
  },
  { deep: true },
)

onMounted(() => {
  selectedDate.value = new Date().toISOString().slice(0, 10)
  // Initial title
  document.title = 'Tra cứu 24 Tiết Khí - Nhân Gian Tiết Khí'

  window.addEventListener('scroll', handleScroll)
  observeSections()
})

watch(
  () => activeTermIndex.value,
  (newIdx) => {
    const term = solarTerms.value[newIdx]
    if (term) {
      document.title = `${term.name} - ${term.translation} | Nhân Gian Tiết Khí`
    }
  },
  { immediate: true },
)
</script>

<template>
  <div
    :class="[
      'tiet-khi-wrapper min-h-screen text-text-primary font-body overflow-x-hidden selection:bg-accent-coral/30 transition-colors duration-1000 relative',
      getBgDynamic,
    ]"
  >
    <!-- Global Ambient Effects -->
    <GlobalBackground :season="currentSeason" />
    <AudioController :termName="solarTerms[activeTermIndex]?.name || 'Lập Xuân'" />

    <!-- Top Navigation -->
    <header
      v-show="!isZenMode"
      :class="[
        'fixed top-0 left-0 right-0 z-50 px-6 transition-all duration-500 border-b border-white/5',
        isScrolled ? 'py-3 bg-black/80 backdrop-blur-2xl shadow-2xl' : 'py-6 bg-transparent',
      ]"
    >
      <div class="max-w-7xl mx-auto flex justify-between items-center w-full">
        <RouterLink
          to="/"
          class="group flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <span class="group-hover:-translate-x-1 transition-transform">&larr;</span>
          <span class="hidden sm:inline">Về trang chủ</span>
        </RouterLink>
        <div class="flex flex-col items-center">
          <h2
            :class="[
              'font-display font-bold tracking-widest transition-all duration-500',
              isScrolled ? 'text-lg' : 'text-2xl',
            ]"
            class="bg-clip-text text-transparent bg-gradient-to-r from-accent-coral via-white to-emerald-400"
          >
            TIẾT KHÍ
          </h2>
          <span
            v-if="!isScrolled"
            class="text-[10px] uppercase tracking-[0.3em] opacity-30 font-mono"
            >24 Tiết Khí</span
          >
        </div>
        <div class="w-24 hidden md:block text-right">
          <span class="text-[10px] uppercase tracking-[0.3em] opacity-20 font-mono"
            >Tịch Phong</span
          >
        </div>
      </div>
    </header>

    <main class="pt-32 pb-24 px-4 max-w-7xl mx-auto relative z-10">
      <!-- Hero -->
      <div class="relative mb-32 flex flex-col items-center text-center pt-10">
        <div
          class="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent-coral/5 blur-[120px] rounded-full -z-10"
        ></div>

        <div class="reveal-on-scroll">
          <h1
            class="font-display text-6xl md:text-8xl font-black mb-12 tracking-tighter leading-none"
          >
            Nhân Gian <br />
            <span
              class="text-transparent bg-clip-text bg-gradient-to-b from-accent-coral to-red-600"
              >Tiết Khí</span
            >
          </h1>
        </div>

        <!-- Solar Wheel Interaction -->
        <div
          class="mb-20 transform hover:scale-[1.02] transition-transform duration-700 reveal-on-scroll"
          style="animation-delay: 0.2s"
        >
          <SolarWheel
            :terms="solarTerms"
            :activeIndex="activeTermIndex"
            @select="handleTermSelect"
          />
        </div>

        <div class="reveal-on-scroll" style="animation-delay: 0.4s">
          <p
            v-if="solarTerms[activeTermIndex]?.proverb"
            class="font-script text-3xl md:text-5xl text-accent-coral mb-10 italic opacity-90 leading-tight"
          >
            "{{ solarTerms[activeTermIndex]?.proverb }}"
          </p>
          <p
            v-if="!isZenMode"
            class="text-text-secondary text-lg max-w-2xl mx-auto font-light leading-relaxed"
          >
            Xoay vòng quay thiên văn để khám phá 24 nhịp thở của đất trời. <br />
            Khám phá sự thay đổi của tự nhiên và lời khuyên dưỡng sinh nghìn năm.
          </p>

          <!-- Time Pulse Widget -->
          <div
            v-if="!isZenMode"
            class="mt-8 inline-block px-8 py-3 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-[0.4em] text-accent-coral/80 animate-pulse"
          >
            {{ nextTermCountdown }}
          </div>
        </div>

        <!-- Scroll Indicator -->
        <div
          v-if="!isZenMode"
          class="mt-20 flex flex-col items-center gap-4 opacity-30 animate-bounce"
        >
          <span class="text-[8px] uppercase tracking-[0.5em]">Khám phá</span>
          <div class="w-px h-12 bg-gradient-to-b from-accent-coral to-transparent"></div>
        </div>
      </div>

      <!-- Zen Mode Toggle -->
      <button
        @click="toggleZenMode"
        class="fixed bottom-32 right-6 z-50 p-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full text-accent-coral/60 hover:text-accent-coral hover:scale-110 transition-all shadow-2xl group"
        :title="isZenMode ? 'Thoát chế độ Thiền' : 'Chế độ Thiền (Zen Mode)'"
      >
        <svg
          v-if="!isZenMode"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="group-hover:rotate-12 transition-transform"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="animate-pulse"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
        <span
          class="absolute right-full mr-4 px-3 py-1 bg-black/80 text-[10px] uppercase tracking-widest text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-2xl border border-white/10"
        >
          {{ isZenMode ? 'Thoát Thiền' : 'Thiền định' }}
        </span>
      </button>

      <!-- Controls -->
      <div v-show="!isZenMode" class="sticky top-24 z-40 mb-20 reveal-on-scroll">
        <div
          class="flex flex-col lg:flex-row gap-4 justify-center items-stretch lg:items-center bg-bg-surface/30 backdrop-blur-3xl p-4 rounded-[2.5rem] border border-white/10 shadow-2xl"
        >
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm tiết khí..."
            class="flex-1 bg-black/20 border border-white/10 px-8 py-4 rounded-2xl focus:outline-none focus:border-accent-coral/50 transition-all font-light"
          />
          <input
            v-model="selectedDate"
            type="date"
            class="bg-black/20 border border-white/10 px-8 py-4 rounded-2xl focus:outline-none text-white cursor-pointer"
          />
          <div
            class="flex p-1 bg-black/30 rounded-2xl border border-white/5 overflow-x-auto scrollbar-hide"
          >
            <button
              v-for="season in ['Xuân', 'Hạ', 'Thu', 'Đông']"
              :key="season"
              @click="selectedSeason = selectedSeason === season ? null : season"
              :class="[
                'px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all',
                selectedSeason === season
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/40 hover:text-white/60',
              ]"
            >
              {{ season }}
            </button>
          </div>
        </div>
      </div>

      <!-- Grid -->
      <div v-show="!isZenMode" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <div
          v-for="(term, index) in filteredTerms"
          :key="term.id"
          :id="`term-${term.id}`"
          :class="[
            'group relative rounded-[2.5rem] transition-all duration-700 h-full reveal-on-scroll',
            term.id === solarTerms[activeTermIndex]?.id
              ? 'scale-105 z-20'
              : 'opacity-80 hover:opacity-100 hover:scale-[1.02]',
          ]"
          :style="{ transitionDelay: `${(index % 24) * 0.05}s` }"
        >
          <div
            v-if="term.id === solarTerms[activeTermIndex]?.id"
            class="absolute -inset-1 bg-gradient-to-br from-accent-coral to-accent-coral/0 rounded-[2.6rem] blur-2xl opacity-20 animate-pulse"
          ></div>
          <div
            class="relative bg-bg-surface/20 backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] h-full flex flex-col items-center text-center shadow-xl transition-all"
          >
            <div class="absolute top-6 right-8 text-[10px] font-mono opacity-30">
              {{ term.displayDate }}
            </div>
            <div
              :class="[
                'text-[9px] uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border mb-8 font-black bg-gradient-to-br',
                getSeasonColor(term.season),
              ]"
            >
              Tiết {{ term.season }}
            </div>
            <h3
              :class="[
                'text-5xl font-display font-bold mb-2',
                term.id === solarTerms[activeTermIndex]?.id ? 'text-accent-coral' : 'text-white',
              ]"
            >
              {{ term.name }}
            </h3>
            <p class="text-xs italic text-text-secondary opacity-40 mb-8">{{ term.translation }}</p>
            <p class="text-base text-white/70 leading-relaxed font-light mb-8">
              {{ term.description }}
            </p>
            <button
              @click="openDetail(term)"
              class="mt-auto text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 hover:text-accent-coral transition-all flex items-center gap-2"
            >
              XEM CHI TIẾT
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- About Section -->
      <section
        v-show="!isZenMode"
        class="mt-40 mb-32 max-w-4xl mx-auto text-center px-10 py-24 bg-white/5 backdrop-blur-3xl rounded-[4rem] border border-white/10 relative overflow-hidden group reveal-on-scroll"
      >
        <div
          class="absolute top-0 right-0 w-96 h-96 bg-accent-coral/10 blur-[120px] rounded-full -z-10 group-hover:bg-accent-coral/20 transition-all duration-1000"
        ></div>
        <div
          class="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/5 blur-[100px] rounded-full -z-10"
        ></div>

        <h2 class="font-display text-5xl font-bold mb-10 text-white tracking-tight">
          Về Nhân Gian Tiết Khí
        </h2>
        <div class="w-20 h-[1.5px] bg-accent-coral mx-auto mb-12"></div>
        <div class="space-y-8 text-text-secondary leading-loose font-light text-xl">
          <p>
            Hệ thống <strong>24 Tiết Khí</strong> là di sản văn hóa phi vật thể quý báu, phản ánh sự
            vận hành tinh vi của vũ trụ và nhịp thở của thiên nhiên. Ứng dụng này được ra đời với
            mong muốn mang đến một cái nhìn mới mẻ, hiện đại nhưng vẫn giữ trọn vẹn bản sắc truyền
            thống.
          </p>
          <p>
            Tại đây, bạn không chỉ tra cứu ngày tháng, mà còn được đắm mình trong
            <em>Không gian Đa giác quan</em>: từ sự luân chuyển của tinh tú trên Vòng quay Thiên
            văn, đến những giai điệu bản địa đầy day dứt của **Âm Khuyết Thi Thính**. Hãy cùng Tịch
            Phong Thiên Sơn - 夕风天山 lắng nghe nhịp thở của đất trời và tìm thấy sự cân bằng cho
            chính mình.
          </p>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer
      v-show="!isZenMode"
      class="mt-20 py-16 bg-black/40 border-t border-white/5 backdrop-blur-md relative z-10"
    >
      <div class="max-w-7xl mx-auto px-6 flex flex-col items-center text-center gap-6">
        <div class="flex flex-col items-center gap-2">
          <h2 class="font-display font-bold tracking-widest text-xl text-white/80">TIẾT KHÍ</h2>
          <span class="text-[9px] uppercase tracking-[0.4em] opacity-30 font-mono"
            >Trải nghiệm 24 Tiết Khí</span
          >
        </div>

        <div class="w-12 h-[1px] bg-white/10"></div>

        <p class="text-xs italic tracking-wide text-white/30 max-w-md leading-relaxed">
          Nội dung được biên soạn và hệ thống hóa dựa trên nguyên lý Thiên văn & Văn hóa Đông Phương
          cổ truyền.
        </p>

        <div class="flex flex-col gap-2 mt-4">
          <p class="text-[11px] text-white/20 uppercase tracking-[0.2em]">
            &copy; 2026 Bản quyền thuộc về
          </p>
          <span class="font-script text-2xl text-accent-coral/80"
            >Tịch Phong Thiên Sơn - 夕风天山</span
          >
          <p class="text-[9px] text-white/10 uppercase tracking-widest mt-2">
            Phát triển bởi Cộng đồng J2TEAM
          </p>
        </div>
      </div>
    </footer>

    <!-- Fullscreen Modal -->
    <Transition name="modal">
      <div
        v-if="showModal"
        class="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-12 overflow-hidden"
      >
        <div class="absolute inset-0 bg-black/90 backdrop-blur-3xl" @click="closeModal"></div>
        <div
          class="relative w-full h-full max-w-6xl bg-bg-deep rounded-none md:rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col scale-up"
        >
          <button
            @click="closeModal"
            class="absolute top-6 right-8 z-[110] p-4 bg-black/50 backdrop-blur-xl rounded-full text-white/40 hover:text-white transition-all border border-white/10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

          <!-- Modal Tabs -->
          <div class="flex border-b border-white/10 bg-black/20">
            <button
              @click="activeModalTab = 'content'"
              :class="[
                'px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative',
                activeModalTab === 'content'
                  ? 'text-accent-coral'
                  : 'text-white/40 hover:text-white',
              ]"
            >
              Chi tiết Tiết khí
              <div
                v-if="activeModalTab === 'content'"
                class="absolute bottom-0 left-0 w-full h-0.5 bg-accent-coral"
              ></div>
            </button>
            <button
              @click="activeModalTab = 'share'"
              :class="[
                'px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative',
                activeModalTab === 'share' ? 'text-accent-coral' : 'text-white/40 hover:text-white',
              ]"
            >
              Tạo thiệp chia sẻ
              <div
                v-if="activeModalTab === 'share'"
                class="absolute bottom-0 left-0 w-full h-0.5 bg-accent-coral"
              ></div>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto">
            <iframe
              v-if="activeModalTab === 'content'"
              :srcdoc="modalContent"
              class="w-full h-full border-none"
            ></iframe>
            <div v-else class="p-8 flex justify-center items-center h-full bg-black/40">
              <SolarCardGenerator v-if="activeTerm" :term="activeTerm" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.5s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.scale-up {
  animation: scaleUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes scaleUp {
  from {
    transform: scale(0.95) translateY(20px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.reveal-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  filter: blur(10px);
  transition: all 1.2s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform, opacity, filter;
}

.reveal-on-scroll.is-revealed {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
}

.animate-fade-up {
  opacity: 0;
  transform: translateY(40px);
  animation: fadeUp 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

<style>
/* Lazy load fonts specifically for Tiet Khi page */
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600&family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Dancing+Script:wght@400;700&display=swap');

.tiet-khi-wrapper {
  /* Local theme tokens */
  --tk-bg-deep: #0f1923;
  --tk-bg-surface: #162232;
  --tk-bg-elevated: #1e2f42;
  --tk-accent-coral: #ff6b4a;
  --tk-accent-amber: #ffb830;
  --tk-accent-sky: #38bdf8;
  --tk-text-primary: #f0ede6;
  --tk-text-secondary: #8b9db5;
  --tk-text-dim: #4a6180;
  --tk-border-default: #253549;
  --tk-border-hover: #ff6b4a;

  --tk-font-display: 'Philosopher', serif;
  --tk-font-body: 'Be Vietnam Pro', sans-serif;
  --tk-font-script: 'Dancing Script', cursive;

  font-family: var(--tk-font-body);
  background-color: var(--tk-bg-deep);
  color: var(--tk-text-primary);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* Local Noise grain overlay */
.tiet-khi-wrapper::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.025;
  pointer-events: none;
  z-index: 1;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
}

/* Animations */
@keyframes tk-fade-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tk-animate-fade-up {
  animation: tk-fade-up 0.6s ease-out both;
}

/* Utility overrides scoped to tiet-khi page */
.tiet-khi-wrapper .text-accent-coral {
  color: var(--tk-accent-coral) !important;
}
.tiet-khi-wrapper .text-text-secondary {
  color: var(--tk-text-secondary) !important;
}
.tiet-khi-wrapper .font-display {
  font-family: var(--tk-font-display) !important;
}
.tiet-khi-wrapper .font-script {
  font-family: var(--tk-font-script) !important;
}
</style>
