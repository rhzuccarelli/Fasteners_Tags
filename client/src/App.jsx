import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Standards from './pages/Standards.jsx';
import Fasteners from './pages/Fasteners.jsx';
import Boxes from './pages/Boxes.jsx';
import PrintTags from './pages/PrintTags.jsx';

/* ── Inline SVG icons ─────────────────────────────────────────────────── */
function IconStandards() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="2" width="14" height="2" rx="1" fill="currentColor" />
      <rect x="1" y="7" width="10" height="2" rx="1" fill="currentColor" />
      <rect x="1" y="12" width="12" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

function IconFastener() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8" y1="1" x2="8" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="11" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="4.5" width="13" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.5 7h13" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 1.5L3 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 1.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconPrint() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="1.5" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 8.5H1.5a1 1 0 00-1 1v3a1 1 0 001 1h13a1 1 0 001-1v-3a1 1 0 00-1-1H13" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="10" width="10" height="4.5" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12.5" cy="10.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

/* ── Sidebar nav item ─────────────────────────────────────────────────── */
function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-100 border-l-2',
          isActive
            ? 'border-blue-500 bg-white/10 text-white'
            : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5',
        ].join(' ')
      }
    >
      {icon}
      <span className="font-mono tracking-wide">{label}</span>
    </NavLink>
  );
}

/* ── App shell ────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className="flex flex-col w-[220px] flex-shrink-0 overflow-y-auto"
          style={{ backgroundColor: '#1a1a1a' }}
        >
          {/* Brand */}
          <div className="px-5 pt-6 pb-5 border-b border-white/10">
            <div className="flex items-center gap-2 mb-0.5">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="4" stroke="#2563eb" strokeWidth="2" />
                <line x1="9" y1="1" x2="9" y2="5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                <line x1="9" y1="13" x2="9" y2="17" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                <line x1="1" y1="9" x2="5" y2="9" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                <line x1="13" y1="9" x2="17" y2="9" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span
                className="font-mono font-bold tracking-widest text-white uppercase"
                style={{ fontSize: '11px', letterSpacing: '0.12em' }}
              >
                Fastener
              </span>
            </div>
            <span
              className="font-mono font-bold tracking-widest text-white uppercase block pl-6"
              style={{ fontSize: '11px', letterSpacing: '0.12em' }}
            >
              Tracker
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 pt-4 space-y-0.5">
            <NavItem to="/standards" icon={<IconStandards />} label="Standards" />
            <NavItem to="/fasteners" icon={<IconFastener />} label="Fasteners" />
            <NavItem to="/boxes" icon={<IconBox />} label="Boxes" />
            <NavItem to="/print" icon={<IconPrint />} label="Print Tags" />
          </nav>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-white/10">
            <span
              className="font-mono text-gray-600 uppercase tracking-widest"
              style={{ fontSize: '9px' }}
            >
              v0.1.0
            </span>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto app-grid-bg">
          <Routes>
            <Route path="/" element={<Navigate to="/fasteners" replace />} />
            <Route path="/standards" element={<Standards />} />
            <Route path="/fasteners" element={<Fasteners />} />
            <Route path="/boxes" element={<Boxes />} />
            <Route path="/print" element={<PrintTags />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
