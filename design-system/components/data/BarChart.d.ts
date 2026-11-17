/** Column chart. With `down` values it renders the diverging in/out "cashflow" style (ink up, violet down); without, plain columns. Fluid width. */
export interface BarDatum { label: string; up: number; down?: number }
export interface BarChartProps {
  data: BarDatum[];
  /** Plot height in px (default 200) */
  height?: number;
  /** Legend labels [up, down] */
  series?: [string, string?];
  /** Axis/tooltip formatter */
  format?: (v: number) => React.ReactNode;
  ticks?: number[];
  /** Index shown highlighted with tooltip when not hovering */
  highlight?: number;
  onHighlight?: (i: number) => void;
  showLegend?: boolean;
  className?: string;
}
export declare function BarChart(props: BarChartProps): JSX.Element;
