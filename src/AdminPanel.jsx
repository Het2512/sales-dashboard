import { useState, useEffect } from "react";
import { getAgents, addAgent, updateAgent, deleteAgent, getCalls, deleteCall } from "./db";

const ADMIN_PASSWORD_KEY = "admin_password";
const DEFAULT_ADMIN_PASSWORD = "admin@123";
function getAdminPassword() { return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD; }
function setAdminPassword(pw) { localStorage.setItem(ADMIN_PASSWORD_KEY, pw); }

function getInitials(name) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const ROLES = [
  "Sales Agent", "Senior Sales Agent", "Team Lead",
  "Junior Agent", "Kitchen Sales Specialist", "Senior Specialist"
];

function AgentFormModal({ agent, onClose, onSave }) {
  const [form, setForm] = useState(agent || {
    name: "", role: "Sales Agent", email: "", phone: "", status: "Active", hireDate: ""
  });
  const [err, setErr] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) { setErr("Name is required"); return; }
    onSave(form);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div className="glass-card" style={{ padding: 32, width: 480, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{agent ? "Edit Agent" : "Add New Agent"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        {err && <p style={{ margin: "0 0 16px", color: "var(--text-danger)", fontSize: 13 }}>{err}</p>}

        {[
          { label: "Full Name *", key: "name", type: "text", placeholder: "e.g. Harsh Patel" },
          { label: "Email", key: "email", type: "email", placeholder: "harsh@company.com" },
          { label: "Phone", key: "phone", type: "text", placeholder: "+91 98765 43210" },
          { label: "Hire Date", key: "hireDate", type: "date" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>{f.label}</label>
            <input
              type={f.type} value={form[f.key] || ""} placeholder={f.placeholder}
              onChange={e => set(f.key, e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface-1)", color: "var(--text-primary)", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
        ))}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>Role</label>
          <select value={form.role} onChange={e => set("role", e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface-1)", color: "var(--text-primary)", fontSize: 14 }}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>Status</label>
          <div style={{ display: "flex", gap: 12 }}>
            {["Active", "Inactive"].map(s => (
              <button key={s} onClick={() => set("status", s)}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${form.status === s ? (s === "Active" ? "var(--text-success)" : "var(--text-danger)") : "var(--border-strong)"}`, background: form.status === s ? (s === "Active" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)") : "transparent", color: form.status === s ? (s === "Active" ? "var(--text-success)" : "var(--text-danger)") : "var(--text-secondary)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSave} className="btn-primary">
            <i className="ti ti-check" /> {agent ? "Update" : "Add Agent"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PinModal({ onSuccess, onClose }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showPw, setShowPw] = useState(false);
  const locked = attempts >= 5;

  const check = () => {
    if (locked) return;
    if (pw === getAdminPassword()) { onSuccess(); }
    else { setErr(true); setPw(""); setAttempts(a => a + 1); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div className="glass-card" style={{ padding: 40, width: 380, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <i className="ti ti-lock" style={{ fontSize: 32, color: "var(--accent-blue)" }} />
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>Admin Access</h2>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--text-secondary)" }}>Enter the admin password to continue</p>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <input
            type={showPw ? "text" : "password"} value={pw} onChange={e => { setPw(e.target.value); setErr(false); }}
            onKeyDown={e => e.key === "Enter" && check()}
            placeholder="Enter password"
            disabled={locked}
            style={{ width: "100%", padding: "12px 44px 12px 16px", borderRadius: 10, border: `1px solid ${err ? "var(--text-danger)" : "var(--border-strong)"}`, background: "var(--surface-1)", color: "var(--text-primary)", fontSize: 15, boxSizing: "border-box" }}
          />
          <button onClick={() => setShowPw(s => !s)} type="button" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
            <i className={`ti ${showPw ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: 16 }} />
          </button>
        </div>
        {err && !locked && <p style={{ margin: "0 0 16px", color: "var(--text-danger)", fontSize: 13 }}>Incorrect password. {5 - attempts} attempt{5-attempts===1?"":"s"} remaining.</p>}
        {locked && <p style={{ margin: "0 0 16px", color: "var(--text-danger)", fontSize: 13 }}><i className="ti ti-alert-triangle" /> Too many failed attempts. Close and try again later.</p>}
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
          <button onClick={check} className="btn-primary" style={{ flex: 1 }} disabled={locked}>Unlock</button>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordModal({ onClose }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const save = () => {
    if (current !== getAdminPassword()) { setErr("Current password is incorrect."); return; }
    if (next.length < 8) { setErr("New password must be at least 8 characters."); return; }
    if (next !== confirm) { setErr("New password and confirmation don't match."); return; }
    setAdminPassword(next);
    setDone(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
      <div className="glass-card" style={{ padding: 32, width: 400 }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <i className="ti ti-circle-check" style={{ fontSize: 48, color: "var(--text-success)", display: "block", marginBottom: 12 }} />
            <h3 style={{ margin: 0, color: "var(--text-success)" }}>Password updated!</h3>
          </div>
        ) : (
          <>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>Change Admin Password</h2>
            {err && <p style={{ margin: "0 0 16px", color: "var(--text-danger)", fontSize: 13 }}>{err}</p>}
            {[
              { label: "Current Password", val: current, set: setCurrent },
              { label: "New Password", val: next, set: setNext },
              { label: "Confirm New Password", val: confirm, set: setConfirm },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>{f.label}</label>
                <input type="password" value={f.val} onChange={e => f.set(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface-1)", color: "var(--text-primary)", fontSize: 14, boxSizing: "border-box" }} />
              </div>
            ))}
            <p style={{ margin: "0 0 20px", fontSize: 12, color: "var(--text-muted)" }}>Use at least 8 characters, mixing letters, numbers, and a symbol — e.g. <code>Sales@2026!</code></p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={onClose} className="btn-ghost">Cancel</button>
              <button onClick={save} className="btn-primary">Update Password</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminPanel({ onClose }) {
  const [tab, setTab] = useState("agents");
  const [agents, setAgents] = useState([]);
  const [calls, setCalls] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const reload = () => { setAgents(getAgents()); setCalls(getCalls()); };
  useEffect(() => { reload(); }, []);

  const handleSaveAgent = (form) => {
    if (editingAgent) { updateAgent(editingAgent.id, form); }
    else { addAgent(form); }
    setShowForm(false); setEditingAgent(null); reload();
  };

  const handleDelete = (id) => { deleteAgent(id); setConfirmDelete(null); reload(); };
  const handleDeleteCall = (id) => { deleteCall(id); reload(); };

  // New feature: export all saved calls as CSV so managers can pull the data
  // into Excel/Google Sheets for reporting, without needing a backend.
  const handleExportCalls = () => {
    const header = ["Call Name", "Agent", "Score", "Sentiment", "Outcome", "Saved At"];
    const rows = calls.map(c => {
      const agent = agents.find(a => a.id === c.agentId);
      const cell = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
      return [c.name, agent ? agent.name : "Unassigned", c.analysis?.overallScore ?? "", c.analysis?.sentiment ?? "", c.analysis?.outcome ?? "", new Date(c.savedAt).toLocaleString()].map(cell).join(",");
    });
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `saved_calls_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div className="glass-card" style={{ width: "min(900px, 95vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-shield-lock" style={{ fontSize: 24, color: "var(--accent-blue)" }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Admin Panel</h2>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>Manage agents & database</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setShowChangePassword(true)} className="btn-ghost" style={{ fontSize: 12 }}>
              <i className="ti ti-key" /> Change Password
            </button>
            <button onClick={onClose} style={{ width: 36, height: 36, background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-secondary)", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: "16px 32px 0", borderBottom: "1px solid var(--border-strong)", display: "flex", gap: 4, flexShrink: 0 }}>
          {["agents", "calls"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "8px 20px", borderRadius: "8px 8px 0 0", fontSize: 13, fontWeight: 600, border: "1px solid transparent", borderBottom: "none", background: tab === t ? "var(--glass-light)" : "transparent", color: tab === t ? "var(--text-primary)" : "var(--text-secondary)", cursor: "pointer", textTransform: "capitalize" }}>
              <i className={`ti ti-${t === "agents" ? "users" : "phone-call"}`} style={{ marginRight: 6 }} />
              {t === "agents" ? `Agents (${agents.length})` : `Saved Calls (${calls.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
          {/* ── AGENTS TAB ── */}
          {tab === "agents" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>Add your sales team members. Analyzed calls can be assigned to them.</p>
                <button onClick={() => { setEditingAgent(null); setShowForm(true); }} className="btn-primary">
                  <i className="ti ti-plus" /> Add Agent
                </button>
              </div>

              {agents.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                  <i className="ti ti-users" style={{ fontSize: 48, marginBottom: 16, display: "block", opacity: 0.4 }} />
                  <p style={{ fontSize: 16, fontWeight: 600 }}>No agents yet</p>
                  <p style={{ fontSize: 14 }}>Click "Add Agent" to get started</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {agents.map(a => {
                    const agentCalls = calls.filter(c => c.agentId === a.id);
                    return (
                      <div key={a.id} className="glass-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--grad-blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                          {getInitials(a.name)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{a.name}</p>
                            <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: a.status === "Active" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: a.status === "Active" ? "var(--text-success)" : "var(--text-danger)", border: `1px solid ${a.status === "Active" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                              {a.status}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>{a.role} · {a.email || "No email"} · {agentCalls.length} calls assigned</p>
                        </div>
                        {a.hireDate && <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>Hired: {new Date(a.hireDate).toLocaleDateString()}</p>}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => { setEditingAgent(a); setShowForm(true); }}
                            style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "var(--accent-blue)", cursor: "pointer" }}>
                            <i className="ti ti-pencil" /> Edit
                          </button>
                          <button onClick={() => setConfirmDelete(a.id)}
                            style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--text-danger)", cursor: "pointer" }}>
                            <i className="ti ti-trash" /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── CALLS TAB ── */}
          {tab === "calls" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>All analyzed calls saved to the database.</p>
                {calls.length > 0 && (
                  <button onClick={handleExportCalls} className="btn-ghost" style={{ fontSize: 12 }}>
                    <i className="ti ti-file-export" /> Export CSV
                  </button>
                )}
              </div>
              {calls.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                  <i className="ti ti-phone-off" style={{ fontSize: 48, marginBottom: 16, display: "block", opacity: 0.4 }} />
                  <p style={{ fontSize: 16, fontWeight: 600 }}>No calls saved</p>
                  <p style={{ fontSize: 14 }}>Analyze a call in Call Analysis Studio, then save it to the DB</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {calls.map(c => {
                    const agent = agents.find(a => a.id === c.agentId);
                    return (
                      <div key={c.id} className="glass-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                        <i className="ti ti-phone-call neon-text-blue" style={{ fontSize: 20, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{c.name}</p>
                          <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>
                            Agent: {agent ? agent.name : "Unassigned"} · Score: {c.analysis?.overallScore ?? "N/A"}/100 · {c.analysis?.outcome ?? ""} · {new Date(c.savedAt).toLocaleString()}
                          </p>
                        </div>
                        <button onClick={() => handleDeleteCall(c.id)}
                          style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--text-danger)", cursor: "pointer" }}>
                          <i className="ti ti-trash" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Agent form modal */}
      {showForm && (
        <AgentFormModal
          agent={editingAgent}
          onClose={() => { setShowForm(false); setEditingAgent(null); }}
          onSave={handleSaveAgent}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
          <div className="glass-card" style={{ padding: 32, width: 360, textAlign: "center" }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: 40, color: "var(--text-danger)", marginBottom: 16, display: "block" }} />
            <h3 style={{ margin: "0 0 8px" }}>Delete Agent?</h3>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--text-secondary)" }}>This will also remove all calls linked to this agent.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ flex: 1, padding: "10px 20px", borderRadius: 10, background: "var(--text-danger)", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {/* Change password modal */}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
}

export { PinModal };
