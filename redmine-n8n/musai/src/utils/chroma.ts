import { MUSAI_CHROMATIC_12, type MusaiTone } from '@/config/constants';

/**
 * Color and tone utilities for consistent chromatic mapping.
 * Names reflect cognitive/affective metaphors for clarity.
 */

export type RgbTuple = readonly [number, number, number];

export function hexToRgb(hex: string): RgbTuple
{
  const normalized = hex.replace('#', '');
  const value = parseInt(
    normalized.length === 3
      ? normalized.split('').map((c) => c + c).join('')
      : normalized,
    16
  );
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255] as const;
}

export function hexToRgba(hex: string, alpha: number): string
{
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Evenly maps N items across a palette of length P, preserving order stability.
 * Returns indices in the palette for each item position 0..N-1.
 */
export function computeToneIndices(itemCount: number, paletteLength: number): number[]
{
  if (itemCount <= 1)
  {
    return [0];
  }

  const last = paletteLength - 1;
  return Array.from({ length: itemCount }, (_unused, i) =>
  {
    return Math.round((i * last) / (itemCount - 1));
  });
}

/**
 * Retrieves the tone from the MUSAI 12-tone palette for a given palette index.
 */
export function getToneByIndex(index: number): MusaiTone
{
  const clamped = Math.max(0, Math.min(MUSAI_CHROMATIC_12.length - 1, index));
  return MUSAI_CHROMATIC_12[clamped];
}

/**
 * Returns neighbor tones around a given palette index to express dual-valence.
 */
export function getNeighborTones(index: number): { previous: MusaiTone; next: MusaiTone }
{
  const previous = getToneByIndex(index - 1);
  const next = getToneByIndex(index + 1);
  return { previous, next };
}

/**
 * Determines whether a given palette index should express dual-tone affordance.
 * Keep this set centralized to preserve a consistent experiential rhythm.
 */
export function isDualValenceIndex(index: number): boolean
{
  // Dual tone indices correspond to musical sharps: C#, D#, F#, G#, A#
  // In our 0-based palette: 1, 3, 6, 8, 10
  const dualIndices = new Set([1, 3, 6, 8, 10]);
  return dualIndices.has(index);
}


