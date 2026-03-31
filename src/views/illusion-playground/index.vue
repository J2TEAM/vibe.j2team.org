<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { onKeyStroke, useScrollLock } from '@vueuse/core'

const illusions = [
  {
    id: 1,
    title: 'Cái Nĩa Ma Quỷ',
    subtitle: 'IMPOSSIBLE FORK',
    icon: 'lucide:split',
    accentText: 'text-accent-coral',
    accentBorder: 'border-accent-coral',
    accentSoft: 'bg-accent-coral/12',
    badgeClass: 'bg-accent-coral/16 text-accent-coral border-accent-coral/60',
    cardShadow: 'hover:shadow-[6px_6px_0_0_rgba(255,107,74,0.28)]',
    controlClass:
      'border-accent-coral text-accent-coral hover:bg-accent-coral hover:text-bg-deep focus-visible:outline-accent-coral',
    instruction: '> SOI PHẦN GIAO NỐI Ở ĐẦU NĨA',
    teaser: 'Não của bạn phải chọn giữa khối hộp và ống trụ trong cùng một hình.',
  },
  {
    id: 2,
    title: 'Điểm Chuyển Động',
    subtitle: 'MOTION DOTS',
    icon: 'lucide:loader',
    accentText: 'text-accent-amber',
    accentBorder: 'border-accent-amber',
    accentSoft: 'bg-accent-amber/12',
    badgeClass: 'bg-accent-amber/16 text-accent-amber border-accent-amber/60',
    cardShadow: 'hover:shadow-[6px_6px_0_0_rgba(255,184,48,0.28)]',
    controlClass:
      'border-accent-amber text-accent-amber hover:bg-accent-amber hover:text-bg-deep focus-visible:outline-accent-amber',
    instruction: '> LƯỚT MẮT QUANH CÁC VÒNG TRÒN',
    teaser: 'Các vòng tròn đứng yên nhưng thị giác ngoại biên khiến chúng như đang quay.',
  },
  {
    id: 3,
    title: 'Ảo Giác Kích Thước',
    subtitle: 'EBBINGHAUS',
    icon: 'lucide:scaling',
    accentText: 'text-accent-sky',
    accentBorder: 'border-accent-sky',
    accentSoft: 'bg-accent-sky/12',
    badgeClass: 'bg-accent-sky/16 text-accent-sky border-accent-sky/60',
    cardShadow: 'hover:shadow-[6px_6px_0_0_rgba(56,189,248,0.28)]',
    controlClass:
      'border-accent-sky text-accent-sky hover:bg-accent-sky hover:text-bg-deep focus-visible:outline-accent-sky',
    instruction: '> SO KÍCH THƯỚC HAI TÂM MÀU CAM',
    teaser: 'Vòng tròn xung quanh làm thay đổi cảm giác lớn nhỏ dù tâm thật sự bằng nhau.',
  },
  {
    id: 4,
    title: 'Tường Cà Phê',
    subtitle: 'CAFE WALL',
    icon: 'lucide:brick-wall',
    accentText: 'text-accent-coral',
    accentBorder: 'border-accent-coral',
    accentSoft: 'bg-accent-coral/12',
    badgeClass: 'bg-accent-coral/16 text-accent-coral border-accent-coral/60',
    cardShadow: 'hover:shadow-[6px_6px_0_0_rgba(255,107,74,0.28)]',
    controlClass:
      'border-accent-coral text-accent-coral hover:bg-accent-coral hover:text-bg-deep focus-visible:outline-accent-coral',
    instruction: '> CANH CÁC HÀNG GẠCH VỚI MẶT PHẲNG',
    teaser: 'Những đường ngang hoàn toàn song song nhưng các viên gạch khiến chúng trông lệch đi.',
  },
  {
    id: 5,
    title: 'Lưới Ma Hermann',
    subtitle: 'HERMANN GRID',
    icon: 'lucide:grid-3x3',
    accentText: 'text-text-primary',
    accentBorder: 'border-text-primary',
    accentSoft: 'bg-text-primary/8',
    badgeClass: 'bg-text-primary/14 text-text-primary border-text-primary/55',
    cardShadow: 'hover:shadow-[6px_6px_0_0_rgba(240,237,230,0.18)]',
    controlClass:
      'border-text-primary text-text-primary hover:bg-text-primary hover:text-bg-deep focus-visible:outline-text-primary',
    instruction: '> NHÌN VÀO MỘT GIAO ĐIỂM BẤT KỲ',
    teaser: 'Những chấm tối xuất hiện ở vùng ngoại biên rồi biến mất khi bạn nhìn thẳng vào chúng.',
  },
  {
    id: 6,
    title: 'Ảo Giác Ouchi',
    subtitle: 'HIDDEN MOTION',
    icon: 'lucide:scan-eye',
    accentText: 'text-accent-amber',
    accentBorder: 'border-accent-amber',
    accentSoft: 'bg-accent-amber/12',
    badgeClass: 'bg-accent-amber/16 text-accent-amber border-accent-amber/60',
    cardShadow: 'hover:shadow-[6px_6px_0_0_rgba(255,184,48,0.28)]',
    controlClass:
      'border-accent-amber text-accent-amber hover:bg-accent-amber hover:text-bg-deep focus-visible:outline-accent-amber',
    instruction: '> CUỘN NHẸ HOẶC BẬT RUNG TỰ ĐỘNG',
    teaser: 'Khối tròn ở giữa như đang tách khỏi nền khi mắt hoặc hình chuyển động nhẹ.',
  },
  {
    id: 7,
    title: 'Đường Ray Ponzo',
    subtitle: 'PONZO PERSPECTIVE',
    icon: 'lucide:train-track',
    accentText: 'text-accent-sky',
    accentBorder: 'border-accent-sky',
    accentSoft: 'bg-accent-sky/12',
    badgeClass: 'bg-accent-sky/16 text-accent-sky border-accent-sky/60',
    cardShadow: 'hover:shadow-[6px_6px_0_0_rgba(56,189,248,0.28)]',
    controlClass:
      'border-accent-sky text-accent-sky hover:bg-accent-sky hover:text-bg-deep focus-visible:outline-accent-sky',
    instruction: '> SO HAI THANH NGANG THEO PHỐI CẢNH',
    teaser: 'Khung phối cảnh khiến thanh phía trên trông dài hơn dù hai thanh bằng nhau.',
  },
  {
    id: 8,
    title: 'Biến Dạng Xoắn Ốc',
    subtitle: 'FRASER SPIRAL',
    icon: 'lucide:loader-pinwheel',
    accentText: 'text-accent-coral',
    accentBorder: 'border-accent-coral',
    accentSoft: 'bg-accent-coral/12',
    badgeClass: 'bg-accent-coral/16 text-accent-coral border-accent-coral/60',
    cardShadow: 'hover:shadow-[6px_6px_0_0_rgba(255,107,74,0.28)]',
    controlClass:
      'border-accent-coral text-accent-coral hover:bg-accent-coral hover:text-bg-deep focus-visible:outline-accent-coral',
    instruction: '> TÌM XEM ĐÓ LÀ XOẮN ỐC HAY VÒNG TRÒN',
    teaser: 'Các họa tiết góc cạnh khiến nhiều vòng tròn đồng tâm nhìn như một cuộn xoắn duy nhất.',
  },
  {
    id: 9,
    title: 'Hội Tụ Tập Trung',
    subtitle: 'TROXLER FADE',
    icon: 'lucide:focus',
    accentText: 'text-accent-amber',
    accentBorder: 'border-accent-amber',
    accentSoft: 'bg-accent-amber/12',
    badgeClass: 'bg-accent-amber/16 text-accent-amber border-accent-amber/60',
    cardShadow: 'hover:shadow-[6px_6px_0_0_rgba(255,184,48,0.28)]',
    controlClass:
      'border-accent-amber text-accent-amber hover:bg-accent-amber hover:text-bg-deep focus-visible:outline-accent-amber',
    instruction: '> GIỮ MẮT VÀO DẤU CỘNG 15 GIÂY',
    teaser: 'Khi điểm nhìn cố định, não bắt đầu làm mờ các chấm hồng ở ngoại biên.',
  },
  {
    id: 10,
    title: 'Lộn Xộn Góc Độ',
    subtitle: 'ZOLLNER LINES',
    icon: 'lucide:align-right',
    accentText: 'text-accent-sky',
    accentBorder: 'border-accent-sky',
    accentSoft: 'bg-accent-sky/12',
    badgeClass: 'bg-accent-sky/16 text-accent-sky border-accent-sky/60',
    cardShadow: 'hover:shadow-[6px_6px_0_0_rgba(56,189,248,0.28)]',
    controlClass:
      'border-accent-sky text-accent-sky hover:bg-accent-sky hover:text-bg-deep focus-visible:outline-accent-sky',
    instruction: '> SO ĐỘ SONG SONG CỦA CÁC THANH ĐEN',
    teaser: 'Các nét chéo ngắn khiến những đường dài trông như đang nghiêng khỏi trục.',
  },
] as const

type IllusionId = (typeof illusions)[number]['id']

const activeIllusion = ref<IllusionId | null>(null)
const isLocked = useScrollLock(document.body)

const isForkHighlighted = ref(false)
const isDotsMoving = ref(true)
const isEbbinghausReal = ref(false)
const isCafeStraight = ref(false)
const isHermannInverted = ref(false)
const isOuchiJiggling = ref(false)
const isPonzoReal = ref(false)
const isSpiralCircles = ref(false)
const isTroxlerPaused = ref(false)
const isZollnerReal = ref(false)

const activeMeta = computed(
  () => illusions.find((illusion) => illusion.id === activeIllusion.value) ?? null,
)
const levelLabel = (id: number) => `LEVEL ${String(id).padStart(2, '0')}`

const openModal = (id: IllusionId) => {
  activeIllusion.value = id
  isLocked.value = true
}

const closeModal = () => {
  activeIllusion.value = null
  isLocked.value = false

  setTimeout(() => {
    isForkHighlighted.value = false
    isDotsMoving.value = true
    isEbbinghausReal.value = false
    isCafeStraight.value = false
    isHermannInverted.value = false
    isOuchiJiggling.value = false
    isPonzoReal.value = false
    isSpiralCircles.value = false
    isTroxlerPaused.value = false
    isZollnerReal.value = false
  }, 220)
}

onKeyStroke('Escape', () => {
  if (activeIllusion.value !== null) {
    closeModal()
  }
})
</script>

<template>
  <div
    class="arcade-shell relative min-h-screen overflow-hidden pb-20 text-text-primary selection:bg-accent-amber selection:text-bg-deep"
  >
    <div class="relative z-10 mx-auto max-w-6xl px-4 pt-24 sm:px-6">
      <RouterLink
        to="/"
        class="pixel-button fixed left-4 top-4 z-40 inline-flex items-center gap-2 border-2 border-border-default bg-bg-surface px-4 py-2 font-mono text-xs uppercase tracking-[0.24em] text-text-primary"
      >
        <Icon icon="lucide:arrow-left" class="size-4" />
        Home
      </RouterLink>

      <header
        class="pixel-panel animate-fade-up border-4 border-border-default bg-bg-surface/95 p-5 sm:p-8"
      >
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <div
              class="mb-4 flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-text-dim"
            >
              <span
                class="inline-flex items-center border border-accent-sky/50 bg-accent-sky/10 px-2 py-1 text-accent-sky"
                >Pixel Arcade</span
              >
              <span
                class="inline-flex items-center border border-accent-amber/50 bg-accent-amber/10 px-2 py-1 text-accent-amber"
                >10 Levels</span
              >
            </div>
            <h1
              class="pixel-flicker font-display text-4xl font-black uppercase leading-none sm:text-6xl lg:text-7xl"
            >
              Illusion
              <span class="block text-accent-sky">Playground</span>
            </h1>
            <p class="mt-5 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
              Một máy arcade dành cho thị giác. Mỗi level giữ nguyên ảo giác gốc, nhưng được bọc lại
              bằng giao diện pixel sắc nét, bảng điều khiển retro và nhịp chuyển động kiểu
              step-based.
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
            <div class="pixel-stat border-2 border-border-default bg-bg-deep/70 p-4">
              <p class="font-mono text-[11px] uppercase tracking-[0.28em] text-text-dim">Mode</p>
              <p class="mt-2 font-display text-lg uppercase text-accent-coral">Arcade Scroll</p>
            </div>
            <div class="pixel-stat border-2 border-border-default bg-bg-deep/70 p-4">
              <p class="font-mono text-[11px] uppercase tracking-[0.28em] text-text-dim">Focus</p>
              <p class="mt-2 font-display text-lg uppercase text-accent-amber">Pixel UI</p>
            </div>
            <div class="pixel-stat border-2 border-border-default bg-bg-deep/70 p-4">
              <p class="font-mono text-[11px] uppercase tracking-[0.28em] text-text-dim">Input</p>
              <p class="mt-2 font-display text-lg uppercase text-accent-sky">Tap To Play</p>
            </div>
          </div>
        </div>

        <div class="mt-8 flex gap-1.5">
          <span v-for="n in 36" :key="n" class="h-1 w-1 bg-border-default" />
        </div>
      </header>

      <section class="mt-12 animate-fade-up animate-delay-2">
        <div class="mb-6 flex items-center gap-3">
          <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
          <h2 class="font-display text-2xl font-semibold uppercase">Select A Level</h2>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <button
            v-for="(illusion, index) in illusions"
            :key="illusion.id"
            type="button"
            class="pixel-card group flex h-full flex-col border-2 border-border-default bg-bg-surface p-4 text-left outline-none animate-fade-up"
            :class="[illusion.accentBorder, illusion.cardShadow]"
            :style="{ animationDelay: `${index * 55}ms` }"
            @click="openModal(illusion.id)"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-mono text-[11px] uppercase tracking-[0.3em] text-text-dim">
                  {{ levelLabel(illusion.id) }}
                </p>
                <h3 class="mt-3 font-display text-2xl font-semibold uppercase leading-tight">
                  {{ illusion.title }}
                </h3>
                <p class="mt-2 font-mono text-xs uppercase tracking-[0.22em] text-text-secondary">
                  {{ illusion.subtitle }}
                </p>
              </div>
              <div
                class="flex size-14 shrink-0 items-center justify-center border-2 bg-bg-deep/80"
                :class="illusion.accentBorder"
              >
                <Icon :icon="illusion.icon" class="size-7" :class="illusion.accentText" />
              </div>
            </div>
            <p class="mt-6 text-sm leading-relaxed text-text-secondary">{{ illusion.teaser }}</p>
            <div
              class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border-default pt-4"
            >
              <span
                class="inline-flex items-center border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.24em]"
                :class="illusion.badgeClass"
                >{{ illusion.instruction }}</span
              >
              <span class="font-mono text-[11px] uppercase tracking-[0.24em] text-text-dim"
                >Press Start</span
              >
            </div>
          </button>
        </div>
      </section>
    </div>

    <Teleport to="body">
      <Transition name="pixel-modal">
        <div
          v-show="activeIllusion !== null"
          class="pixel-modal fixed inset-0 z-50 overflow-y-auto bg-bg-deep/95 px-3 py-4 sm:px-6 sm:py-8"
        >
          <div class="mx-auto flex min-h-full max-w-6xl items-start justify-center">
            <div
              v-if="activeMeta"
              class="pixel-panel pixel-modal-panel relative w-full border-4 bg-bg-surface"
              :class="activeMeta.accentBorder"
            >
              <div
                class="flex flex-wrap items-center justify-between gap-4 border-b-4 px-4 py-3 sm:px-6"
                :class="[activeMeta.accentBorder, activeMeta.accentSoft]"
              >
                <div class="flex flex-wrap items-center gap-3">
                  <span class="font-mono text-[11px] uppercase tracking-[0.3em] text-text-dim">{{
                    levelLabel(activeMeta.id)
                  }}</span>
                  <span
                    class="border border-border-default bg-bg-deep/75 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-text-primary"
                    >{{ activeMeta.subtitle }}</span
                  >
                </div>
                <button
                  type="button"
                  class="pixel-button inline-flex items-center gap-2 border-2 border-border-default bg-bg-deep px-3 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-text-primary"
                  title="Đóng trải nghiệm (ESC)"
                  @click="closeModal"
                >
                  <Icon icon="lucide:x" class="size-4" />
                  Exit
                </button>
              </div>

              <div class="grid gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:p-6">
                <section class="space-y-6">
                  <div class="border-2 border-border-default bg-bg-deep/70 p-4 sm:p-5">
                    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div class="max-w-3xl">
                        <p
                          class="font-mono text-[11px] uppercase tracking-[0.3em]"
                          :class="activeMeta.accentText"
                        >
                          {{ levelLabel(activeMeta.id) }}
                        </p>
                        <h2
                          class="mt-3 font-display text-3xl font-black uppercase leading-none sm:text-4xl"
                        >
                          {{ activeMeta.title }}
                        </h2>
                        <p
                          class="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary sm:text-base"
                        >
                          {{ activeMeta.teaser }}
                        </p>
                      </div>
                      <div
                        class="flex size-14 shrink-0 items-center justify-center border-2 bg-bg-surface"
                        :class="activeMeta.accentBorder"
                      >
                        <Icon
                          :icon="activeMeta.icon"
                          class="size-7"
                          :class="activeMeta.accentText"
                        />
                      </div>
                    </div>
                  </div>

                  <div v-if="activeIllusion === 1" class="space-y-4">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div
                        class="border-2 border-border-default bg-bg-deep/70 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-text-dim"
                      >
                        COMMAND PANEL
                      </div>
                      <button
                        type="button"
                        class="pixel-button inline-flex items-center justify-center gap-2 border-2 bg-bg-surface px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]"
                        :class="illusions[0].controlClass"
                        @click="isForkHighlighted = !isForkHighlighted"
                      >
                        <Icon
                          :icon="isForkHighlighted ? 'lucide:eye-off' : 'lucide:eye'"
                          class="size-4"
                        />
                        {{ isForkHighlighted ? 'Ẩn phân tích khối' : 'Đánh dấu cấu trúc khối' }}
                      </button>
                    </div>
                    <div
                      class="pixel-screen relative flex aspect-[4/3] items-center justify-center overflow-hidden border-4 border-border-default bg-bg-deep p-4"
                    >
                      <svg
                        viewBox="0 0 240 300"
                        class="h-full w-full max-h-96 stroke-text-primary transition-transform duration-700"
                        :class="{ 'scale-95': isForkHighlighted }"
                        fill="none"
                        stroke-width="4"
                        stroke-linecap="square"
                        stroke-linejoin="miter"
                      >
                        <path
                          class="transition-colors duration-1000"
                          :class="
                            isForkHighlighted
                              ? 'fill-transparent stroke-text-dim'
                              : 'fill-bg-surface'
                          "
                          d="M 30,50 L 30,250 A 15,10 0 0 0 60,250 L 60,110 L 150,110 L 150,250 A 15,10 0 0 0 180,250 L 180,50 L 120,50 L 120,250 A 15,10 0 0 1 90,250 L 90,50 Z"
                        />
                        <path
                          v-if="isForkHighlighted"
                          class="animate-fade-in fill-accent-coral/40 stroke-accent-coral"
                          d="M 30,50 L 90,50 L 90,110 L 30,110 Z"
                        />
                        <path
                          v-if="isForkHighlighted"
                          class="animate-fade-in fill-accent-coral/40 stroke-accent-coral"
                          d="M 120,50 L 180,50 L 180,110 L 120,110 Z"
                        />
                        <path
                          v-if="isForkHighlighted"
                          class="animate-fade-in fill-accent-sky/40 stroke-accent-sky"
                          d="M 30,150 L 30,250 A 15,10 0 0 0 60,250 L 60,150 Z"
                        />
                        <path
                          v-if="isForkHighlighted"
                          class="animate-fade-in fill-accent-sky/40 stroke-accent-sky"
                          d="M 90,150 L 90,250 A 15,10 0 0 0 120,250 L 120,150 Z"
                        />
                        <path
                          v-if="isForkHighlighted"
                          class="animate-fade-in fill-accent-sky/40 stroke-accent-sky"
                          d="M 150,150 L 150,250 A 15,10 0 0 0 180,250 L 180,150 Z"
                        />
                      </svg>
                    </div>
                  </div>

                  <div v-if="activeIllusion === 2" class="space-y-4">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div
                        class="border-2 border-border-default bg-bg-deep/70 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-text-dim"
                      >
                        COMMAND PANEL
                      </div>
                      <button
                        type="button"
                        class="pixel-button inline-flex items-center justify-center gap-2 border-2 bg-bg-surface px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]"
                        :class="illusions[1].controlClass"
                        @click="isDotsMoving = !isDotsMoving"
                      >
                        <Icon
                          :icon="isDotsMoving ? 'lucide:pause' : 'lucide:play'"
                          class="size-4"
                        />
                        {{ isDotsMoving ? 'Dừng vi chuyển động' : 'Phát lại chuyển động' }}
                      </button>
                    </div>
                    <div
                      class="pixel-screen relative flex aspect-[4/3] items-center justify-center overflow-hidden border-4 border-border-default bg-[#404c55] p-4 sm:p-8 md:aspect-video"
                    >
                      <div
                        class="grid w-full max-w-3xl grid-cols-4 gap-3 sm:gap-6 md:grid-cols-6 md:gap-8"
                        :class="{ 'animate-pulse-slow': isDotsMoving }"
                      >
                        <div
                          v-for="i in 24"
                          :key="i"
                          class="relative mx-auto flex h-12 w-12 items-center justify-center md:h-16 md:w-16"
                        >
                          <div
                            class="h-full w-full rounded-full border-[4px] bg-[#1c2124] shadow-lg transition-transform duration-[2000ms] md:border-[6px]"
                            :class="
                              i % 2 === 0
                                ? 'border-b-[#fcfcfc] border-l-black border-r-[#fcfcfc] border-t-black'
                                : 'border-b-black border-l-[#fcfcfc] border-r-black border-t-[#fcfcfc]'
                            "
                            :style="
                              isDotsMoving
                                ? `transform: rotate(${(i * 45) % 360}deg)`
                                : 'transform: rotate(0deg)'
                            "
                          />
                          <div class="absolute h-5 w-5 rounded-full bg-[#8a99a8] md:h-8 md:w-8" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="activeIllusion === 3" class="space-y-4">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div
                        class="border-2 border-border-default bg-bg-deep/70 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-text-dim"
                      >
                        COMMAND PANEL
                      </div>
                      <button
                        type="button"
                        class="pixel-button inline-flex items-center justify-center gap-2 border-2 bg-bg-surface px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]"
                        :class="illusions[2].controlClass"
                        @click="isEbbinghausReal = !isEbbinghausReal"
                      >
                        <Icon
                          :icon="isEbbinghausReal ? 'lucide:minimize-2' : 'lucide:maximize-2'"
                          class="size-4"
                        />
                        {{ isEbbinghausReal ? 'Khôi phục ảo giác' : 'Hiển thị kích thước thật' }}
                      </button>
                    </div>
                    <div
                      class="pixel-screen relative flex aspect-[4/3] flex-col items-center justify-center overflow-hidden border-4 border-border-default bg-bg-deep py-12 md:aspect-video md:flex-row md:py-0"
                    >
                      <div
                        class="flex w-full origin-center scale-75 flex-col items-center justify-center gap-24 sm:scale-90 md:flex-row md:gap-[clamp(8rem,15vw,20rem)] md:scale-100"
                      >
                        <div
                          class="relative flex items-center justify-center transition-transform duration-700"
                          :class="
                            isEbbinghausReal
                              ? 'translate-y-6 md:translate-x-12 md:translate-y-0'
                              : ''
                          "
                        >
                          <div
                            class="pointer-events-none absolute left-1/2 top-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
                            :class="
                              isEbbinghausReal ? 'scale-50 opacity-0' : 'scale-100 opacity-100'
                            "
                          >
                            <div
                              v-for="i in 6"
                              :key="`L${i}`"
                              class="absolute left-1/2 top-1/2 -ml-8 -mt-8"
                              :style="`transform: rotate(${i * 60}deg) translateY(-85px)`"
                            >
                              <div
                                class="h-16 w-16 rounded-full bg-text-dim shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                              />
                            </div>
                          </div>
                          <div
                            class="relative z-10 h-14 w-14 rounded-full bg-accent-coral shadow-lg"
                          />
                        </div>
                        <div
                          class="relative flex items-center justify-center transition-transform duration-700"
                          :class="
                            isEbbinghausReal
                              ? '-translate-y-6 md:-translate-x-12 md:translate-y-0'
                              : ''
                          "
                        >
                          <div
                            class="pointer-events-none absolute left-1/2 top-1/2 h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
                            :class="
                              isEbbinghausReal ? 'scale-50 opacity-0' : 'scale-100 opacity-100'
                            "
                          >
                            <div
                              v-for="i in 8"
                              :key="`R${i}`"
                              class="absolute left-1/2 top-1/2 -ml-4 -mt-4"
                              :style="`transform: rotate(${i * 45}deg) translateY(-50px)`"
                            >
                              <div
                                class="h-8 w-8 rounded-full bg-text-dim shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                              />
                            </div>
                          </div>
                          <div
                            class="relative z-10 h-14 w-14 rounded-full bg-accent-coral shadow-lg"
                          />
                        </div>
                      </div>
                      <div
                        v-if="isEbbinghausReal"
                        class="pointer-events-none absolute left-0 top-1/2 flex h-14 w-full -translate-y-1/2 items-center justify-center border-y-[3px] border-dashed border-accent-sky md:left-1/2 md:w-[60vw] md:-translate-x-1/2 animate-fade-in"
                      >
                        <span
                          class="border border-border-default bg-bg-surface px-4 py-1 font-mono text-xs uppercase tracking-[0.2em] text-accent-sky"
                          >Kích thước chuẩn xác</span
                        >
                      </div>
                    </div>
                  </div>

                  <div v-if="activeIllusion === 4" class="space-y-4">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div
                        class="border-2 border-border-default bg-bg-deep/70 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-text-dim"
                      >
                        COMMAND PANEL
                      </div>
                      <button
                        type="button"
                        class="pixel-button inline-flex items-center justify-center gap-2 border-2 bg-bg-surface px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]"
                        :class="illusions[3].controlClass"
                        @click="isCafeStraight = !isCafeStraight"
                      >
                        <Icon
                          :icon="isCafeStraight ? 'lucide:eye-off' : 'lucide:crosshair'"
                          class="size-4"
                        />
                        {{ isCafeStraight ? 'Ẩn đường chuẩn' : 'Kẻ đường thẳng đỏ' }}
                      </button>
                    </div>
                    <div
                      class="pixel-screen relative flex aspect-[4/3] flex-col justify-center overflow-hidden border-4 border-border-default bg-[#555] bg-stripes-diagonal shadow-inner md:aspect-video"
                    >
                      <div
                        v-for="(row, idx) in 8"
                        :key="row"
                        class="flex h-12 w-[150%] items-center border-[2px] border-[#818181] shadow-sm md:h-16"
                        :style="`margin-left: ${[0, -16, -32, -16, 0, -16, -32, -16][idx]}px;`"
                      >
                        <div
                          v-for="col in 24"
                          :key="col"
                          class="h-full w-12 flex-shrink-0 md:w-16"
                          :class="col % 2 === 0 ? 'bg-[#0f0f0f]' : 'bg-[#e5e5e5]'"
                        />
                      </div>
                      <div
                        v-if="isCafeStraight"
                        class="pointer-events-none absolute inset-0 flex scale-y-[1.03] flex-col justify-center mix-blend-screen animate-fade-in"
                      >
                        <div
                          v-for="row in 8"
                          :key="`g${row}`"
                          class="h-12 w-full border-y-[3px] border-accent-coral shadow-[0_0_15px_rgba(255,107,74,1)] md:h-16"
                        />
                      </div>
                      <div
                        v-if="!isCafeStraight"
                        class="absolute bottom-4 right-4 border border-border-default bg-bg-surface px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-text-secondary"
                      >
                        Cafe Wall Layout
                      </div>
                    </div>
                  </div>

                  <div v-if="activeIllusion === 5" class="space-y-4">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div
                        class="border-2 border-border-default bg-bg-deep/70 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-text-dim"
                      >
                        COMMAND PANEL
                      </div>
                      <button
                        type="button"
                        class="pixel-button inline-flex items-center justify-center gap-2 border-2 bg-bg-surface px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]"
                        :class="illusions[4].controlClass"
                        @click="isHermannInverted = !isHermannInverted"
                      >
                        <Icon
                          :icon="isHermannInverted ? 'lucide:sun' : 'lucide:moon'"
                          class="size-4"
                        />
                        Đảo ngược màu sắc
                      </button>
                    </div>
                    <div
                      class="pixel-screen relative aspect-[4/3] overflow-hidden border-[6px] border-bg-deep cursor-crosshair md:aspect-video md:border-8"
                    >
                      <div
                        class="grid h-[105%] w-[105%] -m-2 gap-[8px] overflow-hidden p-2 md:gap-[14px]"
                        :class="isHermannInverted ? 'bg-[#151515]' : 'bg-[#efefef]'"
                        style="
                          grid-template-columns: repeat(7, 1fr);
                          grid-template-rows: repeat(5, 1fr);
                        "
                      >
                        <div
                          v-for="i in 35"
                          :key="i"
                          class="h-full w-full shadow-sm transition-transform hover:scale-[1.02]"
                          :class="isHermannInverted ? 'bg-[#efefef]' : 'bg-[#151515]'"
                        />
                      </div>
                    </div>
                  </div>

                  <div v-if="activeIllusion === 6" class="space-y-4">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div
                        class="border-2 border-border-default bg-bg-deep/70 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-text-dim"
                      >
                        COMMAND PANEL
                      </div>
                      <button
                        type="button"
                        class="pixel-button inline-flex items-center justify-center gap-2 border-2 bg-bg-surface px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]"
                        :class="illusions[5].controlClass"
                        @click="isOuchiJiggling = !isOuchiJiggling"
                      >
                        <Icon icon="lucide:vibrate" class="size-4" />
                        {{ isOuchiJiggling ? 'Tắt chế độ rung' : 'Bật tự rung ảnh' }}
                      </button>
                    </div>
                    <div
                      class="pixel-screen relative flex aspect-[4/3] cursor-move items-center justify-center overflow-hidden border-4 border-border-default bg-white md:aspect-video"
                      style="
                        background: repeating-linear-gradient(
                          0deg,
                          #181a1b 0px,
                          #181a1b 10px,
                          #ffffff 10px,
                          #ffffff 20px
                        );
                      "
                      :class="{ 'animate-jiggle': isOuchiJiggling }"
                    >
                      <div
                        class="h-48 w-48 flex-shrink-0 rounded-full border-[3px] border-[#181a1b] shadow-[0_15px_30px_rgba(0,0,0,0.8)] md:h-64 md:w-64"
                        style="
                          background: repeating-linear-gradient(
                            90deg,
                            #181a1b 0px,
                            #181a1b 10px,
                            #ffffff 10px,
                            #ffffff 20px
                          );
                        "
                      />
                    </div>
                  </div>

                  <div v-if="activeIllusion === 7" class="space-y-4">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div
                        class="border-2 border-border-default bg-bg-deep/70 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-text-dim"
                      >
                        COMMAND PANEL
                      </div>
                      <button
                        type="button"
                        class="pixel-button inline-flex items-center justify-center gap-2 border-2 bg-bg-surface px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]"
                        :class="illusions[6].controlClass"
                        @click="isPonzoReal = !isPonzoReal"
                      >
                        <Icon
                          :icon="isPonzoReal ? 'lucide:bring-to-front' : 'lucide:unfold-vertical'"
                          class="size-4"
                        />
                        {{ isPonzoReal ? 'Xóa so sánh' : 'Hiển thị bề ngang thật' }}
                      </button>
                    </div>
                    <div
                      class="pixel-screen relative flex aspect-[4/3] flex-col items-center justify-end overflow-hidden border-4 border-border-default bg-bg-deep md:aspect-video"
                    >
                      <div class="absolute inset-0 bg-gradient-to-t from-bg-surface to-[#222]" />
                      <div
                        class="absolute bottom-[-100px] left-1/2 flex h-[200%] w-[80%] -translate-x-1/2 origin-bottom flex-col justify-end gap-[40px] border-x-[12px] border-[#555] bg-[#333] pb-10 shadow-2xl md:w-[60%] md:gap-[50px]"
                        style="transform: perspective(600px) rotateX(65deg)"
                      >
                        <div
                          v-for="i in 15"
                          :key="i"
                          class="h-6 w-[120%] -ml-[10%] border border-black bg-[#666] shadow"
                        />
                      </div>
                      <div
                        class="absolute bottom-[20%] z-10 h-4 w-[120px] border border-black bg-accent-amber transition-transform duration-[1200ms] md:h-5 md:w-[150px]"
                        :class="
                          isPonzoReal
                            ? '-translate-y-24 shadow-none'
                            : 'shadow-[0_4px_10px_rgba(0,0,0,0.5)]'
                        "
                      />
                      <div
                        class="absolute bottom-[55%] z-10 h-4 w-[120px] border border-black bg-accent-amber transition-transform duration-[1200ms] md:h-5 md:w-[150px]"
                        :class="
                          isPonzoReal
                            ? 'translate-y-24 shadow-none'
                            : 'shadow-[0_4px_10px_rgba(0,0,0,0.5)]'
                        "
                      />
                      <div
                        v-if="isPonzoReal"
                        class="absolute bottom-[35%] z-0 flex h-32 w-[120px] translate-y-[10px] items-center justify-center border-x-[3px] border-dashed border-accent-sky opacity-60 animate-fade-in md:w-[150px]"
                      >
                        <span
                          class="border border-border-default bg-black/60 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-accent-sky"
                          >Cùng chiều dài</span
                        >
                      </div>
                    </div>
                  </div>

                  <div v-if="activeIllusion === 8" class="space-y-4">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div
                        class="border-2 border-border-default bg-bg-deep/70 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-text-dim"
                      >
                        COMMAND PANEL
                      </div>
                      <button
                        type="button"
                        class="pixel-button inline-flex items-center justify-center gap-2 border-2 bg-bg-surface px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]"
                        :class="illusions[7].controlClass"
                        @click="isSpiralCircles = !isSpiralCircles"
                      >
                        <Icon
                          :icon="isSpiralCircles ? 'lucide:circle-dashed' : 'lucide:rotate-cw'"
                          class="size-4"
                        />
                        {{ isSpiralCircles ? 'Hiện mẫu đánh lừa' : 'Sửa độ uốn góc' }}
                      </button>
                    </div>
                    <div
                      class="pixel-screen relative flex aspect-[4/3] items-center justify-center overflow-hidden border-4 border-border-default p-4 md:aspect-[16/10]"
                      style="background: radial-gradient(circle, #e6e6e6 0%, #a2a2a2 100%)"
                    >
                      <div
                        class="relative h-[300px] w-[300px] origin-center scale-90 flex-shrink-0 drop-shadow-xl transition-transform duration-[2s] sm:scale-[0.85] md:h-[450px] md:w-[450px] md:scale-100"
                        :class="{ 'opacity-90': isSpiralCircles }"
                      >
                        <template v-for="r in 9" :key="r">
                          <div
                            class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-black/10 transition-transform duration-1000"
                            :style="`width: ${450 - (r - 1) * 44}px; height: ${450 - (r - 1) * 44}px; background: repeating-conic-gradient(from 0deg, #111 0deg 6deg, #fff 6deg 12deg); transform: translate(-50%, -50%) rotate(${isSpiralCircles ? 0 : r * 11}deg); z-index: ${r * 2};`"
                            :class="{
                              'ring-2 ring-accent-coral ring-offset-2 ring-offset-[#d0d0d0]':
                                isSpiralCircles,
                            }"
                          />
                          <div
                            class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                            :style="`width: ${450 - (r - 1) * 44 - 18}px; height: ${450 - (r - 1) * 44 - 18}px; z-index: ${r * 2 + 1}; background: radial-gradient(circle, #e6e6e6 0%, #cacaca 100%);`"
                            :class="{ 'opacity-0': isSpiralCircles }"
                          />
                          <div
                            v-if="isSpiralCircles"
                            class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black bg-[#333]"
                            :style="`width: ${450 - (r - 1) * 44 - 18}px; height: ${450 - (r - 1) * 44 - 18}px; z-index: ${r * 2 + 1};`"
                          />
                        </template>
                      </div>
                      <div
                        class="absolute left-1/2 top-1/2 z-50 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent-coral bg-accent-coral/20 shadow-inner"
                      />
                    </div>
                  </div>

                  <div v-if="activeIllusion === 9" class="space-y-4">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div
                        class="border-2 border-border-default bg-bg-deep/70 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-text-dim"
                      >
                        COMMAND PANEL
                      </div>
                      <button
                        type="button"
                        class="pixel-button inline-flex items-center justify-center gap-2 border-2 bg-bg-surface px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]"
                        :class="illusions[8].controlClass"
                        @click="isTroxlerPaused = !isTroxlerPaused"
                      >
                        <Icon
                          :icon="isTroxlerPaused ? 'lucide:play' : 'lucide:pause'"
                          class="size-4"
                        />
                        {{ isTroxlerPaused ? 'Phát hiệu ứng' : 'Dừng nhấp nháy' }}
                      </button>
                    </div>
                    <div
                      class="pixel-screen relative flex aspect-[4/3] items-center justify-center overflow-hidden border-4 border-border-default bg-[#c6ccd1] md:aspect-video"
                    >
                      <div
                        class="relative h-[300px] w-[300px] origin-center scale-90 rounded-full md:scale-100"
                      >
                        <div
                          class="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 text-[60px] font-thin text-black"
                        >
                          +
                        </div>
                        <div
                          v-for="i in 12"
                          :key="`p${i}`"
                          class="pointer-events-none absolute left-1/2 top-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff3be6] mix-blend-multiply md:h-14 md:w-14"
                          :class="{
                            'scale-110 opacity-10 ring-2 ring-black': isTroxlerPaused,
                            'blur-[8px]': !isTroxlerPaused,
                          }"
                          :style="`transform: rotate(${i * 30}deg) translateY(-120px) translateX(-50%); ${!isTroxlerPaused ? `animation: pacman 1.8s ${(i * 1.8) / 12}s infinite step-end;` : ''}`"
                        />
                      </div>
                    </div>
                  </div>

                  <div v-if="activeIllusion === 10" class="space-y-4">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div
                        class="border-2 border-border-default bg-bg-deep/70 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-text-dim"
                      >
                        COMMAND PANEL
                      </div>
                      <button
                        type="button"
                        class="pixel-button inline-flex items-center justify-center gap-2 border-2 bg-bg-surface px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]"
                        :class="illusions[9].controlClass"
                        @click="isZollnerReal = !isZollnerReal"
                      >
                        <Icon
                          :icon="isZollnerReal ? 'lucide:shuffle' : 'lucide:move-horizontal'"
                          class="size-4"
                        />
                        {{ isZollnerReal ? 'Trả lại hình gốc' : 'Xoay song song' }}
                      </button>
                    </div>
                    <div
                      class="pixel-screen relative flex aspect-[4/3] flex-col justify-evenly overflow-hidden border-4 border-border-default bg-[#eaeaeb] px-8 py-8 shadow-inner md:aspect-[16/10] md:px-16"
                    >
                      <div
                        v-for="l in 7"
                        :key="`z${l}`"
                        class="group relative my-[9px] flex h-[6px] w-full items-center justify-evenly bg-[#222] shadow-sm transition-colors duration-700 md:my-[12px] md:h-2"
                        :class="{
                          'bg-accent-sky shadow-[0_0_10px_rgba(56,189,248,0.8)]': isZollnerReal,
                        }"
                      >
                        <div
                          v-for="d in 24"
                          :key="`d${d}`"
                          class="h-[36px] w-[3px] bg-[#111] transition-transform duration-[1200ms] md:h-[40px] md:w-[4px]"
                          :style="`transform: rotate(${isZollnerReal ? 0 : l % 2 === 0 ? 45 : -45}deg)`"
                          :class="{ 'h-[24px] bg-accent-coral/90': isZollnerReal }"
                        />
                      </div>
                      <div
                        v-if="isZollnerReal"
                        class="pointer-events-none absolute bottom-4 left-8 border border-border-default bg-bg-surface px-4 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-text-secondary"
                      >
                        Những đường chéo cản trở não đọc góc nhọn
                      </div>
                    </div>
                  </div>
                </section>

                <aside class="space-y-4">
                  <div class="border-2 border-border-default bg-bg-deep/70 p-4">
                    <p class="font-mono text-[11px] uppercase tracking-[0.28em] text-text-dim">
                      Mission
                    </p>
                    <p
                      class="mt-3 font-mono text-sm uppercase leading-relaxed"
                      :class="activeMeta.accentText"
                    >
                      {{ activeMeta.instruction }}
                    </p>
                  </div>
                  <div class="border-2 border-border-default bg-bg-deep/70 p-4">
                    <p class="font-mono text-[11px] uppercase tracking-[0.28em] text-text-dim">
                      Play Notes
                    </p>
                    <p class="mt-3 text-sm leading-relaxed text-text-secondary">
                      Chạm vào nút lệnh để bật lớp giải thích trực quan hoặc đổi trạng thái trình
                      diễn. Logic của từng ảo giác vẫn giữ nguyên.
                    </p>
                  </div>
                  <div class="border-2 border-border-default bg-bg-deep/70 p-4">
                    <p class="font-mono text-[11px] uppercase tracking-[0.28em] text-text-dim">
                      Exit
                    </p>
                    <p class="mt-3 text-sm leading-relaxed text-text-secondary">
                      Bấm ra ngoài khung hoặc nhấn
                      <span class="font-mono text-text-primary">ESC</span> để quay về màn hình chọn
                      level.
                    </p>
                  </div>
                </aside>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="absolute inset-0 -z-10 h-full w-full cursor-default"
            aria-label="Đóng khung ảo giác"
            @click="closeModal"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.arcade-shell {
  isolation: isolate;
  background:
    radial-gradient(circle at top, rgb(56 189 248 / 0.18), transparent 32%),
    radial-gradient(circle at 85% 14%, rgb(255 184 48 / 0.13), transparent 24%),
    linear-gradient(180deg, #0f1923 0%, #102031 48%, #09111b 100%);
}

.arcade-shell::before,
.arcade-shell::after,
.pixel-modal::before,
.pixel-modal::after {
  content: '';
  pointer-events: none;
  position: absolute;
  inset: 0;
}

.arcade-shell::before,
.pixel-modal::before {
  background-image:
    linear-gradient(rgb(56 189 248 / 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgb(56 189 248 / 0.08) 1px, transparent 1px);
  background-size: 30px 30px;
  opacity: 0.18;
}

.arcade-shell::after,
.pixel-modal::after {
  background: repeating-linear-gradient(180deg, rgb(255 255 255 / 0.05) 0 2px, transparent 2px 6px);
  opacity: 0.12;
}

.pixel-panel {
  box-shadow:
    0 0 0 2px rgb(15 25 35 / 0.95),
    10px 10px 0 rgb(8 17 27 / 0.55);
}

.pixel-stat,
.pixel-screen {
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.03),
    6px 6px 0 rgb(8 17 27 / 0.42);
}

.pixel-button,
.pixel-card {
  transition:
    transform 160ms steps(4, end),
    box-shadow 160ms steps(4, end),
    border-color 160ms steps(4, end),
    background-color 160ms steps(4, end),
    color 160ms steps(4, end);
}

.pixel-button {
  box-shadow: 4px 4px 0 rgb(8 17 27 / 0.65);
}

.pixel-button:hover,
.pixel-card:hover {
  transform: translate(-2px, -2px);
}

.pixel-button:active,
.pixel-card:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 transparent;
}

.pixel-card {
  box-shadow: 6px 6px 0 rgb(8 17 27 / 0.52);
}

.pixel-card:focus-visible,
.pixel-button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 4px;
}

.pixel-flicker {
  animation: flicker 7s steps(2, end) infinite;
}

.pixel-modal-enter-active,
.pixel-modal-leave-active {
  transition: opacity 180ms steps(4, end);
}

.pixel-modal-enter-from,
.pixel-modal-leave-to {
  opacity: 0;
}

.pixel-modal-enter-active .pixel-modal-panel,
.pixel-modal-leave-active .pixel-modal-panel {
  transition:
    opacity 180ms steps(4, end),
    transform 220ms steps(5, end);
}

.pixel-modal-enter-from .pixel-modal-panel,
.pixel-modal-leave-to .pixel-modal-panel {
  opacity: 0;
  transform: translateY(18px);
}

@keyframes pulse-slow {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(0.65) saturate(1.8);
  }
}

.animate-pulse-slow {
  animation: pulse-slow 3.4s infinite steps(6, end);
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.4s steps(4, end) forwards;
}

@keyframes jiggle {
  0% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(1px, -1px);
  }
  50% {
    transform: translate(-1px, 1px);
  }
  75% {
    transform: translate(1px, 0);
  }
  100% {
    transform: translate(0, 0);
  }
}

.animate-jiggle {
  animation: jiggle 0.12s infinite steps(2, end);
}

@keyframes pacman {
  0%,
  15%,
  100% {
    opacity: 1;
    filter: blur(5px);
  }
  10% {
    opacity: 0;
    filter: blur(0);
  }
}

@keyframes flicker {
  0%,
  95%,
  100% {
    opacity: 1;
  }
  96% {
    opacity: 0.88;
  }
  98% {
    opacity: 0.94;
  }
}

.bg-stripes-diagonal {
  background-image:
    repeating-linear-gradient(
      45deg,
      #1f1f1f 25%,
      transparent 25%,
      transparent 75%,
      #1f1f1f 75%,
      #1f1f1f
    ),
    repeating-linear-gradient(
      45deg,
      #1f1f1f 25%,
      transparent 25%,
      transparent 75%,
      #1f1f1f 75%,
      #1f1f1f
    );
  background-position:
    0 0,
    10px 10px;
  background-size: 20px 20px;
}
</style>
