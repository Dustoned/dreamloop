export type PerfTier = 'low' | 'medium' | 'high';

export interface DeviceProfile {
  tier: PerfTier;
  /** Hard cap on devicePixelRatio before the quality scale is applied. */
  dprCap: number;
  /** Starting internal-resolution scale for a first-time visitor. */
  startQuality: number;
  /** Use RGBA16F render targets; half-float costs double the bandwidth. */
  useFloatTargets: boolean;
  /** Worth discarding old target contents (tile-based GPUs only). */
  useInvalidate: boolean;
  /** Human-readable reason, shown in the Performance panel. */
  reason: string;
}

const WEAK_GPU =
  /(intel|hd graphics|uhd graphics|iris|mali|adreno [1-5]|powervr|videocore|llvmpipe|swiftshader|software|microsoft basic)/i;
const STRONG_GPU = /(rtx|radeon rx|geforce gtx 1[6-9]|apple m[1-9])/i;

function rendererString(gl: WebGL2RenderingContext): string {
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const raw = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  return typeof raw === 'string' ? raw : '';
}

/**
 * Pick conservative starting settings. This only has to be roughly right — the
 * runtime monitor corrects within a second or two either way. Being wrong toward
 * "too slow" is cheap; being wrong toward "too fast" means the user watches a
 * frozen screen, so the bias is deliberately downward.
 */
export function detectDevice(gl: WebGL2RenderingContext): DeviceProfile {
  const renderer = rendererString(gl);
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const smallScreen = Math.min(window.screen.width, window.screen.height) < 820;

  let score = 0;
  const notes: string[] = [];

  if (STRONG_GPU.test(renderer)) {
    score += 2;
  } else if (WEAK_GPU.test(renderer)) {
    score -= 2;
    notes.push('integrated or mobile graphics');
  }
  if (cores <= 4) {
    score -= 1;
    notes.push(`${cores} CPU cores`);
  } else if (cores >= 12) {
    score += 1;
  }
  if (memory <= 4) {
    score -= 1;
    notes.push(`${memory}GB memory`);
  } else if (memory >= 16) {
    score += 1;
  }
  if (coarse && smallScreen) {
    score -= 1;
    notes.push('phone-sized screen');
  }

  let tier: PerfTier = 'medium';
  if (score <= -2) tier = 'low';
  else if (score >= 2) tier = 'high';

  // Mali / Adreno / PowerVR / Apple mobile parts are tile-based renderers.
  const tileBased = /(mali|adreno|powervr|videocore|apple a\d)/i.test(renderer) || (coarse && smallScreen);

  const profile: Record<PerfTier, Omit<DeviceProfile, 'tier' | 'reason' | 'useInvalidate'>> = {
    low: { dprCap: 1, startQuality: 0.45, useFloatTargets: false },
    medium: { dprCap: 1.5, startQuality: 0.7, useFloatTargets: true },
    high: { dprCap: 2, startQuality: 1, useFloatTargets: true },
  };

  const reason =
    tier === 'high'
      ? 'Fast graphics detected — running at full quality.'
      : notes.length
        ? `Starting gentle: ${notes.join(', ')}.`
        : 'Starting at a safe quality level.';

  return { tier, ...profile[tier], useInvalidate: tileBased, reason };
}
