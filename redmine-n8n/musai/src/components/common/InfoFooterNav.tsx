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
  Music,
  Cpu,
  Map,
  Network
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

  const primaryDestinations = [
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
    { route: ROUTES.TASK_MUSAI, label: 'AgileMusai', Icon: Bot },
  ];
  const supportingDestinations = [
    { route: ROUTES.LOCAL_AI, label: 'Local AI Architecture', Icon: Cpu },
    { route: ROUTES.NEUROSCIENCE, label: 'The Neuroscience', Icon: Brain },
    { route: ROUTES.ROVERBYTE, label: 'Musai x RoverByte Integration', Icon: Network },
    { route: ROUTES.ROADMAP, label: 'Roadmap', Icon: Map },
  ];

  const selectedRoute = currentRoute;
  const toneIndicesPrimary = computeToneIndices(primaryDestinations.length, MUSAI_CHROMATIC_12.length);
  const toneIndicesSupporting = computeToneIndices(supportingDestinations.length, MUSAI_CHROMATIC_12.length);

  if (primaryDestinations.length === 0)
  {
    return null;
  }

  return (
    <div className="mt-12 border-t pt-8">
      <div className="text-center mb-4">
        <div className="text-sm text-muted-foreground">Explore other Musai main pages</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {primaryDestinations.map(({ route, label, Icon }, i) =>
        {
          const paletteIndex = toneIndicesPrimary[i] ?? 0;
          const tone = getToneByIndex(paletteIndex);
          const { previous, next } = getNeighborTones(paletteIndex);
          const isDual = isDualValenceIndex(paletteIndex);

          // Darken borders for lighter tones (yellow/green family) to increase contrast
          const needsDarker = (hex: string) => {
            const h = hex.toUpperCase();
            return h === '#FFD400' /* Yellow */ || h === '#9ACD32' /* Yellow-Green */ || h === '#16A34A' /* Green */;
          };
          const alphaFor = (hex: string) => (needsDarker(hex) ? 0.28 : 0.18);

          const border = isDual
            ? `linear-gradient(90deg, ${hexToRgba(previous.hex, alphaFor(previous.hex))}, ${hexToRgba(next.hex, alphaFor(next.hex))})`
            : hexToRgba(tone.hex, alphaFor(tone.hex));

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
              <div key={route} className="rounded-md p-px overflow-hidden" style={{ background: border }}>
              <Button
                variant="outline"
                className="justify-start items-center h-14 px-4 border-0 text-left whitespace-nowrap w-full rounded-md"
                onClick={() => navigate(route)}
              >
                <Icon
                  className={`w-4 h-4 mr-2 mt-0.5 ${isDual ? 'dual-color-phase' : ''}`}
                  style={isDual ? { ['--phase-color-a' as any]: tone.hex, ['--phase-color-b' as any]: next.hex } : { color: hexToRgba(tone.hex, 0.7) }}
                />
                <span className="font-medium truncate" title={label}>{label}</span>
              </Button>
            </div>
          );
        })}
      </div>
      {/* Supporting section */}
      <div className="text-center mb-2 mt-8">
        <div className="text-sm text-muted-foreground">Supporting</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {supportingDestinations.map(({ route, label, Icon }, i) =>
        {
          const paletteIndex = toneIndicesSupporting[i] ?? 0;
          const tone = getToneByIndex(paletteIndex);
          const { previous, next } = getNeighborTones(paletteIndex);
          const isDual = isDualValenceIndex(paletteIndex);

          // Darken borders for lighter tones (yellow/green family) to increase contrast
          const needsDarker = (hex: string) => {
            const h = hex.toUpperCase();
            return h === '#FFD400' || h === '#9ACD32' || h === '#16A34A';
          };
          const alphaFor = (hex: string) => (needsDarker(hex) ? 0.28 : 0.18);

          const border = isDual
            ? `linear-gradient(90deg, ${hexToRgba(previous.hex, alphaFor(previous.hex))}, ${hexToRgba(next.hex, alphaFor(next.hex))})`
            : hexToRgba(tone.hex, alphaFor(tone.hex));

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
            <div key={route} className="rounded-md p-px overflow-hidden" style={{ background: border }}>
              <Button
                variant="outline"
                className="justify-start items-center h-14 px-4 border-0 text-left whitespace-nowrap w-full rounded-md"
                onClick={() => navigate(route)}
              >
                <Icon
                  className={`w-4 h-4 mr-2 mt-0.5 ${isDual ? 'dual-color-phase' : ''}`}
                  style={isDual ? { ['--phase-color-a' as any]: tone.hex, ['--phase-color-b' as any]: next.hex } : { color: hexToRgba(tone.hex, 0.7) }}
                />
                <span className="font-medium truncate" title={label}>{label}</span>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default InfoFooterNav;


