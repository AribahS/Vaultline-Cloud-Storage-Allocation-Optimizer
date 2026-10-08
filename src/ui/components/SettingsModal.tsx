import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface SettingsModalProps { onClose: () => void }
export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { complexityMode, setComplexityMode, capStrategy, setCapStrategy, quotaUnitOption, setRoundingUnitOption, clearFiles } = useAppStore();
  const [confirm, setConfirm] = useState(false);
  return <div className="settings-popover-content">
    <h2>Settings</h2>
    <details className="settings-advanced"><summary>Advanced</summary>
      <label>Display detail <select value={complexityMode} onChange={event => setComplexityMode(event.target.value as 'simple' | 'detailed')}><option value="simple">Simple</option><option value="detailed">Detailed</option></select></label>
      <label>Size scale <select value={quotaUnitOption} onChange={event => setRoundingUnitOption(event.target.value as typeof quotaUnitOption)}>{['auto', '1MB', '10MB', '100MB', '1GB'].map(value => <option value={value} key={value}>{value}</option>)}</select></label>
      <label>File grouping <select value={capStrategy} onChange={event => setCapStrategy(event.target.value as typeof capStrategy)}><option value="largest_500">Largest 500 files</option><option value="folder_mode">Folders</option><option value="bundle_small_files">Group small files</option></select></label>
    </details>
    <div className="settings-row"><span>Clear all files</span>{confirm ? <><button onClick={() => { clearFiles(); setConfirm(false); onClose(); }}>Confirm clear</button><button onClick={() => setConfirm(false)}>Cancel</button></> : <button onClick={() => setConfirm(true)}><Trash2 size={14}/> Clear</button>}</div>
  </div>;
};
