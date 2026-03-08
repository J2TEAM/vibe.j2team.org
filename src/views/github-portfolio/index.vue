<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

// ── Types ──────────────────────────────────────────────
interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
  html_url: string
  bio: string | null
  location: string | null
  company: string | null
  blog: string | null
  public_repos: number
  followers: number
  following: number
  created_at: string
  twitter_username: string | null
}

interface GitHubRepo {
  name: string
  html_url: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  fork: boolean
  topics: string[]
}

type AppState = 'input' | 'loading' | 'portfolio' | 'error'

interface ErrorInfo {
  title: string
  message: string
  isRateLimit: boolean
}

const languageColors: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C#': '#178600',
  'C++': '#f34b7d',
  C: '#555555',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Shell: '#89e051',
  Lua: '#000080',
  Scala: '#c22d40',
  R: '#198CE7',
  SCSS: '#c6538c',
  Svelte: '#ff3e00',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Zig: '#ec915c',
  Nim: '#ffc200',
  OCaml: '#3be133',
  OpenSCAD: '#e5cd45',
  Perl: '#0298c3',
  Makefile: '#427819',
}

// ── State ──────────────────────────────────────────────
const route = useRoute()
const router = useRouter()
const state = ref<AppState>('input')
const username = ref('')
const token = ref('')
const showTokenInput = ref(false)
const user = ref<GitHubUser | null>(null)
const repos = ref<GitHubRepo[]>([])
const errorInfo = ref<ErrorInfo>({ title: '', message: '', isRateLimit: false })

const topRepos = computed(() =>
  repos.value
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6),
)
const totalStars = computed(() => repos.value.reduce((s, r) => s + r.stargazers_count, 0))
const languageStats = computed(() => {
  const counts: Record<string, number> = {}
  for (const r of repos.value) {
    if (r.language) counts[r.language] = (counts[r.language] || 0) + 1
  }
  const total = Object.values(counts).reduce((s, c) => s + c, 0)
  if (!total) return []
  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      percent: Math.round((count / total) * 100),
      color: languageColors[name] || '#8B9DB5',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
})
const memberSince = computed(() => {
  if (!user.value) return ''
  const d = new Date(user.value.created_at)
  const y = new Date().getFullYear() - d.getFullYear()
  const m = [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
  ]
  return `${m[d.getMonth()]} ${d.getFullYear()} (${y} năm)`
})
const blogUrl = computed(() => {
  if (!user.value?.blog) return ''
  const b = user.value.blog
  return b.startsWith('http') ? b : `https://${b}`
})
const shareUrl = computed(() => {
  if (!user.value) return ''
  return `${window.location.origin}${window.location.pathname}?user=${user.value.login}`
})
const copied = ref(false)
const downloadingCard = ref(false)

// ── Developer Score ────────────────────────────────────
const originalRepos = computed(() => repos.value.filter((r) => !r.fork))
const devScore = computed(() => {
  if (!user.value) return 0
  const u = user.value
  // Stars score (log scale, max 30)
  const starScore = Math.min(30, (Math.log10(totalStars.value + 1) / Math.log10(100000)) * 30)
  // Repos score (max 15)
  const repoScore = Math.min(15, (originalRepos.value.length / 30) * 15)
  // Followers score (log scale, max 25)
  const followerScore = Math.min(25, (Math.log10(u.followers + 1) / Math.log10(50000)) * 25)
  // Language diversity (max 15)
  const uniqueLangs = new Set(repos.value.map((r) => r.language).filter(Boolean)).size
  const langScore = Math.min(15, (uniqueLangs / 8) * 15)
  // Account age (max 15)
  const years = (Date.now() - new Date(u.created_at).getTime()) / (365.25 * 86400000)
  const ageScore = Math.min(15, (years / 8) * 15)
  return Math.round(starScore + repoScore + followerScore + langScore + ageScore)
})

const devLevel = computed(() => {
  const s = devScore.value
  if (s >= 90) return { label: 'Siêu sao', color: '#FF6B4A', emoji: '' }
  if (s >= 75) return { label: 'Chuyên gia', color: '#FFB340', emoji: '' }
  if (s >= 60) return { label: 'Lành nghề', color: '#4DC9F6', emoji: '' }
  if (s >= 40) return { label: 'Đang phát triển', color: '#A78BFA', emoji: '' }
  return { label: 'Mới bắt đầu', color: '#8B9DB5', emoji: '' }
})

const devInsights = computed(() => {
  if (!user.value) return []
  const insights: string[] = []
  const u = user.value
  // Top language
  if (languageStats.value.length) {
    const top = languageStats.value[0]
    if (top) {
      insights.push(`Chuyên về ${top.name} (${top.percent}% repo)`)
    }
  }
  // Stars
  if (totalStars.value >= 1000)
    insights.push(`${fmt(totalStars.value)} sao — được cộng đồng đánh giá cao`)
  else if (totalStars.value >= 100) insights.push(`${fmt(totalStars.value)} sao trên các dự án`)
  // Original ratio
  const origPct = repos.value.length
    ? Math.round((originalRepos.value.length / repos.value.length) * 100)
    : 0
  if (origPct >= 80) insights.push(`${origPct}% repo tự viết — sáng tạo cao`)
  // Multi-language
  const uniqueLangs = new Set(repos.value.map((r) => r.language).filter(Boolean)).size
  if (uniqueLangs >= 5) insights.push(`Đa ngôn ngữ: thành thạo ${uniqueLangs} ngôn ngữ`)
  // Followers
  if (u.followers >= 1000)
    insights.push(`${fmt(u.followers)} người theo dõi — có ảnh hưởng trong cộng đồng`)
  // Account age
  const years = Math.floor((Date.now() - new Date(u.created_at).getTime()) / (365.25 * 86400000))
  if (years >= 5) insights.push(`${years} năm trên GitHub — developer dày dặn`)
  return insights.slice(0, 4)
})

function updateMetaTags() {
  if (!user.value) return
  const u = user.value
  const title = `${u.name || u.login} - GitHub Portfolio`
  const description =
    u.bio ||
    `Xem portfolio GitHub của ${u.name || u.login}: ${u.public_repos} repos, ${fmt(totalStars.value)} stars, ${u.followers} followers`
  const url = shareUrl.value
  const image = u.avatar_url

  // Update or create meta tags
  const updateMeta = (property: string, content: string) => {
    let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('property', property)
      document.head.appendChild(meta)
    }
    meta.content = content
  }

  const updateMetaName = (name: string, content: string) => {
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', name)
      document.head.appendChild(meta)
    }
    meta.content = content
  }

  // Open Graph tags
  updateMeta('og:title', title)
  updateMeta('og:description', description)
  updateMeta('og:image', image)
  updateMeta('og:url', url)
  updateMeta('og:type', 'profile')

  // Twitter Card tags
  updateMetaName('twitter:card', 'summary_large_image')
  updateMetaName('twitter:title', title)
  updateMetaName('twitter:description', description)
  updateMetaName('twitter:image', image)

  // Update page title
  document.title = title
}

function clearMetaTags() {
  // Remove Open Graph and Twitter meta tags
  const tags = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']
  tags.forEach((tag) => {
    const meta = document.querySelector(`meta[property="${tag}"]`)
    if (meta) meta.remove()
  })

  const nameTags = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']
  nameTags.forEach((tag) => {
    const meta = document.querySelector(`meta[name="${tag}"]`)
    if (meta) meta.remove()
  })

  // Reset page title
  document.title = 'GitHub Portfolio - vibe.j2team.org'
}

function getHeaders(): HeadersInit {
  const h: HeadersInit = { Accept: 'application/vnd.github.v3+json' }
  if (token.value.trim()) h.Authorization = `Bearer ${token.value.trim()}`
  return h
}

async function fetchPortfolio(name: string) {
  state.value = 'loading'
  errorInfo.value = { title: '', message: '', isRateLimit: false }
  try {
    const headers = getHeaders()
    const ur = await fetch(`https://api.github.com/users/${encodeURIComponent(name)}`, { headers })
    if (ur.status === 404) {
      errorInfo.value = {
        title: 'Không tìm thấy người dùng',
        message: `Không có tài khoản GitHub nào với username "${name}". Kiểm tra lại chính tả rồi thử lại nhé.`,
        isRateLimit: false,
      }
      state.value = 'error'
      return
    }
    if (ur.status === 403 || ur.status === 429) {
      errorInfo.value = {
        title: 'Bạn vọc nhiều quá rồi!',
        message:
          'GitHub tạm khóa IP của bạn. Chờ 1 tiếng sau quay lại hoặc dán Token vào đây để dùng tiếp.',
        isRateLimit: true,
      }
      showTokenInput.value = true
      state.value = 'error'
      return
    }
    if (!ur.ok) {
      errorInfo.value = {
        title: 'Có lỗi xảy ra',
        message: `GitHub trả về lỗi ${ur.status}. Vui lòng thử lại sau.`,
        isRateLimit: false,
      }
      state.value = 'error'
      return
    }
    user.value = (await ur.json()) as GitHubUser
    const rr = await fetch(
      `https://api.github.com/users/${encodeURIComponent(name)}/repos?per_page=100&sort=updated`,
      { headers },
    )
    repos.value = rr.ok ? ((await rr.json()) as GitHubRepo[]) : []
    router.replace({ query: { user: user.value.login } })
    state.value = 'portfolio'
    // Update meta tags for social sharing
    updateMetaTags()
  } catch {
    errorInfo.value = {
      title: 'Lỗi kết nối',
      message: 'Không thể kết nối đến GitHub. Kiểm tra lại kết nối mạng của bạn.',
      isRateLimit: false,
    }
    state.value = 'error'
  }
}

function handleSubmit() {
  const n = username.value.trim()
  if (n) fetchPortfolio(n)
}
function handleRetryWithToken() {
  handleSubmit()
}
function resetToInput() {
  state.value = 'input'
  user.value = null
  repos.value = []
  router.replace({ query: {} })
  clearMetaTags()
}
async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
  } catch {
    const el = document.createElement('textarea')
    el.value = shareUrl.value
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

async function generateCardCanvas(): Promise<Blob | null> {
  if (!user.value) return null
  const W = 1200,
    H = 630
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')!
  const u = user.value
  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0B1A2B')
  bg.addColorStop(1, '#0F1923')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  // Grid pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 60) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  for (let y = 0; y < H; y += 60) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }
  // Coral glow
  const glow = ctx.createRadialGradient(W - 100, 100, 0, W - 100, 100, 250)
  glow.addColorStop(0, 'rgba(255,107,74,0.08)')
  glow.addColorStop(1, 'rgba(255,107,74,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
  // Avatar
  const avatar = new Image()
  avatar.crossOrigin = 'anonymous'
  await new Promise<void>((res, rej) => {
    avatar.onload = () => res()
    avatar.onerror = () => rej()
    avatar.src = u.avatar_url
  })
  const ax = 80,
    ay = 80,
    ar = 56
  ctx.save()
  ctx.beginPath()
  ctx.arc(ax + ar, ay + ar, ar, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(avatar, ax, ay, ar * 2, ar * 2)
  ctx.restore()
  ctx.strokeStyle = '#2A3A4E'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(ax + ar, ay + ar, ar, 0, Math.PI * 2)
  ctx.stroke()
  // Name + username
  ctx.fillStyle = '#E8ECF0'
  ctx.font = 'bold 36px system-ui, sans-serif'
  ctx.fillText(u.name || u.login, 210, 115)
  ctx.fillStyle = '#6B7F99'
  ctx.font = '18px system-ui, sans-serif'
  ctx.fillText(`@${u.login}`, 210, 145)
  // Bio
  if (u.bio) {
    ctx.fillStyle = '#8B9DB5'
    ctx.font = '16px system-ui, sans-serif'
    ctx.fillText(u.bio.slice(0, 80), 210, 175)
  }
  // Score ring
  const sx = W - 160,
    sy = 100,
    sr = 55
  ctx.strokeStyle = '#1E2D3D'
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.arc(sx, sy, sr, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = devLevel.value.color
  ctx.lineWidth = 8
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(sx, sy, sr, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * devScore.value) / 100)
  ctx.stroke()
  ctx.fillStyle = '#E8ECF0'
  ctx.font = 'bold 32px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(String(devScore.value), sx, sy + 10)
  ctx.fillStyle = '#6B7F99'
  ctx.font = '11px system-ui, sans-serif'
  ctx.fillText(devLevel.value.label, sx, sy + 30)
  ctx.textAlign = 'left'
  // Divider
  ctx.fillStyle = '#1E2D3D'
  ctx.fillRect(80, 220, W - 160, 1)
  // Stats row
  const stats = [
    { val: fmt(u.public_repos), label: 'Repo', color: '#FF6B4A' },
    { val: fmt(totalStars.value), label: 'Sao', color: '#FFB340' },
    { val: fmt(u.followers), label: 'Theo dõi', color: '#4DC9F6' },
    { val: fmt(u.following), label: 'Đang theo dõi', color: '#E8ECF0' },
  ]
  const sw = (W - 160) / stats.length
  stats.forEach((s, i) => {
    const x = 80 + i * sw + sw / 2
    ctx.fillStyle = s.color
    ctx.font = 'bold 28px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(s.val, x, 275)
    ctx.fillStyle = '#6B7F99'
    ctx.font = '12px system-ui, sans-serif'
    ctx.fillText(s.label, x, 298)
  })
  ctx.textAlign = 'left'
  // Divider 2
  ctx.fillStyle = '#1E2D3D'
  ctx.fillRect(80, 320, W - 160, 1)
  // Top repos
  const topR = topRepos.value.slice(0, 3)
  ctx.fillStyle = '#FF6B4A'
  ctx.font = '11px system-ui, sans-serif'
  ctx.fillText('// TOP REPO', 80, 355)
  if (topR.length > 0) {
    topR.forEach((r, i) => {
      const y = 380 + i * 36
      ctx.fillStyle = '#E8ECF0'
      ctx.font = 'bold 15px system-ui, sans-serif'
      ctx.fillText(r.name, 80, y)
      const nameW = ctx.measureText(r.name).width
      ctx.fillStyle = '#6B7F99'
      ctx.font = '13px system-ui, sans-serif'
      ctx.fillText(`★ ${fmt(r.stargazers_count)}`, 80 + nameW + 12, y)
    })
  } else {
    ctx.fillStyle = '#6B7F99'
    ctx.font = '13px system-ui, sans-serif'
    ctx.fillText('Chưa có repository công khai', 80, 390)
  }
  // Languages
  if (languageStats.value.length) {
    ctx.fillStyle = '#FFB340'
    ctx.font = '11px system-ui, sans-serif'
    ctx.fillText('// NGÔN NGỮ', 600, 355)
    // Bar
    let bx = 600
    const bw = W - 160 - 520,
      by = 370
    languageStats.value.slice(0, 4).forEach((l) => {
      const lw = (l.percent / 100) * bw
      ctx.fillStyle = l.color
      ctx.fillRect(bx, by, lw, 8)
      bx += lw
    })
    languageStats.value.slice(0, 4).forEach((l, i) => {
      const y = 400 + i * 24
      ctx.fillStyle = l.color
      ctx.beginPath()
      ctx.arc(608, y - 4, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#8B9DB5'
      ctx.font = '13px system-ui, sans-serif'
      ctx.fillText(`${l.name}  ${l.percent}%`, 620, y)
    })
  } else {
    ctx.fillStyle = '#FFB340'
    ctx.font = '11px system-ui, sans-serif'
    ctx.fillText('// NGÔN NGỮ', 600, 355)
    ctx.fillStyle = '#6B7F99'
    ctx.font = '13px system-ui, sans-serif'
    ctx.fillText('Chưa có dữ liệu', 600, 390)
  }
  // Branding
  ctx.fillStyle = '#3D5068'
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText('vibe.j2team.org/github-portfolio', 80, H - 30)
  ctx.fillStyle = '#2A3A4E'
  ctx.font = '12px system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(memberSince.value, W - 80, H - 30)
  ctx.textAlign = 'left'

  // Return blob
  return new Promise<Blob | null>((resolve) => {
    cv.toBlob((blob) => {
      resolve(blob)
    }, 'image/png')
  })
}

async function downloadCard() {
  if (!user.value || downloadingCard.value) return
  downloadingCard.value = true
  try {
    const blob = await generateCardCanvas()
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `github-portfolio-${user.value.login}.png`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Card export failed:', e)
  } finally {
    downloadingCard.value = false
  }
}

function fmt(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

onMounted(() => {
  const q = route.query.user
  if (q && typeof q === 'string') {
    username.value = q
    fetchPortfolio(q)
  }
})
watch(
  () => route.query.user,
  (v) => {
    if (v && typeof v === 'string' && v !== user.value?.login) {
      username.value = v
      fetchPortfolio(v)
    }
  },
)
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body"
    style="display: flex; flex-direction: column"
  >
    <!-- HEADER -->
    <header
      class="shrink-0 border-b border-border-default"
      style="
        position: sticky;
        top: 0;
        z-index: 20;
        backdrop-filter: blur(12px);
        background: rgba(15, 25, 35, 0.85);
      "
    >
      <nav
        class="mx-auto px-6"
        style="
          max-width: 1200px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        "
      >
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-accent-coral gp-nav-link"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="gp-nav-text">Về trang chủ</span>
        </RouterLink>
        <span
          class="font-display text-text-dim select-none gp-header-title"
          style="font-size: 11px; letter-spacing: 0.2em"
          >GITHUB PORTFOLIO</span
        >
        <button
          v-if="state === 'portfolio'"
          class="font-display text-text-dim hover:text-accent-coral transition gp-nav-link"
          style="font-size: 11px; letter-spacing: 0.15em"
          @click="resetToInput"
        >
          <span class="gp-nav-text">TẠO MỚI</span>
        </button>
        <span v-else style="width: 60px" />
      </nav>
    </header>

    <!-- ═══ INPUT ═══ -->
    <main v-if="state === 'input'" style="flex: 1; display: flex; flex-direction: row">
      <!-- Left panel -->
      <div
        style="
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 40px;
        "
        class="gp-left-panel"
      >
        <div style="max-width: 460px">
          <p
            class="font-display text-accent-amber animate-fade-up"
            style="font-size: 11px; letter-spacing: 0.25em; margin-bottom: 16px"
          >
            // PORTFOLIO TRONG 10 GIÂY
          </p>
          <h1
            class="font-display font-bold animate-fade-up animate-delay-1 gp-hero-title"
            style="font-size: clamp(28px, 5vw, 56px); line-height: 1.15"
          >
            Biến <span class="text-accent-coral">GitHub</span><br />thành Portfolio
          </h1>
          <p
            class="text-text-secondary animate-fade-up animate-delay-2"
            style="margin-top: 16px; font-size: 15px; line-height: 1.65; max-width: 380px"
          >
            Chỉ cần nhập username, hệ thống sẽ tạo trang portfolio cá nhân đẹp mắt cho bạn ngay lập
            tức.
          </p>
          <form
            class="animate-fade-up animate-delay-3"
            style="margin-top: 32px"
            @submit.prevent="handleSubmit"
          >
            <label
              class="font-display text-text-dim"
              style="display: block; font-size: 11px; letter-spacing: 0.15em; margin-bottom: 8px"
              >GITHUB USERNAME</label
            >
            <div style="display: flex; gap: 12px">
              <div style="position: relative; flex: 1">
                <svg
                  style="
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    pointer-events: none;
                  "
                  class="text-text-dim"
                  width="18"
                  height="18"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path
                    d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"
                  />
                </svg>
                <input
                  v-model="username"
                  type="text"
                  placeholder="ví dụ: ariushieu"
                  autofocus
                  autocomplete="off"
                  class="bg-bg-surface border border-border-default text-text-primary placeholder:text-text-dim text-sm focus:outline-none focus:border-accent-coral"
                  style="
                    width: 100%;
                    height: 48px;
                    padding-left: 44px;
                    padding-right: 16px;
                    transition: border-color 0.2s;
                  "
                />
              </div>
              <button
                type="submit"
                :disabled="!username.trim()"
                class="bg-accent-coral text-bg-deep font-display font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                style="
                  height: 48px;
                  padding: 0 24px;
                  white-space: nowrap;
                  letter-spacing: 0.05em;
                  transition: opacity 0.2s;
                "
              >
                Tạo Portfolio
              </button>
            </div>
            <button
              type="button"
              class="text-text-dim hover:text-text-secondary transition"
              style="margin-top: 12px; font-size: 11px"
              @click="showTokenInput = !showTokenInput"
            >
              {{ showTokenInput ? 'Ẩn token' : 'Có GitHub Token? (không bắt buộc)' }}
            </button>
            <div v-if="showTokenInput" style="margin-top: 8px">
              <input
                v-model="token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                autocomplete="off"
                class="bg-bg-surface border border-border-default text-text-primary placeholder:text-text-dim text-sm focus:outline-none focus:border-accent-amber"
                style="width: 100%; height: 40px; padding: 0 16px; transition: border-color 0.2s"
              />
              <p class="text-text-dim" style="margin-top: 6px; font-size: 11px; line-height: 1.6">
                Token giúp tăng giới hạn API từ 60 lên 5.000 request/giờ. Tạo tại
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener"
                  class="text-accent-sky link-underline"
                  >github.com/settings/tokens</a
                >.
              </p>
            </div>
          </form>
        </div>
      </div>
      <!-- Right decorative panel -->
      <div
        class="gp-right-panel border-l border-border-default"
        style="
          width: 400px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: rgba(22, 34, 50, 0.3);
        "
      >
        <div
          style="
            position: absolute;
            inset: 0;
            opacity: 0.03;
            background-image:
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 40px,
                currentColor 40px,
                currentColor 41px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 40px,
                currentColor 40px,
                currentColor 41px
              );
          "
        />
        <div style="position: relative; text-align: center; padding: 0 32px">
          <svg
            class="text-text-dim"
            style="margin: 0 auto 32px; opacity: 0.15"
            width="80"
            height="80"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path
              d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"
            />
          </svg>
          <div style="text-align: left">
            <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 24px">
              <span
                class="font-display text-accent-coral font-bold select-none"
                style="font-size: 28px; line-height: 1; opacity: 0.2"
                >01</span
              >
              <p class="text-text-dim" style="font-size: 14px; line-height: 1.6; padding-top: 4px">
                Nhập GitHub username của bạn
              </p>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 24px">
              <span
                class="font-display text-accent-amber font-bold select-none"
                style="font-size: 28px; line-height: 1; opacity: 0.2"
                >02</span
              >
              <p class="text-text-dim" style="font-size: 14px; line-height: 1.6; padding-top: 4px">
                Hệ thống tự động lấy dữ liệu từ API
              </p>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 12px">
              <span
                class="font-display text-accent-sky font-bold select-none"
                style="font-size: 28px; line-height: 1; opacity: 0.2"
                >03</span
              >
              <p class="text-text-dim" style="font-size: 14px; line-height: 1.6; padding-top: 4px">
                Sao chép link và chia sẻ lên mạng xã hội
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ═══ LOADING ═══ -->
    <main
      v-else-if="state === 'loading'"
      style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px"
    >
      <div
        class="animate-fade-up"
        style="display: flex; flex-direction: column; align-items: center; gap: 24px"
      >
        <div style="position: relative; width: 64px; height: 64px">
          <div
            class="border-2 border-border-default"
            style="position: absolute; inset: 0; border-radius: 50%"
          />
          <div
            class="border-2 border-transparent animate-spin"
            style="
              position: absolute;
              inset: 0;
              border-radius: 50%;
              border-top-color: var(--color-accent-coral);
            "
          />
        </div>
        <div style="text-align: center">
          <p class="font-display text-text-primary font-semibold" style="font-size: 20px">
            Đang tải dữ liệu
          </p>
          <p class="text-text-secondary" style="margin-top: 8px; font-size: 14px">
            Lấy thông tin từ GitHub cho
            <span class="text-accent-coral font-semibold">{{ username }}</span>
          </p>
        </div>
      </div>
    </main>

    <!-- ═══ ERROR ═══ -->
    <main
      v-else-if="state === 'error'"
      style="
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px 24px 48px;
      "
    >
      <div class="animate-fade-up" style="width: 100%; max-width: 500px">
        <div
          class="border border-border-default bg-bg-surface"
          style="border-left: 4px solid var(--color-accent-coral); padding: 32px"
        >
          <h2 class="font-display font-bold text-text-primary" style="font-size: 20px">
            {{ errorInfo.title }}
          </h2>
          <p
            class="text-text-secondary"
            style="margin-top: 12px; font-size: 14px; line-height: 1.7"
          >
            {{ errorInfo.message }}
          </p>
          <div
            v-if="errorInfo.isRateLimit"
            class="border-t border-border-default"
            style="margin-top: 24px; padding-top: 24px"
          >
            <label
              class="font-display text-text-dim"
              style="display: block; font-size: 11px; letter-spacing: 0.15em; margin-bottom: 8px"
              >GITHUB TOKEN</label
            >
            <div style="display: flex; gap: 12px; flex-wrap: wrap">
              <input
                v-model="token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                autocomplete="off"
                class="bg-bg-deep border border-border-default text-text-primary placeholder:text-text-dim text-sm focus:outline-none focus:border-accent-amber"
                style="flex: 1; min-width: 200px; height: 44px; padding: 0 16px"
              />
              <button
                class="bg-accent-amber text-bg-deep font-display font-bold text-sm"
                style="height: 44px; padding: 0 20px; letter-spacing: 0.05em"
                @click="handleRetryWithToken"
              >
                Thử lại
              </button>
            </div>
            <p class="text-text-dim" style="margin-top: 8px; font-size: 11px; line-height: 1.6">
              Tạo token tại
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener"
                class="text-accent-sky link-underline"
                >github.com/settings/tokens</a
              >. Token chỉ dùng trong phiên này.
            </p>
          </div>
          <div style="margin-top: 24px; display: flex; gap: 12px; flex-wrap: wrap">
            <button
              class="border border-border-default bg-bg-elevated text-text-secondary font-display hover:border-accent-coral hover:text-text-primary transition"
              style="height: 40px; padding: 0 20px; font-size: 14px"
              @click="resetToInput"
            >
              Quay lại
            </button>
            <button
              v-if="!errorInfo.isRateLimit"
              class="bg-accent-coral text-bg-deep font-display font-bold text-sm"
              style="height: 40px; padding: 0 20px"
              @click="handleSubmit"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- ═══ PORTFOLIO ═══ -->
    <main v-else-if="state === 'portfolio' && user" style="flex: 1">
      <!-- Profile hero -->
      <section class="border-b border-border-default" style="position: relative; overflow: hidden">
        <div
          style="
            position: absolute;
            inset: 0;
            opacity: 0.02;
            background-image:
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 60px,
                currentColor 60px,
                currentColor 61px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 60px,
                currentColor 60px,
                currentColor 61px
              );
          "
        />
        <div
          style="
            position: absolute;
            top: -128px;
            right: -128px;
            width: 256px;
            height: 256px;
            border-radius: 50%;
            background: rgba(255, 107, 74, 0.05);
            filter: blur(48px);
            pointer-events: none;
          "
        />

        <div
          class="mx-auto px-6 animate-fade-up"
          style="max-width: 1080px; padding-top: 48px; padding-bottom: 40px; position: relative"
        >
          <div style="display: flex; gap: 24px; align-items: flex-start" class="gp-profile-row">
            <!-- Avatar -->
            <div
              style="width: 120px; height: 120px; flex-shrink: 0; position: relative"
              class="gp-avatar-wrap"
            >
              <img
                :src="user.avatar_url"
                :alt="user.login"
                width="120"
                height="120"
                style="
                  width: 100%;
                  height: 100%;
                  border-radius: 50%;
                  border: 3px solid var(--color-border-default);
                  object-fit: cover;
                "
              />
              <div
                style="
                  position: absolute;
                  bottom: -4px;
                  right: -4px;
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  background: var(--color-accent-coral);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border: 2px solid var(--color-bg-deep);
                "
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--color-bg-deep)">
                  <path
                    d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"
                  />
                </svg>
              </div>
            </div>
            <!-- Info -->
            <div style="flex: 1; min-width: 0">
              <h1
                class="font-display font-bold text-text-primary"
                style="font-size: clamp(24px, 4vw, 36px); line-height: 1.2"
              >
                {{ user.name || user.login }}
              </h1>
              <a
                :href="user.html_url"
                target="_blank"
                rel="noopener"
                class="text-text-dim link-underline hover:text-accent-sky transition"
                style="display: inline-block; margin-top: 4px; font-size: 14px"
                >@{{ user.login }}</a
              >
              <p
                v-if="user.bio"
                class="text-text-secondary"
                style="margin-top: 12px; font-size: 15px; line-height: 1.7; max-width: 500px"
              >
                {{ user.bio }}
              </p>
              <div
                style="
                  margin-top: 12px;
                  display: flex;
                  flex-wrap: wrap;
                  gap: 16px 20px;
                  font-size: 12px;
                "
                class="text-text-dim"
              >
                <span v-if="user.company" style="display: flex; align-items: center; gap: 6px"
                  ><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path
                      d="M1.75 16A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 0 0 .25-.25V8.285a.25.25 0 0 0-.111-.208l-1.055-.703a.749.749 0 1 1 .832-1.248l1.055.703c.487.325.777.871.777 1.456v5.965A1.75 1.75 0 0 1 14.25 16h-3.5a.766.766 0 0 1-.197-.026c-.099.017-.2.026-.303.026h-3a.75.75 0 0 1-.75-.75V14h-1v1.25a.75.75 0 0 1-.75.75Zm-.25-1.75c0 .138.112.25.25.25H4v-1.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v1.25h2.25a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25ZM3.75 6h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 3.75A.75.75 0 0 1 3.75 3h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 3.75Zm4 3A.75.75 0 0 1 7.75 6h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 7 6.75ZM7.75 3h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 9.75A.75.75 0 0 1 3.75 9h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 9.75ZM7.75 9h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5Z"
                    /></svg
                  >{{ user.company }}</span
                >
                <span v-if="user.location" style="display: flex; align-items: center; gap: 6px"
                  ><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path
                      d="m12.596 11.596-3.535 3.536a1.5 1.5 0 0 1-2.122 0l-3.535-3.536a6.5 6.5 0 1 1 9.192 0ZM8 13.5l3.535-3.536A5.502 5.502 0 0 0 8 1a5.502 5.502 0 0 0-3.536 9.964L8 13.5Zm0-5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Zm0-1.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                    /></svg
                  >{{ user.location }}</span
                >
                <a
                  v-if="user.blog"
                  :href="blogUrl"
                  target="_blank"
                  rel="noopener"
                  style="display: flex; align-items: center; gap: 6px"
                  class="hover:text-accent-sky transition"
                  ><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path
                      d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25Zm-.025 5.475a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 1 1-2.83-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 1 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 1 0 4.95 4.95l1.25-1.25Z"
                    /></svg
                  >{{ user.blog }}</a
                >
              </div>
            </div>
          </div>

          <!-- Stats row -->
          <div
            class="animate-fade-up animate-delay-2 gp-page-stats"
            style="
              margin-top: 32px;
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 1px;
              border: 1px solid var(--color-border-default);
              background: var(--color-border-default);
            "
          >
            <div
              style="
                background: var(--color-bg-deep);
                padding: 20px;
                text-align: center;
                display: flex;
                flex-direction: column;
                justify-content: center;
              "
            >
              <p
                class="font-display font-bold text-accent-coral"
                style="font-size: clamp(20px, 3vw, 28px)"
              >
                {{ fmt(user.public_repos) }}
              </p>
              <p
                class="font-display text-text-dim"
                style="font-size: 10px; letter-spacing: 0.15em; margin-top: 4px"
              >
                REPO
              </p>
            </div>
            <div
              style="
                background: var(--color-bg-deep);
                padding: 20px;
                text-align: center;
                display: flex;
                flex-direction: column;
                justify-content: center;
              "
            >
              <p
                class="font-display font-bold text-accent-amber"
                style="font-size: clamp(20px, 3vw, 28px)"
              >
                {{ fmt(totalStars) }}
              </p>
              <p
                class="font-display text-text-dim"
                style="font-size: 10px; letter-spacing: 0.15em; margin-top: 4px"
              >
                SAO
              </p>
            </div>
            <div
              style="
                background: var(--color-bg-deep);
                padding: 20px;
                text-align: center;
                display: flex;
                flex-direction: column;
                justify-content: center;
              "
            >
              <p
                class="font-display font-bold text-accent-sky"
                style="font-size: clamp(20px, 3vw, 28px)"
              >
                {{ fmt(user.followers) }}
              </p>
              <p
                class="font-display text-text-dim"
                style="font-size: 10px; letter-spacing: 0.15em; margin-top: 4px"
              >
                THEO DÕI
              </p>
            </div>
            <div
              style="
                background: var(--color-bg-deep);
                padding: 20px;
                text-align: center;
                display: flex;
                flex-direction: column;
                justify-content: center;
              "
            >
              <p
                class="font-display font-bold text-text-primary"
                style="font-size: clamp(20px, 3vw, 28px)"
              >
                {{ fmt(user.following) }}
              </p>
              <p
                class="font-display text-text-dim"
                style="font-size: 10px; letter-spacing: 0.15em; margin-top: 4px"
              >
                ĐANG THEO DÕI
              </p>
            </div>
            <div
              style="
                background: var(--color-bg-deep);
                padding: 20px;
                text-align: center;
                display: flex;
                flex-direction: column;
                justify-content: center;
              "
            >
              <p
                class="font-display font-bold text-text-primary"
                style="font-size: 14px; line-height: 1.3"
              >
                {{ memberSince }}
              </p>
              <p
                class="font-display text-text-dim"
                style="font-size: 10px; letter-spacing: 0.15em; margin-top: 4px"
              >
                THAM GIA
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Developer Analysis -->
      <section
        class="mx-auto px-6 animate-fade-up animate-delay-3"
        style="max-width: 1080px; padding-top: 40px"
      >
        <div
          class="border border-border-default bg-bg-surface gp-analysis-grid"
          style="display: grid; grid-template-columns: auto 1fr; gap: 32px; padding: 32px"
        >
          <!-- Score ring -->
          <div
            style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-width: 140px;
            "
          >
            <div style="position: relative; width: 120px; height: 120px">
              <svg
                viewBox="0 0 120 120"
                style="width: 100%; height: 100%; transform: rotate(-90deg)"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="var(--color-border-default)"
                  stroke-width="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  :stroke="devLevel.color"
                  stroke-width="8"
                  stroke-linecap="round"
                  :stroke-dasharray="`${(devScore / 100) * 326.7} 326.7`"
                  style="transition: stroke-dasharray 1s ease"
                />
              </svg>
              <div
                style="
                  position: absolute;
                  inset: 0;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                "
              >
                <span
                  class="font-display font-bold"
                  style="font-size: 32px; line-height: 1"
                  :style="{ color: devLevel.color }"
                  >{{ devScore }}</span
                >
                <span
                  class="font-display text-text-dim"
                  style="font-size: 10px; letter-spacing: 0.1em; margin-top: 4px"
                  >ĐIỂM</span
                >
              </div>
            </div>
            <p
              class="font-display font-bold"
              style="margin-top: 8px; font-size: 14px"
              :style="{ color: devLevel.color }"
            >
              {{ devLevel.label }}
            </p>
          </div>
          <!-- Insights -->
          <div
            style="
              display: flex;
              flex-direction: column;
              justify-content: center;
              gap: 12px;
              min-width: 0;
            "
          >
            <h3
              class="font-display font-semibold text-text-primary"
              style="font-size: 18px; display: flex; align-items: center; gap: 10px"
            >
              <span class="text-accent-coral" style="font-size: 13px; letter-spacing: 0.15em"
                >//</span
              >Phân tích Developer
            </h3>
            <div
              v-for="(insight, i) in devInsights"
              :key="i"
              style="display: flex; align-items: flex-start; gap: 10px; font-size: 14px"
            >
              <span class="text-accent-coral" style="margin-top: 2px; flex-shrink: 0">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path
                    d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4Z"
                  />
                  <path
                    d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm.25-14.75a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z"
                  />
                </svg>
              </span>
              <span class="text-text-secondary">{{ insight }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Content: repos + sidebar -->
      <div class="mx-auto px-6" style="max-width: 1080px; padding-top: 48px; padding-bottom: 48px">
        <div
          style="display: grid; grid-template-columns: 1fr 280px; gap: 40px; align-items: start"
          class="gp-content-grid"
        >
          <!-- Repos column -->
          <div style="min-width: 0">
            <!-- Empty state when no repos -->
            <div
              v-if="!repos.length"
              class="border border-border-default bg-bg-surface animate-fade-up animate-delay-3"
              style="padding: 48px 24px; text-align: center"
            >
              <div class="text-text-dim" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3">
                📦
              </div>
              <h3
                class="font-display font-semibold text-text-secondary"
                style="font-size: 16px; margin-bottom: 8px"
              >
                Chưa có repository công khai
              </h3>
              <p class="text-text-dim" style="font-size: 14px">
                {{ user?.name || user?.login }} chưa tạo repository công khai nào.
              </p>
            </div>

            <!-- Repos list -->
            <template v-else>
              <h2
                class="font-display font-semibold text-text-primary animate-fade-up animate-delay-3"
                style="
                  font-size: 18px;
                  margin-bottom: 20px;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                "
              >
                <span
                  class="text-accent-coral font-display"
                  style="font-size: 13px; letter-spacing: 0.15em"
                  >//</span
                >
                Repository nổi bật
              </h2>
              <div
                class="animate-fade-up animate-delay-4"
                style="display: flex; flex-direction: column; gap: 12px"
              >
                <a
                  v-for="(repo, i) in topRepos"
                  :key="repo.name"
                  :href="repo.html_url"
                  target="_blank"
                  rel="noopener"
                  class="group border border-border-default bg-bg-surface transition-all duration-300 hover:border-accent-coral hover:bg-bg-elevated block"
                  :style="{
                    borderLeftWidth: i < 2 ? '3px' : '1px',
                    borderLeftColor:
                      i === 0
                        ? 'var(--color-accent-coral)'
                        : i === 1
                          ? 'var(--color-accent-amber)'
                          : undefined,
                  }"
                >
                  <div style="padding: 20px">
                    <div
                      style="
                        display: flex;
                        align-items: flex-start;
                        justify-content: space-between;
                        gap: 12px;
                      "
                    >
                      <h3
                        class="font-display font-semibold text-text-primary group-hover:text-accent-coral transition-colors"
                        style="
                          font-size: 15px;
                          overflow: hidden;
                          text-overflow: ellipsis;
                          white-space: nowrap;
                        "
                      >
                        {{ repo.name }}
                      </h3>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        class="text-text-dim shrink-0"
                        style="
                          margin-top: 4px;
                          opacity: 0;
                          transform: translateX(-4px);
                          transition: all 0.3s;
                        "
                      >
                        <path
                          d="M4 12L12 4M12 4H6M12 4V10"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </div>
                    <p
                      v-if="repo.description"
                      class="text-text-secondary"
                      style="
                        margin-top: 6px;
                        font-size: 14px;
                        line-height: 1.6;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                      "
                    >
                      {{ repo.description }}
                    </p>
                    <div
                      style="
                        margin-top: 12px;
                        display: flex;
                        align-items: center;
                        gap: 16px;
                        font-size: 12px;
                      "
                      class="text-text-dim"
                    >
                      <span
                        v-if="repo.language"
                        style="display: flex; align-items: center; gap: 6px"
                        ><span
                          style="width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0"
                          :style="{ backgroundColor: languageColors[repo.language] || '#8B9DB5' }"
                        />{{ repo.language }}</span
                      >
                      <span
                        v-if="repo.stargazers_count"
                        style="display: flex; align-items: center; gap: 4px"
                        ><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                          <path
                            d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"
                          /></svg
                        >{{ fmt(repo.stargazers_count) }}</span
                      >
                      <span
                        v-if="repo.forks_count"
                        style="display: flex; align-items: center; gap: 4px"
                        ><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                          <path
                            d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"
                          /></svg
                        >{{ fmt(repo.forks_count) }}</span
                      >
                    </div>
                    <div
                      v-if="repo.topics && repo.topics.length"
                      style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px"
                    >
                      <span
                        v-for="topic in repo.topics.slice(0, 4)"
                        :key="topic"
                        class="bg-accent-sky/10 text-accent-sky font-display"
                        style="padding: 2px 8px; font-size: 10px; letter-spacing: 0.05em"
                        >{{ topic }}</span
                      >
                    </div>
                  </div>
                </a>
              </div>
            </template>
          </div>

          <!-- Sidebar -->
          <aside style="display: flex; flex-direction: column; gap: 24px" class="gp-sidebar">
            <!-- Languages -->
            <div v-if="languageStats.length" class="animate-fade-up animate-delay-5">
              <h3
                class="font-display font-semibold text-text-primary"
                style="
                  font-size: 18px;
                  margin-bottom: 20px;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                "
              >
                <span class="text-accent-amber" style="font-size: 13px; letter-spacing: 0.15em"
                  >//</span
                >Ngôn ngữ
              </h3>
              <div class="border border-border-default bg-bg-surface" style="padding: 16px">
                <div
                  style="
                    display: flex;
                    height: 8px;
                    overflow: hidden;
                    margin-bottom: 16px;
                    border-radius: 2px;
                  "
                >
                  <div
                    v-for="lang in languageStats"
                    :key="lang.name"
                    :style="{ width: lang.percent + '%', backgroundColor: lang.color }"
                    :title="`${lang.name}: ${lang.percent}%`"
                  />
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px">
                  <div
                    v-for="lang in languageStats"
                    :key="lang.name"
                    style="display: flex; align-items: center; gap: 8px; font-size: 13px"
                  >
                    <span
                      style="width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0"
                      :style="{ backgroundColor: lang.color }"
                    />
                    <span
                      class="text-text-secondary"
                      style="
                        flex: 1;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                      "
                      >{{ lang.name }}</span
                    >
                    <span
                      class="text-text-dim"
                      style="font-size: 12px; font-variant-numeric: tabular-nums"
                      >{{ lang.percent }}%</span
                    >
                  </div>
                </div>
              </div>
            </div>
            <!-- Share -->
            <div class="animate-fade-up animate-delay-6">
              <h3
                class="font-display font-semibold text-text-primary"
                style="
                  font-size: 16px;
                  margin-bottom: 16px;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                "
              >
                <span class="text-accent-sky" style="font-size: 13px; letter-spacing: 0.15em"
                  >//</span
                >Chia sẻ
              </h3>
              <div style="display: flex; flex-direction: column; gap: 8px">
                <button
                  class="bg-accent-coral text-bg-deep font-display font-bold text-sm"
                  style="
                    width: 100%;
                    height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    letter-spacing: 0.05em;
                    transition: opacity 0.2s;
                  "
                  @click="copyShareLink"
                >
                  <svg
                    v-if="!copied"
                    width="15"
                    height="15"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path
                      d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"
                    />
                    <path
                      d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"
                    />
                  </svg>
                  <svg v-else width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                    <path
                      d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"
                    />
                  </svg>
                  {{ copied ? 'Đã sao chép!' : 'Sao chép link' }}
                </button>
                <button
                  :disabled="downloadingCard"
                  class="border border-accent-amber bg-accent-amber/10 text-accent-amber font-display font-bold text-sm disabled:opacity-50"
                  style="
                    width: 100%;
                    height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    letter-spacing: 0.05em;
                    transition: opacity 0.2s;
                  "
                  @click="downloadCard"
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                    <path
                      d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"
                    />
                    <path
                      d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06Z"
                    />
                  </svg>
                  {{ downloadingCard ? 'Đang tạo...' : 'Tải Portfolio Card' }}
                </button>
                <a
                  :href="`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`"
                  target="_blank"
                  rel="noopener"
                  class="border border-border-default bg-bg-surface text-text-secondary font-display hover:border-accent-sky hover:text-text-primary transition"
                  style="
                    width: 100%;
                    height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 14px;
                    text-decoration: none;
                  "
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    />
                  </svg>
                  Chia sẻ lên Facebook
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>

    <!-- FOOTER -->
    <footer
      class="border-t border-border-default"
      style="margin-top: auto; flex-shrink: 0; padding: 20px 0"
    >
      <div
        class="mx-auto px-6 text-text-dim"
        style="max-width: 1080px; text-align: center; font-size: 11px"
      >
        Dữ liệu lấy từ
        <a
          href="https://docs.github.com/en/rest"
          target="_blank"
          rel="noopener"
          class="text-accent-sky link-underline"
          >GitHub REST API</a
        >. Không lưu trữ bất kỳ dữ liệu nào.
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Responsive overrides */
@media (max-width: 1023px) {
  .gp-right-panel {
    display: none !important;
  }
  .gp-left-panel {
    padding: 32px 24px !important;
    align-items: center !important;
  }
  .gp-left-panel > div {
    text-align: center;
    max-width: 100% !important;
  }
  .gp-left-panel p {
    margin-left: auto;
    margin-right: auto;
  }
}

/* Mobile-first improvements */
@media (max-width: 767px) {
  /* Header improvements */
  .gp-header-title {
    font-size: 9px !important;
    letter-spacing: 0.1em !important;
  }

  /* Hero section */
  .gp-hero-title {
    font-size: 32px !important;
    line-height: 1.2 !important;
  }

  /* Profile section */
  .gp-profile-row {
    flex-direction: column !important;
    align-items: center !important;
    text-align: center;
  }
  .gp-avatar-wrap {
    width: 100px !important;
    height: 100px !important;
  }

  /* Stats grid - 2 columns on mobile */
  .gp-page-stats {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 1px !important;
  }
  .gp-page-stats > div:nth-child(5) {
    grid-column: span 2;
  }

  /* Content grid */
  .gp-content-grid {
    grid-template-columns: 1fr !important;
    gap: 32px !important;
  }

  /* Analysis grid */
  .gp-analysis-grid {
    grid-template-columns: 1fr !important;
    gap: 24px !important;
    text-align: center;
    padding: 24px !important;
  }

  /* Sidebar becomes full width */
  .gp-sidebar {
    order: -1;
  }
}

/* Small mobile adjustments */
@media (max-width: 479px) {
  .mx-auto {
    padding-left: 16px !important;
    padding-right: 16px !important;
  }

  .gp-hero-title {
    font-size: 28px !important;
  }

  .gp-analysis-grid {
    padding: 20px !important;
  }
}

/* Tablet range */
@media (min-width: 768px) and (max-width: 1023px) {
  .gp-content-grid {
    grid-template-columns: 1fr 240px !important;
    gap: 32px !important;
  }

  .gp-page-stats {
    grid-template-columns: repeat(5, 1fr) !important;
  }
}
/* Hover arrow animation */
.group:hover svg[viewBox='0 0 16 16'][fill='none'] {
  opacity: 1 !important;
  transform: translateX(0) !important;
}
</style>
