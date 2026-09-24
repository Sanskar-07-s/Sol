import * as THREE from 'three';
import { CoreParameters } from '../engine/CoreParameters';

/* ==========================================================================
   SOL CYBERNETIC PEDESTAL EMITTER LAYER
   Concentric circular emitter platform with glowing channel notches
   at the base of the vertical quantum plasma column (as seen in Layout.png).
   ========================================================================== */

export class PedestalEmitter {
  public group: THREE.Group;
  private _ringMaterials: THREE.MeshBasicMaterial[] = [];
  private _notchMaterials: THREE.MeshBasicMaterial[] = [];
  private _basePlateMesh: THREE.Mesh;
  private _basePlateMat: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.position.y = -3.15; // Positioned directly at the lower base

    // 1. Subtle dark metallic disc platform
    const basePlateGeo = new THREE.CylinderGeometry(2.4, 2.5, 0.12, 48);
    this._basePlateMat = new THREE.MeshStandardMaterial({
      color: 0x050c1e,
      roughness: 0.4,
      metalness: 0.8,
    });
    this._basePlateMesh = new THREE.Mesh(basePlateGeo, this._basePlateMat);
    this.group.add(this._basePlateMesh);

    // 2. Concentric glowing emitter rings
    const ringRadii = [0.6, 1.1, 1.6, 2.1];
    ringRadii.forEach((r, idx) => {
      const ringGeo = new THREE.TorusGeometry(r, 0.015, 12, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.75 - idx * 0.12,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.07;
      this.group.add(ring);
      this._ringMaterials.push(ringMat);
    });

    // 3. Radial glowing LED notches along outer emitter perimeter
    const notchCount = 16;
    const notchGeo = new THREE.BoxGeometry(0.12, 0.03, 0.02);
    for (let i = 0; i < notchCount; i++) {
      const angle = (i / notchCount) * Math.PI * 2;
      const notchMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const notch = new THREE.Mesh(notchGeo, notchMat);
      notch.position.set(Math.cos(angle) * 1.85, 0.07, Math.sin(angle) * 1.85);
      notch.rotation.y = -angle;
      this.group.add(notch);
      this._notchMaterials.push(notchMat);
    }
  }

  public update(time: number, delta: number, params: CoreParameters, audioAmp: number): void {
    // Subtle rotation of notch pulses
    this.group.rotation.y += delta * 0.1 * params.rotationSpeed;

    const glow = params.pedestalGlow * (0.8 + audioAmp * 0.6);

    this._ringMaterials.forEach((mat, idx) => {
      mat.color.lerp(params.primaryColor, 0.05);
      const pulse = Math.sin(time * 2.0 + idx * 0.7) * 0.15;
      mat.opacity = Math.max(0.1, (glow + pulse) * (0.8 - idx * 0.12));
    });

    this._notchMaterials.forEach((mat, idx) => {
      mat.color.lerp(params.primaryColor, 0.05);
      const wave = Math.sin(time * 4.0 + idx * 0.4) * 0.3;
      mat.opacity = Math.max(0.2, (glow + wave) * 0.9);
    });
  }

  public dispose(): void {
    this._basePlateMesh.geometry.dispose();
    this._basePlateMat.dispose();
    this._ringMaterials.forEach((m) => m.dispose());
    this._notchMaterials.forEach((m) => m.dispose());
  }
}
