type MetricCardProps = {
  value: string;
  label: string;
};

export function MetricCard({ value, label }: MetricCardProps) {
  return (
    <div className="mkt-metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
