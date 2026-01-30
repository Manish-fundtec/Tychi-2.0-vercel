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
import { fetchFunds } from '@/lib/api/fund' 
import api from '@/lib/api/axios'
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

  // Permissions state
  const [canAdd, setCanAdd] = useState(false)
  const [loadingPermissions, setLoadingPermissions] = useState(true)

  useEffect(() => {
    let ignore = false

    const fetchPermissions = async () => {
      try {
        setLoadingPermissions(true)

        // Extract userAuthToken from cookies
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

        if (!userAuthToken) {
          console.warn('⚠️ Fund page - No userAuthToken found in cookies')
          if (!ignore) {
            setCanAdd(false)
            setLoadingPermissions(false)
          }
          return
        }

        console.log('✅ Fund page - Found userAuthToken, length:', userAuthToken.length)

        // Decode userAuthToken to get user_id
        let tokenData = null
        try {
          tokenData = jwtDecode(userAuthToken)
          console.log('🔍 Fund page - Decoded userAuthToken:', {
            user_id: tokenData?.user_id || tokenData?.id || tokenData?.userId || tokenData?.username || tokenData?.sub,
            username: tokenData?.username,
            sub: tokenData?.sub,
            allKeys: Object.keys(tokenData || {}),
          })
        } catch (decodeError) {
          console.error('❌ Fund page - Error decoding userAuthToken:', decodeError)
          if (!ignore) {
            setCanAdd(false)
            setLoadingPermissions(false)
          }
          return
        }

        if (!tokenData) {
          if (!ignore) {
            setCanAdd(false)
            setLoadingPermissions(false)
          }
          return
        }

        // Extract user_id from token - check username and sub fields as well
        // In Cognito tokens, username or sub often contains the user identifier
        const userId = tokenData?.user_id || tokenData?.id || tokenData?.userId || tokenData?.username || tokenData?.sub

        if (!userId) {
          console.warn('⚠️ Fund page - userAuthToken missing user_id:', {
            tokenData,
          })
          if (!ignore) {
            setCanAdd(false)
            setLoadingPermissions(false)
          }
          return
        }

        console.log('📡 Fund page - Fetching user data for userId:', userId)

        // Step 1: Call /api/v1/users/me to fetch the latest role_id from the database
        let userData = null
        try {
          const userResponse = await api.get('/api/v1/users/me', {
            withCredentials: true,
          })
          userData = userResponse.data?.data || userResponse.data
          console.log('✅ Fund page - Fetched user data from /api/v1/users/me:', {
            user_id: userData?.user_id || userData?.id,
            role_id: userData?.role_id || userData?.roleId,
          })
        } catch (userError) {
          console.error('❌ Fund page - Error fetching user data from /api/v1/users/me:', userError)
          console.error('Error details:', userError.response?.data || userError.message)
          if (!ignore) {
            setCanAdd(false)
            setLoadingPermissions(false)
          }
          return
        }

        if (!userData) {
          console.warn('⚠️ Fund page - No user data returned from /api/v1/users/me')
          if (!ignore) {
            setCanAdd(false)
            setLoadingPermissions(false)
          }
          return
        }

        // Step 2: Call /api/v1/users/me/permissions to get permissions based on role_id
        let permissionsData = null
        try {
          const permissionsResponse = await api.get('/api/v1/users/me/permissions', {
            withCredentials: true,
          })
          permissionsData = permissionsResponse.data?.data || permissionsResponse.data
          console.log('✅ Fund page - Fetched permissions from /api/v1/users/me/permissions:', permissionsData)
        } catch (permissionsError) {
          console.error('❌ Fund page - Error fetching permissions from /api/v1/users/me/permissions:', permissionsError)
          console.error('Error details:', permissionsError.response?.data || permissionsError.message)
          if (!ignore) {
            setCanAdd(false)
            setLoadingPermissions(false)
          }
          return
        }

        if (!permissionsData) {
          console.warn('⚠️ Fund page - No permissions data returned from /api/v1/users/me/permissions')
          if (!ignore) {
            setCanAdd(false)
            setLoadingPermissions(false)
          }
          return
        }

        // Step 3: Check if the user has can_add permission for the 'fund' or 'funds' module
        // The permissions endpoint should return a structure like:
        // { modules: { fund: { can_add: true, ... }, funds: { can_add: true, ... } } }
        const modules = permissionsData?.modules || permissionsData
        const fundModule = modules?.fund || modules?.Fund
        const fundsModule = modules?.funds || modules?.Funds

        const hasCanAdd = 
          (fundModule && (fundModule.can_add === true || fundModule.can_add === 1 || fundModule.can_add === '1' || fundModule.can_add === 'true')) ||
          (fundsModule && (fundsModule.can_add === true || fundsModule.can_add === 1 || fundsModule.can_add === '1' || fundsModule.can_add === 'true'))

        console.log('🔍 Fund page - Permission check:', {
          modules: Object.keys(modules || {}),
          fundModule: fundModule ? { can_add: fundModule.can_add } : null,
          fundsModule: fundsModule ? { can_add: fundsModule.can_add } : null,
          hasCanAdd,
        })

        if (!ignore) {
          setCanAdd(hasCanAdd)
        }
      } catch (e) {
        console.error('❌ Fund page - Error fetching permissions:', e)
        if (!ignore) {
          setCanAdd(false)
        }
      } finally {
        if (!ignore) {
          setLoadingPermissions(false)
        }
      }
    }

    fetchPermissions()
    return () => {
      ignore = true
    }
  }, [])

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
      const data = await fetchFunds()
      if (data?.funds) {
        setRowData(data.funds)
      } else {
        console.error('Unexpected API response structure:', data)
        setRowData([])
      }
    } catch (error) {
      console.error('Error fetching funds data:', error)
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
