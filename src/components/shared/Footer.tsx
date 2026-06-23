"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="tie-footer">
      <div className="tie-footer-grid">
        
        {/* Column 1: Brand details */}
        <div className="tie-footer-col">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#ffffff", letterSpacing: "0.02em" }}>TIE</span>
            <span style={{ fontSize: "0.75rem", color: "#5BA4A4", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>• Insights</span>
          </div>
          <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "#9aa8b6", margin: 0, textAlign: "left" }}>
            Empowering organizations to understand team dynamics, collaboration patterns, and potential. Built to understand, not surveil.
          </p>
        </div>

        {/* Column 2: Contact Meta */}
        <div className="tie-footer-col">
          <h4 className="tie-footer-title">Contact Support</h4>
          
          <div className="tie-footer-contact-item">
            <MapPin size={15} style={{ color: "#5BA4A4", marginTop: "2px", flexShrink: 0 }} />
            <span style={{ textAlign: "left" }}>42 Innovation Way, Tech Park, Suite 100</span>
          </div>

          <div className="tie-footer-contact-item">
            <Mail size={15} style={{ color: "#5BA4A4", flexShrink: 0 }} />
            <a href="mailto:support@tie-engine.com">
              support@tie-engine.com
            </a>
          </div>

          <div className="tie-footer-contact-item">
            <Phone size={15} style={{ color: "#5BA4A4", flexShrink: 0 }} />
            <a href="tel:+91 9940196998">
              +91 9940196998
            </a>
          </div>

          <div className="tie-footer-contact-item">
            <MessageCircle size={15} style={{ color: "#5BA4A4", flexShrink: 0 }} />
            <a href="https://wa.me/9940196998" target="_blank" rel="noopener noreferrer">
              +91 9940196998 (WhatsApp)
            </a>
          </div>
        </div>

        {/* Column 3: Navigation Links (Commented out) */}
        {/*
        <div className="tie-footer-col">
          <h4 className="tie-footer-title">Resources</h4>
          {["Privacy Policy", "Terms of Service", "Safety & Security", "System Status"].map((item) => (
            <Link
              key={item}
              href="#"
              className="tie-footer-link"
            >
              {item}
            </Link>
          ))}
        </div>
        */}
      </div>

      {/* Decorative separator */}
      <div className="tie-footer-divider" />

      {/* Bottom Bar */}
      <div className="tie-footer-bottom">
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} TIE. All rights reserved.
        </p>
        <p style={{ margin: 0, fontStyle: "italic" }}>
          Built to understand, not surveil.
        </p>
      </div>
    </footer>
  );
}
