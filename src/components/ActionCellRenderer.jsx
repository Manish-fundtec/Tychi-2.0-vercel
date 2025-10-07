'use client';
import React from 'react';
import { deleteTrade } from '@/lib/api/trades';

export default function ActionCellRenderer(props) {
  const trade = props.data;

  const onDelete = async () => {
    if (!trade?.trade_id) return;
    if (!confirm('Delete this trade?')) return;
    try {
      await deleteTrade(trade.trade_id);
      props.api.applyTransaction({ remove: [trade] }); // removes row from grid
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to delete trade');
    }
  };

  return (
    <button className="btn btn-sm btn-danger" onClick={onDelete}>
      Delete
    </button>
  );
}