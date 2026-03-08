<script setup lang="ts">
const emit = defineEmits<{
  (e: 'logOff'): void
  (e: 'turnOff'): void
}>()
</script>

<template>
  <div class="absolute bottom-[30px] left-0 w-[380px] h-[450px] bg-white rounded-tr-lg rounded-tl-lg shadow-2xl z-40 border-2 border-[#164ac1] flex overflow-hidden origin-bottom-left" @click.stop>
    <!-- User Profile Area -->
    <div class="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-[#175ce6] to-[#4083f2] flex items-center px-3 border-b-2 border-[#e67500] z-10 shadow-md">
       <img src="https://github.com/JinHuynh81.png" alt="User" class="w-12 h-12 rounded border-2 border-white shadow-sm" />
       <span class="ml-3 text-white font-bold text-lg drop-shadow" style="font-family: Arial, sans-serif;">Jin Huynh</span>
    </div>
    
    <!-- Apps Area (Left Panel) -->
    <div class="mt-16 w-[190px] bg-white flex flex-col p-2 gap-1 h-[calc(100%-112px)] overflow-y-auto">
      <!-- Pinned Apps -->
      <div class="flex items-center gap-3 p-2 hover:bg-[#316ac5] hover:text-white rounded cursor-pointer transition-colors group">
         <span class="text-3xl drop-shadow-sm group-hover:scale-110 transition-transform">🌐</span>
         <div class="flex flex-col">
          <span class="text-sm font-bold" style="font-family: Tahoma, sans-serif;">Internet Explorer</span>
          <span class="text-[10px] text-gray-500 group-hover:text-blue-200">Browser</span>
         </div>
      </div>
      
      <div class="flex items-center gap-3 p-2 hover:bg-[#316ac5] hover:text-white rounded cursor-pointer transition-colors group">
         <span class="text-3xl drop-shadow-sm group-hover:scale-110 transition-transform">✉️</span>
         <div class="flex flex-col">
          <span class="text-sm font-bold" style="font-family: Tahoma, sans-serif;">Outlook Express</span>
          <span class="text-[10px] text-gray-500 group-hover:text-blue-200">E-mail</span>
         </div>
      </div>

      <div class="w-full h-[1px] bg-gradient-to-r from-transparent via-[#d3e5fa] to-transparent my-2 basis-0 shrink-0"></div>

      <!-- Recent Apps (Mock) -->
      <div class="flex items-center gap-2 p-2 hover:bg-[#316ac5] hover:text-white rounded cursor-pointer transition-colors group">
         <span class="text-2xl drop-shadow-sm">📝</span>
         <span class="text-sm font-semibold" style="font-family: Tahoma, sans-serif;">Notepad</span>
      </div>
      <div class="flex items-center gap-2 p-2 hover:bg-[#316ac5] hover:text-white rounded cursor-pointer transition-colors group">
         <span class="text-2xl drop-shadow-sm">🎨</span>
         <span class="text-sm font-semibold" style="font-family: Tahoma, sans-serif;">Paint</span>
      </div>

      <!-- All Programs button -->
      <div class="flex items-center justify-center gap-1 mt-auto p-2 hover:bg-[#316ac5] hover:text-white rounded cursor-pointer transition-colors group pt-3 border-t border-[#d3e5fa]">
         <span class="font-bold text-xs" style="font-family: Tahoma, sans-serif;">All Programs</span>
         <span class="text-[10px] font-bold text-[#316ac5] group-hover:text-white">▶</span>
      </div>
    </div>

    <!-- System Folders Area (Right Panel) -->
    <div class="mt-16 w-[190px] bg-[#d3e5fa] border-l border-[#89bdf1] flex flex-col p-2 h-[calc(100%-112px)] shadow-[inset_1px_0_0_white]">
       <div class="flex items-center gap-3 p-1.5 hover:bg-[#316ac5] hover:text-white rounded cursor-pointer group">
         <span class="text-xl">🖺</span>
         <span class="text-xs font-bold text-[#0e2760] group-hover:text-white" style="font-family: Tahoma, sans-serif;">My Documents</span>
      </div>
       <div class="flex items-center gap-3 p-1.5 hover:bg-[#316ac5] hover:text-white rounded cursor-pointer group">
         <span class="text-xl">📁</span>
         <span class="text-xs font-bold text-[#0e2760] group-hover:text-white" style="font-family: Tahoma, sans-serif;">My Computer</span>
      </div>
      <div class="flex items-center gap-3 p-1.5 hover:bg-[#316ac5] hover:text-white rounded cursor-pointer group">
         <span class="text-xl">🖼️</span>
         <span class="text-xs font-bold text-[#0e2760] group-hover:text-white" style="font-family: Tahoma, sans-serif;">My Pictures</span>
      </div>

      <div class="w-full h-[1px] bg-gradient-to-r from-[#a6cdf7] via-[#89bdf1] to-transparent my-2 basis-0 shrink-0"></div>

       <div class="flex items-center gap-3 p-1.5 hover:bg-[#316ac5] hover:text-white rounded cursor-pointer group">
         <span class="text-xl">⚙️</span>
         <span class="text-xs font-bold text-[#0e2760] group-hover:text-white" style="font-family: Tahoma, sans-serif;">Control Panel</span>
      </div>
      <div class="flex items-center gap-3 p-1.5 hover:bg-[#316ac5] hover:text-white rounded cursor-pointer group">
         <span class="text-xl">🖨️</span>
         <span class="text-xs font-bold text-[#0e2760] group-hover:text-white" style="font-family: Tahoma, sans-serif;">Printers and Faxes</span>
      </div>

      <div class="w-full h-[1px] bg-gradient-to-r from-[#a6cdf7] via-[#89bdf1] to-transparent my-2 basis-0 shrink-0"></div>

      <div class="flex items-center gap-3 p-1.5 hover:bg-[#316ac5] hover:text-white rounded cursor-pointer group">
         <span class="text-xl">❓</span>
         <span class="text-xs text-[#0e2760] group-hover:text-white" style="font-family: Tahoma, sans-serif;">Help and Support</span>
      </div>
      <div class="flex items-center gap-3 p-1.5 hover:bg-[#316ac5] hover:text-white rounded cursor-pointer group">
         <span class="text-xl">🔍</span>
         <span class="text-xs text-[#0e2760] group-hover:text-white" style="font-family: Tahoma, sans-serif;">Search</span>
      </div>
      <div class="flex items-center gap-3 p-1.5 hover:bg-[#316ac5] hover:text-white rounded cursor-pointer group">
         <span class="text-xl">🏃</span>
         <span class="text-xs text-[#0e2760] group-hover:text-white" style="font-family: Tahoma, sans-serif;">Run...</span>
      </div>
    </div>

     <!-- Bottom Footer (Log off/Turn off) -->
    <div class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-r from-[#175ce6] to-[#4083f2] flex items-center justify-end px-4 gap-4 border-t border-[#4686f0] z-10">
       <div class="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" @click="emit('logOff')">
          <div class="w-6 h-6 rounded bg-yellow-400 flex items-center justify-center text-white text-[10px] border border-white shadow-md">🔑</div>
          <span class="text-white text-xs font-sans drop-shadow" style="font-family: Tahoma, sans-serif;">Log Off</span>
       </div>
       <div class="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" @click="emit('turnOff')">
          <div class="w-6 h-6 rounded bg-red-600 flex items-center justify-center text-white text-[10px] border border-white shadow-md">⏻</div>
          <span class="text-white text-xs font-sans drop-shadow" style="font-family: Tahoma, sans-serif;">Turn Off Computer</span>
       </div>
    </div>
  </div>
</template>
