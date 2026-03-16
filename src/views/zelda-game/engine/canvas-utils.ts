/**
 * canvas-utils.ts
 * Shared canvas coordinate helpers used across overlay, menu, and touch renderers.
 */

/** Convert client pointer coords to canvas-space coords, accounting for CSS scaling. */
export function toCanvasCoords(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}
