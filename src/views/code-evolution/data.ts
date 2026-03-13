export interface Language {
  id: string
  name: string
  year: number
  icon: string
  color: string
  parents: string[]
}

export const LANGUAGES: Record<string, Language | undefined> = {
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
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    year: 2012,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
    color: '#3178c6',
    parents: ['javascript', 'logic'],
  },
  php: {
    id: 'php',
    name: 'PHP',
    year: 1995,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
    color: '#777bb4',
    parents: ['c', 'internet'],
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
    parents: ['cpp', 'logic'],
  },
  swift: {
    id: 'swift',
    name: 'Swift',
    year: 2014,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg',
    color: '#f05138',
    parents: ['cpp'],
  },
}

export const RECIPES: Record<string, string> = {
  'binary+logic': 'assembly',
  'logic+math': 'fortran',
  'fortran+math': 'algol',
  'algol+assembly': 'c',
  'c+logic': 'cpp',
  'c+math': 'python',
  'c+internet': 'javascript',
  'cpp+logic': 'rust',
  'c+python': 'go',
  'javascript+logic': 'typescript',
  'internet+php': 'javascript', // Fixed: Duplicate keys removed
  'c+java': 'php',
}
