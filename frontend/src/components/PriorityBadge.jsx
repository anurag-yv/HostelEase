import React from 'react';

const priorityConfig = {
  LOW: { label: 'Low', className: 'badge-low' },
  MEDIUM: { label: 'Medium', className: 'badge-medium' },
  HIGH: { label: 'High', className: 'badge-high' },
  CRITICAL: { label: 'Critical', className: 'badge-critical' },
};

export const PriorityBadge = ({ priority }) => {
  const config = priorityConfig[priority] || { label: priority, className: 'bg-secondary' };
  return (
    <span className={`badge ${config.className} px-2 py-1`}>
      {config.label}
    </span>
  );
};
