import React, { useEffect } from 'react';
import { useSolStore, solStore } from './state/useSolStore';
import { HeaderStatus } from './components/HeaderStatus';
import { CommandBar } from './components/CommandBar';
import { ActiveTaskCard } from './components/ActiveTaskCard';
import { ContextualMessage } from './components/ContextualMessage';
import { SystemTelemetryPill } from './components/SystemTelemetryPill';
import { StateSelectorDebug } from './components/StateSelectorDebug';
import { SolCoreCanvas } from './core/SolCoreCanvas';
import { telemetryService } from './services/telemetryService';
import { AlertTriangle, PowerOff } from 'lucide-react';

export const App: React.FC = () => {
  const {
    solState,
    connectionState,
    activeTask,
    contextualMessage,
    telemetry,
    audioState,
    fpsMetric,
  } = useSolStore();

  // Start telemetry polling service
  useEffect(() => {
    telemetryService.startPolling(3000);
    return () => telemetryService.stopPolling();
  }, []);

  const handleCommandSubmit = (text: string) => {
    solStore.submitCommand(text);
  };

  const handleToggleMic = () => {
    solStore.toggleAudioListening();
  };

  const handleDismissTask = () => {
    solStore.clearActiveTask();
  };

  const handleDismissMessage = () => {
    solStore.clearContextualMessage();
  };

  const handleSelectDevState = (targetState: typeof solState) => {
    solStore.setSolState(targetState, true, 'Dev debug selection');
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Background Cosmic Space Atmosphere */}
      <div className="sol-environment-bg" />

      {/* TOP: Minimal SOL Environment Status */}
      <HeaderStatus
        connectionState={connectionState}
        audioState={audioState}
        fpsMetric={fpsMetric}
      />

      {/* CENTER: Reserved SOL Core Environment & Contextual Layers */}
      <main
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
        }}
      >
        {/* State Banner Notifications for OFFLINE and ERROR */}
        {solState === 'OFFLINE' && (
          <div
            style={{
              position: 'absolute',
              top: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(71, 85, 105, 0.4)',
              borderRadius: '20px',
              fontSize: '0.75rem',
              color: 'var(--sol-state-offline)',
              zIndex: 20,
              backdropFilter: 'blur(8px)',
            }}
            role="status"
          >
            <PowerOff size={14} />
            <span className="font-mono">CORE POWER MINIMAL // OFFLINE</span>
          </div>
        )}

        {solState === 'ERROR' && (
          <div
            style={{
              position: 'absolute',
              top: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '20px',
              fontSize: '0.75rem',
              color: 'var(--sol-state-error)',
              zIndex: 20,
              backdropFilter: 'blur(8px)',
            }}
            role="alert"
          >
            <AlertTriangle size={14} />
            <span className="font-mono">SYSTEM ANOMALY // FAILSAFE ACTIVE</span>
          </div>
        )}

        {/* The living SOL Core WebGL Canvas Pipeline */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SolCoreCanvas solState={solState} />
        </div>

        {/* Contextual Area (Progressive Disclosure - only appears when active) */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            width: '100%',
            maxWidth: '680px',
            padding: '0 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 15,
            pointerEvents: 'auto',
          }}
        >
          <ContextualMessage message={contextualMessage} onDismiss={handleDismissMessage} />
          <ActiveTaskCard task={activeTask} onDismiss={handleDismissTask} />
        </div>
      </main>

      {/* BOTTOM: Integrated Command Interface & System Awareness */}
      <footer
        style={{
          position: 'relative',
          zIndex: 20,
          padding: '20px 28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: 'linear-gradient(0deg, rgba(5, 10, 23, 0.9) 0%, transparent 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {/* Invisible spacer on left for desktop symmetry */}
          <div style={{ width: '180px', display: 'none' }} className="desktop-spacer" />

          {/* Integrated Command Input */}
          <div style={{ flex: 1 }}>
            <CommandBar
              onSubmit={handleCommandSubmit}
              isListening={audioState.isListening}
              onToggleMic={handleToggleMic}
            />
          </div>

          {/* Restrained System Awareness Telemetry */}
          <div style={{ minWidth: '180px', display: 'flex', justifyContent: 'flex-end' }}>
            <SystemTelemetryPill telemetry={telemetry} />
          </div>
        </div>
      </footer>

      {/* Developer Tooling: State Switcher (~ key) */}
      <StateSelectorDebug currentState={solState} onSelectState={handleSelectDevState} />
    </div>
  );
};

export default App;
