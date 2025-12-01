'use client'

import ComponentContainerCard from '@/components/ComponentContainerCard'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import useModal from '@/hooks/useModal'
import useToggle from '@/hooks/useToggle'
import { AgGridReact } from 'ag-grid-react'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { AddGl, AddFund, AddStatementBalance, AddTrade, UploadTrade, UploadManualJournal, UploadSymbols, UploadMigration } from '@/app/(admin)/forms/validation/components/AllFormValidation'
import { AddManualJournal } from '@/app/(admin)/forms/validation/components/AllFormValidation'
import { Button, Modal, Dropdown, } from 'react-bootstrap'
import Cookies from 'js-cookie'
import jwt from 'jsonwebtoken'
import { formatYmd } from '@/lib/dateFormat'
import { useDashboardToken } from '@/hooks/useDashboardToken'
import {
  parseISO,
  isValid,
  startOfMonth,
  endOfMonth,
  addMonths,
  startOfQuarter,
  endOfQuarter,
  addQuarters,
  startOfYear,
  endOfYear,
  addYears,
  addDays,
  format,
} from 'date-fns'
// put this near your imports
import React from 'react'
import { ModuleRegistry } from 'ag-grid-community'
import { ClientSideRowModelModule } from 'ag-grid-community'

// AG Grid v33+: register required modules once (client-side row model)
ModuleRegistry.registerModules([ClientSideRowModelModule])

// Renders only three dots (no box)
const EllipsisToggle = React.forwardRef(({ onClick }, ref) => (
  <span
    ref={ref}
    role="button"
    tabIndex={0}
    onClick={(e) => {
      e.preventDefault()
      onClick?.(e)
    }}
    className="text-muted px-2"
    style={{ fontSize: 20, lineHeight: 1, cursor: 'pointer', userSelect: 'none' }}
    aria-label="Open advanced adhoc"
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick?.(e)
      }
    }}>
    ⋮
  </span>
))
EllipsisToggle.displayName = 'EllipsisToggle'

export const DefaultModal = () => {
  const { isTrue, toggle } = useToggle()
  return (
    <ComponentContainerCard id="default">
      <Button variant="primary" type="button" onClick={toggle}>
        Launch demo modal
      </Button>

      <Modal show={isTrue} onHide={toggle} className="fade" id="exampleModal" tabIndex={-1}>
        <Modal.Header>
          <h5 className="modal-title" id="exampleModalLabel">
            Modal title
          </h5>
          <button type="button" className="btn-close" onClick={toggle} />
        </Modal.Header>
        <Modal.Body>
          <p>Woo-hoo, you&apos;re reading this text in a modal!</p>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={toggle}>
            Close
          </Button>
          <Button type="button" variant="primary">
            Save changes
          </Button>
        </Modal.Footer>
      </Modal>
    </ComponentContainerCard>
  )
}

export const StaticBackdropModal = () => {
  const { isTrue, toggle } = useToggle()
  return (
    <ComponentContainerCard
      id="static-backdrop"
      title="Static Backdrop"
      description={<> When backdrop is set to static, the modal will not close when clicking outside of it. Click the button below to try it.</>}>
      <Button type="button" variant="primary" onClick={toggle}>
        Launch static backdrop modal
      </Button>

      <Modal show={isTrue} onHide={toggle} backdrop="static" keyboard={false} className="fade" id="exampleModal" tabIndex={-1}>
        <Modal.Header>
          <h5 className="modal-title" id="exampleModalLabel">
            Modal title
          </h5>
          <button type="button" className="btn-close" onClick={toggle} />
        </Modal.Header>
        <Modal.Body>
          <p>I will not close if you click outside of me. Don&apos;t even try to press escape key.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={toggle}>
            Close
          </Button>
          <Button type="button" variant="primary">
            Understood
          </Button>
        </Modal.Footer>
      </Modal>
    </ComponentContainerCard>
  )
}
export const ScrollingModals = () => {
  const { isTrue: isModelOpenOne, toggle: toggleModelOne } = useToggle()
  const { isTrue: isModelOpenTwo, toggle: toggleModelTwo } = useToggle()
  return (
    <ComponentContainerCard
      id="scrolling-long-content"
      title="Scrolling Long Content"
      description={
        <>
          {' '}
          When modals become too long for the user’s viewport or device, they scroll independent of the page itself. Try the demo below to see what we
          mean.
        </>
      }>
      <div className="mb-3">
        <button type="button" className="btn btn-primary" onClick={toggleModelOne}>
          Launch demo modal
        </button>

        <Modal show={isModelOpenOne} className="fade" id="exampleModalLong" tabIndex={-1}>
          <Modal.Header>
            <h5 className="modal-title" id="exampleModalLongTitle">
              Modal title
            </h5>
            <button type="button" className="btn-close" onClick={toggleModelOne} />
          </Modal.Header>
          <Modal.Body
            style={{
              minHeight: 1500,
            }}>
            <p>
              This is some placeholder content to show the scrolling behavior for modals. Instead of repeating the text the modal, we use an inline
              style set a minimum height, thereby extending the length of the overall modal and demonstrating the overflow scrolling. When content
              becomes longer than the height of the viewport, scrolling will move the modal as needed.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" type="button" onClick={toggleModelOne}>
              Close
            </Button>
            <Button variant="primary" type="button">
              Save changes
            </Button>
          </Modal.Footer>
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
        <Modal.Header>
          <h5 className="modal-title" id="exampleModalScrollableTitle">
            Modal title
          </h5>
          <button type="button" className="btn-close" onClick={toggleModelTwo} />
        </Modal.Header>
        <Modal.Body>
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
          <br />
          <br />
          <br />
          <br />
          <p>This content should appear at the bottom after you scroll.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={toggleModelTwo}>
            Close
          </Button>
          <Button variant="primary" type="button">
            Save changes
          </Button>
        </Modal.Footer>
      </Modal>
    </ComponentContainerCard>
  )
}
export const ModalPositions = () => {
  const { isTrue, toggle } = useToggle()
  const { isTrue: isOpenScrollableModel, toggle: toggleScrollableModel } = useToggle()
  const { isOpen, className, toggleModal, openModalWithClass } = useModal()
  return (
    <>
      <div className="mb-3">
        <div className="d-flex flex-wrap gap-2">
          <Button variant="primary" type="button" onClick={toggle}>
            Add GL Account
          </Button>

          <Modal show={isTrue} onHide={toggle} className="fade" centered>
            <Modal.Header>
              <h5 className="modal-title" id="exampleModalCenterTitle">
                Modal title
              </h5>
              <button type="button" className="btn-close" onClick={toggle} />
            </Modal.Header>
            <Modal.Body>
              <p>This is a vertically centered Modal</p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" type="button" onClick={toggle}>
                Close
              </Button>
              <Button variant="primary" type="button">
                Save changes
              </Button>
            </Modal.Footer>
          </Modal>

          {/* <Button variant="primary" type="button" onClick={toggleScrollableModel}>
            Vertically centered scrollable modal
          </Button>

          <Modal show={isOpenScrollableModel} onHide={toggleScrollableModel} className="fade" scrollable centered>
            <Modal.Header>
              <h5 className="modal-title" id="exampleModalCenteredScrollableTitle">
                Modal title
              </h5>
              <button type="button" className="btn-close" onClick={toggleScrollableModel} />
            </Modal.Header>
            <Modal.Body>
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
            </Modal.Body>
            <Modal.Footer>
              <Button type="button" variant="secondary" onClick={toggleScrollableModel}>
                Close
              </Button>
              <Button type="button" variant="primary">
                Save changes
              </Button>
            </Modal.Footer>
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
          <Modal.Header onHide={toggleModal} closeButton>
            <h5 className="modal-title" id="exampleModalCenterTitle">
              Modal title
            </h5>
          </Modal.Header>
          <Modal.Body>
            <h6>Text in a modal</h6>
            <p className="mb-0">Duis mollis, est non commodo luctus, nisi erat porttitor ligula.</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" type="button" onClick={toggleModal}>
              Close
            </Button>
            <Button variant="primary" type="button">
              Save changes
            </Button>
          </Modal.Footer>
        </Modal> */}
        </div>
      </div>
    </>
  )
}

export function GLEntryModal({
  buttonLabel = 'Add GL Account',
  modalTitle = 'Add Chart Of Account',
  ModalBody = <p>GL Accounts</p>,
  onSave,
  onClose,
}) {
  const { isTrue, toggle } = useToggle()
  const handleModalClose = () => {
    if (onClose) onClose() // Close the modal after data is saved
    toggle() // Toggle modal visibility (close it)
  }
  return (
    <>
      {/* Button to open the modal */}
      <Button variant="primary" onClick={toggle}>
        {buttonLabel}
      </Button>

      {/* The Modal itself */}
      <Modal size="lg" show={isTrue} onHide={toggle} className="fade" centered>
        <Modal.Header>
          <h5 className="modal-title" id="exampleModalCenterTitle">
            {modalTitle}
          </h5>
          <button type="button" className="btn-close" onClick={toggle} />
        </Modal.Header>
        <Modal.Body>{<AddGl onClose={handleModalClose} />}</Modal.Body>
        {/* <Modal.Footer>
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
        </Modal.Footer> */}
      </Modal>
    </>
  )
}

export function UploadTradeModal({ buttonLabel = 'Upload', modalTitle = 'Upload Trade File', onSave, onClose, onSuccess }) {
  const { isTrue, toggle } = useToggle()
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorFileUrl, setErrorFileUrl] = useState('')

  const handleModalClose = () => {
    if (onClose) onClose()
    toggle()
  }

  const handleSuccess = () => {
    if (onSuccess) onSuccess() // Call onSuccess callback to refresh trades
    handleModalClose() // Close modal after success
  }

  const handleError = (s3Url) => {
    setErrorFileUrl(s3Url)
    handleModalClose() // close Upload modal first
    setTimeout(() => setShowErrorModal(true), 300) // then show error modal
  }

  const handleErrorModalClose = () => {
    setShowErrorModal(false)
    setErrorFileUrl('')
  }

  return (
    <>
      {/* Button to open the modal */}
      <Button variant="primary" onClick={toggle}>
        {buttonLabel}
      </Button>

      {/* The Modal itself */}
      <Modal size="md" show={isTrue} onHide={handleModalClose} className="fade" centered>
        <Modal.Header closeButton>
          {' '}
          {/* Use closeButton prop here to trigger modal close */}
          <h5 className="modal-title" id="exampleModalCenterTitle">
            {modalTitle}
          </h5>
        </Modal.Header>
        <Modal.Body>
          {/* Passing the onClose and onSuccess handlers to your form (UploadTradeForm) */}
          <UploadTrade onClose={handleModalClose} onSuccess={handleSuccess} />
        </Modal.Body>
        {/* Modal Footer for Close and Save actions */}
      </Modal>

      {/* Error Modal */}
      <Modal show={showErrorModal} centered backdrop="static" keyboard={false} onHide={handleErrorModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Validation Errors</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Your file contains validation errors. Please download the error file for details, correct them, and re-upload.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleErrorModalClose}>
            Close
          </Button>
          <a href={errorFileUrl} download style={{ textDecoration: 'none' }}>
            <Button variant="primary">Download Error File</Button>
          </a>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export function UploadMigrationModal({ buttonLabel = 'Upload', modalTitle = 'Upload Migration File', onSave, onClose, onSuccess, onUploadSuccess }) {
  const { isTrue, toggle } = useToggle()

  const handleModalClose = () => {
    if (onClose) onClose()
    toggle()
  }

  const handleSuccess = () => {
    if (onSuccess) onSuccess()
    handleModalClose()
  }

  const handleUploadSuccess = (fileId) => {
    // Open comparison modal after successful upload
    if (onUploadSuccess) {
      onUploadSuccess(fileId)
    }
    handleSuccess()
  }

  return (
    <>
      {/* Button to open the modal */}
      <Button variant="primary" onClick={toggle}>
        {buttonLabel}
      </Button>

      {/* The Modal itself */}
      <Modal size="md" show={isTrue} onHide={handleModalClose} className="fade" centered>
        <Modal.Header closeButton>
          <h5 className="modal-title" id="exampleModalCenterTitle">
            {modalTitle}
          </h5>
        </Modal.Header>
        <Modal.Body>
          <UploadMigration onClose={handleModalClose} onSuccess={handleSuccess} onUploadSuccess={handleUploadSuccess} />
        </Modal.Body>
      </Modal>
    </>
  )
}

export function MGLEntryModal({
  buttonLabel = 'Add',
  modalTitle = 'Add Manual Journal',
  modalBody = <p> Add - Manual Journal</p>,
  onSave,
  onClose,
}) {
  const { isTrue, toggle } = useToggle()
  console.log('RB Modal:', Modal)
  console.log('RB Button:', Button)
  console.log('AddManualJournal:', AddManualJournal)

  if (!Modal || !Button) return <div>react-bootstrap Modal/Button import is undefined</div>
  if (!AddManualJournal) return <div>AddManualJournal import is undefined</div>

  return (
    <>
      {/* Button to open the modal */}
      <Button variant="primary" onClick={toggle}>
        {buttonLabel}
      </Button>

      {/* The Modal itself */}
      <Modal size="lg" show={isTrue} onHide={toggle} className="fade" centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>

        {/* ❌ <ModalBody>  ->  ✅ <Modal.Body> */}
        <Modal.Body>
          <AddManualJournal
            onClose={() => {
              toggle() // close modal
              onSave?.() // optional refresh
            }}
          />
        </Modal.Body>
      </Modal>
    </>
  )
}

// --- UTC date helpers (frontend) ---
const asUTC = (y, m, d) => new Date(Date.UTC(y, m, d))
const ymdUTC = (d) => {
  if (!d) return ''
  const dd = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(dd.getTime())) return ''
  const y = dd.getUTCFullYear()
  const m = String(dd.getUTCMonth() + 1).padStart(2, '0')
  const day = String(dd.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseFlexibleDate(s) {
  if (!s) return null
  if (s instanceof Date) return asUTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate())
  const str = String(s).trim()

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number)
    return asUTC(y, m - 1, d)
  }
  // MM/DD/YYYY or MM/DD/YY
  const mdy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/)
  if (mdy) {
    let [, mm, dd, yy] = mdy
    let y = Number(yy)
    if (yy.length === 2) y = y + (y >= 70 ? 1900 : 2000)
    return asUTC(y, Number(mm) - 1, Number(dd))
  }
  // fallback
  const t = new Date(str)
  return Number.isNaN(t.getTime()) ? null : asUTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate())
}

const startOfDayUTC = (d) => asUTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
const startOfMonthUTC = (d) => asUTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
const startOfQuarterUTC = (d) => asUTC(d.getUTCFullYear(), Math.floor(d.getUTCMonth() / 3) * 3, 1)
const startOfYearUTC = (d) => asUTC(d.getUTCFullYear(), 0, 1)

const addDaysUTC = (d, n) => {
  const result = new Date(d)
  result.setUTCDate(result.getUTCDate() + n)
  return asUTC(result.getUTCFullYear(), result.getUTCMonth(), result.getUTCDate())
}
const addMonthsUTC = (d, n) => asUTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1)
const addQuartersUTC = (d, n) => asUTC(d.getUTCFullYear(), d.getUTCMonth() + n * 3, 1)
const addYearsUTC = (d, n) => asUTC(d.getUTCFullYear() + n, 0, 1)

const startOfPeriodUTC = (freq, d) => {
  const f = String(freq || 'monthly').toLowerCase()
  if (f === 'daily') return startOfDayUTC(d)
  if (f === 'quarterly') return startOfQuarterUTC(d)
  if (f === 'annual' || f === 'annually') return startOfYearUTC(d)
  return startOfMonthUTC(d)
}
const addPeriodUTC = (freq, d, n) => {
  const f = String(freq || 'monthly').toLowerCase()
  if (f === 'daily') return addDaysUTC(d, n)
  if (f === 'quarterly') return addQuartersUTC(d, n)
  if (f === 'annual' || f === 'annually') return addYearsUTC(d, n)
  return addMonthsUTC(d, n)
}

// Compute next pricing window given frequency, reporting start, and last pricing date
// Supports: Daily, Monthly, Quarterly, Annual
export function computePricingWindow(reportingFrequency, reportingStartDate, lastPricingDate) {
  const bad = /^(?:|0{4}-0{2}-0{2}|1970-01-01|null|undefined)$/i

  const freq = String(reportingFrequency || 'monthly').toLowerCase()
  const rsd = parseFlexibleDate(reportingStartDate || null) // e.g. "08/01/2025"
  const lpd = bad.test(String(lastPricingDate || '').trim()) ? null : parseFlexibleDate(lastPricingDate || null) // e.g. "2025-08-31" or null

  if (!rsd && !lpd) return null

  // ANNUAL frequency
  if (freq === 'annual' || freq === 'annually') {
    if (rsd) {
      // Check if we've completed the first year (from reporting start to end of that calendar year)
      const rsdYearEnd = asUTC(rsd.getUTCFullYear(), 11, 31) // Dec 31 of reporting start year
      const hasRealLast = lpd && lpd >= rsdYearEnd

      if (hasRealLast) {
        // Next year window: full calendar year (Jan 1 to Dec 31)
        const nextYear = lpd.getUTCFullYear() + 1
        const start = asUTC(nextYear, 0, 1) // Jan 1 of next year
        const lastDayInclusive = asUTC(nextYear, 11, 31) // Dec 31 of next year
        return { start, lastDayInclusive }
      }

      // First year window: from reporting_start_date to end of that calendar year (full year period)
      const start = rsd // Start from reporting start date
      const lastDayInclusive = asUTC(rsd.getUTCFullYear(), 11, 31) // Dec 31 of reporting start year
      return { start, lastDayInclusive }
    }

    // No reporting start but we have lastPricingDate → next year window
    if (lpd) {
      const nextYear = lpd.getUTCFullYear() + 1
      const start = asUTC(nextYear, 0, 1)
      const lastDayInclusive = asUTC(nextYear, 11, 31)
      return { start, lastDayInclusive }
    }
  }

  // DAILY frequency
  if (freq === 'daily') {
    if (rsd) {
      const hasRealLast = lpd && lpd >= rsd

      if (hasRealLast) {
        // Next day window
        const start = addDaysUTC(lpd, 1)
        const lastDayInclusive = start
        return { start, lastDayInclusive }
      }

      // First day window → reporting_start_date
      const start = rsd
      const lastDayInclusive = rsd
      return { start, lastDayInclusive }
    }

    // No reporting start but we have lastPricingDate → next day window
    if (lpd) {
      const start = addDaysUTC(lpd, 1)
      const lastDayInclusive = start
      return { start, lastDayInclusive }
    }
  }

  // MONTHLY frequency (existing logic - don't touch)
  if (freq === 'monthly') {
    // If we have a reporting start, we only consider lastPricingDate "real"
    // once it reaches (or passes) the month-end of the reporting start month.
    if (rsd) {
      const rsdMonthEnd = asUTC(rsd.getUTCFullYear(), rsd.getUTCMonth() + 1, 0) // 08/31/2025
      const hasRealLast = lpd && lpd >= rsdMonthEnd

      if (hasRealLast) {
        // Next month window
        const start = asUTC(lpd.getUTCFullYear(), lpd.getUTCMonth() + 1, 1) // 09/01/2025
        const lastDayInclusive = asUTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0) // 09/30/2025
        return { start, lastDayInclusive }
      }

      // First window → reporting_start_date month
      const start = rsd // 08/01/2025
      const lastDayInclusive = asUTC(rsd.getUTCFullYear(), rsd.getUTCMonth() + 1, 0) // 08/31/2025
      return { start, lastDayInclusive }
    }

    // No reporting start but we do have a lastPricingDate → next month window
    if (lpd) {
      const start = asUTC(lpd.getUTCFullYear(), lpd.getUTCMonth() + 1, 1)
      const lastDayInclusive = asUTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)
      return { start, lastDayInclusive }
    }
  }

  // QUARTERLY frequency (existing logic - don't touch)
  if (freq === 'quarterly') {
    if (rsd) {
      const rsdQuarterEnd = asUTC(rsd.getUTCFullYear(), Math.floor(rsd.getUTCMonth() / 3) * 3 + 3, 0)
      const hasRealLast = lpd && lpd >= rsdQuarterEnd

      if (hasRealLast) {
        const nextQuarterStart = addQuartersUTC(lpd, 1)
        const lastDayInclusive = asUTC(nextQuarterStart.getUTCFullYear(), nextQuarterStart.getUTCMonth() + 3, 0)
        return { start: nextQuarterStart, lastDayInclusive }
      }

      const start = startOfQuarterUTC(rsd)
      const lastDayInclusive = asUTC(start.getUTCFullYear(), start.getUTCMonth() + 3, 0)
      return { start, lastDayInclusive }
    }

    if (lpd) {
      const nextQuarterStart = addQuartersUTC(lpd, 1)
      const lastDayInclusive = asUTC(nextQuarterStart.getUTCFullYear(), nextQuarterStart.getUTCMonth() + 3, 0)
      return { start: nextQuarterStart, lastDayInclusive }
    }
  }

  return null
}

export const ToggleBetweenModals = ({
  tokenData,
  symbolsLoading,
  symbolsError,
  onSaveManual,
  onUploadFile,
  onPricingRefresh,
}) => {
  // ───────────────────────────────
  // Modal switches
  // ───────────────────────────────
  const [isChooserOpen, setChooserOpen] = useState(false)
  const [isManualOpen, setManualOpen] = useState(false)
  const [isUploadOpen, setUploadOpen] = useState(false)
  const [isAdhocOpen, setAdhocOpen] = useState(false)

  // ───────────────────────────────
  // Upload state
  // ───────────────────────────────
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [fileError, setFileError] = useState('')

  // ───────────────────────────────
  // Misc state
  // ───────────────────────────────
  const [orgId, setOrgId] = useState('')
  const [fundId, setFundId] = useState('')
  const [manualLoading, setManualLoading] = useState(false)
  const [manualError, setManualError] = useState('')
  const [symbols, setSymbols] = useState([]) // [{ name, price }]

  const agGridRef = useRef(null)
  const adhocGridRef = useRef(null)

  // summary/meta
  const [lastPricingDate, setLastPricingDate] = useState(null)
  const [metaError, setMetaError] = useState('')
  const [reportingFrequency, setReportingFrequency] = useState(tokenData?.fund?.reporting_frequency || tokenData?.reporting_frequency || '')
  const [reportingStartDate, setReportingStartDate] = useState(tokenData?.fund?.reporting_start_date || tokenData?.reporting_start_date || '')
  
  // Dashboard token for date formatting
  const dashboard = useDashboardToken()
  const fmt = dashboard?.date_format || 'MM/DD/YYYY'

  // ── ADHOC (custom) state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [customRows, setCustomRows] = useState([]) // [{ id, symbol, symbol_id?, price }]
  const [bulkPrice, setBulkPrice] = useState('')
  const [savingManual, setSavingManual] = useState(false)
  const [lastPricingLoading, setLastPricingLoading] = useState(false)
  const [lastPricingError, setLastPricingError] = useState('')
  const [newSymbol, setNewSymbol] = useState('')
  const [adhocError, setAdhocError] = useState('')
  const [adhocLoading, setAdhocLoading] = useState(false)
  const [savingCustom, setSavingCustom] = useState(false)
  const [customError, setCustomError] = useState('')
  const [hasValidPrice, setHasValidPrice] = useState(false)
  // helpers
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
  const currentFundId = fundId || tokenData?.fund_id || ''

  const coalesce = (...vals) => vals.find((v) => v !== undefined && v !== null && v !== '') ?? ''

  const toYMD = (v) => {
    if (!v) return ''
    if (v instanceof Date) return v.toISOString().slice(0, 10)
    const s = String(v)
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
    if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`
    const d = new Date(s)
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
  }

  const normalizeTokenPayload = (p = {}) => {
    const fund_id = coalesce(p.fund_id, p.fundId, p['custom:fund_id'])
    const org_id = coalesce(p.org_id, p.orgId, p['custom:org_id'])

    const reporting_frequency = coalesce(
      p.reporting_frequency,
      p.reportingFrequency,
      p['custom:reporting_frequency'],
      p.frequency,
      p.fund?.reporting_frequency,
    )

    const reporting_start_date = toYMD(
      coalesce(
        p.reporting_start_date,
        p.reportingStartDate,
        p.period_start,
        p.periodStart,
        p['custom:reporting_start_date'],
        p.fund?.reporting_start_date,
      ),
    )

    const selected_period = coalesce(p.selected_period, p.selectedPeriod, p.period, p['custom:selected_period'])
    const pricing_date = toYMD(coalesce(p.pricing_date, p.pricingDate, p['custom:pricing_date']))

    return {
      fund_id,
      org_id,
      reporting_frequency,
      reporting_start_date,
      selected_period,
      pricing_date,
    }
  }

  const gotoUpload = () => {
    setChooserOpen(false)
    setUploadOpen(true)
  }

  // Grab org_id & fund_id
  useEffect(() => {
    const token = Cookies.get('dashboardToken')
    if (!token) return
    try {
      const decoded = jwt.decode(token) || {}
      const normalized = normalizeTokenPayload(decoded)

      setFundId(normalized.fund_id || '')
      setOrgId(normalized.org_id || '')

      setReportingFrequency(normalized.reporting_frequency || decoded?.fund?.reporting_frequency || decoded?.reporting_frequency || '')
      setReportingStartDate(normalized.reporting_start_date || decoded?.fund?.reporting_start_date || decoded?.reporting_start_date || '')
    } catch (err) {
      console.error('Error decoding token:', err)
    }
  }, [])

  // Derived labels
  const windowInfo = useMemo(
    () => computePricingWindow(reportingFrequency, reportingStartDate, lastPricingDate),
    [reportingFrequency, reportingStartDate, lastPricingDate],
  )

  const freqLabel = reportingFrequency || '—'
  const periodLabel = windowInfo ? `${formatYmd(ymdUTC(windowInfo.start), fmt)} → ${formatYmd(ymdUTC(windowInfo.lastDayInclusive), fmt)}` : '—'
  const pricingDateLabel = windowInfo ? formatYmd(ymdUTC(windowInfo.lastDayInclusive), fmt) : '—'

  // Manual grid
  const manualCols = useMemo(
    () => [
      { headerName: 'Symbol', field: 'name', editable: false, flex: 1, sortable: true, filter: true },
      {
        headerName: 'Price',
        field: 'price',
        editable: true,
        width: 160,
        cellEditor: 'agTextCellEditor',
        singleClickEdit: true,

        // convert text → value
        valueParser: (p) => {
          const s = String(p.newValue ?? '').trim()
          if (s === '') return '' // allow empty
          const n = Number(s)
          return Number.isFinite(n) && n >= 0 ? n : p.oldValue // keep old if invalid
        },

        // optional visual cue (shouldn’t happen with parser above)
        cellClassRules: { 'bg-light text-danger': (p) => p.value !== '' && Number(p.value) < 0 },
      },
    ],
    [],
  )

  const defaultColDef = useMemo(() => ({ resizable: true, sortable: true }), [])

  const backToChooser = () => {
    setManualOpen(false)
    setChooserOpen(true)
  }

  // Upload
  const MAX_UPLOAD_MB = 5
  const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

  const validateSelectedFile = (f) => {
    if (!f) return 'Please select a file.'
    const name = f.name.toLowerCase()
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx')) return 'Only .csv or .xlsx files are allowed.'
    if (f.size > MAX_UPLOAD_BYTES) return `File too large. Max ${MAX_UPLOAD_MB} MB.`
    return ''
  }

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null
    const err = validateSelectedFile(f)
    if (err) {
      setFile(null)
      setFileError(err)
    } else {
      setFile(f)
      setFileError('')
    }
  }

  const handleUploadSave = async () => {
    const err = validateSelectedFile(file)
    if (err) return setFileError(err)
    if (!currentFundId) return setFileError('Fund not selected.')

    setIsUploading(true)
    setFileError('')
    try {
      if (typeof onUploadFile === 'function') {
        await onUploadFile(file)
      } else {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('fund_id', currentFundId)
        if (orgId) fd.append('org_id', orgId)

        const token = Cookies.get('dashboardToken') || ''
        const url = `${API_BASE}/api/v1/pricing/${encodeURIComponent(currentFundId)}/upload`
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: fd
        })
        
        // Parse response once
        let result = null
        try {
          const responseText = await resp.text()
          if (responseText) {
            result = JSON.parse(responseText)
          }
        } catch (parseErr) {
          // Response might not be JSON, that's okay
          console.log('[Upload Pricing] Response is not JSON')
        }
        
        if (!resp.ok) {
          const errorMsg = result?.error || result?.message || `Upload failed (HTTP ${resp.status})`
          throw new Error(errorMsg)
        }

        // Check if backend returned success=false even with HTTP 200
        if (result && (result.success === false || result.error)) {
          throw new Error(result?.error || result?.message || 'Upload failed to save')
        }

        // Log response for debugging
        if (result) {
          console.log('[Upload Pricing] Response:', {
            file_id: result.file_id,
            success: result.success,
            message: result.message,
            rows_total: result.rows_total,
            rows_valid: result.rows_valid,
            rows_invalid: result.rows_invalid
          })
        }
      }
      
      // Close ALL modals after successful upload
      setUploadOpen(false)
      setChooserOpen(false)
      setManualOpen(false)
      setAdhocOpen(false)
      setFile(null)
      setFileError('')

      if (typeof onPricingRefresh === 'function') {
        onPricingRefresh()
      }
    } catch (e) {
      console.error('[Upload Pricing] Error:', e)
      setFileError(e?.message || 'Upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  // Manual symbols fetch
  const fetchManualSymbols = useCallback(async () => {
    if (!currentFundId) {
      setManualError('Missing fund id')
      return
    }

    const path = `${API_BASE}/api/v1/pricing/manual/${encodeURIComponent(currentFundId)}`
    const qs = new URLSearchParams()
    if (reportingFrequency) qs.set('frequency', reportingFrequency)
    
    // For annually, use the computed window period (full year) instead of monthly period
    const freq = String(reportingFrequency || '').toLowerCase()
    if (freq === 'annual' || freq === 'annually') {
      // Use the computed windowInfo period for annually (full year)
      if (windowInfo) {
        const periodStr = `${ymdUTC(windowInfo.start)}_${ymdUTC(windowInfo.lastDayInclusive)}`
        qs.set('period', periodStr)
      }
    } else if (tokenData?.selected_period) {
      // For other frequencies, use selected_period from tokenData
      qs.set('period', tokenData.selected_period)
    }
    
    const url = qs.toString() ? `${path}?${qs}` : path

    const token = Cookies.get('dashboardToken') || ''

    try {
      setManualLoading(true)
      setManualError('')

      const resp = await fetch(url, {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-fund-id': currentFundId,
        },
      })

      if (!resp.ok) {
        let msg = `HTTP ${resp.status}`
        try {
          const j = await resp.json()
          if (j?.error) msg = j.error
        } catch {}
        throw new Error(msg)
      }

      const json = await resp.json()
      const rows = (json?.symbols || []).map((s) => ({
        name: s.symbol_name || s.symbol || s.name || s.symbol_id,
        price: '',
      }))
      setSymbols(rows)
    } catch (e) {
      setManualError(e.message || 'Failed to fetch symbols')
    } finally {
      setManualLoading(false)
    }
  }, [API_BASE, currentFundId, reportingFrequency, windowInfo, tokenData?.selected_period])

  const gotoManual = async () => {
    setChooserOpen(false)
    setManualOpen(true)
    await fetchManualSymbols()
  }

  const postManualPricing = async (entries) => {
    if (!currentFundId) throw new Error('Missing fund id')

    const url = `${API_BASE}/api/v1/pricing/manual/${encodeURIComponent(currentFundId)}`
    const token = Cookies.get('dashboardToken') || ''

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ entries }),
    })

    if (!resp.ok) {
      let msg = `HTTP ${resp.status}`
      try {
        const errJson = await resp.json()
        if (errJson?.error) msg = errJson.error
      } catch {}
      throw new Error(msg)
    }
    return resp.json()
  }

  const handleManualSave = async () => {
    const rows = []
    agGridRef.current?.api?.forEachNode((n) => rows.push({ ...n.data }))

    const entries = []
    for (const r of rows) {
      const name = (r?.name || '').trim()
      if (!name) continue

      const value = r?.price

      if (value === '' || value === null || typeof value === 'undefined') {
        entries.push({ symbol: name, price: null })
        continue
      }

      const priceNum = Number(value)
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        setManualError(`Invalid price for ${name}. Please enter a non-negative number.`)
        return
      }

      entries.push({ symbol: name, price: priceNum })
    }

    const payload = entries.length ? entries : [{ symbol: '', price: null }]

    try {
      setManualError('')
      setSavingManual(true)

      await postManualPricing(payload)

      // Close ALL modals after successful save
      setManualOpen(false)
      setChooserOpen(false)
      setUploadOpen(false)
      setAdhocOpen(false)

      if (typeof onPricingRefresh === 'function') {
        onPricingRefresh()
      }

      // refresh last pricing date
      try {
        if (currentFundId) {
          const r = await fetch(`${API_BASE}/api/v1/pricing/lastPricingdate/${encodeURIComponent(currentFundId)}`, {
            headers: { Accept: 'application/json' },
          })
          if (r.ok) {
            const j = await r.json()
            const last = j?.last_pricing_date || j?.meta?.last_pricing_date || j?.data?.last_pricing_date || j?.result?.last_pricing_date || null
            setLastPricingDate(last || null)
          }
        }
      } catch {}
    } catch (e) {
      setManualError(e?.message || 'Failed to save manual pricing.')
    } finally {
      setSavingManual(false)
    }
  }

  // Fetch the last pricing date
  useEffect(() => {
    if (!currentFundId) return
    let cancelled = false
    const url = `${API_BASE}/api/v1/pricing/lastPricingdate/${encodeURIComponent(currentFundId)}`
    ;(async () => {
      try {
        const resp = await fetch(url, { headers: { Accept: 'application/json' } })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const json = await resp.json()
        const last =
          json?.last_pricing_date || json?.meta?.last_pricing_date || json?.data?.last_pricing_date || json?.result?.last_pricing_date || null
        if (!cancelled) setLastPricingDate(last || null)
      } catch (e) {
        if (!cancelled) setMetaError('Failed to load last pricing date')
        console.warn('[summary] last pricing date fetch failed:', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [API_BASE, currentFundId])

  // NEW: From = LPD + 1; or if no LPD, use reporting_start_date
  useEffect(() => {
    if (!isAdhocOpen) return

    if (lastPricingDate) {
      const next = addDaysUTC(ymdUTC(lastPricingDate), 1) // 2025-08-31 -> 2025-09-01
      setStartDate(next)
      setEndDate('') // reset Till for new month
      setCustomError('')
      return
    }

    // first time: seed from reporting_start_date
    if (reportingStartDate) {
      setStartDate(ymdUTC(reportingStartDate))
      setEndDate('')
      setCustomError('')
    }
  }, [isAdhocOpen, lastPricingDate, reportingStartDate])

  // Adhoc helpers
  const addCustomRow = () => {
    const s = newSymbol.trim()
    if (!s) return
    const exists = customRows.some((r) => r.symbol?.toLowerCase() === s.toLowerCase())
    if (exists) return setAdhocError('Symbol already added.')
    setCustomRows((prev) => [...prev, { id: crypto.randomUUID(), symbol: s, price: '' }])
    setNewSymbol('')
    setAdhocError('')
  }

  const fetchCustomOpenSymbols = useCallback(async () => {
    if (!currentFundId) return []
    if (!endDate) return []

    const base = `${API_BASE}/api/v1/pricing/custom/${encodeURIComponent(currentFundId)}`
    const param = new URLSearchParams()
    if (startDate) param.set('from', startDate)
    if (endDate) param.set('till', endDate)
    const url = `${base}?${param.toString()}`

    const token = Cookies.get('dashboardToken') || ''
    const resp = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const json = await resp.json()
    return json.symbols || []
  }, [API_BASE, currentFundId, startDate, endDate])

  const mergeAdhocRows = useCallback((incoming) => {
    setCustomRows((prev) => {
      const byId = new Map(prev.map((r) => [String(r.symbol_id || r.symbol).toLowerCase(), r]))
      const out = [...prev]
      for (const s of incoming) {
        const symbol_name = s.symbol_name || s.name || s.symbol || ''
        const symbol_id = s.symbol_id || s.symbol_uid || symbol_name
        const key = String(symbol_id || symbol_name).toLowerCase()
        if (!symbol_name || byId.has(key)) continue
        const rec = { id: crypto.randomUUID(), symbol: symbol_name, symbol_id, price: '' }
        byId.set(key, rec)
        out.push(rec)
      }
      return out
    })
  }, [])

  useEffect(() => {
    if (!isAdhocOpen) return
    if (!endDate) return
    if (startDate && new Date(startDate) > new Date(endDate)) return

    let cancelled = false
    ;(async () => {
      try {
        setAdhocLoading(true)
        setAdhocError('')
        const rows = await fetchCustomOpenSymbols()
        if (!cancelled) mergeAdhocRows(rows)
      } catch (e) {
        if (!cancelled) setAdhocError('Failed to fetch symbols for this range.')
      } finally {
        if (!cancelled) setAdhocLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isAdhocOpen, startDate, endDate, fetchCustomOpenSymbols, mergeAdhocRows])

  const openAdhoc = () => {
    setEndDate('')
    setAdhocOpen(true)
  }

  const adhocCols = useMemo(
    () => [
      { headerName: 'Symbol', field: 'symbol', editable: false, flex: 1, sortable: true, filter: true },
      {
        headerName: 'Price',
        field: 'price',
        editable: true,
        width: 160,
        cellEditor: 'agTextCellEditor',
        singleClickEdit: true,

        // convert text → value
        valueParser: (p) => {
          const s = String(p.newValue ?? '').trim()
          if (s === '') return '' // allow empty
          const n = Number(s)
          return Number.isFinite(n) && n >= 0 ? n : p.oldValue // keep old if invalid
        },

        // optional visual cue (shouldn’t happen with parser above)
        cellClassRules: { 'bg-light text-danger': (p) => p.value !== '' && Number(p.value) < 0 },
      },
    ],
    [],
  )

  const postCustomPricing = async ({ pricing_date, entries, file_id = null }) => {
    if (!currentFundId) throw new Error('Missing fund id')
    if (!pricing_date) throw new Error('Missing pricing_date')

    const url = `${API_BASE}/api/v1/pricing/custom/${encodeURIComponent(currentFundId)}`
    const token = Cookies.get('dashboardToken') || ''

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ pricing_date, entries, file_id }),
    })

    if (!resp.ok) {
      let msg = `HTTP ${resp.status}`
      try {
        const j = await resp.json()
        if (j?.error) msg = j.error
      } catch {}
      throw new Error(msg)
    }
    return resp.json()
  }

  const handleAdhocSave = async () => {
    adhocGridRef.current?.api?.stopEditing()
    const pricing_date = (endDate || '').slice(0, 10)
    const entries = customRows
      .filter((r) => r.symbol && r.price !== '' && Number(r.price) >= 0)
      .map((r) => ({ symbol: r.symbol, price: Number(r.price) }))

    if (!pricing_date) return setCustomError('Please select a Till Date.')
    if (!entries.length) return setCustomError('Please enter at least one non-negative price.')

    try {
      setCustomError('')
      setSavingCustom(true)
      await postCustomPricing({ pricing_date, entries /*, file_id*/ })

      // Close ALL modals after successful save
      setAdhocOpen(false)
      setChooserOpen(false)
      setManualOpen(false)
      setUploadOpen(false)
      setCustomRows([])
      setStartDate('')
      setEndDate('')

      if (typeof onPricingRefresh === 'function') {
        onPricingRefresh()
      }

      try {
        if (currentFundId) {
          const url = `${API_BASE}/api/v1/pricing/lastPricingdate/${encodeURIComponent(currentFundId)}`
          const r = await fetch(url, { headers: { Accept: 'application/json' } })
          if (r.ok) {
            const j = await r.json()
            const last = j?.last_pricing_date || j?.meta?.last_pricing_date || j?.data?.last_pricing_date || j?.result?.last_pricing_date || null
            setLastPricingDate(last || null)
          }
        }
      } catch {}
    } catch (e) {
      setCustomError(e?.message || 'Failed to save custom pricing.')
    } finally {
      setSavingCustom(false)
    }
  }

  const hasAtLeastOneValidAdhocRow = () => {
    if (adhocGridRef.current?.api) {
      let ok = false
      adhocGridRef.current.api.forEachNode((n) => {
        const sym = n.data?.symbol || n.data?.name || n.data?.symbol_name || n.data?.symbol_id
        const p = Number(n.data?.price)
        if (sym && n.data?.price !== '' && Number.isFinite(p) && p >= 0) ok = true
      })
      return ok
    }
    return customRows.some((r) => {
      const sym = r.symbol || r.name || r.symbol_name || r.symbol_id
      const p = Number(r.price)
      return sym && r.price !== '' && Number.isFinite(p) && p >= 0
    })
  }

  const canSaveAdhoc = !!endDate && hasValidPrice && !savingCustom

  const recomputeHasValid = useCallback(() => {
    if (!adhocGridRef.current?.api) {
      setHasValidPrice(
        customRows.some(
          (r) => (r.symbol || r.name || r.symbol_name || r.symbol_id) && r.price !== '' && Number.isFinite(Number(r.price)) && Number(r.price) >= 0,
        ),
      )
      return
    }
    let ok = false
    adhocGridRef.current.api.forEachNode((n) => {
      const sym = n.data?.symbol || n.data?.name || n.data?.symbol_name || n.data?.symbol_id
      const p = Number(n.data?.price)
      if (sym && n.data?.price !== '' && Number.isFinite(p) && p >= 0) ok = true
    })
    setHasValidPrice(ok)
  }, [customRows])

  // call after every cell edit
  const onAdhocCellValueChanged = () => {
    // keep your existing row copy line if you want
    setCustomRows((prev) => [...prev])
    // then recompute on next tick
    Promise.resolve().then(recomputeHasValid)
  }

  // also recompute when rows change programmatically
  useEffect(() => {
    recomputeHasValid()
  }, [customRows, recomputeHasValid])

  // YYYY-MM-DD -> next day (UTC)
  const addDaysUTC = (ymd, n = 1) => {
    if (!ymd) return ''
    const d = new Date(`${ymd}T00:00:00Z`)
    if (Number.isNaN(d.getTime())) return ''
    d.setUTCDate(d.getUTCDate() + n)
    return d.toISOString().slice(0, 10)
  }

  // Month end for a given YYYY-MM-DD (UTC)
  const endOfMonthUTC = (ymd) => {
    if (!ymd) return ''
    const d = new Date(`${ymd}T00:00:00Z`)
    if (Number.isNaN(d.getTime())) return ''
    // move to 1st of next month, then -1 day
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))
    return last.toISOString().slice(0, 10)
  }

  // Check if two YYYY-MM-DD are in the same calendar month (UTC)
  const sameMonthUTC = (a, b) => {
    if (!a || !b) return true
    return a.slice(0, 7) === b.slice(0, 7)
  }
  useEffect(() => {
    if (!startDate) return
    const maxAllowed = endOfMonthUTC(startDate)
    if (endDate && (!sameMonthUTC(startDate, endDate) || endDate > maxAllowed || endDate < startDate)) {
      setEndDate('')
      setCustomError('')
    }
  }, [startDate])
  useEffect(() => {
    if (!isAdhocOpen) return

    // CASE A: we have a lastPricingDate → From = LPD + 1
    if (lastPricingDate) {
      const next = addDaysUTC(ymdUTC(lastPricingDate), 1)
      setStartDate(next)
      setEndDate('')
      setCustomError('')
      return
    }

    // CASE B: first time (no LPD) → From = reporting_start_date (no +1)
    if (reportingStartDate) {
      setStartDate(ymdUTC(reportingStartDate))
      setEndDate('')
      setCustomError('')
    } else {
      setStartDate('')
    }
  }, [isAdhocOpen, lastPricingDate, reportingStartDate])

  return (
    <>
      {/* ===== Launcher bar (outside any modal) ===== */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <Button variant="primary" onClick={() => setChooserOpen(true)}>
          Add Valuation
        </Button>

        <Dropdown align="end">
          <Dropdown.Toggle as={EllipsisToggle} id="adhoc-ellipsis" />
          <Dropdown.Menu>
            <Dropdown.Item onClick={openAdhoc}>Adhoc Pricing (Advanced)</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* ===== Chooser (Manual + Upload) ===== */}
      <Modal show={isChooserOpen} onHide={() => setChooserOpen(false)} centered size="lg">
        <Modal.Header closeButton className="align-items-start">
          <Modal.Title as="h5">Add Valuation</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* Summary */}
          <div className="border rounded p-3 mb-3 bg-light">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="small text-muted">Reporting Frequency</div>
                <div className="fw-semibold">{freqLabel}</div>
              </div>
              <div className="col-md-4">
                <div className="small text-muted">Pricing Period</div>
                <div className="fw-semibold">{periodLabel}</div>
                <div className="small text-muted">(end is exclusive)</div>
              </div>
              <div className="col-md-4">
                <div className="small text-muted">Pricing Date</div>
                <div className="fw-semibold">{pricingDateLabel}</div>
                <div className="small text-muted">last day (inclusive)</div>
              </div>
            </div>
          </div>

          {/* Choices */}
          <div className="d-flex flex-column flex-md-row gap-3">
            <div className="flex-fill border rounded p-4">
              <h6 className="mb-1">Add it manually</h6>
              <div className="text-muted small mb-3">Type in prices directly for symbols.</div>
              <Button variant="primary" onClick={gotoManual}>
                Open Manual Pricing
              </Button>
            </div>

            <div className="flex-fill border rounded p-4">
              <h6 className="mb-1">Upload a file</h6>
              <div className="text-muted small mb-3">Use our locked template and upload in bulk.</div>
              <Button variant="outline-primary" onClick={gotoUpload}>
                Open Upload
              </Button>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setChooserOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== Manual ===== */}
      <Modal show={isManualOpen} onHide={() => setManualOpen(false)} centered size="lg">
        <Modal.Header closeButton style={{ borderTop: '4px solid #0d6efd' }}>
          <Modal.Title as="h5">Manual Pricing</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-muted small mb-2">Edit inline; negative values are rejected.</div>
          <div className="ag-theme-quartz" style={{ height: 150, width: '100%' }}>
            <AgGridReact
              ref={agGridRef}
              rowData={symbols}
              columnDefs={manualCols}
              defaultColDef={defaultColDef}
              suppressMovableColumns
              singleClickEdit
              stopEditingWhenCellsLoseFocus={true}
            />
          </div>
          {!!manualError && <div className="text-danger small mt-2">{manualError}</div>}
          {!symbols?.length && (
            <div className="mt-3 d-flex flex-column gap-2">
              <div className="alert alert-info py-2 mb-0 small">
                No symbols for this month. If you need reports, click <strong>Save</strong> to store an empty pricing for this month.
              </div>
              {/* <div>
                <Button size="sm" variant="outline-primary" onClick={fetchManualSymbols} disabled={manualLoading}>
                  {manualLoading ? 'Loading…' : 'Load Symbols'}
                </Button>
              </div> */}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={backToChooser}>
            Back
          </Button>
          <Button variant="primary" onClick={handleManualSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== Upload ===== */}
      <Modal show={isUploadOpen} onHide={() => setUploadOpen(false)} centered>
        <Modal.Header closeButton style={{ borderTop: '4px solid #20c997' }}>
          <Modal.Title as="h5">Upload Pricing File</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="card">
            <div className="card-header fw-semibold">File Upload</div>
            <div className="card-body">
              <div className="d-flex justify-content-end">
                {currentFundId ? (
                  <a
                    href={`${API_BASE}/api/v1/pricing/${currentFundId}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary"
                    style={{ fontSize: 16, textDecoration: 'underline' }}>
                    Download Pricing Template
                  </a>
                ) : (
                  <span className="text-muted small">Fund not selected</span>
                )}
              </div>

              <p className="mt-3 mb-2">Choose a file (CSV or XLSX) to upload valuations:</p>
              <input type="file" accept=".csv,.xlsx" onChange={handleFileChange} className={`form-control ${fileError ? 'is-invalid' : ''}`} />
              {file && <p className="mt-2">Selected file: {file.name}</p>}
              {fileError && <div className="invalid-feedback d-block">{fileError}</div>}

              <div className="text-muted small mt-2">
                The template locks all columns except <strong>Price</strong> and prevents negative values.
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setUploadOpen(false)} disabled={isUploading}>
            Back
          </Button>
          <Button variant="success" onClick={handleUploadSave} disabled={isUploading || !file || !!fileError}>
            {isUploading ? 'Uploading…' : 'Upload'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== Adhoc (advanced) ===== */}
      <Modal show={isAdhocOpen} onHide={() => setAdhocOpen(false)} centered size="xl">
        <Modal.Header closeButton style={{ borderTop: '4px solid #6f42c1' }}>
          <Modal.Title as="h5">Adhoc Pricing (Advanced)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">From</label>
              <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Till</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                min={startDate || undefined}
                max={startDate ? endOfMonthUTC(startDate) : undefined}
                onChange={(e) => {
                  const v = e.target.value
                  if (!startDate) {
                    setEndDate(v)
                    return
                  }

                  const minAllowed = startDate
                  const maxAllowed = endOfMonthUTC(startDate)

                  let next = v
                  if (v && v < minAllowed) next = minAllowed
                  if (v && v > maxAllowed) next = maxAllowed

                  // month lock (shouldn’t trigger because of max, but safe guard)
                  if (next && !sameMonthUTC(startDate, next)) {
                    setCustomError('Till Date must be within the same month.')
                    next = maxAllowed
                  } else {
                    setCustomError('')
                  }

                  setEndDate(next)
                }}
              />
              {adhocLoading && <div className="small text-muted mt-1">Fetching…</div>}
              {adhocError && <div className="small text-danger mt-1">{adhocError}</div>}
              {!!customError && <div className="small text-danger mt-1">{customError}</div>}
            </div>
          </div>

          <div className="ag-theme-quartz mt-3" style={{ height: 200, width: '100%' }}>
            <AgGridReact
              ref={adhocGridRef}
              rowData={customRows}
              columnDefs={adhocCols}
              defaultColDef={defaultColDef}
              suppressMovableColumns
              onCellValueChanged={onAdhocCellValueChanged}
              singleClickEdit
              stopEditingWhenCellsLoseFocus={true}
            />
          </div>

          {!!customError && <div className="text-danger small mt-2">{customError}</div>}
          <div className="text-muted small mt-2">
            Tip: change the <em>Till Date</em> to refresh symbols automatically.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAdhocOpen(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleAdhocSave} disabled={!canSaveAdhoc}>
            {savingCustom ? 'Saving…' : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export const TradeModal = ({ onSuccess }) => {
  const { isOpen, size, className, toggleModal, openModalWithSize } = useModal()

  return (
    <>
      <Button type="button" variant="primary" onClick={() => openModalWithSize('lg')}>
        Add
      </Button>

      <Modal className="fade" show={isOpen} onHide={toggleModal} dialogClassName={className} size={size} centered>
        <Modal.Header onHide={toggleModal} closeButton>
          <h5 className="modal-title h4">Add Trades</h5>
        </Modal.Header>
        <Modal.Body>
          <AddTrade
            onClose={toggleModal}
            onCreated={() => {
              if (typeof onSuccess === 'function') onSuccess()
            }}
          />
        </Modal.Body>
      </Modal>
    </>
  )
}
const FullScreenModals = () => {
  const sizes = ['sm-down', 'md-down', 'lg-down', 'xl-down', 'xxl-down']
  const [fullscreen, setFullscreen] = useState(undefined)
  const [show, setShow] = useState(false)
  const handleShow = (breakpoint) => {
    setFullscreen(breakpoint)
    setShow(true)
  }
  return (
    <ComponentContainerCard
      id="fullscreen-modal"
      title="Fullscreen Modal"
      description={
        <>
          Modals have three optional sizes, available via modifier classes to be placed on a <code>.modal-dialog</code>. These sizes kick in at
          certain breakpoints to avoid horizontal scrollbars on narrower viewports.
        </>
      }>
      <div className="hstack flex-wrap gap-2">
        <Button variant="primary" onClick={() => setShow(true)}>
          Full screen
        </Button>
        {sizes.map((size, idx) => (
          <Button key={idx} onClick={() => handleShow(size)}>
            Full Screen
            {typeof size === 'string' && ` Below ${size.split('-')[0]}`}
          </Button>
        ))}
      </div>

      <Modal show={show} className="fade" fullscreen={fullscreen ?? true} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Modal</Modal.Title>
        </Modal.Header>
        <Modal.Body>...</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </ComponentContainerCard>
  )
}
export const ModalWithAlerts = () => {
  const { isOpen, className, toggleModal, openModalWithClass } = useModal()
  return (
    <ComponentContainerCard
      id="modal-alerts"
      title="Modal Based Alerts"
      description={
        <>
          {' '}
          Modals have three optional sizes, available via modifier classes to be placed on a <code>.modal-dialog</code>. These sizes kick in at
          certain breakpoints to avoid horizontal scrollbars on narrower viewports.
        </>
      }>
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
          <Modal.Body>
            <div className="text-center">
              <IconifyIcon icon="bx:check-double" className="display-6 mt-0 text-white" />
              <h4 className="mt-3 text-white">Well Done!</h4>
              <p className="mt-3">Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam.</p>
              <Button variant="light" type="button" className="mt-3" onClick={toggleModal}>
                Continue
              </Button>
            </div>
          </Modal.Body>
        </div>
      </Modal>
    </ComponentContainerCard>
  )
}
export function VerticallyCenteredModal({
  buttonLabel = 'Open Modal',
  ModalTitle = 'Modal title',
  modalBody = 'Default body text',
  onSave, // Optional callback for "Save changes"
  onClose, // Optional callback for "Close"
}) {
  const { isTrue: isOpen, toggle } = useToggle()

  return (
    <>
      {/* The button that toggles the modal */}
      <Button variant="primary" type="button" onClick={toggle}>
        {buttonLabel}
      </Button>

      {/* The Modal itself */}
      <Modal show={isOpen} onHide={toggle} className="fade" centered>
        <Modal.Header>
          <Modal.Title as="h5">{modalTitle}</Modal.Title>
          <button type="button" className="btn-close" onClick={toggle} />
        </Modal.Header>
        <Modal.Body>{ModalBody}</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              if (onClose) onClose()
              toggle() // close modal
            }}>
            Close
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={() => {
              if (onSave) onSave()
              toggle() // close modal
            }}>
            Save changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
export function AddFundModal({ onFundCreated, buttonLabel = 'Add Fund', modalTitle = 'Add Fund ', modalBody = <p>Add Fund</p>, onSave, onClose }) {
  const { isTrue, toggle } = useToggle()
  const handleSuccess = (createdFund) => {
    onFundCreated?.(createdFund) // or pass createdFund up if you return it
    close()
  }
  return (
    <>
      {/* Button to open the modal */}
      <Button variant="primary" onClick={toggle}>
        {buttonLabel}
      </Button>

      {/* The Modal itself */}
      <Modal size="xl" show={isTrue} onHide={toggle} className="fade" centered>
        <Modal.Header>
          <h5 className="modal-title" id="exampleModalCenterTitle">
            {modalTitle}
          </h5>
          <button type="button" className="btn-close" onClick={toggle} />
        </Modal.Header>
        <Modal.Body>{<AddFund onClose={toggle} onSuccess={handleSuccess} />}</Modal.Body>
      </Modal>
    </>
  )
}

export function AddStatementBalanceModal({
  buttonLabel = 'Add Statement Balance',
  modalTitle = 'Add Statement Balance',
  modalBody = <AddStatementBalance />,
  onSave,
  onClose,
}) {
  const [show, setShow] = useState(false)

  const toggle = () => setShow(!show)

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
        <Modal.Body>{modalBody}</Modal.Body>
      </Modal>
    </>
  )
}

export function UploadManualJournalModal({
  buttonLabel = 'Upload',
  modalTitle = 'Upload Manual Journal',
  onClose,
}) {
  const [show, setShow] = useState(false);

  const handleOpen = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    onClose?.();
  };

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
          <UploadManualJournal onClose={handleClose} />
        </Modal.Body>
      </Modal>
    </>
  );
}


const AllModals = () => {
  return (
    <>
      <DefaultModal />
      <StaticBackdropModal />
      <ScrollingModals />
      <ModalPositions />
      <ToggleBetweenModals />
      {/* <ModalSizes /> */}
      <TradeModal />
      <FullScreenModals />
      <ModalWithAlerts />
      <GLEntryModal />
      <AddFundModal />
      <AddStatementBalanceModal />
      <UploadManualJournalModal />
    </>
  )
}
export default AllModals
