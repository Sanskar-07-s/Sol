import React from 'react';
import { useSolStore, solStore } from '../../state/useSolStore';
import { CheckSquare, AlertCircle, CheckCircle2, Clock, Terminal } from 'lucide-react';

export const TaskView: React.FC = () => {
  const { activeTask } = useSolStore();

  // Sample past task log history
  const historyTasks = [
    {
      id: 'cmd-history-1',
      title: 'Initialize SOL Living Core Shader Pipeline',
      agentName: 'GRAPHICS ENGINE',
      status: 'completed',
      timestamp: 'Just now',
      stepsCount: 3,
    },
    {
      id: 'cmd-history-2',
      title: 'Establish WebSocket Runtime Daemon Bridge',
      agentName: 'SYSTEM DAEMON',
      status: 'completed',
      timestamp: '2 mins ago',
      stepsCount: 2,
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
            <CheckSquare size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--sol-text-primary)' }}>
              Task Execution & History
            </h2>
            <p className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
              REALTIME COMMAND PIPELINE STEPS
            </p>
          </div>
        </div>

        {activeTask && (
          <button
            onClick={() => solStore.clearActiveTask()}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: 'var(--sol-state-error)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Clear Active Task
          </button>
        )}
      </div>

      {/* Active Task Detailed Card */}
      {activeTask ? (
        <div
          style={{
            padding: '20px',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid var(--sol-surface-border)',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Terminal size={18} color="var(--sol-energy-primary)" />
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--sol-text-primary)' }}>
                {activeTask.title}
              </span>
            </div>
            <span
              className="font-mono text-xs"
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                background:
                  activeTask.status === 'completed'
                    ? 'rgba(34, 197, 94, 0.15)'
                    : activeTask.status === 'failed'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(0, 212, 255, 0.15)',
                color:
                  activeTask.status === 'completed'
                    ? 'var(--sol-state-success)'
                    : activeTask.status === 'failed'
                    ? 'var(--sol-state-error)'
                    : 'var(--sol-energy-primary)',
                border: '1px solid currentColor',
              }}
            >
              {activeTask.status.toUpperCase()} // {activeTask.agentName}
            </span>
          </div>

          {/* Steps timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {activeTask.steps.map((step, idx) => (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  background: 'rgba(3, 7, 20, 0.4)',
                  borderRadius: '10px',
                  border: '1px solid var(--sol-surface-border-subtle)',
                }}
              >
                <div style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>
                  {step.status === 'completed' ? (
                    <CheckCircle2 size={16} color="var(--sol-state-success)" />
                  ) : step.status === 'failed' ? (
                    <AlertCircle size={16} color="var(--sol-state-error)" />
                  ) : (
                    <Clock size={16} color="var(--sol-energy-primary)" />
                  )}
                </div>
                <span className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
                  STEP 0{idx + 1}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--sol-text-primary)', flex: 1 }}>
                  {step.label}
                </span>
                <span className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
                  {step.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '24px',
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid var(--sol-surface-border-subtle)',
            borderRadius: '16px',
            textAlign: 'center',
            color: 'var(--sol-text-muted)',
            fontSize: '0.875rem',
          }}
        >
          No active task running. Issue a spoken or typed command to trigger execution.
        </div>
      )}

      {/* History Tasks List */}
      <div style={{ marginTop: '12px' }}>
        <h3 className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)', marginBottom: '12px', letterSpacing: '0.1em' }}>
          RECENT EXECUTION HISTORY
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {historyTasks.map((t) => (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'rgba(15, 23, 42, 0.45)',
                border: '1px solid var(--sol-surface-border-subtle)',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle2 size={16} color="var(--sol-state-success)" />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--sol-text-primary)' }}>
                    {t.title}
                  </div>
                  <div className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
                    AGENT: {t.agentName} // STEPS: {t.stepsCount}
                  </div>
                </div>
              </div>
              <span className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
                {t.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
