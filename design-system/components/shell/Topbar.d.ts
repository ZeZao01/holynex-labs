/** Page header bar: (hamburger) · title + subtitle · search (collapses to icon < 768px) · actions · avatar. */
export interface TopbarProps {
  title?: React.ReactNode;
  /** One-line page description under the title (hidden < 640px) */
  subtitle?: React.ReactNode;
  /** Slot above the title (Breadcrumb) */
  leading?: React.ReactNode;
  search?: { placeholder?: string; kbd?: string[]; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void };
  /** IconButtons etc. */
  actions?: React.ReactNode;
  user?: { name: string; avatar?: string; status?: 'online' | 'away' | 'offline'; onClick?: () => void };
  /** Shows the hamburger (< 1024px only) */
  onMenuClick?: () => void;
  /** Mobile search icon */
  onSearchClick?: () => void;
  className?: string;
}
export declare function Topbar(props: TopbarProps): JSX.Element;
