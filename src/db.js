// ─── LocalStorage Database ────────────────────────────────────────────────────
const AGENTS_KEY = "db_agents";
const CALLS_KEY  = "db_calls";

export function getAgents() {
  try { return JSON.parse(localStorage.getItem(AGENTS_KEY) || "[]"); }
  catch { return []; }
}

export function saveAgents(agents) {
  localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
}

export function addAgent(agent) {
  const agents = getAgents();
  const newAgent = { ...agent, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  agents.push(newAgent);
  saveAgents(agents);
  return newAgent;
}

export function updateAgent(id, updates) {
  const agents = getAgents().map(a => a.id === id ? { ...a, ...updates } : a);
  saveAgents(agents);
}

export function deleteAgent(id) {
  saveAgents(getAgents().filter(a => a.id !== id));
  // Also remove calls linked to this agent
  saveCalls(getCalls().filter(c => c.agentId !== id));
}

export function getCalls() {
  try { return JSON.parse(localStorage.getItem(CALLS_KEY) || "[]"); }
  catch { return []; }
}

export function saveCalls(calls) {
  localStorage.setItem(CALLS_KEY, JSON.stringify(calls));
}

export function addCall(call) {
  const calls = getCalls();
  const newCall = { ...call, id: crypto.randomUUID(), savedAt: new Date().toISOString() };
  calls.push(newCall);
  saveCalls(calls);
  return newCall;
}

export function deleteCall(id) {
  saveCalls(getCalls().filter(c => c.id !== id));
}

// ─── Derived stats helpers ─────────────────────────────────────────────────────
export function getAgentStats(agentId) {
  const calls = getCalls().filter(c => c.agentId === agentId && c.analysis);
  if (!calls.length) return null;
  const scores = calls.map(c => c.analysis.overallScore || 0);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const positive = calls.filter(c => c.analysis.sentiment === "Positive").length;
  const booked   = calls.filter(c => c.analysis.outcome === "Booked").length;
  const closingRate = Math.round((booked / calls.length) * 100);
  const positivePct = Math.round((positive / calls.length) * 100);

  // Stage scores — derived from the AI's conversationCoverage output (intent-based
  // stage coverage), not from rigid question checklists.
  const stageScores = { Discovery: [], Qualification: [], "Solution Presentation": [], "Objection Handling": [] };
  calls.forEach(c => {
    const coverage = c.analysis.conversationCoverage || [];
    Object.keys(stageScores).forEach(stage => {
      const entry = coverage.find(s => s.stage === stage);
      if (entry) stageScores[stage].push(typeof entry.score === "number" ? entry.score : (entry.covered ? 100 : 0));
    });
  });
  const avg = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;

  return {
    callsHandled: calls.length,
    avgScore,
    closingRate,
    positivePct,
    sentiment: positivePct >= 60 ? "Highly Positive" : positivePct >= 40 ? "Positive" : positivePct >= 20 ? "Neutral" : "Negative",
    discoveryScore: avg(stageScores["Discovery"]),
    qualificationScore: avg(stageScores["Qualification"]),
    salesScore: avg(stageScores["Solution Presentation"]),
    objectionScore: avg(stageScores["Objection Handling"]),
    calls,
  };
}

export function getDashboardStats() {
  const calls = getCalls();
  const agents = getAgents();
  if (!calls.length) return null;

  const today = new Date().toDateString();
  const callsToday = calls.filter(c => new Date(c.savedAt).toDateString() === today);
  const doneCalls = calls.filter(c => c.analysis);

  const avgScore = doneCalls.length
    ? Math.round(doneCalls.reduce((s, c) => s + (c.analysis.overallScore || 0), 0) / doneCalls.length)
    : 0;

  const positiveCalls = doneCalls.filter(c => c.analysis.sentiment === "Positive").length;
  const negativeCalls = doneCalls.filter(c => c.analysis.sentiment === "Negative").length;
  const positivePct = doneCalls.length ? Math.round((positiveCalls / doneCalls.length) * 100) : 0;
  const negativePct = doneCalls.length ? Math.round((negativeCalls / doneCalls.length) * 100) : 0;
  const avgSentiment = positivePct >= 50 ? "Positive" : positivePct >= 30 ? "Neutral" : "Negative";

  const followUpPending = doneCalls.filter(c => c.analysis.outcome === "Follow-up").length;
  const booked = doneCalls.filter(c => c.analysis.outcome === "Booked").length;
  const conversionRate = doneCalls.length ? Math.round((booked / doneCalls.length) * 100) : 0;

  // Top / needs coaching agent
  let topAgent = null, coachAgent = null;
  const agentScores = agents.map(a => {
    const stats = getAgentStats(a.id);
    return { agent: a, avgScore: stats ? stats.avgScore : null };
  }).filter(x => x.avgScore !== null);

  if (agentScores.length) {
    agentScores.sort((a, b) => b.avgScore - a.avgScore);
    topAgent = agentScores[0].agent;
    coachAgent = agentScores[agentScores.length - 1].agent;
  }

  // Weekly call volume (last 7 days)
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const volumeMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    volumeMap[d.toDateString()] = { name: days[d.getDay()], calls: 0 };
  }
  calls.forEach(c => {
    const key = new Date(c.savedAt).toDateString();
    if (volumeMap[key]) volumeMap[key].calls++;
  });
  const callVolume = Object.values(volumeMap);

  // Weekly avg score trend (last 7 days)
  const scoreTrend = Object.entries(volumeMap).map(([dateStr, { name }]) => {
    const dayCalls = calls.filter(c => new Date(c.savedAt).toDateString() === dateStr && c.analysis);
    const score = dayCalls.length
      ? Math.round(dayCalls.reduce((s,c) => s+(c.analysis.overallScore||0),0)/dayCalls.length)
      : null;
    return { date: name, score };
  }).filter(x => x.score !== null);

  return {
    totalCalls: calls.length,
    callsToday: callsToday.length,
    avgScore,
    avgSentiment,
    positivePct,
    negativePct,
    conversionRate,
    followUpPending,
    topAgent,
    coachAgent,
    callVolume,
    scoreTrend,
  };
}
