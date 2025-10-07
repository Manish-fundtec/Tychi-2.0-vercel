import React, { useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { getAssetTypeColDefs } from '@/assets/tychiData/columnDefs'
import { useAssetTypeData } from '@/hooks/useAssetTypeData';
import { AssetTypeModal } from '@/app/(admin)/base-ui/modals/components/ConfigurationModal';
import { Modal, Button } from 'react-bootstrap';

const AssetTypeTab = () => {
  const { assetTypes, toggleAssetTypeStatus } = useAssetTypeData();
  const [showModal, setShowModal] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState(null);
  const [fundId, setFundId] = useState(null);
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
      setSelectedAssetType(null);
      setShowModal(false);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (assetToDeactivate) {
      await toggleAssetTypeStatus(assetToDeactivate.assettype_id, 'Inactive');
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
          context={{}}
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
            Deactivate & Delete COA Data
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AssetTypeTab;
