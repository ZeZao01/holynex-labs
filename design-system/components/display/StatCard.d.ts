/** KPI tile: icon + label, big value with unit, delta badge and footnote. variant="brand" is the violet hero KPI. */
export interface StatCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Small trailing unit, e.g. "BRL" */
  unit?: React.ReactNode;
  /** Number → auto-formatted ±x,x% with tone; string → shown as-is */
  delta?: number | string;
  deltaLabel?: React.ReactNode;
  /** Lucide icon name for the round icon tile */
  icon?: string;
  footnote?: React.ReactNode;
  /** Top-right slot (IconButton) */
  action?: React.ReactNode;
  /** default = sunken inner tile · card = white bordered · brand = violet hero */
  variant?: 'default' | 'card' | 'brand';
  className?: string;
  children?: React.ReactNode;
}
export declare function StatCard(props: StatCardProps): JSX.Element;
