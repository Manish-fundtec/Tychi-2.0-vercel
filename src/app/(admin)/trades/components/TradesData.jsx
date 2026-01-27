'use client'
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { TradeColDefs } from '@/assets/tychiData/columnDefs'
import api from '@/lib/api/axios'
import Cookies from 'js-cookie'
import { useDashboardToken } from '@/hooks/useDashboardToken'
import { formatYmd } from '../../../../../src/lib/dateFormat'
import { jwtDecode } from 'jwt-decode'
import currencies from 'currency-formatter/currencies'
import {
  Col,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Row,
  Tabs,
  Tab,
  Button,
  Alert,
  Modal,
} from 'react-bootstrap'
import { TradeModal, UploadTradeModal } from '@/app/(admin)/base-ui/modals/components/AllModals'
import { deleteTrade, bulkDeleteTrades } from '@/lib/api/trades'
import { buildAoaFromHeaders, exportAoaToXlsx } from '@/lib/exporters/xlsx'
import { getFundDetails } from '@/lib/api/fund'
import { useUserToken } from '@/hooks/useUserToken'
import { getUserRolePermissions } from '@/helpers/getUserPermissions'
import { canModuleAction } from '@/helpers/permissionActions'

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule])

export default function TradesData() {
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(true)
  const [fundId, setFundId] = useState('')
  const [selectedRows, setSelectedRows] = useState([])
  const [viewTrade, setViewTrade] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [fundDetails, setFundDetails] = useState(null)

  // 1) Get fundId from dashboardToken cookie (support multiple key styles)
  useEffect(() => {
    const token = Cookies.get('dashboardToken')
    if (!token) {
      // setErrMsg?.('dashboardToken cookie not found') // (optional)
      return
    }
    try {
      const payload = jwtDecode(token)
      const id = payload?.fund_id || payload?.fundId || payload?.context?.fund_id || ''
      if (!id) {
        // setErrMsg?.('fund_id not present in token') // (optional)
        return
      }
      setFundId(id)
    } catch (e) {
      console.error('[Trades] token decode error:', e)
      // setErrMsg?.('Invalid dashboard token') // (optional)
    }
  }, [])

  const dashboard = useDashboardToken()
  const userToken = useUserToken()
  const fmt = dashboard?.date_format || 'MM/DD/YYYY'
  const fund_id = dashboard?.fund_id || ''
  
  // Permissions state
  const [permissions, setPermissions] = useState([])
  const [loadingPermissions, setLoadingPermissions] = useState(true)
  
  // Fetch user permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      // ✅ PRIORITIZE dashboard token - it has all the fields we need
      // Use dashboard first, then fallback to userToken
      const tokenData = dashboard || userToken
      
      console.log('🔍 Trades - Permission fetch started:', {
        hasUserToken: !!userToken,
        hasDashboard: !!dashboard,
        usingDashboard: !!dashboard,
        usingUserToken: !dashboard && !!userToken,
        dashboardKeys: dashboard ? Object.keys(dashboard) : [],
        userTokenKeys: userToken ? Object.keys(userToken) : [],
        tokenData: tokenData ? {
          // Show ALL fields from tokenData
          fullTokenData: tokenData,
          allKeys: Object.keys(tokenData),
          // Extract with all possible variations
          user_id: tokenData.user_id,
          id: tokenData.id,
          userId: tokenData.userId,
          sub: tokenData.sub,
          role_id: tokenData.role_id,
          roleId: tokenData.roleId,
          org_id: tokenData.org_id,
          organization_id: tokenData.organization_id,
          orgId: tokenData.orgId,
        } : null,
        fund_id,
        fundId,
      })
      
      if (!tokenData) {
        console.warn('⚠️ Trades - No tokenData available yet, will retry when token loads')
        // Don't set loading to false - wait for token to load
        return
      }
      
      // Extract fields with all possible field name variations
      // Dashboard token has: user_id, org_id, role_id (confirmed from logs)
      const userId = tokenData?.user_id || tokenData?.id || tokenData?.userId || tokenData?.sub
      const roleId = tokenData?.role_id || tokenData?.roleId
      const orgId = tokenData?.org_id || tokenData?.organization_id || tokenData?.orgId
      
      console.log('🔍 Trades - Extracted fields:', {
        userId,
        roleId,
        orgId,
        hasUserId: !!userId,
        hasRoleId: !!roleId,
        hasOrgId: !!orgId,
      })
      
      // Ensure we have at least user_id or org_id to fetch permissions
      const hasUserId = !!userId
      const hasOrgId = !!orgId
      
      if (!hasUserId && !hasOrgId) {
        console.warn('⚠️ Trades - Token missing user_id and org_id, cannot fetch permissions', {
          tokenDataKeys: Object.keys(tokenData),
          extracted: { userId, roleId, orgId },
          // Show full token to debug
          fullTokenData: tokenData,
        })
        setLoadingPermissions(false)
        return
      }
      
      try {
        setLoadingPermissions(true)
        const currentFundId = fund_id || fundId
        console.log('📡 Trades - Fetching permissions with:', {
          currentFundId,
          tokenDataKeys: Object.keys(tokenData || {}),
          hasPermissionsInToken: !!tokenData?.permissions,
          hasUserId,
          hasOrgId,
        })
        
        // Check if permissions are in token first, otherwise fetch from API
        let perms = []
        let source = 'unknown'
        
        if (tokenData?.permissions && Array.isArray(tokenData.permissions)) {
          // Permissions are in token - filter by fundId if provided
          source = 'token'
          perms = tokenData.permissions
          
          // Log raw token permissions before filtering
          const tradePermBeforeFilter = perms.find(p => {
            const moduleKey = (p?.module_key || p?.moduleKey || '').toString().toLowerCase()
            return moduleKey === 'trade' || moduleKey === 'trades'
          })
          console.log('🔍 Trades - TRADE permission from TOKEN (before filter):', tradePermBeforeFilter)
          
          if (currentFundId) {
            perms = perms.filter(p => {
              const pFundId = p?.fund_id || p?.fundId
              return pFundId == currentFundId || String(pFundId) === String(currentFundId)
            })
          }
          console.log('✅ Trades - Using permissions from TOKEN:', {
            source: 'token',
            totalBeforeFilter: tokenData.permissions.length,
            totalAfterFilter: perms.length,
            permissions: perms,
          })
        } else {
          // Permissions not in token - fetch from API
          source = 'api'
          console.log('📡 Trades - Calling getUserRolePermissions with:', {
            tokenDataKeys: Object.keys(tokenData || {}),
            tokenDataSample: {
              user_id: tokenData?.user_id,
              id: tokenData?.id,
              userId: tokenData?.userId,
              sub: tokenData?.sub,
              org_id: tokenData?.org_id,
              organization_id: tokenData?.organization_id,
              orgId: tokenData?.orgId,
            },
            currentFundId,
          })
          
          try {
            perms = await getUserRolePermissions(tokenData, currentFundId)
            console.log('✅ Trades - getUserRolePermissions SUCCESS:', {
              source: 'api',
              count: Array.isArray(perms) ? perms.length : 0,
              isArray: Array.isArray(perms),
              permissions: perms,
              firstPermission: perms?.[0],
              tradePermission: perms?.find(p => {
                const moduleKey = (p?.module_key || p?.moduleKey || '').toString().toLowerCase()
                return moduleKey === 'trade' || moduleKey === 'trades'
              }),
            })
          } catch (permError) {
            console.error('❌ Trades - getUserRolePermissions ERROR:', permError)
            console.error('❌ Error details:', permError?.response?.data || permError?.message)
            perms = []
          }
        }
        
        // 🔴 CRITICAL: Check if TRADE permission has all required fields
        const tradePermission = perms.find(p => {
          const moduleKey = (p?.module_key || p?.moduleKey || '').toString().toLowerCase()
          return moduleKey === 'trade' || moduleKey === 'trades'
        })
        
        if (tradePermission) {
          console.log(`🔴 RAW TRADE PERMISSION FROM ${source.toUpperCase()}:`, tradePermission)
          console.log('🔴 TRADE PERMISSION FIELDS CHECK:', {
            source,
            has_can_view: 'can_view' in tradePermission,
            can_view: tradePermission.can_view,
            has_can_add: 'can_add' in tradePermission,
            can_add: tradePermission.can_add,
            has_can_edit: 'can_edit' in tradePermission,
            can_edit: tradePermission.can_edit,
            has_can_delete: 'can_delete' in tradePermission,
            can_delete: tradePermission.can_delete,
            allKeys: Object.keys(tradePermission),
          })
          
          // Warn if required fields are missing
          const missingFields = []
          if (!('can_add' in tradePermission)) missingFields.push('can_add')
          if (!('can_edit' in tradePermission)) missingFields.push('can_edit')
          if (!('can_delete' in tradePermission)) missingFields.push('can_delete')
          
          if (missingFields.length > 0) {
            console.warn(`⚠️ ${source.toUpperCase()} MISSING PERMISSION FIELDS:`, {
              source,
              module: tradePermission.module_key,
              missingFields,
              message: `${source === 'api' ? 'Backend API' : 'Token'} must send all permission fields (can_add, can_edit, can_delete) for proper RBAC`,
              fix: source === 'api' 
                ? 'Fix backend API to always return all permission fields'
                : 'Ensure token includes all permission fields when generated',
            })
          }
        } else {
          console.warn(`⚠️ TRADE permission not found in permissions array (source: ${source})`)
        }
        
        console.log('🔐 Trades - getUserRolePermissions returned:', {
          permissions: perms,
          count: Array.isArray(perms) ? perms.length : 0,
          isArray: Array.isArray(perms),
          tradePermissionFound: !!tradePermission,
          willSetPermissions: Array.isArray(perms) && perms.length > 0,
        })
        
        const permissionsToSet = Array.isArray(perms) ? perms : []
        console.log('🔐 Trades - About to setPermissions:', {
          count: permissionsToSet.length,
          permissions: permissionsToSet,
          tradePermission: permissionsToSet.find(p => {
            const moduleKey = (p?.module_key || p?.moduleKey || '').toString().toLowerCase()
            return moduleKey === 'trade' || moduleKey === 'trades'
          }),
        })
        
        setPermissions(permissionsToSet)
        
        // Verify permissions were set (in next render)
        setTimeout(() => {
          console.log('🔐 Trades - Permissions state after set (check):', {
            // This will show in next render cycle
            note: 'Check next render for actual state',
          })
        }, 100)
      } catch (error) {
        console.error('❌ Trades - Error fetching permissions:', error)
        console.error('❌ Error stack:', error?.stack)
        console.error('❌ Error response:', error?.response?.data)
        setPermissions([])
      } finally {
        setLoadingPermissions(false)
      }
    }
    
    fetchPermissions()
  }, [userToken, dashboard, fund_id, fundId])
  
  // Permission checks for trade module
  const currentFundId = fund_id || fundId
  
  // ⚠️ IMPORTANT: Backend API MUST send all permission fields:
  // - can_view (required)
  // - can_add (required) 
  // - can_edit (required)
  // - can_delete (required)
  // If fields are missing, buttons will be hidden (security: deny by default)
  // 
  // Current behavior: canModuleAction returns false if field is undefined
  // This is CORRECT - missing permissions = no access
  
  // Call canModuleAction() directly - it already handles empty arrays, undefined permissions, and fund mismatches
  // This ensures React re-renders when permissions load (no hasPermissions gate blocking updates)
  const canAdd = canModuleAction(permissions, ['trade', 'trades'], 'can_add', currentFundId)
  const canEdit = canModuleAction(permissions, ['trade', 'trades'], 'can_edit', currentFundId)
  const canDelete = canModuleAction(permissions, ['trade', 'trades'], 'can_delete', currentFundId)
  
  // Debug logging - detailed permission check
  useEffect(() => {
    // Find TRADE permissions specifically
    const tradePermissions = permissions.filter(p => {
      const moduleKey = (p?.module_key || p?.moduleKey || '').toString().toLowerCase()
      return moduleKey === 'trade' || moduleKey === 'trades'
    })
    
    console.log('🔐 FINAL UI PERMISSIONS', {
      loadingPermissions,
      permissionsCount: permissions.length,
      currentFundId,
      canAdd,
      canDelete,
      canEdit,
      tradePermissionsCount: tradePermissions.length,
      tradePermissions: tradePermissions.map(p => ({
        module_key: p?.module_key || p?.moduleKey,
        can_add: p?.can_add,
        can_delete: p?.can_delete,
        can_edit: p?.can_edit,
        can_view: p?.can_view,
        fund_id: p?.fund_id || p?.fundId,
      })),
      allPermissions: permissions.map(p => ({
        module_key: p?.module_key || p?.moduleKey,
        can_add: p?.can_add,
        fund_id: p?.fund_id || p?.fundId,
      })),
    })
  }, [loadingPermissions, permissions, canAdd, canDelete, canEdit, currentFundId])
  
  // Fetch fund details to get current decimal_precision
  useEffect(() => {
    const currentFundId = fund_id || fundId
    if (!currentFundId) {
      setFundDetails(null)
      return
    }
    
    const fetchFund = async () => {
      try {
        const details = await getFundDetails(currentFundId)
        setFundDetails(details)
      } catch (error) {
        console.error('Failed to fetch fund details:', error)
        setFundDetails(null)
      }
    }
    
    fetchFund()
  }, [fund_id, fundId])
  
  // Get decimal precision - prioritize fund details from API, then token, then default to 2
  const decimalPrecision = useMemo(() => {
    // First try fund details from API (most up-to-date)
    const apiPrecision = fundDetails?.decimal_precision
    // Then try token values
    const tokenPrecision = dashboard?.decimal_precision ?? dashboard?.fund?.decimal_precision
    
    const precision = apiPrecision ?? tokenPrecision
    const numPrecision = precision !== null && precision !== undefined ? Number(precision) : null
    const result = numPrecision !== null && !isNaN(numPrecision) ? numPrecision : 2
    
    console.log('🔢 Fund details (API):', fundDetails)
    console.log('🔢 decimal_precision (API):', apiPrecision)
    console.log('🔢 decimal_precision (token):', tokenPrecision)
    console.log('🔢 Final decimalPrecision:', result)
    
    return result
  }, [fundDetails, dashboard])
  
  // Get currency symbol from reporting_currency
  const currencySymbol = useMemo(() => {
    const reportingCurrency = dashboard?.reporting_currency || dashboard?.fund?.reporting_currency || ''
    if (!reportingCurrency) return ''
    const currency = currencies.find((c) => c.code === reportingCurrency)
    return currency?.symbol || ''
  }, [dashboard])

  const refreshTrades = useCallback(async () => {
    const currentFundId = fund_id || fundId
    if (!currentFundId) return
    setLoading(true)
    const url = `/api/v1/trade/fund/${encodeURIComponent(currentFundId)}`
    try {
      const res = await api.get(url)
      const rawRows = Array.isArray(res?.data?.data) ? res.data.data : []
      
      // Normalize trade data to ensure relation_type and lot_id fields are populated
      const normalizedRows = rawRows.map((trade) => {
        // Normalize relation_type field (check multiple possible field names)
        const relationType = 
          trade.relation_type || 
          trade.relationType || 
          trade.relation_type_name ||
          trade.relationTypeName ||
          trade.type ||
          trade.relation_type_id?.name ||
          trade.relationTypeId?.name ||
          ''
        
        // Normalize lot_id field (check multiple possible field names)
        const lotId = 
          trade.lot_id || 
          trade.lotId || 
          trade.lot_id_name ||
          trade.lotIdName ||
          trade.lot_id_id ||
          trade.lotIdId ||
          ''
        
        // Return normalized trade with guaranteed relation_type and lot_id fields
        return {
          ...trade,
          relation_type: relationType, // Always set relation_type (even if empty)
          lot_id: lotId, // Always set lot_id (even if empty)
          // Also keep original fields for backward compatibility
          relationType: relationType,
          lotId: lotId,
        }
      })
      
      // Sort trades: latest first (by trade_date, then created_at, then trade_id)
      const sortedRows = [...normalizedRows].sort((a, b) => {
        // 1. Sort by trade_date (descending - latest first)
        const dA = new Date(a.trade_date).getTime() || 0
        const dB = new Date(b.trade_date).getTime() || 0
        if (dA !== dB) return dB - dA

        // 2. If same date, sort by created_at (descending - latest first)
        const cA = new Date(a.created_at).getTime() || 0
        const cB = new Date(b.created_at).getTime() || 0
        if (cA !== cB) return cB - cA

        // 3. If same, sort by trade_id (descending - highest first)
        return String(b.trade_id).localeCompare(String(a.trade_id))
      })
      
      console.log('[Trades] Fetched and normalized trades:', {
        total: sortedRows.length,
        sampleTrade: sortedRows[0] ? {
          trade_id: sortedRows[0].trade_id,
          trade_date: sortedRows[0].trade_date,
          relation_type: sortedRows[0].relation_type,
          lot_id: sortedRows[0].lot_id,
          allKeys: Object.keys(sortedRows[0])
        } : null
      })
      
      setRowData(sortedRows)
    } catch (e) {
      console.error('fetch trades failed', url, e?.response?.status, e?.response?.data)
      setRowData([])
    } finally {
      setLoading(false)
      setSelectedRows([])
    }
  }, [fund_id, fundId])

  useEffect(() => {
    refreshTrades()
  }, [refreshTrades])


  const columnDefs = useMemo(() => {
    return (TradeColDefs || []).map((col) => {
      if (col?.field === 'trade_date') {
        return {
          ...col,
          valueFormatter: (p) => {
            const raw = p?.value ? String(p.value).slice(0, 10) : ''
            return formatYmd(raw, fmt)
          },
        }
      }

      // Format Price column same as Amount and Gross Amount - use currency symbol at front
      if (col?.field === 'price') {
        return {
          ...col,
          valueFormatter: (p) => {
            const value = p?.value
            if (value === null || value === undefined || value === '') return '—'
            const num = Number(value)
            if (Number.isNaN(num)) return value
            const formatted = num.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
            return currencySymbol ? `${currencySymbol}${formatted}` : formatted
          },
        }
      }

      // Format Quantity column - use decimal precision (no currency symbol)
      if (col?.field === 'quantity') {
        return {
          ...col,
          valueFormatter: (p) => {
            const value = p?.value
            if (value === null || value === undefined || value === '') return '—'
            const num = Number(value)
            if (Number.isNaN(num)) return value
            return num.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
          },
        }
      }

      // Format Amount column - use currency symbol at front
      if (col?.field === 'amount') {
        return {
          ...col,
          valueFormatter: (p) => {
            const value = p?.value
            if (typeof value === 'string' && value.trim()) {
              // If amount is already a formatted string, try to extract number and reformat with symbol
              const numMatch = value.replace(/,/g, '').match(/[\d.]+/)
              if (numMatch) {
                const num = Number(numMatch[0])
                if (!Number.isNaN(num)) {
                  const formatted = num.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
                  return currencySymbol ? `${currencySymbol}${formatted}` : formatted
                }
              }
              return value
            }
            if (value === null || value === undefined || value === '') return '—'
            const num = Number(value)
            if (Number.isNaN(num)) return value
            const formatted = num.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
            return currencySymbol ? `${currencySymbol}${formatted}` : formatted
          },
        }
      }

      // Format Gross Amount column - use currency symbol at front
      if (col?.field === 'gross_amount') {
        return {
          ...col,
          valueFormatter: (p) => {
            const value = p?.value
            if (value === null || value === undefined || value === '') return '—'
            const num = Number(value)
            if (Number.isNaN(num)) return value
            const formatted = num.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
            return currencySymbol ? `${currencySymbol}${formatted}` : formatted
          },
        }
      }
      
      // Backward compatibility: also handle computed_amount if backend still sends it
      if (col?.field === 'computed_amount') {
        return {
          ...col,
          valueFormatter: (p) => {
            const value = p?.value
            if (value === null || value === undefined || value === '') return '—'
            const num = Number(value)
            if (Number.isNaN(num)) return value
            const formatted = num.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
            return currencySymbol ? `${currencySymbol}${formatted}` : formatted
          },
        }
      }

      // Ensure Action column is properly configured with context
      if (col?.field === 'action' || col?.headerName === 'Action') {
        return {
          ...col,
          cellRenderer: col.cellRenderer, // Keep the ActionCellRenderer
          // Ensure it's not filtered out
          sortable: false,
          filter: false,
        }
      }

      return col
    })
  }, [fmt, currencySymbol, decimalPrecision])

  // History state
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')

  const fetchTradeHistory = useCallback(async () => {
    if (!fund_id) {
      setHistory([])
      return
    }
    setLoadingHistory(true)
    setHistoryError('')
    try {
      const res = await api.get(`/api/v1/trade/uploadhistory/${fund_id}`)
      const rows = res?.data?.rows || []
      const normalized = rows.map((r) => ({
        ...r,
        uploaded_at: r.uploaded_at || r.date_and_time || r.created_at || null,
      }))
      setHistory(normalized)
    } catch (e) {
      setHistoryError(e?.response?.data?.error || e?.message || 'Failed to load trade upload history')
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }, [fund_id])

  // Download error file handler
  const handleDownloadErrorFile = useCallback(async (fileId) => {
    if (!fund_id || !fileId) {
      alert('Missing fund ID or file ID')
      return
    }

    try {
      // Let axios interceptor handle authentication automatically
      const response = await api.get(
        `/api/v1/trade/uploadhistory/${fund_id}/errorfile/${fileId}`,
        {
          responseType: 'blob',
        }
      )

      // Create blob from response
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream',
      })

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition']
      let filename = `error-file-${fileId}.xlsx`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '')
        }
      }

      // Trigger browser download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      alert(error?.response?.data?.message || error?.message || 'Failed to download error file')
    }
  }, [fund_id])

  useEffect(() => {
    fetchTradeHistory()
  }, [fetchTradeHistory])

  const gridApiRef = useRef(null)

  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api
  }, [])

  const updateSelectionState = useCallback(() => {
    if (!gridApiRef.current) return
    setSelectedRows(gridApiRef.current.getSelectedRows())
  }, [])

  const onSelectionChanged = useCallback(() => {
    updateSelectionState()
  }, [updateSelectionState])

  const handleSelectAll = useCallback(() => {
    if (!gridApiRef.current) return
    gridApiRef.current.selectAll()
    updateSelectionState()
  }, [updateSelectionState])

  const handleClearSelection = useCallback(() => {
    if (!gridApiRef.current) return
    gridApiRef.current.deselectAll()
    updateSelectionState()
  }, [updateSelectionState])

  const tradeExportHeaders = useMemo(
    () => [
      { key: 'trade_id', label: 'Trade ID' },
      { key: 'trade_date', label: 'Trade Date', value: (row) => (row?.trade_date ? String(row.trade_date).slice(0, 10) : '') },
      { key: 'symbol_name', label: 'Symbol' },
      { key: 'symbol_code', label: 'Symbol Code' },
      { key: 'price', label: 'Price' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'amount', label: 'Amount' },
      { key: 'gross_amount', label: 'Gross Amount' },
      { key: 'trade_type', label: 'Trade Type' },
      { key: 'broker_name', label: 'Broker' },
    ],
    [],
  )

  const formatExportValue = useCallback((key, value) => {
    if (typeof value === 'number') {
      return value.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
    }
    return value ?? ''
  }, [decimalPrecision])

  const escapeCsv = (value) => {
    const stringValue = String(value ?? '')
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  // Export filtered or selected rows (selected checkboxes take priority)
  // Also respects pagination - only exports rows visible on current page
  const handleExport = useCallback(
    (format) => {
      // Step 1️⃣ - Check if user has selected rows (checkboxes)
      // If selected rows exist, export only those
      // Otherwise, export filtered rows from current pagination page only
      let rowsToExport = []

      if (selectedRows.length > 0) {
        // User selected specific rows - export only selected
        rowsToExport = selectedRows
      } else {
        // No selection - export filtered rows from current page only
        if (gridApiRef.current) {
          // Get pagination info: current page and page size
          const currentPage = gridApiRef.current.paginationGetCurrentPage() || 0 // page number (0, 1, 2, ...)
          const pageSize = gridApiRef.current.paginationGetPageSize() || 10 // rows per page (10, 20, etc.)
          
          // Calculate start and end index for current page
          const startIndex = currentPage * pageSize // e.g., page 0 = 0, page 1 = 10, page 2 = 20
          const endIndex = startIndex + pageSize // e.g., 0+10=10, 10+10=20, 20+10=30

          // Get all filtered rows first
          const allFilteredRows = []
          gridApiRef.current.forEachNodeAfterFilterAndSort((node) => {
            if (node.data) {
              allFilteredRows.push(node.data)
            }
          })

          // Then get only the rows for current page
          // e.g., if page 1 (index 0) with page size 10: get rows 0-9
          // e.g., if page 2 (index 1) with page size 10: get rows 10-19
          rowsToExport = allFilteredRows.slice(startIndex, endIndex)
        }
        // If no filtered rows, fall back to all rows from current page
        if (rowsToExport.length === 0 && rowData.length > 0) {
          const currentPage = gridApiRef.current?.paginationGetCurrentPage() || 0
          const pageSize = gridApiRef.current?.paginationGetPageSize() || 10
          const startIndex = currentPage * pageSize
          const endIndex = startIndex + pageSize
          rowsToExport = rowData.slice(startIndex, endIndex)
        }
      }

      if (!rowsToExport.length) {
        alert('No trades to export. Please select rows or check your filters.')
        return
      }

      // Step 2️⃣ - Convert to export format using headers and formatter
      const aoa = buildAoaFromHeaders(tradeExportHeaders, rowsToExport, formatExportValue)

      // Step 3️⃣ - Export based on format
      const exportDate = new Date().toISOString().slice(0, 10)
      if (format === 'xlsx') {
        exportAoaToXlsx({
          fileName: selectedRows.length > 0 ? `trades-selected-${exportDate}` : `trades-filtered-${exportDate}`,
          sheetName: 'Trades',
          aoa,
        })
        return
      }

      // Step 4️⃣ - Create CSV file and download
      const csvContent = aoa.map((row) => row.map((cell) => escapeCsv(cell)).join(',')).join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = selectedRows.length > 0 ? `trades-selected-${exportDate}.csv` : `trades-filtered-${exportDate}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    [selectedRows, rowData, tradeExportHeaders, formatExportValue],
  )

  // Fetch last pricing date for validation

  // 🔹 Single Delete (FINAL)
  const handleSingleDelete = useCallback(
    async (trade) => {
      if (!trade?.trade_id) {
        alert('Invalid trade')
        return
      }

      if (!confirm(`Delete trade ${trade.trade_id}?`)) return

      try {
        await deleteTrade(trade.trade_id)
        await refreshTrades()
        gridApiRef.current?.deselectAll()
        alert('Trade deleted successfully')
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to delete trade'
        alert(msg)
      }
    },
    [refreshTrades]
  )

  // 🔹 Bulk Delete (FINAL)
  const handleBulkDelete = useCallback(async () => {
    if (!selectedRows.length) {
      alert('No trades selected')
      return
    }

    const tradeIds = selectedRows.map(t => t.trade_id)
    const isSelectAll = selectedRows.length === rowData.length

    if (!confirm(`Delete ${tradeIds.length} trade(s)?`)) return

    setBulkActionLoading(true)
    try {
      const result = await bulkDeleteTrades(tradeIds, isSelectAll)

      const successCount = result.results?.successful?.length || 0
      const failed = result.results?.failed || []

      if (failed.length) {
        alert(
          `Deleted ${successCount} trades.\n\nFailed:\n` +
          failed.slice(0, 10).map(f => `${f.trade_id}: ${f.message}`).join('\n')
        )
      } else {
        alert(`Deleted ${successCount} trades successfully`)
      }

      await refreshTrades()
      gridApiRef.current?.deselectAll()
      setSelectedRows([])
    } catch (err) {
      alert(err?.response?.data?.message || 'Bulk delete failed')
    } finally {
      setBulkActionLoading(false)
    }
  }, [selectedRows, rowData, refreshTrades])

  const handleViewTrade = useCallback((trade) => {
    setViewTrade(trade || null)
  }, [])

  const closeViewModal = useCallback(() => setViewTrade(null), [])

  const selectedCount = selectedRows.length

  const historyColDefs = useMemo(
    () => [
      { headerName: 'File ID', field: 'file_id', width: 280 },
      { headerName: 'File Name', field: 'file_name', flex: 1 },
      {
        headerName: 'Status',
        field: 'status',
        flex: 1,
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Uploaded At',
        field: 'uploaded_at',
        flex: 1,
        valueGetter: (p) => (p.data?.uploaded_at ? new Date(p.data.uploaded_at).toLocaleString() : ''),
      },
      {
        headerName: 'Uploaded By',
        field: 'user_name',
        flex: 1,
        valueGetter: (p) => {
          const userName = p.data?.user_name
          const userId = p.data?.user_id
          return userName || userId || 'Unknown User'
        },
      },
      {
        headerName: 'Download error file',
        field: 'download',
        width: 160,
        sortable: false,
        filter: false,
        cellRenderer: (params) => {
          const errorFileUrl = params.data?.error_file_url
          const fileId = params.data?.file_id

          if (!errorFileUrl || !fileId) {
            return ''
          }

          return (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleDownloadErrorFile(fileId)
              }}
            >
              Download
            </Button>
          )
        },
      },
    ],
    [handleDownloadErrorFile],
  )

  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Trades</CardTitle>
            <div className="d-flex gap-2">
              {/* If your modals accept onSuccess, these will refresh both tabs */}
              {/* Explicitly pass canAdd prop to modals for internal permission checks */}
              {(() => {
                console.log('🔍 Trades - Rendering buttons section:', {
                  canAdd,
                  permissionsCount: permissions.length,
                  willRenderModals: canAdd === true,
                })
                return canAdd && (
                  <>
                    <TradeModal
                      canAdd={canAdd}
                      onSuccess={() => {
                        //  NEW: refresh after manual add
                        refreshTrades()
                        fetchTradeHistory()
                      }}
                    />
                    <UploadTradeModal
                      canAdd={canAdd}
                      onSuccess={() => {
                        //  NEW: refresh after upload
                        refreshTrades()
                        fetchTradeHistory()
                      }}
                    />
                  </>
                )
              })()}
            </div>
          </CardHeader>

          {/*  NEW: Tabs – List & Loader History */}
          <Tabs defaultActiveKey="list" id="trade-tabs" className="px-3 pt-3">
            {/* ─────────── Tab 1: Trades List ─────────── */}
            <Tab eventKey="list" title="Trades List">
              <CardBody className="p-2">
                {!fund_id && (
                  <Alert variant="warning" className="mb-3">
                    Select a fund to view trades.
                  </Alert>
                )}
                <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                  <Button variant="outline-secondary" size="sm" onClick={handleSelectAll} disabled={!rowData.length || loading}>
                    Select All
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={handleClearSelection} disabled={!selectedRows.length}>
                    Clear Selection
                  </Button>
                  {canDelete && (
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={handleBulkDelete} 
                      disabled={!selectedRows.length || bulkActionLoading}
                    >
                      {bulkActionLoading ? 'Deleting…' : `Delete Selected (${selectedCount})`}
                    </Button>
                  )}
                  <Button variant="outline-success" size="sm" onClick={() => handleExport('csv')} disabled={!rowData.length || loading}>
                    {selectedRows.length > 0 ? `Export Selected CSV (${selectedRows.length})` : 'Export Filtered CSV'}
                  </Button>
                  <Button variant="outline-primary" size="sm" onClick={() => handleExport('xlsx')} disabled={!rowData.length || loading}>
                    {selectedRows.length > 0 ? `Export Selected XLSX (${selectedRows.length})` : 'Export Filtered XLSX'}
                  </Button>
                  <span className="text-muted ms-auto">
                    Selected: {selectedCount} / {rowData.length}
                  </span>
                </div>
                <div className="ag-theme-alpine" style={{ width: '100%', height: 600 }}>
                  <AgGridReact
                    onGridReady={onGridReady}
                    onSelectionChanged={onSelectionChanged}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    pagination={true}
                    rowSelection="multiple"
                    paginationPageSize={10}
                    paginationPageSizeSelector={[10, 25, 50, 100]}
                    suppressMultiSort={true}
                    maintainColumnOrder={true}
                    defaultColDef={{
                      sortable: true,
                      filter: true,
                      resizable: true,
                    }}
                    context={{
                      onViewTrade: handleViewTrade,
                      onDeleteTrade: handleSingleDelete,
                      canDelete: canDelete,
                    }}
                    suppressRowClickSelection={false}
                    overlayLoadingTemplate={loading ? '<span class="ag-overlay-loading-center">Loading...</span>' : undefined}
                  />
                </div>
              </CardBody>
            </Tab>

            {/* ────────  NEW: Tab 2: Loader History ──────── */}
            <Tab eventKey="history" title="Loader History">
              <CardBody className="p-2">
                {!fund_id && (
                  <Alert variant="warning" className="mb-3">
                    Select a fund to view upload history.
                  </Alert>
                )}

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="m-0">Trade Uploads</h6>
                  <Button variant="outline-secondary" size="sm" onClick={fetchTradeHistory} disabled={!fund_id || loadingHistory}>
                    {loadingHistory ? 'Refreshing…' : 'Refresh'}
                  </Button>
                </div>

                {historyError && (
                  <Alert variant="danger" className="mb-2">
                    {historyError}
                  </Alert>
                )}

                {loadingHistory && (
                  <Alert variant="info" className="mb-2">
                    Loading upload history...
                  </Alert>
                )}

                {!loadingHistory && !historyError && history.length === 0 && (
                  <Alert variant="warning" className="mb-2">
                    No upload history found for this fund.
                  </Alert>
                )}

                <div style={{ width: '100%' }}>
                  <AgGridReact
                    rowData={history}
                    columnDefs={historyColDefs}
                    pagination={true}
                    paginationPageSize={10}
                    defaultColDef={{ sortable: true, filter: true, resizable: true }}
                    domLayout="autoHeight"
                  />
                </div>
              </CardBody>
            </Tab>
          </Tabs>
          {/*  NEW: /Tabs */}
        </Card>
      </Col>
      <Modal show={!!viewTrade} onHide={closeViewModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Trade Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!viewTrade && <p className="mb-0 text-muted">No trade selected.</p>}
          {viewTrade && (
            <div className="table-responsive">
              <table className="table table-sm table-striped align-middle">
                <tbody>
                  {Object.entries(viewTrade).map(([key, value]) => (
                    <tr key={key}>
                      <th style={{ width: 200 }} className="text-uppercase text-muted small">
                        {key}
                      </th>
                      <td>{value === null || value === undefined || value === '' ? '—' : String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeViewModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Row>
  )
}


// 'use client'
// import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
// import { AgGridReact } from 'ag-grid-react'
// import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
// import { TradeColDefs } from '@/assets/tychiData/columnDefs'
// import api from '@/lib/api/axios'
// import Cookies from 'js-cookie'
// import { useDashboardToken } from '@/hooks/useDashboardToken'
// import { formatYmd } from '../../../../../src/lib/dateFormat'
// import { jwtDecode } from 'jwt-decode'
// import currencies from 'currency-formatter/currencies'
// import {
//   Col,
//   Card,
//   CardBody,
//   CardHeader,
//   CardTitle,
//   Row,
//   Tabs,
//   Tab,
//   Button,
//   Alert,
//   Modal,
// } from 'react-bootstrap'
// import { TradeModal, UploadTradeModal } from '@/app/(admin)/base-ui/modals/components/AllModals'
// import { deleteTrade, bulkDeleteTrades } from '@/lib/api/trades'
// import { buildAoaFromHeaders, exportAoaToXlsx } from '@/lib/exporters/xlsx'
// import { getFundDetails } from '@/lib/api/fund'

// // Register all Community features
// ModuleRegistry.registerModules([AllCommunityModule])

// export default function TradesData() {
//   const [rowData, setRowData] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [fundId, setFundId] = useState('')
//   const [selectedRows, setSelectedRows] = useState([])
//   const [viewTrade, setViewTrade] = useState(null)
//   const [bulkActionLoading, setBulkActionLoading] = useState(false)
//   const [fundDetails, setFundDetails] = useState(null)

//   // 1) Get fundId from dashboardToken cookie (support multiple key styles)
//   useEffect(() => {
//     const token = Cookies.get('dashboardToken')
//     if (!token) {
//       // setErrMsg?.('dashboardToken cookie not found') // (optional)
//       return
//     }
//     try {
//       const payload = jwtDecode(token)
//       const id = payload?.fund_id || payload?.fundId || payload?.context?.fund_id || ''
//       if (!id) {
//         // setErrMsg?.('fund_id not present in token') // (optional)
//         return
//       }
//       setFundId(id)
//     } catch (e) {
//       console.error('[Trades] token decode error:', e)
//       // setErrMsg?.('Invalid dashboard token') // (optional)
//     }
//   }, [])

//   const dashboard = useDashboardToken()
//   const fmt = dashboard?.date_format || 'MM/DD/YYYY'
//   const fund_id = dashboard?.fund_id || ''
  
//   // Fetch fund details to get current decimal_precision
//   useEffect(() => {
//     const currentFundId = fund_id || fundId
//     if (!currentFundId) {
//       setFundDetails(null)
//       return
//     }
    
//     const fetchFund = async () => {
//       try {
//         const details = await getFundDetails(currentFundId)
//         setFundDetails(details)
//       } catch (error) {
//         console.error('Failed to fetch fund details:', error)
//         setFundDetails(null)
//       }
//     }
    
//     fetchFund()
//   }, [fund_id, fundId])
  
//   // Get decimal precision - prioritize fund details from API, then token, then default to 2
//   const decimalPrecision = useMemo(() => {
//     // First try fund details from API (most up-to-date)
//     const apiPrecision = fundDetails?.decimal_precision
//     // Then try token values
//     const tokenPrecision = dashboard?.decimal_precision ?? dashboard?.fund?.decimal_precision
    
//     const precision = apiPrecision ?? tokenPrecision
//     const numPrecision = precision !== null && precision !== undefined ? Number(precision) : null
//     const result = numPrecision !== null && !isNaN(numPrecision) ? numPrecision : 2
    
//     console.log('🔢 Fund details (API):', fundDetails)
//     console.log('🔢 decimal_precision (API):', apiPrecision)
//     console.log('🔢 decimal_precision (token):', tokenPrecision)
//     console.log('🔢 Final decimalPrecision:', result)
    
//     return result
//   }, [fundDetails, dashboard])
  
//   // Get currency symbol from reporting_currency
//   const currencySymbol = useMemo(() => {
//     const reportingCurrency = dashboard?.reporting_currency || dashboard?.fund?.reporting_currency || ''
//     if (!reportingCurrency) return ''
//     const currency = currencies.find((c) => c.code === reportingCurrency)
//     return currency?.symbol || ''
//   }, [dashboard])

//   const refreshTrades = useCallback(async () => {
//     const currentFundId = fund_id || fundId
//     if (!currentFundId) return
//     setLoading(true)
//     const url = `/api/v1/trade/fund/${encodeURIComponent(currentFundId)}`
//     try {
//       const res = await api.get(url)
//       const rawRows = Array.isArray(res?.data?.data) ? res.data.data : []
      
//       // Normalize trade data to ensure relation_type and lot_id fields are populated
//       const normalizedRows = rawRows.map((trade) => {
//         // Normalize relation_type field (check multiple possible field names)
//         const relationType = 
//           trade.relation_type || 
//           trade.relationType || 
//           trade.relation_type_name ||
//           trade.relationTypeName ||
//           trade.type ||
//           trade.relation_type_id?.name ||
//           trade.relationTypeId?.name ||
//           ''
        
//         // Normalize lot_id field (check multiple possible field names)
//         const lotId = 
//           trade.lot_id || 
//           trade.lotId || 
//           trade.lot_id_name ||
//           trade.lotIdName ||
//           trade.lot_id_id ||
//           trade.lotIdId ||
//           ''
        
//         // Return normalized trade with guaranteed relation_type and lot_id fields
//         return {
//           ...trade,
//           relation_type: relationType, // Always set relation_type (even if empty)
//           lot_id: lotId, // Always set lot_id (even if empty)
//           // Also keep original fields for backward compatibility
//           relationType: relationType,
//           lotId: lotId,
//         }
//       })
      
//       console.log('[Trades] Fetched and normalized trades:', {
//         total: normalizedRows.length,
//         sampleTrade: normalizedRows[0] ? {
//           trade_id: normalizedRows[0].trade_id,
//           relation_type: normalizedRows[0].relation_type,
//           lot_id: normalizedRows[0].lot_id,
//           allKeys: Object.keys(normalizedRows[0])
//         } : null
//       })
      
//       setRowData(normalizedRows)
//     } catch (e) {
//       console.error('fetch trades failed', url, e?.response?.status, e?.response?.data)
//       setRowData([])
//     } finally {
//       setLoading(false)
//       setSelectedRows([])
//     }
//   }, [fund_id, fundId])

//   useEffect(() => {
//     refreshTrades()
//   }, [refreshTrades])


//   const columnDefs = useMemo(() => {
//     return (TradeColDefs || []).map((col) => {
//       if (col?.field === 'trade_date') {
//         return {
//           ...col,
//           valueFormatter: (p) => {
//             const raw = p?.value ? String(p.value).slice(0, 10) : ''
//             return formatYmd(raw, fmt)
//           },
//         }
//       }

//       // Format Price column same as Amount and Gross Amount - use currency symbol at front
//       if (col?.field === 'price') {
//         return {
//           ...col,
//           valueFormatter: (p) => {
//             const value = p?.value
//             if (value === null || value === undefined || value === '') return '—'
//             const num = Number(value)
//             if (Number.isNaN(num)) return value
//             const formatted = num.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
//             return currencySymbol ? `${currencySymbol}${formatted}` : formatted
//           },
//         }
//       }

//       // Format Quantity column - use decimal precision (no currency symbol)
//       if (col?.field === 'quantity') {
//         return {
//           ...col,
//           valueFormatter: (p) => {
//             const value = p?.value
//             if (value === null || value === undefined || value === '') return '—'
//             const num = Number(value)
//             if (Number.isNaN(num)) return value
//             return num.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
//           },
//         }
//       }

//       // Format Amount column - use currency symbol at front
//       if (col?.field === 'amount') {
//         return {
//           ...col,
//           valueFormatter: (p) => {
//             const value = p?.value
//             if (typeof value === 'string' && value.trim()) {
//               // If amount is already a formatted string, try to extract number and reformat with symbol
//               const numMatch = value.replace(/,/g, '').match(/[\d.]+/)
//               if (numMatch) {
//                 const num = Number(numMatch[0])
//                 if (!Number.isNaN(num)) {
//                   const formatted = num.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
//                   return currencySymbol ? `${currencySymbol}${formatted}` : formatted
//                 }
//               }
//               return value
//             }
//             if (value === null || value === undefined || value === '') return '—'
//             const num = Number(value)
//             if (Number.isNaN(num)) return value
//             const formatted = num.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
//             return currencySymbol ? `${currencySymbol}${formatted}` : formatted
//           },
//         }
//       }

//       if (col?.field === 'computed_amount') {
//         return {
//           ...col,
//           valueFormatter: (p) => {
//             const value = p?.value
//             if (value === null || value === undefined || value === '') return '—'
//             const num = Number(value)
//             if (Number.isNaN(num)) return value
//             const formatted = num.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
//             return currencySymbol ? `${currencySymbol}${formatted}` : formatted
//           },
//         }
//       }

//       return col
//     })
//   }, [fmt, currencySymbol, decimalPrecision])

//   // History state
//   const [history, setHistory] = useState([])
//   const [loadingHistory, setLoadingHistory] = useState(false)
//   const [historyError, setHistoryError] = useState('')

//   const fetchTradeHistory = useCallback(async () => {
//     if (!fund_id) {
//       setHistory([])
//       return
//     }
//     setLoadingHistory(true)
//     setHistoryError('')
//     try {
//       const res = await api.get(`/api/v1/trade/uploadhistory/${fund_id}`)
//       const rows = res?.data?.rows || []
//       const normalized = rows.map((r) => ({
//         ...r,
//         uploaded_at: r.uploaded_at || r.date_and_time || r.created_at || null,
//       }))
//       setHistory(normalized)
//     } catch (e) {
//       setHistoryError(e?.response?.data?.error || e?.message || 'Failed to load trade upload history')
//       setHistory([])
//     } finally {
//       setLoadingHistory(false)
//     }
//   }, [fund_id])

//   useEffect(() => {
//     fetchTradeHistory()
//   }, [fetchTradeHistory])

//   const gridApiRef = useRef(null)

//   const onGridReady = useCallback((params) => {
//     gridApiRef.current = params.api
//   }, [])

//   const updateSelectionState = useCallback(() => {
//     if (!gridApiRef.current) return
//     setSelectedRows(gridApiRef.current.getSelectedRows())
//   }, [])

//   const onSelectionChanged = useCallback(() => {
//     updateSelectionState()
//   }, [updateSelectionState])

//   const handleSelectAll = useCallback(() => {
//     if (!gridApiRef.current) return
//     gridApiRef.current.selectAll()
//     updateSelectionState()
//   }, [updateSelectionState])

//   const handleClearSelection = useCallback(() => {
//     if (!gridApiRef.current) return
//     gridApiRef.current.deselectAll()
//     updateSelectionState()
//   }, [updateSelectionState])

//   const tradeExportHeaders = useMemo(
//     () => [
//       { key: 'trade_id', label: 'Trade ID' },
//       { key: 'trade_date', label: 'Trade Date', value: (row) => (row?.trade_date ? String(row.trade_date).slice(0, 10) : '') },
//       { key: 'symbol_name', label: 'Symbol' },
//       { key: 'symbol_code', label: 'Symbol Code' },
//       { key: 'price', label: 'Price' },
//       { key: 'quantity', label: 'Quantity' },
//       { key: 'amount', label: 'Amount' },
//       { key: 'computed_amount', label: 'Gross Amount' },
//       { key: 'trade_type', label: 'Trade Type' },
//       { key: 'broker_name', label: 'Broker' },
//     ],
//     [],
//   )

//   const formatExportValue = useCallback((key, value) => {
//     if (typeof value === 'number') {
//       return value.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
//     }
//     return value ?? ''
//   }, [decimalPrecision])

//   const escapeCsv = (value) => {
//     const stringValue = String(value ?? '')
//     if (/[",\n]/.test(stringValue)) {
//       return `"${stringValue.replace(/"/g, '""')}"`
//     }
//     return stringValue
//   }

//   // Export filtered or selected rows (selected checkboxes take priority)
//   // Also respects pagination - only exports rows visible on current page
//   const handleExport = useCallback(
//     (format) => {
//       // Step 1️⃣ - Check if user has selected rows (checkboxes)
//       // If selected rows exist, export only those
//       // Otherwise, export filtered rows from current pagination page only
//       let rowsToExport = []

//       if (selectedRows.length > 0) {
//         // User selected specific rows - export only selected
//         rowsToExport = selectedRows
//       } else {
//         // No selection - export filtered rows from current page only
//         if (gridApiRef.current) {
//           // Get pagination info: current page and page size
//           const currentPage = gridApiRef.current.paginationGetCurrentPage() || 0 // page number (0, 1, 2, ...)
//           const pageSize = gridApiRef.current.paginationGetPageSize() || 10 // rows per page (10, 20, etc.)
          
//           // Calculate start and end index for current page
//           const startIndex = currentPage * pageSize // e.g., page 0 = 0, page 1 = 10, page 2 = 20
//           const endIndex = startIndex + pageSize // e.g., 0+10=10, 10+10=20, 20+10=30

//           // Get all filtered rows first
//           const allFilteredRows = []
//           gridApiRef.current.forEachNodeAfterFilterAndSort((node) => {
//             if (node.data) {
//               allFilteredRows.push(node.data)
//             }
//           })

//           // Then get only the rows for current page
//           // e.g., if page 1 (index 0) with page size 10: get rows 0-9
//           // e.g., if page 2 (index 1) with page size 10: get rows 10-19
//           rowsToExport = allFilteredRows.slice(startIndex, endIndex)
//         }
//         // If no filtered rows, fall back to all rows from current page
//         if (rowsToExport.length === 0 && rowData.length > 0) {
//           const currentPage = gridApiRef.current?.paginationGetCurrentPage() || 0
//           const pageSize = gridApiRef.current?.paginationGetPageSize() || 10
//           const startIndex = currentPage * pageSize
//           const endIndex = startIndex + pageSize
//           rowsToExport = rowData.slice(startIndex, endIndex)
//         }
//       }

//       if (!rowsToExport.length) {
//         alert('No trades to export. Please select rows or check your filters.')
//         return
//       }

//       // Step 2️⃣ - Convert to export format using headers and formatter
//       const aoa = buildAoaFromHeaders(tradeExportHeaders, rowsToExport, formatExportValue)

//       // Step 3️⃣ - Export based on format
//       const exportDate = new Date().toISOString().slice(0, 10)
//       if (format === 'xlsx') {
//         exportAoaToXlsx({
//           fileName: selectedRows.length > 0 ? `trades-selected-${exportDate}` : `trades-filtered-${exportDate}`,
//           sheetName: 'Trades',
//           aoa,
//         })
//         return
//       }

//       // Step 4️⃣ - Create CSV file and download
//       const csvContent = aoa.map((row) => row.map((cell) => escapeCsv(cell)).join(',')).join('\n')
//       const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
//       const url = URL.createObjectURL(blob)
//       const link = document.createElement('a')
//       link.href = url
//       link.download = selectedRows.length > 0 ? `trades-selected-${exportDate}.csv` : `trades-filtered-${exportDate}.csv`
//       document.body.appendChild(link)
//       link.click()
//       document.body.removeChild(link)
//       URL.revokeObjectURL(url)
//     },
//     [selectedRows, rowData, tradeExportHeaders, formatExportValue],
//   )

//   // Fetch last pricing date for validation
//   const [lastPricingDate, setLastPricingDate] = useState(null)
  
//   useEffect(() => {
//     const currentFundId = fund_id || fundId
//     if (!currentFundId) {
//       setLastPricingDate(null)
//       return
//     }
    
//     const fetchLastPricingDate = async () => {
//       try {
//         const res = await api.get(`/api/v1/pricing/${encodeURIComponent(currentFundId)}/reporting-periods?limit=200`)
//         const rows = res?.data?.rows || []
//         if (rows.length > 0) {
//           // Get the latest pricing date (sort by end_date descending)
//           const sortedRows = [...rows].sort((a, b) => {
//             const dateA = new Date(a.end_date || 0).getTime()
//             const dateB = new Date(b.end_date || 0).getTime()
//             return dateB - dateA // Descending order
//           })
          
//           const lastDate = sortedRows[0]?.end_date ? String(sortedRows[0].end_date).slice(0, 10) : null
//           setLastPricingDate(lastDate)
//           console.log('[Trades] Last pricing date fetched:', lastDate, 'from', rows.length, 'periods')
//         } else {
//           setLastPricingDate(null)
//           console.log('[Trades] No pricing periods found')
//         }
//       } catch (error) {
//         console.error('[Trades] Failed to fetch last pricing date:', error)
//         console.error('[Trades] Error details:', error?.response?.data)
//         setLastPricingDate(null)
//       }
//     }
    
//     fetchLastPricingDate()
//   }, [fund_id, fundId])

//   // Comprehensive validation function - checks all conditions
//   const validateTradesForDeletion = useCallback((allRows, selectedRows, lastPricingDateStr) => {
//     if (!selectedRows.length) return { valid: false, error: "No trades selected." };

//     console.log('[Validation] Starting comprehensive validation:', {
//       totalRows: allRows.length,
//       selectedRows: selectedRows.length,
//       selectedTradeIds: selectedRows.map(r => r.trade_id),
//       lastPricingDate: lastPricingDateStr
//     });

//     // Group all and selected trades by symbol
//     const groupTrades = (rows) => {
//       const groups = {};
//       rows.forEach((row) => {
//         const symbol = row.symbol_id || "__NOSYMBOL__";
//         if (!groups[symbol]) groups[symbol] = [];
//         groups[symbol].push(row);
//       });
//       return groups;
//     };

//     const allGroups = groupTrades(allRows);
//     const selectedGroups = groupTrades(selectedRows);

//     // Backend sort logic (same as API)
//     const sortFn = (a, b) => {
//       const dA = new Date(a.trade_date).getTime() || 0;
//       const dB = new Date(b.trade_date).getTime() || 0;
//       if (dA !== dB) return dB - dA;

//       const cA = new Date(a.created_at).getTime() || 0;
//       const cB = new Date(b.created_at).getTime() || 0;
//       if (cA !== cB) return cB - cA;

//       return String(b.trade_id).localeCompare(String(a.trade_id));
//     };

//     const normalizeId = (id) => String(id || '').trim();

//     // Validate each symbol group
//     for (const symbol of Object.keys(selectedGroups)) {
//       const all = (allGroups[symbol] || []).sort(sortFn);
//       const sel = selectedGroups[symbol].sort(sortFn);

//       if (!all.length || !sel.length) continue;

//       console.log(`[Validation] Symbol ${symbol} validation:`, {
//         allCount: all.length,
//         selCount: sel.length,
//         allLatestTradeId: all[0]?.trade_id,
//         selLatestTradeId: sel[0]?.trade_id,
//         allLatestTrade: all[0],
//         selLatestTrade: sel[0]
//       });

//       // 1️⃣ Latest trade selection required
//       if (normalizeId(all[0].trade_id) !== normalizeId(sel[0].trade_id)) {
//         console.log('[Validation] Latest trade mismatch:', {
//           symbol,
//           expectedLatest: all[0].trade_id,
//           selectedLatest: sel[0].trade_id
//         });
//         return {
//           valid: false,
//           error: `Symbol ${symbol}: Please select the LATEST trade first. Latest trade ID: ${all[0].trade_id}`
//         };
//       }

//       // 2️⃣ No gaps allowed - continuity check
//       for (let i = 0; i < sel.length; i++) {
//         if (normalizeId(sel[i].trade_id) !== normalizeId(all[i].trade_id)) {
//           return {
//             valid: false,
//             error: `Symbol ${symbol}: Selection must be continuous from the latest trade.`
//           };
//         }
//       }

//       // 3️⃣ Pricing date check - trade date must be after last pricing date
//       if (lastPricingDateStr) {
//         const lastPricingTimestamp = new Date(lastPricingDateStr + 'T00:00:00Z').getTime();
//         for (const trade of sel) {
//           if (!trade.trade_date) continue;
//           const tradeDateStr = String(trade.trade_date).slice(0, 10);
//           const tradeTimestamp = new Date(tradeDateStr + 'T00:00:00Z').getTime();
          
//           if (tradeTimestamp <= lastPricingTimestamp) {
//             return {
//               valid: false,
//               error: `Trade ${trade.trade_id} (${tradeDateStr}) cannot be deleted because it is on or before the last pricing date (${lastPricingDateStr}).`
//             };
//           }
//         }
//       }

//       // 4️⃣ Realized trade check - 'Created' trade can't be deleted if 'Realized' entries exist
//       for (const trade of sel) {
//         // Use normalized relation_type field (should be populated by refreshTrades)
//         const relationType = String(trade.relation_type || trade.relationType || '').trim();
        
//         // Log first trade for debugging
//         if (sel.indexOf(trade) === 0) {
//           console.log(`[Validation] First trade (normalized):`, {
//             trade_id: trade.trade_id,
//             relation_type: trade.relation_type,
//             lot_id: trade.lot_id,
//             hasRelationType: !!trade.relation_type,
//             hasLotId: !!trade.lot_id
//           });
//         }
        
//         // Validate if relation_type is 'Created'
//         if (relationType && relationType.toLowerCase() === 'created') {
//           // Use normalized lot_id field
//           const lotId = trade.lot_id || trade.lotId;
          
//           if (lotId) {
//             // Find all realized trades for this lot
//             const realizedTrades = allRows.filter((t) => {
//               const tLotId = t.lot_id || t.lotId;
//               const tRelationType = String(t.relation_type || t.relationType || '').trim().toLowerCase();
              
//               return tLotId === lotId && 
//                      tRelationType === 'realized' && 
//                      normalizeId(t.trade_id) !== normalizeId(trade.trade_id);
//             });
            
//             if (realizedTrades.length > 0) {
//               console.log(`[Validation] ⚠️ Found Realized trades for Created trade:`, {
//                 createdTrade: trade.trade_id,
//                 lotId: lotId,
//                 realizedCount: realizedTrades.length,
//                 realizedIds: realizedTrades.map(t => t.trade_id)
//               });
              
//               return {
//                 valid: false,
//                 error: `Trade ${trade.trade_id} (Created) cannot be deleted because ${realizedTrades.length} 'Realized' entry/entries exist for the same lot. Please delete 'Realized' entries first.`
//               };
//             }
//           }
//         } else if (!relationType && sel.indexOf(trade) === 0) {
//           // Warn if relation_type is still empty after normalization
//           console.warn(`[Validation] ⚠️ relation_type is empty after normalization. Backend will validate this.`, {
//             trade_id: trade.trade_id,
//             tradeObject: trade
//           });
//         }
//       }

//       // 5️⃣ Additional check: Verify each selected trade is actually in the correct position
//       // This ensures we're not selecting trades that are not the latest
//       for (let i = 0; i < sel.length; i++) {
//         const selectedTrade = sel[i];
//         const expectedTrade = all[i];
        
//         // Double-check that selected trade matches expected position
//         if (normalizeId(selectedTrade.trade_id) !== normalizeId(expectedTrade.trade_id)) {
//           return {
//             valid: false,
//             error: `Trade ${selectedTrade.trade_id} is not in the correct position. Please select trades starting from the latest.`
//           };
//         }
//       }
//     }

//     return { valid: true, error: null };
//   }, []);

//   // Validate continuous latest trades selection per symbol (kept for backward compatibility)
//   const validateContinuousSelection = useCallback((allRows, selectedRows) => {
//     const result = validateTradesForDeletion(allRows, selectedRows, lastPricingDate);
//     return result.valid ? null : result.error;
//   }, [validateTradesForDeletion, lastPricingDate]);

//   const confirmAndDeleteTrades = useCallback(
//     async (trades) => {
//       const deletable = trades.filter((t) => t?.trade_id)
//       if (!deletable.length) {
//         alert('No trades selected for deletion.')
//         return
//       }

//       // Sort EXACTLY like backend before sending
//       const sortFn = (a, b) => {
//         const dA = new Date(a.trade_date).getTime() || 0
//         const dB = new Date(b.trade_date).getTime() || 0
//         if (dA !== dB) return dB - dA

//         const cA = new Date(a.created_at).getTime() || 0
//         const cB = new Date(b.created_at).getTime() || 0
//         if (cA !== cB) return cB - cA

//         return String(b.trade_id).localeCompare(String(a.trade_id))
//       }

//       // FIX: sort selection before sending to backend
//       const sortedSelection = [...deletable].sort(sortFn)
//       const tradeIds = sortedSelection.map((t) => t.trade_id)

//       console.log('[Delete] Sorted selection before sending to backend:', {
//         count: sortedSelection.length,
//         firstTrade: sortedSelection[0],
//         lastTrade: sortedSelection[sortedSelection.length - 1],
//         tradeIds: tradeIds,
//         symbols: [...new Set(sortedSelection.map(t => t.symbol_id))]
//       })

//       if (!confirm(`Delete ${deletable.length} trade(s)? This cannot be undone.`)) return

//       setBulkActionLoading(true)
//       try {
//         if (tradeIds.length === 1) {
//           // single delete
//           await deleteTrade(tradeIds[0])
//           await refreshTrades()
//           gridApiRef.current?.deselectAll()
//           setSelectedRows([])
//           alert('Trade deleted successfully.')
//         } else {
//           // bulk delete
//           const result = await bulkDeleteTrades(tradeIds)

//           console.log('[Trades] Bulk delete result:', {
//             success: result.success,
//             partial: result.partial,
//             successful: result.successful?.length || 0,
//             failed: result.failed?.length || 0,
//             message: result.message
//           })

//           const successCount = result.successful?.length || 0
//           const failedCount = result.failed?.length || 0
//           const isSuccess = result.success === true

//           console.log('[Trades] Processing result:', {
//             successCount,
//             failedCount,
//             isSuccess,
//             resultSuccess: result.success,
//             willShowAllFailed: (result.success === false && failedCount > 0 && successCount === 0)
//           })

//           // Check if all trades failed (success is false and we have failed trades)
//           if (result.success === false && failedCount > 0 && successCount === 0) {
//             // All trades failed - show detailed errors
//             const failedDetails = result.failed
//               ?.slice(0, 10) // Show first 10 errors to avoid huge alert
//               .map((f) => `Trade ${f.trade_id}: ${f.message}`)
//               .join('\n')
            
//             const moreErrors = failedCount > 10 ? `\n\n... and ${failedCount - 10} more errors` : ''

//             alert(
//               `❌ All Trades Failed to Delete\n\n` +
//                 `Failed: ${failedCount} of ${tradeIds.length}\n\n` +
//                 `Error Details:\n${failedDetails}${moreErrors}\n\n` +
//                 `Common Issues:\n` +
//                 `1. Not selecting latest trades for each symbol\n` +
//                 `2. Trades on or before last pricing date\n` +
//                 `3. 'Created' trades with 'Realized' entries\n\n` +
//                 `Please fix selection and try again.`
//             )
//           } else if (result.partial || (failedCount > 0 && successCount > 0)) {
//             // Partial success - some deleted, some failed
//             const failedDetails = result.failed
//               ?.slice(0, 10)
//               .map((f) => `Trade ${f.trade_id}: ${f.message}`)
//               .join('\n')
            
//             const moreErrors = failedCount > 10 ? `\n\n... and ${failedCount - 10} more errors` : ''

//             alert(
//               `Partial Success:\n\n` +
//                 `✅ Deleted: ${successCount}\n` +
//                 `❌ Failed: ${failedCount}\n\n` +
//                 (failedCount > 0 ? `Failed Details:\n${failedDetails}${moreErrors}` : '')
//             )
//           } else {
//             // All succeeded
//             alert(`✅ Deleted ${successCount || tradeIds.length} trade(s) successfully`)
//           }

//           await refreshTrades()
//           gridApiRef.current?.deselectAll()
//           setSelectedRows([])
//         }
//       } catch (error) {
//         console.error('[Trades] Delete failed', error)
//         console.error('[Trades] Full error response:', error?.response?.data)
//         console.error('[Trades] Error responseData:', error?.responseData)
//         console.error('[Trades] Error message:', error?.message)

//         // Check if error has responseData (from bulkDeleteTrades or deleteTrade)
//         const responseData = error?.responseData || error?.response?.data
//         const results = responseData?.results || {}
//         const failed = results?.failed || []
//         const successful = results?.successful || []

//         // For single delete, check if we have a direct error message
//         if (tradeIds.length === 1) {
//           // Single delete error
//           const errorMessage = 
//             error?.message || 
//             responseData?.message || 
//             responseData?.error || 
//             'Failed to delete trade.'
          
//           alert(
//             `❌ Cannot Delete Trade\n\n` +
//             `${errorMessage}\n\n` +
//             `Common Reasons:\n` +
//             `• Trade is not the latest for this symbol\n` +
//             `• Trade is on or before the last pricing date\n` +
//             `• 'Created' trade has 'Realized' entries\n\n` +
//             `Please check and try again.`
//           )
//         } else if (failed.length > 0) {
//           // Bulk delete with failed results
//           const failedDetails = failed
//             .slice(0, 10) // Show first 10 to avoid huge alert
//             .map((f) => `Trade ${f.trade_id}: ${f.message}`)
//             .join('\n')
          
//           const moreErrors = failed.length > 10 ? `\n\n... and ${failed.length - 10} more errors` : ''
//           const successMsg = successful.length > 0 ? `\n\n✅ Deleted: ${successful.length}` : ''

//           alert(
//             `❌ Delete Failed\n\n` +
//             `Failed: ${failed.length} of ${tradeIds.length}${successMsg}\n\n` +
//             `Error Details:\n${failedDetails}${moreErrors}\n\n` +
//             `Common Issues:\n` +
//             `• Not selecting latest trades for each symbol\n` +
//             `• Trades on or before last pricing date\n` +
//             `• 'Created' trades with 'Realized' entries`
//           )
//         } else {
//           // Generic error message
//           const backendError = error?.response?.data || error?.responseData
//           let msg = backendError?.message || backendError?.error || error?.message || 'Failed to delete selected trades.'
          
//           // Check if backend sent validation issues
//           if (backendError?.issues && Array.isArray(backendError.issues)) {
//             const issueDetails = backendError.issues.map(issue => 
//               `Symbol: ${issue.symbol_id || 'Unknown'}\n` +
//               `Problem: ${issue.message || 'Validation failed'}\n` +
//               `Trades: ${issue.selected} selected out of ${issue.total_trades} total`
//             ).join('\n\n')
            
//             alert(
//               `⚠️ Backend Validation Failed\n\n` +
//               `${backendError.message || 'Cannot delete trades'}\n\n` +
//               `Details:\n${issueDetails}`
//             )
//           } else {
//             alert(msg)
//           }
//         }
//       } finally {
//         setBulkActionLoading(false)
//       }
//     },
//     [refreshTrades]
//   )

//   const handleSingleDelete = useCallback(
//     (trade) => {
//       if (!trade || !trade.trade_id) {
//         alert('Invalid trade selected.')
//         return
//       }

//       // Validate single trade before deletion
//       const validation = validateTradesForDeletion(rowData, [trade], lastPricingDate);

//       if (!validation.valid) {
//         alert(`⚠️ Cannot Delete Trade\n\n${validation.error}\n\nPlease check and try again.`)
//         return
//       }

//       confirmAndDeleteTrades([trade])
//     },
//     [rowData, lastPricingDate, validateTradesForDeletion, confirmAndDeleteTrades],
//   )

//   // Check if selected trades are valid for deletion (for UI feedback)
//   const validationResult = useMemo(() => {
//     if (!selectedRows.length) return { valid: false, error: null };
//     return validateTradesForDeletion(rowData, selectedRows, lastPricingDate);
//   }, [selectedRows, rowData, lastPricingDate, validateTradesForDeletion]);

//   const areSelectedTradesValid = validationResult.valid;

//   const handleBulkDelete = useCallback(() => {
//     if (!selectedRows.length) {
//       alert('No trades selected.')
//       return
//     }

//     // Use comprehensive validation
//     const validation = validateTradesForDeletion(rowData, selectedRows, lastPricingDate);

//     if (!validation.valid) {
//       alert(`⚠️ Cannot Delete Trades\n\n${validation.error}\n\nPlease fix the selection and try again.`)
//       return
//     }

//     confirmAndDeleteTrades(selectedRows)
//   }, [selectedRows, rowData, lastPricingDate, validateTradesForDeletion, confirmAndDeleteTrades])

//   const handleViewTrade = useCallback((trade) => {
//     setViewTrade(trade || null)
//   }, [])

//   const closeViewModal = useCallback(() => setViewTrade(null), [])

//   const selectedCount = selectedRows.length

//   const historyColDefs = useMemo(
//     () => [
//       { headerName: 'File ID', field: 'file_id', width: 280 },
//       { headerName: 'File Name', field: 'file_name', flex: 1 },
//       {
//         headerName: 'Status',
//         field: 'status',
//         flex: 1,
//         sortable: true,
//         filter: true,
//       },
//       {
//         headerName: 'Uploaded At',
//         field: 'uploaded_at',
//         flex: 1,
//         valueGetter: (p) => (p.data?.uploaded_at ? new Date(p.data.uploaded_at).toLocaleString() : ''),
//       },
//       { headerName: 'Uploaded By', field: 'user_id', flex: 1 },
//     ],
//     [],
//   )

//   return (
//     <Row>
//       <Col xl={12}>
//         <Card>
//           <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
//             <CardTitle as="h4">Trades</CardTitle>
//             <div className="d-flex gap-2">
//               {/* If your modals accept onSuccess, these will refresh both tabs */}
//               <TradeModal
//                 onSuccess={() => {
//                   //  NEW: refresh after manual add
//                   refreshTrades()
//                   fetchTradeHistory()
//                 }}
//               />
//               <UploadTradeModal
//                 onSuccess={() => {
//                   //  NEW: refresh after upload
//                   refreshTrades()
//                   fetchTradeHistory()
//                 }}
//               />
//             </div>
//           </CardHeader>

//           {/*  NEW: Tabs – List & Loader History */}
//           <Tabs defaultActiveKey="list" id="trade-tabs" className="px-3 pt-3">
//             {/* ─────────── Tab 1: Trades List ─────────── */}
//             <Tab eventKey="list" title="Trades List">
//               <CardBody className="p-2">
//                 {!fund_id && (
//                   <Alert variant="warning" className="mb-3">
//                     Select a fund to view trades.
//                   </Alert>
//                 )}
//                 <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
//                   <Button variant="outline-secondary" size="sm" onClick={handleSelectAll} disabled={!rowData.length || loading}>
//                     Select All
//                   </Button>
//                   <Button variant="outline-secondary" size="sm" onClick={handleClearSelection} disabled={!selectedRows.length}>
//                     Clear Selection
//                   </Button>
//                   <Button 
//                     variant="outline-danger" 
//                     size="sm" 
//                     onClick={handleBulkDelete} 
//                     disabled={!selectedRows.length || bulkActionLoading || !areSelectedTradesValid}
//                     title={!areSelectedTradesValid && selectedRows.length > 0 ? 'Selected trades cannot be deleted. Check validation errors.' : ''}
//                   >
//                     {bulkActionLoading ? 'Deleting…' : `Delete Selected (${selectedCount})`}
//                   </Button>
//                   <Button variant="outline-success" size="sm" onClick={() => handleExport('csv')} disabled={!rowData.length || loading}>
//                     {selectedRows.length > 0 ? `Export Selected CSV (${selectedRows.length})` : 'Export Filtered CSV'}
//                   </Button>
//                   <Button variant="outline-primary" size="sm" onClick={() => handleExport('xlsx')} disabled={!rowData.length || loading}>
//                     {selectedRows.length > 0 ? `Export Selected XLSX (${selectedRows.length})` : 'Export Filtered XLSX'}
//                   </Button>
//                   <span className="text-muted ms-auto">
//                     Selected: {selectedCount} / {rowData.length}
//                   </span>
//                 </div>
//                 {!areSelectedTradesValid && selectedRows.length > 0 && validationResult.error && (
//                   <Alert variant="danger" className="mb-3">
//                     <strong>⚠️ Cannot Delete Selected Trades:</strong><br />
//                     {validationResult.error}
//                   </Alert>
//                 )}
//                 <div className="ag-theme-alpine" style={{ width: '100%', height: 600 }}>
//                   <AgGridReact
//                     onGridReady={onGridReady}
//                     onSelectionChanged={onSelectionChanged}
//                     rowData={rowData}
//                     columnDefs={columnDefs}
//                     pagination={true}
//                     rowSelection="multiple"
//                     paginationPageSize={10}
//                     paginationPageSizeSelector={[10, 25, 50, 100]}
//                     suppressMultiSort={true}
//                     maintainColumnOrder={true}
//                     defaultColDef={{
//                       sortable: true,
//                       filter: true,
//                       resizable: true,
//                     }}
//                     context={{
//                       onViewTrade: handleViewTrade,
//                       onDeleteTrade: handleSingleDelete,
//                     }}
//                     suppressRowClickSelection={false}
//                     overlayLoadingTemplate={loading ? '<span class="ag-overlay-loading-center">Loading...</span>' : undefined}
//                   />
//                 </div>
//               </CardBody>
//             </Tab>

//             {/* ────────  NEW: Tab 2: Loader History ──────── */}
//             <Tab eventKey="history" title="Loader History">
//               <CardBody className="p-2">
//                 {!fund_id && (
//                   <Alert variant="warning" className="mb-3">
//                     Select a fund to view upload history.
//                   </Alert>
//                 )}

//                 <div className="d-flex justify-content-between align-items-center mb-2">
//                   <h6 className="m-0">Trade Uploads</h6>
//                   <Button variant="outline-secondary" size="sm" onClick={fetchTradeHistory} disabled={!fund_id || loadingHistory}>
//                     {loadingHistory ? 'Refreshing…' : 'Refresh'}
//                   </Button>
//                 </div>

//                 {historyError && (
//                   <Alert variant="danger" className="mb-2">
//                     {historyError}
//                   </Alert>
//                 )}

//                 {loadingHistory && (
//                   <Alert variant="info" className="mb-2">
//                     Loading upload history...
//                   </Alert>
//                 )}

//                 {!loadingHistory && !historyError && history.length === 0 && (
//                   <Alert variant="warning" className="mb-2">
//                     No upload history found for this fund.
//                   </Alert>
//                 )}

//                 <div style={{ width: '100%' }}>
//                   <AgGridReact
//                     rowData={history}
//                     columnDefs={historyColDefs}
//                     pagination={true}
//                     paginationPageSize={10}
//                     defaultColDef={{ sortable: true, filter: true, resizable: true }}
//                     domLayout="autoHeight"
//                   />
//                 </div>
//               </CardBody>
//             </Tab>
//           </Tabs>
//           {/*  NEW: /Tabs */}
//         </Card>
//       </Col>
//       <Modal show={!!viewTrade} onHide={closeViewModal} size="lg" centered>
//         <Modal.Header closeButton>
//           <Modal.Title>Trade Details</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {!viewTrade && <p className="mb-0 text-muted">No trade selected.</p>}
//           {viewTrade && (
//             <div className="table-responsive">
//               <table className="table table-sm table-striped align-middle">
//                 <tbody>
//                   {Object.entries(viewTrade).map(([key, value]) => (
//                     <tr key={key}>
//                       <th style={{ width: 200 }} className="text-uppercase text-muted small">
//                         {key}
//                       </th>
//                       <td>{value === null || value === undefined || value === '' ? '—' : String(value)}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={closeViewModal}>
//             Close
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </Row>
//   )
// }
