<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { RouterLink } from 'vue-router'

// --- ASSETS IMPORT ---
import moSoundPath from './assets/mo.mp3'
import chuongSoundPath from './assets/chuong.mp3'
import xinKeoSoundPath from './assets/xin-keo.mp3'
import jackpotSoundPath from './assets/jackpot.mp3'
import coinsSoundPath from './assets/coins.mp3'

// --- AUDIO SETUP ---
const moAudio = new Audio(moSoundPath)
const chuongAudio = new Audio(chuongSoundPath)
const xinKeoAudio = new Audio(xinKeoSoundPath)
const jackpotAudio = new Audio(jackpotSoundPath)
const coinsAudio = new Audio(coinsSoundPath)

moAudio.preload = 'auto'
chuongAudio.preload = 'auto'
xinKeoAudio.preload = 'auto'
jackpotAudio.preload = 'auto'
coinsAudio.preload = 'auto'

const playAudio = (audioObj: HTMLAudioElement) => {
  const clone = audioObj.cloneNode() as HTMLAudioElement
  clone.play().catch((e) => console.warn('Audio play failed:', e))
}

const isPraying = ref(false)
const incenses = ref(0)
const karma = ref(0)
const selectedOffering = ref('')
const currentPrayer = ref('')
const xinKeoResult = ref<string | null>(null)
const isJackpot = ref(false)
const isJackpotShaking = ref(false)
const isBugEasterEgg = ref(false)
const isLightning = ref(false)
const isBowlExploded = ref(false)
const isBurningPaper = ref(false)
const flyingKarmas = ref<
  { id: number; x: number; y: number; text: string; colorClass: string; delay: number }[]
>([])
const rainingCoins = ref<{ id: number; left: number; animationDuration: number; delay: number }[]>(
  [],
)
const flyingPapers = ref<{ id: number; left: number }[]>([])
let karmaId = 0
let coinId = 0
let paperId = 0
let clickTimestamps: number[] = []
let autoKarmaInterval: number | null = null

// --- LEADERBOARD (BẢNG PHONG THẦN VIA JSONBIN.IO) ---
const showLeaderboard = ref(false)
const playerName = ref(localStorage.getItem('ban_tho_it_name') || '')
const isEditingName = ref(!playerName.value)
const isSyncing = ref(false)
const leaderboardData = ref<{ name: string; score: number }[]>([])

const BIN_ID = '69ac484c43b1c97be9bdf1d7'
const X_MASTER_KEY = '$2a$10$d8Uzn.P9SZICeVUbEBCeTedvCG7vr7UVCk1.WJWc.nxyE6s6jhnV6'

// Hàm tải dữ liệu từ JSONBin
const fetchLeaderboard = async () => {
  try {
    isSyncing.value = true
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': X_MASTER_KEY,
      },
    })
    if (!res.ok) throw new Error('Không thể tải dữ liệu Bảng Phong Thần')
    const data = await res.json()
    if (data.record && Array.isArray(data.record)) {
      leaderboardData.value = data.record
    }
  } catch (error) {
    console.error('Lỗi tải Bảng Phong Thần:', error)
  } finally {
    isSyncing.value = false
  }
}

// Hàm lưu dữ liệu lên JSONBin
const syncScoreToBin = async () => {
  if (!playerName.value || karma.value <= 0) return

  try {
    isSyncing.value = true
    // 1. Tải danh sách mới nhất về trước
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': X_MASTER_KEY,
      },
    })
    let currentBoard: { name: string; score: number }[] = []

    if (res.ok) {
      const data = await res.json()
      if (data.record && Array.isArray(data.record)) {
        currentBoard = data.record
      }
    }

    // 2. Cập nhật điểm của người dùng hiện tại
    const existingPlayer = currentBoard.find((p) => p.name === playerName.value)
    if (existingPlayer) {
      // Chỉ cập nhật nếu điểm mới cao hơn điểm cũ
      if (karma.value > existingPlayer.score) {
        existingPlayer.score = karma.value
      }
    } else {
      currentBoard.push({ name: playerName.value, score: karma.value })
    }

    // 3. Sắp xếp lại lấy top 10 cho nhẹ
    currentBoard.sort((a, b) => b.score - a.score)
    currentBoard = currentBoard.slice(0, 10)
    leaderboardData.value = currentBoard

    // 4. Đẩy (PUT) dữ liệu mới lên JSONBin
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': X_MASTER_KEY,
      },
      body: JSON.stringify(currentBoard),
    })
  } catch (error) {
    console.error('Lỗi khi đồng bộ điểm lên Server:', error)
  } finally {
    isSyncing.value = false
  }
}

// Gọi fetch data khi người dùng mở bảng xếp hạng
const openLeaderboard = () => {
  showLeaderboard.value = true
  fetchLeaderboard()
}

// Sửa lại hàm updateKarma để lưu điểm sau mỗi 10 lần gõ (tránh gọi API liên tục gây spam)
let clickCountSinceLastSync = 0
const updateKarma = (amount: number) => {
  karma.value += amount
  localStorage.setItem('ban_tho_it_karma', karma.value.toString())

  clickCountSinceLastSync += Math.abs(amount)
  // Tự động đồng bộ điểm sau mỗi 10 công đức hoặc khi bị trừ điểm (Easter Egg)
  if (clickCountSinceLastSync >= 10 || amount < 0) {
    syncScoreToBin()
    clickCountSinceLastSync = 0
  }
}

const saveName = async () => {
  const newName = playerName.value.trim()
  if (!newName) {
    alert('Vui lòng nhập danh xưng để ghi danh Bảng Phong Thần!')
    return
  }

  // Nếu tên không thay đổi so với localStorage thì cứ lưu và đóng modal
  const oldName = localStorage.getItem('ban_tho_it_name')
  if (newName === oldName) {
    isEditingName.value = false
    return
  }

  try {
    isSyncing.value = true
    // Tải dữ liệu mới nhất về để check trùng tên
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': X_MASTER_KEY,
      },
    })

    if (res.ok) {
      const data = await res.json()
      if (data.record && Array.isArray(data.record)) {
        // Kiểm tra xem tên mới đã có ai dùng chưa (so khớp không phân biệt hoa thường)
        const isNameTaken = data.record.some(
          (p: { name: string; score: number }) => p.name.toLowerCase() === newName.toLowerCase(),
        )
        if (isNameTaken) {
          alert(`Danh xưng "${newName}" đã có đạo hữu khác sử dụng. Vui lòng chọn danh xưng khác!`)
          isSyncing.value = false
          return
        }
      }
    }

    // Nếu tên hợp lệ, tiến hành lưu
    localStorage.setItem('ban_tho_it_name', newName)
    isEditingName.value = false
    syncScoreToBin() // Đồng bộ ngay lần đầu nhập tên
  } catch (error) {
    console.error('Lỗi khi kiểm tra trùng tên:', error)
    alert('Đang có lỗi kết nối cõi Server, xin thử lại sau!')
  } finally {
    isSyncing.value = false
  }
}

// --- EASTER EGG (KONAMI CODE) ---
const konamiCode = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
]
let konamiIndex = 0

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === konamiCode[konamiIndex]) {
    konamiIndex++
    if (konamiIndex === konamiCode.length) {
      triggerBugEasterEgg()
      konamiIndex = 0
    }
  } else {
    konamiIndex = 0
  }
}

onMounted(() => {
  // Load karma from localStorage
  const savedKarma = localStorage.getItem('ban_tho_it_karma')
  if (savedKarma) {
    karma.value = parseInt(savedKarma, 10)
  }
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const karmaTitle = computed(() => {
  if (karma.value < 10) return 'Thực Tập Sinh'
  if (karma.value < 50) return 'Junior Tâm Linh'
  if (karma.value < 200) return 'Senior Gõ Mõ'
  if (karma.value < 500) return 'Tech Lead Thắp Hương'
  if (karma.value < 1000) return 'Giám Đốc Tâm Linh'
  return 'Thích Ca Mâu Ni Coder'
})

const prayers = [
  'Nam mô rẽ nhánh Git, xin bề trên độ cho con merge code không bị conflict.',
  'Con lạy chín phương Trời, mười phương Chư Phật, xin server đừng sập lúc 2h sáng.',
  'Nam mô A Di Đà Phật, cầu cho release sprint này không sinh ra bug đẻ trứng.',
  'Đại từ đại bi, xin Ngài phù hộ cho con khách hàng hiền hòa, không đổi requirement phút 89.',
  'Cầu cho thư mục node_modules dung lượng giảm một nửa, npm install một phát ăn ngay.',
  'Nam mô Coder Tôn Phật, cầu cho tối nay con được ngủ trước 12h đêm.',
  'Xin bề trên độ cho anh em QA hôm nay mắt mờ tay run, test không ra bug nào.',
  'Cầu cho Docker build mượt mà, pipeline CI/CD xanh ngắt một màu.',
  'Nam mô AWS, xin Ngài đừng trừ tiền oan thẻ Visa của con tháng này.',
  'Con lạy thần linh, xin độ cho cái RegExp con vừa viết chạy đúng mọi case.',
]

const triggerBugEasterEgg = () => {
  isBugEasterEgg.value = true
  playAudio(chuongAudio) // Play a scary sound if possible, using chuong for now
  updateKarma(-50)

  setTimeout(() => {
    isBugEasterEgg.value = false
  }, 4000)
}

const triggerLightningEffect = () => {
  isLightning.value = true
  playAudio(chuongAudio)
  setTimeout(() => {
    isLightning.value = false
  }, 500)
}

const explodeBowl = () => {
  isBowlExploded.value = true
  karma.value = 0
  localStorage.setItem('ban_tho_it_karma', '0')
  isJackpotShaking.value = true
  playAudio(chuongAudio)
  setTimeout(() => {
    isJackpotShaking.value = false
    alert('💥 THAM SÂN SI QUÁ NẶNG! Bát hương đã nổ tung! Công đức tan thành mây khói!')
  }, 500)
}

let paperInterval: number | null = null

const burnJossPaper = () => {
  if (isBurningPaper.value) {
    // Dừng hóa vàng
    isBurningPaper.value = false
    if (autoKarmaInterval) clearInterval(autoKarmaInterval)
    if (paperInterval) clearInterval(paperInterval)
    autoKarmaInterval = null
    paperInterval = null
    return
  }

  if (karma.value < 500) {
    alert('Nghiệp chướng còn nặng! Phải đạt đủ 500 Công Đức mới có thể Hóa Vàng Mã.')
    return
  }

  isBurningPaper.value = true

  // Hiệu ứng giấy bay
  paperInterval = window.setInterval(() => {
    const id = paperId++
    flyingPapers.value.push({ id, left: Math.random() * 100 })
    setTimeout(() => {
      flyingPapers.value = flyingPapers.value.filter((p) => p.id !== id)
    }, 4000)
  }, 1000)

  // Tự động cộng công đức mỗi 5 giây
  autoKarmaInterval = window.setInterval(() => {
    updateKarma(1)
  }, 5000)
}

const pray = () => {
  if (incenses.value === 0) {
    alert('Chưa thắp hương mà đòi khấn? Xin hãy thắp nén nhang!')
    return
  }
  if (isBowlExploded.value) {
    alert('Bát hương đã vỡ, nghiệp chướng quá nặng! Hãy tải lại trang để lập bàn thờ mới.')
    return
  }
  playAudio(chuongAudio)
  isPraying.value = true
  currentPrayer.value = ''
  xinKeoResult.value = null
  isJackpot.value = false
  isJackpotShaking.value = false

  const targetText = prayers[Math.floor(Math.random() * prayers.length)] || ''
  let i = 0
  const typeWriter = setInterval(() => {
    currentPrayer.value += targetText.charAt(i)
    i++
    if (i >= targetText.length) {
      clearInterval(typeWriter)
      setTimeout(() => {
        isPraying.value = false
      }, 3000)
    }
  }, 50)
}

const lightIncense = () => {
  if (isBowlExploded.value) {
    alert('Bát hương đã vỡ, không thể thắp nhang nữa!')
    return
  }
  if (incenses.value < 3) incenses.value++
}

const hitWoodenBlock = (e: MouseEvent) => {
  if (isBowlExploded.value) {
    alert('Bát hương đã vỡ, nghiệp chướng quá nặng! Hãy tải lại trang để lập bàn thờ mới.')
    return
  }

  // Anti-spam logic (Explode if > 6 clicks in 1 second)
  const now = Date.now()
  clickTimestamps.push(now)
  clickTimestamps = clickTimestamps.filter((t) => now - t < 1000)
  if (clickTimestamps.length > 6) {
    explodeBowl()
    return
  }

  playAudio(moAudio)
  updateKarma(1)
  const id = karmaId++

  // Randomize start position slightly around the cursor
  const offsetX = (Math.random() - 0.5) * 40
  const offsetY = (Math.random() - 0.5) * 20

  // Add a specific animation class for spread effect
  flyingKarmas.value.push({
    id,
    x: e.clientX + offsetX,
    y: e.clientY + offsetY,
    text: '+1 Công đức',
    colorClass: 'text-accent-amber animate-spread-up',
    delay: 0,
  })

  setTimeout(() => {
    flyingKarmas.value = flyingKarmas.value.filter((k) => k.id !== id)
  }, 1000)
}

const triggerJackpotEffect = () => {
  isJackpotShaking.value = true
  playAudio(jackpotAudio)
  setTimeout(() => playAudio(coinsAudio), 500)

  for (let i = 0; i < 50; i++) {
    const id = coinId++
    rainingCoins.value.push({
      id,
      left: Math.random() * 100,
      animationDuration: 1.5 + Math.random() * 2,
      delay: Math.random() * 1.5,
    })
    setTimeout(() => {
      rainingCoins.value = rainingCoins.value.filter((c) => c.id !== id)
    }, 4000)
  }

  for (let i = 0; i < 30; i++) {
    const id = karmaId++
    const randomX = Math.random() * window.innerWidth
    const randomY = window.innerHeight + Math.random() * 200
    const randomDelay = Math.random() * 1.5

    setTimeout(() => {
      flyingKarmas.value.push({
        id,
        x: randomX,
        y: randomY,
        text: '+100 CÔNG ĐỨC 🌟',
        colorClass:
          'text-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] text-2xl sm:text-3xl font-black z-[100] animate-float-up-fast',
        delay: 0,
      })
      setTimeout(() => {
        flyingKarmas.value = flyingKarmas.value.filter((k) => k.id !== id)
      }, 2000)
    }, randomDelay * 1000)
  }

  setTimeout(() => {
    isJackpotShaking.value = false
  }, 2500)
}

const xinKeo = () => {
  if (!currentPrayer.value && incenses.value === 0) {
    alert('Phải thắp hương khấn vái trước khi xin keo (Deploy) chứ!')
    return
  }
  if (isBowlExploded.value) {
    alert('Bát hương đã vỡ, nghiệp chướng quá nặng! Hãy tải lại trang để lập bàn thờ mới.')
    return
  }
  playAudio(xinKeoAudio)
  isJackpot.value = false
  isJackpotShaking.value = false

  const randomVal = Math.random()
  if (randomVal < 0.1) {
    isJackpot.value = true
    xinKeoResult.value =
      '🌟 ĐẠI CÁT ĐẠI LỢI: THẦN LINH ĐỘ FULL STACK! PUSH LÊN PRODUCTION NGAY VÀ LUÔN! 🌟'
    updateKarma(100)
    triggerJackpotEffect()
  } else {
    const result = Math.floor(Math.random() * 3)
    if (result === 0) {
      xinKeoResult.value = 'Nhất Âm Nhất Dương: Thần linh đồng ý - Được phép Deploy!'
    } else if (result === 1) {
      xinKeoResult.value = 'Hai Âm (Úp): Thần linh quay lưng - Code còn Bug, đừng cố!'
      triggerLightningEffect()
    } else {
      xinKeoResult.value = 'Hai Dương (Ngửa): Thần linh đang cười - Đi fix bug rồi xin lại!'
    }
  }
}

const offerings = [
  {
    id: 'ram',
    name: 'RAM Cháy',
    icon: '💾',
    desc: 'RAM 16GB cháy khét lẹt. Cúng để cầu đừng tràn bộ nhớ rò rỉ.',
    style: { top: '10px', left: '10%', zIndex: 10, transform: 'rotate(-15deg)' },
  },
  {
    id: 'keyboard',
    name: 'Phím Liệt',
    icon: '⌨️',
    desc: 'Bàn phím cơ liệt nút Space. Cúng để tránh gõ nhầm lệnh rm -rf.',
    style: { top: '-15px', left: '30%', zIndex: 12, transform: 'rotate(5deg)' },
  },
  {
    id: 'redbull',
    name: 'Bò Húc',
    icon: '🥫',
    desc: 'Nước tăng lực đã bay hơi. Cúng để xin thêm nội tại cày đêm OT.',
    style: { top: '5px', left: '70%', zIndex: 11, transform: 'rotate(10deg)' },
  },
  {
    id: 'chicken',
    name: 'Gà Luộc',
    icon: '🐔',
    desc: 'Gà trống ngậm hoa hồng. Cúng mặn cho dự án không bị ngỏm.',
    style: { top: '-5px', left: '50%', zIndex: 15, transform: 'rotate(-5deg) scale(1.2)' },
  },
  {
    id: 'router',
    name: 'Router Đứt',
    icon: '📡',
    desc: 'Router mạng gãy ăng ten. Cúng xin mạng thông suốt lúc push code.',
    style: { top: '25px', left: '40%', zIndex: 14, transform: 'rotate(-5deg)' },
  },
  {
    id: 'mouse',
    name: 'Chuột Lỗi',
    icon: '🖱️',
    desc: 'Chuột dính lỗi double-click. Cúng để không lỡ tay merge nhầm PR.',
    style: { top: '25px', left: '25%', zIndex: 14, transform: 'rotate(20deg)' },
  },
  {
    id: 'fruit',
    name: 'Mâm Ngũ Quả',
    icon: '🍎',
    desc: 'Mâm quả tươi xanh. Cúng xin pipeline CI/CD luôn một màu xanh.',
    style: { top: '20px', left: '60%', zIndex: 13, transform: 'rotate(10deg) scale(1.1)' },
  },
  {
    id: 'hdd',
    name: 'Ổ Cứng Bad',
    icon: '💿',
    desc: 'Ổ cứng kêu lạch cạch. Cúng cầu cho Database không bị corrupt.',
    style: { top: '20px', left: '0%', zIndex: 16, transform: 'rotate(30deg)' },
  },
  {
    id: 'usb',
    name: 'USB Boot',
    icon: '💽',
    desc: 'USB cài Win cứu hộ. Vật phẩm phòng thân khi màn hình xanh hiện lên.',
    style: { top: '25px', left: '80%', zIndex: 12, transform: 'rotate(-25deg)' },
  },
]

const selectOffering = (id: string) => {
  selectedOffering.value = id
}
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden selection:bg-accent-coral/30"
    :class="{ 'animate-shake-violent': isJackpotShaking }"
  >
    <!-- Hiệu ứng ma mị ở Background -->
    <div class="absolute inset-0 z-0 opacity-20 pointer-events-none matrix-bg"></div>
    <div
      v-if="isPraying"
      class="absolute inset-0 bg-red-900/10 mix-blend-overlay z-0 animate-pulse pointer-events-none"
    ></div>

    <!-- Hiệu ứng Nổ Hũ (Jackpot Background) -->
    <div
      v-if="isJackpot"
      class="absolute inset-0 z-0 bg-yellow-500/20 mix-blend-color-dodge animate-pulse pointer-events-none"
    ></div>
    <div
      v-if="isJackpot"
      class="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden"
    >
      <div
        class="w-[200vw] h-[200vh] bg-[conic-gradient(from_0deg,transparent_0_15deg,rgba(251,191,36,0.3)_15deg_30deg,transparent_30deg_45deg,rgba(251,191,36,0.3)_45deg_60deg,transparent_60deg_75deg,rgba(251,191,36,0.3)_75deg_90deg,transparent_90deg_105deg,rgba(251,191,36,0.3)_105deg_120deg,transparent_120deg_135deg,rgba(251,191,36,0.3)_135deg_150deg,transparent_150deg_165deg,rgba(251,191,36,0.3)_165deg_180deg,transparent_180deg_195deg,rgba(251,191,36,0.3)_195deg_210deg,transparent_210deg_225deg,rgba(251,191,36,0.3)_225deg_240deg,transparent_240deg_255deg,rgba(251,191,36,0.3)_255deg_270deg,transparent_270deg_285deg,rgba(251,191,36,0.3)_285deg_300deg,transparent_300deg_315deg,rgba(251,191,36,0.3)_315deg_330deg,transparent_330deg_345deg,rgba(251,191,36,0.3)_345deg_360deg)] animate-spin-slow-reverse"
      ></div>
    </div>

    <!-- Mưa Tiền Vàng -->
    <div
      v-for="coin in rainingCoins"
      :key="'coin-' + coin.id"
      class="absolute text-3xl md:text-5xl pointer-events-none z-[110] animate-coin-fall drop-shadow-xl"
      :style="{
        left: coin.left + '%',
        top: '-10%',
        animationDuration: coin.animationDuration + 's',
        animationDelay: coin.delay + 's',
      }"
    >
      🪙
    </div>

    <!-- Hiệu ứng Sét Đánh -->
    <div
      v-if="isLightning"
      class="fixed inset-0 z-[300] bg-white mix-blend-difference animate-lightning pointer-events-none"
    ></div>

    <!-- Vàng mã bay -->
    <div
      v-for="paper in flyingPapers"
      :key="'paper-' + paper.id"
      class="absolute text-3xl md:text-5xl pointer-events-none z-[110] animate-paper-fly drop-shadow-xl"
      :style="{ left: paper.left + '%', bottom: '-10%' }"
    >
      💸
    </div>

    <!-- Nút Mở Bảng Phong Thần (Tách biệt) -->
    <button
      @click="openLeaderboard"
      class="absolute top-20 right-4 lg:top-4 lg:left-4 lg:right-auto bg-gradient-to-r from-yellow-700 to-amber-600 hover:from-yellow-600 hover:to-amber-500 text-black font-bold py-2 px-4 rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.4)] border border-yellow-400 z-30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group"
    >
      <span class="text-xl group-hover:animate-bounce">📜</span>
      <span class="font-display tracking-widest uppercase text-sm">Bảng Phong Thần</span>
    </button>

    <!-- Cột điểm Công Đức (Chỉ hiển thị, không click được nữa) -->
    <div
      class="absolute top-4 right-4 bg-bg-surface/80 backdrop-blur border border-accent-amber/50 px-4 py-2 rounded-xl shadow-[0_0_10px_rgba(251,191,36,0.2)] z-20 flex flex-col items-end transition-transform"
      :class="{
        'scale-110 shadow-[0_0_30px_rgba(251,191,36,0.8)] border-yellow-400': isJackpotShaking,
      }"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl">🙏</span>
        <span
          class="text-accent-amber font-bold font-display transition-all duration-300"
          :class="{ 'text-yellow-300 text-xl': isJackpotShaking }"
          >Công đức: {{ karma }}</span
        >
      </div>
      <div class="text-[10px] text-text-dim mt-1 uppercase tracking-wider font-bold">
        {{ karmaTitle }}
      </div>
    </div>

    <!-- Bảng Phong Thần (Leaderboard Modal) -->
    <div v-if="showLeaderboard" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/80 backdrop-blur-sm"
        @click="showLeaderboard = false"
      ></div>

      <!-- Modal Content -->
      <div
        class="bg-gradient-to-b from-gray-900 to-black border-2 border-yellow-600 rounded-xl p-6 w-full max-w-md relative z-10 shadow-[0_0_50px_rgba(251,191,36,0.2)] overflow-hidden"
      >
        <div
          class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"
        ></div>
        <div
          v-if="isSyncing"
          class="absolute top-0 left-0 h-1 bg-yellow-400 animate-pulse w-full"
        ></div>

        <button
          @click="showLeaderboard = false"
          class="absolute top-3 right-4 text-gray-500 hover:text-white text-xl font-bold"
        >
          &times;
        </button>

        <h2
          class="text-3xl font-display font-bold text-center text-yellow-500 mb-6 drop-shadow-[0_2px_5px_rgba(251,191,36,0.5)] tracking-widest uppercase"
        >
          Bảng Phong Thần
        </h2>

        <!-- Nhập tên -->
        <div v-if="isEditingName" class="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <p class="text-sm text-gray-300 mb-2 italic">
            Xin cho biết quý danh để lưu vào sổ Công Đức:
          </p>
          <div class="flex gap-2">
            <input
              v-model="playerName"
              @keyup.enter="saveName"
              type="text"
              placeholder="Nhập tên của bạn..."
              class="flex-1 bg-gray-900 border border-yellow-700/50 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-400"
              maxlength="20"
            />
            <button
              @click="saveName"
              class="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-4 py-2 rounded transition-colors"
              :disabled="isSyncing"
            >
              Lưu
            </button>
          </div>
        </div>
        <div
          v-else
          class="mb-6 text-center text-gray-300 text-sm flex justify-center items-center gap-2"
        >
          Danh xưng: <span class="font-bold text-yellow-400 text-base">{{ playerName }}</span>
          <button
            @click="isEditingName = true"
            class="text-gray-500 hover:text-yellow-400"
            title="Đổi tên"
          >
            ✏️
          </button>
          <button
            @click="fetchLeaderboard"
            class="ml-2 text-gray-500 hover:text-green-400"
            title="Làm mới bảng"
            :class="{ 'animate-spin': isSyncing }"
          >
            🔄
          </button>
        </div>

        <!-- Danh sách Top -->
        <div class="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
          <div
            v-if="leaderboardData.length === 0 && !isSyncing"
            class="text-center text-gray-500 py-4 italic"
          >
            Chưa có vị thần nào giáng thế...
          </div>
          <div
            v-if="isSyncing && leaderboardData.length === 0"
            class="text-center text-yellow-500 py-4 italic animate-pulse"
          >
            Đang thỉnh sớ từ cõi Server...
          </div>

          <div
            v-for="(player, index) in leaderboardData"
            :key="index"
            class="flex items-center justify-between p-3 rounded bg-gradient-to-r border-l-4 transition-all duration-300"
            :class="[
              player.name === playerName
                ? 'from-yellow-900/40 to-transparent border-yellow-500 text-yellow-400 shadow-inner'
                : 'from-gray-800/50 to-transparent border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-800',
            ]"
          >
            <div class="flex items-center gap-3">
              <!-- Hạng -->
              <span
                class="w-6 text-center font-black text-lg"
                :class="
                  index === 0
                    ? 'text-yellow-400'
                    : index === 1
                      ? 'text-gray-300'
                      : index === 2
                        ? 'text-amber-600'
                        : 'text-gray-600'
                "
              >
                {{
                  index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index + 1)
                }}
              </span>
              <span
                class="font-bold truncate max-w-[150px] sm:max-w-[200px]"
                :class="{ 'font-display tracking-wide': player.name === playerName }"
              >
                {{ player.name }}
                <span v-if="player.name === playerName" class="text-xs text-yellow-500/70 ml-1"
                  >(Bạn)</span
                >
              </span>
            </div>
            <div class="flex items-center gap-1 font-mono font-bold text-amber-500">
              {{ player.score.toLocaleString() }} <span class="text-xs text-gray-500">🙏</span>
            </div>
          </div>
        </div>

        <p class="text-center text-xs text-gray-600 mt-4 italic">
          *Hack điểm sẽ bị thần linh quật cháy RAM*
        </p>
      </div>
    </div>

    <!-- Màn hình đỏ ngòm khi dính Easter Egg -->
    <div
      v-if="isBugEasterEgg"
      class="fixed inset-0 z-[200] bg-red-900/90 flex flex-col items-center justify-center animate-shake-violent pointer-events-none"
    >
      <div class="text-9xl animate-bounce drop-shadow-[0_0_50px_rgba(255,0,0,1)]">🐞</div>
      <h2
        class="text-white text-5xl font-black mt-8 font-display drop-shadow-lg text-center uppercase tracking-widest"
      >
        Nghiệp Quật!
      </h2>
      <p
        class="text-yellow-300 text-2xl mt-4 font-bold bg-black/50 px-6 py-2 rounded-lg border border-red-500"
      >
        -50 Công Đức
      </p>
      <p class="text-white/60 mt-4 italic">"Mã cấm kỵ đã gọi ra siêu Bug..."</p>
    </div>

    <!-- Animation bay chữ Công Đức -->
    <div
      v-for="k in flyingKarmas"
      :key="k.id"
      class="fixed font-bold pointer-events-none z-50 text-lg"
      :class="k.colorClass"
      :style="{ left: k.x + 'px', top: k.y - 20 + 'px' }"
    >
      {{ k.text }}
    </div>

    <h1
      class="font-display text-4xl sm:text-6xl font-bold text-accent-amber mb-2 text-center drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] z-10"
      :class="{ 'animate-shake text-red-500': isPraying }"
    >
      BÀN THỜ IT
    </h1>
    <p class="text-text-secondary text-sm mb-8 text-center italic max-w-md z-10">
      "Độ Code, độ Server, không độ Bug."
    </p>

    <!-- Khu vực Bàn thờ (Có cột, rèm, mái) -->
    <div
      class="relative w-full max-w-2xl flex flex-col items-center mt-10 z-10"
      :class="{ 'shake-little border-red-500/50': isPraying }"
    >
      <!-- Hiệu ứng khói nhang lượn lờ (Càng thắp nhiều hương, khói càng dày) -->
      <div
        v-if="incenses > 0"
        class="fixed inset-0 z-40 pointer-events-none overflow-hidden mix-blend-screen transition-all duration-1000"
        :style="{ opacity: 0.3 + incenses * 0.15 }"
      >
        <!-- Khói lớp 1 (Nén hương 1) - Xoáy nhẹ ở nền -->
        <div
          class="absolute bottom-[10%] left-[-20%] w-[150%] h-[60vh] bg-gradient-to-r from-transparent via-white/10 to-transparent blur-[50px] animate-smoke-wave-1 transform -rotate-6"
        ></div>
        <div
          class="absolute top-[20%] left-[10%] w-[80vw] h-[40vh] bg-white/5 blur-[60px] rounded-full animate-smoke-swirl"
          style="animation-duration: 40s"
        ></div>

        <!-- Khói lớp 2 (Nén hương 2) - Cơn sóng ngược -->
        <div v-if="incenses >= 2">
          <div
            class="absolute bottom-[-10%] right-[-50%] w-[200%] h-[50vh] bg-gradient-to-l from-transparent via-white/15 to-transparent blur-[60px] animate-smoke-wave-2 transform rotate-12"
          ></div>
          <div
            class="absolute bottom-[40%] right-[20%] w-[50vw] h-[50vh] bg-white/10 blur-[70px] rounded-full animate-smoke-swirl"
            style="animation-duration: 35s; animation-direction: reverse"
          ></div>
        </div>

        <!-- Khói lớp 3 (Nén hương 3) - Không gian lãng đãng -->
        <div v-if="incenses >= 3">
          <div
            class="absolute bottom-[30%] left-[5%] w-[90vw] h-[40vh] bg-white/15 blur-[80px] rounded-[100%] animate-smoke-swirl"
            style="animation-duration: 25s"
          ></div>
          <!-- Lớp sương mù che phủ nhẹ toàn bộ -->
          <div
            class="absolute bottom-0 left-[-50%] w-[200%] h-[70vh] bg-gradient-to-t from-white/10 to-transparent blur-[40px] animate-smoke-wave-1"
            style="animation-duration: 45s; transform: rotate(0deg)"
          ></div>
        </div>
      </div>

      <!-- Cấu trúc Cột và Rèm -->
      <div class="absolute inset-0 pointer-events-none -m-4 sm:-m-8 z-20">
        <!-- Mái che bàn thờ -->
        <div
          class="absolute top-0 left-0 w-full h-16 sm:h-24 bg-gradient-to-b from-red-900 to-red-800 border-b-4 border-yellow-600 rounded-t-3xl shadow-xl flex items-center justify-center overflow-hidden"
        >
          <div class="absolute w-full h-full opacity-30 flex justify-between px-4">
            <span class="text-4xl sm:text-6xl transform scale-x-[-1]">🐉</span>
            <span class="text-4xl sm:text-6xl">🐉</span>
          </div>
          <!-- Hoành phi -->
          <div
            class="bg-black/60 border-2 border-yellow-500 px-6 py-1 z-10 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
          >
            <span
              class="text-yellow-500 font-serif font-bold text-xl sm:text-2xl tracking-widest uppercase"
              >Tâm Linh Coder</span
            >
          </div>
        </div>

        <!-- Rèm đỏ thả xuống (DÀI HƠN) -->
        <div
          class="absolute top-16 sm:top-24 left-0 w-full flex justify-between px-4 opacity-90 z-20"
        >
          <div
            class="w-16 sm:w-28 h-40 sm:h-56 bg-gradient-to-b from-red-800 to-red-900 rounded-b-full shadow-2xl border-b-[3px] border-yellow-500 origin-top animate-curtain-sway flex flex-col items-center pt-4"
            style="animation-delay: 0s"
          >
            <div class="w-1 h-[80%] bg-yellow-600/30 rounded-full"></div>
          </div>
          <div
            class="w-24 sm:w-40 h-24 sm:h-32 bg-gradient-to-b from-red-800 to-red-900 rounded-b-full shadow-2xl border-b-[3px] border-yellow-500 origin-top animate-curtain-sway"
            style="animation-delay: 0.5s"
          ></div>
          <div
            class="w-16 sm:w-28 h-40 sm:h-56 bg-gradient-to-b from-red-800 to-red-900 rounded-b-full shadow-2xl border-b-[3px] border-yellow-500 origin-top animate-curtain-sway flex flex-col items-center pt-4"
            style="animation-delay: 1s"
          >
            <div class="w-1 h-[80%] bg-yellow-600/30 rounded-full"></div>
          </div>
        </div>

        <!-- Hai cột trụ chạm rồng -->
        <div
          class="absolute top-16 sm:top-24 bottom-0 left-0 w-8 sm:w-12 bg-gradient-to-r from-red-950 via-red-800 to-red-900 border-x-2 border-yellow-700 rounded-t shadow-2xl flex flex-col items-center py-4 z-10"
        >
          <div
            class="text-yellow-500/60 text-xl sm:text-2xl write-vertical font-serif tracking-widest h-full flex items-center justify-center font-bold drop-shadow-md"
          >
            CODE MƯỢT MÀ
          </div>
        </div>
        <div
          class="absolute top-16 sm:top-24 bottom-0 right-0 w-8 sm:w-12 bg-gradient-to-l from-red-950 via-red-800 to-red-900 border-x-2 border-yellow-700 rounded-t shadow-2xl flex flex-col items-center py-4 z-10"
        >
          <div
            class="text-yellow-500/60 text-xl sm:text-2xl write-vertical font-serif tracking-widest h-full flex items-center justify-center font-bold drop-shadow-md"
          >
            SERVER VỮNG VÀNG
          </div>
        </div>
      </div>

      <!-- Mặt bàn thờ (Main content) -->
      <div
        class="bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-md border-2 border-yellow-700/50 p-6 sm:p-10 pt-32 sm:pt-44 shadow-[0_10px_40px_rgba(251,191,36,0.15)] w-[90%] mx-auto flex flex-col items-center relative z-10 mt-8"
      >
        <!-- Di ảnh: Màn hình xanh (BSOD) -->
        <div
          class="w-48 h-32 bg-blue-700 border-8 border-gray-800 rounded mb-8 shadow-inner flex flex-col items-center justify-center p-2 relative overflow-hidden group"
        >
          <div
            class="text-white font-mono text-[8px] sm:text-[10px] leading-tight opacity-90 text-center w-full"
          >
            <p>A problem has been detected</p>
            <p>and Windows has been shut down</p>
            <p class="mt-2 text-xl font-bold">:(</p>
            <p class="mt-2 text-yellow-300 font-bold">ERR_CODE_BUG</p>
          </div>
          <!-- Vòng hào quang -->
          <div
            class="absolute inset-0 bg-yellow-400/20 rounded-full scale-[2] blur-xl group-hover:bg-yellow-400/40 transition-all duration-1000 animate-spin-slow pointer-events-none"
          ></div>
        </div>

        <!-- Bát hương & Mõ -->
        <div class="flex items-end justify-center gap-10 mb-8 w-full">
          <!-- Không gian trống để cân bằng -->
          <div class="w-16"></div>

          <!-- Bát hương -->
          <div v-if="!isBowlExploded" class="relative w-32 flex flex-col items-center">
            <div
              class="w-24 h-16 bg-gradient-to-b from-yellow-600 to-yellow-900 rounded-b-3xl border-t-4 border-yellow-500 shadow-inner flex items-center justify-center z-10 relative overflow-hidden"
            >
              <span class="text-2xl drop-shadow-md">🐉</span>
            </div>
            <!-- Hương -->
            <div class="absolute bottom-12 flex gap-2 z-0">
              <div
                v-for="i in incenses"
                :key="i"
                class="w-1.5 h-24 bg-red-900 rounded-t-full relative animate-fade-up"
              >
                <!-- Lửa -->
                <div
                  class="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(255,165,0,1)]"
                ></div>
                <!-- Khói -->
                <div
                  class="absolute -top-16 left-1/2 -translate-x-1/2 w-8 h-20 bg-white/10 blur-md rounded-full origin-bottom"
                  style="animation: sway 4s ease-in-out infinite alternate"
                ></div>
              </div>
            </div>
          </div>
          <div v-else class="relative w-32 flex flex-col items-center justify-end h-24">
            <span class="text-6xl drop-shadow-md text-red-500 animate-pulse">💥</span>
          </div>

          <!-- Cái Mõ -->
          <button
            @click="hitWoodenBlock"
            title="Gõ mõ tích công đức"
            class="w-16 h-12 bg-amber-800 rounded-full shadow-[inset_0_-4px_10px_rgba(0,0,0,0.5),0_4px_5px_rgba(0,0,0,0.3)] flex items-center justify-center relative active:scale-90 active:translate-y-2 transition-all group hover:bg-amber-700"
          >
            <div class="w-10 h-6 border-t-2 border-black/30 rounded-full absolute top-1"></div>
            <span class="text-xl filter drop-shadow">🐟</span>
          </button>
        </div>

        <!-- Đồ cúng trên 1 Đĩa khổng lồ -->
        <div class="relative w-full max-w-sm mx-auto mb-10 pt-4 pb-8 flex flex-col items-center">
          <!-- Đĩa khổng lồ (Nền dưới) -->
          <div
            class="absolute bottom-0 w-full h-16 bg-gradient-to-b from-gray-300 to-gray-500 rounded-[50%] shadow-[0_10px_30px_rgba(0,0,0,0.8)] border-b-[4px] border-gray-600 z-0 flex items-center justify-center transition-all duration-300"
            :class="{
              'from-amber-100 to-amber-300 border-amber-500 shadow-[0_10px_30px_rgba(251,191,36,0.5)]':
                selectedOffering,
            }"
          >
            <!-- Viền lòng đĩa -->
            <div class="w-[85%] h-8 border border-black/10 rounded-[50%]"></div>
          </div>

          <!-- Các vật phẩm cúng (Nằm lộn xộn trên đĩa) -->
          <div class="relative w-full h-16 z-10 flex items-center justify-center">
            <div
              v-for="item in offerings"
              :key="item.id"
              @click="selectOffering(item.id)"
              class="absolute group cursor-pointer flex flex-col items-center"
              :style="item.style"
            >
              <!-- Vật phẩm -->
              <div
                class="z-10 transition-transform duration-300 flex flex-col items-center group-hover:scale-125 group-hover:z-50"
                :class="
                  selectedOffering === item.id
                    ? '-translate-y-4 drop-shadow-[0_0_20px_rgba(251,191,36,1)] scale-150 z-50'
                    : 'drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]'
                "
              >
                <span
                  class="text-4xl sm:text-5xl filter"
                  :class="{ 'animate-bounce': selectedOffering === item.id }"
                  >{{ item.icon }}</span
                >
              </div>

              <!-- Tooltip khi di chuột -->
              <div
                class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-3 bg-black/95 backdrop-blur-sm border border-accent-amber/50 rounded-lg text-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[60] pointer-events-none shadow-[0_10px_20px_rgba(0,0,0,0.8)] scale-95 group-hover:scale-100"
              >
                <p class="text-accent-amber font-bold text-[13px] mb-1">{{ item.name }}</p>
                <p class="text-gray-300 text-[11px] leading-relaxed">{{ item.desc }}</p>
                <!-- Mũi tên chỉ xuống của Tooltip -->
                <div
                  class="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-black/95"
                ></div>
                <!-- Viền mũi tên -->
                <div
                  class="absolute top-full left-1/2 -translate-x-1/2 border-[7px] border-transparent border-t-accent-amber/50 -mt-[1px] z-[-1]"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Kết quả Khấn / Xin keo -->
        <div
          class="min-h-[120px] w-full bg-black/60 rounded-lg border border-accent-amber/30 p-5 mb-6 flex flex-col items-center justify-center text-center relative overflow-hidden"
        >
          <!-- Text khấn -->
          <p
            v-if="currentPrayer"
            class="text-accent-amber text-lg font-serif italic leading-relaxed z-10"
          >
            "{{ currentPrayer }}"
          </p>
          <p v-else-if="!currentPrayer && !xinKeoResult" class="text-text-dim text-sm italic z-10">
            Thành tâm khấn vái, chớ có đùa cợt...
          </p>

          <!-- Kết quả xin keo -->
          <div
            v-if="xinKeoResult"
            class="mt-4 pt-4 border-t border-accent-amber/20 w-full animate-fade-up z-10"
          >
            <p class="text-sm text-text-secondary mb-1 uppercase tracking-widest text-[10px]">
              Quẻ Xin Deploy:
            </p>
            <p
              class="font-bold text-lg"
              :class="
                xinKeoResult.includes('Được')
                  ? 'text-green-400'
                  : xinKeoResult.includes('từ chối')
                    ? 'text-red-400'
                    : 'text-yellow-400'
              "
            >
              {{ xinKeoResult }}
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
          <button
            @click="lightIncense"
            class="bg-bg-elevated border border-accent-coral/50 text-accent-coral py-3 px-4 rounded-lg font-bold hover:bg-accent-coral hover:text-bg-deep transition-all duration-300 disabled:opacity-30 disabled:hover:bg-bg-elevated disabled:hover:text-accent-coral"
            :disabled="incenses >= 3 || isBowlExploded"
          >
            🔥 Thắp Hương
          </button>
          <button
            @click="pray"
            class="bg-accent-amber text-bg-deep py-3 px-4 rounded-lg font-bold hover:bg-yellow-400 transition-all duration-300 shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] active:scale-95 disabled:opacity-50"
            :disabled="isBowlExploded"
          >
            🙏 Khấn Cáo
          </button>
          <button
            @click="xinKeo"
            class="col-span-2 sm:col-span-1 bg-green-700/80 text-white border border-green-500 py-3 px-4 rounded-lg font-bold hover:bg-green-600 transition-all duration-300 active:scale-95 shadow-[0_0_10px_rgba(34,197,94,0.3)] disabled:opacity-50"
            :disabled="isBowlExploded"
          >
            ☯️ Xin Keo Deploy
          </button>

          <button
            @click="burnJossPaper"
            class="col-span-2 sm:col-span-3 mt-2 bg-gradient-to-r from-red-600 to-orange-500 text-white border border-red-400 py-3 px-4 rounded-lg font-bold hover:from-red-500 hover:to-orange-400 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.5)] active:scale-95 disabled:opacity-80 disabled:cursor-not-allowed"
            :disabled="isBowlExploded"
          >
            {{
              isBurningPaper
                ? '🛑 Dừng hóa vàng (Tự động canh tác công đức)'
                : '🧧 Hóa Vàng Mã (Cần 500 Công Đức)'
            }}
          </button>
        </div>
      </div>
      <!-- Đóng div mặt bàn thờ -->
    </div>
    <!-- Đóng div toàn bộ bàn thờ -->

    <!-- Chân bàn -->
    <div
      class="w-full max-w-2xl h-8 bg-gradient-to-b from-yellow-900 to-amber-950 rounded-b-xl shadow-2xl mb-8 relative z-0 -mt-2 border-b-4 border-black/50"
    ></div>

    <!-- Sớ Hướng Dẫn (Chỉ hiện trên màn hình lớn) -->
    <div class="fixed left-4 top-1/2 -translate-y-1/2 w-64 hidden lg:block z-40">
      <div
        class="bg-[#f4e4bc] p-5 rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-x-[12px] border-[#c0392b] relative font-sans text-[#5c3a21] transform -rotate-2"
      >
        <!-- Trục cuốn sớ -->
        <div
          class="absolute -top-3 -left-4 -right-4 h-6 bg-gradient-to-b from-[#8b4513] to-[#5c2e0b] rounded-full shadow-md border border-[#3e1f07]"
        ></div>
        <div
          class="absolute -bottom-3 -left-4 -right-4 h-6 bg-gradient-to-b from-[#8b4513] to-[#5c2e0b] rounded-full shadow-md border border-[#3e1f07]"
        ></div>

        <h3
          class="text-center font-bold text-xl text-[#8b0000] border-b-2 border-[#8b0000]/30 pb-2 mb-4 uppercase tracking-wider font-display"
        >
          Tâm Pháp Tu Luyện
        </h3>

        <ul class="space-y-3 text-sm leading-relaxed">
          <li class="flex items-start gap-2">
            <span class="text-[#8b0000] mt-0.5">📜</span>
            <span
              ><strong>B1:</strong> Thành tâm chọn một món
              <span class="font-bold text-[#b85a1b]">đồ cúng</span> phù hợp với "Nghiệp" của dự
              án.</span
            >
          </li>
          <li class="flex items-start gap-2">
            <span class="text-[#8b0000] mt-0.5">🔥</span>
            <span
              ><strong>B2:</strong> <span class="font-bold text-[#b85a1b]">Thắp hương</span> để
              thông linh tới cõi Server. Mọi lời cầu xin lúc này mới linh nghiệm.</span
            >
          </li>
          <li class="flex items-start gap-2">
            <span class="text-[#8b0000] mt-0.5">🙏</span>
            <span
              ><strong>B3:</strong> Bấm <span class="font-bold text-[#b85a1b]">Khấn Cáo</span> để
              giãi bày nỗi lòng Coder.</span
            >
          </li>
          <li class="flex items-start gap-2">
            <span class="text-[#8b0000] mt-0.5">☯️</span>
            <span
              ><strong>B4:</strong> <span class="font-bold text-[#b85a1b]">Xin Keo</span> để biết
              Thần Linh có cho phép nhấn nút Deploy hôm nay hay không.</span
            >
          </li>
          <li class="flex items-start gap-2 border-t border-[#8b0000]/20 pt-3 mt-2">
            <span class="text-[#8b0000] mt-0.5">🐟</span>
            <span
              >Gõ mõ liên tục để thăng cấp cảnh giới từ "Thực Tập Sinh" thành "Thích Ca Mâu Ni
              Coder".</span
            >
          </li>
        </ul>

        <div
          class="mt-5 p-3 bg-[#e8d5a5] border border-[#d4c08f] rounded italic text-xs text-center text-[#8b0000]/80"
        >
          *Bí thuật: "Lên, Lên, Xuống, Xuống, Trái, Phải, Trái, Phải, B, A" gọi ra Hắc Ám...*
        </div>
      </div>
    </div>

    <!-- Sớ Luật Nhân Quả - BÊN PHẢI (Chỉ hiện trên màn hình lớn) -->
    <div class="fixed right-4 top-1/2 -translate-y-1/2 w-64 hidden xl:block z-40">
      <div
        class="bg-[#f4e4bc] p-5 rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-x-[12px] border-[#c0392b] relative font-sans text-[#5c3a21] transform rotate-2 min-h-[460px] flex flex-col justify-between"
      >
        <!-- Trục cuốn sớ -->
        <div
          class="absolute -top-3 -left-4 -right-4 h-6 bg-gradient-to-b from-[#8b4513] to-[#5c2e0b] rounded-full shadow-md border border-[#3e1f07]"
        ></div>
        <div
          class="absolute -bottom-3 -left-4 -right-4 h-6 bg-gradient-to-b from-[#8b4513] to-[#5c2e0b] rounded-full shadow-md border border-[#3e1f07]"
        ></div>

        <h3
          class="text-center font-bold text-xl text-[#8b0000] border-b-2 border-[#8b0000]/30 pb-2 mb-4 uppercase tracking-wider font-display"
        >
          Luật Nhân Quả
        </h3>

        <div class="space-y-4 text-sm leading-relaxed text-center flex-1">
          <p class="italic text-[#8b0000]/90 mb-2">"Có thờ có thiêng,<br />có kiêng có lành..."</p>

          <div
            class="bg-[#e8d5a5] p-3 border border-[#d4c08f] rounded shadow-inner relative overflow-hidden group mb-4"
          >
            <div class="absolute inset-0 bg-yellow-400/20 animate-pulse pointer-events-none"></div>
            <p class="font-bold text-[#b85a1b] text-base mb-1 drop-shadow-sm">🌟 ĐẠI CÁT 🌟</p>
            <p class="text-[11px] leading-tight">
              Trúng Nổ Hũ! Mưa Công Đức và Đồng Xu rơi lả tả. Lập tức nhận
              <strong>+100 Công Đức</strong>.
            </p>
          </div>

          <div class="text-left space-y-3 mt-2 text-xs border-y border-[#8b0000]/20 py-3">
            <p class="flex gap-2 items-start">
              <span class="text-[#8b0000] text-base">☯️</span>
              <span
                ><strong>Nhất Âm Nhất Dương:</strong><br />Keo tốt. Mọi sự hanh thông, được phép
                Deploy lên Production.</span
              >
            </p>
            <p class="flex gap-2 items-start">
              <span class="text-gray-600 text-base">⚫</span>
              <span
                ><strong>Hai Âm (Úp):</strong><br />Thần linh quay lưng. Hệ thống báo động đỏ, cố
                push là sập Server.</span
              >
            </p>
            <p class="flex gap-2 items-start">
              <span class="text-gray-600 text-base">⚪</span>
              <span
                ><strong>Hai Dương (Ngửa):</strong><br />Thần linh đang cười chê. Code còn quá nhiều
                Bug, về đi fix lại!</span
              >
            </p>
          </div>
        </div>

        <div
          class="mt-4 pt-3 border-t-2 border-dashed border-[#8b0000]/30 text-xs font-bold text-[#8b0000] text-center italic bg-[#e8d5a5]/50 p-2 rounded"
        >
          "Khuyên ai chăm chỉ thắp hương,<br />Gõ mõ tích đức, dọn đường cõi IT.<br />Xin Keo thành
          ý khắc ghi,<br />Ắt có ngày nổ, mây đi nắng về!"
        </div>
      </div>
    </div>

    <RouterLink
      to="/"
      class="inline-flex items-center gap-2 border border-border-default bg-bg-surface/50 backdrop-blur-sm px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-accent-coral z-10 rounded-full"
    >
      &larr; Rời khỏi Tâm Linh
    </RouterLink>
  </div>
</template>

<style scoped>
@keyframes sway {
  0% {
    transform: translateX(-8px) rotate(-15deg);
    opacity: 0.2;
  }
  100% {
    transform: translateX(8px) rotate(15deg);
    opacity: 0.8;
  }
}

@keyframes float-up {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-80px) scale(1.5);
    opacity: 0;
  }
}

.animate-float-up {
  animation: float-up 1s ease-out forwards;
}

@keyframes float-up-fast {
  0% {
    transform: translateY(0) scale(0.5);
    opacity: 0;
  }
  20% {
    transform: translateY(-100px) scale(1.5);
    opacity: 1;
  }
  100% {
    transform: translateY(-800px) scale(1);
    opacity: 0;
  }
}
.animate-float-up-fast {
  animation: float-up-fast 2s ease-out forwards;
}

@keyframes spread-up {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(calc(-20px + 40px * var(--tx, 0.5)), -80px) scale(1.5);
    opacity: 0;
  }
}
.animate-spread-up {
  animation: spread-up 1s ease-out forwards;
  /* Dùng biến --tx ngẫu nhiên nếu có thể, tạm thời dùng fixed CSS fall back */
}

@keyframes coin-fall {
  0% {
    transform: translateY(-50px) rotate(0deg) scale(0.8);
    opacity: 0;
  }
  10% {
    opacity: 1;
    transform: translateY(10vh) rotate(45deg) scale(1.2);
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(110vh) rotate(360deg) scale(0.8);
    opacity: 0;
  }
}
.animate-coin-fall {
  animation-name: coin-fall;
  animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  animation-fill-mode: forwards;
}

@keyframes shake-violent {
  0%,
  100% {
    transform: translate(0, 0) rotate(0);
  }
  10% {
    transform: translate(-10px, -10px) rotate(-2deg);
  }
  20% {
    transform: translate(10px, 10px) rotate(2deg);
  }
  30% {
    transform: translate(-15px, 5px) rotate(-3deg);
  }
  40% {
    transform: translate(15px, -5px) rotate(3deg);
  }
  50% {
    transform: translate(-10px, 15px) rotate(-2deg);
  }
  60% {
    transform: translate(10px, -15px) rotate(2deg);
  }
  70% {
    transform: translate(-5px, -10px) rotate(-1deg);
  }
  80% {
    transform: translate(5px, 10px) rotate(1deg);
  }
  90% {
    transform: translate(-10px, 5px) rotate(-2deg);
  }
}
.animate-shake-violent {
  animation: shake-violent 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite;
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.animate-spin-slow {
  animation: spin-slow 10s linear infinite;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-5px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(5px);
  }
}
.animate-shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake-little {
  0% {
    transform: translate(1px, 1px) rotate(0deg);
  }
  10% {
    transform: translate(-1px, -2px) rotate(-1deg);
  }
  20% {
    transform: translate(-2px, 0px) rotate(1deg);
  }
  30% {
    transform: translate(2px, 2px) rotate(0deg);
  }
  40% {
    transform: translate(1px, -1px) rotate(1deg);
  }
  50% {
    transform: translate(-1px, 2px) rotate(-1deg);
  }
  60% {
    transform: translate(-2px, 1px) rotate(0deg);
  }
  70% {
    transform: translate(2px, 1px) rotate(-1deg);
  }
  80% {
    transform: translate(-1px, -1px) rotate(1deg);
  }
  90% {
    transform: translate(1px, 2px) rotate(0deg);
  }
  100% {
    transform: translate(1px, -2px) rotate(-1deg);
  }
}
.shake-little {
  animation: shake-little 0.5s infinite;
}

.matrix-bg {
  background-image:
    linear-gradient(rgba(251, 191, 36, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(251, 191, 36, 0.05) 1px, transparent 1px);
  background-size: 30px 30px;
  background-position: center center;
  transform: perspective(600px) rotateX(60deg) translateY(-100px) translateZ(-200px);
  animation: matrix-move 10s linear infinite;
}

@keyframes matrix-move {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 0 300px;
  }
}

@keyframes spin-slow-reverse {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}
.animate-spin-slow-reverse {
  animation: spin-slow-reverse 15s linear infinite;
}

@keyframes curtain-sway {
  0%,
  100% {
    transform: rotate(-2deg);
  }
  50% {
    transform: rotate(2deg);
  }
}
.animate-curtain-sway {
  animation: curtain-sway 4s ease-in-out infinite;
}

.write-vertical {
  writing-mode: vertical-rl;
  text-orientation: upright;
}

@keyframes smoke-wave-1 {
  0% {
    transform: translateX(-30%) rotate(-10deg) scaleY(1);
    opacity: 0;
  }
  20% {
    opacity: 0.6;
  }
  50% {
    transform: translateX(10%) rotate(-15deg) scaleY(1.5);
    opacity: 0.8;
  }
  80% {
    opacity: 0.6;
  }
  100% {
    transform: translateX(50%) rotate(-10deg) scaleY(1);
    opacity: 0;
  }
}
.animate-smoke-wave-1 {
  animation: smoke-wave-1 20s ease-in-out infinite;
}

@keyframes smoke-wave-2 {
  0% {
    transform: translateX(30%) rotate(5deg) scaleY(1);
    opacity: 0;
  }
  20% {
    opacity: 0.5;
  }
  50% {
    transform: translateX(-10%) rotate(10deg) scaleY(1.2);
    opacity: 0.7;
  }
  80% {
    opacity: 0.5;
  }
  100% {
    transform: translateX(-50%) rotate(5deg) scaleY(1);
    opacity: 0;
  }
}
.animate-smoke-wave-2 {
  animation: smoke-wave-2 25s ease-in-out infinite;
}

@keyframes smoke-swirl {
  0% {
    transform: scale(1) rotate(0deg) translateY(0);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.3) rotate(180deg) translateY(-50px);
    opacity: 0.6;
  }
  100% {
    transform: scale(1) rotate(360deg) translateY(0);
    opacity: 0.3;
  }
}
.animate-smoke-swirl {
  animation: smoke-swirl 30s linear infinite;
}
@keyframes lightning {
  0% {
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  20% {
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  40% {
    opacity: 0;
  }
  100% {
    opacity: 0;
  }
}
.animate-lightning {
  animation: lightning 0.5s ease-out forwards;
}

@keyframes paper-fly {
  0% {
    transform: translateY(0) rotate(0deg) scale(0.8);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  50% {
    transform: translateY(-50vh) rotate(180deg) scale(1.2);
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-110vh) rotate(360deg) scale(0.8);
    opacity: 0;
  }
}
.animate-paper-fly {
  animation: paper-fly 4s ease-in forwards;
}
</style>
