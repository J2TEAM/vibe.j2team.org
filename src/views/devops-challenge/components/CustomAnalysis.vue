<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { TechCategory, TechProfile, SystemMetrics } from '../types'
import { CATEGORY_LABELS } from '../types'
import { techMap } from '../data/technologies'

const props = defineProps<{
  selectedTechs: Map<TechCategory, string>
  systemMetrics: SystemMetrics
  warnings: string[]
  synergyPairs: Array<{ a: string; b: string }>
  conflictPairs: Array<{ a: string; b: string }>
}>()

const selectedProfiles = computed<TechProfile[]>(() => {
  const profiles: TechProfile[] = []
  for (const techId of props.selectedTechs.values()) {
    const tech = techMap.get(techId)
    if (tech) profiles.push(tech)
  }
  return profiles
})

const hasSelection = computed(() => selectedProfiles.value.length > 0)

// Determine suitable project types based on selected stack
const suitableProjects = computed(() => {
  const projects: Array<{ name: string; icon: string; reason: string }> = []
  const m = props.systemMetrics
  const cats = new Set(props.selectedTechs.keys())

  if (m.throughput >= 10000 && m.reliability >= 95) {
    projects.push({
      name: 'Hệ thống lớn (100K+ users)',
      icon: 'lucide:building-2',
      reason: `Throughput ${m.throughput.toLocaleString()} req/s và reliability ${m.reliability}% đủ cho hệ thống lớn`,
    })
  }

  if (m.latency <= 50 && cats.has('cache')) {
    projects.push({
      name: 'Ứng dụng realtime (chat, game)',
      icon: 'lucide:message-circle',
      reason: `Latency ${m.latency}ms rất thấp, có cache hỗ trợ phản hồi nhanh`,
    })
  }

  if (m.security >= 70 && cats.has('security')) {
    projects.push({
      name: 'Fintech / Thanh toán',
      icon: 'lucide:credit-card',
      reason: `Bảo mật ${m.security}/100 với công cụ security chuyên dụng`,
    })
  }

  if (m.cost <= 100 && m.throughput > 0) {
    projects.push({
      name: 'Startup / MVP',
      icon: 'lucide:rocket',
      reason: `Chi phí thấp $${m.cost}/tháng, phù hợp giai đoạn đầu`,
    })
  }

  if (cats.has('cdn') && cats.has('frontend')) {
    projects.push({
      name: 'Website nội dung (blog, tin tức)',
      icon: 'lucide:newspaper',
      reason: 'CDN + Frontend tĩnh cho tải trang nhanh toàn cầu',
    })
  }

  if (cats.has('message-queue') && cats.has('container')) {
    projects.push({
      name: 'Microservices / Distributed System',
      icon: 'lucide:network',
      reason: 'Message Queue + Container cho kiến trúc phân tán',
    })
  }

  if (m.throughput >= 5000 && cats.has('database') && cats.has('load-balancer')) {
    projects.push({
      name: 'E-commerce / Marketplace',
      icon: 'lucide:shopping-cart',
      reason: `Throughput cao ${m.throughput.toLocaleString()} req/s với LB và database`,
    })
  }

  if (cats.has('monitoring') && cats.has('ci-cd')) {
    projects.push({
      name: 'SaaS Enterprise',
      icon: 'lucide:cloud',
      reason: 'Monitoring + CI/CD cho vận hành chuyên nghiệp',
    })
  }

  if (projects.length === 0 && m.throughput > 0) {
    projects.push({
      name: 'Dự án cá nhân / Học tập',
      icon: 'lucide:graduation-cap',
      reason: 'Stack cơ bản phù hợp cho dự án nhỏ và thực hành',
    })
  }

  return projects
})

// Generate pros and cons for each selected tech
const techAnalysis = computed(() => {
  return selectedProfiles.value.map((tech) => {
    const pros: string[] = []
    const cons: string[] = []

    // Performance
    if (tech.metrics.throughput >= 10000) {
      pros.push('Throughput cao, xử lý được nhiều request')
    } else if (tech.metrics.throughput > 0 && tech.metrics.throughput < 3000) {
      cons.push('Throughput thấp, cần cân nhắc khi scale')
    }

    if (tech.metrics.latency <= 5) {
      pros.push('Latency rất thấp, phản hồi nhanh')
    } else if (tech.metrics.latency >= 20) {
      cons.push(`Latency cao (${tech.metrics.latency}ms), ảnh hưởng trải nghiệm`)
    }

    // Security
    if (tech.metrics.security >= 80) {
      pros.push('Bảo mật tốt')
    } else if (tech.metrics.security <= 40 && tech.category !== 'frontend') {
      cons.push('Bảo mật cơ bản, cần bổ sung công cụ security')
    }

    // Cost
    if (tech.metrics.cost === 0) {
      pros.push('Miễn phí / Open source')
    } else if (tech.metrics.cost >= 200) {
      cons.push(`Chi phí cao ($${tech.metrics.cost}/tháng)`)
    }

    // Complexity
    if (tech.complexity <= 2) {
      pros.push('Dễ học, dễ triển khai')
    } else if (tech.complexity >= 4) {
      cons.push('Phức tạp, cần kinh nghiệm để triển khai đúng')
    }

    // Reliability
    if (tech.metrics.reliability >= 99) {
      pros.push(`Độ tin cậy rất cao (${tech.metrics.reliability}%)`)
    }

    // Scaling
    if (tech.metrics.scalingFactor >= 2.0) {
      pros.push('Scale tốt theo chiều ngang')
    }

    // Synergies with currently selected
    const synergiesInStack = tech.synergies.filter((s) => {
      for (const id of props.selectedTechs.values()) {
        if (id === s) return true
      }
      return false
    })
    if (synergiesInStack.length > 0) {
      const names = synergiesInStack.map((s) => techMap.get(s)?.nameVi ?? s).join(', ')
      pros.push(`Tương thích tốt với ${names}`)
    }

    // Conflicts with currently selected
    const conflictsInStack = tech.conflicts.filter((c) => {
      for (const id of props.selectedTechs.values()) {
        if (id === c) return true
      }
      return false
    })
    if (conflictsInStack.length > 0) {
      const names = conflictsInStack.map((c) => techMap.get(c)?.nameVi ?? c).join(', ')
      cons.push(`Xung đột với ${names}`)
    }

    // Tags
    if (tech.tags.includes('hot')) {
      pros.push('Phổ biến, cộng đồng lớn, dễ tuyển dev')
    }

    return {
      tech,
      pros,
      cons,
    }
  })
})

const overallPros = computed(() => {
  const pros: string[] = []
  if (props.synergyPairs.length > 0) {
    pros.push(
      `${props.synergyPairs.length} cặp synergy tăng hiệu suất +${props.synergyPairs.length * 8}%`,
    )
  }
  if (props.systemMetrics.cost === 0 && hasSelection.value) {
    pros.push('Hoàn toàn miễn phí')
  } else if (props.systemMetrics.cost <= 50 && hasSelection.value) {
    pros.push(`Chi phí thấp ($${props.systemMetrics.cost}/tháng)`)
  }
  if (props.systemMetrics.reliability >= 98) {
    pros.push(`Độ tin cậy cao (${props.systemMetrics.reliability}%)`)
  }
  return pros
})

const overallCons = computed(() => {
  const cons: string[] = []
  if (props.conflictPairs.length > 0) {
    cons.push(
      `${props.conflictPairs.length} xung đột làm giảm hiệu suất -${props.conflictPairs.length * 10}%`,
    )
  }
  if (props.warnings.length > 0) {
    for (const w of props.warnings) {
      cons.push(w)
    }
  }
  if (props.systemMetrics.security > 0 && props.systemMetrics.security < 50) {
    cons.push('Bảo mật thấp, cần bổ sung công cụ bảo vệ')
  }
  return cons
})
</script>

<template>
  <div class="space-y-4">
    <!-- Empty state -->
    <div v-if="!hasSelection" class="border border-border-default bg-bg-surface p-8 text-center">
      <Icon icon="lucide:mouse-pointer-click" class="mx-auto size-10 text-text-dim/30" />
      <p class="mt-3 text-sm text-text-dim">
        Chọn công nghệ từ các danh mục bên trên để xem phân tích
      </p>
    </div>

    <template v-else>
      <!-- Overall metrics -->
      <div class="border border-border-default bg-bg-surface overflow-hidden">
        <div
          class="flex items-center gap-2 border-b border-border-default bg-bg-deep/50 px-4 py-2.5"
        >
          <Icon icon="lucide:gauge" class="size-4 text-accent-sky" />
          <h3 class="font-display text-xs font-bold uppercase tracking-wider text-text-secondary">
            Thông số hệ thống
          </h3>
        </div>
        <div class="grid grid-cols-3 sm:grid-cols-5 divide-x divide-border-default">
          <div class="p-3 text-center">
            <div class="text-[10px] text-text-dim">Throughput</div>
            <div class="font-display text-sm font-bold tabular-nums text-text-primary">
              {{ systemMetrics.throughput.toLocaleString() }}
            </div>
            <div class="text-[10px] text-text-dim">req/s</div>
          </div>
          <div class="p-3 text-center">
            <div class="text-[10px] text-text-dim">Latency</div>
            <div class="font-display text-sm font-bold tabular-nums text-text-primary">
              {{ systemMetrics.latency }}
            </div>
            <div class="text-[10px] text-text-dim">ms</div>
          </div>
          <div class="p-3 text-center">
            <div class="text-[10px] text-text-dim">Bảo mật</div>
            <div class="font-display text-sm font-bold tabular-nums text-text-primary">
              {{ systemMetrics.security }}
            </div>
            <div class="text-[10px] text-text-dim">/100</div>
          </div>
          <div class="p-3 text-center">
            <div class="text-[10px] text-text-dim">Chi phí</div>
            <div class="font-display text-sm font-bold tabular-nums text-text-primary">
              ${{ systemMetrics.cost }}
            </div>
            <div class="text-[10px] text-text-dim">/tháng</div>
          </div>
          <div class="p-3 text-center">
            <div class="text-[10px] text-text-dim">Tin cậy</div>
            <div class="font-display text-sm font-bold tabular-nums text-text-primary">
              {{ systemMetrics.reliability }}%
            </div>
            <div class="text-[10px] text-text-dim">uptime</div>
          </div>
        </div>
      </div>

      <!-- Overall pros/cons -->
      <div
        v-if="overallPros.length > 0 || overallCons.length > 0"
        class="grid gap-3 sm:grid-cols-2"
      >
        <div v-if="overallPros.length > 0" class="border border-green-500/20 bg-green-500/5 p-3">
          <h4 class="flex items-center gap-1.5 text-xs font-display font-semibold text-green-400">
            <Icon icon="lucide:thumbs-up" class="size-3.5" />
            Ưu điểm tổng thể
          </h4>
          <ul class="mt-2 space-y-1">
            <li
              v-for="(pro, i) in overallPros"
              :key="i"
              class="flex items-start gap-1.5 text-xs text-text-secondary leading-relaxed"
            >
              <span class="mt-1 size-1 shrink-0 bg-green-500" />
              {{ pro }}
            </li>
          </ul>
        </div>
        <div
          v-if="overallCons.length > 0"
          class="border border-accent-coral/20 bg-accent-coral/5 p-3"
        >
          <h4
            class="flex items-center gap-1.5 text-xs font-display font-semibold text-accent-coral"
          >
            <Icon icon="lucide:thumbs-down" class="size-3.5" />
            Nhược điểm
          </h4>
          <ul class="mt-2 space-y-1">
            <li
              v-for="(con, i) in overallCons"
              :key="i"
              class="flex items-start gap-1.5 text-xs text-text-secondary leading-relaxed"
            >
              <span class="mt-1 size-1 shrink-0 bg-accent-coral" />
              {{ con }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Suitable projects -->
      <div
        v-if="suitableProjects.length > 0"
        class="border border-border-default bg-bg-surface overflow-hidden"
      >
        <div
          class="flex items-center gap-2 border-b border-border-default bg-bg-deep/50 px-4 py-2.5"
        >
          <Icon icon="lucide:target" class="size-4 text-accent-amber" />
          <h3 class="font-display text-xs font-bold uppercase tracking-wider text-text-secondary">
            Phù hợp với dự án
          </h3>
        </div>
        <div class="divide-y divide-border-default">
          <div
            v-for="project in suitableProjects"
            :key="project.name"
            class="flex items-start gap-3 p-3"
          >
            <div
              class="flex size-8 shrink-0 items-center justify-center border border-accent-amber/20 bg-accent-amber/5"
            >
              <Icon :icon="project.icon" class="size-4 text-accent-amber" />
            </div>
            <div>
              <div class="text-sm font-semibold text-text-primary">{{ project.name }}</div>
              <div class="mt-0.5 text-xs text-text-secondary leading-relaxed">
                {{ project.reason }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Per-tech analysis -->
      <div class="border border-border-default bg-bg-surface overflow-hidden">
        <div
          class="flex items-center gap-2 border-b border-border-default bg-bg-deep/50 px-4 py-2.5"
        >
          <Icon icon="lucide:scan-search" class="size-4 text-accent-coral" />
          <h3 class="font-display text-xs font-bold uppercase tracking-wider text-text-secondary">
            Phân tích từng công nghệ
          </h3>
        </div>
        <div class="divide-y divide-border-default">
          <div v-for="item in techAnalysis" :key="item.tech.id" class="p-3">
            <div class="flex items-center gap-2">
              <Icon :icon="item.tech.icon" class="size-4" />
              <span class="font-display text-sm font-bold text-text-primary">{{
                item.tech.nameVi
              }}</span>
              <span class="text-[10px] text-text-dim">{{
                CATEGORY_LABELS[item.tech.category]
              }}</span>
            </div>
            <div class="mt-2 grid gap-2 sm:grid-cols-2">
              <div v-if="item.pros.length > 0">
                <ul class="space-y-0.5">
                  <li
                    v-for="(pro, i) in item.pros"
                    :key="i"
                    class="flex items-start gap-1.5 text-[11px] text-green-400 leading-relaxed"
                  >
                    <Icon icon="lucide:plus" class="mt-0.5 size-2.5 shrink-0" />
                    <span class="text-text-secondary">{{ pro }}</span>
                  </li>
                </ul>
              </div>
              <div v-if="item.cons.length > 0">
                <ul class="space-y-0.5">
                  <li
                    v-for="(con, i) in item.cons"
                    :key="i"
                    class="flex items-start gap-1.5 text-[11px] text-accent-coral leading-relaxed"
                  >
                    <Icon icon="lucide:minus" class="mt-0.5 size-2.5 shrink-0" />
                    <span class="text-text-secondary">{{ con }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
