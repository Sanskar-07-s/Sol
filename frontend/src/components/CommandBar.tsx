import React, { useState, useRef, useEffect } from 'react';
import { Keyboard, Mic, Send } from 'lucide-react';

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
        maxWidth: '560px',
        margin: '0 auto',
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
            ? 'rgba(6, 18, 44, 0.88)'
            : 'rgba(5, 12, 28, 0.72)',
          border: isFocused
            ? '1px solid var(--sol-energy-primary)'
            : '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '32px',
          padding: '8px 14px 8px 18px',
          boxShadow: isFocused ? 'var(--sol-glow-active)' : '0 8px 32px rgba(0, 0, 0, 0.5)',
          transition: 'all var(--sol-transition-normal)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Keyboard glyph as seen in Layout.png */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            color: isFocused ? 'var(--sol-energy-primary)' : 'var(--sol-text-muted)',
            transition: 'color var(--sol-transition-fast)',
          }}
          aria-hidden="true"
        >
          <Keyboard size={18} />
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
          placeholder="Ask SOL anything..."
          aria-label="Ask SOL anything"
          style={{
            flex: 1,
            fontSize: '0.9375rem',
            color: 'var(--sol-text-primary)',
            background: 'transparent',
            letterSpacing: '0.01em',
          }}
        />

        {/* Microphone Voice Trigger (Circular glowing button matching Layout.png) */}
        <button
          type="button"
          onClick={onToggleMic}
          aria-label={isListening ? 'Deactivate microphone' : 'Activate live microphone stream'}
          title={isListening ? 'Microphone Active — Click to Stop' : 'Activate Live Microphone (Web Audio API)'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: isListening
              ? 'var(--sol-energy-primary)'
              : 'rgba(0, 212, 255, 0.12)',
            border: isListening
              ? '1px solid #ffffff'
              : '1px solid rgba(0, 212, 255, 0.3)',
            color: isListening ? '#02040a' : 'var(--sol-energy-primary)',
            boxShadow: isListening ? '0 0 16px var(--sol-energy-primary)' : 'none',
            transition: 'all var(--sol-transition-fast)',
          }}
        >
          <Mic size={17} />
        </button>

        {/* Submit Execution Action (Arrow icon matching Layout.png) */}
        <button
          type="submit"
          disabled={!inputVal.trim() || disabled}
          aria-label="Submit command"
          title="Dispatch command to SOL"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: inputVal.trim()
              ? 'rgba(0, 212, 255, 0.25)'
              : 'transparent',
            color: inputVal.trim() ? 'var(--sol-energy-primary)' : 'var(--sol-text-muted)',
            transition: 'all var(--sol-transition-fast)',
          }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};
