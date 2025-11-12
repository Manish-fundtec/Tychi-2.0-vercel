'use client'

import clsx from 'clsx'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Button,
  Col,
  Form,
  FormCheck,
  FormControl,
  FormFeedback,
  FormGroup,
  FormLabel,
  FormSelect,
  InputGroup,
  Spinner,
  Alert,
  Row,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
} from 'react-bootstrap'
import Feedback from 'react-bootstrap/esm/Feedback'
import InputGroupText from 'react-bootstrap/esm/InputGroupText'
import ComponentContainerCard from '@/components/ComponentContainerCard'
import { serverSideFormValidate } from '@/helpers/data'
import ChoicesFormInput from '@/components/from/ChoicesFormInput'
import { getFundDetails } from '@/lib/api/fund'
import { useSearchParams } from 'next/navigation'
import { createBroker, updateBroker } from '@/lib/api/broker'
import { createBank, updateBank } from '@/lib/api/bank'
import { createExchange, updateExchange } from '@/lib/api/exchange'
import { createSymbol, updateSymbol } from '@/lib/api/symbol'
import { getExchangesByFundId } from '@/lib/api/exchange'
import { getAssetTypesActive } from '@/lib/api/assetType'
import { updateAssetType } from '@/lib/api/assetType'
import { updateFund, getTradeCount } from '@/lib/api/fund'
import { useDashboardToken } from '@/hooks/useDashboardToken'
import api from '@/lib/api/axios'
import currencies from 'currency-formatter/currencies'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import axios from 'axios'
import { toast } from 'react-toastify'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const MAX_SIZE_MB = 5
export const BrokerForm = ({ broker, onSuccess, onClose, reportingStartDate, existingBrokers = [] }) => {
  const isEdit = !!broker
  const [validated, setValidated] = useState(false)
  const [rsd, setRsd] = useState(null) // Reporting Start Date from token
  const [duplicateError, setDuplicateError] = useState('')

  const [form, setForm] = useState({
    broker_name: '',
    start_date: '',
  })

  // Get RSD from token on component mount
  useEffect(() => {
    try {
      const token = Cookies.get('dashboardToken')
      console.log('🔑 Token exists:', !!token)

      if (token) {
        const payload = jwtDecode(token) || {}
        console.log('📦 Decoded payload BrokerForm:', payload)

        // Try to get reporting start date from fund object first
        const raw =
          payload.fund?.reporting_start_date || payload.reporting_start_date || payload.reportingStartDate || payload.RSD || payload.fund_start_date
        console.log('📅 Raw reporting start date value:', raw)

        if (raw) {
          // Normalize to YYYY-MM-DD (strip time if present)
          const match = String(raw).match(/^(\d{4}-\d{2}-\d{2})/)
          const normalized = match ? match[1] : null
          console.log('✅ Normalized reporting start date:', normalized)
          setRsd(normalized)
        } else {
          console.log('❌ No reporting_start_date found in token.')
          console.log('Available keys:', Object.keys(payload))
          console.log('Fund object keys:', payload.fund ? Object.keys(payload.fund) : 'No fund object')
        }
      } else {
        console.log('❌ No dashboardToken found in cookies')
      }
    } catch (error) {
      console.error('❌ Error decoding token:', error)
    }

    console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')
  }, [])

  // Helper: check if start_date is less than RSD (should be >= RSD)
  const isBeforeRSD = useMemo(() => {
    if (!rsd || !form.start_date) return false
    return form.start_date < rsd
  }, [form.start_date, rsd])

  useEffect(() => {
    if (broker) {
      setForm({
        broker_name: broker.broker_name || '',
        start_date: broker.start_date || '',
      })
    }
  }, [broker])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))

    // Check for duplicate broker name (case-insensitive)
    if (name === 'broker_name' && value.trim()) {
      const trimmedValue = value.trim().toLowerCase()
      const isDuplicate = existingBrokers.some((b) => {
        // For edit, exclude current broker from check
        if (isEdit && broker?.broker_id === b.broker_id) return false
        return b.broker_name?.toLowerCase() === trimmedValue
      })

      if (isDuplicate) {
        setDuplicateError('Broker name already exists in this fund')
      } else {
        setDuplicateError('')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formEl = e.currentTarget

    // 1) Native HTML validation
    if (!formEl.checkValidity()) {
      e.stopPropagation()
      setValidated(true)
      return
    }

    // 2) Frontend guard: start_date must be less than or equal to RSD
    if (rsd && form.start_date && form.start_date < rsd) {
      toast.error(`Start Date must be greater than or equal to Reporting Start Date (${rsd}).`)
      setValidated(true)
      return
    }

    // 3) One-line guard (YYYY-MM-DD strings compare correctly) - keep existing logic
    if (reportingStartDate && form.start_date < reportingStartDate) {
      toast.error(`Broker date cannot be less than ${reportingStartDate}`)
      setValidated(true)
      return
    }

    // 4) Check for duplicate broker name
    if (duplicateError) {
      toast.error(duplicateError)
      setValidated(true)
      return
    }

    try {
      const token = Cookies.get('dashboardToken')
      const decoded = jwtDecode(token)

      const payload = {
        ...form,
        user_id: decoded.user_id,
        org_id: decoded.org_id,
        fund_id: decoded.fund_id,
      }

      if (isEdit) {
        await updateBroker(broker.broker_id, payload)
      } else {
        await createBroker(payload)
      }

      onSuccess?.()
      onClose?.()
    } catch (err) {
      console.error('❌ Failed to submit broker form:', err)

      // Handle different types of errors
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        toast.error('Cannot connect to server. Please check if the backend is running.')
      } else if (err.response?.status === 401) {
        toast.error('Unauthorized. Please log in again.')
      } else if (err.response?.status === 403) {
        toast.error('Forbidden. You do not have permission to perform this action.')
      } else if (err.response?.status >= 500) {
        toast.error('Server error. Please try again later.')
      } else {
        toast.error(err.response?.data?.message || err.message || 'Failed to submit broker form')
      }
    }

    setValidated(true)
  }

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit} className="row g-3 m-1">
      <FormGroup className="col-md-6">
        <FormLabel>Broker Name</FormLabel>
        <FormControl name="broker_name" type="text" required value={form.broker_name} onChange={handleChange} isInvalid={!!duplicateError} />
        <Feedback type="invalid">{duplicateError || 'Please enter broker name'}</Feedback>
        {/* {duplicateError && (
          <div className="text-danger mt-1" role="alert">
            {duplicateError}
          </div>
        )} */}
      </FormGroup>

      <FormGroup className="col-md-6">
        <FormLabel>Start Date</FormLabel>
        <FormControl 
          name="start_date" 
          type="date" 
          required 
          value={form.start_date} 
          onChange={handleChange} 
          min={rsd || reportingStartDate || undefined}
          isInvalid={isBeforeRSD}
        />
        <Feedback type="invalid">Please provide a valid start date</Feedback>
        {isBeforeRSD && (
          <div className="text-danger mt-1" role="alert">
            Start date must be greater than or equal to Reporting Start Date ({rsd})
          </div>
        )}
      </FormGroup>

      <Col xs={12}>
        <Button type="submit" disabled={isBeforeRSD}>
          {isEdit ? 'Update' : 'Submit'}
        </Button>
      </Col>
    </Form>
  )
}
export const AssetTypeForm = ({ assetType, onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    closure_rule: assetType?.closure_rule || '',
    long_term_rule: assetType?.long_term_rule || '',
  })
  const [validated, setValidated] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    console.log(`📝 ${name} updated to:`, value)

    // Clear error when user makes a selection
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setValidated(true)

    // Validate that both fields have values
    const newErrors = {}
    if (!formData.closure_rule) {
      newErrors.closure_rule = 'Please select a closure rule'
    }
    if (!formData.long_term_rule) {
      newErrors.long_term_rule = 'Please select a long term rule'
    }

    // If there are errors, set them and prevent submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      console.log('❌ Validation failed:', newErrors)
      return
    }

    try {
      const payload = {
        ...formData,
        status: 'Active',
      }

      console.log('📤 Sending payload to backend:', payload)

      await updateAssetType(assetType.assettype_id, payload)
      console.log('✅ Update request successful')

      if (onSuccess) onSuccess()
      if (onClose) onClose()
    } catch (error) {
      console.error('❌ Failed to update asset type:', error)
      alert('Failed to update asset type. Please try again.')
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <FormGroup className="position-relative col-md-6">
        <FormLabel>Closure Rule</FormLabel>
        <ChoicesFormInput
          name="closure_rule"
          value={formData.closure_rule}
          onChange={handleChange}
          className={errors.closure_rule ? 'is-invalid' : ''}
          required>
          <option value="">Select</option>
          <option value="LIFO">LIFO</option>
          <option value="FIFO">FIFO</option>
          <option value="FIRST_SETTLE_THAN_FIFO">FIRST_SETTLE_THAN_FIFO</option>
        </ChoicesFormInput>
        {errors.closure_rule && <div className="invalid-feedback">{errors.closure_rule}</div>}
      </FormGroup>

      <FormGroup className="position-relative col-md-6">
        <FormLabel>Long Term Rule</FormLabel>
        <ChoicesFormInput
          name="long_term_rule"
          value={formData.long_term_rule}
          onChange={handleChange}
          className={errors.long_term_rule ? 'is-invalid' : ''}
          required>
          <option value="">Select</option>
          <option value="1 year">1 year</option>
          <option value="2 year">2 year</option>
          <option value="3 year">3 year</option>
          <option value="4 year">4 year</option>
          <option value="5 year">5 year</option>
        </ChoicesFormInput>
        {errors.long_term_rule && <div className="invalid-feedback">{errors.long_term_rule}</div>}
      </FormGroup>

      <Col xs={12} className="mt-3">
        <Button variant="primary" type="submit">
          Submit to Activate
        </Button>
      </Col>
    </Form>
  )
}

export const BasicForm = () => {
  const [validated, setValidated] = useState(false)
  const [formData, setFormData] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [hasTrades, setHasTrades] = useState(false)
  const dateOnly = useCallback((val) => {
    if (!val) return ''
    const str = String(val)
    const match = str.match(/^\d{4}-\d{2}-\d{2}/)
    if (match) return match[0]
    if (str.includes('T')) return str.split('T')[0]
    return str
  }, [])

  const incorpDate = useMemo(() => dateOnly(formData?.incorp_date), [dateOnly, formData?.incorp_date])
  const reportingStartDate = useMemo(() => dateOnly(formData?.reporting_start_date), [dateOnly, formData?.reporting_start_date])
  const incorpAfterReporting = useMemo(() => {
    if (!incorpDate || !reportingStartDate) return false
    return incorpDate > reportingStartDate
  }, [incorpDate, reportingStartDate])
  // 2) helpers for toggling editability
  const ro = !isEditing // readOnly for text/number
  const dis = !isEditing // disabled for date/select/checkbox
  const onChange = (field) => (e) => setFormData((p) => ({ ...p, [field]: e.target.value }))

  // 3) submit handler
  const handleSubmit = async (e) => {
    const form = e.currentTarget
    if (!form.checkValidity()) {
      e.preventDefault()
      e.stopPropagation()
      setValidated(true)
      return
    }
    e.preventDefault()
    setValidated(true)
    // TODO: call your update API with `formData`
    setIsEditing(false) // back to read-only after save
    try {
      const { fund_id, fund_status, ...rest } = formData || {}
      const toYmd = (v) => (v ? String(v).split('T')[0] : null)

      const rawPayload = {
        fund_name: rest.fund_name ?? '',
        fund_description: rest.fund_description ?? '',
        fund_address: rest.fund_address ?? '',
        incorp_date: toYmd(rest.incorp_date),
        reporting_start_date: toYmd(rest.reporting_start_date),
        fy_ends_on: rest.fy_ends_on ?? '',
        reporting_frequency: rest.reporting_frequency ?? '',
        reporting_currency: rest.reporting_currency ?? '',
        decimal_precision: rest.decimal_precision === '' || rest.decimal_precision === null ? null : Number(rest.decimal_precision),
        commission_accounting_method: (rest.commission_accounting_method || '').toLowerCase(),
        reporting_mtd: !!rest.reporting_mtd,
        reporting_qtd: !!rest.reporting_qtd,
        reporting_ytd: !!rest.reporting_ytd,
        reporting_itd: !!rest.reporting_itd,
        enable_report_email: !!rest.enable_report_email,
        date_format: rest.date_format || 'MM/DD/YYYY',
      }

      const incorpYmd = rawPayload.incorp_date
      const reportingStartYmd = rawPayload.reporting_start_date
      if (incorpYmd && reportingStartYmd && incorpYmd > reportingStartYmd) {
        alert('Incorporation date must be less than or equal to Reporting Start Date.')
        return
      }

      // keep only keys allowed by the current rules
      const payload = Object.fromEntries(Object.entries(rawPayload).filter(([key]) => canEditField(key)))

      const updated = await updateFund(fund_id, payload)
      setFormData(updated)
      setIsEditing(false)
      alert('✅ Fund updated')
    } catch (err) {
      console.error('Save failed:', err)
      alert(`❌ Save failed: ${err.message || err}`)
    }
  }

  // ✅ Get token from cookie, decode it, fetch fund data
  useEffect(() => {
    const token = Cookies.get('dashboardToken')

    if (token) {
      try {
        const decoded = jwtDecode(token)
        console.log('✅ Decoded Token:', decoded)

        const fund_id = decoded?.fund_id

        if (fund_id) {
          getFundDetails(fund_id)
            .then((data) => {
              console.log('📦 Fund data:', data)
              setFormData(data)
            })
            .catch((err) => {
              console.error('❌ Error fetching fund details:', err)
            })
        }
      } catch (error) {
        console.error('❌ Invalid token format:', error)
      }
    } else {
      console.warn('⚠️ No dashboardToken found in cookies')
    }
  }, [])

  // Show "capitalize" when backend sends "capital" (or similar)
  const commissionLabel = (val) => {
    const s = (val ?? '').toString().trim().toLowerCase()
    if (!s) return ''
    if (['capital', 'capitalize', 'capitalized'].includes(s)) return 'capitalize'
    return s // fallback to whatever the API sent (e.g., "expense")
  }

  // fields never editable
  const ALWAYS_LOCKED = ['fund_id', 'fund_status']
  const EDITABLE_WHEN_TRADES = ['reporting_currency', 'decimal_precision']
  const EDITABLE_WHEN_NO_TRADES = [
    'fund_address',
    'incorp_date',
    'reporting_start_date',
    'fy_ends_on',
    'reporting_frequency',
    'reporting_currency',
    'decimal_precision',
    'fund_description',
    
  ]
  const tradesExist = useMemo(() => {
    if (hasTrades) return true
    if (!formData) return false

    const { has_trades, hasTrades: camelHasTrades, trade_count, tradeCount, trades_count } = formData
    if (typeof has_trades === 'boolean') return has_trades
    if (typeof camelHasTrades === 'boolean') return camelHasTrades

    const numericCount = Number(
      trade_count ??
        tradeCount ??
        trades_count ??
        (Array.isArray(formData.trades) ? formData.trades.length : 0)
    )

    return !Number.isNaN(numericCount) && numericCount > 0
  }, [formData, hasTrades])
  const canEditField = (field) => {
    if (!isEditing) return false
    if (ALWAYS_LOCKED.includes(field)) return false
    if (tradesExist) return EDITABLE_WHEN_TRADES.includes(field)
    return EDITABLE_WHEN_NO_TRADES.includes(field)
  }
  const roField = (field) => !canEditField(field) // for text/number
  const disField = (field) => !canEditField(field) // for select/date/checkbox

  // Decode token → load fund → get trade count
  useEffect(() => {
    const token = Cookies.get('dashboardToken')
    if (!token) return

    try {
      const decoded = jwtDecode(token)
      const fund_id = decoded?.fund_id
      if (!fund_id) return

      // load fund
      getFundDetails(fund_id)
        .then(setFormData)
        .catch((err) => console.error('❌ fund fetch:', err))

      // check trades
      getTradeCount(fund_id)
        .then((count) => setHasTrades(count > 0))
        .catch((err) => {
          console.error('❌ trade count:', err)
          setHasTrades(false) // fail-open
        })
    } catch (e) {
      console.error('❌ token decode:', e)
    }
  }, [])

  // if (!formData) return <p className="m-4">⏳ Loading fund data...</p>;
  if (!formData) {
    return <div className="m-4">Loading fund data...</div>
  } else {
    return (
      <div className="position-relative">
        <Form className="row g-5 needs-validation m-3" id="fundForm" noValidate validated={validated} onSubmit={handleSubmit}>
          <FormGroup className="position-relative col-md-4 mt-3">
            <FormLabel>Fund Name</FormLabel>
            <FormControl
              type="text"
              placeholder="Fund Name"
              value={formData.fund_name || ''}
              onChange={onChange('fund_name')}
              readOnly={roField('fund_name')}
              required
            />
            <Feedback type="invalid" tooltip>
              Please enter fund name
            </Feedback>
          </FormGroup>

          <FormGroup className="position-relative col-md-4 mt-3">
            <FormLabel>Fund ID</FormLabel>
            <FormControl type="text" placeholder="Fund ID" value={formData.fund_id || ''} readOnly required />
            <Feedback type="invalid" tooltip>
              Please enter fund ID
            </Feedback>
          </FormGroup>

          <FormGroup className="position-relative col-md-4 mt-3">
            <FormLabel>Status</FormLabel>
            <FormControl type="text" placeholder="Status" value={formData.fund_status || ''} readOnly />
          </FormGroup>

          <FormGroup className="position-relative col-md-4 mt-3">
            <FormLabel>Fund Description</FormLabel>
            <FormControl
              type="text"
              placeholder="Description"
              value={formData.fund_description || ''}
              onChange={onChange('fund_description')}
              readOnly={roField('fund_description')}
            />
          </FormGroup>

          <FormGroup className="position-relative col-md-4 mt-3">
            <FormLabel>Fund Address</FormLabel>
            <FormControl
              type="text"
              placeholder="Address"
              value={formData.fund_address || ''}
              onChange={onChange('fund_address')}
              readOnly={roField('fund_address')}
            />
          </FormGroup>

          <FormGroup className="position-relative col-md-4 mt-3">
            <FormLabel>Incorporation Date</FormLabel>
            <FormControl
              type="date"
              value={incorpDate}
              onChange={(e) => setFormData((p) => ({ ...p, incorp_date: e.target.value || '' }))}
              disabled={disField('incorp_date')}
              max={reportingStartDate || undefined}
              isInvalid={isEditing && incorpAfterReporting}
            />
            {isEditing && incorpAfterReporting && (
              <div className="invalid-feedback d-block">Incorporation date must be less than or equal to Reporting Start Date.</div>
            )}
          </FormGroup>

          <FormGroup className="position-relative col-md-4 mt-3">
            <FormLabel>Reporting Start Date</FormLabel>
            <FormControl
              type="date"
              value={reportingStartDate}
              onChange={(e) => setFormData((p) => ({ ...p, reporting_start_date: e.target.value || '' }))}
              disabled={disField('reporting_start_date')}
              min={incorpDate || undefined}
              isInvalid={isEditing && incorpAfterReporting}
            />
            {isEditing && incorpAfterReporting && (
              <div className="invalid-feedback d-block">Reporting Start Date must be greater than or equal to Incorporation Date.</div>
            )}
          </FormGroup>

          <FormGroup className="position-relative col-md-4 mt-3">
            <FormLabel>Financial Year Ends On</FormLabel>
            <Form.Select type="text" value={formData.fy_ends_on || ''} onChange={onChange('fy_ends_on')} disabled={disField('fy_ends_on')}>
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
            </Form.Select>
          </FormGroup>

          <FormGroup className="position-relative col-md-4 mt-3">
            <FormLabel>Reporting Frequency</FormLabel>
            <Form.Select
              type="text"
              value={formData.reporting_frequency || ''}
              onChange={onChange('reporting_frequency')}
              disabled={disField('reporting_frequency')}>
              <option value="">Select</option>
              <option value="Daily">Daily</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Annually">Annually</option>
            </Form.Select>
          </FormGroup>

          <FormGroup className="position-relative col-md-4 mt-3">
            <FormLabel>Reporting Currency</FormLabel>
            <Form.Select
              type="text"
              value={formData.reporting_currency || ''}
              onChange={onChange('reporting_currency')}
              disabled={disField('reporting_currency')}>
              <option value="">Select</option>
              {currencies
                .slice()
                .sort((a, b) => a.code.localeCompare(b.code))
                .map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name} {c.symbol ? `(${c.symbol})` : ''}
                  </option>
                ))}
            </Form.Select>
          </FormGroup>

          <FormGroup className="position-relative col-md-4 mt-3">
            <FormLabel>Decimal Precision</FormLabel>
            <Form.Select
              type="number"
              value={formData.decimal_precision || 0}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  decimal_precision: e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
              disabled={disField('decimal_precision')}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </Form.Select>
          </FormGroup>

          <FormGroup className="position-relative col-md-4 mt-3">
            <FormLabel>Commission Accounting Method</FormLabel>
            <Form.Select
              type="text"
              value={commissionLabel(formData.commission_accounting_method)}
              onChange={onChange('commission_accounting_method')}
              disabled={disField('commission_accounting_method')}>
              <option value="">Select</option>
              <option value="capitalize">Capitalize</option>
              <option value="expense">Expense</option>
            </Form.Select>
          </FormGroup>

          <FormGroup className="position-relative col-md-4 mt-3">
            <FormLabel>Date Format</FormLabel>
            <Form.Select
              as="select"
              value={formData.date_format || 'MM/DD/YYYY'}
              onChange={(e) => setFormData((p) => ({ ...p, date_format: e.target.value }))}
              disabled={disField('date_format')}
              required>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            </Form.Select>
          </FormGroup>
          <FormGroup className="position-relative col-md-4 mt-3">
            <FormLabel>Reporting Components</FormLabel>
            {isEditing ? (
              <div className="d-flex gap-4 flex-wrap">
                <Form.Check
                  type="checkbox"
                  id="mtd"
                  label="MTD"
                  checked={!!formData.reporting_mtd}
                  onChange={(e) => setFormData((p) => ({ ...p, reporting_mtd: e.target.checked }))}
                  disabled={disField('reporting_mtd')}
                />
                <Form.Check
                  type="checkbox"
                  id="qtd"
                  label="QTD"
                  checked={!!formData.reporting_qtd}
                  onChange={(e) => setFormData((p) => ({ ...p, reporting_qtd: e.target.checked }))}
                  disabled={disField('reporting_qtd')}
                />
                <Form.Check
                  type="checkbox"
                  id="ytd"
                  label="YTD"
                  checked={!!formData.reporting_ytd}
                  onChange={(e) => setFormData((p) => ({ ...p, reporting_ytd: e.target.checked }))}
                  disabled={disField('reporting_ytd')}
                />
                <Form.Check
                  type="checkbox"
                  id="itd"
                  label="ITD"
                  checked={!!formData.reporting_itd}
                  onChange={(e) => setFormData((p) => ({ ...p, reporting_itd: e.target.checked }))}
                  disabled={disField('reporting_itd')}
                />
              </div>
            ) : (
              <div className="d-flex gap-4">
                <div>MTD: {formData.reporting_mtd ? '✔️' : '❌'}</div>
                <div>QTD: {formData.reporting_qtd ? '✔️' : '❌'}</div>
                <div>YTD: {formData.reporting_ytd ? '✔️' : '❌'}</div>
                <div>ITD: {formData.reporting_itd ? '✔️' : '❌'}</div>
              </div>
            )}
          </FormGroup>

          <Col xs={12} className="d-flex justify-content-end">
            {isEditing ? (
              <Button
                type="submit"
                form="fundForm" // ← use string id (or just remove this line)
                variant="success">
                Save
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsEditing(true)
                }}
                className="position-relative"
                style={{ zIndex: 2 }}>
                Edit
              </Button>
            )}
          </Col>
        </Form>
      </div>
    )
  }
}

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

export const Tooltips = () => {
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
      <FormGroup className="position-relative col-md-6 ">
        <FormLabel>Symbol name</FormLabel>
        <ChoicesFormInput
          options={{
            shouldSort: false,
          }}>
          <option value="Madrid">Madrid</option>
          <option value="Toronto">Toronto</option>
          <option value="Vancouver">Vancouver</option>
          <option value="London">London</option>
          <option value="Manchester">Manchester</option>
          <option value="Liverpool">Liverpool</option>
          <option value="Paris">Paris</option>
          <option value="Malaga">Malaga</option>
          <option value="Washington" disabled>
            Washington
          </option>
          <option value="Lyon">Lyon</option>
          <option value="Marseille">Marseille</option>
          <option value="Hamburg">Hamburg</option>
          <option value="Munich">Munich</option>
          <option value="Barcelona">Barcelona</option>
          <option value="Berlin">Berlin</option>
          <option value="Montreal">Montreal</option>
          <option value="New York">New York</option>
          <option value="Michigan">Michigan</option>
        </ChoicesFormInput>
        <Feedback tooltip>Looks good!</Feedback>
        <Feedback type="invalid" tooltip>
          Please enter first name.
        </Feedback>
      </FormGroup>
      <FormGroup className="position-relative col-md-6 ">
        <FormLabel>Date</FormLabel>
        <FormControl type="date" required />
        <Feedback tooltip>Looks good!</Feedback>
        <Feedback type="invalid" tooltip>
          Please enter last name.
        </Feedback>
      </FormGroup>
      <FormGroup className="position-relative col-md-3 mt-3">
        <FormLabel>Commission</FormLabel>
        <FormControl type="text" placeholder="Commission" required />
        <Feedback type="invalid" tooltip>
          Please provide a valid city.
        </Feedback>
      </FormGroup>
      <FormGroup className="position-relative col-md-3 mt-3">
        <FormLabel>Price</FormLabel>
        <FormControl type="text" placeholder="Price" required />
        <Feedback type="invalid" tooltip>
          Please provide a valid city.
        </Feedback>
      </FormGroup>
      <FormGroup className="position-relative col-md-3 mt-3">
        <FormLabel>Quantity</FormLabel>
        <FormControl type="text" placeholder="Quantity" required />
        <Feedback type="invalid" tooltip>
          Please provide a valid city.
        </Feedback>
      </FormGroup>
      <FormGroup className="position-relative col-md-3 mt-3">
        <FormLabel>Amount</FormLabel>
        <FormControl type="text" placeholder="Amount" required />
        <Feedback type="invalid" tooltip>
          Please provide a valid city.
        </Feedback>
      </FormGroup>
      <FormGroup className="position-relative col-md-6 mt-4">
        <FormLabel>Brokers</FormLabel>
        <ChoicesFormInput
          options={{
            shouldSort: false,
          }}>
          <option value="Madrid">Madrid</option>
          <option value="Toronto">Toronto</option>
          <option value="Vancouver">Vancouver</option>
          <option value="London">London</option>
          <option value="Manchester">Manchester</option>
          <option value="Liverpool">Liverpool</option>
          <option value="Paris">Paris</option>
          <option value="Malaga">Malaga</option>
          <option value="Washington" disabled>
            Washington
          </option>
          <option value="Lyon">Lyon</option>
          <option value="Marseille">Marseille</option>
          <option value="Hamburg">Hamburg</option>
          <option value="Munich">Munich</option>
          <option value="Barcelona">Barcelona</option>
          <option value="Berlin">Berlin</option>
          <option value="Montreal">Montreal</option>
          <option value="New York">New York</option>
          <option value="Michigan">Michigan</option>
        </ChoicesFormInput>
        <Feedback tooltip>Looks good!</Feedback>
        <Feedback type="invalid" tooltip>
          Please enter first name.
        </Feedback>
      </FormGroup>

      <FormGroup className="position-relative col-md-6 mt-4">
        <FormLabel>Description</FormLabel>
        <FormControl type="text" placeholder="Description" required />
        <Feedback type="invalid" tooltip>
          Please provide a valid state.
        </Feedback>
      </FormGroup>
      <Col xs={12}>
        <Button variant="primary" type="submit">
          Submit form
        </Button>
      </Col>
    </Form>
  )
}

export const BankForm = ({ bank, onSuccess, onClose, reportingStartDate, existingBanks = [] }) => {
  const isEdit = !!bank
  const [validated, setValidated] = useState(false)
  const [rsd, setRsd] = useState(null) // Reporting Start Date from token
  const [duplicateError, setDuplicateError] = useState('')

  const [form, setForm] = useState({
    bank_name: '',
    start_date: '',
  })

  // Get RSD from token on component mount
  useEffect(() => {
    try {
      const token = Cookies.get('dashboardToken')
      if (token) {
        const payload = jwtDecode(token) || {}
        // Try to get reporting start date from fund object first
        const raw =
          payload.fund?.reporting_start_date || payload.reporting_start_date || payload.reportingStartDate || payload.RSD || payload.fund_start_date

        if (raw) {
          // Normalize to YYYY-MM-DD (strip time if present)
          const match = String(raw).match(/^(\d{4}-\d{2}-\d{2})/)
          const normalized = match ? match[1] : null
          setRsd(normalized)
        }
      }
    } catch (error) {
      console.error('❌ Error decoding token:', error)
    }
  }, [])

  // Helper: check if start_date is less than RSD (should be >= RSD)
  const isBeforeRSD = useMemo(() => {
    if (!rsd || !form.start_date) return false
    return form.start_date < rsd
  }, [form.start_date, rsd])

  // ✅ Pre-fill if editing
  useEffect(() => {
    if (bank) {
      setForm({
        bank_name: bank.bank_name || '',
        start_date: bank.start_date || '',
      })
    }
  }, [bank])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))

    // Check for duplicate bank name (case-insensitive)
    if (name === 'bank_name' && value.trim()) {
      const trimmedValue = value.trim().toLowerCase()
      const isDuplicate = existingBanks.some((b) => {
        // For edit, exclude current bank from check
        if (isEdit && bank?.bank_id === b.bank_id) return false
        return b.bank_name?.toLowerCase() === trimmedValue
      })

      if (isDuplicate) {
        setDuplicateError('Bank name already exists in this fund')
      } else {
        setDuplicateError('')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formEl = e.currentTarget

    // 1) Native HTML validation
    if (!formEl.checkValidity()) {
      e.stopPropagation()
      setValidated(true)
      return
    }

    // 2) Frontend guard: start_date must be greater than or equal to RSD
    if (rsd && form.start_date && form.start_date < rsd) {
      toast.error(`Start Date must be greater than or equal to Reporting Start Date (${rsd}).`)
      setValidated(true)
      return
    }

    // 3) Guard for reportingStartDate prop
    if (reportingStartDate && form.start_date < reportingStartDate) {
      toast.error(`Bank date cannot be less than ${reportingStartDate}`)
      setValidated(true)
      return
    }

    // 4) Check for duplicate bank name
    if (duplicateError) {
      toast.error(duplicateError)
      setValidated(true)
      return
    }

    try {
      const token = Cookies.get('dashboardToken')
      const decoded = jwtDecode(token)

      const payload = {
        ...form,
        user_id: decoded.user_id,
        org_id: decoded.org_id,
        fund_id: decoded.fund_id,
      }

      if (isEdit) {
        await updateBank(bank.bank_id, payload) // ✅ Call update
      } else {
        await createBank(payload)
      }

      onSuccess?.()
      onClose?.()
    } catch (error) {
      console.error('❌ Failed to submit bank form:', error)
      
      // Handle different types of errors
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error('Cannot connect to server. Please check if the backend is running.')
      } else if (error.response?.status === 401) {
        toast.error('Unauthorized. Please log in again.')
      } else if (error.response?.status === 403) {
        toast.error('Forbidden. You do not have permission to perform this action.')
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later.')
      } else {
        toast.error(error.response?.data?.message || error.message || 'Failed to submit bank form')
      }
    }

    setValidated(true)
  }

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit} className="row g-3 m-1">
      <FormGroup className="col-md-6">
        <FormLabel>Bank Name</FormLabel>
        <FormControl name="bank_name" type="text" required value={form.bank_name} onChange={handleChange} isInvalid={!!duplicateError} />
        <Feedback type="invalid">{duplicateError || 'Please enter bank name'}</Feedback>
      </FormGroup>

      <FormGroup className="col-md-6">
        <FormLabel>Start Date</FormLabel>
        <FormControl 
          name="start_date" 
          type="date" 
          required 
          value={form.start_date} 
          onChange={handleChange}
          min={rsd || reportingStartDate || undefined}
          isInvalid={isBeforeRSD}
        />
        <Feedback type="invalid">Please provide a valid start date</Feedback>
        {isBeforeRSD && (
          <div className="text-danger mt-1" role="alert">
            Start date must be greater than or equal to Reporting Start Date ({rsd})
          </div>
        )}
      </FormGroup>

      <Col xs={12}>
        <Button type="submit" disabled={isBeforeRSD}>{isEdit ? 'Update' : 'Submit'}</Button>
      </Col>
    </Form>
  )
}

export const ExchangeForm = ({ exchange, onSuccess, onClose }) => {
  const isEdit = !!exchange
  const [validated, setValidated] = useState(false)

  const [form, setForm] = useState({
    exchange_id: '',
    exchange_name: '',
  })

  useEffect(() => {
    if (exchange) {
      setForm({
        exchange_id: exchange.exchange_id || '',
        exchange_name: exchange.exchange_name || '',
      })
    }
  }, [exchange])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formEl = e.currentTarget

    if (!formEl.checkValidity()) {
      e.stopPropagation()
    } else {
      try {
        const token = Cookies.get('dashboardToken')
        const decoded = jwtDecode(token)

        const payload = {
          ...form,
          user_id: decoded.user_id,
          org_id: decoded.org_id,
          fund_id: decoded.fund_id,
        }

        if (isEdit) {
          await updateExchange(exchange.exchange_uid, payload) // 👈 use exchange_uid
        } else {
          await createExchange(payload)
        }

        onSuccess?.()
        onClose?.()
      } catch (error) {
        console.error('❌ Failed to submit exchange form:', error)
      }
    }

    setValidated(true)
  }

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit} className="row g-3 m-1">
      <FormGroup className="col-md-6">
        <FormLabel>Exchange ID</FormLabel>
        <FormControl name="exchange_id" type="text" value={form.exchange_id} onChange={handleChange} required />
      </FormGroup>

      <FormGroup className="col-md-6">
        <FormLabel>Exchange Name</FormLabel>
        <FormControl name="exchange_name" type="text" value={form.exchange_name} onChange={handleChange} required />
      </FormGroup>

      <Col xs={12}>
        <Button type="submit">{isEdit ? 'Update' : 'Submit'}</Button>
      </Col>
    </Form>
  )
}

export const SymbolForm = ({ symbol, onSuccess, onClose }) => {
  const isEdit = !!symbol
  const [validated, setValidated] = useState(false)
  const [form, setForm] = useState({
    symbol_id: '',
    symbol_name: '',
    isin: '',
    cusip: '',
    contract_size: '',
    exchange_id: '',
    assettype_id: '',
  })

  const [exchanges, setExchanges] = useState([])
  const [assetTypes, setAssetTypes] = useState([])

  useEffect(() => {
    if (symbol) {
      setForm({
        symbol_id: symbol.symbol_id || '',
        symbol_name: symbol.symbol_name || '',
        isin: symbol.isin || '',
        cusip: symbol.cusip || '',
        contract_size: symbol.contract_size || '',
        exchange_id: symbol.exchange_id || '',
        asset_type_id: symbol.assettype_id || '',
      })
    }
  }, [symbol])

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const token = Cookies.get('dashboardToken')
        const decoded = jwtDecode(token)

        // Fetch exchanges filtered by fund_id (same as asset types)
        const exRes = await getExchangesByFundId(decoded.fund_id)
        const atRes = await getAssetTypesActive(decoded.fund_id) // ⬅ only active ones

        setExchanges(exRes.data || [])
        setAssetTypes(atRes.data || [])
      } catch (err) {
        console.error('❌ Dropdown Fetch Error:', err)
      }
    }
    fetchDropdowns()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formEl = e.currentTarget
    if (!formEl.checkValidity()) {
      e.stopPropagation()
    } else {
      const token = Cookies.get('dashboardToken')
      const decoded = jwtDecode(token)

      const payload = {
        ...form,
        fund_id: decoded.fund_id,
      }

      try {
        if (isEdit) {
          await updateSymbol(symbol.symbol_uid, payload)
        } else {
          await createSymbol(payload)
        }
        onSuccess?.()
        onClose?.()
        console.log('📤 Submitting payload:', payload)
      } catch (err) {
        const status = err?.response?.status
        const duplicateMessage = err?.response?.data?.error
        if (status === 409 && duplicateMessage) {
          console.warn('⚠️ Duplicate symbol detected:', duplicateMessage)
          alert(duplicateMessage)
        } else {
          console.error('❌ Failed to submit symbol form:', err)
        }
      }
    }

    setValidated(true)
  }

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit} className="row g-3 m-1">
      <FormGroup className="col-md-6">
        <FormLabel>Symbol ID</FormLabel>
        <FormControl name="symbol_id" type="text" required value={form.symbol_id} onChange={handleChange} />
        <Feedback type="invalid">Required</Feedback>
      </FormGroup>

      <FormGroup className="col-md-6">
        <FormLabel>Symbol Name</FormLabel>
        <FormControl name="symbol_name" type="text" required value={form.symbol_name} onChange={handleChange} />
        <Feedback type="invalid">Required</Feedback>
      </FormGroup>

      <FormGroup className="col-md-6">
        <FormLabel>ISIN</FormLabel>
        <FormControl name="isin" type="text" value={form.isin} onChange={handleChange} />
      </FormGroup>

      <FormGroup className="col-md-6">
        <FormLabel>CUSIP</FormLabel>
        <FormControl name="cusip" type="text" value={form.cusip} onChange={handleChange} />
      </FormGroup>

      <FormGroup className="col-md-6">
        <FormLabel>Contract Size</FormLabel>
        <FormControl name="contract_size" type="number" value={form.contract_size} onChange={handleChange} />
      </FormGroup>

      <FormGroup className="col-md-6">
        <FormLabel>Exchange</FormLabel>
        <FormControl as="select" name="exchange_id" required value={form.exchange_id} onChange={handleChange}>
          <option value="">Select Exchange</option>
          {exchanges.map((ex) => (
            <option key={ex.exchange_uid} value={ex.exchange_uid}>
              {ex.exchange_name}
            </option>
          ))}
        </FormControl>
        <Feedback type="invalid">Select exchange</Feedback>
      </FormGroup>

      <FormGroup className="col-md-6">
        <FormLabel>Asset Type</FormLabel>
        <FormControl as="select" name="asset_type_id" required value={form.asset_type_id} onChange={handleChange}>
          <option value="">Select Asset Type</option>
          {assetTypes.map((at) => (
            <option key={at.assettype_id} value={at.assettype_id}>
              {at.name}
            </option>
          ))}
        </FormControl>
        <Feedback type="invalid">Select asset type</Feedback>
      </FormGroup>

      <Col xs={12} className="mt-3">
        <Button type="submit">{isEdit ? 'Update Symbol' : 'Add Symbol'}</Button>
      </Col>
    </Form>
  )
}

const MAX_MB = 10
export const UploadSymbols = ({ fundId, onClose, onUploaded }) => {
  const dashboard = useDashboardToken()
  const currentFundId = fundId || dashboard?.fund_id
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [errorFileUrl, setErrorFileUrl] = useState('')
  const inputRef = useRef(null)
  const [msg, setMsg] = useState('')

  const close = () => {
    setFile(null)
    setErr('')
    setOk('')
    setErrorFileUrl('')
    if (inputRef.current) inputRef.current.value = ''
    if (onClose) onClose()
  }

  const onPick = (e) => {
    const f = e.target.files?.[0]
    setMsg('')
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.xlsx')) return setMsg('Only .xlsx files are allowed.')
    if (f.size > MAX_MB * 1024 * 1024) return setMsg(`Max ${MAX_MB} MB.`)
    setFile(f)
  }

  const downloadTemplate = async () => {
    try {
      // same route shape you set: /api/v1/symbol-loader/template/:fundId?
      const url = currentFundId ? `/api/v1/symbols/template/${currentFundId}` : `/api/v1/symbols/template`
      const res = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `symbol-loader-template${currentFundId ? '-' + currentFundId : ''}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(a.href)
    } catch {
      setErr('Template download failed. Try again.')
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setOk('')
    setErrorFileUrl('')
    if (!file) return setMsg('Choose a .xlsx file.')

    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)                     // Multer expects 'file'
      // CHANGED: no fundId in URL/body; backend reads fund_id from JWT
      // form.append('fund_id', String(currentFundId || ''))

      // NEW: pass Dashboard token in `dashboard` header (like Trade upload)
      const dashboardToken = Cookies.get('dashboardToken') || ''
      const res = await api.post(`/api/v1/symbols/upload`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          dashboard: dashboardToken ? `Bearer ${dashboardToken}` : undefined,
        },
      })

      // CHANGED: handle new response shape (success / error_file_url / file_id)
      const data = res?.data || {}
      if (data.success) {
        setOk(data.message || 'File uploaded. Validation in progress.')
        setMsg('')
        setErrorFileUrl('')
        if (inputRef.current) inputRef.current.value = ''
        setFile(null)
        console.log('✅ Upload successful, triggering onUploaded callback...')
        onUploaded?.() // Trigger refresh in parent component
        onClose?.() // Close modal after successful upload
      } else {
        // backend may return: { success:false, error_file_url, message }
        setErr(data.message || 'Upload/validation failed.')
        if (data.error_file_url) setErrorFileUrl(data.error_file_url)
      }
    } catch (e) {
      setErr(e?.response?.data?.message || e?.response?.data?.error || 'Upload failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form onSubmit={submit}>
      <Row className="mb-2">
        <Col className="text-end">
          <Button variant="link" className="text-primary text-decoration-underline p-0" onClick={downloadTemplate} size="sm">
            Download Symbol Template (.xlsx)
          </Button>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Select .xlsx file</Form.Label>
        <Form.Control
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={onPick}
          disabled={loading}
        />
        <Form.Text className="mt-1 d-inline-block text-decoration-underline">Allowed: .xlsx , Max size: {MAX_SIZE_MB} MB</Form.Text>
      </Form.Group>

      {file && (
        <Alert variant="info" className="py-2">
          Selected: <strong>{file.name}</strong>
          <Button
            variant="link"
            size="sm"
            className="ms-2 p-0 align-baseline"
            onClick={() => {
              setFile(null)
              if (inputRef.current) inputRef.current.value = ''
            }}>
            remove
          </Button>
        </Alert>
      )}

      {err && (
        <Alert variant="danger" className="py-2">
          {err}
          {errorFileUrl && (
            <>
              {' — '}
              <a href={errorFileUrl} target="_blank" rel="noreferrer">
                Download error file
              </a>
            </>
          )}
        </Alert>
      )}

      {ok && (
        <Alert variant="success" className="py-2">
          {ok}
        </Alert>
      )}

      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={close} disabled={loading}>
          Close
        </Button>
        <Button type="submit" variant="primary" disabled={!file || loading}>
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" /> Uploading…
            </>
          ) : (
            'Upload'
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

      <SymbolForm />
      <UploadSymbols />
      <ExchangeForm />

      <BrokerForm />

      <BankForm />

      {/* <Tooltips /> */}

      <AssetTypeForm />

      <BasicForm />
    </>
  )
}

export default AllFormValidation
