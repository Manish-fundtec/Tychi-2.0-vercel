'use client'
import { AgGridReact } from 'ag-grid-react'
import dynamic from 'next/dynamic'
import { useExchangeData } from '@/hooks/useExchangeData'
import { ExchangeModal } from '@/app/(admin)/base-ui/modals/components/ConfigurationModal'
import { Card, CardBody, CardHeader, CardTitle, Col, Dropdown, Button, Row, Alert } from 'react-bootstrap'
import { ExchangeTableColDefs } from '@/assets/tychiData/columnDefs'
import { useDashboardToken } from '@/hooks/useDashboardToken'

const ExchangeTab = () => {
  const { fund_id } = useDashboardToken() || {}
  const fundId = fund_id ?? null
  // AgGrid must be dynamic in app router
  const AgGridReact = dynamic(() => import('ag-grid-react').then((m) => m.AgGridReact), { ssr: false })
  const ExchangeModal = dynamic(() => import('@/app/(admin)/base-ui/modals/components/ConfigurationModal').then((m) => m.ExchangeModal), {
    ssr: false,
  })
  const { exchanges, refetchExchanges, loading, editingExchange, setEditingExchange, showModal, setShowModal, handleEdit, handleDelete } =
    useExchangeData(fundId)

  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Exchange List</CardTitle>
            <Dropdown>
              <ExchangeModal
                show={showModal}
                onClose={() => {
                  setEditingExchange(null)
                  setShowModal(false)
                }}
                fundId={fund_id}
                exchange={editingExchange}
                onSuccess={refetchExchanges}
              />
              <Button variant="primary" onClick={() => setShowModal(true)}>
                Add Exchange
              </Button>
            </Dropdown>
          </CardHeader>
          <CardBody className="p-2">
            {!fund_id && (
              <Alert variant="warning" className="mb-3">
                No fund selected. Select a fund to load exchanges.
              </Alert>
            )}
            <div style={{ height: '100%', width: '100%' }}>
              <AgGridReact
                rowData={exchanges}
                columnDefs={ExchangeTableColDefs}
                pagination={true}
                paginationPageSize={10}
                defaultColDef={{ sortable: true, filter: true, resizable: true }}
                domLayout="autoHeight"
                context={{ handleEdit, handleDelete }}
              />
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default ExchangeTab
