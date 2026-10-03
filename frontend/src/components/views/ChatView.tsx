import React, { useState } from 'react';
import { useSolStore, solStore } from '../../state/useSolStore';
import { voiceEngine } from '../../voice/VoiceEngine';
import { MessageSquare, Send, Volume2, Sparkles, Terminal } from 'lucide-react';

export const ChatView: React.FC = () => {
  const { contextualMessage, activeTask, connectionState } = useSolStore();
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    solStore.submitCommand(inputText);
    setInputText('');
  };

  const handleSpeak = (text: string) => {
    voiceEngine.speak(text);
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
            <MessageSquare size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--sol-text-primary)' }}>
              SOL Conversational Session
            </h2>
            <p className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
              DIRECT RUNTIME CHANNEL // {connectionState}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="font-mono text-xs"
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.1)',
              color: 'var(--sol-energy-primary)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
            }}
          >
            NATURAL LANGUAGE PIPELINE
          </span>
        </div>
      </div>

      {/* Transcript Log Area */}
      <div
        style={{
          flex: 1,
          minHeight: '360px',
          maxHeight: 'calc(100vh - 280px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '20px',
          background: 'rgba(3, 7, 20, 0.55)',
          border: '1px solid var(--sol-surface-border)',
          borderRadius: '16px',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Welcome / System Frame */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '14px 18px',
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid var(--sol-surface-border-subtle)',
            borderRadius: '12px',
          }}
        >
          <div style={{ color: 'var(--sol-energy-primary)', marginTop: '2px' }}>
            <Sparkles size={16} />
          </div>
          <div>
            <div className="font-mono text-xs" style={{ color: 'var(--sol-energy-primary)', marginBottom: '4px' }}>
              SOL SYSTEM CORE
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--sol-text-secondary)', lineHeight: 1.5 }}>
              SOL Voice & Command session ready. Speak "Hey SOL" or type a command to trigger system actions, launch applications, or request telemetry.
            </div>
          </div>
        </div>

        {/* Contextual Message Display */}
        {contextualMessage && (
          <div
            style={{
              display: 'flex',
              justifyContent: contextualMessage.sender === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '14px 18px',
                borderRadius: '14px',
                background:
                  contextualMessage.sender === 'user'
                    ? 'rgba(0, 212, 255, 0.15)'
                    : 'rgba(15, 23, 42, 0.8)',
                border:
                  contextualMessage.sender === 'user'
                    ? '1px solid rgba(0, 212, 255, 0.35)'
                    : '1px solid var(--sol-surface-border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: '6px',
                }}
              >
                <span className="font-mono text-xs" style={{ color: 'var(--sol-energy-primary)' }}>
                  {contextualMessage.sender.toUpperCase()}
                </span>
                {contextualMessage.sender !== 'user' && (
                  <button
                    onClick={() => handleSpeak(contextualMessage.content)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--sol-text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px',
                    }}
                    title="Speak message"
                  >
                    <Volume2 size={14} />
                  </button>
                )}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--sol-text-primary)', lineHeight: 1.5 }}>
                {contextualMessage.content}
              </div>
            </div>
          </div>
        )}

        {/* Active Task Frame */}
        {activeTask && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '14px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Terminal size={16} color="var(--sol-energy-primary)" />
              <span className="font-mono text-xs" style={{ color: 'var(--sol-energy-primary)', fontWeight: 600 }}>
                ACTIVE EXECUTION // {activeTask.title}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activeTask.steps.map((step) => (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor:
                        step.status === 'completed'
                          ? 'var(--sol-state-success)'
                          : step.status === 'in_progress'
                          ? 'var(--sol-energy-primary)'
                          : step.status === 'failed'
                          ? 'var(--sol-state-error)'
                          : 'var(--sol-text-muted)',
                    }}
                  />
                  <span style={{ color: 'var(--sol-text-secondary)' }}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 12px 8px 18px',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid var(--sol-surface-border)',
          borderRadius: '14px',
          backdropFilter: 'blur(16px)',
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a command or message to SOL..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--sol-text-primary)',
            fontSize: '0.875rem',
            fontFamily: 'var(--sol-font-sans)',
          }}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: inputText.trim() ? 'var(--sol-energy-primary)' : 'rgba(255, 255, 255, 0.05)',
            color: inputText.trim() ? '#030712' : 'var(--sol-text-muted)',
            border: 'none',
            cursor: inputText.trim() ? 'pointer' : 'not-allowed',
            transition: 'all var(--sol-transition-fast)',
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
