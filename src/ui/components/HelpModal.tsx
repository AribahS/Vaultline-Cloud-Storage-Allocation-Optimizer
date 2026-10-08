import React from "react";
import { createPortal } from "react-dom";
import { X, Box, Shield, Cpu, HardDrive } from "lucide-react";

interface HelpModalProps {
  onClose: () => void;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: "24px" }}>
    <div style={{
      fontSize: "11px", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em",
      color: "var(--color-ink-muted)", marginBottom: "12px", paddingBottom: "6px",
      borderBottom: "1px solid var(--color-border-hairline)"
    }}>{title}</div>
    {children}
  </div>
);

const QA = ({ q, a }: { q: string; a: string }) => (
  <div style={{ marginBottom: "16px" }}>
    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-ink)", marginBottom: "4px" }}>{q}</div>
    <div style={{ fontSize: "13px", color: "var(--color-ink-muted)", lineHeight: 1.65 }}>{a}</div>
  </div>
);

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  const modal = (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, backgroundColor: "color-mix(in srgb,var(--ink) 50%,transparent)", backdropFilter: "blur(4px)" }}
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Help"
        style={{
          position: "relative", zIndex: 1,
          width: "540px", maxWidth: "calc(100vw - 32px)", maxHeight: "calc(100vh - 64px)",
          overflowY: "auto",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border-hairline)",
          borderRadius: "14px",
          boxShadow: "0 32px 80px color-mix(in srgb,var(--ink) 35%,transparent)",
          padding: "28px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: 40, height: 40, borderRadius: "10px", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Box size={20} color="var(--card)" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--color-ink)" }}>Vaultline Help</h2>
              <div style={{ fontSize: "12px", color: "var(--color-ink-muted)", marginTop: "2px" }}>Version 1.0.0 — Storage Optimizer</div>
            </div>
          </div>
          <button
            id="help-modal-close"
            onClick={onClose}
            aria-label="Close help"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-ink-muted)", padding: "6px", borderRadius: "8px", display: "flex", alignItems: "center" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* What is Vaultline */}
        <Section title="What is Vaultline?">
          <p style={{ fontSize: "14px", color: "var(--color-ink)", lineHeight: 1.7, margin: "0 0 16px" }}>
            Vaultline is a <strong>privacy-first storage optimizer</strong> that uses dynamic programming to find the best plan for the selected size scale and constraints.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            {[
              { icon: Shield, label: "Private by design", desc: "Nothing is uploaded: only names, sizes and dates are read." },
              { icon: Cpu, label: "Dynamic programming", desc: "O(n × W) on the selected size scale." },
              { icon: HardDrive, label: "Works with folders", desc: "Add files or choose a folder; planning runs in your browser." },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{
                padding: "14px 12px", borderRadius: "10px",
                background: "color-mix(in srgb,var(--kept) 8%,transparent)",
                border: "1px solid color-mix(in srgb,var(--kept) 15%,transparent)",
              }}>
                <Icon size={18} color="var(--ink)" style={{ marginBottom: "8px", display: "block" }} />
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-ink)", marginBottom: "4px" }}>{label}</div>
                <div style={{ fontSize: "11px", color: "var(--color-ink-muted)", lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Getting Started */}
        <Section title="Getting started">
          <ol style={{ margin: 0, paddingLeft: "20px", color: "var(--color-ink)", lineHeight: 1 }}>
            {[
              ["Add files", "Drag & drop a folder onto the app, or use the sample presets on the Dashboard."],
              ["Set your quota", "Enter the target storage size in the Optimizer tab."],
              ["Review the plan", "The optimizer automatically finds the best keep/move split."],
              ["Export", "Download a report or a copy script from the Reports tab."],
            ].map(([step, detail]) => (
              <li key={step} style={{ marginBottom: "10px", fontSize: "14px" }}>
                <strong>{step}</strong> — <span style={{ color: "var(--color-ink-muted)" }}>{detail}</span>
              </li>
            ))}
          </ol>
        </Section>

        {/* FAQ */}
        <Section title="Frequently asked questions">
          <QA q="Does Vaultline read my file contents?" a="No. Only file names, sizes, modification dates, and paths are used. File contents are never accessed." />
          <QA q="Why does the landing page appear on every load?" a="The landing page is shown each time you open Vaultline as a quick overview. Click 'Enter' to go straight to the dashboard." />
          <QA q="What does the Detailed mode setting do?" a="Detailed mode reveals advanced metrics like algorithm cell counts, raw byte values, and priority scores — useful for power users." />
          <QA q="Can I use Vaultline offline?" a="Yes. Vaultline is a fully local web app. No internet connection is required after the initial load." />
        </Section>

        {/* Keyboard shortcuts */}
        <Section title="Keyboard shortcuts">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {[
              ["Esc", "Close drawers / modals"],
            ].map(([key, action]) => (
              <div key={key} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px", borderRadius: "7px",
                backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-border-hairline)",
              }}>
                <code style={{ fontSize: "12px", fontFamily: "var(--font-mono, monospace)", color: "var(--ink)", fontWeight: 600 }}>{key}</code>
                <span style={{ fontSize: "12px", color: "var(--color-ink-muted)" }}>{action}</span>
              </div>
            ))}
          </div>
        </Section>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 24px", borderRadius: "8px", border: "none",
              background: "var(--ink)", color: "var(--card)",
              cursor: "pointer", fontSize: "14px", fontWeight: 600,
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};
