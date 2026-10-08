/**
 * ChecklistModal: "Download checklist"
 * Printable Keep/Move list with interactive checkboxes.
 * Export options: Copy to clipboard, Download CSV, and Shell script with safety warning.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Download, Terminal, Check, Printer, AlertTriangle } from 'lucide-react';
import { springs } from '../motion';
import { useAppStore } from '../../store/useAppStore';
import { formatBytes } from '../utils/fileHelpers';
import { playSound } from '../utils/sound';

export const ChecklistModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { files, knapsackResult } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const keptItems = knapsackResult?.keptItems || [];
  const keptIds = new Set(keptItems.map((k) => k.id));
  const movedItems: any[] = (knapsackResult?.droppedItems || files || []).filter((i: any) => !keptIds.has(i.id));

  const toggleCheck = (id: string) => {
    playSound('click');
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getFSize = (item: any): number => item?.originalSize ?? item?.size ?? 0;

  const generateTextSummary = () => {
    let text = `=== VAULTLINE PACKING CHECKLIST ===\n\n`;
    text += `FILES TO KEEP (${keptItems.length}):\n`;
    keptItems.forEach((f: any) => {
      text += `[ ] ${f.name} (${formatBytes(getFSize(f))})\n`;
    });
    text += `\nFILES TO MOVE / STORE ELSEWHERE (${movedItems.length}):\n`;
    movedItems.forEach((f: any) => {
      text += `[ ] ${f.name} (${formatBytes(getFSize(f))})\n`;
    });
    return text;
  };

  const handleCopy = () => {
    const text = generateTextSummary();
    navigator.clipboard.writeText(text);
    playSound('pop');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    playSound('pop');
    let csv = `Status,File Name,Size Bytes,Size Formatted\n`;
    keptItems.forEach((f: any) => {
      csv += `"KEEP","${f.name.replace(/"/g, '""')}",${getFSize(f)},"${formatBytes(getFSize(f))}"\n`;
    });
    movedItems.forEach((f: any) => {
      csv += `"MOVE","${f.name.replace(/"/g, '""')}",${getFSize(f)},"${formatBytes(getFSize(f))}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'vaultline-plan.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadScript = () => {
    playSound('pop');
    let script = `#!/bin/bash\n# Vaultline Move Script\n# REVIEW CAREFULLY BEFORE RUNNING\n\nmkdir -p ./vaultline_moved\n`;
    movedItems.forEach((f: any) => {
      script += `mv "${f.name}" ./vaultline_moved/ 2>/dev/null || true\n`;
    });

    const blob = new Blob([script], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'move_files.sh');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'color-mix(in srgb,var(--ink) 75%,transparent)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-md)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Download checklist"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={springs.bouncy}
        className="sticker-card"
        style={{
          width: '100%',
          maxWidth: 680,
          background: 'var(--card)',
          padding: 'var(--space-xl)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>Packing checklist</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-2)' }}>
              Print or export your tailored Keep & Move lists.
            </p>
          </div>
          <button onClick={onClose} className="sticker-chip" aria-label="Close modal" style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* Action bar for exports */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button className="sticker-chip" onClick={handleCopy} style={{ gap: 6 }}>
            {copied ? <Check size={14} color="var(--kept)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy text'}</span>
          </button>
          <button className="sticker-chip" onClick={handleDownloadCSV} style={{ gap: 6 }}>
            <Download size={14} />
            <span>Download CSV</span>
          </button>
          <button className="sticker-chip" onClick={handleDownloadScript} style={{ gap: 6 }}>
            <Terminal size={14} />
            <span>Download script</span>
          </button>
          <button className="sticker-chip" onClick={handlePrint} style={{ gap: 6 }}>
            <Printer size={14} />
            <span>Print checklist</span>
          </button>
        </div>

        {/* Warning note for script */}
        <div
          style={{
            background: 'var(--paper)',
            borderRadius: 12,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 'var(--text-xs)',
            color: 'var(--color-ink-2)',
          }}
        >
          <AlertTriangle size={14} color="var(--highlight)" />
          <span>Always review shell scripts before executing them on your system.</span>
        </div>

        {/* Scrollable checklist body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            paddingRight: 6,
          }}
        >
          {/* Keep List */}
          <div>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--kept)', marginBottom: 8 }}>
              ✓ KEEP IN BOX ({keptItems.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {keptItems.map((f) => {
                const isChecked = checkedIds.has(f.id);
                return (
                  <label
                    key={f.id}
                    onClick={() => toggleCheck(f.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--paper)',
                      padding: '8px 12px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ accentColor: 'var(--ink)' }}
                      />
                      <span
                        style={{
                          fontWeight: 700,
                          textDecoration: isChecked ? 'line-through' : 'none',
                          opacity: isChecked ? 0.6 : 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {f.name}
                      </span>
                    </div>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--color-ink-2)' }}>
                      {formatBytes(getFSize(f))}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Move List */}
          <div>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--moved)', marginBottom: 8 }}>
              → MOVE ELSEWHERE ({movedItems.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {movedItems.map((f: any) => {
                const isChecked = checkedIds.has(f.id);
                return (
                  <label
                    key={f.id}
                    onClick={() => toggleCheck(f.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--paper)',
                      padding: '8px 12px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ accentColor: 'var(--ink)' }}
                      />
                      <span
                        style={{
                          fontWeight: 700,
                          textDecoration: isChecked ? 'line-through' : 'none',
                          opacity: isChecked ? 0.6 : 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {f.name}
                      </span>
                    </div>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--color-ink-2)' }}>
                      {formatBytes(getFSize(f))}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default ChecklistModal;
