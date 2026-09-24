import React, { useEffect, useRef } from 'react';
import { SolState } from '../state/types';
import { solStore } from '../state/useSolStore';
import { CoreRenderer } from './engine/CoreRenderer';

interface SolCoreCanvasProps {
  solState: SolState;
}

export const SolCoreCanvas: React.FC<SolCoreCanvasProps> = ({ solState }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CoreRenderer | null>(null);

  // Initialize CoreRenderer
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderer = new CoreRenderer(container, canvas, solState, (metrics) => {
      solStore.updateFpsMetric(metrics.fps);
    });

    rendererRef.current = renderer;

    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  // Update state whenever solState changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setState(solState);
    }
  }, [solState]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      aria-label={`Living SOL Core — Current State: ${solState}`}
      role="img"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          outline: 'none',
        }}
      />
    </div>
  );
};
