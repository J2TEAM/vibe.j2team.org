import type { Particle, FloatingText } from '../types'

/** Spawn burst of particles at position */
export function spawnParticles(
    particles: Particle[],
    x: number, y: number,
    color: string,
    count: number,
    spread = 3,
): void {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * spread,
            vy: (Math.random() - 0.8) * spread,
            life: 30 + Math.random() * 20,
            maxLife: 50,
            color,
            size: 2 + Math.random() * 3,
        })
    }
}

/** Spawn floating damage/status text */
export function spawnFloatingText(
    floatingTexts: FloatingText[],
    x: number, y: number,
    text: string,
    color: string,
    size = 16,
): void {
    floatingTexts.push({ x, y, text, color, life: 60, vy: -1.5, size })
}

/** Update and prune particles */
export function updateParticles(particles: Particle[]): void {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]!
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--
        if (p.life <= 0) particles.splice(i, 1)
    }
}

/** Update and prune floating texts */
export function updateFloatingTexts(floatingTexts: FloatingText[]): void {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i]!
        ft.y += ft.vy; ft.life--
        if (ft.life <= 0) floatingTexts.splice(i, 1)
    }
}

/** Draw all particles */
export function drawParticles(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    cameraX: number,
): void {
    for (const p of particles) {
        const alpha = p.life / p.maxLife
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.fillRect(p.x - cameraX, p.y, p.size, p.size)
    }
    ctx.globalAlpha = 1
}

/** Draw all floating texts */
export function drawFloatingTexts(
    ctx: CanvasRenderingContext2D,
    floatingTexts: FloatingText[],
    cameraX: number,
): void {
    for (const ft of floatingTexts) {
        ctx.globalAlpha = Math.min(1, ft.life / 20)
        ctx.fillStyle = ft.color
        ctx.font = `bold ${ft.size}px monospace`
        ctx.textAlign = 'center'
        ctx.fillText(ft.text, ft.x - cameraX, ft.y)
    }
    ctx.globalAlpha = 1
    ctx.textAlign = 'left'
}
