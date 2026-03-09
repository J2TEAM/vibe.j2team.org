<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ChatApp from './ChatApp.vue'
import StatusPanel from './StatusPanel.vue'

const hash = ref<string>('')

const syncHash = (): void => {
  hash.value = window.location.hash || '#intro'
}

const isAppView = computed<boolean>(() => hash.value === '#app')
const isStatusView = computed<boolean>(() => hash.value === '#status')

onMounted(() => {
  syncHash()
  window.addEventListener('hashchange', syncHash)
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncHash)
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <main
      class="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-5 py-4 sm:px-8 sm:py-6"
    >
      <header
        class="animate-fade-up overflow-hidden border border-border-default bg-bg-surface"
        :class="isAppView || isStatusView ? 'p-4 sm:p-5' : 'p-6 sm:p-8'"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <a
              href="https://j2team.org/"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center border border-border-default bg-bg-deep px-4 py-2 text-sm font-display tracking-wide text-text-primary transition-all duration-300 hover:border-accent-amber"
            >
              J2TEAM
            </a>
            <RouterLink
              to="/"
              class="inline-flex items-center border border-border-default bg-bg-deep px-4 py-2 text-sm text-text-secondary transition-all duration-300 hover:border-accent-amber hover:text-text-primary"
            >
              Về Trang Chủ
            </RouterLink>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <a
              href="#intro"
              class="inline-flex items-center border border-border-default bg-bg-deep px-4 py-2 text-sm text-text-secondary transition-all duration-300 hover:border-accent-sky hover:text-text-primary"
              :class="{ 'border-accent-sky text-text-primary': !isAppView && !isStatusView }"
            >
              Intro
            </a>
            <a
              href="#app"
              class="inline-flex items-center border border-border-default bg-bg-deep px-4 py-2 text-sm text-text-secondary transition-all duration-300 hover:border-accent-coral hover:text-text-primary"
              :class="{ 'border-accent-coral text-text-primary': isAppView }"
            >
              Chat
            </a>
            <a
              href="#status"
              class="inline-flex items-center border border-border-default bg-bg-deep px-4 py-2 text-sm text-text-secondary transition-all duration-300 hover:border-accent-amber hover:text-text-primary"
              :class="{ 'border-accent-amber text-text-primary': isStatusView }"
            >
              Status
            </a>
          </div>
        </div>

        <div
          v-if="!isAppView && !isStatusView"
          class="relative mt-6 overflow-hidden border border-border-default bg-bg-deep/70 p-5 sm:p-7"
        >
          <div
            class="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-accent-sky/20 blur-3xl"
          />
          <div
            class="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-accent-coral/20 blur-3xl"
          />

          <div class="relative grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <p class="font-display text-sm tracking-[0.24em] text-accent-coral">CHATJPT</p>
              <h1
                class="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl"
              >
                AI chat nhanh gọn
                <span class="block text-accent-sky">dành cho cộng đồng</span>
              </h1>
              <p class="mt-4 max-w-2xl text-text-secondary sm:text-lg">
                Không đăng ký, không cần API key. Mở là dùng, lưu lịch sử local trên trình duyệt của
                bạn.
              </p>

              <div class="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="#app"
                  class="inline-flex items-center border border-accent-coral bg-accent-coral/20 px-5 py-2.5 text-sm font-semibold text-accent-coral transition hover:bg-accent-coral/30"
                >
                  Bắt đầu chat ngay
                </a>
                <a
                  href="#status"
                  class="inline-flex items-center border border-accent-sky/40 bg-accent-sky/10 px-5 py-2.5 text-sm font-semibold text-accent-sky transition hover:bg-accent-sky/20"
                >
                  Xem tình trạng node
                </a>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <a
                href="https://github.com/J2TEAM/vibe.j2team.org/tree/main/src/views"
                target="_blank"
                rel="noopener noreferrer"
                class="block border border-border-default bg-bg-surface p-4 transition hover:border-accent-sky"
              >
                <p class="text-xs tracking-widest text-text-dim">Front-end</p>
                <p class="mt-2 font-display text-xl">Vibe J2Team / ChatJPT</p>
              </a>
              <a
                href="https://github.com/Yur1nn/JPT"
                target="_blank"
                rel="noopener noreferrer"
                class="block border border-border-default bg-bg-surface p-4 transition hover:border-accent-coral"
              >
                <p class="text-xs tracking-widest text-text-dim">Shield</p>
                <p class="mt-2 font-display text-xl">Yur1nn / JPT</p>
              </a>
              <a
                href="https://github.com/Yur1nn/ChatJPT"
                target="_blank"
                rel="noopener noreferrer"
                class="block border border-border-default bg-bg-surface p-4 transition hover:border-accent-amber"
              >
                <p class="text-xs tracking-widest text-text-dim">Backend</p>
                <p class="mt-2 font-display text-xl">Yur1nn / ChatJPT</p>
              </a>
            </div>
          </div>
        </div>
      </header>

      <section
        v-if="!isAppView && !isStatusView"
        class="mt-6 animate-fade-up animate-delay-2 grid gap-4 lg:grid-cols-2"
      >
        <article class="border border-border-default bg-bg-surface p-6">
          <h2 class="flex items-center gap-3 font-display text-2xl font-semibold">
            <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
            Giá trị cốt lõi
          </h2>
          <ul class="mt-4 space-y-3 text-text-secondary">
            <li class="border border-border-default bg-bg-deep p-3">
              Miễn phí cho cộng đồng, truy cập ngay.
            </li>
            <li class="border border-border-default bg-bg-deep p-3">
              Không cần tài khoản hoặc cài đặt phức tạp.
            </li>
            <li class="border border-border-default bg-bg-deep p-3">
              Dữ liệu lịch sử lưu local, dễ kiểm soát.
            </li>
          </ul>
        </article>

        <article class="border border-border-default bg-bg-surface p-6">
          <h2 class="flex items-center gap-3 font-display text-2xl font-semibold">
            <span class="font-display text-sm tracking-widest text-accent-sky">//</span>
            Cách dùng nhanh
          </h2>
          <ol class="mt-4 space-y-3 text-text-secondary">
            <li class="border border-border-default bg-bg-deep p-3">
              1. Mở tab <span class="text-text-primary">Chat</span> để bắt đầu hỏi đáp.
            </li>
            <li class="border border-border-default bg-bg-deep p-3">
              2. Chọn model phù hợp trong danh sách.
            </li>
            <li class="border border-border-default bg-bg-deep p-3">
              3. Nếu cần kiểm tra hệ thống, vào tab <span class="text-text-primary">Status</span>.
            </li>
          </ol>
        </article>
      </section>

      <ChatApp v-if="isAppView" />
      <StatusPanel v-else-if="isStatusView" />
    </main>
  </div>
</template>
