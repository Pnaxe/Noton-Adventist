import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMoneyBillWave, 
  faCalendarAlt, 
  faDownload, 
  faPrint,
  faFilter,
  faArrowUp,
  faArrowDown,
  faChartLine,
  faSave,
  faFolderOpen,
  faTimes,
  faCheckCircle,
  faSpinner,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import { useNavigate } from 'react-router-dom';

const CashFlow = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('comparison'); // 'single' | 'comparison'
  const [reportType, setReportType] = useState('monthly'); // monthly | custom
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Multi-month comparison settings
  const [startMonth, setStartMonth] = useState(1);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [endMonth, setEndMonth] = useState(new Date().getMonth() + 1);
  const [endYear, setEndYear] = useState(new Date().getFullYear());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [data, setData] = useState(null);
  const [multiMonthData, setMultiMonthData] = useState(null);
  const [hideEmptyRows, setHideEmptyRows] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ message: null, type: 'success', visible: false });

  // Save/Load Modal States
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportTags, setReportTags] = useState('');
  const [savedReports, setSavedReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReportsForComparison, setSelectedReportsForComparison] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [showComparisonView, setShowComparisonView] = useState(false);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type, visible: true });
    
    if (duration > 0) {
      setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
        setTimeout(() => {
          setToast({ message: null, type: 'success', visible: false });
        }, 300);
      }, duration);
    }
  };

  const getToastIcon = (type) => {
    const iconProps = {
      width: '20',
      height: '20',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    };

    if (type === 'success') {
      return (
        <svg {...iconProps}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      );
    }
    if (type === 'error') {
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      );
    }
    return null;
  };

  const getToastBackgroundColor = (type) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#10b981';
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(null);
      setMultiMonthData(null);

      if (viewMode === 'comparison') {
        // Multi-month comparison view
        const params = new URLSearchParams({
          startMonth: startMonth.toString(),
          startYear: startYear.toString(),
          endMonth: endMonth.toString(),
          endYear: endYear.toString()
        }).toString();
        const resp = await axios.get(`${BASE_URL}/accounting/cash-flow/multi-month?${params}`, {
          headers: authHeaders
        });
        setMultiMonthData(resp.data);
      } else {
        // Single month view
      if (reportType === 'monthly') {
        const resp = await axios.get(`${BASE_URL}/accounting/cash-flow/month/${selectedMonth}/year/${selectedYear}`, {
          headers: authHeaders
        });
        setData(resp.data);
      } else if (reportType === 'custom') {
        if (!startDate || !endDate) {
          setError('Please select both start and end dates');
          setLoading(false);
          return;
        }
        const params = new URLSearchParams({ start: startDate, end: endDate }).toString();
        const resp = await axios.get(`${BASE_URL}/accounting/cash-flow/range?${params}`, {
          headers: authHeaders
        });
        setData(resp.data);
        }
      }
    } catch (e) {
      console.error('Error loading cash flow:', e);
      setError(e.response?.data?.error || 'Failed to load cash flow statement');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!data) {
      alert('No data to export. Please generate a report first.');
      return;
    }

    // Prepare CSV content
    const periodName = data.period?.period_name || 
                      (data.start_date && data.end_date ? `${data.start_date} to ${data.end_date}` : 'Cash Flow Statement');
    
    let csvContent = 'Cash Flow Statement\n';
    csvContent += `${periodName}\n\n`;
    
    // Cash Inflows
    csvContent += 'Cash In\n';
    csvContent += 'Account Code,Account Name,Amount\n';
    if ((data.cash_inflows || []).length === 0) {
      csvContent += 'No cash inflows in this period,,$0.00\n';
    } else {
      (data.cash_inflows || []).forEach(item => {
        csvContent += `${item.account_code},"${item.account_name}",${item.amount}\n`;
      });
    }
    csvContent += `Total Cash In,,${totals.total_inflows}\n\n`;
    
    // Cash Outflows
    csvContent += 'Cash Out\n';
    csvContent += 'Account Code,Account Name,Amount\n';
    if ((data.cash_outflows || []).length === 0) {
      csvContent += 'No cash outflows in this period,,$0.00\n';
    } else {
      (data.cash_outflows || []).forEach(item => {
        csvContent += `${item.account_code},"${item.account_name}",${item.amount}\n`;
      });
    }
    csvContent += `Total Cash Out,,${totals.total_outflows}\n\n`;
    
    // Summary
    csvContent += 'Summary\n';
    csvContent += `Net Cash Flow,,${totals.net_cash_flow}\n`;
    csvContent += `Beginning Cash & Bank Balance,,${totals.beginning_cash}\n`;
    csvContent += `Current Cash & Bank Position,,${totals.ending_cash}\n`;
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cash_flow_statement_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totals = data?.totals || { 
    total_inflows: 0, 
    total_outflows: 0, 
    net_cash_flow: 0,
    beginning_cash: 0,
    ending_cash: 0
  };

  const handleSaveReport = async () => {
    if (!data) {
      setError('Please generate a cash flow statement first');
      return;
    }
    setShowSaveModal(true);
    // Auto-populate report name
    let periodName = '';
    if (reportType === 'monthly') {
      periodName = `Cash Flow - ${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    } else {
      periodName = `Cash Flow - ${startDate} to ${endDate}`;
    }
    setReportName(periodName);
  };

  const saveReport = async () => {
    if (!reportName.trim()) {
      setError('Please enter a report name');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${BASE_URL}/accounting/saved-reports`, {
        report_type: 'cash_flow_statement',
        report_name: reportName,
        report_description: reportDescription,
        period_start_date: reportType === 'custom' ? startDate : null,
        period_end_date: reportType === 'custom' ? endDate : null,
        report_data: data,
        report_summary: {
          total_inflows: totals.total_inflows,
          total_outflows: totals.total_outflows,
          net_cash_flow: totals.net_cash_flow,
          beginning_cash: totals.beginning_cash,
          ending_cash: totals.ending_cash
        },
        tags: reportTags
      }, {
        headers: authHeaders
      });

      showToast('Report saved successfully!', 'success');
      setShowSaveModal(false);
      setReportName('');
      setReportDescription('');
      setReportTags('');
    } catch (err) {
      console.error('Error saving report:', err);
      setError(err.response?.data?.error || 'Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedReports = async () => {
    setLoadingReports(true);
    setError(null);
    try {
      const response = await axios.get(`${BASE_URL}/accounting/saved-reports`, {
        params: { report_type: 'cash_flow_statement' },
        headers: authHeaders
      });
      setSavedReports(response.data.data.reports);
      setShowLoadModal(true);
    } catch (err) {
      console.error('Error loading saved reports:', err);
      setError(err.response?.data?.error || 'Failed to load saved reports');
    } finally {
      setLoadingReports(false);
    }
  };

  const loadReport = async (reportId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/accounting/saved-reports/${reportId}`, {
        headers: authHeaders
      });

      const report = response.data.data;
      setData(report.report_data);
      setShowLoadModal(false);
      setShowComparisonView(false);
      setSuccess(`Loaded: ${report.report_name}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error loading report:', err);
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const openCompareModal = async () => {
    setLoadingReports(true);
    setError(null);
    try {
      const response = await axios.get(`${BASE_URL}/accounting/saved-reports`, {
        params: { report_type: 'cash_flow_statement' },
        headers: authHeaders
      });
      setSavedReports(response.data.data.reports);
      setSelectedReportsForComparison([]);
      setShowCompareModal(true);
    } catch (err) {
      console.error('Error loading saved reports:', err);
      setError(err.response?.data?.error || 'Failed to load saved reports');
    } finally {
      setLoadingReports(false);
    }
  };

  const toggleReportSelection = (reportId) => {
    setSelectedReportsForComparison(prev => {
      if (prev.includes(reportId)) {
        return prev.filter(id => id !== reportId);
      } else {
        if (prev.length >= 5) {
          setError('You can only compare up to 5 reports at once');
          setTimeout(() => setError(null), 3000);
          return prev;
        }
        return [...prev, reportId];
      }
    });
  };

  const compareReports = async () => {
    if (selectedReportsForComparison.length < 2) {
      setError('Please select at least 2 reports to compare');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const reportPromises = selectedReportsForComparison.map(id =>
        axios.get(`${BASE_URL}/accounting/saved-reports/${id}`, {
          headers: authHeaders
        })
      );

      const responses = await Promise.all(reportPromises);
      const reports = responses.map(r => r.data.data);

      // Build comparison data
      const allInflows = new Map();
      const allOutflows = new Map();
      
      reports.forEach((report, idx) => {
        // Process cash inflows
        if (report.report_data.cash_inflows) {
          report.report_data.cash_inflows.forEach(item => {
            if (!allInflows.has(item.account_code)) {
              allInflows.set(item.account_code, {
                account_code: item.account_code,
                account_name: item.account_name,
                amounts: []
              });
            }
            allInflows.get(item.account_code).amounts[idx] = item.amount || 0;
          });
        }

        // Process cash outflows
        if (report.report_data.cash_outflows) {
          report.report_data.cash_outflows.forEach(item => {
            if (!allOutflows.has(item.account_code)) {
              allOutflows.set(item.account_code, {
                account_code: item.account_code,
                account_name: item.account_name,
                amounts: []
              });
            }
            allOutflows.get(item.account_code).amounts[idx] = item.amount || 0;
          });
        }
      });

      // Fill missing amounts with zeros
      [allInflows, allOutflows].forEach(map => {
        map.forEach(account => {
          for (let i = 0; i < reports.length; i++) {
            if (!account.amounts[i]) account.amounts[i] = 0;
          }
        });
      });

      setComparisonData({
        reports: reports.map(r => ({
          id: r.id,
          name: r.report_name,
          period: r.period_start_date && r.period_end_date 
            ? `${r.period_start_date} to ${r.period_end_date}`
            : 'N/A',
          totals: r.report_data.totals
        })),
        inflows: Array.from(allInflows.values()),
        outflows: Array.from(allOutflows.values())
      });

      setShowCompareModal(false);
      setShowComparisonView(true);
      setSuccess(`Comparing ${reports.length} cash flow statements`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error comparing reports:', err);
      setError('Failed to load reports for comparison');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports-container" style={{ 
      height: '100%', 
      maxHeight: '100%', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column', 
      position: 'relative' 
    }}>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .printable-area, .printable-area * {
              visibility: visible;
            }
            .printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      {/* Report Header */}
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          <h2 className="report-title">Cash Flow Statement</h2>
          <p className="report-subtitle">Cash In & Cash Out Report</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={handleSaveReport}
            disabled={!data && !multiMonthData}
            className="btn-checklist"
            style={{ 
              backgroundColor: '#2563eb',
              opacity: (!data && !multiMonthData) ? 0.5 : 1,
              cursor: (!data && !multiMonthData) ? 'not-allowed' : 'pointer'
            }}
          >
            <FontAwesomeIcon icon={faSave} />
            Save
          </button>
          <button 
            onClick={loadSavedReports}
            disabled={loadingReports}
            className="btn-checklist"
            style={{ 
              backgroundColor: '#9333ea',
              opacity: loadingReports ? 0.5 : 1,
              cursor: loadingReports ? 'not-allowed' : 'pointer'
            }}
          >
            <FontAwesomeIcon icon={faFolderOpen} />
            Load
          </button>
          <button 
            onClick={openCompareModal}
            disabled={loadingReports}
            className="btn-checklist"
            style={{ 
              backgroundColor: '#ea580c',
              opacity: loadingReports ? 0.5 : 1,
              cursor: loadingReports ? 'not-allowed' : 'pointer'
            }}
          >
            <FontAwesomeIcon icon={faMoneyBillWave} />
            Compare
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div style={{ padding: '10px 30px', background: '#d1fae5', color: '#065f46', fontSize: '0.75rem', flexShrink: 0 }}>
          <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: '8px' }} />
          {success}
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', flexShrink: 0 }}>
          <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '8px' }} />
          {error}
        </div>
      )}

      {/* Filters Section */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left">
          {/* Report Type Switcher */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Report Type:</label>
            <select
              value="cash"
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'income') {
                  navigate('/dashboard/reports/income-statement');
                } else if (value === 'balance') {
                  navigate('/dashboard/reports/balance-sheet');
                } else if (value === 'cash') {
                  navigate('/dashboard/reports/cash-flow');
                }
              }}
              className="filter-input"
              style={{ minWidth: '170px', width: '170px' }}
            >
              <option value="income">Income Statement</option>
              <option value="balance">Balance Sheet</option>
              <option value="cash">Cash Flow Statement</option>
            </select>
          </div>

          {viewMode === 'comparison' ? (
            <>
              <div className="filter-group">
                <label className="filter-label" style={{ marginRight: '8px' }}>From Month:</label>
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(parseInt(e.target.value))}
                  className="filter-input"
                  style={{ minWidth: '150px', width: '150px' }}
                >
                  <option value={1}>January</option>
                  <option value={2}>February</option>
                  <option value={3}>March</option>
                  <option value={4}>April</option>
                  <option value={5}>May</option>
                  <option value={6}>June</option>
                  <option value={7}>July</option>
                  <option value={8}>August</option>
                  <option value={9}>September</option>
                  <option value={10}>October</option>
                  <option value={11}>November</option>
                  <option value={12}>December</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label" style={{ marginRight: '8px' }}>From Year:</label>
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(parseInt(e.target.value))}
                  className="filter-input"
                  style={{ minWidth: '120px', width: '120px' }}
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>{year}</option>
                    );
                  })}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label" style={{ marginRight: '8px' }}>To Month:</label>
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(parseInt(e.target.value))}
                  className="filter-input"
                  style={{ minWidth: '150px', width: '150px' }}
                >
                  <option value={1}>January</option>
                  <option value={2}>February</option>
                  <option value={3}>March</option>
                  <option value={4}>April</option>
                  <option value={5}>May</option>
                  <option value={6}>June</option>
                  <option value={7}>July</option>
                  <option value={8}>August</option>
                  <option value={9}>September</option>
                  <option value={10}>October</option>
                  <option value={11}>November</option>
                  <option value={12}>December</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label" style={{ marginRight: '8px' }}>To Year:</label>
                <select
                  value={endYear}
                  onChange={(e) => setEndYear(parseInt(e.target.value))}
                  className="filter-input"
                  style={{ minWidth: '120px', width: '120px' }}
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>{year}</option>
                    );
                  })}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="filter-group">
                <label className="filter-label" style={{ marginRight: '8px' }}>Period Type:</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="filter-input"
                  style={{ minWidth: '150px', width: '150px' }}
                >
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {reportType === 'monthly' && (
                <>
                  <div className="filter-group">
                    <label className="filter-label" style={{ marginRight: '8px' }}>Month:</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="filter-input"
                      style={{ minWidth: '150px', width: '150px' }}
                    >
                      <option value={1}>January</option>
                      <option value={2}>February</option>
                      <option value={3}>March</option>
                      <option value={4}>April</option>
                      <option value={5}>May</option>
                      <option value={6}>June</option>
                      <option value={7}>July</option>
                      <option value={8}>August</option>
                      <option value={9}>September</option>
                      <option value={10}>October</option>
                      <option value={11}>November</option>
                      <option value={12}>December</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label className="filter-label" style={{ marginRight: '8px' }}>Year:</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="filter-input"
                      style={{ minWidth: '120px', width: '120px' }}
                    >
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year}>{year}</option>
                        );
                      })}
                    </select>
                  </div>
                </>
              )}

              {reportType === 'custom' && (
                <>
                  <div className="filter-group">
                    <label className="filter-label" style={{ marginRight: '8px' }}>Start Date:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="filter-input"
                      style={{ minWidth: '150px', width: '150px' }}
                    />
                  </div>
                  <div className="filter-group">
                    <label className="filter-label" style={{ marginRight: '8px' }}>End Date:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || undefined}
                      className="filter-input"
                      style={{ minWidth: '150px', width: '150px' }}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <div className="report-filters-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={hideEmptyRows}
              onChange={(e) => setHideEmptyRows(e.target.checked)}
              style={{ width: '14px', height: '14px', cursor: 'pointer' }}
            />
            <span>Hide empty rows</span>
          </label>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="btn-checklist"
            style={{ 
              backgroundColor: '#1f2937',
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <FontAwesomeIcon icon={faFilter} />
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="report-content-container" style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
        padding: '20px 30px',
        height: '100%'
      }}>
        {/* Loading State */}
        {loading && !data && !multiMonthData && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              gap: '16px'
            }}
          >
            <div className="loading-spinner"></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading cash flow statement...</p>
          </div>
        )}

        {/* No Data State */}
        {!loading && !data && !multiMonthData && !error && (
          <div style={{ 
            background: 'white', 
            border: '1px solid var(--border-color)', 
            padding: '60px 30px', 
            textAlign: 'center',
            borderRadius: '4px'
          }}>
            <FontAwesomeIcon icon={faMoneyBillWave} style={{ color: 'var(--text-secondary)', fontSize: '3rem', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              No Cash Flow Data
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Select a period and click Search to view the cash flow statement data.
            </p>
          </div>
        )}

        {/* Report Title and Period - Comparison View */}
        {!loading && !error && multiMonthData && viewMode === 'comparison' && (
          <div style={{ 
            marginBottom: '16px',
            padding: '12px 0'
          }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
              Cash Flow Statement
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
              Monthly Comparison - {multiMonthData.fiscalYear}
            </p>
          </div>
        )}

        {/* Multi-Month Comparison Table */}
        {!loading && !error && multiMonthData && viewMode === 'comparison' && (
          <div className="bg-white border border-gray-200 printable-area overflow-x-auto">
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border-collapse">
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ 
                      padding: '12px 15px', 
                      textAlign: 'left', 
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: '#ffffff',
                      background: '#374151',
                      borderRight: '1px solid #e5e7eb',
                      position: 'sticky',
                      left: 0,
                      zIndex: 10,
                      minWidth: '200px'
                    }}>
                      Account
                    </th>
                    {multiMonthData.months.map((month, idx) => (
                      <th key={idx} style={{ 
                        padding: '12px 15px', 
                        textAlign: 'center', 
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        color: '#111827',
                        borderRight: '1px solid #e5e7eb',
                        background: '#ffffff',
                        minWidth: '100px'
                      }}>
                        {month.label}
                      </th>
                    ))}
                    <th style={{ 
                      padding: '12px 15px', 
                      textAlign: 'center', 
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      color: '#111827',
                      background: '#f9fafb',
                      minWidth: '100px'
                    }}>
                      FY-{multiMonthData.fiscalYear.split('-')[0].slice(-2)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Cash Flows from Operating Activities - Income (Revenue Accounts) */}
                  <tr className="bg-blue-50">
                    <td colSpan={multiMonthData.months.length + 2} className="px-3 py-2 font-bold text-gray-900 border-b border-gray-300">
                      Cash Flows from Operating Activities
                    </td>
                  </tr>
                  
                  {/* Revenue Accounts - dynamically from COA (ALL accounts) */}
                  {(() => {
                    // Use fiscal year totals as source of truth for complete account list (includes ALL accounts from COA)
                    const revenueArray = (multiMonthData.fiscalYearTotals?.categorizedInflows?.Revenue || []).sort((a, b) => 
                      a.account_code.localeCompare(b.account_code)
                    );
                    
                    if (revenueArray.length === 0) {
                      return (
                        <tr>
                          <td className="px-3 py-1.5 text-gray-500 italic border-r border-gray-200 sticky left-0 bg-white">
                            No revenue accounts
                          </td>
                          {multiMonthData.monthlyData.map((_, idx) => (
                            <td key={idx} className="px-3 py-1.5 text-right border-r border-gray-200">-</td>
                          ))}
                          <td className="px-3 py-1.5 text-right bg-gray-50">-</td>
                        </tr>
                      );
                    }
                    
                    return revenueArray
                      .filter(account => {
                        if (!hideEmptyRows) return true;
                        // Check if account has non-zero amount in fiscal year total or any month
                        const hasFiscalYearAmount = (account.amount || 0) !== 0;
                        const hasMonthlyAmount = multiMonthData.monthlyData.some(monthData => {
                          const revenueAccount = monthData.categorizedInflows?.Revenue?.find(
                            acc => acc.account_code === account.account_code
                          );
                          return (revenueAccount?.amount || 0) !== 0;
                        });
                        return hasFiscalYearAmount || hasMonthlyAmount;
                      })
                      .map((account, idx) => (
                      <tr key={account.account_code}>
                        <td className={`px-3 py-1.5 text-gray-700 border-r border-gray-200 sticky left-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          {account.account_name}
                        </td>
                        {multiMonthData.monthlyData.map((monthData, monthIdx) => {
                          const revenueAccount = monthData.categorizedInflows?.Revenue?.find(
                            acc => acc.account_code === account.account_code
                          );
                          const amount = revenueAccount?.amount || 0;
                          return (
                            <td key={monthIdx} className={`px-3 py-1.5 text-right border-r border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              {amount !== 0 ? formatCurrency(amount) : '-'}
                            </td>
                          );
                        })}
                        <td className={`px-3 py-1.5 text-right font-semibold ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'}`}>
                          {formatCurrency(account.amount || 0)}
                        </td>
                      </tr>
                    ));
                  })()}
                  
                  {/* Asset Inflows (Collections from AR, etc.) - Operating Activities */}
                  {(() => {
                    // Use fiscal year totals as source of truth for complete account list
                    const assetInflowArray = (multiMonthData.fiscalYearTotals?.categorizedInflows?.Asset || []).sort((a, b) => 
                      a.account_code.localeCompare(b.account_code)
                    );
                    
                    if (assetInflowArray.length > 0 && assetInflowArray.some(acc => (acc.amount || 0) !== 0)) {
                      return (
                        <>
                          <tr className="bg-green-50">
                            <td colSpan={multiMonthData.months.length + 2} className="px-3 py-2 font-bold text-gray-900 border-t-2 border-b border-gray-300">
                              Collections from Accounts Receivable & Other Assets (Operating)
                            </td>
                          </tr>
                          {assetInflowArray.map((account, idx) => {
                            // Only show accounts that have non-zero amounts in at least one month
                            const hasNonZero = multiMonthData.monthlyData.some(monthData => {
                              const accountData = monthData.categorizedInflows?.Asset?.find(
                                acc => acc.account_code === account.account_code
                              );
                              return (accountData?.amount || 0) !== 0;
                            }) || (account.amount || 0) !== 0;
                            
                            if (!hasNonZero) return null;
                            
                            return (
                              <tr key={account.account_code}>
                                <td className={`px-3 py-1.5 text-gray-700 border-r border-gray-200 sticky left-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                  {account.account_name}
                                </td>
                                {multiMonthData.monthlyData.map((monthData, monthIdx) => {
                                  const assetAccount = monthData.categorizedInflows?.Asset?.find(
                                    acc => acc.account_code === account.account_code
                                  );
                                  const amount = assetAccount?.amount || 0;
                                  return (
                                    <td key={monthIdx} className={`px-3 py-1.5 text-right border-r border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                      {amount !== 0 ? formatCurrency(amount) : '-'}
                                    </td>
                                  );
                                })}
                                <td className={`px-3 py-1.5 text-right font-semibold ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'}`}>
                                  {formatCurrency(account.amount || 0)}
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Total Operating Income */}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="px-3 py-2 text-gray-900 border-r border-gray-300 sticky left-0 bg-gray-100">Total Cash Flows from Operating Activities (Income)</td>
                    {multiMonthData.monthlyData.map((monthData, idx) => {
                      const revenueTotal = monthData.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const assetInflowTotal = monthData.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const total = revenueTotal + assetInflowTotal;
                      return (
                        <td key={idx} className="px-3 py-2 text-right border-r border-gray-300">
                          {formatCurrency(total)}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right font-bold bg-gray-200">
                      {formatCurrency(
                        (multiMonthData.fiscalYearTotals?.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0) +
                        (multiMonthData.fiscalYearTotals?.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0)
                      )}
                    </td>
                  </tr>
                  
                  {/* Operating Activities - Expenses (Expense Accounts from COA) */}
                  <tr className="bg-red-50">
                    <td colSpan={multiMonthData.months.length + 2} className="px-3 py-2 font-bold text-gray-900 border-t-2 border-b border-gray-300">
                      Operating Activities (Expense Section)
                    </td>
                  </tr>
                  
                  {/* Expense Accounts - dynamically from COA (ALL accounts) */}
                  {(() => {
                    // Use fiscal year totals as source of truth for complete account list (includes ALL accounts from COA)
                    const expenseArray = (multiMonthData.fiscalYearTotals?.categorizedOutflows?.Expense || []).sort((a, b) => 
                      a.account_code.localeCompare(b.account_code)
                    );
                    
                    if (expenseArray.length === 0) {
                      return (
                        <tr>
                          <td className="px-3 py-1.5 text-gray-500 italic border-r border-gray-200 sticky left-0 bg-white">
                            No expense accounts
                          </td>
                          {multiMonthData.monthlyData.map((_, idx) => (
                            <td key={idx} className="px-3 py-1.5 text-right border-r border-gray-200">-</td>
                          ))}
                          <td className="px-3 py-1.5 text-right bg-gray-50">-</td>
                        </tr>
                      );
                    }
                    
                    return expenseArray
                      .filter(account => {
                        if (!hideEmptyRows) return true;
                        // Check if account has non-zero amount in fiscal year total or any month
                        const hasFiscalYearAmount = (account.amount || 0) !== 0;
                        const hasMonthlyAmount = multiMonthData.monthlyData.some(monthData => {
                          const expenseAccount = monthData.categorizedOutflows?.Expense?.find(
                            acc => acc.account_code === account.account_code
                          );
                          return (expenseAccount?.amount || 0) !== 0;
                        });
                        return hasFiscalYearAmount || hasMonthlyAmount;
                      })
                      .map((account, idx) => (
                      <tr key={account.account_code}>
                        <td className={`px-3 py-1.5 text-gray-700 border-r border-gray-200 sticky left-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          {account.account_name}
                        </td>
                        {multiMonthData.monthlyData.map((monthData, monthIdx) => {
                          const expenseAccount = monthData.categorizedOutflows?.Expense?.find(
                            acc => acc.account_code === account.account_code
                          );
                          const amount = expenseAccount?.amount || 0;
                          return (
                            <td key={monthIdx} className={`px-3 py-1.5 text-right border-r border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              {amount !== 0 ? formatCurrency(amount) : '-'}
                            </td>
                          );
                        })}
                        <td className={`px-3 py-1.5 text-right font-semibold ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'}`}>
                          {formatCurrency(account.amount || 0)}
                        </td>
                      </tr>
                    ));
                  })()}
                  
                  {/* Total Operating Expenses */}
                  <tr className="bg-red-100 font-semibold">
                    <td className="px-3 py-2 text-gray-900 border-r border-gray-300 sticky left-0 bg-red-100">Total Operating Expenses</td>
                    {multiMonthData.monthlyData.map((monthData, idx) => {
                      const total = monthData.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      return (
                        <td key={idx} className="px-3 py-2 text-right border-r border-gray-300">
                          {formatCurrency(total)}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right font-bold bg-red-200">
                      {formatCurrency(
                        multiMonthData.fiscalYearTotals?.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0
                      )}
                    </td>
                  </tr>
                  
                  {/* Total Cash Flows from Operating Activities */}
                  <tr className="bg-gray-200 font-bold border-t-2 border-gray-400">
                    <td className="px-3 py-2 text-gray-900 border-r border-gray-300 sticky left-0 bg-gray-200">Total Cash Flows from Operating Activities</td>
                    {multiMonthData.monthlyData.map((monthData, idx) => {
                      // Calculate: (Total Revenue + Asset Inflows) - Total Expenses
                      const totalRevenue = monthData.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const assetInflowTotal = monthData.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const totalExpenses = monthData.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const operatingTotal = (totalRevenue + assetInflowTotal) - totalExpenses;
                      return (
                        <td key={idx} className={`px-3 py-2 text-right border-r border-gray-300 ${operatingTotal < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(operatingTotal)}
                        </td>
                      );
                    })}
                    <td className={`px-3 py-2 text-right font-bold bg-gray-300 ${
                      (() => {
                        const fyTotalRevenue = multiMonthData.fiscalYearTotals?.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyAssetInflowTotal = multiMonthData.fiscalYearTotals?.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyTotalExpenses = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyOperatingTotal = (fyTotalRevenue + fyAssetInflowTotal) - fyTotalExpenses;
                        return fyOperatingTotal < 0 ? 'text-red-600' : 'text-green-600';
                      })()
                    }`}>
                      {(() => {
                        const fyTotalRevenue = multiMonthData.fiscalYearTotals?.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyAssetInflowTotal = multiMonthData.fiscalYearTotals?.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyTotalExpenses = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyOperatingTotal = (fyTotalRevenue + fyAssetInflowTotal) - fyTotalExpenses;
                        return formatCurrency(fyOperatingTotal);
                      })()}
                    </td>
                  </tr>
                  
                  {/* Cash Flows From Investing Activities (Asset Accounts from COA) */}
                  <tr className="bg-purple-50">
                    <td colSpan={multiMonthData.months.length + 2} className="px-3 py-2 font-bold text-gray-900 border-t-2 border-b border-gray-300">
                      Cash Flows From Investing Activities
                    </td>
                  </tr>
                  
                  {(() => {
                    // Use fiscal year totals as source of truth for complete account list (includes ALL accounts from COA)
                    const assetArray = (multiMonthData.fiscalYearTotals?.categorizedOutflows?.Asset || []).sort((a, b) => 
                      a.account_code.localeCompare(b.account_code)
                    );
                    
                    if (assetArray.length === 0) {
                      return (
                        <tr>
                          <td className="px-3 py-1.5 text-gray-500 italic border-r border-gray-200 sticky left-0 bg-white">
                            No investing activities
                          </td>
                          {multiMonthData.monthlyData.map((_, idx) => (
                            <td key={idx} className="px-3 py-1.5 text-right border-r border-gray-200">-</td>
                          ))}
                          <td className="px-3 py-1.5 text-right bg-gray-50">-</td>
                        </tr>
                      );
                    }
                    
                    return assetArray
                      .filter(account => {
                        if (!hideEmptyRows) return true;
                        // Check if account has non-zero amount in fiscal year total or any month
                        const hasFiscalYearAmount = (account.amount || 0) !== 0;
                        const hasMonthlyAmount = multiMonthData.monthlyData.some(monthData => {
                          const assetAccount = monthData.categorizedOutflows?.Asset?.find(
                            acc => acc.account_code === account.account_code
                          );
                          return (assetAccount?.amount || 0) !== 0;
                        });
                        return hasFiscalYearAmount || hasMonthlyAmount;
                      })
                      .map((account, idx) => (
                      <tr key={account.account_code}>
                        <td className={`px-3 py-1.5 text-gray-700 border-r border-gray-200 sticky left-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          {account.account_name}
                        </td>
                        {multiMonthData.monthlyData.map((monthData, monthIdx) => {
                          const assetAccount = monthData.categorizedOutflows?.Asset?.find(
                            acc => acc.account_code === account.account_code
                          );
                          const amount = assetAccount?.amount || 0;
                          return (
                            <td key={monthIdx} className={`px-3 py-1.5 text-right border-r border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              {amount !== 0 ? formatCurrency(amount) : '-'}
                            </td>
                          );
                        })}
                        <td className={`px-3 py-1.5 text-right font-semibold ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'}`}>
                          {formatCurrency(account.amount || 0)}
                        </td>
                      </tr>
                    ));
                  })()}
                  
                  <tr className="bg-purple-100 font-semibold">
                    <td className="px-3 py-2 text-gray-900 border-r border-gray-300 sticky left-0 bg-purple-100">Total Cash Flows From Investing Activities</td>
                    {multiMonthData.monthlyData.map((monthData, idx) => {
                      const total = monthData.categorizedOutflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      return (
                        <td key={idx} className="px-3 py-2 text-right border-r border-gray-300">
                          {formatCurrency(total)}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right font-bold bg-purple-200">
                      {formatCurrency(
                        multiMonthData.fiscalYearTotals?.categorizedOutflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0
                      )}
                    </td>
                  </tr>
                  
                  {/* Cash Flows From Financing Activities (Liability/Equity Accounts from COA) */}
                  <tr className="bg-indigo-50">
                    <td colSpan={multiMonthData.months.length + 2} className="px-3 py-2 font-bold text-gray-900 border-t-2 border-b border-gray-300">
                      Cash Flows From Financing Activities
                    </td>
                  </tr>
                  
                  {(() => {
                    // Use fiscal year totals as source of truth for complete account list (includes ALL accounts from COA)
                    // Combine Liability and Equity accounts
                    const liabilityAccounts = (multiMonthData.fiscalYearTotals?.categorizedOutflows?.Liability || []).map(acc => ({...acc, account_type: 'Liability'}));
                    const equityAccounts = (multiMonthData.fiscalYearTotals?.categorizedOutflows?.Equity || []).map(acc => ({...acc, account_type: 'Equity'}));
                    const financingArray = [...liabilityAccounts, ...equityAccounts].sort((a, b) => 
                      a.account_code.localeCompare(b.account_code)
                    );
                    
                    if (financingArray.length === 0) {
                      return (
                        <tr>
                          <td className="px-3 py-1.5 text-gray-500 italic border-r border-gray-200 sticky left-0 bg-white">
                            No financing activities
                          </td>
                          {multiMonthData.monthlyData.map((_, idx) => (
                            <td key={idx} className="px-3 py-1.5 text-right border-r border-gray-200">-</td>
                          ))}
                          <td className="px-3 py-1.5 text-right bg-gray-50">-</td>
                        </tr>
                      );
                    }
                    
                    return financingArray
                      .filter(account => {
                        if (!hideEmptyRows) return true;
                        // Check if account has non-zero amount in fiscal year total or any month
                        const hasFiscalYearAmount = (account.amount || 0) !== 0;
                        const hasMonthlyAmount = multiMonthData.monthlyData.some(monthData => {
                          const financingAccount = monthData.categorizedOutflows?.[account.account_type]?.find(
                            acc => acc.account_code === account.account_code
                          );
                          return (financingAccount?.amount || 0) !== 0;
                        });
                        return hasFiscalYearAmount || hasMonthlyAmount;
                      })
                      .map((account, idx) => (
                      <tr key={account.account_code}>
                        <td className={`px-3 py-1.5 text-gray-700 border-r border-gray-200 sticky left-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          {account.account_name}
                        </td>
                        {multiMonthData.monthlyData.map((monthData, monthIdx) => {
                          const financingAccount = monthData.categorizedOutflows?.[account.account_type]?.find(
                            acc => acc.account_code === account.account_code
                          );
                          const amount = financingAccount?.amount || 0;
                          return (
                            <td key={monthIdx} className={`px-3 py-1.5 text-right border-r border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              {amount !== 0 ? formatCurrency(amount) : '-'}
                            </td>
                          );
                        })}
                        <td className={`px-3 py-1.5 text-right font-semibold ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'}`}>
                          {formatCurrency(account.amount || 0)}
                        </td>
                      </tr>
                    ));
                  })()}
                  
                  <tr className="bg-indigo-100 font-semibold">
                    <td className="px-3 py-2 text-gray-900 border-r border-gray-300 sticky left-0 bg-indigo-100">Total Cash Flows From Financing Activities</td>
                    {multiMonthData.monthlyData.map((monthData, idx) => {
                      const liabilityTotal = monthData.categorizedOutflows?.Liability?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const equityTotal = monthData.categorizedOutflows?.Equity?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const total = liabilityTotal + equityTotal;
                      return (
                        <td key={idx} className="px-3 py-2 text-right border-r border-gray-300">
                          {total !== 0 ? formatCurrency(total) : '-'}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right font-bold bg-indigo-200">
                      {formatCurrency(
                        (multiMonthData.fiscalYearTotals?.categorizedOutflows?.Liability?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0) +
                        (multiMonthData.fiscalYearTotals?.categorizedOutflows?.Equity?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0)
                      )}
                    </td>
                  </tr>
                  
                  {/* Net increase in cash */}
                  <tr className="bg-gray-300 font-bold border-t-2 border-gray-500">
                    <td className="px-3 py-2 text-gray-900 border-r border-gray-400 sticky left-0 bg-gray-300">Net increase in cash and cash equivalents</td>
                    {multiMonthData.monthlyData.map((monthData, idx) => {
                      // Calculate: Operating - Investing - Financing
                      const totalRevenue = monthData.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const assetInflowTotal = monthData.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const totalExpenses = monthData.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const operating = (totalRevenue + assetInflowTotal) - totalExpenses;
                      const investing = monthData.categorizedOutflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const liabilityTotal = monthData.categorizedOutflows?.Liability?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const equityTotal = monthData.categorizedOutflows?.Equity?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                      const financing = liabilityTotal + equityTotal;
                      const netIncrease = operating - investing - financing; // Investing and financing are outflows
                      return (
                        <td key={idx} className={`px-3 py-2 text-right border-r border-gray-400 ${netIncrease < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(netIncrease)}
                        </td>
                      );
                    })}
                    <td className={`px-3 py-2 text-right font-bold bg-gray-400 ${
                      (() => {
                        const fyTotalRevenue = multiMonthData.fiscalYearTotals?.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyAssetInflowTotal = multiMonthData.fiscalYearTotals?.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyTotalExpenses = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyOperating = (fyTotalRevenue + fyAssetInflowTotal) - fyTotalExpenses;
                        const fyInvesting = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyLiabilityTotal = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Liability?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyEquityTotal = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Equity?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyFinancing = fyLiabilityTotal + fyEquityTotal;
                        const fyNetIncrease = fyOperating - fyInvesting - fyFinancing;
                        return fyNetIncrease < 0 ? 'text-red-600' : 'text-green-600';
                      })()
                    }`}>
                      {(() => {
                        const fyTotalRevenue = multiMonthData.fiscalYearTotals?.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyAssetInflowTotal = multiMonthData.fiscalYearTotals?.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyTotalExpenses = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyOperating = (fyTotalRevenue + fyAssetInflowTotal) - fyTotalExpenses;
                        const fyInvesting = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyLiabilityTotal = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Liability?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyEquityTotal = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Equity?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyFinancing = fyLiabilityTotal + fyEquityTotal;
                        const fyNetIncrease = fyOperating - fyInvesting - fyFinancing;
                        return formatCurrency(fyNetIncrease);
                      })()}
                    </td>
                  </tr>
                  
                  {/* Cash and cash equivalents at end of period */}
                  <tr className="bg-gray-900 text-white font-bold">
                    <td className="px-3 py-2 border-r border-gray-700 sticky left-0 bg-gray-900">Cash and cash equivalents at end of period</td>
                    {(() => {
                      // Calculate cumulative ending cash
                      let cumulativeCash = multiMonthData.monthlyData[0]?.totals?.beginning_cash || 0;
                      return multiMonthData.monthlyData.map((monthData, idx) => {
                        const totalRevenue = monthData.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const assetInflowTotal = monthData.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const totalExpenses = monthData.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const operating = (totalRevenue + assetInflowTotal) - totalExpenses;
                        const investing = monthData.categorizedOutflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const liabilityTotal = monthData.categorizedOutflows?.Liability?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const equityTotal = monthData.categorizedOutflows?.Equity?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const financing = liabilityTotal + equityTotal;
                        const netIncrease = operating - investing - financing;
                        cumulativeCash += netIncrease;
                        return (
                          <td key={idx} className="px-3 py-2 text-right border-r border-gray-700">
                            {formatCurrency(cumulativeCash)}
                          </td>
                        );
                      });
                    })()}
                    <td className="px-3 py-2 text-right font-bold bg-black">
                      {(() => {
                        const startingCash = multiMonthData.monthlyData[0]?.totals?.beginning_cash || 0;
                        const fyTotalRevenue = multiMonthData.fiscalYearTotals?.categorizedInflows?.Revenue?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyAssetInflowTotal = multiMonthData.fiscalYearTotals?.categorizedInflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyTotalExpenses = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Expense?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyOperating = (fyTotalRevenue + fyAssetInflowTotal) - fyTotalExpenses;
                        const fyInvesting = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Asset?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyLiabilityTotal = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Liability?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyEquityTotal = multiMonthData.fiscalYearTotals?.categorizedOutflows?.Equity?.reduce((sum, acc) => sum + (acc.amount || 0), 0) || 0;
                        const fyFinancing = fyLiabilityTotal + fyEquityTotal;
                        const fyNetIncrease = fyOperating - fyInvesting - fyFinancing;
                        return formatCurrency(startingCash + fyNetIncrease);
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Report Title and Period - Single Period View */}
        {!loading && !error && data && viewMode === 'single' && (
          <div style={{ 
            marginBottom: '16px',
            padding: '12px 0'
          }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
              Cash Flow Statement
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
              {data.period?.period_name ? data.period.period_name : 
               (data.start_date && data.end_date ? `${data.start_date} to ${data.end_date}` : 
                (reportType === 'monthly' ? `${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : ''))}
            </p>
          </div>
        )}

        {!loading && !error && data && viewMode === 'single' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-3 md:mb-4 no-print">
              <div className="bg-white border border-gray-200 p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Total Inflows</p>
                    <p className="text-base font-semibold text-green-600">{formatCurrency(totals.total_inflows)}</p>
                  </div>
                  <div className="bg-green-100 p-1.5">
                    <FontAwesomeIcon icon={faArrowDown} className="text-green-600 text-xs" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Total Outflows</p>
                    <p className="text-base font-semibold text-red-600">{formatCurrency(totals.total_outflows)}</p>
                  </div>
                  <div className="bg-red-100 p-1.5">
                    <FontAwesomeIcon icon={faArrowUp} className="text-red-600 text-xs" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Net Cash Flow</p>
                    <p className={`text-base font-semibold ${totals.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(totals.net_cash_flow)}
                    </p>
                  </div>
                  <div className="bg-gray-100 p-1.5">
                    <FontAwesomeIcon icon={faChartLine} className="text-gray-600 text-xs" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Current Cash Position</p>
                    <p className="text-base font-semibold text-gray-900">{formatCurrency(totals.ending_cash)}</p>
                  </div>
                  <div className="bg-gray-100 p-1.5">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-gray-600 text-xs" />
                  </div>
                </div>
              </div>
            </div>

            {/* Cash Flow Statement Details */}
            <div className="bg-white border border-gray-200 printable-area">

              <div className="p-3 md:p-6">
                {/* Cash Inflows */}
                <div className="mb-4 md:mb-6">
                  <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                    <FontAwesomeIcon icon={faArrowDown} className="mr-2" />
                    Cash In
                  </h3>
                  <div className="space-y-0">
                    {(data.cash_inflows || []).length === 0 ? (
                      <div className="flex justify-between items-center py-1.5 px-2 bg-gray-50">
                        <span className="text-xs text-gray-500 italic">No cash inflows in this period</span>
                        <span className="text-xs font-medium text-gray-500">$0.00</span>
                      </div>
                    ) : (
                      (data.cash_inflows || [])
                        .filter(item => !hideEmptyRows || (item.amount || 0) !== 0)
                        .map((item, index) => (
                        <div key={index} className={`flex justify-between items-center py-1.5 px-2 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <span className="text-xs text-gray-700">{item.account_code} - {item.account_name}</span>
                          <span className="text-xs font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                        </div>
                      ))
                    )}
                    <div className="flex justify-between items-center py-2 px-2 border-t border-gray-200 bg-gray-100">
                      <span className="text-xs font-bold text-gray-900">Total Cash In</span>
                      <span className="text-xs font-bold text-gray-900">{formatCurrency(totals.total_inflows)}</span>
                    </div>
                  </div>
                </div>

                {/* Cash Outflows */}
                <div className="mb-4 md:mb-6">
                  <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                    <FontAwesomeIcon icon={faArrowUp} className="mr-2" />
                    Cash Out
                  </h3>
                  <div className="space-y-0">
                    {(data.cash_outflows || []).length === 0 ? (
                      <div className="flex justify-between items-center py-1.5 px-2 bg-gray-50">
                        <span className="text-xs text-gray-500 italic">No cash outflows in this period</span>
                        <span className="text-xs font-medium text-gray-500">$0.00</span>
                      </div>
                    ) : (
                      (data.cash_outflows || [])
                        .filter(item => !hideEmptyRows || (item.amount || 0) !== 0)
                        .map((item, index) => (
                        <div key={index} className={`flex justify-between items-center py-1.5 px-2 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <span className="text-xs text-gray-700">{item.account_code} - {item.account_name}</span>
                          <span className="text-xs font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                        </div>
                      ))
                    )}
                    <div className="flex justify-between items-center py-2 px-2 border-t border-gray-200 bg-gray-100">
                      <span className="text-xs font-bold text-gray-900">Total Cash Out</span>
                      <span className="text-xs font-bold text-gray-900">{formatCurrency(totals.total_outflows)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Cash Flow and Balances */}
                <div className="border-t-2 border-gray-300 pt-3 md:pt-4">
                  <div className="flex justify-between items-center py-2 md:py-2.5 px-2 md:px-3 bg-gray-100 mb-1">
                    <span className="text-xs font-bold text-gray-900">Net Cash Flow</span>
                    <span className={`text-xs font-bold ${totals.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(totals.net_cash_flow)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 md:py-2.5 px-2 md:px-3 bg-gray-50 mb-1">
                    <span className="text-xs font-semibold text-gray-700">Beginning Cash & Bank Balance</span>
                    <span className="text-xs font-semibold text-gray-700">{formatCurrency(totals.beginning_cash)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 md:py-2.5 px-2 md:px-3 bg-gray-900 text-white">
                    <span className="text-xs font-bold">Current Cash & Bank Position</span>
                    <span className="text-xs font-bold">{formatCurrency(totals.ending_cash)}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Comparison View */}
        {showComparisonView && comparisonData && !loading && (
          <div style={{ 
            background: 'white', 
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            marginBottom: '20px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '15px 20px', 
              borderBottom: '1px solid var(--border-color)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: '#f9fafb'
            }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                Cash Flow Comparison ({comparisonData.reports.length} Reports)
              </h2>
              <button
                onClick={() => setShowComparisonView(false)}
                className="btn-checklist"
                style={{ 
                  backgroundColor: '#6b7280',
                  padding: '6px 12px',
                  fontSize: '0.75rem'
                }}
              >
                <FontAwesomeIcon icon={faTimes} style={{ marginRight: '6px' }} />
                Close
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%', minWidth: '800px', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead style={{ 
                  background: 'transparent',
                  borderBottom: '2px solid #e5e7eb'
                }}>
                  <tr>
                    <th style={{ 
                      padding: '12px 15px', 
                      textAlign: 'left', 
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: '#ffffff',
                      background: '#374151',
                      borderRight: '1px solid #e5e7eb',
                      width: '80px'
                    }}>
                      Code
                    </th>
                    <th style={{ 
                      padding: '12px 15px', 
                      textAlign: 'left', 
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: '#ffffff',
                      background: '#374151',
                      borderRight: '1px solid #e5e7eb'
                    }}>
                      Account Name
                    </th>
                    {comparisonData.reports.map((report, idx) => (
                      <th key={idx} style={{ 
                        padding: '12px 15px', 
                        textAlign: 'right', 
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        color: '#111827',
                        borderLeft: '1px solid #e5e7eb',
                        background: '#ffffff',
                        minWidth: '140px'
                      }}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '4px', color: '#111827' }}>{report.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 400 }}>
                          {report.period}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Cash Inflows Section */}
                  <tr style={{ 
                    background: 'linear-gradient(90deg, #f0fdf4 0%, #d1fae5 100%)', 
                    borderTop: '2px solid #86efac'
                  }}>
                    <td colSpan={2 + comparisonData.reports.length} style={{ 
                      padding: '12px 15px', 
                      fontWeight: 700, 
                      color: '#059669', 
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      <FontAwesomeIcon icon={faArrowDown} style={{ marginRight: '8px', fontSize: '0.75rem' }} />
                      CASH IN
                    </td>
                  </tr>
                  {comparisonData.inflows.map((account, idx) => (
                    <tr 
                      key={idx} 
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f9fafb'}
                    >
                      <td style={{ 
                        padding: '10px 15px', 
                        whiteSpace: 'nowrap', 
                        color: 'var(--text-primary)',
                        borderRight: '1px solid var(--border-color)',
                        fontSize: '0.7rem',
                        background: '#f3f4f6',
                        fontWeight: 500
                      }}>
                        {account.account_code}
                      </td>
                      <td style={{ 
                        padding: '10px 15px', 
                        color: 'var(--text-primary)',
                        borderRight: '1px solid var(--border-color)'
                      }}>
                        {account.account_name}
                      </td>
                      {account.amounts.map((amount, aidx) => (
                        <td key={aidx} style={{ 
                          padding: '10px 15px', 
                          textAlign: 'right', 
                          fontFamily: 'monospace',
                          color: 'var(--text-primary)',
                          borderLeft: '1px solid var(--border-color)'
                        }}>
                          {formatCurrency(amount)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr style={{ 
                    background: '#d1fae5',
                    borderTop: '2px solid #86efac',
                    fontWeight: 700
                  }}>
                    <td colSpan="2" style={{ padding: '12px 15px', borderRight: '1px solid var(--border-color)' }}>Total Cash In</td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} style={{ 
                        padding: '12px 15px', 
                        textAlign: 'right', 
                        fontFamily: 'monospace',
                        borderLeft: '1px solid var(--border-color)',
                        color: '#059669'
                      }}>
                        {formatCurrency(report.totals.total_inflows)}
                      </td>
                    ))}
                  </tr>

                  {/* Cash Outflows Section */}
                  <tr style={{ 
                    background: 'linear-gradient(90deg, #fef2f2 0%, #fee2e2 100%)', 
                    borderTop: '2px solid #fca5a5'
                  }}>
                    <td colSpan={2 + comparisonData.reports.length} style={{ 
                      padding: '12px 15px', 
                      fontWeight: 700, 
                      color: '#dc2626', 
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      <FontAwesomeIcon icon={faArrowUp} style={{ marginRight: '8px', fontSize: '0.75rem' }} />
                      CASH OUT
                    </td>
                  </tr>
                  {comparisonData.outflows.map((account, idx) => (
                    <tr 
                      key={idx} 
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f9fafb'}
                    >
                      <td style={{ 
                        padding: '10px 15px', 
                        whiteSpace: 'nowrap', 
                        color: 'var(--text-primary)',
                        borderRight: '1px solid var(--border-color)',
                        fontSize: '0.7rem',
                        background: '#f3f4f6',
                        fontWeight: 500
                      }}>
                        {account.account_code}
                      </td>
                      <td style={{ 
                        padding: '10px 15px', 
                        color: 'var(--text-primary)',
                        borderRight: '1px solid var(--border-color)'
                      }}>
                        {account.account_name}
                      </td>
                      {account.amounts.map((amount, aidx) => (
                        <td key={aidx} style={{ 
                          padding: '10px 15px', 
                          textAlign: 'right', 
                          fontFamily: 'monospace',
                          color: 'var(--text-primary)',
                          borderLeft: '1px solid var(--border-color)'
                        }}>
                          {formatCurrency(amount)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr style={{ 
                    background: '#fee2e2',
                    borderTop: '2px solid #fca5a5',
                    fontWeight: 700
                  }}>
                    <td colSpan="2" style={{ padding: '12px 15px', borderRight: '1px solid var(--border-color)' }}>Total Cash Out</td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} style={{ 
                        padding: '12px 15px', 
                        textAlign: 'right', 
                        fontFamily: 'monospace',
                        borderLeft: '1px solid var(--border-color)',
                        color: '#dc2626'
                      }}>
                        {formatCurrency(report.totals.total_outflows)}
                      </td>
                    ))}
                  </tr>

                  {/* Summary */}
                  <tr style={{ 
                    background: 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)',
                    borderTop: '3px solid #6b7280',
                    fontWeight: 700
                  }}>
                    <td colSpan="2" style={{ padding: '14px 15px', borderRight: '1px solid var(--border-color)', fontSize: '0.85rem' }}>Net Cash Flow</td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} style={{ 
                        padding: '14px 15px', 
                        textAlign: 'right', 
                        fontFamily: 'monospace',
                        borderLeft: '1px solid var(--border-color)',
                        fontSize: '0.85rem',
                        color: report.totals.net_cash_flow >= 0 ? '#059669' : '#dc2626'
                      }}>
                        {formatCurrency(report.totals.net_cash_flow)}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ 
                    backgroundColor: '#f9fafb',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    <td colSpan="2" style={{ padding: '10px 15px', borderRight: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Beginning Cash</td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} style={{ 
                        padding: '10px 15px', 
                        textAlign: 'right', 
                        fontFamily: 'monospace',
                        borderLeft: '1px solid var(--border-color)',
                        color: 'var(--text-primary)'
                      }}>
                        {formatCurrency(report.totals.beginning_cash)}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ 
                    background: '#374151',
                    fontWeight: 700
                  }}>
                    <td colSpan="2" style={{ padding: '14px 15px', borderRight: '1px solid #4b5563', fontSize: '0.85rem', color: '#ffffff' }}>Ending Cash</td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} style={{ 
                        padding: '14px 15px', 
                        textAlign: 'right', 
                        fontFamily: 'monospace',
                        borderLeft: '1px solid #4b5563',
                        fontSize: '0.85rem',
                        color: '#ffffff'
                      }}>
                        {formatCurrency(report.totals.ending_cash)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Save Report Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px' }}
          >
            <div className="modal-header">
              <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Save Cash Flow Statement
              </h2>
              <button
                onClick={() => setShowSaveModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  Report Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="e.g., Cash Flow - October 2024"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Add any notes or description..."
                  rows={3}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tags (Optional)</label>
                <input
                  type="text"
                  value={reportTags}
                  onChange={(e) => setReportTags(e.target.value)}
                  placeholder="e.g., monthly, approved, october"
                  className="form-control"
                />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Separate tags with commas
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowSaveModal(false)}
                className="modal-btn modal-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={saveReport}
                disabled={loading || !reportName.trim()}
                className="modal-btn modal-btn-primary"
                style={{ 
                  opacity: (loading || !reportName.trim()) ? 0.5 : 1,
                  backgroundColor: '#2563eb'
                }}
              >
                <FontAwesomeIcon icon={faSave} style={{ marginRight: '6px' }} />
                Save Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Report Modal */}
      {showLoadModal && (
        <div className="modal-overlay" onClick={() => setShowLoadModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '700px', maxHeight: '90vh' }}
          >
            <div className="modal-header">
              <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Load Saved Cash Flow Statement
              </h2>
              <button
                onClick={() => setShowLoadModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}>
              {savedReports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <FontAwesomeIcon icon={faFolderOpen} style={{ fontSize: '3rem', color: 'var(--text-secondary)', marginBottom: '12px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No saved cash flow statements found</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {savedReports.map((report) => (
                    <div
                      key={report.id}
                      style={{
                        border: '1px solid var(--border-color)',
                        padding: '15px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => loadReport(report.id)}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                            {report.report_name}
                          </h3>
                          {report.report_description && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                              {report.report_description}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            <span>Saved: {new Date(report.saved_at).toLocaleDateString()}</span>
                            {report.report_summary && (
                              <span style={{ color: report.report_summary.net_cash_flow >= 0 ? '#059669' : '#dc2626' }}>
                                Net: {formatCurrency(report.report_summary.net_cash_flow)}
                              </span>
                            )}
                          </div>
                          {report.tags && (
                            <div style={{ marginTop: '8px' }}>
                              {report.tags.split(',').map((tag, idx) => (
                                <span 
                                  key={idx} 
                                  style={{
                                    display: 'inline-block',
                                    background: '#f3f4f6',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.7rem',
                                    padding: '2px 8px',
                                    marginRight: '6px',
                                    borderRadius: '4px'
                                  }}
                                >
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button style={{ 
                          color: '#2563eb', 
                          fontSize: '0.75rem', 
                          fontWeight: 500, 
                          marginLeft: '16px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer'
                        }}>
                          Load →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowLoadModal(false)}
                className="modal-btn modal-btn-secondary"
                style={{ width: '100%' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Reports Modal */}
      {showCompareModal && (
        <div className="modal-overlay" onClick={() => setShowCompareModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '700px', maxHeight: '90vh' }}
          >
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Compare Cash Flow Statements
                </h2>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Select 2-5 reports to compare ({selectedReportsForComparison.length} selected)
                </p>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: 'calc(90vh - 180px)', overflowY: 'auto' }}>
              {savedReports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <FontAwesomeIcon icon={faMoneyBillWave} style={{ fontSize: '3rem', color: 'var(--text-secondary)', marginBottom: '12px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No saved cash flow statements found</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {savedReports.map((report) => (
                    <div
                      key={report.id}
                      style={{
                        border: `2px solid ${selectedReportsForComparison.includes(report.id) ? '#ea580c' : 'var(--border-color)'}`,
                        padding: '15px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: selectedReportsForComparison.includes(report.id) ? '#fff7ed' : 'white'
                      }}
                      onClick={() => toggleReportSelection(report.id)}
                      onMouseEnter={(e) => {
                        if (!selectedReportsForComparison.includes(report.id)) {
                          e.currentTarget.style.background = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedReportsForComparison.includes(report.id)) {
                          e.currentTarget.style.background = 'white';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ marginTop: '2px' }}>
                          <input
                            type="checkbox"
                            checked={selectedReportsForComparison.includes(report.id)}
                            onChange={() => {}}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                            {report.report_name}
                          </h3>
                          {report.report_description && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                              {report.report_description}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            <span>Saved: {new Date(report.saved_at).toLocaleDateString()}</span>
                            {report.report_summary && (
                              <span style={{ color: report.report_summary.net_cash_flow >= 0 ? '#059669' : '#dc2626' }}>
                                Net: {formatCurrency(report.report_summary.net_cash_flow)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowCompareModal(false)}
                className="modal-btn modal-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={compareReports}
                disabled={selectedReportsForComparison.length < 2}
                className="modal-btn modal-btn-primary"
                style={{ 
                  opacity: selectedReportsForComparison.length < 2 ? 0.5 : 1,
                  backgroundColor: '#ea580c'
                }}
              >
                <FontAwesomeIcon icon={faMoneyBillWave} style={{ marginRight: '6px' }} />
                Compare {selectedReportsForComparison.length} Reports
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {toast.visible && toast.message && (
        <div className="success-toast">
          <div 
            className="success-toast-content" 
            style={{ background: getToastBackgroundColor(toast.type) }}
          >
            {getToastIcon(toast.type)}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashFlow;
