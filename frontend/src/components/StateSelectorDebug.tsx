import React, { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react';
import { ALL_SOL_STATES } from '../state/solStateMachine';
import { SolState } from '../state/types';

interface StateSelectorDebugProps {
  currentState: SolState;
  onSelectState: (state: SolState) => void;
}

export const StateSelectorDebug: React.FC<StateSelectorDebugProps> = ({
  currentState,
  onSelectState,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Toggle debug panel with backtick / tilde key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        // Prevent typing into inputs if triggered
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        zIndex: 50,
      }}
    >
      {/* Dev toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          background: 'rgba(5, 11, 25, 0.85)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '8px',
          color: 'var(--sol-text-secondary)',
          fontSize: '0.6875rem',
          backdropFilter: 'blur(8px)',
        }}
        title="Toggle Developer State Switcher (~)"
        aria-label="Toggle Developer State Switcher"
      >
        <Settings size={13} color="var(--sol-energy-primary)" />
        <span className="font-mono">DEV STATE (~): {currentState}</span>
      </button>

      {/* Debug Drawer Modal */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '0',
            width: '320px',
            background: 'rgba(4, 9, 22, 0.98)',
            border: '1px solid var(--sol-surface-border)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(20px)',
          }}
          role="dialog"
          aria-label="Developer State Switcher"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--sol-surface-border-subtle)',
            }}
          >
            <div>
              <div className="text-caps-subtle" style={{ color: 'var(--sol-energy-primary)' }}>
                DEVELOPMENT TOOLING
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--sol-text-secondary)' }}>
                Force Core State Transitions
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close debug panel"
              style={{ color: 'var(--sol-text-muted)' }}
            >
              <X size={15} />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '6px',
            }}
          >
            {ALL_SOL_STATES.map((state) => {
              const isSelected = state === currentState;
              return (
                <button
                  key={state}
                  onClick={() => onSelectState(state)}
                  style={{
                    padding: '8px 10px',
                    textAlign: 'left',
                    borderRadius: '6px',
                    fontSize: '0.6875rem',
                    fontFamily: 'var(--sol-font-mono)',
                    fontWeight: isSelected ? 600 : 400,
                    background: isSelected
                      ? 'rgba(0, 212, 255, 0.15)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected
                      ? '1px solid var(--sol-energy-primary)'
                      : '1px solid var(--sol-surface-border-subtle)',
                    color: isSelected
                      ? 'var(--sol-energy-primary)'
                      : 'var(--sol-text-secondary)',
                  }}
                >
                  {state}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
