"use client";
import { useLocale } from "@/lib/locale-context";

export default function AboutPage() {
  const { t } = useLocale();

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <div className="fade-up" style={{ marginBottom: "2.5rem" }}>
        {/* Avatar placeholder */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent), #a084fa)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            marginBottom: "1.5rem",
          }}
        >
          👤
        </div>

        <h1
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.03em",
            marginBottom: "0.75rem",
          }}
        >
          {t("about_title")}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
          {t("about_subtitle")}
        </p>
      </div>

      <div className="fade-up fade-up-delay-1" style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
        <div className="prose">
          <p>{t("about_body")}</p>

          <h2>{t("about_what_title")}</h2>
          <ul>
            <li>{t("about_what_1")}</li>
            <li>{t("about_what_2")}</li>
            <li>{t("about_what_3")}</li>
          </ul>

          <h2>{t("about_contact_title")}</h2>
          <p>{t("about_contact_body")}</p>
        </div>
      </div>
    </div>
  );
}
