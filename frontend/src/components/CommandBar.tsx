import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Mic, ArrowUpRight } from 'lucide-react';

interface CommandBarProps {
  onSubmit: (commandText: string) => void;
  isListening: boolean;
  onToggleMic: () => void;
  disabled?: boolean;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  onSubmit,
  isListening,
  onToggleMic,
  disabled = false,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey: '/' to focus command input, 'Escape' to blur/clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setInputVal('');
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || disabled) return;
    onSubmit(inputVal);
    setInputVal('');
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '720px',
        margin: '0 auto',
        padding: '0 20px',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: isFocused
            ? 'rgba(8, 18, 38, 0.92)'
            : 'rgba(5, 11, 25, 0.75)',
          border: isFocused
            ? '1px solid var(--sol-energy-primary)'
            : '1px solid var(--sol-surface-border)',
          borderRadius: '14px',
          padding: '10px 16px',
          boxShadow: isFocused ? 'var(--sol-glow-subtle)' : 'none',
          transition: 'all var(--sol-transition-normal)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Terminal glyph */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            color: isFocused ? 'var(--sol-energy-primary)' : 'var(--sol-text-muted)',
            transition: 'color var(--sol-transition-fast)',
          }}
          aria-hidden="true"
        >
          <Terminal size={18} />
        </div>

        {/* Operational Command Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder="Direct instruction or query... (Press / to focus)"
          aria-label="Direct operational command"
          style={{
            flex: 1,
            fontSize: '0.9375rem',
            color: 'var(--sol-text-primary)',
            background: 'transparent',
            letterSpacing: '0.01em',
          }}
        />

        {/* Microphone Voice Trigger Placeholder */}
        <button
          type="button"
          onClick={onToggleMic}
          aria-label={isListening ? 'Deactivate voice stream' : 'Activate voice stream'}
          title={isListening ? 'Deactivate voice stream' : 'Activate voice stream (Mic placeholder)'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: isListening ? 'var(--sol-energy-muted)' : 'rgba(255, 255, 255, 0.04)',
            border: isListening
              ? '1px solid var(--sol-energy-primary)'
              : '1px solid var(--sol-surface-border-subtle)',
            color: isListening ? 'var(--sol-energy-primary)' : 'var(--sol-text-secondary)',
          }}
        >
          <Mic size={16} />
        </button>

        {/* Submit Execution Action */}
        <button
          type="submit"
          disabled={!inputVal.trim() || disabled}
          aria-label="Submit command"
          title="Dispatch command to SOL"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: inputVal.trim()
              ? 'var(--sol-energy-secondary)'
              : 'rgba(255, 255, 255, 0.04)',
            color: inputVal.trim() ? '#ffffff' : 'var(--sol-text-muted)',
            transition: 'all var(--sol-transition-fast)',
          }}
        >
          <ArrowUpRight size={16} />
        </button>
      </form>
    </div>
  );
};
