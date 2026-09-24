import React, { useState } from 'react';
import {
  Sparkles,
  MessageSquare,
  CheckSquare,
  Boxes,
  Folder,
  Smartphone,
  Cpu,
  Settings,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'sol', label: 'SOL', icon: <Sparkles size={16} /> },
  { id: 'chat', label: 'Chat', icon: <MessageSquare size={16} /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={16} /> },
  { id: 'agents', label: 'Agents', icon: <Boxes size={16} /> },
  { id: 'files', label: 'Files', icon: <Folder size={16} /> },
  { id: 'devices', label: 'Devices', icon: <Smartphone size={16} /> },
  { id: 'memory', label: 'Memory', icon: <Cpu size={16} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
];

export const NavigationRail: React.FC = () => {
  const [activeTab, setActiveTab] = useState('sol');

  return (
    <nav
      style={{
        position: 'absolute',
        top: '80px',
        left: '24px',
        zIndex: 25,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        pointerEvents: 'auto',
      }}
      aria-label="Operating Environment Navigation"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === activeTab;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--sol-text-primary)' : 'var(--sol-text-muted)',
              background: isActive ? 'rgba(0, 212, 255, 0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(0, 212, 255, 0.25)' : '1px solid transparent',
              backdropFilter: isActive ? 'blur(12px)' : 'none',
              transition: 'all var(--sol-transition-fast)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            aria-current={isActive ? 'page' : undefined}
          >
            <span
              style={{
                color: isActive ? 'var(--sol-energy-primary)' : 'inherit',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {item.icon}
            </span>
            <span style={{ letterSpacing: '0.02em' }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
