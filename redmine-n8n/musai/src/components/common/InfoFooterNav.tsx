import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';
import { MUSAI_CHROMATIC_12 } from '@/config/constants';
import {
  computeToneIndices,
  getToneByIndex,
  getNeighborTones,
  hexToRgba,
  isDualValenceIndex,
} from '@/utils/chroma';
import {
  MessageSquare,
  Search,
  Eye,
  Code as CodeIcon,
  GraduationCap,
  Theater,
  Brain,
  Heart,
  Bot,
  TrendingUp,
  Sparkles,
  Music
} from 'lucide-react';

type InfoFooterNavProps = {
  currentRoute?: string;
};

/**
 * A consistent bottom navigator across info pages, guiding users to other main Musai pages.
 * Excludes the current page when `currentRoute` is provided.
 */
export function InfoFooterNav(props: InfoFooterNavProps)
{
  const navigate = useNavigate();
  const { currentRoute } = props;

  const cognitiveDestinations = [
    { route: ROUTES.MEET_MUSAI, label: 'MusaiChat', Icon: MessageSquare },
    { route: ROUTES.FIND_YOUR_MUSE, label: 'MusaiSearch', Icon: Search },
    { route: ROUTES.EYE_OF_MUSAI, label: 'The Eye of Musai', Icon: Eye },
    { route: ROUTES.CODE_MUSAI_INFO, label: 'CodeMusai', Icon: CodeIcon },
    { route: ROUTES.UNIVERSITY_INFO, label: 'Musai University', Icon: GraduationCap },
    { route: ROUTES.EMERGENT_NARRATIVE, label: 'MusaiTale', Icon: Theater },
    { route: ROUTES.MEDICAL_MUSAI, label: 'MedicalMusai', Icon: Brain },
    { route: ROUTES.THERAPY_MUSAI, label: 'TherapyMusai', Icon: Heart },
    { route: ROUTES.CAREER_MUSAI, label: 'CareerMusai', Icon: TrendingUp },
    { route: ROUTES.CURATIONS_INFO, label: 'MusaiCurations', Icon: Sparkles },
    { route: ROUTES.MUSAI_STUDIO_INFO, label: 'MusaiStudio', Icon: Music },
    { route: ROUTES.TASK_MUSAI, label: 'TaskMusai', Icon: Bot },
  ];

  const selectedRoute = currentRoute;
  const toneIndices = computeToneIndices(cognitiveDestinations.length, MUSAI_CHROMATIC_12.length);

  if (cognitiveDestinations.length === 0)
  {
    return null;
  }

  return (
    <div className="mt-12 border-t pt-8">
      <div className="text-center mb-4">
        <div className="text-sm text-muted-foreground">Explore other Musai main pages</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {cognitiveDestinations.map(({ route, label, Icon }, i) =>
        {
          const paletteIndex = toneIndices[i] ?? 0;
          const tone = getToneByIndex(paletteIndex);
          const { previous, next } = getNeighborTones(paletteIndex);
          const isDual = isDualValenceIndex(paletteIndex);

          const border = isDual
            ? `linear-gradient(90deg, ${hexToRgba(previous.hex, 0.18)}, ${hexToRgba(next.hex, 0.18)})`
            : hexToRgba(tone.hex, 0.18);

          const isCurrent = route === selectedRoute;

          if (isCurrent)
          {
            return (
              <div key={route} className="rounded-md p-px overflow-hidden" style={{ background: border }}>
                <Button
                  variant="outline"
                  disabled
                  className="justify-start h-auto py-4 px-4 border-0 text-left whitespace-normal break-words w-full rounded-md bg-sidebar-accent/50 cursor-default pointer-events-none"
                >
                  <Icon
                    className={`w-4 h-4 mr-2 mt-0.5 ${isDual ? 'dual-color-phase' : ''}`}
                    style={isDual ? { ['--phase-color-a' as any]: tone.hex, ['--phase-color-b' as any]: next.hex } : { color: hexToRgba(tone.hex, 0.7) }}
                  />
                  <span className="font-semibold">{label} (current)</span>
                </Button>
              </div>
            );
          }

          return (
            <div key={route} className="rounded-md p-px" style={{ background: border }}>
              <Button
                variant="outline"
                className="justify-start h-auto py-4 px-4 border-0 text-left whitespace-normal break-words w-full rounded-md"
                onClick={() => navigate(route)}
              >
                <Icon
                  className={`w-4 h-4 mr-2 mt-0.5 ${isDual ? 'dual-color-phase' : ''}`}
                  style={isDual ? { ['--phase-color-a' as any]: tone.hex, ['--phase-color-b' as any]: next.hex } : { color: hexToRgba(tone.hex, 0.7) }}
                />
                <span className="font-medium">{label}</span>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default InfoFooterNav;


