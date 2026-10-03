import React from 'react';
import { useSolStore } from '../../state/useSolStore';
import { Boxes, Cpu, Mic, HardDrive, Terminal, Shield } from 'lucide-react';

export const AgentView: React.FC = () => {
  const { connectionState, audioState, telemetry } = useSolStore();

  const agents = [
    {
      id: 'sol-core',
      name: 'SOL SYSTEM CORE',
      role: 'Primary Operating Orchestrator',
      icon: <Cpu size={20} color="var(--sol-energy-primary)" />,
      status: 'ONLINE',
      latency: `${telemetry.networkLatencyMs}ms`,
      details: 'Living Three.js Shader Core & State Machine Engine',
    },
    {
      id: 'python-daemon',
      name: 'PYTHON RUNTIME DAEMON',
      role: 'Command Execution Boundary',
      icon: <Terminal size={20} color="var(--sol-energy-primary)" />,
      status: connectionState === 'CONNECTED' ? 'ONLINE' : 'STANDALONE DEV',
      latency: connectionState === 'CONNECTED' ? '3ms' : 'N/A',
      details: 'FastAPI WebSocket server listening on ws://localhost:8000/ws',
    },
    {
      id: 'voice-unit',
      name: 'VOICE PERCEPTION & TTS UNIT',
      role: 'Speech Recognition & Synthesis',
      icon: <Mic size={20} color="var(--sol-energy-primary)" />,
      status: audioState.hasPermission ? 'ACTIVE' : 'STANDBY',
      latency: 'Instant',
      details: 'Browser Web Speech API & ActivationDetector ("Hey SOL")',
    },
    {
      id: 'telemetry-monitor',
      name: 'HARDWARE TELEMETRY MONITOR',
      role: 'CPU/VRAM Hardware Profiler',
      icon: <Shield size={20} color="var(--sol-energy-primary)" />,
      status: 'POLLING (3s)',
      latency: '1ms',
      details: `CPU: ${telemetry.cpuUsagePct}% | VRAM: ${(telemetry.gpuVramUsedGb ?? 0).toFixed(1)}GB | LATENCY: ${telemetry.networkLatencyMs}ms`,
    },
    {
      id: 'file-bridge',
      name: 'FILE SYSTEM BRIDGE',
      role: 'Local Workspace Inspector',
      icon: <HardDrive size={20} color="var(--sol-energy-primary)" />,
      status: 'READ-ONLY',
      latency: '< 1ms',
      details: 'Direct path inspection targeting clean D:\\Sol workspace',
    },
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
            <Boxes size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--sol-text-primary)' }}>
              SOL Agent Ecosystem
            </h2>
            <p className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
              5 ACTIVE HARDWARE & RUNTIME AGENTS
            </p>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {agents.map((agent) => (
          <div
            key={agent.id}
            style={{
              padding: '20px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--sol-surface-border)',
              borderRadius: '16px',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {agent.icon}
                  <span className="font-mono text-xs" style={{ color: 'var(--sol-energy-primary)', fontWeight: 600 }}>
                    {agent.name}
                  </span>
                </div>
                <span
                  className="font-mono text-xs"
                  style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'rgba(34, 197, 94, 0.12)',
                    color: 'var(--sol-state-success)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                  }}
                >
                  {agent.status}
                </span>
              </div>

              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--sol-text-primary)', marginBottom: '4px' }}>
                {agent.role}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--sol-text-muted)', lineHeight: 1.4 }}>
                {agent.details}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '1px solid var(--sol-surface-border-subtle)',
              }}
            >
              <span className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
                RESPONSE LATENCY
              </span>
              <span className="font-mono text-xs" style={{ color: 'var(--sol-text-primary)' }}>
                {agent.latency}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
