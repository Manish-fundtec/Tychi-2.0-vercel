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
import { useUserToken } from '@/hooks/useUserToken'
import { useDashboardToken } from '@/hooks/useDashboardToken'
import { getUserRolePermissions } from '@/helpers/getUserPermissions'
import { canModuleAction } from '@/helpers/permissionActions'
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

  // Permissions (same pattern as Trades page)
  const userToken = useUserToken()
  const dashboardToken = useDashboardToken()
  const [permissions, setPermissions] = useState([])
  const [loadingPermissions, setLoadingPermissions] = useState(true)

  useEffect(() => {
    let ignore = false

    const fetchPermissions = async () => {
      try {
        setLoadingPermissions(true)

        const tokenData = userToken || dashboardToken
        if (!tokenData) {
          if (!ignore) setPermissions([])
          return
        }

        // Prefer permissions present in token (if any), otherwise fetch from API
        let perms = []
        if (Array.isArray(tokenData?.permissions)) {
          perms = tokenData.permissions
        } else {
          perms = await getUserRolePermissions(tokenData)
        }

        if (!ignore) setPermissions(Array.isArray(perms) ? perms : [])
      } catch (e) {
        console.error('Error fetching fund permissions:', e)
        if (!ignore) setPermissions([])
      } finally {
        if (!ignore) setLoadingPermissions(false)
      }
    }

    fetchPermissions()
    return () => {
      ignore = true
    }
  }, [userToken, dashboardToken])

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
