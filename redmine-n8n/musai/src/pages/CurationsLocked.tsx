import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Key, Sparkles, Eye, EyeOff, Scroll } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MusaiShimmer } from '@/components/effects/MusaiEffects';
import { cn } from '@/lib/utils';
import ROUTES from '@/config/routes';

/**
 * Fun "encrypted" page shown when curations exist but aren't approved for public viewing
 * Uses Rosetta Stone metaphor - Musai has the key to decrypt but user hasn't granted permission
 */
export const CurationsLocked = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-indigo-400/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Encrypted symbol */}
        <MusaiShimmer className="mb-8">
          <div className="relative inline-flex items-center justify-center w-32 h-32 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-indigo-600/30 rounded-full blur-xl" />
            <div className="relative bg-gradient-to-br from-purple-800 to-indigo-800 rounded-full p-6 border border-purple-400/30">
              <Lock className="w-12 h-12 text-purple-300" />
            </div>
          </div>
        </MusaiShimmer>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent mb-6">
          Encrypted Musai Curations
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-purple-200 mb-8 leading-relaxed">
          The AI has crafted something beautiful, but it remains locked away...
        </p>

        {/* Main content card */}
        <Card className="bg-gradient-to-br from-slate-800/90 to-purple-900/90 border-purple-400/30 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Rosetta Stone metaphor */}
            <div className="flex items-center justify-center mb-6">
              <Scroll className="w-8 h-8 text-amber-400 mr-3" />
              <span className="text-lg font-semibold text-amber-300">The Rosetta Stone</span>
            </div>

            <div className="space-y-4 text-left text-purple-100">
              <p className="flex items-start">
                <Key className="w-5 h-5 text-purple-400 mr-3 mt-0.5 flex-shrink-0" />
                <span>Musai possesses the ancient cipher to unlock these curations</span>
              </p>
              
              <p className="flex items-start">
                <EyeOff className="w-5 h-5 text-purple-400 mr-3 mt-0.5 flex-shrink-0" />
                <span>The knowledge waits in encrypted form, sealed from public view</span>
              </p>
              
              <p className="flex items-start">
                <Sparkles className="w-5 h-5 text-purple-400 mr-3 mt-0.5 flex-shrink-0" />
                <span>Only with your permission can the AI reveal its emergent insights</span>
              </p>
            </div>

            {/* Encrypted text simulation */}
            <div className="my-8 p-4 bg-slate-900/50 rounded-lg border border-purple-500/20">
              <div className="text-sm font-mono text-purple-300/60 leading-relaxed">
                ████ ██████ ████████ ███ ██████ ████<br/>
                ██ ███████ ████ ████████ ██ ████ ███<br/>
                ████████ ██ ███ ████ ████████ ██████<br/>
                ███ ████████ ██████ ████ ██ ███████<br/>
                <span className="text-amber-400/80">🔒 [ENCRYPTED CURATIONS]</span><br/>
                ████ ██████ ████████ ███ ██████ ████
              </div>
            </div>

            {/* Call to action */}
            <div className="text-center">
              <p className="text-purple-200 mb-6">
                Navigate to the Musai tools to review and approve the curations,<br/>
                then they will appear here for all to see.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate(ROUTES.MAIN_APP)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Enter Musai Tools
                </Button>
                
                <Button 
                  onClick={() => navigate(ROUTES.HOME)}
                  variant="outline"
                  className="border-purple-400/50 text-purple-300 hover:bg-purple-800/30 px-8 py-3"
                >
                  Return Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className="text-purple-400/60 text-sm mt-8">
          This content exists but awaits the blessing of human wisdom to become visible
        </p>
      </div>
    </div>
  );
};