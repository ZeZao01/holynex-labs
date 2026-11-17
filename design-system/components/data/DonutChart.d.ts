/** Segmented ring with center total and percentage legend. */
export interface DonutSegment { label: string; value: number; color?: string }
export interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  /** Gap between segments in px */
  gap?: number;
  /** Small caption in the center */
  label?: React.ReactNode;
  /** Big center value */
  value?: React.ReactNode;
  legend?: boolean;
  format?: (v: number) => React.ReactNode;
  className?: string;
}
export declare function DonutChart(props: DonutChartProps): JSX.Element;
