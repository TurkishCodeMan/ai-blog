  "use client";
import { useLocale } from "@/lib/locale-context";

export default function AboutPage() {
  const { t } = useLocale();

  const roles = [
    t("about_role_1"),
    t("about_role_2"),
    t("about_role_3"),
  ];

  const interests = [
    t("about_interest_1"),
    t("about_interest_2"),
    t("about_interest_3"),
    t("about_interest_4"),
  ];

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "4rem 1.5rem" }}>

      {/* Header block */}
      <div className="fade-up" style={{ marginBottom: "3rem" }}>
        <h1
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
            fontWeight: 800,
            color: "var(--text)",
            letterSpacing: "-0.03em",
            marginBottom: "1rem",
          }}
        >
          {t("about_title")}
        </h1>

        {/* Role badges */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {roles.map((role) => (
            <span
              key={role}
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                padding: "4px 12px",
                borderRadius: 20,
                border: "1px solid rgba(180,83,9,0.22)",
                color: "var(--accent)",
                backgroundColor: "var(--accent-tag)",
                letterSpacing: "0.03em",
              }}
            >
              {role}
            </span>
          ))}
        </div>

        <p style={{ color: "var(--text-soft)", fontSize: "1.05rem", lineHeight: 1.8, maxWidth: 580 }}>
          {t("about_body")}
        </p>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--border)", marginBottom: "2.5rem" }} />

      {/* Areas of work */}
      <div className="fade-up fade-up-delay-1" style={{ marginBottom: "2.5rem" }}>
        <h2
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: "1rem",
          }}
        >
          {t("about_interests_title")}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {interests.map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                color: "var(--text-soft)",
                fontSize: "0.95rem",
              }}
            >
              <span style={{ color: "var(--accent)", fontSize: "0.6rem" }}>▸</span>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--border)", marginBottom: "2.5rem" }} />

      {/* Contact */}
      <div className="fade-up fade-up-delay-2">
        <h2
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: "1rem",
          }}
        >
          {t("about_contact_title")}
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "1rem" }}>
          {t("about_contact_body")}
        </p>
        <a
          href="https://github.com/TurkishCodeMan"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1.1rem",
            borderRadius: 8,
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: 500,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
            (e.currentTarget as HTMLElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          TurkishCodeMan
        </a>
      </div>
    </div>
  );
}
