'use client';
import React from 'react';

export default function ActionCellRenderer(props) {
  const trade = props.data;
  const { onViewTrade, onDeleteTrade, latestTradeId } = props.context || {};

  const isLatest = latestTradeId && trade?.trade_id === latestTradeId;

  const handleView = () => {
    if (typeof onViewTrade === 'function') {
      onViewTrade(trade);
      return;
    }
    alert('No view handler provided.');
  };

  const handleDelete = () => {
    if (!isLatest) {
      alert('Only the latest trade can be deleted.');
      return;
    }
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
      <button
        className="btn btn-sm btn-danger"
        onClick={handleDelete}
        disabled={!isLatest}
        title={!isLatest ? 'Only the latest trade can be deleted' : 'Delete this trade'}>
        Delete
      </button>
    </div>
  );
}