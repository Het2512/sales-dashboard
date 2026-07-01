import { useState, useEffect } from "react";
import { getAgents, getAgentStats, getCalls } from "./db";

const FilterBar = ({ activeFilter, setFilter, options }) => (
  <div style={{ display:"flex",background:"var(--surface-1)",borderRadius:8,padding:4,border:"1px solid var(--border-strong)" }}>
    {options.map(range => (
      <button key={range} onClick={() => setFilter(range)}
        style={{ padding:"6px 16px",borderRadius:6,fontSize:12,fontWeight:600,background:activeFilter===range?"var(--glass-light)":"transparent",color:activeFilter===range?"var(--text-primary)":"var(--text-secondary)",border:activeFilter===range?"1px solid var(--border-accent)":"1px solid transparent" }}>
        {range}
      </button>
    ))}
  </div>
);

function getInitials(name) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function ScoreBar({ score, color }) {
  const c = color || (score >= 75 ? "var(--text-success)" : score >= 50 ? "var(--text-warning)" : "var(--text-danger)");
  return (
    <div style={{ display:"flex",alignItems:"center",gap:12 }}>
      <div style={{ flex:1,height:6,borderRadius:99,background:"var(--border-strong)",overflow:"hidden" }}>
        <div style={{ width:`${score}%`,height:"100%",borderRadius:99,background:c,boxShadow:`0 0 8px ${c}` }} />
      </div>
      <span style={{ fontSize:13,fontWeight:700,color:c,minWidth:36,textAlign:"right" }}>{score}%</span>
    </div>
  );
}

const KPICard = ({ title, value, suffix, icon, color }) => (
  <div className="glass-card" style={{ padding:"20px",position:"relative",overflow:"hidden" }}>
    <div style={{ position:"absolute",top:-20,right:-20,width:100,height:100,background:`radial-gradient(circle,${color}30 0%,transparent 70%)` }} />
    <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:12 }}>
      <div style={{ width:36,height:36,borderRadius:10,background:`${color}15`,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${color}40` }}>
        <i className={`ti ${icon}`} style={{ fontSize:18,color }} />
      </div>
      <p style={{ margin:0,fontSize:13,color:"var(--text-secondary)",fontWeight:600 }}>{title}</p>
    </div>
    <h3 style={{ margin:0,fontSize:30,fontWeight:700,color:"var(--text-primary)",letterSpacing:"-0.02em" }}>{value}{suffix}</h3>
  </div>
);

export default function AgentPerformance({ dbVersion, userRole = "Manager" }) {
  const [timeFilter, setTimeFilter] = useState("This Week");
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const ag = getAgents();
    setAgents(ag);

    // Build leaderboard
    const board = ag.map(a => {
      const s = getAgentStats(a.id);
      return { ...a, avgScore: s ? s.avgScore : null, callsHandled: s ? s.callsHandled : 0, stats: s };
    }).filter(a => a.avgScore !== null).sort((a, b) => b.avgScore - a.avgScore);
    setLeaderboard(board);

    // Auto-select first in board, or first agent
    if (!selectedAgentId) {
      const first = board[0] || ag[0];
      if (first) setSelectedAgentId(first.id);
    }
  }, [dbVersion]);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const stats = selectedAgent ? getAgentStats(selectedAgent.id) : null;

  // No agents at all
  if (agents.length === 0) {
    return (
      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:20,padding:40,textAlign:"center" }}>
        <div style={{ width:80,height:80,borderRadius:20,background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.2)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <i className="ti ti-users neon-text-blue" style={{ fontSize:40 }} />
        </div>
        <h2 style={{ margin:0,fontSize:24,fontWeight:700 }}>No Agents Yet</h2>
        <p style={{ margin:0,fontSize:15,color:"var(--text-secondary)",maxWidth:400,lineHeight:1.7 }}>
          Open the <strong>Admin Panel</strong> (🔒 icon in sidebar) and add your sales team members first.
        </p>
      </div>
    );
  }

  const isAgent = userRole === "Agent";

  return (
    <div className="animate-fadein" style={{ padding:"32px",height:"100%",overflowY:"auto" }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:32 }}>
        <div>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <h2 style={{ margin:0,fontSize:24,fontWeight:700 }}>Agent Performance</h2>
            <span className="badge" style={{ background:isAgent?"var(--accent-green-glow)":"var(--accent-blue-glow)", color:isAgent?"var(--accent-green)":"var(--accent-blue)", border:"1px solid rgba(148,163,184,0.2)" }}>{userRole} view</span>
          </div>
          <p style={{ margin:"4px 0 0",fontSize:14,color:"var(--text-secondary)" }}>Individual agent metrics based on analyzed calls.</p>
        </div>
        <FilterBar activeFilter={timeFilter} setFilter={setTimeFilter} options={["Today","This Week","This Month","Custom Date"]} />
      </div>

      <div style={{ display:"grid",gridTemplateColumns:isAgent?"1fr":"3fr 1fr",gap:24,marginBottom:80 }}>
        <div style={{ display:"flex",flexDirection:"column",gap:24 }}>
          {/* Agent Selector */}
          <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
            {agents.map(a => (
              <button key={a.id} onClick={() => setSelectedAgentId(a.id)}
                style={{ padding:"8px 16px",borderRadius:10,fontSize:13,fontWeight:600,background:selectedAgentId===a.id?"var(--glass-light)":"var(--surface-1)",border:`1px solid ${selectedAgentId===a.id?"var(--border-accent)":"var(--border-strong)"}`,color:selectedAgentId===a.id?"var(--text-primary)":"var(--text-secondary)",cursor:"pointer",display:"flex",alignItems:"center",gap:8 }}>
                <div style={{ width:24,height:24,borderRadius:"50%",background:"var(--grad-blue)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff" }}>
                  {getInitials(a.name)}
                </div>
                {a.name}
              </button>
            ))}
          </div>

          {/* Agent profile card */}
          {selectedAgent && (
            <div className="glass-card" style={{ padding:"24px",display:"flex",alignItems:"center",gap:24,position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",top:0,right:0,bottom:0,width:"30%",background:"radial-gradient(ellipse at right,rgba(59,130,246,0.15) 0%,transparent 70%)" }} />
              <div style={{ width:80,height:80,borderRadius:"50%",background:"var(--grad-blue)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:700,color:"#fff",border:"2px solid rgba(255,255,255,0.2)",boxShadow:"0 0 20px rgba(59,130,246,0.4)" }}>
                {getInitials(selectedAgent.name)}
              </div>
              <div>
                <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:8 }}>
                  <h3 style={{ margin:0,fontSize:26,fontWeight:700 }}>{selectedAgent.name}</h3>
                  {leaderboard.findIndex(a => a.id === selectedAgent.id) >= 0 && (
                    <span className="badge" style={{ background:"var(--accent-amber-glow)",color:"var(--accent-amber)",border:"1px solid rgba(245,158,11,0.4)" }}>
                      Rank #{leaderboard.findIndex(a => a.id === selectedAgent.id) + 1}
                    </span>
                  )}
                  <span style={{ padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:selectedAgent.status==="Active"?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)",color:selectedAgent.status==="Active"?"var(--text-success)":"var(--text-danger)",border:"1px solid currentColor" }}>
                    {selectedAgent.status}
                  </span>
                </div>
                <p style={{ margin:0,fontSize:15,color:"var(--text-secondary)" }}>{selectedAgent.role}</p>
              </div>
            </div>
          )}

          {/* Stats / empty state */}
          {!stats ? (
            <div className="glass-card" style={{ padding:"48px",textAlign:"center",color:"var(--text-muted)" }}>
              <i className="ti ti-phone-off" style={{ fontSize:40,marginBottom:12,display:"block",opacity:0.4 }} />
              <p style={{ margin:0,fontSize:15,fontWeight:600 }}>No calls analyzed for this agent yet</p>
              <p style={{ margin:"8px 0 0",fontSize:13 }}>Upload a call, analyze it, then save it and assign to this agent</p>
            </div>
          ) : (
            <>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16 }}>
                <KPICard title="Calls Handled" value={stats.callsHandled} icon="ti-headset" color="#3b82f6" />
                <KPICard title="Avg AI Score" value={`${stats.avgScore}`} suffix="/100" icon="ti-brain" color="#10b981" />
                <KPICard title="Closing Rate" value={`${stats.closingRate}`} suffix="%" icon="ti-target" color="#f59e0b" />
                <KPICard title="Avg Sentiment" value={stats.sentiment} icon="ti-mood-smile" color="#10b981" />
                <KPICard title="Positive Calls" value={`${stats.positivePct}`} suffix="%" icon="ti-thumb-up" color="#06b6d4" />
              </div>

              <h3 style={{ margin:"8px 0 0",fontSize:18,fontWeight:600 }}>Sales Framework Mastery</h3>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16 }}>
                {[
                  { title:"Discovery Score",    value:stats.discoveryScore,     icon:"ti-search",        color:"#3b82f6" },
                  { title:"Qualification",       value:stats.qualificationScore, icon:"ti-filter",        color:"#10b981" },
                  { title:"Sales Score",         value:stats.salesScore,         icon:"ti-shopping-cart", color:"#8b5cf6" },
                  { title:"Objection Handling",  value:stats.objectionScore,     icon:"ti-shield",        color:"#f59e0b" },
                ].map(item => (
                  <div key={item.title} className="glass-card" style={{ padding:"20px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
                      <i className={`ti ${item.icon}`} style={{ fontSize:16,color:item.color }} />
                      <p style={{ margin:0,fontSize:13,fontWeight:600,color:"var(--text-secondary)" }}>{item.title}</p>
                    </div>
                    <h3 style={{ margin:"0 0 10px",fontSize:26,fontWeight:700 }}>{item.value}<span style={{ fontSize:16,opacity:0.6 }}>/100</span></h3>
                    <ScoreBar score={item.value} />
                  </div>
                ))}
              </div>

              {/* Recent calls for this agent */}
              <h3 style={{ margin:"8px 0 0",fontSize:18,fontWeight:600 }}>Recent Calls</h3>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {stats.calls.slice().reverse().slice(0, 5).map(c => (
                  <div key={c.id} className="glass-card" style={{ padding:"14px 20px",display:"flex",alignItems:"center",gap:16 }}>
                    <i className="ti ti-phone-call neon-text-blue" style={{ fontSize:18,flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <p style={{ margin:"0 0 3px",fontSize:14,fontWeight:600 }}>{c.name}</p>
                      <p style={{ margin:0,fontSize:12,color:"var(--text-secondary)" }}>
                        {new Date(c.savedAt).toLocaleDateString()} · {c.analysis?.outcome || "Unknown"}
                      </p>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ margin:0,fontSize:18,fontWeight:700,color:c.analysis?.overallScore >= 75 ? "var(--text-success)" : c.analysis?.overallScore >= 50 ? "var(--text-warning)" : "var(--text-danger)" }}>
                        {c.analysis?.overallScore ?? "—"}
                      </p>
                      <p style={{ margin:0,fontSize:11,color:"var(--text-muted)" }}>Score</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Leaderboard */}
        {!isAgent && (
          <div className="glass-card" style={{ padding:"24px",alignSelf:"start" }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:24 }}>
              <i className="ti ti-trophy neon-text-amber" style={{ fontSize:22 }} />
              <h3 style={{ margin:0,fontSize:18,fontWeight:600 }}>Leaderboard</h3>
            </div>
            {leaderboard.length === 0 ? (
              <div style={{ textAlign:"center",padding:"20px 0",color:"var(--text-muted)" }}>
                <p style={{ fontSize:13 }}>Save analyzed calls to agents to see rankings</p>
              </div>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                {leaderboard.map((agent, idx) => (
                  <button key={agent.id} onClick={() => setSelectedAgentId(agent.id)}
                    style={{ display:"flex",alignItems:"center",gap:14,padding:"12px",borderRadius:12,background:selectedAgentId===agent.id?"rgba(59,130,246,0.1)":"var(--surface-1)",border:selectedAgentId===agent.id?"1px solid var(--border-accent)":"1px solid var(--border-strong)",cursor:"pointer",textAlign:"left",width:"100%" }}>
                    <div style={{ width:32,height:32,borderRadius:"50%",background:idx===0?"var(--accent-amber)":idx===1?"#94a3b8":idx===2?"#cd7f32":"var(--surface-3)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:idx<=2?"#000":"var(--text-secondary)",flexShrink:0 }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <p style={{ margin:"0 0 2px",fontSize:13,fontWeight:600,color:"var(--text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{agent.name}</p>
                      <p style={{ margin:0,fontSize:11,color:"var(--text-secondary)" }}>{agent.callsHandled} calls</p>
                    </div>
                    <div style={{ textAlign:"right",flexShrink:0 }}>
                      <p style={{ margin:0,fontSize:16,fontWeight:700,color:"var(--text-primary)" }}>{agent.avgScore}</p>
                    </div>
                  </button>
                ))}

                {/* Agents with no calls */}
                {agents.filter(a => !leaderboard.find(l => l.id === a.id)).map(a => (
                  <button key={a.id} onClick={() => setSelectedAgentId(a.id)}
                    style={{ display:"flex",alignItems:"center",gap:14,padding:"12px",borderRadius:12,background:selectedAgentId===a.id?"rgba(59,130,246,0.1)":"var(--surface-1)",border:selectedAgentId===a.id?"1px solid var(--border-accent)":"1px solid var(--border-strong)",cursor:"pointer",textAlign:"left",width:"100%",opacity:0.6 }}>
                    <div style={{ width:32,height:32,borderRadius:"50%",background:"var(--surface-3)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,color:"var(--text-muted)",flexShrink:0 }}>—</div>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:"0 0 2px",fontSize:13,fontWeight:600,color:"var(--text-primary)" }}>{a.name}</p>
                      <p style={{ margin:0,fontSize:11,color:"var(--text-muted)" }}>No calls yet</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
