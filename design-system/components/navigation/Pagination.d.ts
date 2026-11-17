/** Page navigator for tables. Numbers collapse with ellipses beyond 7 pages. */
export interface PaginationProps {
  page: number;
  pageCount: number;
  onChange?: (page: number) => void;
  /** Left text, e.g. "Mostrando 1–10 de 248" (hidden on mobile) */
  summary?: React.ReactNode;
  className?: string;
}
export declare function Pagination(props: PaginationProps): JSX.Element;
