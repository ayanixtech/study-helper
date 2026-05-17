import { useState, useRef, useEffect } from "react";

const SUBJECTS = [
  { icon: "📐", label: "Mathematics", color: "#6366f1" },
  { icon: "🔬", label: "Science", color: "#06b6d4" },
  { icon: "🌍", label: "History", color: "#f59e0b" },
  { icon: "📖", label: "English", color: "#10b981" },
  { icon: "💻", label: "Computer", color: "#8b5cf6" },
  { icon: "🧮", label: "More...", color: "#f43f5e" },
];

const TIPS = [
  "What is Photosynthesis?",
  "Explain Pythagoras theorem",
  "When did French Revolution happen?",
  "What is the formula of H2O?",
  "How to write a good essay?",
];

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text) => {
    const q = text || input;
    if (!q.trim() || loading) return;
    const userMsg = { role: "user", content: q };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: "You are a helpful study assistant for Indian students. Always respond in English. Give clear, structured explanations with bullet points and examples. Redirect non-study questions politely." }, ...messages, userMsg],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setMessages(prev => [...prev, { role: "assistant", content: data.choices[0].message.content }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "❌ " + e.message }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#05050f" }}>
      
      {messages.length === 0 ? (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Hero */}
          <div style={{ textAlign: "center", paddingTop: "12px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "72px", height: "72px", borderRadius: "24px", background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(99,102,241,0.3)", fontSize: "36px", marginBottom: "16px" }}>🎓</div>
            <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: "700", margin: "0 0 6px", letterSpacing: "-0.5px" }}>AI Study Assistant</h2>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", margin: 0 }}>Ask anything — Math, Science, History, English & more</p>
          </div>

          {/* Subject grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            {SUBJECTS.map(s => (
              <div key={s.label} onClick={() => send(`Give me important ${s.label} topics for students`)}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "18px 10px", textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = s.color + "66"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>{s.icon}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: "500" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Quick tips */}
          <div>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px", fontWeight: "600", letterSpacing: "1px", marginBottom: "10px" }}>TRY ASKING</p>
            {TIPS.map(tip => (
              <div key={tip} onClick={() => send(tip)}
                style={{ padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", color: "rgba(255,255,255,0.45)", fontSize: "13px", cursor: "pointer", marginBottom: "8px", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "10px" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.color = "#a5b4fc"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
                <span style={{ color: "#6366f1", fontSize: "16px" }}>›</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: "10px", marginBottom: "14px", alignItems: "flex-end" }}>
              {msg.role === "assistant" && (
                <div style={{ width: "30px", height: "30px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>🎓</div>
              )}
              <div style={{ maxWidth: "78%", padding: "12px 16px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.role === "user" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.06)", color: "#fff", fontSize: "14px", lineHeight: "1.65", border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.08)" : "none", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", marginBottom: "14px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>🎓</div>
              <div style={{ padding: "12px 18px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px 18px 18px 4px", color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                <span style={{ display: "inline-flex", gap: "4px" }}>
                  {[0, 1, 2].map(i => <span key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6366f1", display: "inline-block", animation: `bounce 1.2s ${i * 0.2}s infinite` }} />)}
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* INPUT */}
      <div style={{ padding: "12px 16px 16px", background: "rgba(0,0,0,0.3)", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "10px", alignItems: "center" }}>
        <input type="text" placeholder="Ask your study doubt..." value={input}
          onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          style={{ flex: 1, padding: "12px 18px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", color: "#fff", fontSize: "14px", outline: "none" }}
          onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
        <button onClick={() => send()} disabled={loading} style={{ width: "44px", height: "44px", borderRadius: "13px", background: loading ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: "18px", cursor: loading ? "not-allowed" : "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          ➤
        </button>
      </div>

      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}