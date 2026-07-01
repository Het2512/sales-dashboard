import { Component } from "react";

// New feature: without this, any uncaught error in a child component (like the
// "tabs is not defined" crash that was in AnalysisPanel) unmounts the entire
// React tree and leaves the user staring at a blank white page with no way to
// recover except a hard refresh — and even then, if they land back on the same
// call, the same crash happens again. This boundary catches render errors,
// shows a friendly message with the actual error, and offers a "Reload" button.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Uncaught error in app:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 16, padding: 40, textAlign: "center", background: "#0a0e17", color: "#e2e8f0" }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 56, color: "#ef4444" }} />
          <h2 style={{ margin: 0 }}>Something went wrong</h2>
          <p style={{ margin: 0, maxWidth: 480, color: "#94a3b8", fontSize: 14 }}>
            The app hit an unexpected error and had to stop. Your saved agents, calls, and
            settings are safe in this browser's storage. Reloading usually fixes it.
          </p>
          <pre style={{ maxWidth: 560, whiteSpace: "pre-wrap", fontSize: 12, color: "#f59e0b", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: 12, textAlign: "left" }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{ padding: "10px 24px", borderRadius: 10, background: "#3b82f6", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
