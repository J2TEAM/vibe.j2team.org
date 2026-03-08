<script setup lang="ts">
import { ref } from 'vue'
import GameBugdle from './components/GameBugdle.vue'
import GameTechdle from './components/GameTechdle.vue'
import GameClient from './components/GameClient.vue'
import GameCursed from './components/GameCursed.vue'

const modes = [
  { id: 'bugdle', name: 'Bugdle', icon: '🐛', description: 'Đoán tên lỗi gây trầm cảm phổ biến.', component: GameBugdle },
  { id: 'techdle', name: 'Techdle', icon: '💻', description: 'Kiểm tra kiến thức về các công cụ & ngôn ngữ.', component: GameTechdle },
  { id: 'client', name: 'Guess the Client', icon: '👨‍💼', description: 'Đọc vị ý tưởng thực sự của khách hàng & PM.', component: GameClient },
  { id: 'cursed', name: 'Cursed Code', icon: '💀', description: 'Hack não với những đoạn code JS độc hại.', component: GameCursed },
]

const activeMode = ref<string | null>(null)
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center py-10 px-4 md:px-8">
    
    <div class="w-full max-w-5xl relative">
      <!-- Decorative Elements -->
      <div class="absolute -top-10 left-10 text-9xl text-accent-coral/5 font-display rotate-12 select-none pointer-events-none">👻</div>
      <div class="absolute top-20 right-0 text-8xl text-accent-amber/5 font-display -rotate-12 select-none pointer-events-none">?</div>

      <!-- Header Section -->
      <header class="text-center space-y-4 pt-10 mb-12 animate-fade-up">
        <h1 class="font-display text-5xl md:text-7xl font-bold text-accent-coral tracking-tight">
          Quiz Ghost
        </h1>
        <p class="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto">
          Wordle phiên bản <span class="text-accent-amber font-semibold">trầm cảm</span> dành cho hội Developers. 
          <br class="hidden sm:block"/> <span class="bg-bg-surface px-2 py-1 mt-2 inline-block border border-border-default text-sm tracking-wide">Mỗi ngày 5 câu, tự làm mới sau 0h.</span>
        </p>
      </header>

      <!-- Entry Mode Selection -->
      <main v-if="!activeMode" class="animate-fade-up animate-delay-2 w-full">
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-2 mb-12">
          <button v-for="mode in modes" :key="mode.id"
            @click="activeMode = mode.id"
            class="group text-left border border-border-default bg-bg-surface p-6 sm:p-8
                   transition-all duration-300 relative overflow-hidden
                   hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated">
            
            <div class="absolute top-0 right-0 w-16 h-16 bg-accent-coral/5 rounded-bl-full flex items-center justify-center -mr-8 -mt-8 group-hover:bg-accent-coral/10 transition-colors"></div>
            
            <span class="text-5xl block mb-4">{{ mode.icon }}</span>
            <h3 class="font-display text-2xl font-semibold text-text-primary mb-2 group-hover:text-accent-coral transition-colors flex items-center gap-2">
              <span class="text-accent-coral text-sm tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">//</span>
              {{ mode.name }}
            </h3>
            <p class="text-text-secondary text-base">{{ mode.description }}</p>
          </button>
        </div>
        
        <div class="text-center mt-12">
          <RouterLink to="/" class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-6 py-3 text-sm font-display tracking-widest text-text-secondary transition hover:border-accent-coral hover:text-accent-coral">
            &larr; QUAY LẠI TRANG CHỦ
          </RouterLink>
        </div>
      </main>

      <!-- Game Active Area -->
      <main v-else class="animate-fade-up w-full flex flex-col pb-24">
        
        <!-- Render Active Mode Component -->
        <div class="w-full flex-1">
          <Transition name="fade" mode="out-in">
            <KeepAlive>
              <component :is="modes.find(m => m.id === activeMode)?.component" :key="activeMode" />
            </KeepAlive>
          </Transition>
        </div>

      </main>
      
      <!-- Sticky Footer Mode Switcher -->
      <div v-if="activeMode" class="fixed bottom-0 left-0 w-full border-t border-border-default bg-bg-deep/95 backdrop-blur z-50 animate-fade-up">
        <div class="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button @click="activeMode = null" class="text-text-secondary hover:text-accent-coral flex items-center gap-2 text-sm font-display tracking-widest group">
            <span class="text-accent-coral group-hover:-translate-x-1 transition-transform">&larr;</span> HUB
          </button>
          
          <div class="flex flex-wrap justify-center gap-2">
            <span class="text-text-dim text-xs font-display flex items-center mr-2 hidden md:flex">ĐỔI MODE_</span>
            
            <!-- Generate Mode buttons EXCEPT the current one -->
            <button v-for="mode in modes.filter(m => m.id !== activeMode)" :key="mode.id"
              @click="activeMode = mode.id"
              class="border border-border-default bg-bg-surface px-4 py-2 flex items-center gap-2 hover:border-accent-coral hover:text-accent-coral transition-colors">
              <span>{{ mode.icon }}</span>
              <span class="hidden sm:inline font-display text-sm">{{ mode.name }}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
