'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap';
import { FaPlusSquare, FaMinusSquare } from 'react-icons/fa';
import { chartOfAccountsData } from '@/assets/tychiData/chartofaccountsData';

// ✅ Dynamically import AgGridReact to prevent SSR issues
const AgGridReact = dynamic(() => import('ag-grid-react').then(mod => mod.AgGridReact), { ssr: false });
// ✅ Dynamically import GLEntryModal
const GLEntryModal = dynamic(() => import('@/app/(admin)/base-ui/modals/components/AllModals').then(mod => mod.GLEntryModal), { ssr: false });

const ReviewsPage = () => {
  const gridRef = useRef(null);
  const [expandedNodes, setExpandedNodes] = useState({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('ag-grid-community')
        .then(({ ModuleRegistry, ClientSideRowModelModule }) => {
          ModuleRegistry.registerModules([ClientSideRowModelModule]);
        })
        .catch((error) => console.error('Error registering AgGrid modules:', error));
    }
  }, []);

  // Function to toggle expansion
  const toggleExpand = (id) => {
    setExpandedNodes((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  // Function to prepare data with proper hierarchy
  const flattenData = (data, depth = 0, parentId = '') => {
    return data.flatMap((item, index) => {
      const id = `${parentId}-${index}`;
      const isExpanded = expandedNodes[id] ?? true; // All sections open by default

      return [
        { ...item, id, depth, hasChildren: !!item.sub_accounts1 || !!item.sub_accounts2 },
        ...(isExpanded ? flattenData([...item.sub_accounts1 || [], ...item.sub_accounts2 || []], depth + 1, id) : []),
      ];
    });
  };

  const columnDefs = [
    {
      field: 'gl_name',
      headerName: 'GL Name',
      sortable: true,
      filter: true,
      width: 300,
      flex: 1,
      cellRenderer: (params) => {
        const { data } = params;
        if (!data) return null;

        return (
          <div style={{ paddingLeft: `${data.depth * 20}px`, display: 'flex', alignItems: 'center' }}>
            {data.hasChildren && (
              <button
                onClick={() => toggleExpand(data.id)}
                className="btn btn-sm btn-link p-0 me-2"
                style={{ border: 'none', background: 'none' }}
              >
                {expandedNodes[data.id] ? <FaMinusSquare /> : <FaPlusSquare />}
              </button>
            )}
            {data.gl_name}
          </div>
        );
      },
    },
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
            <div>
              <AgGridReact
                ref={gridRef}
                columnDefs={columnDefs}
                rowData={flattenData(chartOfAccountsData)}
                domLayout="autoHeight"
                animateRows={true}
                rowSelection="single"
                getRowHeight={(params) => (params.data.depth > 0 ? 50 : 60)} // Different row height for hierarchy levels
              />
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

export default ReviewsPage;
