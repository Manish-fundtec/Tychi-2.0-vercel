import { format, parseISO } from 'date-fns'
// src/assets/tychiData/columnDefs.js

import CustomArrowButton from '@/components/agGrid/CustomArrowButton'
import ActionCellRenderer from '@/components/ActionCellRenderer'
import StatusToggleRenderer from '@/components/agGrid/StatusToggleRenderer'
import { Button, Col, Form, FormCheck, FormControl, FormGroup, FormLabel, FormSelect, InputGroup } from 'react-bootstrap'

// Default column definitions (optional)
export const defaultColDef = {
  sortable: true,
  filter: true,
  resizable: true, // Allow resizing
}

const now = new Date()
const date = parseISO(now.toISOString())
console.log(date)

// Specific column definitions
export const manualJournalColDefs = [
  { field: 'Id', headerName: 'Id', sortable: true, filter: true, resizable: true, checkboxSelection: true },
  { field: 'Journal Id', headerName: 'Journal ID', sortable: true, filter: true, editable: true },
  {
    field: 'Date',
    headerName: 'Date',
    sortable: true,
    filter: 'agDateColumnFilter',
    valueFormatter: (params) => {
      return params.value ? format(parseISO(params.value), 'MMMM do, yyyy') : 'No Date'
      ;('')
    },
  },
  { field: 'Debit Account', headerName: 'Debit Account', sortable: true, filter: true },
  { field: 'Credit Account', headerName: 'Credit Account', sortable: true, filter: true, flex: 2 },
  { field: 'Amount', headerName: 'Amount', sortable: true, filter: true },
]

const CustomButtonComponent = (props) => {
  return (
    <button onClick={() => window.alert('The Data has been Delete')} className="btn-sm btn-danger btn">
      Delete
    </button>
  )
}

export const TradeColDefs = [
  {
    field: 'trade_id',
    headerName: 'Trade ID',
    flex: 1,
    sortable: true,
    filter: true,
    search: true,
    checkboxSelection: true,
    headerCheckboxSelection: true, 
    headerCheckboxSelectionFilteredOnly: true,
    pinned: 'left',
  },
  {
    field: 'trade_date',
    headerName: 'Trade Date',
    sortable: true,
    filter: true,
    valueFormatter: (params) => {
      // Assuming TradeDate is in ISO string format
      if (!params.value) return '' // Handle null or undefined dates
      try {
        return format(new Date(params.value), 'yyyy-MM-dd') // Formats as YYYY-MM-DD
      } catch (error) {
        console.error('Invalid date format', params.value, error)
        return params.value // Fallback to original value if formatting fails
      }
    },
  },
  { field: 'symbol_id', headerName: 'Symbol ID', sortable: true, filter: true, search: true, flex: 1 },

  { field: 'price', headerName: 'Price', flex: 1 },
  { field: 'quantity', headerName: 'Quantity', flex: 1 },
  { field: 'amount', headerName: 'Amount', flex: 1 },
  // ✅ Action column with delete button
  {
    headerName: 'Action',
    field: 'action',
    width: 120,
    cellRenderer: ActionCellRenderer, // ✅ React component here
  },
]

// Configuration Table
export const BrokerageTableColDefs = [
  {
    field: 'SrNo',
    headerName: 'Sr. No',
    valueGetter: (params) => params.node.rowIndex + 1, // ✅ Serial number logic
    sortable: false,
    filter: false,
    flex: 1,
  },
  { field: 'broker_id', headerName: 'broker_id', sortable: true, filter: true, flex: 1 },
  { field: 'broker_name', headerName: 'broker_name', sortable: true, filter: true, flex: 1 },
  { field: 'start_date', headerName: 'start_date', sortable: true, filter: true, flex: 1 },
  {
    headerName: 'Actions',
    field: 'actions',
    cellRenderer: (params) => {
      const { handleEdit, handleDelete } = params.context
      return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-sm btn-warning" onClick={() => handleEdit(params.data)}>
            Edit
          </button>
          {/* ✅ pass entire row, not just broker_id */}
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(params.data)}>
            Delete
          </button>
        </div>
      )
    },
  },
]

export const BankTableColDefs = [
  {
    field: 'SrNo',
    headerName: 'Sr. No',
    valueGetter: (params) => params.node.rowIndex + 1,
    sortable: false,
    filter: false,
    flex: 1,
  },
  { field: 'bank_id', headerName: 'Bank ID', sortable: true, filter: true, flex: 1 },
  { field: 'bank_name', headerName: 'Bank Name', sortable: true, filter: true, flex: 1 },
  { field: 'start_date', headerName: 'Start Date', sortable: true, filter: true, flex: 1 },
  {
    headerName: 'Actions',
    field: 'actions',
    cellRenderer: (params) => {
      const { handleEdit, handleDelete } = params.context

      return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-sm btn-warning"
            onClick={() => {
              console.log('Clicked Edit') // ✅ Log here
              handleEdit(params.data) // ✅ This triggers modal
            }}>
            Edit
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(params.data.bank_id)}>
            Delete
          </button>
        </div>
      )
    },
  },
]
// src/assets/tychiData/ExchangeTableColDefs.js
export const ExchangeTableColDefs = [
  {
    field: 'SrNo',
    headerName: 'Sr. No',
    valueGetter: (params) => params.node.rowIndex + 1,
    sortable: false,
    filter: false,
    flex: 1,
  },
  { field: 'exchange_uid', headerName: 'UID', sortable: true, filter: true, flex: 1 },
  { field: 'exchange_id', headerName: 'Exchange ID', sortable: true, filter: true, flex: 1 },
  { field: 'exchange_name', headerName: 'Exchange Name', sortable: true, filter: true, flex: 1 },
  {
    headerName: 'Actions',
    field: 'actions',
    cellRenderer: (params) => {
      const { handleEdit, handleDelete } = params.context

      return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-sm btn-warning" onClick={() => handleEdit(params.data)}>
            Edit
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(params.data.exchange_uid)}>
            Delete
          </button>
        </div>
      )
    },
  },
]

export const assetTypeColDefs = (handleToggle) => [
  {
    field: 'SrNo',
    headerName: 'Sr. No',
    valueGetter: (params) => params.node.rowIndex + 1,
    sortable: false,
    filter: false,
    flex: 1,
  },
  { field: 'assettype_id', headerName: 'UID', sortable: true, filter: true, flex: 1 },
  { field: 'name', headerName: 'Name', sortable: true, filter: true, flex: 1 },
  { field: 'LongTermRule', headerName: 'Long Term Rule', sortable: true, filter: true, flex: 1 },
  { field: 'CloserRule', headerName: 'Closer Rule', sortable: true, filter: true, flex: 1 },
  {
    field: 'status',
    headerName: 'Status',
    flex: 1,
    sortable: false,
    cellRenderer: (params) => {
      const isActive = params.data.status === 'Active'

      const handleClick = () => {
        handleToggle(params.data, !isActive) // ✅ call toggle function
      }

      return (
        <div className="form-check form-switch">
          <input className="form-check-input" type="checkbox" checked={isActive} onChange={handleClick} id={`switch-${params.data.assettype_id}`} />
          <label className="form-check-label" htmlFor={`switch-${params.data.assettype_id}`}>
            {isActive ? 'Active' : 'Inactive'}
          </label>
        </div>
      )
    },
  },
]

export const getAssetTypeColDefs = (handleToggle) => [
  {
    field: 'SrNo',
    headerName: 'Sr. No',
    valueGetter: (params) => params.node.rowIndex + 1,
    sortable: false,
    filter: false,
    flex: 1,
  },
  { field: 'assettype_id', headerName: 'UID', sortable: true, filter: true, flex: 1 },
  { field: 'name', headerName: 'Name', sortable: true, filter: true, flex: 1 },
  { field: 'long_term_rule', headerName: 'Long Term Rule', sortable: true, filter: true, flex: 1 },
  { field: 'closure_rule', headerName: 'Closer Rule', sortable: true, filter: true, flex: 1 },
  {
    field: 'status',
    headerName: 'Status',
    flex: 1,
    sortable: false,
    cellRenderer: (params) => {
      const isActive = params.data.status === 'Active'
      const handleClick = () => {
        handleToggle(params.data, !isActive) // Pass row and next status
      }

      return (
        <div className="form-check form-switch">
          <input className="form-check-input" type="checkbox" checked={isActive} onChange={handleClick} id={`switch-${params.data.assettype_id}`} />
          <label className="form-check-label" htmlFor={`switch-${params.data.assettype_id}`}>
            {isActive ? 'Active' : 'Inactive'}
          </label>
        </div>
      )
    },
  },
]

export const symbolColDefs = [
  {
    field: 'SrNo',
    headerName: 'Sr. No',
    valueGetter: (params) => params.node.rowIndex + 1,
    sortable: false,
    filter: false,
    flex: 1,
  },
  { field: 'symbol_uid', headerName: 'Symbol UID', sortable: true, filter: true, flex: 1 },
  { field: 'symbol_id', headerName: 'Symbol ID', sortable: true, filter: true, flex: 1 },
  { field: 'symbol_name', headerName: 'Symbol Name', sortable: true, filter: true, flex: 1 },
  { field: 'isin', headerName: 'ISIN', sortable: true, filter: true, flex: 1 },
  { field: 'cusip', headerName: 'CUSIP', sortable: true, filter: true, flex: 1 },
  { field: 'asset_type_id', headerName: 'Asset Type', sortable: true, filter: true, flex: 1 },
  { field: 'exchange_id', headerName: 'Exchange', sortable: true, filter: true, flex: 1 },
  { field: 'contract_size', headerName: 'Contract Size', sortable: true, filter: true, flex: 1 },
  {
    headerName: 'Actions',
    field: 'actions',
    cellRenderer: (params) => {
      const handleEdit = params.context?.handleEdit
      const handleDelete = params.context?.handleDelete

      if (!handleEdit || !handleDelete) {
        return <span className="text-danger">⚠️ Missing context</span> // Display missing context error message
      }

      return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-sm btn-warning" onClick={() => handleEdit(params.data)}>
            Edit
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(params.data.symbol_uid)}>
            Delete
          </button>
        </div>
      )
    },
    flex: 1,
  },
]
// Pricing Table
export const pricingColDefs = [
  { headerName: 'Sr.No', field: 'srNo', sortable: true, filter: true, flex: 1, checkboxSelection: true },
  { headerName: 'Reporting Period', field: 'month', sortable: true, filter: true, flex: 1 },
  { headerName: 'Reporting Date', field: 'date', sortable: true, filter: true, flex: 1 },
  { headerName: 'Status', field: 'status', sortable: true, filter: true, flex: 1 },
]

// reports Table
export const reportsColDefs = [
  { headerName: 'Sr.No', field: 'srNo', sortable: true, filter: true, flex: 1, checkboxSelection: true },
  { headerName: 'Month', field: 'month', sortable: true, filter: true, flex: 1 },
  { headerName: 'Date', field: 'date', sortable: true, filter: true, flex: 1 },
  { headerName: 'Status', field: 'status', sortable: true, filter: true, flex: 1 },
]

// Reconcilation Table
export const reconciliationColDefs = [
  { headerName: 'Sr.No', field: 'srNo', sortable: true, filter: true, flex: 1, checkboxSelection: true },
  { headerName: 'Reporting Period', field: 'month', sortable: true, filter: true, flex: 1 },
  { headerName: 'Reporting Date', field: 'date', sortable: true, filter: true, flex: 1 },
  { headerName: 'Status', field: 'status', sortable: true, filter: true, flex: 1 },
  {
    headerName: 'Action',
    field: 'srNo',
    cellRenderer: (params) => {
      return `<a href="/reconciliation2/${params.value}" class="btn btn-primary btn-sm">View</a>`
    },
  },
]
// Reconcilation2 Table
export const reconciliation2columnDefs = [
  { headerName: 'S.No', field: 'srNo', sortable: true, filter: true, flex: 1, checkboxSelection: true },
  { headerName: 'Reporting Period', field: 'month', sortable: true, filter: true, flex: 1 },
  { headerName: 'Reporting Date', field: 'date', sortable: true, filter: true, flex: 1 },
  { headerName: 'Broker & Bank Name', field: 'brokerBank', sortable: true, filter: true, flex: 1 },
  { headerName: 'Closing Balance', field: 'closingBalance', sortable: true, filter: true, flex: 1 },
  {
    headerName: 'Action',
    field: 'srNo',
    cellRenderer: (params) => {
      return `<button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#reconciliationModal">
                <i class="fas fa-eye"></i>
              </button>`
    },
    flex: 1,
  },
]
// Bookclosure Table
export const bookclosureColDefs = [
  { headerName: 'Sr.No', field: 'srNo', sortable: true, filter: true, flex: 1, checkboxSelection: true },
  { headerName: 'Reporting Period', field: 'month', sortable: true, filter: true, flex: 1 },
  { headerName: 'Reporting Date', field: 'date', sortable: true, filter: true, flex: 1 },
  { headerName: 'Status', field: 'status', sortable: true, filter: true, flex: 1 },
  {
    field: 'Action',
    headerName: 'Action',
    cellRenderer: CustomButtonComponent,
    flex: 1,
  },
]

export const tableColDefs = {
  trades: [
    { field: 'TradeID', flex: 2, sortable: true, filter: true, search: true },
    { field: 'Date', sortable: true, filter: true, search: true },
    { field: 'Symbol', sortable: true, filter: true, search: true },
    { field: 'price' },
    { field: 'Quantity' },
    { field: 'Amount' },
    { field: 'Action', cellRenderer: CustomButtonComponent, flex: 1 },
  ],
  bank: [
    { field: 'Sno', headerName: 'Sno.', sortable: true, filter: true },
    { field: 'UID', headerName: 'UID', sortable: true, filter: true, flex: 1 },
    { field: 'BankID', headerName: 'Bank ID', sortable: true, filter: true, flex: 1 },
    { field: 'BankName', headerName: 'Bank Name', sortable: true, filter: true, flex: 1 },
    {
      field: 'StartDate',
      flex: 1,
      headerName: 'Start Date',
      sortable: true,
      valueFormatter: (params) => {
        // Format the date as a simple readable format
        if (!params.value) return ''
        try {
          return new Date(params.value).toLocaleDateString() // Locale-based date format
        } catch (error) {
          console.error('Invalid date format', params.value, error)
          return params.value
        }
      },
    },
  ],
}

// export const journalsColDefs = [
//   { headerName: 'SrNo', field: 'SrNo', sortable: true, filter: true, checkboxSelection: true },
//   { headerName: 'DocumentId', field: 'DocumentId', sortable: true, filter: true, flex: 1 },
//   { headerName: 'Journal Id', field: 'JournalId', sortable: true, filter: true, flex: 1 },
//   { headerName: 'JournalType', field: 'Journal Type', sortable: true, filter: true, flex: 1 },
//   { headerName: 'Date', field: 'Date', sortable: true, filter: true, flex: 1 },
//   { headerName: 'JournalType', field: 'Journal Type', sortable: true, filter: true, flex: 1 },
//   { field: 'Debit Account', headerName: 'Debit Account', sortable: true, filter: true },
//   { field: 'Credit Account', headerName: 'Credit Account', sortable: true, filter: true, flex: 2 },
//   { headerName: 'Amount', field: 'Amount', sortable: true, filter: true, flex: 1 },
// ]

export const fundColDefs = [
  {
    field: 'SrNo',
    headerName: 'Sr. No',
    valueGetter: (params) => params.node.rowIndex + 1, // ✅ Serial number logic
    sortable: false,
    filter: false,
    flex: 1,
  },
  { headerName: 'Fund ID', field: 'fund_id', sortable: true, filter: true, flex: 1 },
  { headerName: 'Fund Name', field: 'fund_name', sortable: true, filter: true, flex: 1 },
  { headerName: 'Status', field: 'fund_status', sortable: true, filter: true, flex: 1 },
  {
    field: 'Action',
    headerName: 'Action',
    cellRenderer: CustomArrowButton,
    flex: 1,
  },
]

const dateFmt = (p) => {
  if (!p.value) return ''
  const d = new Date(p.value)
  return Number.isNaN(d.getTime()) ? p.value : d.toISOString().slice(0, 10)
}
const amtFmt = (p) => {
  const n = Number(p.value)
  return Number.isNaN(n) ? (p.value ?? '') : n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export const journalColDefs = [
  { headerName: '#', valueGetter: 'node.rowIndex + 1', width: 70, pinned: 'left', flex: 1 },
  { field: 'journal_date', headerName: 'Date', filter: 'agDateColumnFilter', flex: 1 },
  { field: 'journal_type', headerName: 'Type', flex: 1 },
  { field: 'amount', headerName: 'Amount', flex: 1 },
  { field: 'dr_account', headerName: 'DR Account', flex: 1 },
  { field: 'cr_account', headerName: 'CR Account', flex: 1 },
  { field: 'document_number', headerName: 'Document No.', flex: 1 },
  { field: 'description', headerName: 'Description', flex: 1 },
  // { field: 'created_at', headerName: 'Created At' },
]

var AllModules = {
  defaultColDef,
  manualJournalColDefs,
  pricingColDefs,
  reportsColDefs,
  reconciliationColDefs,
  reconciliation2columnDefs,
  bookclosureColDefs,
  tableColDefs,
  journalColDefs,
}
export default AllModules
