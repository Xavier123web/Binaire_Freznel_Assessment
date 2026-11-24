import { render } from 'ink';
import { App } from './ui/App.jsx';
import { AuthService } from './core/AuthService.js';
if (!process.stdin.isTTY) {
    console.error('This app must be run in an interactive terminal.');
    process.exit(1);
}
const ENTER_ALT = '\x1b[?1049h\x1b[H';
const LEAVE_ALT = '\x1b[?1049l';
const auth = AuthService.fromEnv();
process.stdout.write(ENTER_ALT);
try {
    const app = render(<App auth={auth} skipAuth={process.argv.includes('--no-auth')}/>);
    await app.waitUntilExit();
}
finally {
    process.stdout.write(LEAVE_ALT);
}
