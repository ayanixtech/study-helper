import { useState, useRef, useEffect } from "react";
import { db, auth } from "../firebase";
import { ref, push, onValue, serverTimestamp, remove, set } from "firebase/database";
import { signOut } from "firebase/auth";
import EmojiPicker from "emoji-picker-react";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export default function ChatPage({ user, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  const myId = user.email.replace(/[@.]/g, "_");

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for messages in room
  useEffect(() => {
    if (!roomId) return;
    const msgRef = ref(db, `rooms/${roomId}/messages`);
    const unsub = onValue(msgRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        list.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(list);
      } else {
        setMessages([]);
      }
    });
    return () => unsub();
  }, [roomId]);

  // Listen for accepted requests (sender side)
  useEffect(() => {
    const reqRef = ref(db, `requests/${myId}`);
    const unsub = onValue(reqRef, (snap) => {
      const data = snap.val();
      if (!data) return;
      Object.entries(data).forEach(([fromId, val]) => {
        if (val.status === "accepted") {
          const emails = [user.email, val.fromEmail].sort();
          const id = emails.join("__").replace(/[@.]/g, "_");
          setRoomId(id);
          setPartnerEmail(val.fromEmail);
          setStatus("chatting");
          remove(ref(db, `requests/${myId}/${fromId}`));
        }
      });
    });
    return () => unsub();
  }, []);

  // Listen for incoming requests
  useEffect(() => {
    const reqRef = ref(db, `requests/${myId}`);
    const unsub = onValue(reqRef, (snap) => {
      const data = snap.val();
      if (!data) { setIncomingRequests([]); return; }
      const list = Object.entries(data)
        .filter(([, v]) => v.status === "pending")
        .map(([id, v]) => ({ id, ...v }));
      setIncomingRequests(list);
    });
    return () => unsub();
  }, []);

  const sendRequest = async () => {
    if (!partnerEmail.trim()) return;
    const partnerId = partnerEmail.trim().toLowerCase().replace(/[@.]/g, "_");
    setStatus("waiting");
    await set(ref(db, `requests/${partnerId}/${myId}`), {
      fromEmail: user.email,
      status: "pending",
      timestamp: serverTimestamp(),
    });
    const reqRef = ref(db, `requests/${partnerId}/${myId}/status`);
    onValue(reqRef, (snap) => {
      if (snap.val() === "accepted") {
        const emails = [user.email, partnerEmail.trim().toLowerCase()].sort();
        const id = emails.join("__").replace(/[@.]/g, "_");
        setRoomId(id);
        setStatus("chatting");
      } else if (snap.val() === "denied") {
        setStatus("denied");
      }
    });
  };

  const acceptRequest = async (fromId, fromEmail) => {
    await set(ref(db, `requests/${myId}/${fromId}/status`), "accepted");
    const emails = [user.email, fromEmail].sort();
    const id = emails.join("__").replace(/[@.]/g, "_");
    setRoomId(id);
    setPartnerEmail(fromEmail);
    setStatus("chatting");
  };

  const denyRequest = async (fromId) => {
    await set(ref(db, `requests/${myId}/${fromId}/status`), "denied");
    await remove(ref(db, `requests/${myId}/${fromId}`));
  };

  const send = async (text, mediaUrl = null, mediaType = null) => {
    if (!text.trim() && !mediaUrl) return;
    await push(ref(db, `rooms/${roomId}/messages`), {
      text: text.trim(),
      mediaUrl,
      mediaType,
      sender: user.email,
      timestamp: serverTimestamp(),
    });
    setInput("");
    setShowEmoji(false);
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 300 * 1024 * 1024) { alert("File 300MB se badi hai!"); return; }
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = async () => {
      const data = JSON.parse(xhr.responseText);
      const type = file.type.startsWith("video") ? "video" : "image";
      await send("", data.secure_url, type);
      setUploadProgress(null);
    };
    xhr.onerror = () => { alert("Upload failed!"); setUploadProgress(null); };
    xhr.send(formData);
    e.target.value = "";
  };

  const deleteMsg = async (id) => {
    await remove(ref(db, `rooms/${roomId}/messages/${id}`));
    setSelectedMsg(null);
  };

  const handleLogout = async () => {
    await remove(ref(db, `requests/${myId}`));
    await signOut(auth);
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  // ─── INCOMING REQUEST SCREEN ─────────────────────────────────────
  if (incomingRequests.length > 0 && status !== "chatting") {
    const req = incomingRequests[0];
    return (
      <div style={styles.page}>
        <BgGlow color="#ec4899" />
        <div style={{ ...styles.card, maxWidth: "340px", textAlign: "center", padding: "40px 32px" }}>
          <div style={{ fontSize: "56px", marginBottom: "20px" }}>💌</div>
          <h3 style={{ color: "#fff", fontSize: "19px", fontWeight: "700", margin: "0 0 8px", letterSpacing: "-0.3px" }}>
            Connection Request
          </h3>
          <div style={{ display: "inline-block", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "20px", padding: "6px 16px", margin: "0 0 10px" }}>
            <span style={{ color: "#818cf8", fontSize: "13px" }}>{req.fromEmail}</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: "0 0 28px" }}>
            tumse private chat karna chahta/chahti hai
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={() => denyRequest(req.id)} style={styles.denyBtn}>
              ✕ Deny
            </button>
            <button onClick={() => acceptRequest(req.id, req.fromEmail)} style={styles.acceptBtn}>
              ✓ Accept
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── SEND REQUEST SCREEN ──────────────────────────────────────────
  if (!roomId) {
    return (
      <div style={styles.page}>
        <BgGlow color="#6366f1" />
        <button onClick={onBack} style={styles.backFloatBtn}>←</button>

        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "80px", height: "80px", borderRadius: "28px", background: "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(244,63,94,0.2))", border: "1px solid rgba(236,72,153,0.3)", fontSize: "40px", marginBottom: "18px" }}>
            💕
          </div>
          <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: "700", margin: "0 0 6px", letterSpacing: "-0.5px" }}>Private Chat</h2>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: 0 }}>Connect with your partner</p>
        </div>

        {status === "waiting" && (
          <div style={{ ...styles.card, maxWidth: "340px", textAlign: "center", padding: "32px" }}>
            <div style={{ fontSize: "44px", marginBottom: "16px" }}>⏳</div>
            <p style={{ color: "#fff", fontSize: "15px", fontWeight: "600", margin: "0 0 8px" }}>Request bhej di!</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: 0 }}>
              <span style={{ color: "#818cf8" }}>{partnerEmail}</span> ke accept karne ka wait karo...
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "20px" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6366f1", animation: `pulse 1.4s ${i*0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {status === "denied" && (
          <div style={{ ...styles.card, maxWidth: "340px", textAlign: "center", padding: "32px", borderColor: "rgba(248,113,113,0.3)" }}>
            <div style={{ fontSize: "44px", marginBottom: "16px" }}>❌</div>
            <p style={{ color: "#f87171", fontSize: "15px", fontWeight: "600", margin: "0 0 20px" }}>Request deny kar di gayi</p>
            <button onClick={() => setStatus("idle")} style={{ padding: "10px 28px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff", cursor: "pointer", fontSize: "14px" }}>
              Try Again
            </button>
          </div>
        )}

        {status === "idle" && (
          <div style={{ ...styles.card, maxWidth: "380px", padding: "28px" }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", letterSpacing: "1px", fontWeight: "600", margin: "0 0 8px" }}>TUMHARA EMAIL</p>
            <div style={{ padding: "12px 16px", background: "rgba(99,102,241,0.1)", borderRadius: "10px", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8", fontSize: "13px", marginBottom: "20px", wordBreak: "break-all" }}>
              {user.email}
            </div>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", letterSpacing: "1px", fontWeight: "600", margin: "0 0 8px" }}>PARTNER KA EMAIL</p>
            <input
              type="email"
              placeholder="partner@email.com"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendRequest()}
              style={styles.input}
              onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
            <button onClick={sendRequest} style={styles.primaryBtn}>
              💕 Send Request
            </button>
          </div>
        )}
        <style>{`@keyframes pulse{0%,80%,100%{opacity:0.3;transform:scale(1)}40%{opacity:1;transform:scale(1.3)}}`}</style>
      </div>
    );
  }

  // ─── CHAT SCREEN ──────────────────────────────────────────────────
  return (
    <div style={{ height: "100vh", background: "#05050f", display: "flex", flexDirection: "column", fontFamily: "'Segoe UI', sans-serif", position: "relative" }}>

      {/* Ambient glow */}
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "500px", height: "180px", background: "radial-gradient(ellipse, rgba(236,72,153,0.1) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* HEADER */}
      <div style={{ position: "relative", zIndex: 2, padding: "14px 16px", background: "rgba(5,5,15,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "12px" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: "#818cf8", fontSize: "22px", cursor: "pointer", padding: "0", lineHeight: 1 }}>←</button>
        <div style={{ width: "40px", height: "40px", borderRadius: "14px", background: "linear-gradient(135deg, #ec4899, #f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", boxShadow: "0 0 16px rgba(236,72,153,0.35)", flexShrink: 0 }}>
          💕
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "#fff", fontSize: "14px", fontWeight: "700", margin: 0, letterSpacing: "-0.2px" }}>Private Chat</p>
          <p style={{ color: "#4ade80", fontSize: "11px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>● {partnerEmail}</p>
        </div>
        <button onClick={() => setShowSettings(true)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", padding: "8px 12px", borderRadius: "12px", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ⚙️
        </button>
      </div>

      {/* UPLOAD PROGRESS */}
      {uploadProgress !== null && (
        <div style={{ position: "relative", zIndex: 2, padding: "8px 16px", background: "rgba(5,5,15,0.8)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Uploading...</span>
            <span style={{ color: "#818cf8", fontSize: "12px", fontWeight: "600" }}>{uploadProgress}%</span>
          </div>
          <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "4px" }}>
            <div style={{ height: "100%", width: `${uploadProgress}%`, background: "linear-gradient(90deg, #6366f1, #ec4899)", borderRadius: "4px", transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      {/* MESSAGES */}
      <div
        style={{ flex: 1, overflowY: "auto", padding: "16px 14px 8px", display: "flex", flexDirection: "column", gap: "6px", position: "relative", zIndex: 1 }}
        onClick={() => { setSelectedMsg(null); setShowEmoji(false); }}
      >
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, color: "rgba(255,255,255,0.15)", paddingTop: "60px" }}>
            <div style={{ fontSize: "56px", marginBottom: "14px" }}>💕</div>
            <p style={{ fontSize: "14px", margin: 0 }}>Pehla message bhejo!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender === user.email;
          return (
            <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
              <div
                onClick={(e) => { e.stopPropagation(); setSelectedMsg(selectedMsg === msg.id ? null : msg.id); }}
                style={{ maxWidth: "72%", cursor: "pointer", position: "relative" }}
              >
                {/* Image thumbnail */}
                {msg.mediaType === "image" && (
                  <div
                    onClick={(e) => { e.stopPropagation(); setLightbox(msg.mediaUrl); }}
                    style={{ width: "190px", height: "190px", borderRadius: "16px", overflow: "hidden", cursor: "zoom-in", position: "relative", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <img src={msg.mediaUrl} alt="img" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)" }} />
                    <div style={{ position: "absolute", bottom: "8px", left: "10px", color: "rgba(255,255,255,0.7)", fontSize: "10px" }}>📷 Tap to open</div>
                  </div>
                )}

                {/* Video */}
                {msg.mediaType === "video" && (
                  <video src={msg.mediaUrl} controls style={{ width: "230px", borderRadius: "16px", display: "block", border: "1px solid rgba(255,255,255,0.08)" }} />
                )}

                {/* Text bubble */}
                {msg.text ? (
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: isMe ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.06)",
                    color: "#fff", fontSize: "14px", lineHeight: "1.55",
                    border: !isMe ? "1px solid rgba(255,255,255,0.08)" : "none",
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                    boxShadow: isMe ? "0 4px 16px rgba(99,102,241,0.25)" : "none",
                  }}>
                    {msg.text}
                  </div>
                ) : null}

                {/* Timestamp */}
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", textAlign: isMe ? "right" : "left", margin: "4px 2px 0" }}>
                  {formatTime(msg.timestamp)}
                </p>

                {/* Delete popup */}
                {selectedMsg === msg.id && isMe && (
                  <div
                    onClick={() => deleteMsg(msg.id)}
                    style={{ position: "absolute", top: "-40px", right: "0", background: "#1a1a2e", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "10px", padding: "7px 14px", cursor: "pointer", color: "#f87171", fontSize: "12px", whiteSpace: "nowrap", zIndex: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}
                  >
                    🗑️ Delete
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* EMOJI PICKER */}
      {showEmoji && (
        <div style={{ position: "absolute", bottom: "72px", left: "10px", zIndex: 100 }}>
          <EmojiPicker theme="dark" onEmojiClick={(e) => setInput(prev => prev + e.emoji)} height={340} width={300} />
        </div>
      )}

      {/* INPUT BAR */}
      <div style={{ position: "relative", zIndex: 2, padding: "10px 12px 14px", background: "rgba(5,5,15,0.9)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
        <button onClick={() => setShowEmoji(!showEmoji)} style={styles.iconBtn}>😊</button>
        <button onClick={() => fileRef.current.click()} disabled={uploadProgress !== null} style={styles.iconBtn}>
          {uploadProgress !== null ? "⏳" : "📎"}
        </button>
        <input type="file" ref={fileRef} accept="image/*,video/*" onChange={handleFile} style={{ display: "none" }} />
        <input
          type="text" placeholder="Message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          onClick={() => setShowEmoji(false)}
          style={{ flex: 1, padding: "11px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "22px", color: "#fff", fontSize: "14px", outline: "none" }}
          onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.4)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
        />
        <button
          onClick={() => send(input)}
          style={{ width: "42px", height: "42px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", cursor: "pointer", fontSize: "17px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}
        >
          ➤
        </button>
      </div>

      {/* LIGHTBOX */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.97)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, cursor: "zoom-out" }}
        >
          <img src={lightbox} alt="full" style={{ maxWidth: "95vw", maxHeight: "88vh", borderRadius: "12px", objectFit: "contain" }} />
          <button
            onClick={() => setLightbox(null)}
            style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "18px", cursor: "pointer", borderRadius: "50%", width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>
          <a
            href={lightbox} download
            onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", bottom: "24px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", padding: "12px 28px", borderRadius: "14px", textDecoration: "none", fontSize: "14px", fontWeight: "600", boxShadow: "0 4px 20px rgba(99,102,241,0.4)" }}
          >
            ⬇ Download
          </a>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div
          onClick={() => setShowSettings(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 999 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#0d0d1c", borderRadius: "24px 24px 0 0", padding: "8px 20px 32px", width: "100%", maxWidth: "500px", border: "1px solid rgba(255,255,255,0.07)", borderBottom: "none" }}
          >
            {/* Handle */}
            <div style={{ width: "40px", height: "4px", background: "rgba(255,255,255,0.12)", borderRadius: "4px", margin: "12px auto 20px" }} />

            {/* Title */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#fff", fontSize: "18px", fontWeight: "700", margin: 0, letterSpacing: "-0.3px" }}>Settings</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", width: "34px", height: "34px", borderRadius: "50%", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {/* Profile */}
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "16px", marginBottom: "10px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "16px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>
                👤
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: "#fff", fontSize: "15px", fontWeight: "600", margin: "0 0 3px", letterSpacing: "-0.2px" }}>{user.displayName || "Student"}</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "20px", padding: "2px 10px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80" }} />
                  <span style={{ color: "#4ade80", fontSize: "11px" }}>Verified</span>
                </div>
              </div>
            </div>

            {/* Chat info */}
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "14px 16px", marginBottom: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", letterSpacing: "1px", fontWeight: "600", margin: "0 0 10px" }}>CHAT WITH</p>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg, #ec4899, #f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>💕</div>
                <div>
                  <p style={{ color: "#fff", fontSize: "13px", margin: 0 }}>{partnerEmail}</p>
                  <p style={{ color: "#4ade80", fontSize: "11px", margin: 0 }}>● Connected</p>
                </div>
              </div>
            </div>

            {/* App info */}
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "14px 16px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", letterSpacing: "1px", fontWeight: "600", margin: "0 0 10px" }}>APP INFO</p>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>Version</span>
                <span style={{ color: "#fff", fontSize: "13px" }}>1.0.0</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>Developer</span>
                <span style={{ color: "#818cf8", fontSize: "13px", fontWeight: "600" }}>Ayanix Tech</span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              style={{ width: "100%", padding: "14px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "14px", color: "#f87171", fontSize: "15px", fontWeight: "600", cursor: "pointer", letterSpacing: "-0.2px" }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────

function BgGlow({ color }) {
  return (
    <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "500px", height: "200px", background: `radial-gradient(ellipse, ${color}18 0%, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const styles = {
  page: {
    height: "100vh",
    background: "#05050f",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "'Segoe UI', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "28px",
    width: "100%",
    backdropFilter: "blur(20px)",
    position: "relative",
    zIndex: 1,
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    marginBottom: "16px",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  primaryBtn: {
    width: "100%",
    padding: "13px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    letterSpacing: "-0.2px",
    boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
  },
  acceptBtn: {
    flex: 1,
    padding: "12px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  denyBtn: {
    flex: 1,
    padding: "12px",
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.3)",
    borderRadius: "12px",
    color: "#f87171",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  backFloatBtn: {
    position: "absolute",
    top: "16px",
    left: "16px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#818cf8",
    fontSize: "20px",
    cursor: "pointer",
    borderRadius: "12px",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  iconBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    fontSize: "20px",
    cursor: "pointer",
    padding: "0",
    borderRadius: "12px",
    width: "42px",
    height: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
};