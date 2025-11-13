'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Cookies from 'js-cookie'
import {
  Button, Card, CardBody, CardHeader, CardTitle, Col, Dropdown, DropdownItem,
  DropdownMenu, DropdownToggle, Row, Container
} from 'react-bootstrap'
import { motion } from 'framer-motion'
import { Eye, Download, CheckCircle, XCircle } from 'lucide-react'
import {
  LotSummaryModal,
  RPNLReportModal,
  BalanceSheetModal,
  PurchaseSalesModal,
  ProfitLossModal,
  TrialBalanceMTDModal,
  TrialBalanceQTDModal,
  TrialBalanceYTDModal,
  GLReportsModal,
} from '@/app/(admin)/reports/modals'

const apiBase = process.env.NEXT_PUBLIC_API_URL || ''

function getAuthHeaders() {
  const token = Cookies.get('dashboardToken')
  const h = { Accept: 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

function monthNameFromISO(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d)) return null
  return d.toLocaleString(undefined, { month: 'long' })
}

function yearFromISO(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d)) return null
  return String(d.getFullYear())
}

const ReportsPage = () => {
  const search = useSearchParams()
  const fundFromUrl = search.get('fund') || search.get('fund_id')
  const dateFromUrl = search.get('date')        // YYYY-MM-DD from arrow click
  const monthFromUrl = search.get('month')      // optional label from arrow page

  // ---- State
  const allYears = ['2024', '2025']
  const [fundId, setFundId] = useState(null)
  const [selectedDate, setSelectedDate] = useState(dateFromUrl || '')  // central date (period)
  const [selectedYear, setSelectedYear] = useState(yearFromISO(dateFromUrl) || '2025')
  const [selectedMonth, setSelectedMonth] = useState(monthFromUrl || monthNameFromISO(dateFromUrl) || 'January')
  const [selectedReport, setSelectedReport] = useState(null)

  // modal flags
  const [showLotSummary, setShowLotSummary] = useState(false)
  const [showRpnl, setShowRpnl] = useState(false)
  const [showBalanceSheet, setShowBalanceSheet] = useState(false)
  const [showPurchaseSales, setShowPurchaseSales] = useState(false)
  const [showProfitLoss, setShowProfitLoss] = useState(false)
  const [showTrialBalanceMTD, setShowTrialBalanceMTD] = useState(false)
  const [showTrialBalanceQTD, setShowTrialBalanceQTD] = useState(false)
  const [showTrialBalanceYTD, setShowTrialBalanceYTD] = useState(false)
  const [showGLReport, setShowGLReport] = useState(false)

  // Static sample; your real app can fetch available reports using fundId + selectedDate
  const reportsData = useMemo(() => ({
    [selectedYear]: {
      [selectedMonth]: {
        status: 'Done',
        reports: [
          { id: 1, title: 'Lot Summary', status: 'Completed' },
          { id: 2, title: 'RPNL', status: 'Completed' },
          { id: 3, title: 'Purchase & Sales', status: 'Completed' },
          { id: 9, title: 'Balance Sheet', status: 'Completed' },
          { id: 4, title: 'Trial Balance', status: 'Completed' },
          // { id: 5, title: 'Trial Balance QTD', status: 'Completed' },
          // { id: 6, title: 'Trial Balance YTD', status: 'Completed' },
          { id: 7, title: 'GL Reports', status: 'Completed' },
          { id: 8, title: 'Profit and Loss', status: 'Completed' },
          
        ],
      },
    },
  }), [selectedYear, selectedMonth])

  // Pick fund id from URL (fallback to token if needed)
  useEffect(() => {
    if (fundFromUrl) {
      setFundId(fundFromUrl)
      return
    }
    // fallback: decode from JWT if present
    try {
      const cookie = document.cookie.split('; ').find(c => c.startsWith('dashboardToken='))
      if (cookie) {
        const token = cookie.split('=')[1]
        const payload = JSON.parse(atob((token.split('.')[1] || '')))
        setFundId(payload?.fund_id || payload?.fundId || payload?.fund?.fund_id || null)
      }
    } catch {}
  }, [fundFromUrl])

  const handleMonthChange = (month) => setSelectedMonth(month)

  const handleViewReport = (report) => {
    setSelectedReport(report)
    switch (report.title) {
      case 'Lot Summary': setShowLotSummary(true); break
      case 'RPNL': setShowRpnl(true); break
      case 'Balance Sheet': setShowBalanceSheet(true); break
      case 'Purchase & Sales': setShowPurchaseSales(true); break
      case 'Profit and Loss': setShowProfitLoss(true); break
      case 'Trial Balance': setShowTrialBalanceMTD(true); break
      case 'Trial Balance QTD': setShowTrialBalanceQTD(true); break
      case 'Trial Balance YTD': setShowTrialBalanceYTD(true); break
      case 'GL Reports': setShowGLReport(true); break
      default: break
    }
  }

  // Optional: one place to download any report using selectedDate + fundId
  const handleDownloadReport = (report, format) => {
    if (!fundId || !selectedDate) {
      alert('Missing fund or period date.')
      return
    }

    const title = String(report?.title || '').trim().toLowerCase()

    const endpointConfig = {
      'lot summary': { path: 'lot-summary', params: { scope: 'MTD' } },
      rpnl: { path: 'realized-pnl' },
      'purchase & sales': { path: 'sales-purchase', params: { scope: 'monthly' } },
      'balance sheet': { path: 'balance-sheet-journals', params: { retained_gl: '34000' } },
      'profit and loss': { path: 'pnl' },
      'trial balance': { path: 'gl-trial', params: { scope: 'MTD' } },
      'trial balance qtd': { path: 'gl-trial', params: { scope: 'QTD' } },
      'trial balance ytd': { path: 'gl-trial', params: { scope: 'YTD' } },
      'gl reports': { path: 'gl', params: { scope: 'MTD' } },
    }

    const config = endpointConfig[title]
    if (!config) {
      alert(`Download not configured for "${report?.title}" yet.`)
      return
    }

    const params = new URLSearchParams({ date: selectedDate, format })
    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        if (value != null && value !== '') params.set(key, value)
      })
    }

    const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/${config.path}?${params.toString()}`
    window.open(url, '_blank')
  }

  const monthsOfYear = useMemo(() => {
    // left sidebar: show just the selected month (since we navigated for a specific period)
    const obj = {}
    obj[selectedMonth] = { status: 'Done' }
    return obj
  }, [selectedMonth])

  return (
    <>
      <Container fluid className="d-flex justify-content-center align-items-center vh-100">
        <Card className="shadow-lg w-100 mt-1" style={{ maxWidth: '100%', height: '100vh' }}>
          <CardHeader className="bg-light d-flex justify-content-between align-items-center">
            <CardTitle className="m-0 fw-bold">
              Reports Management — <span className="text-muted">{selectedDate || 'No date'}</span>
            </CardTitle>
          </CardHeader>

          <CardBody className="d-flex h-100">
            {/* Left Sidebar */}
            <div className="p-3 bg-light shadow-sm d-flex flex-column" style={{ width: '250px', height: '100%' }}>
              {/* Year selection (kept) */}
              <Dropdown className="mb-3">
                <DropdownToggle variant="primary" className="w-100">Year: {selectedYear}</DropdownToggle>
                <DropdownMenu>
                  {allYears.map((y) => (
                    <DropdownItem key={y} onClick={() => setSelectedYear(y)}>{y}</DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>

              {/* Month list (filtered to context) */}
              <h6 className="fw-bold text-muted mb-2">Month</h6>
              {Object.keys(monthsOfYear).map((m) => (
                <Button
                  key={m}
                  variant={selectedMonth === m ? 'primary' : 'outline-secondary'}
                  className="w-100 text-start mb-2 d-flex justify-content-between align-items-center"
                  onClick={() => handleMonthChange(m)}
                >
                  {m}
                  {monthsOfYear[m].status === 'Done'
                    ? <CheckCircle size={16} className="text-success" />
                    : <XCircle size={16} className="text-warning" />
                  }
                </Button>
              ))}
            </div>

            {/* Right Side - Reports Section */}
            <div className="flex-grow-1 d-flex flex-column h-100 p-3">
              <h5 className="fw-bold mb-3">
                {selectedMonth} Reports — {selectedYear}
              </h5>
              <div className="overflow-auto flex-grow-1" style={{ maxHeight: '80vh' }}>
                <Row>
                  {reportsData[selectedYear]?.[selectedMonth]?.reports?.length ? (
                    reportsData[selectedYear][selectedMonth].reports.map((report) => (
                      <Col md={4} lg={3} key={report.id} className="mb-3">
                        <motion.div whileHover={{ scale: 1.02 }} className="h-100">
                          <Card className="shadow-sm h-100 d-flex flex-column">
                            <CardHeader className="d-flex justify-content-between align-items-center bg-light">
                              <CardTitle className="m-0">{report.title}</CardTitle>
                              <span className={`badge ${report.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                {report.status}
                              </span>
                            </CardHeader>
                            <CardBody className="d-flex flex-column justify-content-between h-100">
                              {/* 👇 Always show the exact period date we navigated with */}
                              <p className="text-muted mb-0">Date: {selectedDate || '-'}</p>
                              <div className="d-flex justify-content-between align-items-center mt-2">
                                <Button variant="outline-primary" size="sm" onClick={() => handleViewReport(report)}>
                                  <Eye size={16} /> View
                                </Button>
                                {/* <Dropdown>
                                  <Dropdown.Toggle variant="outline-success" size="sm" className="d-flex align-items-center">
                                    <Download size={16} />
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu align="end" style={{ minWidth: '170px' }}>
                                    <DropdownItem onClick={() => handleDownloadReport(report, 'xlsx')}>📊 Excel</DropdownItem>
                                    <DropdownItem onClick={() => handleDownloadReport(report, 'csv')}>📄 CSV</DropdownItem>
                                    <DropdownItem onClick={() => handleDownloadReport(report, 'pdf')}>📕 PDF</DropdownItem>
                                    <DropdownItem onClick={() => handleDownloadReport(report, 'txt')}>📜 TXT</DropdownItem>
                                  </Dropdown.Menu>
                                </Dropdown> */}
                              </div>
                            </CardBody>
                          </Card>
                        </motion.div>
                      </Col>
                    ))
                  ) : (
                    <Col className="text-center mt-4">
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <Card className="p-4 shadow-sm border-0" style={{ maxWidth: '400px' }}>
                          <div className="text-center">
                            <motion.div animate={{ scale: [0.9, 1] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}>
                              <XCircle size={48} className="text-danger mb-3" />
                            </motion.div>
                            <h5 className="fw-bold text-muted">No Reports Found</h5>
                            <p className="text-muted small">It looks like there are no reports available for this period.</p>
                          </div>
                        </Card>
                      </motion.div>
                    </Col>
                  )}
                </Row>
              </div>
            </div>
          </CardBody>
        </Card>
      </Container>

      {/* 🔗 Pass fundId + selectedDate into every modal */}
      <LotSummaryModal      show={showLotSummary}      handleClose={() => setShowLotSummary(false)}      report={selectedReport} fundId={fundId} date={selectedDate} />
      <RPNLReportModal      show={showRpnl}            handleClose={() => setShowRpnl(false)}            report={selectedReport} fundId={fundId} date={selectedDate} />
      <BalanceSheetModal    show={showBalanceSheet}    handleClose={() => setShowBalanceSheet(false)}    report={selectedReport} fundId={fundId} date={selectedDate} />
      <PurchaseSalesModal   show={showPurchaseSales}   handleClose={() => setShowPurchaseSales(false)}   report={selectedReport} fundId={fundId} date={selectedDate} />
      <ProfitLossModal      show={showProfitLoss}      handleClose={() => setShowProfitLoss(false)}      report={selectedReport} fundId={fundId} date={selectedDate} />
      <TrialBalanceMTDModal show={showTrialBalanceMTD} handleClose={() => setShowTrialBalanceMTD(false)} report={selectedReport} fundId={fundId} date={selectedDate} />
      <TrialBalanceQTDModal show={showTrialBalanceQTD} handleClose={() => setShowTrialBalanceQTD(false)} report={selectedReport} fundId={fundId} date={selectedDate} />
      <TrialBalanceYTDModal show={showTrialBalanceYTD} handleClose={() => setShowTrialBalanceYTD(false)} report={selectedReport} fundId={fundId} date={selectedDate} />
      <GLReportsModal       show={showGLReport}        handleClose={() => setShowGLReport(false)}        report={selectedReport} fundId={fundId} date={selectedDate} />
    </>
  )
}

export default ReportsPage


// 24/09/2025
// 'use client'

// import { useState } from 'react'
// import {
//   Button,
//   Card,
//   CardBody,
//   CardHeader,
//   CardTitle,
//   Col,
//   Dropdown,
//   DropdownItem,
//   DropdownMenu,
//   DropdownToggle,
//   Row,
//   Container,
// } from 'react-bootstrap'
// import { motion } from 'framer-motion'
// import { Eye, Download, CheckCircle, XCircle } from 'lucide-react'
// import {
//   LotSummaryModal,
//   RPNLReportModal,
//   BalanceSheetModal,
//   PurchaseSalesModal,
//   ProfitLossModal,
//   TrialBalanceMTDModal,
//   TrialBalanceQTDModal,
//   TrialBalanceYTDModal,
//   GLReportsModal,
// } from '@/app/(admin)/reports/modals'

// const ReportsPage = () => {
//   const allYears = ['2024', '2025']
//   const [selectedYear, setSelectedYear] = useState('2025')
//   const [selectedMonth, setSelectedMonth] = useState('January')
//   const [selectedReport, setSelectedReport] = useState(null)

//   // State for controlling modals
//   const [showLotSummary, setShowLotSummary] = useState(false)
//   const [showRpnl, setShowRpnl] = useState(false)
//   const [showBalanceSheet, setShowBalanceSheet] = useState(false)
//   const [showPurchaseSales, setShowPurchaseSales] = useState(false)
//   const [showProfitLoss, setShowProfitLoss] = useState(false)
//   const [showTrialBalanceMTD, setShowTrialBalanceMTD] = useState(false)
//   const [showTrialBalanceQTD, setShowTrialBalanceQTD] = useState(false)
//   const [showTrialBalanceYTD, setShowTrialBalanceYTD] = useState(false)
//   const [showGLReport, setShowGLReport] = useState(false)

//   const reportsData = {
//     2024: {},
//     2025: {
//       January: {
//         status: 'Done',
//         reports: [
//           { id: 1, title: 'Lot Summary', date: '2025-01-31', status: 'Completed' },
//           { id: 2, title: 'RPNL', date: '2025-01-31', status: 'Completed' },
//           { id: 3, title: 'Balance Sheet', date: '2025-01-31', status: 'Completed' },
//           { id: 4, title: 'Trial Balance MTD', date: '2025-01-31', status: 'Completed' },
//           { id: 5, title: 'Trial Balance QTD', date: '2025-01-31', status: 'Completed' },
//           { id: 6, title: 'Trial Balance YTD', date: '2025-01-31', status: 'Completed' },
//           { id: 7, title: 'GL Reports', date: '2025-01-31', status: 'Completed' },
//           { id: 8, title: 'Profit and Loss', date: '2025-01-31', status: 'Completed' },
//           { id: 9, title: 'Purchase & Sales', date: '2025-01-31', status: 'Completed' },
//         ],
//       },
//     },
//   }

//   const handleMonthChange = (month) => {
//     setSelectedMonth(month)
//   }

//   const handleViewReport = (report) => {
//     setSelectedReport(report)

//     switch (report.title) {
//       case 'Lot Summary':
//         setShowLotSummary(true)
//         break
//       case 'RPNL':
//         setShowRpnl(true)
//         break
//       case 'Balance Sheet':
//         setShowBalanceSheet(true)
//         break
//       case 'Purchase & Sales':
//         setShowPurchaseSales(true)
//         break
//       case 'Profit and Loss':
//         setShowProfitLoss(true)
//         break
//       case 'Trial Balance MTD':
//         setShowTrialBalanceMTD(true)
//         break
//       case 'Trial Balance QTD':
//         setShowTrialBalanceQTD(true)
//         break
//       case 'Trial Balance YTD':
//         setShowTrialBalanceYTD(true)
//         break
//       case 'GL Reports':
//         setShowGLReport(true)
//         break
//       default:
//         break
//     }
//   }

//   return (
//     <>
//       <Container fluid className="d-flex justify-content-center align-items-center vh-100">
//         <Card className="shadow-lg w-100 mt-1" style={{ maxWidth: '100%', height: '100vh' }}>
//           {/* Card Header */}
//           <CardHeader className="bg-light d-flex justify-content-between align-items-center">
//             <CardTitle className="m-0 fw-bold">Reports Management</CardTitle>
//           </CardHeader>

//           {/* Card Body */}
//           <CardBody className="d-flex h-100">
//             {/* Left Sidebar */}
//             <div className="p-3 bg-light shadow-sm d-flex flex-column" style={{ width: '250px', height: '100%' }}>
//               {/* Year Selection Dropdown */}
//               <Dropdown className="mb-3">
//                 <DropdownToggle variant="primary" className="w-100">
//                   Year: {selectedYear}
//                 </DropdownToggle>
//                 <DropdownMenu>
//                   {allYears.map((year) => (
//                     <DropdownItem key={year} onClick={() => setSelectedYear(year)}>
//                       {year}
//                     </DropdownItem>
//                   ))}
//                 </DropdownMenu>
//               </Dropdown>

//               {/* Month List */}
//               <h6 className="fw-bold text-muted mb-2">Months</h6>
//               {Object.keys(reportsData[selectedYear] || {}).map((month) => (
//                 <Button
//                   key={month}
//                   variant={selectedMonth === month ? 'primary' : 'outline-secondary'}
//                   className="w-100 text-start mb-2 d-flex justify-content-between align-items-center"
//                   onClick={() => handleMonthChange(month)}>
//                   {month}
//                   {reportsData[selectedYear][month].status === 'Done' ? (
//                     <CheckCircle size={16} className="text-success" />
//                   ) : (
//                     <XCircle size={16} className="text-warning" />
//                   )}
//                 </Button>
//               ))}
//             </div>

//             {/* Right Side - Reports Section */}
//             <div className="flex-grow-1 d-flex flex-column h-100 p-3">
//               <h5 className="fw-bold mb-3">
//                 {selectedMonth} Reports - {selectedYear}
//               </h5>
//               <div className="overflow-auto flex-grow-1" style={{ maxHeight: '80vh' }}>
//                 <Row>
//                   {reportsData[selectedYear][selectedMonth]?.reports.length > 0 ? (
//                     reportsData[selectedYear][selectedMonth].reports.map((report) => (
//                       <Col md={4} lg={3} key={report.id}>
//                         <div whileHover={{ scale: 1.02 }} className="h-100">
//                           <Card className="shadow-sm h-100 d-flex flex-column">
//                             <CardHeader className="d-flex justify-content-between align-items-center bg-light">
//                               <CardTitle className="m-0">{report.title}</CardTitle>
//                               <span className={`badge ${report.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark'}`}>
//                                 {report.status}
//                               </span>
//                             </CardHeader>
//                             <CardBody className="d-flex flex-column justify-content-between h-100">
//                               <p className="text-muted mb-0">Date: {report.date}</p>
//                               <div className="d-flex justify-content-between align-items-center">
//                                 {/* View Button */}
//                                 <Button variant="outline-primary" size="sm" onClick={() => handleViewReport(report)}>
//                                   <Eye size={16} /> View
//                                 </Button>

//                                 {/* Download Button with Hover Dropdown */}
//                                 <Dropdown className="position-relative">
//                                   <Dropdown.Toggle
//                                     variant="outline-success"
//                                     size="sm"
//                                     className="d-flex align-items-center"
//                                     style={{ position: 'relative' }}>
//                                     <Download size={16} />
//                                   </Dropdown.Toggle>

//                                   {/* Dropdown Menu appears on hover */}
//                                   <Dropdown.Menu align="end" style={{ minWidth: '150px' }}>
//                                     <DropdownItem onClick={() => handleDownloadReport(report, 'xlsx')}>📊 Download as Excel</DropdownItem>
//                                     <DropdownItem onClick={() => handleDownloadReport(report, 'csv')}>📄 Download as CSV</DropdownItem>
//                                     <DropdownItem onClick={() => handleDownloadReport(report, 'pdf')}>📕 Download as PDF</DropdownItem>
//                                     <DropdownItem onClick={() => handleDownloadReport(report, 'txt')}>📜 Download as TXT</DropdownItem>
//                                   </Dropdown.Menu>
//                                 </Dropdown>
//                               </div>
//                             </CardBody>
//                           </Card>
//                         </div>
//                       </Col>
//                     ))
//                   ) : (
//                     <Col className="text-center mt-4">
//                       <motion.div
//                         initial={{ opacity: 0, y: 20 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{ duration: 0.5 }}
//                         className="d-flex flex-column align-items-center justify-content-center">
//                         <Card className="p-4 shadow-sm border-0" style={{ maxWidth: '400px' }}>
//                           <div className="text-center">
//                             {/* Professional Illustration (Use an SVG or Lucide React Icon) */}
//                             <motion.div animate={{ scale: [0.9, 1] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}>
//                               <XCircle size={48} className="text-danger mb-3" />
//                             </motion.div>

//                             <h5 className="fw-bold text-muted">No Reports Found</h5>
//                             <p className="text-muted small">It looks like there are no reports available for this month.</p>
//                           </div>
//                         </Card>
//                       </motion.div>
//                     </Col>
//                   )}
//                 </Row>
//               </div>
//             </div>
//           </CardBody>
//         </Card>
//       </Container>

//       {/* Modals (Linked to View Button) */}
//       <LotSummaryModal show={showLotSummary} handleClose={() => setShowLotSummary(false)} report={selectedReport} />
//       <RPNLReportModal show={showRpnl} handleClose={() => setShowRpnl(false)} report={selectedReport} />
//       <BalanceSheetModal show={showBalanceSheet} handleClose={() => setShowBalanceSheet(false)} report={selectedReport} />
//       <PurchaseSalesModal show={showPurchaseSales} handleClose={() => setShowPurchaseSales(false)} report={selectedReport} />
//       <ProfitLossModal show={showProfitLoss} handleClose={() => setShowProfitLoss(false)} report={selectedReport} />
//       <TrialBalanceMTDModal show={showTrialBalanceMTD} handleClose={() => setShowTrialBalanceMTD(false)} report={selectedReport} />
//       <TrialBalanceQTDModal show={showTrialBalanceQTD} handleClose={() => setShowTrialBalanceQTD(false)} report={selectedReport} />
//       <TrialBalanceYTDModal show={showTrialBalanceYTD} handleClose={() => setShowTrialBalanceYTD(false)} report={selectedReport} />
//       <GLReportsModal show={showGLReport} handleClose={() => setShowGLReport(false)} report={selectedReport} />
//     </>
//   )
// }

// export default ReportsPage
