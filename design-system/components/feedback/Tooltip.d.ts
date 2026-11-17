/** Dark ink hint bubble on hover/focus. Keep labels under ~6 words. */
export interface TooltipProps {
  label: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  children: React.ReactNode;
}
export declare function Tooltip(props: TooltipProps): JSX.Element;
