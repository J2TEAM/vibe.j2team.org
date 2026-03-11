<script setup lang="ts">
const news = [
  'THBREAKING: NASA database breached by unknown hacker group "J2TEAM" // ',
  'GLOBAL ALERT: Massive DDoS attack takes down major cloud providers in APAC region // ',
  'CYBERSEC: NSA tools leaked on Dark Web marketplace // ',
  'FINANCE: $4.2B in crypto stolen from decentralized exchange // ',
  'WARNING: Zero-day exploit circulating for popular SSH daemon // ',
  'UPDATE: FBI Cyber Division tracking advanced persistent threat actor // ',
  'MARKETS: Tech stocks plummet after widespread infrastructure outages // ',
  'LOCAL: Anonymous user gains root access to municipal power grid // ',
]
</script>

<template>
  <div class="ticker-wrap">
    <div class="ticker-label">NEWS FEED</div>
    <div class="ticker-content">
      <div class="ticker-text">
        <span v-for="(item, i) in news" :key="i" class="ticker-item">{{ item }}</span>
        <!-- Duplicate for infinite scroll loop -->
        <span v-for="(item, i) in news" :key="'dup' + i" class="ticker-item">{{ item }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ticker-wrap {
  display: flex;
  align-items: center;
  height: 24px;
  background: rgba(0, 0, 0, 0.9);
  border-top: 1px solid rgba(0, 255, 65, 0.2);
  border-bottom: 1px solid rgba(0, 255, 65, 0.2);
  overflow: hidden;
  font-family: 'Courier New', monospace;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}
.ticker-label {
  background: #00ff41;
  color: #000;
  font-weight: bold;
  font-size: 10px;
  padding: 0 10px;
  height: 100%;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  letter-spacing: 1px;
  position: relative;
  z-index: 2;
}
.ticker-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  height: 100%;
}
.ticker-text {
  display: inline-flex;
  white-space: nowrap;
  animation: ticker-scroll 60s linear infinite;
  height: 100%;
  align-items: center;
}
.ticker-item {
  color: #00ff41;
  font-size: 11px;
  opacity: 0.8;
}
.ticker-item:nth-child(even) {
  color: #00d4ff;
}
@keyframes ticker-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}
</style>
