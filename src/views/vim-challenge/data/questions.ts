export interface VimQuestion {
  id: string
  description: string
  descriptionEn: string
  answers: string[][]
  category: 'motion' | 'edit' | 'insert' | 'search' | 'command'
  level: number
}

export interface LevelInfo {
  id: number
  title: string
  description: string
  icon: string
}

export const LEVELS: LevelInfo[] = [
  { id: 1, title: 'Orientation', description: 'Cơ bản về di chuyển con trỏ', icon: 'lucide:move' },
  { id: 2, title: 'Word & Line', description: 'Di chuyển theo từ và dòng', icon: 'lucide:type' },
  { id: 3, title: 'Modification', description: 'Chỉnh sửa văn bản cơ bản', icon: 'lucide:edit' },
  {
    id: 4,
    title: 'Input Master',
    description: 'Làm chủ các chế độ chèn',
    icon: 'lucide:plus-square',
  },
  {
    id: 5,
    title: 'File Control',
    description: 'Quản lý file và tìm kiếm',
    icon: 'lucide:file-code',
  },
  { id: 6, title: 'Visual Mode', description: 'Chế độ chọn văn bản', icon: 'lucide:layers' },
  { id: 7, title: 'Text Objects', description: 'Làm chủ đối tượng văn bản', icon: 'lucide:box' },
  {
    id: 8,
    title: 'Advanced Search',
    description: 'Tìm kiếm ký tự nâng cao',
    icon: 'lucide:search',
  },
  {
    id: 9,
    title: 'Window & Buffer',
    description: 'Quản lý cửa sổ và bộ đệm',
    icon: 'lucide:layout',
  },
  { id: 10, title: 'Master Class', description: 'Kỹ thuật Vim nâng cao', icon: 'lucide:zap' },
]

export const VIM_QUESTIONS: VimQuestion[] = [
  // LEVEL 1: Orientation
  {
    id: 'left',
    description: 'Di chuyển sang trái một ký tự',
    descriptionEn: 'Move left one character',
    answers: [['h']],
    category: 'motion',
    level: 1,
  },
  {
    id: 'down',
    description: 'Di chuyển xuống một dòng',
    descriptionEn: 'Move down one line',
    answers: [['j']],
    category: 'motion',
    level: 1,
  },
  {
    id: 'up',
    description: 'Di chuyển lên một dòng',
    descriptionEn: 'Move up one line',
    answers: [['k']],
    category: 'motion',
    level: 1,
  },
  {
    id: 'right',
    description: 'Di chuyển sang phải một ký tự',
    descriptionEn: 'Move right one character',
    answers: [['l']],
    category: 'motion',
    level: 1,
  },

  // LEVEL 2: Word & Line
  {
    id: 'word_forward',
    description: 'Di chuyển tới đầu từ tiếp theo',
    descriptionEn: 'Move to the beginning of the next word',
    answers: [['w']],
    category: 'motion',
    level: 2,
  },
  {
    id: 'word_backward',
    description: 'Di chuyển về đầu từ trước đó',
    descriptionEn: 'Move to the beginning of the previous word',
    answers: [['b']],
    category: 'motion',
    level: 2,
  },
  {
    id: 'word_end',
    description: 'Di chuyển tới cuối từ hiện tại',
    descriptionEn: 'Move to the end of the word',
    answers: [['e']],
    category: 'motion',
    level: 2,
  },
  {
    id: 'line_start',
    description: 'Di chuyển tới đầu dòng',
    descriptionEn: 'Move to the beginning of the line',
    answers: [['0']],
    category: 'motion',
    level: 2,
  },
  {
    id: 'line_first_char',
    description: 'Di chuyển tới ký tự đầu tiên của dòng',
    descriptionEn: 'Move to the first non-blank character of the line',
    answers: [['^']],
    category: 'motion',
    level: 2,
  },
  {
    id: 'line_end',
    description: 'Di chuyển tới cuối dòng',
    descriptionEn: 'Move to the end of the line',
    answers: [['$']],
    category: 'motion',
    level: 2,
  },

  // LEVEL 3: Modification
  {
    id: 'delete_char',
    description: 'Xóa ký tự tại con trỏ',
    descriptionEn: 'Delete character under cursor',
    answers: [['x']],
    category: 'edit',
    level: 3,
  },
  {
    id: 'delete_line',
    description: 'Xóa dòng hiện tại',
    descriptionEn: 'Delete current line',
    answers: [['d', 'd']],
    category: 'edit',
    level: 3,
  },
  {
    id: 'undo',
    description: 'Hoàn tác (Undo)',
    descriptionEn: 'Undo last change',
    answers: [['u']],
    category: 'edit',
    level: 3,
  },
  {
    id: 'redo',
    description: 'Làm lại (Redo)',
    descriptionEn: 'Redo last undone change',
    answers: [['Control', 'r']],
    category: 'edit',
    level: 3,
  },
  {
    id: 'paste_after',
    description: 'Dán sau con trỏ',
    descriptionEn: 'Paste after cursor',
    answers: [['p']],
    category: 'edit',
    level: 3,
  },
  {
    id: 'copy_line',
    description: 'Copy dòng hiện tại (yank)',
    descriptionEn: 'Copy current line (yank)',
    answers: [['y', 'y']],
    category: 'edit',
    level: 3,
  },

  // LEVEL 4: Input Master
  {
    id: 'insert_before',
    description: 'Chế độ Insert trước con trỏ',
    descriptionEn: 'Insert mode before cursor',
    answers: [['i']],
    category: 'insert',
    level: 4,
  },
  {
    id: 'insert_after',
    description: 'Chế độ Insert sau con trỏ',
    descriptionEn: 'Insert mode after cursor',
    answers: [['a']],
    category: 'insert',
    level: 4,
  },
  {
    id: 'insert_start_line',
    description: 'Chế độ Insert ở đầu dòng',
    descriptionEn: 'Insert mode at start of line',
    answers: [['I']],
    category: 'insert',
    level: 4,
  },
  {
    id: 'insert_end_line',
    description: 'Chế độ Insert ở cuối dòng',
    descriptionEn: 'Insert mode at end of line',
    answers: [['A']],
    category: 'insert',
    level: 4,
  },
  {
    id: 'open_below',
    description: 'Thêm dòng mới bên dưới',
    descriptionEn: 'Open new line below and insert',
    answers: [['o']],
    category: 'insert',
    level: 4,
  },
  {
    id: 'open_above',
    description: 'Thêm dòng mới bên trên',
    descriptionEn: 'Open new line above and insert',
    answers: [['O']],
    category: 'insert',
    level: 4,
  },

  // LEVEL 5: File Control
  {
    id: 'file_start',
    description: 'Di chuyển lên đầu file',
    descriptionEn: 'Move to the beginning of the file',
    answers: [['g', 'g']],
    category: 'motion',
    level: 5,
  },
  {
    id: 'file_end',
    description: 'Di chuyển xuống cuối file',
    descriptionEn: 'Move to the end of the file',
    answers: [['G']],
    category: 'motion',
    level: 5,
  },
  {
    id: 'search_forward',
    description: 'Tìm kiếm chuỗi',
    descriptionEn: 'Search forward',
    answers: [['/']],
    category: 'search',
    level: 5,
  },
  {
    id: 'save',
    description: 'Lưu file',
    descriptionEn: 'Save file',
    answers: [[':', 'w', 'Enter']],
    category: 'command',
    level: 5,
  },
  {
    id: 'save_quit',
    description: 'Lưu và thoát',
    descriptionEn: 'Save and quit',
    answers: [
      [':', 'w', 'q', 'Enter'],
      ['Z', 'Z'],
    ],
    category: 'command',
    level: 5,
  },

  // LEVEL 6: Visual Mode
  {
    id: 'visual_char',
    description: 'Vào chế độ Visual (ký tự)',
    descriptionEn: 'Enter Visual mode (character)',
    answers: [['v']],
    category: 'edit',
    level: 6,
  },
  {
    id: 'visual_line',
    description: 'Vào chế độ Visual (dòng)',
    descriptionEn: 'Enter Visual mode (line)',
    answers: [['V']],
    category: 'edit',
    level: 6,
  },
  {
    id: 'visual_block',
    description: 'Vào chế độ Visual (khối)',
    descriptionEn: 'Enter Visual mode (block)',
    answers: [['Control', 'v']],
    category: 'edit',
    level: 6,
  },
  {
    id: 'yank_selection',
    description: 'Copy vùng chọn',
    descriptionEn: 'Yank selection',
    answers: [['y']],
    category: 'edit',
    level: 6,
  },
  {
    id: 'delete_selection',
    description: 'Xóa vùng chọn',
    descriptionEn: 'Delete selection',
    answers: [['d'], ['x']],
    category: 'edit',
    level: 6,
  },

  // LEVEL 7: Text Objects
  {
    id: 'inner_word',
    description: 'Chọn từ hiện tại (inner word)',
    descriptionEn: 'Select inner word',
    answers: [['i', 'w']],
    category: 'edit',
    level: 7,
  },
  {
    id: 'around_word',
    description: 'Chọn từ hiện tại và khoảng trắng',
    descriptionEn: 'Select around word',
    answers: [['a', 'w']],
    category: 'edit',
    level: 7,
  },
  {
    id: 'inner_quote',
    description: 'Chọn nội dung trong dấu ngoặc kép',
    descriptionEn: 'Select inside double quotes',
    answers: [['i', '"']],
    category: 'edit',
    level: 7,
  },
  {
    id: 'inner_paren',
    description: 'Chọn nội dung trong dấu ngoặc đơn',
    descriptionEn: 'Select inside parentheses',
    answers: [['i', '(']],
    category: 'edit',
    level: 7,
  },

  // LEVEL 8: Advanced Search
  {
    id: 'find_char',
    description: 'Tìm ký tự tiếp theo trên dòng',
    descriptionEn: 'Find next character on line',
    answers: [['f']],
    category: 'motion',
    level: 8,
  },
  {
    id: 'find_char_back',
    description: 'Tìm ký tự trước đó trên dòng',
    descriptionEn: 'Find previous character on line',
    answers: [['F']],
    category: 'motion',
    level: 8,
  },
  {
    id: 'till_char',
    description: 'Tìm đến trước ký tự tiếp theo',
    descriptionEn: 'Till next character on line',
    answers: [['t']],
    category: 'motion',
    level: 8,
  },
  {
    id: 'repeat_find',
    description: 'Lặp lại lệnh tìm ký tự',
    descriptionEn: 'Repeat last character find',
    answers: [[';']],
    category: 'motion',
    level: 8,
  },

  // LEVEL 9: Window & Buffer
  {
    id: 'split_vertical',
    description: 'Chia dọc cửa sổ',
    descriptionEn: 'Split window vertically',
    answers: [
      ['Control', 'w', 'v'],
      [':', 'v', 's', 'p', 'Enter'],
    ],
    category: 'command',
    level: 9,
  },
  {
    id: 'split_horizontal',
    description: 'Chia ngang cửa sổ',
    descriptionEn: 'Split window horizontally',
    answers: [
      ['Control', 'w', 's'],
      [':', 's', 'p', 'Enter'],
    ],
    category: 'command',
    level: 9,
  },
  {
    id: 'next_buffer',
    description: 'Chuyển sang buffer tiếp theo',
    descriptionEn: 'Go to next buffer',
    answers: [[':', 'b', 'n', 'Enter']],
    category: 'command',
    level: 9,
  },
  {
    id: 'prev_buffer',
    description: 'Chuyển về buffer trước đó',
    descriptionEn: 'Go to previous buffer',
    answers: [[':', 'b', 'p', 'Enter']],
    category: 'command',
    level: 9,
  },

  // LEVEL 10: Master Class
  {
    id: 'repeat_last',
    description: 'Lặp lại thao tác chỉnh sửa cuối',
    descriptionEn: 'Repeat last change',
    answers: [['.']],
    category: 'edit',
    level: 10,
  },
  {
    id: 'record_macro',
    description: 'Bắt đầu ghi macro vào thanh ghi a',
    descriptionEn: 'Start recording macro into register a',
    answers: [['q', 'a']],
    category: 'command',
    level: 10,
  },
  {
    id: 'play_macro',
    description: 'Chạy macro từ thanh ghi a',
    descriptionEn: 'Play macro from register a',
    answers: [['@', 'a']],
    category: 'command',
    level: 10,
  },
  {
    id: 'set_mark',
    description: 'Đánh dấu vị trí a',
    descriptionEn: 'Set mark a',
    answers: [['m', 'a']],
    category: 'command',
    level: 10,
  },
  {
    id: 'jump_mark',
    description: 'Nhảy tới vị trí đánh dấu a',
    descriptionEn: 'Jump to mark a',
    answers: [["'", 'a']],
    category: 'motion',
    level: 10,
  },
]
