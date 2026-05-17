import { useState } from "react";
import { notesData } from "../data/notes";

export default function NotesPage() {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [search, setSearch] = useState("");

  // Search across all notes
  const searchResults = search.trim().length > 2
    ? Object.entries(notesData).flatMap(([course, courseData]) =>
        Object.entries(courseData.subjects).flatMap(([subject, subjectData]) =>
          subjectData.chapters
            .filter(ch =>
              ch.title.toLowerCase().includes(search.toLowerCase()) ||
              ch.content.toLowerCase().includes(search.toLowerCase())
            )
            .map(ch => ({ course, subject, chapter: ch }))
        )
      )
    : [];

  // Chapter view
  if (selectedChapter) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#0a0a0f" }}>
        <div style={{
          padding: "14px 16px", background: "#141420",
          borderBottom: "1px solid #1e1e2e",
          display: "flex", alignItems: "center", gap: "12px",
        }}>
          <button onClick={() => setSelectedChapter(null)} style={backBtn}>{"←"}</button>
          <div>
            <p style={{ color: "#fff", fontSize: "14px", fontWeight: "600" }}>{selectedChapter.title}</p>
            <p style={{ color: "#666", fontSize: "11px" }}>{selectedSubject} • {selectedCourse}</p>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
          <div style={{
            background: "#141420", border: "1px solid #1e1e2e",
            borderRadius: "14px", padding: "20px",
            color: "#ddd", fontSize: "13px", lineHeight: "1.8",
            whiteSpace: "pre-wrap", fontFamily: "monospace",
          }}>
            {selectedChapter.content}
          </div>
        </div>
      </div>
    );
  }

  // Subject chapters view
  if (selectedSubject && selectedCourse) {
    const subjectData = notesData[selectedCourse].subjects[selectedSubject];
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#0a0a0f" }}>
        <div style={{
          padding: "14px 16px", background: "#141420",
          borderBottom: "1px solid #1e1e2e",
          display: "flex", alignItems: "center", gap: "12px",
        }}>
          <button onClick={() => setSelectedSubject(null)} style={backBtn}>{"←"}</button>
          <div>
            <p style={{ color: "#fff", fontSize: "15px", fontWeight: "600" }}>
              {subjectData.icon} {selectedSubject}
            </p>
            <p style={{ color: "#666", fontSize: "11px" }}>{selectedCourse}</p>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          <p style={{ color: "#444", fontSize: "11px", marginBottom: "12px" }}>
            {subjectData.chapters.length} CHAPTERS
          </p>
          {subjectData.chapters.map((ch, i) => (
            <div
              key={i}
              onClick={() => setSelectedChapter(ch)}
              style={{
                background: "#141420", border: "1px solid #1e1e2e",
                borderRadius: "12px", padding: "16px",
                marginBottom: "10px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "14px",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = notesData[selectedCourse].color}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e2e"}
            >
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: notesData[selectedCourse].color + "22",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px", flexShrink: 0,
                color: notesData[selectedCourse].color, fontWeight: "700",
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "#fff", fontSize: "13px", fontWeight: "500" }}>{ch.title}</p>
                <p style={{ color: "#555", fontSize: "11px", marginTop: "3px" }}>
                  {ch.content.split("\n").filter(l => l.startsWith("📌"))[0] || "Notes available"}
                </p>
              </div>
              <span style={{ color: "#333", fontSize: "18px" }}>{"›"}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Course subjects view
  if (selectedCourse) {
    const courseData = notesData[selectedCourse];
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#0a0a0f" }}>
        <div style={{
          padding: "14px 16px", background: "#141420",
          borderBottom: "1px solid #1e1e2e",
          display: "flex", alignItems: "center", gap: "12px",
        }}>
          <button onClick={() => setSelectedCourse(null)} style={backBtn}>{"←"}</button>
          <div>
            <p style={{ color: "#fff", fontSize: "15px", fontWeight: "600" }}>
              {courseData.icon} {selectedCourse}
            </p>
            <p style={{ color: "#666", fontSize: "11px" }}>
              {Object.keys(courseData.subjects).length} Subjects
            </p>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {Object.entries(courseData.subjects).map(([name, data]) => (
            <div
              key={name}
              onClick={() => setSelectedSubject(name)}
              style={{
                background: "#141420", border: "1px solid #1e1e2e",
                borderRadius: "14px", padding: "18px",
                marginBottom: "12px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "14px",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = courseData.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e2e"}
            >
              <div style={{
                width: "48px", height: "48px", borderRadius: "14px",
                background: courseData.color + "22",
                display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "24px", flexShrink: 0,
              }}>
                {data.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "#fff", fontSize: "14px", fontWeight: "600" }}>{name}</p>
                <p style={{ color: "#666", fontSize: "12px", marginTop: "3px" }}>
                  {data.chapters.length} chapters
                </p>
              </div>
              <span style={{ color: "#333", fontSize: "20px" }}>{"›"}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Home screen
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#0a0a0f" }}>
      {/* Search */}
      <div style={{ padding: "16px", background: "#141420", borderBottom: "1px solid #1e1e2e" }}>
        <input
          type="text"
          placeholder="🔍 Search notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "12px 16px",
            background: "#0a0a0f", border: "1px solid #1e1e2e",
            borderRadius: "12px", color: "#fff", fontSize: "14px", outline: "none",
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {/* Search Results */}
        {search.trim().length > 2 ? (
          <>
            <p style={{ color: "#444", fontSize: "11px", marginBottom: "12px" }}>
              {searchResults.length} RESULTS
            </p>
            {searchResults.length === 0 ? (
              <p style={{ color: "#444", textAlign: "center", marginTop: "40px" }}>
                Koi notes nahi mila
              </p>
            ) : searchResults.map((r, i) => (
              <div
                key={i}
                onClick={() => {
                  setSelectedCourse(r.course);
                  setSelectedSubject(r.subject);
                  setSelectedChapter(r.chapter);
                }}
                style={{
                  background: "#141420", border: "1px solid #1e1e2e",
                  borderRadius: "12px", padding: "14px",
                  marginBottom: "10px", cursor: "pointer",
                }}
              >
                <p style={{ color: "#fff", fontSize: "13px", fontWeight: "500" }}>{r.chapter.title}</p>
                <p style={{ color: "#555", fontSize: "11px", marginTop: "4px" }}>
                  {r.course} • {r.subject}
                </p>
              </div>
            ))}
          </>
        ) : (
          <>
            <p style={{ color: "#444", fontSize: "11px", marginBottom: "14px" }}>COURSES</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {Object.entries(notesData).map(([name, data]) => (
                <div
                  key={name}
                  onClick={() => setSelectedCourse(name)}
                  style={{
                    background: "#141420", border: "1px solid #1e1e2e",
                    borderRadius: "16px", padding: "20px",
                    cursor: "pointer", textAlign: "center",
                    borderTop: `3px solid ${data.color}`,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1a1a28"}
                  onMouseLeave={e => e.currentTarget.style.background = "#141420"}
                >
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}>{data.icon}</div>
                  <p style={{ color: "#fff", fontSize: "14px", fontWeight: "700" }}>{name}</p>
                  <p style={{ color: "#555", fontSize: "11px", marginTop: "6px" }}>
                    {Object.keys(data.subjects).length} subjects
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const backBtn = {
  background: "transparent", border: "none",
  color: "#4f46e5", fontSize: "22px", cursor: "pointer", padding: "0",
};