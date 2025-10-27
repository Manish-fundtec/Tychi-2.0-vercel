'use client'

import ComponentContainerCard from '@/components/ComponentContainerCard'
import useModal from '@/hooks/useModal'
import useToggle from '@/hooks/useToggle'
import { useState, useRef } from 'react'
import { Tooltips } from '@/app/(admin)/forms/validation/components/AllFormValidation'
import { BrokerForm } from '@/app/(admin)/forms/validation/components/ConfigurationForm'
import { BankForm } from '@/app/(admin)/forms/validation/components/ConfigurationForm'
import { ExchangeForm } from '@/app/(admin)/forms/validation/components/ConfigurationForm'
import { AssetTypeForm } from '@/app/(admin)/forms/validation/components/ConfigurationForm'
import { SymbolForm } from '@/app/(admin)/forms/validation/components/ConfigurationForm'
import { UploadSymbols } from '@/app/(admin)/forms/validation/components/ConfigurationForm'
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'
import { useDashboardToken } from '@/hooks/useDashboardToken'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import axios from 'axios'
import { useEffect } from 'react'

export const DefaultModal = () => {
  const { isTrue, toggle } = useToggle()
  return (
    <ComponentContainerCard id="default">
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
    </ComponentContainerCard>
  )
}

export const BadaModal = () => {
  const { isOpen, size, className, toggleModal, openModalWithSize } = useModal()
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
  )
}

export const AssetTypeModal = ({ show, onClose, assetType, onSuccess }) => {
  return (
    <Modal show={show} onHide={onClose} centered>
      <ModalHeader closeButton>
        <h5 className="modal-title">Activate Asset Type</h5>
      </ModalHeader>
      <ModalBody>
        <AssetTypeForm assetType={assetType} onSuccess={onSuccess} onClose={onClose} />
      </ModalBody>
    </Modal>
  )
}

const toISODate = (val) => {
  if (!val) return ''
  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s // already YYYY-MM-DD
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

const pickReportingStartFromToken = (payload) => {
  // support snake_case or camelCase just in case
  return payload?.reporting_start_date ?? payload?.reportingStartDate ?? ''
}

export const BrokerModal = ({ show, onClose, broker, onSuccess, existingBrokers = [] }) => {
  const [reportingStartDate, setReportingStartDate] = useState('')
  useEffect(() => {
    try {
      const token = Cookies.get('dashboardToken')
      if (!token) {
        console.warn('No dashboardToken found')
        return
      }
      const decoded = jwtDecode(token) || {}
      const rsd = toISODate(pickReportingStartFromToken(decoded))
      if (rsd) setReportingStartDate(rsd)
    } catch (e) {
      console.warn('Could not read reporting_start_date from token:', e?.message)
    }
  }, [])
  return (
    <Modal show={show} onHide={onClose} centered>
      <ModalHeader closeButton>
        <h5 className="modal-title">{broker ? 'Edit Broker' : 'Add Broker'}</h5>
      </ModalHeader>
      <ModalBody>
        <BrokerForm 
          broker={broker} 
          onSuccess={onSuccess} 
          onClose={onClose} 
          reportingStartDate={reportingStartDate}
          existingBrokers={existingBrokers}
        />
      </ModalBody>
    </Modal>
  )
}

export const BankModal = ({ show, onClose, bank, onSuccess }) => {
  return (
    <Modal show={show} onHide={onClose} centered>
      <ModalHeader closeButton>
        <h5 className="modal-title">{bank ? 'Edit Bank' : 'Add Bank'}</h5>
      </ModalHeader>
      <ModalBody>
        <BankForm bank={bank} onSuccess={onSuccess} onClose={onClose} />
      </ModalBody>
    </Modal>
  )
}
export const ExchangeModal = ({ show, onClose, exchange, onSuccess }) => {
  return (
    <Modal show={show} onHide={onClose} centered>
      <ModalHeader closeButton>
        <h5 className="modal-title">{exchange ? 'Edit Exchange' : 'Add Exchange'}</h5>
      </ModalHeader>
      <ModalBody>
        <ExchangeForm exchange={exchange} onSuccess={onSuccess} onClose={onClose} />
      </ModalBody>
    </Modal>
  )
}

// export const ExchangeModal = () => {
//   const {
//     isTrue,
//     toggle
//   } = useToggle();
//   return (
//     <>
//       <Button variant="primary" type="button" onClick={toggle}>
//         Add Exchange
//       </Button>

//       <Modal show={isTrue} onHide={toggle} className="fade" id="exampleModal" tabIndex={-1}>
//         <ModalHeader>
//           <h5 className="modal-title" id="exampleModalLabel">
//             Add Exchange
//           </h5>
//           <button type="button" className="btn-close" onClick={toggle} />
//         </ModalHeader>
//         <ModalBody>
//           <ExchangeForm/>
//         </ModalBody>
//         {/* <ModalFooter>
//           <Button type="button" variant="secondary" onClick={toggle}>
//             Close
//           </Button>
//           <Button type="button" variant="primary">
//             Save changes
//           </Button>
//         </ModalFooter> */}
//       </Modal>
//       </>
//     );
// };
// export const SymbolModal = () => {
//   const {
//     isOpen,
//     size,
//     className,
//     toggleModal,
//     openModalWithSize

//   } = useModal();
//   return (
//     <>
//       <Button variant="primary" type="button" onClick={() => openModalWithSize('lg')}>
//         Add Symbol
//       </Button>

//       <Modal className="fade" show={isOpen} onHide={toggleModal} dialogClassName={className} size={size} centered>
//         <ModalHeader onHide={toggleModal} closeButton>
//           <h5 className="modal-title" id="exampleModalLabel">
//             Symbol-Add Symbol
//           </h5>
//         </ModalHeader>
//         <ModalBody>
//           <SymbolForm/>
//         </ModalBody>
//         {/* <ModalFooter>
//           <Button type="button" variant="secondary" onHide={toggleModal} closeButton>
//             Close
//           </Button>
//           <Button type="button" variant="primary">
//             Save changes
//           </Button>
//         </ModalFooter> */}
//       </Modal>
//       </>
//     );
// };
export const SymbolModal = ({ show, onClose, symbol, onSuccess }) => {
  return (
    <Modal show={show} onHide={onClose} centered>
      <ModalHeader closeButton>
        <h5 className="modal-title">{symbol ? 'Edit Symbol' : 'Add Symbol'}</h5>
      </ModalHeader>
      <ModalBody>
        <SymbolForm symbol={symbol} onClose={onClose} onSuccess={onSuccess} />
      </ModalBody>
    </Modal>
  )
}

export function UploadSymbolModal({ buttonLabel = 'Upload', modalTitle = 'Upload Symbol', onClose, fundId, onSuccess }) {
  const [show, setShow] = useState(false)

  const handleOpen = () => setShow(true)
  const handleClose = () => {
    setShow(false)
    onClose?.()
  }

  const handleSuccess = () => {
    if (onSuccess) onSuccess()
    handleClose()
  }

  return (
    <>
      <Button variant="primary" onClick={handleOpen}>
        {buttonLabel}
      </Button>

      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <UploadSymbols fundId={fundId} onClose={handleClose} onUploaded={handleSuccess} />
        </Modal.Body>
      </Modal>
    </>
  )
}

const AllModals = () => {
  return (
    <>
      <DefaultModal />
      <SymbolModal />
      <ExchangeModal />
      <BankModal />
      <BrokerModal />
      <BadaModal />
      <AssetTypeModal />
    </>
  )
}
export default AllModals
