import React, { useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Settings, Plus, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { scanFileList } from '../../engine/fileScanner';
import { formatSize, pluralize } from '../../lib/format';
import { SettingsModal } from './SettingsModal';
import { useOpenAlgorithmDrawer } from './AlgorithmDrawerContext';

export const TopBar: React.FC = () => {
  const { files, addFiles, setIsScanning, searchQuery, setSearchQuery } = useAppStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const openAlgorithm = useOpenAlgorithmDrawer();
  const total = files.reduce((sum, file) => sum + file.size, 0);

  const onFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    setIsScanning(true, { count: 0 });
    try {
      const scanned = await scanFileList(event.target.files);
      addFiles(scanned);
    } finally {
      setIsScanning(false, null);
      event.target.value = '';
    }
  };

  return <>
    <input ref={fileInput} type="file" multiple hidden onChange={onFiles} />
    <header className="vaultline-topbar">
      <button className="brand-button" onClick={() => navigate('/landing')} aria-label="Vaultline landing page">Vaultline</button>
      <nav className="vaultline-nav" aria-label="Main navigation">
        <NavLink to="/files">Files</NavLink><NavLink to="/play">Play</NavLink><NavLink to="/results">Results</NavLink>
        <button type="button" onClick={openAlgorithm}>Algorithm</button>
      </nav>
      <div className="vaultline-summary" aria-label="Current scan summary">{pluralize(files.length, 'file')}, {formatSize(total)}</div>
      <div className="topbar-actions">
        {searchQuery && <button className="icon-button" onClick={() => setSearchQuery('')} aria-label="Clear search"><X size={16} /></button>}
        <input className="topbar-search" aria-label="Search files" placeholder="Search files" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        <button className="quiet-button" onClick={() => fileInput.current?.click()}><Plus size={16} /> Add files</button>
        <button className="icon-button" aria-label="Settings" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(v => !v)}><Settings size={18} /></button>
      </div>
      {settingsOpen && <div className="vaultline-menu" role="dialog" aria-label="Settings"><button className="icon-button menu-close" aria-label="Close settings" onClick={() => setSettingsOpen(false)}>×</button><SettingsPopover onClose={() => setSettingsOpen(false)} /></div>}
    </header>
  </>;
};

const SettingsPopover: React.FC<{onClose:()=>void}> = ({ onClose }) => <SettingsModal onClose={onClose} />;
