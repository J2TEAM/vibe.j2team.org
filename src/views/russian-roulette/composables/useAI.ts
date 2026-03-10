/**
 * AI thông minh cho game Russian Roulette (Buckshot Roulette)
 *
 * Chiến thuật chính:
 * - Tính xác suất đạn thật / đạn rỗng còn lại trong ổ đạn
 * - Quyết định bắn bản thân (để giữ lượt nếu đạn rỗng) hay bắn đối thủ
 * - Xem xét HP của cả hai bên để đưa ra quyết định tối ưu
 * - Thêm yếu tố "tính cách" để AI không quá hoàn hảo, tạo cảm giác tự nhiên
 */

// Mức độ khó: điều chỉnh xác suất AI chọn nước đi tối ưu
export type AIDifficulty = 'easy' | 'normal' | 'hard'

interface AIDecisionContext {
  // Các viên đạn còn lại trong ổ (true = đạn thật, false = đạn rỗng)
  cylinder: boolean[]
  // Số đạn thật đã biết lúc nạp đạn
  liveAtReload: number
  // Số đạn rỗng đã biết lúc nạp đạn
  blankAtReload: number
  // HP hiện tại của AI
  aiHp: number
  // HP hiện tại của người chơi
  playerHp: number
}

interface AIDecisionResult {
  // AI bắn ai: 'player' = bắn người chơi, 'ai' = bắn bản thân
  target: 'player' | 'ai'
  // Lý do quyết định (để hiển thị hoặc debug)
  reason: string
}

/**
 * Tính xác suất đạn thật của viên đạn tiếp theo
 * (Viên đạn tiếp theo là viên cuối cùng trong mảng cylinder vì dùng pop())
 */
function calculateLiveProbability(cylinder: boolean[]): number {
  if (cylinder.length === 0) return 0

  const totalLive = cylinder.filter((b) => b === true).length
  return totalLive / cylinder.length
}

/**
 * Logic quyết định của AI thông minh
 *
 * Quy tắc ưu tiên:
 * 1. Nếu chỉ còn 1 viên đạn và biết chắc nó là gì → hành động chắc chắn
 * 2. Nếu xác suất rỗng >= 75% → bắn bản thân (cao khả năng giữ lượt)
 * 3. Nếu xác suất thật >= 60% → bắn đối thủ (cao khả năng gây sát thương)
 * 4. Nếu player chỉ còn 1 HP và xác suất thật >= 40% → bắn đối thủ (cơ hội kết liễu)
 * 5. Nếu AI chỉ còn 1 HP → thận trọng, ưu tiên bắn đối thủ trừ khi rất chắc đạn rỗng
 * 6. Trường hợp ngang nhau → bắn đối thủ (an toàn hơn)
 */
function makeSmartDecision(ctx: AIDecisionContext): AIDecisionResult {
  const { cylinder, aiHp, playerHp } = ctx
  const liveProbability = calculateLiveProbability(cylinder)
  const blankProbability = 1 - liveProbability
  const remainingShells = cylinder.length
  const liveCount = cylinder.filter((b) => b === true).length
  const blankCount = cylinder.filter((b) => b === false).length

  // --- Trường hợp đặc biệt: chỉ còn 1 viên đạn ---
  if (remainingShells === 1) {
    if (liveProbability === 1) {
      // Chắc chắn đạn thật → bắn đối thủ
      return { target: 'player', reason: 'Viên cuối cùng là đạn thật, bắn đối thủ!' }
    } else {
      // Chắc chắn đạn rỗng → bắn bản thân để giữ lượt
      return { target: 'ai', reason: 'Viên cuối cùng là đạn rỗng, bắn bản thân giữ lượt.' }
    }
  }

  // --- Trường hợp: toàn đạn thật ---
  if (blankCount === 0) {
    return { target: 'player', reason: 'Toàn đạn thật, bắn đối thủ ngay!' }
  }

  // --- Trường hợp: toàn đạn rỗng ---
  if (liveCount === 0) {
    return { target: 'ai', reason: 'Toàn đạn rỗng, bắn bản thân giữ lượt liên tục.' }
  }

  // --- AI chỉ còn 1 HP: cực kỳ thận trọng ---
  if (aiHp === 1) {
    if (blankProbability >= 0.8) {
      // 80%+ đạn rỗng, liều bắn bản thân
      return {
        target: 'ai',
        reason: `HP còn 1 nhưng ${Math.round(blankProbability * 100)}% đạn rỗng, liều giữ lượt.`,
      }
    }
    // Nếu player cũng 1 HP, bắn đối thủ cầu may
    if (playerHp === 1 && liveProbability >= 0.3) {
      return {
        target: 'player',
        reason: 'Cả hai đều 1 HP, bắn đối thủ cầu may kết liễu!',
      }
    }
    // Còn lại: bắn đối thủ an toàn hơn (không rủi ro tự chết)
    return {
      target: 'player',
      reason: `HP còn 1, không dám liều. Bắn đối thủ.`,
    }
  }

  // --- Đối thủ chỉ còn 1 HP: cơ hội kết liễu ---
  if (playerHp === 1 && liveProbability >= 0.4) {
    return {
      target: 'player',
      reason: `Đối thủ còn 1 HP, ${Math.round(liveProbability * 100)}% đạn thật, cố kết liễu!`,
    }
  }

  // --- Xác suất đạn rỗng rất cao → bắn bản thân giữ lượt ---
  if (blankProbability >= 0.7) {
    return {
      target: 'ai',
      reason: `${Math.round(blankProbability * 100)}% đạn rỗng, bắn bản thân giữ lượt.`,
    }
  }

  // --- Xác suất đạn thật cao → bắn đối thủ ---
  if (liveProbability >= 0.6) {
    return {
      target: 'player',
      reason: `${Math.round(liveProbability * 100)}% đạn thật, bắn đối thủ gây sát thương.`,
    }
  }

  // --- Trường hợp ngang nhau (50/50 hoặc gần đó) ---
  // Chiến thuật: nếu AI có nhiều HP hơn → có thể liều bắn bản thân
  if (aiHp > playerHp && blankProbability >= 0.45) {
    return {
      target: 'ai',
      reason: `HP dư dả (${aiHp} vs ${playerHp}), liều bắn bản thân giữ lượt.`,
    }
  }

  // Mặc định: bắn đối thủ (an toàn, không tự thiệt)
  return {
    target: 'player',
    reason: `Xác suất ngang nhau, bắn đối thủ cho an toàn.`,
  }
}

/**
 * Thêm yếu tố "không hoàn hảo" dựa trên độ khó
 * - Easy: 40% AI chọn random thay vì tối ưu
 * - Normal: 15% AI chọn random
 * - Hard: 0% AI luôn chọn tối ưu
 */
function applyDifficultyNoise(
  smartDecision: AIDecisionResult,
  difficulty: AIDifficulty,
): AIDecisionResult {
  const randomChance: Record<AIDifficulty, number> = {
    easy: 0.4,
    normal: 0.15,
    hard: 0,
  }

  if (Math.random() < randomChance[difficulty]) {
    // Chọn ngẫu nhiên thay vì tối ưu
    const randomTarget = Math.random() < 0.5 ? 'player' : ('ai' as const)
    return {
      target: randomTarget,
      reason: `(Ngẫu nhiên) ${randomTarget === 'player' ? 'Bắn đối thủ' : 'Bắn bản thân'}`,
    }
  }

  return smartDecision
}

/**
 * Hàm chính: AI quyết định bắn ai
 * Trả về target ('player' | 'ai') và lý do
 */
export function getAIDecision(
  ctx: AIDecisionContext,
  difficulty: AIDifficulty = 'normal',
): AIDecisionResult {
  const smartDecision = makeSmartDecision(ctx)
  return applyDifficultyNoise(smartDecision, difficulty)
}
