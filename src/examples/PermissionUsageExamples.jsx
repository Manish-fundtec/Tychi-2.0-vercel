/**
 * Permission Usage Examples
 * 
 * This file shows how to use permissions in your components
 * for menu filtering and action buttons (Add, Edit, Delete)
 */

'use client';
import { Button } from 'react-bootstrap';
import { usePermission, usePermissions } from '@/hooks/usePermission';
import { PermissionButton, PermissionActionButtons } from '@/components/PermissionButton';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { canAdd, canEdit, canDelete } from '@/config/menu-module-mapping';

// ============================================
// Example 1: Using usePermission Hook
// ============================================
export const Example1_UsePermissionHook = () => {
  const { canAdd, canEdit, canDelete, loading } = usePermission('trade');

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <div>
      <h3>Trade Actions</h3>
      {canAdd && (
        <Button variant="primary" onClick={() => console.log('Add trade')}>
          Add Trade
        </Button>
      )}
      {canEdit && (
        <Button variant="warning" onClick={() => console.log('Edit trade')}>
          Edit Trade
        </Button>
      )}
      {canDelete && (
        <Button variant="danger" onClick={() => console.log('Delete trade')}>
          Delete Trade
        </Button>
      )}
    </div>
  );
};

// ============================================
// Example 2: Using PermissionButton Component
// ============================================
export const Example2_PermissionButton = () => {
  return (
    <div>
      <h3>Using PermissionButton Component</h3>
      
      {/* Button will be hidden if user doesn't have permission */}
      <PermissionButton
        module="trade"
        permission="can_add"
        variant="primary"
        hidden={true} // Hide completely if no permission
        onClick={() => console.log('Add trade')}
      >
        Add Trade
      </PermissionButton>

      {/* Button will be disabled if user doesn't have permission */}
      <PermissionButton
        module="trade"
        permission="can_edit"
        variant="warning"
        hidden={false} // Show but disable if no permission
        onClick={() => console.log('Edit trade')}
      >
        Edit Trade
      </PermissionButton>

      {/* Delete button */}
      <PermissionButton
        module="trade"
        permission="can_delete"
        variant="danger"
        hidden={true}
        onClick={() => console.log('Delete trade')}
      >
        Delete Trade
      </PermissionButton>
    </div>
  );
};

// ============================================
// Example 3: Using PermissionActionButtons
// ============================================
export const Example3_ActionButtons = () => {
  return (
    <div>
      <h3>Using PermissionActionButtons</h3>
      <PermissionActionButtons
        module="trade"
        onAdd={() => console.log('Add')}
        onEdit={() => console.log('Edit')}
        onDelete={() => console.log('Delete')}
        addLabel="Add Trade"
        editLabel="Edit Trade"
        deleteLabel="Delete Trade"
      />
    </div>
  );
};

// ============================================
// Example 4: Multiple Modules
// ============================================
export const Example4_MultipleModules = () => {
  const { permissions, loading } = usePermissions(['trade', 'fund', 'pricing']);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h3>Multiple Module Permissions</h3>
      <div>
        <h4>Trade Module</h4>
        <Button disabled={!permissions.trade?.canAdd}>Add Trade</Button>
        <Button disabled={!permissions.trade?.canEdit}>Edit Trade</Button>
        <Button disabled={!permissions.trade?.canDelete}>Delete Trade</Button>
      </div>
      <div>
        <h4>Fund Module</h4>
        <Button disabled={!permissions.fund?.canAdd}>Add Fund</Button>
        <Button disabled={!permissions.fund?.canEdit}>Edit Fund</Button>
        <Button disabled={!permissions.fund?.canDelete}>Delete Fund</Button>
      </div>
    </div>
  );
};

// ============================================
// Example 5: In a Table/Grid with Row Actions
// ============================================
export const Example5_TableRowActions = ({ rowData }) => {
  const { canEdit, canDelete } = usePermission('trade');

  return (
    <table>
      <thead>
        <tr>
          <th>Trade ID</th>
          <th>Symbol</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rowData.map((row) => (
          <tr key={row.id}>
            <td>{row.id}</td>
            <td>{row.symbol}</td>
            <td>
              {canEdit && (
                <Button
                  size="sm"
                  variant="warning"
                  onClick={() => handleEdit(row.id)}
                >
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(row.id)}
                >
                  Delete
                </Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// ============================================
// Example 6: Conditional Rendering in Forms
// ============================================
export const Example6_ConditionalFormFields = () => {
  const { canAdd, canEdit } = usePermission('trade');
  const isEditMode = false; // Your logic here

  return (
    <form>
      <input type="text" placeholder="Trade Symbol" />
      
      {/* Show submit button only if user can add or edit */}
      {(canAdd || (isEditMode && canEdit)) && (
        <Button type="submit" variant="primary">
          {isEditMode ? 'Update Trade' : 'Create Trade'}
        </Button>
      )}
    </form>
  );
};

// ============================================
// Example 7: Using Direct Permission Check
// ============================================
export const Example7_DirectCheck = () => {
  const { permissions } = useUserPermissions();

  // Direct permission check without hook
  const canAddTrade = canAdd('trade', permissions);
  const canEditTrade = canEdit('trade', permissions);
  const canDeleteTrade = canDelete('trade', permissions);

  return (
    <div>
      <h3>Direct Permission Check</h3>
      {canAddTrade && <Button>Add Trade</Button>}
      {canEditTrade && <Button>Edit Trade</Button>}
      {canDeleteTrade && <Button>Delete Trade</Button>}
    </div>
  );
};

// ============================================
// Example 8: AG Grid Action Buttons
// ============================================
export const Example8_AGGridActions = () => {
  const { canAdd, canEdit, canDelete } = usePermission('trade');

  const columnDefs = [
    { field: 'id', headerName: 'ID' },
    { field: 'symbol', headerName: 'Symbol' },
    {
      field: 'actions',
      headerName: 'Actions',
      cellRenderer: (params) => {
        return (
          <div className="d-flex gap-1">
            {canEdit && (
              <Button
                size="sm"
                variant="warning"
                onClick={() => handleEdit(params.data.id)}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDelete(params.data.id)}
              >
                Delete
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      {canAdd && (
        <Button variant="primary" onClick={handleAdd}>
          Add New Trade
        </Button>
      )}
      {/* Your AG Grid component here */}
    </div>
  );
};

// Helper functions (these would be in your actual component)
const handleAdd = () => console.log('Add');
const handleEdit = (id) => console.log('Edit', id);
const handleDelete = (id) => console.log('Delete', id);
