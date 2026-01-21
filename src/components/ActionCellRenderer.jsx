'use client';
import React from 'react';

export default function ActionCellRenderer(props) {
  const trade = props.data;
  const { onViewTrade, onEditTrade, onDeleteTrade, canEdit, canDelete } = props.context || {};

  const handleView = () => {
    if (typeof onViewTrade === 'function') {
      onViewTrade(trade);
      return;
    }
    alert('No view handler provided.');
  };

  const handleEdit = () => {
    if (typeof onEditTrade === 'function') {
      onEditTrade(trade);
      return;
    }
    alert('No edit handler provided.');
  };

  const handleDelete = () => {
    if (typeof onDeleteTrade === 'function') {
      onDeleteTrade(trade);
      return;
    }
    alert('No delete handler provided.');
  };

  // Show edit button if canEdit is truthy (true, 1, 'true', etc.)
  // Show delete button if canDelete is truthy (true, 1, 'true', etc.)
  const showEdit = canEdit === true || canEdit === 1 || canEdit === '1' || canEdit === 'true';
  const showDelete = canDelete === true || canDelete === 1 || canDelete === '1' || canDelete === 'true';
  
  // Debug logging
  React.useEffect(() => {
    console.log('🔍 ActionCellRenderer - Permission Check:', {
      canEdit,
      canDelete,
      showEdit,
      showDelete,
      tradeId: trade?.trade_id,
    });
  }, [canEdit, canDelete, showEdit, showDelete, trade]);

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
      {showEdit && (
        <button 
          className="btn btn-sm btn-outline-warning" 
          onClick={handleEdit}
          style={{ minWidth: '60px' }}
        >
          Edit
        </button>
      )}
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