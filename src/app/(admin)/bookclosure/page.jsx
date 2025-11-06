'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Cookies from 'js-cookie'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Dropdown } from 'react-bootstrap'

const AgGridReact = dynamic(() => import('ag-grid-react').then(mod => mod.AgGridReact), { ssr: false });
// const MGLEntryModal = dynamic(() => import('../base-ui/modals/components/AllModals').then(mod => mod.MGLEntryModal), { ssr: false });

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
  const [updatingId, setUpdatingId] = useState(null); // Track which row is being updated

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
          pricing_month: r?.pricing_month || '-', // ✅ e.g., "2025-10-01"
          raw: r, // Keep raw data for reference (includes bookclosure_id)
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

  // Handle status update (Close/Open)
  const handleStatusUpdate = useCallback(async (row, newStatus) => {
    if (!row?.raw?.bookclosure_id) {
      alert('Missing bookclosure ID');
      return;
    }

    const bookclosureId = row.raw.bookclosure_id;
    setUpdatingId(bookclosureId);

    try {
      const url = `${apiBase}/api/v1/bookclosure/${encodeURIComponent(bookclosureId)}/status`;
      const resp = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus.toUpperCase(), // 'CLOSE' or 'OPEN'
        }),
      });

      if (!resp.ok) {
        const errorText = await resp.text().catch(() => '');
        throw new Error(`HTTP ${resp.status}: ${errorText || resp.statusText}`);
      }

      const json = await resp.json();
      if (!json?.success) {
        throw new Error(json?.error || json?.message || 'Failed to update status');
      }

      // Update local state
      setRowData(prev =>
        prev.map(r =>
          r.raw?.bookclosure_id === bookclosureId
            ? { ...r, status: newStatus.toUpperCase(), raw: { ...r.raw, status: newStatus.toUpperCase() } }
            : r
        )
      );

      alert(`Status updated to ${newStatus.toUpperCase()} successfully`);
    } catch (e) {
      console.error('[BookClosure] Status update failed:', e);
      alert(`Failed to update status: ${e.message || 'Unknown error'}`);
    } finally {
      setUpdatingId(null);
    }
  }, []);

  // Action renderer component
  const ActionRenderer = useMemo(() => {
    const BookClosureActionRenderer = (params) => {
      const row = params.data;
      if (!row) return <span className="text-muted">—</span>;

      const currentStatus = (row.status || row.raw?.status || '').toUpperCase();
      const isClosed = currentStatus === 'CLOSED' || currentStatus === 'CLOSE';
      const bookclosureId = row.raw?.bookclosure_id;
      const isUpdating = updatingId === bookclosureId;

      return (
        <button
          className={`btn btn-sm ${isClosed ? 'btn-success' : 'btn-warning'}`}
          disabled={isUpdating}
          onClick={() => {
            const newStatus = isClosed ? 'open' : 'close';
            if (confirm(`Are you sure you want to ${newStatus} this period?`)) {
              handleStatusUpdate(row, newStatus);
            }
          }}
          title={isUpdating ? 'Updating...' : isClosed ? 'Click to open' : 'Click to close'}
        >
          {isUpdating ? 'Updating...' : isClosed ? 'Open' : 'Close'}
        </button>
      );
    };
    
    BookClosureActionRenderer.displayName = 'BookClosureActionRenderer';
    return BookClosureActionRenderer;
  }, [updatingId, handleStatusUpdate]);

  // Load column definitions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/assets/tychiData/columnDefs')
        .then((colmdefs) => {
          const baseColDefs = colmdefs.bookclosureColDefs || [];
          // Add custom Action renderer
          const updatedColDefs = baseColDefs.map(col => {
            if (col.field === 'Action') {
              return {
                ...col,
                cellRenderer: ActionRenderer,
              };
            }
            return col;
          });
          setColumnDefs(updatedColDefs);
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
  }, [ActionRenderer]);

  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Book Closure</CardTitle>
            {/* <Dropdown>
              <MGLEntryModal />
            </Dropdown> */}
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