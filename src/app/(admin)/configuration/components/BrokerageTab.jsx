// src/app/(admin)/configuration/components/BrokerageTab.jsx
'use client'
import { AgGridReact } from 'ag-grid-react'
import { useBrokerData } from '@/hooks/useBrokerData'
import { BrokerModal } from '@/app/(admin)/base-ui/modals/components/ConfigurationModal'
import { Card, CardBody, CardHeader, CardTitle, Col, Dropdown, Button, Row } from 'react-bootstrap'
import { BrokerageTableColDefs } from '@/assets/tychiData/columnDefs'
import { useDashboardToken } from '@/hooks/useDashboardToken'
import { formatYmd } from '@/lib/dateFormat'
import { useMemo } from 'react'

const BrokerageTab = () => {
  // :white_check_mark: null-safe: don't destructure directly
  const dashboard = useDashboardToken()
  const fundId = dashboard?.fund_id
  const fmt = dashboard?.date_format || 'MM/DD/YYYY'
  const { brokers, refetchBrokers, editingBroker, setEditingBroker, showModal, setShowModal, handleEdit, handleDelete } = useBrokerData(fundId) // hook already ignores fetch until fundId exists
  // Optional UX: show a lightweight state until token is ready
  // define columnDefs here (NOT inside JSX)
  const columnDefs = useMemo(() => {
    return (BrokerageTableColDefs || []).map((col) => {
      if (col?.field !== 'start_date') return col
      return {
        ...col,
        valueFormatter: (p) => {
          const raw = p?.value ? String(p.value).slice(0, 10) : ''
          return formatYmd(raw, fmt) // 'MM/DD/YYYY' or 'DD/MM/YYYY'
        },
      }
    })
  }, [fmt])
  if (!fundId) {
    return (
      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
              <CardTitle as="h4">Brokerage List</CardTitle>
            </CardHeader>
            <CardBody>
              <div>Loading fund context…</div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    )
  }
  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Brokerage List</CardTitle>
            <Dropdown>
              <BrokerModal
                show={showModal}
                onClose={() => {
                  setEditingBroker(null)
                  setShowModal(false)
                }}
                broker={editingBroker}
                onSuccess={refetchBrokers}
              />
              <Button variant="primary" onClick={() => setShowModal(true)}>
                Add Broker
              </Button>
            </Dropdown>
          </CardHeader>
          <CardBody className="p-2">
            <div style={{ height: '100%', width: '100%' }}>
              <AgGridReact
                rowData={brokers}
                columnDefs={columnDefs}
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
export default BrokerageTab
