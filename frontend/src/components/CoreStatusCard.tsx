import React from 'react';
import { SolState } from '../state/types';

interface CoreStatusCardProps {
  solState: SolState;
}

export const CoreStatusCard: React.FC<CoreStatusCardProps> = ({ solState }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '120px',
        left: '160px',
        width: '240px',
        background: 'rgba(5, 12, 28, 0.72)',
        border: '1px solid rgba(56, 189, 248, 0.22)',
        borderRadius: '12px',
        padding: '18px 20px',
        backdropFilter: 'blur(16px)',
        zIndex: 20,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        pointerEvents: 'auto',
      }}
      role="region"
      aria-label="SOL Core Status Diagnostic"
    >
      {/* Corner Bracket Cybernetic Decoration */}
      <div
        style={{
          position: 'absolute',
          top: '-1px',
          left: '-1px',
          width: '12px',
          height: '12px',
          borderTop: '2px solid var(--sol-energy-primary)',
          borderLeft: '2px solid var(--sol-energy-primary)',
          borderRadius: '4px 0 0 0',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-1px',
          right: '-1px',
          width: '12px',
          height: '12px',
          borderBottom: '2px solid var(--sol-energy-primary)',
          borderRight: '2px solid var(--sol-energy-primary)',
          borderRadius: '0 0 4px 0',
        }}
      />

      <div style={{ marginBottom: '12px' }}>
        <h2
          style={{
            fontFamily: 'var(--sol-font-sans)',
            fontSize: '1rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: 'var(--sol-text-primary)',
          }}
        >
          SOL CORE
        </h2>
        <div
          className="font-mono text-xs"
          style={{
            color:
              solState === 'WARNING'
                ? 'var(--sol-state-warning)'
                : solState === 'ERROR'
                ? 'var(--sol-state-error)'
                : solState === 'SUCCESS'
                ? 'var(--sol-state-success)'
                : 'var(--sol-energy-primary)',
            fontWeight: 600,
            marginTop: '2px',
          }}
        >
          {solState}
        </div>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--sol-text-secondary)',
            marginTop: '4px',
            lineHeight: 1.3,
          }}
        >
          {solState === 'OFFLINE'
            ? 'Core power minimal. System offline.'
            : solState === 'ERROR'
            ? 'Anomaly detected. Containment active.'
            : solState === 'LISTENING'
            ? 'Microphone stream active. Listening...'
            : 'System online. Awaiting your command.'}
        </p>
      </div>

      {/* Cybernetic Pulse Line */}
      <div style={{ margin: '14px 0', height: '18px' }} aria-hidden="true">
        <svg width="100%" height="18" viewBox="0 0 200 18" fill="none">
          <path
            d="M0 9 H50 L58 3 L64 15 L70 9 H90 L96 5 L102 13 L108 9 H140 L146 2 L152 16 L158 9 H200"
            stroke="var(--sol-energy-primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Subsystem Health Diagnostics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--sol-text-secondary)' }}>CORE</span>
          <span className="font-mono" style={{ color: 'var(--sol-state-success)' }}>
            {solState === 'OFFLINE' ? 'OFFLINE' : solState === 'ERROR' ? 'FAULT' : 'STABLE'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--sol-text-secondary)' }}>ORBITAL RINGS</span>
          <span className="font-mono" style={{ color: 'var(--sol-state-success)' }}>
            {solState === 'OFFLINE' ? 'STANDBY' : 'STABLE'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--sol-text-secondary)' }}>PLASMA FIELD</span>
          <span className="font-mono" style={{ color: 'var(--sol-state-success)' }}>
            {solState === 'OFFLINE' ? 'INACTIVE' : 'STABLE'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--sol-text-secondary)' }}>NEBULA CLOUDS</span>
          <span className="font-mono" style={{ color: 'var(--sol-state-success)' }}>
            STABLE
          </span>
        </div>
      </div>
    </div>
  );
};
