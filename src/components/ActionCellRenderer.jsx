'use client';
import React from 'react';
import { canButtonAction } from '@/helpers/buttonPermissionMapping';

export default function ActionCellRenderer(props) {
  const trade = props.data;
  const { 
    onViewTrade, 
    onDeleteTrade, 
    canDelete, // Legacy support - direct boolean
    permissions, // New: permissions array
    moduleKey, // New: module key (e.g., 'trade', 'trades')
    fundId, // New: optional fund ID for permission filtering
  } = props.context || {};

  // Immediate debug log to verify component is being called
  console.log('🔍 ActionCellRenderer Rendered:', {
    hasProps: !!props,
    hasData: !!trade,
    tradeId: trade?.trade_id,
    hasContext: !!props.context,
    canDelete,
    hasPermissions: !!permissions,
    moduleKey,
    fundId,
  });

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 ActionCellRenderer Debug (useEffect):', {
      hasContext: !!props.context,
      canDelete,
      hasPermissions: !!permissions,
      moduleKey,
      fundId,
      tradeId: trade?.trade_id,
      hasViewHandler: typeof onViewTrade === 'function',
      hasDeleteHandler: typeof onDeleteTrade === 'function',
    });
  }, [props.context, canDelete, permissions, moduleKey, fundId, trade, onViewTrade, onDeleteTrade]);

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

  // Determine if delete button should be shown
  // Priority: 1) Legacy canDelete prop, 2) Permission-based check, 3) Default to true (backward compatibility)
  let showDelete = true;
  
  if (canDelete !== undefined) {
    // Legacy support: use canDelete prop if provided
    showDelete = canDelete !== false;
  } else if (permissions && Array.isArray(permissions) && permissions.length > 0 && moduleKey) {
    // New permission-based check using button mapping
    showDelete = canButtonAction(permissions, moduleKey, 'delete', fundId);
  }
  // If neither is provided, default to true (backward compatibility)

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