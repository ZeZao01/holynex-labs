/** Text field with optional label, leading icon, keyboard hint and helper/error text. Doubles as the topbar search field. */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  /** Error message — also sets the error border */
  error?: string;
  /** Lucide icon name shown at the left (e.g. "search") */
  iconLeft?: string;
  /** Keyboard shortcut chips at the right, e.g. ["⌘","K"] */
  kbd?: string | string[];
  /** Trailing text, e.g. "BRL" */
  suffix?: React.ReactNode;
  /** sm 32 · md 40 · lg 48 */
  size?: 'sm' | 'md' | 'lg';
  /** sunken = grey fill, no border (composers, search inside cards) */
  variant?: 'default' | 'sunken';
}
export declare function Input(props: InputProps): JSX.Element;
