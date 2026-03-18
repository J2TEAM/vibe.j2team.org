import type { Level, GitState } from '../types'

const initialLevel1: GitState = {
  commits: [
    { hash: 'c1', message: 'Initial commit', parentHashes: [], x: 100, y: 150 },
    { hash: 'c2', message: 'Main commit', parentHashes: ['c1'], x: 200, y: 100 },
    { hash: 'c3', message: 'Feature commit', parentHashes: ['c1'], x: 200, y: 200 },
  ],
  branches: [
    { name: 'main', commitHash: 'c2' },
    { name: 'feature', commitHash: 'c3' },
  ],
  head: 'main',
}

const initialLevel2: GitState = {
  commits: [
    { hash: 'c1', message: 'Initial', parentHashes: [], x: 80, y: 150 },
    { hash: 'c2', message: 'Main 1', parentHashes: ['c1'], x: 180, y: 100 },
    { hash: 'c3', message: 'Main 2', parentHashes: ['c2'], x: 280, y: 100 },
    { hash: 'c4', message: 'Bugfix 1', parentHashes: ['c1'], x: 180, y: 200 },
  ],
  branches: [
    { name: 'main', commitHash: 'c3' },
    { name: 'bugfix', commitHash: 'c4' },
  ],
  head: 'main',
}

const initialLevel3: GitState = {
  commits: [
    { hash: 'c1', message: 'Initial', parentHashes: [], x: 80, y: 150 },
    { hash: 'c2', message: 'Main 1', parentHashes: ['c1'], x: 180, y: 100 },
    { hash: 'c3', message: 'Feature Side 1', parentHashes: ['c1'], x: 180, y: 300 },
    { hash: 'c4', message: 'Crucial Fix', parentHashes: ['c3'], x: 280, y: 300 },
  ],
  branches: [
    { name: 'main', commitHash: 'c2' },
    { name: 'feature', commitHash: 'c4' },
  ],
  head: 'main',
}

const initialLevel4: GitState = {
  commits: [
    { hash: 'c1', message: 'Initial', parentHashes: [], x: 80, y: 150 },
    { hash: 'c2', message: 'Main 1', parentHashes: ['c1'], x: 180, y: 100 },
    { hash: 'c3', message: 'Feature 1', parentHashes: ['c1'], x: 180, y: 200 },
    { hash: 'c4', message: 'Feature 2', parentHashes: ['c3'], x: 280, y: 200 },
    { hash: 'c5', message: 'Sub-feature 1', parentHashes: ['c4'], x: 380, y: 300 },
  ],
  branches: [
    { name: 'main', commitHash: 'c2' },
    { name: 'feature', commitHash: 'c4' },
    { name: 'sub-feature', commitHash: 'c5' },
  ],
  head: 'main',
}

const initialLevel5: GitState = {
  commits: [
    { hash: 'c1', message: 'Initial', parentHashes: [], x: 80, y: 150 },
    { hash: 'c2', message: 'Main 1', parentHashes: ['c1'], x: 180, y: 100 },
    { hash: 'c3', message: 'Main 2', parentHashes: ['c2'], x: 280, y: 100 },
    { hash: 'c4', message: 'Experimental', parentHashes: ['c3'], x: 380, y: 300 },
    { hash: 'c5', message: 'Experimental 2', parentHashes: ['c4'], x: 480, y: 300 },
  ],
  branches: [
    { name: 'main', commitHash: 'c3' },
    { name: 'experimental', commitHash: 'c5' },
  ],
  head: 'experimental',
}

export const LEVELS: Level[] = [
  {
    id: 1,
    title: 'Cơ bản về Rebase',
    description: 'Đưa nhánh feature lên trên đầu của main.',
    goalDescription: 'Gõ "git checkout feature" sau đó "git rebase main".',
    initialState: initialLevel1,
    checkWin: (state) => {
      const featureBranch = state.branches.find((b) => b.name === 'feature')
      const mainBranch = state.branches.find((b) => b.name === 'main')
      if (!featureBranch || !mainBranch) return false
      const featureCommit = state.commits.find((c) => c.hash === featureBranch.commitHash)
      return featureCommit?.parentHashes.includes(mainBranch.commitHash) || false
    },
  },
  {
    id: 2,
    title: 'Dọn dẹp lịch sử',
    description: 'Nhánh bugfix đang dựa trên một commit cũ. Hãy đưa nó lên đầu main.',
    goalDescription: 'Di chuyển bugfix lên trên main bằng rebase.',
    initialState: initialLevel2,
    checkWin: (state) => {
      const bugfixBranch = state.branches.find((b) => b.name === 'bugfix')
      const mainBranch = state.branches.find((b) => b.name === 'main')
      if (!bugfixBranch || !mainBranch) return false
      const bugfixCommit = state.commits.find((c) => c.hash === bugfixBranch.commitHash)
      return bugfixCommit?.parentHashes.includes(mainBranch.commitHash) || false
    },
  },
  {
    id: 3,
    title: 'Cherry-pick Ma Thuật',
    description:
      'Chúng ta chỉ cần một commit "Crucial Fix" c4 vào nhánh main, không cần cả nhánh feature.',
    goalDescription: 'Gõ "git checkout main" rồi "git cherry-pick c4".',
    initialState: initialLevel3,
    checkWin: (state) => {
      const mainBranch = state.branches.find((b) => b.name === 'main')
      if (!mainBranch) return false
      const headCommit = state.commits.find((c) => c.hash === mainBranch.commitHash)
      return !!(
        headCommit?.message.includes('Crucial Fix') && headCommit?.parentHashes.includes('c2')
      )
    },
  },
  {
    id: 4,
    title: 'Rebase Hệ Mặt Trời',
    description:
      'Nhánh "sub-feature" đang dựa trên "feature", mà "feature" lại dựa trên một commit cũ. Hãy đưa tất cả lên main.',
    goalDescription: 'Rebase "feature" lên "main", sau đó rebase "sub-feature" lên "feature".',
    initialState: initialLevel4,
    checkWin: (state) => {
      const subFeatureBranch = state.branches.find((b) => b.name === 'sub-feature')
      const featureBranch = state.branches.find((b) => b.name === 'feature')
      const mainBranch = state.branches.find((b) => b.name === 'main')
      if (!subFeatureBranch || !featureBranch || !mainBranch) return false
      const subCommit = state.commits.find((c) => c.hash === subFeatureBranch.commitHash)
      const featCommit = state.commits.find((c) => c.hash === featureBranch.commitHash)
      return !!(
        subCommit?.parentHashes.includes(featureBranch.commitHash) &&
        featCommit?.parentHashes.includes(mainBranch.commitHash)
      )
    },
  },
  {
    id: 5,
    title: 'Sát Thủ Reset',
    description:
      'Bạn lỡ tay commit bậy bạ vào nhánh experimental. Hãy quay lại commit c3 (main) và bắt đầu lại.',
    goalDescription: 'Gõ "git reset --hard main" hoặc "git reset --hard c3".',
    initialState: initialLevel5,
    checkWin: (state) => {
      const expBranch = state.branches.find((b) => b.name === 'experimental')
      return expBranch?.commitHash === 'c3' || false
    },
  },
  {
    id: 6,
    title: 'The Orphan Branch',
    description:
      'Có một commit c3 đang bị "mồ côi" (không có nhánh nào trỏ tới). Hãy tìm nó và tạo nhánh `recovery` tại đó.',
    goalDescription: 'Tạo nhánh `recovery` trỏ tới commit `c3`.',
    initialState: {
      commits: [
        { hash: 'c1', message: 'Initial', parentHashes: [], x: 80, y: 150 },
        { hash: 'c2', message: 'Main 1', parentHashes: ['c1'], x: 180, y: 100 },
        { hash: 'c3', message: 'Lost Data', parentHashes: ['c1'], x: 180, y: 250 },
      ],
      branches: [{ name: 'main', commitHash: 'c2' }],
      head: 'main',
    },
    checkWin: (state) => {
      const recoveryBranch = state.branches.find((b) => b.name === 'recovery')
      return recoveryBranch?.commitHash === 'c3'
    },
  },
  {
    id: 7,
    title: 'Merge Master',
    description: 'Sử dụng lệnh `git merge` để kết hợp nội dung từ nhánh `feature` vào `main`.',
    goalDescription: 'Merge nhánh `feature` vào `main`.',
    initialState: {
      commits: [
        { hash: 'c1', message: 'Initial', parentHashes: [], x: 80, y: 150 },
        { hash: 'c2', message: 'Main 1', parentHashes: ['c1'], x: 180, y: 100 },
        { hash: 'c3', message: 'Feature 1', parentHashes: ['c1'], x: 180, y: 200 },
      ],
      branches: [
        { name: 'main', commitHash: 'c2' },
        { name: 'feature', commitHash: 'c3' },
      ],
      head: 'main',
    },
    checkWin: (state) => {
      const mainBranch = state.branches.find((b) => b.name === 'main')
      if (!mainBranch) return false
      const headCommit = state.commits.find((c) => c.hash === mainBranch.commitHash)
      return !!(headCommit?.parentHashes.includes('c2') && headCommit?.parentHashes.includes('c3'))
    },
  },
  {
    id: 8,
    title: 'Selective Picking',
    description:
      'Bạn chỉ cần commit `c3` và `c5` từ nhánh `expensive-feature`. Hãy đưa chúng vào `main`.',
    goalDescription: 'Cherry-pick `c3` và `c5` vào `main`.',
    initialState: {
      commits: [
        { hash: 'c1', message: 'Initial', parentHashes: [], x: 80, y: 150 },
        { hash: 'c2', message: 'Main 1', parentHashes: ['c1'], x: 180, y: 100 },
        { hash: 'c3', message: 'Feature Part 1', parentHashes: ['c1'], x: 180, y: 250 },
        { hash: 'c4', message: 'Feature Part 2', parentHashes: ['c3'], x: 280, y: 250 },
        { hash: 'c5', message: 'Feature Part 3', parentHashes: ['c4'], x: 380, y: 250 },
      ],
      branches: [
        { name: 'main', commitHash: 'c2' },
        { name: 'expensive-feature', commitHash: 'c5' },
      ],
      head: 'main',
    },
    checkWin: (state) => {
      const mainBranch = state.branches.find((b) => b.name === 'main')
      if (!mainBranch) return false
      const commits = state.commits
      const head = commits.find((c) => c.hash === mainBranch.commitHash)
      const parent = head ? commits.find((p) => p.hash === head.parentHashes[0]) : null
      return !!(head?.message.includes('Part 3') && parent?.message.includes('Part 1'))
    },
  },
  {
    id: 9,
    title: 'Rebase onto Old Base',
    description:
      'Hãy di chuyển nhánh `feature` để nó bắt đầu từ commit `c2` của `main` thay vì `c1`.',
    goalDescription: 'Rebase `feature` lên `c2`.',
    initialState: {
      commits: [
        { hash: 'c1', message: 'Initial', parentHashes: [], x: 80, y: 150 },
        { hash: 'c2', message: 'Main 1', parentHashes: ['c1'], x: 180, y: 100 },
        { hash: 'c3', message: 'Main 2', parentHashes: ['c2'], x: 280, y: 100 },
        { hash: 'c4', message: 'Feature 1', parentHashes: ['c1'], x: 180, y: 200 },
      ],
      branches: [
        { name: 'main', commitHash: 'c3' },
        { name: 'feature', commitHash: 'c4' },
      ],
      head: 'feature',
    },
    checkWin: (state) => {
      const featureBranch = state.branches.find((b) => b.name === 'feature')
      if (!featureBranch) return false
      const head = state.commits.find((c) => c.hash === featureBranch.commitHash)
      return head?.parentHashes.includes('c2') || false
    },
  },
  {
    id: 10,
    title: 'The Ultimate Cleanup',
    description:
      'Repo đang rất lộn xộn. Hãy dọn dẹp sao cho `main` chứa những thay đổi quan trọng nhất (`c2`, `c4`, `c6`) theo một đường thẳng.',
    goalDescription: 'Sắp xếp `main` thành chuỗi: c1 -> c2 -> c4 -> c6.',
    initialState: {
      commits: [
        { hash: 'c1', message: 'Initial', parentHashes: [], x: 80, y: 150 },
        { hash: 'c2', message: 'Fix A', parentHashes: ['c1'], x: 180, y: 100 },
        { hash: 'c3', message: 'Ignore Me', parentHashes: ['c2'], x: 280, y: 100 },
        { hash: 'c4', message: 'Fix B', parentHashes: ['c1'], x: 180, y: 200 },
        { hash: 'c5', message: 'Bad Work', parentHashes: ['c4'], x: 280, y: 200 },
        { hash: 'c6', message: 'Fix C', parentHashes: ['c1'], x: 180, y: 300 },
      ],
      branches: [{ name: 'main', commitHash: 'c1' }],
      head: 'main',
    },
    checkWin: (state) => {
      const mainBranch = state.branches.find((b) => b.name === 'main')
      if (!mainBranch) return false
      const c6 = state.commits.find((c) => c.hash === mainBranch.commitHash)
      const c4 = c6 ? state.commits.find((c) => c.hash === c6.parentHashes[0]) : null
      const c2 = c4 ? state.commits.find((c) => c.hash === c4.parentHashes[0]) : null
      return !!(
        c6?.message.includes('Fix C') &&
        c4?.message.includes('Fix B') &&
        c2?.message.includes('Fix A')
      )
    },
  },
]
