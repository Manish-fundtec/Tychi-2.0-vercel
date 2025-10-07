'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Row, Col, Card, CardBody, CardHeader, CardTitle, Form, Button } from 'react-bootstrap';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import api from '@/lib/api/axios';
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa'; 

// AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

// Accordion section order
const SECTIONS = ['Trade', 'Basis', 'Short Term RPNL', 'Long Term RPNL', 'UPNL'];

// Some rows are not editable by business rule (e.g., “NA”)
const NON_EDITABLE_MAP = {
  Basis: {
    Futures: { long: true, short: true }, // leave setoff editable
  },
};

// Helpers to translate between {value,label}
const toLabel = (list, value) => {
  const m = list.find((x) => x.value === value);
  return m ? m.label : value || '-';
};

// Special value formatter for Trade section
const formatTradeValue = (list, value, section) => {
  if (section === 'Trade') {
    if (value === 'BROKER_CASH') return 'Respective Broker cash';
  }
  return toLabel(list, value);
};
const makeValues = (list) => list.map((x) => x.value);

export default function MappingTab({ fund_id: fundIdProp }) {
  const [fundId, setFundId] = useState(fundIdProp || null);
  const [loading, setLoading] = useState(true);
  const [quickFilter, setQuickFilter] = useState('');

  // [{ value: '14100', label: '14100 — Investment Long — Cost — Stock' }, ...]
  const [glOptions, setGlOptions] = useState([]);

  // { 'Trade': [{id,asset,long,short,setoff}, ...], ... }
  const [rowsBySection, setRowsBySection] = useState({});

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({}); // Track changes before saving
  const [saving, setSaving] = useState(false);

  const gridRefs = useRef({}); // section -> gridRef

  // Create mapping from codes to full breadcrumb labels
  const codeToLabel = useMemo(() => {
    const m = new Map();
    glOptions.forEach(o => m.set(String(o.value), o.label));
    return m;
  }, [glOptions]);

  // get fund id once
  useEffect(() => {
    if (fundIdProp) return;
    const token = Cookies.get('dashboardToken');
    if (!token) return;
    try {
      const d = jwtDecode(token);
      setFundId(d?.fund_id || null);
    } catch (e) {
      console.error('jwt decode failed', e);
    }
  }, [fundIdProp]);

  // ========================================
  // MAPPING DROPDOWN DATA SOURCE
  // ========================================
  // This useEffect loads the dropdown options for Long/Short/Setoff columns
  // Data comes from: /api/v1/chart-of-accounts/postable/${fundId}
  // Format: [{ value: "13110", label: "13110 - Stock" }, ...]
  // This data is used in the AgGrid dropdown editors
  useEffect(() => {
    if (!fundId) return;
    (async () => {
      try {
        // FETCH: Get Chart of Accounts data from database
        const r = await api.get(`/api/v1/chart-of-accounts/postable/${fundId}`, {
          params: { excludeRoots: true, onlyLeaves: false }, // show 11000, 12000 etc too
        });
        
        // TRANSFORM: Convert API data to dropdown format
        const list = (Array.isArray(r.data) ? r.data : []).map((a) => ({
          value: String(a.code),        // Used as the actual value stored in database
          label: `${a.code} - ${a.name}`, // What user sees in dropdown
        }));
        
        //  ADD: Special options for Trade section
        const brokerCashOption = {
          value: 'BROKER_CASH',
          label: 'Respective Broker cash'
        };
        
        // STORE: Save dropdown options for use in AgGrid
        setGlOptions([brokerCashOption, ...list]);
      } catch (e) {
        console.error('Failed to load GL options:', e);
        setGlOptions([]);
      }
    })();
  }, [fundId]);

  // ========================================
  // MAPPING TABLE DATA SOURCE
  // ========================================
  // This loads the actual mapping data that fills the table rows
  // Data comes from: /api/v1/mapping/${fundId}
  // This data shows which GL codes are mapped to each asset type
  useEffect(() => {
    if (!fundId) return;
    (async () => {
      try {
        setLoading(true);
        //  FETCH: Get mapping data from database
        const r = await api.get(`/api/v1/mapping/${fundId}`); // your existing "fetchMappingsByFund"
        const data = Array.isArray(r.data?.data) ? r.data.data : r.data;

        //  TRANSFORM: Group mapping data by section (Trade, Basis, etc.)
        const grouped = (data || []).reduce((acc, m) => {
          const header = m.header_name || 'Other';
          const row = {
            id: m.mapping_id,
            asset: m.assettype_name,        // Asset type name (Stock, Futures, etc.)
            long: m.gl_code_long || '',     // GL code for Long position
            short: m.gl_code_short || '',   // GL code for Short position  
            setoff: m.gl_code_setoff || '', // GL code for Setoff
          };
          
          //  ADD: Default values for Trade section - always set these values
          if (header === 'Trade') {
            row.long = 'BROKER_CASH';
            row.short = 'BROKER_CASH';
            row.setoff = '14000'; // Investment Clearing GL code
          }
          
          (acc[header] ||= []).push(row);
          return acc;
        }, {});
        
        //  STORE: Save grouped mapping data for display in table
        setRowsBySection(grouped);
      } catch (e) {
        console.error('Failed to load mappings:', e);
        setRowsBySection({});
      } finally {
        setLoading(false);
      }
    })();
  }, [fundId]);

  // ========================================
  // MAPPING DROPDOWN USAGE IN AGGrid
  // ========================================
  // This creates the column definitions for the mapping table
  // The dropdown data from glOptions is used here in cellEditorParams
  const columnDefs = useMemo(() => {
    // EXTRACT: Get just the values for dropdown editor
    const values = makeValues(glOptions);

    /** cell editable rule */
    const isCellEditable = (section, asset, field) => {
      const sec = NON_EDITABLE_MAP[section];
      if (!sec) return true;
      const rowRule = sec[asset];
      if (!rowRule) return true;
      if (rowRule[field]) return false;
      return true;
    };

    /** shared col parts - THIS IS WHERE DROPDOWN DATA IS USED */
    const makeEditableCol = (field, headerName) => ({
      field,
      headerName,
      flex: 1,
      editable: (p) => {
        // Only editable in edit mode
        if (!isEditMode) return false;
        const section = p?.context?.sectionName;
        const asset = p?.data?.asset;
        return isCellEditable(section, asset, field);
      },
      //  DROPDOWN: This is where the mapping dropdown data is used
      cellEditor: isEditMode ? 'agSelectCellEditor' : undefined,
      cellEditorParams: isEditMode ? { 
        values,
        showDropdown: true, // Always show dropdown
        suppressKeyboardEvent: () => false // Allow keyboard navigation
      } : undefined, // Uses values from glOptions (13110, 14000, etc.)
      
      //  DISPLAY: This shows what user sees in the cell
      valueFormatter: (p) => {
        const section = p?.context?.sectionName;
        return formatTradeValue(glOptions, p.value, section);
      },
      // deny same-code duplicates within row
      valueSetter: (p) => {
        const newVal = String(p.newValue || '');
        if (!newVal) {
          p.data[field] = '';
          return true;
        }
        const duplicate =
          (field !== 'long' && newVal === p.data.long) ||
          (field !== 'short' && newVal === p.data.short) ||
          (field !== 'setoff' && newVal === p.data.setoff);
        if (duplicate) {
          alert('Long / Short / Setoff must all be different GL codes.');
          return false;
        }
        p.data[field] = newVal;
        return true;
      },
    });

    return [
      { field: 'asset', headerName: 'Assets', editable: false, flex: 1 },
      makeEditableCol('long', 'Long'),
      makeEditableCol('short', 'Short'),
      makeEditableCol('setoff', 'Setoff'),
    ];
  }, [glOptions, isEditMode]);

  /** Save one row back */
  const saveRow = async (row) => {
    try {
      await api.put('/api/v1/mapping', {
        fund_id: fundId,
        mapping_id: row.id,
        gl_code_long: row.long || null,
        gl_code_short: row.short || null,
        gl_code_setoff: row.setoff || null,
      });
    } catch (e) {
      console.error('Update mapping failed', e);
      alert('Failed to save mapping. Please try again.');
    }
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit mode - discard changes
      setPendingChanges({});
      setIsEditMode(false);
    } else {
      // Show confirmation before entering edit mode
      const confirmed = window.confirm(
        'Are you sure you want to edit the mapping?'
      );
      if (confirmed) {
        setIsEditMode(true);
      }
    }
  };

  // Handle save all changes
  const handleSave = async () => {
    setSaving(true);
    try {
      // Save all pending changes
      const savePromises = Object.entries(pendingChanges).map(([mappingId, changes]) => 
        api.put('/api/v1/mapping', {
          fund_id: fundId,
          mapping_id: mappingId,
          ...changes
        })
      );
      
      await Promise.all(savePromises);
      
      // Clear pending changes and exit edit mode
      setPendingChanges({});
      setIsEditMode(false);
      
      // Refresh data
      const r = await api.get(`/api/v1/mapping/${fundId}`);
      const data = Array.isArray(r.data?.data) ? r.data.data : r.data;
      const grouped = (data || []).reduce((acc, m) => {
        const header = m.header_name || 'Other';
        const row = {
          id: m.mapping_id,
          asset: m.assettype_name,
          long: m.gl_code_long || '',
          short: m.gl_code_short || '',
          setoff: m.gl_code_setoff || '',
        };
        
        if (header === 'Trade') {
          row.long = 'BROKER_CASH';
          row.short = 'BROKER_CASH';
          row.setoff = '14000'; // Investment Clearing GL code
        }
        
        (acc[header] ||= []).push(row);
        return acc;
      }, {});
      setRowsBySection(grouped);
      
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle cell value changes in edit mode
  const onCellValueChanged = (section) => (params) => {
    if (!params?.data || !isEditMode) return;
    
    const mappingId = params.data.id;
    const field = params.colDef.field;
    const newValue = params.newValue;
    
    // Track changes in pendingChanges
    setPendingChanges(prev => ({
      ...prev,
      [mappingId]: {
        ...prev[mappingId],
        [`gl_code_${field}`]: newValue || null
      }
    }));
  };

  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Mapping</CardTitle>
            <div className="d-flex align-items-center gap-2">
             
              <Button
                variant={isEditMode ? "success" : "outline-primary"}
                size="sm"
                onClick={isEditMode ? handleSave : handleEditToggle}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : isEditMode ? (
                  <>
                    <FaSave className="me-1" />
                    Save
                  </>
                ) : (
                  <>
                    <FaEdit className="me-1" />
                    Edit
                  </>
                )}
              </Button>
              {isEditMode && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleEditToggle}
                  disabled={saving}
                >
                  <FaTimes className="me-1" />
                  Cancel
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div>Loading mappings…</div>
            ) : (
              // ========================================
              // MAPPING TABLE RENDERING
              // ========================================
              // This is where the mapping data is actually displayed
              // Each section (Trade, Basis, etc.) gets its own AgGrid table
              SECTIONS.map((section) => (
                <div key={section} className="mb-4">
                  <div className="fw-semibold mb-2">{section}</div>
                  <div
                    className="ag-theme-alpine"
                    style={{ width: '100%', minHeight: 120 }}
                  >
                    <style jsx>{`
                      .ag-theme-alpine .ag-cell.ag-cell-editable {
                        cursor: pointer;
                        background-color: ${isEditMode ? '#f8f9fa' : 'transparent'};
                        border: ${isEditMode ? '1px solid #dee2e6' : 'none'};
                      }
                      .ag-theme-alpine .ag-cell.ag-cell-editable:hover {
                        background-color: ${isEditMode ? '#e9ecef' : 'transparent'};
                      }
                    `}</style>
                      <AgGridReact
                        ref={(r) => (gridRefs.current[section] = r)}
                        //  DATA: Mapping rows for this section (from rowsBySection)
                        rowData={rowsBySection[section] || []}
                        //  COLUMNS: Column definitions with dropdown editors
                        columnDefs={columnDefs}
                        context={{ sectionName: section }}
                        defaultColDef={{
                          sortable: true,
                          filter: true,
                          resizable: true,
                          editable: true,
                        }}
                        domLayout="autoHeight"
                        // SAVE: When user changes a dropdown value
                        onCellValueChanged={onCellValueChanged(section)}
                        // Make cells start editing on single click in edit mode
                        singleClickEdit={isEditMode}
                        stopEditingWhenCellsLoseFocus={true}
                        suppressClickEdit={!isEditMode}
                      />
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
}
