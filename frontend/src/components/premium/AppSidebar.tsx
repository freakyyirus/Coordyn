import React from 'react';
import { Activity } from 'lucide-react';
import type { AppView } from '../../types';

type NavItem = {
  key: AppView;
  label: string;
  icon: React.ReactNode;
};

type AppSidebarProps = {
  navItems: NavItem[];
  view: AppView;
  onSetView: (view: AppView) => void;
  isNegotiating: boolean;
  paused: boolean;
  isAuthenticated: boolean;
  onLogout: () => void;
  onGoLanding: () => void;
};

export const AppSidebar: React.FC<AppSidebarProps> = ({
  navItems,
  view,
  onSetView,
  isNegotiating,
  paused,
  isAuthenticated,
  onLogout,
  onGoLanding,
}) => {
  return (
    <aside className="sidebar">
      <button className="brand-lockup side" onClick={onGoLanding}>
        <div className="brand-logo">CY</div>
        <div>
          <strong>Coordyn</strong>
          <span>Multi-Agent Platform</span>
        </div>
      </button>

      <nav>
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`side-link ${view === item.key ? 'active' : ''}`}
            onClick={() => onSetView(item.key)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <p>Engine Status</p>
        <span className="live-indicator">
          <Activity size={14} /> {isNegotiating ? 'Running' : paused ? 'Paused' : 'Standby'}
        </span>
        {isAuthenticated && (
          <button className="side-link mt-2 w-full justify-center" onClick={onLogout}>
            Logout
          </button>
        )}
      </div>
    </aside>
  );
};
