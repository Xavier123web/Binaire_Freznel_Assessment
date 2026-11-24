import { useState } from 'react';
import { AuthScreen } from './AuthScreen.jsx';
import { Dashboard } from './Dashboard.jsx';
export function App({ auth, skipAuth }) {
    const [user, setUser] = useState(skipAuth ? 'dev' : null);
    if (!user)
        return <AuthScreen auth={auth} onAuthed={setUser}/>;
    return <Dashboard email={user} onLogout={() => { void auth.signOut(); setUser(null); }}/>;
}
