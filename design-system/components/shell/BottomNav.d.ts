/** Mobile tab bar (visible < 768px only), 4 items + optional raised center action. Respects safe-area inset. */
export interface BottomNavItem { id: string; label: string; icon: string }
export interface BottomNavProps {
  items: BottomNavItem[];
  activeId?: string;
  onNavigate?: (id: string) => void;
  /** Raised center button (e.g. Nex AI) */
  primary?: { icon: string; label: string; onClick?: () => void };
  className?: string;
}
export declare function BottomNav(props: BottomNavProps): JSX.Element;
