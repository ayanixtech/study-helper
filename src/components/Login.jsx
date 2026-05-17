import { useState } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyScreen, setVerifyScreen] = useState(false);

  const handle = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (isSignup) {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(res.user);
        await signOut(auth);
        setVerifyScreen(true);
      } else {
        const res = await signInWithEmailAndPassword(auth, email, password);
        if (!res.user.emailVerified) {
          await signOut(auth);
          setMessage("⚠️ Email verify nahi hai! Inbox check karo.");
        }
      }
    } catch (e) {
      if (e.code === "auth/invalid-credential" || e.code === "auth/wrong-password") {
        setMessage("❌ Email ya password galat hai!");
      } else if (e.code === "auth/user-not-found") {
        setMessage("❌ Account nahi mila! Pehle signup karo.");
      } else if (e.code === "auth/email-already-in-use") {
        setMessage("❌ Yeh email pehle se registered hai!");
      } else if (e.code === "auth/weak-password") {
        setMessage("❌ Password kam se kam 6 characters ka hona chahiye!");
      } else {
        setMessage("❌ " + e.message);
      }
    }
    setLoading(false);
  };

  if (verifyScreen) {
    return (
      <div style={{
        display: "flex", justifyContent: "center",
        alignItems: "center", height: "100vh", background: "#0f0f0f",
      }}>
        <div style={{
          background: "#1a1a1a", padding: "40px", borderRadius: "16px",
          width: "360px", border: "1px solid #2a2a2a", textAlign: "center",
        }}>
          <div style={{ fontSize: "52px", marginBottom: "16px" }}>{"📧"}</div>
          <h2 style={{ color: "#fff", fontSize: "20px", marginBottom: "12px" }}>
            Email Verify Karo!
          </h2>
          <p style={{ color: "#666", fontSize: "13px", marginBottom: "8px" }}>
            {"Verification link bheja hai:"}
          </p>
          <p style={{ color: "#4f46e5", fontSize: "14px", marginBottom: "24px" }}>
            {email}
          </p>
          <p style={{ color: "#555", fontSize: "12px", marginBottom: "24px" }}>
            Inbox me jaao → Link pe click karo → Wapas aao login karo
          </p>
          <button
            onClick={() => {
              setVerifyScreen(false);
              setIsSignup(false);
              setMessage("✅ Ab login karo!");
            }}
            style={{
              width: "100%", padding: "12px",
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              border: "none", borderRadius: "8px",
              color: "#fff", fontSize: "15px", cursor: "pointer",
            }}
          >
            {"Login Page Pe Jao"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", justifyContent: "center",
      alignItems: "center", height: "100vh", background: "#0f0f0f",
    }}>
      <div style={{
        background: "#1a1a1a", padding: "40px",
        borderRadius: "16px", width: "360px", border: "1px solid #2a2a2a",
      }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "40px" }}>{"📚"}</div>
          <h2 style={{ color: "#fff", fontSize: "22px", marginTop: "8px" }}>
            Study Helper
          </h2>
          <p style={{ color: "#666", fontSize: "13px" }}>by Ayanix</p>
        </div>

        <p style={{ color: "#666", fontSize: "12px", marginBottom: "6px" }}>Email</p>
        <input
          type="email"
          placeholder="apna@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <p style={{ color: "#666", fontSize: "12px", marginBottom: "6px", marginTop: "12px" }}>Password</p>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handle()}
          style={inputStyle}
        />

        <button
          onClick={handle}
          disabled={loading}
          style={{
            width: "100%", padding: "12px",
            background: loading ? "#333" : "linear-gradient(135deg, #4f46e5, #7c3aed)",
            color: "#fff", border: "none", borderRadius: "8px",
            fontSize: "15px", cursor: "pointer", marginTop: "16px",
          }}
        >
          {loading ? "Loading..." : isSignup ? "Sign Up" : "Login"}
        </button>

        {message && (
          <p style={{
            marginTop: "16px", fontSize: "13px", textAlign: "center",
            color: message.includes("✅") ? "#4ade80" : "#f87171",
          }}>
            {message}
          </p>
        )}

        <p
          onClick={() => { setIsSignup(!isSignup); setMessage(""); }}
          style={{
            textAlign: "center", marginTop: "20px",
            color: "#555", fontSize: "13px", cursor: "pointer",
          }}
        >
          {isSignup ? "Already have account? Login" : "New user? Sign Up"}
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "12px",
  background: "#0f0f0f", border: "1px solid #2a2a2a",
  borderRadius: "8px", color: "#fff", fontSize: "14px", outline: "none",
};