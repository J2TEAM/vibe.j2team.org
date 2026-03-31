<script setup lang="ts">
interface ExtraPermission {
  id: string
  name: string
  note: string
  risk: string
}

const extraPermissions: ExtraPermission[] = [
  {
    id: 'notifications',
    name: 'Notifications',
    note: 'Hỗ trợ rộng, xin qua Notification API.',
    risk: 'Spam thông báo hoặc kéo người dùng click vào nội dung lạ.',
  },
  {
    id: 'display-capture',
    name: 'Screen Share (Display Capture)',
    note: 'Xin quyền theo từng phiên bằng trình chọn màn hình của browser.',
    risk: 'Lộ tài liệu nội bộ, mật khẩu hoặc thông tin nhạy cảm đang hiển thị.',
  },
  {
    id: 'bluetooth',
    name: 'Bluetooth',
    note: 'Phụ thuộc Web Bluetooth và thường yêu cầu thao tác người dùng.',
    risk: 'Kết nối nhầm thiết bị, lộ dữ liệu thiết bị gần đó.',
  },
  {
    id: 'usb',
    name: 'USB',
    note: 'Chỉ hoạt động ở trình duyệt hỗ trợ WebUSB.',
    risk: 'Truy cập sai thiết bị ngoại vi hoặc đọc dữ liệu không mong muốn.',
  },
  {
    id: 'serial',
    name: 'Serial',
    note: 'Cần Web Serial và thường chỉ chạy trên desktop tương thích.',
    risk: 'Giao tiếp với thiết bị nối tiếp có thể làm lộ dữ liệu vận hành.',
  },
  {
    id: 'midi',
    name: 'MIDI',
    note: 'Tuỳ trình duyệt, có thể đi kèm quyền sysex.',
    risk: 'Lộ tương tác thiết bị âm thanh hoặc dữ liệu điều khiển chuyên dụng.',
  },
]
</script>

<template>
  <section class="mt-10 animate-fade-up animate-delay-6">
    <h2 class="mb-6 flex items-center gap-3 font-display text-2xl font-semibold text-text-primary">
      <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
      Còn Permission Nào Khác?
    </h2>

    <div class="border border-border-default bg-bg-surface p-4">
      <p class="text-sm text-text-secondary">
        Có. Browser còn nhiều quyền khác ngoài camera, mic, location, clipboard. Danh sách dưới đây
        là các quyền phổ biến nhưng độ hỗ trợ phụ thuộc từng trình duyệt và hệ điều hành.
      </p>

      <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="permission in extraPermissions"
          :key="permission.id"
          class="border border-border-default bg-bg-deep p-3"
        >
          <h3 class="font-display text-sm tracking-wide text-text-primary">
            {{ permission.name }}
          </h3>
          <p class="mt-1 text-xs text-text-dim">{{ permission.note }}</p>
          <p class="mt-2 text-sm text-text-secondary">
            <span class="font-display text-xs tracking-widest text-accent-coral">Rủi ro:</span>
            {{ permission.risk }}
          </p>
        </article>
      </div>

      <p class="mt-4 border border-border-default bg-bg-deep p-3 text-xs text-text-dim">
        Lab hiện ưu tiên 4 quyền cơ bản để giải thích trực quan cho người mới. Nếu cần, có thể mở
        rộng thêm toggle cho Notifications hoặc Screen Share ở phiên bản sau.
      </p>
    </div>
  </section>
</template>
