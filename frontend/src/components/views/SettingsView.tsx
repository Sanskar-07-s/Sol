import React, { useEffect, useState } from 'react';
import { useSolStore, solStore } from '../../state/useSolStore';
import { voiceEngine } from '../../voice/VoiceEngine';
import { speechSynthesisService } from '../../voice/SpeechSynthesisService';
import { Settings, Volume2, VolumeX, Square, Play, Radio } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { voiceSettings } = useSolStore();
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [wsUrl, setWsUrl] = useState('ws://localhost:8000/ws');

  useEffect(() => {
    const voices = speechSynthesisService.getVoices();
    setAvailableVoices(voices);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        setAvailableVoices(speechSynthesisService.getVoices());
      };
    }
  }, []);

  const handleToggleVoice = () => {
    const nextState = !voiceSettings.enabled;
    solStore.setVoiceOutputEnabled(nextState);
    if (!nextState) {
      voiceEngine.stopSpeaking();
    }
  };

  const handleStopSpeaking = () => {
    voiceEngine.stopSpeaking();
  };

  const handleTestVoice = () => {
    voiceEngine.speak('SOL Voice Output operational. All telemetry systems online.');
  };

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
        overflowY: 'auto',
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
            <Settings size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--sol-text-primary)' }}>
              SOL Environment Settings
            </h2>
            <p className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
              VOICE OUTPUT, RECOGNITION & RUNTIME CONFIGURATION
            </p>
          </div>
        </div>
      </div>

      {/* Voice Output Controls Panel */}
      <div
        style={{
          padding: '24px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--sol-surface-border)',
          borderRadius: '16px',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Volume2 size={20} color="var(--sol-energy-primary)" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--sol-text-primary)' }}>
                Speech Synthesis Voice Output
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--sol-text-muted)' }}>
                Toggle spoken audio feedback for command results and status events
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleVoice}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '12px',
              background: voiceSettings.enabled ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: voiceSettings.enabled ? '1px solid rgba(0, 212, 255, 0.35)' : '1px solid var(--sol-surface-border-subtle)',
              color: voiceSettings.enabled ? 'var(--sol-energy-primary)' : 'var(--sol-text-muted)',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              transition: 'all var(--sol-transition-fast)',
            }}
          >
            {voiceSettings.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{voiceSettings.enabled ? 'VOICE OUTPUT ON' : 'VOICE OUTPUT OFF'}</span>
          </button>
        </div>

        {voiceSettings.enabled && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--sol-surface-border-subtle)',
            }}
          >
            {/* Voice Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="font-mono text-xs" style={{ color: 'var(--sol-text-secondary)' }}>
                SELECTED TTS VOICE ({availableVoices.length} AVAILABLE)
              </label>
              <select
                value={voiceSettings.selectedVoiceURI}
                onChange={(e) => solStore.updateVoiceSettings({ selectedVoiceURI: e.target.value })}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(3, 7, 20, 0.6)',
                  border: '1px solid var(--sol-surface-border)',
                  color: 'var(--sol-text-primary)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--sol-font-sans)',
                  outline: 'none',
                }}
              >
                <option value="">Auto (Default Natural Voice)</option>
                {availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Sliders Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* Volume Slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="font-mono text-xs" style={{ color: 'var(--sol-text-secondary)' }}>VOLUME</label>
                  <span className="font-mono text-xs" style={{ color: 'var(--sol-energy-primary)' }}>
                    {Math.round(voiceSettings.volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={voiceSettings.volume}
                  onChange={(e) => solStore.updateVoiceSettings({ volume: parseFloat(e.target.value) })}
                  style={{ accentColor: 'var(--sol-energy-primary)' }}
                />
              </div>

              {/* Rate Slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="font-mono text-xs" style={{ color: 'var(--sol-text-secondary)' }}>RATE (SPEED)</label>
                  <span className="font-mono text-xs" style={{ color: 'var(--sol-energy-primary)' }}>
                    {voiceSettings.rate.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={voiceSettings.rate}
                  onChange={(e) => solStore.updateVoiceSettings({ rate: parseFloat(e.target.value) })}
                  style={{ accentColor: 'var(--sol-energy-primary)' }}
                />
              </div>

              {/* Pitch Slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="font-mono text-xs" style={{ color: 'var(--sol-text-secondary)' }}>PITCH</label>
                  <span className="font-mono text-xs" style={{ color: 'var(--sol-energy-primary)' }}>
                    {voiceSettings.pitch.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={voiceSettings.pitch}
                  onChange={(e) => solStore.updateVoiceSettings({ pitch: parseFloat(e.target.value) })}
                  style={{ accentColor: 'var(--sol-energy-primary)' }}
                />
              </div>
            </div>

            {/* Test & Stop Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '8px' }}>
              <button
                onClick={handleTestVoice}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: 'rgba(0, 212, 255, 0.1)',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                  color: 'var(--sol-energy-primary)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                <Play size={14} />
                <span>Test Voice Sample</span>
              </button>

              <button
                onClick={handleStopSpeaking}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: 'var(--sol-state-error)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                <Square size={14} />
                <span>Stop Speaking</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Backend Socket Config */}
      <div
        style={{
          padding: '24px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--sol-surface-border)',
          borderRadius: '16px',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Radio size={20} color="var(--sol-energy-primary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--sol-text-primary)' }}>
            Python Runtime Daemon Connection
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label className="font-mono text-xs" style={{ color: 'var(--sol-text-secondary)' }}>
            WEBSOCKET DAEMON ENDPOINT URL
          </label>
          <input
            type="text"
            value={wsUrl}
            onChange={(e) => setWsUrl(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(3, 7, 20, 0.6)',
              border: '1px solid var(--sol-surface-border)',
              color: 'var(--sol-text-primary)',
              fontSize: '0.875rem',
              fontFamily: 'var(--sol-font-mono)',
              outline: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
};
