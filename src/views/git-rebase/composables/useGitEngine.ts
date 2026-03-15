import { ref, computed } from 'vue'
import type { GitState, CommandResult, CommitNode } from '../types'
import { LEVELS } from '../data/levels'

export function useGitEngine() {
  const currentLevelIndex = ref(0)
  const state = ref<GitState>(JSON.parse(JSON.stringify(LEVELS[0]!.initialState)))
  const history = ref<string[]>([])

  const currentLevel = computed(() => LEVELS[currentLevelIndex.value]!)

  const executeCommand = (cmd: string): CommandResult => {
    const parts = cmd.trim().split(/\s+/)
    if (parts[0] !== 'git') {
      return { success: false, message: 'Chỉnh bắt đầu bằng "git"' }
    }

    const action = parts[1]
    const args = parts.slice(2)

    switch (action) {
      case 'checkout':
        return handleCheckout(args[0] || '')
      case 'rebase':
        return handleRebase(args[0] || '')
      case 'commit':
        return handleCommit(args.slice(1).join(' '))
      case 'cherry-pick':
        return handleCherryPick(args[0] || '')
      case 'reset':
        return handleReset(args)
      case 'branch':
        return handleBranch(args[0] || '')
      case 'merge':
        return handleMerge(args[0] || '')
      default:
        return { success: false, message: `Lệnh "${action}" chưa được hỗ trợ.` }
    }
  }

  const handleCheckout = (target: string): CommandResult => {
    if (!target) return { success: false, message: 'Thiếu tham số (tên nhánh hoặc hash)' }

    const branch = state.value.branches.find((b) => b.name === target)
    const commit = state.value.commits.find((c) => c.hash === target)

    if (branch) {
      state.value.head = target
      history.value.push(`Switched to branch '${target}'`)
      return { success: true, message: `Đã chuyển sang nhánh ${target}` }
    } else if (commit) {
      state.value.head = target
      history.value.push(`Note: switching to '${target}'. You are in 'detached HEAD' state.`)
      return { success: true, message: `Đã chuyển sang commit ${target}` }
    }

    return { success: false, message: `Không tìm thấy ${target}` }
  }

  const handleRebase = (base: string): CommandResult => {
    if (!base) return { success: false, message: 'Thiếu tên nhánh base' }

    const baseBranch = state.value.branches.find((b) => b.name === base)
    if (!baseBranch) return { success: false, message: `Nhánh ${base} không tồn tại` }

    // Current branch to rebase
    const currentBranchName = state.value.head
    const currentBranch = state.value.branches.find((b) => b.name === currentBranchName)

    if (!currentBranch) {
      return { success: false, message: 'Bạn cần ở trên một nhánh để rebase' }
    }

    if (currentBranchName === base) {
      return { success: true, message: 'Already up to date.' }
    }

    // Simplified rebase: find commits on current branch not in base, and move them
    // For this game, we'll just move the current branch's head to be a child of base
    const currentCommit = state.value.commits.find((c) => c.hash === currentBranch.commitHash)
    if (currentCommit) {
      currentCommit.parentHashes = [baseBranch.commitHash]
      // Re-calculate positions (simple logic for now)
      updateNodePositions()
      history.value.push(`Successfully rebased and updated refs/heads/${currentBranchName}.`)
      return { success: true, message: `Đã rebase ${currentBranchName} lên ${base}` }
    }

    return { success: false, message: 'Lỗi không xác định khi rebase' }
  }

  const handleCherryPick = (hash: string): CommandResult => {
    if (!hash) return { success: false, message: 'Thiếu hash của commit' }

    const targetCommit = state.value.commits.find((c) => c.hash === hash)
    if (!targetCommit) return { success: false, message: `Commit ${hash} không tồn tại` }

    const currentHeadHash = getCurrentHeadHash()
    const newHash = 'c' + (state.value.commits.length + 1)

    const newCommit: CommitNode = {
      hash: newHash,
      message: `Cherry-pick: ${targetCommit.message}`,
      parentHashes: currentHeadHash ? [currentHeadHash] : [],
      x: 0, // Will be updated by layout
      y: 0,
    }

    state.value.commits.push(newCommit)

    // Update branch pointer
    const branch = state.value.branches.find((b) => b.name === state.value.head)
    if (branch) {
      branch.commitHash = newHash
    } else {
      state.value.head = newHash
    }

    updateNodePositions()
    return { success: true, message: `Đã cherry-pick ${hash} vào ${state.value.head}` }
  }

  const handleReset = (args: string[]): CommandResult => {
    // Basic support for git reset --hard <target>
    let target = args[0]
    if (target === '--hard') {
      target = args[1] || ''
    }

    if (!target) return { success: false, message: 'Thiếu mục tiêu reset' }

    const branch = state.value.branches.find((b) => b.name === target)
    const commit = state.value.commits.find((c) => c.hash === target)
    const targetHash = branch ? branch.commitHash : commit ? commit.hash : null

    if (!targetHash) return { success: false, message: `Không tìm thấy ${target}` }

    const currentBranch = state.value.branches.find((b) => b.name === state.value.head)
    if (currentBranch) {
      currentBranch.commitHash = targetHash
    } else {
      state.value.head = targetHash
    }

    updateNodePositions()
    return { success: true, message: `HEAD hiện đang ở ${targetHash}` }
  }

  const handleBranch = (name: string): CommandResult => {
    if (!name) return { success: false, message: 'Thiếu tên nhánh' }
    if (state.value.branches.find((b) => b.name === name)) {
      return { success: false, message: `Nhánh ${name} đã tồn tại` }
    }

    state.value.branches.push({
      name,
      commitHash: getCurrentHeadHash(),
    })

    return { success: true, message: `Đã tạo nhánh ${name}` }
  }

  const handleMerge = (target: string): CommandResult => {
    if (!target) return { success: false, message: 'Thiếu tên nhánh để merge' }

    const targetBranch = state.value.branches.find((b) => b.name === target)
    if (!targetBranch) return { success: false, message: `Không tìm thấy nhánh ${target}` }

    const currentHeadHash = getCurrentHeadHash()
    if (currentHeadHash === targetBranch.commitHash) {
      return { success: true, message: 'Already up to date.' }
    }

    const newHash = 'c' + (state.value.commits.length + 1)
    const newCommit: CommitNode = {
      hash: newHash,
      message: `Merge branch '${target}'`,
      parentHashes: [currentHeadHash, targetBranch.commitHash],
      x: 0,
      y: 0,
    }

    state.value.commits.push(newCommit)

    // Update branch pointer
    const branch = state.value.branches.find((b) => b.name === state.value.head)
    if (branch) {
      branch.commitHash = newHash
    } else {
      state.value.head = newHash
    }

    updateNodePositions()
    return { success: true, message: `Đã merge ${target} vào ${state.value.head}` }
  }

  const handleCommit = (message: string): CommandResult => {
    const newHash = 'c' + (state.value.commits.length + 1)
    const currentHeadHash = getCurrentHeadHash()

    // Position logic: just move to the right
    const parent = state.value.commits.find((c) => c.hash === currentHeadHash)
    const newX = (parent?.x || 0) + 100
    const newY = parent?.y || 150

    const newCommit: CommitNode = {
      hash: newHash,
      message: message || 'New commit',
      parentHashes: currentHeadHash ? [currentHeadHash] : [],
      x: newX,
      y: newY,
    }

    state.value.commits.push(newCommit)
    updateNodePositions()

    // Update branch pointer if HEAD is on a branch
    const branch = state.value.branches.find((b) => b.name === state.value.head)
    if (branch) {
      branch.commitHash = newHash
    } else {
      state.value.head = newHash
    }

    return { success: true, message: `[${state.value.head} ${newHash}] ${newCommit.message}` }
  }

  const getCurrentHeadHash = (): string => {
    const branch = state.value.branches.find((b) => b.name === state.value.head)
    return branch ? branch.commitHash : state.value.head
  }

  const updateNodePositions = () => {
    const commits = state.value.commits
    const findChildren = (parentHash: string | null) =>
      commits.filter((c) =>
        parentHash ? c.parentHashes.includes(parentHash) : c.parentHashes.length === 0,
      )

    const layout = (parentHash: string | null, startX: number, startY: number) => {
      const children = findChildren(parentHash)
      children.forEach((child, index) => {
        child.x = startX + 100
        // Spread children vertically
        const offset = (index - (children.length - 1) / 2) * 80
        child.y = startY + offset
        layout(child.hash, child.x, child.y)
      })
    }

    const roots = commits.filter((c) => c.parentHashes.length === 0)
    roots.forEach((root, idx) => {
      root.x = 100
      root.y = 150 + idx * 200
      layout(root.hash, root.x, root.y)
    })
  }

  const nextLevel = () => {
    if (currentLevelIndex.value < LEVELS.length - 1) {
      currentLevelIndex.value++
      resetLevel()
    }
  }

  const resetLevel = () => {
    state.value = JSON.parse(JSON.stringify(LEVELS[currentLevelIndex.value]!.initialState))
    history.value = []
    updateNodePositions()
  }

  const goToLevel = (index: number) => {
    if (index >= 0 && index < LEVELS.length) {
      currentLevelIndex.value = index
      resetLevel()
    }
  }

  const isWin = computed(() => currentLevel.value.checkWin(state.value))
  const hasNextLevel = computed(() => currentLevelIndex.value < LEVELS.length - 1)

  return {
    state,
    history,
    currentLevel,
    executeCommand,
    resetLevel,
    nextLevel,
    goToLevel,
    isWin,
    hasNextLevel,
    allLevels: LEVELS,
  }
}
