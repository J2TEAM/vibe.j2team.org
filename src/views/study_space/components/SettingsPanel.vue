<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useSpaceSettings } from '../composables/useSpaceSettings'

const settings = useSpaceSettings()
const isOpen = ref(false)

function resetSettings() {
  settings.value.showClock = true
  settings.value.showDate = true
  settings.value.showQuote = true
  settings.value.showScenePicker = true
  settings.value.showPomodoro = true
  settings.value.showTodo = true
  settings.value.showMusic = true
  settings.value.zenMode = false
  settings.value.overlayOpacity = 40
}
</script>

<template>
  <!-- Gear Trigger Button (slot into parent bottom bar) -->
  <button
    class="flex items-center gap-2 border border-white/20 bg-black/50 px-3 py-2 text-sm text-white/60 backdrop-blur-md transition-all hover:border-white/40 hover:bg-black/60 hover:text-white"
    :class="{ 'border-accent-sky/50 bg-accent-sky/10 text-accent-sky': isOpen }"
    @click="isOpen = true"
  >
    <Icon icon="lucide:settings-2" class="size-4" />
    <span class="hidden sm:inline">Cài đặt</span>
  </button>

  <!-- Modal Overlay -->
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      @click.self="isOpen = false"
    >
      <!-- Panel -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          class="w-full max-w-sm border border-white/20 bg-[#0f1923]/95 backdrop-blur-xl"
        >
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 class="font-display text-base font-semibold tracking-wide text-white">
              <Icon icon="lucide:settings-2" class="mr-2 inline size-4 text-accent-sky" />
              Cài đặt không gian
            </h2>
            <button class="text-white/40 transition hover:text-white" @click="isOpen = false">
              <Icon icon="lucide:x" class="size-5" />
            </button>
          </div>

          <div class="max-h-[70vh] overflow-y-auto">
            <!-- Section: Hiển thị -->
            <div class="border-b border-white/10 px-5 py-4">
              <h3 class="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                Thành phần hiển thị
              </h3>
              <div class="space-y-3">
                <!-- Clock -->
                <label class="flex cursor-pointer items-center justify-between gap-3">
                  <div class="flex items-center gap-2.5 text-sm text-white/70">
                    <Icon icon="lucide:clock" class="size-4 shrink-0 text-white/40" />
                    Đồng hồ chính giữa
                  </div>
                  <button
                    role="switch"
                    :aria-checked="settings.showClock"
                    class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
                    :class="settings.showClock ? 'bg-accent-coral' : 'bg-white/20'"
                    @click="settings.showClock = !settings.showClock"
                  >
                    <span
                      class="absolute inset-y-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200"
                      :class="settings.showClock ? 'translate-x-4' : 'translate-x-0'"
                    />
                  </button>
                </label>

                <!-- Date -->
                <label class="flex cursor-pointer items-center justify-between gap-3">
                  <div class="flex items-center gap-2.5 text-sm text-white/70">
                    <Icon icon="lucide:calendar" class="size-4 shrink-0 text-white/40" />
                    Ngày tháng
                  </div>
                  <button
                    role="switch"
                    :aria-checked="settings.showDate"
                    class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
                    :class="settings.showDate ? 'bg-accent-coral' : 'bg-white/20'"
                    @click="settings.showDate = !settings.showDate"
                  >
                    <span
                      class="absolute inset-y-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200"
                      :class="settings.showDate ? 'translate-x-4' : 'translate-x-0'"
                    />
                  </button>
                </label>

                <!-- Quote -->
                <label class="flex cursor-pointer items-center justify-between gap-3">
                  <div class="flex items-center gap-2.5 text-sm text-white/70">
                    <Icon icon="lucide:quote" class="size-4 shrink-0 text-white/40" />
                    Câu trích dẫn
                  </div>
                  <button
                    role="switch"
                    :aria-checked="settings.showQuote"
                    class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
                    :class="settings.showQuote ? 'bg-accent-coral' : 'bg-white/20'"
                    @click="settings.showQuote = !settings.showQuote"
                  >
                    <span
                      class="absolute inset-y-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200"
                      :class="settings.showQuote ? 'translate-x-4' : 'translate-x-0'"
                    />
                  </button>
                </label>

                <!-- Scene Picker -->
                <label class="flex cursor-pointer items-center justify-between gap-3">
                  <div class="flex items-center gap-2.5 text-sm text-white/70">
                    <Icon icon="lucide:image" class="size-4 shrink-0 text-white/40" />
                    Bộ chọn cảnh nền
                  </div>
                  <button
                    role="switch"
                    :aria-checked="settings.showScenePicker"
                    class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
                    :class="settings.showScenePicker ? 'bg-accent-coral' : 'bg-white/20'"
                    @click="settings.showScenePicker = !settings.showScenePicker"
                  >
                    <span
                      class="absolute inset-y-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200"
                      :class="settings.showScenePicker ? 'translate-x-4' : 'translate-x-0'"
                    />
                  </button>
                </label>

                <!-- Pomodoro -->
                <label class="flex cursor-pointer items-center justify-between gap-3">
                  <div class="flex items-center gap-2.5 text-sm text-white/70">
                    <Icon icon="lucide:timer" class="size-4 shrink-0 text-white/40" />
                    Đồng hồ Pomodoro
                  </div>
                  <button
                    role="switch"
                    :aria-checked="settings.showPomodoro"
                    class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
                    :class="settings.showPomodoro ? 'bg-accent-coral' : 'bg-white/20'"
                    @click="settings.showPomodoro = !settings.showPomodoro"
                  >
                    <span
                      class="absolute inset-y-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200"
                      :class="settings.showPomodoro ? 'translate-x-4' : 'translate-x-0'"
                    />
                  </button>
                </label>

                <!-- Todo -->
                <label class="flex cursor-pointer items-center justify-between gap-3">
                  <div class="flex items-center gap-2.5 text-sm text-white/70">
                    <Icon icon="lucide:list-todo" class="size-4 shrink-0 text-white/40" />
                    Danh sách việc cần làm
                  </div>
                  <button
                    role="switch"
                    :aria-checked="settings.showTodo"
                    class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
                    :class="settings.showTodo ? 'bg-accent-coral' : 'bg-white/20'"
                    @click="settings.showTodo = !settings.showTodo"
                  >
                    <span
                      class="absolute inset-y-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200"
                      :class="settings.showTodo ? 'translate-x-4' : 'translate-x-0'"
                    />
                  </button>
                </label>

                <!-- Music -->
                <label class="flex cursor-pointer items-center justify-between gap-3">
                  <div class="flex items-center gap-2.5 text-sm text-white/70">
                    <Icon icon="lucide:music" class="size-4 shrink-0 text-white/40" />
                    Âm nhạc & Âm thanh
                  </div>
                  <button
                    role="switch"
                    :aria-checked="settings.showMusic"
                    class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
                    :class="settings.showMusic ? 'bg-accent-coral' : 'bg-white/20'"
                    @click="settings.showMusic = !settings.showMusic"
                  >
                    <span
                      class="absolute inset-y-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200"
                      :class="settings.showMusic ? 'translate-x-4' : 'translate-x-0'"
                    />
                  </button>
                </label>
              </div>
            </div>

            <!-- Section: Giao diện -->
            <div class="border-b border-white/10 px-5 py-4">
              <h3 class="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                Giao diện
              </h3>
              <div class="space-y-4">
                <!-- Overlay opacity -->
                <div>
                  <div class="mb-2 flex items-center justify-between">
                    <div class="flex items-center gap-2.5 text-sm text-white/70">
                      <Icon icon="lucide:contrast" class="size-4 shrink-0 text-white/40" />
                      Độ tối nền video
                    </div>
                    <span class="text-xs tabular-nums text-white/40"
                      >{{ settings.overlayOpacity }}%</span
                    >
                  </div>
                  <input
                    v-model.number="settings.overlayOpacity"
                    type="range"
                    min="0"
                    max="80"
                    step="5"
                    class="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-accent-sky [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-sky"
                  />
                  <div class="mt-1 flex justify-between text-[10px] text-white/25">
                    <span>Sáng hơn</span>
                    <span>Tối hơn</span>
                  </div>
                </div>

                <!-- Zen Mode -->
                <div class="border border-white/10 p-3">
                  <label class="flex cursor-pointer items-center justify-between gap-3">
                    <div>
                      <div class="flex items-center gap-2.5 text-sm text-white/80">
                        <Icon icon="lucide:eye-off" class="size-4 shrink-0 text-accent-amber" />
                        Chế độ Zen
                      </div>
                      <p class="mt-0.5 pl-6.5 text-xs text-white/35">
                        Ẩn toàn bộ giao diện, chỉ còn video nền
                      </p>
                    </div>
                    <button
                      role="switch"
                      :aria-checked="settings.zenMode"
                      class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
                      :class="settings.zenMode ? 'bg-accent-amber' : 'bg-white/20'"
                      @click="((settings.zenMode = !settings.zenMode), (isOpen = false))"
                    >
                      <span
                        class="absolute inset-y-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200"
                        :class="settings.zenMode ? 'translate-x-4' : 'translate-x-0'"
                      />
                    </button>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-5 py-3">
            <button
              class="text-xs text-white/30 transition hover:text-white/60"
              @click="resetSettings"
            >
              <Icon icon="lucide:rotate-ccw" class="mr-1 inline size-3" />
              Đặt lại mặc định
            </button>
            <button
              class="border border-white/20 bg-white/5 px-4 py-1.5 text-xs text-white/60 transition hover:border-white/40 hover:text-white"
              @click="isOpen = false"
            >
              Đóng
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
