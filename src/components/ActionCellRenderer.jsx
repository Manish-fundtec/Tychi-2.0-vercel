'use client';
import React from 'react';

export default function ActionCellRenderer(props) {
  const trade = props.data;
  const { onViewTrade, onDeleteTrade, canDelete } = props.context || {};

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 ActionCellRenderer Debug:', {
      hasContext: !!props.context,
      canDelete,
      tradeId: trade?.trade_id,
    });
  }, [props.context, canDelete, trade]);

  const handleView = () => {
    if (typeof onViewTrade === 'function') {
      onViewTrade(trade);
      return;
    }
    alert('No view handler provided.');
  };

  const handleDelete = () => {
    if (typeof onDeleteTrade === 'function') {
      onDeleteTrade(trade);
      return;
    }
    alert('No delete handler provided.');
  };

  // If canDelete is explicitly false, don't show delete button
  // If canDelete is undefined or null, default to true (backward compatibility for pages without permissions)
  // If canDelete is explicitly true, show button
  const showDelete = canDelete !== false;

  return (
    <div className="d-flex gap-2">
      <button className="btn btn-sm btn-outline-primary" onClick={handleView}>
        View
      </button>
      {showDelete && (
        <button className="btn btn-sm btn-danger" onClick={handleDelete}>
          Delete
        </button>
      )}
    </div>
  );
}