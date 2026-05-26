type PricingCardProps = {
  name: string;
  price: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
  badge?: string;
};

export function PricingCard({ name, price, features, cta, href, highlighted, badge }: PricingCardProps) {
  return (
    <article className={`mkt-pricing-card ${highlighted ? "is-highlighted" : ""}`}>
      {badge ? <em>{badge}</em> : null}
      <span>{name}</span>
      <strong>{price}</strong>
      <ul>
        {features.map((feature) => <li key={feature}>{feature}</li>)}
      </ul>
      <a className={`mkt-price-cta ${highlighted ? "mkt-button primary" : "mkt-button secondary"}`} href={href}>{cta}</a>
    </article>
  );
}
