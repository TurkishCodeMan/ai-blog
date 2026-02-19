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
    <div style={{ maxWidth: 400, margin: "10rem auto", padding: "2rem", border: "1px solid var(--border)", borderRadius: 12, backgroundColor: "var(--bg-card)" }}>
      <h1 style={{ color: "#fff", marginBottom: "1.5rem", textAlign: "center" }}>Admin Girişi</h1>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "0.75rem", borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--bg)", color: "#fff" }}
          autoFocus
        />
        {error && <p style={{ color: "var(--danger)", fontSize: "0.8rem" }}>{error}</p>}
        <button
          type="submit"
          style={{ padding: "0.75rem", borderRadius: 8, backgroundColor: "var(--accent)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
        >
          Giriş Yap
        </button>
      </form>
    </div>
  );
}

