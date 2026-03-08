<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const stage = ref(0)
const noBtnStyle = ref({ transform: 'translate(0px, 0px)' })

// 0: Chưa mở, 1: Đang mở flap và kéo giấy, 2: Phóng to giấy thành thiệp
const envelopeStatus = ref(0)

const nextStage = () => {
  stage.value = Math.min(stage.value + 1, 2)
}

const moveNoBtn = () => {
  if (stage.value === 1) {
    const x = Math.random() * 200 - 100 // -100px to 100px
    const y = Math.random() * 200 - 100
    noBtnStyle.value = { transform: `translate(${x}px, ${y}px)` }
  }
}

const openEnvelope = () => {
  if (envelopeStatus.value !== 0) return

  envelopeStatus.value = 1
  setTimeout(() => {
    envelopeStatus.value = 2
  }, 1800) // 1.8s sau chạy animation phóng to thiệp
}
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden"
  >
    <!-- Hoa rơi trang trí (background) -->
    <div v-if="envelopeStatus === 2" class="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div
        v-for="i in 15"
        :key="i"
        class="absolute text-accent-coral/30 blossom-fall"
        :style="{
          left: Math.random() * 100 + '%',
          animationDelay: Math.random() * 5 + 's',
          animationDuration: 10 + Math.random() * 10 + 's',
        }"
      >
        🌸
      </div>
    </div>

    <!-- Hero Section -->
    <div
      class="text-center w-full max-w-3xl mx-auto mb-16 relative z-10 transition-all duration-500"
      :class="{ hidden: envelopeStatus === 2 }"
    >
      <div v-if="stage < 2">
        <div class="inline-block mb-6 animate-fade-up">
          <div
            class="bg-accent-coral/10 border border-accent-coral/20 px-4 py-1.5 text-accent-coral font-display text-sm tracking-widest rotate-2"
          >
            08 . 03 . 2026
          </div>
        </div>

        <h1
          class="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-up animate-delay-1 leading-tight"
        >
          Happy <span class="text-accent-coral">Women's</span> Day
        </h1>
      </div>

      <!-- Stage 0: Thơ troll -->
      <div v-if="stage === 0" class="animate-fade-up animate-delay-2">
        <p class="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
          Hôm nay là mùng 8 tháng 3...<br />Chị em phụ nữ đi ra đi vào...<br />
          Đi ra chẳng thấy anh nào...
        </p>
        <button
          @click="nextStage"
          class="border border-accent-coral bg-accent-coral/10 hover:bg-accent-coral/20 text-accent-coral px-8 py-4 font-display font-bold tracking-wide transition-all hover:scale-105 active:scale-95"
        >
          Nhấn để xem câu chốt!
        </button>
      </div>

      <!-- Stage 1: Ép nhận quà -->
      <div v-else-if="stage === 1" class="animate-fade-up">
        <p class="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
          Đi vào lủi thủi lại đi ra... đi vào.<br /><br />
          Thôi vần thơ trớt quớt quá, có muốn nhận phong bao lì xì to bự khum? 🧧💸
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button
            @click="nextStage"
            class="border border-accent-amber bg-accent-amber/10 hover:bg-accent-amber/20 text-accent-amber px-8 py-4 w-48 font-display font-bold transition-all hover:scale-110"
          >
            CÓ CHỨ!!! 😍
          </button>

          <button
            @mouseover="moveNoBtn"
            @click="moveNoBtn"
            :style="noBtnStyle"
            class="border border-border-default bg-bg-surface text-text-secondary px-8 py-4 w-48 font-display transition-all duration-200 absolute sm:relative z-20"
          >
            Chê 💅
          </button>
        </div>
      </div>
    </div>

    <!-- Stage 2: Phong bao lì xì & Lời chúc thật -->
    <div v-if="stage === 2" class="relative z-20 w-full flex flex-col items-center">
      <!-- Animated Envelope -->
      <div
        class="flex flex-col items-center transition-all duration-700 w-full"
        :class="{
          'translate-y-[20vh] opacity-0 pointer-events-none absolute': envelopeStatus === 2,
          'opacity-100 relative': envelopeStatus < 2,
        }"
      >
        <p
          class="text-text-secondary text-lg mb-16"
          :class="{ 'opacity-0': envelopeStatus === 1, 'transition-opacity duration-300': true }"
        >
          Đồng ý nhận là tốt! Của cậu đây 👇
        </p>

        <div
          @click="openEnvelope"
          class="w-72 h-48 relative cursor-pointer group mx-auto perspective-1000"
          :class="{ 'pointer-events-none': envelopeStatus === 1 }"
        >
          <!-- Phong bì mặt sau -->
          <div
            class="absolute inset-0 bg-accent-coral shadow-xl border-x-2 border-b-2 border-accent-coral/50 z-10 rounded-b-sm"
          ></div>

          <!-- Giấy thư (thò ra khi mở) -->
          <div
            class="absolute bottom-2 left-4 right-4 bg-bg-surface border border-border-default transition-all ease-in-out z-20 flex flex-col items-center justify-center shadow-lg"
            :class="[
              envelopeStatus === 0
                ? 'h-40 translate-y-0 opacity-100 duration-500'
                : 'h-[200px] -translate-y-[120px] opacity-100 duration-[1.5s] delay-300',
            ]"
          >
            <p
              v-if="envelopeStatus === 1"
              class="font-display font-bold text-accent-coral text-xl animate-pulse"
            >
              Đang nạp quà...
            </p>
          </div>

          <!-- Mặt trước phong bì -->
          <div
            class="absolute inset-0 w-full h-full z-30 pointer-events-none overflow-hidden rounded-b-sm"
          >
            <div
              class="absolute top-0 left-0 w-0 h-0 border-t-[96px] border-t-transparent border-l-[144px] border-l-[#e85333] border-b-[96px] border-b-transparent"
            ></div>
            <div
              class="absolute top-0 right-0 w-0 h-0 border-t-[96px] border-t-transparent border-r-[144px] border-r-[#eb5a3b] border-b-[96px] border-b-transparent"
            ></div>
            <div
              class="absolute bottom-0 left-0 w-full h-0 border-b-[96px] border-b-[#fc6a4c] border-l-[144px] border-l-transparent border-r-[144px] border-r-transparent shadow-inner"
            ></div>
          </div>

          <!-- Nắp phong bì -->
          <div
            class="absolute top-0 left-0 w-full h-0 border-t-[100px] border-t-accent-coral border-l-[144px] border-l-transparent border-r-[144px] border-r-transparent z-40 origin-top transition-transform duration-700 pointer-events-none"
            :style="{
              transform: envelopeStatus === 1 ? 'rotateX(180deg)' : 'rotateX(0deg)',
              zIndex: envelopeStatus === 1 ? '15' : '40',
              borderTopColor: envelopeStatus === 1 ? '#e0593b' : 'var(--color-accent-coral)',
            }"
          ></div>

          <!-- Chữ MỞ -->
          <div
            class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-accent-amber border-4 border-[#ffcd66] flex items-center justify-center text-bg-deep font-display font-bold shadow-md z-50 transition-all duration-300 group-hover:scale-110"
            :class="{ 'opacity-0 scale-150': envelopeStatus === 1 }"
          >
            MỞ
          </div>
        </div>

        <p
          class="text-text-dim text-sm mt-12 font-display animate-pulse"
          :class="{ 'opacity-0': envelopeStatus === 1 }"
        >
          Nhấn vào phong bao để khui quà
        </p>
      </div>

      <!-- Bao Lì Xì Đã Mở (Lá Thư Phóng To) -->
      <div v-show="envelopeStatus === 2" class="max-w-2xl w-full mx-auto card-pop-out">
        <h2
          class="font-display text-4xl md:text-5xl font-bold text-accent-amber mb-8 leading-tight text-center relative z-20"
          style="text-shadow: 0 4px 20px rgba(255, 184, 48, 0.4)"
        >
          Tadaaa! 🎉 Ting tinh! <br />
          <span class="text-text-primary text-2xl mt-4 block">Tài khoản +999.999.999 💖</span>
        </h2>

        <div
          class="border border-border-default bg-bg-surface p-8 sm:p-12 relative overflow-hidden text-left mb-8 group hover:border-accent-coral transition-colors duration-500 shadow-2xl shadow-accent-coral/10"
        >
          <!-- Trang trí trong góc card -->
          <div
            class="absolute top-0 right-0 w-32 h-32 bg-accent-coral/5 rounded-bl-full pointer-events-none"
          ></div>
          <div
            class="absolute bottom-0 left-0 w-24 h-24 bg-accent-amber/5 rounded-tr-full pointer-events-none"
          ></div>
          <span
            class="absolute top-6 right-8 text-4xl opacity-30 select-none pointer-events-none rotate-12 group-hover:rotate-45 transition-transform duration-700"
            >🌸</span
          >
          <span
            class="absolute bottom-8 right-12 text-3xl opacity-30 select-none pointer-events-none -rotate-12 group-hover:-rotate-45 transition-transform duration-700"
            >🌷</span
          >

          <span
            class="text-accent-coral font-display text-xl tracking-widest mb-6 block relative z-10"
            >// LỜI NHẮN TỪ VŨ TRỤ</span
          >

          <p
            class="text-text-primary text-xl md:text-2xl mb-8 leading-relaxed relative z-10 font-bold tracking-wide"
          >
            Thừa nhận đi, nãy ấn nút "Chê" mệt lắm đúng khum? Món quà lớn nhất xin dành tặng tất cả
            các chị em phụ nữ!
          </p>
          <div
            class="w-16 h-1.5 bg-accent-coral mb-8 group-hover:bg-accent-amber transition-colors duration-500 rounded-full"
          ></div>

          <p
            class="text-text-primary text-lg md:text-xl leading-relaxed mb-6 font-medium"
            style="text-shadow: 0 2px 10px rgba(255, 107, 74, 0.1)"
          >
            Nhân dịp 8/3, thương chúc phái đẹp luôn giữ được nụ cười rạng rỡ trên môi, tự do làm
            những điều mình thích và toả sáng theo cách riêng của mình.
          </p>
          <p
            class="text-accent-amber text-xl md:text-2xl leading-relaxed font-bold italic mt-4"
            style="text-shadow: 0 2px 15px rgba(255, 184, 48, 0.2)"
          >
            Chúc các bà, các mẹ, các chị và các bạn nữ một ngày lễ thật ấm áp, ngập tràn niềm vui và
            nhận được thật nhiều yêu thương! 💐✨
          </p>

          <!-- Watermark -->
          <div
            class="absolute bottom-0 right-0 text-[10rem] font-display font-black text-bg-elevated/40 select-none pointer-events-none -mr-8 -mb-16 group-hover:text-accent-coral/5 transition-colors duration-700"
          >
            8/3
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div
      class="relative z-30 transition-all duration-1000"
      :class="{
        'opacity-100 translate-y-0 mt-8 delay-500': envelopeStatus === 2,
        'opacity-100 mt-12': envelopeStatus < 2,
        'opacity-0 translate-y-10': envelopeStatus === 1 && stage === 2,
      }"
    >
      <RouterLink
        to="/"
        class="inline-flex items-center gap-3 border border-border-default bg-bg-surface px-8 py-3.5 text-sm font-medium tracking-wide text-text-secondary transition-all hover:border-accent-sky hover:text-text-primary hover:bg-bg-elevated group backdrop-blur-sm"
      >
        <span class="text-accent-sky group-hover:-translate-x-1 transition-transform">&larr;</span>
        Về trang chủ
      </RouterLink>
    </div>
  </div>
</template>
<style scoped>
.perspective-1000 {
  perspective: 1000px;
}

/* Hiệu ứng tờ giấy bung lớn ra thành màn hình full card */
.card-pop-out {
  animation: cardPop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  transform-origin: center calc(100% + 150px);
}

@keyframes cardPop {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(200px);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Hiệu ứng hoa rơi rụng lả tả trang trí nền */
.blossom-fall {
  font-size: 24px;
  animation-name: fallAndSway;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  top: -10%;
}

@keyframes fallAndSway {
  0% {
    transform: translateY(0vh) rotate(0deg) translateX(0px);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(110vh) rotate(360deg) translateX(100px);
    opacity: 0;
  }
}
</style>
