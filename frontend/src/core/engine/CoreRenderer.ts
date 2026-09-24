import * as THREE from 'three';
import { SolState } from '../../state/types';
import { audioReactiveService } from '../audio/AudioReactiveService';
import { PointerInteraction } from '../interaction/PointerInteraction';
import { AtomicOrbitalRings } from '../layers/AtomicOrbitalRings';
import { NebulaVolume } from '../layers/NebulaVolume';
import { ParticleField } from '../layers/ParticleField';
import { PedestalEmitter } from '../layers/PedestalEmitter';
import { PlasmaFilaments } from '../layers/PlasmaFilaments';
import { SingularityCore } from '../layers/SingularityCore';
import { VerticalEnergyAxis } from '../layers/VerticalEnergyAxis';
import { CoreParameters, createDefaultCoreParameters } from './CoreParameters';
import { STATE_PROFILES, interpolateCoreParameters } from './CoreStateProfiles';

/* ==========================================================================
   SOL CORE RENDERER ENGINE
   Orchestrates the modular WebGL scene, lighting, layers, audio reactivity,
   pointer parallax, state parameter interpolation, and performance metrics.
   ========================================================================== */

export interface RenderPerformanceMetrics {
  fps: number;
  frameTimeMs: number;
  particleCount: number;
  dpr: number;
}

export class CoreRenderer {
  private _container: HTMLElement;
  private _canvas: HTMLCanvasElement;

  private _scene: THREE.Scene;
  private _camera: THREE.PerspectiveCamera;
  private _renderer: THREE.WebGLRenderer;
  private _coreGroup: THREE.Group;

  // Scene Lighting
  private _ambientLight: THREE.AmbientLight;
  private _corePointLight: THREE.PointLight;

  // Layers
  private _nebula: NebulaVolume;
  private _pedestal: PedestalEmitter;
  private _verticalAxis: VerticalEnergyAxis;
  private _particles: ParticleField;
  private _filaments: PlasmaFilaments;
  private _orbitalRings: AtomicOrbitalRings;
  private _singularity: SingularityCore;

  // Interactions & State
  private _pointer: PointerInteraction;
  private _currentParams: CoreParameters;
  private _targetState: SolState = 'IDLE';

  // Animation Loop & Performance Tracking
  private _animationFrameId: number | null = null;
  private _lastTime = 0;
  private _frameCount = 0;
  private _lastFpsTime = 0;
  private _metrics: RenderPerformanceMetrics = {
    fps: 60,
    frameTimeMs: 16.6,
    particleCount: 2500,
    dpr: 1,
  };
  private _onMetricsCallback?: (m: RenderPerformanceMetrics) => void;

  private _resizeObserver: ResizeObserver;
  private _prefersReducedMotion = false;

  constructor(
    container: HTMLElement,
    canvas: HTMLCanvasElement,
    initialState: SolState = 'IDLE',
    onMetrics?: (m: RenderPerformanceMetrics) => void
  ) {
    this._container = container;
    this._canvas = canvas;
    this._targetState = initialState;
    this._onMetricsCallback = onMetrics;
    this._currentParams = createDefaultCoreParameters();

    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia) {
      this._prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // 1. Scene & Camera
    this._scene = new THREE.Scene();
    this._camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    this._camera.position.set(0, 0, 7.2);

    // 2. WebGL Renderer with DPR Clamping
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this._metrics.dpr = dpr;

    this._renderer = new THREE.WebGLRenderer({
      canvas: this._canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this._renderer.setClearColor(0x02040a, 1.0);
    this._renderer.setPixelRatio(dpr);

    // 3. Central Core Group for Global Parallax & Tilts
    this._coreGroup = new THREE.Group();
    this._scene.add(this._coreGroup);

    // 4. Lighting
    this._ambientLight = new THREE.AmbientLight(0x0a1630, 1.2);
    this._scene.add(this._ambientLight);

    this._corePointLight = new THREE.PointLight(0x00d4ff, 3.0, 12, 1.5);
    this._coreGroup.add(this._corePointLight);

    // 5. Instantiate Modular Layers
    this._nebula = new NebulaVolume();
    this._scene.add(this._nebula.mesh);

    this._pedestal = new PedestalEmitter();
    this._coreGroup.add(this._pedestal.group);

    this._verticalAxis = new VerticalEnergyAxis();
    this._coreGroup.add(this._verticalAxis.group);

    this._particles = new ParticleField();
    this._coreGroup.add(this._particles.group);

    this._filaments = new PlasmaFilaments();
    this._coreGroup.add(this._filaments.group);

    this._orbitalRings = new AtomicOrbitalRings();
    this._coreGroup.add(this._orbitalRings.group);

    this._singularity = new SingularityCore();
    this._coreGroup.add(this._singularity.group);

    // 6. Pointer Interaction Plumbing
    this._pointer = new PointerInteraction();
    this._pointer.attach(this._container);

    // 7. Resize Observer
    this._resizeObserver = new ResizeObserver(() => this.handleResize());
    this._resizeObserver.observe(this._container);
    this.handleResize();

    // 8. Start Loop
    this._lastTime = performance.now();
    this._lastFpsTime = this._lastTime;
    this._animate = this._animate.bind(this);
    this._animationFrameId = requestAnimationFrame(this._animate);
  }

  public setState(nextState: SolState): void {
    this._targetState = nextState;
  }

  public handleResize(): void {
    const width = this._container.clientWidth;
    const height = this._container.clientHeight;
    if (width === 0 || height === 0) return;

    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(width, height, false);
  }

  private _animate(currentTime: number): void {
    this._animationFrameId = requestAnimationFrame(this._animate);

    const delta = Math.min((currentTime - this._lastTime) * 0.001, 0.1);
    this._lastTime = currentTime;

    // Performance tracking
    this._frameCount++;
    if (currentTime - this._lastFpsTime >= 1000) {
      const elapsed = currentTime - this._lastFpsTime;
      this._metrics.fps = Math.round((this._frameCount * 1000) / elapsed);
      this._metrics.frameTimeMs = Number((elapsed / this._frameCount).toFixed(1));
      this._frameCount = 0;
      this._lastFpsTime = currentTime;
      if (this._onMetricsCallback) {
        this._onMetricsCallback(this._metrics);
      }
    }

    // 1. Interpolate parameters toward target state profile
    const targetProfile = STATE_PROFILES[this._targetState] || STATE_PROFILES.IDLE;
    const interpSpeed = this._prefersReducedMotion ? 2.0 : 4.5;
    interpolateCoreParameters(this._currentParams, targetProfile, delta, interpSpeed);

    // 2. Sample Audio Reactivity
    const audioMetrics = audioReactiveService.getMetrics(delta);
    const audioAmp = this._targetState === 'LISTENING' || this._targetState === 'SPEAKING'
      ? audioMetrics.amplitude
      : 0;

    // 3. Update Pointer Parallax
    const pState = this._pointer.update(delta);
    const parallaxDamp = this._prefersReducedMotion ? 0.05 : 0.28;
    this._coreGroup.rotation.y = pState.normalizedX * parallaxDamp;
    this._coreGroup.rotation.x = -pState.normalizedY * (parallaxDamp * 0.7);

    // Update point light color & intensity
    this._corePointLight.color.copy(this._currentParams.primaryColor);
    this._corePointLight.intensity = this._currentParams.emissionIntensity * 2.8 * (1.0 + audioAmp * 0.8);

    const timeSec = currentTime * 0.001 * (this._prefersReducedMotion ? 0.4 : 1.0);

    // 4. Update Each Modular Layer
    this._nebula.update(timeSec, pState.normalizedX, pState.normalizedY, this._currentParams);
    this._singularity.update(timeSec, delta, this._currentParams, audioAmp);
    this._orbitalRings.update(timeSec, delta, this._currentParams, audioAmp);
    this._filaments.update(timeSec, delta, this._currentParams, audioAmp);
    this._particles.update(timeSec, delta, this._currentParams, audioAmp);
    this._verticalAxis.update(timeSec, delta, this._currentParams, audioAmp);
    this._pedestal.update(timeSec, delta, this._currentParams, audioAmp);

    // Render Scene
    this._renderer.render(this._scene, this._camera);
  }

  public dispose(): void {
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }

    this._resizeObserver.disconnect();
    this._pointer.detach();

    this._singularity.dispose();
    this._orbitalRings.dispose();
    this._filaments.dispose();
    this._particles.dispose();
    this._verticalAxis.dispose();
    this._pedestal.dispose();
    this._nebula.dispose();

    this._renderer.dispose();
  }
}
