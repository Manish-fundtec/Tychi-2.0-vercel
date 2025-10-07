'use client'

import { AgGridReact } from 'ag-grid-react'
import { useSymbolData } from '@/hooks/useSymbolData'
import { useDashboardToken } from '@/hooks/useDashboardToken'
import { SymbolModal } from '@/app/(admin)/base-ui/modals/components/ConfigurationModal'
import { Card, CardBody, CardHeader, CardTitle, Col, Dropdown, Button, Row ,Alert} from 'react-bootstrap'
import { symbolColDefs } from '@/assets/tychiData/columnDefs'

const SymbolTab = () => {
  const { fund_id } = useDashboardToken() || {}
  const { symbols, refetchSymbols, editingSymbol, setEditingSymbol, showModal, setShowModal, handleEdit, handleDelete } = useSymbolData(fund_id)

  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Symbol List</CardTitle>
            <Dropdown>
              <SymbolModal
                show={showModal}
                onClose={() => {
                  setEditingSymbol(null)
                  setShowModal(false)
                }}
                symbol={editingSymbol}
                fundId={fund_id}
                onSuccess={refetchSymbols}
              />
              <Button onClick={() => setShowModal(true)} disabled={!fund_id}>
                Add Symbol
              </Button>
            </Dropdown>
          </CardHeader>
          <CardBody className="p-2">
            {!fund_id && (
              <Alert variant="warning" className="mb-3">
                No fund selected. Showing all symbols. Select a fund to filter this list.
              </Alert>
            )}
            <div style={{ height: '100%', width: '100%' }}>
              <AgGridReact
                rowData={symbols}
                columnDefs={symbolColDefs}
                pagination={true}
                paginationPageSize={10}
                defaultColDef={{ sortable: true, filter: true, resizable: true }}
                domLayout="autoHeight"
                context={{ handleEdit, handleDelete }} // ✅ Pass context here
              />
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default SymbolTab
