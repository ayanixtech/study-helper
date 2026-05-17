import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { ref, remove, set, get } from "firebase/database";
import ChatBot from "../components/ChatBot";
import ChatPage from "./ChatPage";
import NotesPage from "./NotesPage";

export default function StudyPage({ user }) {
  const [search, setSearch] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState("bot");
  const [showSettings, setShowSettings] = useState(false);
  const [secretCode, setSecretCode] = useState("myloveisrajani");
  const [newCode, setNewCode] = useState("");
  const [codeMsg, setCodeMsg] = useState("");
  const [shake, setShake] = useState(false);
  const [particles, setParticles] = useState([]);

  const myId = user.email.replace(/[@.]/g, "_");

  useEffect(() => {
    const loadCode = async () => {
      const snap = await get(ref(db, `users/${myId}/secretCode`));
      if (snap.exists()) setSecretCode(snap.val());
    };
    loadCode();
  }, []);

  useEffect(() => {
    const items = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 20 + 15,
      delay: Math.random() * 8,
      opacity: Math.random() * 0.4 + 0.1,
    }));
    setParticles(items);
  }, []);

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      if (search.toLowerCase().trim() === secretCode.toLowerCase().trim()) {
        setShowChat(true);
        setSearch("");
      } else if (search.trim().length > 0) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    }
  };

  const saveSecretCode = async () => {
    if (!newCode.trim() || newCode.trim().length < 4) {
      setCodeMsg("Kam se kam 4 characters ka code daalo!");
      return;
    }
    await set(ref(db, `users/${myId}/secretCode`), newCode.trim().toLowerCase());
    setSecretCode(newCode.trim().toLowerCase());
    setNewCode("");
    setCodeMsg("Secret code save ho gaya!");
    setTimeout(() => setCodeMsg(""), 3000);
  };

  const handleLogout = async () => {
    await remove(ref(db, `requests/${myId}`));
    await signOut(auth);
  };

  if (showChat) return <ChatPage user={user} onBack={() => setShowChat(false)} />;

  const tabs = [
    { id: "bot", label: "AI Assistant", icon: "🤖" },
    { id: "notes", label: "Notes", icon: "📝" },
    { id: "schedule", label: "Schedule", icon: "📅" },
  ];

  return (
    <div style={{ height: "100vh", background: "#030308", display: "flex", flexDirection: "column", fontFamily: "'Segoe UI', sans-serif", overflow: "hidden", position: "relative" }}>

      {/* ANIMATED BACKGROUND */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "60%", height: "60%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)", animation: "orb1 12s ease-in-out infinite alternate" }} />
        <div style={{ position: "absolute", top: "30%", right: "-15%", width: "55%", height: "55%", background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)", animation: "orb2 15s ease-in-out infinite alternate" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "20%", width: "50%", height: "40%", background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)", animation: "orb3 18s ease-in-out infinite alternate" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        {particles.map(p => (
          <div key={p.id} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px`, borderRadius: "50%", background: p.id % 3 === 0 ? "#6366f1" : p.id % 3 === 1 ? "#8b5cf6" : "#06b6d4", opacity: p.opacity, animation: `float ${p.speed}s ${p.delay}s ease-in-out infinite alternate` }} />
        ))}
      </div>

      {/* HEADER */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(3,3,8,0.85)", backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "13px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", boxShadow: "0 0 20px rgba(99,102,241,0.5), 0 0 40px rgba(99,102,241,0.2)" }}>📚</div>
          </div>
          <div>
            <p style={{ color: "#fff", fontSize: "16px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>Study Helper</p>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px", margin: 0, letterSpacing: "1.5px", fontWeight: "600" }}>BY AYANIX</p>
          </div>
        </div>

        <button
          onClick={() => setShowSettings(true)}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "7px 12px 7px 8px", cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
        >
          <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", color: "#fff" }}>
            {user.email[0].toUpperCase()}
          </div>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email.split("@")[0]}
          </span>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>⚙</span>
        </button>
      </div>

      {/* SEARCH BAR */}
      <div style={{ position: "relative", zIndex: 10, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(3,3,8,0.6)", backdropFilter: "blur(20px)" }}>
        <div style={{ position: "relative", animation: shake ? "shake 0.4s ease" : "none" }}>
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "15px", opacity: 0.35, pointerEvents: "none" }}>🔍</span>
          <input
            type="text"
            placeholder="Search topics, chapters, subjects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            style={{ width: "100%", padding: "12px 40px 12px 40px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box", transition: "all 0.25s", caretColor: "#6366f1" }}
            onFocus={e => { e.target.style.borderColor = "rgba(99,102,241,0.5)"; e.target.style.background = "rgba(99,102,241,0.08)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
            onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.07)"; e.target.style.background = "rgba(255,255,255,0.05)"; e.target.style.boxShadow = "none"; }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.4)", width: "22px", height: "22px", borderRadius: "50%", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", background: "rgba(3,3,8,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "0 4px" }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ flex: 1, padding: "13px 4px", background: "transparent", border: "none", borderBottom: activeTab === tab.id ? "2px solid #6366f1" : "2px solid transparent", color: activeTab === tab.id ? "#a5b4fc" : "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: "12px", fontWeight: activeTab === tab.id ? "700" : "400", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
          >
            <span style={{ fontSize: "14px" }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative", zIndex: 5 }}>
        {activeTab === "bot" && <ChatBot />}
        {activeTab === "notes" && <NotesPage />}
        {activeTab === "schedule" && (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "24px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px" }}>📅</div>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "14px", margin: 0 }}>Schedule — Coming Soon</p>
          </div>
        )}
      </div>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div onClick={() => setShowSettings(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 999 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#0a0a14", borderRadius: "24px 24px 0 0", padding: "6px 20px 40px", width: "100%", maxWidth: "500px", border: "1px solid rgba(255,255,255,0.07)", borderBottom: "none", animation: "slideUp 0.3s ease", maxHeight: "90vh", overflowY: "auto" }}>

            <div style={{ width: "36px", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", margin: "12px auto 20px" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#fff", fontSize: "18px", fontWeight: "700", margin: 0, letterSpacing: "-0.4px" }}>Settings</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", width: "34px", height: "34px", borderRadius: "50%", cursor: "pointer", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {/* Profile card */}
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "16px", marginBottom: "12px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "16px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "700", color: "#fff", flexShrink: 0, boxShadow: "0 0 20px rgba(99,102,241,0.35)" }}>
                {user.email[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: "#fff", fontSize: "15px", fontWeight: "700", margin: "0 0 3px", letterSpacing: "-0.3px" }}>{user.displayName || user.email.split("@")[0]}</p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "20px", padding: "2px 10px" }}>
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4ade80" }} />
                  <span style={{ color: "#4ade80", fontSize: "10px", fontWeight: "600", letterSpacing: "0.5px" }}>VERIFIED</span>
                </div>
              </div>
            </div>

            {/* Secret Code */}
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "16px", marginBottom: "12px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "16px" }}>🔐</span>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", letterSpacing: "1px", fontWeight: "700", margin: 0 }}>SECRET CHAT CODE</p>
              </div>
              <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "10px", padding: "10px 14px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>Current:</span>
                <span style={{ color: "#a5b4fc", fontSize: "13px", fontWeight: "700", fontFamily: "monospace", letterSpacing: "1px" }}>{secretCode}</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Naya code daalo (min 4 chars)..."
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveSecretCode()}
                  style={{ flex: 1, padding: "11px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#fff", fontSize: "13px", outline: "none" }}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.4)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
                <button onClick={saveSecretCode} style={{ padding: "11px 18px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(99,102,241,0.3)" }}>
                  Save
                </button>
              </div>
              {codeMsg && (
                <p style={{ color: codeMsg.includes("save") ? "#4ade80" : "#f87171", fontSize: "12px", margin: "8px 0 0", textAlign: "center" }}>{codeMsg}</p>
              )}
              <p style={{ color: "rgba(255,255,255,0.18)", fontSize: "11px", margin: "10px 0 0", lineHeight: 1.6 }}>
                Search bar mein code type karo + Enter dabao → Private chat khulegi
              </p>
            </div>

            {/* App Info */}
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "14px 16px", marginBottom: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px", letterSpacing: "1px", fontWeight: "700", margin: "0 0 10px" }}>APP INFO</p>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px" }}>Version</span>
                <span style={{ color: "#fff", fontSize: "13px", fontWeight: "600" }}>1.0.0</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px" }}>Developer</span>
                <span style={{ color: "#818cf8", fontSize: "13px", fontWeight: "700" }}>Ayanix Tech</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{ width: "100%", padding: "14px", background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "14px", color: "#f87171", fontSize: "15px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.13)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(248,113,113,0.07)"}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes orb1{0%{transform:translate(0,0) scale(1)}100%{transform:translate(5%,8%) scale(1.1)}}
        @keyframes orb2{0%{transform:translate(0,0) scale(1)}100%{transform:translate(-6%,-5%) scale(1.08)}}
        @keyframes orb3{0%{transform:translate(0,0) scale(1)}100%{transform:translate(4%,-6%) scale(1.12)}}
        @keyframes float{0%{transform:translateY(0) scale(1);opacity:0.1}100%{transform:translateY(-30px) scale(1.2);opacity:0.4}}
        @keyframes slideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
        *{-webkit-tap-highlight-color:transparent}
        input::placeholder{color:rgba(255,255,255,0.22)}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.3);border-radius:4px}
      `}</style>
    </div>
  );
}