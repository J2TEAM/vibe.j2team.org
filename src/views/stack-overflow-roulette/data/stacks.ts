export type LayerType = 'frontend' | 'backend' | 'database'

export interface TechOption {
  id: string
  name: string
  color: string // Tailwind color class or hex (we'll use classes like text-accent-coral)
}

export const techStacks: Record<LayerType, TechOption[]> = {
  frontend: [
    { id: 'react', name: 'React', color: 'text-[#61DAFB]' },
    { id: 'vue', name: 'Vue', color: 'text-[#42b883]' },
    { id: 'angular', name: 'Angular', color: 'text-[#DD0031]' },
    { id: 'svelte', name: 'Svelte', color: 'text-[#FF3E00]' },
    { id: 'jquery', name: 'jQuery', color: 'text-[#0769AD]' },
    { id: 'vanilla', name: 'Vanilla JS', color: 'text-[#F7DF1E]' },
    { id: 'htmx', name: 'HTMX', color: 'text-text-primary' },
    { id: 'blade', name: 'Blade (PHP)', color: 'text-[#8993BE]' },
    { id: 'jsp', name: 'JSP (Năm 2005)', color: 'text-text-secondary' },
  ],
  backend: [
    { id: 'node', name: 'Node.js', color: 'text-[#339933]' },
    { id: 'bun', name: 'Bun', color: 'text-[#fbf0df]' },
    { id: 'python', name: 'Python (FastAPI)', color: 'text-[#3776AB]' },
    { id: 'php', name: 'PHP (Laravel)', color: 'text-[#777BB4]' },
    { id: 'go', name: 'Go', color: 'text-[#00ADD8]' },
    { id: 'java', name: 'Java (Spring)', color: 'text-[#5382a1]' },
    { id: 'rust', name: 'Rust', color: 'text-[#DEA584]' },
    { id: 'cobol', name: 'COBOL', color: 'text-text-dim' },
    { id: 'excel', name: 'Macros Excel', color: 'text-[#217346]' },
  ],
  database: [
    { id: 'postgres', name: 'PostgreSQL', color: 'text-[#336791]' },
    { id: 'mysql', name: 'MySQL', color: 'text-[#4479A1]' },
    { id: 'mongodb', name: 'MongoDB', color: 'text-[#47A248]' },
    { id: 'redis', name: 'Redis', color: 'text-[#DC382D]' },
    { id: 'sqlite', name: 'SQLite', color: 'text-[#003B57]' },
    { id: 'firebase', name: 'Firebase', color: 'text-[#FFCA28]' },
    { id: 'json', name: 'data.json file', color: 'text-text-secondary' },
    { id: 'txt', name: 'Notepad (.txt)', color: 'text-text-dim' },
    { id: 'brain', name: 'Trí nhớ của Dev', color: 'text-accent-coral' },
  ],
}

// Hàm render ra Review của Senior Dev dựa vào tổ hợp Stack
export function getSeniorReview(
  frontend: string,
  backend: string,
  database: string,
): { rating: number; review: string } {
  // Combo hủy diệt 1: Excel / Txt / Brain DB
  if (database === 'txt' || database === 'brain' || database === 'json' || backend === 'excel') {
    return {
      rating: 1,
      review:
        'Cái mớ rác rưởi này mà cũng gọi là tech stack à? Database là file txt? Bạn định viết hệ thống gửi thiệp cưới hở?',
    }
  }

  // Cổ đại combo
  if (frontend === 'jquery' || frontend === 'jsp' || backend === 'cobol') {
    return {
      rating: 2,
      review:
        'Combo này tôi thấy quen lắm... hình như từ hồi tôi mới vào nghề năm 2005. Bạn đang bảo trì hệ thống của ngân hàng à?',
    }
  }

  // React / Node / Mongo (MERN)
  if (frontend === 'react' && backend === 'node' && database === 'mongodb') {
    return {
      rating: 3,
      review:
        'MERN stack. Tutorial trên mạng dạy sao làm y vậy hả? Được cái dễ tuyển Dev rẻ mạt thay thế mặt bạn.',
    }
  }

  // Hype train (Rust + Svelte/HTMX + Postgres)
  if (
    (frontend === 'svelte' || frontend === 'htmx') &&
    (backend === 'rust' || backend === 'go') &&
    database === 'postgres'
  ) {
    return {
      rating: 5,
      review:
        'Bạn đọc tin tức công nghệ quá nhiều rồi đấy. Nhưng công nhận là setup này chạy mượt, 0KB Javascript đúng ý tôi! Chấm 5 sao.',
    }
  }

  // PHP/Laravel thần thánh
  if (backend === 'php' && database === 'mysql') {
    if (frontend === 'blade' || frontend === 'vue') {
      return {
        rating: 4,
        review:
          'Kiểu classic của anh em làm web dạo kiếm tiền. Chạy ổn, deploy nhanh, kiếm tiền tỉ mà bị mấy đứa xài JS nó khinh. Kệ!',
      }
    }
  }

  // Java Spring + Angular + Oracle/Postgres (Enterprise)
  if (backend === 'java' && frontend === 'angular') {
    return {
      rating: 4,
      review:
        'Anh sếp doanh nghiệp to thích combo này. Mất 3 tháng để setup dự án và hello world, bù lại thì bảo mật tốt (chắc thế).',
    }
  }

  // Random fallback reviews dựa vào các biến
  const randomReviews = [
    `Dùng ${techStacks.frontend.find((f) => f.id === frontend)?.name} với ${techStacks.backend.find((b) => b.id === backend)?.name}? Hơi dị nhưng nếu deploy ra tiền thì cứ làm.`,
    `Database là ${techStacks.database.find((d) => d.id === database)?.name} thì cũng ổn, mong là bạn biết đánh index chứ đừng Select * from Users.`,
    `Trông cũng ra gì đấy. Nhưng stack gì thì sớm muộn cũng thành legacy code để thế hệ sau lại chửi đổng lên thôi.`,
    `Tổ hợp này sẽ dạy cho bạn nhiều bài học về... sự kiên nhẫn. Cố lên nhé!`,
    `Để chạy được đống này chắc mất nguyên ngày config Docker. À quên... bạn đã biết dùng Docker chưa?`,
    `Stack xịn đấy. Nhưng cái app Todo List của bạn có cần phức tạp đến mức này không?`,
  ]

  // Pseudo-random dựa vào string
  const hash = (frontend + backend + database).length % randomReviews.length

  return {
    rating: 3,
    review: randomReviews[hash]!,
  }
}
