'use client';
import { Button } from 'react-bootstrap';
import { usePermission } from '@/hooks/usePermission';

/**
 * Permission-based Button Component
 * Automatically hides/disables button based on user permissions
 * 
 * Usage:
 *   <PermissionButton
 *     module="trade"
 *     permission="can_add"
 *     variant="primary"
 *     onClick={handleAdd}
 *   >
 *     Add Trade
 *   </PermissionButton>
 */
export const PermissionButton = ({
  module,
  permission = 'can_view', // 'can_view', 'can_add', 'can_update', 'can_delete'
  variant = 'primary',
  disabled = false,
  hidden = false, // If true, button won't render at all if no permission
  children,
  onClick,
  ...props
}) => {
  const { hasPermission, loading } = usePermission(module);

  // Map permission types
  const permType = permission === 'can_edit' ? 'can_update' : permission;

  // If loading, show button as disabled
  if (loading) {
    return (
      <Button variant={variant} disabled {...props}>
        {children}
      </Button>
    );
  }

  // Check if user has the required permission
  const hasRequiredPermission = hasPermission(permType);

  // If hidden mode and no permission, don't render
  if (hidden && !hasRequiredPermission) {
    return null;
  }

  // If not hidden, show button but disable it
  return (
    <Button
      variant={variant}
      disabled={!hasRequiredPermission || disabled}
      onClick={hasRequiredPermission ? onClick : undefined}
      {...props}
    >
      {children}
    </Button>
  );
};

/**
 * Permission-based Action Buttons Group
 * Shows Add, Edit, Delete buttons based on permissions
 * 
 * Usage:
 *   <PermissionActionButtons
 *     module="trade"
 *     onAdd={handleAdd}
 *     onEdit={handleEdit}
 *     onDelete={handleDelete}
 *   />
 */
export const PermissionActionButtons = ({
  module,
  onAdd,
  onEdit,
  onDelete,
  addLabel = 'Add',
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  addVariant = 'primary',
  editVariant = 'warning',
  deleteVariant = 'danger',
  showLabels = true,
  className = '',
  ...props
}) => {
  const { canAdd, canEdit, canDelete, loading } = usePermission(module);

  if (loading) {
    return (
      <div className={`d-flex gap-2 ${className}`}>
        <Button variant={addVariant} disabled>{addLabel}</Button>
        <Button variant={editVariant} disabled>{editLabel}</Button>
        <Button variant={deleteVariant} disabled>{deleteLabel}</Button>
      </div>
    );
  }

  return (
    <div className={`d-flex gap-2 ${className}`} {...props}>
      {canAdd && (
        <Button variant={addVariant} onClick={onAdd}>
          {showLabels && addLabel}
        </Button>
      )}
      {canEdit && (
        <Button variant={editVariant} onClick={onEdit}>
          {showLabels && editLabel}
        </Button>
      )}
      {canDelete && (
        <Button variant={deleteVariant} onClick={onDelete}>
          {showLabels && deleteLabel}
        </Button>
      )}
    </div>
  );
};
