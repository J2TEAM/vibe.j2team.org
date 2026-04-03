<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useHead } from '@unhead/vue'
import { computed, ref } from 'vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import meta from './meta'

useHead({
  title: meta.name,
  meta: [
    {
      name: 'description',
      content: meta.description,
    },
  ],
})

interface Holiday {
  id: string
  name: string
  date: string
  lunarDate?: string
  icon: string
  color: string
  description: string
  history: string
  type: 'vietnam' | 'regional' | 'international'
  month?: number
}

const typeLabels: Record<string, string> = {
  vietnam: '🇻🇳 Việt Nam',
  regional: '🏔️ Vùng Miền Việt Nam',
  international: '🌍 Quốc Tế',
}

const monthNames = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
]

const holidays = ref<Holiday[]>([
  {
    id: 'new-year',
    name: 'Năm Mới Dương Lịch',
    date: '1/1',
    icon: 'lucide:party-popper',
    color: 'bg-blue-500',
    description: 'Ngày đầu tiên trong năm Dương lịch',
    history:
      'Năm Mới Dương lịch là dịp chào đón năm mới theo lịch Gregorian. Đây là ngày lễ được công nhận trên toàn thế giới, là thời điểm để mọi người đặt ra những mục tiêu mới và quyết tâm thay đổi bản thân.',
    type: 'international',
    month: 1,
  },
  {
    id: '14-2',
    name: 'Ngày Valentine',
    date: '14/2',
    icon: 'lucide:heart-handshake',
    color: 'bg-pink-600',
    description: 'Ngày lễ tình yêu của thế giới',
    history:
      'Valentine Day (Ngày Tình yêu) bắt nguồn từ lịch sử của một vị thánh Công giáo. Ngày này người ta tặng quà cho những người mình yêu thương. Đây là dịp để bày tỏ tình cảm và tình yêu.',
    type: 'international',
    month: 2,
  },
  {
    id: 'stpatrick',
    name: 'Ngày Thánh Patrick',
    date: '17/3',
    icon: 'lucide:clover',
    color: 'bg-green-600',
    description: 'Ngày lễ của người Ireland',
    history:
      'Ngày Thánh Patrick là ngày lễ quốc gia của Ireland, tưởng nhớ đến thánh Patrick - người mang đạo Thiên Chúa giáo đến Ireland. Ngày này người dân mặc áo xanh lá cây, diễu hành và tổ chức những lễ hội vui vẻ.',
    type: 'international',
    month: 3,
  },
  {
    id: '8-3',
    name: 'Ngày Quốc tế Phụ nữ',
    date: '8/3',
    icon: 'lucide:flower-tulip',
    color: 'bg-pink-500',
    description: 'Ngày vinh danh phụ nữ trên toàn thế giới',
    history:
      'Ngày Quốc tế Phụ nữ bắt nguồn từ phong trào lao động của phụ nữ tại Mỹ vào đầu thế kỷ 20. Ngày này được Liên Hợp Quốc chính thức công nhận vào năm 1975, nhằm vinh danh những thành tích và đóng góp của phụ nữ trong xã hội.',
    type: 'international',
    month: 3,
  },
  {
    id: 'hung-vuong',
    name: 'Giỗ Tổ Hùng Vương',
    date: '10/3 (âm: 10/3)',
    lunarDate: '10/3 âm lịch',
    icon: 'lucide:landmark',
    color: 'bg-yellow-700',
    description: 'Ngày tưởng nhớ các vua Hùng',
    history:
      'Giỗ Tổ Hùng Vương được coi là lễ hội truyền thống quan trọng của người Việt. Ngày này nhân dân Việt Nam tưởng nhớ các vua Hùng, những người sáng lập nên Nước Văn Lang - bước đầu của lịch sử Việt Nam.',
    type: 'vietnam',
    month: 3,
  },
  {
    id: 'easter',
    name: 'Phục sinh (Easter)',
    date: '9/4 - 20/4',
    icon: 'lucide:egg',
    color: 'bg-emerald-500',
    description: 'Lễ Phục sinh - ngày lễ Cơ đốc giáo quan trọng',
    history:
      'Phục sinh là ngày lễ Cơ đốc giáo quan trọng nhất, tưởng nhớ sự sống lại của Chúa Giêsu Kitô. Ngày Phục sinh được tính theo lịch âm dương hỗn hợp, nên ngày tháng thay đổi hàng năm từ tháng 3 đến tháng 4.',
    type: 'international',
    month: 4,
  },
  {
    id: 'environment-day',
    name: 'Ngày Trái Đất (Earth Day)',
    date: '22/4',
    icon: 'lucide:leaf',
    color: 'bg-green-500',
    description: 'Ngày lễ bảo vệ môi trường',
    history:
      'Earth Day (22/4) được tổ chức để nâng cao nhận thức về bảo vệ môi trường và thiên nhiên. Ngày này mọi người được khuyến khích tham gia các hoạt động bảo vệ môi trường.',
    type: 'international',
    month: 4,
  },
  {
    id: '18-4',
    name: 'Ngày Chiến sĩ Tưởng niệm',
    date: '18/4',
    icon: 'lucide:leaf',
    color: 'bg-green-600',
    description: 'Ngày tưởng nhớ những chiến sĩ nước nhà',
    history:
      'Ngày Chiến sĩ Tưởng niệm là để tưởng nhớ những anh hùng, liệt sĩ đã hy sinh vì độc lập, tự do của đất nước. Ngày này là dịp để cả dân tộc bày tỏ lòng tôn kính, biết ơn đối với những người đã hy sinh.',
    type: 'vietnam',
    month: 4,
  },
  {
    id: '30-4',
    name: 'Ngày Giải phóng & Thống nhất',
    date: '30/4',
    icon: 'lucide:flag',
    color: 'bg-yellow-600',
    description: 'Ngày Giải phóng miền Nam & Thống nhất Việt Nam',
    history:
      'Ngày 30/4/1975 là ngày Giải phóng miền Nam và Thống nhất đất nước. Đây là một cột mốc lịch sử quan trọng, đánh dấu sự kết thúc của cuộc chiến tranh và sự thống nhất Việt Nam thành một đất nước độc lập.',
    type: 'vietnam',
    month: 4,
  },
  {
    id: '1-5',
    name: 'Ngày Quốc tế Lao động',
    date: '1/5',
    icon: 'lucide:briefcase',
    color: 'bg-red-600',
    description: 'Ngày vinh danh các lao động',
    history:
      'Ngày Quốc tế Lao động bắt nguồn từ cuộc biểu tình của những người lao động tại Mỹ năm 1886. Ngày này được công nhận quốc tế để vinh danh những đóng góp của người lao động và thúc đẩy quyền lợi của họ.',
    type: 'international',
    month: 5,
  },
  {
    id: 'children-day-intl',
    name: 'Ngày Quốc tế Thiếu nhi',
    date: '1/6',
    icon: 'lucide:smile',
    color: 'bg-cyan-500',
    description: 'Ngày vinh danh trẻ em trên toàn thế giới',
    history:
      'Ngày Quốc tế Thiếu nhi (1/6) được Liên Hợp Quốc công nhận để vinh danh quyền lợi và sự an toàn của trẻ em. Ngày này các quốc gia tổ chức các hoạt động để chúc mừng trẻ em.',
    type: 'international',
    month: 6,
  },
  {
    id: 'independence-usa',
    name: 'Ngày Độc lập Mỹ',
    date: '4/7',
    icon: 'lucide:flag',
    color: 'bg-blue-800',
    description: 'Ngày quốc khánh của Hoa Kỳ',
    history:
      'Ngày 4/7/1776, Hoa Kỳ khai báo độc lập khỏi Đế quốc Anh. Ngày này được xem là ngày kỷ niệm quốc khánh của Mỹ, với những cuộc diễu hành, pháo hoa và tiệc BBQ.',
    type: 'international',
    month: 7,
  },
  {
    id: 'bastille',
    name: 'Ngày Bastille (Quốc khánh Pháp)',
    date: '14/7',
    icon: 'lucide:flag-triangle-right',
    color: 'bg-gray-900',
    description: 'Ngày quốc khánh của Pháp',
    history:
      'Ngày Bastille (14/7) kỷ niệm Cách mạng Pháp năm 1789. Ngày này đánh dấu sự tan rã của Bastille - biểu tượng của chế độ chuyên chế. Đây là ngày triệu tập của nước Pháp với những cuộc diễu hành hoành tráng và pháo hoa.',
    type: 'international',
    month: 7,
  },
  {
    id: 'trung-thu',
    name: 'Tết Trung thu',
    date: '15/8 (âm: 15/8)',
    lunarDate: '15/8 âm lịch',
    icon: 'lucide:moon',
    color: 'bg-amber-500',
    description: 'Ngày hội đặc biệt dành cho trẻ em',
    history:
      'Tết Trung thu là ngày lễ truyền thống của người Việt và các dân tộc Đông Á. Ngày này được xem là dịp để gia đình sum vầy, chiêm ngưỡng trăng tròn và các hoạt động vui chơi dành cho trẻ em. Lịch sử của tết Trung thu có nguồn gốc từ truyền thuyết cổ đại của người Trung Quốc.',
    type: 'vietnam',
    month: 8,
  },
  {
    id: 'tet-cham',
    name: 'Tết Ramuwan (Tết Chăm)',
    date: 'Tháng 9 - 10',
    lunarDate: 'Theo lịch Chăm',
    icon: 'lucide:palmtree',
    color: 'bg-teal-600',
    description: 'Tết của dân tộc Chăm',
    history:
      'Tết Ramuwan (Tết Chăm) là dịp kỷ niệm quan trọng của dân tộc Chăm. Ngày này Người Chăm tổ chức các lễ hội, mặc trang phục truyền thống, múa nhạc và tổ chức bữa tiệc gia đình.',
    type: 'regional',
    month: 9,
  },
  {
    id: '2-9',
    name: 'Ngày Quốc khánh',
    date: '2/9',
    icon: 'lucide:crown',
    color: 'bg-orange-600',
    description: 'Ngày Quốc khánh của Việt Nam',
    history:
      'Ngày 2/9/1945, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập tại Quảng trường Ba Đình (Hà Nội), chính thức thành lập Nước Cộng hòa Dân chủ Nhân dân Việt Nam. Đây là ngày kỷ niệm Quốc khánh của nước ta.',
    type: 'vietnam',
    month: 9,
  },
  {
    id: 'halloween',
    name: 'Halloween (Ngày ma)',
    date: '31/10',
    icon: 'lucide:ghost',
    color: 'bg-orange-900',
    description: 'Ngày lễ độc đáo của phương Tây',
    history:
      'Halloween bắt nguồn từ lễ hội cổ đại của người Celtic. Ngày này liên quan đến tín ngưỡng về những linh hồn của ai đó đã chết quay lại. Ngày nay Halloween là dịp để trẻ em hóa trang, xin kẹo và tôn vinh những truyện kinh dị.',
    type: 'international',
    month: 10,
  },
  {
    id: 'diwali',
    name: 'Ngày Diwali',
    date: 'Tháng 10 - 11',
    icon: 'lucide:flame',
    color: 'bg-orange-600',
    description: 'Lễ hội ánh sáng của người Ấn Độ',
    history:
      'Diwali hay Deepavali là lễ hội ánh sáng lớn nhất của người Ấn Độ. Ngày này tưởng nhớ chiến thắng của ánh sáng trên bóng tối. Người dân thắp đèn, trang trí và tổ chức tiệc để kỷ niệm.',
    type: 'international',
    month: 10,
  },
  {
    id: '20-10',
    name: 'Ngày Phụ nữ Việt Nam',
    date: '20/10',
    icon: 'lucide:heart',
    color: 'bg-purple-500',
    description: 'Ngày vinh danh phụ nữ Việt Nam',
    history:
      'Ngày 20/10 được chọn để kỷ niệm Ngày Phụ nữ Việt Nam, nhân dịp kỷ niệm 60 năm Hội LHPN Việt Nam (thành lập ngày 20/10/1930). Ngày này tôn vinh những đóng góp của phụ nữ Việt Nam trong xây dựng và bảo vệ Tổ quốc.',
    type: 'vietnam',
    month: 10,
  },
  {
    id: 'tet-tay-bac',
    name: 'Tết Tây Bắc',
    date: 'Tháng 1 (âm lịch)',
    icon: 'lucide:mountain',
    color: 'bg-blue-700',
    description: 'Tết độc đáo của người các dân tộc Tây Bắc',
    history:
      'Tết Tây Bắc được tổ chức muộn hơn Tết Nguyên Đán, thường vào tháng 1 hoặc tháng 2. Các dân tộc Tây Bắc như Thái, Hoa Miao tổ chức tết riêng của họ với những nghi thức độc đáo như bắn pháo hoa, đi chúc tết và những trò chơi truyền thống.',
    type: 'regional',
    month: 1,
  },
  {
    id: 'ngay-khai-huong',
    name: 'Khai Hương - Ngày giỗ Tổ nghề',
    date: 'Tháng 1 - 2 (âm)',
    lunarDate: 'Khác nhau theo ngành nghề',
    icon: 'lucide:hammer',
    color: 'bg-amber-700',
    description: 'Ngày kỷ niệm các tổ sư của các ngành nghề',
    history:
      'Khai Hương là ngày lễ cổ truyền của Việt Nam, được tổ chức để tưởng nhớ những tổ sư khởi sáng các ngành nghề khác nhau. Các thợ thủ công tổ chức lễ tưởng nhớ tổ sư của ngành mình để cầu may mắn.',
    type: 'regional',
    month: 1,
  },
  {
    id: 'tet-nguoi-hoa',
    name: 'Tết Nguyên Đán Người Hoa',
    date: 'Khác nhau (âm: 1-3/1)',
    lunarDate: '1/1 - 3/1 âm lịch',
    icon: 'lucide:lantern',
    color: 'bg-red-600',
    description: 'Tết của cộng đồng người Hoa ở Việt Nam',
    history:
      'Tết Nguyên Đán của người Hoa là dịp truyền thống quan trọng, tưởng nhớ gia tiên và chào đón năm mới. Người Hoa ở Việt Nam tổ chức tết riêng với các nghi thức độc đáo như lau nhà, đặt bàn thờ và tổ chức tiệc.',
    type: 'regional',
    month: 1,
  },
  {
    id: 'tet-khmer',
    name: 'Tết Tân Niên Khmer',
    date: 'Tháng 4',
    icon: 'lucide:dripicon-temple',
    color: 'bg-orange-700',
    description: 'Tết của đồng bào Khmer ở Việt Nam',
    history:
      'Tết Tân Niên Khmer (Chol Chnam Thmay) là ngày lễ quan trọng nhất của người Khmer, tưởng nhớ năm cũ và chào đón năm mới. Người Khmer tơiến đền chùa, rửa tượng Phật, vui chơi và tổ chức tiệc gia đình.',
    type: 'regional',
    month: 4,
  },
  {
    id: 'raya',
    name: 'Tết Hỷ (Raya/Eid)',
    date: 'Khác nhau theo lịch Hình',
    icon: 'lucide:moon-star',
    color: 'bg-green-700',
    description: 'Ngày lễ Hồi giáo quan trọng',
    history:
      'Tết Hỷ (Raya hay Eid) là ngày lễ quan trọng của tín đồ Hồi giáo. Nó là ngày cuối cùng của tháng Ramadan - tháng thánh nhất trong năm Hình lịch. Người Hồi giáo ăn lễ, thăm nhà bạn bè và gia đình.',
    type: 'international',
    month: 5,
  },
  {
    id: 'thanksgiving',
    name: 'Ngày Tạ Ơn (Thanksgiving)',
    date: 'Thứ 4 của tháng 11',
    icon: 'lucide:corn',
    color: 'bg-amber-800',
    description: 'Lễ tạ ơn của người Mỹ và Canada',
    history:
      'Thanksgiving Day là ngày lễ truyền thống của Hoa Kỳ và Canada để tạ ơn cho mùa vụ bội thu. Ngày này gia đình sum vầy ăn tối với những món ăn truyền thống như gà tây và bánh bí.',
    type: 'international',
    month: 11,
  },
  {
    id: 'christmas',
    name: 'Giáng sinh (Christmas)',
    date: '25/12',
    icon: 'lucide:snowflake',
    color: 'bg-red-500',
    description: 'Ngày lễ Giáng sinh của người Cơ đốc giáo',
    history:
      'Giáng sinh là ngày lễ Cơ đốc giáo tưởng nhớ ngày sinh của Chúa Giêsu Kitô. Ngày này người dân trên khắp thế giới tôn vinh, trang trí cây thông, tặng quà cho nhau và sum vầy bên gia đình.',
    type: 'international',
    month: 12,
  },
  {
    id: 'new-year-eve',
    name: "Đêm Giao thừa (New Year's Eve)",
    date: '31/12',
    icon: 'lucide:champagne-bottle',
    color: 'bg-indigo-500',
    description: 'Đêm cuối cùng của năm Dương lịch',
    history:
      'Đêm Giao thừa là đêm cuối cùng của năm Dương lịch, là dịp mọi người chào đón năm mới. Người dân tổ chức tiệc tùng, bắn pháo hoa và chúc mừng nhau những điều tốt lành.',
    type: 'international',
    month: 12,
  },
  {
    id: 'tet',
    name: 'Tết Nguyên Đán',
    date: '29/1 - 1/2 (âm: 1-3/1)',
    lunarDate: '1/1 - 3/1 âm lịch',
    icon: 'lucide:gift',
    color: 'bg-red-500',
    description: 'Ngày lễ truyền thống lớn nhất của người Việt',
    history:
      'Tết Nguyên Đán là dịp bắt đầu một năm mới theo lịch âm. Đây là ngày lễ quan trọng nhất trong đạo Phật và văn hóa Đông Á, là dịp để mọi người sum vầy bên gia đình, tất niên và chuẩn bị cho một năm mới tốt lành.',
    type: 'vietnam',
    month: 1,
  },
])

const activeType = ref<'vietnam' | 'regional' | 'international' | 'all'>('all')
const searchQuery = ref('')

const groupedHolidays = computed(() => {
  let filtered = holidays.value

  if (activeType.value !== 'all') {
    filtered = filtered.filter((h) => h.type === activeType.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (h) => h.name.toLowerCase().includes(query) || h.description.toLowerCase().includes(query),
    )
  }

  // Group by month
  const grouped: Record<number, Holiday[]> = {}
  for (let i = 1; i <= 12; i++) {
    grouped[i] = []
  }

  filtered.forEach((h) => {
    if (h.month) {
      grouped[h.month].push(h)
    }
  })

  // Sort each month's holidays by date
  Object.values(grouped).forEach((arr) => {
    arr.sort((a, b) => {
      const aNum = parseInt(a.date.split('/')[0]) || 0
      const bNum = parseInt(b.date.split('/')[0]) || 0
      return aNum - bNum
    })
  })

  return grouped
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep">
    <!-- Header -->
    <div class="border-b border-border-default bg-bg-surface py-8">
      <div class="mx-auto max-w-6xl px-6">
        <AppBreadcrumb />
        <div class="mt-6">
          <h1 class="font-display text-5xl font-bold text-text-primary">
            🎉 Các Ngày Lễ Trong Năm
          </h1>
          <p class="mt-3 text-lg text-text-secondary">
            Khám phá lịch sử và ý nghĩa của các ngày lễ quan trọng
          </p>
        </div>
      </div>
    </div>

    <!-- Filter Tabs & Search -->
    <div class="border-b border-border-default bg-bg-surface py-6">
      <div class="mx-auto max-w-6xl px-6">
        <!-- Tabs -->
        <div class="mb-6 flex flex-wrap gap-2">
          <button
            @click="activeType = 'all'"
            :class="[
              'px-4 py-2 font-semibold transition',
              activeType === 'all'
                ? 'border-b-2 border-accent-coral text-accent-coral'
                : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary',
            ]"
          >
            📅 Tất Cả
          </button>
          <button
            @click="activeType = 'vietnam'"
            :class="[
              'px-4 py-2 font-semibold transition',
              activeType === 'vietnam'
                ? 'border-b-2 border-accent-coral text-accent-coral'
                : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary',
            ]"
          >
            {{ typeLabels.vietnam }}
          </button>
          <button
            @click="activeType = 'regional'"
            :class="[
              'px-4 py-2 font-semibold transition',
              activeType === 'regional'
                ? 'border-b-2 border-accent-coral text-accent-coral'
                : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary',
            ]"
          >
            {{ typeLabels.regional }}
          </button>
          <button
            @click="activeType = 'international'"
            :class="[
              'px-4 py-2 font-semibold transition',
              activeType === 'international'
                ? 'border-b-2 border-accent-coral text-accent-coral'
                : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary',
            ]"
          >
            {{ typeLabels.international }}
          </button>
        </div>

        <!-- Search -->
        <div class="relative">
          <Icon
            icon="lucide:search"
            class="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-tertiary"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm kiếm ngày lễ..."
            class="w-full border border-border-default bg-bg-deep px-12 py-3 text-text-primary placeholder-text-tertiary outline-none transition focus:border-accent-coral"
          />
        </div>
      </div>
    </div>

    <!-- Holidays by Month (Timeline View) -->
    <div class="mx-auto max-w-6xl px-6 py-12">
      <div v-if="Object.values(groupedHolidays).some((arr) => arr.length > 0)" class="space-y-12">
        <div
          v-for="(month, monthIndex) in groupedHolidays"
          :key="`month-${monthIndex}`"
          class="animate-fade-up"
          :style="`animation-delay: ${monthIndex * 50}ms`"
        >
          <!-- Month Header -->
          <div v-if="month.length > 0" class="mb-6 flex items-center gap-4">
            <h2 class="font-display text-2xl font-bold text-accent-coral">
              // {{ monthNames[monthIndex] }}
            </h2>
            <div class="flex-grow border-t border-border-default" />
            <span class="text-sm text-text-tertiary">{{ month.length }} ngày lễ</span>
          </div>

          <!-- Holidays in Month -->
          <div v-if="month.length > 0" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="holiday in month"
              :key="holiday.id"
              class="border border-border-default bg-bg-surface p-5 transition hover:bg-bg-elevated"
            >
              <!-- Icon & Type Badge -->
              <div class="mb-3 flex items-start justify-between">
                <div :class="`${holiday.color} inline-block p-2`">
                  <Icon :icon="holiday.icon" class="size-5 text-white" />
                </div>
                <span class="text-xs font-semibold text-accent-sky">{{
                  typeLabels[holiday.type]
                }}</span>
              </div>

              <!-- Date -->
              <div class="mb-2 flex items-center gap-2 text-sm text-text-tertiary">
                <Icon icon="lucide:calendar" class="size-4" />
                <span class="font-semibold">{{ holiday.date }}</span>
              </div>

              <!-- Title -->
              <h3 class="font-display mb-2 text-lg font-bold text-text-primary">
                {{ holiday.name }}
              </h3>

              <!-- Description -->
              <p class="mb-3 text-sm text-text-secondary">{{ holiday.description }}</p>

              <!-- History -->
              <details class="group cursor-pointer">
                <summary
                  class="flex items-center gap-2 text-sm font-semibold text-accent-coral hover:text-accent-amber"
                >
                  <span>Tìm hiểu thêm</span>
                  <Icon
                    icon="lucide:chevron-down"
                    class="size-4 transition group-open:rotate-180"
                  />
                </summary>
                <p class="mt-2 text-xs leading-relaxed text-text-secondary">
                  {{ holiday.history }}
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-else class="py-12 text-center">
        <Icon icon="lucide:inbox" class="mb-4 inline-block size-12 text-text-tertiary" />
        <p class="text-lg text-text-secondary">Không tìm thấy kết quả nào</p>
      </div>
    </div>

    <!-- Footer / Credits -->
    <div class="border-t border-border-default bg-bg-surface py-8">
      <div class="mx-auto max-w-6xl px-6 text-center">
        <p class="text-sm text-text-secondary">
          Designed by <span class="font-semibold text-text-primary">mtdes23</span>
        </p>
        <p class="mt-2 text-sm text-accent-coral hover:text-accent-amber">
          <a
            href="https://www.mtdes23.id.vn"
            target="_blank"
            rel="noopener noreferrer"
            class="transition hover:underline"
          >
            www.mtdes23.id.vn
          </a>
        </p>
      </div>
    </div>
  </div>
</template>
