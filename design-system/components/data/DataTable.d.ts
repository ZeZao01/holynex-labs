/**
 * Responsive data table. Full table when the container is ≥ 520px wide; below that each row becomes a stacked card (primary column as title, trailing column at right, the rest as key/value pairs).
 * @startingPoint section="Data" subtitle="Table, bar / area / donut charts" viewport="700x560"
 */
export interface DataTableColumn<R = any> {
  key: string;
  header: React.ReactNode;
  render?: (row: R) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  sortable?: boolean;
  /** Title of the mobile card (defaults to first column) */
  primary?: boolean;
  /** Shown at the right of the mobile card head (amount, status) */
  trailing?: boolean;
  /** Omit from the mobile card body */
  hideOnMobile?: boolean;
}
export interface DataTableProps<R = any> {
  columns: DataTableColumn<R>[];
  rows: R[];
  /** Row id field or getter. Default "id" */
  rowKey?: string | ((row: R) => string | number);
  selectable?: boolean;
  selected?: Array<string | number>;
  onSelectChange?: (keys: Array<string | number>) => void;
  sort?: { key: string; dir: 'asc' | 'desc' };
  onSortChange?: (sort: { key: string; dir: 'asc' | 'desc' }) => void;
  onRowClick?: (row: R) => void;
  empty?: React.ReactNode;
  /** sm 44px rows · md 56px rows */
  density?: 'sm' | 'md';
  className?: string;
}
export declare function DataTable(props: DataTableProps): JSX.Element;
