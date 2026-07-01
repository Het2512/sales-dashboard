# Sales Call Intelligence Dashboard

A React dashboard that analyzes kitchen cabinet sales call recordings. Audio is
transcribed and analyzed entirely client-side using the Groq API (Whisper for
transcription, Llama 3.1 8B for analysis). All data — agents, saved calls, deal
records, and the admin password — lives in your browser's `localStorage`; nothing
is sent to a backend server other than Groq's API for transcription/analysis.

---

## What's new in this build

**Fixed (was crashing the app):**
- **Critical crash fixed** — `AnalysisPanel.jsx` referenced a `tabs` array and
  `TAB_LABELS` object that were never defined anywhere in the file. As soon as
  any call finished analyzing, the app threw `ReferenceError: tabs is not
  defined` and the whole screen went blank. This is why analysis results
  weren't viewable. Both are now properly defined.
- **React Hooks-order crash fixed** — a `useEffect` in `AnalysisPanel.jsx` was
  declared *after* early `return` statements, which breaks React's Rules of
  Hooks. Switching between calls with different statuses could throw
  "Rendered fewer hooks than expected this time." Moved above the returns.
- **Transcript accuracy bug fixed** — the Groq transcription request didn't
  set `response_format`, so it defaulted to JSON (`{"text": "..."}"`) instead
  of plain text. The raw JSON wrapper was being stored as the "transcript" and
  fed into the analysis prompt. Now explicitly requests `response_format:
  "text"`.
- **Security fix** — a real Groq API key was hardcoded as a fallback in
  `App.jsx`. Since that file ships in the browser bundle, the key was public
  and extractable via dev tools. Removed; each user now must enter their own
  key via Settings.
- Fixed a version mismatch where `react-is` was pinned to a React 19 range
  while the app uses React 18.

**Added:**
- **Error Boundary** — an uncaught error anywhere in the app now shows a
  friendly recovery screen instead of a blank white page.
- **Download Report** — a button on the Call Analysis header exports the full
  AI analysis (scores, coaching, transcript, everything) as a JSON file.
- **Export CSV** — the Admin Panel's Saved Calls tab can now export all saved
  calls (agent, score, sentiment, outcome, date) as a CSV for reporting.

No visual/UI changes were made beyond the two new buttons above, which reuse
the existing button styles.

---

## How analysis works

The AI is prompted as an **Enterprise AI Conversation Intelligence Assistant**.
Instead of checking whether the agent asked a fixed list of pre-written questions
word-for-word, it understands intent: "What's your budget?", "How much are you
planning to invest?", and "Is there a price range you're targeting?" are all
recognized as discussing Budget, regardless of exact phrasing.

It evaluates five conversation stages — Discovery, Qualification, Solution
Presentation, Objection Handling, and Closing — and also detects customer intent,
buying intent, lead quality, urgency, risk level, decision-maker mentions,
competitor mentions, pricing/budget/timeline discussion, and a probability of
closing, plus coaching feedback (strengths, weaknesses, missed opportunities,
best/weak moments, and a next-best-action recommendation).

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Add your Groq API key
Click the gear icon in the left sidebar inside the app and paste a free API key
from https://console.groq.com. It's stored only in your browser's
`localStorage` (key `groq_api_key`) — never committed to code or sent anywhere
except directly to Groq.

### 3. Run the dev server
```bash
npm run dev
```
Open the local URL Vite prints (typically http://localhost:5173).

---

## Features

- Upload MP3 / WAV / M4A / OGG / FLAC / AAC call recordings — drag & drop or browse
- Analyze one call at a time, or queue all pending calls
- Built-in audio player with scrubbing and playback speed control
- Per-call analysis with these tabs:
  - **Overview** — score, sentiment, outcome, intelligence signals (buying intent,
    lead quality, urgency, closing probability), stage coverage, compliance summary
  - **Coaching** — strengths, weaknesses, missed opportunities, action plan, best/weak moments
  - **Objections** — detected objections with the agent's response and a suggested improvement
  - **Compliance** — checklist (greeting, consent, PII safety, accurate claims, approved discounts) and score
  - **Deal Tracker** — a local opportunity record (value, pipeline stage, next action date) saved per call
  - **Stages** — natural-language summary of how well each of the 5 stages was covered
  - **Transcript** — full transcript with keyword highlighting
  - **Emotions** — emotion breakdown, timeline, and intensity peaks
  - **Dynamics** — talk ratio, dead air, cross-talk, interruptions
- Executive Dashboard and Agent Performance views, fed by calls you save to the database
- Admin Panel (password-protected) for managing agents and saved calls

---

## Admin Panel access

The Admin Panel is protected by a password (not a 4-digit PIN). The default is:

```
admin@123
```

**Change this immediately** via the "Change Password" button inside the Admin
Panel once you log in — the password is stored in `localStorage`
(`admin_password`), so anyone with access to the browser's dev tools can read
it. This is fine for a local/demo tool but is not suitable for handling
sensitive data in a shared or production environment without a real backend
and authentication layer.

---

## Known limitations

- All data is local to the browser — clearing site data/localStorage erases
  agents, saved calls, deal records, and the admin password (resets to default).
- The "Deal Tracker" tab is a local record, not a live Salesforce/HubSpot sync —
  there is no external CRM integration in this build.
- Role selection (Agent / Manager / Admin) in the header only changes which
  dashboard widgets are shown; it is not tied to a real login, so it does not
  restrict data access between roles.
- Audio transcription quality depends on Groq's Whisper model and the source
  recording quality (background noise, overlapping speakers, etc. will reduce accuracy).

---

## Tech Stack

- React 18 + Vite 7
- Groq API — `whisper-large-v3-turbo` (transcription) + `llama-3.1-8b-instant` (analysis)
- Recharts for charts
- Tabler Icons
