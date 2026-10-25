"use client";

import { API_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/");
      else setUser(u);
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!user?.email) return;

    fetch(`${API_URL}/stats/${user.email}`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, [user]);

  if (!user) return <p>Loading...</p>;

  const openTool = (path: string) => {
    router.push(path);
  };

  return (
    <div className="dashboard-page" style={styles.page}>
      <div className="dashboard-topbar" style={styles.topbar}>
        <div>
          <h1 style={styles.title}>AI SaaS Dashboard</h1>
          <p style={styles.subtitle}>Welcome, {user.email}</p>
        </div>

        <button
          style={styles.logout}
          onClick={() => {
            signOut(auth);
            router.push("/");
          }}
        >
          Logout
        </button>
      </div>

      <div className="dashboard-stats-grid" style={styles.statsGrid}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Chats</p>
          <h2 style={styles.statValue}>{stats?.totalChats ?? 0}</h2>
        </div>

        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Messages</p>
          <h2 style={styles.statValue}>{stats?.totalMessages ?? 0}</h2>
        </div>

        <div style={styles.statCard}>
          <p style={styles.statLabel}>Last Activity</p>
          <h2 style={styles.smallValue}>
            {stats?.lastActivity
              ? new Date(stats.lastActivity).toLocaleString()
              : "No activity"}
          </h2>
        </div>
      </div>

      <h2 style={styles.sectionTitle}>Quick Actions ⚡</h2>

      <div className="dashboard-tools-grid" style={styles.toolsGrid}>
        <div className="dashboard-tool-card" style={styles.toolCard} onClick={() => openTool("/writer")}>
          <div style={styles.icon}>✍️</div>
          <h3>Write Blog</h3>
          <p style={styles.toolText}>Create blogs, emails & captions instantly</p>
        </div>

        <div className="dashboard-tool-card" style={styles.toolCard} onClick={() => openTool("/code")}>
          <div style={styles.icon}>💻</div>
          <h3>Review Code</h3>
          <p style={styles.toolText}>Improve and debug your code fast</p>
        </div>

        <div className="dashboard-tool-card" style={styles.toolCard} onClick={() => openTool("/chat")}>
          <div style={styles.icon}>🤖</div>
          <h3>Ask AI</h3>
          <p style={styles.toolText}>Ask anything and get instant answers</p>
        </div>

        <div className="dashboard-tool-card" style={styles.toolCard} onClick={() => openTool("/dashboard/ats")}>
          <div style={styles.icon}>📄</div>
          <h3>Resume ATS Checker</h3>
          <p style={styles.toolText}>
            Upload resume and check ATS score with AI
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a, #1e1b4b)",
    color: "white",
    padding: "35px",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    margin: 0,
    fontSize: "34px",
  },
  subtitle: {
    color: "#cbd5e1",
    marginTop: "8px",
  },
  logout: {
    padding: "10px 18px",
    background: "#ef4444",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    color: "white",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    marginTop: "35px",
  },
  statCard: {
    background: "rgba(255,255,255,0.08)",
    padding: "22px",
    borderRadius: "16px",
  },
  statLabel: {
    color: "#cbd5e1",
  },
  statValue: {
    fontSize: "30px",
  },
  smallValue: {
    fontSize: "16px",
  },
  sectionTitle: {
    marginTop: "40px",
  },
  toolsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },
  toolCard: {
    background: "#fff",
    color: "#000",
    padding: "25px",
    borderRadius: "15px",
    cursor: "pointer",
  },
  icon: {
    fontSize: "40px",
  },
  toolText: {
    color: "#555",
  },
};
