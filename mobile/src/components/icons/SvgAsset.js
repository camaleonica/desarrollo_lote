import { View } from 'react-native';
import { svgAssets } from '../../assets/icons';

export function SvgAsset({ name, width, height, style, color }) {
  const Component = svgAssets[name];
  if (!Component) return null;

  return (
    <View style={style}>
      <Component width={width} height={height} color={color} />
    </View>
  );
}

export function BackIcon({ size = 24, color }) {
  const Icon = svgAssets.arrowBack;
  return <Icon width={size} height={size} color={color} />;
}
