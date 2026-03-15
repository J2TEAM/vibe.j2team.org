import type { LeaderboardEntry } from '../types'

const STORAGE_KEY = 'ninja_quest_leaderboard'
const MAX_ENTRIES = 5

export function getLeaderboard(): LeaderboardEntry[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        if (!data) return []
        return JSON.parse(data) as LeaderboardEntry[]
    } catch {
        return []
    }
}

export function saveScore(entry: LeaderboardEntry): LeaderboardEntry[] {
    const board = getLeaderboard()
    board.push(entry)
    board.sort((a, b) => b.score - a.score)
    const trimmed = board.slice(0, MAX_ENTRIES)
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch { /* storage full */ }
    return trimmed
}

export function isHighScore(score: number): boolean {
    const board = getLeaderboard()
    if (board.length < MAX_ENTRIES) return true
    return score > (board[board.length - 1]?.score ?? 0)
}

export function drawLeaderboard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
    const board = getLeaderboard()
    if (board.length === 0) return

    ctx.fillStyle = 'rgba(15,15,35,0.85)'
    ctx.fillRect(x, y, w, 24 + board.length * 22)
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, w, 24 + board.length * 22)

    ctx.fillStyle = '#fbbf24'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('🏆 TOP SCORES', x + w / 2, y + 16)

    board.forEach((e, i) => {
        const ey = y + 32 + i * 22
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  '
        ctx.fillStyle = i === 0 ? '#fbbf24' : '#94a3b8'
        ctx.font = '11px monospace'
        ctx.textAlign = 'left'
        ctx.fillText(`${medal} ${e.name}`, x + 8, ey)
        ctx.textAlign = 'right'
        ctx.fillText(`${e.score} pts  Lv.${e.level}`, x + w - 8, ey)
    })
    ctx.textAlign = 'left'
}
