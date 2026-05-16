<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'

interface LayoutItem {
  id: string
  type: string
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  svgType?: string
  bgClass?: string
  textClass?: string
  borderClass?: string
  label?: string
}

const ArchitecturalSymbols: Record<string, string> = {
  'door-1': `<svg viewBox="0 0 100 100" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none"><path d="M 0,0 v 100" stroke-width="6" /><path d="M 0,0 L 100,0" stroke-width="4" /><path d="M 100,0 A 100,100 0 0,1 0,100" stroke-dasharray="6,6" stroke-width="2" /></svg>`,
  'door-2': `<svg viewBox="0 0 200 100" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none"><path d="M 0,0 v 100 M 200,0 v 100" stroke-width="6" /><path d="M 0,0 L 100,0 M 200,0 L 100,0" stroke-width="4" /><path d="M 100,0 A 100,100 0 0,1 0,100 M 100,0 A 100,100 0 0,0 200,100" stroke-dasharray="6,6" stroke-width="2" /></svg>`,
  'door-slide': `<svg viewBox="0 0 200 40" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none"><rect x="0" y="10" width="200" height="20" stroke-width="2" /><path d="M 10,20 h 90" stroke-width="4" /><path d="M 100,10 h 90" stroke-width="4" /></svg>`,
  'window-1': `<svg viewBox="0 0 100 20" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none"><rect x="0" y="0" width="100" height="20" stroke-width="2" /><line x1="0" y1="10" x2="100" y2="10" stroke-width="2" /><line x1="0" y1="5" x2="100" y2="5" stroke-width="1" /><line x1="0" y1="15" x2="100" y2="15" stroke-width="1" /></svg>`,
  stairs: `<svg viewBox="0 0 100 200" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none"><rect x="0" y="0" width="100" height="200" stroke-width="2" /><path d="M 0,20 h 100 M 0,40 h 100 M 0,60 h 100 M 0,80 h 100 M 0,100 h 100 M 0,120 h 100 M 0,140 h 100 M 0,160 h 100 M 0,180 h 100" stroke-width="1"/><line x1="50" y1="20" x2="50" y2="180" stroke-width="2"/><path d="M 40,40 L 50,20 L 60,40" stroke-width="2"/></svg>`,
  'stairs-spiral': `<svg viewBox="0 0 100 100" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none"><circle cx="50" cy="50" r="50" stroke-width="2" /><circle cx="50" cy="50" r="10" stroke-width="2" /><path d="M 50,40 v -40 M 57,43 L 85,15 M 60,50 h 40 M 57,57 L 85,85 M 50,60 v 40 M 43,57 L 15,85 M 40,50 h -40 M 43,43 L 15,15" stroke-width="1" /></svg>`,
  ramp: `<svg viewBox="0 0 100 200" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none"><rect x="0" y="0" width="100" height="200" stroke-width="2" stroke-dasharray="10,10" /><line x1="50" y1="20" x2="50" y2="180" stroke-width="2"/><path d="M 40,40 L 50,20 L 60,40" stroke-width="2"/></svg>`,
  toilet: `<svg viewBox="0 0 60 80" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none" stroke-width="3"><rect x="10" y="5" width="40" height="20" rx="3" /><ellipse cx="30" cy="50" rx="15" ry="25" /><ellipse cx="30" cy="50" rx="10" ry="18" /></svg>`,
  bathtub: `<svg viewBox="0 0 160 80" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none" stroke-width="3"><rect x="0" y="0" width="160" height="80" /><rect x="10" y="10" width="140" height="60" rx="25" /><circle cx="130" cy="40" r="5" /></svg>`,
  sink: `<svg viewBox="0 0 80 60" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none" stroke-width="3"><rect x="0" y="0" width="80" height="60" rx="5" /><ellipse cx="40" cy="35" rx="30" ry="20" /><circle cx="40" cy="35" r="3" /><rect x="35" y="5" width="10" height="10" rx="2" /></svg>`,
  shower: `<svg viewBox="0 0 80 80" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none" stroke-width="3"><rect x="0" y="0" width="80" height="80" /><line x1="0" y1="0" x2="80" y2="80" /><line x1="0" y1="80" x2="80" y2="0" /><circle cx="40" cy="40" r="5" /></svg>`,
  'kitchen-sink': `<svg viewBox="0 0 120 60" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none" stroke-width="3"><rect x="0" y="0" width="120" height="60" /><rect x="10" y="10" width="45" height="40" rx="5" /><rect x="65" y="10" width="45" height="40" rx="5" /><circle cx="32.5" cy="30" r="3" /><circle cx="87.5" cy="30" r="3" /></svg>`,
  stove: `<svg viewBox="0 0 80 60" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none" stroke-width="3"><rect x="0" y="0" width="80" height="60" /><circle cx="25" cy="30" r="15" /><circle cx="55" cy="30" r="15" /></svg>`,
  'column-sq': `<svg viewBox="0 0 40 40" class="w-full h-full stroke-current fill-current" preserveAspectRatio="none" stroke-width="2"><rect x="0" y="0" width="40" height="40" /></svg>`,
  'column-rd': `<svg viewBox="0 0 40 40" class="w-full h-full stroke-current fill-current" preserveAspectRatio="none" stroke-width="2"><circle cx="20" cy="20" r="20" /></svg>`,
  socket: `<svg viewBox="0 0 40 40" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none" stroke-width="4"><circle cx="20" cy="20" r="15" /><line x1="20" y1="5" x2="20" y2="35" /><line x1="20" y1="20" x2="40" y2="20" /></svg>`,
  switch: `<svg viewBox="0 0 40 40" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none" stroke-width="4"><circle cx="20" cy="20" r="8" /><line x1="25" y1="15" x2="35" y2="5" /></svg>`,
  light: `<svg viewBox="0 0 40 40" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none" stroke-width="4"><circle cx="20" cy="20" r="18" /><line x1="8" y1="8" x2="32" y2="32" /><line x1="8" y1="32" x2="32" y2="8" /></svg>`,
  hvac: `<svg viewBox="0 0 80 40" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none" stroke-width="3"><rect x="0" y="0" width="80" height="40" /><line x1="0" y1="0" x2="80" y2="40" /><line x1="0" y1="40" x2="80" y2="0" /><text x="40" y="27" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="20" class="fill-current stroke-none">AC</text></svg>`,
  compass: `<svg viewBox="0 0 100 120" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none" stroke-width="2"><circle cx="50" cy="60" r="40" /><line x1="50" y1="20" x2="50" y2="100" /><line x1="10" y1="60" x2="90" y2="60" /><polygon points="50,20 60,60 40,60" class="fill-current" /><text x="50" y="15" text-anchor="middle" font-size="20" font-weight="bold" class="fill-current stroke-none">B</text></svg>`,
  'bed-single': `<svg viewBox="0 0 100 200" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none" stroke-width="2"><rect x="0" y="0" width="100" height="200" rx="4" /><rect x="10" y="10" width="80" height="40" rx="4" /><line x1="0" y1="70" x2="100" y2="70" /></svg>`,
  'bed-double': `<svg viewBox="0 0 160 200" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none" stroke-width="2"><rect x="0" y="0" width="160" height="200" rx="4" /><rect x="15" y="10" width="60" height="40" rx="4" /><rect x="85" y="10" width="60" height="40" rx="4" /><line x1="0" y1="70" x2="160" y2="70" /></svg>`,
  'desk-single': `<svg viewBox="0 0 120 80" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none" stroke-width="2"><rect x="0" y="0" width="120" height="50" /><rect x="40" y="50" width="40" height="30" rx="5" /><line x1="45" y1="50" x2="75" y2="50" stroke-width="4" /></svg>`,
  'desk-double': `<svg viewBox="0 0 200 80" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none" stroke-width="2"><rect x="0" y="0" width="200" height="50" /><rect x="40" y="50" width="40" height="30" rx="5" /><rect x="120" y="50" width="40" height="30" rx="5" /></svg>`,
  sofa: `<svg viewBox="0 0 200 80" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none" stroke-width="2"><rect x="0" y="0" width="200" height="80" rx="10" /><path d="M 20,80 v -60 a 10,10 0 0,1 10,-10 h 140 a 10,10 0 0,1 10,10 v 60" /><line x1="70" y1="10" x2="70" y2="80" /><line x1="130" y1="10" x2="130" y2="80" /></svg>`,
  wardrobe: `<svg viewBox="0 0 200 60" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none" stroke-width="2"><rect x="0" y="0" width="200" height="60" /><line x1="0" y1="0" x2="200" y2="60" stroke-width="1" /><line x1="0" y1="60" x2="200" y2="0" stroke-width="1" /><line x1="10" y1="30" x2="190" y2="30" stroke-dasharray="10,5" /></svg>`,
  'dining-table': `<svg viewBox="0 0 160 120" class="w-full h-full stroke-current fill-none" preserveAspectRatio="none" stroke-width="2"><rect x="30" y="20" width="100" height="80" rx="10" /><rect x="0" y="35" width="30" height="50" rx="5" /><rect x="130" y="35" width="30" height="50" rx="5" /><rect x="50" y="0" width="60" height="20" rx="5" /><rect x="50" y="100" width="60" height="20" rx="5" /></svg>`,
}

interface ItemTemplate {
  type: string
  name: string
  width: number
  height: number
  svgType?: string
  bgClass?: string
  textClass?: string
  borderClass?: string
  label?: string
}

interface Category {
  name: string
  items: ItemTemplate[]
}

const categories: Category[] = [
  {
    name: 'Tường & Vách',
    items: [
      {
        type: 'wall-brick',
        name: 'Tường gạch',
        width: 200,
        height: 20,
        bgClass: 'bg-gray-400',
        borderClass: 'border-2 border-black item-wall-solid',
      },
      {
        type: 'wall-concrete',
        name: 'Tường bê tông',
        width: 200,
        height: 20,
        bgClass: 'bg-gray-800',
        borderClass: 'border-2 border-black item-wall-concrete',
      },
      {
        type: 'wall-glass',
        name: 'Tường kính',
        width: 200,
        height: 10,
        bgClass: 'bg-blue-300/30',
        borderClass: 'border border-blue-400',
      },
      {
        type: 'wall-dry',
        name: 'Thạch cao',
        width: 200,
        height: 10,
        bgClass: 'bg-yellow-100',
        borderClass: 'border border-gray-400',
      },
    ],
  },
  {
    name: 'Cửa & Lỗ mở',
    items: [
      {
        type: 'door-1',
        name: 'Cửa đi 1 cánh',
        width: 80,
        height: 80,
        svgType: 'door-1',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'door-2',
        name: 'Cửa đi 2 cánh',
        width: 160,
        height: 80,
        svgType: 'door-2',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'door-slide',
        name: 'Cửa trượt',
        width: 120,
        height: 20,
        svgType: 'door-slide',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'window-1',
        name: 'Cửa sổ',
        width: 100,
        height: 20,
        svgType: 'window-1',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
    ],
  },
  {
    name: 'Cầu thang & Độ dốc',
    items: [
      {
        type: 'stairs',
        name: 'Cầu thang',
        width: 100,
        height: 200,
        svgType: 'stairs',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'stairs-spiral',
        name: 'Thang xoắn',
        width: 100,
        height: 100,
        svgType: 'stairs-spiral',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'ramp',
        name: 'Đường dốc',
        width: 100,
        height: 200,
        svgType: 'ramp',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
    ],
  },
  {
    name: 'Vệ sinh & Bếp',
    items: [
      {
        type: 'toilet',
        name: 'Bồn cầu',
        width: 40,
        height: 60,
        svgType: 'toilet',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'bathtub',
        name: 'Bồn tắm',
        width: 160,
        height: 80,
        svgType: 'bathtub',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'sink',
        name: 'Chậu rửa',
        width: 80,
        height: 60,
        svgType: 'sink',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'shower',
        name: 'Vòi sen',
        width: 80,
        height: 80,
        svgType: 'shower',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'kitchen-sink',
        name: 'Bồn rửa bát',
        width: 120,
        height: 60,
        svgType: 'kitchen-sink',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'stove',
        name: 'Bếp nấu',
        width: 80,
        height: 60,
        svgType: 'stove',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
    ],
  },
  {
    name: 'Kết cấu & Phòng',
    items: [
      {
        type: 'column-sq',
        name: 'Cột vuông',
        width: 40,
        height: 40,
        svgType: 'column-sq',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'column-rd',
        name: 'Cột tròn',
        width: 40,
        height: 40,
        svgType: 'column-rd',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'room-label',
        name: 'Ký hiệu phòng',
        width: 120,
        height: 60,
        label: 'PHÒNG',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
        borderClass: 'border border-dashed border-gray-500',
      },
    ],
  },
  {
    name: 'MEP (Hạ tầng)',
    items: [
      {
        type: 'socket',
        name: 'Ổ điện',
        width: 30,
        height: 30,
        svgType: 'socket',
        bgClass: 'bg-transparent',
        textClass: 'text-red-400',
      },
      {
        type: 'switch',
        name: 'Công tắc',
        width: 30,
        height: 30,
        svgType: 'switch',
        bgClass: 'bg-transparent',
        textClass: 'text-red-400',
      },
      {
        type: 'light',
        name: 'Đèn',
        width: 40,
        height: 40,
        svgType: 'light',
        bgClass: 'bg-transparent',
        textClass: 'text-yellow-400',
      },
      {
        type: 'hvac',
        name: 'Điều hòa',
        width: 80,
        height: 40,
        svgType: 'hvac',
        bgClass: 'bg-transparent',
        textClass: 'text-blue-400',
      },
    ],
  },
  {
    name: 'Nội thất',
    items: [
      {
        type: 'bed-single',
        name: 'Giường đơn',
        width: 100,
        height: 200,
        svgType: 'bed-single',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'bed-double',
        name: 'Giường đôi',
        width: 160,
        height: 200,
        svgType: 'bed-double',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'desk-single',
        name: 'Bàn đơn',
        width: 120,
        height: 80,
        svgType: 'desk-single',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'desk-double',
        name: 'Bàn đôi',
        width: 200,
        height: 80,
        svgType: 'desk-double',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'dining-table',
        name: 'Bàn ăn 4 ghế',
        width: 160,
        height: 120,
        svgType: 'dining-table',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'sofa',
        name: 'Sofa 3 chỗ',
        width: 200,
        height: 80,
        svgType: 'sofa',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'wardrobe',
        name: 'Tủ quần áo',
        width: 200,
        height: 60,
        svgType: 'wardrobe',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
    ],
  },
  {
    name: 'Hướng & Chú thích',
    items: [
      {
        type: 'dimension',
        name: 'Đường kích thước',
        width: 200,
        height: 20,
        label: '3600',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'text',
        name: 'Ghi chú tự do',
        width: 120,
        height: 40,
        label: 'GHI CHÚ',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
      {
        type: 'compass',
        name: 'Hoa gió (Bắc)',
        width: 80,
        height: 80,
        svgType: 'compass',
        bgClass: 'bg-transparent',
        textClass: 'text-white',
      },
    ],
  },
]

const items = ref<LayoutItem[]>([])
const selectedId = ref<string | null>(null)
const canvasRef = ref<HTMLElement | null>(null)

// Topbar State
const projectName = ref('So-Do-Nha-O')
const isExportMode = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Dragging state
const dragging = ref(false)
const dragItem = ref<LayoutItem | null>(null)
const dragOffset = ref({ x: 0, y: 0 })

// Resizing state
const resizing = ref(false)
const resizeItem = ref<LayoutItem | null>(null)
const resizeStart = ref({ x: 0, y: 0, w: 0, h: 0 })

function addItem(template: ItemTemplate) {
  const newItem: LayoutItem = {
    id: Math.random().toString(36).substring(2, 9),
    type: template.type,
    name: template.name,
    x: 200 + (items.value.length % 10) * 20,
    y: 200 + (items.value.length % 10) * 20,
    width: template.width,
    height: template.height,
    rotation: 0,
    svgType: template.svgType,
    bgClass: template.bgClass,
    textClass: template.textClass,
    borderClass: template.borderClass,
    label: template.label,
  }
  items.value.push(newItem)
  selectedId.value = newItem.id
}

function deleteItem(id: string) {
  items.value = items.value.filter((i) => i.id !== id)
  if (selectedId.value === id) selectedId.value = null
}

function clearAll() {
  if (confirm('Bạn có chắc chắn muốn xóa toàn bộ sơ đồ?')) {
    items.value = []
    selectedId.value = null
  }
}

function rotateItem(item: LayoutItem) {
  item.rotation = (item.rotation + 45) % 360
}

function editLabel(item: LayoutItem) {
  const newText = prompt('Nhập chữ hoặc kích thước:', item.label)
  if (newText !== null && newText.trim() !== '') {
    item.label = newText
  }
}

function onMouseDown(e: MouseEvent, item: LayoutItem) {
  if (isExportMode.value) return
  selectedId.value = item.id
  dragging.value = true
  dragItem.value = item

  if (canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    dragOffset.value = { x: mouseX - item.x, y: mouseY - item.y }
  }
}

function startResize(e: MouseEvent, item: LayoutItem) {
  resizing.value = true
  resizeItem.value = item
  resizeStart.value = { x: e.clientX, y: e.clientY, w: item.width, h: item.height }
}

function onMouseMove(e: MouseEvent) {
  if (isExportMode.value) return
  if (dragging.value && dragItem.value && canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const newX = mouseX - dragOffset.value.x
    const newY = mouseY - dragOffset.value.y
    // Snap 10px để xoay 90 độ tường vẫn khớp lưới
    dragItem.value.x = Math.round(newX / 10) * 10
    dragItem.value.y = Math.round(newY / 10) * 10
  } else if (resizing.value && resizeItem.value) {
    const dx = e.clientX - resizeStart.value.x
    const dy = e.clientY - resizeStart.value.y
    const newW = resizeStart.value.w + dx
    const newH = resizeStart.value.h + dy
    // Snap 10px
    resizeItem.value.width = Math.max(10, Math.round(newW / 10) * 10)
    resizeItem.value.height = Math.max(10, Math.round(newH / 10) * 10)
  }
}

function onMouseUp() {
  dragging.value = false
  dragItem.value = null
  resizing.value = false
  resizeItem.value = null
}

function onCanvasClick(e: MouseEvent) {
  if (
    e.target === canvasRef.value ||
    (e.target as HTMLElement).classList.contains('grid-pattern')
  ) {
    selectedId.value = null
  }
}

// ===================== EXPORT & IMPORT =====================

function exportJson() {
  const data = JSON.stringify(items.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName.value}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target?.result as string)
      if (Array.isArray(data)) {
        items.value = data
        projectName.value = file.name.replace('.json', '')
      }
    } catch {
      alert('File không hợp lệ hoặc bị lỗi!')
    }
  }
  reader.readAsText(file)
  target.value = ''
}

async function exportBlueprint() {
  if (!canvasRef.value) return

  isExportMode.value = true
  selectedId.value = null

  // Find bounding box
  let minX = Infinity,
    minY = Infinity,
    maxX = 0,
    maxY = 0
  items.value.forEach((i) => {
    minX = Math.min(minX, i.x)
    minY = Math.min(minY, i.y)
    maxX = Math.max(maxX, i.x + i.width)
    maxY = Math.max(maxY, i.y + i.height)
  })

  if (items.value.length === 0) {
    minX = 0
    minY = 0
    maxX = 800
    maxY = 600
  } else {
    minX = Math.max(0, minX - 100)
    minY = Math.max(0, minY - 100)
    maxX += 100
    maxY += 100
  }

  // Wait for Vue to apply .blueprint-export class
  await nextTick()

  try {
    const { toPng } = await import('html-to-image')

    // Temporarily limit canvas size to bounding box for export
    const originalWidth = canvasRef.value.style.width
    const originalHeight = canvasRef.value.style.height
    canvasRef.value.style.width = `${maxX}px`
    canvasRef.value.style.height = `${maxY}px`

    const dataUrl = await toPng(canvasRef.value, {
      backgroundColor: '#ffffff',
      width: maxX,
      height: maxY,
      style: {
        transform: 'none',
        left: '0',
        top: '0',
      },
    })

    canvasRef.value.style.width = originalWidth
    canvasRef.value.style.height = originalHeight

    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${projectName.value}-Blueprint.png`
    a.click()
  } catch (err) {
    console.error('Export failed', err)
    alert('Có lỗi xảy ra khi xuất ảnh.')
  } finally {
    isExportMode.value = false
  }
}
</script>

<template>
  <div
    class="flex flex-col h-[100dvh] text-text-primary overflow-hidden"
    :class="isExportMode ? 'bg-white' : 'bg-bg-deep'"
  >
    <!-- Header Toolbar -->
    <div
      v-if="!isExportMode"
      class="p-3 border-b border-border-default bg-bg-surface shrink-0 flex items-center justify-between z-20 shadow-sm"
    >
      <div class="flex items-center gap-4">
        <AppBreadcrumb :items="[]" />
        <div class="font-display font-bold text-accent-coral text-lg tracking-wider">
          // HOME DESIGNER
        </div>
      </div>

      <div class="flex items-center gap-3">
        <input
          v-model="projectName"
          type="text"
          placeholder="Tên dự án..."
          class="px-3 py-1.5 bg-bg-deep border border-border-default rounded-md text-sm outline-none focus:border-accent-coral w-48 transition-colors"
        />

        <input type="file" ref="fileInput" accept=".json" class="hidden" @change="onFileChange" />

        <button
          @click="fileInput?.click()"
          class="px-3 py-1.5 bg-bg-elevated hover:bg-white/10 rounded-md text-sm flex items-center gap-2 transition-colors"
        >
          <Icon icon="lucide:upload" class="size-4" /> Nhập JSON
        </button>
        <button
          @click="exportJson"
          class="px-3 py-1.5 bg-bg-elevated hover:bg-white/10 rounded-md text-sm flex items-center gap-2 transition-colors"
        >
          <Icon icon="lucide:download" class="size-4" /> Lưu JSON
        </button>
        <button
          @click="exportBlueprint"
          class="px-4 py-1.5 bg-white text-black hover:bg-gray-200 border border-gray-300 shadow-sm rounded-md text-sm flex items-center gap-2 transition-all font-bold tracking-wide"
        >
          <Icon icon="lucide:printer" class="size-4" /> Xuất Blueprint (B&W)
        </button>
      </div>
    </div>

    <div class="flex flex-1 relative overflow-hidden">
      <!-- Sidebar (Hidden during export) -->
      <div
        v-if="!isExportMode"
        class="w-[320px] bg-bg-surface border-r border-border-default flex flex-col z-20 shadow-xl"
      >
        <div
          class="p-3 border-b border-border-default bg-bg-elevated sticky top-0 z-10 flex items-center justify-between"
        >
          <h2 class="font-display text-[15px] text-accent-amber font-bold">// Thư viện Ký hiệu</h2>
          <button
            @click="clearAll"
            class="p-1.5 hover:bg-red-500/20 text-red-400 rounded-md transition-colors"
            title="Xóa tất cả"
          >
            <Icon icon="lucide:trash-2" class="size-4" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          <div v-for="category in categories" :key="category.name">
            <h3
              class="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2 border-b border-border-default pb-1"
            >
              {{ category.name }}
            </h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="item in category.items"
                :key="item.type"
                @click="addItem(item)"
                class="flex items-center gap-2 p-2 rounded bg-bg-deep hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors text-left group"
              >
                <div
                  class="w-8 h-8 flex items-center justify-center shrink-0 rounded bg-white/5 p-1 relative"
                >
                  <div
                    v-if="item.svgType"
                    class="w-full h-full text-text-primary"
                    v-html="ArchitecturalSymbols[item.svgType]"
                  ></div>
                  <div
                    v-else-if="item.type === 'dimension'"
                    class="w-full h-[1px] bg-white absolute top-1/2"
                  ></div>
                  <div
                    v-else
                    class="w-full h-full opacity-70 group-hover:opacity-100 transition-opacity"
                    :class="[item.bgClass, item.borderClass]"
                  ></div>
                </div>
                <span class="text-xs text-text-secondary leading-tight flex-1">{{
                  item.name
                }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Canvas area -->
      <div
        class="flex-1 relative cursor-crosshair overflow-auto"
        :class="isExportMode ? 'bg-white blueprint-export' : 'bg-bg-deep'"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
        @mousedown="onCanvasClick"
      >
        <!-- Canvas Wrapper -->
        <div
          class="absolute min-w-[3000px] min-h-[3000px] w-full h-full transform-origin-top-left"
          ref="canvasRef"
        >
          <!-- Grid background -->
          <div
            v-if="!isExportMode"
            class="absolute inset-0 grid-pattern opacity-10 pointer-events-none"
          ></div>

          <!-- Items -->
          <div
            v-for="item in items"
            :key="item.id"
            class="absolute cursor-move transition-shadow item-box"
            :class="[
              selectedId === item.id && !isExportMode
                ? 'ring-2 ring-accent-coral shadow-[0_0_15px_rgba(255,127,80,0.4)] z-30'
                : 'z-10',
              item.bgClass,
              item.borderClass,
              isExportMode ? '!text-black' : item.textClass,
            ]"
            :style="{
              left: `${item.x}px`,
              top: `${item.y}px`,
              width: `${item.width}px`,
              height: `${item.height}px`,
              transform: `rotate(${item.rotation}deg)`,
            }"
            @mousedown.stop="onMouseDown($event, item)"
          >
            <!-- Content -->
            <div
              class="w-full h-full flex items-center justify-center pointer-events-none"
              :class="[
                isExportMode ? 'text-black' : '',
                item.type !== 'dimension' && item.type !== 'compass' ? 'overflow-hidden' : '',
              ]"
            >
              <!-- Render Standard Architectural SVG if available -->
              <div
                v-if="item.svgType && ArchitecturalSymbols[item.svgType]"
                class="w-full h-full"
                v-html="ArchitecturalSymbols[item.svgType]"
              ></div>

              <!-- Render Dimension Line -->
              <div
                v-else-if="item.type === 'dimension'"
                class="relative w-full h-full flex items-center justify-center"
              >
                <div
                  class="absolute left-0 right-0 top-1/2 h-[2px]"
                  :class="isExportMode ? 'bg-black' : 'bg-white/80'"
                ></div>
                <div
                  class="absolute left-0 top-1/2 w-[2px] h-6 -translate-y-1/2 rotate-45"
                  :class="isExportMode ? 'bg-black' : 'bg-white/80'"
                ></div>
                <div
                  class="absolute right-0 top-1/2 w-[2px] h-6 -translate-y-1/2 rotate-45"
                  :class="isExportMode ? 'bg-black' : 'bg-white/80'"
                ></div>

                <span
                  class="px-2 text-[14px] font-bold whitespace-nowrap z-10"
                  :class="isExportMode ? 'bg-white text-black' : 'bg-bg-deep text-white'"
                >
                  {{ item.label }}
                </span>
              </div>

              <!-- Fallback Label -->
              <span
                v-else-if="item.label"
                class="text-sm font-bold w-full h-full flex items-center justify-center"
                :class="isExportMode ? 'text-black' : 'text-white'"
              >
                {{ item.label }}
              </span>
            </div>

            <!-- Controls overlay for selected item -->
            <div
              v-if="selectedId === item.id && !isExportMode"
              class="absolute -inset-[3px] pointer-events-none"
            >
              <!-- Delete button -->
              <button
                class="absolute -top-4 -right-4 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center pointer-events-auto hover:scale-110 shadow-lg z-40"
                @click.stop="deleteItem(item.id)"
              >
                <Icon icon="lucide:x" class="size-4" />
              </button>

              <!-- Edit Label button (if item has label) -->
              <button
                v-if="item.label !== undefined"
                class="absolute -top-4 left-1/2 -translate-x-1/2 w-7 h-7 bg-accent-amber text-white rounded-full flex items-center justify-center pointer-events-auto hover:scale-110 shadow-lg z-40"
                @click.stop="editLabel(item)"
              >
                <Icon icon="lucide:pencil" class="size-3" />
              </button>

              <!-- Rotate button -->
              <button
                class="absolute -bottom-4 -left-4 w-7 h-7 bg-accent-sky text-white rounded-full flex items-center justify-center pointer-events-auto hover:scale-110 shadow-lg z-40"
                @click.stop="rotateItem(item)"
              >
                <Icon icon="lucide:rotate-cw" class="size-3" />
              </button>

              <!-- Resize Handle (bottom right) -->
              <div
                class="absolute -bottom-2 -right-2 w-4 h-4 bg-accent-coral rounded-sm cursor-se-resize pointer-events-auto shadow-md z-40 flex items-center justify-center"
                @mousedown.stop="startResize($event, item)"
              >
                <Icon
                  icon="lucide:scaling"
                  class="size-3 text-bg-deep opacity-80 pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-pattern {
  background-size: 20px 20px;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Blueprint Export Overrides */
.blueprint-export {
  background-color: white !important;
}
.blueprint-export .item-box {
  background-color: transparent !important;
  color: black !important;
}
/* Force black borders for blueprint */
.blueprint-export .item-box[class*='border'] {
  border-color: black !important;
  border-width: 2px !important;
}
/* Except dashed lines */
.blueprint-export .item-box[class*='border-dashed'] {
  border-style: dashed !important;
  border-width: 1px !important;
}
/* Concrete Wall pattern */
.blueprint-export .item-wall-concrete {
  background-color: #333 !important;
}
/* Solid Wall */
.blueprint-export .item-wall-solid {
  background: repeating-linear-gradient(45deg, white, white 2px, black 2px, black 4px) !important;
}
</style>
