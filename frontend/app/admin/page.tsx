"use client";

import { API_URL } from "@/lib/api";

import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "admin@gmail.com";

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [analytics, setAnalytics] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) router.push("/");
      else setUser(currentUser);
      setChecking(false);
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    loadAdminData();
  }, [user]);

  const loadAdminData = async () => {
  const statsRes = await fetch(`${API_URL}/admin/stats`);
  const statsData = await statsRes.json();
  setStats(statsData);

  const chatsRes = await fetch(`${API_URL}/admin/chats`);
  const chatsData = await chatsRes.json();
  setChats(chatsData);

  const analyticsRes = await fetch(`${API_URL}/admin/analytics`);
  const analyticsData = await analyticsRes.json();
  setAnalytics(analyticsData);
};

  const deleteChat = async (id: string) => {
    if (!confirm("Delete this chat?")) return;

    const res = await fetch(`${API_URL}/chat/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("Chat delete nahi hui");
      return;
    }

    setChats((prev) => prev.filter((chat) => chat._id !== id));
    loadAdminData();
  };

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      const email = chat.userEmail?.toLowerCase() || "";
      const title = chat.title?.toLowerCase() || "";
      const q = search.toLowerCase();

      return email.includes(q) || title.includes(q);
    });
  }, [chats, search]);

  if (checking) return <p>Checking admin access...</p>;

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div style={styles.deniedPage}>
        <h1>Access Denied</h1>
        <p>You are not allowed to view this page.</p>
      </div>
    );
  }

  return (
    <div className="admin-layout" style={styles.page}>
      <aside className="admin-sidebar" style={styles.sidebar}>
        <h2 style={styles.logo}>Admin Panel</h2>
        <div style={styles.badge}>ADMIN ONLY</div>

        <div style={styles.profileBox}>
          <p style={styles.label}>Logged in as</p>
          <p style={styles.email}>{user.email}</p>
        </div>

        <button style={styles.dashboardBtn} onClick={() => router.push("/dashboard")}>
          User Dashboard
        </button>

        <button
          style={styles.logoutBtn}
          onClick={() => {
            signOut(auth);
            router.push("/");
          }}
        >
          Logout
        </button>
      </aside>

      <main className="admin-main" style={styles.main}>
        <div className="admin-topbar" style={styles.topbar}>
          <div>
            <h1 style={styles.title}>Admin Dashboard</h1>
            <p style={styles.subtitle}>Manage platform activity and user chats</p>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or chat title..."
            style={styles.search}
          />
        </div>

        <div className="admin-stats-grid" style={styles.statsGrid}>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Total Users</p>
            <h2 style={styles.statValue}>{stats?.totalUsers ?? 0}</h2>
          </div>

          <div style={styles.statCard}>
            <p style={styles.statLabel}>Total Chats</p>
            <h2 style={styles.statValue}>{stats?.totalChats ?? 0}</h2>
          </div>

          <div style={styles.statCard}>
            <p style={styles.statLabel}>Total Messages</p>
            <h2 style={styles.statValue}>{stats?.totalMessages ?? 0}</h2>
          </div>
        </div>
        <section className="admin-analytics-grid" style={styles.analyticsGrid}>
  <div style={styles.analyticsCard}>
    <h2>Daily Usage</h2>

    {analytics?.dailyUsage?.map((item: any) => (
      <div key={item.date} style={styles.barRow}>
        <span style={styles.barLabel}>{item.date}</span>

        <div style={styles.barTrack}>
          <div
            style={{
              ...styles.barFill,
              width: `${Math.min(item.count * 20, 100)}%`,
            }}
          ></div>
        </div>

        <span>{item.count}</span>
      </div>
    ))}
  </div>

  <div style={styles.analyticsCard}>
    <h2>Chats Per User</h2>

    {analytics?.chatsPerUser?.map((item: any) => (
      <div key={item.email} style={styles.userRow}>
        <span>{item.email}</span>
        <b>{item.count}</b>
      </div>
    ))}
  </div>

  <div style={styles.analyticsCard}>
    <h2>Most Active User</h2>

    {analytics?.mostActiveUser ? (
      <>
        <p style={styles.activeEmail}>
          {analytics.mostActiveUser.email}
        </p>
        <h1>{analytics.mostActiveUser.count} chats</h1>
      </>
    ) : (
      <p>No data</p>
    )}
  </div>
</section>

        <section className="admin-chat-table" style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <h2 style={{ margin: 0 }}>Chats Management</h2>
            <span style={styles.countBadge}>{filteredChats.length} chats</span>
          </div>

          <div className="admin-chat-table-head" style={styles.tableHead}>
            <div>User Email</div>
            <div>Chat Title</div>
            <div>Messages</div>
            <div>Updated</div>
            <div>Action</div>
          </div>

          {filteredChats.map((chat) => (
            <div className="admin-chat-table-row" key={chat._id} style={styles.tableRow}>
              <div style={styles.userEmail}>{chat.userEmail || "Unknown"}</div>
              <div>{chat.title || "New Chat"}</div>
              <div>{chat.messages?.length || 0}</div>
              <div>
                {chat.updatedAt
                  ? new Date(chat.updatedAt).toLocaleString()
                  : "N/A"}
              </div>
              <div>
                <button style={styles.deleteBtn} onClick={() => deleteChat(chat._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}

          {filteredChats.length === 0 && (
            <p style={styles.empty}>No chats found</p>
          )}
        </section>
      </main>
    </div>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background: "#020617",
    color: "white",
  },
  deniedPage: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    padding: "40px",
  },
  sidebar: {
    width: "260px",
    background: "#0f172a",
    borderRight: "1px solid #1e293b",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
  },
  logo: {
    margin: 0,
    fontSize: "26px",
  },
  badge: {
    marginTop: "16px",
    background: "#7f1d1d",
    color: "#fecaca",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    width: "fit-content",
    letterSpacing: "1px",
  },
  profileBox: {
    marginTop: "35px",
    background: "#111827",
    border: "1px solid #1f2937",
    padding: "14px",
    borderRadius: "14px",
  },
  label: {
    color: "#94a3b8",
    margin: 0,
    fontSize: "13px",
  },
  email: {
    margin: "6px 0 0",
    wordBreak: "break-word",
  },
  dashboardBtn: {
    marginTop: "auto",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
  },
  logoutBtn: {
    marginTop: "12px",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "#ef4444",
    color: "white",
    cursor: "pointer",
  },
  main: {
    flex: 1,
    padding: "32px",
    overflowY: "auto",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },
  title: {
    margin: 0,
    fontSize: "34px",
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: "8px",
  },
  search: {
    width: "340px",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #334155",
    background: "#0f172a",
    color: "white",
    outline: "none",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    marginTop: "30px",
  },
  statCard: {
    background: "linear-gradient(135deg, #111827, #1e293b)",
    border: "1px solid #334155",
    borderRadius: "18px",
    padding: "24px",
  },
  statLabel: {
    margin: 0,
    color: "#94a3b8",
  },
  statValue: {
    margin: "10px 0 0",
    fontSize: "38px",
  },
  tableCard: {
    marginTop: "32px",
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "18px",
    padding: "20px",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },
  countBadge: {
    background: "#1e293b",
    color: "#cbd5e1",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "13px",
  },
  tableHead: {
    display: "grid",
    gridTemplateColumns: "2fr 2fr 1fr 1.5fr 1fr",
    padding: "12px",
    color: "#94a3b8",
    borderBottom: "1px solid #1e293b",
    fontSize: "14px",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 2fr 1fr 1.5fr 1fr",
    padding: "14px 12px",
    borderBottom: "1px solid #1e293b",
    alignItems: "center",
    fontSize: "14px",
  },
  userEmail: {
    color: "#bfdbfe",
    wordBreak: "break-word",
  },
  deleteBtn: {
    background: "#7f1d1d",
    color: "#fecaca",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  empty: {
    textAlign: "center",
    color: "#94a3b8",
    padding: "25px",
  },
  analyticsGrid: {
  display: "grid",
  gridTemplateColumns: "2fr 2fr 1.5fr",
  gap: "20px",
  marginTop: "30px",
},

analyticsCard: {
  background: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: "18px",
  padding: "20px",
},

barRow: {
  display: "grid",
  gridTemplateColumns: "90px 1fr 30px",
  gap: "10px",
  alignItems: "center",
  marginTop: "12px",
},

barLabel: {
  color: "#cbd5e1",
  fontSize: "13px",
},

barTrack: {
  height: "10px",
  background: "#1e293b",
  borderRadius: "999px",
  overflow: "hidden",
},

barFill: {
  height: "100%",
  background: "#38bdf8",
  borderRadius: "999px",
},

userRow: {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px 0",
  borderBottom: "1px solid #1e293b",
  color: "#cbd5e1",
},

activeEmail: {
  color: "#93c5fd",
  wordBreak: "break-word",
}
};
