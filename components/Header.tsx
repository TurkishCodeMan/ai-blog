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
        backgroundColor: "rgba(245,241,235,0.9)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 0 var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "0 1.5rem",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Identity */}
        <Link
          href="/"
          style={{
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            gap: "0.1rem",
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: "0.95rem",
              color: "var(--text)",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            Hüseyin Altıkulaç
          </span>
          <span
            style={{
              fontSize: "0.67rem",
              color: "var(--text-muted)",
              letterSpacing: "0.03em",
              fontWeight: 400,
            }}
          >
            AI Engineer · Software Developer · AI Researcher
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "0.38rem 0.8rem",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
                color: pathname === link.href ? "var(--accent)" : "var(--text-muted)",
                backgroundColor: pathname === link.href ? "var(--accent-glow)" : "transparent",
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
              padding: "0.32rem 0.6rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
              color: "var(--accent)",
              backgroundColor: "var(--accent-glow)",
              border: "1px solid rgba(180,83,9,0.25)",
              marginLeft: "0.2rem",
              letterSpacing: "0.06em",
              transition: "all 0.15s",
            }}
          >
            {locale === "tr" ? "EN" : "TR"}
          </button>

          {/* Publish / Admin */}
          <Link
            href="/admin"
            style={{
              padding: "0.38rem 0.8rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.825rem",
              fontWeight: 600,
              textDecoration: "none",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
              marginLeft: "0.2rem",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            {t("nav_admin")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
