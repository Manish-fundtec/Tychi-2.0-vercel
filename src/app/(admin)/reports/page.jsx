'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Col,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Row,
  Container,
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

const ReportsPage = () => {
  const allYears = ['2024', '2025']
  const [selectedYear, setSelectedYear] = useState('2025')
  const [selectedMonth, setSelectedMonth] = useState('January')
  const [selectedReport, setSelectedReport] = useState(null)

  // State for controlling modals
  const [showLotSummary, setShowLotSummary] = useState(false)
  const [showRpnl, setShowRpnl] = useState(false)
  const [showBalanceSheet, setShowBalanceSheet] = useState(false)
  const [showPurchaseSales, setShowPurchaseSales] = useState(false)
  const [showProfitLoss, setShowProfitLoss] = useState(false)
  const [showTrialBalanceMTD, setShowTrialBalanceMTD] = useState(false)
  const [showTrialBalanceQTD, setShowTrialBalanceQTD] = useState(false)
  const [showTrialBalanceYTD, setShowTrialBalanceYTD] = useState(false)
  const [showGLReport, setShowGLReport] = useState(false)

  const reportsData = {
    2024: {},
    2025: {
      January: {
        status: 'Done',
        reports: [
          { id: 1, title: 'Lot Summary', date: '2025-01-31', status: 'Completed' },
          { id: 2, title: 'RPNL', date: '2025-01-31', status: 'Completed' },
          { id: 3, title: 'Balance Sheet', date: '2025-01-31', status: 'Completed' },
          { id: 4, title: 'Trial Balance MTD', date: '2025-01-31', status: 'Completed' },
          { id: 5, title: 'Trial Balance QTD', date: '2025-01-31', status: 'Completed' },
          { id: 6, title: 'Trial Balance YTD', date: '2025-01-31', status: 'Completed' },
          { id: 7, title: 'GL Reports', date: '2025-01-31', status: 'Completed' },
          { id: 8, title: 'Profit and Loss', date: '2025-01-31', status: 'Completed' },
          { id: 9, title: 'Purchase & Sales', date: '2025-01-31', status: 'Completed' },
        ],
      },
    },
  }

  const handleMonthChange = (month) => {
    setSelectedMonth(month)
  }

  const handleViewReport = (report) => {
    setSelectedReport(report)

    switch (report.title) {
      case 'Lot Summary':
        setShowLotSummary(true)
        break
      case 'RPNL':
        setShowRpnl(true)
        break
      case 'Balance Sheet':
        setShowBalanceSheet(true)
        break
      case 'Purchase & Sales':
        setShowPurchaseSales(true)
        break
      case 'Profit and Loss':
        setShowProfitLoss(true)
        break
      case 'Trial Balance MTD':
        setShowTrialBalanceMTD(true)
        break
      case 'Trial Balance QTD':
        setShowTrialBalanceQTD(true)
        break
      case 'Trial Balance YTD':
        setShowTrialBalanceYTD(true)
        break
      case 'GL Reports':
        setShowGLReport(true)
        break
      default:
        break
    }
  }

  return (
    <>
      <Container fluid className="d-flex justify-content-center align-items-center vh-100">
        <Card className="shadow-lg w-100 mt-1" style={{ maxWidth: '100%', height: '100vh' }}>
          {/* Card Header */}
          <CardHeader className="bg-light d-flex justify-content-between align-items-center">
            <CardTitle className="m-0 fw-bold">Reports Management</CardTitle>
          </CardHeader>

          {/* Card Body */}
          <CardBody className="d-flex h-100">
            {/* Left Sidebar */}
            <div className="p-3 bg-light shadow-sm d-flex flex-column" style={{ width: '250px', height: '100%' }}>
              {/* Year Selection Dropdown */}
              <Dropdown className="mb-3">
                <DropdownToggle variant="primary" className="w-100">
                  Year: {selectedYear}
                </DropdownToggle>
                <DropdownMenu>
                  {allYears.map((year) => (
                    <DropdownItem key={year} onClick={() => setSelectedYear(year)}>
                      {year}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>

              {/* Month List */}
              <h6 className="fw-bold text-muted mb-2">Months</h6>
              {Object.keys(reportsData[selectedYear] || {}).map((month) => (
                <Button
                  key={month}
                  variant={selectedMonth === month ? 'primary' : 'outline-secondary'}
                  className="w-100 text-start mb-2 d-flex justify-content-between align-items-center"
                  onClick={() => handleMonthChange(month)}>
                  {month}
                  {reportsData[selectedYear][month].status === 'Done' ? (
                    <CheckCircle size={16} className="text-success" />
                  ) : (
                    <XCircle size={16} className="text-warning" />
                  )}
                </Button>
              ))}
            </div>

            {/* Right Side - Reports Section */}
            <div className="flex-grow-1 d-flex flex-column h-100 p-3">
              <h5 className="fw-bold mb-3">
                {selectedMonth} Reports - {selectedYear}
              </h5>
              <div className="overflow-auto flex-grow-1" style={{ maxHeight: '80vh' }}>
                <Row>
                  {reportsData[selectedYear][selectedMonth]?.reports.length > 0 ? (
                    reportsData[selectedYear][selectedMonth].reports.map((report) => (
                      <Col md={4} lg={3} key={report.id}>
                        <div whileHover={{ scale: 1.02 }} className="h-100">
                          <Card className="shadow-sm h-100 d-flex flex-column">
                            <CardHeader className="d-flex justify-content-between align-items-center bg-light">
                              <CardTitle className="m-0">{report.title}</CardTitle>
                              <span className={`badge ${report.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                {report.status}
                              </span>
                            </CardHeader>
                            <CardBody className="d-flex flex-column justify-content-between h-100">
                              <p className="text-muted mb-0">Date: {report.date}</p>
                              <div className="d-flex justify-content-between align-items-center">
                                {/* View Button */}
                                <Button variant="outline-primary" size="sm" onClick={() => handleViewReport(report)}>
                                  <Eye size={16} /> View
                                </Button>

                                {/* Download Button with Hover Dropdown */}
                                <Dropdown className="position-relative">
                                  <Dropdown.Toggle
                                    variant="outline-success"
                                    size="sm"
                                    className="d-flex align-items-center"
                                    style={{ position: 'relative' }}>
                                    <Download size={16} />
                                  </Dropdown.Toggle>

                                  {/* Dropdown Menu appears on hover */}
                                  <Dropdown.Menu align="end" style={{ minWidth: '150px' }}>
                                    <DropdownItem onClick={() => handleDownloadReport(report, 'xlsx')}>📊 Download as Excel</DropdownItem>
                                    <DropdownItem onClick={() => handleDownloadReport(report, 'csv')}>📄 Download as CSV</DropdownItem>
                                    <DropdownItem onClick={() => handleDownloadReport(report, 'pdf')}>📕 Download as PDF</DropdownItem>
                                    <DropdownItem onClick={() => handleDownloadReport(report, 'txt')}>📜 Download as TXT</DropdownItem>
                                  </Dropdown.Menu>
                                </Dropdown>
                              </div>
                            </CardBody>
                          </Card>
                        </div>
                      </Col>
                    ))
                  ) : (
                    <Col className="text-center mt-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="d-flex flex-column align-items-center justify-content-center">
                        <Card className="p-4 shadow-sm border-0" style={{ maxWidth: '400px' }}>
                          <div className="text-center">
                            {/* Professional Illustration (Use an SVG or Lucide React Icon) */}
                            <motion.div animate={{ scale: [0.9, 1] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}>
                              <XCircle size={48} className="text-danger mb-3" />
                            </motion.div>

                            <h5 className="fw-bold text-muted">No Reports Found</h5>
                            <p className="text-muted small">It looks like there are no reports available for this month.</p>
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

      {/* Modals (Linked to View Button) */}
      <LotSummaryModal show={showLotSummary} handleClose={() => setShowLotSummary(false)} report={selectedReport} />
      <RPNLReportModal show={showRpnl} handleClose={() => setShowRpnl(false)} report={selectedReport} />
      <BalanceSheetModal show={showBalanceSheet} handleClose={() => setShowBalanceSheet(false)} report={selectedReport} />
      <PurchaseSalesModal show={showPurchaseSales} handleClose={() => setShowPurchaseSales(false)} report={selectedReport} />
      <ProfitLossModal show={showProfitLoss} handleClose={() => setShowProfitLoss(false)} report={selectedReport} />
      <TrialBalanceMTDModal show={showTrialBalanceMTD} handleClose={() => setShowTrialBalanceMTD(false)} report={selectedReport} />
      <TrialBalanceQTDModal show={showTrialBalanceQTD} handleClose={() => setShowTrialBalanceQTD(false)} report={selectedReport} />
      <TrialBalanceYTDModal show={showTrialBalanceYTD} handleClose={() => setShowTrialBalanceYTD(false)} report={selectedReport} />
      <GLReportsModal show={showGLReport} handleClose={() => setShowGLReport(false)} report={selectedReport} />
    </>
  )
}

export default ReportsPage
