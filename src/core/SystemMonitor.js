import { EventEmitter } from 'node:events';
import * as si from 'systeminformation';
import { RingBuffer } from './RingBuffer.js';
/**
 * Polls the OS through systeminformation and emits 'update' with a Snapshot.
 * Keeps rolling histories for the graphs.
 */
export class SystemMonitor extends EventEmitter {
    cpuHistory = new RingBuffer(600);
    netDown = new RingBuffer(600);
    netUp = new RingBuffer(600);
    timer = null;
    busy = false;
    cpuModel = 'CPU';
    gpuModel = '';
    intervalMs = 1000;
    async start(intervalMs = 1000) {
        this.intervalMs = intervalMs;
        try {
            const [cpu, gfx] = await Promise.all([si.cpu(), si.graphics()]);
            this.cpuModel = `${cpu.manufacturer} ${cpu.brand}`.replace(/\(R\)|\(TM\)|CPU/g, '').replace(/\s+/g, ' ').trim();
            this.gpuModel = gfx.controllers[0]?.model ?? '';
        }
        catch { /* static info is optional */ }
        await this.tick();
        this.schedule();
    }
    setInterval(ms) {
        this.intervalMs = Math.min(5000, Math.max(250, ms));
        this.schedule();
        return this.intervalMs;
    }
    stop() {
        if (this.timer)
            clearInterval(this.timer);
        this.timer = null;
    }
    schedule() {
        if (this.timer)
            clearInterval(this.timer);
        this.timer = setInterval(() => void this.tick(), this.intervalMs);
    }
    async tick() {
        if (this.busy)
            return; // skip overlapping polls
        this.busy = true;
        try {
            const [load, speed, temp, mem, fs, net, procs, bat, gfx] = await Promise.all([
                si.currentLoad(), si.cpuCurrentSpeed(), si.cpuTemperature(), si.mem(),
                si.fsSize(), si.networkStats('*'), si.processes(), si.battery(), si.graphics(),
            ]);
            const live = net.filter(n => n.operstate === 'up' && n.iface !== 'lo');
            const rx = live.reduce((a, n) => a + (n.rx_sec ?? 0), 0);
            const tx = live.reduce((a, n) => a + (n.tx_sec ?? 0), 0);
            const snap = {
                timestamp: Date.now(),
                uptime: si.time().uptime,
                cpu: {
                    model: this.cpuModel, ghz: speed.avg, total: load.currentLoad,
                    perCore: load.cpus.map(c => c.load),
                    temp: temp.main ?? null, coreTemps: temp.cores ?? [], loadAvg: load.avgLoad ?? 0,
                },
                gpu: {
                    model: this.gpuModel,
                    load: gfx.controllers[0]?.utilizationGpu ?? null,
                    temp: gfx.controllers[0]?.temperatureGpu ?? null,
                },
                mem: {
                    total: mem.total, used: mem.active, available: mem.available,
                    cached: mem.buffcache, swapTotal: mem.swaptotal, swapUsed: mem.swapused,
                },
                disks: fs.filter(d => d.size > 0).map(d => ({ mount: d.mount, size: d.size, used: d.used, use: d.use })),
                net: {
                    iface: live[0]?.iface ?? '-', rx, tx,
                    rxTotal: live.reduce((a, n) => a + n.rx_bytes, 0),
                    txTotal: live.reduce((a, n) => a + n.tx_bytes, 0),
                },
                battery: bat.hasBattery ? { percent: bat.percent, charging: bat.isCharging } : null,
                procs: procs.list.map(p => ({
                    pid: p.pid, name: p.name, command: `${p.command} ${p.params}`.trim(),
                    user: p.user, state: p.state, memBytes: p.memRss * 1024, cpu: p.cpu,
                })),
            };
            this.cpuHistory.push(snap.cpu.total);
            this.netDown.push(rx);
            this.netUp.push(tx);
            this.emit('update', snap);
        }
        catch (err) {
            this.emit('failure', err);
        }
        finally {
            this.busy = false;
        }
    }
}
