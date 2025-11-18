'use client'

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Row, Col, Card, CardBody, CardHeader, CardTitle, Form, Button } from 'react-bootstrap'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry } from 'ag-grid-community'
import { ClientSideRowModelModule } from 'ag-grid-community'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import api from '@/lib/api/axios'
import { getAssetTypesActive } from '@/lib/api/assetType'
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa'

// AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule])

// Accordion section order
const SECTIONS = ['Trade', 'Basis', 'Short Term RPNL', 'Long Term RPNL', 'UPNL']

// Some rows are not editable by business rule (e.g., "NA")
const NON_EDITABLE_MAP = {
  Basis: {
    Futures: { long: true, short: true, setoff: true }, // all three fields NA and non-editable for Futures in Basis
  },
}

// Helpers to translate between {value,label}
const toLabel = (list, value) => {
  const m = list.find((x) => x.value === value)
  return m ? m.label : value || '-'
}

// Special value formatter for Trade section
const formatTradeValue = (list, value, section) => {
  if (section === 'Trade') {
    if (value === 'BROKER_CASH') return 'Respective Broker cash'
  }
  return toLabel(list, value)
}
const makeValues = (list) => list.map((x) => x.value)

export default function MappingTab({ fund_id: fundIdProp }) {
  const [fundId, setFundId] = useState(fundIdProp || null)
  const [loading, setLoading] = useState(true)
  const [quickFilter, setQuickFilter] = useState('')

  // [{ value: '14100', label: '14100 — Investment Long — Cost — Stock' }, ...]
  const [glOptions, setGlOptions] = useState([])

  // { 'Trade': [{id,asset,long,short,setoff}, ...], ... }
  const [rowsBySection, setRowsBySection] = useState({})
  
  // Store all active asset types (to ensure all are displayed in each section)
  const [allAssetTypes, setAllAssetTypes] = useState([])

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false)
  const [pendingChanges, setPendingChanges] = useState({}) // Track changes before saving
  const [saving, setSaving] = useState(false)

  const gridRefs = useRef({}) // section -> gridRef

  // get fund id once
  useEffect(() => {
    if (fundIdProp) return
    const token = Cookies.get('dashboardToken')
    if (!token) return
    try {
      const d = jwtDecode(token)
      setFundId(d?.fund_id || null)
    } catch (e) {
      console.error('jwt decode failed', e)
    }
  }, [fundIdProp])

  // ========================================
  // MAPPING DROPDOWN DATA SOURCE
  // ========================================
  // This useEffect loads the dropdown options for Long/Short/Setoff columns
  // Data comes from: /api/v1/chart-of-accounts/fund/${fundId} (hierarchical) and /api/v1/chart-of-accounts/postable/${fundId}
  // Format: [{ value: "13110", label: "13110 - Investment Long - Cost - Stock" }, ...]
  // This data is used in the AgGrid dropdown editors
  useEffect(() => {
    if (!fundId) return
    ;(async () => {
      try {
        // FETCH: Get hierarchical Chart of Accounts data to build parent paths
        const [hierarchicalRes, postableRes] = await Promise.all([
          api.get(`/api/v1/chart-of-accounts/fund/${fundId}`),
          api.get(`/api/v1/chart-of-accounts/postable/${fundId}`, {
            params: { excludeRoots: true, onlyLeaves: false },
          })
        ])

        // Build parent lookup map from hierarchical data
        const hierarchicalData = hierarchicalRes?.data?.data || []
        const buildParentLookup = (nodes, parentMap = {}, parentPath = []) => {
          const rootCategories = ['Asset', 'Liability', 'Equity', 'Income', 'Expense']
          
          const processNode = (node, currentPath) => {
            const code = String(node.gl_code || node.code || '')
            const name = node.gl_name || node.name || ''
            
            if (code && name) {
              // Store parent path (excluding current node and root categories)
              const filteredPath = currentPath.filter(p => !rootCategories.includes(p))
              parentMap[code] = filteredPath
            }
            
            // Build path for children (include current node if not root)
            const childPath = rootCategories.includes(name) ? [] : [...currentPath, name]
            
            // Recursively process children
            if (node.children && node.children.length > 0) {
              for (const child of node.children) {
                processNode(child, childPath)
              }
            }
          }
          
          for (const node of hierarchicalData || []) {
            processNode(node, [])
          }
          
          return parentMap
        }
        
        const parentLookup = buildParentLookup(hierarchicalData)
        
        // Helper to format label with parent path
        const formatLabel = (code, name) => {
          const parentPath = parentLookup[code] || []
          if (parentPath.length > 0) {
            // Join parent path and current name: "13110 - Investment Long - Cost - Stock"
            return `${code} - ${parentPath.join(' - ')} - ${name}`
          }
          // Fallback to simple format if no parent path found
          return `${code} - ${name}`
        }

        // TRANSFORM: Convert postable API data to dropdown format with full path
        const list = (Array.isArray(postableRes.data) ? postableRes.data : []).map((a) => ({
          value: String(a.code), // Used as the actual value stored in database
          label: formatLabel(String(a.code), a.name || ''), // Full path format: "13110 - Investment Long - Cost - Stock"
        }))

        //  ADD: Special options for Trade section
        const brokerCashOption = {
          value: 'BROKER_CASH',
          label: 'Respective Broker cash',
        }

        // STORE: Save dropdown options for use in AgGrid
        setGlOptions([brokerCashOption, ...list])
      } catch (e) {
        console.error('Failed to load GL options:', e)
        setGlOptions([])
      }
    })()
  }, [fundId])

  // ========================================
  // FETCH ALL ACTIVE ASSET TYPES
  // ========================================
  // Fetch all active asset types to ensure all are displayed in each section
  useEffect(() => {
    if (!fundId) return
    ;(async () => {
      try {
        const res = await getAssetTypesActive(fundId)
        const assetTypes = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []
        setAllAssetTypes(assetTypes)
      } catch (e) {
        console.error('Failed to load active asset types:', e)
        setAllAssetTypes([])
      }
    })()
  }, [fundId])

  // ========================================
  // MAPPING TABLE DATA SOURCE
  // ========================================
  // This loads the actual mapping data that fills the table rows
  // Data comes from: /api/v1/mapping/${fundId}
  // Ensures ALL active asset types are shown in each section, even without mappings
  useEffect(() => {
    if (!fundId) return
    ;(async () => {
      try {
        setLoading(true)
        //  FETCH: Get mapping data from database
        const r = await api.get(`/api/v1/mapping/${fundId}`)
        const data = Array.isArray(r.data?.data) ? r.data.data : r.data

        //  TRANSFORM: Group mapping data by section and asset type
        const mappingBySection = (data || []).reduce((acc, m) => {
          const header = m.header_name || 'Other'
          const assetName = m.assettype_name
          
          if (!acc[header]) acc[header] = {}
          
          // Check if value is null or NA
          const normalizeValue = (value) => {
            if (value === null || value === undefined) return 'NA'
            const str = String(value).trim().toUpperCase()
            if (str === '' || str === 'NA' || str === 'N/A' || str === 'NULL') return 'NA'
            return value
          }
          
          // Special handling for Futures in Basis section - preserve NA values
          const isFuturesInBasis = header === 'Basis' && assetName && (
            assetName.toLowerCase().trim() === 'futures' || 
            assetName.toLowerCase().trim() === 'future' ||
            assetName.toLowerCase().includes('futures') ||
            assetName.toLowerCase().includes('future')
          )
          
          if (isFuturesInBasis) {
            // For Futures in Basis, preserve null/NA as 'NA'
            acc[header][assetName] = {
              id: m.mapping_id,
              asset: assetName,
              long: normalizeValue(m.gl_code_long),
              short: normalizeValue(m.gl_code_short),
              setoff: normalizeValue(m.gl_code_setoff),
            }
          } else {
            // For all other cases, use empty string if null/NA
            acc[header][assetName] = {
              id: m.mapping_id,
              asset: assetName,
              long: m.gl_code_long || '',
              short: m.gl_code_short || '',
              setoff: m.gl_code_setoff || '',
            }

            //  ADD: Default values for Trade section
            if (header === 'Trade') {
              acc[header][assetName].long = 'BROKER_CASH'
              acc[header][assetName].short = 'BROKER_CASH'
              acc[header][assetName].setoff = '14000'
            }
          }

          return acc
        }, {})

        //  ENSURE ALL ACTIVE ASSET TYPES ARE IN EACH SECTION
        // For each section, create rows for all active asset types (merge with existing mappings)
        // Helper function to get default GL codes based on asset type
        const getDefaultGLCodes = (assetTypeName, section) => {
          // Default values for Trade section
          if (section === 'Trade') {
            return { long: 'BROKER_CASH', short: 'BROKER_CASH', setoff: '14000' }
          }
          // Default values for Short Term RPNL section
          if (section === 'Short Term RPNL') {
            return { long: '41200', short: '41200', setoff: '14000' }
          }
          // Default values for Long Term RPNL section
          if (section === 'Long Term RPNL') {
            return { long: '41100', short: '41100', setoff: '14000' }
          }
          // Default GL codes for UPNL section based on asset type
          // Pattern: Long codes start with 132XX, Short codes start with 212XX (same last 3 digits)
          if (section === 'UPNL') {
            const name = (assetTypeName || '').toLowerCase().trim()
            const defaults = {
              'stock': { long: '13210', short: '21210' },
              'futures': { long: '13220', short: '21220' },
              'future': { long: '13220', short: '21220' }, // Handle singular form
              'options': { long: '13230', short: '21230' },
              'option': { long: '13230', short: '21230' }, // Handle singular form
              'bonds': { long: '13240', short: '21240' },
              'bond': { long: '13240', short: '21240' }, // Handle singular form
              'digital asset': { long: '13250', short: '21250' },
              'digitalasset': { long: '13250', short: '21250' }, // Handle no space
              'partnerships': { long: '13260', short: '21260' },
              'partnership': { long: '13260', short: '21260' }, // Handle singular form
              'master funds': { long: '13270', short: '21270' },
              'masterfunds': { long: '13270', short: '21270' }, // Handle no space
              'master fund': { long: '13270', short: '21270' }, // Handle singular form
              'other': { long: '13280', short: '21280' },
            }
            const result = defaults[name] || null
            if (result) {
              result.setoff = '42000' // UPNL Setoff
            }
            return result
          }
          // Default GL codes for Basis and other sections based on asset type
          // Pattern: Long codes start with 13XXX, Short codes start with 21XXX (same last 3 digits)
          const name = (assetTypeName || '').toLowerCase().trim()
          const defaults = {
            'stock': { long: '13110', short: '21110' },
            'futures': { long: '13120', short: '21120' },
            'future': { long: '13120', short: '21120' }, // Handle singular form
            'options': { long: '13130', short: '21130' },
            'option': { long: '13130', short: '21130' }, // Handle singular form
            'bonds': { long: '13140', short: '21140' },
            'bond': { long: '13140', short: '21140' }, // Handle singular form
            'digital asset': { long: '13150', short: '21150' },
            'digitalasset': { long: '13150', short: '21150' }, // Handle no space
            'partnerships': { long: '13160', short: '21160' },
            'partnership': { long: '13160', short: '21160' }, // Handle singular form
            'master funds': { long: '13170', short: '21170' },
            'masterfunds': { long: '13170', short: '21170' }, // Handle no space
            'master fund': { long: '13170', short: '21170' }, // Handle singular form
            'other': { long: '13180', short: '21180' },
          }
          const result = defaults[name] || null
          if (result) {
            result.setoff = '14000' // Investment Clearing
          }
          return result
        }
        
         // Helper function to check if a value is empty or "NA"
         const isEmptyOrNA = (value) => {
           const str = String(value || '').trim().toUpperCase()
           return !str || str === 'NA' || str === 'N/A'
         }
         
         // Helper function to check if asset is Futures in Basis section
         const isFuturesInBasis = (assetName, section) => {
           const name = (assetName || '').toLowerCase().trim()
           return section === 'Basis' && (
             name === 'futures' || 
             name === 'future' || 
             name.includes('futures') ||
             name.includes('future')
           )
         }
         
         // Helper function to check if asset is Futures in UPNL section
         const isFuturesInUPNL = (assetName, section) => {
           const name = (assetName || '').toLowerCase().trim()
           return section === 'UPNL' && (name === 'futures' || name === 'future')
         }
         
         const grouped = {}
         for (const section of SECTIONS) {
           grouped[section] = allAssetTypes.map((assetType) => {
             const assetName = assetType.assettype_name || assetType.name || assetType.asset_type_name || ''
             
             // Check if mapping exists for this asset type in this section
             const existingMapping = mappingBySection[section]?.[assetName]
             
             if (existingMapping) {
              // Special handling for Futures in Basis section - force all three fields to 'NA'
              if (isFuturesInBasis(assetName, section)) {
                // For Futures in Basis, force long, short, and setoff to 'NA'
                existingMapping.long = 'NA'
                existingMapping.short = 'NA'
                existingMapping.setoff = 'NA'
                return existingMapping
              }
               
               // Special handling for Futures in UPNL section - force to use 13300
               if (isFuturesInUPNL(assetName, section)) {
                 existingMapping.long = '13300'
                 existingMapping.short = '13300'
                 if (isEmptyOrNA(existingMapping.setoff)) {
                   existingMapping.setoff = '42000'
                 }
                 return existingMapping
               }
               
               // Special handling for UPNL section - force setoff to 42000 for all asset types
               if (section === 'UPNL') {
                 if (isEmptyOrNA(existingMapping.setoff)) {
                   existingMapping.setoff = '42000'
                 }
                 // Apply default GL codes for long and short if empty/NA
                 const defaults = getDefaultGLCodes(assetName, section)
                 if (defaults) {
                   if (isEmptyOrNA(existingMapping.long)) {
                     existingMapping.long = defaults.long
                   }
                   if (isEmptyOrNA(existingMapping.short)) {
                     existingMapping.short = defaults.short
                   }
                 }
                 return existingMapping
               }
               
               // Special handling for Long Term RPNL section - force all to use 41100
               if (section === 'Long Term RPNL') {
                 existingMapping.long = '41100'
                 existingMapping.short = '41100'
                 if (isEmptyOrNA(existingMapping.setoff)) {
                   existingMapping.setoff = '14000'
                 }
                 return existingMapping
               }
               
               // For all other cases, replace empty/NA values with defaults
               const defaults = getDefaultGLCodes(assetName, section)
               if (defaults) {
                 if (isEmptyOrNA(existingMapping.long)) {
                   existingMapping.long = defaults.long
                 }
                 if (isEmptyOrNA(existingMapping.short)) {
                   existingMapping.short = defaults.short
                 }
                 if (isEmptyOrNA(existingMapping.setoff)) {
                   existingMapping.setoff = defaults.setoff
                 }
               }
               return existingMapping
             }
             
             // Create empty row for asset type without mapping
             const emptyRow = {
               id: null, // No mapping_id yet
               asset: assetName,
               long: '',
               short: '',
               setoff: '',
             }
             
             // Special handling for Futures in UPNL section - set 13300 for long and short
             if (isFuturesInUPNL(assetName, section)) {
               emptyRow.long = '13300'
               emptyRow.short = '13300'
               emptyRow.setoff = '42000'
             }
             // Special handling for Futures in Basis section - set NA for all three fields if no mapping
             else if (isFuturesInBasis(assetName, section)) {
               emptyRow.long = 'NA'
               emptyRow.short = 'NA'
               emptyRow.setoff = 'NA'
             }
             // Special handling for UPNL section - apply defaults with 42000 setoff
             else if (section === 'UPNL') {
               const defaults = getDefaultGLCodes(assetName, section)
               if (defaults) {
                 emptyRow.long = defaults.long
                 emptyRow.short = defaults.short
                 emptyRow.setoff = '42000'
               } else {
                 emptyRow.setoff = '42000'
               }
             } else {
               // Apply default values for all other cases
               const defaults = getDefaultGLCodes(assetName, section)
               if (defaults) {
                 emptyRow.long = defaults.long
                 emptyRow.short = defaults.short
                 emptyRow.setoff = defaults.setoff
               }
             }
             
             return emptyRow
           })
         }

        //  STORE: Save grouped mapping data for display in table
        setRowsBySection(grouped)
      } catch (e) {
        console.error('Failed to load mappings:', e)
        setRowsBySection({})
      } finally {
        setLoading(false)
      }
    })()
  }, [fundId, allAssetTypes])

  // ========================================
  // MAPPING DROPDOWN USAGE IN AGGrid
  // ========================================
  // This creates the column definitions for the mapping table
  // The dropdown data from glOptions is used here in cellEditorParams
  const columnDefs = useMemo(() => {
    // EXTRACT: Get just the values for dropdown editor
    const values = makeValues(glOptions)

    /** cell editable rule */
    const isCellEditable = (section, asset, field) => {
      const sec = NON_EDITABLE_MAP[section]
      if (!sec) return true
      const rowRule = sec[asset]
      if (!rowRule) return true
      if (rowRule[field]) return false
      return true
    }

    /** shared col parts - THIS IS WHERE DROPDOWN DATA IS USED */
    const makeEditableCol = (field, headerName) => ({
      field,
      headerName,
      flex: 1,
      editable: (p) => {
        // Only editable in edit mode
        if (!isEditMode) return false
        const section = p?.context?.sectionName
        const asset = p?.data?.asset
        return isCellEditable(section, asset, field)
      },
      //  DROPDOWN: This is where the mapping dropdown data is used
      cellEditor: isEditMode ? 'agSelectCellEditor' : undefined,
      cellEditorParams: isEditMode
        ? {
            values,
            showDropdown: true, // Always show dropdown
            suppressKeyboardEvent: () => false, // Allow keyboard navigation
          }
        : undefined, // Uses values from glOptions (13110, 14000, etc.)

      //  DISPLAY: This shows what user sees in the cell
      valueFormatter: (p) => {
        const section = p?.context?.sectionName
        return formatTradeValue(glOptions, p.value, section)
      },
      // deny same-code duplicates within row
      valueSetter: (p) => {
        const newVal = String(p.newValue || '')
        if (!newVal) {
          p.data[field] = ''
          return true
        }
        const duplicate =
          (field !== 'long' && newVal === p.data.long) ||
          (field !== 'short' && newVal === p.data.short) ||
          (field !== 'setoff' && newVal === p.data.setoff)
        if (duplicate) {
          alert('Long / Short / Setoff must all be different GL codes.')
          return false
        }
        p.data[field] = newVal
        return true
      },
    })

    return [
      { field: 'asset', headerName: 'Assets', editable: false, flex: 1 },
      makeEditableCol('long', 'Long'),
      makeEditableCol('short', 'Short'),
      makeEditableCol('setoff', 'Setoff'),
    ]
  }, [glOptions, isEditMode])

  /** Save one row back */
  const saveRow = async (row) => {
    try {
      await api.put(`/api/v1/mapping/${row.id}`, {
        fund_id: fundId,
        mapping_id: row.id,
        gl_code_long: row.long || null,
        gl_code_short: row.short || null,
        gl_code_setoff: row.setoff || null,
      })
    } catch (e) {
      console.error('Update mapping failed', e)
      alert('Failed to save mapping. Please try again.')
    }
  }

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit mode - discard changes
      setPendingChanges({})
      setIsEditMode(false)
    } else {
      // Show confirmation before entering edit mode
      const confirmed = window.confirm('Are you sure you want to edit the mapping?')
      if (confirmed) {
        setIsEditMode(true)
      }
    }
  }

  const refreshMappings = useCallback(async () => {
    if (!fundId || allAssetTypes.length === 0) return
    
    const r = await api.get(`/api/v1/mapping/${fundId}`)
    const data = Array.isArray(r.data?.data) ? r.data.data : r.data

    // Group mapping data by section and asset type
    const mappingBySection = (data || []).reduce((acc, m) => {
      const header = m.header_name || 'Other'
      const assetName = m.assettype_name
      
      if (!acc[header]) acc[header] = {}
      
      // Check if value is null or NA
      const normalizeValue = (value) => {
        if (value === null || value === undefined) return 'NA'
        const str = String(value).trim().toUpperCase()
        if (str === '' || str === 'NA' || str === 'N/A' || str === 'NULL') return 'NA'
        return value
      }
      
      // Special handling for Futures in Basis section - preserve NA values
      const isFuturesInBasis = header === 'Basis' && assetName && (
        assetName.toLowerCase().trim() === 'futures' || 
        assetName.toLowerCase().trim() === 'future' ||
        assetName.toLowerCase().includes('futures') ||
        assetName.toLowerCase().includes('future')
      )
      
      if (isFuturesInBasis) {
        // For Futures in Basis, preserve null/NA as 'NA'
        acc[header][assetName] = {
          id: m.mapping_id,
          asset: assetName,
          long: normalizeValue(m.gl_code_long),
          short: normalizeValue(m.gl_code_short),
          setoff: normalizeValue(m.gl_code_setoff),
        }
      } else {
        // For all other cases, use empty string if null/NA
        acc[header][assetName] = {
          id: m.mapping_id,
          asset: assetName,
          long: m.gl_code_long || '',
          short: m.gl_code_short || '',
          setoff: m.gl_code_setoff || '',
        }
        
        if (header === 'Trade') {
          acc[header][assetName].long = 'BROKER_CASH'
          acc[header][assetName].short = 'BROKER_CASH'
          acc[header][assetName].setoff = '14000'
        }
      }
      
      return acc
    }, {})

    // Helper function to get default GL codes based on asset type
    const getDefaultGLCodes = (assetTypeName, section) => {
      // Default values for Trade section
      if (section === 'Trade') {
        return { long: 'BROKER_CASH', short: 'BROKER_CASH', setoff: '14000' }
      }
      // Default values for Short Term RPNL section
      if (section === 'Short Term RPNL') {
        return { long: '41200', short: '41200', setoff: '14000' }
      }
      // Default values for Long Term RPNL section
      if (section === 'Long Term RPNL') {
        return { long: '41100', short: '41100', setoff: '14000' }
      }
      // Default GL codes for UPNL section based on asset type
      // Pattern: Long codes start with 132XX, Short codes start with 212XX (same last 3 digits)
      if (section === 'UPNL') {
        const name = (assetTypeName || '').toLowerCase().trim()
        const defaults = {
          'stock': { long: '13210', short: '21210' },
          'futures': { long: '13220', short: '21220' },
          'future': { long: '13220', short: '21220' }, // Handle singular form
          'options': { long: '13230', short: '21230' },
          'option': { long: '13230', short: '21230' }, // Handle singular form
          'bonds': { long: '13240', short: '21240' },
          'bond': { long: '13240', short: '21240' }, // Handle singular form
          'digital asset': { long: '13250', short: '21250' },
          'digitalasset': { long: '13250', short: '21250' }, // Handle no space
          'partnerships': { long: '13260', short: '21260' },
          'partnership': { long: '13260', short: '21260' }, // Handle singular form
          'master funds': { long: '13270', short: '21270' },
          'masterfunds': { long: '13270', short: '21270' }, // Handle no space
          'master fund': { long: '13270', short: '21270' }, // Handle singular form
          'other': { long: '13280', short: '21280' },
        }
        const result = defaults[name] || null
        if (result) {
          result.setoff = '42000' // UPNL Setoff
        }
        return result
      }
      // Default GL codes for Basis and other sections based on asset type
      // Pattern: Long codes start with 13XXX, Short codes start with 21XXX (same last 3 digits)
      const name = (assetTypeName || '').toLowerCase().trim()
      const defaults = {
        'stock': { long: '13110', short: '21110' },
        'futures': { long: '13120', short: '21120' },
        'future': { long: '13120', short: '21120' }, // Handle singular form
        'options': { long: '13130', short: '21130' },
        'option': { long: '13130', short: '21130' }, // Handle singular form
        'bonds': { long: '13140', short: '21140' },
        'bond': { long: '13140', short: '21140' }, // Handle singular form
        'digital asset': { long: '13150', short: '21150' },
        'digitalasset': { long: '13150', short: '21150' }, // Handle no space
        'partnerships': { long: '13160', short: '21160' },
        'partnership': { long: '13160', short: '21160' }, // Handle singular form
        'master funds': { long: '13170', short: '21170' },
        'masterfunds': { long: '13170', short: '21170' }, // Handle no space
        'master fund': { long: '13170', short: '21170' }, // Handle singular form
        'other': { long: '13180', short: '21180' },
      }
      const result = defaults[name] || null
      if (result) {
        result.setoff = '14000' // Investment Clearing
      }
      return result
    }
    
     // Helper function to check if a value is empty or "NA"
     const isEmptyOrNA = (value) => {
       const str = String(value || '').trim().toUpperCase()
       return !str || str === 'NA' || str === 'N/A'
     }
     
      // Helper function to check if asset is Futures in Basis section
      const isFuturesInBasis = (assetName, section) => {
        const name = (assetName || '').toLowerCase().trim()
        return section === 'Basis' && (
          name === 'futures' || 
          name === 'future' || 
          name.includes('futures') ||
          name.includes('future')
        )
      }
     
     // Helper function to check if asset is Futures in UPNL section
     const isFuturesInUPNL = (assetName, section) => {
       const name = (assetName || '').toLowerCase().trim()
       return section === 'UPNL' && (name === 'futures' || name === 'future')
     }
     
     // Ensure ALL active asset types are in each section
     const grouped = {}
     for (const section of SECTIONS) {
       grouped[section] = allAssetTypes.map((assetType) => {
         const assetName = assetType.assettype_name || assetType.name || assetType.asset_type_name || ''
         
         // Check if mapping exists for this asset type in this section
         const existingMapping = mappingBySection[section]?.[assetName]
         
         if (existingMapping) {
              // Special handling for Futures in Basis section - force all three fields to 'NA'
              if (isFuturesInBasis(assetName, section)) {
                // For Futures in Basis, force long, short, and setoff to 'NA'
                existingMapping.long = 'NA'
                existingMapping.short = 'NA'
                existingMapping.setoff = 'NA'
                return existingMapping
              }
           
           // Special handling for Futures in UPNL section - force to use 13300
           if (isFuturesInUPNL(assetName, section)) {
             existingMapping.long = '13300'
             existingMapping.short = '13300'
             if (isEmptyOrNA(existingMapping.setoff)) {
               existingMapping.setoff = '42000'
             }
             return existingMapping
           }
           
           // Special handling for UPNL section - force setoff to 42000 for all asset types
           if (section === 'UPNL') {
             if (isEmptyOrNA(existingMapping.setoff)) {
               existingMapping.setoff = '42000'
             }
             // Apply default GL codes for long and short if empty/NA
             const defaults = getDefaultGLCodes(assetName, section)
             if (defaults) {
               if (isEmptyOrNA(existingMapping.long)) {
                 existingMapping.long = defaults.long
               }
               if (isEmptyOrNA(existingMapping.short)) {
                 existingMapping.short = defaults.short
               }
             }
             return existingMapping
           }
           
           // Special handling for Long Term RPNL section - force all to use 41100
           if (section === 'Long Term RPNL') {
             existingMapping.long = '41100'
             existingMapping.short = '41100'
             if (isEmptyOrNA(existingMapping.setoff)) {
               existingMapping.setoff = '14000'
             }
             return existingMapping
           }
           
           // For all other cases, replace empty/NA values with defaults
           const defaults = getDefaultGLCodes(assetName, section)
           if (defaults) {
             if (isEmptyOrNA(existingMapping.long)) {
               existingMapping.long = defaults.long
             }
             if (isEmptyOrNA(existingMapping.short)) {
               existingMapping.short = defaults.short
             }
             if (isEmptyOrNA(existingMapping.setoff)) {
               existingMapping.setoff = defaults.setoff
             }
           }
           return existingMapping
         }
         
         // Create empty row for asset type without mapping
         const emptyRow = {
           id: null,
           asset: assetName,
           long: '',
           short: '',
           setoff: '',
         }
         
         // Special handling for Futures in UPNL section - set 13300 for long and short
         if (isFuturesInUPNL(assetName, section)) {
           emptyRow.long = '13300'
           emptyRow.short = '13300'
           emptyRow.setoff = '42000'
         }
         // Special handling for Futures in Basis section - set NA for all three fields if no mapping
         else if (isFuturesInBasis(assetName, section)) {
           emptyRow.long = 'NA'
           emptyRow.short = 'NA'
           emptyRow.setoff = 'NA'
         }
         // Special handling for UPNL section - apply defaults with 42000 setoff
         else if (section === 'UPNL') {
           const defaults = getDefaultGLCodes(assetName, section)
           if (defaults) {
             emptyRow.long = defaults.long
             emptyRow.short = defaults.short
             emptyRow.setoff = '42000'
           } else {
             emptyRow.setoff = '42000'
           }
         } else {
           // Apply default values for all other cases
           const defaults = getDefaultGLCodes(assetName, section)
           if (defaults) {
             emptyRow.long = defaults.long
             emptyRow.short = defaults.short
             emptyRow.setoff = defaults.setoff
           }
         }
         
         return emptyRow
       })
     }
    
    setRowsBySection(grouped)
  }, [fundId, allAssetTypes])

  // Handle save all changes
  const handleSave = async () => {
    if (!fundId) {
      alert('Missing fund')
      return
    }
    const entries = Object.entries(pendingChanges)
    if (entries.length === 0) {
      setIsEditMode(false)
      return
    }

    setSaving(true)
    try {
      // run all saves but don't throw on first failure
      const results = await Promise.allSettled(
        entries.map(([mappingId, changes]) =>
          api.put(`/api/v1/mapping/${mappingId}`, {
            fund_id: fundId,
            ...changes, // gl_code_long / gl_code_short / gl_code_setoff
          }),
        ),
      )

      // Build a quick id->row map to show friendly names
      const idToRow = {}
      for (const sec of SECTIONS) {
        ;(rowsBySection[sec] || []).forEach((r) => {
          idToRow[r.id] = { ...r, section: sec }
        })
      }

      const failed = []
      const succeeded = []
      results.forEach((r, idx) => {
        const mappingId = entries[idx][0]
        if (r.status === 'fulfilled') {
          succeeded.push(mappingId)
        } else {
          const resp = r.reason?.response
          const status = resp?.status
          const data = resp?.data || {}
          failed.push({
            mappingId,
            status,
            code: data?.code,
            message: data?.error || data?.message || r.reason?.message || 'Save failed',
            details: data?.details,
            row: idToRow[mappingId],
          })
        }
      })

      // Show any conflicts (409) nicely
      if (failed.length) {
        const lines = failed.map((f) => {
          const label = f?.row ? `${f.row.section} / ${f.row.asset}` : f.mappingId
          const extra = f.details?.currentCodes?.length ? ` [in use: ${f.details.currentCodes.join(', ')}]` : ''
          return `• ${label}: ${f.message}${extra}`
        })
        alert(`Some mappings accountscould not be Updated:\n\n${lines.join('\n')}`)
        await refreshMappings()
        return
      }

      // If at least one saved, refresh table
      if (succeeded.length) {
        const r = await api.get(`/api/v1/mapping/${fundId}`)
        const data = Array.isArray(r.data?.data) ? r.data.data : r.data
        const grouped = (data || []).reduce((acc, m) => {
          const header = m.header_name || 'Other'
          const row = {
            id: m.mapping_id,
            asset: m.assettype_name,
            long: m.gl_code_long || '',
            short: m.gl_code_short || '',
            setoff: m.gl_code_setoff || '',
          }
          if (header === 'Trade') {
            row.long = 'BROKER_CASH'
            row.short = 'BROKER_CASH'
            row.setoff = '14000'
          }
          ;(acc[header] ||= []).push(row)
          return acc
        }, {})
        setRowsBySection(grouped)
      }

      // Exit edit mode only if all succeeded
      if (failed.length === 0) {
        setPendingChanges({})
        setIsEditMode(false)
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to save changes.'
      alert(msg)
    } finally {
      setSaving(false)
    }
  }

  // Handle cell value changes in edit mode
  const onCellValueChanged = (section) => (params) => {
    if (!params?.data || !isEditMode) return

    const mappingId = params.data.id
    const field = params.colDef.field
    const newValue = params.newValue

    // Track changes in pendingChanges
    setPendingChanges((prev) => ({
      ...prev,
      [mappingId]: {
        ...prev[mappingId],
        [`gl_code_${field}`]: newValue || null,
      },
    }))
  }

  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Mapping</CardTitle>
            <div className="d-flex align-items-center gap-2">
              <Button
                variant={isEditMode ? 'success' : 'outline-primary'}
                size="sm"
                onClick={isEditMode ? handleSave : handleEditToggle}
                disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : isEditMode ? (
                  <>
                    <FaSave className="me-1" />
                    Save
                  </>
                ) : (
                  <>
                    <FaEdit className="me-1" />
                    Edit
                  </>
                )}
              </Button>
              {isEditMode && (
                <Button variant="outline-secondary" size="sm" onClick={handleEditToggle} disabled={saving}>
                  <FaTimes className="me-1" />
                  Cancel
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div>Loading mappings…</div>
            ) : (
              // ========================================
              // MAPPING TABLE RENDERING
              // ========================================
              // This is where the mapping data is actually displayed
              // Each section (Trade, Basis, etc.) gets its own AgGrid table
              SECTIONS.map((section) => (
                <div key={section} className="mb-4">
                  <div className="fw-semibold mb-2">{section}</div>
                  <div className="ag-theme-alpine" style={{ width: '100%' }}>
                    <style jsx>{`
                      .ag-theme-alpine .ag-cell.ag-cell-editable {
                        cursor: pointer;
                        background-color: ${isEditMode ? '#f8f9fa' : 'transparent'};
                        border: ${isEditMode ? '1px solid #dee2e6' : 'none'};
                      }
                      .ag-theme-alpine .ag-cell.ag-cell-editable:hover {
                        background-color: ${isEditMode ? '#e9ecef' : 'transparent'};
                      }
                    `}</style>
                    <AgGridReact
                      ref={(r) => (gridRefs.current[section] = r)}
                      //  DATA: Mapping rows for this section (from rowsBySection)
                      rowData={rowsBySection[section] || []}
                      //  COLUMNS: Column definitions with dropdown editors
                      columnDefs={columnDefs}
                      context={{ sectionName: section }}
                      defaultColDef={{
                        sortable: true,
                        filter: true,
                        resizable: true,
                        editable: true,
                      }}
                      domLayout="autoHeight"
                      // SAVE: When user changes a dropdown value
                      onCellValueChanged={onCellValueChanged(section)}
                      // Make cells start editing on single click in edit mode
                      singleClickEdit={isEditMode}
                      stopEditingWhenCellsLoseFocus={true}
                      suppressClickEdit={!isEditMode}
                    />
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}