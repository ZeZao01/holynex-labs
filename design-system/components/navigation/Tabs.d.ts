/**
 * Tab switcher. underline = accent bar under active (in-card views) · segmented = grey track with white active pill (filters, period).
 * @startingPoint section="Navigation" subtitle="Tabs, segmented control, breadcrumb, pagination" viewport="700x300"
 */
export interface TabItem { id: string; label: React.ReactNode; icon?: string; /** Secondary text, e.g. "(R$ 4.800)" or a count */ meta?: React.ReactNode }
export interface TabsProps {
  items: Array<string | TabItem>;
  value: string;
  onChange?: (id: string) => void;
  variant?: 'underline' | 'segmented';
  size?: 'sm' | 'md';
  /** Stretch tabs to fill width (mobile) */
  fullWidth?: boolean;
  className?: string;
}
export declare function Tabs(props: TabsProps): JSX.Element;
