<script setup lang="ts">
import { ref } from 'vue'
import type { Laso, LasoInput } from './lib/canchi-engine'
import { tinhLaso } from './lib/canchi-engine'
import LasoForm from './LasoForm.vue'
import type { FormValues } from './LasoForm.vue'
import LasoGrid from './LasoGrid.vue'

const laso = ref<Laso | null>(null)
const ten = ref('')
const lastFormValues = ref<FormValues>()

function handleSubmit(input: LasoInput, formValues: FormValues) {
  laso.value = tinhLaso(input)
  ten.value = formValues.ten
  lastFormValues.value = formValues
}

function handleBack() {
  laso.value = null
}
</script>

<template>
  <div class="canchi-page min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-5xl mx-auto px-6 py-8">
      <!-- Header -->
      <div class="text-center mb-8 animate-fade-up">
        <h1 class="font-display text-4xl md:text-5xl font-bold tracking-tight text-accent-coral">
          CanChi
        </h1>
        <p class="text-sm text-text-secondary mt-2">
          Lập lá số Tử Vi Đẩu Số theo ngày tháng năm sinh
        </p>
      </div>

      <!-- Form view -->
      <div v-show="!laso">
        <LasoForm :initial-values="lastFormValues" @submit="handleSubmit" />
      </div>

      <!-- Grid view -->
      <div v-show="laso">
        <div class="mb-4 animate-fade-up">
          <button
            class="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-accent-coral transition-colors"
            @click="handleBack"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Quay lại
          </button>
        </div>
        <LasoGrid v-if="laso" :laso="laso" :ten="ten" />
      </div>

      <!-- Back to home -->
      <div class="mt-8 text-center animate-fade-up animate-delay-3">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          &larr; Về trang chủ
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style>
/* CanChi CSS Variables — mapped to vibe design tokens */
.canchi-page {
  --background: #162232;
  --foreground: #f0ede6;
  --primary: #ff6b4a;
  --primary-foreground: #0f1923;
  --muted-foreground: #8b9db5;
  --border: #253549;
}

/* Cung Cell */
.cung-cell {
  border: 1px solid #253549;
  padding: 0.75rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s;
  overflow: visible;
  background-color: #162232;
}
.cung-cell:hover {
  background-color: #1e2f42;
}
.cung-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
  overflow: visible;
}
.cung-header > *:first-child {
  justify-self: start;
}
.cung-header > *:last-child {
  justify-self: end;
}
.cung-name {
  text-transform: uppercase;
  font-weight: 700;
  font-size: 1.0625rem;
  text-align: center;
  color: #f0ede6;
  font-family: var(--font-display, 'Anybody', sans-serif);
}
.cung-footer {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  font-size: 0.875rem;
  margin-top: auto;
  overflow: visible;
  color: #8b9db5;
}
.cung-footer > *:first-child {
  justify-self: start;
}
.cung-footer > *:last-child {
  justify-self: end;
}

/* Dimmed highlight */
.cung-dimmed::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(15, 25, 35, 0.5);
  pointer-events: none;
  z-index: 10;
  transition: background 0.2s ease;
}

/* Grid layout */
.laso-grid {
  display: grid;
  grid-template-rows: repeat(4, minmax(0, 1fr));
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border: 1px solid #253549;
  background-color: #0f1923;
  width: 960px;
  transform-origin: top left;
}
.laso-center {
  grid-column: span 2;
  grid-row: span 2;
  border: 1px solid #253549;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  overflow: visible;
  background-color: #162232;
}
.laso-grid-scaler {
  width: 100%;
  overflow: visible;
  position: relative;
  z-index: 10;
}

/* Tooltips */
.sao-tooltip {
  position: absolute;
  left: -8px;
  z-index: 50;
  min-width: 240px;
  max-width: 300px;
  padding: 0.625rem 0.75rem;
  background: #1e2f42;
  border: 1px solid #253549;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.3),
    0 1px 4px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  animation: canchiTooltipFadeIn 0.15s ease-out;
}
.cung-tooltip {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  min-width: 180px;
  max-width: 260px;
  padding: 0.5rem 0.625rem;
  background: #1e2f42;
  border: 1px solid #253549;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.3),
    0 1px 4px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  animation: canchiTooltipFadeIn 0.15s ease-out;
  white-space: normal;
  text-align: left;
}
@keyframes canchiTooltipFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Đại Hạn Timeline */
.dai-han-timeline {
  padding: 0.75rem 1rem;
  background: #162232;
  border: 1px solid #253549;
}
.dai-han-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.dai-han-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.375rem 0.25rem;
  border: 1px solid #253549;
  cursor: pointer;
  transition: all 0.15s ease;
  background: #162232;
  min-width: 0;
  color: #8b9db5;
}
.dai-han-item:hover {
  background-color: #1e2f42;
  border-color: #ff6b4a;
  z-index: 1;
}
.dai-han-active {
  background-color: #ff6b4a !important;
  color: #0f1923 !important;
  border-color: #ff6b4a !important;
  z-index: 2;
}
.dai-han-active span {
  color: #0f1923 !important;
}
.dai-han-current {
  background-color: rgba(255, 184, 48, 0.15) !important;
  border-color: #ffb830 !important;
}
.dai-han-current.dai-han-active {
  background-color: #ff6b4a !important;
  color: #0f1923 !important;
  border-color: #ff6b4a !important;
}
.dai-han-selected {
  border-bottom: 2px solid #ff6b4a !important;
}

/* Tiểu Hạn */
.tieu-han-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.3s ease,
    opacity 0.25s ease;
}
.tieu-han-wrapper.tieu-han-open {
  grid-template-rows: 1fr;
  opacity: 1;
}
.tieu-han-inner {
  overflow: hidden;
}
.tieu-han-sub {
  padding-top: 0.5rem;
  border-top: 1px dashed #253549;
  animation: canchiTooltipFadeIn 0.15s ease-out;
}
.tieu-han-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.25rem 0.125rem;
  border: 1px solid #253549;
  cursor: pointer;
  transition: all 0.15s ease;
  background: #0f1923;
  min-width: 0;
  color: #8b9db5;
}
.tieu-han-item:hover {
  z-index: 1;
  background-color: #1e2f42;
}
.tieu-han-current {
  background-color: rgba(255, 184, 48, 0.15) !important;
  border-color: #ffb830 !important;
  font-weight: 700;
  color: #ffb830 !important;
}

/* Legend */
.legend-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.3s ease,
    opacity 0.25s ease;
}
.legend-wrapper.legend-open {
  grid-template-rows: 1fr;
  opacity: 1;
}
.legend-inner {
  overflow: hidden;
}
.legend-panel {
  padding: 1rem 1.25rem;
  background: #162232;
  border: 1px solid #253549;
  overflow: hidden;
}

/* Action buttons */
.canchi-btn {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  border: 1px solid #253549;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #8b9db5;
  background: #162232;
}
.canchi-btn:hover {
  background-color: #ff6b4a;
  color: #0f1923;
  border-color: #ff6b4a;
}
.canchi-btn:disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* Utility overrides for the canchi page */
.canchi-page .text-muted-foreground {
  color: #8b9db5;
}
.canchi-page .bg-primary {
  background-color: #ff6b4a;
}
.canchi-page .text-primary-foreground {
  color: #0f1923;
}
.canchi-page .border-border {
  border-color: #253549;
}

/* Mobile */
@media (max-width: 767px) {
  .dai-han-timeline {
    padding: 0.5rem;
  }
  .dai-han-item {
    min-width: 4rem;
    flex: 0 0 auto;
    padding: 0.25rem 0.125rem;
  }
  .tieu-han-item {
    min-width: 3.5rem;
    flex: 0 0 auto;
  }
  .legend-panel {
    padding: 0.75rem;
  }
}

/* ── Custom scrollbar (design system) ── */
.canchi-page ::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.canchi-page ::-webkit-scrollbar-track {
  background: #0f1923;
}
.canchi-page ::-webkit-scrollbar-thumb {
  background: #253549;
}
.canchi-page ::-webkit-scrollbar-thumb:hover {
  background: #ff6b4a;
}
.canchi-page {
  scrollbar-width: thin;
  scrollbar-color: #253549 #0f1923;
}
.canchi-page * {
  scrollbar-width: thin;
  scrollbar-color: #253549 #0f1923;
}
</style>
