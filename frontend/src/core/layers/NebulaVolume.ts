import * as THREE from 'three';
import { CoreParameters } from '../engine/CoreParameters';
import { nebulaFragmentShader, nebulaVertexShader } from '../shaders/coreShaders';

/* ==========================================================================
   SOL NEBULA VOLUME LAYER
   Procedural cosmic background field with fractal Brownian motion (fBm),
   deep celestial cobalt and violet regions, and pointer parallax response.
   ========================================================================== */

export class NebulaVolume {
  public mesh: THREE.Mesh;
  private _material: THREE.ShaderMaterial;

  constructor() {
    // Large background quad
    const geometry = new THREE.PlaneGeometry(2, 2);

    this._material = new THREE.ShaderMaterial({
      vertexShader: nebulaVertexShader,
      fragmentShader: nebulaFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPrimaryColor: { value: new THREE.Color(0x00d4ff) },
        uSecondaryColor: { value: new THREE.Color(0x1e40af) },
        uPointer: { value: new THREE.Vector2(0, 0) },
      },
      depthWrite: false,
      depthTest: false,
    });

    this.mesh = new THREE.Mesh(geometry, this._material);
    this.mesh.frustumCulled = false;
  }

  public update(time: number, pointerX: number, pointerY: number, params: CoreParameters): void {
    const u = this._material.uniforms;
    u.uTime.value = time;
    u.uPrimaryColor.value.copy(params.primaryColor);
    u.uSecondaryColor.value.copy(params.secondaryColor);
    u.uPointer.value.set(pointerX, pointerY);
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    this._material.dispose();
  }
}
