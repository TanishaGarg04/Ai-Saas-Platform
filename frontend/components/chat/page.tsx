"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

function TypingDots() {
  return (
    <div className="typing-bubble">
      <span className="dot"></span>
      <span className="dot"></span>
      <span className="dot"></span>
    </div>
  );
}

export default function Chat() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    loadChats(user.email);
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadChats = async (email: string) => {
    const res = await fetch(`http://localhost:5000/chat/list/${email}`);
    const data = await res.json();

    setChats(data);

    if (data.length > 0) {
      loadChat(data[0]._id);
    } else {
      createNewChat();
    }
  };

  const createNewChat = async () => {
    if (!user?.email) return;

    const res = await fetch("http://localhost:5000/chat/new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userEmail: user.email }),
    });

    const data = await res.json();

    setChats((prev) => [data, ...prev]);
    setCurrentChat(data);
    setMessages([]);
  };

  const loadChat = async (id: string) => {
    const res = await fetch(`http://localhost:5000/chat/${id}`);
    const data = await res.json();

    setCurrentChat(data);
    setMessages(data.messages || []);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !currentChat) return;

    const text = input;
    const newMessages = [...messages, { role: "user", content: text }];

    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: text,
          type: "chat",
          userEmail: user?.email,
          chatId: currentChat._id,
        }),
      });

      const data = await res.json();

      setMessages([
        ...newMessages,
        { role: "assistant", content: data.result || "No response" },
      ]);

      if (user?.email) {
        loadChats(user.email);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Server error" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (id: string) => {
    const res = await fetch(`http://localhost:5000/chat/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("Chat delete successfully");
      return;
    }

    const updatedChats = chats.filter((chat) => chat._id !== id);
    setChats(updatedChats);

    if (currentChat?._id === id) {
      if (updatedChats.length > 0) {
        loadChat(updatedChats[0]._id);
      } else {
        setCurrentChat(null);
        setMessages([]);
      }
    }
  };

  const editChat = async (id: string, oldTitle: string) => {
    const newTitle = prompt("Enter new chat title:", oldTitle);

    if (!newTitle || !newTitle.trim()) return;

    const res = await fetch(`http://localhost:5000/chat/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: newTitle.trim() }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Chat update nahi hua");
      return;
    }

    setChats((prev) =>
      prev.map((chat) => (chat._id === id ? { ...chat, title: data.title } : chat))
    );

    if (currentChat?._id === id) {
      setCurrentChat((prev: any) => ({ ...prev, title: data.title }));
    }
  };

  return (
    <>
      <button
        onClick={() => router.push("/dashboard")}
        style={{
          marginBottom: "18px",
          padding: "10px 16px",
          borderRadius: "10px",
          border: "none",
          background: "#111827",
          color: "white",
          cursor: "pointer",
        }}
      >
        Back to Dashboard
      </button>

      <div style={{ display: "flex", height: "75vh", gap: "16px" }}>
        <div
          style={{
            width: "260px",
            background: "#111827",
            color: "white",
            borderRadius: "16px",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <button
            onClick={createNewChat}
            style={{
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #374151",
              background: "#1f2937",
              color: "white",
              cursor: "pointer",
              marginBottom: "14px",
            }}
          >
            + New Chat
          </button>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {chats.map((chat) => (
              <div
                key={chat._id}
                style={{
                  padding: "10px",
                  borderRadius: "10px",
                  marginBottom: "8px",
                  background:
                    currentChat?._id === chat._id ? "#374151" : "transparent",
                  color: "#f9fafb",
                  fontSize: "14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  onClick={() => loadChat(chat._id)}
                  style={{
                    cursor: "pointer",
                    flex: 1,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {chat.title || "New Chat"}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    editChat(chat._id, chat.title || "New Chat");
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#93c5fd",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                >
                  Edit
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat._id);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#f87171",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={{ marginBottom: "16px" }}>
            {currentChat?.title || "AI Chat"}
          </h2>

          <div
            style={{
              height: "520px",
              overflowY: "auto",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {messages.length === 0 && !loading && (
              <p style={{ textAlign: "center", color: "#64748b" }}>
                Start a new conversation
              </p>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent:
                    m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "12px 14px",
                    borderRadius:
                      m.role === "user"
                        ? "16px 16px 4px 16px"
                        : "16px 16px 16px 4px",
                    background: m.role === "user" ? "#111827" : "#e5e7eb",
                    color: m.role === "user" ? "white" : "#111827",
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <TypingDots />
              </div>
            )}

            <div ref={bottomRef}></div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type message..."
              style={{
                flex: 1,
                padding: "12px",
                height: "48px",
                resize: "none",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                outline: "none",
              }}
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              style={{
                padding: "0 20px",
                borderRadius: "10px",
                border: "none",
                background: loading ? "#94a3b8" : "#111827",
                color: "white",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Wait" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
