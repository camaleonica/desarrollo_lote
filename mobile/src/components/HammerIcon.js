import { svgAssets } from '../assets/svg';

const ICON_VIEWBOX = '185 203 293 272';

export function HammerIcon({ width = 90, height = 84, style, variant = 'hammer' }) {
  const HammerIconSvg = svgAssets.hammer;
  const Section1 = svgAssets.logoCard;

  if (variant === 'card') {
    return (
      <Section1
        width={width}
        height={height}
        viewBox={ICON_VIEWBOX}
        preserveAspectRatio="xMidYMid meet"
        style={style}
      />
    );
  }

  return (
    <HammerIconSvg
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      style={style}
    />
  );
}
