import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  text: string;
};

export function FeatureCard({ icon: Icon, title, text }: FeatureCardProps) {
  return (
    <article className="mkt-feature-card">
      <Icon aria-hidden="true" />
      <strong>{title}</strong>
      <p>{text}</p>
    </article>
  );
}
