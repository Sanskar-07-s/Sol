import React from 'react';
import { useSolStore } from '../../state/useSolStore';
import { Cpu, CheckCircle2 } from 'lucide-react';

export const MemoryView: React.FC = () => {
  const { solState } = useSolStore();

  const stateHistory = [
    { state: solState, reason: 'Current active operational state', timestamp: 'Now' },
    { state: 'LISTENING', reason: 'Microphone activation triggered', timestamp: '1 min ago' },
    { state: 'IDLE', reason: 'System initialization baseline', timestamp: '5 mins ago' },
  ];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        maxWidth: '960px',
        margin: '0 auto',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        zIndex: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid var(--sol-surface-border)',
          borderRadius: '16px',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: '10px',
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.25)',
              color: 'var(--sol-energy-primary)',
            }}
          >
            <Cpu size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--sol-text-primary)' }}>
              SOL System Memory & State Log
            </h2>
            <p className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
              REACTIVE STATE MACHINE TRANSITION JOURNAL
            </p>
          </div>
        </div>

        <span
          className="font-mono text-xs"
          style={{
            padding: '4px 10px',
            borderRadius: '12px',
            background: 'rgba(0, 212, 255, 0.1)',
            color: 'var(--sol-energy-primary)',
            border: '1px solid rgba(0, 212, 255, 0.25)',
          }}
        >
          STATE: {solState}
        </span>
      </div>

      {/* State Transitions Timeline */}
      <div
        style={{
          padding: '20px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--sol-surface-border)',
          borderRadius: '16px',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)', marginBottom: '8px' }}>
          STATE MACHINE TRANSITIONS LOG
        </div>
        {stateHistory.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(3, 7, 20, 0.4)',
              border: '1px solid var(--sol-surface-border-subtle)',
              borderRadius: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={16} color="var(--sol-energy-primary)" />
              <div>
                <span className="font-mono text-xs" style={{ color: 'var(--sol-energy-primary)', fontWeight: 600 }}>
                  STATE // {item.state}
                </span>
                <div style={{ fontSize: '0.8125rem', color: 'var(--sol-text-secondary)', marginTop: '2px' }}>
                  {item.reason}
                </div>
              </div>
            </div>
            <span className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
              {item.timestamp}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
