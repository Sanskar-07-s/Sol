import React from 'react';
import { Hand, ChevronRight, Activity } from 'lucide-react';
import { SolState } from '../state/types';

interface BottomAuxiliaryCardsProps {
  solState: SolState;
  isListening: boolean;
}

export const GesturePill: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        background: 'rgba(5, 12, 28, 0.72)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        borderRadius: '16px',
        backdropFilter: 'blur(16px)',
        cursor: 'default',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      }}
      title="Hand Gesture Architecture (Prepared for Vision Daemon)"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'rgba(0, 212, 255, 0.1)',
          color: 'var(--sol-energy-primary)',
        }}
        aria-hidden="true"
      >
        <Hand size={16} />
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--sol-text-primary)' }}>
          Use hand gestures
        </div>
        <div className="font-mono" style={{ fontSize: '0.625rem', color: 'var(--sol-text-muted)' }}>
          to interact with SOL
        </div>
      </div>
      <ChevronRight size={14} color="var(--sol-text-muted)" />
    </div>
  );
};

export const VoiceAssistantPill: React.FC<BottomAuxiliaryCardsProps> = ({ solState, isListening }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 18px',
        background: 'rgba(5, 12, 28, 0.72)',
        border: `1px solid ${
          isListening
            ? 'rgba(0, 212, 255, 0.5)'
            : 'rgba(56, 189, 248, 0.2)'
        }`,
        borderRadius: '16px',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Waveform graphic */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: isListening
            ? 'rgba(0, 212, 255, 0.2)'
            : 'rgba(56, 189, 248, 0.08)',
          color: isListening ? 'var(--sol-energy-primary)' : 'var(--sol-state-idle)',
        }}
      >
        <Activity size={16} style={{ animation: isListening ? 'pulse 1s infinite' : 'none' }} />
      </div>
      <div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--sol-text-primary)' }}>
          {isListening ? 'SOL is listening...' : solState === 'OFFLINE' ? 'SOL is offline' : 'SOL is ready'}
        </div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--sol-text-secondary)' }}>
          Your personal AI assistant
        </div>
      </div>
    </div>
  );
};
