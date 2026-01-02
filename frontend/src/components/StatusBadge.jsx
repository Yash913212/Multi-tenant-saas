import React from 'react';

const toneMap = {
  success: 'pill--success',
  warn: 'pill--warn',
  danger: 'pill--danger',
  info: 'pill--info',
  muted: 'pill--muted'
};

const statusTone = (value) => {
  const normalized = (value || '').toLowerCase();
  if (['active', 'completed', 'paid'].includes(normalized)) return 'success';
  if (['in_progress', 'in-progress', 'pending', 'draft'].includes(normalized)) return 'warn';
  if (['blocked', 'disabled', 'cancelled', 'archived'].includes(normalized)) return 'muted';
  if (['high', 'error', 'failed'].includes(normalized)) return 'danger';
  return 'info';
};

const StatusBadge = ({ value, tone }) => {
  const resolvedTone = tone || statusTone(value);
  return <span className={`pill ${toneMap[resolvedTone] || toneMap.info}`}>{value}</span>;
};

export default StatusBadge;
