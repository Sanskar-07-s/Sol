import * as THREE from 'three';
import { CoreParameters } from '../engine/CoreParameters';

/* ==========================================================================
   SOL PLASMA FILAMENTS LAYER
   Flowing procedural magnetic flux curves that twist around the nucleus,
   pulse with turbulent energy, and exhibit dynamic luminosity surges.
   ========================================================================== */

interface Filament {
  line: THREE.Line;
  geometry: THREE.BufferGeometry;
  material: THREE.LineBasicMaterial;
  basePoints: THREE.Vector3[];
  phase: number;
  speed: number;
  amplitude: number;
}

export class PlasmaFilaments {
  public group: THREE.Group;
  private _filaments: Filament[] = [];
  private readonly _pointCount = 48;

  constructor() {
    this.group = new THREE.Group();

    const filamentCount = 8;

    for (let f = 0; f < filamentCount; f++) {
      const basePoints: THREE.Vector3[] = [];
      const angleOffset = (f / filamentCount) * Math.PI * 2;
      const tilt = ((f % 3) - 1) * 0.6;

      for (let i = 0; i < this._pointCount; i++) {
        const t = (i / (this._pointCount - 1)) * Math.PI * 2;
        // Toroidal spiral wrapping around the core
        const r = 1.1 + Math.sin(t * 3 + f) * 0.45;
        const x = Math.cos(t + angleOffset) * r;
        const y = Math.sin(t * 2 + angleOffset) * 0.7 + tilt * Math.cos(t);
        const z = Math.sin(t + angleOffset) * r;
        basePoints.push(new THREE.Vector3(x, y, z));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(basePoints);
      const isWarm = f % 3 === 1; // Intermittent golden-warm plasma accents like Layout.png
      const material = new THREE.LineBasicMaterial({
        color: isWarm ? 0xf59e0b : 0x00f0ff,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        linewidth: 1.2,
      });

      const line = new THREE.Line(geometry, material);
      this.group.add(line);

      this._filaments.push({
        line,
        geometry,
        material,
        basePoints,
        phase: f * 0.8,
        speed: 1.0 + (f % 4) * 0.35,
        amplitude: 0.12 + (f % 3) * 0.05,
      });
    }
  }

  public update(time: number, delta: number, params: CoreParameters, audioAmp: number): void {
    const expansion = params.orbitalExpansion;
    const turb = params.turbulence;

    this._filaments.forEach((fil) => {
      const positions = fil.geometry.attributes.position.array as Float32Array;
      const tProgress = time * fil.speed * params.filamentSpeed;

      for (let i = 0; i < this._pointCount; i++) {
        const bp = fil.basePoints[i];
        const idx = i * 3;

        // Wave turbulence propagating along curve
        const wave = Math.sin(tProgress * 2.0 + i * 0.3 + fil.phase) * fil.amplitude * turb;
        const twist = Math.cos(tProgress * 1.5 + i * 0.2) * 0.08 * turb;

        positions[idx] = (bp.x + wave) * expansion;
        positions[idx + 1] = (bp.y + twist) * expansion;
        positions[idx + 2] = (bp.z + wave * 0.7) * expansion;
      }

      fil.geometry.attributes.position.needsUpdate = true;

      // Dynamic luminosity surge
      const surge = Math.sin(time * 3.5 + fil.phase) * 0.3;
      fil.material.opacity = Math.max(0.15, (params.plasmaIntensity + surge) * (0.8 + audioAmp * 0.7));

      // Color interpolation
      if (fil.material.color.r > 0.8) {
        // Golden accent fil
        fil.material.color.lerp(new THREE.Color(0xf59e0b), 0.05);
      } else {
        fil.material.color.lerp(params.primaryColor, 0.05);
      }
    });

    // Slow organic group counter-rotation
    this.group.rotation.y -= delta * 0.3 * params.rotationSpeed;
  }

  public dispose(): void {
    this._filaments.forEach((fil) => {
      fil.geometry.dispose();
      fil.material.dispose();
    });
  }
}
