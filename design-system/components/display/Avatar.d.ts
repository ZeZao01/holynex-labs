/** Circular user image with initials fallback and presence dot. */
export interface AvatarProps {
  src?: string;
  /** Full name — used for alt text and initials */
  name?: string;
  /** Pixel size. 24 table · 32 default · 40 account · 56 profile */
  size?: number;
  status?: 'online' | 'away' | 'offline';
  className?: string;
  style?: React.CSSProperties;
}
export declare function Avatar(props: AvatarProps): JSX.Element;
