<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps<{
  open: boolean
  sleepHours: number | null
  waterMl: number | null
  moveMinutes: number | null
  moodScore: number | null
}>()

const emit = defineEmits<{
  close: []
}>()

const quickAdvice = computed(() => {
  const items: string[] = []

  if ((props.sleepHours ?? 0) < 7) {
    items.push('Ngủ: thử tăng giờ ngủ thêm 20-30 phút mỗi đêm để tiệm cận mốc 7+ giờ.')
  } else {
    items.push('Ngủ: nhịp ngủ đang ổn, ưu tiên giữ giờ ngủ/thức đều mỗi ngày.')
  }

  if ((props.waterMl ?? 0) < 1500) {
    items.push('Nước: tăng dần lượng nước trong ngày, chia theo từng cữ nhỏ để dễ duy trì.')
  } else {
    items.push('Nước: mức nạp nước hôm nay khá tốt, tiếp tục ưu tiên nước lọc.')
  }

  if ((props.moveMinutes ?? 0) < 20) {
    items.push('Vận động: thêm 10-15 phút đi bộ nhanh hoặc giãn cơ để đạt ngưỡng tối thiểu.')
  } else {
    items.push('Vận động: bạn đã có nền hoạt động tốt, có thể thêm bài tăng sức mạnh 2 ngày/tuần.')
  }

  if ((props.moodScore ?? 0) <= 2) {
    items.push(
      'Tinh thần: nếu căng thẳng kéo dài, cân nhắc nghỉ ngắn, thở sâu, hoặc trao đổi với chuyên gia.',
    )
  } else {
    items.push('Tinh thần: tiếp tục theo dõi mood đều đặn để nhận diện sớm các biến động.')
  }

  return items
})

function closePopup(): void {
  emit('close')
}
</script>

<template>
  <transition name="advice-popup">
    <div
      v-if="props.open"
      class="fixed inset-0 z-[120] flex items-center justify-center bg-bg-deep/80 px-4 backdrop-blur-sm"
      @click.self="closePopup"
    >
      <article
        class="max-h-[82vh] w-full max-w-3xl overflow-auto border border-border-default bg-bg-surface p-5 sm:p-6"
      >
        <header class="mb-4 flex items-start justify-between gap-3">
          <div>
            <p class="font-display text-xs tracking-[0.14em] text-accent-coral">
              // THAM KHẢO SỨC KHỎE
            </p>
            <h3 class="mt-2 font-display text-2xl sm:text-3xl">Popup lời khuyên sức khỏe</h3>
            <p class="mt-2 text-sm text-text-secondary">
              Nội dung mang tính tham khảo dựa trên khuyến nghị phổ biến từ WHO/CDC.
            </p>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-accent-coral"
            @click="closePopup"
          >
            <Icon icon="lucide:x" class="size-4" />
            Đóng
          </button>
        </header>

        <section class="grid gap-3 sm:grid-cols-3">
          <div class="border border-border-default bg-bg-elevated p-3">
            <p class="text-[11px] tracking-[0.12em] text-text-dim">NGỦ</p>
            <p class="mt-1 text-sm text-text-secondary">
              Người lớn thường cần khoảng 7+ giờ ngủ chất lượng mỗi đêm.
            </p>
          </div>
          <div class="border border-border-default bg-bg-elevated p-3">
            <p class="text-[11px] tracking-[0.12em] text-text-dim">NƯỚC</p>
            <p class="mt-1 text-sm text-text-secondary">
              Ưu tiên nước lọc, tăng nước khi vận động nhiều hoặc thời tiết nóng.
            </p>
          </div>
          <div class="border border-border-default bg-bg-elevated p-3">
            <p class="text-[11px] tracking-[0.12em] text-text-dim">VẬN ĐỘNG</p>
            <p class="mt-1 text-sm text-text-secondary">
              Mục tiêu dài hạn: ít nhất 150 phút hoạt động mức vừa mỗi tuần.
            </p>
          </div>
        </section>

        <section class="mt-4">
          <h4 class="font-display text-lg">Gợi ý cá nhân hóa hôm nay</h4>
          <ul class="mt-2 space-y-2">
            <li
              v-for="tip in quickAdvice"
              :key="tip"
              class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary"
            >
              {{ tip }}
            </li>
          </ul>
        </section>

        <section
          class="mt-4 border border-accent-amber/60 bg-accent-amber/10 p-3 text-xs text-text-secondary"
        >
          <p class="font-semibold text-accent-amber">Disclaimer</p>
          <p class="mt-1">
            Thông tin trong popup chỉ nhằm mục đích tham khảo, không thay thế tư vấn y khoa, chẩn
            đoán hoặc điều trị. Nếu bạn có triệu chứng kéo dài hoặc vấn đề sức khỏe cụ thể, hãy liên
            hệ bác sĩ/chuyên gia y tế.
          </p>
        </section>

        <section class="mt-4 text-xs text-text-dim">
          Nguồn tham khảo: WHO Physical Activity Guidelines, CDC Sleep Health, CDC Water & Healthier
          Drinks.
        </section>
      </article>
    </div>
  </transition>
</template>

<style scoped>
.advice-popup-enter-active,
.advice-popup-leave-active {
  transition: opacity 0.16s ease;
}

.advice-popup-enter-from,
.advice-popup-leave-to {
  opacity: 0;
}
</style>
