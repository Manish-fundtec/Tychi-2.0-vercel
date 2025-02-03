'use client';

import ComponentContainerCard from '@/components/ComponentContainerCard';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import useModal from '@/hooks/useModal';
import useToggle from '@/hooks/useToggle';
import { useState } from 'react';
import { Tooltips } from '@/app/(admin)/forms/validation/components/AllFormValidation';
import { AddGl , AddManualJournal , AddFund , AddStatementBalance} from '@/app/(admin)/forms/validation/components/AllFormValidation';

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
export const StaticBackdropModal = () => {
  const {
    isTrue,
    toggle
  } = useToggle();
  return <ComponentContainerCard id="static-backdrop" title="Static Backdrop" description={<> When backdrop is set to static, the modal will not close when clicking outside of it. Click the button below to try it.</>}>
      <Button type="button" variant="primary" onClick={toggle}>
        Launch static backdrop modal
      </Button>

      <Modal show={isTrue} onHide={toggle} backdrop="static" keyboard={false} className="fade" id="exampleModal" tabIndex={-1}>
        <ModalHeader>
          <h5 className="modal-title" id="exampleModalLabel">
            Modal title
          </h5>
          <button type="button" className="btn-close" onClick={toggle} />
        </ModalHeader>
        <ModalBody>
          <p>I will not close if you click outside of me. Don&apos;t even try to press escape key.</p>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={toggle}>
            Close
          </Button>
          <Button type="button" variant="primary">
            Understood
          </Button>
        </ModalFooter>
      </Modal>
    </ComponentContainerCard>;
};
export const ScrollingModals = () => {
  const {
    isTrue: isModelOpenOne,
    toggle: toggleModelOne
  } = useToggle();
  const {
    isTrue: isModelOpenTwo,
    toggle: toggleModelTwo
  } = useToggle();
  return <ComponentContainerCard id="scrolling-long-content" title="Scrolling Long Content" description={<>
          {' '}
          When modals become too long for the user’s viewport or device, they scroll independent of the page itself. Try the demo below to see what we
          mean.
        </>}>
      <div className="mb-3">
        <button type="button" className="btn btn-primary" onClick={toggleModelOne}>
          Launch demo modal
        </button>

        <Modal show={isModelOpenOne} className="fade" id="exampleModalLong" tabIndex={-1}>
          <ModalHeader>
            <h5 className="modal-title" id="exampleModalLongTitle">
              Modal title
            </h5>
            <button type="button" className="btn-close" onClick={toggleModelOne} />
          </ModalHeader>
          <ModalBody style={{
          minHeight: 1500
        }}>
            <p>
              This is some placeholder content to show the scrolling behavior for modals. Instead of repeating the text the modal, we use an inline
              style set a minimum height, thereby extending the length of the overall modal and demonstrating the overflow scrolling. When content
              becomes longer than the height of the viewport, scrolling will move the modal as needed.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" type="button" onClick={toggleModelOne}>
              Close
            </Button>
            <Button variant="primary" type="button">
              Save changes
            </Button>
          </ModalFooter>
        </Modal>
      </div>
      <p className="text-muted mt-3">
        You can also create a scrollable modal that allows scroll the modal body by adding
        <code>.modal-dialog-scrollable</code> to
        <code>.modal-dialog</code>.
      </p>

      <Button type="button" variant="primary" onClick={toggleModelTwo}>
        Launch demo modal
      </Button>

      <Modal show={isModelOpenTwo} className="fade" scrollable id="exampleModalScrollable" tabIndex={-1}>
        <ModalHeader>
          <h5 className="modal-title" id="exampleModalScrollableTitle">
            Modal title
          </h5>
          <button type="button" className="btn-close" onClick={toggleModelTwo} />
        </ModalHeader>
        <ModalBody>
          <p>
            This is some placeholder content to show the scrolling behavior for modals. We use repeated line breaks to demonstrate how content can
            exceed minimum inner height, thereby showing inner scrolling. When content becomes longer than the predefined max-height of modal, content
            will be cropped and scrollable within the Modal
          </p>
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <p>This content should appear at the bottom after you scroll.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" type="button" onClick={toggleModelTwo}>
            Close
          </Button>
          <Button variant="primary" type="button">
            Save changes
          </Button>
        </ModalFooter>
      </Modal>
    </ComponentContainerCard>;
};
export const ModalPositions = () => {
  const {
    isTrue,
    toggle
  } = useToggle();
  const {
    isTrue: isOpenScrollableModel,
    toggle: toggleScrollableModel
  } = useToggle();
  const {
    isOpen,
    className,
    toggleModal,
    openModalWithClass
  } = useModal();
  return (
  <>
   <div className="mb-3">
        <div className="d-flex flex-wrap gap-2">
          <Button variant="primary" type="button" onClick={toggle}>
            Add GL Account
          </Button>

          <Modal show={isTrue} onHide={toggle} className="fade" centered>
            <ModalHeader>
              <h5 className="modal-title" id="exampleModalCenterTitle">
                Modal title
              </h5>
              <button type="button" className="btn-close" onClick={toggle} />
            </ModalHeader>
            <ModalBody>
              <p>This is a vertically centered Modal</p>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" type="button" onClick={toggle}>
                Close
              </Button>
              <Button variant="primary" type="button">
                Save changes
              </Button>
            </ModalFooter>
          </Modal>

          {/* <Button variant="primary" type="button" onClick={toggleScrollableModel}>
            Vertically centered scrollable modal
          </Button>

          <Modal show={isOpenScrollableModel} onHide={toggleScrollableModel} className="fade" scrollable centered>
            <ModalHeader>
              <h5 className="modal-title" id="exampleModalCenteredScrollableTitle">
                Modal title
              </h5>
              <button type="button" className="btn-close" onClick={toggleScrollableModel} />
            </ModalHeader>
            <ModalBody>
              <p>
                This is some placeholder content to show a vertically centered Modal We&apos;ve added some extra copy here to show how vertically
                centering the modal works when combined with scrollable modals. We also use some repeated line breaks to quickly extend the height of
                the content, thereby triggering the scrolling. When content becomes longer than the predefined max-height of modal, content will be
                cropped and scrollable within the Modal
              </p>
              <br />
              <br />
              <br />
              <br />
              <br />
              <br />
              <br />
              <br />
              <br />
              <br />
              <p>Just like that.</p>
            </ModalBody>
            <ModalFooter>
              <Button type="button" variant="secondary" onClick={toggleScrollableModel}>
                Close
              </Button>
              <Button type="button" variant="primary">
                Save changes
              </Button>
            </ModalFooter>
          </Modal>
        </div>
      </div>
      <p className="text-muted mt-3">
        Specify the position for the Modal You can display modal at top, bottom of page by specifying classes
        <code>modal-top</code> and
        <code>modal-bottom</code> respectively.
      </p>
      <div className="d-flex flex-wrap gap-2">
        <div className="hstack gap-2">
          <Button variant="primary" type="button" onClick={() => openModalWithClass('modal-top')}>
            Top Modal
          </Button>
          <Button variant="success" type="button" onClick={() => openModalWithClass('modal-bottom')}>
            Bottom Modal
          </Button>
        </div>

        <Modal show={isOpen} onHide={toggleModal} className="fade" dialogClassName={className}>
          <ModalHeader onHide={toggleModal} closeButton>
            <h5 className="modal-title" id="exampleModalCenterTitle">
              Modal title
            </h5>
          </ModalHeader>
          <ModalBody>
            <h6>Text in a modal</h6>
            <p className="mb-0">Duis mollis, est non commodo luctus, nisi erat porttitor ligula.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" type="button" onClick={toggleModal}>
              Close
            </Button>
            <Button variant="primary" type="button">
              Save changes
            </Button>
          </ModalFooter>
        </Modal> */}
      </div>
      </div>
  </>
  );
     
   
};
export function GLEntryModal({
  buttonLabel = 'Add GL Account',
  modalTitle = 'Modal title',
  modalBody = <p>GL Accounts</p>,
  onSave,
  onClose,
}) {
  
  const { isTrue, toggle } = useToggle();
  return (
    <>
      {/* Button to open the modal */}
      <Button variant="primary" onClick={toggle}>
        {buttonLabel}
      </Button>

      {/* The Modal itself */}
      <Modal size="lg" show={isTrue} onHide={toggle} className="fade" centered>
        <ModalHeader>
          <h5 className="modal-title" id="exampleModalCenterTitle">
            {modalTitle}
          </h5>
          <button type="button" className="btn-close" onClick={toggle} />
        </ModalHeader>
        <ModalBody>
          {<AddGl/>}
        </ModalBody>
        {/* <ModalFooter>
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              if (onClose) onClose();
              toggle();
            }}
          >
            Close
          </Button>
          <Button
            variant="primary"
            type="submit"
            onClick={() => {
              if (onSave) onSave();
              toggle();
            }}
          >
            Save changes
          </Button>
        </ModalFooter> */}
      </Modal>
    </>
  );
}
export function MGLEntryModal({
  buttonLabel = 'Add Manual Journal',
  modalTitle = 'Add Manual Journal',
  modalBody = <p> Add - Manual Journal</p>,
  onSave,
  onClose,
}) {
  
  const { isTrue, toggle } = useToggle();
  return (
    <>
      {/* Button to open the modal */}
      <Button variant="primary" onClick={toggle}>
        {buttonLabel}
      </Button>

      {/* The Modal itself */}
      <Modal size="lg" show={isTrue} onHide={toggle} className="fade" centered>
        <ModalHeader>
          <h5 className="modal-title" id="exampleModalCenterTitle">
            {modalTitle}
          </h5>
          <button type="button" className="btn-close" onClick={toggle} />
        </ModalHeader>
        <ModalBody>
          {<AddManualJournal/>}
        </ModalBody>
        {/* <ModalFooter>
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              if (onClose) onClose();
              toggle();
            }}
          >
            Close
          </Button>
          <Button
            variant="primary"
            type="submit"
            onClick={() => {
              if (onSave) onSave();
              toggle();
            }}
          >
            Save changes
          </Button>
        </ModalFooter> */}
      </Modal>
    </>
  );
}
export const ToggleBetweenModals = () => {
  // Controls opening/closing the single modal
  const { isTrue: isOpen, toggle: toggleModal } = useToggle();

  // User’s choice: 'manual' (Manual Pricing) or 'upload' (File Upload)
  const [approach, setApproach] = useState('manual');

  // Example data for manual pricing
  const [symbols, setSymbols] = useState([
    // { name: 'AAPL', price: 150 },
    // { name: 'TSLA', price: 210 },
    // { name: 'MSFT', price: 270 },
  ]);

  // Handle updates to manual pricing
  const handlePriceChange = (index, newPrice) => {
    setSymbols((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], price: Number(newPrice) };
      return copy;
    });
  };

  // Example file state if you want to store the chosen file
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };

  // “Save” logic for whichever approach is chosen
  const handleSave = () => {
    if (approach === 'manual') {
      // You might call an API to save the manual pricing data
      console.log('Saving manual pricing:', symbols);
    } else {
      // approach === 'upload'
      // You might call an API to upload the file
      console.log('Uploading file:', file);
    }

    // Close the modal after saving
    toggleModal();
  };

  return (
    <>
      {/* Button to open the single modal */}
      <Button variant="primary" onClick={toggleModal}>
        Add Valuation
      </Button>

      {/* Single modal with two approaches */}
      <Modal show={isOpen} onHide={toggleModal} centered>
        <ModalHeader closeButton>
          <ModalTitle as="h5">Add Valuation</ModalTitle>
        </ModalHeader>
        <ModalBody>
          {/* Toggle approach: Manual or Upload */}
          <div className="mb-3">
            <div className="form-check form-check-inline">
              <input
                type="radio"
                id="manual-pricing"
                name="valuation-approach"
                className="form-check-input"
                value="manual"
                checked={approach === 'manual'}
                onChange={() => setApproach('manual')}
              />
              <label htmlFor="manual-pricing" className="form-check-label">
                Manual Pricing
              </label>
            </div>
            <div className="form-check form-check-inline">
              <input
                type="radio"
                id="file-upload"
                name="valuation-approach"
                className="form-check-input"
                value="upload"
                checked={approach === 'upload'}
                onChange={() => setApproach('upload')}
              />
              <label htmlFor="file-upload" className="form-check-label">
                File Upload
              </label>
            </div>
          </div>

          {/* If the user chooses Manual Pricing */}
          {approach === 'manual' && (
            <>
              <p>Adjust prices manually below:</p>
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {symbols.map((symbol, idx) => (
                    <tr key={symbol.name}>
                      <td>{symbol.name}</td>
                      <td>
                        <input
                          type="number"
                          value={symbol.price}
                          className="form-control"
                          onChange={(e) => handlePriceChange(idx, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* If the user chooses File Upload */}
          {approach === 'upload' && (
            <>
              <p>Choose a file (CSV, XLSX, etc.) to upload valuations:</p>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
              />
              {file && <p className="mt-2">Selected file: {file.name}</p>}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={toggleModal}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </ModalFooter>
      </Modal>
      </>
  );
};
export const ModalSizes = () => {
  const {
    isOpen,
    size,
    className,
    toggleModal,
    openModalWithSize
  } = useModal();
  return <ComponentContainerCard id="optional-sizes" title="Optional Sizes" description={<>
          {' '}
          Modals have three optional sizes, available via modifier classes to be placed on a <code>.modal-dialog</code>. These sizes kick in at
          certain breakpoints to avoid horizontal scrollbars on narrower viewports.
        </>}>
      <div className="hstack gap-2">
        <Button type="button" variant="primary" onClick={() => openModalWithSize('xl')}>
          Extra large modal
        </Button>
        <Button type="button" variant="primary" onClick={() => openModalWithSize('lg')}>
          Large modal
        </Button>
        <Button type="button" variant="primary" onClick={() => openModalWithSize('sm')}>
          Small modal
        </Button>
      </div>

      <Modal className="fade" show={isOpen} onHide={toggleModal} dialogClassName={className} size={size}>
        <ModalHeader onHide={toggleModal} closeButton>
          <h5 className="modal-title h4" id="exampleModalXlLabel">
            Extra large modal
          </h5>
        </ModalHeader>
        <ModalBody>...</ModalBody>
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
const FullScreenModals = () => {
  const sizes = ['sm-down', 'md-down', 'lg-down', 'xl-down', 'xxl-down'];
  const [fullscreen, setFullscreen] = useState(undefined);
  const [show, setShow] = useState(false);
  const handleShow = breakpoint => {
    setFullscreen(breakpoint);
    setShow(true);
  };
  return <ComponentContainerCard id="fullscreen-modal" title="Fullscreen Modal" description={<>
          Modals have three optional sizes, available via modifier classes to be placed on a <code>.modal-dialog</code>. These sizes kick in at
          certain breakpoints to avoid horizontal scrollbars on narrower viewports.
        </>}>
      <div className="hstack flex-wrap gap-2">
        <Button variant="primary" onClick={() => setShow(true)}>
          Full screen
        </Button>
        {sizes.map((size, idx) => <Button key={idx} onClick={() => handleShow(size)}>
            Full Screen
            {typeof size === 'string' && ` Below ${size.split('-')[0]}`}
          </Button>)}
      </div>

      <Modal show={show} className="fade" fullscreen={fullscreen ?? true} onHide={() => setShow(false)}>
        <ModalHeader closeButton>
          <ModalTitle>Modal</ModalTitle>
        </ModalHeader>
        <ModalBody>...</ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </ComponentContainerCard>;
};
export const ModalWithAlerts = () => {
  const {
    isOpen,
    className,
    toggleModal,
    openModalWithClass
  } = useModal();
  return <ComponentContainerCard id="modal-alerts" title="Modal Based Alerts" description={<>
          {' '}
          Modals have three optional sizes, available via modifier classes to be placed on a <code>.modal-dialog</code>. These sizes kick in at
          certain breakpoints to avoid horizontal scrollbars on narrower viewports.
        </>}>
      <div className="hstack flex-wrap gap-2">
        <Button variant="primary" onClick={() => openModalWithClass('bg-primary')}>
          Primary Alert
        </Button>
        <Button variant="secondary" onClick={() => openModalWithClass('bg-secondary')}>
          Secondary Alert
        </Button>
        <Button variant="success" onClick={() => openModalWithClass('bg-success')}>
          Success Alert
        </Button>
        <Button variant="info" onClick={() => openModalWithClass('bg-info')}>
          Info Alert
        </Button>
      </div>

      <Modal className="fade" show={isOpen} onHide={toggleModal} size="sm">
        <div className={`modal-filled rounded-2 ${className}`}>
          <ModalBody>
            <div className="text-center">
              <IconifyIcon icon="bx:check-double" className="display-6 mt-0 text-white" />
              <h4 className="mt-3 text-white">Well Done!</h4>
              <p className="mt-3">Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam.</p>
              <Button variant="light" type="button" className="mt-3" onClick={toggleModal}>
                Continue
              </Button>
            </div>
          </ModalBody>
        </div>
      </Modal>
    </ComponentContainerCard>;
};
export function VerticallyCenteredModal({
  buttonLabel = 'Open Modal',
  modalTitle = 'Modal title',
  modalBody = 'Default body text',
  onSave,   // Optional callback for "Save changes"
  onClose,  // Optional callback for "Close"
}) {
  const { isTrue: isOpen, toggle } = useToggle();

  return (
    <>
      {/* The button that toggles the modal */}
      <Button variant="primary" type="button" onClick={toggle}>
        {buttonLabel}
      </Button>

      {/* The Modal itself */}
      <Modal show={isOpen} onHide={toggle} className="fade" centered>
        <ModalHeader>
          <ModalTitle as="h5">{modalTitle}</ModalTitle>
          <button type="button" className="btn-close" onClick={toggle} />
        </ModalHeader>
        <ModalBody>
          {modalBody}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              if (onClose) onClose();
              toggle(); // close modal
            }}
          >
            Close
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={() => {
              if (onSave) onSave();
              toggle(); // close modal
            }}
          >
            Save changes
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
export function AddFundModal({
  buttonLabel = 'Add Fund',
  modalTitle = 'Add Fund ',
  modalBody = <p>Add Fund</p>,
  onSave,
  onClose,
}) {
  
  const { isTrue, toggle } = useToggle();
  return (
    <>
      {/* Button to open the modal */}
      <Button variant="primary" onClick={toggle}>
        {buttonLabel}
      </Button>

      {/* The Modal itself */}
      <Modal size="lg" show={isTrue} onHide={toggle} className="fade" centered>
        <ModalHeader>
          <h5 className="modal-title" id="exampleModalCenterTitle">
            {modalTitle}
          </h5>
          <button type="button" className="btn-close" onClick={toggle} />
        </ModalHeader>
        <ModalBody>
          {<AddFund/>}
        </ModalBody>
       
      </Modal>
    </>
  );
}
export function AddStatementBalanceModal({
  buttonLabel = 'Add Statement Balance',
  modalTitle = 'Add Statement Balance',
  modalBody = <AddStatementBalance />,
  onSave,
  onClose,
}) {
  const [show, setShow] = useState(false);


  const toggle = () => setShow(!show);


  return (
    <>
      {/* Button to open the modal */}
      <Button variant="primary" onClick={toggle}>
        {buttonLabel}
      </Button>


      {/* The Modal itself */}
      <Modal size="lg" show={show} onHide={toggle} className="fade" centered>
        <Modal.Header>
          <h5 className="modal-title">{modalTitle}</h5>
          <button type="button" className="btn-close" onClick={toggle} />
        </Modal.Header>
        <Modal.Body>
          {modalBody}
        </Modal.Body>
      </Modal>
    </>
  );
}
const AllModals = () => {
  return <>
      <DefaultModal />
      <StaticBackdropModal />
      <ScrollingModals />
      <ModalPositions />
      <ToggleBetweenModals />
      <ModalSizes />
      <BadaModal />
      <FullScreenModals />
      <ModalWithAlerts />
      <GLEntryModal/>
      <AddFundModal/>
      <AddStatementBalanceModal/>

    </>;
};
export default AllModals;
