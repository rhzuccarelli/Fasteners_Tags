import React, { useRef, useState } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { exportJSON, importJSON } from './storage.js';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 32, fontFamily: 'monospace', color: '#1a1a1a' }}>
        <h2 style={{ color: '#dc2626', marginBottom: 8 }}>Something went wrong</h2>
        <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 6, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {this.state.error?.message}{'\n\n'}{this.state.error?.stack}
        </pre>
        <button onClick={() => this.setState({ error: null })}
          style={{ marginTop: 16, padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace' }}>
          Try again
        </button>
      </div>
    );
    return this.props.children;
  }
}
import Standards from './pages/Standards.jsx';
import Fasteners from './pages/Fasteners.jsx';
import Boxes from './pages/Boxes.jsx';
import PrintTags from './pages/PrintTags.jsx';

const NAV = [
  { to: '/standards', label: 'Standards', icon: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="2" width="14" height="2" rx="1" fill="currentColor"/>
      <rect x="1" y="7" width="10" height="2" rx="1" fill="currentColor"/>
      <rect x="1" y="12" width="12" height="2" rx="1" fill="currentColor"/>
    </svg>
  )},
  { to: '/fasteners', label: 'Fasteners', icon: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="8" y1="1" x2="8" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="11" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )},
  { to: '/boxes', label: 'Boxes', icon: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="4.5" width="13" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M1.5 7h13" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 1.5L3 4.5M11 1.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )},
  { to: '/print', label: 'Print Tags', icon: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="1.5" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 8.5H1.5a1 1 0 00-1 1v3a1 1 0 001 1h13a1 1 0 001-1v-3a1 1 0 00-1-1H13" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="3" y="10" width="10" height="4.5" rx=".5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )},
];

function SidebarBackup() {
  const fileRef = useRef(null);
  const [msg, setMsg] = useState('');

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      await importJSON(file);
      setMsg('Imported!');
      setTimeout(() => { setMsg(''); window.location.reload(); }, 800);
    } catch (err) {
      setMsg('Error: ' + err.message);
      setTimeout(() => setMsg(''), 3000);
    }
  }

  return (
    <div className="px-4 py-4 border-t border-white/10 flex flex-col gap-2">
      {msg && (
        <p className="font-mono text-center rounded px-2 py-1 text-white/80"
          style={{ fontSize: 10, background: msg.startsWith('Error') ? '#7f1d1d' : '#14532d' }}>
          {msg}
        </p>
      )}
      <button onClick={exportJSON}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
        style={{ fontSize: 11, fontFamily: 'monospace' }}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v9M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Export JSON
      </button>
      <button onClick={() => fileRef.current?.click()}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
        style={{ fontSize: 11, fontFamily: 'monospace' }}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M8 11V2M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Import JSON
      </button>
      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      <span className="font-mono text-gray-600 uppercase tracking-widest text-center" style={{ fontSize: 9 }}>
        localStorage · no server
      </span>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <div className="flex h-screen overflow-hidden">
        <aside className="flex flex-col w-[210px] flex-shrink-0" style={{ background: '#1a1a1a' }}>
          <div className="px-5 pt-6 pb-5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="4" stroke="#2563eb" strokeWidth="2"/>
                <line x1="9" y1="1" x2="9" y2="5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
                <line x1="9" y1="13" x2="9" y2="17" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
                <line x1="1" y1="9" x2="5" y2="9" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
                <line x1="13" y1="9" x2="17" y2="9" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="font-mono font-bold text-white uppercase tracking-widest" style={{ fontSize: 11 }}>
                Fastener Tracker
              </span>
            </div>
          </div>

          <nav className="flex-1 pt-4 space-y-0.5">
            {NAV.map(({ to, label, icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm border-l-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 bg-white/10 text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
                {icon}
                <span className="font-mono tracking-wide">{label}</span>
              </NavLink>
            ))}
          </nav>

          <SidebarBackup />
        </aside>

        <main className="flex-1 overflow-y-auto app-grid-bg">
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/fasteners" replace />} />
            <Route path="/standards" element={<Standards />} />
            <Route path="/fasteners" element={<Fasteners />} />
            <Route path="/boxes" element={<Boxes />} />
            <Route path="/print" element={<PrintTags />} />
          </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </HashRouter>
  );
}
