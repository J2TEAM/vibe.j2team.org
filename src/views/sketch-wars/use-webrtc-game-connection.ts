import { ref, onUnmounted } from 'vue'

/**
 * STUN + TURN servers for NAT traversal
 * STUN list: https://gist.github.com/sagivo/3a4b2f2c7ac6e1b5267c2f1f59ac6c6b
 * TURN: openrelay.metered.ca (free, reliable, supports mobile cell data)
 */
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    // Google STUN servers (most reliable)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Other reliable public STUN servers
    { urls: 'stun:stun.ekiga.net' },
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:stun.voipbuster.com' },
    { urls: 'stun:stun.voipstunt.com' },
    { urls: 'stun:stun.services.mozilla.com:3478' },
    { urls: 'stun:stun.sipgate.net:3478' },
    { urls: 'stun:stun.freeswitch.org:3478' },
    { urls: 'stun:stun.zoiper.com:3478' },
    // TURN servers — openrelay.metered.ca (free, supports UDP+TCP+TLS for mobile cell data)
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

export type GameConnectionState =
  | 'idle'
  | 'creating-offer'
  | 'waiting-answer'
  | 'joining'
  | 'connected'
  | 'error'

/** Game message types sent over DataChannel */
export interface DrawMessage {
  t: 'draw'
  x: number
  y: number
  /** previous x for line interpolation (-1 = no previous) */
  px: number
  /** previous y for line interpolation (-1 = no previous) */
  py: number
  /** brush size */
  s: number
  /** 1 = drawing, 0 = move only (pen up) */
  d: number
}

export interface GameControlMessage {
  t: 'start' | 'end' | 'ready' | 'sync-score'
  score?: { p1: number; p2: number }
}

export type GameMessage = DrawMessage | GameControlMessage

function sdpToBase64(sdpJson: string): string {
  return btoa(sdpJson)
}

function base64ToSdp(input: string): string {
  const trimmed = input.trim()
  if (trimmed.startsWith('{')) return trimmed
  try {
    return atob(trimmed)
  } catch {
    return trimmed
  }
}

export function useWebrtcGameConnection() {
  const state = ref<GameConnectionState>('idle')
  const errorMessage = ref('')
  const isLoading = ref(false)
  const offerSdp = ref('')
  const answerSdp = ref('')

  let pc: RTCPeerConnection | null = null
  let dataChannel: RTCDataChannel | null = null
  let onMessageCallback: ((msg: GameMessage) => void) | null = null

  /** Register callback for incoming game messages */
  function onMessage(cb: (msg: GameMessage) => void) {
    onMessageCallback = cb
  }

  /** Send a game message to the peer */
  function send(msg: GameMessage) {
    if (dataChannel?.readyState === 'open') {
      dataChannel.send(JSON.stringify(msg))
    }
  }

  function createPeerConnection() {
    pc = new RTCPeerConnection(ICE_SERVERS)
    pc.oniceconnectionstatechange = () => {
      const iceState = pc?.iceConnectionState
      if (iceState === 'failed' || iceState === 'disconnected') {
        if (state.value === 'connected') {
          errorMessage.value = 'Kết nối bị gián đoạn.'
          state.value = 'error'
        }
      }
    }
    return pc
  }

  function setupDataChannelHandlers(dc: RTCDataChannel) {
    dc.binaryType = 'arraybuffer'
    dc.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data) as GameMessage
          onMessageCallback?.(msg)
        } catch {
          /* ignore non-JSON */
        }
      }
    }
    dc.onopen = () => {
      state.value = 'connected'
    }
  }

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

  /** Host: create offer with data channel */
  async function createOffer(): Promise<string> {
    isLoading.value = true
    state.value = 'creating-offer'
    errorMessage.value = ''

    const conn = createPeerConnection()
    dataChannel = conn.createDataChannel('sketch-wars', {
      ordered: false,
      maxRetransmits: 0,
    })
    setupDataChannelHandlers(dataChannel)

    const offer = await conn.createOffer()
    await conn.setLocalDescription(offer)
    const fullSdp = await waitForIceGathering(conn)
    const encoded = sdpToBase64(fullSdp)
    offerSdp.value = encoded
    isLoading.value = false
    state.value = 'waiting-answer'
    return encoded
  }

  /** Guest: join with offer code */
  async function joinWithOffer(offerText: string): Promise<string> {
    isLoading.value = true
    state.value = 'joining'
    errorMessage.value = ''

    const conn = createPeerConnection()
    conn.ondatachannel = (event) => {
      dataChannel = event.channel
      setupDataChannelHandlers(dataChannel)
    }

    try {
      const decoded = base64ToSdp(offerText)
      const parsed = JSON.parse(decoded)
      await conn.setRemoteDescription(parsed)
    } catch {
      errorMessage.value = 'Mã mời không hợp lệ. Vui lòng kiểm tra lại.'
      state.value = 'error'
      isLoading.value = false
      return ''
    }

    const answer = await conn.createAnswer()
    await conn.setLocalDescription(answer)
    const fullSdp = await waitForIceGathering(conn)
    const encoded = sdpToBase64(fullSdp)
    answerSdp.value = encoded
    isLoading.value = false
    return encoded
  }

  /** Host: accept answer to complete connection */
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
    } catch {
      errorMessage.value = 'Mã trả lời không hợp lệ.'
      state.value = 'error'
    }
  }

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
    onMessageCallback = null
  }

  onUnmounted(disconnect)

  return {
    state,
    errorMessage,
    isLoading,
    offerSdp,
    answerSdp,
    onMessage,
    send,
    createOffer,
    joinWithOffer,
    acceptAnswer,
    disconnect,
  }
}
