/*
 * SystemVitals
 * Collects local machine capabilities and provides expectation heuristics
 * for different cognitive task types (regular chat vs bicameral POV, etc.).
 */

export type LocalCapabilities =
{
  hardwareThreads?: number;
  deviceMemoryGb?: number;
  userAgent?: string;
  networkType?: string;
  downlinkMbps?: number;
  rttMs?: number;
};

export type TaskComplexity = 'regular' | 'bicameral' | 'vision' | 'code' | 'medical' | 'narrative' | 'unknown';

export type DurationRange =
{
  minSeconds: number;
  maxSeconds: number;
};

export function getLocalCapabilities(): LocalCapabilities
{
  const navAny = navigator as any;
  const conn = navAny?.connection || navAny?.mozConnection || navAny?.webkitConnection;

  const deviceMemory = (navAny && typeof navAny.deviceMemory === 'number') ? Number(navAny.deviceMemory) : undefined;
  const hardwareConcurrency = (typeof navigator.hardwareConcurrency === 'number') ? navigator.hardwareConcurrency : undefined;

  const downlink = conn && typeof conn.downlink === 'number' ? Number(conn.downlink) : undefined;
  const rtt = conn && typeof conn.rtt === 'number' ? Number(conn.rtt) : undefined;
  const effectiveType = conn && typeof conn.effectiveType === 'string' ? String(conn.effectiveType) : undefined;

  return {
    hardwareThreads: hardwareConcurrency,
    deviceMemoryGb: deviceMemory,
    userAgent: navigator.userAgent,
    networkType: effectiveType,
    downlinkMbps: downlink,
    rttMs: rtt,
  };
}

export function inferTaskComplexityFromLabel(label?: string): TaskComplexity
{
  if (!label)
  {
    return 'unknown';
  }
  const l = label.toLowerCase();
  if (l.includes('bicameral') || l.includes('pov'))
  {
    return 'bicameral';
  }
  if (l.includes('vision') || l.includes('recognize') || l.includes('eye'))
  {
    return 'vision';
  }
  if (l.includes('code'))
  {
    return 'code';
  }
  if (l.includes('medical'))
  {
    return 'medical';
  }
  if (l.includes('narrative'))
  {
    return 'narrative';
  }
  if (l.includes('chat'))
  {
    return 'regular';
  }
  return 'unknown';
}

export function typicalDurationRangeFor(complexity: TaskComplexity): DurationRange
{
  switch (complexity)
  {
    case 'bicameral':
      return { minSeconds: 30, maxSeconds: 120 };
    case 'vision':
      return { minSeconds: 8, maxSeconds: 25 };
    case 'code':
      return { minSeconds: 6, maxSeconds: 20 };
    case 'medical':
      return { minSeconds: 10, maxSeconds: 45 };
    case 'narrative':
      return { minSeconds: 8, maxSeconds: 30 };
    case 'regular':
      return { minSeconds: 5, maxSeconds: 20 };
    default:
      return { minSeconds: 8, maxSeconds: 30 };
  }
}

/**
 * Estimate a duration range based on observed queue metrics.
 * Prefers per-label averages, then overall EMA, then overall average.
 * Falls back to a provided range if metrics are unavailable.
 */
export function estimateDurationRangeFromMetrics(
  metrics: { emaDurationMs?: number; averageDurationMs?: number; averageDurationByLabelMs?: Record<string, number> },
  label?: string,
  fallback?: DurationRange,
): DurationRange
{
  const perLabelMs = label && metrics?.averageDurationByLabelMs
    ? metrics.averageDurationByLabelMs[label]
    : undefined;
  const baselineMs = typeof perLabelMs === 'number'
    ? perLabelMs
    : (typeof metrics?.emaDurationMs === 'number'
      ? metrics.emaDurationMs
      : (typeof metrics?.averageDurationMs === 'number' ? metrics.averageDurationMs : undefined));

  if (typeof baselineMs !== 'number')
  {
    return fallback || { minSeconds: 8, maxSeconds: 30 };
  }

  const baselineSeconds = Math.max(1, baselineMs / 1000);
  // Construct a tolerant window around the baseline to account for variability
  const minSeconds = Math.max(1, Math.round(baselineSeconds * 0.8));
  const maxSeconds = Math.max(minSeconds + 1, Math.round(baselineSeconds * 1.4));
  return { minSeconds, maxSeconds };
}

export function formatRange(range: DurationRange): string
{
  const { minSeconds, maxSeconds } = range;
  if (maxSeconds < 60)
  {
    return `${minSeconds}-${maxSeconds}s`;
  }
  const minM = Math.round(minSeconds / 60);
  const maxM = Math.round(maxSeconds / 60);
  if (minM === maxM)
  {
    return `~${minM}m`;
  }
  return `${minM}-${maxM}m`;
}


