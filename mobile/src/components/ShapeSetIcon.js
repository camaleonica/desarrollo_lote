import { shapeVariants } from '../assets/svg';

const SHAPE_ASPECT = 75 / 67;

export function ShapeSetIcon({ variant = 'brown', size = 72 }) {
  const Icon = shapeVariants[variant] || shapeVariants.brown;
  return <Icon width={size} height={size * SHAPE_ASPECT} />;
}
