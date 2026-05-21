"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ATSPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const router = useRouter();

  // New Features
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [notifications, setNotifications] = useState<Array<{id: string; message: string; type: string}>>([]);
  const [history, setHistory] = useState<Array<{id: string; score: number; fileName: string; timestamp: string}>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [comments, setComments] = useState<Array<{id: string; author: string; text: string; timestamp: string}>>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [activity, setActivity] = useState<Array<{id: string; user: string; action: string; timestamp: string}>>([
    { id: "1", user: "You", action: "Started ATS checking", timestamp: "just now" }
  ]);
  const [teamMembers, setTeamMembers] = useState<Array<{id: string; name: string; role: string; avatar: string}>>([
    { id: "1", name: "You", role: "Owner", avatar: "👤" }
  ]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("viewer");
  const [stats, setStats] = useState({ checksCount: 0, averageScore: 0, membersCount: 1, savedJDs: 0 });
  const [jobTemplates, setJobTemplates] = useState<Array<{id: string; name: string; jd: string; industry: string}>>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleCheck = async () => {
    if (!file) {
      setError("Please upload your resume file.");
      return;
    }

    if (!jd.trim()) {
      setError("Please paste the job description.");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", jd.trim());

      const res = await fetch("http://localhost:5000/api/ats/check", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Server returned an error while checking your resume.");
      }

      const data = await res.json();
      const resultData = data.result || { atsScore: "N/A", summary: "No result received." };
      setResult(resultData);
      
      // Save to history and show notification
      const score = parseInt(resultData.atsScore) || 0;
      saveToHistory(score);
      addNotification("ATS check completed! ✅", "success");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMsg);
      addNotification(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for new features
  const addNotification = (message: string, type: string) => {
    const notification = {
      id: Date.now().toString(),
      message,
      type
    };
    setNotifications([...notifications, notification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 3000);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    addNotification(isFavorite ? "Removed from favorites" : "Added to favorites ⭐", "info");
  };

  const saveToHistory = (score: number) => {
    const historyItem = {
      id: Date.now().toString(),
      score: score,
      fileName: file?.name || "Unknown",
      timestamp: new Date().toLocaleTimeString()
    };
    setHistory([...history, historyItem]);
    setStats({ ...stats, checksCount: stats.checksCount + 1 });
  };

  const addComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now().toString(),
        author: "You",
        text: newComment,
        timestamp: "just now"
      };
      setComments([...comments, comment]);
      setActivity([...activity, {
        id: Date.now().toString(),
        user: "You",
        action: "Added a comment",
        timestamp: "just now"
      }]);
      setNewComment("");
    }
  };

  const saveJDTemplate = () => {
    if (jd.trim()) {
      const template = {
        id: Date.now().toString(),
        name: `JD_${new Date().toLocaleTimeString()}`,
        jd: jd,
        industry: "General"
      };
      setJobTemplates([...jobTemplates, template]);
      addNotification("Job description saved! 💾", "success");
    }
  };

  const loadTemplate = (template: any) => {
    setJd(template.jd);
    addNotification(`Loaded: ${template.name}`, "info");
  };

  const exportResults = () => {
    if (result) {
      const content = `ATS Check Report\n\nFile: ${file?.name}\nScore: ${result.atsScore}%\nFeedback: ${result.summary}\n\nTags: ${tags.join(", ")}\n\nComments:\n${comments.map(c => `${c.author}: ${c.text}`).join("\n")}`;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ats-result.txt";
      a.click();
      addNotification("Results exported! 📥", "success");
    }
  };

  const addTeamMember = () => {
    if (shareEmail.trim()) {
      const newMember = {
        id: Date.now().toString(),
        name: shareEmail.split("@")[0],
        role: shareRole,
        avatar: "👥"
      };
      setTeamMembers([...teamMembers, newMember]);
      setActivity([...activity, {
        id: Date.now().toString(),
        user: "You",
        action: `Added ${shareEmail} as ${shareRole}`,
        timestamp: "just now"
      }]);
      setShareEmail("");
      setShareRole("viewer");
    }
  };

  const removeTeamMember = (id: string) => {
    const member = teamMembers.find(m => m.id === id);
    setTeamMembers(teamMembers.filter(m => m.id !== id));
    if (member && member.name !== "You") {
      setActivity([...activity, {
        id: Date.now().toString(),
        user: "You",
        action: `Removed ${member.name} from collaboration`,
        timestamp: "just now"
      }]);
    }
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/dashboard/ats?shared=true`;
    navigator.clipboard.writeText(link);
    addNotification("Share link copied! 📋", "info");
  };
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Notifications */}
      <div style={styles.notificationsContainer}>
        {notifications.map((notif) => (
          <div key={notif.id} style={{...styles.notification, ...styles[`notification_${notif.type}`]}}>
            {notif.message}
          </div>
        ))}
      </div>

      <div style={styles.container}>
        {/* Left Column - Main Content */}
        <div style={styles.mainColumn}>
          <div style={styles.card}>
            <button style={styles.backButton} onClick={() => router.push("/dashboard")}>Back to Dashboard</button>

            <div style={styles.headerTop}>
              <div>
                <p style={styles.badge}>Resume ATS Checker</p>
                <h1 style={styles.title}>Optimize your resume for ATS</h1>
                <p style={styles.description}>
                  Upload your resume and paste the job description to get a fast AI-powered ATS score, feedback, and suggested improvements.
                </p>
              </div>
              <button 
                onClick={toggleFavorite}
                style={{...styles.favoriteBtn, background: isFavorite ? "#fbbf24" : "transparent"}}
                title="Add to favorites"
              >
                {isFavorite ? "⭐" : "☆"}
              </button>
            </div>

            <div style={styles.grid}>
              <div style={styles.formPanel}>
                <label style={styles.label}>Resume Upload</label>
                <div style={styles.uploadBox}>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    style={styles.fileInput}
                  />
                  <div style={styles.uploadText}>
                    {file ? (
                      <>
                        <strong>{file.name}</strong>
                        <span>{Math.round(file.size / 1024)} KB</span>
                      </>
                    ) : (
                      <>
                        <p>Choose your resume file</p>
                        <span>Supported: .pdf, .doc, .docx</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div style={styles.tagsSection}>
                  <div style={styles.tagsList}>
                    {tags.map((tag, idx) => (
                      <span key={idx} style={styles.tag}>
                        {tag}
                        <button 
                          onClick={() => removeTag(tag)}
                          style={styles.tagRemove}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={styles.tagInput}>
                    <input
                      type="text"
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      style={styles.tagInputField}
                    />
                    <button onClick={addTag} style={styles.tagBtn}>+</button>
                  </div>
                </div>

                <label style={styles.label}>Job Description</label>
                <textarea
                  style={styles.textarea}
                  placeholder="Paste the job description here..."
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                />

                {error && <p style={styles.error}>{error}</p>}

                <div style={styles.buttonGroup}>
                  <button
                    style={{
                      ...styles.actionButton,
                      opacity: loading ? 0.7 : 1,
                      cursor: loading ? "not-allowed" : "pointer",
                      flex: 1
                    }}
                    onClick={handleCheck}
                    disabled={loading}
                  >
                    {loading ? "Checking resume..." : "Check ATS Score"}
                  </button>
                  <button onClick={saveJDTemplate} style={{...styles.secondaryButton, flex: 1}}>
                    💾 Save JD
                  </button>
                  <button onClick={exportResults} style={{...styles.secondaryButton, flex: 1}}>
                    📥 Export
                  </button>
                </div>
              </div>

              <div style={styles.resultPanel}>
                <div style={styles.resultCard}>
                  <h2 style={styles.resultTitle}>Your Result</h2>
                  {!result && (
                    <p style={styles.helpText}>
                      Upload a resume and paste the job description, then click the button to see your ATS score and suggestions.
                    </p>
                  )}

                  {result && (
                    <>
                      <div style={styles.scoreBadge}>{result.atsScore}%</div>
                      <h3 style={styles.summaryTitle}>AI Feedback</h3>
                      <p style={styles.summary}>{result.summary}</p>
                    </>
                  )}
                </div>

                <div style={styles.tipCard}>
                  <h3 style={styles.tipTitle}>Resume Tips</h3>
                  <ul style={styles.tipList}>
                    <li>Use keywords from the job description.</li>
                    <li>Keep formatting clean and simple.</li>
                    <li>Highlight relevant achievements clearly.</li>
                    <li>Use standard section headings.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Collaboration Panel */}
        <div style={styles.sidebarColumn}>
          {/* Statistics */}
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>📊 Stats</h3>
            <div style={styles.statsList}>
              <div style={styles.statItem}>
                <div style={styles.statLabel}>Checks</div>
                <div style={styles.statValue}>{stats.checksCount}</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statLabel}>Avg Score</div>
                <div style={styles.statValue}>{Math.round(stats.averageScore)}%</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statLabel}>Saved JDs</div>
                <div style={styles.statValue}>{jobTemplates.length}</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statLabel}>Team</div>
                <div style={styles.statValue}>{teamMembers.length}</div>
              </div>
            </div>
          </div>

          {/* Job Templates */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>📋 Job Templates ({jobTemplates.length})</h3>
              <button onClick={() => setShowTemplates(!showTemplates)} style={styles.toggleBtn}>
                {showTemplates ? "▼" : "▶"}
              </button>
            </div>
            {showTemplates && (
              <div style={styles.templatesList}>
                {jobTemplates.length === 0 ? (
                  <p style={styles.emptyText}>No saved templates</p>
                ) : (
                  jobTemplates.map((template) => (
                    <div key={template.id} style={styles.templateItem}>
                      <div style={styles.templateName}>{template.name}</div>
                      <div style={styles.templateLang}>{template.industry}</div>
                      <div style={styles.templateActions}>
                        <button onClick={() => loadTemplate(template)} style={styles.snippetBtn}>
                          Load
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* History */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>⏱️ History ({history.length})</h3>
              <button onClick={() => setShowHistory(!showHistory)} style={styles.toggleBtn}>
                {showHistory ? "▼" : "▶"}
              </button>
            </div>
            {showHistory && (
              <div style={styles.historyList}>
                {history.length === 0 ? (
                  <p style={styles.emptyText}>No history yet</p>
                ) : (
                  history.slice().reverse().map((item) => (
                    <div key={item.id} style={styles.historyItem}>
                      <div style={styles.historyTime}>{item.timestamp}</div>
                      <div style={styles.historyScore}>Score: {item.score}%</div>
                      <div style={styles.historyFile}>{item.fileName}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Team Members */}
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>👥 Team Members</h3>
            <div style={styles.membersList}>
              {teamMembers.map((member) => (
                <div key={member.id} style={styles.memberItem}>
                  <span style={styles.memberAvatar}>{member.avatar}</span>
                  <div style={styles.memberInfo}>
                    <div style={styles.memberName}>{member.name}</div>
                    <div style={styles.memberRole}>{member.role}</div>
                  </div>
                  {member.name !== "You" && (
                    <button
                      onClick={() => removeTeamMember(member.id)}
                      style={styles.removeBtn}
                      title="Remove member"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowShareModal(!showShareModal)}
              style={styles.shareButton}
            >
              {showShareModal ? "Cancel" : "+ Add Member"}
            </button>

            {showShareModal && (
              <div style={styles.shareModal}>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  style={styles.shareInput}
                />
                <select
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value)}
                  style={styles.shareSelect}
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={addTeamMember} style={styles.inviteBtn}>
                  Invite
                </button>
              </div>
            )}

            <button onClick={copyShareLink} style={styles.linkButton}>
              📋 Copy Share Link
            </button>
          </div>

          {/* Comments */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>💬 Comments ({comments.length})</h3>
              <button onClick={() => setShowComments(!showComments)} style={styles.toggleBtn}>
                {showComments ? "▼" : "▶"}
              </button>
            </div>

            {showComments && (
              <>
                <div style={styles.commentsList}>
                  {comments.length === 0 ? (
                    <p style={styles.emptyText}>No comments yet</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} style={styles.commentItem}>
                        <div style={styles.commentAuthor}>{comment.author}</div>
                        <div style={styles.commentText}>{comment.text}</div>
                        <div style={styles.commentTime}>{comment.timestamp}</div>
                      </div>
                    ))
                  )}
                </div>

                <div style={styles.commentInput}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    style={styles.commentTextarea}
                  />
                  <button onClick={addComment} style={styles.commentBtn}>
                    Post
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Activity */}
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>📋 Activity</h3>
            <div style={styles.activityList}>
              {activity.slice().reverse().map((item) => (
                <div key={item.id} style={styles.activityItem}>
                  <div style={styles.activityUser}>{item.user}</div>
                  <div style={styles.activityAction}>{item.action}</div>
                  <div style={styles.activityTime}>{item.timestamp}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    padding: "30px",
    background: "radial-gradient(circle at top left, #1f2937, #0f172a 45%)",
    color: "#f8fafc",
  },
  container: {
    maxWidth: 1400,
    margin: "0 auto",
    display: "flex",
    gap: "24px",
  },
  mainColumn: {
    flex: 1,
    minWidth: 0,
  },
  sidebarColumn: {
    width: 340,
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  card: {
    background: "rgba(15, 23, 42, 0.92)",
    borderRadius: 24,
    boxShadow: "0 30px 80px rgba(15, 23, 42, 0.4)",
    padding: 32,
    border: "1px solid rgba(148, 163, 184, 0.12)",
  },
  panel: {
    background: "rgba(15, 23, 42, 0.94)",
    padding: 18,
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,0.18)",
    boxShadow: "0 20px 60px rgba(15,23,42,0.15)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  panelTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: "#e2e8f0",
  },
  toggleBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 14,
    padding: 0,
  },
  backButton: {
    marginBottom: 24,
    padding: "12px 18px",
    borderRadius: 12,
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "transparent",
    color: "#e2e8f0",
    cursor: "pointer",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 24,
    marginBottom: 28,
  },
  favoriteBtn: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid rgba(251,191,36,0.3)",
    background: "transparent",
    color: "#fbbf24",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  },
  badge: {
    display: "inline-block",
    marginBottom: 12,
    padding: "6px 12px",
    borderRadius: 999,
    background: "rgba(99, 102, 241, 0.16)",
    color: "#c7d2fe",
    fontSize: 13,
    fontWeight: 600,
  },
  title: {
    margin: 0,
    fontSize: 36,
    lineHeight: 1.05,
  },
  description: {
    marginTop: 14,
    maxWidth: 680,
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 1.75,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 28,
    alignItems: "start",
  },
  formPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  resultPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  label: {
    fontWeight: 600,
    marginBottom: 8,
    color: "#e2e8f0",
  },
  uploadBox: {
    position: "relative",
    minHeight: 140,
    borderRadius: 18,
    border: "1px dashed rgba(148, 163, 184, 0.5)",
    background: "rgba(148, 163, 184, 0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 24,
    color: "#cbd5e1",
  },
  fileInput: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
    cursor: "pointer",
  },
  uploadText: {
    pointerEvents: "none",
    zIndex: 1,
  },
  tagsSection: {
    marginBottom: 12,
    padding: "10px",
    background: "rgba(51,65,85,0.2)",
    borderRadius: 10,
  },
  tagsList: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 8px",
    background: "rgba(99,102,241,0.3)",
    color: "#a5b4fc",
    borderRadius: 6,
    fontSize: 12,
  },
  tagRemove: {
    background: "none",
    border: "none",
    color: "#a5b4fc",
    cursor: "pointer",
    fontSize: 12,
  },
  tagInput: {
    display: "flex",
    gap: 6,
  },
  tagInputField: {
    flex: 1,
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(15,23,42,0.8)",
    color: "#f8fafc",
    fontSize: 12,
  },
  tagBtn: {
    padding: "6px 10px",
    borderRadius: 6,
    border: "none",
    background: "#6366f1",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
  textarea: {
    minHeight: 220,
    resize: "vertical" as const,
    borderRadius: 18,
    border: "1px solid rgba(148, 163, 184, 0.35)",
    background: "rgba(15, 23, 42, 0.88)",
    color: "#e2e8f0",
    padding: 18,
    fontSize: 15,
    lineHeight: 1.65,
    outline: "none",
  },
  buttonGroup: {
    display: "flex",
    gap: 10,
    marginBottom: 14,
  },
  actionButton: {
    marginTop: 8,
    padding: "14px 20px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #22c55e)",
    color: "white",
    fontWeight: 700,
    fontSize: 16,
    transition: "transform 180ms ease",
    flex: 1,
  },
  secondaryButton: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(51,65,85,0.3)",
    color: "#cbd5e1",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    flex: 1,
  },
  error: {
    color: "#fda4af",
    marginTop: 4,
  },
  resultCard: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: 20,
    padding: 24,
    minHeight: 300,
  },
  resultTitle: {
    margin: 0,
    fontSize: 24,
    marginBottom: 16,
    color: "#f8fafc",
  },
  helpText: {
    color: "#cbd5e1",
    lineHeight: 1.8,
  },
  scoreBadge: {
    width: 110,
    height: 110,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 32,
    fontWeight: 700,
    color: "#f8fafc",
    background: "linear-gradient(180deg, #22c55e, #2563eb)",
    margin: "0 auto 18px",
  },
  summaryTitle: {
    margin: 0,
    fontSize: 20,
    marginBottom: 12,
  },
  summary: {
    color: "#cbd5e1",
    lineHeight: 1.8,
    whiteSpace: "pre-wrap" as const,
  },
  tipCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    borderRadius: 20,
    padding: 22,
  },
  tipTitle: {
    margin: 0,
    marginBottom: 14,
    fontSize: 20,
  },
  tipList: {
    margin: 0,
    paddingLeft: 20,
    color: "#cbd5e1",
    lineHeight: 1.8,
  },
  notificationsContainer: {
    position: "fixed" as const,
    top: 20,
    right: 20,
    zIndex: 1000,
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },
  notification: {
    padding: "12px 16px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 500,
  },
  notification_success: {
    background: "rgba(34,197,94,0.2)",
    color: "#86efac",
    border: "1px solid rgba(34,197,94,0.4)",
  },
  notification_error: {
    background: "rgba(239,68,68,0.2)",
    color: "#fca5a5",
    border: "1px solid rgba(239,68,68,0.4)",
  },
  notification_info: {
    background: "rgba(59,130,246,0.2)",
    color: "#93c5fd",
    border: "1px solid rgba(59,130,246,0.4)",
  },
  statsList: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr" as const,
    gap: 8,
  },
  statItem: {
    padding: "10px",
    background: "rgba(51,65,85,0.3)",
    borderRadius: 8,
    textAlign: "center" as const,
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    color: "#e2e8f0",
    fontSize: 18,
    fontWeight: 700,
  },
  templatesList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    maxHeight: 250,
    overflowY: "auto" as const,
  },
  templateItem: {
    padding: "10px",
    background: "rgba(51,65,85,0.3)",
    borderRadius: 8,
  },
  templateName: {
    color: "#e2e8f0",
    fontWeight: 600,
    fontSize: 12,
    marginBottom: 4,
  },
  templateLang: {
    color: "#94a3b8",
    fontSize: 11,
    marginBottom: 6,
  },
  templateActions: {
    display: "flex",
    gap: 6,
  },
  historyList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    maxHeight: 200,
    overflowY: "auto" as const,
  },
  historyItem: {
    padding: "8px 10px",
    background: "rgba(51,65,85,0.3)",
    borderRadius: 8,
    fontSize: 11,
  },
  historyTime: {
    color: "#a5b4fc",
    fontWeight: 600,
    marginBottom: 4,
  },
  historyScore: {
    color: "#86efac",
    fontSize: 10,
    marginBottom: 2,
  },
  historyFile: {
    color: "#cbd5e1",
    fontSize: 10,
    fontFamily: "monospace",
  },
  membersList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    marginBottom: 12,
  },
  memberItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 10px",
    borderRadius: 10,
    background: "rgba(51,65,85,0.3)",
    fontSize: 13,
  },
  memberAvatar: {
    fontSize: 18,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontWeight: 600,
    color: "#e2e8f0",
    fontSize: 13,
  },
  memberRole: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 2,
  },
  removeBtn: {
    background: "rgba(239,68,68,0.2)",
    border: "none",
    color: "#fca5a5",
    borderRadius: 6,
    width: 24,
    height: 24,
    cursor: "pointer",
    fontSize: 12,
  },
  shareButton: {
    width: "100%",
    padding: "10px",
    borderRadius: 10,
    border: "1px solid rgba(99,102,241,0.4)",
    background: "rgba(99,102,241,0.1)",
    color: "#a5b4fc",
    cursor: "pointer",
    marginBottom: 10,
    fontSize: 13,
    fontWeight: 500,
  },
  shareModal: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    padding: "10px",
    background: "rgba(51,65,85,0.3)",
    borderRadius: 10,
    marginBottom: 10,
  },
  shareInput: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(15,23,42,0.8)",
    color: "#f8fafc",
    fontSize: 12,
  },
  shareSelect: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(15,23,42,0.8)",
    color: "#f8fafc",
    fontSize: 12,
  },
  inviteBtn: {
    padding: "8px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #22c55e)",
    color: "white",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },
  linkButton: {
    width: "100%",
    padding: "10px",
    borderRadius: 10,
    border: "1px solid rgba(34,197,94,0.4)",
    background: "rgba(34,197,94,0.1)",
    color: "#86efac",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
  },
  commentsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    marginBottom: 12,
    maxHeight: 200,
    overflowY: "auto" as const,
  },
  commentItem: {
    padding: "10px",
    background: "rgba(51,65,85,0.3)",
    borderRadius: 8,
    fontSize: 12,
  },
  commentAuthor: {
    fontWeight: 600,
    color: "#e2e8f0",
    marginBottom: 4,
  },
  commentText: {
    color: "#cbd5e1",
    lineHeight: 1.4,
    marginBottom: 4,
  },
  commentTime: {
    color: "#64748b",
    fontSize: 11,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 12,
    margin: 0,
  },
  commentInput: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  commentTextarea: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(15,23,42,0.8)",
    color: "#f8fafc",
    fontSize: 12,
    minHeight: 60,
    resize: "none" as const,
  },
  commentBtn: {
    padding: "8px",
    borderRadius: 8,
    border: "none",
    background: "#6366f1",
    color: "white",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },
  snippetBtn: {
    flex: 1,
    padding: "6px",
    borderRadius: 6,
    border: "none",
    background: "#6366f1",
    color: "white",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 500,
  },
  activityList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    maxHeight: 200,
    overflowY: "auto" as const,
  },
  activityItem: {
    padding: "8px 10px",
    background: "rgba(51,65,85,0.3)",
    borderRadius: 8,
    fontSize: 11,
  },
  activityUser: {
    fontWeight: 600,
    color: "#a5b4fc",
  },
  activityAction: {
    color: "#cbd5e1",
    marginTop: 2,
  },
  activityTime: {
    color: "#64748b",
    fontSize: 10,
    marginTop: 2,
  },
};
