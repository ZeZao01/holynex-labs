/** Compact status / delta pill. */
export interface BadgeProps {
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
  /** soft (tinted bg, default) · solid · outline */
  variant?: 'soft' | 'solid' | 'outline';
  /** Leading status dot */
  dot?: boolean;
  /** Lucide icon name, e.g. "trending-up" */
  icon?: string;
  className?: string;
  children?: React.ReactNode;
}
export declare function Badge(props: BadgeProps): JSX.Element;
