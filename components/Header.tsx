"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/locale-context";

export default function Header() {
  const pathname = usePathname();
  const { t, locale, setLocale } = useLocale();

  const navLinks = [
    { href: "/", label: t("nav_blog") },
    { href: "/about", label: t("nav_about") },
  ];

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
        backgroundColor: "rgba(15,15,19,0.85)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "0 1.5rem",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontWeight: 800,
            fontSize: "1.15rem",
            color: "#fff",
            textDecoration: "none",
            letterSpacing: "-0.02em",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "linear-gradient(135deg, var(--accent), #a084fa)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.9rem",
              boxShadow: "0 0 16px rgba(124,106,247,0.4)",
            }}
          >
            ✦
          </span>
          Blog
        </Link>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: 8,
                fontSize: "0.9rem",
                fontWeight: 500,
                textDecoration: "none",
                color:
                  pathname === link.href ? "var(--accent-light)" : "var(--text-muted)",
                backgroundColor:
                  pathname === link.href ? "var(--accent-glow)" : "transparent",
                transition: "all 0.15s",
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* Lang toggle */}
          <button
            onClick={() => setLocale(locale === "tr" ? "en" : "tr")}
            title="Switch language"
            style={{
              padding: "0.35rem 0.65rem",
              borderRadius: 8,
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              color: "var(--accent-light)",
              backgroundColor: "var(--accent-glow)",
              border: "1px solid rgba(124,106,247,0.35)",
              marginLeft: "0.25rem",
              letterSpacing: "0.06em",
              transition: "all 0.15s",
            }}
          >
            {locale === "tr" ? "EN" : "TR"}
          </button>

          {/* Admin */}
          <Link
            href="/admin"
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: 8,
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
              marginLeft: "0.25rem",
              transition: "all 0.15s",
            }}
          >
            {t("nav_admin")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
