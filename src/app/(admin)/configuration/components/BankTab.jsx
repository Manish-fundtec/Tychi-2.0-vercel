'use client';
import { AgGridReact } from 'ag-grid-react';
import { useBankData } from '@/hooks/useBankData';
import { BankModal } from '@/app/(admin)/base-ui/modals/components/ConfigurationModal';
import { Card, CardBody, CardHeader, CardTitle, Col, Dropdown, Button, Row } from 'react-bootstrap';
import { BankTableColDefs } from '@/assets/tychiData/columnDefs';
import { formatYmd } from '../../../../../src/lib/dateFormat'
import { useDashboardToken } from '@/hooks/useDashboardToken'
import { useMemo } from 'react'

const BankTab = () => {
    const dashboard = useDashboardToken()
    const fundId = dashboard?.fund_id
    const fmt = dashboard?.date_format || 'MM/DD/YYYY'
    // Optional UX: show a lightweight state until token is ready
    // define columnDefs here (NOT inside JSX)
    const columnDefs = useMemo(() => {
      return (BankTableColDefs || []).map((col) => {
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
  const {
    banks,
    refetchBanks,
    editingBank,
    setEditingBank,
    showModal,
    setShowModal,
    handleEdit,
    handleDelete,
  } = useBankData();
  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Bank List</CardTitle>
            <Dropdown>
            <BankModal
                show={showModal}
                onClose={() => {
                  setEditingBank(null);
                  setShowModal(false);
                }}
                bank={editingBank}
                onSuccess={refetchBanks}
                existingBanks={banks}
              />
              <Button variant="primary" onClick={() => setShowModal(true)}>
                Add Bank
              </Button>
            </Dropdown>
          </CardHeader>
          <CardBody className="p-2">
            <div style={{ height: '100%', width: '100%' }}>
              <AgGridReact
                rowData={banks}
                columnDefs={columnDefs}
                pagination={true}
                paginationPageSize={10}
                defaultColDef={{ sortable: true, filter: true, resizable: true }}
                domLayout="autoHeight"
                context={{ handleEdit, handleDelete }}
                getRowId={(p) => p.data.bank_id}        // :white_check_mark: stable row ids
                onGridReady={() => refetchBanks()}       // :white_check_mark: ensures fresh load
              />
            </div>
          </CardBody>
        </Card>
      </Col>
      {/* Keep modal outside of Dropdown to avoid layering issues */}
      <BankModal
        show={showModal}
        onClose={() => {
          setEditingBank(null);
        }}
        bank={editingBank}
        onSuccess={() => {
          setShowModal(false);
          refetchBanks();
        }}
        existingBanks={banks}
      />
    </Row>
  );
};
export default BankTab;

