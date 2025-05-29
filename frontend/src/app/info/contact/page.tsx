// Centered Contact Page with profile picture above name, and icons for links
import { FaLinkedin, FaEnvelope, FaGithub } from "react-icons/fa";

export default function ContactPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
        background: "#fff",
      }}
    >
      <h1 style={{ marginBottom: 0 }}>Contact Us</h1>
      <p style={{ marginTop: 0, marginBottom: "2.5rem", textAlign: "center" }}>
        If you have any questions or need assistance, feel free to reach out to us:
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "4rem",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Hadi Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8fafc",
            borderRadius: "1rem",
            padding: "2rem 2.5rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <img
            src="/hadi.jpeg"
            alt="Hadi Ahmad"
            style={{ objectFit: "cover", borderRadius: "100%", width: "200px", height: "200px", display: "block", marginBottom: "1rem" }}
          />
          <h2 style={{ margin: 0 }}>Hadi Ahmad</h2>
          <p style={{ margin: 0 }}>Student at UMN</p>
          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "1rem" }}>
            <a
              href="https://www.linkedin.com/in/hadiahmad06"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0077b5", fontSize: "1.5rem" }}
            >
              <FaLinkedin />
            </a>
            <a
              href="mailto:ahmad287@umn.edu"
              style={{ color: "#d14836", fontSize: "1.5rem" }}
            >
              <FaEnvelope />
            </a>
            <a
              href="https://github.com/hadiahmad06"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#333", fontSize: "1.5rem" }}
            >
              <FaGithub />
            </a>
          </div>
        </div>
        {/* Michael Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8fafc",
            borderRadius: "1rem",
            padding: "2rem 2.5rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <img
            src="/michael.jpeg"
            alt="Michael Zewdie"
            style={{ objectFit: "cover", borderRadius: "100%", width: "200px", height: "200px", display: "block", marginBottom: "1rem" }}
          />
          <h2 style={{ margin: 0 }}>Michael Zewdie</h2>
          <p style={{ margin: 0 }}>Student at UMN</p>
          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "1rem" }}>
            <a
              href="https://www.linkedin.com/in/michaelzewdie06"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0077b5", fontSize: "1.5rem" }}
            >
              <FaLinkedin />
            </a>
            <a
              href="mailto:zewdi021@umn.edu"
              style={{ color: "#d14836", fontSize: "1.5rem" }}
            >
              <FaEnvelope />
            </a>
            <a
              href="https://github.com/Michael-Zewdie"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#333", fontSize: "1.5rem" }}
            >
              <FaGithub />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}