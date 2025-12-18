'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Spinner, Alert, Tabs, Tab, Button } from 'react-bootstrap'
import { Eye, RotateCcw } from 'lucide-react'
import Cookies from 'js-cookie'
import PageTitle from '@/components/PageTitle'
import { UploadMigrationModal } from '@/app/(admin)/base-ui/modals/components/AllModals'
import MigrationComparisonModal from './components/MigrationComparisonModal'
import { useDashboardToken } from '@/hooks/useDashboardToken'
import api from '@/lib/api/axios'
import { getMigrationTableData } from '@/lib/api/migration'

const apiBase = process.env.NEXT_PUBLIC_API_URL || ''

const AgGridReact = dynamic(() => import('ag-grid-react').then((mod) => mod.AgGridReact), { ssr: false })

// Badge cell renderer component for AG Grid
const BadgeCellRenderer = ({ value }) => {
  const status = String(value || '').toLowerCase()
  let badgeClass = 'badge bg-secondary'
  
  if (status === 'reconciled' || status === 'bookclosed') {
    badgeClass = 'badge bg-success'
  } else if (status === 'pending') {
    badgeClass = 'badge bg-warning'
  }
  
  return <span className={badgeClass}>{value || '—'}</span>
}

// Reconcile Status cell renderer
const ReconcileStatusRenderer = ({ value }) => {
  const status = String(value || '').toLowerCase()
  let badgeClass = 'badge bg-secondary'
  
  if (status === 'reconciled') {
    badgeClass = 'badge bg-success'
  } else if (status === 'pending') {
    badgeClass = 'badge bg-warning'
  }
  
  return <span className={badgeClass}>{value || '—'}</span>
}

// Bookclose Status cell renderer
const BookcloseStatusRenderer = ({ value }) => {
  const status = String(value || '').toLowerCase()
  const badgeClass = status === 'bookclosed' ? 'badge bg-success' : 'badge bg-secondary'
  
  return <span className={badgeClass}>{value || '—'}</span>
}

const MigrationPage = () => {
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const [showComparisonModal, setShowComparisonModal] = useState(false)
  const [activeTab, setActiveTab] = useState('list')
  const [currentFileId, setCurrentFileId] = useState(null)
  const [showReviewOnly, setShowReviewOnly] = useState(false) // Track if only review modal should show
  const [hasMigration, setHasMigration] = useState(false) // Track if migration already exists
  const [hasPricing, setHasPricing] = useState(false) // Track if pricing is done
  const [lastPricingDate, setLastPricingDate] = useState(null) // Store last pricing date
  
  // History tab states
  const [historyRows, setHistoryRows] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  
  const gridApiRef = useRef(null)
  const tokenData = useDashboardToken()
  const fundId = tokenData?.fund_id

  // Register AG Grid modules
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('ag-grid-community')
        .then(({ ModuleRegistry, AllCommunityModule }) => {
          ModuleRegistry.registerModules([AllCommunityModule])
        })
        .catch(() => {})
    }
  }, [])

  // Grid ready callback to store grid API reference
  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api
  }, [])

  // Handle upload button click - validate pricing first (using pricing count logic)
  const handleUploadClick = async () => {
    console.log('[Migration] 🔍 handleUploadClick called')
    
    // Check if migration already exists
    if (hasMigration) {
      console.log('[Migration] ❌ Migration already exists')
      alert('Migration has already been uploaded and reconciled. Please use the View button to review existing migration data.')
      return false
    }

    // Check pricing in real-time (don't rely on state which might be stale)
    if (!fundId) {
      console.log('[Migration] ❌ Fund ID missing')
      alert('Fund ID is required')
      return false
    }

    console.log('[Migration] 📊 Starting pricing count validation for fundId:', fundId)

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
      
      // Step 1: Get pricing count from reporting periods API
      const reportingPeriodsUrl = `${apiBase}/api/v1/pricing/${encodeURIComponent(fundId)}/reporting-periods?limit=200`
      const periodsResp = await fetch(reportingPeriodsUrl, { 
        headers: { Accept: 'application/json' },
        credentials: 'include'
      })
      
      if (!periodsResp.ok) {
        console.warn('[Migration] ⚠️ Failed to fetch reporting periods')
        // Allow to proceed if API fails (don't block user)
        return true
      }
      
      const periodsJson = await periodsResp.json()
      const pricingCount = periodsJson?.count || (Array.isArray(periodsJson?.rows) ? periodsJson.rows.length : 0)
      
      console.log('[Migration] 📊 Pricing count:', {
        pricing_count: pricingCount,
        fund_id: fundId
      })
      
      // Step 2: If pricing count is 0, this is first pricing - no migration check needed
      if (pricingCount === 0) {
        console.log('[Migration] ✅ First pricing (count = 0) - no migration check needed')
        return true
      }
      
      // Step 3: If pricing count is 1, this is second pricing - check first month migration
      if (pricingCount === 1) {
        console.log('[Migration] 🔍 Second pricing (count = 1) - checking first month migration')
        
        // Get FIRST pricing period (oldest) from reporting periods, not last pricing date
        // This handles cases where same month has multiple pricing dates
        const pricingRows = periodsJson?.rows || []
        if (!pricingRows.length) {
          console.warn('[Migration] ⚠️ No pricing periods found')
          return true // Allow to proceed if no periods
        }
        
        // Find FIRST pricing period (oldest date)
        // Sort by end_date (pricing date) ascending to get oldest first
        const sortedPeriods = [...pricingRows].sort((a, b) => {
          const dateA = new Date(a.end_date || a.pricing_date || 0).getTime()
          const dateB = new Date(b.end_date || b.pricing_date || 0).getTime()
          return dateA - dateB // Ascending: oldest first
        })
        
        const firstPricingPeriod = sortedPeriods[0]
        const firstPricingDate = firstPricingPeriod?.end_date || firstPricingPeriod?.pricing_date || null
        
        if (!firstPricingDate) {
          console.warn('[Migration] ⚠️ No first pricing date found in periods')
          return true // Allow to proceed if date is missing
        }
        
        console.log('[Migration] 📅 First pricing period:', {
          period: firstPricingPeriod,
          date: firstPricingDate,
          allPeriods: sortedPeriods.map(p => ({
            date: p.end_date || p.pricing_date,
            period_name: p.period_name
          }))
        })
        
        // Get month of FIRST pricing date (first month)
        const firstDateObj = new Date(firstPricingDate + 'T00:00:00Z')
        if (isNaN(firstDateObj.getTime())) {
          console.warn('[Migration] ⚠️ Invalid first pricing date format')
          return true
        }
        
        const migrationMonthStr = `${firstDateObj.getUTCFullYear()}-${String(firstDateObj.getUTCMonth() + 1).padStart(2, '0')}`
        
        console.log('[Migration] 🔍 Checking migration for first month:', {
          firstPricingDate,
          migrationMonthStr,
          note: 'Using FIRST pricing date, not last (handles multiple dates in same month)'
        })
        
        // Check migration for first month
        const token = Cookies.get('dashboardToken')
        const migrationUrl = `${apiBase}/api/v1/migration/trialbalance/${encodeURIComponent(fundId)}/migration`
        const migrationResp = await fetch(migrationUrl, {
          headers: {
            'Accept': 'application/json',
            'dashboard': `Bearer ${token}`,
          },
          credentials: 'include'
        })
        
        if (migrationResp.ok) {
          const migrationData = await migrationResp.json()
          const migrations = Array.isArray(migrationData?.data) ? migrationData.data : 
                           Array.isArray(migrationData) ? migrationData : []
          
          // Check if migration exists for first month
          const hasMigration = migrations.some((m) => {
            if (!m.reporting_period) return false
            const migrationDate = new Date(m.reporting_period + 'T00:00:00Z')
            const migrationMonth = `${migrationDate.getUTCFullYear()}-${String(migrationDate.getUTCMonth() + 1).padStart(2, '0')}`
            return migrationMonth === migrationMonthStr
          })
          
          if (!hasMigration) {
            alert(`⚠️ Migration Required\n\nFor existing funds, migration must be completed for the first month (${migrationMonthStr}) before second month pricing can be done.\n\nPlease complete migration first.`)
            return false
          }
          
          console.log('[Migration] ✅ Migration found for first month')
        }
      } else {
        // If pricing count >= 2, this is third month or later - no migration check needed
        console.log('[Migration] ✅ Third month or later pricing (count >= 2) - no migration check needed')
      }
      
      return true
    } catch (error) {
      console.error('[Migration] ❌ Migration validation error:', error)
      // On error, allow to proceed (don't block user)
      return true
    }
  }

  // Handle success after upload - open comparison modal
  const handleUploadSuccess = async (fileId) => {
    console.log('[Migration] 📤 Upload success, fileId:', fileId)
    if (fileId) {
      setCurrentFileId(fileId)
    }
    setShowReviewOnly(false) // Show full flow for Upload button
    
    // Auto refresh: Fetch migration data first, then open modal
    try {
      if (activeTab === 'history') {
        await fetchHistory()
      } else if (activeTab === 'list') {
        await fetchMigrationData()
      }
      console.log('[Migration] ✅ Data refreshed after upload')
    } catch (error) {
      console.error('[Migration] ❌ Failed to refresh after upload:', error)
    }
    
    // Open modal after refresh
    setShowComparisonModal(true)
  }

  // Fetch upload history - simple function like beginner can understand
  const fetchHistory = useCallback(async () => {
    if (!fundId) {
      setHistoryRows([])
      return
    }

    setHistoryLoading(true)
    setHistoryError('')

    try {
      // Get token from cookie
      const token = Cookies.get('dashboardToken')
      
      // Call API to get migration upload history with token in headers
      // Updated: Response is now a direct array [{ file_id, file_name, status, uploaded_at, user_id }, ...]
      const res = await api.get(`/api/v1/migration/upload/history/${fundId}`, {
        headers: {
          'dashboard': `Bearer ${token}`,
        },
      })
      
      // Response is direct array, not wrapped in object
      let rows = []
      if (Array.isArray(res?.data)) {
        rows = res.data
      } else if (Array.isArray(res)) {
        rows = res
      } else {
        rows = []
      }

      // Normalize the data (make sure uploaded_at field exists)
      const normalized = rows.map((row) => ({
        ...row,
        uploaded_at: row.uploaded_at || row.date_and_time || row.created_at || null,
      }))
      
      setHistoryRows(normalized)
    } catch (error) {
      const message = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to load upload history'
      setHistoryError(message)
      setHistoryRows([])
    } finally {
      setHistoryLoading(false)
    }
  }, [fundId])

  // Fetch migration table data
  const fetchMigrationData = useCallback(async () => {
    if (!fundId) {
      setRowData([])
      return
    }

    setLoading(true)
    setErrMsg('')

    try {
      // Call API to get migration table data (migration records/metadata)
      const res = await getMigrationTableData(fundId)
      
      // Handle response - could be array or object with data property
      let data = []
      if (Array.isArray(res?.data)) {
        data = res.data
      } else if (res?.data?.data && Array.isArray(res.data.data)) {
        data = res.data.data
      } else if (Array.isArray(res)) {
        data = res
      }

      // Normalize the data to match migration table records structure
      const normalized = data.map((row) => ({
        file_id: row.file_id || row.id || '',
        file_name: row.file_name || row.filename || '',
        reporting_period: row.reporting_period || row.reporting_period_date || null,
        reconcile_status: row.reconcile_status || row.reconcileStatus || 'pending',
        bookclose_status: row.bookclose_status || row.bookcloseStatus || 'pending',
        uploaded_at: row.uploaded_at || row.created_at || row.uploadedAt || null,
        status: row.status || 'pending', // Keep status for reference
      }))
      
      setRowData(normalized)
    } catch (error) {
      const message = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to load migration data'
      setErrMsg(message)
      setRowData([])
    } finally {
      setLoading(false)
    }
  }, [fundId])

  // Actions cell renderer component
  const ActionsCellRenderer = useCallback((params) => {
    const { data } = params
    const fileId = data?.file_id
    const bookcloseStatus = String(data?.bookclose_status || '').toLowerCase()
    const isBookclosed = bookcloseStatus === 'bookclosed'
    
    const handleViewClick = (e) => {
      e.stopPropagation()
      console.log('[Migration] 👁️ View icon clicked for fileId:', fileId)
      setCurrentFileId(fileId)
      setShowReviewOnly(true)
      setShowComparisonModal(true)
      console.log('[Migration] 👁️ State updated, modal should open now')
    }
    
    const handleRevertClick = async (e) => {
      e.stopPropagation()
      if (!fundId || !fileId) {
        console.warn('[Migration] Missing fundId or fileId')
        return
      }
      
      if (!confirm('Are you sure you want to revert this migration? This will delete all migration data.')) {
        return
      }
      
      try {
        console.log('[Migration] 🔄 Revert icon clicked for fileId:', fileId)
        
        // Step 1: Get migration reporting period from current row data
        const migrationReportingPeriod = data?.reporting_period
        console.log('[Migration] 📅 Migration reporting period:', migrationReportingPeriod)
        
        if (!migrationReportingPeriod) {
          console.warn('[Migration] ⚠️ No reporting period found for this migration')
        } else {
          // Step 2: Check if there's any pricing done after this migration month
          try {
            const pricingUrl = `${apiBase}/api/v1/pricing/${encodeURIComponent(fundId)}/reporting-periods?limit=200`
            const pricingResp = await fetch(pricingUrl, { 
              headers: { 'Accept': 'application/json' },
              credentials: 'include'
            })
            
            if (pricingResp.ok) {
              const pricingJson = await pricingResp.json()
              const pricingRows = pricingJson?.rows || []
              
              console.log('[Migration] 📊 Found pricing periods:', pricingRows.length)
              
              // Convert migration reporting period to Date for comparison
              const migrationDate = new Date(migrationReportingPeriod + 'T00:00:00Z')
              const migrationYearMonth = `${migrationDate.getUTCFullYear()}-${String(migrationDate.getUTCMonth() + 1).padStart(2, '0')}`
              
              console.log('[Migration] 📅 Migration year-month:', migrationYearMonth)
              
              // Check if any pricing exists after migration month
              const hasSubsequentPricing = pricingRows.some((period) => {
                if (!period.end_date) return false
                
                const pricingDate = new Date(period.end_date + 'T00:00:00Z')
                const pricingYearMonth = `${pricingDate.getUTCFullYear()}-${String(pricingDate.getUTCMonth() + 1).padStart(2, '0')}`
                
                // Check if pricing is after migration month
                const isAfter = pricingYearMonth > migrationYearMonth
                
                if (isAfter) {
                  console.log('[Migration] ⚠️ Found subsequent pricing:', {
                    period_name: period.period_name,
                    end_date: period.end_date,
                    pricingYearMonth,
                    migrationYearMonth
                  })
                }
                
                return isAfter
              })
              
              if (hasSubsequentPricing) {
                console.log('[Migration] ❌ Cannot revert: Subsequent pricing exists')
                alert(
                  '⚠️ Cannot Revert Migration\n\n' +
                  'Pricing has been completed for months after this migration.\n' +
                  'Please revert the subsequent pricing first before reverting this migration.\n\n' +
                  'Example: If migration was done for January and February pricing exists,\n' +
                  'you must revert February pricing first.'
                )
                return
              }
              
              console.log('[Migration] ✅ No subsequent pricing found, revert allowed')
            } else {
              console.warn('[Migration] ⚠️ Could not fetch pricing periods, allowing revert')
            }
          } catch (pricingError) {
            console.error('[Migration] ⚠️ Error checking pricing periods:', pricingError)
            // Allow revert if pricing check fails (don't block user)
          }
        }
        
        // Check onboarding mode from tokenData (similar to pricing revert handler)
        const onboardingMode = 
          tokenData?.fund?.onboarding_mode || 
          tokenData?.onboarding_mode || 
          tokenData?.fund?.onboardingMode ||
          tokenData?.onboardingMode ||
          ''
        
        const normalizedMode = String(onboardingMode || '').trim().toLowerCase()
        const isExistingFund = normalizedMode === 'existing fund' || 
                              normalizedMode === 'existing' || 
                              normalizedMode === 'existingfund' ||
                              normalizedMode.includes('existing')
        
        console.log('[Migration] 🔄 Onboarding mode check:', {
          onboardingMode,
          normalizedMode,
          isExistingFund,
          tokenData_fund: tokenData?.fund
        })
        
        const token = Cookies.get('dashboardToken')
        if (!token) {
          alert('Authentication token not found')
          return
        }
        
        const headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'dashboard': `Bearer ${token}`,
        }
        
        const url = `${apiBase}/api/v1/migration/trialbalance/${encodeURIComponent(fundId)}/cleanup?file_id=${encodeURIComponent(fileId)}`
        console.log('[Migration] 🌐 Calling cleanup API:', url)
        
        const resp = await fetch(url, {
          method: 'DELETE',
          headers,
          credentials: 'include',
        })
        
        if (!resp.ok) {
          // Try to parse error response as JSON first
          let errorMessage = resp.statusText
          try {
            const errorJson = await resp.json()
            if (errorJson?.error) {
              errorMessage = errorJson.error
            } else if (errorJson?.message) {
              errorMessage = errorJson.message
            }
          } catch {
            // If JSON parse fails, try text
            const errorText = await resp.text().catch(() => '')
            if (errorText) errorMessage = errorText
          }
          
          // Show specific error message for validation errors (409 Conflict)
          if (resp.status === 409) {
            alert(`⚠️ Cannot revert migration:\n\n${errorMessage}`)
          } else {
            alert(`Failed to cleanup migration data:\n\n${errorMessage}`)
          }
          return
        }
        
        const result = await resp.json()
        console.log('[Migration] ✅ Cleanup completed:', result)
        
        if (result?.data) {
          alert(`Migration data cleaned up successfully!\nDeleted: ${result.data.migration_deleted || 0} migration records, ${result.data.buffer_deleted || 0} buffer records, ${result.data.journals_deleted || 0} Journals records`)
        } else {
          alert('Migration data cleaned up successfully!')
        }
        
        // Auto refresh
        await fetchMigrationData()
      } catch (error) {
        console.error('[Migration] ❌ Cleanup error:', error)
        alert('Failed to cleanup migration data: ' + (error?.message || 'Unknown error'))
      }
    }
    
    if (!fileId) {
      return <span>—</span>
    }
    
    return (
      <div className="d-inline-flex align-items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Eye
          size={18}
          className="text-primary"
          title="View Migration"
          onClick={handleViewClick}
          style={{ cursor: 'pointer' }}
        />
        {isBookclosed && (
          <RotateCcw
            size={18}
            className="text-primary"
            title="Revert Migration"
            onClick={handleRevertClick}
            style={{ cursor: 'pointer' }}
          />
        )}
      </div>
    )
  }, [fundId, fetchMigrationData])
  
  // Actions cell renderer wrapper for AG Grid
  const actionsCellRenderer = ActionsCellRenderer

  // Column definitions - defined after actionsCellRenderer
  const columnDefs = useMemo(
    () => [
      { headerName: 'Sr.No', valueGetter: 'node.rowIndex + 1', width: 70, pinned: 'left', flex: 1 },
      { field: 'file_id', headerName: 'File ID', flex: 1, sortable: true, filter: true },
      // { field: 'file_name', headerName: 'File Name', flex: 1, sortable: true, filter: true },
      { field: 'reporting_period', headerName: 'Reporting Period', flex: 1, sortable: true, filter: true,
        valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('en-IN') : '—' },
      { 
        field: 'reconcile_status', 
        headerName: 'Reconcile Status', 
        flex: 1, 
        sortable: true, 
        filter: true,
        cellRenderer: ReconcileStatusRenderer
      },
      // { 
      //   field: 'bookclose_status', 
      //   headerName: 'Bookclose Status', 
      //   flex: 1, 
      //   sortable: true, 
      //   filter: true,
      //   cellRenderer: BookcloseStatusRenderer
      // },
      // { field: 'uploaded_at', headerName: 'Uploaded At', flex: 1, sortable: true, filter: true,
      //   valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString('en-IN') : '—' },
      {
        headerName: 'Actions',
        field: 'actions',
        sortable: false,
        filter: false,
        width: 100,
        pinned: 'right',
        cellRenderer: actionsCellRenderer,
      },
    ],
    [actionsCellRenderer],
  )

  // Fetch migration data when "Migration Data" tab is selected
  useEffect(() => {
    if (activeTab === 'list') {
      fetchMigrationData()
    }
  }, [activeTab, fetchMigrationData])

  // Fetch history when history tab is selected
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory()
    }
  }, [activeTab, fetchHistory])

  // Check if migration already exists (disable upload button if exists)
  useEffect(() => {
    // Migration exists if there's any row with reconcile_status not empty or bookclose_status not empty
    const migrationExists = rowData.some((row) => {
      const reconcileStatus = String(row.reconcile_status || '').toLowerCase()
      const bookcloseStatus = String(row.bookclose_status || '').toLowerCase()
      // Migration exists if it's reconciled or bookclosed
      return reconcileStatus === 'reconciled' || bookcloseStatus === 'bookclosed' || reconcileStatus !== 'pending'
    })
    setHasMigration(migrationExists)
  }, [rowData])

  // Fetch last pricing date to check if pricing is done
  useEffect(() => {
    if (!fundId) {
      setHasPricing(false)
      setLastPricingDate(null)
      return
    }

    const fetchLastPricingDate = async () => {
      console.log('[Migration] 🔄 useEffect: Fetching pricing data for fundId:', fundId)
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
        const url = `${apiBase}/api/v1/pricing/lastPricingdate/${encodeURIComponent(fundId)}`
        console.log('[Migration] 🌐 useEffect: Fetching from:', url)
        
        const resp = await fetch(url, { 
          headers: { 'Accept': 'application/json' }, 
          credentials: 'include' 
        })
        
        console.log('[Migration] 📡 useEffect: Response status:', resp.status)
        
        if (!resp.ok) {
          console.log('[Migration] ❌ useEffect: API call failed')
          setHasPricing(false)
          setLastPricingDate(null)
          return
        }
        const json = await resp.json()
        console.log('[Migration] 📦 useEffect: Full API response:', json)
        
        const lastDate =
          json?.last_pricing_date ||
          json?.meta?.last_pricing_date ||
          json?.data?.last_pricing_date ||
          json?.result?.last_pricing_date ||
          null
        
        // Get reporting_start_date from tokenData
        const reportingStartDate = 
          tokenData?.fund?.reporting_start_date || 
          tokenData?.reporting_start_date ||
          tokenData?.fund?.reportingStartDate ||
          tokenData?.reportingStartDate ||
          null
        
        console.log('[Migration] ✅ useEffect: Pricing check result:', {
          last_pricing_date: lastDate,
          reporting_start_date: reportingStartDate,
          fund_id: fundId,
          tokenData_fund: tokenData?.fund,
          tokenData_keys: tokenData ? Object.keys(tokenData) : 'no tokenData'
        })
        
        if (lastDate) {
          const lastDateStr = lastDate.slice(0, 10)
          setLastPricingDate(lastDateStr)
          console.log('[Migration] 📅 useEffect: lastDate found:', lastDateStr)
          
          // Check if pricing is done by comparing with reporting_start_date
          if (reportingStartDate) {
            console.log('[Migration] 🔄 useEffect: Comparing dates:', {
              last_pricing_date: lastDateStr,
              reporting_start_date: reportingStartDate
            })
            
            const lastDateObj = new Date(lastDateStr + 'T00:00:00Z')
            const reportingStartObj = new Date(reportingStartDate + 'T00:00:00Z')
            
            console.log('[Migration] 📅 useEffect: Parsed dates:', {
              lastDateObj: lastDateObj.toISOString(),
              reportingStartObj: reportingStartObj.toISOString(),
              lastDateTimestamp: lastDateObj.getTime(),
              reportingStartTimestamp: reportingStartObj.getTime()
            })
            
            if (!isNaN(lastDateObj.getTime()) && !isNaN(reportingStartObj.getTime())) {
              // Pricing is done ONLY if last_pricing_date > reporting_start_date
              // If equal, pricing is NOT done
              const isPricingDone = lastDateObj > reportingStartObj
              console.log('[Migration] 🎯 useEffect: Comparison result:', {
                isPricingDone: isPricingDone,
                comparison: `${lastDateStr} > ${reportingStartDate} = ${isPricingDone}`,
                areEqual: lastDateObj.getTime() === reportingStartObj.getTime()
              })
              setHasPricing(isPricingDone)
            } else {
              // If dates are invalid, just check if lastDate exists
              console.log('[Migration] ⚠️ useEffect: Invalid date format, setting hasPricing = true')
              setHasPricing(true)
            }
          } else {
            // If no reporting_start_date, just check if lastDate exists
            console.log('[Migration] ⚠️ useEffect: No reporting_start_date, setting hasPricing = true')
            setHasPricing(true)
          }
        } else {
          console.log('[Migration] ❌ useEffect: No lastDate found')
          setHasPricing(false)
          setLastPricingDate(null)
        }
      } catch (e) {
        console.error('[Migration] Failed to fetch last pricing date:', e)
        setHasPricing(false)
        setLastPricingDate(null)
      }
    }

    fetchLastPricingDate()
  }, [fundId, tokenData])

  // History table columns - simple and clear
  const historyColDefs = useMemo(
    () => [
      { headerName: 'File ID', field: 'file_id', sortable: true, filter: true, width: 220 },
      { headerName: 'File Name', field: 'file_name', sortable: true, filter: true, flex: 1 },
      { headerName: 'Status', field: 'status', sortable: true, filter: true, flex: 1 },
      {
        headerName: 'Uploaded At',
        field: 'uploaded_at',
        sortable: true,
        filter: true,
        flex: 1,
        valueGetter: (params) => (params.data?.uploaded_at ? new Date(params.data.uploaded_at).toLocaleString() : ''),
      },
      { headerName: 'Uploaded By', field: 'user_id', sortable: true, filter: true, flex: 1 },
      {
        headerName: 'Pending Actions',
        field: 'actions',
        sortable: false,
        filter: false,
        width: 150,
        cellRenderer: (params) => {
          const { data } = params
          const fileId = data?.file_id
          const status = String(data?.status || '').toLowerCase()
          
          // Only show button if status is "pending"
          if (status === 'pending' && fileId) {
            return (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setCurrentFileId(fileId)
                  setShowComparisonModal(true)
                }}>
                View
              </Button>
            )
          }
          return '—'
        },
      },
    ],
    [],
  )

  return (
    <>
      <PageTitle title="Migration" subName="General Ledger" />
      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
              <CardTitle as="h4">Migration Data</CardTitle>
              <UploadMigrationModal 
                buttonLabel="Upload" 
                modalTitle="Upload Migration File"
                onSuccess={handleUploadSuccess}
                onUploadSuccess={handleUploadSuccess}
                disabled={hasMigration}
                beforeOpen={handleUploadClick}
              />
            </CardHeader>
            
            {/* Tabs for List and History */}
            <Tabs
              activeKey={activeTab}
              id="migration-tabs"
              className="px-3 pt-3"
              onSelect={(key) => {
                setActiveTab(key || 'list')
              }}
            >
              {/* Tab 1: Migration Data List */}
              <Tab eventKey="list" title="Migration Data">
            <CardBody className="p-2">
                  {!fundId && (
                    <Alert variant="warning" className="mb-3">
                      Select a fund to view migration data.
                    </Alert>
                  )}

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div />
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={fetchMigrationData}
                      disabled={!fundId || loading}>
                      {loading ? 'Refreshing…' : 'Refresh'}
                    </Button>
                  </div>

              {errMsg && (
                <Alert variant="danger" className="mb-2" dismissible onClose={() => setErrMsg('')}>
                  {errMsg}
                </Alert>
              )}
                  
                  {loading && (
                <div className="d-flex align-items-center gap-2 p-3">
                  <Spinner animation="border" size="sm" /> <span>Loading…</span>
                </div>
                  )}

                  {!loading && !errMsg && rowData.length === 0 && (
                    <Alert variant="warning" className="mb-2">
                      No migration data found for this fund.
                    </Alert>
                  )}

                  {!loading && (
                <div className="ag-theme-alpine" style={{ height: 550, width: '100%' }}>
                  {columnDefs.length > 0 && (
                    <AgGridReact
                      onGridReady={onGridReady}
                      rowData={rowData}
                      columnDefs={columnDefs}
                      pagination
                      paginationPageSize={10}
                      paginationPageSizeSelector={[10, 25, 50, 100]}
                      defaultColDef={{ sortable: true, filter: true, resizable: true }}
                    />
                  )}
                </div>
              )}
            </CardBody>
              </Tab>

              {/* Tab 2: Loader History */}
              <Tab eventKey="history" title="Loader History">
                <CardBody className="p-2">
                  {!fundId && (
                    <Alert variant="warning" className="mb-3">
                      Select a fund to view upload history.
                    </Alert>
                  )}

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div />
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={fetchHistory}
                      disabled={!fundId || historyLoading}>
                      {historyLoading ? 'Refreshing…' : 'Refresh'}
                    </Button>
                  </div>

                  {historyError && (
                    <Alert variant="danger" className="mb-2">
                      {historyError}
                    </Alert>
                  )}

                  {historyLoading && (
                    <Alert variant="info" className="mb-2">
                      Loading upload history...
                    </Alert>
                  )}

                  {!historyLoading && !historyError && historyRows.length === 0 && (
                    <Alert variant="warning" className="mb-2">
                      No upload history found for this fund.
                    </Alert>
                  )}

                  <div className="ag-theme-alpine" style={{ width: '100%' }}>
                    <AgGridReact
                      rowData={historyRows}
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
          </Card>
        </Col>
      </Row>

      {/* Comparison Modal */}
      <MigrationComparisonModal
        show={showComparisonModal}
        onClose={() => {
          setShowComparisonModal(false)
          setCurrentFileId(null) // Reset fileId when modal closes
          setShowReviewOnly(false) // Reset showReviewOnly when modal closes
        }}
        fundId={fundId}
        fileId={currentFileId}
        showReviewOnly={showReviewOnly} // Show only review modal when View button clicked, full flow when Upload clicked
        onRefreshHistory={() => {
          // Simple function to refresh history
          if (activeTab === 'history') {
            fetchHistory()
          }
        }}
      />
    </>
  )
}

export default MigrationPage
