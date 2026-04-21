import type { CommitKind, StoryLane } from './types'

export const SAMPLE_LOG = `9f1a2c3 feat(ui): add release timeline panel
8ab47d0 fix(parser): handle commit messages without scope
0fce11a docs(readme): add usage examples for commit format
14ed4bf refactor(state): split parser and formatter logic
4ca1e20 perf: reduce parsing cost with single-pass grouping
f0b9dda test(parser): add regression cases for invalid hashes
6bc8810 chore: update labels for release board
aa56ed2 feat(export)!: support markdown notes with chapter headers
d2e4a18 ci: run lint on pull_request`

export const KNOWN_KIND_MAP: Record<string, CommitKind> = {
  feat: 'feat',
  feature: 'feat',
  fix: 'fix',
  bugfix: 'fix',
  hotfix: 'fix',
  docs: 'docs',
  doc: 'docs',
  refactor: 'refactor',
  perf: 'perf',
  test: 'test',
  build: 'build',
  chore: 'chore',
  style: 'style',
  ci: 'ci',
  revert: 'revert',
}

export const KIND_LABEL: Record<CommitKind, string> = {
  feat: 'Feature',
  fix: 'Fix',
  docs: 'Docs',
  refactor: 'Refactor',
  perf: 'Performance',
  test: 'Test',
  build: 'Build',
  chore: 'Chore',
  style: 'Style',
  ci: 'CI',
  revert: 'Revert',
  other: 'Other',
}

export const LANE_ORDER: StoryLane[] = ['value', 'stability', 'quality', 'maintenance', 'knowledge', 'other']

export const LANE_META: Record<StoryLane, { title: string; note: string; icon: string }> = {
  value: {
    title: 'Chương 1 - Giá trị mới',
    note: 'Những thay đổi tạo ra giá trị trực tiếp cho người dùng.',
    icon: 'lucide:sparkles',
  },
  stability: {
    title: 'Chương 2 - Ổn định và bảo vệ',
    note: 'Sửa lỗi và tối ưu để release an toàn hơn.',
    icon: 'lucide:shield-check',
  },
  quality: {
    title: 'Chương 3 - Nâng cấp nội lực',
    note: 'Refactor và test để codebase bền vững hơn.',
    icon: 'lucide:wrench',
  },
  maintenance: {
    title: 'Chương 4 - Vận hành',
    note: 'Việc hậu cần để sprint được đóng gói gọn gàng.',
    icon: 'lucide:settings-2',
  },
  knowledge: {
    title: 'Chương 5 - Truyền đạt tri thức',
    note: 'Tài liệu hóa để team dễ bàn giao và on-board.',
    icon: 'lucide:book-open',
  },
  other: {
    title: 'Phụ lục',
    note: 'Các commit không theo khuôn Conventional Commit.',
    icon: 'lucide:ellipsis',
  },
}

export const KIND_ORDER: CommitKind[] = [
  'feat',
  'fix',
  'perf',
  'refactor',
  'test',
  'docs',
  'build',
  'chore',
  'style',
  'ci',
  'revert',
  'other',
]
