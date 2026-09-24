import React from 'react';
import { TelemetrySnapshot } from '../state/types';
import { ChevronRight } from 'lucide-react';

interface RightTelemetryPanelProps {
  telemetry: TelemetrySnapshot;
}

export const RightTelemetryPanel: React.FC<RightTelemetryPanelProps> = ({ telemetry }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '80px',
        right: '28px',
        width: '260px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        zIndex: 20,
        pointerEvents: 'auto',
      }}
      aria-label="System Telemetry and Agent Status"
    >
      {/* 1. SYSTEM TELEMETRY HUD */}
      <div
        style={{
          background: 'rgba(5, 12, 28, 0.72)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '12px',
          padding: '16px 18px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <span
            className="text-caps-subtle"
            style={{ color: 'var(--sol-text-secondary)', fontWeight: 600, fontSize: '0.6875rem' }}
          >
            SYSTEM TELEMETRY
          </span>
          <span className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
            •••
          </span>
        </div>

        {/* 4 Circular Metric Gauges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          {/* CPU */}
          <div
            style={{
              padding: '6px 2px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--sol-surface-border-subtle)',
            }}
          >
            <div className="font-mono" style={{ fontSize: '0.625rem', color: 'var(--sol-text-muted)' }}>
              CPU
            </div>
            <div className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sol-energy-primary)' }}>
              {telemetry.cpuUsagePct}%
            </div>
          </div>

          {/* RAM */}
          <div
            style={{
              padding: '6px 2px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--sol-surface-border-subtle)',
            }}
          >
            <div className="font-mono" style={{ fontSize: '0.625rem', color: 'var(--sol-text-muted)' }}>
              RAM
            </div>
            <div className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sol-text-primary)' }}>
              {telemetry.memoryUsagePct}%
            </div>
          </div>

          {/* GPU */}
          <div
            style={{
              padding: '6px 2px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--sol-surface-border-subtle)',
            }}
          >
            <div className="font-mono" style={{ fontSize: '0.625rem', color: 'var(--sol-text-muted)' }}>
              GPU
            </div>
            <div className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sol-text-primary)' }}>
              {telemetry.gpuUsagePct ?? 8}%
            </div>
          </div>

          {/* NET */}
          <div
            style={{
              padding: '6px 2px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--sol-surface-border-subtle)',
            }}
          >
            <div className="font-mono" style={{ fontSize: '0.625rem', color: 'var(--sol-text-muted)' }}>
              NET
            </div>
            <div className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sol-text-primary)' }}>
              1.2M/s
            </div>
          </div>
        </div>

        {/* Dynamic Sparkline SVG */}
        <div style={{ height: '24px' }} aria-hidden="true">
          <svg width="100%" height="24" viewBox="0 0 200 24" fill="none">
            <path
              d="M0 12 H30 L40 6 L50 18 L60 12 H100 L110 3 L120 21 L130 12 H160 L170 8 L180 16 L190 12 H200"
              stroke="var(--sol-energy-primary)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
          </svg>
        </div>
      </div>

      {/* 2. ACTIVE AGENTS HUD */}
      <div
        style={{
          background: 'rgba(5, 12, 28, 0.72)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '12px',
          padding: '16px 18px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <span
            className="text-caps-subtle"
            style={{ color: 'var(--sol-text-secondary)', fontWeight: 600, fontSize: '0.6875rem' }}
          >
            ACTIVE AGENTS
          </span>
          <span className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
            •••
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem' }}>
          {/* CORE Agent */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--sol-energy-primary)' }} />
              <span style={{ color: 'var(--sol-text-primary)', fontWeight: 500 }}>CORE</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--sol-energy-primary)' }}>
              <span className="font-mono text-xs">Online</span>
              <ChevronRight size={12} />
            </div>
          </div>

          {/* VOICE Agent */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} />
              <span style={{ color: 'var(--sol-text-primary)', fontWeight: 500 }}>VOICE</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8' }}>
              <span className="font-mono text-xs">Standby</span>
              <ChevronRight size={12} />
            </div>
          </div>

          {/* BROWSER Agent */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--sol-state-offline)' }} />
              <span style={{ color: 'var(--sol-text-muted)', fontWeight: 500 }}>BROWSER</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--sol-text-muted)' }}>
              <span className="font-mono text-xs">Offline</span>
              <ChevronRight size={12} />
            </div>
          </div>

          {/* SYSTEM Agent */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--sol-state-success)' }} />
              <span style={{ color: 'var(--sol-text-primary)', fontWeight: 500 }}>SYSTEM</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--sol-state-success)' }}>
              <span className="font-mono text-xs">Online</span>
              <ChevronRight size={12} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
