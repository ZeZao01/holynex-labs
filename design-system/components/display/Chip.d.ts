/** Filter / suggestion pill. Clickable when onClick is given; removable with onRemove. */
export interface ChipProps {
  selected?: boolean;
  /** Lucide icon name */
  icon?: string;
  onClick?: (e: React.MouseEvent) => void;
  onRemove?: (e: React.MouseEvent) => void;
  /** sm 24px · md 28px */
  size?: 'sm' | 'md';
  className?: string;
  children?: React.ReactNode;
}
export declare function Chip(props: ChipProps): JSX.Element;
