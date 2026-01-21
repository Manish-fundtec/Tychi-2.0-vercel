'use client';
import React from 'react';

export default function ActionCellRenderer(props) {
  const trade = props.data;
  const { onViewTrade, onDeleteTrade, canDelete = true } = props.context || {};

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

  return (
    <div className="d-flex gap-2">
      <button className="btn btn-sm btn-outline-primary" onClick={handleView}>
        View
      </button>
      {canDelete && (
        <button className="btn btn-sm btn-danger" onClick={handleDelete}>
          Delete
        </button>
      )}
    </div>
  );
}