import React, { useState } from 'react';
import { Zap, Home, MessageSquare, BarChart3, GitCompare, Menu, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { AppView } from '../types';

const navItems: { view: AppView; label: string; icon: React.ReactNode }[] = [
  { view: 'home', label: 'Home', icon: <Home size={16} /> },
  { view: 'negotiate', label: 'Negotiate', icon: <MessageSquare size={16} /> },
  { view: 'results', label: 'Results', icon: <BarChart3 size={16} /> },
  { view: 'batch', label: 'Compare', icon: <GitCompare size={16} /> },
];

export const Header: React.FC = () => {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (v: AppView) => {
    setView(v);
    setMobileOpen(false);
  };

  return (
    <>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        borderBottom: '1px solid #EAEAEA',
        background: '#FFFFFF',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div onClick={() => handleNav('home')} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#0B0B0B',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.9rem',
          }}>C</div>
          <span style={{ color: '#0B0B0B', fontWeight: 600, fontSize: '1rem' }}>Coordyn</span>
        </div>

        <nav style={{
          display: 'flex',
          gap: '8px',
        }} className="header-nav-desktop">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => handleNav(item.view)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: 'none',
                background: view === item.view ? '#0B0B0B' : 'transparent',
                color: view === item.view ? '#FFFFFF' : '#6B6B6B',
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '999px',
            border: 'none',
            background: '#FF5A1F',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            transition: 'all 0.2s ease',
          }} className="header-cta-desktop">
            <Zap size={14} />
            <span className="cta-text">New Negotiation</span>
          </button>
          
          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            style={{
              display: 'none',
              padding: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            className="mobile-menu-btn"
          >
            {mobileOpen ? <X size={20} color="#0B0B0B" /> : <Menu size={20} color="#0B0B0B" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(255,255,255,0.98)',
          zIndex: 60,
          padding: '80px 24px 24px',
        }} onClick={() => setMobileOpen(false)}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }} onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => handleNav(item.view)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: view === item.view ? '#0B0B0B' : 'transparent',
                  color: view === item.view ? '#FFFFFF' : '#6B6B6B',
                  fontSize: '1rem',
                  fontWeight: 500,
                  textAlign: 'left',
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '12px',
              border: 'none',
              background: '#FF5A1F',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              textAlign: 'left',
              marginTop: '8px',
            }}>
              <Zap size={18} />
              <span>New Negotiation</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .header-nav-desktop { display: none !important; }
          .header-cta-desktop { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @media (max-width: 480px) {
          header[style*="padding: 12px 24px"] {
            padding: 10px 16px !important;
          }
          .cta-text { display: none; }
        }
      `}</style>
    </>
  );
};