import React from 'react';

const statusConfig = {
  PENDING: { label: 'Pending', className: 'badge-pending' },
  ASSIGNED: { label: 'Assigned', className: 'badge-assigned' },
  IN_PROGRESS: { label: 'In Progress', className: 'badge-in_progress' },
  RESOLVED: { label: 'Resolved', className: 'badge-resolved' },
  CLOSED: { label: 'Closed', className: 'badge-closed' },
};

export const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || { label: status, className: 'bg-secondary' };
  return (
    <span className={`badge ${config.className} px-2 py-1`}>
      {config.label}
    </span>
  );
};
