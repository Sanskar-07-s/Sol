import React from 'react';
import { CheckCircle2, Circle, Loader2, XCircle, X } from 'lucide-react';
import { TaskProgress } from '../state/types';

interface ActiveTaskCardProps {
  task: TaskProgress | null;
  onDismiss: () => void;
}

export const ActiveTaskCard: React.FC<ActiveTaskCardProps> = ({ task, onDismiss }) => {
  if (!task) return null;

  const isCompleted = task.status === 'completed';
  const isFailed = task.status === 'failed';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(6, 14, 32, 0.88)',
        border: `1px solid ${
          isCompleted
            ? 'rgba(16, 185, 129, 0.3)'
            : isFailed
            ? 'rgba(239, 68, 68, 0.3)'
            : 'var(--sol-surface-border)'
        }`,
        borderRadius: '12px',
        padding: '16px 20px',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        animation: 'fadeInUp 200ms ease-out',
        position: 'relative',
      }}
      role="region"
      aria-label="Active Task Progress"
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="text-caps-subtle"
            style={{
              color: isCompleted
                ? 'var(--sol-state-success)'
                : isFailed
                ? 'var(--sol-state-error)'
                : 'var(--sol-energy-primary)',
              fontWeight: 600,
            }}
          >
            {task.status.toUpperCase()} // {task.agentName}
          </span>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss task panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px',
            color: 'var(--sol-text-muted)',
            borderRadius: '4px',
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Task Title */}
      <h3
        style={{
          fontSize: '0.9375rem',
          fontWeight: 600,
          color: 'var(--sol-text-primary)',
          marginBottom: '12px',
          letterSpacing: '0.01em',
        }}
      >
        {task.title}
      </h3>

      {/* Step Sequence */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {task.steps.map((step, idx) => {
          const isCurrent = idx === task.currentStepIndex && task.status === 'active';
          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.8125rem',
                color:
                  step.status === 'completed'
                    ? 'var(--sol-text-secondary)'
                    : isCurrent
                    ? 'var(--sol-text-primary)'
                    : 'var(--sol-text-muted)',
              }}
            >
              {step.status === 'completed' ? (
                <CheckCircle2 size={14} color="var(--sol-state-success)" />
              ) : step.status === 'failed' ? (
                <XCircle size={14} color="var(--sol-state-error)" />
              ) : isCurrent ? (
                <Loader2
                  size={14}
                  color="var(--sol-energy-primary)"
                  style={{ animation: 'spin 1.5s linear infinite' }}
                />
              ) : (
                <Circle size={14} color="var(--sol-text-muted)" />
              )}
              <span className="font-mono">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
