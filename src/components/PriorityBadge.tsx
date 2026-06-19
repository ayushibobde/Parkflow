import type { Priority } from "../types/incident";

interface PriorityBadgeProps {
  priority: Priority;
}

function PriorityBadge({ priority }: PriorityBadgeProps) {
  const className = `priority-badge priority-badge--${priority.toLowerCase()}`;

  return <span className={className}>{priority}</span>;
}

export default PriorityBadge;