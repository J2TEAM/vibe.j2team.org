import { REPO_URL } from './constants'

export interface TechStackItem {
  name: string
  description: string
  url: string
}

export interface J2TeamProduct {
  name: string
  url: string
}

export const j2teamProducts: J2TeamProduct[] = [
  { name: 'J2TEAM Security', url: 'https://j2team.org/' },
  {
    name: 'J2TEAM Cookies',
    url: 'https://chromewebstore.google.com/detail/j2team-cookies/okpidcojinmlaakglciglbpcpajaibco',
  },
  { name: 'J2TEAM Store', url: 'https://store.j2team.org/' },
]

export const techStack: TechStackItem[] = [
  { name: 'Vue 3', description: 'Progressive JavaScript Framework', url: 'https://vuejs.org/' },
  {
    name: 'TypeScript',
    description: 'JavaScript với static typing',
    url: 'https://www.typescriptlang.org/',
  },
  { name: 'Vite', description: 'Build tool thế hệ mới, nhanh', url: 'https://vite.dev/' },
  {
    name: 'Tailwind CSS',
    description: 'Utility-first CSS framework',
    url: 'https://tailwindcss.com/',
  },
  { name: 'Vue Router', description: 'Routing cho Vue', url: 'https://router.vuejs.org/' },
  { name: 'Pinia', description: 'State management', url: 'https://pinia.vuejs.org/' },
]

export const rules: string[] = [
  'Không có database — dự án không sử dụng database dưới bất kỳ hình thức nào',
  'Luôn có link về trang chủ — mỗi trang con phải có link quay lại trang chủ',
  'Ngôn ngữ: tiếng Việt (ưu tiên) hoặc tiếng Anh',
  'Không trùng ứng dụng con đã có — kiểm tra danh sách trang trước khi tạo mới',
  'Trùng ý tưởng — nếu hai người cùng tạo PR cho một ý tưởng giống nhau, PR nào tạo trước sẽ được ưu tiên merge',
  'Mỗi trang con hoạt động độc lập — chỉ làm việc trong thư mục trang của mình',
  'Responsive — trang phải hiển thị tốt trên mobile',
  'Không thêm dependency mới trừ khi thật sự cần và được approve',
  'Ghi rõ tên tác giả trong mục thông tin trang',
]

export const steps: string[] = [
  `<a href="${REPO_URL}" target="_blank" rel="noopener noreferrer nofollow" class="text-accent-coral link-underline">Fork repo</a> và clone về máy`,
  'Tạo branch mới từ <code class="px-1.5 py-0.5 bg-accent-amber/10 text-accent-amber font-mono text-xs">main</code> — không làm việc trực tiếp trên main (ví dụ: <code class="px-1.5 py-0.5 bg-accent-amber/10 text-accent-amber font-mono text-xs">git checkout -b feat/tên-trang</code>)',
  'Tạo thư mục mới trong <code class="px-1.5 py-0.5 bg-accent-amber/10 text-accent-amber font-mono text-xs">src/views/&lt;tên-trang&gt;/</code> với file <code class="px-1.5 py-0.5 bg-accent-amber/10 text-accent-amber font-mono text-xs">index.vue</code>',
  'Tạo file <code class="px-1.5 py-0.5 bg-accent-amber/10 text-accent-amber font-mono text-xs">meta.ts</code> trong cùng thư mục để khai báo tên, mô tả và tác giả (route tự động được tạo)',
  'Tạo Pull Request và chờ merge!',
]

export function padIndex(i: number): string {
  return String(i + 1).padStart(2, '0')
}
