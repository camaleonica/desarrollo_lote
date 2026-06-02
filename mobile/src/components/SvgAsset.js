import { View } from 'react-native';
import { svgAssets } from '../assets/svg';
import { HammerIcon } from './HammerIcon';

export function SvgAsset({ name, width, height, style, color }) {
  const Component = svgAssets[name];
  if (!Component) return null;

  return (
    <View style={style}>
      <Component width={width} height={height} color={color} />
    </View>
  );
}

export function AppLogo({ width = 120, height = 112 }) {
  return <HammerIcon width={width} height={height} variant="card" />;
}

export function BackIcon({ size = 24, color }) {
  const Icon = svgAssets.arrowBack;
  return <Icon width={size} height={size} color={color} />;
}
