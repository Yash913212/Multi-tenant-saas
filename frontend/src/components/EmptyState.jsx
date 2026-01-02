import React from 'react';

const EmptyState = ({ title = 'Nothing here yet', subtitle = 'Try adjusting your filters or create a new item.' }) => (
  <div className="empty">
    <h4>{title}</h4>
    <p>{subtitle}</p>
  </div>
);

export default EmptyState;
