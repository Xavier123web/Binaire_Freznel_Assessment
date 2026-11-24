import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useTerminalSize } from './useTerminalSize.jsx';
export function AuthScreen({ auth, onAuthed }) {
    const { columns, rows } = useTerminalSize();
    const [signUp, setSignUp] = useState(false);
    const [field, setField] = useState('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const submit = async () => {
        setBusy(true);
        setError('');
        try {
            onAuthed(signUp ? await auth.signUp(email.trim(), password) : await auth.signIn(email.trim(), password));
        }
        catch (e) {
            setError(e.message);
            setBusy(false);
        }
    };
    useInput((input, key) => {
        if (busy)
            return;
        if (key.ctrl && input === 'n') {
            setSignUp(s => !s);
            setError('');
            return;
        }
        if (key.tab || key.upArrow || key.downArrow) {
            setField(f => (f === 'email' ? 'password' : 'email'));
            return;
        }
        if (key.return) {
            if (field === 'email')
                setField('password');
            else
                void submit();
            return;
        }
        const set = field === 'email' ? setEmail : setPassword;
        if (key.backspace || key.delete) {
            set(v => v.slice(0, -1));
            return;
        }
        if (input && !key.ctrl && !key.meta)
            set(v => v + input);
    });
    const row = (label, value, active, mask = false) => (<Box>
      <Text color={active ? 'cyan' : 'gray'}>{label.padEnd(10)}</Text>
      <Text>{mask ? '•'.repeat(value.length) : value}</Text>
      {active && <Text color="cyan">█</Text>}
    </Box>);
    return (<Box width={columns} height={rows - 1} justifyContent="center" alignItems="center">
      <Box flexDirection="column" borderStyle="round" borderColor="#6c7a89" paddingX={2} paddingY={1} width={Math.min(54, columns)}>
        <Text bold color="#5fd75f">SYSMON · {signUp ? 'Sign up' : 'Sign in'}</Text>
        <Box marginTop={1} flexDirection="column">
          {row('Email', email, field === 'email')}
          {row('Password', password, field === 'password', true)}
        </Box>
        <Box marginTop={1}>
          {!auth.isConfigured && <Text color="red">Firebase not configured — fill .env (see README)</Text>}
          {error && <Text color="red">{error}</Text>}
          {busy && <Text color="yellow">Working…</Text>}
        </Box>
        <Text color="gray">tab switch · enter submit · ctrl+n {signUp ? 'sign in' : 'sign up'} · ctrl+c quit</Text>
      </Box>
    </Box>);
}
