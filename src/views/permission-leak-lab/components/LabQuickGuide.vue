<template>
  <section class="mt-10 animate-fade-up animate-delay-2">
    <h2 class="mb-6 flex items-center gap-3 font-display text-2xl font-semibold text-text-primary">
      <span class="font-display text-sm tracking-widest text-accent-sky">//</span>
      Hiểu Nhanh Trong 30 Giây
    </h2>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article class="border border-border-default bg-bg-surface p-4">
        <p class="font-display text-xs tracking-widest text-accent-amber">BƯỚC 1</p>
        <h3 class="mt-2 font-display text-lg text-text-primary">Toggle Mô Phỏng</h3>
        <p class="mt-2 text-sm text-text-secondary">
          Toggle chỉ bật hoặc tắt mô hình đánh giá rủi ro trong lab. Nó không tự xin quyền thật từ
          trình duyệt.
        </p>
      </article>

      <article class="border border-border-default bg-bg-surface p-4">
        <p class="font-display text-xs tracking-widest text-accent-coral">BƯỚC 2</p>
        <h3 class="mt-2 font-display text-lg text-text-primary">Yêu Cầu Quyền Thật</h3>
        <p class="mt-2 text-sm text-text-secondary">
          Khi bấm “Yêu cầu quyền”, trình duyệt hiển thị popup xin phép. Nếu bạn grant, website mới
          có quyền dùng API tương ứng.
        </p>
      </article>

      <article class="border border-border-default bg-bg-surface p-4 sm:col-span-2 xl:col-span-1">
        <p class="font-display text-xs tracking-widest text-accent-sky">BƯỚC 3</p>
        <h3 class="mt-2 font-display text-lg text-text-primary">Xem Risk Graph</h3>
        <p class="mt-2 text-sm text-text-secondary">
          Điểm rủi ro và radar graph cập nhật realtime. Grant nhiều quyền nhạy cảm hơn thường làm bề
          mặt rủi ro tăng.
        </p>
      </article>
    </div>

    <div class="mt-4 border border-border-default bg-bg-surface p-4">
      <p class="font-display text-xs tracking-widest text-text-dim">GỢI Ý ĐỌC KẾT QUẢ</p>
      <p class="mt-2 text-sm text-text-secondary">
        Điểm này là mô phỏng để học nhận thức bảo mật, không phải điểm audit chính thức. Hãy dùng nó
        để hiểu nguyên tắc cấp quyền tối thiểu (least privilege): đúng quyền, đúng lúc, đúng mục
        đích.
      </p>
    </div>
  </section>
</template>
