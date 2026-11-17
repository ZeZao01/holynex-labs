/**
 * Primary action control. Pill-shaped by default.
 * @startingPoint section="Core" subtitle="Buttons — primary, dark, secondary, soft, ghost, danger" viewport="700x330"
 */
export interface ButtonProps {
  /** primary = violet brand · dark = ink · secondary = white outlined · soft = violet tint · ghost = text-only · danger = destructive */
  variant?: 'primary' | 'dark' | 'secondary' | 'soft' | 'ghost' | 'danger';
  /** sm 32px · md 40px · lg 48px */
  size?: 'sm' | 'md' | 'lg';
  /** pill (default) or rounded (10px — for full-width form submits) */
  shape?: 'pill' | 'rounded';
  /** Lucide icon name before the label */
  iconLeft?: string;
  /** Lucide icon name after the label (e.g. "arrow-up-right") */
  iconRight?: string;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  href?: string;
  as?: 'button' | 'a';
  onClick?: (e: React.MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;
