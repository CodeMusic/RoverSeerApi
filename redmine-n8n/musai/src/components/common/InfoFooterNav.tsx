import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';
import { MUSAI_CHROMATIC_12 } from '@/config/constants';
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
  TrendingUp
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
    { route: ROUTES.TASK_MUSAI, label: 'TaskMusai', Icon: Bot },
    { route: ROUTES.CAREER_MUSAI, label: 'CareerMusai', Icon: TrendingUp },
  ];

  const selected = cognitiveDestinations.find((d) => d.route === currentRoute);
  const others = cognitiveDestinations.filter((d) => d.route !== currentRoute);

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
        {selected && (
          <div className="justify-start h-auto py-4 px-4 border-2 text-left whitespace-normal break-words rounded-md bg-sidebar-accent/40 border-border/50 text-foreground/80 cursor-default flex items-center">
            <selected.Icon className="w-4 h-4 mr-2 mt-0.5" />
            <span className="font-semibold">{selected.label} (current)</span>
          </div>
        )}
        {(() => {
          const toRgb = (hex: string) => {
            const n = hex.replace('#', '');
            const v = parseInt(n.length === 3 ? n.split('').map(c => c + c).join('') : n, 16);
            return [(v >> 16) & 255, (v >> 8) & 255, v & 255] as const;
          };
          const rgba = (hex: string, a: number) => {
            const [r, g, b] = toRgb(hex);
            return `rgba(${r}, ${g}, ${b}, ${a})`;
          };
          const count = others.length;
          const last = MUSAI_CHROMATIC_12.length - 1;
          const indices = Array.from({ length: count }, (_, i) => Math.round((i * last) / (count - 1)));
          const duals = new Set([1, 3, 7, 10]);
          return others.map(({ route, label, Icon }, i) => {
            const idx = Math.min(last, indices[i] || 0);
            const tone = MUSAI_CHROMATIC_12[idx];
            const border = duals.has(idx)
              ? `linear-gradient(90deg, ${rgba(MUSAI_CHROMATIC_12[idx - 1]?.hex || tone.hex, 0.18)}, ${rgba(MUSAI_CHROMATIC_12[idx + 1]?.hex || tone.hex, 0.18)})`
              : rgba(tone.hex, 0.18);
            const iconColor = duals.has(idx) ? rgba(MUSAI_CHROMATIC_12[idx + 1]?.hex || tone.hex, 0.7) : rgba(tone.hex, 0.7);
            return (
              <div key={route} className="rounded-md p-px" style={{ background: border }}>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4 px-4 border-0 text-left whitespace-normal break-words w-full rounded-md"
                  onClick={() => navigate(route)}
                >
                  <Icon className="w-4 h-4 mr-2 mt-0.5" style={{ color: iconColor }} />
                  <span className="font-medium">{label}</span>
                </Button>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}

export default InfoFooterNav;


