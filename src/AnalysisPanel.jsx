import { useState, useMemo, useRef, useEffect } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  LineChart, Line, CartesianGrid, XAxis, YAxis, ReferenceDot,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

const CONVERSATION_STAGES = ["Discovery", "Qualification", "Solution Presentation", "Objection Handling", "Closing"];

const STAGE_COLORS = {
  Discovery: { text: "var(--accent-blue)", bg: "var(--accent-blue-glow)", border: "rgba(59,130,246,0.4)" },
  Qualification: { text: "var(--accent-green)", bg: "var(--accent-green-glow)", border: "rgba(16,185,129,0.4)" },
  "Solution Presentation": { text: "var(--accent-purple)", bg: "var(--accent-purple-glow)", border: "rgba(139,92,246,0.4)" },
  "Objection Handling": { text: "var(--accent-amber)", bg: "var(--accent-amber-glow)", border: "rgba(245,158,11,0.4)" },
  Closing: { text: "#0ea5e9", bg: "rgba(14,165,233,0.12)", border: "rgba(14,165,233,0.4)" },
};

const EMOTION_COLORS = {
  Happy: "#10b981", Excited: "#3b82f6", Interested: "#8b5cf6", Satisfied: "#0ea5e9", Neutral: "#94a3b8",
  Confused: "#f59e0b", Disappointed: "#f97316", Frustrated: "#ef4444", Angry: "#dc2626"
};

const SPEAKER_COLORS = { Agent: "#3b82f6", Customer: "#10b981", Silence: "#475569", CrossTalk: "#ef4444" };

const KEYWORD_CATEGORIES = {
  Pricing: { words: ["price", "cost", "quote", "estimate", "total", "fees", "dollars"], color: "var(--accent-blue)" },
  Discount: { words: ["discount", "deal", "offer", "reduction", "cheaper", "sale", "promo"], color: "var(--accent-green)" },
  Competitor: { words: ["competitor", "other company", "home depot", "lowe's", "ikea", "cabinets.com"], color: "var(--accent-amber)" },
  Delivery: { words: ["delivery", "ship", "shipping", "arrive", "lead time", "transit"], color: "var(--accent-cyan)" },
  Installation: { words: ["install", "installation", "contractor", "builder", "putting it in"], color: "var(--accent-purple)" },
  Warranty: { words: ["warranty", "guarantee", "cover", "protect"], color: "#22c55e" },
  Budget: { words: ["budget", "afford", "financing", "monthly payment", "loan"], color: "#eab308" },
  Urgent: { words: ["urgent", "asap", "rush", "quickly", "hurry", "fast", "soon"], color: "#ef4444" },
  "Decision Maker": { words: ["husband", "wife", "partner", "spouse", "boss", "manager", "architect"], color: "#f472b6" },
  Appointment: { words: ["appointment", "schedule", "meeting", "consultation", "zoom", "call back"], color: "#38bdf8" },
};

const COMPLIANCE_ITEMS = [
  { key: "Greeting Missing", label: "Professional Greeting Check" },
  { key: "No Consent Given", label: "Consent to Record Verified" },
  { key: "PII Disclosed", label: "Sensitive Info / PII Safety" },
  { key: "False Promise", label: "Accurate Product Details" },
  { key: "Discount Violation", label: "Approved Discounts Only" }
];

// Bug fix: these were referenced (tabs.map / TAB_LABELS[t]) but never defined
// anywhere in this file, which threw "tabs is not defined" and crashed the
// entire panel the moment any call finished analyzing. Defining them here
// restores the tab bar.
const TABS = ["overview", "coaching", "objections", "compliance", "crm", "emotions", "dynamics", "questions", "transcript"];
const TAB_LABELS = {
  overview: "Overview",
  coaching: "Coaching",
  objections: "Objections",
  compliance: "Compliance",
  crm: "Deal Tracker",
  emotions: "Emotions",
  dynamics: "Dynamics",
  questions: "Stages",
  transcript: "Transcript",
};

function getScoreColor(s) {
  return s >= 75 ? "var(--text-success)" : s >= 50 ? "var(--text-warning)" : "var(--text-danger)";
}

function StageBadge({ stage }) {
  const c = STAGE_COLORS[stage] || { text: "var(--text-secondary)", bg: "var(--surface-3)", border: "var(--border-strong)" };
  return <span className="badge" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{stage}</span>;
}

function HighlightedTranscript({ text }) {
  const parts = useMemo(() => {
    if (!text) return [];
    const allWords = Object.values(KEYWORD_CATEGORIES).flatMap(c => c.words);
    allWords.sort((a, b) => b.length - a.length);
    const escaped = allWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    return text.split(new RegExp(`\\b(${escaped.join("|")})\\b`, "gi"));
  }, [text]);

  return (
    <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.9, whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)" }}>
      {parts.map((part, i) => {
        const lp = part.toLowerCase();
        let col = null;
        for (const cat of Object.values(KEYWORD_CATEGORIES)) {
          if (cat.words.includes(lp)) { col = cat.color; break; }
        }
        return col
          ? <span key={i} style={{ background: `${col}20`, color: col, padding: "2px 4px", borderRadius: 4, fontWeight: 700, border: `1px solid ${col}40`, display: "inline-block", margin: "0 2px" }}>{part}</span>
          : <span key={i}>{part}</span>;
      })}
    </p>
  );
}

const KPICard = ({ title, value, suffix, icon, color }) => (
  <div className="glass-card" style={{ padding: "20px", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, background: `radial-gradient(circle,${color}30 0%,transparent 70%)` }} />
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${color}40` }}>
        <i className={`ti ${icon}`} style={{ fontSize: 18, color }} />
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>{title}</p>
    </div>
    <h3 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>{value}{suffix}</h3>
  </div>
);

// ── Custom Audio Player Component ───────────────────────────────────────────────
function CustomAudioPlayer({ file }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef(null);
  const [audioUrl, setAudioUrl] = useState("");

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const skip = (amount) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + amount));
    }
  };

  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
  };

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="glass-card" style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 20, background: "rgba(17,24,39,0.5)", border: "1px solid var(--border-strong)", borderRadius: 12, marginBottom: 24 }}>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => setIsPlaying(false)}
        />
      )}
      <button onClick={togglePlay} className="btn-primary" style={{ width: 44, height: 44, borderRadius: "50%", padding: 0, justifyContent: "center", background: "var(--grad-blue)", border: "none" }}>
        <i className={isPlaying ? "ti ti-player-pause" : "ti ti-player-play"} style={{ fontSize: 20 }} />
      </button>

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "var(--text-secondary)" }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div
          style={{ position: "relative", height: 6, background: "var(--border-strong)", borderRadius: 3, cursor: "pointer" }}
          onClick={(e) => {
            if (!audioRef.current || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const percentage = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = percentage * duration;
          }}
        >
          <div style={{ width: `${(currentTime / (duration || 1)) * 100}%`, height: "100%", background: "var(--accent-blue)", borderRadius: 3, position: "relative" }}>
            <div style={{ position: "absolute", right: -4, top: -3, width: 12, height: 12, borderRadius: "50%", background: "#fff", boxShadow: "0 0 8px var(--accent-blue-glow)" }} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => skip(-5)} className="btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} title="Rewind 5s">
          <i className="ti ti-rotate-dot" /> -5s
        </button>
        <button onClick={() => skip(5)} className="btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} title="Forward 5s">
          <i className="ti ti-rotate-clockwise-2" /> +5s
        </button>

        <div style={{ display: "flex", gap: 4, background: "var(--surface-1)", padding: 4, borderRadius: 8, border: "1px solid var(--border-strong)" }}>
          {[0.5, 1, 1.5, 2].map((s) => (
            <button key={s} onClick={() => changeSpeed(s)} style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: playbackSpeed === s ? "var(--accent-blue)" : "transparent", color: playbackSpeed === s ? "#fff" : "var(--text-secondary)" }}>
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AnalysisPanel({ call }) {
  const [activeTab, setActiveTab] = useState("overview");
  const crmKey = call?.id ? `crm_record_${call.id}` : null;
  const [crmStatus, setCrmStatus] = useState(() => {
    if (crmKey) {
      try { const saved = JSON.parse(localStorage.getItem(crmKey)); if (saved) return saved; } catch { }
    }
    return { dealValue: "", stage: "Discovery", followUpDate: "", synced: false, lastSyncedAt: null };
  });

  // Reset / reload CRM state whenever the selected call changes, seeding sensible
  // defaults from the AI analysis itself instead of hardcoded fake values.
  useEffect(() => {
    if (!call?.id) return;
    const key = `crm_record_${call.id}`;
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (saved) { setCrmStatus(saved); return; }
    } catch { }
    const a = call.analysis;
    setCrmStatus({
      dealValue: "",
      stage: a?.summaryDetails?.budget ? "Qualification" : "Discovery",
      followUpDate: "",
      synced: false,
      lastSyncedAt: null,
    });
  }, [call?.id]);

  const a = call?.analysis ?? {};

  const emotionStats = useMemo(() => {
    if (!a.emotionTimeline?.length) {
      return { data: [], peaks: [] };
    }

    const counts = {};
    const total = a.emotionTimeline.length;
    const peaks = [];

    a.emotionTimeline.forEach((e, i) => {
      counts[e.emotion] = (counts[e.emotion] || 0) + 1;

      if (e.intensity >= 8) {
        peaks.push({ ...e, index: i });
      }
    });

    const data = Object.keys(counts)
      .map(k => ({
        name: k,
        value: counts[k],
        percentage: Math.round((counts[k] / total) * 100),
        color: EMOTION_COLORS[k] || "#94a3b8"
      }))
      .sort((a, b) => b.value - a.value);

    return { data, peaks };
  }, [a.emotionTimeline]);

  const keywordStats = useMemo(() => {
    if (!a.transcript) return {};

    const stats = {};
    const text = a.transcript.toLowerCase();

    Object.keys(KEYWORD_CATEGORIES).forEach(cat => {
      let count = 0;

      KEYWORD_CATEGORIES[cat].words.forEach(word => {
        const match = text.match(
          new RegExp(
            `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
            "gi"
          )
        );

        if (match) count += match.length;
      });

      if (count > 0) {
        stats[cat] = {
          count,
          color: KEYWORD_CATEGORIES[cat].color
        };
      }
    });

    return stats;
  }, [a.transcript]);

  const radarData = useMemo(() => {
    if (!a.scoreBreakdown) return [];

    return [
      { subject: "Discovery", A: a.scoreBreakdown.discovery || 0 },
      { subject: "Qualification", A: a.scoreBreakdown.qualification || 0 },
      { subject: "Product Knowledge", A: a.scoreBreakdown.productKnowledge || 0 },
      { subject: "Communication", A: a.scoreBreakdown.communication || 0 },
      { subject: "Listening", A: a.scoreBreakdown.listening || 0 },
      { subject: "Objection Handling", A: a.scoreBreakdown.objectionHandling || 0 },
      { subject: "Closing", A: a.scoreBreakdown.closing || 0 },
      { subject: "Professionalism", A: a.scoreBreakdown.professionalism || 0 }
    ];
  }, [a.scoreBreakdown]);

  const d =
    a.conversationalDynamics || {
      talkRatio: { agent: 50, customer: 50 },
      silenceDuration: "00:00",
      interruptions: 0,
      longestMonologue: "00:00",
      averageResponseTime: "0",
      deadAir: 0,
      crossTalk: 0,
      timeline: []
    };

  const comp =
    a.compliance || {
      complianceScore: 100,
      violations: []
    };

  const coaching = a.coaching
    ? {
      strengths: a.coaching.strengths || [],
      weaknesses: a.coaching.weaknesses || [],
      missedOpportunities: a.coaching.missedOpportunities || [],
      actionPlan: a.coaching.actionPlan || [],
      improvementScore: a.coaching.improvementScore
    }
    : null;
  const center = { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16, padding: 40 };

  // Bug fix: this useEffect used to live *after* the early `return` statements
  // below. React requires every hook to run in the same order on every render,
  // so switching between calls with different statuses (e.g. "pending" then
  // "done") changed how many hooks ran and React threw "Rendered fewer hooks
  // than expected this time," crashing the panel. Hooks must always run
  // unconditionally, before any early return.
  useEffect(() => {
    if (crmKey) localStorage.setItem(crmKey, JSON.stringify(crmStatus));
  }, [crmKey, crmStatus.dealValue, crmStatus.stage, crmStatus.followUpDate]);

  if (!call) return (
    <div style={center}>
      <i className="ti ti-chart-radar neon-text-blue" style={{ fontSize: 64, opacity: 0.8 }} />
      <h3 style={{ margin: 0 }}>Select a call to view analysis</h3>
    </div>
  );

  if (call.status !== "done") return (
    <div style={center} className="animate-fadein">
      {call.status === "pending" && <><i className="ti ti-player-play neon-text-blue" style={{ fontSize: 64 }} /><h3>Ready for Analysis</h3></>}
      {call.status === "analyzing" && <><div style={{ position: "relative", width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid var(--border-strong)", borderTopColor: "var(--accent-blue)", animation: "spin 1s linear infinite" }} /><i className="ti ti-brain neon-text-blue" style={{ fontSize: 32 }} /></div><h3>{call.statusMsg || "Processing..."}</h3></>}
      {call.status === "error" && <><i className="ti ti-alert-triangle neon-text-red" style={{ fontSize: 64 }} /><h3 style={{ color: "var(--text-danger)" }}>Analysis Failed</h3><p style={{ color: "var(--text-secondary)" }}>{call.error}</p></>}
    </div>
  );

  const handleSyncCRM = () => {
    const updated = { ...crmStatus, synced: true, lastSyncedAt: new Date().toISOString() };
    setCrmStatus(updated);
    if (crmKey) localStorage.setItem(crmKey, JSON.stringify(updated));
    setTimeout(() => setCrmStatus(prev => ({ ...prev, synced: false })), 2000);
  };

  // New feature: export the full analysis (scores, coaching, transcript, etc.)
  // as a JSON file so it can be attached to an email, shared with a manager,
  // or archived outside the browser's localStorage.
  const handleDownloadReport = () => {
    const report = { callName: call.name, generatedAt: new Date().toISOString(), analysis: a };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${call.name.replace(/[^a-z0-9-_]+/gi, "_")}_report.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fadein" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "24px 32px 0", borderBottom: "1px solid var(--border-strong)", flexShrink: 0, background: "rgba(17,24,39,0.4)", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-phone-call neon-text-blue" style={{ fontSize: 24 }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700 }}>{call.name}</h2>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className="stat-pill"><i className="ti ti-calendar" style={{ fontSize: 14 }} /> Today</span>
              {comp.complianceScore < 90 && (
                <span className="badge animate-pulse" style={{ background: "var(--accent-red-glow)", color: "var(--accent-red)", border: "1px solid rgba(239,68,68,0.4)" }}><i className="ti ti-alert-triangle" /> Low Compliance</span>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Call Score</p>
            <span style={{ fontSize: 32, fontWeight: 800, color: getScoreColor(a.overallScore) }}>{a.overallScore}<span style={{ fontSize: 18, opacity: 0.7 }}>/100</span></span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            {TABS.map(t => <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>{TAB_LABELS[t] || (t.charAt(0).toUpperCase() + t.slice(1))}</button>)}
          </div>
          <button onClick={handleDownloadReport} className="btn-ghost" style={{ flexShrink: 0, fontSize: 12, marginBottom: 8 }} title="Download full analysis as JSON">
            <i className="ti ti-download" /> Report
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "32px", paddingBottom: 100 }}>
        {/* Render audio player if file upload context exists */}
        {call.file && <CustomAudioPlayer file={call.file} />}

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="animate-fadein">
            {/* AI Summary Grid details */}
            {a.summaryDetails && (
              <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 600 }}><i className="ti ti-brain neon-text-purple" style={{ marginRight: 8 }} />AI Executive Summary Grid</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                  {[
                    { label: "Customer Need", val: a.summaryDetails.customerNeed, icon: "ti-search" },
                    { label: "Pain Points", val: a.summaryDetails.painPoints, icon: "ti-mood-sad" },
                    { label: "Budget", val: a.summaryDetails.budget, icon: "ti-currency-dollar" },
                    { label: "Decision Maker", val: a.summaryDetails.decisionMaker, icon: "ti-user-check" },
                    { label: "Timeline", val: a.summaryDetails.timeline, icon: "ti-calendar-time" },
                    { label: "Competitors Mentioned", val: a.summaryDetails.competitorsMentioned || "None", icon: "ti-scale" },
                    { label: "Next Step", val: a.summaryDetails.nextStep, icon: "ti-arrow-right-circle" }
                  ].map((field, idx) => (
                    <div key={idx} style={{ background: "var(--surface-1)", padding: 16, borderRadius: 10, border: "1px solid var(--border-strong)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>
                        <i className={`ti ${field.icon}`} /> {field.label}
                      </div>
                      <p style={{ margin: 0, fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>{field.val || "N/A"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New: Conversation Intelligence Signals */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              <KPICard title="Buying Intent" value={a.buyingIntent ?? "—"} suffix="" icon="ti-target-arrow" color="var(--accent-green)" />
              <KPICard title="Lead Quality" value={a.leadQuality ?? "—"} suffix="" icon="ti-flame" color="var(--accent-amber)" />
              <KPICard title="Urgency" value={a.urgency ?? "—"} suffix="" icon="ti-clock-bolt" color="var(--accent-blue)" />
              <KPICard title="Closing Probability" value={a.closingProbability ?? 0} suffix="%" icon="ti-trophy" color="var(--accent-purple)" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}><i className="ti ti-brain neon-text-blue" style={{ marginRight: 8 }} />Customer Intent</h3>
                <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{a.customerIntent || "Not detected."}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                  {[
                    { label: "Decision Maker", on: a.decisionMakerDetected },
                    { label: "Competitor Mentioned", on: a.competitorMentioned },
                    { label: "Budget Discussed", on: a.budgetDiscussed },
                    { label: "Timeline Discussed", on: a.timelineDiscussed },
                    { label: "Pricing Discussed", on: a.pricingDiscussed },
                    { label: "Follow-up Needed", on: a.followUpRequired },
                  ].map(f => (
                    <span key={f.label} className="badge" style={{ background: f.on ? "var(--accent-green-glow)" : "var(--surface-2)", color: f.on ? "var(--text-success)" : "var(--text-muted)", border: `1px solid ${f.on ? "rgba(16,185,129,0.4)" : "var(--border-strong)"}` }}>
                      <i className={`ti ${f.on ? "ti-check" : "ti-minus"}`} style={{ marginRight: 4 }} />{f.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}><i className="ti ti-alert-octagon neon-text-red" style={{ marginRight: 8 }} />Risk Level</h3>
                <span className="badge" style={{ fontSize: 14, padding: "6px 16px", background: a.riskLevel === "High" ? "var(--accent-red-glow)" : a.riskLevel === "Medium" ? "var(--accent-amber-glow)" : "var(--accent-green-glow)", color: a.riskLevel === "High" ? "var(--text-danger)" : a.riskLevel === "Medium" ? "var(--text-warning)" : "var(--text-success)" }}>
                  {a.riskLevel || "Unknown"}
                </span>
                <h4 style={{ margin: "20px 0 8px", fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Next Best Action</h4>
                <p style={{ margin: 0, fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6 }}>{a.nextBestAction || "No recommendation available."}</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}><i className="ti ti-align-left neon-text-blue" style={{ fontSize: 20 }} /><h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Call Narrative</h3></div>
                <p style={{ margin: 0, fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7 }}>{a.summary}</p>
              </div>

              {/* Radar Chart (Score Breakdown) */}
              {radarData.length > 0 && (
                <div className="glass-card" style={{ padding: 24, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}><i className="ti ti-chart-radar neon-text-green" style={{ fontSize: 20 }} /><h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Sales Skills Evaluation</h3></div>
                  <div style={{ flex: 1, minHeight: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="rgba(148,163,184,0.15)" />
                        <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" fontSize={10} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--text-muted)" fontSize={9} />
                        <Radar name="Score" dataKey="A" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.25} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Stage coverage */}
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}><i className="ti ti-chart-bar neon-text-purple" style={{ fontSize: 20 }} /><h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Stage Coverage</h3></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {CONVERSATION_STAGES.map(stage => {
                    const entry = a.conversationCoverage?.find(c => c.stage === stage);
                    const score = entry?.score ?? (entry?.covered ? 100 : 0);
                    return (
                      <div key={stage}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <StageBadge stage={stage} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: entry?.covered ? "var(--text-success)" : "var(--text-secondary)" }}>
                            {entry ? (entry.covered ? "Covered" : "Not Covered") : "No data"} {entry ? `· ${score}%` : ""}
                          </span>
                        </div>
                        <div className="progress-track"><div className="progress-fill" style={{ width: `${score}%`, background: STAGE_COLORS[stage].text }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* compliance quick summary */}
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}><i className="ti ti-shield-alert neon-text-red" style={{ fontSize: 20 }} /><h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Compliance Scorecard</h3></div>
                <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 16 }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: getScoreColor(comp.complianceScore) }}>
                    {comp.complianceScore}%
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${comp.complianceScore}%`, background: getScoreColor(comp.complianceScore) }} /></div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {comp.violations?.length > 0 ? (
                    <span style={{ color: "var(--text-danger)" }}><i className="ti ti-alert-circle" /> {comp.violations.length} violations detected. Check the Compliance tab for details.</span>
                  ) : (
                    <span style={{ color: "var(--text-success)" }}><i className="ti ti-circle-check" /> 100% compliant. No violations detected.</span>
                  )}
                </div>
              </div>
            </div>

            {a.keyInsights?.length > 0 && (
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}><i className="ti ti-bulb neon-text-amber" style={{ fontSize: 20 }} /><h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Key Insights</h3></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {a.keyInsights.map((ins, i) => <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}><i className="ti ti-chevron-right" style={{ color: "var(--accent-blue)", marginTop: 3, flexShrink: 0 }} /><p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{ins}</p></div>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI COACHING */}
        {activeTab === "coaching" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="animate-fadein">
            {coaching ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                  <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--text-success)" }}><i className="ti ti-circle-check" /> Strengths</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {coaching.strengths.map((str, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, fontSize: 14, color: "var(--text-secondary)" }}>
                          <i className="ti ti-circle-check" style={{ color: "var(--text-success)", marginTop: 3 }} />
                          <span>{str}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--text-danger)" }}><i className="ti ti-circle-x" /> Weaknesses</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {coaching.weaknesses.map((wk, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, fontSize: 14, color: "var(--text-secondary)" }}>
                          <i className="ti ti-circle-x" style={{ color: "var(--text-danger)", marginTop: 3 }} />
                          <span>{wk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                  <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--accent-purple)" }}><i className="ti ti-wand" /> Missed Opportunities</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {coaching.missedOpportunities.map((op, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, fontSize: 14, color: "var(--text-secondary)" }}>
                          <i className="ti ti-help" style={{ color: "var(--accent-purple)", marginTop: 3 }} />
                          <span>{op}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--accent-blue)" }}><i className="ti ti-list-check" /> Action Plan</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {coaching.actionPlan.map((act, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, fontSize: 14, color: "var(--text-secondary)" }}>
                          <i className="ti ti-arrow-right-circle" style={{ color: "var(--accent-blue)", marginTop: 3 }} />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {(a.bestMoments?.length > 0 || a.weakMoments?.length > 0) && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <div className="glass-card" style={{ padding: 24 }}>
                      <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--text-success)" }}><i className="ti ti-star" /> Best Moments</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {a.bestMoments?.length > 0 ? a.bestMoments.map((m, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, fontSize: 14, color: "var(--text-secondary)" }}>
                            <i className="ti ti-sparkles" style={{ color: "var(--text-success)", marginTop: 3 }} />
                            <span>{m}</span>
                          </div>
                        )) : <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>None identified.</p>}
                      </div>
                    </div>
                    <div className="glass-card" style={{ padding: 24 }}>
                      <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--text-warning)" }}><i className="ti ti-mood-confuzed" /> Weak Moments</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {a.weakMoments?.length > 0 ? a.weakMoments.map((m, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, fontSize: 14, color: "var(--text-secondary)" }}>
                            <i className="ti ti-alert-triangle" style={{ color: "var(--text-warning)", marginTop: 3 }} />
                            <span>{m}</span>
                          </div>
                        )) : <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>None identified.</p>}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {a.coachingTips?.map((tip, i) => (
                  <div key={i} className="glass-card" style={{ padding: "20px", display: "flex", gap: 20 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--accent-purple-glow)", border: "1px solid rgba(139,92,246,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className="ti ti-wand neon-text-purple" style={{ fontSize: 20 }} />
                    </div>
                    <div><h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600 }}>{tip.title}</h4><p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{tip.detail}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* OBJECTIONS */}
        {activeTab === "objections" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }} className="animate-fadein">
            {a.objections && a.objections.length > 0 ? (
              a.objections.map((obj, i) => (
                <div key={i} className="glass-card" style={{ borderLeft: "4px solid var(--accent-amber)", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="badge" style={{ background: "var(--accent-amber-glow)", color: "var(--accent-amber)", border: "1px solid rgba(245,158,11,0.4)", padding: "4px 12px" }}>{obj.type}</span>
                  </div>
                  <div style={{ background: "rgba(245,158,11,0.05)", padding: 16, borderRadius: 8, borderLeft: "3px solid var(--accent-amber)", fontStyle: "italic", color: "var(--text-primary)" }}>
                    "{obj.snippet}"
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "var(--text-success)", display: "flex", alignItems: "center", gap: 6 }}><i className="ti ti-bulb" /> Suggested Response</h4>
                    <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{obj.response}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
                <i className="ti ti-shield-check" style={{ fontSize: 48, color: "var(--text-success)", marginBottom: 12, display: "block" }} />
                <h3>No objections detected in this call!</h3>
              </div>
            )}
          </div>
        )}

        {/* COMPLIANCE MONITORING */}
        {activeTab === "compliance" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="animate-fadein">
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 600 }}><i className="ti ti-shield-check neon-text-green" style={{ marginRight: 8 }} />Compliance Checklist</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {COMPLIANCE_ITEMS.map((item) => {
                  const violated = comp.violations?.includes(item.key);
                  return (
                    <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-1)", padding: 16, borderRadius: 10, border: `1px solid ${violated ? "rgba(239,68,68,0.2)" : "var(--border-strong)"}` }}>
                      <span style={{ fontSize: 14, color: violated ? "var(--text-danger)" : "var(--text-primary)", fontWeight: 500 }}>{item.label}</span>
                      <span className="badge" style={{ background: violated ? "var(--accent-red-glow)" : "var(--accent-green-glow)", color: violated ? "var(--accent-red)" : "var(--accent-green)", border: `1px solid ${violated ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.4)"}` }}>
                        {violated ? <><i className="ti ti-x" /> Failed</> : <><i className="ti ti-check" /> Passed</>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-card" style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <h3 style={{ margin: "0 0 24px", fontSize: 16, fontWeight: 600, width: "100%" }}><i className="ti ti-chart-bar neon-text-blue" style={{ marginRight: 8 }} />Overall Compliance Score</h3>
              <div style={{ position: "relative", width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <svg width="160" height="160" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="50" cy="50" r="40" stroke="var(--border-strong)" strokeWidth="8" fill="none" />
                  <circle cx="50" cy="50" r="40" stroke={getScoreColor(comp.complianceScore)} strokeWidth="8" fill="none" strokeDasharray={`${comp.complianceScore * 2.51} 251`} strokeLinecap="round" />
                </svg>
                <div style={{ position: "absolute", textAlign: "center" }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: getScoreColor(comp.complianceScore) }}>{comp.complianceScore}%</span>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Score</p>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", textAlign: "center" }}>
                {comp.violations?.length > 0 ? "Ensure the agent reviews compliance guidelines." : "Perfect adherence to compliance policies."}
              </p>
            </div>
          </div>
        )}

        {/* DEAL TRACKER (local CRM-style record, no external CRM is connected) */}
        {activeTab === "crm" && (
          <div className="glass-card animate-fadein" style={{ padding: 24, maxWidth: 500, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-blue-glow)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="ti ti-exchange neon-text-blue" style={{ fontSize: 20 }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Deal Tracker</h3>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>Saved locally for this call · no external CRM is connected yet</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>Estimated Opportunity Value</label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={crmStatus.dealValue}
                  onChange={e => setCrmStatus(prev => ({ ...prev, dealValue: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface-1)", color: "var(--text-primary)", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>Pipeline Stage</label>
                <select
                  value={crmStatus.stage}
                  onChange={e => setCrmStatus(prev => ({ ...prev, stage: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface-1)", color: "var(--text-primary)", fontSize: 14 }}
                >
                  <option value="Discovery">Discovery / Intro</option>
                  <option value="Qualification">Qualification</option>
                  <option value="Proposal">Proposal Sent</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="ClosedWon">Closed Won</option>
                  <option value="ClosedLost">Closed Lost</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>Next Action Date</label>
                <input
                  type="date"
                  value={crmStatus.followUpDate}
                  onChange={e => setCrmStatus(prev => ({ ...prev, followUpDate: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface-1)", color: "var(--text-primary)", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <button onClick={handleSyncCRM} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              {crmStatus.synced ? <><i className="ti ti-check" /> Saved!</> : <><i className="ti ti-device-floppy" /> Save Deal Record</>}
            </button>
            {crmStatus.lastSyncedAt && (
              <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                Last saved {new Date(crmStatus.lastSyncedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* EMOTIONS */}
        {activeTab === "emotions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="animate-fadein">
            {a.emotionTimeline?.length > 0 ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
                  <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ margin: "0 0 24px", fontSize: 16, fontWeight: 600 }}>Breakdown</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ width: 130, height: 130 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart><Pie data={emotionStats.data} innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">{emotionStats.data.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><RechartsTooltip contentStyle={{ background: "var(--glass)", border: "1px solid var(--border-strong)", borderRadius: 8 }} /></PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                        {emotionStats.data.map((em, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: em.color }} /><span style={{ fontSize: 13 }}>{em.name}</span></div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)" }}>{em.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ margin: "0 0 24px", fontSize: 16, fontWeight: 600 }}>Emotional Peaks</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {emotionStats.peaks.length > 0 ? emotionStats.peaks.map((pk, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, background: "var(--surface-1)", padding: "12px 16px", borderRadius: 8, borderLeft: `4px solid ${EMOTION_COLORS[pk.emotion] || "#fff"}` }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>SEG {pk.segment}</span>
                          <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{pk.emotion}</span>
                          <span className="badge" style={{ background: `${EMOTION_COLORS[pk.emotion]}20`, color: EMOTION_COLORS[pk.emotion] }}>Int: {pk.intensity}/10</span>
                        </div>
                      )) : <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No high-intensity peaks detected.</p>}
                    </div>
                  </div>
                </div>
                <div className="glass-card" style={{ padding: 24 }}>
                  <h3 style={{ margin: "0 0 24px", fontSize: 16, fontWeight: 600 }}>Emotion Timeline</h3>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={a.emotionTimeline} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                        <XAxis dataKey="segment" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `Seg ${v}`} />
                        <YAxis domain={[0, 10]} stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={{ background: "var(--glass)", border: "1px solid var(--border-accent)", borderRadius: 8 }} />
                        <Line type="monotone" dataKey="intensity" stroke="var(--text-secondary)" strokeWidth={2} dot={false} />
                        {a.emotionTimeline.map((e, i) => <ReferenceDot key={i} x={e.segment} y={e.intensity} r={6} fill={EMOTION_COLORS[e.emotion] || "#fff"} stroke="var(--bg-base)" strokeWidth={2} />)}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>No emotion data.</div>}
          </div>
        )}

        {/* DYNAMICS */}
        {activeTab === "dynamics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="animate-fadein">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              <KPICard title="Silence Duration" value={d.silenceDuration} icon="ti-volume-off" color="#94a3b8" />
              <KPICard title="Interruptions" value={d.interruptions} icon="ti-bolt" color="#ef4444" />
              <KPICard title="Longest Monologue" value={d.longestMonologue} icon="ti-microphone" color="#8b5cf6" />
              <KPICard title="Avg Response Time" value={d.averageResponseTime} suffix="s" icon="ti-clock" color="#10b981" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
              {[
                { title: "Talk Ratio", data: [{ name: "Agent", value: d.talkRatio.agent, fill: SPEAKER_COLORS.Agent }, { name: "Customer", value: d.talkRatio.customer, fill: SPEAKER_COLORS.Customer }], label: `Agent ${d.talkRatio.agent}% / Customer ${d.talkRatio.customer}%` },
                { title: "Dead Air", data: [{ name: "Active", value: 100 - d.deadAir, fill: "#1e293b" }, { name: "Dead Air", value: d.deadAir, fill: SPEAKER_COLORS.Silence }], label: `${d.deadAir}%` },
                { title: "Cross Talk", data: [{ name: "Clean", value: 100 - d.crossTalk, fill: "#1e293b" }, { name: "Cross Talk", value: d.crossTalk, fill: SPEAKER_COLORS.CrossTalk }], label: `${d.crossTalk}%` },
              ].map(chart => (
                <div key={chart.title} className="glass-card" style={{ padding: 24 }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, textAlign: "center" }}>{chart.title}</h3>
                  <div style={{ height: 150 }}><ResponsiveContainer><PieChart><Pie data={chart.data} innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value"><RechartsTooltip contentStyle={{ background: "var(--glass)", border: "1px solid var(--border-strong)", borderRadius: 8 }} /></Pie></PieChart></ResponsiveContainer></div>
                  <p style={{ margin: "8px 0 0", textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{chart.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STAGES */}
        {activeTab === "questions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }} className="animate-fadein">
            {a.conversationCoverage?.length > 0 ? CONVERSATION_STAGES.map(stage => {
              const entry = a.conversationCoverage.find(c => c.stage === stage);
              const covered = entry?.covered ?? false;
              return (
                <div key={stage} className="glass-card" style={{ borderLeft: `4px solid ${covered ? "var(--text-success)" : "var(--border-strong)"}`, padding: "20px", display: "flex", gap: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: covered ? "var(--accent-green-glow)" : "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className={covered ? "ti ti-check" : "ti ti-x"} style={{ fontSize: 18, color: covered ? "var(--text-success)" : "var(--text-muted)" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <StageBadge stage={stage} />
                      {typeof entry?.score === "number" && <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)" }}>{entry.score}/100</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      {entry?.summary || "The AI did not return a summary for this stage."}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
                <i className="ti ti-list-search" style={{ fontSize: 48, marginBottom: 12, display: "block" }} />
                <h3>No stage coverage data available for this call.</h3>
                <p style={{ fontSize: 13 }}>This can happen on older analyses run before the stage-coverage upgrade — re-analyze the call to refresh.</p>
              </div>
            )}
          </div>
        )}

        {/* TRANSCRIPT */}
        {activeTab === "transcript" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="animate-fadein">
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}><i className="ti ti-tags neon-text-blue" style={{ marginRight: 8 }} />Detected Keywords</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {Object.keys(keywordStats).length > 0
                  ? Object.entries(keywordStats).map(([cat, info]) => (
                    <div key={cat} style={{ background: "var(--surface-1)", padding: "6px 14px", borderRadius: 20, border: "1px solid var(--border-strong)", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{cat}</span>
                      <span className="badge" style={{ background: `${info.color}20`, color: info.color, border: `1px solid ${info.color}40`, padding: "2px 8px" }}>{info.count}</span>
                    </div>
                  ))
                  : <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>No keywords detected.</p>}
              </div>
            </div>
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}><i className="ti ti-file-text neon-text-purple" style={{ marginRight: 8 }} />Full Transcript</h3>
              <HighlightedTranscript text={a.transcript} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
