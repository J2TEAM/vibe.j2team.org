import type { CodeSnippet } from '../types'

export const SNIPPETS: CodeSnippet[] = [
  // --- LEVEL 1-4: EASY (Beginner Dev) ---
  {
    id: 'double-check',
    title: 'LVL 1: The Double Check',
    language: 'javascript',
    timeLimit: 20,
    minBugsToPass: 1,
    code: `function isEligible(age) {
  if (age >= 18) {
    return true;
  } else {
    if (age < 18) {
      return false;
    }
  }
}`,
    bugs: [
      {
        id: 'redundant-1',
        line: 5,
        description: 'Logic dư thừa (Redundant check).',
        type: 'redundancy',
        explanation:
          'Khi đã ở trong nhánh else của (age >= 18), chắc chắn age < 18. Việc check lại là dư thừa. Có thể viết gọn thành: return age >= 18;',
        severity: 3,
      },
    ],
  },
  {
    id: 'magic-numbers',
    title: 'LVL 2: The Magic Pulse',
    language: 'javascript',
    timeLimit: 25,
    minBugsToPass: 1,
    code: `function calculateTotal(price) {
  return price + (price * 0.08) - 10;
}`,
    bugs: [
      {
        id: 'magic-1',
        line: 2,
        description: 'Sử dụng Magic Numbers.',
        type: 'redundancy',
        explanation:
          'Các số 0.08 và 10 không được giải thích. Nên đặt chúng vào hằng số như TAX_RATE và DISCOUNT_AMOUNT để dễ bảo trì.',
        severity: 4,
      },
    ],
  },
  {
    id: 'string-hell',
    title: 'LVL 3: The Concatenator',
    language: 'javascript',
    timeLimit: 25,
    minBugsToPass: 1,
    code: `function getUrl(id, cat) {
  return "https://api.com/v1/" + cat + "/item/" + id + "?debug=true";
}`,
    bugs: [
      {
        id: 'string-1',
        line: 2,
        description: 'Nối chuỗi kiểu cũ.',
        type: 'redundancy',
        explanation:
          'Nên sử dụng Template Literals (dấu backtick `) để code sạch sẽ và dễ đọc hơn thay vì dùng dấu cộng (+).',
        severity: 2,
      },
    ],
  },
  {
    id: 'deep-nesting',
    title: 'LVL 4: The Arrow of Doom',
    language: 'javascript',
    timeLimit: 30,
    minBugsToPass: 1,
    code: `function process(data) {
  if (data) {
    if (data.user) {
      if (data.user.isActive) {
        console.log("Processing...");
      }
    }
  }
}`,
    bugs: [
      {
        id: 'nest-1',
        line: 2,
        description: 'Lồng điều kiện quá sâu (Deep nesting).',
        type: 'logic',
        explanation:
          'Nên sử dụng Guard Clauses (return sớm) để giảm độ sâu của code. Code lồng quá sâu được gọi là "Pyramid of Doom".',
        severity: 5,
      },
    ],
  },

  // --- LEVEL 5-12: MEDIUM (Junior/Mid Dev) ---
  {
    id: 'shadow-name',
    title: 'LVL 5: The Shadowed One',
    language: 'javascript',
    timeLimit: 30,
    minBugsToPass: 1,
    code: `const name = "Global";
function printName(name) {
  console.log(name);
}
printName("Local");`,
    bugs: [
      {
        id: 'shadow-1',
        line: 2,
        description: 'Variable Shadowing (Ghi đè tên biến).',
        type: 'logic',
        explanation:
          'Tham số "name" trùng tên với biến global ở dòng 1. Điều này dễ gây nhầm lẫn về việc bạn đang thao tác trên biến nào.',
        severity: 4,
      },
    ],
  },
  {
    id: 'silent-fail',
    title: 'LVL 6: The Silent Scream',
    language: 'javascript',
    timeLimit: 30,
    minBugsToPass: 1,
    code: `try {
  const result = callApi();
  save(result);
} catch (e) {
  // Hope nothing goes wrong
}`,
    bugs: [
      {
        id: 'silent-1',
        line: 5,
        description: 'Nuốt lỗi (Silent catch).',
        type: 'logic',
        explanation:
          'Việc để trống block catch cực kỳ nguy hiểm. Khi có lỗi xảy ra, hệ thống sẽ im lặng thất bại mà bạn không hề hay biết để debug.',
        severity: 8,
      },
    ],
  },
  {
    id: 'truthy-trap',
    title: 'LVL 7: The Truthy Trap',
    language: 'javascript',
    timeLimit: 35,
    minBugsToPass: 1,
    code: `function updateStock(count) {
  if (!count) {
    console.log("No items provided");
    return;
  }
  process(count);
}`,
    bugs: [
      {
        id: 'truthy-1',
        line: 2,
        description: 'Check falsy không chính xác.',
        type: 'logic',
        explanation:
          'Nếu truyền count = 0, hàm sẽ báo "No items" vì 0 là falsy. Nên check cụ thể: count === undefined || count === null.',
        severity: 6,
      },
    ],
  },
  {
    id: 'reinvent-wheel',
    title: 'LVL 8: The Manual Labor',
    language: 'javascript',
    timeLimit: 40,
    minBugsToPass: 1,
    code: `function getAdmins(users) {
  let admins = [];
  for (let i = 0; i < users.length; i++) {
    if (users[i].role === 'admin') {
      admins.push(users[i]);
    }
  }
  return admins;
}`,
    bugs: [
      {
        id: 'wheel-1',
        line: 3,
        description: 'Re-inventing the wheel.',
        type: 'redundancy',
        explanation:
          'JavaScript đã có hàm .filter() cực kỳ mạnh mẽ. Việc dùng vòng lặp for thủ công làm code dài dòng và khó đọc hơn.',
        severity: 3,
      },
    ],
  },
  {
    id: 'callback-hell',
    title: 'LVL 9: The Callback Abyss',
    language: 'javascript',
    timeLimit: 45,
    minBugsToPass: 1,
    code: `fetchUser(id, (u) => {
  fetchPosts(u.id, (p) => {
    p.forEach(post => {
      formatPost(post, (res) => {
         console.log(res);
      });
    });
  });
});`,
    bugs: [
      {
        id: 'hell-1',
        line: 1,
        description: 'Callback Hell.',
        type: 'logic',
        explanation:
          'Quá nhiều callback lồng nhau. Nên sử dụng Async/Await để code trông phẳng và dễ theo dõi hơn.',
        severity: 7,
      },
    ],
  },
  {
    id: 'static-ghost',
    title: 'LVL 10: The Static Ghost',
    language: 'javascript',
    timeLimit: 40,
    minBugsToPass: 1,
    code: `let state = { count: 0 };
function inc() {
  state.count++;
}
// Any file can mutate this state!`,
    bugs: [
      {
        id: 'ghost-1',
        line: 1,
        description: 'Biến toàn cục có thể thay đổi (Mutable Global).',
        type: 'logic',
        explanation:
          'Quản lý state theo cách này sẽ làm ứng dụng không thể đoán trước được (unpredictable) khi quy mô lớn dần.',
        severity: 8,
      },
    ],
  },
  {
    id: 'memory-leak',
    title: 'LVL 11: The Infinite Growth',
    language: 'javascript',
    timeLimit: 45,
    minBugsToPass: 1,
    code: `var cache = [];
setInterval(() => {
  cache.push(new Array(1000).fill("💀"));
}, 100);`,
    bugs: [
      {
        id: 'leak-1',
        line: 3,
        description: 'Cạn kiệt bộ nhớ (Memory Leak).',
        type: 'memory',
        explanation:
          'Mảng global "cache" lớn dần theo thời gian mà không bao giờ được dọn dẹp, cuối cùng sẽ làm crash trình duyệt.',
        severity: 9,
      },
    ],
  },
  {
    id: 'bad-loop',
    title: 'LVL 12: The Zombie Loop',
    language: 'javascript',
    timeLimit: 30,
    minBugsToPass: 1,
    code: `for (let i = 0; i < 10; i--) {
  console.log("Iteration: " + i);
}`,
    bugs: [
      {
        id: 'loop-1',
        line: 1,
        description: 'Lặp vô tận (Infinite Loop).',
        type: 'logic',
        explanation:
          'Điều kiện i-- trong khi check i < 10 sẽ khiến vòng lặp không bao giờ kết thúc, làm treo hoàn toàn thread xử lý.',
        severity: 10,
      },
    ],
  },

  // --- LEVEL 13-20: HARD (Senior/Lead Dev) ---
  {
    id: 'zombie-event',
    title: 'LVL 13: The Zombie Event',
    language: 'javascript',
    timeLimit: 45,
    minBugsToPass: 1,
    code: `class Modal {
  init() {
    window.addEventListener('resize', () => {
       this.reposition();
    });
  }
}`,
    bugs: [
      {
        id: 'zombie-1',
        line: 3,
        description: 'Thiếu cleanup cho Event Listener.',
        type: 'memory',
        explanation:
          'Nếu component/class bị hủy nhưng listener vẫn còn gắn vào window, nó sẽ gây ra Memory Leak trầm trọng.',
        severity: 8,
      },
    ],
  },
  {
    id: 'swallower',
    title: 'LVL 14: The Promise Swallower',
    language: 'javascript',
    timeLimit: 50,
    minBugsToPass: 1,
    code: `getUser().then(user => {
  updateLog(user);
  return "Done";
});`,
    bugs: [
      {
        id: 'swallow-1',
        line: 2,
        description: 'Không return Promise trong chain.',
        type: 'logic',
        explanation:
          'Hàm updateLog có thể là async. Nếu không return nó, chain tiếp theo sẽ chạy trước khi log được cập nhật xong.',
        severity: 7,
      },
    ],
  },
  {
    id: 'floating-point',
    title: 'LVL 15: The Floating Trap',
    language: 'javascript',
    timeLimit: 30,
    minBugsToPass: 1,
    code: `if (0.1 + 0.2 === 0.3) {
  console.log("Correct!");
}`,
    bugs: [
      {
        id: 'float-1',
        line: 1,
        description: 'So sánh số thực không chính xác.',
        type: 'logic',
        explanation:
          'Trong hệ nhị phân, 0.1 + 0.2 thực tế là 0.30000000000000004. So sánh trực tiếp thế này sẽ luôn trả về false.',
        severity: 6,
      },
    ],
  },
  {
    id: 'coercion',
    title: 'LVL 16: The Coercion Nightmare',
    language: 'javascript',
    timeLimit: 40,
    minBugsToPass: 1,
    code: `const val = [10] == 10;
if (val) {
  process(val + "1");
}`,
    bugs: [
      {
        id: 'coercion-1',
        line: 1,
        description: 'Implicit Type Coercion.',
        type: 'logic',
        explanation:
          'Dựa dẫm vào việc JS tự ép kiểu để so sánh [10] == 10 là mầm mống của những bug cực kỳ quái dị và khó tìm.',
        severity: 7,
      },
    ],
  },
  {
    id: 'recursive-boom',
    title: 'LVL 17: The Recursive Boom',
    language: 'javascript',
    timeLimit: 35,
    minBugsToPass: 1,
    code: `function factor(n) {
  return n * factor(n - 1);
}`,
    bugs: [
      {
        id: 'boom-1',
        line: 1,
        description: 'Đệ quy thiếu Base Case.',
        type: 'logic',
        explanation:
          'Hàm gọi chính nó mà không có điểm dừng sẽ gây ra lỗi "Maximum call stack size exceeded" ngay lập tức.',
        severity: 10,
      },
    ],
  },
  {
    id: 'closure-trap',
    title: 'LVL 18: The Closure Loop',
    language: 'javascript',
    timeLimit: 50,
    minBugsToPass: 1,
    code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}`,
    bugs: [
      {
        id: 'closure-1',
        line: 1,
        description: 'Sử dụng var trong loop có async.',
        type: 'logic',
        explanation:
          'Vì var có function scope, cả 3 lần setTimeout đều sẽ in ra số 3. Nên sử dụng "let" để mỗi vòng lặp có scope riêng biệt.',
        severity: 9,
      },
    ],
  },
  {
    id: 'executioner',
    title: 'LVL 19: The Executioner',
    language: 'javascript',
    timeLimit: 45,
    minBugsToPass: 1,
    code: `function run(cmd) {
  eval(cmd);
}`,
    bugs: [
      {
        id: 'exec-1',
        line: 2,
        description: 'Sử dụng eval() cực kỳ nguy hiểm.',
        type: 'security',
        explanation:
          'Kẻ tấn công có thể thực thi bất kỳ mã nào từ phía client. Đây là lỗ hổng Remote Code Execution (RCE) cơ bản nhất.',
        severity: 10,
      },
    ],
  },
  {
    id: 'god-object',
    title: 'LVL 20: The God Fragment',
    language: 'javascript',
    timeLimit: 60,
    minBugsToPass: 1,
    code: `class App {
  sendEmail() {}
  saveDB() {}
  renderUI() {}
  parseData() {}
  validateInput() {}
}`,
    bugs: [
      {
        id: 'god-1',
        line: 1,
        description: 'God Object (Vi phạm Single Responsibility).',
        type: 'logic',
        explanation:
          'Một class làm quá nhiều việc (gửi mail, lưu DB, render...). Nên tách thành các service riêng biệt để dễ bảo trì và test.',
        severity: 8,
      },
    ],
  },
]
