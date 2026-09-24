import * as THREE from 'three';
import { SolState } from '../../state/types';
import { CoreParameters } from './CoreParameters';

/* ==========================================================================
   SOL CORE STATE PROFILES
   Defines the distinct physical, optical, and rotational configurations
   for all 12 SOL states as specified in the Batch 2 design requirements.
   ========================================================================== */

export const STATE_PROFILES: Record<SolState, CoreParameters> = {
  // 1. STANDBY: Very dim, collapsed, slow pulse, minimal plasma
  STANDBY: {
    energy: 0.25,
    coreScale: 0.75,
    orbitalExpansion: 0.65,
    rotationSpeed: 0.2,
    turbulence: 0.25,
    primaryColor: new THREE.Color(0x0f2858),
    secondaryColor: new THREE.Color(0x06122c),
    coreColor: new THREE.Color(0x88b0f8),
    emissionIntensity: 0.3,
    nucleusPulseFrequency: 0.3,
    nucleusNoiseSpeed: 0.25,
    nucleusVolumetricFalloff: 2.5,
    ringOpacity: 0.35,
    ringPulseIntensity: 0.2,
    nodeBrightness: 0.3,
    plasmaIntensity: 0.2,
    filamentSpeed: 0.2,
    verticalBeamIntensity: 0.2,
    verticalBeamWidth: 0.5,
    discVisibility: 0.25,
    particleVelocity: 0.25,
    particleBrightness: 0.3,
    particleAccretionRate: 0.05,
    pedestalGlow: 0.3,
  },

  // 2. IDLE: Cyan energy, gentle breathing, stable orbital motion, cobalt backdrop
  IDLE: {
    energy: 1.0,
    coreScale: 1.0,
    orbitalExpansion: 1.0,
    rotationSpeed: 1.0,
    turbulence: 1.0,
    primaryColor: new THREE.Color(0x00d4ff),
    secondaryColor: new THREE.Color(0x1e40af),
    coreColor: new THREE.Color(0xf0f9ff),
    emissionIntensity: 1.0,
    nucleusPulseFrequency: 1.0,
    nucleusNoiseSpeed: 1.0,
    nucleusVolumetricFalloff: 1.8,
    ringOpacity: 0.85,
    ringPulseIntensity: 1.0,
    nodeBrightness: 1.0,
    plasmaIntensity: 0.85,
    filamentSpeed: 1.0,
    verticalBeamIntensity: 0.85,
    verticalBeamWidth: 1.0,
    discVisibility: 0.75,
    particleVelocity: 1.0,
    particleBrightness: 0.85,
    particleAccretionRate: 0.0,
    pedestalGlow: 0.75,
  },

  // 3. LISTENING: Brighter core, expanded structure, mic-reactive highlights
  LISTENING: {
    energy: 1.35,
    coreScale: 1.15,
    orbitalExpansion: 1.25,
    rotationSpeed: 1.2,
    turbulence: 1.4,
    primaryColor: new THREE.Color(0x38bdf8),
    secondaryColor: new THREE.Color(0xf0f9ff),
    coreColor: new THREE.Color(0xffffff),
    emissionIntensity: 1.3,
    nucleusPulseFrequency: 1.5,
    nucleusNoiseSpeed: 1.4,
    nucleusVolumetricFalloff: 1.5,
    ringOpacity: 0.95,
    ringPulseIntensity: 1.5,
    nodeBrightness: 1.4,
    plasmaIntensity: 1.1,
    filamentSpeed: 1.3,
    verticalBeamIntensity: 1.1,
    verticalBeamWidth: 1.15,
    discVisibility: 0.9,
    particleVelocity: 1.25,
    particleBrightness: 1.1,
    particleAccretionRate: -0.1,
    pedestalGlow: 0.95,
  },

  // 4. UNDERSTANDING: Inward contraction, cyan + violet energy, increased internal oscillation
  UNDERSTANDING: {
    energy: 1.2,
    coreScale: 0.92,
    orbitalExpansion: 0.88,
    rotationSpeed: 1.35,
    turbulence: 1.6,
    primaryColor: new THREE.Color(0x00f0ff),
    secondaryColor: new THREE.Color(0x8b5cf6),
    coreColor: new THREE.Color(0xf5f3ff),
    emissionIntensity: 1.2,
    nucleusPulseFrequency: 1.8,
    nucleusNoiseSpeed: 1.6,
    nucleusVolumetricFalloff: 1.6,
    ringOpacity: 0.9,
    ringPulseIntensity: 1.4,
    nodeBrightness: 1.2,
    plasmaIntensity: 1.0,
    filamentSpeed: 1.4,
    verticalBeamIntensity: 1.0,
    verticalBeamWidth: 0.95,
    discVisibility: 0.8,
    particleVelocity: 1.4,
    particleBrightness: 0.95,
    particleAccretionRate: 0.4, // Inward suction
    pedestalGlow: 0.85,
  },

  // 5. THINKING: Faster orbital motion, violet/cobalt, strong internal turbulence
  THINKING: {
    energy: 1.6,
    coreScale: 1.1,
    orbitalExpansion: 1.15,
    rotationSpeed: 2.2,
    turbulence: 2.0,
    primaryColor: new THREE.Color(0x2563eb),
    secondaryColor: new THREE.Color(0x7c3aed),
    coreColor: new THREE.Color(0xfff7ed),
    emissionIntensity: 1.45,
    nucleusPulseFrequency: 2.4,
    nucleusNoiseSpeed: 2.2,
    nucleusVolumetricFalloff: 1.4,
    ringOpacity: 0.95,
    ringPulseIntensity: 1.8,
    nodeBrightness: 1.5,
    plasmaIntensity: 1.4,
    filamentSpeed: 2.0,
    verticalBeamIntensity: 1.3,
    verticalBeamWidth: 1.2,
    discVisibility: 0.9,
    particleVelocity: 2.0,
    particleBrightness: 1.2,
    particleAccretionRate: 0.1,
    pedestalGlow: 0.9,
  },

  // 6. PLANNING: Synchronized orbital movement, geometric alignment, cyan/electric blue pulses
  PLANNING: {
    energy: 1.3,
    coreScale: 1.05,
    orbitalExpansion: 1.08,
    rotationSpeed: 1.4,
    turbulence: 0.8,
    primaryColor: new THREE.Color(0x0284c7),
    secondaryColor: new THREE.Color(0x22d3ee),
    coreColor: new THREE.Color(0xf0fdf4),
    emissionIntensity: 1.2,
    nucleusPulseFrequency: 1.3,
    nucleusNoiseSpeed: 1.1,
    nucleusVolumetricFalloff: 1.7,
    ringOpacity: 0.95,
    ringPulseIntensity: 1.6,
    nodeBrightness: 1.3,
    plasmaIntensity: 1.0,
    filamentSpeed: 1.2,
    verticalBeamIntensity: 1.1,
    verticalBeamWidth: 1.05,
    discVisibility: 0.85,
    particleVelocity: 1.1,
    particleBrightness: 1.0,
    particleAccretionRate: 0.0,
    pedestalGlow: 0.8,
  },

  // 7. EXECUTING: High energy, major expansion, fast plasma, strong vertical axis, electric blue + white
  EXECUTING: {
    energy: 2.4,
    coreScale: 1.25,
    orbitalExpansion: 1.45,
    rotationSpeed: 2.5,
    turbulence: 2.2,
    primaryColor: new THREE.Color(0x00f0ff),
    secondaryColor: new THREE.Color(0xffffff),
    coreColor: new THREE.Color(0xffffff),
    emissionIntensity: 1.8,
    nucleusPulseFrequency: 2.8,
    nucleusNoiseSpeed: 2.6,
    nucleusVolumetricFalloff: 1.2,
    ringOpacity: 1.0,
    ringPulseIntensity: 2.2,
    nodeBrightness: 1.8,
    plasmaIntensity: 1.8,
    filamentSpeed: 2.5,
    verticalBeamIntensity: 2.2,
    verticalBeamWidth: 1.5,
    discVisibility: 1.0,
    particleVelocity: 2.6,
    particleBrightness: 1.5,
    particleAccretionRate: -0.5, // Outward burst
    pedestalGlow: 1.0,
  },

  // 8. SPEAKING: Rhythmic wave propagation, vertical oscillation, cyan + violet
  SPEAKING: {
    energy: 1.3,
    coreScale: 1.12,
    orbitalExpansion: 1.18,
    rotationSpeed: 1.3,
    turbulence: 1.2,
    primaryColor: new THREE.Color(0x38bdf8),
    secondaryColor: new THREE.Color(0xa855f7),
    coreColor: new THREE.Color(0xfdf4ff),
    emissionIntensity: 1.3,
    nucleusPulseFrequency: 1.7,
    nucleusNoiseSpeed: 1.5,
    nucleusVolumetricFalloff: 1.5,
    ringOpacity: 0.9,
    ringPulseIntensity: 1.6,
    nodeBrightness: 1.3,
    plasmaIntensity: 1.2,
    filamentSpeed: 1.4,
    verticalBeamIntensity: 1.6,
    verticalBeamWidth: 1.25,
    discVisibility: 0.88,
    particleVelocity: 1.3,
    particleBrightness: 1.1,
    particleAccretionRate: 0.0,
    pedestalGlow: 0.85,
  },

  // 9. SUCCESS: White-hot energy flash, emerald secondary highlight, peak bloom, then return to IDLE
  SUCCESS: {
    energy: 2.0,
    coreScale: 1.3,
    orbitalExpansion: 1.5,
    rotationSpeed: 1.8,
    turbulence: 1.0,
    primaryColor: new THREE.Color(0xffffff),
    secondaryColor: new THREE.Color(0x10b981),
    coreColor: new THREE.Color(0xffffff),
    emissionIntensity: 2.0,
    nucleusPulseFrequency: 1.6,
    nucleusNoiseSpeed: 1.8,
    nucleusVolumetricFalloff: 1.1,
    ringOpacity: 1.0,
    ringPulseIntensity: 2.4,
    nodeBrightness: 2.0,
    plasmaIntensity: 1.6,
    filamentSpeed: 1.8,
    verticalBeamIntensity: 2.0,
    verticalBeamWidth: 1.4,
    discVisibility: 1.0,
    particleVelocity: 2.0,
    particleBrightness: 1.6,
    particleAccretionRate: -0.6,
    pedestalGlow: 1.0,
  },

  // 10. WARNING: Amber/gold energy, irregular orbital motion, controlled turbulence
  WARNING: {
    energy: 1.4,
    coreScale: 1.05,
    orbitalExpansion: 1.1,
    rotationSpeed: 1.6,
    turbulence: 2.2,
    primaryColor: new THREE.Color(0xf59e0b),
    secondaryColor: new THREE.Color(0xd97706),
    coreColor: new THREE.Color(0xfef3c7),
    emissionIntensity: 1.4,
    nucleusPulseFrequency: 1.8,
    nucleusNoiseSpeed: 2.0,
    nucleusVolumetricFalloff: 1.5,
    ringOpacity: 0.9,
    ringPulseIntensity: 1.5,
    nodeBrightness: 1.3,
    plasmaIntensity: 1.3,
    filamentSpeed: 1.6,
    verticalBeamIntensity: 1.0,
    verticalBeamWidth: 1.0,
    discVisibility: 0.75,
    particleVelocity: 1.5,
    particleBrightness: 1.2,
    particleAccretionRate: 0.1,
    pedestalGlow: 0.9,
  },

  // 11. ERROR: Crimson red energy, unstable fractured plasma, containment behavior
  ERROR: {
    energy: 1.5,
    coreScale: 0.95,
    orbitalExpansion: 0.9,
    rotationSpeed: 1.9,
    turbulence: 2.8,
    primaryColor: new THREE.Color(0xef4444),
    secondaryColor: new THREE.Color(0x991b1b),
    coreColor: new THREE.Color(0xfee2e2),
    emissionIntensity: 1.5,
    nucleusPulseFrequency: 2.2,
    nucleusNoiseSpeed: 2.5,
    nucleusVolumetricFalloff: 1.3,
    ringOpacity: 0.85,
    ringPulseIntensity: 1.7,
    nodeBrightness: 1.2,
    plasmaIntensity: 1.5,
    filamentSpeed: 2.2,
    verticalBeamIntensity: 0.6,
    verticalBeamWidth: 0.8,
    discVisibility: 0.6,
    particleVelocity: 1.8,
    particleBrightness: 1.1,
    particleAccretionRate: 0.2,
    pedestalGlow: 0.8,
  },

  // 12. OFFLINE: Nearly extinguished, collapsed, cold nucleus, minimal movement
  OFFLINE: {
    energy: 0.05,
    coreScale: 0.65,
    orbitalExpansion: 0.55,
    rotationSpeed: 0.05,
    turbulence: 0.05,
    primaryColor: new THREE.Color(0x334155),
    secondaryColor: new THREE.Color(0x0f172a),
    coreColor: new THREE.Color(0x475569),
    emissionIntensity: 0.1,
    nucleusPulseFrequency: 0.1,
    nucleusNoiseSpeed: 0.05,
    nucleusVolumetricFalloff: 3.5,
    ringOpacity: 0.15,
    ringPulseIntensity: 0.05,
    nodeBrightness: 0.1,
    plasmaIntensity: 0.05,
    filamentSpeed: 0.05,
    verticalBeamIntensity: 0.05,
    verticalBeamWidth: 0.2,
    discVisibility: 0.1,
    particleVelocity: 0.08,
    particleBrightness: 0.1,
    particleAccretionRate: 0.0,
    pedestalGlow: 0.1,
  },
};

/**
 * Smoothly interpolates `current` toward `target` using delta-time based exponential damping.
 */
export function interpolateCoreParameters(
  current: CoreParameters,
  target: CoreParameters,
  delta: number,
  speed = 4.0
): void {
  const t = Math.min(1.0, 1.0 - Math.exp(-speed * delta));

  current.energy += (target.energy - current.energy) * t;
  current.coreScale += (target.coreScale - current.coreScale) * t;
  current.orbitalExpansion += (target.orbitalExpansion - current.orbitalExpansion) * t;
  current.rotationSpeed += (target.rotationSpeed - current.rotationSpeed) * t;
  current.turbulence += (target.turbulence - current.turbulence) * t;

  current.primaryColor.lerp(target.primaryColor, t);
  current.secondaryColor.lerp(target.secondaryColor, t);
  current.coreColor.lerp(target.coreColor, t);
  current.emissionIntensity += (target.emissionIntensity - current.emissionIntensity) * t;

  current.nucleusPulseFrequency += (target.nucleusPulseFrequency - current.nucleusPulseFrequency) * t;
  current.nucleusNoiseSpeed += (target.nucleusNoiseSpeed - current.nucleusNoiseSpeed) * t;
  current.nucleusVolumetricFalloff += (target.nucleusVolumetricFalloff - current.nucleusVolumetricFalloff) * t;

  current.ringOpacity += (target.ringOpacity - current.ringOpacity) * t;
  current.ringPulseIntensity += (target.ringPulseIntensity - current.ringPulseIntensity) * t;
  current.nodeBrightness += (target.nodeBrightness - current.nodeBrightness) * t;

  current.plasmaIntensity += (target.plasmaIntensity - current.plasmaIntensity) * t;
  current.filamentSpeed += (target.filamentSpeed - current.filamentSpeed) * t;

  current.verticalBeamIntensity += (target.verticalBeamIntensity - current.verticalBeamIntensity) * t;
  current.verticalBeamWidth += (target.verticalBeamWidth - current.verticalBeamWidth) * t;
  current.discVisibility += (target.discVisibility - current.discVisibility) * t;

  current.particleVelocity += (target.particleVelocity - current.particleVelocity) * t;
  current.particleBrightness += (target.particleBrightness - current.particleBrightness) * t;
  current.particleAccretionRate += (target.particleAccretionRate - current.particleAccretionRate) * t;

  current.pedestalGlow += (target.pedestalGlow - current.pedestalGlow) * t;
}
