'use client'
import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { FaPlusSquare, FaMinusSquare } from 'react-icons/fa'
import { GLEntryModal } from '@/app/(admin)/base-ui/modals/components/AllModals'
import { ModuleRegistry, ClientSideRowModelModule } from 'ag-grid-community'
import { chartOfAccountsData } from '@/assets/tychiData/chartofaccountsData'

// ✅ Dynamically import AgGridReact
const AgGridReact = dynamic(() => import('ag-grid-react').then(mod => mod.AgGridReact), { ssr: false });

// ✅ Register only Client-Side Module (Fixes SSR)
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const ChartOfAccountsPage = () => {
  const gridRef = useRef(null);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [rowData, setRowData] = useState([]);

  useEffect(() => {
    setRowData(chartOfAccountsData);
  }, []);

  const toggleExpand = (id) => {
    setExpandedNodes((prevState) => ({ ...prevState, [id]: !prevState[id] }));
  };

  const flattenData = (data, depth = 0, parentId = '') => {
    return data.flatMap((item, index) => {
      const id = `${parentId}-${index}`;
      const isExpanded = expandedNodes[id] ?? true;

      return [
        { ...item, id, depth, hasChildren: !!item.sub_accounts1 || !!item.sub_accounts2 },
        ...(isExpanded ? flattenData([...item.sub_accounts1 || [], ...item.sub_accounts2 || []], depth + 1, id) : []),
      ];
    });
  };

  const columnDefs = [
    { field: 'gl_name', headerName: 'GL Name', sortable: true, filter: true, width: 300, flex: 1 },
    { field: 'gl_number', headerName: 'GL Number', sortable: true, filter: true, flex: 1 },
    { field: 'balance', headerName: 'Balance', sortable: true, filter: true, flex: 1 },
  ];

  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Chart of Accounts</CardTitle>
            <GLEntryModal />
          </CardHeader>
          <CardBody>
            <div style={{ height: '100%', width: '100%' }}>
              <AgGridReact ref={gridRef} columnDefs={columnDefs} rowData={flattenData(rowData)} domLayout="autoHeight" animateRows={true} rowSelection="single" />
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

export default ChartOfAccountsPage;
