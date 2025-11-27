'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Spinner, Alert } from 'react-bootstrap'
import PageTitle from '@/components/PageTitle'
import { UploadMigrationModal } from '@/app/(admin)/base-ui/modals/components/AllModals'
import MigrationComparisonModal from './components/MigrationComparisonModal'
import { useDashboardToken } from '@/hooks/useDashboardToken'

const AgGridReact = dynamic(() => import('ag-grid-react').then((mod) => mod.AgGridReact), { ssr: false })

const MigrationPage = () => {
  const [rowData, setRowData] = useState([])
  const [columnDefs, setColumnDefs] = useState([])
  const [loading, setLoading] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const [showComparisonModal, setShowComparisonModal] = useState(false)
  const gridApiRef = useRef(null)
  const tokenData = useDashboardToken()
  const fundId = tokenData?.fund_id

  const defaultColumnDefs = useMemo(
    () => [
      { headerName: 'Sr.No', valueGetter: 'node.rowIndex + 1', width: 70, pinned: 'left', flex: 1 },
      { field: 'account_code', headerName: 'Account Code', flex: 1 },
      { field: 'account_name', headerName: 'Account Name', flex: 1 },
      { field: 'balance type', headerName: 'Balance Type', flex: 1 },
      { field: 'debit', headerName: 'Debit', flex: 1 },
      { field: 'credit', headerName: 'Credit', flex: 1 },
      { field: 'Closing balance', headerName: 'Closing Balance', flex: 1 },
    ],
    [],
  )

  // Load columns + register AG Grid
  useEffect(() => {
    setColumnDefs(defaultColumnDefs)

    if (typeof window !== 'undefined') {
      import('ag-grid-community')
        .then(({ ModuleRegistry, AllCommunityModule }) => {
          ModuleRegistry.registerModules([AllCommunityModule])
        })
        .catch(() => {})
    }
  }, [defaultColumnDefs])

  // Grid ready callback to store grid API reference
  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api
  }, [])

  // Handle success after upload - open comparison modal
  const handleUploadSuccess = () => {
    setShowComparisonModal(true)
  }

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
              />
            </CardHeader>
            <CardBody className="p-2">
              {errMsg && (
                <Alert variant="danger" className="mb-2" dismissible onClose={() => setErrMsg('')}>
                  {errMsg}
                </Alert>
              )}
              {loading ? (
                <div className="d-flex align-items-center gap-2 p-3">
                  <Spinner animation="border" size="sm" /> <span>Loading…</span>
                </div>
              ) : (
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
          </Card>
        </Col>
      </Row>

      {/* Comparison Modal */}
      <MigrationComparisonModal
        show={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        fundId={fundId}
      />
    </>
  )
}

export default MigrationPage
