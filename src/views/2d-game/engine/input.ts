// No unused imports

export interface InputState {
    keys: Record<string, boolean>
    keyJustPressed: Record<string, boolean>
    mousePos: { x: number; y: number }
}

export function createInputState(): InputState {
    return {
        keys: {},
        keyJustPressed: {},
        mousePos: { x: -1, y: -1 },
    }
}

/** Convert mouse event to game coordinates */
export function toGameCoords(
    e: MouseEvent,
    canvas: HTMLCanvasElement,
    gameW: number,
    gameH: number,
): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect()
    return {
        x: (e.clientX - rect.left) * (gameW / rect.width),
        y: (e.clientY - rect.top) * (gameH / rect.height),
    }
}

/** Check if a point is inside a rectangle */
export function pointInRect(
    px: number, py: number,
    rx: number, ry: number, rw: number, rh: number,
): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh
}
