"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#F4F7FA",
        borderTop: "1px solid rgba(36, 59, 83, 0.08)",
        padding: "1.5rem 4rem",
        width: "100%",
        marginTop: "auto",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#243B53", letterSpacing: "-0.01em" }}>TIE</span>
          <span style={{ fontSize: "0.8125rem", color: "#8fa3b8" }}>· Talent Intelligence Engine</span>
        </div>
        <p style={{ fontSize: "0.78rem", color: "#9aadbe", fontWeight: 400, margin: 0 }}>
          © {new Date().getFullYear()} TIE. Built to understand, not surveil.
        </p>
        <div style={{ display: "flex", gap: "1.25rem" }}>
          {["Privacy", "Terms", "Contact"].map((item) => (
            <Link
              key={item}
              href="#"
              style={{
                fontSize: "0.78rem",
                color: "#8fa3b8",
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#243B53")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8fa3b8")}
            >
              {item}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
