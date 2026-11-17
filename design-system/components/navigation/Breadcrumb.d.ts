/** Slash-separated path. Parents grey, current page ink. */
export interface BreadcrumbItem { label: React.ReactNode; href?: string; onClick?: (e: React.MouseEvent) => void }
export interface BreadcrumbProps { items: BreadcrumbItem[]; className?: string }
export declare function Breadcrumb(props: BreadcrumbProps): JSX.Element;
