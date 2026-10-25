"use client";

import { useEffect, useState } from "react";
import type { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";
import {
  browserPopupRedirectResolver,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const ADMIN_EMAIL = "admin@gmail.com";

  const routeUser = (userEmail?: string | null) => {
    if (userEmail?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      router.push("/admin");
      return;
    }

    router.push("/dashboard");
  };

  const getAuthErrorMessage = (err: FirebaseError) => {
    switch (err.code) {
      case "auth/popup-blocked":
        return "Google popup was blocked by the browser. Retrying with redirect...";
      case "auth/popup-closed-by-user":
        return "Google sign-in popup was closed before login completed.";
      case "auth/unauthorized-domain":
        return "This domain is not authorized in Firebase Auth. Add your Netlify domain in Firebase Console > Authentication > Settings > Authorized domains.";
      case "auth/operation-not-allowed":
        return "Google sign-in is not enabled in Firebase Authentication > Sign-in method.";
      default:
        return err?.message || "Google login failed";
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          router.push("/admin");
          return;
        }

        router.push("/dashboard");
      }
    });

    getRedirectResult(auth).catch((err: FirebaseError) => {
      setError(getAuthErrorMessage(err));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const login = async () => {
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
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      routeUser(trimmedEmail);
    } catch (err: unknown) {
      const authError = err as FirebaseError;
      setError(authError.message || "Login failed");
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      if (typeof window !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(window.navigator.userAgent)) {
        await signInWithRedirect(auth, provider);
        return;
      }

      await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      routeUser(auth.currentUser?.email);
    } catch (err: unknown) {
      const authError = err as FirebaseError;

      if (authError.code === "auth/popup-blocked") {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: "select_account",
        });
        await signInWithRedirect(auth, provider);
        return;
      }

      setError(getAuthErrorMessage(authError));
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={styles.container}>
      <div className="auth-card" style={styles.card}>
        <h2 style={styles.title}>Welcome Back 👋</h2>

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

        <button onClick={login} style={styles.primaryBtn} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <div style={styles.divider}>or</div>

        <button onClick={googleLogin} style={styles.googleBtn} disabled={loading}>
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        <p style={styles.text}>
          Don’t have account?{" "}
          <span onClick={() => router.push("/register")} style={styles.link}>
            Register
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
    color: "#111",
    fontWeight: "600"
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
  },
  googleBtn: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    background: "#db4437",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  divider: {
    margin: "15px 0",
    color: "#888",
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
