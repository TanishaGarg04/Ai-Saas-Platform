"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const register = async () => {
    setError("");
    setLoading(true);
    
    const trimmedEmail = email.trim();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={styles.container}>
      <div className="auth-card" style={styles.card}>
        <h2 style={styles.title}>Create Account 🚀</h2>

        {error && <div style={styles.error}>{error}</div>}

        <input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button onClick={register} style={styles.primaryBtn} disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        <p style={styles.text}>
          Already have account?{" "}
          <span onClick={() => router.push("/")} style={styles.link}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #1f1c2c, #928dab)",
  },
  card: {
    background: "white",
    padding: "35px",
    borderRadius: "15px",
    width: "350px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  title: {
    marginBottom: "20px",
    color:"black"
  },
  error: {
    color: "#dc2626",
    backgroundColor: "#fee2e2",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "15px",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },
  primaryBtn: {
    width: "100%",
    padding: "12px",
    marginTop: "15px",
    background: "#4a00e0",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    opacity: 1,
  },
  text: {
    marginTop: "15px",
    color:"black"
  },
  link: {
    color: "#4a00e0",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
