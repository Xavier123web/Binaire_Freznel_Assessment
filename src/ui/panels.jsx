import { Box, Text } from 'ink';
import { fit, padL, fmtBytes, fmtRate, fmtShort, gradient } from '../utils/format.js';
import { Bar, Graph, Panel } from './widgets.jsx';
/* ---------- CPU ---------- */
export function CpuPanel(p) {
    const inner = p.width - 2;
    const infoW = Math.min(30, Math.floor(inner / 2));
    const graphW = inner - infoW - 1;
    const avail = p.height - 2;
    const { cpu, gpu } = p.snap;
    const barW = infoW - 4 - 4 - 6; // label + pct + temp
    const coreLines = Math.max(0, avail - (avail >= 5 ? 4 : 2));
    const line = (label, pct, temp) => (<Text wrap="truncate" key={label}>
      {fit(label, 4)}<Bar pct={pct} width={barW}/>{padL(`${Math.round(pct)}%`, 4)}{temp != null ? padL(`${Math.round(temp)}°C`, 6) : ''}
    </Text>);
    return (<Panel title="cpu" right={`${p.right}`} width={p.width} height={p.height}>
      <Box>
        <Box width={graphW} marginRight={1}>
          <Graph values={p.history.last(graphW)} width={graphW} height={avail} max={100}/>
        </Box>
        <Box flexDirection="column" width={infoW}>
          <Text color="#e0e0e0" wrap="truncate">{fit(`${cpu.model} ${cpu.ghz.toFixed(1)}GHz`, infoW)}</Text>
          {line('CPU', cpu.total, cpu.temp)}
          {cpu.perCore.slice(0, coreLines - 1).map((c, i) => line(`C${i}`, c, cpu.coreTemps[i]))}
          {avail >= 5 && <Text wrap="truncate">{fit(`Load AVG: ${cpu.loadAvg.toFixed(2)}`, infoW)}</Text>}
          {avail >= 5 && (<Text wrap="truncate">{fit(`GPU ${gpu.load != null ? `${Math.round(gpu.load)}%` : 'n/a'}${gpu.temp != null ? ` ${Math.round(gpu.temp)}°C` : ''}`, infoW)}</Text>)}
        </Box>
      </Box>
    </Panel>);
}
/* ---------- MEM ---------- */
export function MemPanel(p) {
    const inner = p.width - 2;
    const m = p.snap.mem;
    const barW = Math.max(0, inner - 7 - 10);
    const row = (label, bytes, total) => (<Text wrap="truncate" key={label}>
      {fit(label, 7)}{padL(fmtBytes(bytes), 10)}{' '}<Bar pct={total ? (bytes / total) * 100 : 0} width={barW - 1}/>
    </Text>);
    return (<Panel title="mem" width={p.width} height={p.height}>
      <Text wrap="truncate">{fit('Total:', 7)}{padL(fmtBytes(m.total), 10)}</Text>
      {row('Used', m.used, m.total)}
      {row('Avail', m.available, m.total)}
      {row('Cache', m.cached, m.total)}
      {m.swapTotal > 0 && row('Swap', m.swapUsed, m.swapTotal)}
    </Panel>);
}
/* ---------- DISKS ---------- */
export function DiskPanel(p) {
    const inner = p.width - 2;
    const rows = p.snap.disks.slice(0, p.height - 2);
    return (<Panel title="disks" width={p.width} height={p.height}>
      {rows.map(d => {
            const tail = ` ${padL(`${Math.round(d.use)}%`, 4)} ${padL(fmtBytes(d.size), 9)}`;
            const nameW = Math.min(10, Math.max(4, Math.floor(inner / 4)));
            return (<Text wrap="truncate" key={d.mount}>
            {fit(d.mount.length > nameW ? '…' + d.mount.slice(-(nameW - 1)) : d.mount, nameW)}<Bar pct={d.use} width={Math.max(0, inner - nameW - tail.length)}/>{tail}
          </Text>);
        })}
    </Panel>);
}
/* ---------- NET ---------- */
export function NetPanel(p) {
    const inner = p.width - 2;
    const gh = p.height - 2 - 2;
    const n = p.snap.net;
    const max = Math.max(1024, ...p.down.last(inner), ...p.up.last(inner));
    const downH = gh >= 2 ? Math.ceil(gh / 2) : gh;
    const upH = gh - downH;
    return (<Panel title="net" right={n.iface} width={p.width} height={p.height}>
      {downH > 0 && <Graph values={p.down.last(inner)} width={inner} height={downH} max={max} color="#4fc3f7"/>}
      {upH > 0 && <Graph values={p.up.last(inner)} width={inner} height={upH} max={max} color="#ba68c8"/>}
      <Text wrap="truncate" color="#4fc3f7">{fit(`▼ ${fmtRate(n.rx)}  total ${fmtBytes(n.rxTotal)}`, inner)}</Text>
      <Text wrap="truncate" color="#ba68c8">{fit(`▲ ${fmtRate(n.tx)}  total ${fmtBytes(n.txTotal)}`, inner)}</Text>
    </Panel>);
}
/* ---------- PROCESSES ---------- */
export function ProcPanel(p) {
    const inner = p.width - 2;
    const wide = inner >= 64;
    const mid = inner >= 48;
    const W = { pid: 7, name: 16, user: 10, mem: 6, cpu: 6 };
    const fixed = W.pid + W.name + W.mem + W.cpu + (mid ? W.user : 0) + 4 + (mid ? 1 : 0);
    const cmdW = wide ? Math.max(0, inner - fixed - 1) : 0;
    const nameW = wide ? W.name : Math.max(6, inner - W.pid - W.mem - W.cpu - (mid ? W.user : 0) - 4 - (mid ? 1 : 0));
    const visible = Math.max(0, p.height - 2 - 1);
    const offset = Math.max(0, Math.min(p.selIdx - Math.floor(visible / 2), p.rows.length - visible));
    const slice = p.rows.slice(offset, offset + visible);
    const arrow = p.query.reverse ? '↑' : '↓';
    const mark = (k, label) => (p.query.sortKey === k ? `${label}${arrow}` : label);
    const head = `${padL(mark('pid', 'Pid:'), W.pid)} ${fit(mark('name', 'Program:'), nameW)} ` +
        (mid ? `${fit('User:', W.user)} ` : '') + (wide ? `${fit('Command:', cmdW)} ` : '') +
        `${padL(mark('mem', 'MemB'), W.mem)} ${padL(mark('cpu', 'Cpu%'), W.cpu)}`;
    return (<Panel title="proc" right={`${p.rows.length ? p.selIdx + 1 : 0}/${p.total}`} width={p.width} height={p.height}>
      <Text bold color="#e0e0e0" wrap="truncate">{fit(head, inner)}</Text>
      {slice.map((r, i) => {
            const selected = offset + i === p.selIdx;
            const left = `${padL(String(r.pid), W.pid)} ${fit(r.name, nameW)} ` +
                (mid ? `${fit(r.user, W.user)} ` : '') + (wide ? `${fit(r.command, cmdW)} ` : '') +
                `${padL(fmtShort(r.memBytes), W.mem)} `;
            return (<Text key={r.pid} inverse={selected} wrap="truncate">
            {left}<Text color={selected ? undefined : gradient(r.cpu)}>{padL(r.cpu.toFixed(1), W.cpu)}</Text>
          </Text>);
        })}
    </Panel>);
}
