import React, { useState } from 'react';
import { Cpu, HardDrive, Wifi, ChevronUp, ChevronDown } from 'lucide-react';
import { TelemetrySnapshot } from '../state/types';

interface SystemTelemetryPillProps {
  telemetry: TelemetrySnapshot;
}

export const SystemTelemetryPill: React.FC<SystemTelemetryPillProps> = ({ telemetry }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
      aria-label="System Awareness Telemetry"
    >
      {/* Primary Contextual Pill */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '6px 14px',
          background: 'rgba(5, 11, 25, 0.7)',
          border: '1px solid var(--sol-surface-border-subtle)',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          fontSize: '0.75rem',
          color: 'var(--sol-text-secondary)',
          cursor: 'pointer',
        }}
        aria-expanded={isExpanded}
        title="Toggle system awareness telemetry"
      >
        {/* CPU */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Cpu size={13} color="var(--sol-energy-primary)" />
          <span className="font-mono">{telemetry.cpuUsagePct}%</span>
        </div>

        {/* RAM */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <HardDrive size={13} color="var(--sol-text-muted)" />
          <span className="font-mono">{telemetry.memoryUsagePct}%</span>
        </div>

        {/* Network */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Wifi size={13} color="var(--sol-text-muted)" />
          <span className="font-mono">{telemetry.networkLatencyMs}ms</span>
        </div>

        {/* Dev Data Tag */}
        {telemetry.isSimulatedDevData && (
          <span
            style={{
              fontSize: '0.625rem',
              color: 'var(--sol-text-muted)',
              borderLeft: '1px solid var(--sol-surface-border-subtle)',
              paddingLeft: '8px',
            }}
          >
            DEV
          </span>
        )}

        <div style={{ color: 'var(--sol-text-muted)' }}>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </button>

      {/* Expanded Telemetry Drawer */}
      {isExpanded && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: '8px',
            width: '260px',
            background: 'rgba(6, 14, 32, 0.95)',
            border: '1px solid var(--sol-surface-border)',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(16px)',
            zIndex: 30,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              borderBottom: '1px solid var(--sol-surface-border-subtle)',
              paddingBottom: '6px',
            }}
          >
            <span className="text-caps-subtle">SYSTEM AWARENESS</span>
            <span
              style={{
                fontSize: '0.625rem',
                color: 'var(--sol-state-warning)',
                fontWeight: 500,
              }}
            >
              SIMULATED DEV DATA
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--sol-text-secondary)' }}>CPU Core Load</span>
              <span className="font-mono" style={{ color: 'var(--sol-text-primary)' }}>
                {telemetry.cpuUsagePct}%
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--sol-text-secondary)' }}>System Memory</span>
              <span className="font-mono" style={{ color: 'var(--sol-text-primary)' }}>
                {telemetry.memoryUsedGb} / {telemetry.memoryTotalGb} GB
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--sol-text-secondary)' }}>GPU Compute</span>
              <span className="font-mono" style={{ color: 'var(--sol-text-primary)' }}>
                {telemetry.gpuUsagePct ?? 0}%
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--sol-text-secondary)' }}>VRAM Allocation</span>
              <span className="font-mono" style={{ color: 'var(--sol-text-primary)' }}>
                {telemetry.gpuVramUsedGb ?? 0} GB
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--sol-text-secondary)' }}>Loopback Latency</span>
              <span className="font-mono" style={{ color: 'var(--sol-text-primary)' }}>
                {telemetry.networkLatencyMs} ms
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
