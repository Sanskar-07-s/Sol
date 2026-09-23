import React from 'react';
import { Mic, MicOff, ShieldCheck, Activity } from 'lucide-react';
import { RuntimeConnectionState, AudioInputState } from '../state/types';

interface HeaderStatusProps {
  connectionState: RuntimeConnectionState;
  audioState: AudioInputState;
  fpsMetric: number;
}

export const HeaderStatus: React.FC<HeaderStatusProps> = ({
  connectionState,
  audioState,
  fpsMetric,
}) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 28px',
        borderBottom: '1px solid var(--sol-surface-border-subtle)',
        background: 'linear-gradient(180deg, rgba(5, 10, 23, 0.8) 0%, transparent 100%)',
        backdropFilter: 'blur(8px)',
        zIndex: 10,
        position: 'relative',
      }}
      role="banner"
    >
      {/* SOL Identity & Version */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--sol-energy-primary)',
              boxShadow: '0 0 10px var(--sol-energy-primary)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--sol-font-sans)',
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: 'var(--sol-text-primary)',
            }}
          >
            SOL
          </span>
          <span
            className="text-caps-subtle"
            style={{
              marginLeft: '4px',
              padding: '2px 6px',
              borderRadius: '3px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.15)',
              fontSize: '0.625rem',
            }}
          >
            ENV // v0.1.0-alpha
          </span>
        </div>
      </div>

      {/* Runtime Connection & Security Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Security / Enclave status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            color: 'var(--sol-text-secondary)',
          }}
        >
          <ShieldCheck size={14} color="var(--sol-energy-primary)" />
          <span className="font-mono text-xs">ENCLAVE // SECURE</span>
        </div>

        {/* Audio state badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            color: audioState.isListening ? 'var(--sol-energy-primary)' : 'var(--sol-text-muted)',
          }}
          title={audioState.isListening ? 'Microphone Active' : 'Microphone Inactive'}
        >
          {audioState.isListening ? <Mic size={14} /> : <MicOff size={14} />}
          <span className="font-mono text-xs">
            {audioState.isListening ? 'MIC ACTIVE' : 'MIC STANDBY'}
          </span>
        </div>

        {/* Runtime Connection status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '3px 10px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--sol-surface-border-subtle)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor:
                connectionState === 'CONNECTED'
                  ? 'var(--sol-state-success)'
                  : connectionState === 'STANDALONE_DEV'
                  ? 'var(--sol-energy-primary)'
                  : 'var(--sol-state-warning)',
            }}
          />
          <span className="font-mono text-xs" style={{ color: 'var(--sol-text-secondary)' }}>
            {connectionState === 'STANDALONE_DEV' ? 'DEV RUNTIME' : connectionState}
          </span>
        </div>

        {/* Real-time Renderer Performance metric */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--sol-text-muted)',
          }}
          title="Measured WebGL Render Frame Rate"
        >
          <Activity size={12} />
          <span className="font-mono text-xs">{fpsMetric} FPS</span>
        </div>
      </div>
    </header>
  );
};
