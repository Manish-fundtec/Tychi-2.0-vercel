'use client';
import React from 'react';

export default function ActionCellRenderer(props) {
  const trade = props.data;
  const { onViewTrade, onDeleteTrade, canDelete } = props.context || {};

  // Immediate debug log to verify component is being called
  console.log('🔍 ActionCellRenderer Rendered:', {
    hasProps: !!props,
    hasData: !!trade,
    tradeId: trade?.trade_id,
    hasContext: !!props.context,
    canDelete,
  });

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 ActionCellRenderer Debug (useEffect):', {
      hasContext: !!props.context,
      canDelete,
      tradeId: trade?.trade_id,
      hasViewHandler: typeof onViewTrade === 'function',
      hasDeleteHandler: typeof onDeleteTrade === 'function',
    });
  }, [props.context, canDelete, trade, onViewTrade, onDeleteTrade]);

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

  // Show delete button only if canDelete is explicitly true
  // Hide button if canDelete is false, undefined, or null
  const showDelete = canDelete === true;

  // Always render View button, conditionally render Delete button
  // Ensure buttons are always visible for debugging
  if (!trade) {
    return <div>No trade data</div>
  }

  return (
    <div className="d-flex gap-2" style={{ minWidth: '150px' }}>
      <button 
        className="btn btn-sm btn-outline-primary" 
        onClick={handleView}
        style={{ minWidth: '60px' }}
      >
        View
      </button>
      {showDelete && (
        <button 
          className="btn btn-sm btn-danger" 
          onClick={handleDelete}
          style={{ minWidth: '60px' }}
        >
          Delete
        </button>
      )}
    </div>
  );
}