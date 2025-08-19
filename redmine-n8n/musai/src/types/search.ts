// Types for MuseEyeSearch / MusaiSearch flows

export type SearchMode = 'standard' | 'research';

export type SearchSource =
  | 'web'
  | 'news'
  | 'academic'
  | 'github'
  | 'docs'
  | 'redmine'
  | 'social';

export interface BicameralEvidence
{
  creative?: {
    summary?: string;
    highlights?: string[];
  };
  logical?: {
    summary?: string;
    highlights?: string[];
  };
  fusion?: {
    summary?: string;
    agreementScore?: number; // 0..1
  };
}

export interface ConflictCard
{
  title?: string;
  description?: string;
  perspectiveA?: string;
  perspectiveB?: string;
  resolutionHint?: string;
}

export interface PersonalizedNote
{
  summary: string;
  relatedItems?: Array<{ id: string; type: string; title?: string; url?: string }>;
  tags?: string[];
}

export interface SearchResult
{
  title: string;
  content: string;
  url?: string;
  snippet?: string;
  type?: string;
  sourcesUsed?: SearchSource[];
  bicameral?: BicameralEvidence;
  conflicts?: ConflictCard[];
  personalization?: PersonalizedNote;
  raw?: unknown;
}

export interface SearchSessionModel
{
  id: string;
  // Optional user-facing name; falls back to query when absent
  name?: string;
  query: string;
  intent?: string;
  mode?: SearchMode;
  sources?: SearchSource[];
  results: SearchResult[];
  followUps: Array<{
    query: string;
    result: { content: string };
    timestamp: number;
  }>;
  timestamp: number;
  favorite?: boolean;
  // Temporary user scoping before auth: store hashed client IP
  clientIpHash?: string;
  // Identifier sent to backend for grouping; often same as clientIpHash
  serverSessionId?: string;
}


