<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useClipboard, useStorage } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'

const { copy: clipboardCopy } = useClipboard()
const mode = ref<'NORMAL' | 'INSERT' | 'VISUAL' | 'VISUAL_LINE'>('NORMAL')
const keyBuffer = ref('')
let keyBufferTimeout: ReturnType<typeof setTimeout> | null = null

const visualStart = ref(0)
const currentPos = ref(0)

const sampleText = `# Hướng Dẫn Vim Motions Cơ Bản

Chào mừng đến với Vim Editor nhẹ nhàng!

## Di chuyển cơ bản (Chế độ Normal/Visual)
- \`h\` : Sang trái
- \`j\` : Xuống dưới
- \`k\` : Lên trên
- \`l\` : Sang phải

## Di chuyển nâng cao
- \`w\` / \`b\` / \`e\` : Di chuyển theo từ
- \`0\` / \`$\` : Đầu/Cuối dòng
- \`{\` / \`}\` : Nhảy lên/xuống theo đoạn văn
- \`Ctrl + u\` : Cuộn nửa trang lên (Up)
- \`Ctrl + d\` : Cuộn nửa trang xuống (Down)
- \`gg\` / \`G\`: Đầu/Cuối file

## Chế độ Visual (Mới!)
- \`v\` : Vào chế độ Visual
- \`V\` : Vào chế độ Visual Line (chọn theo dòng)
- \`d\` / \`x\` : Xóa vùng chọn
- \`y\` : Sao chép vùng chọn (Copy)
- \`c\` : Xóa vùng chọn và vào Insert

## Chỉnh sửa (Normal Mode)
- \`i\` / \`a\` / \`I\` / \`A\`: Vào Insert Mode
- \`o\` / \`O\` : Thêm dòng mới
- \`x\` : Xóa ký tự tại con trỏ
- \`dd\`: Xóa dòng hiện tại
- \`D\` : Xóa từ con trỏ đến cuối dòng
- \`C\` : Xóa từ con trỏ đến cuối dòng và vào Insert
- \`yy\`: Sao chép dòng hiện tại (Copy)
- \`p\` : Dán (Paste) ở sau con trỏ
- \`u\` : Phục hồi (Undo) thao tác gần nhất

Nhấn \`Esc\` bất cứ lúc nào để trở về chế độ Normal.
`

const content = useStorage('vim-editor-content', sampleText)
const editorRef = ref<HTMLTextAreaElement | null>(null)

// Ngăn xếp (Stack) lưu lịch sử để Undo (u)
const undoStack = ref<string[]>([])

const saveHistory = () => {
  if (editorRef.value) {
    undoStack.value.push(editorRef.value.value)
    // Giữ tối đa 50 thao tác gần nhất để tránh tốn bộ nhớ
    if (undoStack.value.length > 50) {
      undoStack.value.shift()
    }
  }
}

// Tính toán scroll để con trỏ luôn nằm trong tầm nhìn
const scrollToCursor = (pos: number) => {
  const el = editorRef.value
  if (!el) return

  const text = el.value
  const linesBefore = text.slice(0, pos).split('\n').length

  // Các thông số xấp xỉ dựa trên Tailwind text-base, leading-relaxed (1.625) và p-5 (20px)
  const lineHeight = 26
  const paddingTop = 20

  const cursorYTop = paddingTop + (linesBefore - 1) * lineHeight
  const cursorYBottom = cursorYTop + lineHeight

  // Scroll lên nếu con trỏ vượt quá cạnh trên
  if (cursorYTop < el.scrollTop + paddingTop) {
    el.scrollTop = cursorYTop - paddingTop
  }
  // Scroll xuống nếu con trỏ vượt quá cạnh dưới
  else if (cursorYBottom > el.scrollTop + el.clientHeight - paddingTop) {
    el.scrollTop = cursorYBottom - el.clientHeight + paddingTop * 2
  }
}

// Cập nhật con trỏ và vùng bôi đen (selection)
const updateSelection = (pos: number) => {
  const el = editorRef.value
  if (!el) return

  currentPos.value = pos

  if (mode.value === 'NORMAL') {
    el.setSelectionRange(pos, pos + 1)
  } else if (mode.value === 'VISUAL') {
    const start = Math.min(visualStart.value, pos)
    const end = Math.max(visualStart.value, pos) + 1
    const direction = pos < visualStart.value ? 'backward' : 'forward'
    el.setSelectionRange(start, end, direction)
  } else if (mode.value === 'VISUAL_LINE') {
    const text = el.value
    const startInfo = getLineInfo(text, visualStart.value)
    const currentInfo = getLineInfo(text, pos)
    const startPos = Math.min(startInfo.lineStart, currentInfo.lineStart)
    const endPos = Math.max(startInfo.lineEnd, currentInfo.lineEnd)
    const finalEndPos = endPos < text.length && text[endPos] === '\n' ? endPos + 1 : endPos
    el.setSelectionRange(startPos, finalEndPos, pos < visualStart.value ? 'backward' : 'forward')
  } else {
    // Insert mode
    el.setSelectionRange(pos, pos)
  }

  nextTick(() => scrollToCursor(pos))
}

const getLineInfo = (text: string, pos: number) => {
  const before = text.slice(0, pos)
  const lineStart = before.lastIndexOf('\n') + 1
  const lineEnd = text.indexOf('\n', pos)
  const actualLineEnd = lineEnd === -1 ? text.length : lineEnd
  return { lineStart, lineEnd: actualLineEnd, col: pos - lineStart }
}

const handleKeydown = (e: KeyboardEvent) => {
  const el = editorRef.value
  if (!el) return

  // ---- CHẾ ĐỘ INSERT ----
  if (mode.value === 'INSERT') {
    if (e.key === 'Escape') {
      mode.value = 'NORMAL'
      const start = el.selectionStart
      updateSelection(Math.max(0, start - 1))
      e.preventDefault()
    } else {
      // Cho phép cuộn khi đang gõ Insert mode
      nextTick(() => scrollToCursor(el.selectionStart))
    }
    return
  }

  // ---- CHẾ ĐỘ NORMAL & VISUAL ----
  if (mode.value === 'NORMAL' || mode.value === 'VISUAL' || mode.value === 'VISUAL_LINE') {
    // Xử lý riêng Ctrl+u và Ctrl+d
    const isCtrlU = e.ctrlKey && e.key.toLowerCase() === 'u'
    const isCtrlD = e.ctrlKey && e.key.toLowerCase() === 'd'

    if (e.ctrlKey && !isCtrlU && !isCtrlD) return
    if (e.altKey || e.metaKey) return

    if (e.key === 'Escape') {
      mode.value = 'NORMAL'
      keyBuffer.value = ''
      updateSelection(currentPos.value)
      e.preventDefault()
      return
    }

    if (
      [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
        'PageUp',
        'PageDown',
      ].includes(e.key)
    ) {
      e.preventDefault()
      return
    }

    e.preventDefault()

    let pos = currentPos.value
    const text = el.value

    if (e.key.length === 1 && !e.ctrlKey) {
      keyBuffer.value += e.key
      if (keyBufferTimeout) clearTimeout(keyBufferTimeout)
      keyBufferTimeout = setTimeout(() => {
        keyBuffer.value = ''
      }, 1000)
    }

    const key = isCtrlU ? 'Ctrl+u' : isCtrlD ? 'Ctrl+d' : e.key
    let motionHandled = true

    // --- MOTIONS (Dùng chung cho Normal và Visual) ---
    if (key === 'h') {
      const info = getLineInfo(text, pos)
      if (info.col > 0) pos--
    } else if (key === 'l') {
      const info = getLineInfo(text, pos)
      if (pos < info.lineEnd) pos++
    } else if (key === 'j') {
      const info = getLineInfo(text, pos)
      if (info.lineEnd < text.length) {
        const nextLineStart = info.lineEnd + 1
        const nextLineEnd = text.indexOf('\n', nextLineStart)
        const actualNextLineEnd = nextLineEnd === -1 ? text.length : nextLineEnd
        const nextLineLen = actualNextLineEnd - nextLineStart
        pos = nextLineStart + Math.min(info.col, Math.max(0, nextLineLen - 1))
      }
    } else if (key === 'k') {
      const info = getLineInfo(text, pos)
      if (info.lineStart > 0) {
        const prevLineEnd = info.lineStart - 1
        const prevLineStart = text.lastIndexOf('\n', prevLineEnd - 1) + 1
        const prevLineLen = prevLineEnd - prevLineStart
        pos = prevLineStart + Math.min(info.col, Math.max(0, prevLineLen - 1))
      }
    } else if (key === 'w') {
      const remaining = text.slice(pos + 1)
      const match = remaining.match(/\b\w/) || remaining.match(/\s\S/)
      if (match && match.index !== undefined) {
        pos += match.index + 1
        if (/\s/.test(text.charAt(pos)) && pos + 1 < text.length) pos++
      } else {
        pos = text.length
      }
    } else if (key === 'b') {
      const before = text.slice(0, pos)
      const match = before.match(/\b\w+\b(?=[^\w]*$)/)
      if (match && match.index !== undefined) {
        pos = match.index
      } else {
        pos = 0
      }
    } else if (key === 'e') {
      const remaining = text.slice(pos + 1)
      const match = remaining.match(/\w\b/)
      if (match && match.index !== undefined) {
        pos += match.index + 1
      }
    } else if (key === '0') {
      pos = getLineInfo(text, pos).lineStart
    } else if (key === '$') {
      pos = getLineInfo(text, pos).lineEnd
      if (pos > getLineInfo(text, pos).lineStart) pos--
    } else if (key === 'G') {
      pos = text.length - 1
    } else if (key === '{') {
      // Nhảy lên đoạn văn
      const before = text.slice(0, pos > 0 ? pos - 1 : 0)
      const match = before.lastIndexOf('\n\n')
      pos = match !== -1 ? match + 1 : 0
    } else if (key === '}') {
      // Nhảy xuống đoạn văn
      const remaining = text.slice(pos + 1)
      const match = remaining.indexOf('\n\n')
      pos = match !== -1 ? pos + match + 2 : text.length
    } else if (key === 'Ctrl+u') {
      const currentLine = text.slice(0, pos).split('\n').length
      const targetLine = Math.max(1, currentLine - 12)
      let newPos = 0
      for (let i = 1; i < targetLine; i++) newPos = text.indexOf('\n', newPos) + 1
      const info = getLineInfo(text, pos)
      const targetLineEnd = text.indexOf('\n', newPos)
      const actualLineEnd = targetLineEnd === -1 ? text.length : targetLineEnd
      pos = newPos + Math.min(info.col, Math.max(0, actualLineEnd - newPos - 1))
    } else if (key === 'Ctrl+d') {
      const currentLine = text.slice(0, pos).split('\n').length
      const totalLines = text.split('\n').length
      const targetLine = Math.min(totalLines, currentLine + 12)
      let newPos = 0
      for (let i = 1; i < targetLine; i++) newPos = text.indexOf('\n', newPos) + 1
      const info = getLineInfo(text, pos)
      const targetLineEnd = text.indexOf('\n', newPos)
      const actualLineEnd = targetLineEnd === -1 ? text.length : targetLineEnd
      pos = newPos + Math.min(info.col, Math.max(0, actualLineEnd - newPos - 1))
    } else if (keyBuffer.value === 'gg') {
      pos = 0
      keyBuffer.value = ''
    } else {
      motionHandled = false
    }

    if (motionHandled) {
      updateSelection(pos)
      if (!['g', 'y', 'd'].includes(key)) {
        keyBuffer.value = ''
      }
      return
    }

    // --- CÁC THAO TÁC (Tùy theo Mode) ---
    let actionHandled = true

    if (mode.value === 'NORMAL') {
      if (keyBuffer.value === 'dd') {
        saveHistory()
        const info = getLineInfo(text, pos)
        const end = info.lineEnd < text.length ? info.lineEnd + 1 : info.lineEnd
        el.value = text.slice(0, info.lineStart) + text.slice(end)
        content.value = el.value
        keyBuffer.value = ''
        pos = info.lineStart
        updateSelection(pos)
        return
      }

      if (keyBuffer.value === 'yy') {
        const info = getLineInfo(text, pos)
        const end = info.lineEnd < text.length ? info.lineEnd + 1 : info.lineEnd
        const lineText = text.slice(info.lineStart, end)
        clipboardCopy(lineText)
        keyBuffer.value = ''
        updateSelection(pos)
        return
      }

      if (key === 'u') {
        if (undoStack.value.length > 0) {
          const prevState = undoStack.value.pop()
          if (prevState !== undefined) {
            el.value = prevState
            content.value = prevState
            if (pos > el.value.length) pos = Math.max(0, el.value.length - 1)
          }
        }
      } else if (key === 'i') {
        saveHistory()
        mode.value = 'INSERT'
      } else if (key === 'a') {
        saveHistory()
        mode.value = 'INSERT'
        const info = getLineInfo(text, pos)
        if (pos < info.lineEnd) pos++
      } else if (key === 'A') {
        saveHistory()
        mode.value = 'INSERT'
        pos = getLineInfo(text, pos).lineEnd
      } else if (key === 'I') {
        saveHistory()
        mode.value = 'INSERT'
        pos = getLineInfo(text, pos).lineStart
      } else if (key === 'o') {
        saveHistory()
        mode.value = 'INSERT'
        const info = getLineInfo(text, pos)
        el.value = text.slice(0, info.lineEnd) + '\n' + text.slice(info.lineEnd)
        content.value = el.value
        pos = info.lineEnd + 1
      } else if (key === 'O') {
        saveHistory()
        mode.value = 'INSERT'
        const info = getLineInfo(text, pos)
        el.value = text.slice(0, info.lineStart) + '\n' + text.slice(info.lineStart)
        content.value = el.value
        pos = info.lineStart
      } else if (key === 'x') {
        if (pos < text.length && text[pos] !== '\n') {
          saveHistory()
          el.value = text.slice(0, pos) + text.slice(pos + 1)
          content.value = el.value
          const info = getLineInfo(el.value, pos)
          if (pos === info.lineEnd && pos > info.lineStart) pos--
        }
      } else if (key === 'v') {
        mode.value = 'VISUAL'
        visualStart.value = pos
      } else if (key === 'V') {
        mode.value = 'VISUAL_LINE'
        visualStart.value = pos
      } else if (key === 'C') {
        saveHistory()
        mode.value = 'INSERT'
        const info = getLineInfo(text, pos)
        el.value = text.slice(0, pos) + text.slice(info.lineEnd)
        content.value = el.value
      } else if (key === 'D') {
        saveHistory()
        const info = getLineInfo(text, pos)
        el.value = text.slice(0, pos) + text.slice(info.lineEnd)
        content.value = el.value
        if (pos > 0 && pos === info.lineEnd) pos--
      } else if (key === 'p') {
        try {
          navigator.clipboard.readText().then((clipText) => {
            if (!clipText) return
            saveHistory()
            const insertPos = pos + 1 > text.length ? text.length : pos + 1
            el.value = text.slice(0, insertPos) + clipText + text.slice(insertPos)
            content.value = el.value
            pos = insertPos + clipText.length - 1
            updateSelection(pos)
          })
        } catch (err) {
          console.warn('Clipboard read error', err)
        }
        keyBuffer.value = ''
        return
      } else {
        actionHandled = false
      }
    } else if (mode.value === 'VISUAL' || mode.value === 'VISUAL_LINE') {
      if (key === 'v') {
        if (mode.value === 'VISUAL') {
          mode.value = 'NORMAL'
        } else {
          mode.value = 'VISUAL'
        }
      } else if (key === 'V') {
        if (mode.value === 'VISUAL_LINE') {
          mode.value = 'NORMAL'
        } else {
          mode.value = 'VISUAL_LINE'
        }
      } else if (key === 'd' || key === 'x' || key === 'c') {
        saveHistory()
        let start, end
        if (mode.value === 'VISUAL_LINE') {
          const startInfo = getLineInfo(text, visualStart.value)
          const currentInfo = getLineInfo(text, pos)
          start = Math.min(startInfo.lineStart, currentInfo.lineStart)
          const maxEnd = Math.max(startInfo.lineEnd, currentInfo.lineEnd)
          end = maxEnd < text.length && text[maxEnd] === '\n' ? maxEnd + 1 : maxEnd
        } else {
          start = Math.min(visualStart.value, pos)
          end = Math.max(visualStart.value, pos) + 1
        }
        el.value = text.slice(0, start) + text.slice(end)
        content.value = el.value
        pos = start
        if (key === 'c') {
          mode.value = 'INSERT'
        } else {
          mode.value = 'NORMAL'
        }
      } else if (key === 'y') {
        let start, end
        if (mode.value === 'VISUAL_LINE') {
          const startInfo = getLineInfo(text, visualStart.value)
          const currentInfo = getLineInfo(text, pos)
          start = Math.min(startInfo.lineStart, currentInfo.lineStart)
          const maxEnd = Math.max(startInfo.lineEnd, currentInfo.lineEnd)
          end = maxEnd < text.length && text[maxEnd] === '\n' ? maxEnd + 1 : maxEnd
        } else {
          start = Math.min(visualStart.value, pos)
          end = Math.max(visualStart.value, pos) + 1
        }
        const selectedText = text.slice(start, end)
        clipboardCopy(selectedText)
        mode.value = 'NORMAL'
      } else {
        actionHandled = false
      }
    }

    if (actionHandled) {
      updateSelection(pos)
      if (!['d', 'g', 'y'].includes(key)) {
        keyBuffer.value = ''
      }
    }
  }
}

const handleClick = () => {
  if (editorRef.value && mode.value !== 'INSERT') {
    mode.value = 'NORMAL'
    updateSelection(editorRef.value.selectionStart)
  }
}

const resetContent = () => {
  content.value = sampleText
  mode.value = 'NORMAL'
  undoStack.value = []
  keyBuffer.value = ''
  if (editorRef.value) {
    editorRef.value.focus()
    updateSelection(0)
  }
}

onMounted(() => {
  if (editorRef.value) {
    editorRef.value.focus()
    updateSelection(0)
  }
})
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center py-12 px-4"
  >
    <div class="w-full max-w-4xl animate-fade-up">
      <!-- Tiêu đề & Nút quay lại -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1 class="font-display text-4xl font-bold text-accent-coral flex items-center gap-3">
          <Icon icon="lucide:terminal-square" class="w-10 h-10" />
          Vim Editor
        </h1>
        <div class="flex items-center gap-3">
          <button
            @click="resetContent"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2.5 text-sm text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
          >
            <Icon icon="lucide:rotate-ccw" class="w-4 h-4" />
            Khôi phục nội dung mẫu
          </button>
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          >
            <Icon icon="lucide:arrow-left" class="w-4 h-4" />
            Về trang chủ
          </RouterLink>
        </div>
      </div>

      <!-- Editor Container -->
      <div
        class="border border-border-default bg-bg-surface p-4 flex flex-col transition-all duration-300 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 animate-fade-up animate-delay-2"
      >
        <!-- Status Bar -->
        <div
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border-default pb-3 mb-4 gap-3"
        >
          <div class="flex items-center gap-4">
            <span
              class="px-3 py-1 text-sm font-bold tracking-wider font-display transition-colors uppercase"
              :class="{
                'bg-accent-coral text-bg-deep': mode === 'NORMAL',
                'bg-accent-amber text-bg-deep': mode === 'INSERT',
                'bg-accent-sky text-bg-deep': mode === 'VISUAL' || mode === 'VISUAL_LINE',
              }"
            >
              {{ mode }}
            </span>
            <span class="text-text-secondary text-sm font-mono flex items-center gap-2">
              <Icon icon="lucide:history" class="w-4 h-4 text-text-dim" />
              Buffer: <span class="text-accent-sky font-bold">{{ keyBuffer || '--' }}</span>
            </span>
            <span
              class="text-text-secondary text-xs font-mono ml-2 border border-border-default px-2 py-0.5"
              v-if="undoStack.length > 0"
            >
              Lịch sử Undo: {{ undoStack.length }}
            </span>
          </div>
          <div class="text-text-dim text-sm font-mono flex items-center gap-2">
            <Icon icon="lucide:keyboard" class="w-4 h-4" />
            Nhấn
            <kbd
              class="px-2 py-0.5 bg-bg-deep border border-border-default ml-1 text-text-secondary"
              >Esc</kbd
            >
            để về Normal
          </div>
        </div>

        <!-- Editor Area (Textarea) -->
        <div
          class="relative flex-grow h-[600px] border border-border-default bg-bg-deep focus-within:border-accent-coral transition-colors"
        >
          <textarea
            ref="editorRef"
            v-model="content"
            :class="[
              'w-full h-full p-5 font-mono text-base bg-transparent text-text-primary outline-none resize-none leading-relaxed',
              mode === 'NORMAL'
                ? 'selection:bg-accent-coral selection:text-bg-deep'
                : mode === 'VISUAL' || mode === 'VISUAL_LINE'
                  ? 'selection:bg-accent-sky/40 selection:text-text-primary'
                  : 'selection:bg-accent-amber/30 selection:text-text-primary',
            ]"
            spellcheck="false"
            @keydown="handleKeydown"
            @click="handleClick"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>
