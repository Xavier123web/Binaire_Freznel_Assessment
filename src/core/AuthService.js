import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, } from 'firebase/auth';
/** Thin wrapper over Firebase Auth (email/password). */
export class AuthService {
    app;
    auth;
    constructor(config) {
        if (config) {
            this.app = initializeApp(config);
            this.auth = getAuth(this.app);
        }
    }
    static fromEnv() {
        try {
            process.loadEnvFile('.env');
        }
        catch (err) {
            if (!(err instanceof Error) || !('code' in err) || err.code !== 'ENOENT')
                throw err;
        }
        const e = process.env;
        const ok = e.FIREBASE_API_KEY && e.FIREBASE_AUTH_DOMAIN && e.FIREBASE_PROJECT_ID && e.FIREBASE_APP_ID;
        return new AuthService(ok ? {
            apiKey: e.FIREBASE_API_KEY, authDomain: e.FIREBASE_AUTH_DOMAIN,
            projectId: e.FIREBASE_PROJECT_ID, appId: e.FIREBASE_APP_ID,
        } : null);
    }
    get isConfigured() { return !!this.auth; }
    async signUp(email, password) {
        return this.run(async (a) => (await createUserWithEmailAndPassword(a, email, password)).user.email ?? email);
    }
    async signIn(email, password) {
        return this.run(async (a) => (await signInWithEmailAndPassword(a, email, password)).user.email ?? email);
    }
    async signOut() { if (this.auth)
        await signOut(this.auth); }
    async run(fn) {
        if (!this.auth)
            throw new Error('Firebase is not configured. Fill in .env (see README).');
        try {
            return await fn(this.auth);
        }
        catch (err) {
            throw new Error(AuthService.friendly(err));
        }
    }
    static friendly(err) {
        const code = typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string'
            ? err.code
            : '';
        const map = {
            'auth/invalid-email': 'Invalid email address.',
            'auth/missing-password': 'Enter a password.',
            'auth/weak-password': 'Password must be at least 6 characters.',
            'auth/email-already-in-use': 'Account already exists. Sign in instead.',
            'auth/invalid-credential': 'Wrong email or password.',
            'auth/user-not-found': 'No account for this email.',
            'auth/wrong-password': 'Wrong email or password.',
            'auth/too-many-requests': 'Too many attempts. Try again later.',
            'auth/network-request-failed': 'Network error. Check your connection.',
            'auth/operation-not-allowed': 'Enable Email/Password in Firebase console.',
        };
        return map[code] ?? (err instanceof Error ? err.message : 'Authentication failed.');
    }
}
