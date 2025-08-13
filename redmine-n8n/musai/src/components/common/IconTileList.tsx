import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  computeToneIndices,
  getNeighborTones,
  getToneByIndex,
  hexToRgba,
  isDualValenceIndex,
} from '@/utils/chroma';
import { MUSAI_CHROMATIC_12 } from '@/config/constants';

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export type IconTileItem = {
  to: string;
  label: string;
  Icon: IconType;
};

type IconTileListProps = {
  items: IconTileItem[];
  className?: string;
  onItemClick?: (item: IconTileItem, index: number) => void;
  minItemHeight?: number; // px
  dense?: boolean; // slightly smaller paddings
  gridClassName?: string; // override grid template classes
};

/**
 * A compact, footer-style icon+label tile list with consistent chromatic mapping.
 * Optimized for iPhone: no overflow, large touch targets, and reduced blur.
 */
export function IconTileList(props: IconTileListProps)
{
  const { items, className, onItemClick, minItemHeight = 56, dense = false, gridClassName } = props;
  const navigate = useNavigate();

  if (items.length === 0)
  {
    return null;
  }

  const toneIndices = computeToneIndices(items.length, MUSAI_CHROMATIC_12.length);

  return (
    <div className={className || ''}>
      <div className={`${gridClassName || 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-3 w-full items-stretch`}>
        {items.map(({ to, label, Icon }, i) =>
        {
          const paletteIndex = toneIndices[i] ?? 0;
          const tone = getToneByIndex(paletteIndex);
          const { previous, next } = getNeighborTones(paletteIndex);
          const isDual = isDualValenceIndex(paletteIndex);

          const border = isDual
            ? `linear-gradient(90deg, ${hexToRgba(previous.hex, 0.18)}, ${hexToRgba(next.hex, 0.18)})`
            : hexToRgba(tone.hex, 0.18);

          return (
            <div
              key={to}
              className="rounded-md p-px w-full h-full"
              style={{ background: border, minHeight: `${minItemHeight}px` }}
            >
              <Button
                variant="outline"
                className={`relative overflow-hidden justify-start h-auto ${dense ? 'py-3' : 'py-4'} px-4 text-left whitespace-normal break-words w-full rounded-md border-0 bg-background/80 h-full`}
                onClick={() => {
                  if (onItemClick)
                  {
                    onItemClick({ to, label, Icon }, i);
                    return;
                  }
                  navigate(to);
                }}
                aria-label={label}
                style={{ minHeight: `${minItemHeight - 2}px` }}
              >
                <Icon
                  className={`w-4 h-4 mr-2 mt-0.5 ${isDual ? 'dual-color-phase' : ''}`}
                  style={isDual ? { ['--phase-color-a' as any]: tone.hex, ['--phase-color-b' as any]: next.hex } : { color: hexToRgba(tone.hex, 0.7) }}
                />
                <span className="font-medium leading-snug">{label}</span>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default IconTileList;


