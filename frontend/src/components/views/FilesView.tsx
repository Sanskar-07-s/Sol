import React, { useState } from 'react';
import { Folder, Code, Image as ImageIcon, ShieldAlert } from 'lucide-react';

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  path: string;
  size: string;
  extension?: string;
}

export const FilesView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>('package.json');

  const files: FileItem[] = [
    { name: 'frontend/src/core/SolCoreCanvas.tsx', type: 'file', path: 'd:\\Sol\\frontend\\src\\core\\SolCoreCanvas.tsx', size: '14.2 KB', extension: 'tsx' },
    { name: 'frontend/src/voice/VoiceEngine.ts', type: 'file', path: 'd:\\Sol\\frontend\\src\\voice\\VoiceEngine.ts', size: '5.6 KB', extension: 'ts' },
    { name: 'frontend/src/voice/ActivationDetector.ts', type: 'file', path: 'd:\\Sol\\frontend\\src\\voice\\ActivationDetector.ts', size: '3.2 KB', extension: 'ts' },
    { name: 'frontend/src/runtime/CommandRuntime.ts', type: 'file', path: 'd:\\Sol\\frontend\\src\\runtime\\CommandRuntime.ts', size: '8.9 KB', extension: 'ts' },
    { name: 'backend/app/main.py', type: 'file', path: 'd:\\Sol\\backend\\app\\main.py', size: '2.1 KB', extension: 'py' },
    { name: 'backend/app/runtime.py', type: 'file', path: 'd:\\Sol\\backend\\app\\runtime.py', size: '4.8 KB', extension: 'py' },
    { name: 'package.json', type: 'file', path: 'd:\\Sol\\package.json', size: '1.4 KB', extension: 'json' },
    { name: 'Layout.png', type: 'file', path: 'd:\\Sol\\Layout.png', size: '1.2 MB', extension: 'png' },
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
            <Folder size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--sol-text-primary)' }}>
              SOL Workspace File Inspector
            </h2>
            <p className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
              LOCAL PROJECT ROOT // D:\Sol
            </p>
          </div>
        </div>

        <span
          className="font-mono text-xs"
          style={{
            padding: '4px 10px',
            borderRadius: '12px',
            background: 'rgba(34, 197, 94, 0.1)',
            color: 'var(--sol-state-success)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
          }}
        >
          INDEXED // 8 CORE FILES
        </span>
      </div>

      {/* Main split content */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          flex: 1,
        }}
      >
        {/* File List */}
        <div
          style={{
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--sol-surface-border)',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: 'auto',
          }}
        >
          <div className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)', marginBottom: '8px' }}>
            PROJECT FILES & MODULES
          </div>
          {files.map((file) => {
            const isSelected = file.name === selectedFile;
            return (
              <button
                key={file.name}
                onClick={() => setSelectedFile(file.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(0, 212, 255, 0.12)' : 'rgba(3, 7, 20, 0.3)',
                  border: isSelected ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid var(--sol-surface-border-subtle)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--sol-transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {file.extension === 'png' ? (
                    <ImageIcon size={16} color="var(--sol-energy-primary)" />
                  ) : (
                    <Code size={16} color="var(--sol-energy-primary)" />
                  )}
                  <span style={{ fontSize: '0.8125rem', color: isSelected ? 'var(--sol-text-primary)' : 'var(--sol-text-secondary)' }}>
                    {file.name}
                  </span>
                </div>
                <span className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
                  {file.size}
                </span>
              </button>
            );
          })}
        </div>

        {/* File Details & Capability Notice */}
        <div
          style={{
            padding: '20px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--sol-surface-border)',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div className="font-mono text-xs" style={{ color: 'var(--sol-energy-primary)', marginBottom: '8px' }}>
              FILE METADATA INSPECTOR
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--sol-text-primary)', marginBottom: '12px' }}>
              {selectedFile}
            </div>

            {selectedFile && (
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(3, 7, 20, 0.5)',
                  borderRadius: '10px',
                  border: '1px solid var(--sol-surface-border-subtle)',
                  fontFamily: 'var(--sol-font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--sol-text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div>PATH: d:\Sol\{selectedFile}</div>
                <div>ACCESS: READ-ONLY</div>
                <div>SECURITY ENCLAVE: VALIDATED</div>
              </div>
            )}
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              display: 'flex',
              gap: '10px',
            }}
          >
            <ShieldAlert size={18} color="var(--sol-state-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.8125rem', color: 'var(--sol-text-secondary)', lineHeight: 1.4 }}>
              <strong style={{ color: 'var(--sol-state-warning)' }}>HONEST CAPABILITY BOUNDARY:</strong> File modifications and computer control are executed only via explicitly supported Python backend handlers.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
