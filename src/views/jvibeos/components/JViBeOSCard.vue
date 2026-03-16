<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { AppItem } from '../composables/useApps'
import { formatViews, formatDuration } from '../composables/useApps'

defineProps<{
  app: AppItem
}>()

const isBlurred = ref(true)

const gradientColors: [string, string][] = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a8edea', '#fed6e3'],
  ['#ff9a9e', '#fecfef'],
  ['#ffecd2', '#fcb69f'],
  ['#ff6b6b', '#feca57'],
  ['#5ee7df', '#b490ca'],
]

const getGradient = (index: number) => {
  const colors = gradientColors[index % gradientColors.length]!
  return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
}

const toggleBlur = () => {
  isBlurred.value = !isBlurred.value
}

const stars = [1, 2, 3, 4, 5]
</script>

<template>
  <RouterLink
    :to="isBlurred ? '#' : `/jvibeos?app=${encodeURIComponent(app.path.slice(1))}`"
    class="video-card"
    @click.prevent="isBlurred ? toggleBlur() : null"
  >
    <div class="thumbnail" :style="{ background: getGradient(app.name.charCodeAt(0)) }">
      <!-- Blur overlay -->
      <div v-if="isBlurred" class="blur-overlay" @click.stop="toggleBlur">
        <div class="blur-warning"></div>
      </div>

      <div v-else class="thumbnail-overlay">
        <div class="play-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <polygon points="5 3 19 12 5 21" />
          </svg>
        </div>
      </div>
      <span class="duration">{{ formatDuration(app.duration) }}</span>
    </div>

    <div class="info">
      <h3 class="title">{{ app.name }}</h3>

      <div class="meta">
        <span class="views">{{ formatViews(app.views) }} views</span>
        <span class="separator">•</span>
        <span class="rating">
          <span class="stars">
            <span
              v-for="star in stars"
              :key="star"
              class="star"
              :class="{ filled: star <= Math.round(app.rating) }"
              >★</span
            >
          </span>
          <span class="rating-value">{{ app.rating.toFixed(1) }}</span>
        </span>
      </div>

      <div class="author-tags-row">
        <RouterLink :to="`/jvibeos?author=${encodeURIComponent(app.author)}`" class="by-link">
          <span class="by">by </span>
          <span class="author-name">{{ app.author }}</span>
        </RouterLink>
        <span class="tag category">{{ app.category }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.video-card {
  display: block;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s;
  width: 100%;
  min-width: 0;
  overflow: visible;
}

.video-card:hover {
  transform: translateY(-4px);
}

.thumbnail {
  position: relative;
  aspect-ratio: 16/9;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.blur-overlay {
  position: absolute;
  inset: 0;
  background: rgba(218, 218, 218, 0.19);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
}

.blur-warning {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #ffa500;
}

.warning-icon {
  font-size: 32px;
}

.warning-text {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.thumbnail-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.video-card:hover .thumbnail-overlay {
  background: rgba(0, 0, 0, 0.4);
}

.play-icon {
  width: 50px;
  height: 50px;
  background: rgba(255, 0, 0, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s;
}

.play-icon svg {
  width: 20px;
  height: 20px;
}

.video-card:hover .play-icon {
  opacity: 1;
  transform: scale(1);
}

.duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
}

.info {
  padding: 8px 4px;
  min-width: 0;
  /* Fixed height for info section */
  height: 85px;
  display: flex;
  flex-direction: column;
  overflow: visible;
}

.title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  height: 20px;
}

.meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.author-tags-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
}

.separator {
  color: #555;
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
  font-size: 11px;
}

.star.filled {
  color: #ffa500;
}

.rating-value {
  color: #ffa500;
}

.by-link {
  text-decoration: none;
}

.by-link:hover .author-name {
  color: #ff0000;
}

.by {
  color: #555;
}

.author-name {
  color: #aaa;
  transition: color 0.2s;
}

.tags {
  display: flex;
  gap: 6px;
}

.tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  text-transform: capitalize;
}

.tag.category {
  background: #222;
  color: #888;
}

/* Mobile responsive */
@media (max-width: 600px) {
  .info {
    height: auto;
    min-height: 60px;
  }

  .title {
    font-size: 12px;
    height: auto;
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .meta {
    font-size: 10px;
  }

  .author-name {
    font-size: 11px;
  }

  .by {
    font-size: 10px;
  }

  .tag {
    font-size: 10px;
    padding: 1px 6px;
  }

  .stars {
    display: none;
  }

  .rating-value {
    display: none;
  }
}
</style>
