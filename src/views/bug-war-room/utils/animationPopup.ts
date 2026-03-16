import type { AnimationCatalogItem } from './animationCatalog'
import { getAnimationCatalogHtml } from './popupTemplates'

interface AnimationCatalogPopupOptions {
  targetTab?: Window
  popupSourceWindow: Window
  items: AnimationCatalogItem[]
  onBlocked: () => void
  onInitError: () => void
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function hydrateAnimationCatalogPopup(options: AnimationCatalogPopupOptions): void {
  const { targetTab, popupSourceWindow, items, onBlocked, onInitError } = options

  const animationTab = targetTab ?? popupSourceWindow.open('', '_blank')
  if (!animationTab) {
    onBlocked()
    return
  }

  const cardsHtml = items
    .map((item) => {
      const operatorHintHtml = item.operatorHint
        ? `<p class="hint"><strong>Operator note:</strong> ${escapeHtml(item.operatorHint)}</p>`
        : ''
      return `<article class="card">
      <img src="${escapeHtml(item.asset)}" alt="${escapeHtml(item.title)}" loading="lazy" />
      <div class="body">
        <p class="kicker">${escapeHtml(item.fileName)}</p>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
        <p class="trigger"><strong>Điều kiện hiển thị:</strong> ${escapeHtml(item.triggerCondition)}</p>
        ${operatorHintHtml}
      </div>
    </article>`
    })
    .join('')

  const html = getAnimationCatalogHtml(cardsHtml)

  try {
    animationTab.document.open()
    animationTab.document.write(html)
    animationTab.document.close()

    const closeBtn = animationTab.document.getElementById(
      'animation-catalog-close',
    ) as HTMLButtonElement | null
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        animationTab.close()
      })
    }
  } catch {
    if (!targetTab) {
      animationTab.close()
      onInitError()
    }
  }
}
