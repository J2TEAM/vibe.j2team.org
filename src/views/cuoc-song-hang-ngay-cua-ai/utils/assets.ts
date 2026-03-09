import chatgptBody from '../aiAgent/chatgpt/chatgpt.png'
import chatgptHair from '../aiAgent/chatgpt/chatpgt-hair.png'
import chatgptOutfit from '../aiAgent/chatgpt/chatgpt-outfit.png'
import claudeBody from '../aiAgent/claude/claude.png'
import claudeHair from '../aiAgent/claude/claude-hair.png'
import claudeOutfit from '../aiAgent/claude/claude-outfit.png'
import copilotBody from '../aiAgent/copilot/copilot.png'
import copilotHair from '../aiAgent/copilot/copilot-hair.png'
import copilotOutfit from '../aiAgent/copilot/copilot-outfit.png'
import deepseekBody from '../aiAgent/deepseek/deepseek.png'
import deepseekHair from '../aiAgent/deepseek/deepseek-hair.png'
import deepseekOutfit from '../aiAgent/deepseek/deepseek-outfit.png'
import geminiBody from '../aiAgent/gemini/gemini.png'
import geminiHair from '../aiAgent/gemini/gemini-hair.png'
import geminiOutfit from '../aiAgent/gemini/gemini-outfit.png'
import grokBody from '../aiAgent/grok/grok.png'
import grokHair from '../aiAgent/grok/grok-hair.png'
import grokOutfit from '../aiAgent/grok/grok-outfit.png'
import houseUrl from '../map/housemap.png'
import wallUrl from '../map/wall.png'
import sunUrl from '../map/sun.png'
import moonUrl from '../map/moon.png'
import type { AgentAsset } from '../types'

const loadImg = (url: string) => {
  const img = new Image()
  img.src = url
  return img
}

export const houseImg = loadImg(houseUrl)
export const wallImg = loadImg(wallUrl)
export const sunImg = loadImg(sunUrl)
export const moonImg = loadImg(moonUrl)

export const agentAssets: Record<string, AgentAsset> = {
  gpt: { body: loadImg(chatgptBody), hair: loadImg(chatgptHair), outfit: loadImg(chatgptOutfit) },
  claude: { body: loadImg(claudeBody), hair: loadImg(claudeHair), outfit: loadImg(claudeOutfit) },
  copilot: {
    body: loadImg(copilotBody),
    hair: loadImg(copilotHair),
    outfit: loadImg(copilotOutfit),
  },
  deep: {
    body: loadImg(deepseekBody),
    hair: loadImg(deepseekHair),
    outfit: loadImg(deepseekOutfit),
  },
  gemini: { body: loadImg(geminiBody), hair: loadImg(geminiHair), outfit: loadImg(geminiOutfit) },
  grok: { body: loadImg(grokBody), hair: loadImg(grokHair), outfit: loadImg(grokOutfit) },
}
