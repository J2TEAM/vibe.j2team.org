<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body pb-20 overflow-x-hidden">
    <!-- ═══ PAGE 1: Cover + Intro ═══════════════════════════════════════════ -->
    <div class="print-page">
      <header class="max-w-5xl mx-auto px-6 pt-20 pb-12 relative">
        <!-- Print button (screen only) -->
        <div class="absolute top-10 left-6 print:hidden">
          <button
            @click="exportToEditorial"
            class="border border-accent-sky text-accent-sky px-4 py-1 text-xs font-display tracking-widest hover:bg-accent-sky hover:text-bg-deep transition-all"
          >
            IN KẾT QUẢ RA PDF
          </button>
        </div>

        <!-- VOL badge -->
        <div class="absolute top-10 right-6 animate-fade-up">
          <div
            class="bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3"
          >
            VERSION 1
          </div>
        </div>

        <p class="font-display text-accent-coral text-sm tracking-[0.3em] mb-4 animate-fade-up">
          // TDEE CALCULATOR
        </p>
        <h1
          class="font-display text-6xl md:text-8xl font-bold tracking-tight text-text-primary animate-fade-up animate-delay-1"
        >
          TÍNH TDEE <br />
          <span class="text-accent-coral underline decoration-4 underline-offset-8"
            >CÙNG COACH GREG</span
          >
        </h1>
      </header>

      <main class="max-w-5xl mx-auto px-6">
        <Intro />

        <!-- Print-only page-1 footer strip -->
        <div
          class="hidden print:flex items-center justify-between pt-8 border-t border-border-default mt-8"
        >
          <span class="font-display text-xs tracking-widest text-text-dim"
            >TÍNH TDEE CÙNG COACH GREG</span
          >
          <span class="font-display text-xs tracking-widest text-text-dim"
            >{{ printDate }} · PAGE 01</span
          >
        </div>
      </main>
    </div>

    <!-- ═══ PAGE 2: Chart + Results ══════════════════════════════════════════ -->
    <div class="print-page print:pt-12">
      <main class="max-w-5xl mx-auto px-6">
        <!-- Print-only page-2 header strip -->
        <div
          class="hidden print:flex items-center justify-between pb-8 border-b border-border-default mb-8"
        >
          <span class="font-display text-xs tracking-widest text-accent-coral"
            >THỐNG KÊ CÂN NẶNG</span
          >
          <span class="font-display text-xs tracking-widest text-text-dim"
            >{{ printDate }} · PAGE 02</span
          >
        </div>

        <div class="grid lg:grid-cols-2 gap-8 items-start">
          <Form class="print:hidden" />
          <Results />
        </div>

        <footer
          class="flex justify-between items-center pt-12 border-t border-border-default print:hidden"
        >
          <RouterLink
            to="/"
            class="group flex items-center gap-3 font-display text-sm tracking-widest text-text-secondary hover:text-accent-coral transition-colors"
          >
            <span class="border border-border-default p-2 group-hover:border-accent-coral">←</span>
            BACK TO HUB
          </RouterLink>
          <button
            @click="store.clearData"
            class="border border-border-default px-4 py-2 text-xs font-display tracking-widest text-text-dim hover:border-accent-coral hover:text-accent-coral transition-all uppercase"
          >
            // Xóa toàn bộ dữ liệu
          </button>
        </footer>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import Intro from './components/Intro.vue'
import Form from './components/Form.vue'
import Results from './components/Results.vue'
import { useTdeeStore } from './store'

const store = useTdeeStore()

const printDate = new Date().toLocaleDateString('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const exportToEditorial = () => {
  const originalTitle = document.title
  document.title = `GREG_LOGIC_VOL01_${new Date().toISOString().split('T')[0]}`
  window.print()
  document.title = originalTitle
}
</script>

<style>
@media print {
  /* Force dark background throughout */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    background: #0f1923 !important;
    color: #f0ede6 !important;
  }

  /* Page setup */
  @page {
    size: A4;
    margin: 0;
  }

  /* Page 1 fills exactly one printed page, then hard break */
  .print-page:first-child {
    min-height: 100vh;
    page-break-after: always;
    break-after: page;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* Page 2 starts fresh */
  .print-page:last-child {
    page-break-before: always;
    break-before: page;
  }

  /* Results takes full width on page 2 (Form is hidden) */
  .print-page:last-child .grid {
    display: block !important;
  }
}
</style>
