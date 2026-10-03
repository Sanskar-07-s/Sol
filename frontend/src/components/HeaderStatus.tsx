import React from 'react';
import { Mic, MicOff, ShieldCheck, Activity, Volume2, VolumeX } from 'lucide-react';
import { RuntimeConnectionState } from '../state/types';
import { useSolStore, solStore } from '../state/useSolStore';
import { voiceEngine } from '../voice/VoiceEngine';

interface HeaderStatusProps {
  connectionState: RuntimeConnectionState;
  fpsMetric: number;
}

export const HeaderStatus: React.FC<HeaderStatusProps> = ({
  connectionState,
  fpsMetric,
}) => {
  const { voiceSettings, voiceLifecycleState } = useSolStore();

  const handleToggleVoiceOutput = () => {
    const nextState = !voiceSettings.enabled;
    solStore.setVoiceOutputEnabled(nextState);
    if (!nextState) {
      voiceEngine.stopSpeaking();
    }
  };

  const handleToggleMic = () => {
    solStore.toggleAudioListening();
  };

  const getVoiceStatusLabel = () => {
    switch (voiceLifecycleState) {
      case 'PASSIVE_LISTENING':
        return 'LISTENING FOR SOL';
      case 'ACTIVATED':
        return 'SOL ACTIVATED';
      case 'LISTENING_FOR_COMMAND':
        return 'LISTENING FOR COMMAND';
      case 'UNDERSTANDING':
        return 'UNDERSTANDING';
      case 'PROCESSING':
        return 'PROCESSING';
      case 'SPEAKING':
        return 'SOL SPEAKING';
      case 'INITIALIZING':
        return 'MIC INITIALIZING';
      case 'RECOVERING':
        return 'MIC RECOVERING';
      case 'MIC_ERROR':
        return 'MIC ERROR';
      case 'MIC_OFF':
      default:
        return 'MIC STANDBY';
    }
  };

  const isMicActive = voiceLifecycleState !== 'MIC_OFF' && voiceLifecycleState !== 'MIC_ERROR';
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

        {/* Audio state badge with Click-to-Toggle and Real Lifecycle Label */}
        <button
          onClick={handleToggleMic}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '12px',
            background: isMicActive ? 'rgba(0, 212, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
            border: isMicActive ? '1px solid rgba(0, 212, 255, 0.35)' : '1px solid var(--sol-surface-border-subtle)',
            color: isMicActive ? 'var(--sol-energy-primary)' : 'var(--sol-text-muted)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            transition: 'all var(--sol-transition-fast)',
          }}
          title={isMicActive ? 'Microphone Active (Click to Standby)' : 'Microphone in Standby (Click to Listen)'}
        >
          {isMicActive ? <Mic size={14} /> : <MicOff size={14} />}
          <span className="font-mono text-xs">
            {getVoiceStatusLabel()}
          </span>
        </button>

        {/* Voice Output Quick Toggle */}
        <button
          onClick={handleToggleVoiceOutput}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '12px',
            background: voiceSettings.enabled ? 'rgba(0, 212, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
            border: voiceSettings.enabled ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid var(--sol-surface-border-subtle)',
            color: voiceSettings.enabled ? 'var(--sol-energy-primary)' : 'var(--sol-text-muted)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            transition: 'all var(--sol-transition-fast)',
          }}
          title={voiceSettings.enabled ? 'Voice Output ON (Click to Mute)' : 'Voice Output OFF (Click to Unmute)'}
        >
          {voiceSettings.enabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          <span className="font-mono text-xs">
            VOICE {voiceSettings.enabled ? 'ON' : 'OFF'}
          </span>
        </button>

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
