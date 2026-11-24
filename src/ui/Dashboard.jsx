import { useEffect, useMemo, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { SystemMonitor } from '../core/SystemMonitor.js';
import { ProcessQuery } from '../core/ProcessQuery.js';
import { fmtUptime, fit } from '../utils/format.js';
import { useTerminalSize } from './useTerminalSize.jsx';
import { CpuPanel, MemPanel, DiskPanel, NetPanel, ProcPanel } from './panels.jsx';
export function Dashboard({ email, onLogout }) {
    const { columns, rows } = useTerminalSize();
    const { exit } = useApp();
    const monitor = useMemo(() => new SystemMonitor(), []);
    const [snap, setSnap] = useState(null);
    const [intervalMs, setIntervalMs] = useState(1000);
    const [query, setQuery] = useState(() => new ProcessQuery());
    const [selPid, setSelPid] = useState(null);
    const [mode, setMode] = useState('normal');
    const [notice, setNotice] = useState('');
    useEffect(() => {
        const onUpdate = (s) => setSnap(s);
        monitor.on('update', onUpdate);
        monitor.on('failure', () => setNotice('sensor read failed'));
        void monitor.start(1000);
        return () => { monitor.off('update', onUpdate); monitor.stop(); };
    }, [monitor]);
    useEffect(() => {
        if (!notice)
            return;
        const t = setTimeout(() => setNotice(''), 3000);
        return () => clearTimeout(t);
    }, [notice]);
    const list = useMemo(() => (snap ? query.apply(snap.procs) : []), [snap, query]);
    const idx = Math.max(0, list.findIndex(p => p.pid === selPid));
    const selected = list[idx];
    const move = (d) => {
        if (!list.length)
            return;
        setSelPid(list[Math.max(0, Math.min(list.length - 1, idx + d))].pid);
    };
    const H = rows - 2; // panels area (1 line footer + 1 spare to avoid scroll)
    const page = Math.max(1, H - 8);
    useInput((input, key) => {
        if (mode === 'filter') {
            if (key.return || key.escape)
                return setMode('normal');
            if (key.backspace || key.delete)
                return setQuery(q => q.withFilter(q.filter.slice(0, -1)));
            if (input && !key.ctrl && !key.meta)
                setQuery(q => q.withFilter(q.filter + input));
            return;
        }
        if (mode === 'kill') {
            if (input.toLowerCase() === 'y' && selected) {
                try {
                    process.kill(selected.pid, 'SIGTERM');
                    setNotice(`SIGTERM sent to ${selected.pid}`);
                }
                catch (e) {
                    setNotice(`kill failed: ${e.message}`);
                }
            }
            return setMode('normal');
        }
        if (input === 'q')
            return exit();
        if (input === 'l')
            return onLogout();
        if (key.upArrow || input === 'k')
            return move(-1);
        if (key.downArrow || input === 'j')
            return move(1);
        if (key.pageUp)
            return move(-page);
        if (key.pageDown)
            return move(page);
        if (input === 'g')
            return move(-list.length);
        if (input === 'G')
            return move(list.length);
        if (input === '/')
            return setMode('filter');
        if (key.escape)
            return setQuery(q => q.withFilter(''));
        if (input === 'c')
            return setQuery(q => q.withSort('cpu'));
        if (input === 'm')
            return setQuery(q => q.withSort('mem'));
        if (input === 'p')
            return setQuery(q => q.withSort('pid'));
        if (input === 'n')
            return setQuery(q => q.withSort('name'));
        if (input === 'r')
            return setQuery(q => q.toggleReverse());
        if (input === 'x' && selected)
            return setMode('kill');
        if (input === '+' || input === '=')
            return setIntervalMs(monitor.setInterval(intervalMs + 250));
        if (input === '-')
            return setIntervalMs(monitor.setInterval(intervalMs - 250));
    });
    if (columns < 60 || rows < 18) {
        return <Text color="yellow">Terminal too small ({columns}x{rows}). Need at least 60x18.</Text>;
    }
    if (!snap)
        return <Text color="cyan">Reading sensors…</Text>;
    const topH = Math.max(7, Math.min(14, Math.floor(H * 0.35)));
    const botH = H - topH;
    const leftW = Math.floor(columns * 0.38);
    const rightW = columns - leftW;
    const memH = botH >= 16 ? 8 : 6;
    let diskH = Math.min(snap.disks.length + 2, 6);
    let netH = botH - memH - diskH;
    if (netH < 6) {
        diskH = botH - memH;
        netH = 0;
    }
    const time = new Date(snap.timestamp).toLocaleTimeString('en-GB');
    const bat = snap.battery ? `BAT ${Math.round(snap.battery.percent)}%${snap.battery.charging ? '+' : ''}` : '';
    const topRight = [bat, fmtUptime(snap.uptime), time, `${intervalMs}ms`].filter(Boolean).join(' ');
    let footer;
    if (mode === 'filter')
        footer = <Text color="cyan">filter: {query.filter}█  <Text color="gray">(enter/esc to close)</Text></Text>;
    else if (mode === 'kill')
        footer = <Text color="red">Kill PID {selected?.pid} ({selected?.name})? y/n</Text>;
    else if (notice)
        footer = <Text color="yellow">{notice}</Text>;
    else
        footer = (<Text color="gray" wrap="truncate">
      {fit(`↑↓ select  / filter  c cpu  m mem  p pid  n name  r reverse  x kill  +/- rate  l logout(${email})  q quit`, columns)}
    </Text>);
    return (<Box flexDirection="column" width={columns} height={rows - 1}>
      <CpuPanel width={columns} height={topH} snap={snap} history={monitor.cpuHistory} right={topRight} intervalMs={intervalMs}/>
      <Box height={botH}>
        <Box flexDirection="column" width={leftW}>
          <MemPanel width={leftW} height={memH} snap={snap}/>
          <DiskPanel width={leftW} height={diskH} snap={snap}/>
          {netH > 0 && <NetPanel width={leftW} height={netH} snap={snap} down={monitor.netDown} up={monitor.netUp}/>}
        </Box>
        <ProcPanel width={rightW} height={botH} rows={list} selIdx={idx} query={query} total={snap.procs.length}/>
      </Box>
      <Box height={1}>{footer}</Box>
    </Box>);
}
