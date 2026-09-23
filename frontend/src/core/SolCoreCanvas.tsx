import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SolState } from '../state/types';
import { solStore } from '../state/useSolStore';

interface SolCoreCanvasProps {
  solState: SolState;
}

/**
 * State to color/speed mapping for the structural baseline placeholder.
 * (This is the pipeline validation mesh before Phase 2 custom GLSL shaders).
 */
function getStateVisuals(state: SolState): { color: number; speedMultiplier: number; scale: number } {
  switch (state) {
    case 'STANDBY':
      return { color: 0x334155, speedMultiplier: 0.2, scale: 0.85 };
    case 'IDLE':
      return { color: 0x38bdf8, speedMultiplier: 1.0, scale: 1.0 };
    case 'LISTENING':
      return { color: 0x00f0ff, speedMultiplier: 1.8, scale: 1.15 };
    case 'UNDERSTANDING':
      return { color: 0x60a5fa, speedMultiplier: 2.2, scale: 1.05 };
    case 'THINKING':
      return { color: 0x3b82f6, speedMultiplier: 3.0, scale: 1.1 };
    case 'PLANNING':
      return { color: 0x0284c7, speedMultiplier: 1.5, scale: 1.08 };
    case 'EXECUTING':
      return { color: 0x00d4ff, speedMultiplier: 2.5, scale: 1.12 };
    case 'SPEAKING':
      return { color: 0x38bdf8, speedMultiplier: 2.0, scale: 1.2 };
    case 'SUCCESS':
      return { color: 0x10b981, speedMultiplier: 1.4, scale: 1.25 };
    case 'WARNING':
      return { color: 0xf59e0b, speedMultiplier: 1.2, scale: 1.0 };
    case 'ERROR':
      return { color: 0xef4444, speedMultiplier: 0.5, scale: 0.95 };
    case 'OFFLINE':
      return { color: 0x1e293b, speedMultiplier: 0.0, scale: 0.8 };
    default:
      return { color: 0x38bdf8, speedMultiplier: 1.0, scale: 1.0 };
  }
}

export const SolCoreCanvas: React.FC<SolCoreCanvasProps> = ({ solState }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pointer position tracking for subtle parallax
  const pointerRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  const stateRef = useRef<SolState>(solState);
  useEffect(() => {
    stateRef.current = solState;
  }, [solState]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 5;

    // 2. WebGL Renderer with devicePixelRatio clamping
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // 3. Pipeline Validation Geometry (Architectural Placeholder)
    // A nested dual-torus gyroscopic ring and inner icosahedron frame
    const group = new THREE.Group();
    scene.add(group);

    // Inner geometric lattice core
    const innerGeometry = new THREE.IcosahedronGeometry(0.7, 1);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    group.add(innerMesh);

    // Outer gyroscopic ring 1
    const ring1Geometry = new THREE.TorusGeometry(1.2, 0.015, 16, 100);
    const ring1Material = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.5,
    });
    const ring1Mesh = new THREE.Mesh(ring1Geometry, ring1Material);
    group.add(ring1Mesh);

    // Outer gyroscopic ring 2
    const ring2Geometry = new THREE.TorusGeometry(1.5, 0.012, 16, 100);
    const ring2Material = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.35,
    });
    const ring2Mesh = new THREE.Mesh(ring2Geometry, ring2Material);
    ring2Mesh.rotation.x = Math.PI / 3;
    group.add(ring2Mesh);

    // Subtle axial indicator particles validating vertical jet axis
    const jetPointsGeometry = new THREE.BufferGeometry();
    const jetPositions = new Float32Array([
      0, 1.8, 0,
      0, 2.2, 0,
      0, 2.6, 0,
      0, -1.8, 0,
      0, -2.2, 0,
      0, -2.6, 0,
    ]);
    jetPointsGeometry.setAttribute('position', new THREE.BufferAttribute(jetPositions, 3));
    const jetMaterial = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
    });
    const jetPoints = new THREE.Points(jetPointsGeometry, jetMaterial);
    group.add(jetPoints);

    // 4. Resize Handling via ResizeObserver
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    handleResize();

    // 5. Mouse Interaction for Parallax Dampening
    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      pointerRef.current.targetX = Math.max(-1, Math.min(1, x));
      pointerRef.current.targetY = Math.max(-1, Math.min(1, y));
    };

    window.addEventListener('pointermove', handlePointerMove);

    // 6. Animation Loop & Performance (FPS) Tracking
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      // FPS Measurement
      frameCount++;
      if (currentTime - lastFpsUpdate >= 1000) {
        const measuredFps = Math.round((frameCount * 1000) / (currentTime - lastFpsUpdate));
        solStore.updateFpsMetric(measuredFps);
        frameCount = 0;
        lastFpsUpdate = currentTime;
      }

      const delta = (currentTime - lastTime) * 0.001;
      lastTime = currentTime;

      const currentState = stateRef.current;
      const visuals = getStateVisuals(currentState);

      // Smooth color transitions
      const targetColor = new THREE.Color(visuals.color);
      innerMaterial.color.lerp(targetColor, 0.08);
      ring1Material.color.lerp(targetColor, 0.08);

      // Smooth pointer parallax easing
      const p = pointerRef.current;
      p.x += (p.targetX - p.x) * 0.05;
      p.y += (p.targetY - p.y) * 0.05;

      // Group orientation with subtle parallax tilt
      group.rotation.y = p.x * 0.35;
      group.rotation.x = -p.y * 0.25;

      // Breathing / State dynamics
      const breath = Math.sin(currentTime * 0.002 * visuals.speedMultiplier) * 0.05;
      const currentScale = visuals.scale + breath;
      group.scale.set(currentScale, currentScale, currentScale);

      // Rotations
      innerMesh.rotation.y += delta * 0.8 * visuals.speedMultiplier;
      innerMesh.rotation.x += delta * 0.4 * visuals.speedMultiplier;
      ring1Mesh.rotation.z += delta * 0.5 * visuals.speedMultiplier;
      ring2Mesh.rotation.y -= delta * 0.6 * visuals.speedMultiplier;

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // 7. Thorough Lifecycle Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      resizeObserver.disconnect();

      innerGeometry.dispose();
      innerMaterial.dispose();
      ring1Geometry.dispose();
      ring1Material.dispose();
      ring2Geometry.dispose();
      ring2Material.dispose();
      jetPointsGeometry.dispose();
      jetMaterial.dispose();
      renderer.dispose();
    };
  }, []);

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
      }}
      aria-label={`SOL Core Container — Current State: ${solState}`}
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
      {/* State label anchored beneath the core boundary */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          pointerEvents: 'none',
        }}
      >
        <div
          className="text-caps-subtle"
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.2em',
            color: 'var(--sol-text-secondary)',
            opacity: 0.8,
          }}
        >
          CORE STATUS
        </div>
        <div
          style={{
            fontFamily: 'var(--sol-font-mono)',
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '0.15em',
            color:
              solState === 'WARNING'
                ? 'var(--sol-state-warning)'
                : solState === 'ERROR'
                ? 'var(--sol-state-error)'
                : solState === 'SUCCESS'
                ? 'var(--sol-state-success)'
                : 'var(--sol-energy-primary)',
          }}
        >
          {solState}
        </div>
      </div>
    </div>
  );
};
