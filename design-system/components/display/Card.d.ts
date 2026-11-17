/**
 * The dashboard tile: white, hairline border, 16px radius, optional title row with actions.
 * @startingPoint section="Display" subtitle="Cards, KPIs, badges, chips, avatars, progress" viewport="700x520"
 */
export interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Right side of the header — period Select, IconButtons, links */
  actions?: React.ReactNode;
  /** default = white · sunken = grey inner tile · brand = violet hero · inverse = ink */
  variant?: 'default' | 'sunken' | 'brand' | 'inverse';
  /** none 0 · sm 12 · md 16 (mobile) → 20 (desktop) · lg 24 */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'section' | 'div' | 'article';
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function Card(props: CardProps): JSX.Element;
