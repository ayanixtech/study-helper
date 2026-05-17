import { useState, useRef } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { ref, set, get, remove } from "firebase/database";
import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_KEY      = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export default function Login() {
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [isSignup,      setIsSignup]      = useState(false);
  const [message,       setMessage]       = useState("");
  const [loading,       setLoading]       = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [step,          setStep]          = useState("auth"); // 'auth' | 'otp'
  const [otpDigits,     setOtpDigits]     = useState(["","","","","",""]);
  const [tempUid,       setTempUid]       = useState("");
  const inputRefs = useRef([]);

  /* ── helpers ─────────────────────────────────────────── */
  const makeOtp = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

  const sendOtp = async (uid, toEmail) => {
    const code = makeOtp();
    await set(ref(db, `otps/${uid}`), {
      otp: code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
    });
    await emailjs.send(
      EMAILJS_SERVICE,
      EMAILJS_TEMPLATE,
      { to_email: toEmail, otp: code, user_name: toEmail.split("@")[0] },
      EMAILJS_KEY
    );
  };

  /* ── sign-up / login ──────────────────────────────────── */
  const handleAuth = async () => {
    if (!email || !password) {
      setMessage("❌ Email aur password dono bharo!");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      if (isSignup) {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await sendOtp(res.user.uid, email);
        setTempUid(res.user.uid);
        await signOut(auth);
        setStep("otp");
      } else {
        const res = await signInWithEmailAndPassword(auth, email, password);
        const snap = await get(ref(db, `verified/${res.user.uid}`));
        if (!snap.val()) {
          await signOut(auth);
          setMessage("⚠️ Email verify nahi hai! Signup karo ya OTP resend karo.");
        }
        // Agar verified hai → App.jsx automatically StudyPage dikhayega
      }
    } catch (e) {
      const msgs = {
        "auth/invalid-credential":   "❌ Email ya password galat hai!",
        "auth/wrong-password":        "❌ Email ya password galat hai!",
        "auth/user-not-found":        "❌ Account nahi mila! Pehle signup karo.",
        "auth/email-already-in-use":  "❌ Yeh email pehle se registered hai!",
        "auth/weak-password":         "❌ Password kam se kam 6 characters ka hona chahiye!",
        "auth/invalid-email":         "❌ Sahi email format daalo.",
      };
      setMessage(msgs[e.code] || "❌ " + e.message);
    }
    setLoading(false);
  };

  /* ── OTP input logic ──────────────────────────────────── */
  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otpDigits];
    next[idx] = val.slice(-1);
    setOtpDigits(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "Enter") handleOtpVerify();
  };

  /* ── OTP verify ───────────────────────────────────────── */
  const handleOtpVerify = async () => {
    const code = otpDigits.join("");
    if (code.length < 6) {
      setMessage("❌ Pura 6-digit OTP bharo!");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const snap = await get(ref(db, `otps/${tempUid}`));
      if (!snap.exists()) {
        setMessage("❌ OTP expire ho gaya! Resend karo.");
        setLoading(false);
        return;
      }
      const { otp: saved, expiresAt } = snap.val();
      if (Date.now() > expiresAt) {
        await remove(ref(db, `otps/${tempUid}`));
        setMessage("❌ OTP expire ho gaya! Resend karo.");
        setLoading(false);
        return;
      }
      if (code !== saved) {
        setMessage("❌ Galat OTP! Dobara check karo.");
        setLoading(false);
        return;
      }
      await remove(ref(db, `otps/${tempUid}`));
      await set(ref(db, `verified/${tempUid}`), true);
      setMessage("✅ Email verify ho gaya! Ab login karo.");
      setStep("auth");
      setIsSignup(false);
      setOtpDigits(["","","","","",""]);
    } catch {
      setMessage("❌ Kuch gadbad hui, dobara try karo.");
    }
    setLoading(false);
  };

  /* ── resend OTP ───────────────────────────────────────── */
  const handleResend = async () => {
    setResendLoading(true);
    setMessage("");
    try {
      await sendOtp(tempUid, email);
      setMessage("✅ Naya OTP bheja gaya!");
    } catch {
      setMessage("❌ Resend nahi hua, thodi der baad try karo.");
    }
    setResendLoading(false);
  };

  /* ════════════════════════════════════════════════════════
     OTP SCREEN
  ════════════════════════════════════════════════════════ */
  if (step === "otp") {
    return (
      <div style={S.outer}>
        <div style={{ ...S.card, maxWidth: "420px" }}>

          {/* Icon */}
          <div style={S.iconCircle}>📧</div>

          <h2 style={S.title}>OTP Verify Karo</h2>
          <p style={S.sub}>6-digit code bheja gaya hai</p>
          <p style={{ color: "#4f8ef7", fontSize: "14px", fontWeight: "500",
                       margin: "0 0 28px", textAlign: "center" }}>
            {email}
          </p>

          {/* 6-digit OTP boxes */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "center",
                         marginBottom: "24px" }}>
            {otpDigits.map((digit, i) => (
              <input
                key={i}
                ref={el => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(e.target.value, i)}
                onKeyDown={e => handleOtpKeyDown(e, i)}
                style={{
                  width: "46px", height: "56px",
                  textAlign: "center", fontSize: "24px", fontWeight: "700",
                  background: "#0f0f0f",
                  border: digit ? "2px solid #4f46e5" : "1px solid #2a2a2a",
                  borderRadius: "10px", color: "#fff", outline: "none",
                  transition: "border 0.2s",
                }}
              />
            ))}
          </div>

          {/* Verify button */}
          <button onClick={handleOtpVerify} disabled={loading} style={S.primaryBtn}>
            {loading ? "Verify ho raha hai..." : "✅ Verify Karo"}
          </button>

          {/* Resend */}
          <button onClick={handleResend} disabled={resendLoading}
                  style={{ ...S.outlineBtn, marginTop: "10px" }}>
            {resendLoading ? "Bhej raha hai..." : "🔄 OTP Dobara Bhejo"}
          </button>

          {/* Back */}
          <button onClick={() => {
            setStep("auth");
            setOtpDigits(["","","","","",""]);
            setMessage("");
          }} style={{ ...S.ghostBtn, marginTop: "10px" }}>
            ← Back to Login
          </button>

          {/* Message */}
          {message && (
            <p style={{ fontSize: "13px", marginTop: "16px", textAlign: "center",
                         color: message.startsWith("✅") ? "#4ade80" : "#f87171" }}>
              {message}
            </p>
          )}

          <p style={{ fontSize: "12px", color: "#444", marginTop: "20px",
                       textAlign: "center" }}>
            Email nahi mila? Spam / Junk folder check karo
          </p>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     AUTH SCREEN (Login / Signup)
  ════════════════════════════════════════════════════════ */
  return (
    <div style={S.outer}>
      <div style={{ ...S.card, maxWidth: "360px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "44px" }}>📚</div>
          <h2 style={{ color: "#fff", fontSize: "22px", marginTop: "8px",
                        fontWeight: "600", margin: "8px 0 4px" }}>
            Study Helper
          </h2>
          <p style={{ color: "#555", fontSize: "13px", margin: 0 }}>by Ayanix</p>
        </div>

        {/* Email */}
        <p style={S.label}>Email</p>
        <input
          type="email"
          placeholder="apna@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={S.input}
        />

        {/* Password */}
        <p style={{ ...S.label, marginTop: "14px" }}>Password</p>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAuth()}
          style={S.input}
        />

        {/* Submit */}
        <button
          onClick={handleAuth}
          disabled={loading}
          style={{
            ...S.primaryBtn,
            background: loading
              ? "#333"
              : "linear-gradient(135deg, #4f46e5, #7c3aed)",
            marginTop: "18px",
          }}
        >
          {loading ? "Loading..." : isSignup ? "Sign Up" : "Login"}
        </button>

        {/* Message */}
        {message && (
          <p style={{ marginTop: "14px", fontSize: "13px", textAlign: "center",
                       color: message.startsWith("✅") ? "#4ade80" : "#f87171" }}>
            {message}
          </p>
        )}

        {/* Toggle */}
        <p
          onClick={() => { setIsSignup(!isSignup); setMessage(""); }}
          style={{ textAlign: "center", marginTop: "22px", color: "#555",
                   fontSize: "13px", cursor: "pointer" }}
        >
          {isSignup
            ? "Already have account? Login"
            : "New user? Sign Up"}
        </p>
      </div>
    </div>
  );
}

/* ── styles ─────────────────────────────────────────────── */
const S = {
  outer: {
    display: "flex", justifyContent: "center", alignItems: "center",
    height: "100vh", background: "#0f0f0f", padding: "16px",
  },
  card: {
    background: "#1a1a1a", padding: "40px 32px",
    borderRadius: "18px", width: "100%", border: "1px solid #2a2a2a",
  },
  iconCircle: {
    width: "72px", height: "72px", borderRadius: "50%",
    background: "#1e3a5f", display: "flex", alignItems: "center",
    justifyContent: "center", margin: "0 auto 20px", fontSize: "34px",
  },
  title: {
    color: "#fff", fontSize: "20px", fontWeight: "500",
    margin: "0 0 6px", textAlign: "center",
  },
  sub: {
    color: "#666", fontSize: "14px", margin: "0 0 4px", textAlign: "center",
  },
  label: { color: "#666", fontSize: "12px", marginBottom: "6px" },
  input: {
    width: "100%", padding: "12px",
    background: "#0f0f0f", border: "1px solid #2a2a2a",
    borderRadius: "8px", color: "#fff", fontSize: "14px",
    outline: "none", boxSizing: "border-box",
  },
  primaryBtn: {
    width: "100%", padding: "12px", border: "none",
    borderRadius: "8px", color: "#fff", fontSize: "15px",
    cursor: "pointer", display: "block",
  },
  outlineBtn: {
    width: "100%", padding: "11px", background: "#1e3a5f",
    border: "none", borderRadius: "8px", color: "#4f8ef7",
    fontSize: "14px", cursor: "pointer", display: "block",
  },
  ghostBtn: {
    width: "100%", padding: "11px", background: "transparent",
    border: "1px solid #2a2a2a", borderRadius: "8px",
    color: "#555", fontSize: "14px", cursor: "pointer", display: "block",
  },
};