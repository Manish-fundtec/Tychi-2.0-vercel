'use client'
import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { getAssetTypeColDefs } from '@/assets/tychiData/columnDefs'
import { useAssetTypeData } from '@/hooks/useAssetTypeData';
import { AssetTypeModal } from '@/app/(admin)/base-ui/modals/components/ConfigurationModal';
import { Modal, Button } from 'react-bootstrap';
import { useDashboardToken } from '@/hooks/useDashboardToken'
import { useUserToken } from '@/hooks/useUserToken'
import { getUserRolePermissions } from '@/helpers/getUserPermissions'
import { canModuleAction } from '@/helpers/permissionActions'

const AssetTypeTab = () => {
  const dashboard = useDashboardToken()
  const userToken = useUserToken()
  const fundId = dashboard?.fund_id
  
  // Permissions state
  const [permissions, setPermissions] = useState([])
  const [loadingPermissions, setLoadingPermissions] = useState(true)
  
  // Fetch user permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      const tokenData = dashboard || userToken
      
      if (!tokenData) {
        setLoadingPermissions(false)
        return
      }
      
      try {
        setLoadingPermissions(true)
        const perms = await getUserRolePermissions(tokenData, fundId)
        setPermissions(Array.isArray(perms) ? perms : [])
      } catch (error) {
        console.error('Error fetching permissions:', error)
        setPermissions([])
      } finally {
        setLoadingPermissions(false)
      }
    }
    
    fetchPermissions()
  }, [userToken, dashboard, fundId])
  
  // Permission checks for asset type module
  const canEdit = canModuleAction(permissions, ['configuration_asset_type', 'asset_type'], 'can_edit', fundId)
  const canDelete = canModuleAction(permissions, ['configuration_asset_type', 'asset_type'], 'can_delete', fundId)
  const canView = canModuleAction(permissions, ['configuration_asset_type', 'asset_type'], 'can_view', fundId)
  
  const { assetTypes, toggleAssetTypeStatus, checkAssetTypeHasSymbols, refetchAssetTypes } = useAssetTypeData();
  const [showModal, setShowModal] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [assetToDeactivate, setAssetToDeactivate] = useState(null);

  const handleToggle = async (row, willBeActive) => {
    if (willBeActive) {
      setSelectedAssetType(row); // Show modal only on activation
      setShowModal(true);
    } else {
      // Show confirmation modal for deactivation
      setAssetToDeactivate(row);
      setShowDeactivateModal(true);
    }
  };

  const handleConfirm = async () => {
    if (selectedAssetType) {
      await toggleAssetTypeStatus(selectedAssetType.assettype_id, 'Active');
      refetchAssetTypes(); // Simple refetch after activation
      setSelectedAssetType(null);
      setShowModal(false);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (assetToDeactivate) {
      // Check if asset type has associated symbols before deactivating
      const hasSymbols = await checkAssetTypeHasSymbols(assetToDeactivate.assettype_id);
      
      if (hasSymbols) {
        alert('Cannot deactivate asset type: This asset type is associated with symbols. Please delete or reassign the symbols first.');
        return; // Don't proceed with deactivation
      }
      
      // If no symbols, proceed with deactivation
      await toggleAssetTypeStatus(assetToDeactivate.assettype_id, 'Inactive');
      refetchAssetTypes(); // Simple refetch after deactivation
      setAssetToDeactivate(null);
      setShowDeactivateModal(false);
    }
  };

  const handleDeactivateCancel = () => {
    setAssetToDeactivate(null);
    setShowDeactivateModal(false);
  };

  return (
    <>
      <div className="ag-theme-alpine" style={{ width: '100%', height: '100%' }}>
        <AgGridReact
          rowData={assetTypes}
          columnDefs={getAssetTypeColDefs(handleToggle)}
          context={{ canEdit, canDelete, canView }}
          getRowId={(params) => params.data.assettype_id}
          defaultColDef={{ sortable: true, filter: true, resizable: true }}
          domLayout="autoHeight"
        />
      </div>

      <AssetTypeModal
        show={showModal}
        onClose={() => setShowModal(false)}
        assetType={selectedAssetType}
        onSuccess={handleConfirm}
      />

      {/* Deactivation Confirmation Modal */}
      <Modal show={showDeactivateModal} onHide={handleDeactivateCancel} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deactivation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to deactivate <strong>{assetToDeactivate?.assettype_name}</strong>?
          </p>
          <div className="alert alert-warning">
            <strong>Warning:</strong> This action will also delete all related Chart of Accounts seed data for this asset type. This action cannot be undone.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDeactivateCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeactivateConfirm}>
            Deactivate 
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AssetTypeTab;
