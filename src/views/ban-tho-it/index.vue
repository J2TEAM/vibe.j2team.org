<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const isPraying = ref(false)
const incenses = ref(0)
const karma = ref(0)
const selectedOffering = ref('')
const currentPrayer = ref('')
const xinKeoResult = ref<string | null>(null)
const isJackpot = ref(false)
const isJackpotShaking = ref(false)
const flyingKarmas = ref<{id: number, x: number, y: number, text: string, colorClass: string, delay: number}[]>([])
let karmaId = 0

const prayers = [
  "Nam mô rẽ nhánh Git, xin bề trên độ cho con merge code không bị conflict.",
  "Con lạy chín phương Trời, mười phương Chư Phật, xin server đừng sập lúc 2h sáng.",
  "Nam mô A Di Đà Phật, cầu cho release sprint này không sinh ra bug đẻ trứng.",
  "Đại từ đại bi, xin Ngài phù hộ cho con khách hàng hiền hòa, không đổi requirement phút 89.",
  "Cầu cho thư mục node_modules dung lượng giảm một nửa, npm install một phát ăn ngay.",
  "Nam mô Coder Tôn Phật, cầu cho tối nay con được ngủ trước 12h đêm.",
  "Xin bề trên độ cho anh em QA hôm nay mắt mờ tay run, test không ra bug nào.",
  "Cầu cho Docker build mượt mà, pipeline CI/CD xanh ngắt một màu.",
  "Nam mô AWS, xin Ngài đừng trừ tiền oan thẻ Visa của con tháng này.",
  "Con lạy thần linh, xin độ cho cái RegExp con vừa viết chạy đúng mọi case."
]

const pray = () => {
  if (incenses.value === 0) {
    alert("Chưa thắp hương mà đòi khấn? Xin hãy thắp nén nhang!")
    return
  }
  isPraying.value = true
  currentPrayer.value = ''
  xinKeoResult.value = null
  isJackpot.value = false
  isJackpotShaking.value = false
  
  // Hiệu ứng gõ chữ
  const targetText = prayers[Math.floor(Math.random() * prayers.length)] || ""
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
  if (incenses.value < 3) incenses.value++
}

const hitWoodenBlock = (e: MouseEvent) => {
  karma.value++
  const id = karmaId++
  flyingKarmas.value.push({ id, x: e.clientX, y: e.clientY, text: '+1 Công đức', colorClass: 'text-accent-amber', delay: 0 })
  setTimeout(() => {
    flyingKarmas.value = flyingKarmas.value.filter(k => k.id !== id)
  }, 1000)
}

const triggerJackpotEffect = () => {
  isJackpotShaking.value = true
  
  // Tạo cơn mưa chữ +100 Công đức bay từ dưới lên
  for (let i = 0; i < 30; i++) {
    const id = karmaId++
    const randomX = Math.random() * window.innerWidth
    const randomY = window.innerHeight + Math.random() * 200 // Bắt đầu từ dưới màn hình
    const randomDelay = Math.random() * 1.5 // Delay ngẫu nhiên để tạo hiệu ứng liên tục
    
    // Đẩy vào mảng sau một khoảng delay ngẫu nhiên
    setTimeout(() => {
      flyingKarmas.value.push({ 
        id, 
        x: randomX, 
        y: randomY, 
        text: '+100 CÔNG ĐỨC 🌟', 
        colorClass: 'text-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] text-2xl sm:text-3xl font-black z-[100]',
        delay: 0
      })
      
      // Xóa sau khi bay xong (animation float-up-fast mất 2s)
      setTimeout(() => {
        flyingKarmas.value = flyingKarmas.value.filter(k => k.id !== id)
      }, 2000)
    }, randomDelay * 1000)
  }

  // Tắt rung sau 2.5s
  setTimeout(() => {
    isJackpotShaking.value = false
  }, 2500)
}

const xinKeo = () => {
  if (!currentPrayer.value && incenses.value === 0) {
    alert("Phải thắp hương khấn vái trước khi xin keo (Deploy) chứ!")
    return
  }
  isJackpot.value = false
  isJackpotShaking.value = false
  
  // Tỉ lệ nổ hũ (Jackpot) là 10%
  const randomVal = Math.random()
  if (randomVal < 0.1) {
    isJackpot.value = true
    xinKeoResult.value = "🌟 ĐẠI CÁT ĐẠI LỢI: THẦN LINH ĐỘ FULL STACK! PUSH LÊN PRODUCTION NGAY VÀ LUÔN! 🌟"
    // Cộng thêm 100 công đức và kích hoạt hiệu ứng
    karma.value += 100
    triggerJackpotEffect()
  } else {
    // 90% còn lại chia cho 3 kết quả thường
    const result = Math.floor(Math.random() * 3)
    if (result === 0) xinKeoResult.value = "Nhất Âm Nhất Dương: Thần linh đồng ý - Được phép Deploy!"
    else if (result === 1) xinKeoResult.value = "Hai Âm: Thần linh quay lưng - Code còn Bug, đừng cố!"
    else xinKeoResult.value = "Hai Dương: Thần linh đang cười - Đi fix bug rồi xin lại!"
  }
}

const offerings = [
  { id: 'ram', name: 'RAM Cháy', icon: '💾', desc: 'RAM 16GB cháy khét lẹt. Cúng để cầu đừng tràn bộ nhớ rò rỉ.', style: { top: '10px', left: '15%', zIndex: 10, transform: 'rotate(-15deg)' } },
  { id: 'keyboard', name: 'Phím Liệt', icon: '⌨️', desc: 'Bàn phím cơ liệt nút Space. Cúng để tránh gõ nhầm lệnh rm -rf.', style: { top: '-15px', left: '40%', zIndex: 12, transform: 'rotate(5deg)' } },
  { id: 'redbull', name: 'Bò Húc', icon: '🥫', desc: 'Nước tăng lực đã bay hơi. Cúng để xin thêm nội tại cày đêm OT.', style: { top: '5px', left: '70%', zIndex: 11, transform: 'rotate(10deg)' } },
  { id: 'router', name: 'Router Đứt', icon: '📡', desc: 'Router mạng gãy ăng ten. Cúng xin mạng thông suốt lúc push code.', style: { top: '15px', left: '45%', zIndex: 15, transform: 'rotate(-5deg)' } },
  { id: 'mouse', name: 'Chuột Lỗi', icon: '🖱️', desc: 'Chuột dính lỗi double-click. Cúng để không lỡ tay merge nhầm PR.', style: { top: '25px', left: '25%', zIndex: 14, transform: 'rotate(20deg)' } },
  { id: 'coffee', name: 'Cà Phê Đen', icon: '☕', desc: 'Cà phê đặc sánh màu bug. Cúng để xin sức mạnh thức trắng đêm.', style: { top: '-5px', left: '55%', zIndex: 13, transform: 'rotate(-10deg)' } },
  { id: 'hdd', name: 'Ổ Cứng Bad', icon: '💿', desc: 'Ổ cứng kêu lạch cạch. Cúng cầu cho Database không bị corrupt.', style: { top: '20px', left: '5%', zIndex: 16, transform: 'rotate(30deg)' } },
  { id: 'usb', name: 'USB Boot', icon: '💽', desc: 'USB cài Win cứu hộ. Vật phẩm phòng thân khi màn hình xanh hiện lên.', style: { top: '25px', left: '85%', zIndex: 12, transform: 'rotate(-25deg)' } },
]

const selectOffering = (id: string) => {
  selectedOffering.value = id
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden selection:bg-accent-coral/30" :class="{ 'animate-shake-violent': isJackpotShaking }">
    
    <!-- Hiệu ứng ma mị ở Background -->
    <div class="absolute inset-0 z-0 opacity-20 pointer-events-none matrix-bg"></div>
    <div v-if="isPraying" class="absolute inset-0 bg-red-900/10 mix-blend-overlay z-0 animate-pulse pointer-events-none"></div>
    
    <!-- Hiệu ứng Nổ Hũ (Jackpot Background) -->
    <div v-if="isJackpot" class="absolute inset-0 z-0 bg-yellow-500/20 mix-blend-color-dodge animate-pulse pointer-events-none"></div>
    <div v-if="isJackpot" class="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <div class="w-[200vw] h-[200vh] bg-[conic-gradient(from_0deg,transparent_0_15deg,rgba(251,191,36,0.3)_15deg_30deg,transparent_30deg_45deg,rgba(251,191,36,0.3)_45deg_60deg,transparent_60deg_75deg,rgba(251,191,36,0.3)_75deg_90deg,transparent_90deg_105deg,rgba(251,191,36,0.3)_105deg_120deg,transparent_120deg_135deg,rgba(251,191,36,0.3)_135deg_150deg,transparent_150deg_165deg,rgba(251,191,36,0.3)_165deg_180deg,transparent_180deg_195deg,rgba(251,191,36,0.3)_195deg_210deg,transparent_210deg_225deg,rgba(251,191,36,0.3)_225deg_240deg,transparent_240deg_255deg,rgba(251,191,36,0.3)_255deg_270deg,transparent_270deg_285deg,rgba(251,191,36,0.3)_285deg_300deg,transparent_300deg_315deg,rgba(251,191,36,0.3)_315deg_330deg,transparent_330deg_345deg,rgba(251,191,36,0.3)_345deg_360deg)] animate-spin-slow-reverse"></div>
    </div>

    <!-- Cột điểm Công Đức -->
    <div class="absolute top-4 right-4 bg-bg-surface/80 backdrop-blur border border-accent-amber/50 px-4 py-2 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.2)] z-20 flex items-center gap-2 transition-transform active:scale-95" :class="{ 'scale-110 shadow-[0_0_30px_rgba(251,191,36,0.8)] border-yellow-400': isJackpotShaking }">
      <span class="text-2xl">🙏</span>
      <span class="text-accent-amber font-bold font-display transition-all duration-300" :class="{ 'text-yellow-300 text-xl': isJackpotShaking }">Công đức: {{ karma }}</span>
    </div>

    <!-- Animation bay chữ Công Đức -->
    <div 
      v-for="k in flyingKarmas" 
      :key="k.id"
      class="fixed font-bold pointer-events-none"
      :class="[k.colorClass, k.text.includes('100') ? 'animate-float-up-fast' : 'animate-float-up z-50 text-lg']"
      :style="{ left: k.x + 'px', top: (k.y - 20) + 'px' }"
    >
      {{ k.text }}
    </div>

    <h1 class="font-display text-4xl sm:text-6xl font-bold text-accent-amber mb-2 text-center drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] z-10" :class="{ 'animate-shake text-red-500': isPraying }">
      BÀN THỜ IT
    </h1>
    <p class="text-text-secondary text-sm mb-8 text-center italic max-w-md z-10">
      "Độ Code, độ Server, không độ Bug."
    </p>

    <!-- Khu vực Bàn thờ (Có cột, rèm, mái) -->
    <div class="relative w-full max-w-2xl flex flex-col items-center mt-10 z-10" :class="{ 'shake-little border-red-500/50': isPraying }">
      
      <!-- Cấu trúc Cột và Rèm -->
      <div class="absolute inset-0 pointer-events-none -m-4 sm:-m-8 z-20">
        <!-- Mái che bàn thờ -->
        <div class="absolute top-0 left-0 w-full h-16 sm:h-24 bg-gradient-to-b from-red-900 to-red-800 border-b-4 border-yellow-600 rounded-t-3xl shadow-xl flex items-center justify-center overflow-hidden">
          <div class="absolute w-full h-full opacity-30 flex justify-between px-4">
             <span class="text-4xl sm:text-6xl transform scale-x-[-1]">🐉</span>
             <span class="text-4xl sm:text-6xl">🐉</span>
          </div>
          <!-- Hoành phi -->
          <div class="bg-black/60 border-2 border-yellow-500 px-6 py-1 z-10 shadow-[0_0_10px_rgba(251,191,36,0.5)]">
            <span class="text-yellow-500 font-serif font-bold text-xl sm:text-2xl tracking-widest uppercase">Tâm Linh Coder</span>
          </div>
        </div>

        <!-- Rèm đỏ thả xuống -->
        <div class="absolute top-16 sm:top-24 left-0 w-full flex justify-between px-4 opacity-80">
          <div class="w-16 sm:w-24 h-24 sm:h-32 bg-red-800 rounded-b-full shadow-lg border-b-2 border-yellow-500 origin-top animate-curtain-sway" style="animation-delay: 0s;"></div>
          <div class="w-24 sm:w-32 h-16 sm:h-20 bg-red-800 rounded-b-full shadow-lg border-b-2 border-yellow-500 origin-top animate-curtain-sway" style="animation-delay: 0.5s;"></div>
          <div class="w-16 sm:w-24 h-24 sm:h-32 bg-red-800 rounded-b-full shadow-lg border-b-2 border-yellow-500 origin-top animate-curtain-sway" style="animation-delay: 1s;"></div>
        </div>

        <!-- Hai cột trụ chạm rồng -->
        <div class="absolute top-16 sm:top-24 bottom-0 left-0 w-8 sm:w-12 bg-gradient-to-r from-red-950 via-red-800 to-red-900 border-x-2 border-yellow-700 rounded-t shadow-2xl flex flex-col items-center py-4">
          <div class="text-yellow-500/50 text-xl sm:text-2xl write-vertical font-serif tracking-widest h-full flex items-center justify-center font-bold">CODE MƯỢT MÀ</div>
        </div>
        <div class="absolute top-16 sm:top-24 bottom-0 right-0 w-8 sm:w-12 bg-gradient-to-l from-red-950 via-red-800 to-red-900 border-x-2 border-yellow-700 rounded-t shadow-2xl flex flex-col items-center py-4">
          <div class="text-yellow-500/50 text-xl sm:text-2xl write-vertical font-serif tracking-widest h-full flex items-center justify-center font-bold">SERVER VỮNG VÀNG</div>
        </div>
      </div>

      <!-- Mặt bàn thờ (Main content) -->
      <div class="bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-md border-2 border-yellow-700/50 p-6 sm:p-10 pt-24 sm:pt-32 shadow-[0_10px_40px_rgba(251,191,36,0.15)] w-[90%] mx-auto flex flex-col items-center relative z-10">
        
        <!-- Di ảnh: Màn hình xanh (BSOD) -->
      <div class="w-48 h-32 bg-blue-700 border-8 border-gray-800 rounded mb-8 shadow-inner flex flex-col items-center justify-center p-2 relative overflow-hidden group">
        <div class="text-white font-mono text-[8px] sm:text-[10px] leading-tight opacity-90 text-center w-full">
          <p>A problem has been detected</p>
          <p>and Windows has been shut down</p>
          <p class="mt-2 text-xl font-bold">:(</p>
          <p class="mt-2 text-yellow-300 font-bold">ERR_CODE_BUG</p>
        </div>
        <!-- Vòng hào quang -->
        <div class="absolute inset-0 bg-yellow-400/20 rounded-full scale-[2] blur-xl group-hover:bg-yellow-400/40 transition-all duration-1000 animate-spin-slow pointer-events-none"></div>
      </div>
      
      <!-- Bát hương & Mõ -->
      <div class="flex items-end justify-center gap-10 mb-8 w-full">
        
        <!-- Không gian trống để cân bằng -->
        <div class="w-16"></div>

        <!-- Bát hương -->
        <div class="relative w-32 flex flex-col items-center">
          <div class="w-24 h-16 bg-gradient-to-b from-yellow-600 to-yellow-900 rounded-b-3xl border-t-4 border-yellow-500 shadow-inner flex items-center justify-center z-10 relative overflow-hidden">
             <span class="text-2xl drop-shadow-md">🐉</span>
          </div>
          <!-- Hương -->
          <div class="absolute bottom-12 flex gap-2 z-0">
            <div v-for="i in incenses" :key="i" class="w-1.5 h-24 bg-red-900 rounded-t-full relative animate-fade-up">
              <!-- Lửa -->
              <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(255,165,0,1)]"></div>
              <!-- Khói -->
              <div class="absolute -top-16 left-1/2 -translate-x-1/2 w-8 h-20 bg-white/10 blur-md rounded-full origin-bottom" style="animation: sway 4s ease-in-out infinite alternate;"></div>
            </div>
          </div>
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
        <div class="absolute bottom-0 w-full h-16 bg-gradient-to-b from-gray-300 to-gray-500 rounded-[50%] shadow-[0_10px_30px_rgba(0,0,0,0.8)] border-b-[4px] border-gray-600 z-0 flex items-center justify-center transition-all duration-300" :class="{ 'from-amber-100 to-amber-300 border-amber-500 shadow-[0_10px_30px_rgba(251,191,36,0.5)]': selectedOffering }">
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
              :class="selectedOffering === item.id ? '-translate-y-4 drop-shadow-[0_0_20px_rgba(251,191,36,1)] scale-150 z-50' : 'drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]'"
            >
              <span class="text-4xl sm:text-5xl filter" :class="{ 'animate-bounce': selectedOffering === item.id }">{{ item.icon }}</span>
            </div>
            
            <!-- Tooltip khi di chuột -->
            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-3 bg-black/95 backdrop-blur-sm border border-accent-amber/50 rounded-lg text-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[60] pointer-events-none shadow-[0_10px_20px_rgba(0,0,0,0.8)] scale-95 group-hover:scale-100">
              <p class="text-accent-amber font-bold text-[13px] mb-1">{{ item.name }}</p>
              <p class="text-gray-300 text-[11px] leading-relaxed">{{ item.desc }}</p>
              <!-- Mũi tên chỉ xuống của Tooltip -->
              <div class="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-black/95"></div>
              <!-- Viền mũi tên -->
              <div class="absolute top-full left-1/2 -translate-x-1/2 border-[7px] border-transparent border-t-accent-amber/50 -mt-[1px] z-[-1]"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Kết quả Khấn / Xin keo -->
      <div class="min-h-[120px] w-full bg-black/60 rounded-lg border border-accent-amber/30 p-5 mb-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <!-- Text khấn -->
        <p v-if="currentPrayer" class="text-accent-amber text-lg font-serif italic leading-relaxed z-10">
          "{{ currentPrayer }}"
        </p>
        <p v-else-if="!currentPrayer && !xinKeoResult" class="text-text-dim text-sm italic z-10">
          Thành tâm khấn vái, chớ có đùa cợt...
        </p>
        
        <!-- Kết quả xin keo -->
        <div v-if="xinKeoResult" class="mt-4 pt-4 border-t border-accent-amber/20 w-full animate-fade-up z-10">
          <p class="text-sm text-text-secondary mb-1 uppercase tracking-widest text-[10px]">Quẻ Xin Deploy:</p>
          <p class="font-bold text-lg" :class="xinKeoResult.includes('Được') ? 'text-green-400' : (xinKeoResult.includes('từ chối') ? 'text-red-400' : 'text-yellow-400')">
            {{ xinKeoResult }}
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
        <button 
          @click="lightIncense" 
          class="bg-bg-elevated border border-accent-coral/50 text-accent-coral py-3 px-4 rounded-lg font-bold hover:bg-accent-coral hover:text-bg-deep transition-all duration-300 disabled:opacity-30 disabled:hover:bg-bg-elevated disabled:hover:text-accent-coral"
          :disabled="incenses >= 3"
        >
          🔥 Thắp Hương
        </button>
        <button 
          @click="pray" 
          class="bg-accent-amber text-bg-deep py-3 px-4 rounded-lg font-bold hover:bg-yellow-400 transition-all duration-300 shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] active:scale-95"
        >
          🙏 Khấn Cáo
        </button>
        <button 
          @click="xinKeo" 
          class="col-span-2 sm:col-span-1 bg-green-700/80 text-white border border-green-500 py-3 px-4 rounded-lg font-bold hover:bg-green-600 transition-all duration-300 active:scale-95 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
        >
          ☯️ Xin Keo Deploy
        </button>
      </div>
      </div> <!-- Đóng div mặt bàn thờ -->
    </div> <!-- Đóng div toàn bộ bàn thờ -->

    <!-- Chân bàn -->
    <div class="w-full max-w-2xl h-8 bg-gradient-to-b from-yellow-900 to-amber-950 rounded-b-xl shadow-2xl mb-8 relative z-0 -mt-2 border-b-4 border-black/50"></div>

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
  0% { transform: translateX(-8px) rotate(-15deg); opacity: 0.2; }
  100% { transform: translateX(8px) rotate(15deg); opacity: 0.8; }
}

@keyframes float-up {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-80px) scale(1.5); opacity: 0; }
}

.animate-float-up {
  animation: float-up 1s ease-out forwards;
}

@keyframes float-up-fast {
  0% { transform: translateY(0) scale(0.5); opacity: 0; }
  20% { transform: translateY(-100px) scale(1.5); opacity: 1; }
  100% { transform: translateY(-800px) scale(1); opacity: 0; }
}
.animate-float-up-fast {
  animation: float-up-fast 2s ease-out forwards;
}

@keyframes shake-violent {
  0%, 100% { transform: translate(0, 0) rotate(0); }
  10% { transform: translate(-10px, -10px) rotate(-2deg); }
  20% { transform: translate(10px, 10px) rotate(2deg); }
  30% { transform: translate(-15px, 5px) rotate(-3deg); }
  40% { transform: translate(15px, -5px) rotate(3deg); }
  50% { transform: translate(-10px, 15px) rotate(-2deg); }
  60% { transform: translate(10px, -15px) rotate(2deg); }
  70% { transform: translate(-5px, -10px) rotate(-1deg); }
  80% { transform: translate(5px, 10px) rotate(1deg); }
  90% { transform: translate(-10px, 5px) rotate(-2deg); }
}
.animate-shake-violent {
  animation: shake-violent 0.3s cubic-bezier(.36,.07,.19,.97) infinite;
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin-slow {
  animation: spin-slow 10s linear infinite;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}
.animate-shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake-little {
  0% { transform: translate(1px, 1px) rotate(0deg); }
  10% { transform: translate(-1px, -2px) rotate(-1deg); }
  20% { transform: translate(-2px, 0px) rotate(1deg); }
  30% { transform: translate(2px, 2px) rotate(0deg); }
  40% { transform: translate(1px, -1px) rotate(1deg); }
  50% { transform: translate(-1px, 2px) rotate(-1deg); }
  60% { transform: translate(-2px, 1px) rotate(0deg); }
  70% { transform: translate(2px, 1px) rotate(-1deg); }
  80% { transform: translate(-1px, -1px) rotate(1deg); }
  90% { transform: translate(1px, 2px) rotate(0deg); }
  100% { transform: translate(1px, -2px) rotate(-1deg); }
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
  0% { background-position: 0 0; }
  100% { background-position: 0 300px; }
}

@keyframes spin-slow-reverse {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}
.animate-spin-slow-reverse {
  animation: spin-slow-reverse 15s linear infinite;
}

@keyframes curtain-sway {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}
.animate-curtain-sway {
  animation: curtain-sway 4s ease-in-out infinite;
}

.write-vertical {
  writing-mode: vertical-rl;
  text-orientation: upright;
}
</style>