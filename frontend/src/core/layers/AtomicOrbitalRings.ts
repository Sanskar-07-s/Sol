import * as THREE from 'three';
import { CoreParameters } from '../engine/CoreParameters';

/* ==========================================================================
   SOL ATOMIC ORBITAL RINGS LAYER
   Nested, inclined elliptical energy shells inspired by Layout.png.
   Features 6 distinct orbital trajectories, counter-rotation, precession,
   travelling luminous nodes, and chromatic golden/cyan highlights.
   ========================================================================== */

interface OrbitalShell {
  ringMesh: THREE.LineLoop;
  nodeMesh: THREE.Mesh;
  baseRadiusA: number;
  baseRadiusB: number;
  inclinationX: number;
  inclinationZ: number;
  rotationSpeed: number;
  counterRotate: boolean;
  precessionSpeed: number;
  material: THREE.LineBasicMaterial;
  nodeMaterial: THREE.MeshBasicMaterial;
  pulsePhase: number;
  nodeTheta: number;
}

export class AtomicOrbitalRings {
  public group: THREE.Group;
  private _shells: OrbitalShell[] = [];

  constructor() {
    this.group = new THREE.Group();

    // 6 distinct orbital configurations with eccentricities, inclinations & speeds
    const shellConfigs = [
      // 1. Inner fast cyan atomic ring (tilted 45 deg)
      { radiusA: 1.35, radiusB: 1.15, incX: Math.PI / 4, incZ: Math.PI / 6, speed: 1.4, counter: false, precess: 0.15, color: 0x00f0ff, nodeColor: 0xffffff, nodeSize: 0.05 },
      // 2. Transverse golden-amber filament ring (matching Layout.png's golden intersections)
      { radiusA: 1.65, radiusB: 1.35, incX: -Math.PI / 3, incZ: Math.PI / 4, speed: -1.1, counter: true, precess: -0.2, color: 0xf59e0b, nodeColor: 0xfef08a, nodeSize: 0.06 },
      // 3. Equatorial energetic azure ring (slightly eccentric)
      { radiusA: 1.85, radiusB: 1.6, incX: 0.1, incZ: -Math.PI / 5, speed: 0.9, counter: false, precess: 0.1, color: 0x38bdf8, nodeColor: 0xbae6fd, nodeSize: 0.045 },
      // 4. Polar-inclined deep violet/cobalt ring
      { radiusA: 2.1, radiusB: 1.75, incX: Math.PI / 2.2, incZ: 0.2, speed: -0.7, counter: true, precess: 0.08, color: 0x818cf8, nodeColor: 0xe0e7ff, nodeSize: 0.05 },
      // 5. Outer wide orbital boundary ring
      { radiusA: 2.45, radiusB: 2.1, incX: -Math.PI / 6, incZ: -Math.PI / 3, speed: 0.6, counter: false, precess: -0.12, color: 0x0284c7, nodeColor: 0x38bdf8, nodeSize: 0.04 },
      // 6. Resonant harmonic high-inclination ring
      { radiusA: 2.75, radiusB: 2.3, incX: Math.PI / 3.5, incZ: Math.PI / 2.5, speed: -0.45, counter: true, precess: 0.05, color: 0x00d4ff, nodeColor: 0xffffff, nodeSize: 0.055 },
    ];

    const nodeGeo = new THREE.SphereGeometry(1, 16, 16);

    shellConfigs.forEach((cfg, idx) => {
      // Create smooth elliptical trajectory points
      const segments = 128;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
          Math.cos(theta) * cfg.radiusA,
          Math.sin(theta) * cfg.radiusB,
          0
        ));
      }

      const ringGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const ringMaterial = new THREE.LineBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        linewidth: 1.5,
      });

      const ringMesh = new THREE.LineLoop(ringGeometry, ringMaterial);
      ringMesh.rotation.x = cfg.incX;
      ringMesh.rotation.z = cfg.incZ;

      // Travelling atomic luminous node
      const nodeMaterial = new THREE.MeshBasicMaterial({
        color: cfg.nodeColor,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMaterial);
      nodeMesh.scale.set(cfg.nodeSize, cfg.nodeSize, cfg.nodeSize);

      ringMesh.add(nodeMesh);
      this.group.add(ringMesh);

      this._shells.push({
        ringMesh,
        nodeMesh,
        baseRadiusA: cfg.radiusA,
        baseRadiusB: cfg.radiusB,
        inclinationX: cfg.incX,
        inclinationZ: cfg.incZ,
        rotationSpeed: cfg.speed,
        counterRotate: cfg.counter,
        precessionSpeed: cfg.precess,
        material: ringMaterial,
        nodeMaterial,
        pulsePhase: idx * 1.05,
        nodeTheta: Math.random() * Math.PI * 2,
      });
    });
  }

  public update(time: number, delta: number, params: CoreParameters, audioAmp: number): void {
    const expansion = params.orbitalExpansion * (1.0 + audioAmp * 0.35);

    this._shells.forEach((shell) => {
      // Differential multi-frequency rotation & precession
      const rotDelta = delta * shell.rotationSpeed * params.rotationSpeed;
      shell.ringMesh.rotation.y += rotDelta;
      shell.ringMesh.rotation.x += delta * shell.precessionSpeed * params.rotationSpeed;

      // Travelling luminous node along ellipse
      shell.nodeTheta += delta * shell.rotationSpeed * 1.5 * params.rotationSpeed;
      const currentRadiusA = shell.baseRadiusA * expansion;
      const currentRadiusB = shell.baseRadiusB * expansion;
      shell.nodeMesh.position.set(
        Math.cos(shell.nodeTheta) * currentRadiusA,
        Math.sin(shell.nodeTheta) * currentRadiusB,
        0
      );

      // Node size pulse
      const nodePulse = 1.0 + Math.sin(time * 4.0 + shell.pulsePhase) * 0.3 + audioAmp * 0.8;
      shell.nodeMesh.scale.setScalar(0.045 * nodePulse * params.nodeBrightness);

      // Ring scale with dynamic opening expansion
      shell.ringMesh.scale.set(expansion, expansion, expansion);

      // Ring opacity & travelling pulse
      const wave = Math.sin(time * 3.0 + shell.pulsePhase) * 0.2;
      shell.material.opacity = Math.max(0.1, (params.ringOpacity + wave) * (1.0 + audioAmp * 0.4));
      shell.nodeMaterial.opacity = Math.min(1.0, params.nodeBrightness + audioAmp * 0.5);

      // Blend ring color toward current state primary/secondary wavelengths
      if (shell.counterRotate) {
        shell.material.color.lerp(params.secondaryColor, 0.05);
      } else {
        shell.material.color.lerp(params.primaryColor, 0.05);
      }
    });

    // Slow global precession of the entire atomic orbital group
    this.group.rotation.z += delta * 0.04 * params.rotationSpeed;
  }

  public dispose(): void {
    this._shells.forEach((shell) => {
      shell.ringMesh.geometry.dispose();
      shell.material.dispose();
      shell.nodeMesh.geometry.dispose();
      shell.nodeMaterial.dispose();
    });
  }
}
