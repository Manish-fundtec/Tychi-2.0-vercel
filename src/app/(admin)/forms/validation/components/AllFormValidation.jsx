'use client'

import clsx from 'clsx'
import { useState, useEffect, useMemo, useRef } from 'react'
import { Button, Col, Form, FormCheck, FormControl, FormGroup, FormLabel, FormSelect, InputGroup, Row, Modal, Spinner, Alert } from 'react-bootstrap'
import { useNotificationContext } from '@/context/useNotificationContext'
import Feedback from 'react-bootstrap/esm/Feedback'
import InputGroupText from 'react-bootstrap/esm/InputGroupText'
import ComponentContainerCard from '@/components/ComponentContainerCard'
import { serverSideFormValidate } from '@/helpers/data'
import ChoicesFormInput from '@/components/from/ChoicesFormInput'
import { createFund } from '@/lib/api/fund'
import { useSession } from 'next-auth/react'
import { useUserToken } from '@/hooks/useUserToken'
import { useDashboardToken } from '@/hooks/useDashboardToken'
import Cookies from 'js-cookie'
import jwt from 'jsonwebtoken'
import api from '../../../../../lib/api/axios'
import { uploadTradeFile, createTrade } from '@/lib/api/uploadTrade'
import { uploadMigrationFile } from '@/lib/api/migration'
import { addTrade } from '@/lib/api/trades'
import { getExchangesByFundId } from '@/lib/api/exchange'
import currencies from 'currency-formatter/currencies'
import { jwtDecode } from 'jwt-decode'
import { fetchChartOfAccounts } from '@/lib/api/reports'

// import {downloadTradeTemplate} from '@/lib/api/trade';
const BrowserDefault = () => {
  return (
    <ComponentContainerCard
      id="browser-defaults"
      title="Browser Default"
      description={<>Depending on your browser and OS, you’ll see a slightly different style of feedback.</>}>
      <form className="row g-3">
        <Col md={4}>
          <FormLabel htmlFor="validationDefault01">First name</FormLabel>
          <FormControl type="text" id="validationDefault01" defaultValue="Mark" required />
        </Col>
        <Col md={4}>
          <FormLabel htmlFor="validationDefault02">Last name</FormLabel>
          <FormControl type="text" id="validationDefault02" defaultValue="Otto" required />
        </Col>
        <Col md={4}>
          <FormLabel htmlFor="validationDefaultUsername">Username</FormLabel>
          <div className="input-group">
            <span className="input-group-text" id="inputGroupPrepend2">
              @
            </span>
            <FormControl type="text" id="validationDefaultUsername" aria-describedby="inputGroupPrepend2" required />
          </div>
        </Col>
        <Col md={6}>
          <FormLabel htmlFor="validationDefault03">City</FormLabel>
          <FormControl type="text" id="validationDefault03" required />
        </Col>
        <Col md={3}>
          <FormLabel htmlFor="validationDefault04">State</FormLabel>
          <FormSelect id="validationDefault04" required>
            <option disabled>Choose...</option>
            <option>...</option>
          </FormSelect>
        </Col>
        <Col md={3}>
          <FormLabel htmlFor="validationDefault05">Zip</FormLabel>
          <FormControl type="text" id="validationDefault05" required />
        </Col>
        <Col xs={12}>
          <FormCheck label="Agree to terms and conditions" id="term1" required />
        </Col>
        <Col xs={12}>
          <Button variant="primary" type="submit">
            Submit form
          </Button>
        </Col>
      </form>
    </ComponentContainerCard>
  )
}

const CustomStyles = () => {
  const [validated, setValidated] = useState(false)
  const handleSubmit = (event) => {
    const form = event.currentTarget
    if (form.checkValidity() === false) {
      event.preventDefault()
      event.stopPropagation()
    }
    setValidated(true)
  }
  return (
    <ComponentContainerCard
      id="custom-styles"
      title="Custom styles"
      description={
        <>
          For custom Bootstrap form validation messages, you’ll need to add the <code>novalidate</code> boolean attribute to your{' '}
          <code>&lt;form&gt;</code>. This disables the browser default feedback tooltips, but still provides access to the form validation APIs in
          JavaScript. When attempting to submit, you’ll see the <code>:invalid</code> and <code>:valid</code> styles applied to your form controls.
        </>
      }>
      <Form className="row g-3 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
        <FormGroup className="col-md-4">
          <FormLabel>First name</FormLabel>
          <FormControl type="text" id="validationCustom01" placeholder="First name" defaultValue="Mark" required />
          <Feedback>Looks good!</Feedback>
        </FormGroup>
        <FormGroup className="col-md-4">
          <FormLabel>Last name</FormLabel>
          <FormControl type="text" id="validationCustom02" placeholder="Last name" defaultValue="Otto" required />
          <Feedback>Looks good!</Feedback>
        </FormGroup>
        <FormGroup className="col-md-4">
          <FormLabel>Username</FormLabel>
          <InputGroup>
            <InputGroupText id="inputGroupPrepend">@</InputGroupText>
            <FormControl type="text" id="validationCustomUsername" placeholder="Username" required />
            <Feedback type="invalid">Please choose a username.</Feedback>
          </InputGroup>
        </FormGroup>
        <FormGroup className="col-md-6">
          <FormLabel>City</FormLabel>
          <FormControl type="text" id="validationCustom03" placeholder="City" required />
          <Feedback type="invalid">Please provide a valid city.</Feedback>
        </FormGroup>
        <FormGroup className="col-md-3">
          <FormLabel>State</FormLabel>
          <FormControl type="text" id="validationCustom04" placeholder="State" required />
          <Feedback type="invalid">Please provide a valid state.</Feedback>
        </FormGroup>
        <FormGroup className="col-md-3">
          <FormLabel>Zip</FormLabel>
          <FormControl type="text" id="validationCustom05" placeholder="Zip" required />
          <Feedback type="invalid">Please provide a valid zip.</Feedback>
        </FormGroup>
        <FormGroup className="col-12">
          <FormCheck
            id="invalidCheck"
            required
            label="Agree to terms and conditions"
            feedback="You must agree before submitting."
            feedbackType="invalid"
          />
        </FormGroup>
        <Col xs={12}>
          <Button variant="primary" type="submit">
            Submit form
          </Button>
        </Col>
      </Form>
    </ComponentContainerCard>
  )
}

const ServerSideValidation = () => {
  const [validated, setValidated] = useState(false)
  const [formErrors, setFormErrors] = useState([])
  const [formValue, setFormValue] = useState({
    fName: 'Mark',
    lName: 'Otto',
    username: '',
    city: '',
    state: '',
    zip: '',
  })
  const handleChange = (e) => {
    setFormValue({
      ...formValue,
      [e.target.name]: e.target.value,
    })
  }
  const isValidInput = (name) => {
    return !formErrors.find((key) => key.name === name)
  }
  const handleSubmit = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    setValidated(true)
    const validationReply = await serverSideFormValidate(formValue)
    const allErrors = []
    validationReply?.inner?.forEach((e) => {
      allErrors.push({
        name: e.path,
        message: e.message,
      })
    })
    setFormErrors(allErrors)
  }
  return (
    <ComponentContainerCard
      id="server-side"
      title="Server side"
      description={
        <>
          We recommend using client-side validation, but in case you require server-side validation, you can indicate invalid and valid form fields
          with <code>.is-invalid</code> and <code>.is-valid</code>. Note that <code>.invalid-feedback</code> is also supported with these classes.
        </>
      }>
      <Form className="row g-3" onSubmit={handleSubmit} noValidate>
        <FormGroup className="col-md-4" controlId="firstNameInput">
          <FormLabel>First name</FormLabel>
          <InputGroup hasValidation>
            <FormControl
              type="text"
              placeholder="First name"
              name="fName"
              isInvalid={!isValidInput('fName')}
              value={formValue.fName}
              className={clsx({
                'is-valid': validated && isValidInput('fName'),
              })}
              onChange={handleChange}
            />
            <Feedback type={isValidInput('fName') ? 'valid' : 'invalid'}>
              {isValidInput('fName') ? 'Looks good!' : formErrors.find((err) => err.name === 'fName')?.message}
            </Feedback>
          </InputGroup>
        </FormGroup>
        <FormGroup className="col-md-4">
          <FormLabel>Last name</FormLabel>
          <InputGroup hasValidation>
            <FormControl
              type="text"
              placeholder="Last name"
              name="lName"
              value={formValue.lName}
              onChange={handleChange}
              className={clsx({
                'is-valid': validated && isValidInput('lName'),
              })}
              isInvalid={!isValidInput('lName')}
            />
            <Feedback type={isValidInput('lName') ? 'valid' : 'invalid'}>
              {isValidInput('lName') ? 'Looks good!' : formErrors.find((err) => err.name === 'lName')?.message}
            </Feedback>
          </InputGroup>
        </FormGroup>
        <FormGroup className="col-md-4">
          <FormLabel>Username</FormLabel>
          <InputGroup>
            <InputGroup hasValidation>
              <InputGroupText>@</InputGroupText>
              <FormControl
                type="text"
                placeholder="Username"
                value={formValue.username}
                onChange={handleChange}
                name="username"
                className={clsx({
                  'is-valid': validated && isValidInput('username'),
                })}
                isInvalid={!isValidInput('username')}
              />
              <Feedback type={isValidInput('username') ? 'valid' : 'invalid'}>
                {isValidInput('username') ? 'Looks good!' : formErrors.find((err) => err.name === 'username')?.message}
              </Feedback>
            </InputGroup>
          </InputGroup>
        </FormGroup>
        <FormGroup className="col-md-6">
          <FormLabel>City</FormLabel>
          <InputGroup hasValidation>
            <FormControl
              type="text"
              placeholder="City"
              name="city"
              value={formValue.city}
              onChange={handleChange}
              className={clsx({
                'is-valid': validated && isValidInput('city'),
              })}
              isInvalid={!isValidInput('city')}
            />
            <Feedback type={isValidInput('city') ? 'valid' : 'invalid'}>
              {isValidInput('city') ? 'Looks good!' : formErrors.find((err) => err.name === 'city')?.message}
            </Feedback>
          </InputGroup>
        </FormGroup>
        <FormGroup className="col-md-3">
          <FormLabel>State</FormLabel>
          <InputGroup hasValidation>
            <FormControl
              type="text"
              name="state"
              placeholder="State"
              value={formValue.state}
              onChange={handleChange}
              className={clsx({
                'is-valid': validated && isValidInput('state'),
              })}
              isInvalid={!isValidInput('state')}
            />
            <Feedback type={isValidInput('state') ? 'valid' : 'invalid'}>
              {isValidInput('state') ? 'Looks good!' : formErrors.find((err) => err.name === 'state')?.message}
            </Feedback>
          </InputGroup>
        </FormGroup>
        <FormGroup className="col-md-3">
          <FormLabel>Zip</FormLabel>
          <FormControl
            type="text"
            placeholder="Zip"
            name="zip"
            value={formValue.zip}
            onChange={handleChange}
            className={clsx({
              'is-valid': validated && isValidInput('zip'),
            })}
            isInvalid={!isValidInput('zip')}
          />
          <Feedback type={isValidInput('zip') ? 'valid' : 'invalid'}>
            {isValidInput('zip') ? 'Looks good!' : formErrors.find((err) => err.name === 'zip')?.message}
          </Feedback>
        </FormGroup>
        <FormGroup className="col-12">
          <FormCheck type="checkbox" label="Agree to terms and conditions" />
        </FormGroup>
        <Col xs={12}>
          <Button variant="primary" type="submit">
            Submit form
          </Button>
        </Col>
      </Form>
    </ComponentContainerCard>
  )
}

export const AddTrade = ({ onClose, onCreated }) => {
  const [validated, setValidated] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [brokers, setBrokers] = useState([])
  const [symbols, setSymbols] = useState([])
  const [exchangeLookup, setExchangeLookup] = useState({})
  const [fundId, setFundId] = useState('')
  const [orgId, setOrgId] = useState('')
  const [amountLocked, setAmountLocked] = useState(true)
  const [reportingStartDate, setReportingStartDate] = useState('')

  const [calc, setCalc] = useState({
    commissionMethod: '',
    contractSize: 1,
    updatedUnitPrice: null,
    finalAmount: null,
  })

  const [formData, setFormData] = useState({
    symbol_id: '',
    trade_date: '',
    commission: '',
    price: '',
    quantity: '',
    broker_id: '',
    broker_name: '',
    description: '',
  })

  // tiny helper for odd API shapes: [] or { data: [] }
  const unwrap = (r) => (Array.isArray(r?.data) ? r.data : (r?.data?.data ?? []))
  const toNum = (v, d = 0) => (v === '' || v == null ? d : Number(v))

  // Grab org_id & fund_id from dashboardToken
  useEffect(() => {
    const token = Cookies.get('dashboardToken')
    if (!token) return
    try {
      const decoded = jwt.decode(token)
      setFundId(decoded?.fund_id || '')
      setOrgId(decoded?.org_id || '')

      const rawRsd =
        decoded?.fund?.reporting_start_date ||
        decoded?.reporting_start_date ||
        decoded?.reportingStartDate ||
        decoded?.RSD ||
        decoded?.fund_start_date

      if (rawRsd) {
        const match = String(rawRsd).match(/^\d{4}-\d{2}-\d{2}/)
        setReportingStartDate(match ? match[0] : String(rawRsd).slice(0, 10))
      }
    } catch (err) {
      console.error('Error decoding token:', err)
    }
  }, [])

  // 2) Fetch dropdowns when fundId present
  useEffect(() => {
    if (!fundId) return
    ;(async () => {
      try {
        const [b, s, e] = await Promise.allSettled([
          api.get(`/api/v1/broker/fund/${fundId}`),
          api.get(`/api/v1/symbols/fund/${fundId}`),
          getExchangesByFundId(fundId),
        ])
        setBrokers(b.status === 'fulfilled' ? unwrap(b.value) : [])
        setSymbols(s.status === 'fulfilled' ? unwrap(s.value) : [])

        if (e.status === 'fulfilled') {
          const list = e.value?.data || []
          const lookup = {}
          list.forEach((ex) => {
            const key = ex.exchange_uid || ex.exchange_id || ex.exchangeid
            if (!key) return
            lookup[key] = ex.exchange_name || ex.name || ex.exchangeid || ''
          })
          setExchangeLookup(lookup)
        } else {
          setExchangeLookup({})
        }
      } catch (err) {
        console.error('Dropdown fetch error', err)
        setExchangeLookup({})
      }
    })()
  }, [fundId])

  // derived symbol (gives us contract_size)
  const selectedSymbol = useMemo(() => symbols.find((s) => String(s.symbol_id) === String(formData.symbol_id)), [symbols, formData.symbol_id])
  // 🆕 useEffect: Fetch commission method and related symbol/assettype info
  // 3) Compute commission method + derived price/amount when key inputs change
  useEffect(() => {
    if (!formData.symbol_id || !fundId) return

    const qty = toNum(formData.quantity)
    const price = toNum(formData.price)
    const commission = toNum(formData.commission)
    const absQty = Math.abs(qty)
    const contractSize = Number(selectedSymbol?.contract_size ?? 1)

    if (!absQty || !price || !contractSize) {
      setCalc((c) => ({ ...c, contractSize, updatedUnitPrice: null, finalAmount: null }))
      return
    }

    ;(async () => {
      try {
        const res = await api.get('/api/v1/trade/getCommissionMethod', {
          params: { symbol_id: formData.symbol_id, fund_id: fundId },
        })
        // Support multiple response shapes + key aliases
        const methodRawValue =
          res?.data?.commission_accounting_method ??
          res?.data?.commission ??
          res?.data?.data?.commission_accounting_method ??
          res?.data?.commissionMethod ??
          res?.data?.data?.commissionMethod ??
          'expense'
        if (!methodRawValue) {
          console.warn('[getCommissionMethod] Response did not have a method key:', res?.data)
        }
        const methodRaw = String(methodRawValue || 'expense').toLowerCase()
        const isCapital = ['capital', 'capitalize', 'capitalized'].includes(methodRaw)

        const baseNotional = absQty * price * contractSize
        let finalAmount, updatedUnitPrice

        if (isCapital) {
          // BUY (+commission), SELL (-commission but not below zero
          const capitalTotal = qty > 0 ? baseNotional + commission : Math.max(baseNotional - commission, 0)
          finalAmount = capitalTotal
          updatedUnitPrice = capitalTotal / (contractSize * absQty)
        } else {
          // expense method -> commission is not capitalized into amount
          finalAmount = baseNotional
          updatedUnitPrice = price
        }

        setCalc({
          commissionMethod: methodRaw,
          contractSize,
          updatedUnitPrice: Number(updatedUnitPrice.toFixed(4)),
          finalAmount: Number(finalAmount.toFixed(2)),
        })
      } catch (err) {
        const status = err?.response?.status
        const data = err?.response?.data
        const url = err?.config?.url
        // const params = err?.config?.params
        console.error('[getCommissionMethod] request failed:', {
          status,
          url,
          params,
          data,
          message: err?.message,
        })
        // graceful fallback: expense-like behavior
        const baseNotional = absQty * price * contractSize
        setCalc({
          commissionMethod: 'unknown',
          contractSize,
          updatedUnitPrice: price,
          finalAmount: Number(baseNotional.toFixed(2)),
        })
      }
    })()
    // dependencies trimmed to only what affects computation
  }, [formData.symbol_id, fundId, formData.quantity, formData.price, formData.commission, selectedSymbol])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'broker_id') {
      const b = brokers.find((x) => String(x.broker_uid ?? x.broker_id ?? x.id) === String(value))
      setFormData((p) => ({
        ...p,
        broker_id: value,
        broker_name: b?.broker_name ?? b?.name ?? '',
      }))
    } else {
      setFormData((p) => ({ ...p, [name]: value }))
    }
  }
  useEffect(() => {
    if (!amountLocked) return

    // use calc.finalAmount when available, else blank
    if (calc.finalAmount != null && !Number.isNaN(calc.finalAmount)) {
      setFormData((p) => ({ ...p, amount: String(calc.finalAmount) }))
    } else {
      setFormData((p) => ({ ...p, amount: '' }))
    }
  }, [calc.finalAmount, amountLocked])
  const handleSubmit = async (e) => {
    e.preventDefault()

    const tradeBeforeRsd =
      reportingStartDate &&
      formData.trade_date &&
      new Date(`${formData.trade_date}T00:00:00Z`).getTime() < new Date(`${reportingStartDate}T00:00:00Z`).getTime()

    // Basic client-side checks
    if (!orgId || !fundId) {
      alert('Missing org_id / fund_id in token')
      return
    }
    if (!formData.symbol_id || !formData.trade_date) {
      setValidated(true)
      return
    }

    if (tradeBeforeRsd) {
      alert(`Trade date cannot be earlier than Reporting Start Date (${reportingStartDate}).`)
      setValidated(true)
      return
    }

    const price = toNum(formData.price)
    const commission = toNum(formData.commission)
    if (price === 0 && commission !== 0) {
      alert('If price is 0, commission must also be 0.')
      return
    }

    const payload = {
      org_id: orgId, // required by backend
      fund_id: fundId,
      symbol_id: formData.symbol_id,
      broker_id: (formData.broker_id ?? '').toString().trim() || null,
      broker_name: (formData.broker_name ?? '').toString().trim() || null,
      trade_date: formData.trade_date || new Date().toISOString(),
      price: toNum(formData.price),
      amount: calc.finalAmount ?? null,
      quantity: toNum(formData.quantity),
      commission: toNum(formData.commission),
      description: formData.description?.trim() || null,
      file_row_no: 1, // always 1 (as requested)
    }

    try {
      setIsSaving(true)
      const res = await addTrade(payload)
      if (res?.success) {
        onClose?.()
        alert(res?.message || 'Trade added successfully')
        onCreated?.(res?.trade || null)
        setValidated(false)
      } else {
        const errMsg = res?.message || 'Failed to add trade.'
        alert(errMsg)
        return
      }
    } catch (err) {
      console.error('Create trade failed:', err)
      const errMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Server error'
      alert(errMsg)
      return
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Form className="row g-5 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
      <FormGroup className="position-relative col-md-6">
        <FormLabel>Symbol Name</FormLabel>
        <Form.Select required name="symbol_id" value={formData.symbol_id} onChange={handleChange}>
          <option value="">-- Select Symbol --</option>
          {symbols.map((symbol, idx) => {
            const optionKey = symbol.symbol_uid || `${symbol.symbol_id || symbol.symbol_name || 'symbol'}-${idx}`
            const exchangeLabel =
              exchangeLookup?.[symbol.exchange_id] ||
              exchangeLookup?.[symbol.exchange_uid] ||
              symbol.exchange_name ||
              symbol.exchange ||
              symbol.exchange_obj?.exchange_name ||
              ''
            const label = symbol.symbol_name || symbol.symbol_id || 'Unnamed Symbol'
            return (
              <option key={optionKey} value={symbol.symbol_id}>
                {exchangeLabel ? `${label} — ${exchangeLabel}` : label}
              </option>
            )
          })}
        </Form.Select>
        <Feedback type="invalid" tooltip>
          Please select a Symbol.
        </Feedback>
      </FormGroup>

      <FormGroup className="position-relative col-md-6">
        <FormLabel>Date</FormLabel>
        <FormControl
          type="date"
          name="trade_date"
          value={formData.trade_date}
          onChange={handleChange}
          required
          min={reportingStartDate || undefined}
          isInvalid={
            reportingStartDate &&
            formData.trade_date &&
            new Date(`${formData.trade_date}T00:00:00Z`).getTime() < new Date(`${reportingStartDate}T00:00:00Z`).getTime()
          }
        />
        <Feedback type="invalid" tooltip>
          {reportingStartDate
            ? `Trade date must be on or after ${reportingStartDate}.`
            : 'Please enter a Date.'}
        </Feedback>
      </FormGroup>

      <FormGroup className="position-relative col-md-3 mt-3">
        <FormLabel>Commission</FormLabel>
        <FormControl type="text" name="commission" value={formData.commission} onChange={handleChange} required />
        <Feedback type="invalid" tooltip>
          Please provide a numeric Commission.
        </Feedback>
      </FormGroup>

      <FormGroup className="position-relative col-md-3 mt-3">
        <FormLabel>Price</FormLabel>
        <FormControl type="text" name="price" value={formData.price} onChange={handleChange} required />
        <Feedback type="invalid" tooltip>
          Please provide a numeric Price.
        </Feedback>
      </FormGroup>

      <FormGroup className="position-relative col-md-3 mt-3">
        <FormLabel>Quantity</FormLabel>
        <FormControl type="text" name="quantity" value={formData.quantity} onChange={handleChange} required />
        <Feedback type="invalid" tooltip>
          Please provide a numeric Quantity.
        </Feedback>
      </FormGroup>

      <FormGroup className="position-relative col-md-3 mt-3">
        <FormLabel>Amount</FormLabel>
        <FormControl
          type="text"
          readOnly
          value={calc.finalAmount != null ? String(calc.finalAmount.toFixed(2)) : ''} // never undefined
        />
      </FormGroup>

      {/* Broker Dropdown */}
      <FormGroup className="position-relative col-md-6 mt-4">
        <FormLabel>Broker</FormLabel>
        <Form.Select required name="broker_id" value={formData.broker_id} onChange={handleChange}>
          <option value="">-- Select Broker --</option>
          {brokers.map((b) => {
            const val = (b.broker_uid ?? b.broker_id ?? b.id ?? '').toString()
            return (
              <option key={val} value={val}>
                {b.broker_name ?? b.name ?? val}
              </option>
            )
          })}
        </Form.Select>
        <Feedback type="invalid" tooltip>
          Please select a Broker.
        </Feedback>
      </FormGroup>

      <FormGroup className="position-relative col-md-6 mt-4">
        <FormLabel>Description</FormLabel>
        <FormControl type="text" name="description" value={formData.description} onChange={handleChange} required />
        <Feedback type="invalid" tooltip>
          Please provide a Description.
        </Feedback>
      </FormGroup>

      {calc.commissionMethod && (
        <div className="col-12 mt-2">
          <small className="text-muted">
            Method: <strong>{calc.commissionMethod}</strong> · Contract size: <strong>{calc.contractSize}</strong>
            <br />
            Updated unit price: <strong>{calc.updatedUnitPrice ?? '-'}</strong> · Final Amount: <strong>{calc.finalAmount ?? '-'}</strong>
          </small>
        </div>
      )}

      <Col xs={12}>
        <Button variant="primary" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Submit'}
        </Button>
      </Col>
    </Form>
  )
}

export const UploadTrade = ({ onClose, onSuccess }) => {
  const [validated, setValidated] = useState(false)
  const [fileError, setFileError] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const tokenData = useDashboardToken()
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorFileUrl, setErrorFileUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [rowLimitError, setRowLimitError] = useState('')
  const { showNotification } = useNotificationContext()

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setSelectedFile(file)
    setFileError('')
    setRowLimitError('') // Clear row limit error when new file is selected
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    // File not selected
    if (!selectedFile) {
      setFileError('Please select a file.')
      event.stopPropagation()
      setValidated(false)
      return
    }

    // Check file extension
    const fileName = selectedFile.name.toLowerCase()
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx')) {
      setFileError('Only .csv or .xlsx files are allowed.')
      event.stopPropagation()
      setValidated(false)
      return
    }

    setValidated(true)
    setIsUploading(true)

    try {
      const response = await uploadTradeFile(selectedFile) //Call API
      if (response.data.success) {
        showNotification({
          message: 'File uploaded successfully!',
          variant: 'success',
          title: 'Upload Success'
        })
        // Call onSuccess callback to refresh trades list
        if (onSuccess) {
          onSuccess()
        }
        onClose?.() // Close modal if provided
      } else {
        // Backend returned validation errors with errorFileUrl (S3 link)
        const errorUrl = response.data.error_file_url
        const errorMsg = response.data.message || response.data.error_message || 'Validation failed.'
        if (errorUrl) {
          console.log('✅ Received error_file_url:', errorUrl)
          setErrorFileUrl(errorUrl)
          setErrorMessage(errorMsg)
          setTimeout(() => {
            setShowErrorModal(true) // ✅ Then show error modal
          }, 300)
          onClose?.()
          
          // Show notification about the error file
          showNotification({
            message: errorMsg || 'Your file contains validation errors. Please download the error file for details.',
            variant: 'warning',
            title: 'Validation Errors',
            delay: 5000
          })
        } else {
          showNotification({
            message: errorMsg,
            variant: 'danger',
            title: 'Validation Failed',
            delay: 3000
          })
        }
      }
    } catch (error) {
      // Handle 400 status code (row limit exceeded or validation errors) - Expected error, no console logging
      if (error.response?.status === 400) {
        const errorData = error.response.data || {}
        // Prioritize error_message, then message, with fallback
        const errorMessage = errorData.error_message || errorData.message || 'File upload validation failed.'
        
        // Check if it's a row limit error - check message content or status
        const isRowLimitError = errorMessage.toLowerCase().includes('row limit') || 
                                errorMessage.toLowerCase().includes('rows found') ||
                                errorMessage.toLowerCase().includes('maximum allowed') ||
                                (errorData.status === 'validation_failed' && !errorData.error_file_url)
        
        if (isRowLimitError) {
          // Row limit exceeded - show prominently in form only (no duplicate toast)
          setRowLimitError(errorMessage) // Display inline in form - this shows the actual backend message
        } else if (errorData.error_file_url) {
          // Validation errors with error file URL
          setErrorFileUrl(errorData.error_file_url)
          setErrorMessage(errorMessage || 'Your file contains validation errors. Please download the error file for details.')
          setTimeout(() => {
            setShowErrorModal(true)
          }, 300)
          onClose?.()
          
          // Also show notification about the error file
          showNotification({
            message: errorMessage || 'Your file contains validation errors. Please download the error file for details.',
            variant: 'warning',
            title: 'Validation Errors',
            delay: 5000
          })
        } else {
          // Other 400 errors
          showNotification({
            message: errorMessage,
            variant: 'danger',
            title: 'Upload Failed',
            delay: 7000
          })
        }
      } else {
        // Handle other errors (network, 500, etc.) - Only log unexpected errors
        console.error('❌ Upload failed:', error)
        const errorMsg = error.response?.data?.message || error.message || 'File upload failed. Please try again.'
        showNotification({
          message: errorMsg,
          variant: 'danger',
          title: 'Upload Failed',
          delay: 5000
        })
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleErrorModalClose = () => {
    setShowErrorModal(false)
    setErrorMessage('')
    setErrorFileUrl('')
    setRowLimitError('')
    setSelectedFile(null)
    setValidated(false)
  }

  return (
    <>
      <Form className="row g-5 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
        {/* ✅ Download Template Button */}
        <Col xs={12} className="d-flex justify-content-end">
          {tokenData?.fund_id && (
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/trade-template/${tokenData.fund_id}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-end text-primary"
              style={{ fontSize: '16px', textDecoration: 'underline' }}>
              Download Template
            </a>
          )}
        </Col>

        {/* Row Limit Error Alert - Display prominently */}
        {rowLimitError && (
          <Col xs={12} className="mt-3">
            <Alert variant="danger" className="mb-0" onClose={() => setRowLimitError('')} dismissible>
              <Alert.Heading className="h6 mb-2">
                <strong>⚠️ Upload Failed: Row Limit Exceeded</strong>
              </Alert.Heading>
              <p className="mb-0" style={{ fontSize: '14px' }}>
                {rowLimitError}
              </p>
              <hr />
              <p className="mb-0 small">
                <strong>Solution:</strong> Please reduce the number of rows in your file to 6000 or fewer and try uploading again.
              </p>
            </Alert>
          </Col>
        )}

        {/* File Upload Section */}
        <FormGroup className="position-relative col-md-12 mt-3">
          <FormLabel>Choose File</FormLabel>
          <FormControl type="file" required className="border-bottom" onChange={handleFileChange} isInvalid={!!fileError} />
          <Feedback type="invalid" tooltip>
            {fileError || 'Please choose a valid file to upload.'}
          </Feedback>
        </FormGroup>

        {/* Upload Button */}
        <Col xs={12} className="d-flex justify-content-end mt-4">
          <Button variant="primary" type="submit" disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </Col>
      </Form>
      {/* Error Modal */}
      <Modal show={showErrorModal} centered backdrop="static" keyboard={false} onHide={handleErrorModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Validation Errors</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorMessage && (
            <Alert variant="danger" className="mb-3">
              <strong>Error:</strong> {errorMessage}
            </Alert>
          )}
          <p>Your file contains validation errors. Please download the error file for details, correct the issues, and re-upload.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleErrorModalClose}>
            Close
          </Button>
          {errorFileUrl && (
            <a href={errorFileUrl} download style={{ textDecoration: 'none' }}>
              <Button variant="primary">Download Error File</Button>
            </a>
          )}
        </Modal.Footer>
      </Modal>
    </>
  )
}

const CATEGORY_NAME = {
  10000: 'Asset',
  20000: 'Liability',
  30000: 'Equity',
  40000: 'Income', // If your DB uses 'Revenue', change to 'Revenue'
  50000: 'Expense',
}

export const AddGl = ({ onClose }) => {
  const [validated, setValidated] = useState(false)
  const [hasParentGL, setHasParentGL] = useState('no')
  const [category, setCategory] = useState('')
  const [glNumber, setGlNumber] = useState('')
  const [glTitle, setGlTitle] = useState('')
  const [description, setDescription] = useState('')
  const [parentGlAccount, setParentGlAccount] = useState('')
  const [parentGlAccounts, setParentGlAccounts] = useState([])
  const [fundId, setFundId] = useState(null)
  const [balanceType, setBalanceType] = useState('') // New state for balance_type
  const [loading, setLoading] = useState(false)

  const glMode = hasParentGL === 'yes' ? 'Derived from Parent' : 'Next Block (+1000)'

  // 1) Get fundId from dashboard token
  useEffect(() => {
    const getFundIdFromToken = () => {
      const token = Cookies.get('dashboardToken')
      if (token) {
        try {
          const decoded = jwtDecode(token) // Decode the token to get the fundId
          setFundId(decoded.fund_id)
        } catch (error) {
          console.error('Error decoding token:', error)
        }
      } else {
        console.warn('No dashboardToken found in cookies')
      }
    }

    getFundIdFromToken()
  }, [])

  // 2) If "Has Parent GL" is yes, fetch parent GLs for the category range
  useEffect(() => {
    // guard: need fundId, category, and hasParentGL === 'yes'
    if (hasParentGL !== 'yes' || !fundId || !category) {
      setParentGlAccounts([])
      setParentGlAccount('')
      return
    }

    const ctrl = new AbortController()

    ;(async () => {
      try {
        const catName = CATEGORY_NAME[category] || category // tolerate name/number
        const res = await api.get(`/api/v1/chart-of-accounts/range/${fundId}`, {
          params: { category: catName, limit: 500 },
          signal: ctrl.signal,
        })

        // API returns: [{ id, code, name }]
        const rows = Array.isArray(res.data) ? res.data : []
        setParentGlAccounts(rows)
        setParentGlAccount('') // reset selection when category changes
      } catch (error) {
        if (error.name !== 'CanceledError') {
          console.error('Error fetching Parent GL Accounts by range:', error)
        }
        setParentGlAccounts([])
      }
    })()

    return () => ctrl.abort()
  }, [hasParentGL, fundId, category])

  // 3) Simple auto-fill: when category changes AND hasParentGL = no → fetch next code
  useEffect(() => {
    const autofill = async () => {
      if (!fundId || !category || hasParentGL !== 'no') return
      try {
        const catName = CATEGORY_NAME[category] || category // fallback if already a name
        const res = await api.get(`/api/v1/chart-of-accounts/next-code/${fundId}`, {
          params: { category: catName }, // ?category=Asset
        })
        const nextCode = res.data?.next_code
        if (nextCode) setGlNumber(String(nextCode))
      } catch (e) {
        console.error('Failed to fetch next GL code:', e)
      }
    }
    autofill()
  }, [category, hasParentGL, fundId])

  // If user flips to YES, allow manual input & clear (optional)
  useEffect(() => {
    if (hasParentGL === 'yes') {
      // optional: clear auto-filled value
      // setGlNumber('')
    }
  }, [hasParentGL])

  // 4) Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    if (!form.checkValidity()) {
      e.stopPropagation()
      setValidated(true)
      return
    }
    setValidated(true)

    const payload = {
      fund_id: fundId,
      account_code: glNumber,
      account_name: glTitle,
      description,
      balance_type: balanceType, // 'Dr' | 'Cr'
      parent_id: hasParentGL === 'yes' ? parentGlAccount : null, // CODE
      category, // '10000' etc. backend maps to label
    }

    try {
      setLoading(true)
      const resp = await api.post('/api/v1/chart-of-accounts', payload)
      if (resp.status === 201) {
        alert('Chart of Account added!')
        onClose?.()
      } else {
        alert(resp.data?.error || 'Failed to add COA')
      }
    } catch (err) {
      console.error(err)
      alert(err?.response?.data?.error || 'Server error')
    } finally {
      setLoading(false)
    }
  }

  function computeChildCodeFromParent(parentCode) {
    const codeStr = String(parentCode || '').trim()
    const n = Number.parseInt(codeStr, 10)
    if (!Number.isFinite(n)) return ''

    if (codeStr.endsWith('000')) return String(n + 100).padStart(codeStr.length, '0')
    if (codeStr.endsWith('00')) return String(n + 1).padStart(codeStr.length, '0')

    // fallback (optional): +1 if it doesn't end with 00/000
    return String(n + 1).padStart(codeStr.length, '0')
  }
  useEffect(() => {
    if (hasParentGL !== 'yes' || !parentGlAccount) return
    const parent = parentGlAccounts.find((a) => String(a.code) === String(parentGlAccount))
    if (!parent) return
    const nextCode = computeChildCodeFromParent(parent.code)
    if (nextCode) setGlNumber(nextCode)
  }, [hasParentGL, parentGlAccount, parentGlAccounts])

  useEffect(() => {
    // Clear on toggle; the other effects will re-compute appropriately
    setGlNumber('')
    setParentGlAccount(hasParentGL === 'yes' ? '' : parentGlAccount)
  }, [hasParentGL])

  return (
    <Form className="row g-5 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
      {/* Category Field */}
      <FormGroup className="position-relative col-md-6 mb-n3">
        <FormLabel>Category</FormLabel>
        <FormControl as="select" value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="">Select category</option>
          <option value="10000">Assets</option>
          <option value="20000">Liabilities</option>
          <option value="30000">Equity</option>
          <option value="40000">Revenue</option>
          <option value="50000">Expenses</option>
        </FormControl>
        <FormControl.Feedback type="invalid" tooltip>
          Please select a category.
        </FormControl.Feedback>
      </FormGroup>

      {/* Parent GL Account Field */}
      <FormGroup className="position-relative col-md-6 mb-n3 ">
        <FormLabel>Has Parent GL Account?</FormLabel>
        <FormControl as="select" value={hasParentGL} onChange={(e) => setHasParentGL(e.target.value)} required>
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </FormControl>
        <FormControl.Feedback type="invalid" tooltip>
          Please select an option.
        </FormControl.Feedback>
      </FormGroup>

      {hasParentGL === 'yes' && (
        <FormGroup className="position-relative col-md-6 mt-3">
          <FormLabel>Select Parent GL Account</FormLabel>
          <FormControl as="select" value={parentGlAccount || ''} onChange={(e) => setParentGlAccount(e.target.value)} required>
            <option value="">Select Parent GL Account</option>
            {parentGlAccounts.length > 0 ? (
              parentGlAccounts.map((acc) => (
                <option key={acc.code} value={acc.code}>
                  {acc.code} — {acc.name}
                </option>
              ))
            ) : (
              <option value="">No Parent GL Accounts available</option>
            )}
          </FormControl>
          <FormControl.Feedback type="invalid" tooltip>
            Please select a parent GL account.
          </FormControl.Feedback>
        </FormGroup>
      )}

      {/* GL Number */}
      <FormGroup className="position-relative col-md-6 mt-3">
        <div className="d-flex align-items-center justify-content-between">
          <FormLabel className="mb-0">GL Number</FormLabel>
          {/* <small className="text-muted">Mode: {glMode}</small> */}
        </div>

        <FormControl
          type="text"
          placeholder={hasParentGL === 'yes' ? 'Auto from Parent (…000 → +100, …00 → +1)' : 'Auto from Category (max + 1000)'}
          value={glNumber}
          onChange={(e) => setGlNumber(e.target.value)}
          required
        />
        <FormControl.Feedback type="invalid" tooltip>
          Please provide a valid GL number.
        </FormControl.Feedback>

        {/* <small className="text-muted d-block mt-1">
          {hasParentGL === 'yes'
            ? 'Rule: if parent ends with 000 → +100; if ends with 00 → +1'
            : 'Rule: GL = (largest code for fund+category) + 1000'}
        </small> */}
      </FormGroup>

      {/* GL Title Field */}
      <FormGroup className="position-relative col-md-6 mt-3">
        <FormLabel>GL Title</FormLabel>
        <FormControl type="text" placeholder="Enter GL title" value={glTitle} onChange={(e) => setGlTitle(e.target.value)} required />
        <FormControl.Feedback type="invalid" tooltip>
          Please provide a GL Title.
        </FormControl.Feedback>
      </FormGroup>

      {/* Description Field */}
      <FormGroup className="position-relative col-md-6 mt-3">
        <FormLabel>Description</FormLabel>
        <FormControl
          as="textarea"
          rows={2}
          placeholder="Enter description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <FormControl.Feedback type="invalid" tooltip>
          Please provide a description.
        </FormControl.Feedback>
      </FormGroup>

      {/* Submit Button */}
      <Col xs={12}>
        <div className="d-flex justify-content-end">
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </Col>
    </Form>
  )
}

export const AddManualJournal = ({ onClose, onSuccess, initialData = null, mode = 'create' }) => {
  const isEditMode = Boolean(initialData) || mode === 'edit'
  const [validated, setValidated] = useState(false)

  // token values
  const [fundId, setFundId] = useState(null)
  const [orgId, setOrgId] = useState(null)

  // dropdown options
  const [accounts, setAccounts] = useState([])

  // form fields (controlled)
  const [date, setDate] = useState('')
  const [debit, setDebit] = useState('')
  const [credit, setCredit] = useState('')
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')

  const [saving, setSaving] = useState(false)

  const notifySuccess = (msg, payload) => {
    window.alert(msg)
    onSuccess?.(payload)
    onClose?.()
  }

  useEffect(() => {
    const token = Cookies.get('dashboardToken')
    if (!token) return
    try {
      const decodedToken = jwtDecode(token)
      setFundId(decodedToken.fund_id || null)
      setOrgId(decodedToken.org_id || null)
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }, [])

  useEffect(() => {
    if (initialData) {
      const journalDate = initialData.journal_date || initialData.date || initialData.transaction_date
      setDate(journalDate ? String(journalDate).slice(0, 10) : '')
      setDebit(initialData.dr_account || initialData.debit_account || '')
      setCredit(initialData.cr_account || initialData.credit_account || '')
      setAmount(initialData.amount != null ? String(initialData.amount) : '')
      setDesc(initialData.description || '')
      if (initialData.fund_id) setFundId((prev) => prev || initialData.fund_id)
      if (initialData.org_id) setOrgId((prev) => prev || initialData.org_id)
    } else {
      setDate('')
      setDebit('')
      setCredit('')
      setAmount('')
      setDesc('')
      setValidated(false)
    }
  }, [initialData])

  // 2) fetch postable accounts (hide only 10000/20000/30000/40000/50000)
  useEffect(() => {
    if (!fundId) return
    ;(async () => {
      try {
        const res = await api.get(`/api/v1/chart-of-accounts/postable/${fundId}`, {
          params: { excludeRoots: true, onlyLeaves: false }, // show leaf + headers like 11000 etc.
        })
        setAccounts(Array.isArray(res.data) ? res.data : [])
      } catch (e) {
        console.error('Failed to load accounts:', e)
        setAccounts([])
      }
    })()
  }, [fundId])

  // 3) prevent same account on both sides
  useEffect(() => {
    if (debit && debit === credit) setCredit('')
  }, [debit])

  const handleSubmit = async (event) => {
    const form = event.currentTarget

    if (!form.checkValidity()) {
      event.preventDefault()
      event.stopPropagation()
      setValidated(true)
      return
    }
    event.preventDefault()
    setValidated(true)

    // Use state; fall back to form controls just in case
    const finalDate = date || form.elements['journal_date']?.value || ''
    const rawAmount = amount || form.elements['amount']?.value || ''
    const amt = Number(rawAmount)

    const roots = new Set(['10000', '20000', '30000', '40000', '50000'])

    // Guards (match your backend rules)
    if (!fundId) return window.alert('Missing fund id')
    if (!orgId) return window.alert('Missing org id') // DB requires NOT NULL as per your error
    if (!finalDate) return window.alert('Pick a date')
    if (!Number.isFinite(amt) || amt <= 0) return window.alert('Amount must be > 0')
    if (!debit || !credit) return window.alert('Pick both debit and credit')
    if (debit === credit) return window.alert('Debit and Credit must be different')
    if (roots.has(String(debit)) || roots.has(String(credit))) {
      return window.alert('Cannot post to category root codes (10000/20000/30000/40000/50000)')
    }

    const payload = {
      fund_id: fundId,
      org_id: orgId, // REQUIRED by DB (NOT NULL)
      journal_date: finalDate, // YYYY-MM-DD
      amount: amt, // number
      dr_account: debit,
      cr_account: credit,
      description: desc || null,
      journal_type: 'Manual',
    }
    console.log('Manual journal payload →', payload)

    try {
      setSaving(true)

      if (isEditMode) {
        const entryId = initialData?.journal_id || initialData?._id || initialData?.id
        if (!entryId) {
          window.alert('Missing manual journal identifier')
          return
        }

        const response = await api.put(`/api/v1/manualjournal/${entryId}`, payload, {
          headers: { 'Content-Type': 'application/json' },
        })

        if (response.status === 200 || response.status === 201) {
          notifySuccess('Manual journal updated successfully ✅', response.data)
          return
        }

        window.alert(response.data?.message || 'Failed to update manual journal')
        return
      }

      const response = await api.post('/api/v1/manualjournal', payload, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.status === 201 || response.status === 200) {
        setDate('')
        setDebit('')
        setCredit('')
        setAmount('')
        setDesc('')
        setValidated(false)
        notifySuccess('Manual journal created successfully ✅', response.data)
        return
      }

      window.alert(response.data?.message || 'Failed to create manual journal')
    } catch (err) {
      const status = err?.response?.status
      const data = err?.response?.data
      console.error(`${isEditMode ? 'PUT' : 'POST'} /manualjournal failed`, { status, data, err })
      window.alert(data?.message || data?.error || `Request failed (${status || 'unknown'})`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form className="row g-5 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
      {/* Date */}
      <FormGroup className="position-relative col-md-6 mb-n2">
        <FormLabel>Date (mm/dd/yyyy)</FormLabel>
        <FormControl type="date" name="journal_date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Feedback type="invalid" tooltip>
          Please select a valid date.
        </Feedback>
      </FormGroup>

      {/* Debit */}
      <FormGroup className="position-relative col-md-6 mb-n2">
        <FormLabel>Debit Account</FormLabel>
        <FormControl as="select" value={debit} onChange={(e) => setDebit(e.target.value)} required autoComplete="off">
          <option value="">--Select--</option>
          {accounts.map((a) => (
            <option key={`dr-${a.id}`} value={a.code}>
              {a.code} — {a.name}
            </option>
          ))}
        </FormControl>
        <Feedback type="invalid" tooltip>
          Please select a debit account.
        </Feedback>
      </FormGroup>

      {/* Credit */}
      <FormGroup className="position-relative col-md-6 mt-3">
        <FormLabel>Credit Account</FormLabel>
        <FormControl as="select" value={credit} onChange={(e) => setCredit(e.target.value)} required autoComplete="off">
          <option value="">--Select--</option>
          {accounts.map((a) => (
            <option key={`cr-${a.id}`} value={a.code}>
              {a.code} — {a.name}
            </option>
          ))}
        </FormControl>
        <Feedback type="invalid" tooltip>
          Please select a credit account.
        </Feedback>
      </FormGroup>
      {/* Amount Field */}
      {/* Amount */}
      <FormGroup className="position-relative col-md-6 mt-3">
        <FormLabel>Amount</FormLabel>
        <FormControl
          type="number"
          name="amount"
          min="0.01"
          step="0.01"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <Feedback type="invalid" tooltip>
          Please enter a valid amount.
        </Feedback>
      </FormGroup>

      {/* Description */}
      <FormGroup className="position-relative col-md-12 mt-3">
        <FormLabel>Description</FormLabel>
        <FormControl as="textarea" rows={3} placeholder="Enter description" value={desc} onChange={(e) => setDesc(e.target.value)} required />
        <Feedback type="invalid" tooltip>
          Please provide a description.
        </Feedback>
      </FormGroup>

      <Col xs={12}>
        <div className="d-flex justify-content-end">
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Submit'}
          </Button>
        </div>
      </Col>
    </Form>
  )
}

const SupportedElements = () => {
  return (
    <ComponentContainerCard
      id="supported-elements"
      title="Supported elements"
      description={<>Validation styles are available for the following form controls and components:</>}>
      <ul>
        <li>
          <code>&lt;input&gt;</code>s and&nbsp;
          <code>&lt;textarea&gt;</code>s with&nbsp;
          <code>.form-control</code>
          &nbsp;(including up to one&nbsp;
          <code>.form-control</code> in input groups)
        </li>
        <li>
          <code>&lt;select&gt;</code>s with&nbsp;
          <code>.form-select</code>
        </li>
        <li>
          <code>.form-check</code>s
        </li>
      </ul>
      <form className="was-validated">
        <div className="mb-3">
          <FormLabel htmlFor="validationTextarea">Textarea</FormLabel>
          <textarea className="form-control" id="validationTextarea" placeholder="Required example textarea" required defaultValue={''} />
          <Feedback type="invalid">Please enter a message in the textarea.</Feedback>
        </div>
        <div className="form-check mb-3">
          <input type="checkbox" className="form-check-input" id="validationFormCheck1" required />
          <label className="form-check-label" htmlFor="validationFormCheck1">
            Check this checkbox
          </label>
          <Feedback type="invalid">Example invalid feedback text</Feedback>
        </div>
        <div className="form-check">
          <input type="radio" className="form-check-input" id="validationFormCheck2" name="radio-stacked" required />
          <label className="form-check-label" htmlFor="validationFormCheck2">
            Toggle this radio
          </label>
        </div>
        <div className="form-check mb-3">
          <input type="radio" className="form-check-input" id="validationFormCheck3" name="radio-stacked" required />
          <label className="form-check-label" htmlFor="validationFormCheck3">
            Or toggle this other radio
          </label>
          <Feedback type="invalid">More example invalid feedback text</Feedback>
        </div>
        <div className="mb-3">
          <FormSelect required aria-label="select example">
            <option>Open this select menu</option>
            <option value={1}>One</option>
            <option value={2}>Two</option>
            <option value={3}>Three</option>
          </FormSelect>
          <Feedback type="invalid">Example invalid select feedback</Feedback>
        </div>
        <div className="mb-3">
          <FormControl type="file" aria-label="file example" required />
          <Feedback type="invalid">Example invalid form file feedback</Feedback>
        </div>
        <div className="mb-3">
          <Button variant="primary" type="submit">
            Submit form
          </Button>
        </div>
      </form>
    </ComponentContainerCard>
  )
}

export const AddFund = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fund_name: '',
    fund_description: '',
    fund_address: '',
    incorp_date: '',
    reporting_start_date: '',
    fy_starts_on: '',
    fy_ends_on: '',
    reporting_frequency: '',
    reporting_currency: '',
    reporting_currency: '',
    commission_accounting_method: '',
    fund_status: 'Active',
    decimal_precision: 2,
    reporting_mtd: false,
    reporting_qtd: false,
    reporting_ytd: false,
    reporting_itd: false,
    enable_report_email: false,
    date_format: 'MM/DD/YYYY',
    onboardingmode: '',
  })

  const useeTokenData = useUserToken()
  const fmt = formData.date_format || 'MM/DD/YYYY'
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const created = await createFund(formData)
      onSuccess?.(created)
      onClose?.()
    } catch (error) {
      console.error('❌ Error creating fund:', error.response?.data || error.message)
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Row className="mb-3">
        <FormGroup as={Col} md={2}>
          <FormLabel>Fund Status</FormLabel>
          <FormControl type="text" name="fund_status" value={formData.fund_status} readOnly />
        </FormGroup>
        <FormGroup as={Col} md={2}>
          <FormLabel>Onboarding Mode</FormLabel>
          <FormControl as="select" name="onboardingmode" value={formData.onboardingmode} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="new">New Fund</option>
            <option value="existing">Existing Fund</option>
          </FormControl>
        </FormGroup>
        <FormGroup as={Col} md={2}>
          <FormLabel>Fund Name</FormLabel>
          <FormControl type="text" name="fund_name" value={formData.fund_name} onChange={handleChange} required />
        </FormGroup>
        <FormGroup as={Col} md={2}>
          <FormLabel>Fund Description</FormLabel>
          <FormControl type="text" name="fund_description" value={formData.fund_description} onChange={handleChange} required />
        </FormGroup>
        <FormGroup as={Col} md={4}>
          <FormLabel>Address</FormLabel>
          <FormControl type="text" name="fund_address" value={formData.fund_address} onChange={handleChange} required />
        </FormGroup>
      </Row>

      <Row className="mb-3">
        <FormGroup as={Col} md={2}>
          <FormLabel>Incorporation Date</FormLabel>
          <FormControl type="date" name="incorp_date" value={formData.incorp_date} onChange={handleChange} required />
        </FormGroup>
        <FormGroup as={Col} md={2}>
          <FormLabel>Reporting Start Date</FormLabel>
          <FormControl type="date" name="reporting_start_date" value={formData.reporting_start_date} onChange={handleChange} required />
        </FormGroup>
        <FormGroup as={Col} md={2}>
          <FormLabel>Financial Year Ends On</FormLabel>
          <FormControl as="select" name="fy_ends_on" value={formData.fy_ends_on} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="January">January</option>
            <option value="February">February</option>
            <option value="March">March</option>
            <option value="April">April</option>
            <option value="May">May</option>
            <option value="June">June</option>
            <option value="July">July</option>
            <option value="August">August</option>
            <option value="September">September</option>
            <option value="October">October</option>
            <option value="November">November</option>
            <option value="December">December</option>
          </FormControl>
        </FormGroup>
        <FormGroup as={Col} md={2}>
          <FormLabel>Reporting Frequency</FormLabel>
          <FormControl as="select" name="reporting_frequency" value={formData.reporting_frequency} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="Daily">Daily</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Annually">Annually</option>
          </FormControl>
        </FormGroup>
        <FormGroup as={Col} md={4}>
          <FormLabel>Reporting Currency</FormLabel>
          <FormControl as="select" name="reporting_currency" value={formData.reporting_currency} onChange={handleChange} required>
            <option value="">Select</option>
            {currencies
              .slice()
              .sort((a, b) => a.code.localeCompare(b.code))
              .map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name} {c.symbol ? `(${c.symbol})` : ''}
                </option>
              ))}
          </FormControl>
        </FormGroup>
      </Row>

      <Row className="mb-3">
        <FormGroup as={Col} md={2}>
          <FormLabel>Decimal Precision</FormLabel>
          <FormControl as="select" name="decimal_precision" value={formData.decimal_precision} onChange={handleChange}>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </FormControl>
        </FormGroup>
        <FormGroup as={Col} md={2}>
          <FormLabel>Commission Accounting method</FormLabel>
          <FormControl as="select" name="commission_accounting_method" value={formData.commission_accounting_method} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="Capital">Capitalize</option>
            <option value="Expense">Expense</option>
          </FormControl>
        </FormGroup>
        <FormGroup as={Col} md={2}>
          <FormLabel>Email Notification</FormLabel>
          <FormCheck type="checkbox" label="Enable" name="enable_report_email" checked={formData.enable_report_email} onChange={handleChange} />
        </FormGroup>
        <FormGroup as={Col} md={2}>
          <FormLabel>Date Format</FormLabel>
          <FormControl as="select" name="date_format" value={formData.date_format} onChange={handleChange} required>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          </FormControl>
        </FormGroup>
        <FormGroup as={Col} md={4}>
          <FormLabel>Reporting Components</FormLabel>
          <div>
            <FormCheck inline label="MTD" type="checkbox" name="reporting_mtd" checked={formData.reporting_mtd} onChange={handleChange} />
            <FormCheck inline label="QTD" type="checkbox" name="reporting_qtd" checked={formData.reporting_qtd} onChange={handleChange} />
            <FormCheck inline label="YTD" type="checkbox" name="reporting_ytd" checked={formData.reporting_ytd} onChange={handleChange} />
            <FormCheck inline label="ITD" type="checkbox" name="reporting_itd" checked={formData.reporting_itd} onChange={handleChange} />
          </div>
        </FormGroup>
      </Row>

      <div className="d-flex justify-content-end">
        <Button type="submit" variant="primary">
          Submit
        </Button>
      </div>
    </Form>
  )
}

export const UploadMigration = ({ onClose, onSuccess, onUploadSuccess }) => {
  const [validated, setValidated] = useState(false)
  const [fileError, setFileError] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [pendingMessage, setPendingMessage] = useState('')
  const tokenData = useDashboardToken()
  const { showNotification } = useNotificationContext()

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setSelectedFile(file)
    setFileError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    // File not selected
    if (!selectedFile) {
      setFileError('Please select a file.')
      event.stopPropagation()
      setValidated(false)
      return
    }

    // Check file extension
    const fileName = selectedFile.name.toLowerCase()
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx')) {
      setFileError('Only .csv or .xlsx files are allowed.')
      event.stopPropagation()
      setValidated(false)
      return
    }

    setValidated(true)
    setIsUploading(true)

    try {
      // Call API to upload file
      const response = await uploadMigrationFile(selectedFile)
      
      if (response.data.success) {
        // Show success notification
        showNotification({
          title: 'Success',
          message: 'File uploaded successfully!',
          variant: 'success',
        })
        // Get file_id from response
        const fileId = response.data?.file_id || response.data?.data?.file_id || response.data?.fileId || null
        // Call onUploadSuccess to open comparison modal with file_id
        if (onUploadSuccess) {
          onUploadSuccess(fileId)
        }
        // Also call onSuccess for any other handlers
        if (onSuccess) {
          onSuccess()
        }
        // Close upload modal
        onClose?.()
      } else {
        // Show error notification
        const errorMsg = response.data.message || 'Unknown error'
        showNotification({
          title: 'Upload Failed',
          message: errorMsg,
          variant: 'danger',
        })
        setFileError(errorMsg)
      }
    } catch (error) {
      // Handle 409 Conflict with PENDING_FILE_EXISTS code
      if (error?.response?.status === 409 && error?.response?.data?.code === 'PENDING_FILE_EXISTS') {
        const errorMsg = 'Please complete the pending action first'
        // Show as warning/info message (not error)
        showNotification({
          title: 'Pending Action Required',
          message: errorMsg,
          variant: 'warning',
          delay: 5000, // Show longer for important message
        })
        setPendingMessage(errorMsg)
        setFileError('') // Clear file error, show pending message instead
        // Close modal automatically after a short delay
        setTimeout(() => {
          onClose?.()
        }, 2000)
      }
      // Handle other 400/409 errors
      else if (error?.response?.status === 400 || error?.response?.status === 409) {
        const errorMsg = error?.response?.data?.message || 'Upload validation failed'
        showNotification({
          title: 'Validation Error',
          message: errorMsg,
          variant: 'danger',
        })
        setFileError(errorMsg)
      }
      // Handle other errors (500, network, etc.) - log to console
      else {
        const errorMsg = error?.response?.data?.message || error?.message || 'Upload failed'
        console.error('❌ Upload failed:', error)
        showNotification({
          title: 'Upload Failed',
          message: errorMsg,
          variant: 'danger',
        })
        setFileError(errorMsg)
      }
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Form className="row g-5 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
      {/* Download Template Button */}
      <Col xs={12} className="d-flex justify-content-end">
        {tokenData?.fund_id && (
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/migration/trialbalance/${tokenData.fund_id}/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-end text-primary"
            style={{ fontSize: '16px', textDecoration: 'underline' }}>
            Download Template
          </a>
        )}
      </Col>

      {/* File Upload Section */}
      <FormGroup className="position-relative col-md-12 mt-3">
        <FormLabel>Choose File</FormLabel>
        <FormControl type="file" required className="border-bottom" onChange={handleFileChange} isInvalid={!!fileError} />
        <Feedback type="invalid" tooltip>
          {fileError || 'Please choose a valid file to upload.'}
        </Feedback>
      </FormGroup>

      {/* Pending Action Warning Message */}
      {pendingMessage && (
        <Col xs={12} className="mt-2">
          <Alert variant="warning" dismissible onClose={() => setPendingMessage('')}>
            <strong>Pending Action Required:</strong> {pendingMessage}
          </Alert>
        </Col>
      )}

      {/* Upload Button */}
      <Col xs={12} className="d-flex justify-content-end mt-4">
        <Button variant="primary" type="submit" disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </Col>
    </Form>
  )
}

export const AddStatementBalance = () => {
  const [validated, setValidated] = useState(false)

  const handleSubmit = (event) => {
    const form = event.currentTarget
    if (!form.checkValidity()) {
      event.preventDefault()
      event.stopPropagation()
    }
    setValidated(true)
  }

  return (
    <Form className="row g-5 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
      {/* GL Number */}
      <FormGroup className="position-relative col-md-6 mb-3">
        <FormLabel>GL Number</FormLabel>
        <FormControl type="text" id="glNumber" placeholder="Enter GL number" required />
        <FormControl.Feedback type="invalid" tooltip>
          Please provide a valid GL number.
        </FormControl.Feedback>
      </FormGroup>

      {/* GL Name */}
      <FormGroup className="position-relative col-md-6 mb-3">
        <FormLabel>GL Name</FormLabel>
        <FormControl type="text" id="glName" placeholder="Enter GL name" required />
        <FormControl.Feedback type="invalid" tooltip>
          Please provide a GL name.
        </FormControl.Feedback>
      </FormGroup>

      {/* Statement Balance */}
      <FormGroup className="position-relative col-md-6 mb-3">
        <FormLabel>Statement Balance</FormLabel>
        <FormControl type="number" id="statementBalance" placeholder="Enter statement balance" required />
        <FormControl.Feedback type="invalid" tooltip>
          Please provide a valid statement balance.
        </FormControl.Feedback>
      </FormGroup>

      <Col xs={12}>
        <div className="d-flex justify-content-end">
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </div>
      </Col>
    </Form>
  )
}

const ALLOWED_EXT = ['.xlsx']
const MAX_SIZE_MB = 10

export const UploadManualJournal = ({ onClose }) => {
  const dashboard = useDashboardToken()
  const fundId = dashboard?.fund_id ?? null
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const [resp, setResp] = useState(null)
  const inputRef = useRef(null)

  const isValidExt = (name = '') => {
    const lower = name.toLowerCase()
    return ALLOWED_EXT.some((ext) => lower.endsWith(ext))
  }

  const humanSize = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`

  const canSubmit = useMemo(() => !!file && !!fundId && !submitting, [file, fundId, submitting])

  useEffect(() => {
    // clear messages when file changes
    setMsg('')
    setResp(null)
  }, [file])

  const handlePick = (e) => {
    const f = e.target.files?.[0]
    if (!f) return

    if (!isValidExt(f.name)) {
      setMsg(`Unsupported file type. Allowed: ${ALLOWED_EXT.join(', ')}`)
      setFile(null)
      return
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setMsg(`File is too large (${humanSize(f.size)}). Max ${MAX_SIZE_MB} MB`)
      setFile(null)
      return
    }
    setFile(f)
    setMsg('')
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get(`/api/v1/manualjournal/template/${fundId}`, { responseType: 'blob' })
      const blobUrl = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = 'manual-journal-template.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (e) {
      console.error('Template download failed:', e)
      setMsg('Failed to download template. Please try again.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fundId || !file) {
      setMsg('Provide Fund ID and select an .xlsx file')
      return
    }

    setSubmitting(true)
    setMsg('')

    try {
      const form = new FormData()
      form.append('file', file)

      // ✅ Get dashboard token for manual journal upload
      const token = Cookies.get('dashboardToken');
      
      const res = await api.post(`/api/v1/manualjournal/upload/${fundId}`, form, {
        headers: {
          'dashboard': `Bearer ${token}`, // ✅ Manually attach dashboard token
          'Content-Type': 'multipart/form-data',
        },
      })

      const data = res?.data || {}
      setResp(data)
      
      if (data?.success) {
        setMsg('Processing started.')
        // Clear file input after successful upload
        if (inputRef.current) {
          inputRef.current.value = ''
          setFile(null)
        }
        // Auto-close after short delay
        setTimeout(() => {
          onClose?.()
        }, 2000)
      } else {
        setMsg(data?.error || 'Upload failed.')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      const errorData = error?.response?.data || {}
      setResp(errorData)
      setMsg(errorData?.error || 'Upload failed. Please check your file and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setMsg('')
    setResp(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Row className="mb-2">
        <Col className="text-end">
          <Button variant="link" className="text-primary text-decoration-underline p-0" onClick={handleDownloadTemplate} size="md">
            Download manual journal Template
          </Button>
        </Col>
      </Row>

      <Form.Group controlId="mjFile" className="mb-3">
        <Form.Label>Upload Manual Journal File</Form.Label>
        <Form.Control ref={inputRef} type="file" accept={ALLOWED_EXT.join(',')} onChange={handlePick} disabled={submitting} />
        <Form.Text className="mt-1 d-inline-block">
          Allowed: {ALLOWED_EXT.join(', ')} , Max size: {MAX_SIZE_MB} MB
        </Form.Text>
      </Form.Group>

      {file && (
        <Alert variant="info" className="py-2">
          Selected: <strong>{file.name}</strong> ({humanSize(file.size)})
          <Button variant="link" size="sm" className="ms-2 p-0 align-baseline" onClick={clearFile}>
            remove
          </Button>
        </Alert>
      )}

      {msg && (
        <Alert variant={msg.includes('failed') || msg.includes('error') ? 'danger' : 'success'} className="py-2">
          {msg}
        </Alert>
      )}

      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={() => onClose?.()} disabled={submitting}>
          Close
        </Button>
        <Button type="submit" variant="primary" disabled={!file || submitting}>
          {submitting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" /> Uploading…
            </>
          ) : (
            'Upload & Queue'
          )}
        </Button>
      </div>
    </Form>
  )
}

const AllFormValidation = () => {
  return (
    <>
      <BrowserDefault />

      <CustomStyles />

      <ServerSideValidation />

      <SupportedElements />

      <AddTrade />

      <AddGl />

      <AddManualJournal />

      <AddFund />

      <AddStatementBalance />

      <UploadManualJournal />
    </>
  )
}

export default AllFormValidation
