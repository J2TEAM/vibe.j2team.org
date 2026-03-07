/* oxlint-disable */
 
 
// we can only communicate with java using this queue, can't call anything directly
// the java side will poll for events in a separate thread
export class EventQueue {
    promise = null;
    resolvePromise = null;
    started = false;
    queue = [];
    // Batch events for better performance

    constructor() {
        this.refreshPromise();
    }

    refreshPromise() {
        this.promise = new Promise(r => {this.resolvePromise = r;});
    }

    queueEvent(evt, skipIfExists=null) {
        if (!this.started) return;
        if (skipIfExists && this.queue.some(skipIfExists)) {
            return;
        }
        this.queue.push(evt);
        
        // Resolve immediately for lowest latency
        if (this.resolvePromise) {
            this.resolvePromise(true);
            this.resolvePromise = null;
        }
    }

    // Batch queue multiple events at once for better performance
    queueEvents(events) {
        if (!this.started) return;
        this.queue.push(...events);
        if (this.resolvePromise) {
            this.resolvePromise(true);
            this.resolvePromise = null;
        }
    }

    async waitForEvent() {
        this.started = true;
        
        // Keep waiting until we have an event
        while (this.queue.length === 0) {
            await this.promise;
            this.refreshPromise();
        }
        
        return this.queue.shift();
    }

    // Get queue length for debugging/monitoring
    get length() {
        return this.queue.length;
    }
}
