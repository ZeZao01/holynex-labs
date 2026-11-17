/**
 * Modal dialog. Centered card on desktop, bottom sheet on mobile (<640px). Esc and scrim click close.
 * @startingPoint section="Feedback" subtitle="Dialog, toast, tooltip" viewport="700x420"
 */
export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Lucide icon in a violet-50 tile at the left of the title */
  icon?: string;
  /** Right-aligned actions row (Buttons) */
  footer?: React.ReactNode;
  /** sm 400 · md 520 · lg 720 */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}
export declare function Dialog(props: DialogProps): JSX.Element | null;
