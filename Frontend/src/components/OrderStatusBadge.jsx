import React from 'react';

const STATUS_CONFIG = {
  created: { label: 'Created', bg: '#e0f2fe', color: '#0369a1' },
  confirmed: { label: 'Confirmed', bg: '#dbeafe', color: '#1d4ed8' },
  picked_up: { label: 'Picked Up', bg: '#fef3c7', color: '#92400e' },
  in_transit: { label: 'In Transit', bg: '#fde68a', color: '#78350f' },
  out_for_delivery: { label: 'Out for Delivery', bg: '#d1fae5', color: '#065f46' },
  delivered: { label: 'Delivered', bg: '#bbf7d0', color: '#14532d' },
  failed: { label: 'Failed', bg: '#fee2e2', color: '#991b1b' },
};

export default function OrderStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, bg: '#f3f4f6', color: '#374151' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        background: config.bg,
        color: config.color,
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
}
