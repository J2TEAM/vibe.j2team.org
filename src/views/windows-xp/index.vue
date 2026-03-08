<script setup lang="ts">
import { ref, computed } from 'vue'

import XPTaskbar from './components/XPTaskbar.vue'
import XPStartMenu from './components/XPStartMenu.vue'
import XPWindow from './components/XPWindow.vue'
import XPDesktopIcon from './components/XPDesktopIcon.vue'
import XPContextMenu from './components/XPContextMenu.vue'

// ==== STATE ====
const startMenuOpen = ref(false)

// Config for all available apps/icons
const desktopApps = [
  { id: 'my-computer', title: 'My Computer', icon: '💻', initialX: 20, initialY: 20 },
  { id: 'recycle-bin', title: 'Recycle Bin', icon: '🗑️', initialX: 20, initialY: 110 },
  { id: 'internet-explorer', title: 'Internet Explorer', icon: '🌐', initialX: 20, initialY: 200 },
  { id: 'notepad', title: 'Read Me', icon: '📝', initialX: 20, initialY: 290 },
]

type WindowState = {
  id: string;
  title: string;
  icon: string;
  isOpen: boolean;
  zIndex: number;
  initialX: number;
  initialY: number;
  width?: string;
  height?: string;
}

const windows = ref<WindowState[]>([
  {
    ...desktopApps.find(a => a.id === 'notepad')!,
    isOpen: true, // Auto open Notepad on load
    zIndex: 10,
    initialX: 100,
    initialY: 100,
  }
])

let maxZIndex = 10

const activeWindowId = computed(() => {
  const openWindows = windows.value.filter(w => w.isOpen)
  if (openWindows.length === 0) return null
  return openWindows.reduce((prev, curr) => (prev.zIndex > curr.zIndex ? prev : curr)).id
})

// ==== METHODS ====
const toggleStartMenu = () => {
  startMenuOpen.value = !startMenuOpen.value
  contextMenu.value.show = false
}

const closeStartMenu = () => {
  if (startMenuOpen.value) startMenuOpen.value = false
}

const closeAllMenus = () => {
  closeStartMenu()
  contextMenu.value.show = false
}

const contextMenu = ref({
  show: false,
  x: 0,
  y: 0
})

const onDesktopRightClick = (e: MouseEvent) => {
  // If Shift key is pressed, allow the default browser context menu to appear
  if (e.shiftKey) {
    return
  }

  // Prevent default context menu
  e.preventDefault()
  
  // Don't show desktop context menu if clicking inside an active window (let the window handle its own or do nothing)
  const target = e.target as HTMLElement
  if (target.closest('.pointer-events-auto')) {
    // If it's a window, just let it be (don't show desktop menu)
    return
  }
  
  contextMenu.value.show = true
  contextMenu.value.x = e.clientX
  contextMenu.value.y = e.clientY
  closeStartMenu() // Only close start menu, keep context menu open
}

const closeContextMenu = () => {
  contextMenu.value.show = false
}

const handleContextMenuAction = (action: string) => {
  if (action === 'back') {
    window.history.back()
  } else if (action === 'forward') {
    window.history.forward()
  } else if (action === 'reload') {
    window.location.reload()
  } else if (action === 'print') {
    window.print()
  } else if (action === 'view-source') {
    window.open('view-source:' + window.location.href)
  } else if (action === 'save-as') {
    alert('Bảo mật trình duyệt không cho phép JS tự "Save as...". Nhấn Ctrl+S trên bàn phím nhé!')
  } else if (action === 'inspect') {
    alert('Nhấn F12 trên bàn phím để mở DevTools nhé!')
  }
  closeContextMenu()
}

const openApp = (appId: string) => {
  const existingWindow = windows.value.find(w => w.id === appId)
  if (existingWindow) {
    existingWindow.isOpen = true
    focusWindow(appId)
  } else {
    const appDef = desktopApps.find(a => a.id === appId)
    if (appDef) {
      windows.value.push({
        ...appDef,
        isOpen: true,
        zIndex: ++maxZIndex,
        // offset a bit manually
        initialX: 150 + Math.random() * 50,
        initialY: 100 + Math.random() * 50,
        width: appId === 'internet-explorer' ? '800px' : '500px',
        height: appId === 'internet-explorer' ? '600px' : '400px',
      })
    }
  }
  closeStartMenu()
}

const closeWindow = (appId: string) => {
  const win = windows.value.find(w => w.id === appId)
  if (win) win.isOpen = false
}

const focusWindow = (appId: string) => {
  const win = windows.value.find(w => w.id === appId)
  if (win && win.zIndex < maxZIndex) {
    win.zIndex = ++maxZIndex
  }
}

const handleLogOff = () => {
  if (confirm('Are you sure you want to log off?')) {
     alert('Goodbye!')
  }
}
const handleTurnOff = () => {
   if (confirm('Are you sure you want to shut down?')) {
     document.documentElement.innerHTML = '<div style="background:black; color:white; width: 100vw; height: 100vh; display: flex; align-items:center; justify-content:center; font-family: sans-serif">It is now safe to turn off your computer.</div>'
  }
}

</script>

<template>
  <div class="xp-desktop h-screen w-full relative overflow-hidden select-none" @click="closeAllMenus" @contextmenu="onDesktopRightClick">
    <!-- Back to Home Button -->
    <RouterLink to="/" class="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-b from-[#3c81f3] to-[#2c6bf0] border border-white/50 text-white text-sm font-bold shadow-md rounded hover:brightness-110 active:brightness-90 transition-all font-sans cursor-pointer" style="text-shadow: 1px 1px 2px rgba(0,0,0,0.6); box-shadow: inset 0 1px 1px rgba(255,255,255,0.4), 2px 2px 4px rgba(0,0,0,0.5);">
      🏠 Về trang chủ
    </RouterLink>

    <!-- Desktop Background -->
    <div class="absolute inset-0 bg-[#0055e5] bg-cover bg-center z-0" style="background-image: url('https://upload.wikimedia.org/wikipedia/en/2/27/Bliss_%28Windows_XP%29.png');"></div>

    <!-- Desktop Icons -->
    <div class="relative z-10 w-full h-[calc(100vh-30px)]">
      <XPDesktopIcon 
        v-for="app in desktopApps" 
        :key="app.id"
        :id="app.id"
        :title="app.title"
        :icon="app.icon"
        :initial-x="app.initialX"
        :initial-y="app.initialY"
        @dblclick="openApp"
      />
    </div>

    <!-- Windows Container -->
    <div class="absolute inset-0 z-20 pointer-events-none h-[calc(100vh-30px)]">
      <!-- We make the container pointer-events-none, but windows inside pointer-events-auto -->
      <div v-for="win in windows" :key="win.id" class="pointer-events-auto">
        <Transition name="window-open">
          <XPWindow 
            v-show="win.isOpen"
            :id="win.id"
            :title="win.title"
            :icon="win.icon"
            :is-active="activeWindowId === win.id"
            :z-index="win.zIndex"
            :initial-x="win.initialX"
            :initial-y="win.initialY"
            :width="win.width"
            :height="win.height"
            @close="closeWindow"
            @focus="focusWindow"
          >
            <!-- Content based on app ID -->
            <div v-if="win.id === 'notepad'" class="h-full w-full bg-white text-black p-2 font-mono text-sm leading-relaxed overflow-y-auto">
              Welcome to the Windows XP vibe!
              <br><br>
              Bạn đã mở thành công Notepad.
              Dưới đây là một số tính năng bạn có thể thử:
              <br>- Click đúp thanh tiêu đề để phóng to / thu nhỏ.
              <br>- Kéo thả cửa sổ quanh màn hình.
              <br>- Nhấn nút Start bên dưới góc trái.
              <br>- Mở thêm vài ứng dụng khác từ Desktop để xem hiệu ứng z-index.
              <br><br>
              Chúc vui !!!
            </div>
            
            <div v-else-if="win.id === 'internet-explorer'" class="h-full w-full flex flex-col">
               <div class="h-8 bg-[#ece9d8] border-b border-gray-300 flex items-center px-2 gap-2 shrink-0">
                  <button class="px-2 py-0.5 border border-transparent hover:border-gray-400 hover:shadow-sm rounded bg-white/50 text-xs flex items-center gap-1 disabled:opacity-50">⬅ Back</button>
                  <button class="px-2 py-0.5 border border-transparent hover:border-gray-400 hover:shadow-sm rounded bg-white/50 text-xs flex items-center gap-1">➡ Forward</button>
                  <button class="px-2 py-0.5 border border-transparent hover:border-gray-400 hover:shadow-sm rounded bg-white/50 text-xs flex items-center gap-1">🔄 Refresh</button>
                  <button class="px-2 py-0.5 border border-transparent hover:border-gray-400 hover:shadow-sm rounded bg-white/50 text-xs flex items-center gap-1">🏠 Home</button>
               </div>
               <div class="h-8 bg-[#ece9d8] border-b border-gray-300 flex items-center px-2 gap-2 shrink-0 text-sm">
                  <span class="text-gray-600">Address</span>
                  <div class="flex-1 bg-white border border-gray-400 shadow-inner px-2 py-0.5 text-black h-6 flex items-center truncate">http://vibe.j2team.org</div>
                  <button class="px-2 py-0.5 border border-gray-400 rounded bg-gray-100 flex items-center gap-1 hover:bg-gray-200">Go</button>
               </div>
               <div class="flex-1 overflow-auto bg-white flex items-center justify-center p-8">
                  <div class="text-center">
                     <h1 class="text-3xl font-bold text-[#0055e5] mb-4">MSN Internet Search</h1>
                     <p class="text-gray-600">Cannot find server or DNS Error</p>
                     <p class="text-gray-600">Internet Explorer</p>
                  </div>
               </div>
            </div>

            <div v-else class="h-full w-full bg-white flex items-center justify-center">
              <span class="text-gray-400">{{ win.title }} content placeholder</span>
            </div>
          </XPWindow>
        </Transition>
      </div>
    </div>

    <!-- Start Menu -->
    <Transition name="fade-slide">
      <XPStartMenu 
        v-if="startMenuOpen" 
        @log-off="handleLogOff" 
        @turn-off="handleTurnOff"
      />
    </Transition>

    <!-- Context Menu -->
    <XPContextMenu 
      v-if="contextMenu.show"
      :x="contextMenu.x"
      :y="contextMenu.y"
      @close="closeContextMenu"
      @action="handleContextMenuAction"
    />

    <!-- Taskbar -->
    <XPTaskbar 
      :start-menu-open="startMenuOpen" 
      @toggle-start-menu="toggleStartMenu" 
    >
      <!-- Currently open taskbar buttons -->
      <template #default>
         <button 
            v-for="win in windows.filter(w => w.isOpen)" 
            :key="'tb-'+win.id"
            class="w-[150px] max-w-[150px] h-[24px] rounded-sm flex items-center px-2 cursor-pointer text-white truncate transition-all overflow-hidden"
            :class="activeWindowId === win.id ? 'bg-gradient-to-b from-[#1a51c4] to-[#103482] border border-[#164ac1] shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]' : 'bg-gradient-to-b from-[#3c81f3] to-[#2c6bf0] border border-[#164ac1] shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] hover:from-[#5c98f5] hover:to-[#3e82f2]'"
            @click="focusWindow(win.id)"
         >
            <span class="text-xs truncate font-bold drop-shadow" style="font-family: Tahoma, sans-serif;">{{ win.icon }} {{ win.title }}</span>
         </button>
      </template>
    </XPTaskbar>
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

.window-open-enter-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
}
.window-open-leave-active {
  transition: all 0.15s ease-in;
}
.window-open-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.window-open-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
