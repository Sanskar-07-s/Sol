import * as THREE from 'three';
import { CoreParameters } from '../engine/CoreParameters';
import { singularityFragmentShader, singularityVertexShader } from '../shaders/coreShaders';

/* ==========================================================================
   SOL SINGULARITY CORE LAYER
   The intense, white-hot computational heart with procedural turbulence,
   multi-frequency breathing, and audio-reactive amplitude modulation.
   ========================================================================== */

export class SingularityCore {
  public group: THREE.Group;
  private _mesh: THREE.Mesh;
  private _material: THREE.ShaderMaterial;
  private _glowMesh: THREE.Mesh;
  private _glowMaterial: THREE.MeshBasicMaterial;

  constructor() {
    this.group = new THREE.Group();

    // 1. High-density icosphere for procedural vertex displacement
    const geometry = new THREE.IcosahedronGeometry(0.72, 6);

    this._material = new THREE.ShaderMaterial({
      vertexShader: singularityVertexShader,
      fragmentShader: singularityFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uTurbulence: { value: 1.0 },
        uPulse: { value: 0 },
        uPrimaryColor: { value: new THREE.Color(0x00d4ff) },
        uSecondaryColor: { value: new THREE.Color(0x1e40af) },
        uCoreColor: { value: new THREE.Color(0xf0f9ff) },
        uEmission: { value: 1.0 },
        uAudioAmp: { value: 0.0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this._mesh = new THREE.Mesh(geometry, this._material);
    this.group.add(this._mesh);

    // 2. Soft outer halo sprite shell for atmospheric luminosity
    const glowGeo = new THREE.SphereGeometry(1.05, 32, 32);
    this._glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this._glowMesh = new THREE.Mesh(glowGeo, this._glowMaterial);
    this.group.add(this._glowMesh);
  }

  public update(time: number, delta: number, params: CoreParameters, audioAmp: number): void {
    // Multi-frequency organic breathing pulse
    const p1 = Math.sin(time * 2.2 * params.nucleusPulseFrequency) * 0.4;
    const p2 = Math.sin(time * 4.1 * params.nucleusPulseFrequency) * 0.25;
    const p3 = Math.sin(time * 0.8) * 0.35;
    const combinedPulse = (p1 + p2 + p3) * (0.6 + audioAmp * 1.2);

    // Update shader uniforms
    const u = this._material.uniforms;
    u.uTime.value = time * params.nucleusNoiseSpeed;
    u.uTurbulence.value = params.turbulence;
    u.uPulse.value = combinedPulse;
    u.uPrimaryColor.value.copy(params.primaryColor);
    u.uSecondaryColor.value.copy(params.secondaryColor);
    u.uCoreColor.value.copy(params.coreColor);
    u.uEmission.value = params.emissionIntensity * (1.0 + audioAmp * 0.5);
    u.uAudioAmp.value = audioAmp;

    // Outer halo tracking
    this._glowMaterial.color.copy(params.primaryColor);
    this._glowMaterial.opacity = 0.2 * params.emissionIntensity * (1.0 + audioAmp * 0.8);

    // Dynamic scale
    const targetScale = params.coreScale * (1.0 + combinedPulse * 0.06);
    this.group.scale.set(targetScale, targetScale, targetScale);

    // Slow internal axial drift
    this._mesh.rotation.y += delta * 0.2 * params.rotationSpeed;
    this._mesh.rotation.x += delta * 0.1 * params.rotationSpeed;
  }

  public dispose(): void {
    this._mesh.geometry.dispose();
    this._material.dispose();
    this._glowMesh.geometry.dispose();
    this._glowMaterial.dispose();
  }
}
