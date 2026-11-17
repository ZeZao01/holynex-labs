/** Checkbox with optional label/description; supports indeterminate (table "select all"). */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  indeterminate?: boolean;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
