import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import Login from "./components/Login";
import StudyPage from "./pages/StudyPage";

function App() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Firebase DB mein check karo — OTP se verified hai ya nahi
        const snap = await get(ref(db, `verified/${u.uid}`));
        if (snap.val() === true) {
          setUser(u);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: "flex", justifyContent: "center",
        alignItems: "center", height: "100vh",
        background: "#0f0f0f", color: "#fff", fontSize: "18px",
      }}>
        Loading...
      </div>
    );
  }

  return user ? <StudyPage user={user} /> : <Login />;
}

export default App;