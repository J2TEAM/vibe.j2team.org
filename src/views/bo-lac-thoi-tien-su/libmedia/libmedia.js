/* oxlint-disable */
 
 
import { transcode } from "./transcode/transcode.js"


export class LibMedia {
    constructor() {

    }

    async init() {

    }


    async close() {
        // close players?
    }

    createMediaPlayer() {
        return new MediaPlayer();
    }

}


function unlockMediaElement(mediaElement) {
    const b = document.body;
    const events = ['touchstart','touchend', 'mousedown','keydown'];
    events.forEach(e => b.addEventListener(e, unlock, false));
    function unlock() {
        console.log('muted: unmuting');
        mediaElement.muted = false;
        events.forEach(e => b.removeEventListener(e, unlock));
    }
}




function setMediaBlob(mediaElement, blob, tag) {
    // why the HELL isn't this possible with srcObject???
    // tests show that we can NEVER revoke the object url, not even after
    // receiving the "ended" event.
    // possible workaround would be to

    if (mediaElement.src && mediaElement.src.startsWith('blob:')) {
        URL.revokeObjectURL(mediaElement.src);
    }

    const objectUrl = URL.createObjectURL(blob);
    console.log('objurl: creatin', tag, objectUrl);

    const cleanup = (e) => {
        console.log('objurl: removin', tag, objectUrl);
        URL.revokeObjectURL(objectUrl);
        mediaElement.removeEventListener('loadeddata', cleanup);
        mediaElement.removeEventListener('error', cleanup);
    };

    mediaElement.addEventListener('loadeddata', cleanup);
    mediaElement.addEventListener('error', cleanup);
    mediaElement.src = objectUrl;
}


const mp3Types = [
    'audio/mp3',
    'audio/mpeg3',
    'audio/x-mp3',
    'audio/x-mpeg-3',
    'audio/x-mpeg3'
];

export class MediaPlayer extends EventTarget {
    static snapshotCtx = null;
    static _finalizer = new FinalizationRegistry(objectUrl => {
        console.warn('closing mediaplayer via finalizer');
        URL.revokeObjectURL(objectUrl);
    });

    constructor() {
        super();

        // Create a MediaSource and a hidden video element.

        this.mediaElement = document.createElement("video");
        this.mediaElement.controls = true;
        // Hide video element by default (only audio will be played).
        this.mediaElement.style.display = "none";

        // Listen for media ending to dispatch an event.
        this.mediaElement.addEventListener("playing", () => {
            this.maybeSetupFrameDisplay();
        });

        this.mediaElement.addEventListener("waiting", () => {
            this.stopFrameDisplay();
        });
        this.mediaElement.addEventListener("pause", () => {
            this.stopFrameDisplay();
        });


        // Listen for media ending to dispatch an event.
        this.mediaElement.addEventListener("ended", () => {
            this.stopFrameDisplay();
            this.dispatchEvent(new Event("end-of-media"));
        });


        // Video drawing configuration (for canvas)
        this.videoCtx = null;
        this.videoX = 0; this.videoY = 0;
        this.videoW = 0; this.videoH = 0;
        this.videoFullscreen = false;
        this.videoAnimationFrame = null; // lateron should use request video frame callback
        // not widely available yet
        this.onVideoFramePainter = null;

        // tests show that we don't need to attach this element to the body
        // that's good, otherwise we'd need a finalizer [for this object]
        // that detaches it
    }

    // this returns a boolean, doesn't throw
    async load(buffer, contentType = null) {
        let blob = null;
        let ti = buffer.byteLength;

        if (mp3Types.includes(contentType)) {
            blob = new Blob([buffer], { type: "audio/mp3" });
        } else {
            const transcoded = await transcode(buffer);
            if (transcoded) {
                blob = new Blob([transcoded], { type: "video/mp4" });
            }
        }

        if (blob) {
            const mediaElement = this.mediaElement;
            const promise =  new Promise(resolve => {
                const hander = e => {
                    mediaElement.removeEventListener('loadedmetadata', hander);
                    mediaElement.removeEventListener('error', hander);

                    resolve(e.type === 'loadedmetadata');
                };

                mediaElement.addEventListener('loadedmetadata', hander);
                mediaElement.addEventListener('error', hander);
            });

            this.objectUrl = URL.createObjectURL(blob);
            this.constructor._finalizer.register(this, this.objectUrl, this);
            this.mediaElement.src = this.objectUrl;

            return await promise;
        } else {
            return false;
        }
    }


    maybeSetupFrameDisplay() {
        const isPlaying = !this.mediaElement.paused && this.mediaElement.readyState > 2;
        if (isPlaying && this.videoCtx) {
            this._drawVideoFrame();
        }
    }

    stopFrameDisplay() {
        if (this.videoAnimationFrame) {
            cancelAnimationFrame(this.videoAnimationFrame);
            this.videoAnimationFrame = null;
        }
    }

    _drawVideoFrame() {
        if (!this.videoCtx) return;
        try {
            const videoWidth = this.mediaElement.videoWidth;
            const videoHeight = this.mediaElement.videoHeight;

            if (this.videoFullscreen) {
                const canvasWidth = this.videoCtx.canvas.width;
                const canvasHeight = this.videoCtx.canvas.height;

                const canvasAspectRatio = canvasWidth / canvasHeight;
                const videoAspectRatio = videoWidth / videoHeight;

                let drawWidth, drawHeight, drawX, drawY;

                if (videoAspectRatio > canvasAspectRatio) {
                  drawWidth = canvasWidth;
                  drawHeight = canvasWidth / videoAspectRatio;
                  drawX = 0;
                  drawY = (canvasHeight - drawHeight) / 2;
                } else {
                  drawHeight = canvasHeight;
                  drawWidth = canvasHeight * videoAspectRatio;
                  drawX = (canvasWidth - drawWidth) / 2;
                  drawY = 0;
                }

                this.videoCtx.drawImage(this.mediaElement, drawX, drawY, drawWidth, drawHeight);
            } else {
                this.videoCtx.drawImage(this.mediaElement, this.videoX, this.videoY, this.videoW || videoWidth, this.videoH || videoHeight);
            }

            this.onVideoFramePainter();
        } catch (e) {
            console.error("Error drawing video frame", e);
        }
        this.videoAnimationFrame = requestAnimationFrame(() => this._drawVideoFrame());
    }

    async play() {
        try {
            await this.mediaElement.play();
        } catch(e) {
            if (e.name == 'NotAllowedError') {
                console.log('playing muted');
                this.mediaElement.muted = true;
                unlockMediaElement(this.mediaElement);

                // might be.. interrupted
                try {
                    await this.mediaElement.play();
                } catch (e) {}
            }
        }

    }

    pause() {
        this.mediaElement.pause();
    }

    stop() {
        this.pause();
        this.mediaElement.currentTime = 0;
    }

    get volume() {
        return this.mediaElement.volume;
    }

    set volume(v) {
        this.mediaElement.volume = v;
    }

    get duration() {
        return this.mediaElement.duration;
    }

    get position() {
        return this.mediaElement.currentTime;
    }

    get videoWidth() {
        return this.mediaElement.videoWidth;
    }

    get videoHeight() {
        return this.mediaElement.videoHeight;
    }

    seek(time) {
        this.mediaElement.currentTime = time;
    }


    configureVideo(ctx, cb, x=0, y=0, w=0, h=0, fullscreen=false) {
        if (ctx) {
            this.videoCtx = ctx;
            this.videoX = x;
            this.videoY = y;
            this.videoFullscreen = fullscreen;
            this.videoW = w; this.videoH = h;
            this.onVideoFramePainter = cb;
            this.maybeSetupFrameDisplay();
        } else {
            // Disable video drawing.
            this.videoCtx = null;
            this.stopFrameDisplay();
        }
    }

    setLooping(loop) {
        this.mediaElement.loop = !!loop;
    }

    close() {
        if (this.objectUrl) {
            URL.revokeObjectURL(this.objectUrl);
        }
        this.constructor._finalizer.unregister(this);
    }

    async getSnapshot(type) {
        if (!this.mediaElement.videoWidth || !this.mediaElement.videoHeight) {
            return null;
        }

        if (!this.constructor.snapshotCtx) {
            const canvas = document.createElement('canvas');
            canvas.width = this.mediaElement.videoWidth;
            canvas.height = this.mediaElement.videoHeight;
            this.constructor.snapshotCtx = canvas.getContext('2d');
        }

        const canvas = this.constructor.snapshotCtx.canvas;
        this.constructor.snapshotCtx.drawImage(this.mediaElement, 0, 0, canvas.width, canvas.height);

        return await new Promise(resolve => {
            canvas.toBlob(
                async (blob) => {
                    resolve(blob ? (await blob.arrayBuffer()) : null);
                },
                type,
                0.9
            );
        });
    }
}





export class FFPlayer extends EventTarget {
    // this MUST be explicitly closed as it holds the audio buffer
    // this is equivalent to a "Clip" class, so only valid for one audio

    static _unregister = ([client, node, gainNode]) => {
        client.send({ cmd: "close" });
        node.disconnect();
        gainNode.disconnect();
    };

    static _finalizer = new FinalizationRegistry(args => {
        console.warn('closing ffplayer via finalizer');

        this._unregister(args);
    });

    constructor(audioContext, destination) {
        super();

        this.gainNode = audioContext.createGain();
        this.gainNode.gain.value = 1;

        this.gainNode.connect(destination);

        this.node = new AudioWorkletNode(audioContext, 'ff-player', {
            outputChannelCount: [2]
        });
        this.node.connect(this.gainNode);
        this.client = new CmdClient(this.node.port);

        const weakThis = new WeakRef(this); // it got crazy pretty fast..

        this.node.port.onmessage = e => {
            if (e.data?.replyFor) return; // these are for client.. should we use cancel?

            if (e.data === 'end-of-media') {
                console.log('dispatchin eom');

                weakThis.deref()?.dispatchEvent(new Event('end-of-media'));
            }
        };

        this.duration = 0;

        this.loaded = false;

        FFPlayer._finalizer.register(this, [this.client, this.node, this.gainNode], this);
    }

    // this is just relays the promise
    send(what, transfer = []) {
        return this.client.send(what, transfer);
    }

    async load(buffer, contentType = null) {
        const duration = await this.send({ cmd: "load", buffer, contentType }); //hmm, no transfer.. we're not sure
        this.duration = duration;

    }


    play() {
        this.send({ cmd: "play" });
    }

    loop(times) {
        this.send({ cmd: "loop", times });
    }

    stop() {
        this.send({ cmd: "stop" });
    }


    // async
    getPosition() {
        return this.send({ cmd: "getPosition" });
    }

    seek(pos) {
        return this.send({ cmd: "seek", pos });
    }

    close() {
        FFPlayer._unregister([this.client, this.node, this.gainNode]);
        FFPlayer._finalizer.unregister(this);
    }

    get volume() {
        return this.gainNode.gain.value;
    }

    set volume(v) {
        this.gainNode.gain.value = v;
    }
}
