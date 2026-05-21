import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

export default function Writer() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [tool, setTool] = useState("blog");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!input.trim()) {
      setError("Please enter a topic or description first.");
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
          type: tool,
        }),
      });

      const data = await res.json();
      setOutput(data.result || "No response from server.");
    } catch {
      setOutput("Error generating content");
    } finally {
      setLoading(false);
    }
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <button style={styles.backButton} onClick={() => router.push("/dashboard")}>Back to Dashboard</button>

        <div style={styles.header}>
          <h2 style={styles.title}>AI Writer ✍️</h2>
          <p style={styles.subtitle}>
            Generate blogs, emails, captions, or use text tools for grammar and summaries.
          </p>
        </div>

        <div style={styles.controlsRow}>
          <label style={styles.label}>
            Tool
            <select
              value={tool}
              onChange={(e) => setTool(e.target.value)}
              style={styles.select}
            >
              <option value="blog">Blog</option>
              <option value="email">Email</option>
              <option value="caption">Caption</option>
              <option value="grammar">Grammar Check</option>
              <option value="summarize">Summarize</option>
            </select>
          </label>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            tool === "blog"
              ? "Enter the blog topic..."
              : tool === "email"
              ? "Enter email purpose and details..."
              : tool === "caption"
              ? "Enter the idea or content for the caption..."
              : tool === "grammar"
              ? "Paste text to correct grammar and clarity..."
              : "Paste text to summarize..."
          }
          style={styles.textarea}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          onClick={generate}
          disabled={loading}
          style={{
            ...styles.primaryButton,
            opacity: loading ? 0.8 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Generating..." : "Generate Content"}
        </button>

        <div style={styles.outputCard}>
          {!output && !loading ? (
            <p style={styles.helpText}>AI-generated content appears here after clicking generate.</p>
          ) : (
            <ReactMarkdown>{output}</ReactMarkdown>
          )}

          {output && (
            <button onClick={copyText} style={styles.copyButton}>
              {copied ? "Copied ✅" : "Copy Content"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    background: "linear-gradient(135deg, #0f172a, #111827)",
    color: "#f8fafc",
  },
  card: {
    maxWidth: 920,
    margin: "0 auto",
    background: "rgba(15, 23, 42, 0.94)",
    padding: 28,
    borderRadius: 24,
    border: "1px solid rgba(148,163,184,0.18)",
    boxShadow: "0 40px 120px rgba(15,23,42,0.25)",
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
  controlsRow: {
    marginBottom: 16,
  },
  label: {
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
    minHeight: 170,
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(15,23,42,0.92)",
    color: "#f8fafc",
    padding: 18,
    resize: "vertical",
    fontSize: 15,
    outline: "none",
    marginBottom: 14,
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
};