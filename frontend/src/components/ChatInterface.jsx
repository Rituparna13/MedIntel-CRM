import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendChatMessage, clearChat } from "../store/chatSlice";
import { fetchInteractions } from "../store/interactionsSlice";

const TOOL_LABELS = {
  log_interaction: "🔵 Tool: Log Interaction",
  edit_interaction: "🟡 Tool: Edit Interaction",
  get_interactions: "🟢 Tool: Get Interactions",
  delete_interaction: "🔴 Tool: Delete Interaction",
  suggest_next_action: "🟣 Tool: Suggest Next Action",
};

const SUGGESTIONS = [
  "Met Dr. Kapoor today, discussed Oncovax 200mg, he seemed very interested",
  "Show me last 5 interactions",
  "What should I do next with Dr. Sharma?",
  "Edit interaction 1 - change sentiment to Positive",
  "Delete interaction 3",
];

export default function ChatInterface() {
  const dispatch = useDispatch();
  const { messages, loading } = useSelector((s) => s.chat);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const buildHistory = () =>
    messages
      .filter((m) => m.role !== "assistant" || messages.indexOf(m) > 0)
      .map((m) => ({ role: m.role, content: m.content }));

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    dispatch(sendChatMessage({ message: msg, history: buildHistory() }))
      .then(() => dispatch(fetchInteractions()));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (text) => {
    setInput(text);
    inputRef.current?.focus();
  };

  return (
    <div className="chat-container">
      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.role}`}>
            <div className={`chat-avatar ${msg.role === "user" ? "user-avatar" : "bot-avatar"}`}>
              {msg.role === "user" ? "ME" : "🤖"}
            </div>
            <div>
              {msg.toolUsed && (
                <div className="tool-badge">
                  {TOOL_LABELS[msg.toolUsed] || `Tool: ${msg.toolUsed}`}
                </div>
              )}
              <div className={`chat-bubble ${msg.isError ? "error-bubble" : ""}`}>
                {msg.content}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-light)", marginTop: 3, paddingLeft: 2 }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-message assistant">
            <div className="chat-avatar bot-avatar">🤖</div>
            <div className="chat-bubble" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips */}
      {messages.length <= 1 && (
        <div className="suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="suggestion-chip" onClick={() => handleSuggestion(s)}>
              {s.length > 40 ? s.slice(0, 40) + "…" : s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="chat-input-area">
        <textarea
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          rows={1}
          disabled={loading}
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={loading || !input.trim()}>
          {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : "➤"}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => dispatch(clearChat())}
          style={{ whiteSpace: "nowrap" }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
