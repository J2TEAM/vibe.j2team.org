export const STYLES = {
  conventional: {
    name: { vi: 'Conventional', en: 'Conventional' },
    description: {
      vi: 'Chuẩn công nghiệp (feat, fix, docs...). Phù hợp cho dự án chuyên nghiệp.',
      en: 'Industry standard (feat, fix, docs...). Perfect for professional projects.',
    },
    icon: 'fluent:document-header-24-filled',
    prompt:
      'Generate a standard Conventional Commit message (type: description) in Vietnamese. Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert. Keep it concise.',
  },
  chaotic: {
    name: { vi: 'Chí Phèo', en: 'Chaotic' },
    description: {
      vi: 'Trung thực đến đau lòng. Thích gì nói đó, không cần quy tắc.',
      en: "Brutally honest. Say whatever you want, rules don't apply here.",
    },
    icon: 'fluent:flash-sparkle-24-filled',
    prompt:
      'Generate a meta, chaotic, and brutally honest commit message in Vietnamese. It can be informal, usage of slang is ok. Example: "Code này chạy nhưng tôi không biết tại sao".',
  },
  passive_aggressive: {
    name: { vi: 'Thâm Thúy', en: 'Passive Aggressive' },
    description: {
      vi: 'Nhẹ nhàng cà khịa, thầm lặng phán xét những sai lầm trong code.',
      en: 'Subtly judging, quietly mocking the mistakes in the code.',
    },
    icon: 'fluent:dismiss-circle-24-filled',
    prompt:
      'Generate a passive-aggressive commit message in Vietnamese. It should sound slightly annoyed or silently judging.',
  },
  luc_bat: {
    name: { vi: 'Thơ Lục Bát', en: 'Poetry (6-8)' },
    description: {
      vi: 'Mang tâm hồn thi sĩ vào từng dòng code. Chuẩn vần điệu 6-8.',
      en: 'Bring your poetic soul into your code. Traditional 6-8 rhythm.',
    },
    icon: 'fluent:pen-sparkle-24-filled',
    prompt:
      'Generate a Git commit message in the form of Vietnamese "Thơ Lục Bát" (6-8 syllable poem). The poem must describe the change. Ensure it follows the rules of Lục Bát rhythm and rhyme.',
  },
  gen_z: {
    name: { vi: 'Gen Z', en: 'Gen Z' },
    description: {
      vi: 'Mỏ hỗn but slay. Đầy đủ slang và năng lượng trẻ trung.',
      en: 'Sassy but slay. Full of slang and youthful energy.',
    },
    icon: 'fluent:emoji-meme-24-filled',
    prompt:
      'Generate a Gen Z style commit message in Vietnamese using slang, emojis, and teen code if appropriate. Make it sound "mỏ hỗn" or "vibe" (e.g., "Fix bug này xong thấy mình thật là slay").',
  },
}

export const UI_TRANSLATIONS = {
  vi: {
    back: 'Quay lại',
    local_mode: 'Chế độ Local',
    ai_active: 'AI Engine Đang Chạy',
    title_top: 'GIT COMMIT HELPER // V1.0',
    title: 'Commit',
    subtitle: 'Generator',
    desc: 'Biến những câu mô tả khô khan thành những dòng commit đầy "vibe". Phù hợp cho mọi trạng thái tinh thần.',
    label_input: 'Mô tả công việc vừa làm',
    placeholder_input: 'Ví dụ: Đã sửa xong lỗi căn lề trên trình duyệt Safari…',
    label_mood: 'Chọn mood của bạn',
    btn_generate_ai: 'Generate với AI',
    btn_generate_local: 'Lấy Template Random',
    btn_loading: 'Đang xử lý dữ liệu…',
    label_result: 'Commit Message đã sẵn sàng',
    btn_sanitize: 'Xử lý chuyên nghiệp',
    btn_copy: 'Copy to Clipboard',
    tip_title: 'Tiết lộ nhỏ:',
    tip_desc:
      'Bạn đang dùng chế độ **Local Mode**. Để có những dòng commit "độc bản" và thông minh hơn, hãy nhập',
    tip_key: 'Gemini API Key',
    settings_title: 'Cài đặt',
    settings_label: 'Google Gemini API Key',
    settings_placeholder: 'AI Key của bạn…',
    settings_desc: 'Lấy key miễn phí tại AI Studio. Key được lưu cục bộ trên máy của bạn.',
    settings_save: 'Lưu cấu hình',
    footer_art: '// Nghệ thuật là mã nguồn',
    footer_code: '// Mã nguồn là nghệ thuật',
  },
  en: {
    back: 'Back',
    local_mode: 'Local Mode',
    ai_active: 'AI Engine Active',
    title_top: 'GIT COMMIT HELPER // V1.0',
    title: 'Commit',
    subtitle: 'Generator',
    desc: 'Transform boring descriptions into stylish commit messages. Perfect for every mood.',
    label_input: 'Describe what you did',
    placeholder_input: 'Example: Fixed alignment bug on Safari browser…',
    label_mood: 'Choose your mood',
    btn_generate_ai: 'Generate with AI',
    btn_generate_local: 'Get Random Template',
    btn_loading: 'Processing data…',
    label_result: 'Commit Message is Ready',
    btn_sanitize: 'Make it Professional',
    btn_copy: 'Copy to Clipboard',
    tip_title: 'Pro Tip:',
    tip_desc:
      'You are using **Local Mode**. For unique and smarter commit messages, please enter your',
    tip_key: 'Gemini API Key',
    settings_title: 'Settings',
    settings_label: 'Google Gemini API Key',
    settings_placeholder: 'Your AI Key…',
    settings_desc: 'Get a free key at AI Studio. Key is stored locally on your machine.',
    settings_save: 'Save Config',
    footer_art: '// Art is Code',
    footer_code: '// Code is Art',
  },
}

export const SANITIZE_PROMPT =
  'Convert the following creative or informal commit message into a professional Conventional Commit message (feat: ... or fix: ...) in Vietnamese.'
