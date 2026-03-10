<script setup lang="ts">
defineEmits<{ start: [] }>()
</script>

<template>
  <div class="flex flex-col items-center text-center px-4 animate-fade-up">
    <!-- Clinic Badge -->
    <div
      class="mb-6 inline-flex items-center gap-2 border border-accent-coral/30 bg-accent-coral/10 px-4 py-1.5 text-xs font-display tracking-widest text-accent-coral uppercase"
    >
      <span class="w-1.5 h-1.5 rounded-full bg-accent-coral animate-pulse inline-block"></span>
      Phòng khám trực tuyến
    </div>

    <!-- Doctor Avatar -->
    <div
      class="relative w-28 h-28 mb-6 border-2 border-border-default bg-bg-surface flex items-center justify-center text-6xl animate-fade-up animate-delay-1"
    >
      <span>👨‍⚕️</span>
      <span
        class="absolute -top-2 -right-2 bg-accent-coral text-bg-deep font-display font-bold text-xs px-1.5 py-0.5 tracking-wide"
        >MD</span
      >
    </div>

    <!-- Title -->
    <h1
      class="font-display text-4xl sm:text-5xl font-bold text-text-primary mb-1 animate-fade-up animate-delay-1"
    >
      Doctor Le
    </h1>
    <p
      class="font-display text-sm tracking-widest text-accent-coral uppercase mb-6 animate-fade-up animate-delay-2"
    >
      // Heart Check Clinic
    </p>

    <!-- Divider -->
    <div class="flex gap-1.5 mb-6">
      <span v-for="n in 20" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
    </div>

    <!-- Doctor Speech -->
    <div
      class="w-full max-w-sm border border-border-default bg-bg-surface p-5 text-left mb-8 animate-fade-up animate-delay-3"
    >
      <p class="text-xs font-display tracking-widest text-accent-amber uppercase mb-3">
        // Bác sĩ nói
      </p>
      <p class="text-text-primary text-sm leading-relaxed mb-2">
        Chào mừng đến phòng khám <strong class="text-accent-coral">Doctor Le</strong>.
      </p>
      <p class="text-text-secondary text-sm leading-relaxed mb-2">
        Chúng tôi sẽ tiến hành <strong class="text-text-primary">kiểm tra nhịp tim</strong> của bạn
        bằng phương pháp giữ tay.
      </p>
      <p class="text-text-secondary text-sm leading-relaxed">
        Hãy giữ nút đo nhịp tim cho đến khi quá trình kiểm tra hoàn tất.
      </p>
    </div>

    <!-- Warning -->
    <div
      class="w-full max-w-sm border border-accent-amber/30 bg-accent-amber/5 px-4 py-3 text-xs text-accent-amber font-display tracking-wide mb-8 animate-fade-up animate-delay-4"
    >
      ⚠ Ứng dụng có thể chẩn đoán sai nếu bạn không giữ nút đúng cách hoặc có vấn đề về thiết bị.
      Kết quả chỉ mang tính tham khảo.
    </div>

    <!-- CTA -->
    <button
      class="w-full max-w-sm border border-accent-coral bg-accent-coral/10 px-8 py-4 font-display font-bold text-accent-coral tracking-widest uppercase transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep hover:shadow-lg hover:shadow-accent-coral/20 active:scale-95 animate-fade-up animate-delay-5 touch-manipulation"
      @click="$emit('start')"
    >
      Bắt đầu kiểm tra →
    </button>
  </div>
</template>
