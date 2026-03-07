/* oxlint-disable */
 
 
let workerPromise = null;
let workerClient = null;

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

async function loadWorker() {
    const worker = new Worker(new URL('./worker.js', import.meta.url));
    workerClient = new CmdClient(worker);

    const module = await WebAssembly.compileStreaming(
        fetch(new URL('./transcode.wasm', import.meta.url))
    );

    await workerClient.send({cmd: 'init', module});
    return;
}

function ensure() {
    // lazy load but avoid race conditions and loading the worker twice

    if (!workerPromise) {
        workerPromise = loadWorker();
    }

    return workerPromise;
}

export async function transcode(data) {
    await ensure();

    return await workerClient.send({cmd: 'transcode', data}, [data]);
}