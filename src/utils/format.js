const UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
export function fmtBytes(n) {
    let v = Math.max(0, n);
    let i = 0;
    while (v >= 1024 && i < UNITS.length - 1) {
        v /= 1024;
        i++;
    }
    return `${v >= 100 || i === 0 ? v.toFixed(0) : v.toFixed(1)} ${UNITS[i]}`;
}
export function fmtShort(n) {
    const u = ['B', 'K', 'M', 'G', 'T'];
    let v = Math.max(0, n);
    let i = 0;
    while (v >= 1024 && i < u.length - 1) {
        v /= 1024;
        i++;
    }
    return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)}${u[i]}`;
}
export const fmtRate = (n) => `${fmtBytes(n)}/s`;
export function fmtUptime(sec) {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const p = (x) => String(x).padStart(2, '0');
    return `up ${d > 0 ? `${d}d ` : ''}${p(h)}:${p(m)}:${p(s)}`;
}
/** Truncate or right-pad to exactly `w` chars. */
export function fit(s, w) {
    if (w <= 0)
        return '';
    return s.length > w ? s.slice(0, w) : s.padEnd(w);
}
export const padL = (s, w) => (s.length > w ? s.slice(0, w) : s.padStart(w));
export function gradient(pct) {
    if (pct < 50)
        return '#5fd75f';
    if (pct < 80)
        return '#d7d75f';
    return '#ff5f5f';
}
