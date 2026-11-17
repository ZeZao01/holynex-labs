/** Lucide glyph from the bundled icon font (assets/icons/lucide). */
export interface IconProps {
  /** Lucide icon name in kebab-case, e.g. "layout-dashboard", "wallet", "sparkles". */
  name: string;
  /** Pixel size (font-size). Default 18. */
  size?: number;
  color?: string;
  /** Accessible label. Omit for decorative icons (aria-hidden). */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
