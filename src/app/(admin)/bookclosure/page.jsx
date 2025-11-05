'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Cookies from 'js-cookie'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Dropdown } from 'react-bootstrap'

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

  // Fetch bookclosure data
  useEffect(() => {
    if (!fundId || typeof window === 'undefined') return;

    (async () => {
      setLoading(true);
      setErr('');
      try {
        // ✅ Backend returns: { success: true, count: number, rows: [...] }
        // ✅ Query parameter for reconciliation_type (optional, defaults to 'bank_broker')
        const url = `${apiBase}/api/v1/bookclosure/${encodeURIComponent(fundId)}?type=bank_broker`;
        const resp = await fetch(url, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();

        if (!json?.success) {
          throw new Error(json?.error || 'Failed to fetch bookclosure data');
        }

        // ✅ Backend response format: { success: true, count: number, rows: [...] }
        // ✅ Each row has: bookclosure_id, fund_id, reconciliation_type, period_name, 
        //    reporting_date, pricing_month, status ('OPEN' or 'CLOSED'), created_at, updated_at
        const rows = (json?.rows || []).map((r, i) => ({
          srNo: i + 1,
          month: r?.period_name || '-',           // ✅ e.g., "Oct-2025"
          date: r?.reporting_date || '-',         // ✅ e.g., "2025-10-31"
          status: r?.status || 'OPEN',            // ✅ "OPEN" or "CLOSED" (uppercase)
          reconciliation_type: r?.reconciliation_type || 'bank_broker',
          pricing_month: r?.pricing_month || '-', // ✅ e.g., "2025-10-01"
          raw: r, // Keep raw data for reference
        }));

        console.log('[BookClosure] Loaded:', {
          count: json?.count || 0,
          rows: rows.length,
          sample: rows[0] || null,
        });

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