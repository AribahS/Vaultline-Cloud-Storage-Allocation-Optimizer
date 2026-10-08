import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Moon, Sun, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

interface SettingsModalProps {
  onClose: () => void;
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    fontSize: "11px", fontWeight: 700, textTransform: "uppercase" as const,
    letterSpacing: "0.08em", color: "var(--color-ink-3)",
    marginBottom: "4px", marginTop: "8px", paddingBottom: "6px",
    borderBottom: "1px solid var(--color-border-hairline)",
    boxShadow: "0 2px 0 0 var(--color-brass-300)",
  }}>{children}</div>
);

const Row = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: "16px", padding: "12px 0", borderBottom: "1px solid var(--color-border-hairline)",
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-ink)" }}>{label}</div>
      {description && <div style={{ fontSize: "12px", color: "var(--color-ink-3)", marginTop: "3px", lineHeight: 1.5 }}>{description}</div>}
    </div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
);

const Toggle = ({ checked, onChange, id }: { checked: boolean; onChange: () => void; id: string }) => (
  <button
    id={id}
    onClick={onChange}
    role="switch"
    aria-checked={checked}
    style={{
      width: "44px", height: "24px", borderRadius: "12px", border: "none",
      cursor: "pointer",
      backgroundColor: checked ? "var(--color-forest)" : "var(--color-border-strong)",
      position: "relative", transition: "background-color 200ms ease", flexShrink: 0,
      outline: "none",
    }}
  >
    <span style={{
      position: "absolute", top: "2px", left: checked ? "22px" : "2px",
      width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#fff",
      transition: "left 200ms ease", boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
      display: "block",
    }} />
  </button>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { theme, toggleTheme, complexityMode, setComplexityMode, autoRunOptimizer, setAutoRunOptimizer, clearFiles } = useAppStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const isDark = theme === "dark";
  const isDetailed = complexityMode === "detailed";

  const modal = (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      />

      {/* A10: Panel with fixed header, scrollable body, fixed footer */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "460px", maxWidth: "calc(100vw - 32px)",
        maxHeight: "calc(100dvh - 24px)",
        display: "flex", flexDirection: "column",
        backgroundColor: "var(--color-surface-raised)",
        border: "1px solid var(--color-border-hairline)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-level-3)",
        overflow: "hidden",
      }}>
        {/* Fixed header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--color-border-hairline)",
          flexShrink: 0,
        }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--color-ink)" }}>
            Settings
          </h2>
          <button
            id="settings-modal-close"
            onClick={onClose}
            aria-label="Close settings"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--color-ink-3)", padding: "6px", borderRadius: "8px",
              display: "flex", alignItems: "center", lineHeight: 1,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1, minHeight: 0, padding: "16px 24px", overscrollBehavior: "contain" }}>
          <SectionTitle>Appearance</SectionTitle>
          <Row label="Dark mode" description="Switch between light and dark colour schemes">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sun size={14} color="var(--color-ink-3)" />
              <Toggle checked={isDark} onChange={toggleTheme} id="settings-dark-mode-toggle" />
              <Moon size={14} color="var(--color-ink-3)" />
            </div>
          </Row>
          <Row label="Detailed mode" description="Show advanced metrics, algorithm internals, and raw numbers">
            <Toggle checked={isDetailed} onChange={() => setComplexityMode(isDetailed ? "simple" : "detailed")} id="settings-detailed-mode-toggle" />
          </Row>

          <SectionTitle>Optimizer</SectionTitle>
          <Row label="Auto-run optimizer" description="Automatically recompute the plan when files or space changes">
            <Toggle checked={autoRunOptimizer} onChange={() => setAutoRunOptimizer(!autoRunOptimizer)} id="settings-auto-run-toggle" />
          </Row>

          <SectionTitle>Data</SectionTitle>
          <Row label="Clear all files" description="Remove all loaded files and reset the optimizer result">
            {showClearConfirm ? (
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--color-semantic-danger)", whiteSpace: "nowrap" }}>Are you sure?</span>
                <button
                  id="settings-clear-files-confirm-btn"
                  onClick={() => { clearFiles(); onClose(); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "4px",
                    padding: "6px 12px", borderRadius: "7px",
                    border: "none", background: "var(--color-semantic-danger)",
                    color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  <Trash2 size={12} /> Yes, clear
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  style={{
                    padding: "6px 10px", borderRadius: "7px",
                    border: "1px solid var(--color-border-strong)", background: "transparent",
                    color: "var(--color-ink-2)", cursor: "pointer", fontSize: "12px",
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                id="settings-clear-files-btn"
                onClick={() => setShowClearConfirm(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "7px 14px", borderRadius: "7px",
                  border: "1px solid var(--color-semantic-danger)", background: "transparent",
                  color: "var(--color-semantic-danger)", cursor: "pointer", fontSize: "13px", fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                <Trash2 size={13} /> Clear files
              </button>
            )}
          </Row>
          <Row label="Reset app settings" description="Restore all preferences to defaults (page reload required)">
            <button
              id="settings-reset-btn"
              onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.reload(); }}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "7px 14px", borderRadius: "7px",
                border: "1px solid var(--color-border-strong)", background: "transparent",
                color: "var(--color-ink)", cursor: "pointer", fontSize: "13px", fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              <RotateCcw size={13} /> Reset
            </button>
          </Row>
        </div>

        {/* Fixed footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--color-border-hairline)",
          display: "flex", justifyContent: "flex-end",
          flexShrink: 0,
          backgroundColor: "var(--color-surface-raised)",
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 24px", borderRadius: "8px", border: "none",
              background: "var(--color-forest)", color: "#fff",
              cursor: "pointer", fontSize: "14px", fontWeight: 600,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

