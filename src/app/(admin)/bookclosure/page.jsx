'use client' // ✅ Ensures this is a Client Component

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Cookies from 'js-cookie'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Dropdown } from 'react-bootstrap'

// ✅ Dynamically Import Components to Prevent SSR Issues
const AgGridReact = dynamic(() => import('ag-grid-react').then(mod => mod.AgGridReact), { ssr: false });
const MGLEntryModal = dynamic(() => import('../base-ui/modals/components/AllModals').then(mod => mod.MGLEntryModal), { ssr: false });

const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

function getAuthHeaders() {
  const token = Cookies.get('dashboardToken');
  const h = { Accept: 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function getFundIdFromCookie() {
  try {
    const cookie = document.cookie.split('; ').find(c => c.startsWith('dashboardToken='));
    if (!cookie) return null;
    const token = cookie.split('=')[1];
    const payload = JSON.parse(atob((token.split('.')[1] || '')));
    return payload?.fund_id || payload?.fundId || payload?.fund?.fund_id || null;
  } catch {
    return null;
  }
}

const BookClosurePage = () => {
  const [rowData, setRowData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  const [fundId, setFundId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Get fund ID from token
  useEffect(() => {
    setFundId(getFundIdFromCookie());
  }, []);

  // Fetch bookclosure data with reconciliation type
  useEffect(() => {
    if (!fundId || typeof window === 'undefined') return;

    (async () => {
      setLoading(true);
      setErr('');
      try {
        // Fetch bookclosure data from API
        const url = `${apiBase}/api/v1/bookclosure/${encodeURIComponent(fundId)}`;
        const resp = await fetch(url, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();

        // Transform data for grid
        const rows = (json?.rows || json?.data || []).map((r, i) => ({
          srNo: i + 1,
          month: r?.period_name || r?.month || r?.reporting_period || '-',
          date: r?.reporting_date || r?.date || r?.end_date || '-',
          status: r?.status || r?.reconciliation_status || 'Pending',
          reconciliation_type: r?.reconciliation_type || r?.type || '-',
          raw: r,
        }));

        setRowData(rows);
      } catch (e) {
        console.error('[BookClosure] fetch failed:', e);
        setErr('Failed to load bookclosure data.');
        setRowData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [fundId]);

  // Load column definitions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/assets/tychiData/columnDefs')
        .then((colmdefs) => {
          setColumnDefs(colmdefs.bookclosureColDefs || []);
        })
        .catch((error) => {
          console.error('Error loading columnDefs:', error);
          setColumnDefs([]);
        });

      // ✅ Move ModuleRegistry inside useEffect
      import('ag-grid-community')
        .then(({ ModuleRegistry, AllCommunityModule }) => {
          ModuleRegistry.registerModules([AllCommunityModule]);
        })
        .catch((error) => console.error('Error registering AgGrid modules:', error));
    }
  }, []);

  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Book Closure</CardTitle>
            <Dropdown>
              <MGLEntryModal />
            </Dropdown>
          </CardHeader>
          <CardBody className="p-2">
            {err && <div className="text-danger mb-2">{err}</div>}
            <div className="ag-theme-alpine" style={{ height: 550, width: '100%' }}>
              {columnDefs.length > 0 && (
                <AgGridReact
                  rowData={rowData}
                  columnDefs={columnDefs}
                  pagination={true}
                  paginationPageSize={10}
                  defaultColDef={{ sortable: true, filter: true, resizable: true }}
                  overlayLoadingTemplate={
                    loading ? '<span class="ag-overlay-loading-center">Loading…</span>' : undefined
                  }
                />
              )}
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

export default BookClosurePage;
