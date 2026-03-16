export interface FormState {
  username: string
  password: string
  email: string
  bio: string
}

export interface Rule {
  id: number
  description: string
  validator: (form: FormState) => boolean
}

const today = new Date()
const ddmm =
  String(today.getDate()).padStart(2, '0') + String(today.getMonth() + 1).padStart(2, '0')

const numWords = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'một',
  'hai',
  'ba',
  'bốn',
  'năm',
  'sáu',
  'bảy',
  'tám',
  'chín',
  'mười',
]

export const rules: Rule[] = [
  {
    id: 1,
    description: 'Username phải chứa ít nhất 5 ký tự.',
    validator: (f) => f.username.length >= 5,
  },
  {
    id: 2,
    description: 'Mật khẩu phải chứa ít nhất một chữ số.',
    validator: (f) => /\d/.test(f.password),
  },
  {
    id: 3,
    description: 'Email phải đúng định dạng (VD: a@b.com).',
    validator: (f) => /^\S+@\S+\.\S+$/.test(f.email),
  },
  {
    id: 4,
    description: 'Username phải vần với Mật khẩu (chữ cái cuối cùng của phần chữ phải giống nhau).',
    validator: (f) => {
      const uAlpha = f.username.replace(/[^a-zA-Z]/g, '').toLowerCase()
      const pAlpha = f.password.replace(/[^a-zA-Z]/g, '').toLowerCase()
      return uAlpha.length > 0 && pAlpha.length > 0 && uAlpha.slice(-1) === pAlpha.slice(-1)
    },
  },
  {
    id: 5,
    description: 'Tên miền Email phải chứa một số nguyên tố.',
    validator: (f) => {
      const domain = f.email.split('@')[1] || ''
      const match = domain.match(/\d+/g)
      if (!match) return false
      return match.some((numStr) => {
        const num = parseInt(numStr, 10)
        if (num < 2) return false
        for (let i = 2; i <= Math.sqrt(num); i++) if (num % i === 0) return false
        return true
      })
    },
  },
  {
    id: 6,
    description: 'Mật khẩu phải chứa Username được viết ngược.',
    validator: (f) => {
      if (f.username.length === 0) return false
      const rev = f.username.split('').reverse().join('')
      return f.password.includes(rev)
    },
  },
  {
    id: 7,
    description: 'Username phải chứa đúng 2 nguyên âm (a, e, i, o, u).',
    validator: (f) => {
      const v = f.username.match(/[aeiou]/gi)
      return v !== null && v.length === 2
    },
  },
  {
    id: 8,
    description: 'Bio phải nhắc đến tên một ngôn ngữ lập trình.',
    validator: (f) => {
      const langs = [
        'python',
        'javascript',
        'java',
        'c++',
        'typescript',
        'c#',
        'ruby',
        'php',
        'swift',
        'go',
        'kotlin',
        'rust',
        'c',
        'sql',
        'cpp',
        'cs',
      ]
      const lowerBio = f.bio.toLowerCase()
      // Use regex to find isolated words for c, go etc. Or just includes for longer.
      return langs.some((l) => {
        if (l.length <= 2 || l === 'sql' || l === 'cpp' || l === 'c++' || l === 'c#') {
          return new RegExp(`\\b${l.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`).test(lowerBio)
        }
        return lowerBio.includes(l)
      })
    },
  },
  {
    id: 9,
    description: 'Bio KHÔNG được chứa bất kỳ nguyên âm nào (a, e, i, o, u).',
    validator: (f) => !/[aeiou]/i.test(f.bio),
  },
  {
    id: 10,
    description: 'Mật khẩu phải chứa một chữ hoặc số đếm.',
    validator: (f) => {
      if (/\d/.test(f.password)) return true
      return numWords.some((n) => f.password.toLowerCase().includes(n))
    },
  },
  {
    id: 11,
    description:
      'Mật khẩu KHÔNG được chứa chữ số dạng số (VD: 0, 1, 2...). Hãy dùng chữ cái (VD: một, hai, one, two...). Ngoại lệ: chỉ cho phép dãy số của hôm nay (DDMM) nếu có yêu cầu.',
    validator: (f) => {
      // Remove today's date so it won't fail future rules
      const pwWithoutDate = f.password.replace(ddmm, '')
      return !/\d/.test(pwWithoutDate) && numWords.some((n) => f.password.toLowerCase().includes(n))
    },
  },
  {
    id: 12,
    description:
      'Độ dài vòng lặp: Tổng số lượng CHỮ CÁI trong Mật khẩu phải bằng chính xác GẤP ĐÔI độ dài Username.',
    validator: (f) => {
      const lettersInPw = f.password.replace(/[^a-zA-Z]/g, '').length
      return f.username.length > 0 && lettersInPw === f.username.length * 2
    },
  },
  {
    id: 13,
    description: 'Username phải trông "uy tín" (chứa admin, official, verified, hoặc trust).',
    validator: (f) => {
      const trust = ['admin', 'official', 'verified', 'trust']
      return trust.some((t) => f.username.toLowerCase().includes(t))
    },
  },
  {
    id: 14,
    description: 'Bio phải mang tính chất động viên Username (VD: bff, hgs, gg, ty, ftw, w).',
    validator: (f) => {
      // Vì không chứa nguyên âm, player dùng các từ vắn tắt hỗ trợ
      const support = ['bff', 'hgs', 'gg', 'ty', 'ftw', 'w']
      return support.some((s) => new RegExp(`\\b${s}\\b`).test(f.bio.toLowerCase()))
    },
  },
  {
    id: 15,
    description: 'Email phải chứa Username của bạn.',
    validator: (f) => f.username.length > 0 && f.email.includes(f.username.toLowerCase()),
  },
  {
    id: 16,
    description: `Mật khẩu phải chứa ngày hôm nay (định dạng DDMM, tức là: ${ddmm}).`,
    validator: (f) => f.password.includes(ddmm),
  },
  {
    id: 17,
    description:
      'Bio phải nhắc tên một ngôn ngữ lập trình không có thật (UltraScript, QuantumJS, HyperLang...). Hãy xoá nguyên âm: ltrscrpt, qntmjs, hyprlng.',
    validator: (f) => {
      const fake = ['ultrascript', 'quantumjs', 'hyperlang', 'ltrscrpt', 'qntmjs', 'hyprlng']
      return fake.some((fk) => f.bio.toLowerCase().includes(fk))
    },
  },
  {
    id: 18,
    description: 'Username phải chứa một chuỗi đối xứng chiều dài từ 3 trở lên (VD: aba, level).',
    validator: (f) => {
      const u = f.username.toLowerCase()
      if (u.length < 3) return false
      for (let i = 0; i <= u.length - 3; i++) {
        for (let j = i + 3; j <= u.length; j++) {
          const sub = u.slice(i, j)
          if (sub === sub.split('').reverse().join('')) return true
        }
      }
      return false
    },
  },
  {
    id: 19,
    description:
      'Mật khẩu phải mô tả Username (chứa các tính từ như fast, slow, hot, big, bad, good, quick, smart).',
    validator: (f) => {
      const adjs = ['fast', 'slow', 'hot', 'big', 'bad', 'good', 'quick', 'smart', 'cute']
      return adjs.some((a) => f.password.toLowerCase().includes(a))
    },
  },
  {
    id: 20,
    description:
      'AI duyệt form: form này phải làm AI thấy hợp lý. Username chứa từ hài hước (funny/haha), mật khẩu nên thơ (poetic), hoặc bio kỳ cục (wrd / weird).',
    validator: (f) => {
      const u = f.username.toLowerCase()
      const p = f.password.toLowerCase()
      const b = f.bio.toLowerCase()
      // Vì bio không có nguyên âm, nên dùng 'wrd' thay cho 'weird'. hoặc 'krpy' thay cho 'creepy'.
      return (
        u.includes('funny') ||
        u.includes('haha') ||
        p.includes('poetic') ||
        b.split(/[\s,.'"]+/).includes('wrd') ||
        b.includes('krpy')
      )
    },
  },
]
