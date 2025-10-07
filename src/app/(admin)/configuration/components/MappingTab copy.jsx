'use client';

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap';
import { Accordion, AccordionBody, AccordionHeader, AccordionItem } from 'react-bootstrap';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import axios from 'axios';

// Register ClientSideRowModelModule (required for ag-grid v33+)
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const accordionItems = ["Trade", "Basis", "Short Term RPNL", "Long Term RPNL", "UPNL"];

const MappingTab = ({ fund_id }) => {
  const [activeAssetTypes, setActiveAssetTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const columnDefs = [
    { field: "asset", headerName: "Asset", sortable: true, filter: true, flex: 1 },
    { field: "long", headerName: "Long", sortable: true, filter: true, flex: 1 },
    { field: "short", headerName: "Short", sortable: true, filter: true, flex: 1 },
    { field: "setoff", headerName: "Setoff", sortable: true, filter: true, flex: 1 },
  ];

  useEffect(() => {
    const fetchActiveAssetTypes = async () => {
      try {
        if (!fund_id) {
          console.warn("⚠️ No fund_id available yet, skipping API call");
          return;
        }
    
        console.log('🔍 Current fund_id:', fund_id);

        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/asset-types/fund/${fund_id}/active`);
        console.log("✅ Asset types fetched:", response.data);

        setActiveAssetTypes(response.data || []);
        
      } catch (error) {
        console.error('❌ Error fetching active asset types:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveAssetTypes();
  }, [fund_id]);

  const mapData = activeAssetTypes.map(type => ({
    asset: type.name || type.asset_type_name || 'Unnamed Asset',
    long: '',
    short: '',
    setoff: ''
  }));
  console.log("🗂️ mapData prepared for AgGrid:", mapData);
  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Mapping</CardTitle>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div>Loading asset types...</div>
            ) : (
              <Accordion defaultActiveKey={"0"} id="accordionExample">
                {accordionItems.map((item, idx) => (
                  <AccordionItem eventKey={`${idx}`} key={idx}>
                    <AccordionHeader id={`heading-${idx}`}>
                      <div className="fw-medium">{item}</div>
                    </AccordionHeader>
                    <AccordionBody>
                      <div
                        className="ag-theme-alpine"
                        style={{ width: '100%', height: 'auto' }}
                      >
                        <AgGridReact
                          rowData={mapData}
                          columnDefs={columnDefs}
                          defaultColDef={{
                            sortable: true,
                            filter: true,
                            resizable: true
                          }}
                          domLayout="autoHeight"
                        />
                      </div>
                    </AccordionBody>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

export default MappingTab;


// 'use client';

// import React, { useEffect, useState } from 'react';
// import { Row, Col } from 'react-bootstrap';
// import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap';
// import { Accordion, AccordionBody, AccordionHeader, AccordionItem } from 'react-bootstrap';
// import { AgGridReact } from 'ag-grid-react';
// import axios from 'axios';

// const accordionItems = ["Trade", "Basis", "Short Term RPNL", "Long Term RPNL", "UPNL"];

// const MappingTab = ({ fund_id }) => {
//   const [activeAssetTypes, setActiveAssetTypes] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const columnDefs = [
//     { field: "asset", headerName: "Asset", sortable: true, filter: true, flex: 1 },
//     { field: "long", headerName: "Long", sortable: true, filter: true, flex: 1 },
//     { field: "short", headerName: "Short", sortable: true, filter: true, flex: 1 },
//     { field: "setoff", headerName: "Setoff", sortable: true, filter: true, flex: 1 },
//   ];

//   useEffect(() => {
//     const fetchActiveAssetTypes = async () => {
//       try {
//         const res = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/asset-types/fund/${fund_id}/active`);
//         setActiveAssetTypes(res.data || []);
//       } catch (err) {
//         console.error("❌ Error fetching asset types:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (fund_id) {
//       fetchActiveAssetTypes();
//     }
//   }, [fund_id]);

//   const mapData = activeAssetTypes.map(type => ({
//     asset: type.name || type.asset_type_name || 'Unnamed Asset',
//     long: '',
//     short: '',
//     setoff: ''
//   }));

//   return (
//     <Row>
//       <Col xl={12}>
//         <Card>
//           <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
//             <CardTitle as="h4">Mapping</CardTitle>
//           </CardHeader>
//           <CardBody>
//             {loading ? (
//               <div>Loading asset types...</div>
//             ) : (
//               <Accordion defaultActiveKey={"0"} id="accordionExample">
//                 {accordionItems.map((item, idx) => (
//                   <AccordionItem eventKey={`${idx}`} key={idx}>
//                     <AccordionHeader id={`heading-${idx}`}>
//                       <div className="fw-medium">{item}</div>
//                     </AccordionHeader>
//                     <AccordionBody>
//                       <div
//                         className="ag-theme-alpine"
//                         style={{ width: '100%', height: 'auto' }}
//                       >
//                         <AgGridReact
//                           rowData={mapData}
//                           columnDefs={columnDefs}
//                           pagination={true}
//                           paginationPageSize={10}
//                           defaultColDef={{
//                             sortable: true,
//                             filter: true,
//                             resizable: true
//                           }}
//                           domLayout="autoHeight"
//                         />
//                       </div>
//                     </AccordionBody>
//                   </AccordionItem>
//                 ))}
//               </Accordion>
//             )}
//           </CardBody>
//         </Card>
//       </Col>
//     </Row>
//   );
// };

// export default MappingTab;
