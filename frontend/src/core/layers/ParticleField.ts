import * as THREE from 'three';
import { CoreParameters } from '../engine/CoreParameters';
import { particleFragmentShader, particleVertexShader } from '../shaders/coreShaders';

/* ==========================================================================
   SOL PARTICLE ACCRETION FIELD LAYER
   2,500+ orbital and accretion particles with Keplerian motion vectors,
   distance attenuation, and energy-reactive color highlights.
   ========================================================================== */

interface ParticleData {
  radius: number;
  theta: number;
  phi: number;
  speed: number;
  radialSpeed: number;
  baseRadius: number;
}

export class ParticleField {
  public group: THREE.Group;
  private _points: THREE.Points;
  private _geometry: THREE.BufferGeometry;
  private _material: THREE.ShaderMaterial;
  private _particleData: ParticleData[] = [];
  private readonly _count = 2500;

  constructor() {
    this.group = new THREE.Group();

    this._geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this._count * 3);
    const colors = new Float32Array(this._count * 3);
    const scales = new Float32Array(this._count);
    const phases = new Float32Array(this._count);

    const cyan = new THREE.Color(0x00d4ff);
    const white = new THREE.Color(0xffffff);
    const amber = new THREE.Color(0xf59e0b);
    const violet = new THREE.Color(0x818cf8);

    for (let i = 0; i < this._count; i++) {
      // Stratified radius distribution (high density near core, fading outwards)
      const u = Math.random();
      const r = 0.9 + Math.pow(u, 2.0) * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.85;

      const x = r * Math.cos(phi) * Math.cos(theta);
      const y = r * Math.sin(phi);
      const z = r * Math.cos(phi) * Math.sin(theta);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Varied chromatic distribution matching Layout.png
      const colorChoice = Math.random();
      const particleColor = new THREE.Color();
      if (colorChoice < 0.6) {
        particleColor.copy(cyan);
      } else if (colorChoice < 0.8) {
        particleColor.copy(white);
      } else if (colorChoice < 0.92) {
        particleColor.copy(amber); // Warm energy sparks
      } else {
        particleColor.copy(violet);
      }

      colors[i * 3] = particleColor.r;
      colors[i * 3 + 1] = particleColor.g;
      colors[i * 3 + 2] = particleColor.b;

      scales[i] = 0.5 + Math.random() * 1.5;
      phases[i] = Math.random() * Math.PI * 2;

      this._particleData.push({
        radius: r,
        baseRadius: r,
        theta,
        phi,
        speed: (0.4 + Math.random() * 1.2) * (Math.random() > 0.4 ? 1 : -1),
        radialSpeed: (Math.random() - 0.5) * 0.05,
      });
    }

    this._geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this._geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    this._geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    this._geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    this._material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uSizeMultiplier: { value: 1.0 },
        uEmission: { value: 1.0 },
        uAudioAmp: { value: 0.0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this._points = new THREE.Points(this._geometry, this._material);
    this.group.add(this._points);
  }

  public update(time: number, delta: number, params: CoreParameters, audioAmp: number): void {
    const positions = this._geometry.attributes.position.array as Float32Array;
    const vMult = params.particleVelocity * (1.0 + audioAmp * 0.8);
    const expansion = params.orbitalExpansion;

    for (let i = 0; i < this._count; i++) {
      const p = this._particleData[i];

      // Keplerian orbital motion
      p.theta += delta * p.speed * 0.8 * vMult;
      
      // Accretion / Burst radial dynamics
      p.radius += delta * params.particleAccretionRate * 1.2;
      if (p.radius < 0.6) p.radius = 4.2;
      if (p.radius > 4.5) p.radius = 0.7;

      const r = p.radius * expansion;
      const x = r * Math.cos(p.phi) * Math.cos(p.theta);
      const y = r * Math.sin(p.phi);
      const z = r * Math.cos(p.phi) * Math.sin(p.theta);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    this._geometry.attributes.position.needsUpdate = true;

    // Uniforms
    const u = this._material.uniforms;
    u.uTime.value = time;
    u.uSizeMultiplier.value = params.particleBrightness;
    u.uEmission.value = params.emissionIntensity * (1.0 + audioAmp * 0.7);
    u.uAudioAmp.value = audioAmp;
  }

  public dispose(): void {
    this._geometry.dispose();
    this._material.dispose();
  }
}
