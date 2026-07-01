import { useState, useRef, useCallback, useEffect } from "react";
import ExecutiveDashboard from "./ExecutiveDashboard";
import AgentPerformance from "./AgentPerformance";
import AnalysisPanel from "./AnalysisPanel";
import AdminPanel, { PinModal } from "./AdminPanel";
import { getAgents, addCall } from "./db";

// Bug fix / security fix: a real Groq API key was hardcoded here as a fallback.
// Since this file ships to the browser in the built bundle, that key was
// effectively public and readable by anyone who opened dev tools — a real
// security exposure, and also means the app was silently spending someone
// else's API quota. Each user must now enter their own key in Settings.
function getGroqKey() { return localStorage.getItem("groq_api_key") || ""; }

// ── Settings Modal ─────────────────────────────────────────────────────────────
function SettingsModal({ onClose }) {
  const [key, setKey] = useState(localStorage.getItem("groq_api_key") || "");
  const save = () => { localStorage.setItem("groq_api_key", key.trim()); onClose(); };
  return (
    <div className="animate-fadein" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div className="glass-card" style={{ padding: 32, width: 460 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>API Configuration</h2>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--text-secondary)" }}>Enter your Groq API key. Get one free at <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={{ color: "var(--accent-blue)" }}>console.groq.com</a></p>
        <input value={key} onChange={e => setKey(e.target.value)} placeholder="gsk_..." style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface-1)", color: "var(--text-primary)", fontSize: 14, marginBottom: 24, boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={save} className="btn-primary">Save Key</button>
        </div>
      </div>
    </div>
  );
}

// ── Save to DB Modal ───────────────────────────────────────────────────────────
function SaveToDBModal({ call, onClose, onSaved }) {
  const [agents, setAgents] = useState([]);
  const [agentId, setAgentId] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const ag = getAgents();
    setAgents(ag);
    if (ag.length) setAgentId(ag[0].id);
  }, []);

  const handleSave = () => {
    addCall({ name: call.name, agentId: agentId || null, analysis: call.analysis, size: call.size });
    setSaved(true);
    setTimeout(() => { onSaved(); onClose(); }, 1200);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div className="glass-card animate-fadein" style={{ padding: 32, width: 440 }}>
        {saved ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <i className="ti ti-circle-check" style={{ fontSize: 56, color: "var(--text-success)", display: "block", marginBottom: 12 }} />
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-success)" }}>Saved to Database!</h3>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <i className="ti ti-device-floppy neon-text-blue" style={{ fontSize: 28 }} />
              <div><h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Save Call to Database</h2><p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>{call.name}</p></div>
            </div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase" }}>Assign to Agent</label>
            {agents.length === 0 ? (
              <div style={{ padding: "16px", borderRadius: 10, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 13, color: "var(--accent-amber)" }}><i className="ti ti-alert-triangle" style={{ marginRight: 6 }} />No agents found. Add agents in the Admin Panel first, or save without assignment.</p>
              </div>
            ) : (
              <select value={agentId} onChange={e => setAgentId(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface-1)", color: "var(--text-primary)", fontSize: 14, marginBottom: 20 }}>
                <option value="">— No Agent —</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
              </select>
            )}
            <div style={{ background: "var(--surface-1)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "var(--text-secondary)" }}>
              Score: <strong style={{ color: "var(--text-primary)" }}>{call.analysis?.overallScore}/100</strong> &nbsp;·&nbsp;
              Sentiment: <strong style={{ color: "var(--text-primary)" }}>{call.analysis?.sentiment}</strong> &nbsp;·&nbsp;
              Outcome: <strong style={{ color: "var(--text-primary)" }}>{call.analysis?.outcome}</strong>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={onClose} className="btn-ghost">Cancel</button>
              <button onClick={handleSave} className="btn-primary"><i className="ti ti-device-floppy" /> Save to DB</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Call Card ──────────────────────────────────────────────────────────────────
function getScoreColor(s) { return s >= 75 ? "var(--text-success)" : s >= 50 ? "var(--text-warning)" : "var(--text-danger)"; }

function CallCard({ call, onClick, isSelected }) {
  const score = call.analysis?.overallScore ?? null;
  const scoreColor = score === null ? "var(--text-muted)" : getScoreColor(score);
  return (
    <div onClick={() => onClick(call)} className="glass-card call-card-hover animate-fadein" style={{ padding: "16px", cursor: "pointer", marginBottom: "8px", background: isSelected ? "var(--glass-light)" : "var(--glass)", border: `1px solid ${isSelected ? "var(--border-accent)" : "var(--border-strong)"}`, boxShadow: isSelected ? "0 0 15px rgba(59,130,246,0.15)" : "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,rgba(59,130,246,0.1),rgba(6,182,212,0.1))", border: "1px solid var(--border-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <i className="ti ti-phone neon-text-blue" style={{ fontSize: 18 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{call.name}</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>{(call.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
        {score !== null && (
          <div className="score-ring">
            <svg width="40" height="40" viewBox="0 0 36 36"><path stroke="var(--border-strong)" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /><path stroke={scoreColor} strokeWidth="3" strokeDasharray={`${score},100`} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /></svg>
            <span style={{ position: "absolute", fontSize: 11, fontWeight: 700, color: scoreColor }}>{score}</span>
          </div>
        )}
      </div>
      {call.status === "pending" && <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>Ready to analyze</p>}
      {call.status === "analyzing" && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div className="waveform"><span /><span /><span /><span /><span /></div><p style={{ margin: 0, fontSize: 12, color: "var(--accent-cyan)", fontWeight: 500 }}>{call.statusMsg || "Analyzing..."}</p></div>}
      {call.status === "done" && <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ flex: 1, height: 6, borderRadius: 99, background: "var(--border-strong)", overflow: "hidden" }}><div style={{ width: `${score}%`, height: "100%", borderRadius: 99, background: scoreColor }} /></div><span style={{ fontSize: 13, fontWeight: 700, color: scoreColor, minWidth: 36, textAlign: "right" }}>{score}%</span></div>}
      {call.status === "error" && <p style={{ margin: 0, fontSize: 12, color: "var(--text-danger)" }}>Analysis failed</p>}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
// Enterprise AI Conversation Intelligence prompt. The model is asked to understand
// the conversation's intent rather than match exact pre-written questions, then map
// its findings into the schema the dashboard renders.
const SYSTEM_PROMPT = `You are an Enterprise AI Conversation Intelligence Assistant analyzing a kitchen cabinet sales call.

Your job is NOT to check whether the sales agent asked predefined questions word-for-word.
Instead, understand the entire conversation naturally. The agent may ask about the same
topic in many different ways. For example, instead of asking "What is your budget?" the
agent might ask "How much are you planning to invest?", "What's your spending range?",
"Have you decided your budget?", "What investment are you comfortable with?", or "Is there
a price range you're targeting?" — treat all of these as discussing Budget. Never rely on
exact wording. Understand the intent behind the conversation, and only mark something as
covered if the agent actually gathered that information or the customer volunteered it and
the agent acknowledged/used it.

Evaluate these five conversation stages and judge whether each was naturally accomplished:
1. Discovery — did the agent understand customer needs, current situation, pain points, goals, and project details?
2. Qualification — did the agent identify budget, timeline, decision maker, customer preferences, and project scope?
3. Solution Presentation — did the agent explain the product/service, connect features to customer needs, highlight benefits, and build value?
4. Objection Handling — did the customer raise objections? If so, identify them, evaluate the agent's response, and suggest a better response.
5. Closing — did the agent attempt to ask for commitment, schedule a follow-up, book a consultation, or confirm next steps?

Also detect: customer intent, buying intent, customer sentiment, customer emotion, lead
quality, urgency level, whether a decision maker was mentioned, whether a competitor was
mentioned, whether pricing was discussed, whether budget was discussed, whether timeline
was discussed, whether follow-up is needed, risk level, missed opportunities, best moments,
weak moments, AI coaching, next best action, and probability of closing.

Judge the conversation naturally and reward successful information gathering and sales
effectiveness, not exact question matching. Return ONLY valid JSON, with no preamble, no
markdown fences, and no commentary, in exactly this shape (fill every field with real
analysis from the transcript, not these examples):
{
  "overallScore": 85,
  "sentiment": "Positive|Neutral|Negative",
  "outcome": "Booked|Follow-up|Lost|Unknown",
  "summary": "2-3 sentence narrative of the call.",
  "summaryDetails": {
    "customerNeed": "string",
    "painPoints": "string",
    "budget": "string or 'Not discussed'",
    "decisionMaker": "string or 'Not mentioned'",
    "timeline": "string or 'Not discussed'",
    "competitorsMentioned": "string or 'None'",
    "nextStep": "string or 'None confirmed'"
  },
  "scoreBreakdown": {
    "discovery": 0, "qualification": 0, "productKnowledge": 0, "communication": 0,
    "listening": 0, "objectionHandling": 0, "closing": 0, "professionalism": 0
  },
  "conversationCoverage": [
    { "stage": "Discovery", "covered": true, "score": 0, "summary": "1-2 sentences on what was and wasn't covered, in your own words, not quoting the agent's exact wording." },
    { "stage": "Qualification", "covered": true, "score": 0, "summary": "..." },
    { "stage": "Solution Presentation", "covered": true, "score": 0, "summary": "..." },
    { "stage": "Objection Handling", "covered": true, "score": 0, "summary": "..." },
    { "stage": "Closing", "covered": true, "score": 0, "summary": "..." }
  ],
  "objections": [
    { "type": "string", "snippet": "short paraphrase of the objection, not a verbatim quote longer than a few words", "response": "how the agent responded, and a suggested better response if it was weak" }
  ],
  "coaching": {
    "strengths": ["..."],
    "weaknesses": ["..."],
    "missedOpportunities": ["..."],
    "actionPlan": ["..."],
    "improvementScore": 0
  },
  "compliance": { "complianceScore": 95, "violations": ["Greeting Missing"] },
  "customerIntent": "string",
  "buyingIntent": "Low|Medium|High",
  "leadQuality": "Cold|Warm|Hot",
  "urgency": "Low|Medium|High",
  "decisionMakerDetected": false,
  "competitorMentioned": false,
  "budgetDiscussed": false,
  "timelineDiscussed": false,
  "pricingDiscussed": false,
  "followUpRequired": false,
  "closingProbability": 0,
  "riskLevel": "Low|Medium|High",
  "bestMoments": ["..."],
  "weakMoments": ["..."],
  "nextBestAction": "string",
  "keyInsights": ["..."],
  "emotionTimeline": [{"segment":1,"emotion":"Neutral","intensity":5}],
  "conversationalDynamics": {
    "talkRatio": {"agent":45,"customer":55},
    "silenceDuration": "00:15",
    "interruptions": 1,
    "longestMonologue": "01:20",
    "averageResponseTime": "1.2",
    "deadAir": 5,
    "crossTalk": 2,
    "timeline": [{"segment":1,"speaker":"Agent","durationSeconds":30}]
  }
}`;

const NAV_ITEMS = [
  { view: "dashboard", icon: "ti-layout-dashboard", title: "Executive Dashboard" },
  { view: "agent", icon: "ti-users", title: "Agent Performance" },
  { view: "analysis", icon: "ti-microphone", title: "Call Analysis" },
];

export default function App() {
  const [activeView, setActiveView] = useState("analysis");
  const [calls, setCalls] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [saveTarget, setSaveTarget] = useState(null);   // call to save to DB
  const [dbVersion, setDbVersion] = useState(0);      // bump to trigger re-renders
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState("Manager"); // Role-based Dashboard
  const fileInputRef = useRef(null);
  const selectedCall = calls.find(c => c.id === selectedId) || null;

  const bumpDb = () => setDbVersion(v => v + 1);

  const addFiles = useCallback((files) => {
    const audio = Array.from(files).filter(f => f.type.includes("audio") || f.name.match(/\.(mp3|wav|m4a|ogg|flac|aac)$/i));
    if (!audio.length) return;
    const newCalls = audio.map(f => ({ id: crypto.randomUUID(), name: f.name.replace(/\.[^.]+$/, ""), size: f.size, type: f.type || f.name.split(".").pop(), file: f, status: "pending", analysis: null, error: null }));
    setCalls(prev => [...prev, ...newCalls]);
    if (!selectedId && newCalls.length) { setSelectedId(newCalls[0].id); setActiveView("analysis"); }
  }, [selectedId]);

  const analyzeCall = useCallback(async (callId) => {
    const call = calls.find(c => c.id === callId);
    if (!call || call.status === "analyzing" || call.status === "done") return;
    const apiKey = getGroqKey();
    if (!apiKey) { setShowSettings(true); return; }
    const upd = (patch) => setCalls(prev => prev.map(c => c.id === callId ? { ...c, ...patch } : c));
    upd({ status: "analyzing", statusMsg: "Transcribing audio..." });
    try {
      // Bug fix: Groq's transcription endpoint defaults to response_format
      // "json" (i.e. it returns `{"text": "..."}`), but the old code read the
      // raw response body as if it were plain text. That meant the "transcript"
      // was actually a JSON-wrapped string, which polluted the LLM analysis
      // input and showed literal JSON syntax in the Transcript tab. Explicitly
      // requesting response_format "text" makes .text() return the clean
      // transcript directly.
      const fd = new FormData(); fd.append("file", call.file, call.file.name); fd.append("model", "whisper-large-v3-turbo"); fd.append("response_format", "text");
      const txRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: fd });
      if (!txRes.ok) {
        const detail = await txRes.text().catch(() => "");
        throw new Error(`Transcription failed (${txRes.status}). ${detail.slice(0, 200) || "Check your Groq API key in Settings."}`);
      }
      const transcript = (await txRes.text()).trim();
      if (!transcript) throw new Error("Transcription returned empty text — the audio may be silent, corrupted, or unsupported.");
      upd({ statusMsg: "Analyzing intelligence..." });
      const llmRes = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: transcript }], temperature: 0.1, max_tokens: 4000 }) });
      if (!llmRes.ok) {
        const detail = await llmRes.text().catch(() => "");
        throw new Error(`Analysis failed (${llmRes.status}). ${detail.slice(0, 200) || "Check your Groq API key in Settings."}`);
      }
      const llmData = await llmRes.json();
      const raw = llmData.choices?.[0]?.message?.content || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      let analysis = {};

      try {
        analysis = JSON.parse(clean);
      } catch (e) {
        try {
          const match = clean.match(/\{[\s\S]*\}/);
          analysis = match ? JSON.parse(match[0]) : {};
        } catch {
          analysis = {};
        }
      }
      analysis = {
        overallScore: 0,
        sentiment: "Neutral",
        outcome: "Unknown",
        summary: "",
        transcript,

        summaryDetails: {
          customerNeed: "",
          painPoints: "",
          budget: "",
          decisionMaker: "",
          timeline: "",
          competitorsMentioned: "",
          nextStep: ""
        },

        scoreBreakdown: {
          discovery: 0,
          qualification: 0,
          productKnowledge: 0,
          communication: 0,
          listening: 0,
          objectionHandling: 0,
          closing: 0,
          professionalism: 0
        },

        conversationCoverage: [],
        objections: [],

        coaching: {
          strengths: [],
          weaknesses: [],
          missedOpportunities: [],
          actionPlan: [],
          improvementScore: 0
        },

        compliance: {
          complianceScore: 100,
          violations: []
        },

        customerIntent: "",
        buyingIntent: "Low",
        leadQuality: "Cold",
        urgency: "Low",

        decisionMakerDetected: false,
        competitorMentioned: false,
        budgetDiscussed: false,
        timelineDiscussed: false,
        pricingDiscussed: false,
        followUpRequired: false,

        closingProbability: 0,
        riskLevel: "Low",

        bestMoments: [],
        weakMoments: [],
        nextBestAction: "",
        keyInsights: [],

        emotionTimeline: [],

        conversationalDynamics: {
          talkRatio: {
            agent: 50,
            customer: 50
          },
          silenceDuration: "00:00",
          interruptions: 0,
          longestMonologue: "00:00",
          averageResponseTime: "0",
          deadAir: 0,
          crossTalk: 0,
          timeline: []
        },

        ...analysis
      };

      upd({
        status: "done",
        analysis
      });
    } catch (err) { upd({ status: "error", error: err.message || "Unknown error during analysis." }); }
  }, [calls]);

  const analyzeAll = useCallback(async () => {
    for (const c of calls.filter(c => c.status === "pending")) { await analyzeCall(c.id); await new Promise(r => setTimeout(r, 5000)); }
  }, [calls, analyzeCall]);

  const pendingCount = calls.filter(c => c.status === "pending").length;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <nav style={{ width: 80, background: "rgba(17,24,39,0.8)", borderRight: "1px solid var(--border-strong)", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0", zIndex: 50, backdropFilter: "blur(20px)" }}>
        <div style={{ width: 44, height: 44, background: "var(--grad-blue)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 15px rgba(59,130,246,0.5)", marginBottom: 40 }}>
          <i className="ti ti-wave-sine" style={{ fontSize: 24, color: "#fff" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
          {NAV_ITEMS.map(({ view, icon, title }) => (
            <button key={view} onClick={() => setActiveView(view)} title={title}
              style={{ width: 48, height: 48, borderRadius: 12, background: activeView === view ? "var(--glass-light)" : "transparent", border: activeView === view ? "1px solid var(--border-accent)" : "1px solid transparent", color: activeView === view ? "var(--accent-blue)" : "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", cursor: "pointer" }}>
              <i className={`ti ${icon}`} style={{ fontSize: 24 }} />
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <button onClick={() => setShowPin(true)} title="Admin Panel"
            style={{ width: 48, height: 48, borderRadius: 12, background: showAdmin ? "var(--glass-light)" : "transparent", border: "1px solid transparent", color: "var(--accent-purple)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <i className="ti ti-shield-lock" style={{ fontSize: 22 }} />
          </button>
          <button onClick={() => setShowSettings(true)} title="API Settings"
            style={{ width: 48, height: 48, background: "transparent", border: "none", color: getGroqKey() ? "var(--text-secondary)" : "var(--accent-amber)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-settings" style={{ fontSize: 24 }} />
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "50%", height: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.05) 0%,transparent 70%)", zIndex: 0, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "50%", height: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.05) 0%,transparent 70%)", zIndex: 0, pointerEvents: "none" }} />

        {activeView === "analysis" && (
          <header style={{ padding: "16px 32px", borderBottom: "1px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(17,24,39,0.4)", backdropFilter: "blur(12px)", zIndex: 10 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Call Analysis Studio</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div className="live-dot" style={{ transform: "scale(0.8)" }} /><p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Live Intelligence</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface-2)", padding: "2px 8px", borderRadius: 6, border: "1px solid var(--border-strong)" }}>
                  <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Role:</span>
                  <select value={userRole} onChange={e => setUserRole(e.target.value)} style={{ background: "none", border: "none", color: "var(--text-primary)", fontSize: 11, fontWeight: 600, cursor: "pointer", outline: "none" }}>
                    <option value="Agent">Agent</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => fileInputRef.current?.click()} className="btn-ghost"><i className="ti ti-upload" style={{ fontSize: 16 }} /> Upload Media</button>
              {pendingCount > 0 && <button onClick={analyzeAll} className="btn-primary"><i className="ti ti-player-play-filled" style={{ fontSize: 14 }} /> Process Queue ({pendingCount})</button>}
              {selectedCall?.status === "done" && <button onClick={() => setSaveTarget(selectedCall)} className="btn-primary" style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}><i className="ti ti-device-floppy" /> Save to DB</button>}
            </div>
          </header>
        )}

        <div style={{ flex: 1, overflow: "hidden", position: "relative", zIndex: 1 }}>
          {activeView === "dashboard" && <ExecutiveDashboard dbVersion={dbVersion} userRole={userRole} />}
          {activeView === "agent" && <AgentPerformance dbVersion={dbVersion} userRole={userRole} />}
          {activeView === "analysis" && (
            <div style={{ display: "flex", height: "100%" }}>
              {/* Call list sidebar */}
              <div style={{ width: 340, flexShrink: 0, borderRight: "1px solid var(--border-strong)", display: "flex", flexDirection: "column", background: "rgba(17,24,39,0.2)" }}>
                <div style={{ padding: "20px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Conversations</h3>
                  <span className="stat-pill">{calls.length} Total</span>
                </div>

                {/* Smart Search Bar */}
                <div style={{ padding: "0 20px 10px", position: "relative" }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name, score, outcome..."
                    style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface-1)", color: "var(--text-primary)", fontSize: 13, boxSizing: "border-box" }}
                  />
                  <i className="ti ti-search" style={{ position: "absolute", left: 32, top: 10, color: "var(--text-muted)", fontSize: 14 }} />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 32, top: 10, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12 }}>✕</button>
                  )}
                </div>

                <div style={{ flex: 1, overflow: "auto", padding: "10px 20px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {calls.length === 0 ? (
                    <div onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }} onClick={() => fileInputRef.current?.click()}
                      style={{ border: `2px dashed ${isDragging ? "var(--accent-blue)" : "var(--border-strong)"}`, borderRadius: 16, padding: "40px 20px", textAlign: "center", cursor: "pointer", background: isDragging ? "var(--accent-blue-glow)" : "rgba(30,42,62,0.3)", transition: "all 0.2s" }}>
                      <i className="ti ti-cloud-upload neon-text-blue" style={{ fontSize: 32, marginBottom: 12 }} />
                      <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600 }}>Drop audio files here</p>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>MP3, WAV, M4A, etc.</p>
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const q = searchQuery.toLowerCase().trim();
                        const filtered = calls.filter(c => {
                          if (!q) return true;
                          const nameMatch = c.name.toLowerCase().includes(q);
                          const scoreMatch = c.analysis?.overallScore?.toString().includes(q);
                          const outcomeMatch = c.analysis?.outcome?.toLowerCase().includes(q);
                          const sentimentMatch = c.analysis?.sentiment?.toLowerCase().includes(q);
                          return nameMatch || scoreMatch || outcomeMatch || sentimentMatch;
                        });
                        if (filtered.length === 0) {
                          return <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: 20 }}>No matching calls found</p>;
                        }
                        return filtered.map(call => <CallCard key={call.id} call={call} onClick={c => setSelectedId(c.id)} isSelected={selectedId === call.id} />);
                      })()}
                      <div onClick={() => fileInputRef.current?.click()} style={{ border: "1px dashed var(--border-strong)", borderRadius: 12, padding: "14px", textAlign: "center", cursor: "pointer", marginTop: 4 }}>
                        <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}><i className="ti ti-plus" /> Add more recordings</p>
                      </div>
                    </>
                  )}
                </div>
                {selectedCall?.status === "pending" && (
                  <div style={{ padding: 20, borderTop: "1px solid var(--border-strong)" }}>
                    <button onClick={() => analyzeCall(selectedCall.id)} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}><i className="ti ti-wand" /> Analyze Call</button>
                  </div>
                )}
              </div>

              {/* Analysis panel */}
              <div style={{ flex: 1, overflow: "hidden" }}>
                {calls.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 40 }}>
                    <div className="glass-card animate-fadein" style={{ padding: "48px", maxWidth: 560, textAlign: "center" }}>
                      <div style={{ width: 80, height: 80, borderRadius: 20, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}><i className="ti ti-microscope neon-text-blue" style={{ fontSize: 40 }} /></div>
                      <h2 style={{ margin: "0 0 16px", fontSize: 28, fontWeight: 700 }}>Actionable Intelligence</h2>
                      <p style={{ margin: "0 0 32px", fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.6 }}>Upload your kitchen cabinet sales calls. AI transcribes & extracts deep insights. Save results to the database to power the dashboard.</p>
                      <button onClick={() => fileInputRef.current?.click()} className="btn-primary" style={{ padding: "12px 24px" }}><i className="ti ti-upload" /> Upload Recordings to Begin</button>
                    </div>
                  </div>
                ) : <AnalysisPanel call={selectedCall} />}
              </div>
            </div>
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac" multiple style={{ display: "none" }} onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showPin && <PinModal onClose={() => setShowPin(false)} onSuccess={() => { setShowPin(false); setShowAdmin(true); }} />}
      {showAdmin && <AdminPanel onClose={() => { setShowAdmin(false); bumpDb(); }} />}
      {saveTarget && <SaveToDBModal call={saveTarget} onClose={() => setSaveTarget(null)} onSaved={bumpDb} />}
    </div>
  );
}
