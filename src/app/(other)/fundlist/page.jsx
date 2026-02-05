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
import { getUserRolePermissions } from '@/helpers/getUserPermissions'
import { canModuleAction } from '@/helpers/permissionActions'
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
  const [permissions, setPermissions] = useState([])
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
            setPermissions([])
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
            setPermissions([])
            setLoadingPermissions(false)
          }
          return
        }

        if (!tokenData) {
          if (!ignore) {
            setPermissions([])
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
            setPermissions([])
            setLoadingPermissions(false)
          }
          return
        }

        console.log('📡 Fund page - Fetching user data and permissions')

        let perms = []
        
        // Check if permissions are in token first
        if (tokenData?.permissions && Array.isArray(tokenData.permissions)) {
          perms = tokenData.permissions
          console.log('✅ Fund page - Using permissions from token:', perms.length)
        } else {
          // Step 1: Use /api/v1/users/me to get current user's role_id and org_id
          let roleId = null
          let orgId = null
          
          try {
            console.log('📡 Fund page - Fetching current user data from /api/v1/users/me')
            const userResponse = await api.get('/api/v1/me')
            const userData = userResponse.data?.data || userResponse.data
            console.log('✅ Fund page - Fetched user data:', userData)
            
            roleId = userData?.role_id || userData?.roleId || userData?.role?.role_id || userData?.role?.id
            orgId = userData?.org_id || userData?.organization_id || userData?.organization?.org_id
            
            console.log('✅ Fund page - Extracted role_id and org_id:', { roleId, orgId })
          } catch (userError) {
            console.error('❌ Fund page - Error fetching user data from /api/v1/users/me:', userError)
            console.error('Error details:', userError.response?.data || userError.message)
          }

          // Step 2: Fetch permissions using role_id and org_id
          if (roleId && orgId) {
            try {
              console.log('📡 Fund page - Fetching role permissions for roleId:', roleId, 'orgId:', orgId)
              const rolesResponse = await api.get(`/api/v1/roles/org/${orgId}/with-permissions`)
              const roles = rolesResponse.data?.data || rolesResponse.data || []
              
              // Find the user's role
              const userRole = Array.isArray(roles) 
                ? roles.find(r => {
                    const rId = r.role_id || r.id
                    return rId == roleId || String(rId) === String(roleId)
                  })
                : null

              if (userRole && userRole.permissions) {
                perms = Array.isArray(userRole.permissions) ? userRole.permissions : []
                console.log('✅ Fund page - Fetched permissions from API:', {
                  count: perms.length,
                  permissions: perms,
                })
                
                // Log the full role response to see structure
                console.log('🔍 Fund page - Full role response structure:', {
                  roleId: userRole.role_id || userRole.id,
                  roleName: userRole.role_name || userRole.name,
                  permissionsCount: perms.length,
                  permissionsType: typeof userRole.permissions,
                  permissionsIsArray: Array.isArray(userRole.permissions),
                  roleKeys: Object.keys(userRole || {}),
                })
                
                // Log all module keys to see what's available (with case)
                const moduleKeys = perms.map(p => p?.module_key || p?.moduleKey || p?.module).filter(Boolean)
                console.log('📋 Fund page - Available module keys (with case):', moduleKeys)
                console.log('📋 Fund page - Available module keys (lowercase):', moduleKeys.map(k => k?.toLowerCase()))
                
                // Log first few permissions to see structure
                if (perms.length > 0) {
                  console.log('📦 Fund page - First 3 permissions structure:', perms.slice(0, 3).map(p => ({
                    module_key: p?.module_key || p?.moduleKey || p?.module,
                    can_add: p?.can_add,
                    can_view: p?.can_view,
                    can_edit: p?.can_edit,
                    can_delete: p?.can_delete,
                    fund_id: p?.fund_id || p?.fundId,
                    allKeys: Object.keys(p || {}),
                  })))
                }
                
                // Check specifically for fund/funds module (case-insensitive)
                // Also check for FUND (uppercase) explicitly
                const fundPerms = perms.filter(p => {
                  const moduleKey = (p?.module_key || p?.moduleKey || p?.module || '').toString()
                  const moduleKeyLower = moduleKey.toLowerCase()
                  return moduleKeyLower === 'fund' || moduleKeyLower === 'funds' || moduleKey === 'FUND' || moduleKey === 'FUNDS'
                })
                console.log('🔍 Fund page - Fund module permissions found:', fundPerms.length)
                if (fundPerms.length > 0) {
                  console.log('✅ Fund page - Fund permissions details:', fundPerms.map(p => ({
                    module_key: p?.module_key || p?.moduleKey,
                    can_add: p?.can_add,
                    can_view: p?.can_view,
                    can_edit: p?.can_edit,
                    can_delete: p?.can_delete,
                    fund_id: p?.fund_id || p?.fundId,
                    allFields: p,
                  })))
                } else {
                  // If no fund permissions found, log all permissions to see what we have
                  console.log('⚠️ Fund page - No FUND permissions found. All permissions:', perms.map(p => ({
                    module_key: p?.module_key || p?.moduleKey || p?.module,
                    module_key_lower: (p?.module_key || p?.moduleKey || p?.module || '').toString().toLowerCase(),
                    can_add: p?.can_add,
                    fund_id: p?.fund_id || p?.fundId,
                  })))
                }
                
                // If no fund module found, check role structure for organization-level permissions
                if (fundPerms.length === 0) {
                  console.log('⚠️ Fund page - No fund module found in permissions. Checking role structure:', {
                    role: userRole,
                    roleKeys: Object.keys(userRole || {}),
                    hasOrgPermissions: !!userRole?.organization_permissions,
                    hasOrgLevel: !!userRole?.org_level,
                  })
                  
                  // Check for organization-level permissions (permissions without fund_id)
                  const orgLevelPerms = perms.filter(p => {
                    const hasNoFundId = !p?.fund_id && !p?.fundId
                    const moduleKey = (p?.module_key || p?.moduleKey || p?.module || '').toString().toLowerCase()
                    return hasNoFundId && (moduleKey === 'fund' || moduleKey === 'funds')
                  })
                  console.log('🔍 Fund page - Organization-level fund permissions:', orgLevelPerms.length, orgLevelPerms)
                }
              } else {
                console.warn('⚠️ Fund page - User role found but no permissions:', userRole)
                console.log('🔍 Fund page - Full role structure:', {
                  role: userRole,
                  roleKeys: Object.keys(userRole || {}),
                  hasPermissions: !!userRole?.permissions,
                  permissionsType: typeof userRole?.permissions,
                })
              }
            } catch (permError) {
              console.error('❌ Fund page - Error fetching permissions:', permError)
              console.error('Error details:', permError?.response?.data || permError?.message)
              perms = []
            }
          } else {
            console.warn('⚠️ Fund page - Cannot fetch permissions: missing roleId or orgId', {
              roleId,
              orgId,
            })
          }
        }

        // Set permissions array
        if (!ignore) {
          setPermissions(Array.isArray(perms) ? perms : [])
        }
      } catch (e) {
        console.error('❌ Fund page - Error fetching permissions:', e)
        if (!ignore) {
          setPermissions([])
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

  // Check if user has can_add permission for fund/funds module
  // Check with both lowercase and uppercase (FUND) to handle all cases
  const canAdd = canModuleAction(permissions, ['fund', 'funds', 'FUND', 'FUNDS'], 'can_add', null) || 
                 canModuleAction(permissions, ['fund', 'funds', 'FUND', 'FUNDS'], 'can_add')
  
  // Log permission check for debugging
  console.log('🔍 Fund page - Permission check result:', {
    canAdd,
    loadingPermissions,
    totalPermissions: permissions.length,
    permissions: permissions,
    willShowAddButton: !loadingPermissions && canAdd,
  })
  
  if (permissions.length > 0) {
    const fundPerms = permissions.filter(p => {
      const moduleKey = (p?.module_key || p?.moduleKey || p?.module || '').toString().toLowerCase()
      return moduleKey === 'fund' || moduleKey === 'funds'
    })
    console.log('🔍 Fund page - Fund permissions details:', {
      fundPermissions: fundPerms.length,
      fundPermsDetails: fundPerms.map(p => ({
        module_key: p?.module_key || p?.moduleKey,
        can_add: p?.can_add,
        can_view: p?.can_view,
        can_edit: p?.can_edit,
        can_delete: p?.can_delete,
        fund_id: p?.fund_id || p?.fundId,
      })),
    })
  } else {
    console.warn('⚠️ Fund page - No permissions found!', {
      permissionsArray: permissions,
      permissionsLength: permissions.length,
      loadingPermissions,
    })
  }

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
