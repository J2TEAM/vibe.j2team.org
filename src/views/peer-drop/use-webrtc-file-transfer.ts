import { ref, onUnmounted } from 'vue'

/** STUN + TURN servers for NAT traversal */
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:openrelay.metered.ca:80' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
}

const CHUNK_SIZE = 16384 // 16KB per chunk

export type TransferState =
  | 'idle'
  | 'files-ready'
  | 'creating-offer'
  | 'waiting-answer'
  | 'joining'
  | 'transferring'
  | 'complete'
  | 'error'

export interface FileInfo {
  name: string
  size: number
  type: string
}

/** Encode SDP JSON to base64 for safe copy/paste */
function sdpToBase64(sdpJson: string): string {
  return btoa(sdpJson)
}

/** Decode base64 SDP back to JSON string */
function base64ToSdp(input: string): string {
  const trimmed = input.trim()
  if (trimmed.startsWith('{')) return trimmed
  try {
    return atob(trimmed)
  } catch {
    return trimmed
  }
}

/** Format bytes to human readable string */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

export function useWebrtcFileTransfer() {
  const state = ref<TransferState>('idle')
  const errorMessage = ref('')
  const isLoading = ref(false)
  const offerSdp = ref('')
  const answerSdp = ref('')

  // Sender state
  const selectedFiles = ref<File[]>([])
  const sendProgress = ref(0) // 0-100
  const bytesSent = ref(0)
  const totalBytes = ref(0)

  // Receiver state
  const incomingFiles = ref<FileInfo[]>([])
  const receiveProgress = ref(0) // 0-100
  const bytesReceived = ref(0)
  const receiveTotalBytes = ref(0)
  const downloadReady = ref(false)

  let pc: RTCPeerConnection | null = null
  let dataChannel: RTCDataChannel | null = null
  let receivedChunks: ArrayBuffer[] = []
  let receivedFilesMeta: FileInfo[] = []
  let currentFileIndex = 0
  let currentFileReceived = 0
  let completedFiles: { blob: Blob; name: string }[] = []

  /** Select files to send */
  function selectFiles(files: File[]) {
    selectedFiles.value = files
    totalBytes.value = files.reduce((sum, f) => sum + f.size, 0)
    state.value = 'files-ready'
  }

  /** Remove a file from selection */
  function removeFile(index: number) {
    selectedFiles.value.splice(index, 1)
    totalBytes.value = selectedFiles.value.reduce((sum, f) => sum + f.size, 0)
    if (selectedFiles.value.length === 0) {
      state.value = 'idle'
    }
  }

  /** Create peer connection (no media, data channel only) */
  function createPeerConnection() {
    pc = new RTCPeerConnection(ICE_SERVERS)

    pc.oniceconnectionstatechange = () => {
      const iceState = pc?.iceConnectionState
      if (iceState === 'failed' || iceState === 'disconnected') {
        if (state.value === 'transferring') {
          errorMessage.value = 'Kết nối bị gián đoạn. Vui lòng thử lại.'
          state.value = 'error'
        }
      }
    }

    return pc
  }

  /** Wait until ICE gathering completes */
  function waitForIceGathering(conn: RTCPeerConnection): Promise<string> {
    return new Promise((resolve) => {
      const resolveSdp = () => resolve(JSON.stringify(conn.localDescription))

      if (conn.iceGatheringState === 'complete') {
        resolveSdp()
        return
      }

      const timeout = setTimeout(() => {
        conn.onicegatheringstatechange = null
        resolveSdp()
      }, 10_000)

      conn.onicegatheringstatechange = () => {
        if (conn.iceGatheringState === 'complete') {
          clearTimeout(timeout)
          resolveSdp()
        }
      }
    })
  }

  /** Sender: create offer with data channel */
  async function createOffer(): Promise<string> {
    isLoading.value = true
    state.value = 'creating-offer'
    errorMessage.value = ''

    const conn = createPeerConnection()

    // Create data channel for file transfer
    dataChannel = conn.createDataChannel('file-transfer', { ordered: true })
    dataChannel.binaryType = 'arraybuffer'

    dataChannel.onopen = () => {
      sendAllFiles()
    }

    const offer = await conn.createOffer()
    await conn.setLocalDescription(offer)

    const fullSdp = await waitForIceGathering(conn)
    const encoded = sdpToBase64(fullSdp)
    offerSdp.value = encoded
    isLoading.value = false
    state.value = 'waiting-answer'
    return encoded
  }

  /** Receiver: join with offer, setup data channel listener */
  async function joinWithOffer(offerText: string): Promise<string> {
    isLoading.value = true
    state.value = 'joining'
    errorMessage.value = ''

    const conn = createPeerConnection()

    // Listen for incoming data channel
    conn.ondatachannel = (event) => {
      dataChannel = event.channel
      dataChannel.binaryType = 'arraybuffer'
      setupReceiverHandlers()
    }

    try {
      const decoded = base64ToSdp(offerText)
      const parsed = JSON.parse(decoded)
      await conn.setRemoteDescription(parsed)
    } catch (err) {
      const msg =
        err instanceof SyntaxError
          ? 'Mã mời không đúng định dạng. Vui lòng kiểm tra đã copy đủ chưa.'
          : 'Mã mời không hợp lệ. Vui lòng thử lại.'
      errorMessage.value = msg
      state.value = 'error'
      isLoading.value = false
      throw err
    }

    const answer = await conn.createAnswer()
    await conn.setLocalDescription(answer)

    const fullSdp = await waitForIceGathering(conn)
    const encoded = sdpToBase64(fullSdp)
    answerSdp.value = encoded
    isLoading.value = false
    return encoded
  }

  /** Sender: accept answer to complete connection */
  async function acceptAnswer(answerText: string) {
    if (!pc) {
      errorMessage.value = 'Kết nối đã hết hạn. Vui lòng tạo lại.'
      state.value = 'error'
      return
    }
    try {
      const decoded = base64ToSdp(answerText)
      const parsed = JSON.parse(decoded)
      await pc.setRemoteDescription(parsed)
    } catch (err) {
      const msg =
        err instanceof SyntaxError ? 'Mã trả lời không đúng định dạng.' : 'Mã trả lời không hợp lệ.'
      errorMessage.value = msg
      state.value = 'error'
    }
  }

  /** Sender: stream all files over data channel */
  async function sendAllFiles() {
    if (!dataChannel || dataChannel.readyState !== 'open') return
    state.value = 'transferring'
    bytesSent.value = 0

    const dc = dataChannel

    // Send file metadata first
    const meta: FileInfo[] = selectedFiles.value.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
    }))
    dc.send(JSON.stringify({ type: 'meta', files: meta }))

    // Send each file in chunks
    for (const file of selectedFiles.value) {
      const buffer = await file.arrayBuffer()
      let offset = 0

      while (offset < buffer.byteLength) {
        // Backpressure: wait if buffer is too full
        if (dc.bufferedAmount > 65536) {
          await new Promise<void>((resolve) => {
            dc.bufferedAmountLowThreshold = 16384
            dc.onbufferedamountlow = () => {
              dc.onbufferedamountlow = null
              resolve()
            }
          })
        }

        const end = Math.min(offset + CHUNK_SIZE, buffer.byteLength)
        dc.send(buffer.slice(offset, end))
        offset = end
        bytesSent.value += end - (offset - (end - offset))
        // Recalculate properly
        bytesSent.value = Math.min(
          selectedFiles.value
            .slice(0, selectedFiles.value.indexOf(file))
            .reduce((s, f) => s + f.size, 0) + offset,
          totalBytes.value,
        )
        sendProgress.value = Math.round((bytesSent.value / totalBytes.value) * 100)
      }

      // Signal end of this file
      dc.send(JSON.stringify({ type: 'file-end', name: file.name }))
    }

    // Signal all files done
    dc.send(JSON.stringify({ type: 'all-done' }))
    sendProgress.value = 100
    state.value = 'complete'
  }

  /** Receiver: handle incoming data channel messages */
  function setupReceiverHandlers() {
    if (!dataChannel) return
    const dc = dataChannel

    dc.onmessage = (event) => {
      // Text message (JSON control)
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data)

          if (msg.type === 'meta') {
            receivedFilesMeta = msg.files as FileInfo[]
            incomingFiles.value = receivedFilesMeta
            receiveTotalBytes.value = receivedFilesMeta.reduce(
              (s: number, f: FileInfo) => s + f.size,
              0,
            )
            currentFileIndex = 0
            currentFileReceived = 0
            receivedChunks = []
            completedFiles = []
            bytesReceived.value = 0
            state.value = 'transferring'
          }

          if (msg.type === 'file-end') {
            // Assemble current file
            const blob = new Blob(receivedChunks, {
              type: receivedFilesMeta[currentFileIndex]?.type || 'application/octet-stream',
            })
            completedFiles.push({
              blob,
              name: msg.name,
            })
            currentFileIndex++
            currentFileReceived = 0
            receivedChunks = []
          }

          if (msg.type === 'all-done') {
            receiveProgress.value = 100
            downloadReady.value = true
            state.value = 'complete'
          }
        } catch {
          // Not JSON, ignore
        }
        return
      }

      // Binary data (file chunk)
      const chunk = event.data as ArrayBuffer
      receivedChunks.push(chunk)
      currentFileReceived += chunk.byteLength
      bytesReceived.value += chunk.byteLength
      receiveProgress.value = Math.round((bytesReceived.value / receiveTotalBytes.value) * 100)
    }
  }

  /** Receiver: trigger download for all received files */
  function downloadFiles() {
    for (const file of completedFiles) {
      const url = URL.createObjectURL(file.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  /** Reset everything */
  function disconnect() {
    dataChannel?.close()
    dataChannel = null
    pc?.close()
    pc = null
    state.value = 'idle'
    errorMessage.value = ''
    isLoading.value = false
    offerSdp.value = ''
    answerSdp.value = ''
    selectedFiles.value = []
    sendProgress.value = 0
    bytesSent.value = 0
    totalBytes.value = 0
    incomingFiles.value = []
    receiveProgress.value = 0
    bytesReceived.value = 0
    receiveTotalBytes.value = 0
    downloadReady.value = false
    receivedChunks = []
    receivedFilesMeta = []
    currentFileIndex = 0
    currentFileReceived = 0
    completedFiles = []
  }

  onUnmounted(disconnect)

  return {
    state,
    errorMessage,
    isLoading,
    offerSdp,
    answerSdp,
    selectedFiles,
    sendProgress,
    bytesSent,
    totalBytes,
    incomingFiles,
    receiveProgress,
    bytesReceived,
    receiveTotalBytes,
    downloadReady,
    selectFiles,
    removeFile,
    createOffer,
    joinWithOffer,
    acceptAnswer,
    downloadFiles,
    disconnect,
    formatBytes,
  }
}
