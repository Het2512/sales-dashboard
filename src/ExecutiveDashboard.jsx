import { useState, useEffect } from "react";
import { getDashboardStats } from "./db";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, LineChart, Line
} from "recharts";

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

function AnimatedCounter({ value, suffix = "" }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (typeof value !== "number") return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 800, 1);
      setCount(Math.floor((1 - Math.pow(1-p,4)) * value));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <>{typeof value === "number" ? count : value}{suffix}</>;
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
    <h3 style={{ margin:0,fontSize:30,fontWeight:700,color:"var(--text-primary)",letterSpacing:"-0.02em" }}>
      {typeof value === "number" ? <AnimatedCounter value={value} suffix={suffix} /> : <>{value}{suffix}</>}
    </h3>
  </div>
);

export default function ExecutiveDashboard({ dbVersion, userRole = "Manager" }) {
  const [timeFilter, setTimeFilter] = useState("This Week");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setStats(getDashboardStats());
  }, [dbVersion]);

  if (!stats) {
    return (
      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:20,padding:40,textAlign:"center" }}>
        <div style={{ width:80,height:80,borderRadius:20,background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.2)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <i className="ti ti-chart-bar neon-text-blue" style={{ fontSize:40 }} />
        </div>
        <h2 style={{ margin:0,fontSize:24,fontWeight:700 }}>No Data Yet</h2>
        <p style={{ margin:0,fontSize:15,color:"var(--text-secondary)",maxWidth:460,lineHeight:1.7 }}>
          The dashboard will populate once you analyze calls and save them to the database.<br />
          Start by uploading a call recording in <strong>Call Analysis Studio</strong>, then save it to the DB.
        </p>
        <div style={{ display:"flex",gap:12,marginTop:8 }}>
          <div style={{ padding:"10px 20px",borderRadius:10,background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.3)",color:"var(--accent-blue)",fontSize:13,fontWeight:600 }}>
            <i className="ti ti-microphone" style={{ marginRight:6 }} />Step 1: Analyze a Call
          </div>
          <div style={{ padding:"10px 20px",borderRadius:10,background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.3)",color:"var(--text-success)",fontSize:13,fontWeight:600 }}>
            <i className="ti ti-device-floppy" style={{ marginRight:6 }} />Step 2: Save to DB
          </div>
          <div style={{ padding:"10px 20px",borderRadius:10,background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.3)",color:"var(--accent-purple)",fontSize:13,fontWeight:600 }}>
            <i className="ti ti-chart-bar" style={{ marginRight:6 }} />Step 3: See Insights
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadein" style={{ padding:"32px",height:"100%",overflowY:"auto" }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24 }}>
        <div>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <h2 style={{ margin:0,fontSize:24,fontWeight:700 }}>Executive Overview</h2>
            <span className="badge" style={{ background:userRole==="Admin"?"var(--accent-purple-glow)":userRole==="Manager"?"var(--accent-blue-glow)":"var(--accent-green-glow)", color:userRole==="Admin"?"var(--accent-purple)":userRole==="Manager"?"var(--accent-blue)":"var(--accent-green)", border:"1px solid rgba(148,163,184,0.2)" }}>{userRole} view</span>
          </div>
          <p style={{ margin:"4px 0 0",fontSize:14,color:"var(--text-secondary)" }}>Real-time insights from {stats.totalCalls} analyzed call{stats.totalCalls !== 1 ? "s" : ""}.</p>
        </div>
        <FilterBar activeFilter={timeFilter} setFilter={setTimeFilter} options={["Today","This Week","This Month","Custom Date"]} />
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:20,marginBottom:32 }}>
        <KPICard title="Total Calls" value={stats.totalCalls} icon="ti-phone-call" color="#3b82f6" />
        <KPICard title="Calls Today" value={stats.callsToday} icon="ti-bolt" color="#10b981" />
        <KPICard title="Avg AI Score" value={stats.avgScore} suffix="/100" icon="ti-brain" color="#06b6d4" />
        <KPICard title="Avg Sentiment" value={stats.avgSentiment} icon="ti-mood-smile" color="#10b981" />
        <KPICard title="Positive / Negative" value={`${stats.positivePct}% / ${stats.negativePct}%`} icon="ti-chart-pie" color="#f59e0b" />
        <KPICard title="Conversion Rate" value={stats.conversionRate} suffix="%" icon="ti-target" color="#ef4444" />
        <KPICard title="Follow-up Pending" value={stats.followUpPending} icon="ti-calendar-time" color="#f59e0b" />
        {userRole !== "Agent" && (
          <>
            <KPICard title="Top Agent" value={stats.topAgent ? stats.topAgent.name.split(" ")[0] + " " + (stats.topAgent.name.split(" ")[1]?.[0] || "") + "." : "—"} icon="ti-trophy" color="#3b82f6" />
            <KPICard title="Needs Coaching" value={stats.coachAgent && stats.coachAgent.id !== stats.topAgent?.id ? stats.coachAgent.name.split(" ")[0] + " " + (stats.coachAgent.name.split(" ")[1]?.[0] || "") + "." : "—"} icon="ti-user-exclamation" color="#ef4444" />
          </>
        )}
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr",gap:24,marginBottom:80 }}>
        <div className="glass-card" style={{ padding:"24px" }}>
          <h3 style={{ margin:"0 0 24px",fontSize:16,fontWeight:600 }}>Call Volume (Last 7 Days)</h3>
          <div style={{ height:260,width:"100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.callVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip contentStyle={{ background:"var(--glass)",border:"1px solid var(--border-accent)",borderRadius:8 }} itemStyle={{ color:"var(--text-primary)" }} cursor={{ fill:"rgba(59,130,246,0.1)" }} />
                <Bar dataKey="calls" fill="var(--accent-blue)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" style={{ padding:"24px" }}>
          <h3 style={{ margin:"0 0 24px",fontSize:16,fontWeight:600 }}>AI Score Trend</h3>
          {stats.scoreTrend.length < 2 ? (
            <div style={{ height:260,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-muted)",flexDirection:"column",gap:8 }}>
              <i className="ti ti-chart-line" style={{ fontSize:32,opacity:0.4 }} />
              <p style={{ margin:0,fontSize:13 }}>Need more days of data to show trend</p>
            </div>
          ) : (
            <div style={{ height:260,width:"100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.scoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0,100]} stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ background:"var(--glass)",border:"1px solid var(--border-accent)",borderRadius:8 }} />
                  <Line type="monotone" dataKey="score" stroke="var(--accent-cyan)" strokeWidth={3} dot={{ r:4,fill:"var(--accent-cyan)" }} activeDot={{ r:6,fill:"#fff",stroke:"var(--accent-cyan)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
