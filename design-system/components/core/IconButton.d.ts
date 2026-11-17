/** Icon-only button (toolbar, card actions, topbar). Always pass an accessible label. */
export interface IconButtonProps {
  /** Lucide icon name */
  icon: string;
  /** Accessible label + native tooltip */
  label: string;
  variant?: 'secondary' | 'ghost' | 'soft' | 'primary' | 'dark';
  /** sm 32 · md 40 · lg 48 */
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'square';
  /** Notification dot */
  dot?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
