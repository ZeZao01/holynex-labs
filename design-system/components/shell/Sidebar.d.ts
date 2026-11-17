/**
 * App navigation column. Static 248px column ≥1024px (optional 76px icon rail via `collapsed`); off-canvas drawer with scrim below 1024px, driven by `open`/`onClose`.
 * @startingPoint section="Shell" subtitle="Sidebar, topbar and mobile bottom nav" viewport="700x520"
 */
export interface SidebarItem { id: string; label: string; /** Lucide icon */ icon: string; badge?: React.ReactNode }
export interface SidebarSection { title?: string; items: SidebarItem[] }
export interface SidebarProps {
  brand?: { logo?: string; name?: string };
  account?: { name: string; subtitle?: string; avatar?: string; onClick?: () => void };
  sections: SidebarSection[];
  activeId?: string;
  onNavigate?: (id: string) => void;
  /** Bottom slot — upgrade card, storage meter */
  footer?: React.ReactNode;
  /** Mobile drawer open state */
  open?: boolean;
  onClose?: () => void;
  /** Desktop icon-only rail */
  collapsed?: boolean;
  className?: string;
}
export declare function Sidebar(props: SidebarProps): JSX.Element;
