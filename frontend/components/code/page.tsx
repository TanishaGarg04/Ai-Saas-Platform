"use client";

import type { CSSProperties } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

type TeamMember = { id: string; name: string; role: string; avatar: string };
type CommentItem = { id: string; author: string; text: string; timestamp: string };
type ActivityItem = { id: string; user: string; action: string; timestamp: string };
type SnippetItem = { id: string; name: string; code: string; language: string };
type HistoryItem = {
  id: string;
  code: string;
  timestamp: string;
  result: string;
  tool: string;
  language: string;
};
type NotificationItem = { id: string; message: string; type: string };

const quickTemplates: Record<string, Record<string, string>> = {
  review: {
    javascript: `Review this JavaScript for bugs, edge cases, and performance issues:

function fetchUserData(userId) {
  console.log("Fetching", userId);
  return fetch("/api/user/" + userId).then((res) => res.json());
}`,
    typescript: `Review this TypeScript for type safety and maintainability:

interface User {
  id: string;
  name: string;
}

function getUserName(user: User | null) {
  return user.name;
}`,
    python: `Review this Python code for readability and possible bugs:

def process_orders(orders):
    total = 0
    for order in orders:
        total += order["price"]
    return total / len(orders)`,
    default: `Review this code for bugs, edge cases, readability, and performance improvements:

// Paste your code here`,
  },
  format: {
    javascript: `const users=[{id:1,name:"Aman"},{id:2,name:"Sara"}];function printUsers(){users.forEach((u)=>{console.log(u.name)})}`,
    typescript: `type ApiResponse={success:boolean,data:any};const handleResponse=(response:ApiResponse)=>{if(response.success){console.log(response.data)}};`,
    python: `def greet(name):
 print("Hello, "+name)
 if name:
  return True
 return False`,
    default: `Paste messy code here and use Format Code to clean it up.`,
  },
};

export default function Code() {
  const router = useRouter();
  const nextIdRef = useRef(2);
  const [input, setInput] = useState("");
  const [tool, setTool] = useState("review");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [isFavorite, setIsFavorite] = useState(false);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: "1", name: "You", role: "Owner", avatar: "YU" },
  ]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("viewer");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [activity, setActivity] = useState<ActivityItem[]>([
    { id: "1", user: "You", action: "Created code review document", timestamp: "just now" },
  ]);

  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [snippets, setSnippets] = useState<SnippetItem[]>([]);
  const [showSnippets, setShowSnippets] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState({ reviewsCount: 0, hoursSpent: 2.5 });

  const inputLines = input ? input.split("\n") : [];
  const nonEmptyLines = inputLines.filter((line) => line.trim().length > 0);
  const inputInsights = {
    lines: inputLines.length,
    nonEmptyLines: nonEmptyLines.length,
    characters: input.length,
    functions:
      (input.match(/\b(function|def|class)\b/g) || []).length +
      (input.match(/=>/g) || []).length,
    todos: (input.match(/\b(TODO|FIXME|HACK)\b/gi) || []).length,
    consoleLogs: (input.match(/\b(console\.log|print)\b/g) || []).length,
  };
  const suggestionBadges = [
    inputInsights.consoleLogs > 0 ? "Debug logs detected" : "",
    inputInsights.todos > 0 ? "Pending TODOs present" : "",
    inputInsights.lines > 80 ? "Large snippet, detailed review recommended" : "",
    tool === "format" && inputInsights.nonEmptyLines > 0 ? "Ready for cleanup" : "",
  ].filter(Boolean);

  const addNotification = (message: string, type: string) => {
    const id = String(nextIdRef.current++);
    const notification = {
      id,
      message,
      type,
    };

    setNotifications((prev) => [...prev, notification]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== notification.id));
    }, 3000);
  };

  const saveToHistory = (result: string) => {
    if (!result.trim()) return;

    const historyItem = {
      id: String(nextIdRef.current++),
      code: input,
      timestamp: new Date().toLocaleTimeString(),
      result,
      tool,
      language,
    };

    setHistory((prev) => [...prev, historyItem]);
    setStats((prev) => ({ ...prev, reviewsCount: prev.reviewsCount + 1 }));
  };

  const review = async () => {
    if (!input.trim()) {
      setError("Please paste your code or describe the issue first.");
      return;
    }

    setError("");
    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("http://localhost:5000/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input,
          type: tool === "format" ? "format" : "code",
        }),
      });

      const data = await res.json();
      const result = data.result || "No response from server.";
      setOutput(result);
      saveToHistory(result);
      addNotification(tool === "format" ? "Formatting completed" : "Review completed", "success");
    } catch {
      setOutput("Error reviewing code");
      addNotification("Error during review", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const addTeamMember = () => {
    if (!shareEmail.trim()) return;

    const newMember = {
      id: String(nextIdRef.current++),
      name: shareEmail.split("@")[0],
      role: shareRole,
      avatar: "TM",
    };

    setTeamMembers((prev) => [...prev, newMember]);
    setActivity((prev) => [
      ...prev,
      {
        id: String(nextIdRef.current++),
        user: "You",
        action: `Added ${shareEmail} as ${shareRole}`,
        timestamp: "just now",
      },
    ]);
    setShareEmail("");
    setShareRole("viewer");
  };

  const addComment = () => {
    if (!newComment.trim()) return;

    const comment = {
      id: String(nextIdRef.current++),
      author: "You",
      text: newComment,
      timestamp: "just now",
    };

    setComments((prev) => [...prev, comment]);
    setActivity((prev) => [
      ...prev,
      {
        id: String(nextIdRef.current++),
        user: "You",
        action: "Added a comment",
        timestamp: "just now",
      },
    ]);
    setNewComment("");
  };

  const removeTeamMember = (id: string) => {
    const member = teamMembers.find((m) => m.id === id);
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));

    if (member && member.name !== "You") {
      setActivity((prev) => [
        ...prev,
        {
          id: String(nextIdRef.current++),
          user: "You",
          action: `Removed ${member.name} from collaboration`,
          timestamp: "just now",
        },
      ]);
    }
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/dashboard/code?projectId=shared123`;
    navigator.clipboard.writeText(link);
    addNotification("Share link copied", "info");
  };

  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag || tags.includes(trimmedTag)) return;
    setTags((prev) => [...prev, trimmedTag]);
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((item) => item !== tag));
  };

  const saveSnippet = () => {
    if (!input.trim() || !output.trim()) return;

    const snippet = {
      id: String(nextIdRef.current++),
      name: `${tool}_${new Date().toLocaleTimeString()}`,
      code: input,
      language,
    };

    setSnippets((prev) => [...prev, snippet]);
    addNotification("Snippet saved", "success");
  };

  const loadSnippet = (snippet: SnippetItem) => {
    setInput(snippet.code);
    setLanguage(snippet.language);
    addNotification(`Loaded ${snippet.name}`, "info");
  };

  const deleteSnippet = (id: string) => {
    setSnippets((prev) => prev.filter((item) => item.id !== id));
  };

  const applyQuickTemplate = () => {
    const templateSet = quickTemplates[tool] || quickTemplates.review;
    const nextTemplate = templateSet[language] || templateSet.default;
    setInput(nextTemplate);
    addNotification("Starter template inserted", "info");
  };

  const restoreHistoryItem = (item: HistoryItem) => {
    setInput(item.code);
    setOutput(item.result);
    setTool(item.tool);
    setLanguage(item.language);
    addNotification("History item restored", "info");
  };

  const toggleFavorite = () => {
    setIsFavorite((prev) => !prev);
    addNotification(isFavorite ? "Removed from favorites" : "Added to favorites", "info");
  };

  const exportReview = () => {
    const content = `Code Review Report

Language: ${language}
Tool: ${tool}

=== INPUT ===
${input}

=== OUTPUT ===
${output}

=== TAGS ===
${tags.join(", ")}

=== COMMENTS ===
${comments.map((comment) => `${comment.author}: ${comment.text}`).join("\n")}`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "code-review.txt";
    anchor.click();
    URL.revokeObjectURL(url);
    addNotification("Review exported", "success");
  };

  return (
    <div style={styles.page}>
      <div style={styles.notificationsContainer}>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            style={{
              ...styles.notification,
              ...styles[`notification_${notification.type}`],
            }}
          >
            {notification.message}
          </div>
        ))}
      </div>

      <div style={styles.container}>
        <div style={styles.mainColumn}>
          <div style={styles.card}>
            <button style={styles.backButton} onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </button>

            <div style={styles.header}>
              <div style={styles.headerTop}>
                <div>
                  <h2 style={styles.title}>Code Review and Formatter</h2>
                  <p style={styles.subtitle}>
                    Choose a code tool, paste your code, and get either a review or cleaned formatting back.
                  </p>
                </div>
                <button
                  onClick={toggleFavorite}
                  style={{ ...styles.favoriteBtn, background: isFavorite ? "#fbbf24" : "transparent" }}
                  title="Add to favorites"
                >
                  {isFavorite ? "Starred" : "Star"} Favorite
                </button>
              </div>
            </div>

            <div style={styles.toolsRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.selectLabel}>
                  Tool
                  <select value={tool} onChange={(e) => setTool(e.target.value)} style={styles.select}>
                    <option value="review">Review Code</option>
                    <option value="format">Format Code</option>
                  </select>
                </label>
              </div>

              <div style={{ flex: 1 }}>
                <label style={styles.selectLabel}>
                  Language
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} style={styles.select}>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="typescript">TypeScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="csharp">C#</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                  </select>
                </label>
              </div>
            </div>

            <div style={styles.tagsSection}>
              <div style={styles.tagsList}>
                {tags.map((tag) => (
                  <span key={tag} style={styles.tag}>
                    {tag}
                    <button onClick={() => removeTag(tag)} style={styles.tagRemove}>
                      x
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
                <button onClick={addTag} style={styles.tagBtn}>
                  +
                </button>
              </div>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={tool === "format" ? "Paste code to format..." : "Paste code or describe the problem..."}
              style={styles.textarea}
            />

            <div style={styles.insightsCard}>
              <div style={styles.insightsHeader}>
                <div>
                  <div style={styles.insightsTitle}>Live Input Insights</div>
                  <div style={styles.insightsSubtitle}>Quick scan before sending to AI</div>
                </div>
                <button onClick={applyQuickTemplate} style={styles.templateButton}>
                  Use Starter Template
                </button>
              </div>

              <div style={styles.insightGrid}>
                <div style={styles.insightItem}>
                  <span style={styles.insightLabel}>Lines</span>
                  <strong style={styles.insightValue}>{inputInsights.lines}</strong>
                </div>
                <div style={styles.insightItem}>
                  <span style={styles.insightLabel}>Non-empty</span>
                  <strong style={styles.insightValue}>{inputInsights.nonEmptyLines}</strong>
                </div>
                <div style={styles.insightItem}>
                  <span style={styles.insightLabel}>Characters</span>
                  <strong style={styles.insightValue}>{inputInsights.characters}</strong>
                </div>
                <div style={styles.insightItem}>
                  <span style={styles.insightLabel}>Functions</span>
                  <strong style={styles.insightValue}>{inputInsights.functions}</strong>
                </div>
              </div>

              <div style={styles.badgesRow}>
                {suggestionBadges.length === 0 ? (
                  <span style={styles.neutralBadge}>No obvious local flags yet</span>
                ) : (
                  suggestionBadges.map((badge) => (
                    <span key={badge} style={styles.signalBadge}>
                      {badge}
                    </span>
                  ))
                )}
              </div>
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <div style={styles.buttonGroup}>
              <button
                onClick={review}
                disabled={loading}
                style={{
                  ...styles.primaryButton,
                  opacity: loading ? 0.8 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                  flex: 1,
                }}
              >
                {loading ? (tool === "format" ? "Formatting..." : "Reviewing...") : tool === "format" ? "Format Code" : "Review Code"}
              </button>
              <button onClick={saveSnippet} style={{ ...styles.secondaryButton, flex: 1 }}>
                Save Snippet
              </button>
              <button onClick={exportReview} style={{ ...styles.secondaryButton, flex: 1 }}>
                Export
              </button>
            </div>

            <div style={styles.outputCard}>
              {!output && !loading ? (
                <p style={styles.helpText}>AI review output will appear here after submission.</p>
              ) : (
                <ReactMarkdown>{output}</ReactMarkdown>
              )}

              {output && (
                <button onClick={copyText} style={styles.copyButton}>
                  {copied ? "Copied" : "Copy Review"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={styles.sidebarColumn}>
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Stats</h3>
            <div style={styles.statsList}>
              <div style={styles.statItem}>
                <div style={styles.statLabel}>Reviews</div>
                <div style={styles.statValue}>{stats.reviewsCount}</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statLabel}>Comments</div>
                <div style={styles.statValue}>{comments.length}</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statLabel}>Team</div>
                <div style={styles.statValue}>{teamMembers.length}</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statLabel}>Hours</div>
                <div style={styles.statValue}>{stats.hoursSpent.toFixed(1)}</div>
              </div>
            </div>
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>Snippets ({snippets.length})</h3>
              <button onClick={() => setShowSnippets(!showSnippets)} style={styles.toggleBtn}>
                {showSnippets ? "Hide" : "Show"}
              </button>
            </div>
            {showSnippets && (
              <div style={styles.snippetsList}>
                {snippets.length === 0 ? (
                  <p style={styles.emptyText}>No snippets saved yet</p>
                ) : (
                  snippets.map((snippet) => (
                    <div key={snippet.id} style={styles.snippetItem}>
                      <div style={styles.snippetName}>{snippet.name}</div>
                      <div style={styles.snippetLang}>{snippet.language}</div>
                      <div style={styles.snippetActions}>
                        <button onClick={() => loadSnippet(snippet)} style={styles.snippetBtn}>
                          Load
                        </button>
                        <button
                          onClick={() => deleteSnippet(snippet.id)}
                          style={{ ...styles.snippetBtn, background: "#dc2626" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>History ({history.length})</h3>
              <button onClick={() => setShowHistory(!showHistory)} style={styles.toggleBtn}>
                {showHistory ? "Hide" : "Show"}
              </button>
            </div>
            {showHistory && (
              <div style={styles.historyList}>
                {history.length === 0 ? (
                  <p style={styles.emptyText}>No history yet</p>
                ) : (
                  history
                    .slice()
                    .reverse()
                    .map((item) => (
                      <div key={item.id} style={styles.historyItem}>
                        <div style={styles.historyTime}>{item.timestamp}</div>
                        <div style={styles.historyMeta}>
                          {item.language} . {item.tool}
                        </div>
                        <div style={styles.historyPreview}>{item.code.substring(0, 40)}...</div>
                        <button onClick={() => restoreHistoryItem(item)} style={styles.restoreBtn}>
                          Restore
                        </button>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>

          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Team Members</h3>
            <div style={styles.membersList}>
              {teamMembers.map((member) => (
                <div key={member.id} style={styles.memberItem}>
                  <span style={styles.memberAvatar}>{member.avatar}</span>
                  <div style={styles.memberInfo}>
                    <div style={styles.memberName}>{member.name}</div>
                    <div style={styles.memberRole}>{member.role}</div>
                  </div>
                  {member.name !== "You" && (
                    <button onClick={() => removeTeamMember(member.id)} style={styles.removeBtn} title="Remove member">
                      x
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => setShowShareModal(!showShareModal)} style={styles.shareButton}>
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
                <select value={shareRole} onChange={(e) => setShareRole(e.target.value)} style={styles.shareSelect}>
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
              Copy Share Link
            </button>
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>Comments ({comments.length})</h3>
              <button onClick={() => setShowComments(!showComments)} style={styles.toggleBtn}>
                {showComments ? "Hide" : "Show"}
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

          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>Activity</h3>
            </div>
            <div style={styles.activityList}>
              {activity
                .slice()
                .reverse()
                .map((item) => (
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

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    background: "linear-gradient(135deg, #0f172a, #111827)",
    color: "#f8fafc",
  },
  container: {
    maxWidth: 1400,
    margin: "0 auto",
    display: "flex",
    gap: "24px",
    alignItems: "flex-start",
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
    background: "rgba(15, 23, 42, 0.94)",
    padding: 28,
    borderRadius: 24,
    border: "1px solid rgba(148,163,184,0.18)",
    boxShadow: "0 40px 120px rgba(15,23,42,0.25)",
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
    gap: 12,
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
    fontSize: 13,
    padding: 0,
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
    fontSize: 12,
    fontWeight: 700,
    width: 30,
    height: 30,
    borderRadius: 999,
    background: "rgba(99,102,241,0.25)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#c7d2fe",
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
  backButton: {
    marginBottom: 24,
    padding: "12px 18px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "#e2e8f0",
    cursor: "pointer",
  },
  header: {
    marginBottom: 18,
  },
  title: {
    margin: 0,
    fontSize: 32,
  },
  subtitle: {
    marginTop: 10,
    color: "#cbd5e1",
    lineHeight: 1.75,
  },
  selectLabel: {
    display: "block",
    fontWeight: 600,
    marginBottom: 8,
    color: "#e2e8f0",
  },
  select: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(15,23,42,0.92)",
    color: "#f8fafc",
    marginTop: 6,
  },
  textarea: {
    width: "100%",
    minHeight: 180,
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(15,23,42,0.92)",
    color: "#f8fafc",
    padding: 18,
    resize: "vertical" as const,
    fontSize: 15,
    outline: "none",
    marginBottom: 14,
  },
  insightsCard: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.2)",
    background: "rgba(30,41,59,0.45)",
  },
  insightsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  insightsTitle: {
    color: "#e2e8f0",
    fontWeight: 700,
    fontSize: 15,
  },
  insightsSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4,
  },
  templateButton: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(34,197,94,0.35)",
    background: "rgba(34,197,94,0.12)",
    color: "#86efac",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  },
  insightGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 12,
  },
  insightItem: {
    padding: "12px 10px",
    borderRadius: 12,
    background: "rgba(15,23,42,0.7)",
    border: "1px solid rgba(148,163,184,0.14)",
  },
  insightLabel: {
    display: "block",
    color: "#94a3b8",
    fontSize: 11,
    marginBottom: 6,
  },
  insightValue: {
    color: "#f8fafc",
    fontSize: 18,
  },
  badgesRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
  },
  signalBadge: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(245,158,11,0.16)",
    border: "1px solid rgba(245,158,11,0.24)",
    color: "#fcd34d",
    fontSize: 11,
    fontWeight: 600,
  },
  neutralBadge: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(59,130,246,0.14)",
    border: "1px solid rgba(59,130,246,0.24)",
    color: "#93c5fd",
    fontSize: 11,
    fontWeight: 600,
  },
  primaryButton: {
    padding: "14px 22px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #22c55e)",
    color: "white",
    fontWeight: 700,
    fontSize: 15,
  },
  outputCard: {
    marginTop: 24,
    borderRadius: 18,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(148,163,184,0.18)",
    padding: 22,
    minHeight: 180,
  },
  helpText: {
    color: "#cbd5e1",
    lineHeight: 1.8,
  },
  copyButton: {
    marginTop: 18,
    padding: "10px 16px",
    borderRadius: 12,
    border: "none",
    background: "#4f46e5",
    color: "white",
    cursor: "pointer",
  },
  error: {
    marginTop: -6,
    marginBottom: 14,
    color: "#fca5a5",
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
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  favoriteBtn: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid rgba(251,191,36,0.3)",
    color: "#fbbf24",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: "nowrap" as const,
  },
  toolsRow: {
    display: "flex",
    gap: 12,
    marginBottom: 12,
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
  buttonGroup: {
    display: "flex",
    gap: 10,
    marginBottom: 14,
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
  snippetsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    maxHeight: 250,
    overflowY: "auto" as const,
  },
  snippetItem: {
    padding: "10px",
    background: "rgba(51,65,85,0.3)",
    borderRadius: 8,
  },
  snippetName: {
    color: "#e2e8f0",
    fontWeight: 600,
    fontSize: 12,
    marginBottom: 4,
  },
  snippetLang: {
    color: "#94a3b8",
    fontSize: 11,
    marginBottom: 6,
  },
  snippetActions: {
    display: "flex",
    gap: 6,
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
  historyList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    maxHeight: 260,
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
  historyMeta: {
    color: "#94a3b8",
    fontSize: 10,
    marginBottom: 4,
    textTransform: "capitalize" as const,
  },
  historyPreview: {
    color: "#cbd5e1",
    fontSize: 10,
    fontFamily: "monospace",
  },
  restoreBtn: {
    marginTop: 8,
    width: "100%",
    padding: "6px 8px",
    borderRadius: 8,
    border: "1px solid rgba(99,102,241,0.35)",
    background: "rgba(99,102,241,0.12)",
    color: "#c7d2fe",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 600,
  },
};
