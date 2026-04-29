import type { LevelMeta, QuestionBank } from './types'

export const LEVEL_META: Record<'easy' | 'medium' | 'hard', LevelMeta> = {
  easy: {
    label: 'Level 1 - Easy',
    hint: 'Nắm syntax và behavior nền tảng của JavaScript.',
  },
  medium: {
    label: 'Level 2 - Medium',
    hint: 'Đụng tới async, immutability và những bẫy thường gặp.',
  },
  hard: {
    label: 'Level 3 - Hard',
    hint: 'Các case khó: closure nâng cao, event loop, error handling.',
  },
}

export const QUESTION_BANK: QuestionBank = {
  easy: [
    {
      id: 'easy-1',
      level: 'easy',
      title: 'for + closure',
      snippet: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0)
}
// Mong muốn: 0, 1, 2`,
      question: 'Cách sửa tốt nhất để in đúng 0, 1, 2?',
      choices: [
        { id: 'A', text: 'Đổi var thành let trong vòng lặp' },
        { id: 'B', text: 'Giữ var, tăng delay lên 1000ms' },
        { id: 'C', text: 'Dùng console.table thay cho console.log' },
        { id: 'D', text: 'Thêm i++ trong callback setTimeout' },
      ],
      correctChoice: 'A',
      explanation:
        'let tạo binding riêng theo từng vòng lặp, vì vậy callback giữ đúng giá trị i.',
    },
    {
      id: 'easy-2',
      level: 'easy',
      title: 'this trong object method',
      snippet: `const counter = {
  count: 0,
  inc: () => {
    this.count++
  },
}
counter.inc()`,
      question: 'Vì sao count không tăng và cách sửa đúng là gì?',
      choices: [
        { id: 'A', text: 'Đổi count sang BigInt' },
        { id: 'B', text: 'Đổi inc thành function inc() { this.count++ }' },
        { id: 'C', text: 'Dùng this?.count++ trong arrow function' },
        { id: 'D', text: 'Gọi counter.inc.bind(window)()' },
      ],
      correctChoice: 'B',
      explanation:
        'Arrow function không có this riêng. Method object nên dùng function thường để this trỏ đúng object.',
    },
    {
      id: 'easy-3',
      level: 'easy',
      title: 'Nullish vs OR',
      snippet: `const qty = 0
const show = qty || 10
console.log(show) // 10`,
      question: 'Nếu 0 là giá trị hợp lệ, chỉ fallback khi null/undefined thì dùng gì?',
      choices: [
        { id: 'A', text: 'Dùng qty && 10' },
        { id: 'B', text: 'Dùng qty ?? 10' },
        { id: 'C', text: 'Dùng Boolean(qty) ? qty : 10' },
        { id: 'D', text: 'Dùng qty | 10' },
      ],
      correctChoice: 'B',
      explanation:
        'Toán tử ?? chỉ fallback với null hoặc undefined, không ép 0 thành false-case.',
    },
    {
      id: 'easy-4',
      level: 'easy',
      title: 'parseInt với map',
      snippet: `const arr = ['10', '11', '12']
const out = arr.map(parseInt)
console.log(out) // [10, NaN, 1]`,
      question: 'Sửa ngắn gọn nào cho ra [10, 11, 12]?',
      choices: [
        { id: 'A', text: 'arr.map((s) => parseInt(s, 10))' },
        { id: 'B', text: 'arr.map(parseFloat, 10)' },
        { id: 'C', text: 'arr.map(Number.parseInt)' },
        { id: 'D', text: 'arr.map((s, i) => parseInt(s, i))' },
      ],
      correctChoice: 'A',
      explanation:
        'map truyền vào (value, index), nên index vô tình bị dùng làm radix nếu truyền parseInt trực tiếp.',
    },
  ],
  medium: [
    {
      id: 'medium-1',
      level: 'medium',
      title: 'Mutate mảng đầu vào',
      snippet: `function addTag(tags) {
  tags.push('new')
  return tags
}
const base = ['a']
const next = addTag(base)
// base cũng bị đổi`,
      question: 'Nếu muốn tránh side effect lên mảng gốc?',
      choices: [
        { id: 'A', text: 'Dùng tags.concat("new") hoặc [...tags, "new"]' },
        { id: 'B', text: 'Dùng tags.sort() trước khi push' },
        { id: 'C', text: 'Dùng Object.seal(tags) rồi push' },
        { id: 'D', text: 'Đổi push thành unshift' },
      ],
      correctChoice: 'A',
      explanation: 'concat/spread tạo mảng mới nên không mutate dữ liệu đầu vào.',
    },
    {
      id: 'medium-2',
      level: 'medium',
      title: 'Promise.all và lỗi',
      snippet: `const jobs = [fetch('/a'), fetch('/b'), fetch('/c')]
const data = await Promise.all(jobs)
// Chỉ cần 1 request fail là throw`,
      question: 'Khi muốn lấy kết quả thành công dù có request fail thì dùng gì?',
      choices: [
        { id: 'A', text: 'Promise.race(jobs)' },
        { id: 'B', text: 'Promise.any(jobs)' },
        { id: 'C', text: 'Promise.allSettled(jobs)' },
        { id: 'D', text: 'setTimeout bọc Promise.all' },
      ],
      correctChoice: 'C',
      explanation:
        'allSettled trả trạng thái từng promise, giúp bạn xử lý từng phần fulfilled/rejected.',
    },
    {
      id: 'medium-3',
      level: 'medium',
      title: 'Quên await',
      snippet: `async function loadUser() {
  const res = fetch('/api/user')
  const data = res.json()
  return data.name
}`,
      question: 'Lỗi chính nằm ở đâu?',
      choices: [
        { id: 'A', text: 'fetch phải đặt ngoài async function' },
        { id: 'B', text: 'Cần await cho fetch và res.json()' },
        { id: 'C', text: 'Không được return trong async function' },
        { id: 'D', text: 'name phải đổi thành username' },
      ],
      correctChoice: 'B',
      explanation:
        'fetch và res.json đều trả Promise. Cần await trước khi truy cập thuộc tính name.',
    },
    {
      id: 'medium-4',
      level: 'medium',
      title: 'Sort số bị sai',
      snippet: `const nums = [1, 10, 2, 21]
nums.sort()
console.log(nums) // [1, 10, 2, 21]`,
      question: 'Sửa thế nào để sort tăng dần theo số?',
      choices: [
        { id: 'A', text: 'nums.sort((a, b) => a - b)' },
        { id: 'B', text: 'nums.sort((a, b) => a > b)' },
        { id: 'C', text: 'nums.sort(Number)' },
        { id: 'D', text: 'nums.reverse().sort()' },
      ],
      correctChoice: 'A',
      explanation:
        'sort mặc định so chuỗi. Comparator số chuẩn là trả về số âm, 0, số dương.',
    },
  ],
  hard: [
    {
      id: 'hard-1',
      level: 'hard',
      title: 'forEach + await',
      snippet: `const ids = [1, 2, 3]
ids.forEach(async (id) => {
  await fetch('/user/' + id)
})
console.log('done')`,
      question: 'Vì sao done in ra sớm, và nên sửa cách nào?',
      choices: [
        { id: 'A', text: 'Đổi forEach thành map là đủ' },
        { id: 'B', text: 'Dùng for...of + await hoặc Promise.all(ids.map(...))' },
        { id: 'C', text: 'Bọc toàn bộ trong setTimeout' },
        { id: 'D', text: 'Thêm await trước ids.forEach(...)' },
      ],
      correctChoice: 'B',
      explanation:
        'forEach không chờ async callback. Bạn cần for...of để tuần tự hoặc Promise.all để chạy song song có chờ.',
    },
    {
      id: 'hard-2',
      level: 'hard',
      title: 'try/catch không bắt được lỗi',
      snippet: `try {
  setTimeout(() => {
    throw new Error('boom')
  }, 0)
} catch (e) {
  console.error('caught', e)
}`,
      question: 'Vì sao catch không chạy?',
      choices: [
        { id: 'A', text: 'Vì setTimeout chạy ở call stack khác sau khi try kết thúc' },
        { id: 'B', text: 'Vì Error chỉ bắt được trong Promise' },
        { id: 'C', text: 'Vì catch chỉ dùng cho syntax error' },
        { id: 'D', text: 'Vì thiếu finally' },
      ],
      correctChoice: 'A',
      explanation:
        'Lỗi ném trong callback async không nằm trong phạm vi try/catch đồng bộ trước đó.',
    },
    {
      id: 'hard-3',
      level: 'hard',
      title: 'JSON clone làm mất dữ liệu',
      snippet: `const source = {
  createdAt: new Date(),
  total: Infinity,
  fn: () => 1,
}
const cloned = JSON.parse(JSON.stringify(source))`,
      question: 'Vì sao cách clone này nguy hiểm cho object phức tạp?',
      choices: [
        { id: 'A', text: 'Vì JSON stringify chạy quá chậm' },
        { id: 'B', text: 'Vì làm mất Date/function/Infinity và kiểu dữ liệu đặc biệt' },
        { id: 'C', text: 'Vì JSON.parse trả undefined' },
        { id: 'D', text: 'Vì cloned trỏ cùng reference với source' },
      ],
      correctChoice: 'B',
      explanation:
        'JSON clone chỉ an toàn cho dữ liệu JSON thuần. Các kiểu đặc biệt sẽ mất hoặc bị biến dạng.',
    },
    {
      id: 'hard-4',
      level: 'hard',
      title: 'Microtask vs macrotask',
      snippet: `console.log('A')
setTimeout(() => console.log('B'), 0)
Promise.resolve().then(() => console.log('C'))
console.log('D')`,
      question: 'Thứ tự output đúng là gì?',
      choices: [
        { id: 'A', text: 'A -> B -> C -> D' },
        { id: 'B', text: 'A -> D -> B -> C' },
        { id: 'C', text: 'A -> D -> C -> B' },
        { id: 'D', text: 'C -> A -> D -> B' },
      ],
      correctChoice: 'C',
      explanation:
        'Code sync chạy trước (A, D), rồi microtask Promise (C), cuối cùng macrotask setTimeout (B).',
    },
  ],
}
