'use client'
import { AgGridReact } from 'ag-grid-react'
import dynamic from 'next/dynamic'
import { useExchangeData } from '@/hooks/useExchangeData'
import { ExchangeModal } from '@/app/(admin)/base-ui/modals/components/ConfigurationModal'
import { Card, CardBody, CardHeader, CardTitle, Col, Dropdown, Button, Row, Alert } from 'react-bootstrap'
import { ExchangeTableColDefs } from '@/assets/tychiData/columnDefs'
import { useDashboardToken } from '@/hooks/useDashboardToken'
import { useUserToken } from '@/hooks/useUserToken'
import { useEffect, useState } from 'react'
import { getUserRolePermissions } from '@/helpers/getUserPermissions'
import { canModuleAction } from '@/helpers/permissionActions'

const ExchangeTab = () => {
  const dashboard = useDashboardToken()
  const userToken = useUserToken()
  const { fund_id } = dashboard || {}
  const fundId = fund_id ?? null
  
  // Permissions state
  const [permissions, setPermissions] = useState([])
  const [loadingPermissions, setLoadingPermissions] = useState(true)
  
  // Fetch user permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      const tokenData = dashboard || userToken
      
      if (!tokenData) {
        setLoadingPermissions(false)
        return
      }
      
      try {
        setLoadingPermissions(true)
        const perms = await getUserRolePermissions(tokenData, fundId)
        setPermissions(Array.isArray(perms) ? perms : [])
      } catch (error) {
        console.error('Error fetching permissions:', error)
        setPermissions([])
      } finally {
        setLoadingPermissions(false)
      }
    }
    
    fetchPermissions()
  }, [userToken, dashboard, fundId])
  
  // Permission checks for exchange module
  const canEdit = canModuleAction(permissions, ['configuration_exchange', 'exchange'], 'can_edit', fundId)
  const canDelete = canModuleAction(permissions, ['configuration_exchange', 'exchange'], 'can_delete', fundId)
  const canView = canModuleAction(permissions, ['configuration_exchange', 'exchange'], 'can_view', fundId)
  
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
                {canModuleAction(permissions, ['configuration_exchange', 'exchange'], 'can_add', fundId) && (
                  <Button variant="primary" onClick={() => setShowModal(true)}>
                    Add Exchange
                  </Button>
                )}
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
                context={{ handleEdit, handleDelete, canEdit, canDelete, canView }}
              />
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default ExchangeTab
