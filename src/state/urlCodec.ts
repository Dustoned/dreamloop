import { buildDefaultState, hydrate } from './defaults';
import type { ParamState } from './types';

function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64url(code: string): Uint8Array {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const s = atob(pad);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/**
 * Performance settings belong to a machine, not to a look. Sending yours along
 * would force your resolution onto whoever opens the link.
 */
const LOCAL_ONLY = new Set(['global.quality', 'global.detail', 'global.autoquality']);

/** Keep only values that differ from the defaults — codes stay short. */
function stripDefaults(s: ParamState): Record<string, unknown> {
  const d = buildDefaultState();
  const params: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(s.params)) {
    if (LOCAL_ONLY.has(k)) continue;
    if (d.params[k] !== v) params[k] = v;
  }
  const out: Record<string, unknown> = { v: s.v, scene: s.scene, params };
  if (Object.keys(s.mods).length) out.mods = s.mods;
  if (JSON.stringify(s.effects) !== JSON.stringify(d.effects)) out.effects = s.effects;
  if (JSON.stringify(s.palette) !== JSON.stringify(d.palette)) out.palette = s.palette;
  if (JSON.stringify(s.macros) !== JSON.stringify(d.macros)) out.macros = s.macros;
  if (JSON.stringify(s.audio) !== JSON.stringify(d.audio)) out.audio = s.audio;
  return out;
}

export async function encodeState(s: ParamState): Promise<string> {
  const json = JSON.stringify(stripDefaults(s));
  const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return base64url(await new Response(stream).arrayBuffer());
}

export async function decodeCode(code: string): Promise<ParamState | null> {
  try {
    const bytes = fromBase64url(code.trim());
    const stream = new Blob([bytes as BlobPart])
      .stream()
      .pipeThrough(new DecompressionStream('deflate-raw'));
    const json = await new Response(stream).text();
    return hydrate(JSON.parse(json));
  } catch {
    return null;
  }
}

export function shareUrl(code: string): string {
  return `${location.origin}${location.pathname}#p=${code}`;
}

export function codeFromHash(): string | null {
  const m = location.hash.match(/#p=([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}
