import * as THREE from 'three';
import { CoreParameters } from '../engine/CoreParameters';
import { verticalBeamFragmentShader, verticalBeamVertexShader } from '../shaders/coreShaders';

/* ==========================================================================
   SOL VERTICAL ENERGY AXIS LAYER
   Perpendicular quantum plasma beam with upper and lower stratified
   holographic energy discs as seen in Layout.png.
   ========================================================================== */

export class VerticalEnergyAxis {
  public group: THREE.Group;
  private _beamMesh: THREE.Mesh;
  private _beamMaterial: THREE.ShaderMaterial;
  private _topRingsGroup: THREE.Group;
  private _bottomRingsGroup: THREE.Group;
  private _ringMaterials: THREE.MeshBasicMaterial[] = [];

  constructor() {
    this.group = new THREE.Group();

    // 1. Dual Cylinder Quantum Plasma Column (Extending top and bottom)
    const beamGeometry = new THREE.CylinderGeometry(0.08, 0.08, 9.0, 32, 32, true);
    this._beamMaterial = new THREE.ShaderMaterial({
      vertexShader: verticalBeamVertexShader,
      fragmentShader: verticalBeamFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPrimaryColor: { value: new THREE.Color(0x00d4ff) },
        uCoreColor: { value: new THREE.Color(0xf0f9ff) },
        uIntensity: { value: 1.0 },
        uAudioAmp: { value: 0.0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this._beamMesh = new THREE.Mesh(beamGeometry, this._beamMaterial);
    this.group.add(this._beamMesh);

    // 2. Stratified Concentric Holographic Discs (Top and Bottom)
    this._topRingsGroup = new THREE.Group();
    this._topRingsGroup.position.y = 2.8;
    this.group.add(this._topRingsGroup);

    this._bottomRingsGroup = new THREE.Group();
    this._bottomRingsGroup.position.y = -2.8;
    this.group.add(this._bottomRingsGroup);

    const discRadii = [0.45, 0.8, 1.15];
    discRadii.forEach((r, idx) => {
      const topTorusGeo = new THREE.TorusGeometry(r, 0.012, 16, 64);
      const topMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.65 - idx * 0.15,
        blending: THREE.AdditiveBlending,
      });
      const topTorus = new THREE.Mesh(topTorusGeo, topMat);
      topTorus.rotation.x = Math.PI / 2;
      this._topRingsGroup.add(topTorus);
      this._ringMaterials.push(topMat);

      const botTorusGeo = new THREE.TorusGeometry(r, 0.012, 16, 64);
      const botMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.65 - idx * 0.15,
        blending: THREE.AdditiveBlending,
      });
      const botTorus = new THREE.Mesh(botTorusGeo, botMat);
      botTorus.rotation.x = Math.PI / 2;
      this._bottomRingsGroup.add(botTorus);
      this._ringMaterials.push(botMat);
    });
  }

  public update(time: number, delta: number, params: CoreParameters, audioAmp: number): void {
    const intensity = params.verticalBeamIntensity * (1.0 + audioAmp * 0.6);

    // Update plasma column shader
    const u = this._beamMaterial.uniforms;
    u.uTime.value = time;
    u.uPrimaryColor.value.copy(params.primaryColor);
    u.uCoreColor.value.copy(params.coreColor);
    u.uIntensity.value = intensity;
    u.uAudioAmp.value = audioAmp;

    // Beam width modulation
    const widthScale = params.verticalBeamWidth * (0.85 + Math.sin(time * 3.0) * 0.15);
    this._beamMesh.scale.set(widthScale, 1.0, widthScale);

    // Counter-rotation of holographic energy discs
    this._topRingsGroup.rotation.y += delta * 0.4 * params.rotationSpeed;
    this._bottomRingsGroup.rotation.y -= delta * 0.4 * params.rotationSpeed;

    // Discs pulse & opacity
    this._ringMaterials.forEach((mat) => {
      mat.color.lerp(params.primaryColor, 0.05);
      mat.opacity = params.discVisibility * 0.7 * (1.0 + audioAmp * 0.5);
    });
  }

  public dispose(): void {
    this._beamMesh.geometry.dispose();
    this._beamMaterial.dispose();
    this._ringMaterials.forEach((m) => m.dispose());
  }
}
