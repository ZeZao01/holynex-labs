/** Transient notification. Place in a fixed stack (bottom-right desktop, top on mobile). */
export interface ToastProps {
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Inline action (small Button / link) */
  action?: React.ReactNode;
  onClose?: () => void;
  /** Override the tone's default Lucide icon */
  icon?: string;
  className?: string;
}
export declare function Toast(props: ToastProps): JSX.Element;
