'use client'

import React, { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { FaPlusSquare, FaMinusSquare } from 'react-icons/fa'
import api from '../../../lib/api/axios'
import { jwtDecode } from 'jwt-decode'
import { ModuleRegistry } from 'ag-grid-community'
import { ClientSideRowModelModule } from 'ag-grid-community'

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
            <GLEntryModal onSaved={handleCoaSaved} />
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
