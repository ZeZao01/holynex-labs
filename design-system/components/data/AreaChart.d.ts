/** Smooth line + soft gradient fill with hover cursor and tooltip. Fluid width. */
export interface AreaChartProps {
  data: number[];
  labels?: string[];
  height?: number;
  /** Stroke/fill color (CSS). Default var(--accent) */
  color?: string;
  format?: (v: number) => React.ReactNode;
  /** Index highlighted when not hovering */
  highlight?: number;
  /** Optional dashed comparison series (e.g. previous period) */
  compare?: number[];
  className?: string;
}
export declare function AreaChart(props: AreaChartProps): JSX.Element;
