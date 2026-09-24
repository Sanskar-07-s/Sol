/* ==========================================================================
   SOL CORE GLSL SHADERS
   Modular procedural shader definitions for the living computational Core.
   ========================================================================== */

/**
 * Common GLSL 3D Simplex noise helper
 */
const GLSL_SIMPLEX_NOISE = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

// 1. SINGULARITY CORE NUCLEUS SHADERS
export const singularityVertexShader = `
uniform float uTime;
uniform float uTurbulence;
uniform float uPulse;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;

${GLSL_SIMPLEX_NOISE}

void main() {
  vNormal = normalize(normalMatrix * normal);
  
  // Multi-frequency vertex displacement for organic breathing
  float displacement = snoise(position * 2.2 + vec3(uTime * 0.8)) * 0.08 * uTurbulence;
  displacement += snoise(position * 4.5 - vec3(uTime * 1.5)) * 0.03 * uTurbulence;
  
  vec3 displacedPosition = position + normal * (displacement + uPulse * 0.06);
  
  vec4 worldPos = modelMatrix * vec4(displacedPosition, 1.0);
  vWorldPosition = worldPos.xyz;
  
  vec4 mvPosition = viewMatrix * worldPos;
  vViewPosition = -mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const singularityFragmentShader = `
uniform float uTime;
uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;
uniform vec3 uCoreColor;
uniform float uEmission;
uniform float uAudioAmp;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;

${GLSL_SIMPLEX_NOISE}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Fresnel calculation (rim glow)
  float fresnel = 1.0 - max(0.0, dot(normal, viewDir));
  float rim = pow(fresnel, 2.2);

  // Procedural volumetric turbulence
  float n1 = snoise(vWorldPosition * 2.8 + vec3(0.0, uTime * 0.9, 0.0));
  float n2 = snoise(vWorldPosition * 5.2 - vec3(uTime * 1.4, 0.0, uTime * 0.7));
  float combinedNoise = (n1 * 0.6 + n2 * 0.4) * 0.5 + 0.5;

  // White-hot energetic nucleus transitioning outwards
  float centerIntensity = clamp(dot(normal, viewDir), 0.0, 1.0);
  centerIntensity = pow(centerIntensity, 1.8);

  // Color blending: Core (white-hot) -> Primary (cyan) -> Secondary (deep cobalt/violet)
  vec3 color = mix(uSecondaryColor, uPrimaryColor, combinedNoise);
  color = mix(color, uCoreColor, centerIntensity * 0.85);

  // Rim energy glow + audio surge
  vec3 rimGlow = mix(uPrimaryColor, vec3(1.0), rim * 0.7) * rim * 2.0;
  color += rimGlow * (1.0 + uAudioAmp * 1.5);

  float alpha = clamp(rim * 1.2 + centerIntensity * 0.9, 0.2, 1.0);
  gl_FragColor = vec4(color * uEmission, alpha);
}
`;

// 2. CELESTIAL NEBULA ATMOSPHERE SHADERS
export const nebulaVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}
`;

export const nebulaFragmentShader = `
uniform float uTime;
uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;
uniform vec2 uPointer;

varying vec2 vUv;

${GLSL_SIMPLEX_NOISE}

float fbm(vec2 p) {
  float f = 0.0;
  f += 0.5000 * snoise(vec3(p, uTime * 0.04)); p *= 2.02;
  f += 0.2500 * snoise(vec3(p, uTime * 0.06)); p *= 2.03;
  f += 0.1250 * snoise(vec3(p, uTime * 0.08)); p *= 2.01;
  f += 0.0625 * snoise(vec3(p, uTime * 0.10));
  return f;
}

void main() {
  vec2 uv = (vUv - 0.5) * 2.0;
  
  // Parallax distortion
  uv += uPointer * 0.04;

  float r = length(uv);

  // Fractal nebular clouds
  float q = fbm(uv * 1.2);
  float f = fbm(uv * 1.8 + vec2(q, -q));

  // Nebular colors inspired by Layout.png
  vec3 deepSpace = vec3(0.008, 0.015, 0.035); // Void navy
  vec3 nebulaBlue = mix(uSecondaryColor * 0.4, uPrimaryColor * 0.6, f);
  vec3 violetAccent = vec3(0.12, 0.04, 0.25) * q;

  vec3 finalColor = deepSpace + nebulaBlue * (f * 0.45) + violetAccent * 0.25;

  // Central vignette to keep the core brilliantly legible
  float vignette = smoothstep(1.5, 0.2, r);
  finalColor *= (0.6 + 0.4 * vignette);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

// 3. VERTICAL PLASMA BEAM SHADERS
export const verticalBeamVertexShader = `
uniform float uTime;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const verticalBeamFragmentShader = `
uniform float uTime;
uniform vec3 uPrimaryColor;
uniform vec3 uCoreColor;
uniform float uIntensity;
uniform float uAudioAmp;

varying vec2 vUv;
varying vec3 vPosition;

${GLSL_SIMPLEX_NOISE}

void main() {
  // Center beam falloff (horizontal UV)
  float centerDist = abs(vUv.x - 0.5) * 2.0;
  float coreBeam = exp(-centerDist * 4.0);
  float outerHalo = exp(-centerDist * 1.8);

  // Vertical plasma travel
  float travelNoise = snoise(vec3(vUv.x * 3.0, vUv.y * 8.0 - uTime * 3.5, uTime * 0.5));
  float plasmaFlicker = 0.8 + 0.2 * travelNoise;

  // Vertical fade towards top & bottom extremities
  float verticalFade = sin(vUv.y * 3.14159265);

  vec3 beamColor = mix(uPrimaryColor, uCoreColor, coreBeam * 0.8);
  float alpha = (coreBeam * 1.2 + outerHalo * 0.5) * verticalFade * plasmaFlicker * uIntensity;
  alpha *= (1.0 + uAudioAmp * 0.8);

  gl_FragColor = vec4(beamColor * uIntensity * 1.5, clamp(alpha, 0.0, 1.0));
}
`;

// 4. PARTICLE SPRITE SHADERS
export const particleVertexShader = `
uniform float uTime;
uniform float uSizeMultiplier;
uniform float uAudioAmp;

attribute float aScale;
attribute float aPhase;
attribute vec3 aColor;

varying vec3 vColor;
varying float vPhase;

void main() {
  vColor = aColor;
  vPhase = aPhase;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  
  // Point size attenuation
  float pulse = 1.0 + 0.3 * sin(uTime * 2.0 + aPhase) + uAudioAmp * 0.6;
  gl_PointSize = (aScale * 35.0 * uSizeMultiplier * pulse) / (-mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const particleFragmentShader = `
uniform float uEmission;
varying vec3 vColor;

void main() {
  // Soft circular point sprite
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float alpha = smoothstep(0.5, 0.0, dist);
  alpha = pow(alpha, 1.8);

  gl_FragColor = vec4(vColor * uEmission, alpha);
}
`;
