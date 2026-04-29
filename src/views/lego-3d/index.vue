<script setup lang="ts">
import { ref } from 'vue'
import { useHead } from '@unhead/vue'
import { Icon } from '@iconify/vue'
import { useLegoBuilder } from './composables/use-lego-builder'
import LegoView from './components/LegoView.vue'
import LegoToolbar from './components/LegoToolbar.vue'

useHead({
  title: 'Lego 3D Builder | J2TEAM Vibe',
  meta: [
    { name: 'description', content: 'Xây dựng thế giới LEGO 3D của riêng bạn ngay trên trình duyệt.' }
  ]
})

const {
  bricks,
  activeBrickType,
  activeColor,
  addBrick,
  removeBrick,
  clearAll,
  undo,
  redo,
  canUndo,
  canRedo,
} = useLegoBuilder()

const showConfirmModal = ref(false)

function handleClear() {
  showConfirmModal.value = true
}

function confirmClear() {
  clearAll()
  showConfirmModal.value = false
}
</script>

<template>
  <div class="h-screen bg-bg-deep text-text-primary font-body flex flex-col overflow-hidden select-none">
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-50 pointer-events-none">
      <div class="flex items-center gap-4 pointer-events-auto">
        <RouterLink 
          to="/" 
          class="size-10 md:size-12 flex items-center justify-center bg-bg-surface/80 backdrop-blur-md border border-border-default hover:border-accent-coral transition-colors group"
        >
          <Icon icon="lucide:arrow-left" class="size-5 group-hover:-translate-x-1 transition-transform" />
        </RouterLink>
        <div class="flex flex-col">
          <h1 class="text-lg md:text-xl font-display font-bold leading-none">// LEGO BUILDER</h1>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-[10px] md:text-xs text-text-dim uppercase tracking-[0.2em]">3D Creative Studio</span>
            <div class="w-1 h-1 bg-border-default rounded-full" />
            <a href="https://facebook.com/nmdung.dev" target="_blank" rel="noopener noreferrer" class="text-[10px] md:text-xs text-accent-coral hover:underline font-mono">by nmdung.dev</a>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 pointer-events-auto bg-bg-surface/80 backdrop-blur-md border border-border-default px-4 h-10 md:h-12">
        <div class="flex items-center gap-2">
          <div class="size-2 bg-green-500 rounded-full animate-pulse" />
          <span class="text-[10px] md:text-xs font-mono text-text-secondary uppercase tracking-wider">{{ bricks?.length || 0 }} BRICKS</span>
        </div>
      </div>
    </header>

    <!-- 3D Canvas -->
    <main class="flex-1 relative">
      <LegoView 
        :bricks="bricks" 
        :active-brick-type="activeBrickType" 
        :active-color="activeColor"
        @add-brick="addBrick"
        @remove-brick="removeBrick"
      />

      <!-- Instructions Overlay -->
      <div class="absolute top-24 left-4 md:left-6 space-y-2 pointer-events-none opacity-40 hover:opacity-100 transition-opacity">
        <div class="flex items-center gap-2 text-[10px] md:text-xs text-text-secondary">
          <div class="px-1.5 py-0.5 border border-border-default rounded">Click</div>
          <span>để đặt gạch</span>
        </div>
        <div class="flex items-center gap-2 text-[10px] md:text-xs text-text-secondary">
          <div class="px-1.5 py-0.5 border border-border-default rounded">Alt + Click</div>
          <span>để xóa gạch</span>
        </div>
        <div class="flex items-center gap-2 text-[10px] md:text-xs text-text-secondary">
          <div class="px-1.5 py-0.5 border border-border-default rounded">Giữ chuột trái</div>
          <span>để xoay</span>
        </div>
        <div class="flex items-center gap-2 text-[10px] md:text-xs text-text-secondary">
          <div class="px-1.5 py-0.5 border border-border-default rounded">Giữ chuột phải</div>
          <span>để di chuyển</span>
        </div>
      </div>
    </main>

    <!-- Toolbar & Footer -->
    <LegoToolbar
      v-model:active-brick-type="activeBrickType"
      v-model:active-color="activeColor"
      :can-undo="canUndo"
      :can-redo="canRedo"
      @undo="undo"
      @redo="redo"
      @clear="handleClear"
    />

    <!-- Custom Confirm Modal -->
    <Transition name="fade">
      <div v-if="showConfirmModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showConfirmModal = false" />
        <div class="relative bg-bg-surface border-2 border-border-default p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
          <div class="flex flex-col items-center text-center gap-4">
            <div class="size-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-2">
              <Icon icon="lucide:trash-2" class="size-8" />
            </div>
            <h2 class="text-xl font-display font-bold">Xóa tất cả?</h2>
            <p class="text-text-secondary text-sm leading-relaxed">
              Bạn có chắc chắn muốn xóa tất cả các khối gạch không? Hành động này sẽ không thể quay lại.
            </p>
            <div class="flex flex-col w-full gap-3 mt-4">
              <button 
                @click="confirmClear"
                class="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Icon icon="lucide:check" class="size-5" />
                XÓA NGAY
              </button>
              <button 
                @click="showConfirmModal = false"
                class="w-full py-3 bg-bg-elevated hover:bg-border-default text-text-primary font-bold transition-all active:scale-95"
              >
                QUAY LẠI
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Decorative elements -->
    <div class="fixed top-0 right-0 w-64 h-64 bg-accent-coral/5 blur-[120px] pointer-events-none" />
    <div class="fixed bottom-0 left-0 w-96 h-96 bg-accent-sky/5 blur-[150px] pointer-events-none" />
  </div>
</template>

<style scoped>
.font-display {
  font-family: 'Anybody', sans-serif;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
