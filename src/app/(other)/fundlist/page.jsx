'use client'

import React, { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardBody, CardFooter, CardHeader, CardTitle, Col, Dropdown, Row, Button } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

import PageTitle from '@/components/PageTitle'
import ComponentContainerCard from '@/components/ComponentContainerCard'
import { AddFundModal } from '@/app/(admin)/base-ui/modals/components/AllModals'
// import { fetchFunds } from '@/lib/api/fund'
import { decryptPayload } from '@/lib/utils/decrypt' 
import { fetchFunds } from '@/lib/api/fund' 
import { getUserRolePermissions } from '@/helpers/getUserPermissions'
import { canModuleAction } from '@/helpers/permissionActions'
import { jwtDecode } from 'jwt-decode'
// ----------- AG Grid-related imports -----------

// IMPORTANT: import ClientSideRowModelModule
import { ClientSideRowModelModule } from 'ag-grid-community'

// Dynamically import AgGridReact to avoid SSR issues in Next.js
const AgGridReact = dynamic(() => import('ag-grid-react').then((mod) => mod.AgGridReact), { ssr: false })

const FundListPage = () => {
  const [columnDefs, setColumnDefs] = useState([])
  const [rowData, setRowData] = useState([])
  const [funds, setFunds] = useState([])
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()

  // Permissions (using userAuthToken cookie which has role_id)
  const [permissions, setPermissions] = useState([])
  const [loadingPermissions, setLoadingPermissions] = useState(true)

  useEffect(() => {
    let ignore = false

    const fetchPermissions = async () => {
      try {
        setLoadingPermissions(true)

        // Only use userAuthToken (has user_id, org_id, role_id) - don't fallback to userToken
        // Try multiple ways to get the cookie
        let userAuthToken = Cookies.get('userAuthToken')
        
        // If not found, try reading from document.cookie directly
        if (!userAuthToken && typeof document !== 'undefined') {
          const cookieString = document.cookie || ''
          const match = cookieString.match(/(?:^|; )userAuthToken=([^;]*)/)
          if (match) {
            userAuthToken = decodeURIComponent(match[1])
            console.log('✅ Fund page - Found userAuthToken in document.cookie')
          }
        }

        // Log all cookies for debugging
        if (typeof document !== 'undefined') {
          console.log('📋 All cookies:', document.cookie)
          console.log('📋 Cookies.get results:', {
            userAuthToken: !!Cookies.get('userAuthToken'),
            userToken: !!Cookies.get('userToken'),
            dashboardToken: !!Cookies.get('dashboardToken'),
          })
        }

        if (!userAuthToken) {
          console.warn('⚠️ Fund page - No userAuthToken found in cookies')
          if (!ignore) setPermissions([])
          return
        }

        console.log('✅ Fund page - Found userAuthToken, length:', userAuthToken.length)

        // Decode userAuthToken to get user_id, org_id, and role_id
        let tokenData = null
        try {
          tokenData = jwtDecode(userAuthToken)
          console.log('🔍 Fund page - Decoded userAuthToken:', {
            user_id: tokenData?.user_id || tokenData?.id || tokenData?.userId,
            role_id: tokenData?.role_id || tokenData?.roleId,
            org_id: tokenData?.org_id || tokenData?.organization_id || tokenData?.orgId,
            allKeys: Object.keys(tokenData || {}), // Show all keys for debugging
          })
        } catch (decodeError) {
          console.error('❌ Fund page - Error decoding userAuthToken:', decodeError)
          if (!ignore) setPermissions([])
          return
        }

        if (!tokenData) {
          if (!ignore) setPermissions([])
          return
        }

        // Verify we have required fields (user_id, org_id, role_id)
        const userId = tokenData?.user_id || tokenData?.id || tokenData?.userId
        const roleId = tokenData?.role_id || tokenData?.roleId
        const orgId = tokenData?.org_id || tokenData?.organization_id || tokenData?.orgId

        if (!roleId || !orgId) {
          console.warn('⚠️ Fund page - userAuthToken missing required fields:', {
            hasUserId: !!userId,
            hasRoleId: !!roleId,
            hasOrgId: !!orgId,
            tokenData,
          })
          if (!ignore) setPermissions([])
          return
        }

        // Prefer permissions present in token (if any), otherwise fetch from API using role_id and org_id
        let perms = []
        if (Array.isArray(tokenData?.permissions)) {
          perms = tokenData.permissions
          console.log('✅ Fund page - Using permissions from userAuthToken:', perms.length)
        } else {
          // Fetch permissions using tokenData (which contains role_id and org_id from userAuthToken)
          perms = await getUserRolePermissions(tokenData)
          console.log('✅ Fund page - Fetched permissions from API using role_id and org_id:', perms.length)
        }

        if (!ignore) setPermissions(Array.isArray(perms) ? perms : [])
      } catch (e) {
        console.error('❌ Error fetching fund permissions:', e)
        if (!ignore) setPermissions([])
      } finally {
        if (!ignore) setLoadingPermissions(false)
      }
    }

    fetchPermissions()
    return () => {
      ignore = true
    }
  }, [])

  const canAdd = canModuleAction(permissions, ['fund', 'funds'], 'can_add')

  // Logout handler
  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      const res = await fetch('/api/logout', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      const logoutJson = await res.json().catch(() => ({}))
      console.log('🔒 Logout response:', logoutJson)

      // Clear cookies client-side
      Cookies.remove('dashboardToken', { path: '/' })
      Cookies.remove('userToken', { path: '/' })
      
      // Clear any client-side leftovers
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      sessionStorage.clear()

      // Redirect to sign-in
      router.replace('/auth/sign-in')
    } catch (e) {
      console.error('Logout failed:', e)
      // Still clear cookies and redirect even if API call fails
      Cookies.remove('dashboardToken', { path: '/' })
      Cookies.remove('userToken', { path: '/' })
      router.replace('/auth/sign-in')
    } finally {
      setLoggingOut(false)
    }
  }

  // Make sure this is declared in the same component scope and BEFORE JSX uses it
  const refreshFunds = useCallback(async () => {
    try {
      console.log('🔄 Refreshing funds list...')
      const data = await fetchFunds()
      console.log('📦 Raw API response:', data)
      
      // Handle different response structures:
      // 1. { funds: [...] } - standard structure
      // 2. [...] - direct array
      // 3. { data: { funds: [...] } } - nested structure
      // 4. { data: [...] } - data as array
      let fundsList = []
      
      if (Array.isArray(data)) {
        fundsList = data
        console.log('✅ Funds found (direct array):', fundsList.length)
      } else if (Array.isArray(data?.funds)) {
        fundsList = data.funds
        console.log('✅ Funds found (data.funds):', fundsList.length)
      } else if (Array.isArray(data?.data?.funds)) {
        fundsList = data.data.funds
        console.log('✅ Funds found (data.data.funds):', fundsList.length)
      } else if (Array.isArray(data?.data)) {
        fundsList = data.data
        console.log('✅ Funds found (data.data):', fundsList.length)
      } else if (data?.payload) {
        // If response has payload property, it might be encrypted
        console.log('🔐 Attempting to decrypt payload...')
        
        // Try to decrypt the payload
        const decryptedData = decryptPayload(data.payload)
        
        if (decryptedData) {
          console.log('✅ Successfully decrypted payload:', decryptedData)
          
          // Check if decrypted data contains funds
          if (Array.isArray(decryptedData)) {
            fundsList = decryptedData
            console.log('✅ Funds found in decrypted payload (direct array):', fundsList.length)
          } else if (Array.isArray(decryptedData?.funds)) {
            fundsList = decryptedData.funds
            console.log('✅ Funds found in decrypted payload (funds property):', fundsList.length)
          } else if (Array.isArray(decryptedData?.data)) {
            fundsList = decryptedData.data
            console.log('✅ Funds found in decrypted payload (data property):', fundsList.length)
          } else {
            console.warn('⚠️ Decrypted payload does not contain funds array:', {
              type: typeof decryptedData,
              keys: Object.keys(decryptedData || {}),
              sample: JSON.stringify(decryptedData).substring(0, 200)
            })
          }
        } else {
          console.error('❌ Failed to decrypt payload')
          
          // Fallback: Check if there are other properties that might contain funds
          const allKeys = Object.keys(data)
          for (const key of allKeys) {
            if (key !== 'payload' && Array.isArray(data[key])) {
              fundsList = data[key]
              console.log(`✅ Funds found in property "${key}":`, fundsList.length)
              break
            }
          }
        }
        
        if (fundsList.length === 0) {
          console.error('❌ No funds array found after decryption attempt.')
        }
      } else {
        console.warn('⚠️ Unexpected API response structure:', {
          type: typeof data,
          isArray: Array.isArray(data),
          keys: data ? Object.keys(data) : 'null/undefined',
          sample: data ? JSON.stringify(data).substring(0, 200) : 'null',
          fullResponse: data
        })
        fundsList = []
      }
      
      console.log('📊 Setting row data with', fundsList.length, 'funds')
      setRowData(fundsList)
    } catch (error) {
      console.error('❌ Error fetching funds data:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      setRowData([])
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/assets/tychiData/columnDefs')
        .then((module) => setColumnDefs(module.fundColDefs || []))
        .catch((err) => {
          console.error('Error loading column definitions:', err)
          setColumnDefs([])
        })

      // initial load
      refreshFunds()
    }
  }, [refreshFunds])

  const defaultColDef = { resizable: true, sortable: true, filter: true }

  return (
    <ComponentContainerCard id="static-backdrop">
      <PageTitle title="Fundadmin" subName="Tychi" />
      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
              <CardTitle as="h4">Fundadmin</CardTitle>
              <div className="d-flex gap-2 align-items-center">
                <Dropdown>
                  {!loadingPermissions && canAdd && (
                    <AddFundModal
                      onFundCreated={() => {
                        refreshFunds()
                      }}
                    />
                  )}
                </Dropdown>
                <Button 
                  variant="danger" 
                  onClick={handleLogout} 
                  disabled={loggingOut}
                  className="d-flex align-items-center gap-1"
                >
                  <IconifyIcon icon="ri:logout-box-line" className="fs-18" />
                  <span>{loggingOut ? 'Logging out…' : 'Logout'}</span>
                </Button>
              </div>
            </CardHeader>

            <CardBody className="p-0">
              <div className="ag-theme-alpine" style={{ width: '100%', height: '400px' }}>
                <AgGridReact
                  // Register the client-side row model module
                  modules={[ClientSideRowModelModule]}
                  // If you explicitly set rowModelType, keep it as "clientSide" or omit if you prefer the default
                  rowModelType="clientSide"
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  rowData={rowData}
                  pagination={true}
                  paginationPageSize={10}
                />
              </div>
            </CardBody>

            <CardFooter>
              {/* Custom pagination UI (optional) 
                  If you prefer AG Grid’s built-in pagination, you can remove or hide this. */}
              <nav aria-label="Page navigation example">
                <ul className="pagination justify-content-end mb-0">
                  <li className="page-item">
                    <a className="page-link">Previous</a>
                  </li>
                  <li className="page-item active">
                    <a className="page-link">1</a>
                  </li>
                  <li className="page-item">
                    <a className="page-link">2</a>
                  </li>
                  <li className="page-item">
                    <a className="page-link">3</a>
                  </li>
                  <li className="page-item">
                    <a className="page-link">Next</a>
                  </li>
                </ul>
              </nav>
            </CardFooter>
          </Card>
        </Col>
      </Row>
    </ComponentContainerCard>
  )
}

export default FundListPage
