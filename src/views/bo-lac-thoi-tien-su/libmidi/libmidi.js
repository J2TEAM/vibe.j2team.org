/* oxlint-disable */
 
 
// helpers

export function unlockAudioContext(audioCtx) {
    if (audioCtx.state !== 'suspended') return;
    const b = document.body;
    const events = ['touchstart','touchend', 'mousedown','keydown'];
    events.forEach(e => b.addEventListener(e, unlock, false));
    function unlock() { audioCtx.resume().then(clean); }
    function clean() { events.forEach(e => b.removeEventListener(e, unlock)); }
}

export function createUnlockingAudioContext(...params) {
    const ac = new AudioContext(...params); // params?
    unlockAudioContext(ac);
    return ac;
}

export function closeContext(ctx) {
    return ctx.close();
}

export class LibMidi {
    constructor(context, destination=null) {
        this.context = context;
        this.destination = destination || context.destination;
        this.initialized = false;

        this._midiPlayer = null;

        // we should have only one midiplayer initialized on demand, clients just use setsequence
        // however, end-of-media events will be delivered to all listeners

    }

    async init() {
        if (!this.context.audioWorklet) {
            this.initialized = true;
            return;
        }

        const addModuleTask = this.context.audioWorklet.addModule(new URL('worklet.js', import.meta.url).toString());

        const module = await WebAssembly.compileStreaming(fetch(new URL('libmidi.wasm', import.meta.url)));

        await addModuleTask;

        // since we can't directly message the module.. yet
        const bootstrapNode = new AudioWorkletNode(this.context, "bootstrap", {
            processorOptions: {
                module
            }
        });

        await new Promise((resolve, reject) => {
            bootstrapNode.port.onmessage = e => {
                if (e.data.ok) {
                    resolve();
                } else {
                    reject(e.data.error);
                }
            };
        });

        this.initialized = true;
    }


    async close() {
        if (this._midiPlayer) {
            this._midiPlayer.close();
            this._midiPlayer = null;
        }

        this.initialized = false;

        // no context close as context is not ours
        // close players?
    }

    get midiPlayer() {
        if (this.initialized && !this._midiPlayer) {
            this._midiPlayer = new MIDIPlayer(this.context, this.destination);
        }

        return this._midiPlayer;
    }
}


// todo: we could make this bidirectional with methods and events, but at this point no need to do so
class CmdClient {
    constructor(port) {
        this.port = port;
        this.messageCounter = 0;
        this.pendingMessages = {};
        this.port.addEventListener('message', this._handleMessage.bind(this));
    }

    send(what, transfer=[]) {
        const msgId = ++this.messageCounter;
        return new Promise((resolve, reject) => {
            this.pendingMessages[msgId] = { resolve, reject };
            this.port.postMessage({ ...what, msgId }, transfer);
        });
    }

    _handleMessage(event) {
        const data = event.data;
        if (data && data.replyFor) {
            const { replyFor, value, error } = data;
            const handlers = this.pendingMessages[replyFor];

            if (handlers) {
                if (error !== undefined) {
                    handlers.reject(error);
                } else {
                    handlers.resolve(value);
                }
                delete this.pendingMessages[replyFor];
            }
        }
    }
}



export class MIDIPlayer extends EventTarget {
    // this MUST be explicitly closed
    // but only one instance is needed to emulate a MIDI device

    static _unregister = ([client, node, gainNode]) => {
        client.send({cmd: "delete"});
        node.disconnect();
        gainNode.disconnect();
    };

    static _finalizer = new FinalizationRegistry(args => {
        console.warn('closing midiplayer via finalizer');

        this._unregister(args);
    });


    constructor(audioContext, destination) {
        super();

        if (!audioContext.audioWorklet || typeof AudioWorkletNode === 'undefined') {
            return;
        }

        this.gainNode = audioContext.createGain();
        this.gainNode.gain.value = 1;

        this.gainNode.connect(destination);

        this.node = new AudioWorkletNode(audioContext, 'midi-player', {
            outputChannelCount: [2]
        });
        this.node.connect(this.gainNode);
        this.client = new CmdClient(this.node.port);

        const weakThis = new WeakRef(this); // it got crazy pretty fast..

        this.node.port.onmessage = e => {
            if (e.data?.replyFor) return; // these are for client.. should we use cancel?

            if (e.data === 'end-of-media') {
                weakThis.deref()?.dispatchEvent(new Event('end-of-media'));
            }
        };

        this.duration = 0;

        MIDIPlayer._finalizer.register(this, [this.client, this.node, this.gainNode], this);
    }

    // this is just relays the promise
    send(what, transfer=[]) {
        return this.client && this.client.send(what, transfer);
    }

    async setSequence(buffer) {
        const { duration } = await this.send({cmd: "setSequence", buffer}); //hmm, no transfer.. we're not sure
        console.log('duration', duration);
        this.duration = duration;

    }

    play() {
        this.send({cmd: "play"});
    }

    loop(times) {
        this.send({cmd: "loop", times});
    }

    stop() {
        this.send({cmd: "stop"});
    }

    shortEvent(status, data1, data2) {
        this.send({cmd: "shortEvent", status, data1, data2});
    }

    // async
    getPosition() {
        return this.send({cmd: "getPosition"});
    }

    seek(pos) {
        return this.send({cmd: "seek", pos});
    }

    close() {
        MIDIPlayer._unregister([this.client, this.node, this.gainNode]);
        MIDIPlayer._finalizer.unregister(this);
    }

    get volume() {
        return this.gainNode.gain.value;
    }

    set volume(v) {
        this.gainNode.gain.value = v;
    }

}
