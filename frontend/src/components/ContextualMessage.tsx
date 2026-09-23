import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { ContextualMessage as IContextualMessage } from '../state/types';

interface ContextualMessageProps {
  message: IContextualMessage | null;
  onDismiss: () => void;
}

export const ContextualMessage: React.FC<ContextualMessageProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div
      style={{
        maxWidth: '560px',
        margin: '0 auto',
        background: 'rgba(6, 12, 28, 0.75)',
        border: '1px solid var(--sol-surface-border)',
        borderRadius: '12px',
        padding: '12px 18px',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
        position: 'relative',
        animation: 'fadeIn 250ms ease-out',
      }}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          marginTop: '2px',
          color: 'var(--sol-energy-primary)',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <Sparkles size={16} />
      </div>

      <div style={{ flex: 1 }}>
        <div
          className="text-caps-subtle"
          style={{ fontSize: '0.625rem', marginBottom: '2px', color: 'var(--sol-text-muted)' }}
        >
          {message.sender.toUpperCase()} TRANSMISSION
        </div>
        <p
          style={{
            fontSize: '0.875rem',
            lineHeight: '1.4',
            color: 'var(--sol-text-primary)',
          }}
        >
          {message.content}
        </p>
      </div>

      <button
        onClick={onDismiss}
        aria-label="Dismiss transmission"
        style={{
          color: 'var(--sol-text-muted)',
          padding: '2px',
          borderRadius: '4px',
          marginTop: '2px',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};
