import React from "react";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  description: string;
  trend: string;
  icon: LucideIcon;
}

function MetricCard({
  title,
  value,
  description,
  trend,
  icon: Icon,
}: MetricCardProps): React.ReactElement {
  return (
    <article className="metric-card">
      <div className="metric-card__header">
        <div className="metric-card__icon">
          <Icon size={20} />
        </div>

        <span className="metric-card__trend">{trend}</span>
      </div>

      <p className="metric-card__title">{title}</p>
      <strong className="metric-card__value">{value}</strong>
      <p className="metric-card__description">{description}</p>
    </article>
  );
}

export default MetricCard;
