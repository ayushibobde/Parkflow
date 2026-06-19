import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: string;
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className="metric-card__header">
        <div>
          <p className="metric-card__title">{title}</p>
          <h2 className="metric-card__value">{value}</h2>
        </div>

        <div className="metric-card__icon">
          <Icon size={22} />
        </div>
      </div>

      <div className="metric-card__footer">
        <span>{description}</span>

        {trend && <span className="metric-card__trend">{trend}</span>}
      </div>
    </article>
  );
}

export default MetricCard;