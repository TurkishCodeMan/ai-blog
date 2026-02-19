"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_PASSWORD = "admin123";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin-token", password);
      router.push("/admin");
    } else {
      setError("Hatalı şifre. Lütfen tekrar deneyin.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        padding: "2.5rem 2rem",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        backgroundColor: "var(--bg-card)",
        boxShadow: "var(--shadow-md)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
            Hüseyin Altıkulaç
          </p>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>
            Admin Girişi
          </h1>
        </div>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: "0.75rem 0.9rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg)",
              color: "var(--text)",
              fontSize: "0.9rem",
              outline: "none",
              fontFamily: "inherit",
            }}
            autoFocus
          />
          {error && (
            <p style={{ color: "var(--danger)", fontSize: "0.8rem", padding: "0.5rem 0.75rem", backgroundColor: "rgba(220,38,38,0.06)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(220,38,38,0.15)" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            style={{
              padding: "0.75rem",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--accent)",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.9rem",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
}

