/** Progress / score indicator. bar = track+fill · split = ink fill + violet remainder with gap (score) · dots = 10-dot meter. */
export interface ProgressProps {
  value: number;
  max?: number;
  variant?: 'bar' | 'split' | 'dots';
  tone?: 'brand' | 'ink' | 'success' | 'warning' | 'danger';
  label?: React.ReactNode;
  showValue?: boolean;
  /** Number of dots for variant="dots" (default 10) */
  dots?: number;
  /** sm 6px · md 8px · lg 14px (bar thickness) */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
export declare function Progress(props: ProgressProps): JSX.Element;
