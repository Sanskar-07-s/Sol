import React from 'react';
import { useSolStore } from '../../state/useSolStore';
import { Smartphone, Cpu, HardDrive, Wifi } from 'lucide-react';

export const DevicesView: React.FC = () => {
  const { telemetry, connectionState } = useSolStore();

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
            <Smartphone size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--sol-text-primary)' }}>
              Host System & Device Telemetry
            </h2>
            <p className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
              LOCAL HARDWARE PROFILE // WINDOWS ENCLAVE
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="font-mono text-xs"
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              background: 'rgba(34, 197, 94, 0.1)',
              color: 'var(--sol-state-success)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
            }}
          >
            TELEMETRY ACTIVE
          </span>
        </div>
      </div>

      {/* Grid Specs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {/* CPU Panel */}
        <div
          style={{
            padding: '20px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--sol-surface-border)',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Cpu size={20} color="var(--sol-energy-primary)" />
            <span className="font-mono text-xs" style={{ color: 'var(--sol-energy-primary)', fontWeight: 600 }}>
              CPU UTILIZATION
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--sol-text-primary)', marginBottom: '8px' }}>
            {telemetry.cpuUsagePct}%
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(0, telemetry.cpuUsagePct))}%`,
                height: '100%',
                background: 'var(--sol-energy-primary)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* RAM Panel */}
        <div
          style={{
            padding: '20px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--sol-surface-border)',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <HardDrive size={20} color="var(--sol-energy-primary)" />
            <span className="font-mono text-xs" style={{ color: 'var(--sol-energy-primary)', fontWeight: 600 }}>
              SYSTEM RAM
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--sol-text-primary)', marginBottom: '8px' }}>
            {telemetry.memoryUsedGb.toFixed(1)} GB / {telemetry.memoryTotalGb.toFixed(1)} GB
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(0, telemetry.memoryUsagePct))}%`,
                height: '100%',
                background: 'var(--sol-energy-primary)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Network & Socket Panel */}
        <div
          style={{
            padding: '20px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--sol-surface-border)',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Wifi size={20} color="var(--sol-energy-primary)" />
            <span className="font-mono text-xs" style={{ color: 'var(--sol-energy-primary)', fontWeight: 600 }}>
              SOCKET DAEMON LATENCY
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--sol-text-primary)', marginBottom: '8px' }}>
            {telemetry.networkLatencyMs} ms
          </div>
          <div className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
            ENDPOINT // ws://localhost:8000/ws ({connectionState})
          </div>
        </div>
      </div>
    </div>
  );
};
