import React from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
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

          <div className="px-5 py-4 border-t border-white/10">
            <span className="font-mono text-gray-600 uppercase tracking-widest" style={{ fontSize: 9 }}>
              localStorage · no server
            </span>
          </div>
        </aside>

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
    </HashRouter>
  );
}
