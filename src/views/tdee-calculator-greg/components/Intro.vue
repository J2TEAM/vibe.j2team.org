<template>
  <section class="animate-fade-up animate-delay-2 mb-12">
    <div class="border border-border-default bg-bg-surface p-8 relative group overflow-hidden">
      <h2 class="font-display text-2xl font-semibold mb-6 flex items-center gap-3">
        <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
        PHƯƠNG PHÁP TÍNH
      </h2>

      <div class="grid md:grid-cols-2 gap-8">
        <p class="text-text-secondary leading-relaxed">
          Theo
          <a href="https://www.youtube.com/watch?v=V3T9zdvliB8">
            <span class="text-accent-amber font-bold italic">Coach Greg Doucette</span></a
          >
          - một dim mơ chân chính, một IFBB Pro, người sẵn sàng va chạm thẳng mặt các đồng dim khác
          - các web tính TDEE hiện nay đều cho ra kết quả không chính xác. Cách hiệu quả hơn để biết
          chỉ số cơ thể này là đối chiếu lượng calo nạp vào với biến động trọng lượng cơ thể trong
          thời gian liên tục.
        </p>
        <div class="border-l border-accent-coral/30 pl-6 py-2">
          <p class="text-sm text-text-dim italic">
            "1kg cơ thể người tương đương khoảng 7700 kcal. Khi giảm cân, làm thế nào để biết liệu
            ta đang thực sự giảm mỡ hay chỉ đang mất nước?"
          </p>
          <div class="mt-4 flex gap-1.5">
            <span v-for="n in 10" :key="n" class="w-1 h-1 rounded-full bg-accent-coral/20" />
          </div>
          <p class="text-sm text-text-dim italic">
            "Phương pháp này tính chênh lệch trung vị cân nặng đầu kỳ và cuối kỳ, giúp bỏ qua thay
            đổi về calo nạp và đốt hàng ngày. Chọn khung 14 ngày để có chỉ số chính xác nhất."
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
defineOptions({ name: 'TdeeIntro' })
</script>
