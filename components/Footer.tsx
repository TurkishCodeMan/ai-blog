"use client";
import { useLocale } from "@/lib/locale-context";

export default function Footer() {
  const year = new Date().getFullYear();
  const { t } = useLocale();
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        padding: "2rem 1.5rem",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "0.85rem",
      }}
    >
      <p>
        © {year} Blog &mdash; {t("footer_rights")}
      </p>
    </footer>
  );
}
