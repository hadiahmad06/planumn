// Updated Contact Page with centered layout, profile picture above name, and icons for links
import { FaLinkedin, FaEnvelope, FaGithub } from "react-icons/fa";

export default function ContactPage() {
  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif", textAlign: "center" }}>
      <h1>Contact Us</h1>
      <p>If you have any questions or need assistance, feel free to reach out to us:</p>

      {/* Profile Section */}
      <div style={{ marginTop: "2rem" }}>
        <img
          src="https://via.placeholder.com/150"
          alt="Profile Picture"
          style={{ borderRadius: "50%", width: "150px", height: "150px", marginBottom: "1rem" }}
        />
        <h2>Hadi Ahmad</h2>
        <p>Student at UMN</p>

        {/* Social Buttons */}
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
    </div>
  );
}