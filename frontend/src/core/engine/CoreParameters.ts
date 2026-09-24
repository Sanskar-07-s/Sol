import * as THREE from 'three';

/* ==========================================================================
   SOL CORE PARAMETERS
   Complete physical, visual, and optical model for the living computational Core.
   Interpolated smoothly across all 12 SOL states.
   ========================================================================== */

export interface CoreParameters {
  // Global & Dimensional
  energy: number;                  // 0.0 (offline) to 3.0 (peak execution)
  coreScale: number;               // Base scaling factor
  orbitalExpansion: number;        // Separation distance of orbital rings (0.5 to 2.0)
  rotationSpeed: number;           // Multiplier for orbital and lattice rotation
  turbulence: number;              // Noise amplitude in shaders and filaments

  // Colors & Luminosity
  primaryColor: THREE.Color;       // Dominant energy wavelength
  secondaryColor: THREE.Color;     // Secondary chromatic accent
  coreColor: THREE.Color;          // Central singularity white-hot color
  emissionIntensity: number;       // Glow / bloom brightness multiplier

  // Singularity / Nucleus
  nucleusPulseFrequency: number;   // Multi-frequency breathing rate
  nucleusNoiseSpeed: number;       // Procedural plasma movement speed
  nucleusVolumetricFalloff: number;// Edge sharpness / softness

  // Atomic Orbital Rings
  ringOpacity: number;             // Ring visibility
  ringPulseIntensity: number;      // Travelling energy pulse intensity along rings
  nodeBrightness: number;          // Luminosity of orbiting atomic nodes

  // Plasma Filaments
  plasmaIntensity: number;         // Filament brightness and opacity
  filamentSpeed: number;           // Flow speed through magnetic flux lines

  // Vertical Quantum Axis
  verticalBeamIntensity: number;   // Intensity of perpendicular plasma columns
  verticalBeamWidth: number;       // Width of central plasma beam
  discVisibility: number;          // Opacity of upper/lower holographic rings

  // Particle Field
  particleVelocity: number;        // Particle orbit and drift speed
  particleBrightness: number;      // Particle luminosity
  particleAccretionRate: number;   // Inward draw vs outward burst vector

  // Cybernetic Pedestal Base
  pedestalGlow: number;            // Emission of base emitter rings & LED notches
}

export function createDefaultCoreParameters(): CoreParameters {
  return {
    energy: 1.0,
    coreScale: 1.0,
    orbitalExpansion: 1.0,
    rotationSpeed: 1.0,
    turbulence: 1.0,

    primaryColor: new THREE.Color(0x00d4ff),    // Electric cyan
    secondaryColor: new THREE.Color(0x1e40af),  // Deep cobalt
    coreColor: new THREE.Color(0xf0f9ff),       // White-hot stellar blue
    emissionIntensity: 1.0,

    nucleusPulseFrequency: 1.0,
    nucleusNoiseSpeed: 1.0,
    nucleusVolumetricFalloff: 1.8,

    ringOpacity: 0.85,
    ringPulseIntensity: 1.0,
    nodeBrightness: 1.0,

    plasmaIntensity: 0.8,
    filamentSpeed: 1.0,

    verticalBeamIntensity: 0.8,
    verticalBeamWidth: 1.0,
    discVisibility: 0.7,

    particleVelocity: 1.0,
    particleBrightness: 0.85,
    particleAccretionRate: 0.0,

    pedestalGlow: 0.7,
  };
}
