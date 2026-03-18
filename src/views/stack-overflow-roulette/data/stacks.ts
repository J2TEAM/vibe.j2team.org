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
  const fName = techStacks.frontend.find((f) => f.id === frontend)?.name || frontend
  const bName = techStacks.backend.find((b) => b.id === backend)?.name || backend
  const dName = techStacks.database.find((d) => d.id === database)?.name || database

  // 1. Combo Hủy Diệt Cấp Độ Vũ Trụ
  if (database === 'brain') {
    return {
      rating: 1,
      review:
        'Dùng "Trí nhớ của Dev" làm Database? Thế sáng nay ăn gì có nhớ không mà đòi nhớ data của user? Cậu định vỗ đầu mỗi lần cần query à?',
    }
  }
  if (database === 'txt' || database === 'json') {
    return {
      rating: 1,
      review: `Database lưu bằng ${dName}? Chúc mừng, cậu vừa phát minh lại cách lưu trữ thời tiền sử. Đợi file phình lên 2GB rồi cậu sẽ biết thế nào là "race condition". Xuống phòng HR chờ lấy lương luôn đi.`,
    }
  }
  if (backend === 'excel') {
    return {
      rating: 1,
      review:
        'Backend chạy qua Macros Excel? Cậu định cho kế toán làm System Admin đúng không? Thử 5 request chạy cùng lúc xem cái bảng tính của cậu có bốc khói không?',
    }
  }

  // 2. Chửi đặc trưng từng stack
  if (frontend === 'htmx' && backend === 'rust' && database === 'postgres') {
    return {
      rating: 5,
      review:
        'HTMX + Rust + Postgres hả? Lại một thanh niên cuồng tech-bro và chửi "React là rác" đây mà. Setup thì ngầu đấy, 0KB JS, compile nhanh, nhưng cậu lôi đâu ra người maintain cái mớ code Rust thượng đẳng này khi cậu nghỉ việc?',
    }
  }

  if (frontend === 'react' && backend === 'node' && database === 'mongodb') {
    return {
      rating: 3,
      review:
        'Ah, MERN stack - "starter pack" của mọi trung tâm dạy lập trình cấp tốc. Không phải nó dở, mà là nhìn nó nhàm chán như cái áo sơ mi trắng đi xin việc vậy. Đừng nói với tôi cậu lưu password bằng plaintext trên Mongo nhé?',
    }
  }

  if ((frontend === 'jquery' || frontend === 'jsp') && backend === 'cobol') {
    return {
      rating: 2,
      review:
        'Combo khảo cổ học! Cậu đang bảo trì hệ thống cho cục thuế năm 1998 đúng không? Hay cậu định triệu hồi các bô lão 60 tuổi về code? Stack này chỉ có giá để viết luận văn lịch sử IT.',
    }
  }

  if (backend === 'java' && frontend === 'angular') {
    return {
      rating: 4,
      review:
        'Đúng chuẩn Enterprise! Angular + Spring Boot. Mất 4 tuần cấu hình Boilerplate, 2 ngày để render dòng "Hello World". Chắc ngân sách phải chục tỷ thì sếp mới duyệt cho cái stack nặng nề như xe lu thế này.',
    }
  }

  if (backend === 'php') {
    return {
      rating: 5,
      review: `Laravel vĩ đại! Code thanh lịch, hệ sinh thái hoàn hảo, deploy phát ăn ngay. Cho dù Frontend dùng ${fName} và Database tải bằng ${dName}, chỉ cần core là Laravel/PHP thì dự án nắm chắc 99% thành công. Mấy đứa chạy theo trend làm sao hiểu được đỉnh cao của sự thực dụng này! Mãi yêu PHP! 10 điểm không có nhưng!`,
    }
  }

  if (frontend === 'vanilla' && backend === 'node') {
    return {
      rating: 3,
      review:
        'Vanilla JS? Cậu thích khổ dâm tự tay thao tác document.getElementById() cơ à? Thử handle state của 50 cái input xem ngón tay có gãy không. Lên production rồi lại ước gì mình dùng React cho đời thanh thản.',
    }
  }

  if (backend === 'go' || backend === 'rust') {
    if (frontend === 'react' || frontend === 'vue' || frontend === 'svelte') {
      return {
        rating: 4,
        review: `Dùng ${bName} thì tốc độ xé gió rồi, nhưng cái ${fName} kia có render kịp mấy chục ngàn request/s mà backend ném về không? Lại bài ca "Dao mổ trâu đi giết ruồi nhặng" à?`,
      }
    }
  }

  if (database === 'firebase' && frontend === 'vanilla') {
    return {
      rating: 2,
      review:
        'Thiệt luôn? Dùng Firebase để đỡ phải code Backend mà lại đi code Frontend bằng Vanilla JS? Cậu đang cân bằng giữa sự hiện đại và đồ cổ đấy à?',
    }
  }

  // Fallback random cực gắt
  const randomReviews = [
    `Cậu định ghép ${fName} với ${bName} á? Nó giống như ăn bún đậu mắm tôm nhưng rưới tương ớt Chinsu vậy. Nghe thôi đã thấy đau bụng và xúc phạm người nhìn.`,
    `Database là ${dName}... Thôi được, mong là cậu biết Index là cái gì, chứ cái trò SELECT * bừa bãi thì bố cái server ${bName} cũng không gánh nổi đâu.`,
    `Một sự cố chấp trong việc tỏ ra khác biệt! Cậu ghép ${fName} và ${dName} chỉ vì muốn CV trông ngầu hơn lúc đi phỏng vấn đúng không? Ai thèm quan tâm cơ chứ.`,
    `Nhìn đống này tôi chỉ muốn nhắm mắt nộp đơn từ chức. ${fName} kết nối với ${bName} kiểu gì? Mà thôi kệ đi, kiểu gì 3 tháng nữa chả đập đi viết lại toàn bộ.`,
    `App này làm ra để kiếm tiền hay để cúng tiền cho AWS? Nhét ${bName} và ${dName} vào một server, tôi cá là tiền Cloud hàng tháng tốn bằng 3 tháng lương cơ bản của cậu đấy.`,
    `Review ngắn ngọn: Đống rác. Nhưng rác này có tái chế được không thì để xem khả năng cậu maintain cái ${fName} tàn tạ tốn RAM kia thế nào. Chúc kiên nhẫn!`,
    `Ai xúi cậu dùng ${bName} vậy? Xem Tutorial trên Youtube năm 2018 rồi làm theo à? Tôi thà đi fix bug cho plugin Wordpress còn hơn đụng vào cái đống này.`,
    `Thôi bỏ đi! Cậu cứ dùng ${fName} với ${dName} đi, để rồi khi có bug thì cậu tự lên StackOverflow mà khóc. Chứ tôi là tôi không review cái mớ hổ lốn này đâu nhé.`,
  ]

  const hash = (frontend + backend + database).length % randomReviews.length

  return {
    rating: Math.floor(Math.random() * 3) + 2,
    review: randomReviews[hash]!,
  }
}
