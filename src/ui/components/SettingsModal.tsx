import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface SettingsModalProps { onClose: () => void }
const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => <button type="button" role="switch" aria-label={label} aria-checked={checked} onClick={onChange} className="settings-switch">{checked ? 'On' : 'Off'}</button>;

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { complexityMode, setComplexityMode, autoRunOptimizer, setAutoRunOptimizer, clearFiles } = useAppStore();
  const [confirm, setConfirm] = useState(false);
  return <div className="settings-popover-content">
    <h2>Settings</h2>
    <label>Detailed mode <Toggle label="Detailed mode" checked={complexityMode === 'detailed'} onChange={() => setComplexityMode(complexityMode === 'simple' ? 'detailed' : 'simple')} /></label>
    <label>Auto-run optimizer <Toggle label="Auto-run optimizer" checked={autoRunOptimizer} onChange={() => setAutoRunOptimizer(!autoRunOptimizer)} /></label>
    <div className="settings-row"><span>Clear all files</span>{confirm ? <><button onClick={() => { clearFiles(); setConfirm(false); onClose(); }}>Confirm clear</button><button onClick={() => setConfirm(false)}>Cancel</button></> : <button onClick={() => setConfirm(true)}><Trash2 size={14}/> Clear</button>}</div>
  </div>;
};
