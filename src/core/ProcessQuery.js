/** Immutable sort + filter description applied to the process list. */
export class ProcessQuery {
    sortKey;
    reverse;
    filter;
    constructor(sortKey = 'cpu', reverse = false, filter = '') {
        this.sortKey = sortKey;
        this.reverse = reverse;
        this.filter = filter;
    }
    withSort(key) {
        return key === this.sortKey ? this.toggleReverse() : new ProcessQuery(key, false, this.filter);
    }
    toggleReverse() { return new ProcessQuery(this.sortKey, !this.reverse, this.filter); }
    withFilter(f) { return new ProcessQuery(this.sortKey, this.reverse, f); }
    apply(rows) {
        const f = this.filter.toLowerCase();
        const out = f
            ? rows.filter(r => r.name.toLowerCase().includes(f) || r.command.toLowerCase().includes(f) ||
                r.user.toLowerCase().includes(f) || String(r.pid).includes(f))
            : rows.slice();
        const dir = this.reverse ? -1 : 1;
        return out.sort((a, b) => dir * this.compare(a, b));
    }
    compare(a, b) {
        switch (this.sortKey) {
            case 'cpu': return b.cpu - a.cpu;
            case 'mem': return b.memBytes - a.memBytes;
            case 'pid': return a.pid - b.pid;
            case 'name': return a.name.localeCompare(b.name);
        }
    }
}
