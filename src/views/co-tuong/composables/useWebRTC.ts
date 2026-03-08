import { ref, nextTick } from 'vue'
import type { Board, Turn, Move, ConnectionState } from '../types'
import { ICE_CFG } from '../constants'


export interface WebRTCCallbacks {
    onRemoteMove: (from: [number, number], to: [number, number]) => void
    onRemoteResign: () => void
    onRemoteSync: (msg: { board: Board; turn: Turn; moveHistory: Move[] }) => void
    onEnterOnlineGame: () => void
    onEnterSpectator: () => void
}

export function useWebRTC(callbacks: WebRTCCallbacks) {
    const connState = ref<ConnectionState>('idle')
    const localStream = ref<MediaStream | null>(null)
    const remoteStream = ref<MediaStream | null>(new MediaStream())
    const localVideoRef = ref<HTMLVideoElement | null>(null)
    const remoteVideoRef = ref<HTMLVideoElement | null>(null)
    const offerSdp = ref(''); const answerSdp = ref('')
    const pastedOffer = ref(''); const pastedAnswer = ref('')
    const isMuted = ref(false); const isCameraOff = ref(false)
    const copied = ref(false); const connError = ref(''); const iceProgress = ref('')
    const hasCamera = ref(false); const spectatorCount = ref(0)
    const remoteMuted = ref(false); const remoteCameraOff = ref(false)
    const spectatorChannels: RTCDataChannel[] = []

    let pc: RTCPeerConnection | null = null
    let dataChannel: RTCDataChannel | null = null

    function sdpEncode(s: string): string { return btoa(s) }
    function sdpDecode(s: string): string {
        try { return atob(s.trim()) }
        catch { return '' }
    }

    async function tryStartMedia(): Promise<MediaStream | null> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            localStream.value = stream
            hasCamera.value = true
            nextTick(() => {
                if (localVideoRef.value) {
                    localVideoRef.value.srcObject = stream
                    localVideoRef.value.play().catch(() => { })
                }
            })
            return stream
        } catch {
            hasCamera.value = false
            return null
        }
    }

    function setupPeerConnection(stream: MediaStream | null) {
        const conn = new RTCPeerConnection(ICE_CFG)
        pc = conn

        if (stream) {
            for (const track of stream.getTracks()) conn.addTrack(track, stream)
        }

        conn.ontrack = (e) => {
            const s = e.streams[0]
            if (s) for (const track of s.getTracks()) remoteStream.value?.addTrack(track)
            nextTick(() => {
                if (remoteVideoRef.value && remoteStream.value) {
                    remoteVideoRef.value.srcObject = remoteStream.value
                    remoteVideoRef.value.play().catch(() => { })
                }
            })
        }

        conn.oniceconnectionstatechange = () => {
            if (conn?.iceConnectionState === 'connected' && connState.value !== 'joining')
                connState.value = 'connected'
            if (conn?.iceConnectionState === 'failed' || conn?.iceConnectionState === 'disconnected') {
                connError.value = 'Kết nối đã mất. Vui lòng thử lại.'
            }
        }

        return conn
    }

    function setupDataChannel(ch: RTCDataChannel) {
        dataChannel = ch
        ch.onopen = () => {
            if (connState.value === 'joining' || connState.value === 'creating-offer' || connState.value === 'waiting-answer') {
                callbacks.onEnterOnlineGame()
            } else if (connState.value === 'spectator-joining') {
                callbacks.onEnterSpectator()
            }
        }
        ch.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data)
                if (msg.type === 'move') {
                    callbacks.onRemoteMove(msg.from, msg.to)
                    broadcastToSpectators(e.data)
                }
                if (msg.type === 'resign') {
                    callbacks.onRemoteResign()
                    broadcastToSpectators(e.data)
                }
                if (msg.type === 'sync') callbacks.onRemoteSync(msg)
                if (msg.type === 'media-state') {
                    remoteMuted.value = !!msg.muted
                    remoteCameraOff.value = !!msg.cameraOff
                }
                if (msg.type === 'spectator-join') {
                    spectatorCount.value++
                    ch.send(JSON.stringify({ type: 'sync', board: [], turn: 'red', moveHistory: [] }))
                }
            } catch { /* ignore */ }
        }
    }

    function broadcastToSpectators(data: string) {
        for (const ch of spectatorChannels) {
            if (ch.readyState === 'open') ch.send(data)
        }
    }

    function waitIce(conn: RTCPeerConnection): Promise<string> {
        return new Promise((resolve) => {
            let resolved = false
            const done = () => { if (resolved) return; resolved = true; iceProgress.value = ''; resolve(JSON.stringify(conn.localDescription)) }
            if (conn.iceGatheringState === 'complete') { done(); return }
            iceProgress.value = 'Đang thu thập kết nối...'
            conn.onicecandidate = (e) => {
                if (!e.candidate) { done(); return }
                if (e.candidate.type === 'srflx' || e.candidate.type === 'relay') {
                    iceProgress.value = 'Đã tìm thấy đường truyền!'
                    setTimeout(done, 500)
                }
            }
            const t = setTimeout(done, 3000)
            conn.onicegatheringstatechange = () => {
                if (conn.iceGatheringState === 'complete') { clearTimeout(t); done() }
            }
        })
    }

    async function createRoom() {
        connState.value = 'creating-offer'; connError.value = ''; iceProgress.value = 'Đang khởi tạo...'
        try {
            const stream = await tryStartMedia()
            const conn = setupPeerConnection(stream)
            const ch = conn.createDataChannel('chess')
            setupDataChannel(ch)
            const offer = await conn.createOffer()
            await conn.setLocalDescription(offer)
            const sdp = await waitIce(conn)
            offerSdp.value = sdpEncode(sdp)
        } catch {
            connError.value = 'Không thể tạo kết nối. Vui lòng thử lại.'
            connState.value = 'idle'
        }
    }

    async function joinRoom() {
        connState.value = 'joining'; connError.value = ''; iceProgress.value = 'Đang kết nối...'
        try {
            const stream = await tryStartMedia()
            const conn = setupPeerConnection(stream)
            conn.ondatachannel = (e) => setupDataChannel(e.channel)
            const decoded = sdpDecode(pastedOffer.value)
            await conn.setRemoteDescription(JSON.parse(decoded))
            const answer = await conn.createAnswer()
            await conn.setLocalDescription(answer)
            const sdp = await waitIce(conn)
            answerSdp.value = sdpEncode(sdp)
            safeCopy(answerSdp.value)
        } catch {
            connError.value = 'Mã phòng không hợp lệ.'
            connState.value = 'idle'
        }
    }

    async function joinAsSpectator() {
        connState.value = 'spectator-joining'; connError.value = ''
        try {
            const conn = setupPeerConnection(null)
            conn.ondatachannel = (e) => setupDataChannel(e.channel)
            const decoded = sdpDecode(pastedOffer.value)
            await conn.setRemoteDescription(JSON.parse(decoded))
            const answer = await conn.createAnswer()
            await conn.setLocalDescription(answer)
            const sdp = await waitIce(conn)
            answerSdp.value = sdpEncode(sdp)
            safeCopy(answerSdp.value)
        } catch {
            connError.value = 'Mã phòng không hợp lệ.'
            connState.value = 'idle'
        }
    }

    async function acceptAnswer() {
        if (!pc) return
        try {
            const decoded = sdpDecode(pastedAnswer.value)
            await pc.setRemoteDescription(JSON.parse(decoded))
            if (dataChannel?.readyState === 'open') callbacks.onEnterOnlineGame()
        } catch { connError.value = 'Mã trả lời không hợp lệ.' }
    }

    function sendMove(from: [number, number], to: [number, number]) {
        const data = JSON.stringify({ type: 'move', from, to })
        dataChannel?.send(data)
        broadcastToSpectators(data)
    }

    function sendSync(board: Board, turn: Turn, moveHistory: Move[]) {
        const data = JSON.stringify({ type: 'sync', board, turn, moveHistory })
        dataChannel?.send(data)
        broadcastToSpectators(data)
    }

    function sendResign() {
        const data = JSON.stringify({ type: 'resign' })
        dataChannel?.send(data)
        broadcastToSpectators(data)
    }

    function disconnectRTC() {
        pc?.close(); pc = null; dataChannel = null
        spectatorChannels.length = 0; spectatorCount.value = 0
        localStream.value?.getTracks().forEach(t => t.stop())
        localStream.value = null; remoteStream.value = null; hasCamera.value = false
        connState.value = 'idle'; offerSdp.value = ''; answerSdp.value = ''
        pastedOffer.value = ''; pastedAnswer.value = ''
    }

    function safeCopy(text: string) {
        navigator.clipboard.writeText(text).catch(() => { })
        copied.value = true
        setTimeout(() => { copied.value = false }, 2000)
    }

    function toggleMute() {
        const t = localStream.value?.getAudioTracks()[0]
        if (t) { t.enabled = !t.enabled; isMuted.value = !t.enabled }
        sendMediaState()
    }

    function toggleCamera() {
        const t = localStream.value?.getVideoTracks()[0]
        if (t) { t.enabled = !t.enabled; isCameraOff.value = !t.enabled }
        sendMediaState()
    }

    function sendMediaState() {
        dataChannel?.send(JSON.stringify({ type: 'media-state', muted: isMuted.value, cameraOff: isCameraOff.value }))
    }

    function reattachStreams() {
        nextTick(() => {
            if (localVideoRef.value && localStream.value) {
                localVideoRef.value.srcObject = localStream.value
                localVideoRef.value.play().catch(() => { })
            }
            if (remoteVideoRef.value && remoteStream.value) {
                remoteVideoRef.value.srcObject = remoteStream.value
                remoteVideoRef.value.play().catch(() => { })
            }
        })
    }

    return {
        // State
        connState, localStream, remoteStream, localVideoRef, remoteVideoRef,
        offerSdp, answerSdp, pastedOffer, pastedAnswer,
        isMuted, isCameraOff, copied, connError, iceProgress,
        hasCamera, spectatorCount, remoteMuted, remoteCameraOff,
        // Actions
        createRoom, joinRoom, joinAsSpectator, acceptAnswer,
        sendMove, sendSync, sendResign, disconnectRTC,
        safeCopy, toggleMute, toggleCamera, reattachStreams,
    }
}
