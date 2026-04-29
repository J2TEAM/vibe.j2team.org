<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useClipboard, usePermission } from '@vueuse/core'
import LabQuickGuide from './components/LabQuickGuide.vue'
import ExtraPermissionsPanel from './components/ExtraPermissionsPanel.vue'

type PermissionKey = 'camera' | 'microphone' | 'geolocation' | 'clipboard'
type NativePermissionState = 'granted' | 'prompt' | 'denied'
type BrowserPermissionState = NativePermissionState | 'unsupported'
type RiskVector = 'data' | 'tracking' | 'exploit'

interface PermissionCard {
  id: PermissionKey
  label: string
  icon: string
  summary: string
  riskWeight: number
  vectors: Record<RiskVector, number>
  leakExamples: string[]
}

interface RadarAxis {
  key: RiskVector
  label: string
  angle: number
}

interface RiskPreset {
  id: string
  label: string
  description: string
  toggles: Record<PermissionKey, boolean>
}

interface RiskHistoryPoint {
  id: number
  score: number
}

interface ActivityLogEntry {
  id: number
  time: string
  message: string
  tone: 'info' | 'good' | 'warn'
}

const permissionCards: PermissionCard[] = [
  {
    id: 'camera',
    label: 'Camera',
    icon: 'lucide:camera',
    summary: 'Nhận diện khuôn mặt, môi trường làm việc và hành vi trước màn hình.',
    riskWeight: 32,
    vectors: {
      data: 38,
      tracking: 28,
      exploit: 20,
    },
    leakExamples: ['Bối cảnh phòng làm việc', 'Thói quen giờ giấc', 'Khuôn mặt và cảm xúc'],
  },
  {
    id: 'microphone',
    label: 'Microphone',
    icon: 'lucide:mic',
    summary: 'Lộ nội dung hội thoại, giọng nói và thông tin cá nhân nói ra ngoài ý muốn.',
    riskWeight: 28,
    vectors: {
      data: 30,
      tracking: 20,
      exploit: 30,
    },
    leakExamples: ['Nội dung cuộc gọi', 'Giọng nói định danh', 'Thông tin nhạy cảm vô tình đọc to'],
  },
  {
    id: 'geolocation',
    label: 'Location',
    icon: 'lucide:map-pin',
    summary: 'Suy luận nơi ở, tuyến đường đi lại và lịch sinh hoạt theo vị trí.',
    riskWeight: 24,
    vectors: {
      data: 18,
      tracking: 38,
      exploit: 16,
    },
    leakExamples: [
      'Địa điểm thường lui tới',
      'Khung giờ di chuyển',
      'Suy đoán nơi ở hoặc nơi làm việc',
    ],
  },
  {
    id: 'clipboard',
    label: 'Clipboard',
    icon: 'lucide:clipboard',
    summary: 'Có thể đọc dữ liệu bạn vừa copy như OTP, token hoặc đường dẫn nội bộ.',
    riskWeight: 16,
    vectors: {
      data: 14,
      tracking: 10,
      exploit: 34,
    },
    leakExamples: ['Mã OTP vừa copy', 'Link nội bộ công ty', 'Token hoặc mã API dán nhầm'],
  },
]

const toggles = reactive<Record<PermissionKey, boolean>>({
  camera: false,
  microphone: false,
  geolocation: false,
  clipboard: false,
})

const cameraPermission = usePermission('camera')
const microphonePermission = usePermission('microphone')
const geolocationPermission = usePermission('geolocation')
const clipboardPermission = usePermission('clipboard-read')

const feedbackMessage = ref('')
const { copy: copyReportToClipboard, copied: reportCopied } = useClipboard()

const riskPresets: RiskPreset[] = [
  {
    id: 'meeting',
    label: 'Remote Meeting',
    description: 'Bật camera + mic để mô phỏng một phiên họp trực tuyến.',
    toggles: {
      camera: true,
      microphone: true,
      geolocation: false,
      clipboard: false,
    },
  },
  {
    id: 'travel',
    label: 'Navigation',
    description: 'Bật location để mô phỏng app điều hướng hoặc gọi xe.',
    toggles: {
      camera: false,
      microphone: false,
      geolocation: true,
      clipboard: false,
    },
  },
  {
    id: 'otp',
    label: 'Copy OTP',
    description: 'Bật clipboard để mô phỏng thao tác copy/paste mã xác thực.',
    toggles: {
      camera: false,
      microphone: false,
      geolocation: false,
      clipboard: true,
    },
  },
  {
    id: 'high-exposure',
    label: 'High Exposure',
    description: 'Bật toàn bộ quyền để quan sát mức rủi ro cao nhất trong lab.',
    toggles: {
      camera: true,
      microphone: true,
      geolocation: true,
      clipboard: true,
    },
  },
]

const selectedPresetId = ref<string>('custom')
const riskHistory = ref<RiskHistoryPoint[]>([])
const activityLog = ref<ActivityLogEntry[]>([])

let riskHistorySequence = 0
let activityLogSequence = 0

const stateMultiplier: Record<BrowserPermissionState, number> = {
  granted: 1,
  prompt: 0.65,
  denied: 0.25,
  unsupported: 0,
}

const maxRiskWeight = permissionCards.reduce((total, card) => total + card.riskWeight, 0)

const maxVectorWeight = permissionCards.reduce(
  (total, card) => {
    total.data += card.vectors.data
    total.tracking += card.vectors.tracking
    total.exploit += card.vectors.exploit
    return total
  },
  { data: 0, tracking: 0, exploit: 0 } as Record<RiskVector, number>,
)

const radarAxes: RadarAxis[] = [
  { key: 'data', label: 'DATA', angle: -90 },
  { key: 'tracking', label: 'TRACKING', angle: 30 },
  { key: 'exploit', label: 'EXPLOIT', angle: 150 },
]

const radarCenter = 120
const radarRadius = 90
const ringLevels = [0.25, 0.5, 0.75, 1]

const activePermissionCount = computed(
  () => permissionCards.filter((card) => toggles[card.id]).length,
)

const grantedPermissionCount = computed(
  () =>
    permissionCards.filter((card) => {
      if (!toggles[card.id]) {
        return false
      }
      return getPermissionState(card.id) === 'granted'
    }).length,
)

const totalRiskScore = computed(() => {
  let total = 0

  for (const card of permissionCards) {
    if (!toggles[card.id]) {
      continue
    }

    const multiplier = stateMultiplier[getPermissionState(card.id)]
    total += card.riskWeight * multiplier
  }

  return Math.round((total / maxRiskWeight) * 100)
})

const vectorScores = computed<Record<RiskVector, number>>(() => {
  const current: Record<RiskVector, number> = {
    data: 0,
    tracking: 0,
    exploit: 0,
  }

  for (const card of permissionCards) {
    if (!toggles[card.id]) {
      continue
    }

    const multiplier = stateMultiplier[getPermissionState(card.id)]
    current.data += card.vectors.data * multiplier
    current.tracking += card.vectors.tracking * multiplier
    current.exploit += card.vectors.exploit * multiplier
  }

  return {
    data: Math.round((current.data / maxVectorWeight.data) * 100),
    tracking: Math.round((current.tracking / maxVectorWeight.tracking) * 100),
    exploit: Math.round((current.exploit / maxVectorWeight.exploit) * 100),
  }
})

const riskLevel = computed(() => {
  if (totalRiskScore.value >= 70) {
    return {
      label: 'Rủi ro cao',
      classes: 'border-accent-coral bg-accent-coral/10 text-accent-coral',
      tip: 'Chỉ giữ quyền thực sự cần thiết và thu hẹp thời gian cấp quyền.',
    }
  }

  if (totalRiskScore.value >= 40) {
    return {
      label: 'Rủi ro trung bình',
      classes: 'border-accent-amber bg-accent-amber/10 text-accent-amber',
      tip: 'Bạn nên giới hạn số quyền bật đồng thời để giảm bề mặt lộ dữ liệu.',
    }
  }

  return {
    label: 'Rủi ro thấp',
    classes: 'border-accent-sky bg-accent-sky/10 text-accent-sky',
    tip: 'Tiếp tục duy trì nguyên tắc cấp quyền tối thiểu theo ngữ cảnh.',
  }
})

const metricCards = computed(() => [
  {
    key: 'data' as RiskVector,
    label: 'Data Surface',
    score: vectorScores.value.data,
    description: 'Lượng dữ liệu thô có thể bị thu thập.',
  },
  {
    key: 'tracking' as RiskVector,
    label: 'Tracking Surface',
    score: vectorScores.value.tracking,
    description: 'Khả năng suy luận hành vi và lịch sinh hoạt.',
  },
  {
    key: 'exploit' as RiskVector,
    label: 'Exploit Surface',
    score: vectorScores.value.exploit,
    description: 'Khả năng lạm dụng dữ liệu cho tấn công xã hội.',
  },
])

const activeLeakExamples = computed(() => {
  const leaks = new Set<string>()

  for (const card of permissionCards) {
    if (!toggles[card.id]) {
      continue
    }

    const multiplier = stateMultiplier[getPermissionState(card.id)]

    if (multiplier < 0.5) {
      continue
    }

    for (const leak of card.leakExamples) {
      leaks.add(`${card.label}: ${leak}`)
    }
  }

  return Array.from(leaks).slice(0, 9)
})

const rankedPermissionRisk = computed(() =>
  permissionCards
    .map((card) => {
      const multiplier = toggles[card.id] ? stateMultiplier[getPermissionState(card.id)] : 0

      return {
        id: card.id,
        label: card.label,
        state: getPermissionState(card.id),
        score: Math.round(card.riskWeight * multiplier),
      }
    })
    .sort((a, b) => b.score - a.score),
)

const activePresetDescription = computed(() => {
  if (selectedPresetId.value === 'custom') {
    return 'Bạn đang ở chế độ custom. Có thể bật/tắt thủ công từng quyền.'
  }

  const preset = riskPresets.find((item) => item.id === selectedPresetId.value)
  return preset?.description ?? 'Preset không tồn tại.'
})

const recommendedActions = computed(() => {
  const actions: string[] = []

  if (activePermissionCount.value === 0) {
    actions.push('Bật từng quyền một để quan sát biểu đồ thay đổi theo thời gian thực.')
  }

  const hasMedia = permissionCards.some(
    (card) =>
      toggles[card.id] &&
      getPermissionState(card.id) === 'granted' &&
      (card.id === 'camera' || card.id === 'microphone'),
  )

  if (hasMedia) {
    actions.push('Tắt camera/mic ngay sau khi dùng xong, tránh mở nền quá lâu.')
  }

  const hasLocation = toggles.geolocation && getPermissionState('geolocation') === 'granted'
  if (hasLocation) {
    actions.push('Chỉ cấp vị trí khi thao tác cần bản đồ hoặc giao vận theo phiên ngắn.')
  }

  const hasClipboard = toggles.clipboard && getPermissionState('clipboard') === 'granted'
  if (hasClipboard) {
    actions.push('Tránh copy OTP, token và mật khẩu vào clipboard khi không cần thiết.')
  }

  if (actions.length === 0) {
    actions.push('Giữ nguyên nguyên tắc least privilege: đúng quyền, đúng lúc, đúng mục đích.')
  }

  return actions.slice(0, 4)
})

const riskHistoryTrend = computed(() => {
  if (riskHistory.value.length < 2) {
    return 'Ổn định'
  }

  const current = riskHistory.value[riskHistory.value.length - 1]
  const previous = riskHistory.value[riskHistory.value.length - 2]

  if (!current || !previous) {
    return 'Ổn định'
  }

  const diff = current.score - previous.score
  if (diff > 0) {
    return `Tăng +${diff}`
  }

  if (diff < 0) {
    return `Giảm ${diff}`
  }

  return 'Không đổi'
})

const riskReport = computed(() => {
  const activePermissions = permissionCards
    .filter((card) => toggles[card.id])
    .map((card) => `${card.label} (${permissionStateLabel(getPermissionState(card.id))})`)

  const topRisks = rankedPermissionRisk.value
    .filter((item) => item.score > 0)
    .slice(0, 2)
    .map((item) => `${item.label}: ${item.score}`)

  return [
    'Permission Leak Lab Report',
    `Risk Score: ${totalRiskScore.value}/100 (${riskLevel.value.label})`,
    `Active Permissions: ${activePermissions.join(', ') || 'Không có'}`,
    `Top Risks: ${topRisks.join(', ') || 'Không có'}`,
    `Khuyến nghị: ${recommendedActions.value[0] ?? 'Giữ nguyên least privilege.'}`,
  ].join('\n')
})

const radarPolygon = computed(() =>
  radarAxes
    .map((axis) => {
      const score = vectorScores.value[axis.key]
      const point = getRadarPoint(axis.angle, score / 100)
      return `${point.x},${point.y}`
    })
    .join(' '),
)

const axisMeta = radarAxes.map((axis) => {
  const endPoint = getRadarPoint(axis.angle, 1)
  const labelPoint = getRadarPoint(axis.angle, 1.17)

  return {
    ...axis,
    endPoint,
    labelPoint,
  }
})

const toggleFingerprint = computed(() =>
  permissionCards.map((card) => `${card.id}:${toggles[card.id] ? 1 : 0}`).join('|'),
)

function normalizeState(value: string | undefined): BrowserPermissionState {
  if (value === 'granted' || value === 'prompt' || value === 'denied') {
    return value
  }

  return 'unsupported'
}

function getPermissionState(id: PermissionKey): BrowserPermissionState {
  if (id === 'camera') {
    return normalizeState(cameraPermission.value)
  }

  if (id === 'microphone') {
    return normalizeState(microphonePermission.value)
  }

  if (id === 'geolocation') {
    return normalizeState(geolocationPermission.value)
  }

  return normalizeState(clipboardPermission.value)
}

function permissionStateLabel(state: BrowserPermissionState): string {
  if (state === 'granted') {
    return 'granted'
  }

  if (state === 'prompt') {
    return 'prompt'
  }

  if (state === 'denied') {
    return 'denied'
  }

  return 'unsupported'
}

function permissionStateClass(state: BrowserPermissionState): string {
  if (state === 'granted') {
    return 'border-accent-coral bg-accent-coral/10 text-accent-coral'
  }

  if (state === 'prompt') {
    return 'border-accent-amber bg-accent-amber/10 text-accent-amber'
  }

  if (state === 'denied') {
    return 'border-accent-sky bg-accent-sky/10 text-accent-sky'
  }

  return 'border-border-default bg-bg-deep text-text-dim'
}

function metricBarClass(key: RiskVector): string {
  if (key === 'data') {
    return 'bg-accent-coral'
  }

  if (key === 'tracking') {
    return 'bg-accent-amber'
  }

  return 'bg-accent-sky'
}

function getRadarPoint(angle: number, scale: number): { x: number; y: number } {
  const angleInRadian = (angle * Math.PI) / 180

  return {
    x: radarCenter + Math.cos(angleInRadian) * radarRadius * scale,
    y: radarCenter + Math.sin(angleInRadian) * radarRadius * scale,
  }
}

function getRingPolygon(level: number): string {
  return radarAxes
    .map((axis) => {
      const point = getRadarPoint(axis.angle, level)
      return `${point.x},${point.y}`
    })
    .join(' ')
}

function getTimeLabel(): string {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date())
}

function addActivity(message: string, tone: ActivityLogEntry['tone'] = 'info'): void {
  activityLogSequence += 1

  activityLog.value = [
    {
      id: activityLogSequence,
      time: getTimeLabel(),
      message,
      tone,
    },
    ...activityLog.value,
  ].slice(0, 12)
}

function pushRiskHistory(score: number): void {
  riskHistorySequence += 1

  riskHistory.value = [
    ...riskHistory.value,
    {
      id: riskHistorySequence,
      score,
    },
  ].slice(-16)
}

function activityToneClass(tone: ActivityLogEntry['tone']): string {
  if (tone === 'good') {
    return 'text-accent-sky'
  }

  if (tone === 'warn') {
    return 'text-accent-coral'
  }

  return 'text-accent-amber'
}

function detectPresetId(): string {
  for (const preset of riskPresets) {
    const isSame = permissionCards.every((card) => toggles[card.id] === preset.toggles[card.id])
    if (isSame) {
      return preset.id
    }
  }

  return 'custom'
}

function applyPreset(presetId: string): void {
  const preset = riskPresets.find((item) => item.id === presetId)
  if (!preset) {
    return
  }

  for (const key of Object.keys(toggles) as PermissionKey[]) {
    toggles[key] = preset.toggles[key]
  }

  selectedPresetId.value = preset.id
  feedbackMessage.value = `Đã áp dụng preset ${preset.label}.`
  addActivity(`Áp dụng preset ${preset.label}.`, 'info')
}

function resetWorkspace(): void {
  for (const key of Object.keys(toggles) as PermissionKey[]) {
    toggles[key] = false
  }

  selectedPresetId.value = 'custom'
  feedbackMessage.value = 'Đã reset workspace về trạng thái an toàn (không bật mô phỏng).'
  addActivity('Đã reset workspace về trạng thái an toàn.', 'warn')
}

async function copyRiskReport(): Promise<void> {
  await copyReportToClipboard(riskReport.value)
  feedbackMessage.value = 'Đã copy báo cáo rủi ro vào clipboard.'
  addActivity('Đã copy báo cáo rủi ro.', 'good')
}

async function requestPermission(id: PermissionKey): Promise<void> {
  feedbackMessage.value = ''

  const targetCard = permissionCards.find((card) => card.id === id)
  if (!targetCard) {
    return
  }

  try {
    if (id === 'camera') {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ camera API.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((track) => track.stop())
    }

    if (id === 'microphone') {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ microphone API.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
    }

    if (id === 'geolocation') {
      if (!navigator.geolocation) {
        throw new Error('Trình duyệt không hỗ trợ geolocation API.')
      }

      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(),
          (error: GeolocationPositionError) => reject(new Error(error.message)),
          {
            timeout: 10000,
          },
        )
      })
    }

    if (id === 'clipboard') {
      if (!navigator.clipboard?.readText) {
        throw new Error('Trình duyệt không hỗ trợ Clipboard read API.')
      }

      await navigator.clipboard.readText()
    }

    feedbackMessage.value = `Đã gửi yêu cầu quyền ${targetCard.label}. Trạng thái có thể cập nhật sau vài giây.`
    addActivity(`Đã yêu cầu quyền ${targetCard.label}.`, 'good')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi chưa xác định.'
    feedbackMessage.value = `Không thể yêu cầu quyền ${targetCard.label}: ${message}`
    addActivity(`Không thể yêu cầu quyền ${targetCard.label}.`, 'warn')
  }
}

watch(toggleFingerprint, () => {
  selectedPresetId.value = detectPresetId()
})

watch(
  totalRiskScore,
  (score, previousScore) => {
    pushRiskHistory(score)

    if (previousScore === undefined) {
      addActivity(`Khởi tạo lab ở mức ${score}/100.`, 'info')
      return
    }

    if (score > previousScore) {
      addActivity(`Risk score tăng từ ${previousScore} lên ${score}.`, 'warn')
    }

    if (score < previousScore) {
      addActivity(`Risk score giảm từ ${previousScore} xuống ${score}.`, 'good')
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 sm:py-14">
      <header class="animate-fade-up border border-border-default bg-bg-surface p-6 sm:p-8">
        <p class="font-display text-xs tracking-widest text-accent-sky">// learn lab</p>
        <h1 class="mt-3 font-display text-4xl font-bold text-accent-coral sm:text-6xl">
          Permission Leak Lab
        </h1>
        <p class="mt-4 max-w-3xl text-text-secondary sm:text-lg">
          Bật từng quyền truy cập để xem bề mặt rủi ro thay đổi theo thời gian thực. Trang này tập
          trung vào nhận thức quyền riêng tư trình duyệt, không phải bộ công cụ kỹ thuật tổng hợp.
        </p>

        <div class="mt-6 grid gap-3 sm:grid-cols-3">
          <div class="border border-border-default bg-bg-deep p-3">
            <p class="font-display text-xs tracking-widest text-text-dim">Active Toggles</p>
            <p class="mt-1 font-display text-2xl text-accent-amber">{{ activePermissionCount }}</p>
          </div>
          <div class="border border-border-default bg-bg-deep p-3">
            <p class="font-display text-xs tracking-widest text-text-dim">Granted In Use</p>
            <p class="mt-1 font-display text-2xl text-accent-coral">{{ grantedPermissionCount }}</p>
          </div>
          <div class="border border-border-default bg-bg-deep p-3">
            <p class="font-display text-xs tracking-widest text-text-dim">Total Risk</p>
            <p class="mt-1 font-display text-2xl text-text-primary">{{ totalRiskScore }} / 100</p>
          </div>
        </div>

        <RouterLink
          to="/"
          class="mt-6 inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Về trang chủ
        </RouterLink>
      </header>

      <LabQuickGuide />

      <section class="mt-10 animate-fade-up animate-delay-4">
        <h2
          class="mb-6 flex items-center gap-3 font-display text-2xl font-semibold text-text-primary"
        >
          <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
          Lab Workspace
        </h2>

        <p class="text-sm text-text-secondary sm:text-base">
          Trải nghiệm chính của lab: bật/tắt mô phỏng bên trái, theo dõi thay đổi điểm và đồ thị rủi
          ro bên phải. Trên mobile, các khối sẽ tự xếp dọc để thao tác dễ hơn.
        </p>

        <div class="mt-4 border border-border-default bg-bg-surface p-4">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div class="xl:max-w-3xl">
              <p class="font-display text-xs tracking-widest text-text-dim">QUICK PRESETS</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="preset in riskPresets"
                  :key="preset.id"
                  type="button"
                  class="border px-3 py-2 font-display text-xs tracking-widest transition"
                  :class="
                    selectedPresetId === preset.id
                      ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                      : 'border-border-default bg-bg-deep text-text-secondary hover:border-accent-amber hover:text-text-primary'
                  "
                  @click="applyPreset(preset.id)"
                >
                  {{ preset.label }}
                </button>
              </div>
              <p class="mt-2 text-xs text-text-dim">
                {{ activePresetDescription }}
              </p>
            </div>

            <div class="flex flex-wrap gap-2 xl:justify-end">
              <button
                type="button"
                class="inline-flex items-center gap-2 border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
                @click="copyRiskReport"
              >
                <Icon :icon="reportCopied ? 'lucide:check' : 'lucide:copy'" class="size-4" />
                {{ reportCopied ? 'Đã copy report' : 'Copy risk report' }}
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-2 border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="resetWorkspace"
              >
                <Icon icon="lucide:rotate-ccw" class="size-4" />
                Reset workspace
              </button>
            </div>
          </div>
        </div>

        <div class="mt-4 grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
          <article class="border border-border-default bg-bg-surface p-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <p class="font-display text-xs tracking-widest text-text-dim">
                TOGGLE QUYỀN TRUY CẬP
              </p>
              <p class="font-display text-xs tracking-widest text-accent-amber">
                {{ activePermissionCount }} quyền đang bật mô phỏng
              </p>
            </div>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <article
                v-for="card in permissionCards"
                :key="card.id"
                class="border border-border-default bg-bg-deep p-4 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral"
              >
                <div class="flex items-start gap-3">
                  <div class="border border-border-default bg-bg-surface p-2 text-accent-amber">
                    <Icon :icon="card.icon" class="size-5" />
                  </div>
                  <div>
                    <h3 class="font-display text-lg text-text-primary">{{ card.label }}</h3>
                    <p class="mt-1 text-sm text-text-secondary">{{ card.summary }}</p>
                  </div>
                </div>

                <div class="mt-4 border border-border-default bg-bg-surface p-3">
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <label class="inline-flex items-center gap-2 text-sm text-text-primary">
                      <input
                        v-model="toggles[card.id]"
                        type="checkbox"
                        class="size-4 border border-border-default bg-bg-elevated accent-accent-coral"
                      />
                      Bật mô phỏng truy cập
                    </label>
                    <span
                      class="w-fit border px-2 py-1 font-display text-xs tracking-widest"
                      :class="permissionStateClass(getPermissionState(card.id))"
                    >
                      {{ permissionStateLabel(getPermissionState(card.id)) }}
                    </span>
                  </div>
                  <p class="mt-2 font-display text-xs tracking-wide text-text-dim">
                    Risk weight: {{ card.riskWeight }}
                  </p>
                </div>

                <button
                  class="mt-3 inline-flex w-full items-center justify-center gap-2 border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
                  type="button"
                  @click="requestPermission(card.id)"
                >
                  <Icon icon="lucide:key-round" class="size-4" />
                  Yêu cầu quyền {{ card.label }}
                </button>

                <div class="mt-4 border border-border-default bg-bg-surface p-3">
                  <p class="font-display text-xs tracking-widest text-text-dim">
                    METADATA CÓ THỂ LỘ
                  </p>
                  <ul class="mt-2 space-y-1 text-sm text-text-secondary">
                    <li
                      v-for="item in card.leakExamples.slice(0, 2)"
                      :key="item"
                      class="flex items-start gap-2"
                    >
                      <span class="mt-1 text-accent-coral">■</span>
                      <span>{{ item }}</span>
                    </li>
                  </ul>
                </div>
              </article>
            </div>

            <p
              v-if="feedbackMessage"
              class="mt-4 border border-border-default bg-bg-deep p-3 text-sm text-text-secondary"
            >
              {{ feedbackMessage }}
            </p>
          </article>

          <article
            class="self-start border border-border-default bg-bg-surface p-5 xl:sticky xl:top-6"
          >
            <p class="font-display text-xs tracking-widest text-text-dim">REALTIME RISK GRAPH</p>

            <div class="mt-3 flex items-start justify-between gap-3">
              <div>
                <p class="font-display text-xs tracking-widest text-text-dim">TOTAL RISK SCORE</p>
                <p class="mt-2 font-display text-4xl text-accent-coral sm:text-5xl">
                  {{ totalRiskScore }}
                </p>
              </div>
              <span
                class="w-fit border px-3 py-1 font-display text-xs tracking-widest"
                :class="riskLevel.classes"
              >
                {{ riskLevel.label }}
              </span>
            </div>

            <p class="mt-3 border border-border-default bg-bg-deep p-3 text-sm text-text-secondary">
              {{ riskLevel.tip }}
            </p>

            <div class="mt-4 border border-border-default bg-bg-deep p-4">
              <svg viewBox="0 0 240 240" class="mx-auto w-full max-w-75">
                <polygon
                  v-for="level in ringLevels"
                  :key="level"
                  :points="getRingPolygon(level)"
                  class="fill-transparent stroke-border-default"
                  stroke-width="1"
                />

                <line
                  v-for="axis in axisMeta"
                  :key="`axis-${axis.key}`"
                  :x1="radarCenter"
                  :y1="radarCenter"
                  :x2="axis.endPoint.x"
                  :y2="axis.endPoint.y"
                  class="stroke-border-default"
                  stroke-width="1"
                />

                <polygon
                  :points="radarPolygon"
                  class="fill-accent-coral/20 stroke-accent-coral"
                  stroke-width="2"
                />

                <circle
                  v-for="axis in axisMeta"
                  :key="`point-${axis.key}`"
                  :cx="getRadarPoint(axis.angle, vectorScores[axis.key] / 100).x"
                  :cy="getRadarPoint(axis.angle, vectorScores[axis.key] / 100).y"
                  r="4"
                  class="fill-accent-coral"
                />

                <text
                  v-for="axis in axisMeta"
                  :key="`label-${axis.key}`"
                  :x="axis.labelPoint.x"
                  :y="axis.labelPoint.y"
                  class="fill-text-secondary font-display text-[10px] tracking-widest"
                  text-anchor="middle"
                  dominant-baseline="middle"
                >
                  {{ axis.label }}
                </text>
              </svg>
            </div>

            <p class="mt-3 text-sm text-text-secondary">
              Đa giác càng nở rộng thì mức lộ bề mặt dữ liệu, theo dõi hành vi và khả năng bị lạm
              dụng càng cao.
            </p>

            <div class="mt-4 space-y-3">
              <div v-for="metric in metricCards" :key="metric.key">
                <div class="flex items-center justify-between text-sm">
                  <p class="font-display tracking-wide text-text-primary">{{ metric.label }}</p>
                  <p class="font-display text-text-secondary">{{ metric.score }}%</p>
                </div>
                <div class="mt-1 border border-border-default bg-bg-deep p-1">
                  <div
                    class="h-2 transition-all duration-500"
                    :class="metricBarClass(metric.key)"
                    :style="{ width: `${metric.score}%` }"
                  />
                </div>
                <p class="mt-1 text-xs text-text-dim">{{ metric.description }}</p>
              </div>
            </div>

            <div class="mt-4 border border-border-default bg-bg-deep p-3">
              <p class="font-display text-xs tracking-widest text-text-dim">LEAK PREVIEW</p>
              <ul
                v-if="activeLeakExamples.length"
                class="mt-2 space-y-1 text-sm text-text-secondary"
              >
                <li v-for="item in activeLeakExamples" :key="item" class="flex items-start gap-2">
                  <span class="mt-1 text-accent-amber">■</span>
                  <span>{{ item }}</span>
                </li>
              </ul>
              <p v-else class="mt-2 text-sm text-text-dim">
                Chưa có leak rõ ràng. Hãy bật toggle và yêu cầu quyền để xem thay đổi.
              </p>
            </div>

            <div class="mt-4 border border-border-default bg-bg-deep p-3">
              <p class="font-display text-xs tracking-widest text-text-dim">RECOMMENDED ACTIONS</p>
              <ul class="mt-2 space-y-1 text-sm text-text-secondary">
                <li
                  v-for="action in recommendedActions"
                  :key="action"
                  class="flex items-start gap-2"
                >
                  <span class="mt-1 text-accent-sky">■</span>
                  <span>{{ action }}</span>
                </li>
              </ul>
            </div>

            <div class="mt-4 border border-border-default bg-bg-deep p-3">
              <div class="flex items-center justify-between gap-2">
                <p class="font-display text-xs tracking-widest text-text-dim">RISK TIMELINE</p>
                <p class="font-display text-xs tracking-widest text-text-secondary">
                  {{ riskHistoryTrend }}
                </p>
              </div>

              <div class="mt-3 h-20 border border-border-default bg-bg-surface p-2">
                <div v-if="riskHistory.length" class="flex h-full items-end gap-1">
                  <div
                    v-for="point in riskHistory"
                    :key="point.id"
                    class="flex-1 bg-accent-amber/80 transition-all duration-300"
                    :style="{ height: `${Math.max(point.score, 6)}%` }"
                  />
                </div>
                <div v-else class="flex h-full items-center justify-center text-xs text-text-dim">
                  Chưa có dữ liệu timeline.
                </div>
              </div>

              <p class="mt-2 text-xs text-text-dim">
                Biểu đồ biểu diễn biến thiên risk score từ 0 đến 100.
              </p>
            </div>

            <div class="mt-4 border border-border-default bg-bg-deep p-3">
              <p class="font-display text-xs tracking-widest text-text-dim">ACTIVITY LOG</p>
              <ul v-if="activityLog.length" class="mt-2 space-y-2">
                <li
                  v-for="entry in activityLog"
                  :key="entry.id"
                  class="flex items-start gap-2 border border-border-default bg-bg-surface px-2 py-1.5"
                >
                  <span class="mt-0.5 text-xs" :class="activityToneClass(entry.tone)">●</span>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs text-text-secondary">{{ entry.message }}</p>
                    <p class="mt-0.5 font-display text-[10px] tracking-widest text-text-dim">
                      {{ entry.time }}
                    </p>
                  </div>
                </li>
              </ul>
              <p v-else class="mt-2 text-sm text-text-dim">
                Chưa có activity. Hãy bật mô phỏng hoặc áp dụng preset.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section class="mt-10 animate-fade-up animate-delay-5">
        <h2
          class="mb-6 flex items-center gap-3 font-display text-2xl font-semibold text-text-primary"
        >
          <span class="font-display text-sm tracking-widest text-accent-sky">//</span>
          Permission Contribution
        </h2>

        <div class="border border-border-default bg-bg-surface p-4">
          <div class="grid gap-3 sm:grid-cols-2">
            <article
              v-for="item in rankedPermissionRisk"
              :key="item.id"
              class="border border-border-default bg-bg-deep p-3"
            >
              <div class="flex items-center justify-between">
                <p class="font-display text-sm tracking-wide text-text-primary">{{ item.label }}</p>
                <span
                  class="border px-2 py-1 font-display text-[10px] tracking-widest"
                  :class="permissionStateClass(item.state)"
                >
                  {{ permissionStateLabel(item.state) }}
                </span>
              </div>

              <div class="mt-2 border border-border-default bg-bg-surface p-1">
                <div
                  class="h-2 bg-accent-coral transition-all duration-500"
                  :style="{ width: `${item.score}%` }"
                />
              </div>

              <p class="mt-2 text-xs text-text-dim">
                Đóng góp vào tổng rủi ro: {{ item.score }} điểm
              </p>
            </article>
          </div>
        </div>
      </section>

      <ExtraPermissionsPanel />
    </div>
  </div>
</template>
