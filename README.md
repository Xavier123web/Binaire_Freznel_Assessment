# Binaire-FreznelAI-Assessment — System Tasks & Sensor Viewer (TUI)

JavaScript and React terminal app (not a browser app).

| Concern | Library |
|---|---|
| UI | `ink` (React for terminals) |
| System tasks & sensors | `systeminformation` |
| Auth | `firebase` (Email/Password) |
| JSX runtime | `tsx` |

OOP structure: `SystemMonitor` (polling + history), `RingBuffer`, `ProcessQuery` (sort/filter), `AuthService` (Firebase wrapper); React components only render.

## Setup
1. Use Node.js 20.12 or newer, then run `npm install`.
2. In Firebase, create a project, enable **Email/Password** under Authentication, and add a Web app.
3. Copy `.env.example` to `.env` and fill in the Web app's `apiKey`, `authDomain`, `projectId`, and `appId`.
4. Run `npm start` in a terminal. `npm run dev` skips sign-in for local development.

`.env` is ignored by git. The Firebase Web app config is required for sign-in and sign-up.

## Keys
Sign-in: `tab` switch field · `enter` submit · `ctrl+n` sign in/up · `ctrl+c` quit
Dashboard: `↑↓/jk` select · `PgUp/PgDn` · `g/G` top/bottom · `/` filter (`esc` clears) · `c m p n` sort by cpu/mem/pid/name · `r` reverse · `x` kill (y/n) · `+/-` refresh rate · `l` logout · `q` quit

Resizing the terminal re-lays out all panels (min 60×18).

## Submission
The brief gives two repository names: `Binaire-FreznelAI-Assessment` for the fork and
`Binaire_Freznel_Assessment` for the final upload. Confirm which one the evaluator expects
before publishing.
