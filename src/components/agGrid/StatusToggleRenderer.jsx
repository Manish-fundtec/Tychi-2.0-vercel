import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const StatusToggleModal = ({ show, onClose, onConfirm }) => {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Activate Asset Type</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to <strong>activate</strong> this asset type?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="success" onClick={onConfirm}>Yes, Activate</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default StatusToggleModal;
