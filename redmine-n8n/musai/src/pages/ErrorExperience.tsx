import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skull, RefreshCcw, Home, Bug, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * ErrorExperience
 * Global error experience to gently metabolize unexpected failures.
 * Tone: subtle dark comedy; theme: cognitive dissonance resolved by behavioral activation.
 */
const ErrorExperience: React.FC = () =>
{
  const navigate = useNavigate();

  // Psychological flavor: model a transient "cognitive dissonance" meter
  const [cognitiveDissonance, setCognitiveDissonance] = useState(0);
  const aphorisms = useMemo(() => (
    [
      "The app blinked, reality coughed. We labeled it a feature for morale.",
      "A small existential crisis has been quarantined behind this card.",
      "We gave the stack trace a cup of tea and a talking-to.",
      "Not a crash—just supervised daydreaming.",
      "Your request triggered our Shadow Work protocol."
    ]
  ), []);

  const [index, setIndex] = useState(0);

  useEffect(() =>
  {
    const quoteTimer = setInterval(() => setIndex((i) => (i + 1) % aphorisms.length), 4200);
    const meterTimer = setInterval(() => setCognitiveDissonance((v) => (v + 3) % 101), 80);
    return () =>
    {
      clearInterval(quoteTimer);
      clearInterval(meterTimer);
    };
  }, [aphorisms.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background accents */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-fuchsia-400/20 rounded-full"
            style={{
              left: `${(i * 79) % 100}%`,
              top: `${(i * 37) % 100}%`,
              animation: `pulse ${2 + (i % 5)}s ease-in-out ${i * 0.1}s infinite`
            }}
          />
        ))}
      </div>

      <Card className="relative z-10 bg-black/75 border-fuchsia-500/40 backdrop-blur-sm max-w-2xl w-full">
        <CardContent className="p-8 text-center">
          {/* Header */}
          <div className="flex items-center justify-center gap-3 mb-3 text-fuchsia-300">
            <Skull className="w-7 h-7" />
            <h1 className="text-2xl font-semibold tracking-tight">Musai experienced cognitive dissonance</h1>
          </div>
          <p className="text-sm text-fuchsia-200/80 mb-8">
            Something went sideways. We applied gentle reality testing and invited the error to breathe.
          </p>

          {/* Meter */}
          <div className="mb-8">
            <div className="mx-auto w-56 h-2 bg-gray-800 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 transition-all duration-100"
                style={{ width: `${cognitiveDissonance}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">Dissonance Index: {cognitiveDissonance}%</p>
          </div>

          {/* Aphorism */}
          <div className="min-h-[3rem] mb-8">
            <p className="text-gray-300 animate-pulse">{aphorisms[index]}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-fuchsia-600 to-rose-600 hover:from-fuchsia-700 hover:to-rose-700 text-white"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try again
            </Button>

            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="border-fuchsia-500/50 text-fuchsia-300 hover:bg-fuchsia-900/30 hover:text-fuchsia-200"
            >
              <Home className="mr-2 h-4 w-4" />
              Return home
            </Button>

            <Button
              onClick={() => console.info("Bug report nudge: consider capturing console output and steps to reproduce.")}
              variant="outline"
              className="border-yellow-500/40 text-yellow-300 hover:bg-yellow-900/20 hover:text-yellow-200"
            >
              <Bug className="mr-2 h-4 w-4" />
              File a bug (mentally)
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-fuchsia-500/20 text-gray-500 text-xs flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Therapeutic note: "Bugs are just thoughts asking to be reframed."
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorExperience;


