'use client'

import React, { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { FaPlusSquare, FaMinusSquare } from 'react-icons/fa'
import api from '../../../lib/api/axios'
import { jwtDecode } from 'jwt-decode'
import { ModuleRegistry } from 'ag-grid-community'
import { ClientSideRowModelModule } from 'ag-grid-community'
import { useDashboardToken } from '@/hooks/useDashboardToken'
import { useUserToken } from '@/hooks/useUserToken'
import { getUserRolePermissions } from '@/helpers/getUserPermissions'
import { canModuleAction } from '@/helpers/permissionActions'

ModuleRegistry.registerModules([ClientSideRowModelModule])
const AgGridReact = dynamic(() => import('ag-grid-react').then((mod) => mod.AgGridReact), { ssr: false })
const GLEntryModal = dynamic(() => import('@/app/(admin)/base-ui/modals/components/AllModals').then((mod) => mod.GLEntryModal), { ssr: false })
AgGridReact.prototype.modules = [ClientSideRowModelModule]

const ReviewsPage = () => {
  const gridRef = useRef(null)
  const [chartOfAccountsData, setChartOfAccountsData] = useState([])
  const [expandedNodes, setExpandedNodes] = useState({})
  const [loading, setLoading] = useState(true)
  const [fundId, setFundId] = useState('')
  const [expandedKeys, setExpandedKeys] = useState(() => new Set())

  // Permissions state
  const [permissions, setPermissions] = useState([])
  const [loadingPermissions, setLoadingPermissions] = useState(true)

  // Hooks - must be declared before useEffects that use them
  const dashboard = useDashboardToken()
  const userToken = useUserToken()
  
  // Derived values from hooks
  const fund_id = dashboard?.fund_id || fundId || ''

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const Cookies = require('js-cookie')
      const dashboardToken = Cookies.get('dashboardToken')
      if (dashboardToken) {
        try {
          const decodedToken = jwtDecode(dashboardToken)
          console.log('Decoded Token for chartofaccounts page :', decodedToken)
          setFundId(decodedToken.fund_id)
        } catch (error) {
          console.error('Error decoding the token:', error)
        }
      }
    }
  }, [])

  // Fetch user permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      // Use dashboard first, then fallback to userToken
      const tokenData = dashboard || userToken;
      
      if (!tokenData) {
        console.warn('⚠️ Chart of Accounts - No tokenData available yet, will retry when token loads');
        return;
      }
      
      // Extract fields with all possible field name variations
      const userId = tokenData?.user_id || tokenData?.id || tokenData?.userId || tokenData?.sub;
      const roleId = tokenData?.role_id || tokenData?.roleId;
      const orgId = tokenData?.org_id || tokenData?.organization_id || tokenData?.orgId;
      
      // Ensure we have at least user_id or org_id to fetch permissions
      const hasUserId = !!userId;
      const hasOrgId = !!orgId;
      
      if (!hasUserId && !hasOrgId) {
        console.warn('⚠️ Chart of Accounts - Token missing user_id and org_id, cannot fetch permissions');
        setLoadingPermissions(false);
        return;
      }
      
      try {
        setLoadingPermissions(true);
        const currentFundId = fund_id || fundId;
        
        // Check if permissions are in token first, otherwise fetch from API
        let perms = [];
        
        if (tokenData?.permissions && Array.isArray(tokenData.permissions)) {
          // Permissions are in token - filter by fundId if provided
          perms = tokenData.permissions;
          
          if (currentFundId) {
            perms = perms.filter(p => {
              const pFundId = p?.fund_id || p?.fundId;
              return pFundId == currentFundId || String(pFundId) === String(currentFundId);
            });
          }
        } else {
          // Permissions not in token - fetch from API
          try {
            perms = await getUserRolePermissions(tokenData, currentFundId);
          } catch (permError) {
            console.error('❌ Chart of Accounts - getUserRolePermissions ERROR:', permError);
            perms = [];
          }
        }
        
        const permissionsToSet = Array.isArray(perms) ? perms : [];
        setPermissions(permissionsToSet);
      } catch (error) {
        console.error('❌ Chart of Accounts - Error fetching permissions:', error);
        setPermissions([]);
      } finally {
        setLoadingPermissions(false);
      }
    };
    
    fetchPermissions();
  }, [userToken, dashboard, fund_id, fundId]);

  // Permission checks for chart of accounts module
  const currentFundId = fund_id || fundId;
  // Try multiple possible module key variations (normalization handles case-insensitive matching)
  const canAdd = canModuleAction(permissions, [
    'CHART_OF_ACCOUNTS',  // Backend sends this in uppercase
    'chart_of_accounts', 
    'chartofaccounts', 
    'chart_of_account', 
    'coa', 
    'gl_account',
    'gl_accounts',
    'general_ledger',
    'general_ledger_account'
  ], 'can_add', currentFundId);
  
  // Debug logging
  useEffect(() => {
    const chartOfAccountsPerms = permissions.filter(p => {
      const moduleKey = (p?.module_key || p?.moduleKey || '').toString().toLowerCase();
      return moduleKey === 'chart_of_accounts' || 
             moduleKey === 'chartofaccounts' || 
             moduleKey === 'coa' || 
             moduleKey === 'gl_account';
    });
    
    console.log('🔐 Chart of Accounts - Permission check:', {
      loadingPermissions,
      permissionsCount: permissions.length,
      currentFundId,
      canAdd,
      canAddType: typeof canAdd,
      willShowButton: !loadingPermissions && canAdd === true,
      allPermissions: permissions.map(p => ({
        module_key: p?.module_key || p?.moduleKey,
        can_add: p?.can_add,
        can_add_type: typeof p?.can_add,
        fund_id: p?.fund_id || p?.fundId,
      })),
      chartOfAccountsPermissions: chartOfAccountsPerms.map(p => ({
        module_key: p?.module_key || p?.moduleKey,
        can_add: p?.can_add,
        can_add_type: typeof p?.can_add,
        fund_id: p?.fund_id || p?.fundId,
      })),
    });
  }, [loadingPermissions, permissions, canAdd, currentFundId]);

  useEffect(() => {
    if (fundId) {
      const getChartOfAccounts = async () => {
        try {
          setLoading(true)

          const response = await api.get(`/api/v1/chart-of-accounts/fund/${fundId}`)
          const data = response.data.data

          console.log('Fetched Hierarchical Chart of Accounts Data:', data)

          if (!data || data.length === 0) {
            console.log('No data found or empty array returned')
          }

          setChartOfAccountsData(data)
        } catch (error) {
          console.error('Error fetching chart of accounts:', error)
        } finally {
          setLoading(false)
        }
      }

      getChartOfAccounts()
    }
  }, [fundId])

  // helpers
  const isExpanded = (key) => expandedKeys.has(String(key))
  const toggleExpand = (key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      const k = String(key)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }
  // expects each node like: { gl_code, gl_name, gl_balance_type, children: [...] }
  const flattenData = (nodes, depth = 0, parentKey = null) => {
    const out = []
    for (const n of nodes || []) {
      const key = String(n.gl_code) // or n.coa_id
      const children = n.children || []
      const expanded = isExpanded(key) // default you can choose true for roots

      out.push({
        ...n,
        key,
        parentKey,
        depth,
        hasChildren: children.length > 0,
      })

      if (children.length && expanded) {
        out.push(...flattenData(children, depth + 1, key))
      }
    }
    return out
  }

  const columnDefs = [
    {
      field: 'gl_name',
      headerName: 'Account Name',
      flex: 2,
      sortable: true,
      filter: true,
      cellRenderer: (params) => {
        const row = params.data
        if (!row) return null
        return (
          <div style={{ paddingLeft: `${row.depth * 20}px`, display: 'flex', alignItems: 'center' }}>
            {row.hasChildren && (
              <button
                type="button"
                className="btn btn-sm btn-link p-0 me-2"
                onClick={() => toggleExpand(row.key)}
                style={{ border: 'none', background: 'none' }}>
                {isExpanded(row.key) ? <FaMinusSquare /> : <FaPlusSquare />}
              </button>
            )}
            {row.gl_name}
          </div>
        )
      },
    },
    { field: 'gl_code', headerName: 'Account Code', sortable: true, filter: true, flex: 1 },
    { field: 'gl_balance_type', headerName: 'Balance Type', sortable: true, filter: true, flex: 1 },
  ]

  // fetch function unchanged
  const fetchCoa = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/chart-of-accounts/fund/${fundId}`)
      setChartOfAccountsData(res.data?.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (fundId) fetchCoa()
  }, [fundId])

  // When modal saves:
  const handleCoaSaved = (opts) => {
    // optional: auto expand parent if provided
    if (opts?.parent_gl_code) {
      setExpandedKeys((prev) => {
        const next = new Set(prev)
        next.add(String(opts.parent_gl_code))
        return next
      })
    }
    fetchCoa() // will preserve expandedKeys because it’s separate state
  }

  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Chart of Accounts</CardTitle>
            {!loadingPermissions && canAdd === true && <GLEntryModal onSaved={handleCoaSaved} />}
          </CardHeader>
          <CardBody>
            <div>
              {loading ? (
                <div>Loading...</div>
              ) : (
                <AgGridReact
                  columnDefs={columnDefs}
                  rowData={flattenData(chartOfAccountsData)}
                  // (you no longer need treeData=true since we’re flattening ourselves)
                  domLayout="autoHeight"
                  animateRows
                  rowSelection="single"
                  getRowHeight={(p) => (p.data.depth > 0 ? 50 : 60)}
                  pagination
                  paginationPageSize={10}
                />
              )}
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default ReviewsPage

// 'use client'

// import React, { useState, useRef, useEffect } from 'react'
// import dynamic from 'next/dynamic'
// import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
// import { FaPlusSquare, FaMinusSquare } from 'react-icons/fa'
// import api from '../../../lib/api/axios'
// import { jwtDecode } from 'jwt-decode'
// import { ModuleRegistry } from 'ag-grid-community';
// import { ClientSideRowModelModule } from 'ag-grid-community';

// ModuleRegistry.registerModules([ClientSideRowModelModule]);
// const AgGridReact = dynamic(() => import('ag-grid-react').then((mod) => mod.AgGridReact), { ssr: false })
// const GLEntryModal = dynamic(() => import('@/app/(admin)/base-ui/modals/components/AllModals').then((mod) => mod.GLEntryModal), { ssr: false })
// AgGridReact.prototype.modules = [ClientSideRowModelModule];

// const ReviewsPage = () => {
//   const gridRef = useRef(null)
//   const [chartOfAccountsData, setChartOfAccountsData] = useState([])
//   const [expandedNodes, setExpandedNodes] = useState({})
//   const [loading, setLoading] = useState(true)
//   const [fundId, setFundId] = useState('')

//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const Cookies = require('js-cookie')
//       const dashboardToken = Cookies.get('dashboardToken')
//       if (dashboardToken) {
//         try {
//           const decodedToken = jwtDecode(dashboardToken)
//           console.log('Decoded Token for chartofaccounts page :', decodedToken)
//           setFundId(decodedToken.fund_id)
//         } catch (error) {
//           console.error('Error decoding the token:', error)
//         }
//       }
//     }
//   }, [])

//   useEffect(() => {
//     if (fundId) {
//       const getChartOfAccounts = async () => {
//         try {
//           setLoading(true);

//           const response = await api.get(`/api/v1/chart-of-accounts/fund/${fundId}`);
//           const data = response.data.data;

//           console.log('Fetched Hierarchical Chart of Accounts Data:', data);

//           if (!data || data.length === 0) {
//             console.log('No data found or empty array returned');
//           }

//           setChartOfAccountsData(data);
//         } catch (error) {
//           console.error('Error fetching chart of accounts:', error);
//         } finally {
//           setLoading(false);
//         }
//       };

//       getChartOfAccounts();
//     }
//   }, [fundId]);

//   // Function to toggle expansion of rows in AG Grid
//   const toggleExpand = (id) => {
//     setExpandedNodes((prevState) => ({
//       ...prevState,
//       [id]: !prevState[id],
//     }))
//   }

//   const flattenData = (data, depth = 0, parentId = '') => {
//     return data.flatMap((item, index) => {
//       const id = `${parentId}-${index}`
//       const isExpanded = expandedNodes[id] ?? true
//       const children = item.children || []

//       return [
//         { ...item, id, depth, hasChildren: children.length > 0 },
//         ...(isExpanded ? flattenData(children, depth + 1, id) : []),
//       ]
//     })
//   }

//   const columnDefs = [
//     {
//       field: 'gl_name',
//       headerName: 'Account Name',
//       sortable: true,
//       filter: true,
//       width: 300,
//       flex: 2,
//       cellRenderer: (params) => {
//         const { data } = params
//         if (!data) return null

//         return (
//           <div style={{ paddingLeft: `${data.depth * 20}px`, display: 'flex', alignItems: 'center' }}>
//             {data.hasChildren && (
//               <button onClick={() => toggleExpand(data.id)} className="btn btn-sm btn-link p-0 me-2" style={{ border: 'none', background: 'none' }}>
//                 {expandedNodes[data.id] ? <FaMinusSquare /> : <FaPlusSquare />}
//               </button>
//             )}
//             {data.gl_name}
//           </div>
//         )
//       },
//     },
//     { field: 'gl_code', headerName: 'Account Code', sortable: true, filter: true, flex: 1 },
//     { field: 'gl_balance_type', headerName: 'Balance Type', sortable: true, filter: true, flex: 1 },
//   ]

//   return (
//     <Row>
//       <Col xl={12}>
//         <Card>
//           <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
//             <CardTitle as="h4">Chart of Accounts</CardTitle>
//             <GLEntryModal />
//           </CardHeader>
//           <CardBody>
//             <div>
//               {loading ? (
//                 <div>Loading...</div>
//               ) : (
//                 <AgGridReact
//                   columnDefs={columnDefs}
//                   treeData={true}
//                   rowData={flattenData(chartOfAccountsData)}
//                   domLayout="autoHeight"
//                   animateRows={true}
//                   rowSelection="single"
//                   getRowHeight={(params) => (params.data.depth > 0 ? 50 : 60)}
//                   pagination={true}
//                   paginationPageSize={10}
//                   paginationPageSizeSelector={[10, 20, 50, 100]}
//                 />
//               )}
//             </div>
//           </CardBody>
//         </Card>
//       </Col>
//     </Row>
//   )
// }

// export default ReviewsPage;
