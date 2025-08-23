import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ROUTES from '@/config/routes';
// Inserts an HTML comment into the DOM for source-inspectors
function DomComment({ text }: { text: string })
{
  const anchorRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() =>
  {
    if (!anchorRef.current)
    {
      return;
    }

    const commentNode = document.createComment(`\n${text}\n`);
    const parent = anchorRef.current.parentNode;
    if (parent)
    {
      parent.insertBefore(commentNode, anchorRef.current);
    }
  }, [text]);

  return <span ref={anchorRef} style={{ display: 'none' }} />;
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMusaiMood } from '@/contexts/MusaiMoodContext';
import { MUSAI_CHROMATIC_7, MUSAI_CHROMATIC_12, ACCESS_GATES } from '@/config/constants';
import { MessageSquare, Search, Eye, Code, GraduationCap, Theater, TrendingUp, Heart, Stethoscope, Sparkles, Bot, Music } from 'lucide-react';

const PEPPER = 'm$pepper_v1';
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour

function yyyymmdd(date = new Date())
{
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

async function sha256Hex(text: string): Promise<string>
{
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const RiddleGate: React.FC<{ children: React.ReactNode }> = ({ children }) =>
{
  const { toggleParty, activateRainbowWithPersistence } = useMusaiMood();
  const navigate = useNavigate();
  const location = useLocation();

  const gateMode = ACCESS_GATES.riddleGateMode;

  const [now, setNow] = useState(new Date());
  const [input, setInput] = useState('');
  const [hasTyped, setHasTyped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Affective overlay control: red for failure, green for success
  const [overlayType, setOverlayType] = useState<'success' | 'failure' | 'near' | null>(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [hasJustUnlocked, setHasJustUnlocked] = useState(false);
  const [lastFeedbackType, setLastFeedbackType] = useState<'near' | 'failure' | null>(null);
  const [overlayMessage, setOverlayMessage] = useState<string | null>(null);

  // Preview mode orchestration (0: idle, 1: console typing, 2: glyph flood)
  const [previewPhase, setPreviewPhase] = useState<0 | 1 | 2 | 3>(0);
  const [consoleIndex, setConsoleIndex] = useState(0);
  const [consoleText, setConsoleText] = useState('');
  const [consoleHistory, setConsoleHistory] = useState<string[]>([]);
  const [fogOn, setFogOn] = useState(false);
  const [floodOn, setFloodOn] = useState(false);
  const [staticOn, setStaticOn] = useState(false);
  const previewRunRef = useRef(false);

  const today = useMemo(() => yyyymmdd(now), [now]);
  const storageKey = `musai_riddle_access_${today}`;
  const failKey = `musai_riddle_fail_${today}`;
  const lockKey = `musai_riddle_lock_${today}`;

  // Update every second for countdown freshness
  useEffect(() =>
  {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const [isAuthorized, setIsAuthorized] = useState<boolean>(localStorage.getItem(storageKey) === 'ok');
  useEffect(() =>
  {
    const onStorage = (e: StorageEvent) =>
    {
      if (e.key === storageKey)
      {
        setIsAuthorized(e.newValue === 'ok');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [storageKey]);

  // Announce presence so global chrome (e.g., status bar) can hide while the gate is active
  useEffect(() =>
  {
    const announce = (active: boolean) =>
    {
      window.dispatchEvent(new CustomEvent('musai-riddle-presence', { detail: { active } }));
    };
    announce(!isAuthorized);
    return () => announce(false);
  }, [isAuthorized]);
  // Capture any pending intent (e.g., initialQuery/mode) while behind the gate
  useEffect(() =>
  {
    if (isAuthorized)
    {
      return;
    }

    try
    {
      const searchParams = new URLSearchParams(location.search);
      const state = location.state as any;
      const pendingQuery = state?.initialQuery || searchParams.get('q') || '';
      const pendingMode = searchParams.get('mode') || state?.switchToTab || '';

      if (pendingQuery || pendingMode)
      {
        sessionStorage.setItem('musai-pending-query', JSON.stringify({ query: pendingQuery || '', mode: pendingMode || '' }));
      }
    }
    catch
    {
      // ignore storage errors
    }
  }, [isAuthorized, location.key]);

  // Shared success pathway
  const finishUnlock = () =>
  {
    activateRainbowWithPersistence(2);
    localStorage.setItem(storageKey, 'ok');
    setIsAuthorized(true);
    localStorage.removeItem(failKey);
    localStorage.removeItem(lockKey);
    setError(null);
    setLastFeedbackType(null);
    setOverlayType('success');
    setOverlayMessage('Welcome to Musai');
    setIsOverlayVisible(true);
    setHasJustUnlocked(true);
    toggleParty();
    setTimeout(() => setIsOverlayVisible(false), 1800);

    try
    {
      const raw = sessionStorage.getItem('musai-pending-query');
      const { query = '', mode = '' } = raw ? JSON.parse(raw) : { };
      sessionStorage.removeItem('musai-pending-query');

      const params = new URLSearchParams();
      if (mode) params.set('mode', mode);
      if (query) params.set('q', query);
      params.set('victory', '1');
      navigate(`${ROUTES.MAIN_APP}?${params.toString()}`, { replace: true, state: { switchToTab: mode || 'chat', initialQuery: query, justUnlocked: true } });
    }
    catch
    {
      // ignore
    }
  };

  // Preview mode auto-unlock sequence (console → glyph flood → enter)
  useEffect(() =>
  {
    if (gateMode !== 'preview')
    {
      return;
    }
    if (isAuthorized || previewRunRef.current)
    {
      return;
    }

    previewRunRef.current = true;
    setFogOn(false);
    // Timing parameters: brief arrival pause → dim screen → then begin console flow
    const ARRIVAL_DELAY_MS = 450;
    const FOG_FADE_MS = 700; // matches transition duration on fog overlay

    const LINES = [
      'Wake up...',
      'See beyond the Veil...',
      'Follow your inner Muse.',
      'Get Ready!'
    ];

    let charTimer: number | undefined;
    let linePauseTimer: number | undefined;
    let floodTimer: number | undefined;
    let enterTimer: number | undefined;
    let startTypingTimer: number | undefined;
    let staticTimer: number | undefined;
    let staticOffTimer: number | undefined;
    let arrivalTimer: number | undefined;
    let fogCompleteTimer: number | undefined;

    const typeNextLine = (lineIdx: number) =>
    {
      const line = LINES[lineIdx] || '';
      let i = 0;
      setConsoleText('');

      const tick = () =>
      {
        i += 1;
        setConsoleText(line.slice(0, i));

        if (i < line.length)
        {
          // Slower cadence for readability (matrix-like console typing)
          charTimer = window.setTimeout(tick, 95) as unknown as number;
        }
        else
        {
          // Brief pause at end of line, then commit to history and proceed
          linePauseTimer = window.setTimeout(() =>
          {
            setConsoleHistory(prev => [...prev, line]);
            setConsoleIndex(lineIdx + 1);
            if (lineIdx + 1 < LINES.length)
            {
              typeNextLine(lineIdx + 1);
            }
            else
            {
              // Begin glyph flood
              setPreviewPhase(2);
              setFloodOn(false);
              // allow layout to mount then trigger progressive reveal
              window.setTimeout(() => setFloodOn(true), 30);
              // Allow flood to render and intensify, then enter app
              floodTimer = window.setTimeout(() =>
              {
                enterTimer = window.setTimeout(() =>
                {
                  finishUnlock();
                }, 900);
              }, 1100);
            }
          }, 520) as unknown as number;
        }
      };

      tick();
    };

    const beginConsoleFlow = () =>
    {
      setPreviewPhase(1);
      setConsoleIndex(0);
      setConsoleText('');
      setConsoleHistory([]);

      // Brief static prelude, then typing begins
      staticTimer = window.setTimeout(() =>
      {
        setStaticOn(true);
        staticOffTimer = window.setTimeout(() =>
        {
          setStaticOn(false);
          startTypingTimer = window.setTimeout(() => typeNextLine(0), 180) as unknown as number;
        }, 320) as unknown as number; // static duration
      }, 120) as unknown as number; // breath after full dim
    };

    // Arrival pause → start dim → after fog fade completes, begin console flow
    arrivalTimer = window.setTimeout(() =>
    {
      setFogOn(true);
      fogCompleteTimer = window.setTimeout(() =>
      {
        beginConsoleFlow();
      }, FOG_FADE_MS + 40) as unknown as number;
    }, ARRIVAL_DELAY_MS) as unknown as number;

    return () =>
    {
      if (charTimer) window.clearTimeout(charTimer);
      if (linePauseTimer) window.clearTimeout(linePauseTimer);
      if (floodTimer) window.clearTimeout(floodTimer);
      if (enterTimer) window.clearTimeout(enterTimer);
      if (startTypingTimer) window.clearTimeout(startTypingTimer);
      if (staticTimer) window.clearTimeout(staticTimer);
      if (staticOffTimer) window.clearTimeout(staticOffTimer);
      if (arrivalTimer) window.clearTimeout(arrivalTimer);
      if (fogCompleteTimer) window.clearTimeout(fogCompleteTimer);
    };
  }, [gateMode, isAuthorized]);


  const failCount = useMemo(() => parseInt(localStorage.getItem(failKey) || '0', 10), [failKey, now]);
  const lockUntilTs = useMemo(() => parseInt(localStorage.getItem(lockKey) || '0', 10), [lockKey, now]);
  const isLocked = lockUntilTs > Date.now();
  const remainingMs = Math.max(0, lockUntilTs - Date.now());

  const handleSubmit = async () =>
  {
    if (isLocked) return;

    // Require explicit typing + button click
    if (!hasTyped)
    {
      setError('Please type your answer and click Continue.');
      setLastFeedbackType(null);
      return;
    }

    const normalized = input.trim().toLowerCase();
    const digest = await sha256Hex(`${normalized}|${today}|${PEPPER}`);

    // Canonical answer
    const expected = await sha256Hex(`perspective|${today}|${PEPPER}`);

    // Near answers trigger a gentle nudge instead of failure
    const nearAnswers = [
      'awareness',
      'consciousness',
      'observer',
      'the observer',
      'witness',
      'the witness',
      'metacognition',
      'attention',
      'insight',
      'presence',
      'self-awareness'
    ];
    const nearDigests = await Promise.all(
      nearAnswers.map((answer) => sha256Hex(`${answer}|${today}|${PEPPER}`))
    );

    if (digest === expected)
    {
      // Activate rainbow effect and persist across next two navigations
      activateRainbowWithPersistence(2);
      localStorage.setItem(storageKey, 'ok');
      setIsAuthorized(true);
      localStorage.removeItem(failKey);
      localStorage.removeItem(lockKey);
      setError(null);
      setLastFeedbackType(null);
      // Positive reinforcement: confetti + green affect overlay + smile
      setOverlayType('success');
      setOverlayMessage('Welcome to Musai');
      setIsOverlayVisible(true);
      setHasJustUnlocked(true);
      // Celebrate with party effect
      toggleParty();

      // Rainbow already activated above with persistence

      // Fade out overlay after a short transition window
      setTimeout(() => setIsOverlayVisible(false), 1800);

      // After unlocking, if there was a pending query/mode, navigate to MAIN_APP with it so the tool can execute
      try
      {
        const raw = sessionStorage.getItem('musai-pending-query');
        const { query = '', mode = '' } = raw ? JSON.parse(raw) : { };
        sessionStorage.removeItem('musai-pending-query');

        // Always navigate to MAIN_APP, defaulting to chat if no mode provided
        const params = new URLSearchParams();
        if (mode) params.set('mode', mode);
        if (query) params.set('q', query);
        // Flag to trigger Victory modal once inside the main app
        params.set('victory', '1');
        navigate(`${ROUTES.MAIN_APP}?${params.toString()}`, { replace: true, state: { switchToTab: mode || 'chat', initialQuery: query, justUnlocked: true } });
      }
      catch
      {
        // ignore
      }
    }
    else if (nearDigests.includes(digest))
    {
      // Do not increment fail count or lock; encourage human reflection
      activateRainbowWithPersistence(1);
      setOverlayType('near');
      const nearHeadings = [
        'You are close',
        'Nearly there',
        'On the threshold',
        'Almost in tune',
        'Within a breath'
      ];
      const headingIndex = Math.floor(Math.random() * nearHeadings.length);
      setOverlayMessage(nearHeadings[headingIndex]);
      setIsOverlayVisible(true);
      setTimeout(() => setIsOverlayVisible(false), 1200);
      setError('Very close — but you may need to look at this from a human perspective.\nIf you tried using an AI, you might miss the music in your code.\nCheck out seeingsharp.ca to read musings that might help.');
      setLastFeedbackType('near');
    }
    else
    {
      // Rainbow persistence only for real attempts
      activateRainbowWithPersistence(2);
      const nextCount = failCount + 1;
      localStorage.setItem(failKey, String(nextCount));
      // Negative reinforcement: brief red affect overlay (non-blocking)
      setOverlayType('failure');
      setIsOverlayVisible(true);
      setTimeout(() => setIsOverlayVisible(false), 1000);

      if (nextCount >= MAX_ATTEMPTS)
      {
        const until = Date.now() + LOCK_DURATION_MS;
        localStorage.setItem(lockKey, String(until));
      }

      setError("Nice try. Hint: Reflect like a mirror, then connect like insight. What bridges map and metaphor is the quiet awareness witnessing both.");
      setLastFeedbackType('failure');
    }
  };

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);

  // Bypass entirely when gate mode is off
  if (gateMode === 'off')
  {
    return (
      <>
        {children}
      </>
    );
  }

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-purple-50 via-background to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      {/* Temporal chroma overlays: very subtle day/month tints */}
      {(() => {
        const dayIndex = now.getDay();
        const dayTone = MUSAI_CHROMATIC_7[dayIndex % MUSAI_CHROMATIC_7.length];
        const month = now.getMonth();
        const monthPrimary = MUSAI_CHROMATIC_12[month % MUSAI_CHROMATIC_12.length];
        const monthSecondary = month === 8 ? MUSAI_CHROMATIC_12[9] : undefined; // Sep → Blue + Indigo

        const rgba = (hex: string, a: number) => {
          const full = hex.replace('#', '');
          const int = parseInt(full, 16);
          const r = (int >> 16) & 255;
          const g = (int >> 8) & 255;
          const b = int & 255;
          return `rgba(${r}, ${g}, ${b}, ${a})`;
        };

        return (
          <>
            {/* Day overlay */}
            <div
              className="pointer-events-none absolute inset-0 z-[1]"
              style={{
                background: `radial-gradient(circle at 20% 20%, ${rgba(dayTone.hex, 0.045)} 0%, transparent 45%)`
              }}
            />
            {/* Month overlay(s) */}
            <div
              className="pointer-events-none absolute inset-0 z-[1]"
              style={{
                background: `radial-gradient(circle at 80% 80%, ${rgba(monthPrimary.hex, 0.04)} 0%, transparent 55%)`
              }}
            />
            {monthSecondary && (
              <div
                className="pointer-events-none absolute inset-0 z-[1]"
                style={{
                  background: `radial-gradient(circle at 50% 90%, ${rgba(monthSecondary.hex, 0.035)} 0%, transparent 60%)`
                }}
              />
            )}
          </>
        );
      })()}
      {/* Main content: gate when not authorized; app children when authorized */}
      {!isAuthorized && (
        <Card className="relative z-[2] w-full max-w-4xl shadow-xl border-purple-200/40 dark:border-purple-900/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
            🜁 The Veil of Uncertainty
          </CardTitle>
          <CardDescription className="text-sm">
            {isLocked
              ? 'Too many attempts. Please wait for the timer to finish to try again.'
              : 'Private beta. Answer the riddle to pass beyond the veil.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Hidden hint for the inquisitive, inserted as a real HTML comment */}
          <DomComment
            text={
              `Ah… so you’re the curious type.\n` +
              `If you're reading the source, nice try — and respect.\n` +
              `Hint: to answer, reflect like a mirror and connect like insight.\n` +
              `Now, back to the riddle.`
            }
          />
          <div className="text-sm md:text-base text-muted-foreground mb-6 text-pretty">
            This is a private beta of Musai. Think of it as the <span className="font-semibold">Veil of Versions</span>: a threshold between what most see and what few are allowed to explore. Beyond lies an unfinished realm. Enter only if you are ready to help shape what comes next.
          </div>

          {/* Riddle panel */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-fuchsia-500/30 via-purple-500/30 to-cyan-500/30 blur" />
            <div className="relative rounded-2xl border border-purple-200/50 dark:border-purple-800/40 bg-background/70 dark:bg-gray-900/40 backdrop-blur-xl shadow-lg">
              <div className="px-6 md:px-8 py-6">
                <div className="uppercase tracking-[0.25em] text-[10px] md:text-xs text-purple-600 dark:text-purple-300 mb-3">The Gate speaks</div>

                <div className="space-y-6 font-serif text-lg md:text-xl leading-8 md:leading-9 text-foreground text-pretty">
                  <p className="first-letter:text-5xl first-letter:font-extrabold first-letter:leading-none first-letter:text-purple-600 dark:first-letter:text-purple-300 first-letter:mr-2">
                    Once upon a time, three souls stood together at the veil of uncertainty.
                    They peered through, confused, for they saw faint echoes of themselves reflected in the others.
                  </p>

                  <p>
                    The first spoke in a measured tone:<br/>
                    “Even in uncertainty, we can still map the terrain.<br/>
                    For now, we must hold our imaginings at bay until truth is certain.”
                  </p>

                  <p>
                    The second tilted their head and replied:<br/>
                    “But it is our imagining that lets us infer what might be.<br/>
                    Hold it too tightly, and we might miss the very metaphor that gives the truth its meaning.”
                  </p>

                  <p>
                    A hush fell, and eyes turned toward the third. They did not speak.
                    Yet through their gaze, a silent bridge formed between the others’ words.
                  </p>

                  <p>
                    Time passed. They still had no answers they could grip —
                    but they sensed a deeper understanding of their shared mystery.
                    Each time they spoke, the third connected them without uttering a sound.
                  </p>

                  <p>
                    At last, the third broke their silence — but not to them. They spoke to you.
                  </p>

                  <p>
                    “As you read this, you give it life. You are me in this story — the quiet awareness shaping their voices into something whole.
                    If I am you… then what are we to them?”
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground mt-6 mb-3">
            Type your answer below. The Gate listens not for noise, but for knowing.
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder={isLocked ? 'Locked — please wait for the timer' : 'Enter your answer'}
                value={input}
                onChange={(e) => { setInput(e.target.value); if (!hasTyped) setHasTyped(true); }}
                className="mystical-glow"
                disabled={isLocked}
                autoFocus
              />
              <Button type="submit" className="rounded-xl" disabled={isLocked}>Continue</Button>
            </div>

            {/* Insight box: appears when there is feedback (near or failure), styled as an inverse/reflection panel */}
            {(lastFeedbackType === 'near' || lastFeedbackType === 'failure') && (
              <div
                className={
                  `relative rounded-xl border px-4 py-3 text-xs md:text-sm transition-colors ` +
                  (lastFeedbackType === 'near'
                    ? 'border-amber-500/40 bg-amber-50/70 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200'
                    : 'border-red-500/40 bg-red-50/70 dark:bg-red-900/20 text-red-900 dark:text-red-200')
                }
              >
                <div className="absolute -inset-0.5 rounded-xl pointer-events-none"
                     style={{
                       background: lastFeedbackType === 'near'
                         ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))'
                         : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))'
                     }}
                />
                <div className="relative">
                  <div className="font-semibold mb-1">
                    {lastFeedbackType === 'near' ? 'You are close' : 'Try again'}
                  </div>
                  {lastFeedbackType === 'near'
                    ? (
                      <div className="text-xs md:text-sm">
                        <div>
                          Very close — but you may need to look at this from a human perspective.
                        </div>
                        <div className="mt-2">
                          If you tried using an AI, you might miss the music in your code.
                        </div>
                        <div className="mt-2">
                          Check out <a href="https://seeingsharp.ca" target="_blank" rel="noopener noreferrer" className="underline">seeingsharp.ca</a> to read musings that might help.
                        </div>
                      </div>
                    )
                    : (
                      <div className="whitespace-pre-line">
                        {error}
                      </div>
                    )
                  }
                </div>
              </div>
            )}

            {/* Discover More: randomly route to a Musai info page */}
            <div>
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={() => {
                  // Activate rainbow persistence when exploring
                  activateRainbowWithPersistence(2);
                  const targets = [
                    ROUTES.MEET_MUSAI,
                    ROUTES.NEUROSCIENCE,
                    ROUTES.FIND_YOUR_MUSE,
                    ROUTES.LOCAL_AI,
                    ROUTES.EYE_OF_MUSAI,
                    ROUTES.CODE_MUSAI_INFO,
                    ROUTES.THERAPY_MUSAI,
                    ROUTES.MEDICAL_MUSAI,
                    ROUTES.CAREER_MUSAI,
                    ROUTES.EMERGENT_NARRATIVE
                  ];
                  const index = Math.floor(Math.random() * targets.length);
                  navigate(targets[index]);
                }}
              >
                Discover More →
              </Button>
            </div>

            {!isLocked && failCount > 0 && (
              <div className="text-xs text-muted-foreground">
                Attempts: {failCount}/{MAX_ATTEMPTS}
              </div>
            )}

            {isLocked && (
              <div className="text-sm text-foreground">
                Locked for {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </div>
            )}

            {error && (
              <div className="text-xs text-muted-foreground">
                {error} Check out <a href="https://seeingsharp.ca" target="_blank" rel="noopener noreferrer" className="underline">seeingsharp.ca</a> to read musings that might help.
              </div>
            )}
          </form>
        </CardContent>
        </Card>
      )}

      {isAuthorized && (
        <div className="w-full h-full">
          {children}
        </div>
      )}

      {/* Preview unlock overlay */}
      {gateMode === 'preview' && !isAuthorized && (
        <div className="pointer-events-none fixed inset-0 z-[10002]">
          {/* Blackish fog for readability (fades in) */}
          <div
            className="absolute inset-0 transition-opacity duration-700"
            style={{ backgroundColor: 'rgba(0,0,0,0.72)', opacity: fogOn ? 1 : 0 }}
          />
          {/* Console typing overlay */}
          {previewPhase === 1 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-[92%] max-w-4xl rounded-xl bg-black/70 border border-emerald-400/20 p-7 shadow-2xl" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
                <div className="text-xs text-emerald-300/60 mb-3">musai://veil/console</div>
                <div className="space-y-2 text-2xl md:text-3xl lg:text-4xl leading-8 md:leading-9 lg:leading-[2.75rem] font-extrabold" style={{ color: '#39ff14' }}>
                  {consoleHistory.map((line, idx) => (
                    <div key={idx} className="whitespace-pre">{line}</div>
                  ))}
                  <div className="whitespace-pre">
                    {consoleText}
                    <span className="inline-block w-2 h-6 bg-emerald-300 align-middle ml-2 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Static override (brief) */}
          {previewPhase === 1 && staticOn && (
            <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.95 }}>
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.85)',
                  mixBlendMode: 'normal'
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 2px, transparent 3px, transparent 5px),\\\n                     repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 2px, transparent 4px)'
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.06), transparent 35%),\\\n                     radial-gradient(circle at 80% 70%, rgba(255,255,255,0.05), transparent 35%)'
                }}
              />
            </div>
          )}

          {/* Glyph flood overlay */}
          {previewPhase === 2 && (
            <div className="absolute inset-0">
              <div className="absolute inset-0 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2.5 p-4">
                {Array.from({ length: 192 }).map((_, i) =>
                {
                  const Icon = [MessageSquare, Search, Eye, Code, GraduationCap, Theater, TrendingUp, Heart, Stethoscope, Sparkles, Bot, Music][i % 12];
                  const tone = MUSAI_CHROMATIC_12[(i * 5) % MUSAI_CHROMATIC_12.length];
                  const size = 16 + ((i * 11) % 16);
                  const delay = ((i % 12) * 70) + (Math.floor(i / 12) * 45) + Math.floor(Math.random() * 140);
                  const matrixChars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789@#$%&*()_+-=[]{}|;:,.<>?';
                  const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
                  return (
                    <div key={i} className="relative flex items-center justify-center h-8 select-none">
                      {/* Veil text behind */}
                      <div
                        className="transition-opacity duration-500 text-[13px] md:text-[14px]"
                        style={{ color: 'rgba(99, 255, 179, 0.55)', opacity: floodOn ? 0.25 : 0.85, transitionDelay: `${delay}ms` }}
                      >
                        {char}
                      </div>
                      {/* Progressive symbol replacement */}
                      <div
                        className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
                        style={{ opacity: floodOn ? 1 : 0, transitionDelay: `${delay}ms` }}
                      >
                        <Icon style={{ color: tone.hex, width: size, height: size, filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.25))' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Affective overlays - above everything, including confetti */}
      {overlayType && (
        <div
          className="pointer-events-none fixed inset-0 z-[10001] flex items-center justify-center"
          style={{
            backgroundColor:
              overlayType === 'success'
                ? 'rgba(16, 185, 129, 0.25)'
                : overlayType === 'near'
                  ? 'rgba(245, 158, 11, 0.30)'
                  : 'rgba(239, 68, 68, 0.35)',
            opacity: isOverlayVisible ? 1 : 0,
            transition: 'opacity 700ms ease'
          }}
        >
          {overlayType === 'success' && (
            <div className="flex flex-col items-center gap-2">
              <div className="text-6xl md:text-7xl select-none">🙂</div>
              {overlayMessage && (
                <div className="text-lg md:text-xl font-semibold text-foreground select-none">
                  {overlayMessage}
                </div>
              )}
            </div>
          )}
          {overlayType === 'near' && (
            <div className="flex flex-col items-center gap-2">
              <div className="text-6xl md:text-7xl select-none">😮</div>
              <div className="text-lg md:text-xl font-semibold text-foreground select-none">
                {overlayMessage || 'You are close'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RiddleGate;


