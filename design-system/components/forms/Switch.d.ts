/** On/off toggle for settings that apply immediately. */
export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  /** sm 28×16 · md 36×20 */
  size?: 'sm' | 'md';
}
export declare function Switch(props: SwitchProps): JSX.Element;
