import { ref, onUnmounted, type Ref } from 'vue'

/** STUN + TURN servers for NAT traversal (TURN needed for 3G/4G/5G mobile networks) */
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

export type ConnectionState =
  | 'idle'
  | 'creating-offer'
  | 'waiting-answer'
  | 'joining'
  | 'connected'
  | 'error'

/** Encode SDP JSON to base64 for safe copy/paste across messaging apps */
function sdpToBase64(sdpJson: string): string {
  return btoa(sdpJson)
}

/** Decode base64 SDP back to JSON string. Accepts both base64 and raw JSON for backwards compat. */
function base64ToSdp(input: string): string {
  const trimmed = input.trim()
  // If it starts with '{', assume raw JSON (backwards compat with old links/copies)
  if (trimmed.startsWith('{')) return trimmed
  try {
    return atob(trimmed)
  } catch {
    return trimmed
  }
}

export function useWebrtcPeerConnection() {
  const localStream: Ref<MediaStream | null> = ref(null)
  const remoteStream: Ref<MediaStream | null> = ref(null)
  const connectionState = ref<ConnectionState>('idle')
  const errorMessage = ref('')
  const isLoading = ref(false)
  const isMuted = ref(false)
  const isCameraOff = ref(false)
  const offerSdp = ref('')
  const answerSdp = ref('')

  let pc: RTCPeerConnection | null = null

  /** Request camera + microphone access */
  async function startMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStream.value = stream
      return stream
    } catch (err) {
      errorMessage.value = 'Không thể truy cập camera/mic. Vui lòng cấp quyền và thử lại.'
      connectionState.value = 'idle'
      throw err
    }
  }

  /** Initialize RTCPeerConnection and wire up event handlers */
  function createPeerConnection(stream: MediaStream) {
    pc = new RTCPeerConnection(ICE_SERVERS)
    remoteStream.value = new MediaStream()

    // Add local tracks to connection
    for (const track of stream.getTracks()) {
      pc.addTrack(track, stream)
    }

    // Receive remote tracks
    pc.ontrack = (event) => {
      const stream = event.streams[0]
      if (stream) {
        for (const track of stream.getTracks()) {
          remoteStream.value?.addTrack(track)
        }
      }
    }

    let disconnectTimer: ReturnType<typeof setTimeout> | null = null

    pc.oniceconnectionstatechange = () => {
      const state = pc?.iceConnectionState
      // Clear any pending disconnect timer on state change
      if (disconnectTimer) {
        clearTimeout(disconnectTimer)
        disconnectTimer = null
      }

      if (state === 'connected') {
        // For joiner, stay in 'joining' so they can see & copy the Answer first
        if (connectionState.value !== 'joining') {
          connectionState.value = 'connected'
        }
      }

      if (state === 'disconnected') {
        // Grace period: ICE may reconnect after brief disconnection
        // Don't disconnect during setup (joining/creating-offer) — expected before answer exchange
        if (connectionState.value === 'connected') {
          disconnectTimer = setTimeout(() => disconnect(), 5000)
        }
      }

      if (state === 'failed') {
        // During setup, failure is expected (answer not yet exchanged) — don't disconnect
        if (connectionState.value === 'connected') {
          disconnect()
        }
      }
    }

    return pc
  }

  /** Caller: create offer SDP, wait for all ICE candidates, return full SDP */
  async function createOffer(): Promise<string> {
    isLoading.value = true
    connectionState.value = 'creating-offer'

    let stream: MediaStream
    try {
      stream = await startMedia()
    } catch {
      isLoading.value = false
      return ''
    }

    const conn = createPeerConnection(stream)
    const offer = await conn.createOffer()
    await conn.setLocalDescription(offer)

    // Wait for ICE gathering to complete so SDP contains all candidates
    const fullSdp = await waitForIceGathering(conn)
    const encoded = sdpToBase64(fullSdp)
    offerSdp.value = encoded
    isLoading.value = false
    return encoded
  }

  /** Joiner: accept offer SDP, create answer SDP */
  async function joinWithOffer(offerText: string): Promise<string> {
    isLoading.value = true
    connectionState.value = 'joining'

    let stream: MediaStream
    try {
      stream = await startMedia()
    } catch {
      isLoading.value = false
      return ''
    }

    const conn = createPeerConnection(stream)

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
      connectionState.value = 'error'
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

  /** Caller: accept answer to complete the connection */
  async function acceptAnswer(answerText: string) {
    if (!pc) {
      errorMessage.value = 'Kết nối đã hết hạn. Vui lòng tạo phòng lại.'
      connectionState.value = 'error'
      return
    }
    try {
      const decoded = base64ToSdp(answerText)
      const parsed = JSON.parse(decoded)
      await pc.setRemoteDescription(parsed)
    } catch (err) {
      const msg =
        err instanceof SyntaxError
          ? 'Mã trả lời không đúng định dạng. Vui lòng kiểm tra đã copy đủ chưa.'
          : 'Mã trả lời không hợp lệ. Vui lòng thử lại.'
      errorMessage.value = msg
      connectionState.value = 'error'
    }
  }

  /** Wait until ICE gathering completes (with 10s timeout), then return the full local description */
  function waitForIceGathering(conn: RTCPeerConnection): Promise<string> {
    return new Promise((resolve) => {
      const resolveSdp = () => resolve(JSON.stringify(conn.localDescription))

      if (conn.iceGatheringState === 'complete') {
        resolveSdp()
        return
      }

      // Timeout: resolve with whatever candidates we have after 10s
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

  function toggleMute() {
    if (!localStream.value) return
    const audioTrack = localStream.value.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      isMuted.value = !audioTrack.enabled
    }
  }

  function toggleCamera() {
    if (!localStream.value) return
    const videoTrack = localStream.value.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      isCameraOff.value = !videoTrack.enabled
    }
  }

  function disconnect() {
    pc?.close()
    pc = null
    localStream.value?.getTracks().forEach((t) => t.stop())
    localStream.value = null
    remoteStream.value = null
    connectionState.value = 'idle'
    errorMessage.value = ''
    isLoading.value = false
    isMuted.value = false
    isCameraOff.value = false
    offerSdp.value = ''
    answerSdp.value = ''
  }

  onUnmounted(disconnect)

  return {
    localStream,
    remoteStream,
    connectionState,
    errorMessage,
    isLoading,
    isMuted,
    isCameraOff,
    offerSdp,
    answerSdp,
    createOffer,
    joinWithOffer,
    acceptAnswer,
    toggleMute,
    toggleCamera,
    disconnect,
  }
}
