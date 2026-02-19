import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hakkımda",
  description: "Merhaba, ben kimim ve neler yapıyorum?",
};

export default function AboutPage() {
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
          Hakkımda
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
          Merhaba! Ben bu blogun yazarıyım.
        </p>
      </div>

      <div className="fade-up fade-up-delay-1" style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
        <div className="prose">
          <p>
            Teknoloji, yazılım ve insanlara dair düşüncelerimi bu blogda paylaşıyorum.
            Bazen teknik, bazen kişisel — ama her zaman dürüst ve doğrudan.
          </p>

          <h2>Ne Yapıyorum?</h2>
          <ul>
            <li>Yazılım geliştiriyorum</li>
            <li>Yeni teknolojiler öğreniyorum</li>
            <li>Düşüncelerimi yazıya döküyorum</li>
          </ul>

          <h2>İletişim</h2>
          <p>
            Benimle iletişime geçmek isterseniz GitHub üzerinden ulaşabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
