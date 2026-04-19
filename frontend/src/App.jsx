import React, { useState, useEffect } from "react";
import { Provider, useSelector, useDispatch } from "react-redux";
import store from "./store";
import LogInteractionForm from "./components/LogInteractionForm";
import ChatInterface from "./components/ChatInterface";
import InteractionsList from "./components/InteractionsList";
import { fetchInteractions } from "./store/interactionsSlice";
import "./styles/global.css";

function AppContent() {
  const [mode, setMode] = useState("form"); // "form" | "chat"
  const dispatch = useDispatch();
  const { list } = useSelector((s) => s.interactions);

  useEffect(() => {
    dispatch(fetchInteractions());
  }, [dispatch]);

  const positiveCount = list.filter((i) => i.sentiment === "Positive").length;
  const negativeCount = list.filter((i) => i.sentiment === "Negative").length;
  const neutralCount = list.filter((i) => i.sentiment === "Neutral").length;

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="logo-dot" />
          <span>HCP CRM</span>
          <span className="navbar-badge">AI-First</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--text-muted)" }}>
          <span>🤖 Powered by LangGraph + Groq gemma2-9b-it</span>
        </div>
      </nav>

      <div className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <h1>Log Interaction Screen</h1>
          <p>Track and manage Healthcare Professional interactions using AI</p>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{list.length}</div>
            <div className="stat-label">Total Interactions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--success)" }}>{positiveCount}</div>
            <div className="stat-label">Positive Meetings</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--text-muted)" }}>{neutralCount}</div>
            <div className="stat-label">Neutral Meetings</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--danger)" }}>{negativeCount}</div>
            <div className="stat-label">Needs Follow-up</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--secondary)" }}>5</div>
            <div className="stat-label">AI Tools Active</div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="two-col" style={{ marginBottom: 24 }}>
          {/* Left: Log Interaction */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                📝 Log Interaction
              </div>
              {/* Mode Toggle */}
              <div className="mode-toggle">
                <button
                  className={`mode-btn ${mode === "form" ? "active" : ""}`}
                  onClick={() => setMode("form")}
                >
                  📋 Form
                </button>
                <button
                  className={`mode-btn ${mode === "chat" ? "active" : ""}`}
                  onClick={() => setMode("chat")}
                >
                  💬 Chat
                </button>
              </div>
            </div>

            <div className="card-body" style={{ padding: mode === "chat" ? 0 : 20 }}>
              {mode === "form" ? (
                <LogInteractionForm />
              ) : (
                <ChatInterface />
              )}
            </div>
          </div>

          {/* Right: AI Tools Info */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">🤖 LangGraph AI Tools</div>
            </div>
            <div className="card-body">
              {[
                {
                  icon: "🔵",
                  name: "Log Interaction",
                  desc: "Extracts doctor name, topics, sentiment from natural language and saves to database",
                  example: "\"Met Dr. Patel, discussed Cardovex — very positive\"",
                },
                {
                  icon: "🟡",
                  name: "Edit Interaction",
                  desc: "Updates any field of an existing interaction by ID",
                  example: "\"Edit interaction 2 — change sentiment to Positive\"",
                },
                {
                  icon: "🟢",
                  name: "Get Interactions",
                  desc: "Retrieves past HCP interaction records, filterable by doctor",
                  example: "\"Show me all interactions with Dr. Mehta\"",
                },
                {
                  icon: "🔴",
                  name: "Delete Interaction",
                  desc: "Removes an interaction record by ID",
                  example: "\"Delete interaction 4\"",
                },
                {
                  icon: "🟣",
                  name: "Suggest Next Action",
                  desc: "AI analyzes past meetings and recommends follow-up strategy",
                  example: "\"What should I do next with Dr. Kapoor?\"",
                },
              ].map((tool) => (
                <div
                  key={tool.name}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{tool.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{tool.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{tool.desc}</div>
                    <div style={{ fontSize: 11, color: "var(--primary)", marginTop: 4, fontStyle: "italic" }}>
                      e.g. {tool.example}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactions Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📋 All Interactions</div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{list.length} records</span>
          </div>
          <div className="card-body">
            <InteractionsList />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
