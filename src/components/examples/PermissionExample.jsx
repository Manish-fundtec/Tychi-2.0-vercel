'use client';

/**
 * Example component demonstrating how to use the permission system
 * This is a reference implementation - you can use these patterns in your actual pages
 */

import { usePermission } from '@/hooks/usePermission';
import { useFundAccess, useAccessibleFunds } from '@/hooks/usePermission';
import ProtectedRoute from '@/components/ProtectedRoute';
import FundSelector from '@/components/FundSelector';
import { Button, Card, CardBody, CardHeader, CardTitle, Alert } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

const PermissionExample = () => {
  const router = useRouter();
  
  // Example 1: Check individual permissions
  const canViewTrade = usePermission('trade', 'can_view');
  const canAddTrade = usePermission('trade', 'can_add');
  const canEditTrade = usePermission('trade', 'can_edit');
  const canDeleteTrade = usePermission('trade', 'can_delete');
  
  // Example 2: Check fund access
  const hasAccessToFund1 = useFundAccess(1);
  const accessibleFunds = useAccessibleFunds();
  
  return (
    <div className="p-4">
      <h2>Permission System Examples</h2>
      
      {/* Example 1: Conditional rendering based on permissions */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Example 1: Conditional Button Rendering</CardTitle>
        </CardHeader>
        <CardBody>
          {canViewTrade && (
            <Alert variant="success">You have view permission for Trade module</Alert>
          )}
          
          <div className="d-flex gap-2 mt-3">
            {canAddTrade && (
              <Button variant="primary">Add New Trade</Button>
            )}
            {canEditTrade && (
              <Button variant="warning">Edit Trade</Button>
            )}
            {canDeleteTrade && (
              <Button variant="danger">Delete Trade</Button>
            )}
            {!canViewTrade && (
              <Alert variant="warning">You don&apos;t have permission to view trades</Alert>
            )}
          </div>
        </CardBody>
      </Card>
      
      {/* Example 2: Protected Route Wrapper */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Example 2: Protected Route Component</CardTitle>
        </CardHeader>
        <CardBody>
          <ProtectedRoute module="trade" action="can_view">
            <Alert variant="info">
              This content is only visible if you have &apos;can_view&apos; permission for &apos;trade&apos; module.
              If you don&apos;t have permission, you&apos;ll be redirected to /403.
            </Alert>
          </ProtectedRoute>
        </CardBody>
      </Card>
      
      {/* Example 3: Fund Selector */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Example 3: Fund Selector (Permission-Based)</CardTitle>
        </CardHeader>
        <CardBody>
          <p>This selector only shows funds you have access to:</p>
          <FundSelector
            onChange={(fundId) => console.log('Selected fund:', fundId)}
            className="mb-3"
          />
          <p className="text-muted small">
            Accessible Fund IDs: {accessibleFunds.join(', ') || 'None'}
          </p>
        </CardBody>
      </Card>
      
      {/* Example 4: Table with conditional columns */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Example 4: Table with Conditional Columns</CardTitle>
        </CardHeader>
        <CardBody>
          <table className="table">
            <thead>
              <tr>
                <th>Trade ID</th>
                <th>Symbol</th>
                <th>Quantity</th>
                {canEditTrade && <th>Edit</th>}
                {canDeleteTrade && <th>Delete</th>}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>AAPL</td>
                <td>100</td>
                {canEditTrade && (
                  <td>
                    <Button size="sm" variant="warning">Edit</Button>
                  </td>
                )}
                {canDeleteTrade && (
                  <td>
                    <Button size="sm" variant="danger">Delete</Button>
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </CardBody>
      </Card>
      
      {/* Example 5: Fund Access Check */}
      <Card>
        <CardHeader>
          <CardTitle>Example 5: Fund Access Check</CardTitle>
        </CardHeader>
        <CardBody>
          <p>Has access to Fund ID 1: {hasAccessToFund1 ? 'Yes' : 'No'}</p>
          <p>Total accessible funds: {accessibleFunds.length}</p>
        </CardBody>
      </Card>
    </div>
  );
};

export default PermissionExample;
