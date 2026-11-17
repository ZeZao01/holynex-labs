/** Native select styled as a HolyNex field. variant="pill" is the compact period filter ("Este mês ⌄") used in card headers. */
export interface SelectOption { value: string; label: string }
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  options: Array<string | SelectOption>;
  placeholder?: string;
  iconLeft?: string;
  size?: 'sm' | 'md' | 'lg';
  /** default · sunken · pill (compact rounded filter for card headers) */
  variant?: 'default' | 'sunken' | 'pill';
}
export declare function Select(props: SelectProps): JSX.Element;
