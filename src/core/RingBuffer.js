/** Fixed-capacity numeric history used by graphs. */
export class RingBuffer {
    capacity;
    data = [];
    constructor(capacity) {
        this.capacity = capacity;
    }
    push(v) {
        this.data.push(v);
        if (this.data.length > this.capacity)
            this.data.shift();
    }
    last(n) { return this.data.slice(-n); }
    get latest() { return this.data.length ? this.data[this.data.length - 1] : 0; }
}
