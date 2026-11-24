import { Box, Text } from 'ink';
import { gradient } from '../utils/format.js';
const BORDER = '#6c7a89';
/** Bordered panel with the title embedded in the top border (btop style). */
export function Panel(p) {
    const color = p.color ?? BORDER;
    const left = `╭─┤${p.title}├`;
    const right = p.right ? `┤${p.right}├─╮` : '╮';
    const mid = '─'.repeat(Math.max(0, p.width - left.length - right.length));
    return (<Box flexDirection="column" width={p.width} height={p.height}>
      <Text color={color} wrap="truncate">
        ╭─┤<Text color="#ffffff" bold>{p.title}</Text>├{mid}{p.right ? <>┤<Text color="#ffffff">{p.right}</Text>├─╮</> : '╮'}
      </Text>
      <Box borderStyle="round" borderTop={false} borderColor={color} width={p.width} height={p.height - 1} flexDirection="column" overflow="hidden">
        {p.children}
      </Box>
    </Box>);
}
const BLOCKS = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
/** Pure renderer: values (right-aligned history) -> rows of block characters, top row first. */
export function renderGraph(values, width, height, max) {
    const v = values.slice(-width);
    const cols = [...new Array(Math.max(0, width - v.length)).fill(0), ...v];
    const rows = [];
    for (let r = 0; r < height; r++) {
        const fromBottom = height - 1 - r;
        let line = '';
        for (const val of cols) {
            const total = Math.round(Math.min(1, Math.max(0, val / max)) * height * 8);
            line += BLOCKS[Math.max(0, Math.min(8, total - fromBottom * 8))];
        }
        rows.push(line);
    }
    return rows;
}
export function Graph(p) {
    if (p.width <= 0 || p.height <= 0)
        return null;
    const rows = renderGraph(p.values, p.width, p.height, p.max);
    return (<Box flexDirection="column" width={p.width}>
      {rows.map((r, i) => {
            const frac = ((p.height - 1 - i) + 0.5) / p.height;
            return <Text key={i} color={p.color ?? gradient(frac * 100)} wrap="truncate">{r}</Text>;
        })}
    </Box>);
}
export function Bar(p) {
    const w = Math.max(0, p.width);
    const f = Math.round((Math.min(100, Math.max(0, p.pct)) / 100) * w);
    return (<Text>
      <Text color={p.color ?? gradient(p.pct)}>{'█'.repeat(f)}</Text>
      <Text color="#444444">{'░'.repeat(w - f)}</Text>
    </Text>);
}
