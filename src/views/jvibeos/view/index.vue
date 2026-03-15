<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import type { CategoryId } from '@/data/categories'
import { processPages, formatViews, type AppItem } from '../composables/useApps'
import { getCategoryLabel } from '@/data/categories'
import ChillMusic from '../components/ChillMusic.vue'
import VibeMusic from '../components/VibeMusic.vue'

const route = useRoute()
const pagesData = ref<AppItem[]>([])
const isLoading = ref(true)

const appPath = computed(() => (route.query.app as string) || '')

onMounted(async () => {
  const pagesResponse = await fetch('/data/pages.json')
  const rawPages = (await pagesResponse.json()) as {
    name: string
    description: string
    author: string
    path: string
    category: CategoryId
  }[]
  pagesData.value = processPages(rawPages)
  isLoading.value = false

  // Start progress
  startProgress()

  // Listen for fullscreen changes
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

const currentApp = computed(() => {
  // Add leading slash if not present
  const fullPath = appPath.value.startsWith('/') ? appPath.value : `/${appPath.value}`
  return pagesData.value.find((app) => app.path === fullPath)
})

// Random rating 4-5
const displayRating = computed(() => {
  if (!currentApp.value) return 4.5
  return Math.random() * 1 + 4 // 4 to 5
})

const stars = [1, 2, 3, 4, 5]

const isPlaying = ref(true)
const progress = ref(30)
const duration = ref(225) // 3:45 = 225 seconds
const currentTime = ref(67) // 1:07 = 67 seconds
let progressInterval: number | null = null

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Seek functionality
const seekTo = (event: MouseEvent) => {
  const progressBar = event.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  currentTime.value = Math.floor(percent * duration.value)
  progress.value = percent * 100
}

const startProgress = () => {
  if (progressInterval) return
  progressInterval = window.setInterval(() => {
    if (currentTime.value < duration.value) {
      currentTime.value++
      progress.value = (currentTime.value / duration.value) * 100
    } else {
      stopProgress()
    }
  }, 1000)
}

const stopProgress = () => {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
}

const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    startProgress()
  } else {
    stopProgress()
  }
}

// 0 = default, 1 = expanded height (800px), 2 = fullscreen (desktop only)
const fullscreenState = ref(0)
const isMobile = ref(false)

onMounted(() => {
  isMobile.value = window.innerWidth <= 768
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth <= 768
  })
})

// Click on fullscreen/expand button
const toggleExpand = () => {
  const container = document.querySelector('.iframe-container') as HTMLElement

  if (fullscreenState.value === 0) {
    // First click: expand height
    container?.classList.add('expanded-height')
    fullscreenState.value = 1
  } else if (fullscreenState.value === 1) {
    // Second click: back to default (or fullscreen on desktop)
    container?.classList.remove('expanded-height')
    if (!isMobile.value) {
      container?.requestFullscreen()
      fullscreenState.value = 2
    } else {
      fullscreenState.value = 0
    }
  } else {
    // Third click (desktop only): back to default
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
    fullscreenState.value = 0
  }
}

// Random comments data
const fakeComments = [
  { user: 'DevFan001', time: '2 giờ trước', text: 'Video này quá đỉnh! 👏', likes: 42 },
  {
    user: 'CodeLover',
    time: '5 giờ trước',
    text: 'Mỗi video đều chất lượng, keep it up!',
    likes: 28,
  },
  { user: 'J2Teamer', time: '1 ngày trước', text: 'Siêu phẩm! Đã bookmark tất cả', likes: 56 },
  { user: 'WebDevVN', time: '2 ngày trước', text: 'Giao diện đẹp, nội dung mượt', likes: 15 },
  {
    user: 'TechEnthusiast',
    time: '3 ngày trước',
    text: 'Cảm ơn tác giả đã chia sẻ video hay!',
    likes: 23,
  },
  { user: 'CoderPro', time: '1 ngày trước', text: 'Video này quá chất lượng!', likes: 34 },
  { user: 'VueMaster', time: '4 giờ trước', text: 'Nội dung sạch, video đẹp!', likes: 19 },
  { user: 'JSNinja', time: '6 giờ trước', text: 'Mượt như butter 🍫', likes: 45 },
  { user: 'WebWizard', time: '2 ngày trước', text: 'Đỉnh của chóp!', likes: 67 },
  { user: 'FrontendGuru', time: '5 giờ trước', text: "Best video I've watched!", likes: 31 },
  { user: 'BugHunter', time: '1 ngày trước', text: 'Không có lỗi gì khi xem!', likes: 28 },
  { user: 'PixelPerfect', time: '3 ngày trước', text: 'Chất lượng video quá xuất sắc', likes: 52 },
  { user: 'StackOverflower', time: '4 giờ trước', text: 'Tuyệt vời!', likes: 14 },
  { user: 'GitMaster', time: '2 ngày trước', text: 'Nội dung hấp dẫn', likes: 38 },
  { user: 'ReactDev', time: '5 giờ trước', text: 'Amazing video content!', likes: 22 },
]

// Shuffle and pick 5 random comments
const getRandomComments = () => {
  const shuffled = [...fakeComments].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 5)
}

const displayedComments = ref(getRandomComments())

onUnmounted(() => {
  stopProgress()
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

const handleFullscreenChange = () => {
  if (!document.fullscreenElement && fullscreenState.value === 2) {
    fullscreenState.value = 0
    const container = document.querySelector('.iframe-container')
    container?.classList.remove('expanded-height')
  }
}

const shareApp = async () => {
  const url = window.location.href
  if (navigator.share) {
    try {
      await navigator.share({
        title: currentApp.value?.name || 'JViBeOS',
        text: currentApp.value?.description || '',
        url: url,
      })
    } catch {
      console.log('Share cancelled')
    }
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(url)
    alert('Đã copy link vào clipboard!')
  }
}
</script>

<template>
  <div class="view-page">
    <!-- Header -->
    <header class="view-header">
      <RouterLink to="/jvibeos" class="back-btn">
        <span class="back-icon">←</span>
        <span>Quay lại</span>
      </RouterLink>
      <h1 v-if="currentApp" class="app-title">{{ currentApp.name }}</h1>
    </header>

    <div v-if="isLoading" class="loading">Đang tải...</div>

    <div v-else-if="!currentApp" class="not-found">
      <h2>Không tìm thấy ứng dụng</h2>
      <RouterLink to="/jvibeos" class="back-link">Về trang chủ</RouterLink>
    </div>

    <template v-else>
      <!-- Main Content -->
      <div class="view-content">
        <!-- Iframe Container -->
        <div class="iframe-container">
          <iframe :src="currentApp.path" class="app-iframe" frameborder="0" allowfullscreen />

          <!-- Fake Video Controller -->
          <div class="video-controller">
            <div class="controller-left">
              <button class="ctrl-btn play-btn" @click="togglePlay">
                <svg
                  v-if="isPlaying"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <polygon points="5 3 19 12 5 21" />
                </svg>
              </button>
              <div class="volume-control">
                <button class="ctrl-btn volume-btn">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="controller-center">
              <div class="progress-bar" @click="seekTo">
                <div class="progress-played" :style="{ width: progress + '%' }"></div>
              </div>
              <div class="time-display">
                {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
              </div>
            </div>
            <div class="controller-right">
              <button class="ctrl-btn settings-btn">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path
                    d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
                  />
                </svg>
              </button>
              <button class="ctrl-btn fullscreen-btn" @click="toggleExpand">
                <!-- State 0: default - expand icon -->
                <svg
                  v-if="fullscreenState === 0"
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
                  <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                  <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                  <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                  <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                </svg>
                <!-- State 1: expanded - fullscreen icon -->
                <svg
                  v-else-if="fullscreenState === 1"
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
                  <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                  <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                  <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                  <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                </svg>
                <!-- State 2: fullscreen - shrink icon -->
                <svg
                  v-else
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
                  <path d="M4 14h6v6" />
                  <path d="M20 10h-6V4" />
                  <path d="M14 10l7-7" />
                  <path d="M3 21l7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Sidebar Info -->
        <div class="sidebar">
          <div class="app-info">
            <h2 class="app-name">{{ currentApp.name }}</h2>

            <div class="stats">
              <span class="views">{{ formatViews(currentApp.views) }} views</span>
              <span class="separator">•</span>
              <span class="rating">
                <span class="stars">
                  <span
                    v-for="star in stars"
                    :key="star"
                    class="star"
                    :class="{ filled: star <= Math.round(displayRating) }"
                    >★</span
                  >
                </span>
                <span class="rating-value">{{ displayRating.toFixed(1) }}</span>
              </span>
            </div>

            <div class="author-section">
              <div class="author-avatar">
                {{ currentApp.author.charAt(0).toUpperCase() }}
              </div>
              <div class="author-info">
                <span class="author-label">Tác giả</span>
                <RouterLink
                  :to="`/jvibeos?author=${encodeURIComponent(currentApp.author)}`"
                  class="author-name"
                >
                  {{ currentApp.author }}
                </RouterLink>
              </div>
            </div>

            <div class="description">
              <h3>Mô tả</h3>
              <p>{{ currentApp.description }}</p>
            </div>

            <div class="tags">
              <span class="tag-label">Danh mục:</span>
              <span class="tag category">{{ getCategoryLabel(currentApp.category) }}</span>
            </div>

            <!-- Actions -->
            <div class="actions">
              <button class="action-btn like-btn">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
                  />
                </svg>
                <span class="count">{{ Math.floor(Math.random() * 10000) + 100 }}</span>
              </button>
              <button class="action-btn share-btn" @click="shareApp">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>Chia sẻ</span>
              </button>
            </div>

            <!-- Chill Music Player -->
            <ChillMusic />
            <VibeMusic />
          </div>
        </div>
      </div>

      <!-- Comments Section -->
      <div class="comments-section">
        <h3 class="comments-title">Bình luận</h3>

        <!-- Fake Comment Input -->
        <div class="comment-input">
          <div class="user-avatar">You</div>
          <div class="input-wrapper">
            <textarea placeholder="Viết bình luận..." rows="2" class="comment-textarea" />
            <button class="submit-btn">Gửi</button>
          </div>
        </div>

        <!-- Fake Comments -->
        <div class="comments-list">
          <div v-for="comment in displayedComments" :key="comment.user" class="comment-item">
            <div class="comment-avatar">
              {{ comment.user.charAt(0) }}
            </div>
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-user">{{ comment.user }}</span>
                <span class="comment-time">{{ comment.time }}</span>
              </div>
              <p class="comment-text">{{ comment.text }}</p>
              <div class="comment-actions">
                <button class="reply-btn">👍 {{ comment.likes }}</button>
                <button class="reply-btn">Trả lời</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.view-page {
  min-height: 100vh;
  background: #000;
}

.view-header {
  background: #000;
  border-bottom: 1px solid #222;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ff0000;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.back-btn:hover {
  opacity: 0.8;
}

.back-icon {
  font-size: 18px;
}

.app-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
}

.loading,
.not-found {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.not-found h2 {
  color: #fff;
  margin-bottom: 16px;
}

.back-link {
  color: #ff0000;
}

.view-content {
  display: flex;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.iframe-container {
  flex: 1;
  aspect-ratio: 16/9;
  background: #111;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
}

.iframe-container.expanded-height {
  height: 800px;
  aspect-ratio: auto;
}

/* Mobile: expanded height */
@media (max-width: 768px) {
  .iframe-container.expanded-height {
    height: 60vh;
  }
}

.app-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* Video Controller */
.video-controller {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 30px 12px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}

.iframe-container:hover .video-controller {
  opacity: 1;
}

/* Mobile: always show video controller */
@media (max-width: 768px) {
  .video-controller {
    opacity: 1;
  }
}

.controller-left,
.controller-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.controller-center {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.ctrl-btn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.ctrl-btn svg {
  fill: currentColor;
}

.fullscreen-btn {
  padding: 10px;
}

.ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.play-btn {
  font-size: 18px;
}

.progress-bar {
  flex: 1;
  height: 5px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

.progress-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
}

.progress-played {
  height: 100%;
  background: linear-gradient(90deg, #ff0000, #ff4444);
  border-radius: 3px;
  position: relative;
  transition: width 0.3s linear;
}

.progress-played::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
}

.time-display {
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.sidebar {
  width: 350px;
  flex-shrink: 0;
}

.app-info {
  background: #111;
  border-radius: 8px;
  padding: 20px;
}

.app-name {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 12px;
}

.stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #999;
  margin-bottom: 16px;
}

.separator {
  color: #444;
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stars {
  display: flex;
}

.star {
  color: #444;
  font-size: 12px;
}

.star.filled {
  color: #ffa500;
}

.rating-value {
  color: #ffa500;
  font-weight: 500;
}

.author-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid #222;
  border-bottom: 1px solid #222;
  margin-bottom: 16px;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-label {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
}

.author-name {
  color: #fff;
  text-decoration: none;
  font-weight: 500;
}

.author-name:hover {
  color: #ff0000;
}

.description {
  margin-bottom: 16px;
}

.description h3 {
  font-size: 13px;
  color: #666;
  text-transform: uppercase;
  margin: 0 0 8px;
}

.description p {
  color: #aaa;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.tag-label {
  font-size: 13px;
  color: #666;
}

.tag.category {
  background: #222;
  color: #888;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: capitalize;
}

.actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.like-btn {
  background: #ff0000;
  color: #fff;
}

.like-btn:hover {
  background: #cc0000;
}

.share-btn {
  background: #222;
  color: #fff;
}

.share-btn:hover {
  background: #333;
}

/* Comments */
.comments-section {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px 40px;
}

.comments-title {
  font-size: 18px;
  color: #fff;
  margin: 0 0 20px;
}

.comment-input {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ff0000;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.input-wrapper {
  flex: 1;
}

.comment-textarea {
  width: 100%;
  background: #111;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 12px;
  color: #fff;
  font-size: 14px;
  resize: none;
  outline: none;
}

.comment-textarea:focus {
  border-color: #ff0000;
}

.comment-textarea::placeholder {
  color: #666;
}

.submit-btn {
  margin-top: 8px;
  background: #ff0000;
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}

.submit-btn:hover {
  background: #cc0000;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-user {
  color: #fff;
  font-weight: 500;
  font-size: 14px;
}

.comment-time {
  color: #666;
  font-size: 12px;
}

.comment-text {
  color: #aaa;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 8px;
}

.comment-actions {
  display: flex;
  gap: 12px;
}

.reply-btn {
  background: transparent;
  border: none;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 0;
}

.reply-btn:hover {
  color: #fff;
}

/* Responsive */
@media (max-width: 1100px) {
  .view-content {
    flex-direction: column;
  }

  .iframe-container {
    width: 100%;
  }

  .sidebar {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .view-content,
  .comments-section {
    padding: 12px;
  }

  .app-name {
    font-size: 16px;
  }

  .video-controller {
    padding: 20px 8px 8px;
    gap: 8px;
  }

  .controller-center {
    flex: 1;
    min-width: 0;
  }

  .progress-bar {
    height: 8px;
  }

  .progress-played::after {
    width: 16px;
    height: 16px;
  }

  .time-display {
    font-size: 10px;
  }

  .play-btn,
  .fullscreen-btn {
    font-size: 16px;
  }

  .view-header {
    gap: 8px;
    padding: 10px 12px;
  }

  .back-btn {
    align-items: center;
  }

  .app-title {
    font-size: 14px;
    flex: 1;
    min-width: 0;
  }
}
</style>
