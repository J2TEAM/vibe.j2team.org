export interface Language {
  id: string
  name: string
  year: number
  icon: string
  color: string
  parents: string[]
}

export const LANGUAGES: Record<string, Language | undefined> = {
  // 1-4. GỐC (4)
  binary: { id: 'binary', name: 'Binary', year: 1940, icon: '01', color: '#94a3b8', parents: [] },
  logic: {
    id: 'logic',
    name: 'Logic Gates',
    year: 1940,
    icon: 'AND',
    color: '#f43f5e',
    parents: [],
  },
  math: { id: 'math', name: 'Mathematics', year: 1600, icon: 'Σ', color: '#10b981', parents: [] },
  internet: {
    id: 'internet',
    name: 'Internet',
    year: 1983,
    icon: 'WWW',
    color: '#3b82f6',
    parents: [],
  },

  // 5-7. TIỀN THÂN (3)
  assembly: {
    id: 'assembly',
    name: 'Assembly',
    year: 1947,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/wasm/wasm-original.svg',
    color: '#fbbf24',
    parents: ['binary', 'logic'],
  },
  fortran: {
    id: 'fortran',
    name: 'Fortran',
    year: 1957,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fortran/fortran-original.svg',
    color: '#3b82f6',
    parents: ['math', 'logic'],
  },
  algol: {
    id: 'algol',
    name: 'ALGOL',
    year: 1958,
    icon: 'ALG',
    color: '#10b981',
    parents: ['fortran'],
  },

  // 8-13. KINH ĐIỂN (6)
  c: {
    id: 'c',
    name: 'C Language',
    year: 1972,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg',
    color: '#0284c7',
    parents: ['algol', 'assembly'],
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    year: 1985,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
    color: '#00599c',
    parents: ['c', 'logic'],
  },
  python: {
    id: 'python',
    name: 'Python',
    year: 1991,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    color: '#ffd343',
    parents: ['c', 'math'],
  },
  java: {
    id: 'java',
    name: 'Java',
    year: 1995,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
    color: '#e76f00',
    parents: ['cpp'],
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    year: 1995,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
    color: '#f7df1e',
    parents: ['c', 'internet'],
  },
  php: {
    id: 'php',
    name: 'PHP',
    year: 1995,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
    color: '#777bb4',
    parents: ['c', 'internet'],
  },

  // 14-20. HIỆN ĐẠI & BỔ SUNG (7)
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    year: 2012,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
    color: '#3178c6',
    parents: ['javascript', 'logic'],
  },
  go: {
    id: 'go',
    name: 'Go',
    year: 2009,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg',
    color: '#00ADD8',
    parents: ['c', 'python'],
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    year: 2010,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg',
    color: '#DEA584',
    parents: ['cpp', 'math'],
  },
  swift: {
    id: 'swift',
    name: 'Swift',
    year: 2014,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg',
    color: '#f05138',
    parents: ['cpp', 'csharp'],
  },
  kotlin: {
    id: 'kotlin',
    name: 'Kotlin',
    year: 2011,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg',
    color: '#7F52FF',
    parents: ['java', 'typescript'],
  },
  csharp: {
    id: 'csharp',
    name: 'C#',
    year: 2000,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
    color: '#239120',
    parents: ['c', 'java'],
  },
  mojo: {
    id: 'mojo',
    name: 'Mojo',
    year: 2023,
    icon: '🔥',
    color: '#ff4b4b',
    parents: ['cpp', 'python'],
  },
}
//20 công thức ghép ngôn ngữ lập trình
export const RECIPES: Record<string, string> = {
  'binary+logic': 'assembly',
  'logic+math': 'fortran',
  'fortran+math': 'algol',
  'algol+assembly': 'c',
  'c+logic': 'cpp',
  'c+math': 'python',
  'c+internet': 'php',
  'cpp+logic': 'java',
  'internet+php': 'javascript',
  'javascript+logic': 'typescript',
  'java+typescript': 'kotlin',
  'c+python': 'go',
  'cpp+python': 'mojo',
  'cpp+math': 'rust',
  'c+java': 'csharp',
  'cpp+csharp': 'swift',
}
