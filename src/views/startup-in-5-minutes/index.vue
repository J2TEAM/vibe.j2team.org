<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'

type StepKey = 'market' | 'problem' | 'solution' | 'pricing' | 'channel'

type Option = {
  id: string
  title: string
  description: string
  impact: string
}

type Step = {
  key: StepKey
  marker: string
  label: string
  options: readonly [Option, ...Option[]]
}

const steps = [
  {
    key: 'market',
    marker: '01',
    label: 'Chọn thị trường',
    options: [
      {
        id: 'freelancer',
        title: 'Freelancer/Creator',
        description: 'Người làm tự do cần tối ưu thời gian và dòng tiền.',
        impact: 'Tệp khách hàng đông, sẵn sàng trả cho công cụ tăng năng suất.',
      },
      {
        id: 'sme',
        title: 'SME nội địa',
        description: 'Doanh nghiệp nhỏ muốn số hóa nhanh mà không phức tạp.',
        impact: 'Bài toán thực tế, khả năng giữ chân tốt nếu onboarding mượt.',
      },
      {
        id: 'student',
        title: 'Sinh viên công nghệ',
        description: 'Nhóm người dùng thích trải nghiệm mới, lan truyền nhanh.',
        impact: 'Tăng trưởng tự nhiên tốt, phù hợp mô hình freemium.',
      },
    ],
  },
  {
    key: 'problem',
    marker: '02',
    label: 'Chốt pain point',
    options: [
      {
        id: 'planning',
        title: 'Quản lý việc rời rạc',
        description: 'Task nằm rải rác ở nhiều app, khó theo dõi tiến độ.',
        impact: 'Mất tập trung và lỡ deadline liên tục.',
      },
      {
        id: 'communication',
        title: 'Trao đổi không rõ ràng',
        description: 'Yêu cầu công việc dễ bị hiểu sai, chỉnh sửa nhiều vòng.',
        impact: 'Tăng chi phí vận hành, giảm niềm tin khách hàng.',
      },
      {
        id: 'reporting',
        title: 'Thiếu dữ liệu để quyết định',
        description: 'Không có dashboard đủ nhanh để nhìn KPI quan trọng.',
        impact: 'Ra quyết định chậm và cảm tính.',
      },
    ],
  },
  {
    key: 'solution',
    marker: '03',
    label: 'Đề xuất giải pháp',
    options: [
      {
        id: 'copilot',
        title: 'AI Copilot theo ngữ cảnh',
        description: 'Gợi ý hành động tiếp theo dựa trên lịch sử công việc.',
        impact: 'Giảm thao tác thủ công, tăng tốc độ hoàn thành task.',
      },
      {
        id: 'workflow',
        title: 'Workflow 1-click',
        description: 'Template quy trình có sẵn cho từng loại công việc.',
        impact: 'Onboarding nhanh, giảm thời gian đào tạo.',
      },
      {
        id: 'radar',
        title: 'Risk Radar',
        description: 'Cảnh báo sớm rủi ro chậm tiến độ hoặc thiếu nguồn lực.',
        impact: 'Giúp đội ngũ chủ động xử lý trước khi sự cố xảy ra.',
      },
    ],
  },
  {
    key: 'pricing',
    marker: '04',
    label: 'Mô hình giá',
    options: [
      {
        id: 'freemium',
        title: 'Freemium + Pro',
        description: 'Miễn phí cho cá nhân, mở khóa tính năng nâng cao ở gói Pro.',
        impact: 'Giảm rào cản dùng thử và nuôi funnel tự nhiên.',
      },
      {
        id: 'seat',
        title: 'Theo số ghế',
        description: 'Tính phí theo thành viên hoạt động mỗi tháng.',
        impact: 'Dễ dự đoán doanh thu khi đội ngũ khách hàng mở rộng.',
      },
      {
        id: 'usage',
        title: 'Theo mức sử dụng',
        description: 'Trả tiền theo lượt xử lý hoặc khối lượng dữ liệu.',
        impact: 'Công bằng với khách hàng có nhu cầu biến động.',
      },
    ],
  },
  {
    key: 'channel',
    marker: '05',
    label: 'Kênh tăng trưởng',
    options: [
      {
        id: 'community',
        title: 'Community-led',
        description: 'Phát triển qua workshop, group Facebook, case study cộng đồng.',
        impact: 'Niềm tin cao và lan truyền tốt qua trải nghiệm thật.',
      },
      {
        id: 'content',
        title: 'SEO + Content',
        description: 'Xây thư viện nội dung hướng dẫn và template miễn phí.',
        impact: 'Thu hút traffic bền vững với chi phí thấp hơn ads.',
      },
      {
        id: 'partnership',
        title: 'Partnership B2B',
        description: 'Hợp tác với agency, school, coworking để phân phối sản phẩm.',
        impact: 'Rút ngắn thời gian tiếp cận khách hàng trả phí.',
      },
    ],
  },
] as const satisfies readonly [Step, Step, Step, Step, Step]

const [marketStep, problemStep, solutionStep, pricingStep, channelStep] = steps

const selections = reactive<Record<StepKey, string>>({
  market: marketStep.options[0].id,
  problem: problemStep.options[0].id,
  solution: solutionStep.options[0].id,
  pricing: pricingStep.options[0].id,
  channel: channelStep.options[0].id,
})

const copyFeedback = ref('Sao chép one-pager')

function pick(stepKey: StepKey, optionId: string): void {
  selections[stepKey] = optionId
}

function selectedOption(step: Step): Option {
  const matched = step.options.find((option) => option.id === selections[step.key])
  if (matched) {
    return matched
  }
  return step.options[0]
}

const startupName = computed(() => {
  const market = selectedOption(marketStep).title.split('/')[0]?.trim() ?? 'Market'
  const solution = selectedOption(solutionStep).title.split(' ')[0] ?? 'Startup'
  return `${solution}Flow for ${market}`
})

const oneLiner = computed(() => {
  return `Nền tảng giúp ${selectedOption(marketStep).title.toLowerCase()} giải quyết “${selectedOption(
    problemStep,
  ).title.toLowerCase()}” bằng ${selectedOption(solutionStep).title.toLowerCase()}.`
})

const executionPlan = computed(() => [
  {
    title: 'Tuần 1: MVP',
    detail: 'Dựng core flow, landing và onboarding 3 bước để người dùng thấy giá trị ngay.',
  },
  {
    title: 'Tuần 2: Validation',
    detail: 'Mời 10 người dùng thử, đo activation và ghi nhận phản hồi định tính.',
  },
  {
    title: 'Tuần 3: Monetization',
    detail: `Ra mắt mô hình ${selectedOption(pricingStep).title.toLowerCase()} kèm gói dùng thử 14 ngày.`,
  },
])

const pitchSlides = computed(() => [
  {
    title: 'Slide 1 - Problem',
    lines: [selectedOption(problemStep).description, selectedOption(problemStep).impact],
  },
  {
    title: 'Slide 2 - Solution',
    lines: [selectedOption(solutionStep).description, selectedOption(solutionStep).impact],
  },
  {
    title: 'Slide 3 - Market',
    lines: [selectedOption(marketStep).description, selectedOption(marketStep).impact],
  },
  {
    title: 'Slide 4 - Business Model',
    lines: [selectedOption(pricingStep).description, selectedOption(pricingStep).impact],
  },
  {
    title: 'Slide 5 - Go To Market',
    lines: [selectedOption(channelStep).description, selectedOption(channelStep).impact],
  },
])

const onePagerText = computed(() => {
  const lines: string[] = [
    `PROJECT NAME: ${startupName.value}`,
    oneLiner.value,
    '',
    `GO TO MARKET: ${selectedOption(channelStep).description}`,
    `IMPACT: ${selectedOption(channelStep).impact}`,
    '',
    'EXECUTION PLAN:',
    ...executionPlan.value.map((item) => `- ${item.title}: ${item.detail}`),
  ]
  return lines.join('\n')
})

function randomIdea(): void {
  for (const step of steps) {
    const randomIndex = Math.floor(Math.random() * step.options.length)
    const option = step.options[randomIndex]
    if (option) {
      selections[step.key] = option.id
    }
  }
}

async function copyOnePager(): Promise<void> {
  try {
    await navigator.clipboard.writeText(onePagerText.value)
    copyFeedback.value = 'Đã copy one-pager'
  } catch {
    const textArea = document.createElement('textarea')
    textArea.value = onePagerText.value
    textArea.setAttribute('readonly', 'true')
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    copyFeedback.value = 'Đã copy one-pager'
  } finally {
    window.setTimeout(() => {
      copyFeedback.value = 'Sao chép one-pager'
    }, 1600)
  }
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep px-4 py-10 text-text-primary sm:px-6 lg:px-8">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <header class="animate-fade-up border border-border-default bg-bg-surface p-6 sm:p-8">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <p class="font-display text-sm tracking-[0.2em] text-accent-amber">
              // VIBE STARTUP STUDIO
            </p>
            <h1
              class="mt-3 font-display text-4xl font-bold tracking-tight text-text-primary sm:text-6xl"
            >
              Build-a-Startup in 5 Minutes
            </h1>
          </div>
          <div
            class="shrink-0 bg-accent-coral px-3 py-1.5 font-display text-xs font-bold tracking-widest text-bg-deep"
          >
            VOL.01 / 2026
          </div>
        </div>
        <p class="max-w-3xl text-sm text-text-secondary sm:text-base">
          Chọn nhanh 5 quyết định cốt lõi để ra ngay startup one-pager và pitch deck 5 slide. Tất cả
          chạy local trong trình duyệt, không cần backend.
        </p>
        <div class="mt-5 flex flex-wrap items-center gap-3 text-xs font-medium text-text-dim">
          <span class="border border-border-default bg-bg-deep px-3 py-1">No Database</span>
          <span class="border border-border-default bg-bg-deep px-3 py-1">Mobile Ready</span>
          <span class="border border-border-default bg-bg-deep px-3 py-1">Community Friendly</span>
        </div>
      </header>

      <div class="animate-fade-up animate-delay-2 flex gap-1.5">
        <span v-for="dot in 40" :key="dot" class="h-1 w-1 rounded-full bg-border-default" />
      </div>

      <section class="grid animate-fade-up animate-delay-3 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div class="border border-border-default bg-bg-surface p-5 sm:p-6">
          <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 class="flex items-center gap-3 font-display text-2xl font-semibold">
              <span class="text-sm tracking-widest text-accent-coral">//</span>
              Startup Builder
            </h2>
            <button
              type="button"
              class="inline-flex items-center border border-accent-amber bg-bg-deep px-3 py-2 font-display text-xs tracking-widest text-accent-amber transition-all duration-300 hover:bg-bg-elevated"
              @click="randomIdea"
            >
              Random Idea
            </button>
          </div>

          <div class="space-y-5">
            <article
              v-for="step in steps"
              :key="step.key"
              class="border border-border-default bg-bg-deep p-4 transition-all duration-300 hover:bg-bg-elevated"
            >
              <div class="mb-3 flex items-center justify-between">
                <h3 class="font-display text-lg font-semibold text-text-primary">
                  {{ step.label }}
                </h3>
                <span class="font-display text-xs tracking-widest text-accent-amber">{{
                  step.marker
                }}</span>
              </div>

              <div class="grid gap-2 sm:grid-cols-3">
                <button
                  v-for="option in step.options"
                  :key="option.id"
                  type="button"
                  class="border px-3 py-3 text-left transition-all duration-300"
                  :class="
                    selections[step.key] === option.id
                      ? 'border-accent-coral bg-accent-coral/10 text-text-primary'
                      : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-amber hover:bg-bg-elevated'
                  "
                  @click="pick(step.key, option.id)"
                >
                  <p class="font-display text-sm font-semibold">{{ option.title }}</p>
                  <p class="mt-1 text-xs leading-relaxed">{{ option.description }}</p>
                </button>
              </div>
            </article>
          </div>
        </div>

        <aside class="border border-border-default bg-bg-surface p-5 sm:p-6">
          <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 class="flex items-center gap-3 font-display text-2xl font-semibold">
              <span class="text-sm tracking-widest text-accent-sky">//</span>
              One-Pager
            </h2>
            <button
              type="button"
              class="inline-flex items-center border border-accent-sky bg-bg-deep px-3 py-2 font-display text-xs tracking-widest text-accent-sky transition-all duration-300 hover:bg-bg-elevated"
              @click="copyOnePager"
            >
              {{ copyFeedback }}
            </button>
          </div>

          <div class="space-y-4">
            <div class="border border-border-default bg-bg-deep p-4">
              <p class="text-xs tracking-widest text-accent-coral">PROJECT NAME</p>
              <p class="mt-2 font-display text-2xl font-bold">{{ startupName }}</p>
              <p class="mt-3 text-sm text-text-secondary">{{ oneLiner }}</p>
            </div>

            <div class="border border-border-default bg-bg-deep p-4">
              <p class="text-xs tracking-widest text-accent-amber">GO TO MARKET</p>
              <p class="mt-2 text-sm text-text-secondary">
                {{ selectedOption(channelStep).description }}
              </p>
              <p class="mt-2 text-xs text-text-dim">{{ selectedOption(channelStep).impact }}</p>
            </div>

            <div class="border border-border-default bg-bg-deep p-4">
              <p class="text-xs tracking-widest text-accent-sky">EXECUTION PLAN</p>
              <ul class="mt-3 space-y-2">
                <li
                  v-for="item in executionPlan"
                  :key="item.title"
                  class="text-sm text-text-secondary"
                >
                  <span class="font-display text-text-primary">{{ item.title }}</span>
                  <span class="text-text-dim"> - {{ item.detail }}</span>
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </section>

      <section
        class="animate-fade-up animate-delay-4 border border-border-default bg-bg-surface p-5 sm:p-6"
      >
        <h2 class="mb-6 flex items-center gap-3 font-display text-2xl font-semibold">
          <span class="text-sm tracking-widest text-accent-amber">//</span>
          Pitch Deck Preview (5 slides)
        </h2>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <article
            v-for="slide in pitchSlides"
            :key="slide.title"
            class="group relative border border-border-default bg-bg-deep p-4 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <p
              class="font-display text-sm font-semibold text-text-primary group-hover:text-accent-coral"
            >
              {{ slide.title }}
            </p>
            <ul class="mt-3 space-y-2 text-xs leading-relaxed text-text-secondary">
              <li v-for="line in slide.lines" :key="line">{{ line }}</li>
            </ul>
          </article>
        </div>
      </section>

      <footer class="animate-fade-up animate-delay-5 flex flex-wrap items-center gap-3">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition-all duration-300 hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
        >
          &larr; Về trang chủ
        </RouterLink>
        <p class="text-xs text-text-dim">Made for vibe.j2team.org community challenge.</p>
      </footer>
    </div>
  </div>
</template>
