'use client';

import ComponentContainerCard from '@/components/ComponentContainerCard';
import useModal from '@/hooks/useModal';
import useToggle from '@/hooks/useToggle';
import { Tooltips } from '@/app/(admin)/forms/validation/components/AllFormValidation';
import { BrokerForm } from '@/app/(admin)/forms/validation/components/ConfigurationForm';
import { BankForm } from '@/app/(admin)/forms/validation/components/ConfigurationForm';
import { ExchangeForm } from '@/app/(admin)/forms/validation/components/ConfigurationForm';
import { SymbolForm } from '@/app/(admin)/forms/validation/components/ConfigurationForm';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap';
export const DefaultModal = () => {
  const {
    isTrue,
    toggle
  } = useToggle();
  return <ComponentContainerCard id="default" >
      <Button variant="primary" type="button" onClick={toggle}>
        Launch demo modal
      </Button>

      <Modal show={isTrue} onHide={toggle} className="fade" id="exampleModal" tabIndex={-1}>
        <ModalHeader>
          <h5 className="modal-title" id="exampleModalLabel">
            Modal title
          </h5>
          <button type="button" className="btn-close" onClick={toggle} />
        </ModalHeader>
        <ModalBody>
          <p>Woo-hoo, you&apos;re reading this text in a modal!</p>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={toggle}>
            Close
          </Button>
          <Button type="button" variant="primary">
            Save changes
          </Button>
        </ModalFooter>
      </Modal>
    </ComponentContainerCard>;
};

export const BadaModal = () => {
  const {
    isOpen,
    size,
    className,
    toggleModal,
    openModalWithSize
  } = useModal();
  return (
    <>
        <Button type="button" variant="primary" onClick={() => openModalWithSize('lg')}>
          Add
        </Button>
      

      <Modal className="fade" show={isOpen} onHide={toggleModal} dialogClassName={className} size={size} centered>
        <ModalHeader onHide={toggleModal} closeButton>
          <h5 className="modal-title h4" id="exampleModalXlLabel">
            Add Trades
          </h5>
        </ModalHeader>
        <ModalBody>
          <Tooltips />
        </ModalBody>
      </Modal>
      </>
  );
};
export const BrokerModal = () => {
  const {
    isTrue,
    toggle
  } = useToggle();
  return (
    <>
      <Button variant="primary" type="button" onClick={toggle}>
        Add Broker
      </Button>

      <Modal show={isTrue} onHide={toggle} className="fade" id="exampleModal" tabIndex={-1}>
        <ModalHeader>
          <h5 className="modal-title" id="exampleModalLabel">
            Add Broker
          </h5>
          <button type="button" className="btn-close" onClick={toggle} />
        </ModalHeader>
        <ModalBody>
          <BrokerForm/>
        </ModalBody>
        {/* <ModalFooter>
          <Button type="button" variant="secondary" onClick={toggle}>
            Close
          </Button>
          <Button type="button" variant="primary">
            Save changes
          </Button>
        </ModalFooter> */}
      </Modal>
      </>
    );
};
export const BankModal = () => {
  const {
    isTrue,
    toggle
  } = useToggle();
  return (
    <>
      <Button variant="primary" type="button" onClick={toggle}>
        Add Bank
      </Button>

      <Modal show={isTrue} onHide={toggle} className="fade" id="exampleModal" tabIndex={-1}>
        <ModalHeader>
          <h5 className="modal-title" id="exampleModalLabel">
            Add Bank
          </h5>
          <button type="button" className="btn-close" onClick={toggle} />
        </ModalHeader>
        <ModalBody>
          <BankForm/>
        </ModalBody>
        {/* <ModalFooter>
          <Button type="button" variant="secondary" onClick={toggle}>
            Close
          </Button>
          <Button type="button" variant="primary">
            Save changes
          </Button>
        </ModalFooter> */}
      </Modal>
      </>
    );
};
export const ExchangeModal = () => {
  const {
    isTrue,
    toggle
  } = useToggle();
  return (
    <>
      <Button variant="primary" type="button" onClick={toggle}>
        Add Exchange
      </Button>

      <Modal show={isTrue} onHide={toggle} className="fade" id="exampleModal" tabIndex={-1}>
        <ModalHeader>
          <h5 className="modal-title" id="exampleModalLabel">
            Add Exchange
          </h5>
          <button type="button" className="btn-close" onClick={toggle} />
        </ModalHeader>
        <ModalBody>
          <ExchangeForm/>
        </ModalBody>
        {/* <ModalFooter>
          <Button type="button" variant="secondary" onClick={toggle}>
            Close
          </Button>
          <Button type="button" variant="primary">
            Save changes
          </Button>
        </ModalFooter> */}
      </Modal>
      </>
    );
};
export const SymbolModal = () => {
  const {
    isOpen,
    size,
    className,
    toggleModal,
    openModalWithSize

  } = useModal();
  return (
    <>
      <Button variant="primary" type="button" onClick={() => openModalWithSize('lg')}>
        Add Symbol
      </Button>

      <Modal className="fade" show={isOpen} onHide={toggleModal} dialogClassName={className} size={size} centered>
        <ModalHeader onHide={toggleModal} closeButton>
          <h5 className="modal-title" id="exampleModalLabel">
            Symbol-Add Symbol
          </h5>
        </ModalHeader>
        <ModalBody>
          <SymbolForm/>
        </ModalBody>
        {/* <ModalFooter>
          <Button type="button" variant="secondary" onHide={toggleModal} closeButton>
            Close
          </Button>
          <Button type="button" variant="primary">
            Save changes
          </Button>
        </ModalFooter> */}
      </Modal>
      </>
    );
};

const AllModals = () => {
  return <>
      <DefaultModal />
      <SymbolModal />
      <ExchangeModal />
      <BankModal />
      <BrokerModal />
      <BadaModal />
    </>;
};
export default AllModals;
