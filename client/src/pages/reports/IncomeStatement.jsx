import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faCalendarAlt,
  faDownload,
  faPrint,
  faFilter,
  faArrowUp,
  faArrowDown,
  faSpinner,
  faExclamationTriangle,
  faSave,
  faFolderOpen,
  faTimes,
  faCheckCircle,
  faBalanceScale
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BASE_URL from '../../contexts/Api';

const IncomeStatement = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState('monthly'); // monthly, quarterly, ytd, custom (report period)
  const [statementView, setStatementView] = useState('full'); // full, revenue, expenses
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [incomeStatementData, setIncomeStatementData] = useState(null);
  const [availablePeriods, setAvailablePeriods] = useState([]);

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

  // Fetch available periods on component mount
  useEffect(() => {
    fetchAvailablePeriods();
  }, []);

  // Remove automatic data fetching - only load when search button is clicked

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const handleSearch = () => {
    if (reportType === 'monthly') {
      fetchIncomeStatement();
    } else if (reportType === 'quarterly') {
      fetchQuarterlyIncomeStatement();
    } else if (reportType === 'ytd') {
      fetchYearToDateIncomeStatement();
    } else if (reportType === 'custom') {
      fetchCustomRange();
    }
  };

  const fetchAvailablePeriods = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/income-statement/periods`, {
        headers: authHeaders
      });
      setAvailablePeriods(response.data);
    } catch (error) {
      console.error('Error fetching periods:', error);
    }
  };

  const fetchIncomeStatement = async () => {
    setLoading(true);
    setError(null);
    setIncomeStatementData(null);
    try {
      const response = await axios.get(`${BASE_URL}/accounting/income-statement/month/${selectedMonth}/year/${selectedYear}`, {
        headers: authHeaders
      });
      setIncomeStatementData(response.data);
    } catch (error) {
      console.error('Error fetching income statement:', error);
      setError('Failed to load income statement data');
      setIncomeStatementData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuarterlyIncomeStatement = async () => {
    setLoading(true);
    setError(null);
    setIncomeStatementData(null);
    try {
      const response = await axios.get(`${BASE_URL}/accounting/income-statement/year/${selectedYear}/quarter/${selectedQuarter}`, {
        headers: authHeaders
      });
      setIncomeStatementData(response.data);
    } catch (error) {
      console.error('Error fetching quarterly income statement:', error);
      setError('Failed to load quarterly income statement data');
      setIncomeStatementData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchYearToDateIncomeStatement = async () => {
    setLoading(true);
    setError(null);
    setIncomeStatementData(null);
    try {
      const response = await axios.get(`${BASE_URL}/accounting/income-statement/year/${selectedYear}/ytd`, {
        headers: authHeaders
      });
      setIncomeStatementData(response.data);
    } catch (error) {
      console.error('Error fetching year-to-date income statement:', error);
      setError('Failed to load year-to-date income statement data');
      setIncomeStatementData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomRange = async () => {
    setLoading(true);
    setError(null);
    setIncomeStatementData(null);
    try {
      if (!customStart || !customEnd) {
        throw new Error('Please select both start and end dates');
      }

      // Validate dates
      const startDate = new Date(customStart);
      const endDate = new Date(customEnd);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date format. Please select valid dates.');
      }

      if (endDate < startDate) {
        throw new Error('End date must be after or equal to start date');
      }

      const params = new URLSearchParams({ start: customStart, end: customEnd }).toString();
      const response = await axios.get(`${BASE_URL}/accounting/income-statement/range?${params}`, {
        headers: authHeaders
      });
      setIncomeStatementData(response.data);
    } catch (error) {
      console.error('Error fetching custom range income statement:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load custom range income statement');
      setIncomeStatementData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    if (!value) return '0.00%';
    return `${parseFloat(value).toFixed(2)}%`;
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

  const handleSaveReport = async () => {
    if (!incomeStatementData) {
      setError('Please generate an income statement first');
      return;
    }
    setShowSaveModal(true);
    // Auto-populate report name
    let periodName = '';
    if (reportType === 'monthly') {
      periodName = `Income Statement - ${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    } else if (reportType === 'quarterly') {
      periodName = `Income Statement - Q${selectedQuarter} ${selectedYear}`;
    } else if (reportType === 'ytd') {
      periodName = `Income Statement - ${selectedYear} YTD`;
    } else {
      periodName = `Income Statement - ${customStart} to ${customEnd}`;
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
        report_type: 'income_statement',
        report_name: reportName,
        report_description: reportDescription,
        period_start_date: reportType === 'custom' ? customStart : null,
        period_end_date: reportType === 'custom' ? customEnd : null,
        report_data: incomeStatementData,
        report_summary: {
          total_revenue: incomeStatementData.totals?.total_revenue,
          total_expenses: incomeStatementData.totals?.total_expenses,
          net_income: incomeStatementData.totals?.net_income
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
        params: { report_type: 'income_statement' },
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
      setIncomeStatementData(report.report_data);
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
        params: { report_type: 'income_statement' },
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
      const allRevenueAccounts = new Map();
      const allExpenseAccounts = new Map();

      reports.forEach((report, idx) => {
        // Process revenue
        report.report_data.revenue.forEach(account => {
          if (!allRevenueAccounts.has(account.account_code)) {
            allRevenueAccounts.set(account.account_code, {
              account_code: account.account_code,
              account_name: account.account_name,
              amounts: []
            });
          }
          allRevenueAccounts.get(account.account_code).amounts[idx] = account.amount || 0;
        });

        // Process expenses
        report.report_data.expenses.forEach(account => {
          if (!allExpenseAccounts.has(account.account_code)) {
            allExpenseAccounts.set(account.account_code, {
              account_code: account.account_code,
              account_name: account.account_name,
              amounts: []
            });
          }
          allExpenseAccounts.get(account.account_code).amounts[idx] = account.amount || 0;
        });
      });

      // Fill missing amounts with zeros
      allRevenueAccounts.forEach(account => {
        for (let i = 0; i < reports.length; i++) {
          if (!account.amounts[i]) account.amounts[i] = 0;
        }
      });
      allExpenseAccounts.forEach(account => {
        for (let i = 0; i < reports.length; i++) {
          if (!account.amounts[i]) account.amounts[i] = 0;
        }
      });

      setComparisonData({
        reports: reports.map(r => ({
          id: r.id,
          name: r.report_name,
          date: r.period_start_date || 'N/A',
          totals: r.report_data.totals
        })),
        revenue: Array.from(allRevenueAccounts.values()),
        expenses: Array.from(allExpenseAccounts.values())
      });

      setShowCompareModal(false);
      setShowComparisonView(true);
      setSuccess(`Comparing ${reports.length} income statements`);
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
      {/* Report Header */}
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          <h2 className="report-title">Income Statement</h2>
          <p className="report-subtitle">Profit & Loss Report</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleSaveReport}
            disabled={!incomeStatementData}
            className="btn-checklist"
            style={{
              backgroundColor: '#2563eb',
              opacity: !incomeStatementData ? 0.5 : 1,
              cursor: !incomeStatementData ? 'not-allowed' : 'pointer'
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
            <FontAwesomeIcon icon={faBalanceScale} />
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
          {/* Report Type (which financial report) */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Report Type:</label>
            <select
              value="income"
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

          {/* Report Period Type */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Report Period:</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="filter-input"
              style={{ minWidth: '150px', width: '150px' }}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="ytd">Year-to-Date</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {reportType === 'monthly' && (
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
          )}

          {reportType === 'quarterly' && (
            <div className="filter-group">
              <label className="filter-label" style={{ marginRight: '8px' }}>Quarter:</label>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                className="filter-input"
                style={{ minWidth: '150px', width: '150px' }}
              >
                <option value={1}>Q1 (Jan - Mar)</option>
                <option value={2}>Q2 (Apr - Jun)</option>
                <option value={3}>Q3 (Jul - Sep)</option>
                <option value={4}>Q4 (Oct - Dec)</option>
              </select>
            </div>
          )}

          {reportType !== 'custom' && (
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
          )}

          {reportType === 'custom' && (
            <>
              <div className="filter-group">
                <label className="filter-label" style={{ marginRight: '8px' }}>Start Date:</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => {
                    setCustomStart(e.target.value);
                    // If end date is before new start date, clear it
                    if (customEnd && e.target.value && new Date(customEnd) < new Date(e.target.value)) {
                      setCustomEnd('');
                    }
                  }}
                  max={customEnd || undefined}
                  className="filter-input"
                  style={{ minWidth: '150px', width: '150px' }}
                />
              </div>
              <div className="filter-group">
                <label className="filter-label" style={{ marginRight: '8px' }}>End Date:</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  min={customStart || undefined}
                  className="filter-input"
                  style={{ minWidth: '150px', width: '150px' }}
                />
              </div>
            </>
          )}
        </div>
        <div className="report-filters-right">
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
        overflow: 'visible',
        padding: '20px 30px'
      }}>
        {/* Loading State */}
        {loading && !incomeStatementData && (
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
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading income statement...</p>
          </div>
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
              background: 'var(--sidebar-bg)'
            }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Income Statement Comparison ({comparisonData.reports.length} Reports)
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
                  background: 'var(--sidebar-bg)',
                  borderBottom: '2px solid var(--border-color)'
                }}>
                  <tr>
                    <th style={{
                      padding: '12px 15px',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: 'var(--text-primary)',
                      borderRight: '1px solid var(--border-color)',
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
                      color: 'var(--text-primary)',
                      borderRight: '1px solid var(--border-color)'
                    }}>
                      Account Name
                    </th>
                    {comparisonData.reports.map((report, idx) => (
                      <th key={idx} style={{
                        padding: '12px 15px',
                        textAlign: 'right',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        color: 'var(--text-primary)',
                        borderLeft: '1px solid var(--border-color)',
                        background: '#f9fafb',
                        minWidth: '140px'
                      }}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '4px' }}>{report.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                          {report.date !== 'N/A' ? new Date(report.date).toLocaleDateString() : report.date}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Revenue Section */}
                  <tr style={{
                    background: 'linear-gradient(90deg, #f0fdf4 0%, #d1fae5 100%)',
                    borderTop: '2px solid #a7f3d0'
                  }}>
                    <td colSpan={2 + comparisonData.reports.length} style={{
                      padding: '12px 15px',
                      fontWeight: 700,
                      color: '#059669',
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      <FontAwesomeIcon icon={faArrowUp} style={{ marginRight: '8px', fontSize: '0.75rem' }} />
                      Revenue
                    </td>
                  </tr>
                  {comparisonData.revenue.map((account, idx) => (
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
                        borderRight: '1px solid var(--border-color)',
                        fontSize: '0.8rem'
                      }}>
                        {account.account_name}
                      </td>
                      {account.amounts.map((amount, aidx) => (
                        <td key={aidx} style={{
                          padding: '10px 15px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          borderLeft: '1px solid var(--border-color)',
                          color: '#059669',
                          fontWeight: 600,
                          fontSize: '0.8rem'
                        }}>
                          {formatCurrency(amount)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr style={{
                    background: 'linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%)',
                    borderTop: '2px solid #059669'
                  }}>
                    <td colSpan="2" style={{
                      padding: '12px 15px',
                      fontWeight: 700,
                      color: '#059669',
                      borderRight: '1px solid var(--border-color)',
                      fontSize: '0.85rem'
                    }}>
                      Total Revenue
                    </td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} style={{
                        padding: '12px 15px',
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        borderLeft: '1px solid var(--border-color)',
                        color: '#059669',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}>
                        {formatCurrency(report.totals.total_revenue)}
                      </td>
                    ))}
                  </tr>

                  {/* Expenses Section */}
                  <tr style={{
                    background: 'linear-gradient(90deg, #fef2f2 0%, #fee2e2 100%)',
                    borderTop: '3px solid #fecaca'
                  }}>
                    <td colSpan={2 + comparisonData.reports.length} style={{
                      padding: '12px 15px',
                      fontWeight: 700,
                      color: '#dc2626',
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      <FontAwesomeIcon icon={faArrowDown} style={{ marginRight: '8px', fontSize: '0.75rem' }} />
                      Expenses
                    </td>
                  </tr>
                  {comparisonData.expenses.map((account, idx) => (
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
                        borderRight: '1px solid var(--border-color)',
                        fontSize: '0.8rem'
                      }}>
                        {account.account_name}
                      </td>
                      {account.amounts.map((amount, aidx) => (
                        <td key={aidx} style={{
                          padding: '10px 15px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          borderLeft: '1px solid var(--border-color)',
                          color: '#dc2626',
                          fontWeight: 600,
                          fontSize: '0.8rem'
                        }}>
                          {formatCurrency(amount)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr style={{
                    background: 'linear-gradient(90deg, #fee2e2 0%, #fecaca 100%)',
                    borderTop: '2px solid #dc2626'
                  }}>
                    <td colSpan="2" style={{
                      padding: '12px 15px',
                      fontWeight: 700,
                      color: '#dc2626',
                      borderRight: '1px solid var(--border-color)',
                      fontSize: '0.85rem'
                    }}>
                      Total Expenses
                    </td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} style={{
                        padding: '12px 15px',
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        borderLeft: '1px solid var(--border-color)',
                        color: '#dc2626',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}>
                        {formatCurrency(report.totals.total_expenses)}
                      </td>
                    ))}
                  </tr>

                  {/* Net Income */}
                  <tr style={{
                    background: 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)',
                    borderTop: '4px solid var(--border-color)'
                  }}>
                    <td colSpan="2" style={{
                      padding: '14px 15px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      borderRight: '1px solid var(--border-color)',
                      fontSize: '0.9rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Net Income
                    </td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} style={{
                        padding: '14px 15px',
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        borderLeft: '1px solid var(--border-color)',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        color: report.totals.net_income >= 0 ? '#059669' : '#dc2626'
                      }}>
                        {formatCurrency(report.totals.net_income)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Report Title and Period */}
        {!loading && incomeStatementData && !showComparisonView && (
          <div style={{
            marginBottom: '16px',
            padding: '12px 0'
          }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
              Income Statement
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
              {reportType === 'monthly' && `${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
              {reportType === 'quarterly' && `Q${selectedQuarter} ${selectedYear}`}
              {reportType === 'ytd' && `${selectedYear} Year-to-Date`}
              {reportType === 'custom' && `${customStart || 'Start'} to ${customEnd || 'End'}`}
            </p>
          </div>
        )}

        {/* Summary Cards */}
        {!loading && incomeStatementData && !showComparisonView && statementView === 'full' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '16px'
          }}>
            {/* Revenue Card */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
              border: '1px solid #d1fae5',
              padding: '14px 16px',
              borderRadius: '6px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                    <FontAwesomeIcon icon={faArrowUp} style={{ color: '#059669', fontSize: '0.7rem', marginRight: '6px' }} />
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      Total Revenue
                    </p>
                  </div>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#059669', lineHeight: '1.2' }}>
                    {formatCurrency(incomeStatementData.totals?.total_revenue)}
                  </p>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                  padding: '10px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px'
                }}>
                  <FontAwesomeIcon icon={faArrowUp} style={{ color: '#059669', fontSize: '1rem' }} />
                </div>
              </div>
            </div>

            {/* Expenses Card */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
              border: '1px solid #fee2e2',
              padding: '14px 16px',
              borderRadius: '6px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                    <FontAwesomeIcon icon={faArrowDown} style={{ color: '#dc2626', fontSize: '0.7rem', marginRight: '6px' }} />
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      Total Expenses
                    </p>
                  </div>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#dc2626', lineHeight: '1.2' }}>
                    {formatCurrency(incomeStatementData.totals?.total_expenses)}
                  </p>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  padding: '10px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px'
                }}>
                  <FontAwesomeIcon icon={faArrowDown} style={{ color: '#dc2626', fontSize: '1rem' }} />
                </div>
              </div>
            </div>

            {/* Net Income Card */}
            <div style={{
              background: (incomeStatementData.totals?.net_income || 0) >= 0
                ? 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
              border: `1px solid ${(incomeStatementData.totals?.net_income || 0) >= 0 ? '#d1fae5' : '#fee2e2'}`,
              padding: '14px 16px',
              borderRadius: '6px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                    <FontAwesomeIcon
                      icon={(incomeStatementData.totals?.net_income || 0) >= 0 ? faArrowUp : faArrowDown}
                      style={{
                        color: (incomeStatementData.totals?.net_income || 0) >= 0 ? '#059669' : '#dc2626',
                        fontSize: '0.7rem',
                        marginRight: '6px'
                      }}
                    />
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      Net Income
                    </p>
                  </div>
                  <p style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: (incomeStatementData.totals?.net_income || 0) >= 0 ? '#059669' : '#dc2626',
                    lineHeight: '1.2'
                  }}>
                    {formatCurrency(incomeStatementData.totals?.net_income)}
                  </p>
                </div>
                <div style={{
                  background: (incomeStatementData.totals?.net_income || 0) >= 0
                    ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                    : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  padding: '10px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px'
                }}>
                  <FontAwesomeIcon
                    icon={(incomeStatementData.totals?.net_income || 0) >= 0 ? faArrowUp : faArrowDown}
                    style={{
                      color: (incomeStatementData.totals?.net_income || 0) >= 0 ? '#059669' : '#dc2626',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Income Statement Details */}
        {!loading && incomeStatementData && !showComparisonView && (
          <div style={{
            background: 'white',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '0', overflow: 'hidden' }}>
              <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  background: 'var(--sidebar-bg)',
                  borderBottom: '2px solid var(--border-color)'
                }}>
                  <tr>
                    <th style={{
                      padding: '12px 20px',
                      textAlign: 'left',
                      width: '60%',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: '#ffffff'
                    }}>
                      Account
                    </th>
                    <th style={{
                      padding: '12px 20px',
                      textAlign: 'right',
                      width: '40%',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: '#ffffff'
                    }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Revenue Section Header */}
                  <tr style={{ background: 'linear-gradient(90deg, #f0fdf4 0%, #d1fae5 100%)', borderTop: '2px solid #a7f3d0' }}>
                    <td colSpan="2" style={{
                      padding: '14px 20px',
                      fontWeight: 700,
                      color: '#059669',
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      <FontAwesomeIcon icon={faArrowUp} style={{ marginRight: '8px', fontSize: '0.75rem' }} />
                      Revenue
                    </td>
                  </tr>
                  {/* Revenue Items */}
                  {incomeStatementData.revenue && incomeStatementData.revenue.length > 0 ? (
                    (() => {
                      const tuitionItems = incomeStatementData.revenue.filter(item => (item.account_code || '').startsWith('TUITION-'));
                      const boardingItems = incomeStatementData.revenue.filter(item => (item.account_code || '').startsWith('BOARDING-'));
                      const otherItems = incomeStatementData.revenue.filter(item => !String(item.account_code || '').startsWith('TUITION-') && !String(item.account_code || '').startsWith('BOARDING-'));
                      const tuitionTotal = tuitionItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
                      const boardingTotal = boardingItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
                      const otherTotal = otherItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

                      const renderRevenueRows = (items, color, hoverColor) => (
                        items.map((item, index) => (
                          <tr
                            key={`${item.account_code}-${index}`}
                            style={{
                              backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                              height: '40px',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9fafb'}
                          >
                            <td style={{ padding: '10px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.8rem' }}>
                                  {item.account_name}
                                </span>
                                <span style={{
                                  color: 'var(--text-secondary)',
                                  marginLeft: '10px',
                                  fontSize: '0.7rem',
                                  background: '#f3f4f6',
                                  padding: '2px 6px',
                                  borderRadius: '4px'
                                }}>
                                  {item.account_code}
                                </span>
                              </div>
                            </td>
                            <td style={{
                              padding: '10px 20px',
                              textAlign: 'right',
                              fontWeight: 600,
                              color,
                              fontSize: '0.8rem',
                              fontFamily: 'monospace'
                            }}>
                              {formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))
                      );

                      return (
                        <>
                          {tuitionItems.length > 0 && (
                            <>
                              <tr style={{ background: '#ecfdf5' }}>
                                <td colSpan="2" style={{ padding: '10px 20px', fontWeight: 700, color: '#047857', fontSize: '0.8rem' }}>
                                  Tuition Revenue (By Class)
                                </td>
                              </tr>
                              {renderRevenueRows(tuitionItems, '#059669', '#f0fdf4')}
                              <tr style={{ background: '#d1fae5', borderTop: '1px solid #a7f3d0' }}>
                                <td style={{ padding: '10px 20px', fontWeight: 700, color: '#047857' }}>Tuition Subtotal</td>
                                <td style={{ padding: '10px 20px', textAlign: 'right', fontWeight: 700, color: '#047857', fontFamily: 'monospace' }}>
                                  {formatCurrency(tuitionTotal)}
                                </td>
                              </tr>
                            </>
                          )}

                          {boardingItems.length > 0 && (
                            <>
                              <tr style={{ background: '#eef2ff' }}>
                                <td colSpan="2" style={{ padding: '10px 20px', fontWeight: 700, color: '#4338ca', fontSize: '0.8rem' }}>
                                  Boarding Revenue (By Hostel)
                                </td>
                              </tr>
                              {renderRevenueRows(boardingItems, '#4338ca', '#eef2ff')}
                              <tr style={{ background: '#e0e7ff', borderTop: '1px solid #c7d2fe' }}>
                                <td style={{ padding: '10px 20px', fontWeight: 700, color: '#4338ca' }}>Boarding Subtotal</td>
                                <td style={{ padding: '10px 20px', textAlign: 'right', fontWeight: 700, color: '#4338ca', fontFamily: 'monospace' }}>
                                  {formatCurrency(boardingTotal)}
                                </td>
                              </tr>
                            </>
                          )}

                          {otherItems.length > 0 && (
                            <>
                              <tr style={{ background: '#f8fafc' }}>
                                <td colSpan="2" style={{ padding: '10px 20px', fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>
                                  Other Revenue
                                </td>
                              </tr>
                              {renderRevenueRows(otherItems, '#059669', '#f0fdf4')}
                              <tr style={{ background: '#e2e8f0', borderTop: '1px solid #cbd5f5' }}>
                                <td style={{ padding: '10px 20px', fontWeight: 700, color: '#0f172a' }}>Other Revenue Subtotal</td>
                                <td style={{ padding: '10px 20px', textAlign: 'right', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                                  {formatCurrency(otherTotal)}
                                </td>
                              </tr>
                            </>
                          )}
                        </>
                      );
                    })()
                  ) : (
                    <tr>
                      <td colSpan="2" style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        No revenue found for the selected period
                      </td>
                    </tr>
                  )}
                  {/* Total Revenue */}
                  <tr style={{
                    background: 'linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%)',
                    borderTop: '2px solid #059669',
                    borderBottom: '1px solid #a7f3d0'
                  }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#059669', fontSize: '0.85rem' }}>
                      Total Revenue
                    </td>
                    <td style={{
                      padding: '14px 20px',
                      textAlign: 'right',
                      fontWeight: 700,
                      color: '#059669',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace'
                    }}>
                      {formatCurrency(incomeStatementData.totals?.total_revenue)}
                    </td>
                  </tr>

                  {/* Expenses Section Header */}
                  <tr style={{
                    background: 'linear-gradient(90deg, #fef2f2 0%, #fee2e2 100%)',
                    borderTop: '3px solid #fecaca'
                  }}>
                    <td colSpan="2" style={{
                      padding: '14px 20px',
                      fontWeight: 700,
                      color: '#dc2626',
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      <FontAwesomeIcon icon={faArrowDown} style={{ marginRight: '8px', fontSize: '0.75rem' }} />
                      Expenses
                    </td>
                  </tr>
                  {/* Expense Items */}
                  {incomeStatementData.expenses && incomeStatementData.expenses.length > 0 ? (
                    incomeStatementData.expenses.map((item, index) => (
                      <tr
                        key={index}
                        style={{
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                          height: '40px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9fafb'}
                      >
                        <td style={{ padding: '10px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.8rem' }}>
                              {item.account_name}
                            </span>
                            <span style={{
                              color: 'var(--text-secondary)',
                              marginLeft: '10px',
                              fontSize: '0.7rem',
                              background: '#f3f4f6',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {item.account_code}
                            </span>
                          </div>
                        </td>
                        <td style={{
                          padding: '10px 20px',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: '#dc2626',
                          fontSize: '0.8rem',
                          fontFamily: 'monospace'
                        }}>
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        No expenses found for the selected period
                      </td>
                    </tr>
                  )}
                  {/* Total Expenses */}
                  <tr style={{
                    background: 'linear-gradient(90deg, #fee2e2 0%, #fecaca 100%)',
                    borderTop: '2px solid #dc2626',
                    borderBottom: '1px solid #fecaca'
                  }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#dc2626', fontSize: '0.85rem' }}>
                      Total Expenses
                    </td>
                    <td style={{
                      padding: '14px 20px',
                      textAlign: 'right',
                      fontWeight: 700,
                      color: '#dc2626',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace'
                    }}>
                      {formatCurrency(incomeStatementData.totals?.total_expenses)}
                    </td>
                  </tr>

                  {/* Net Income */}
                  <tr style={{
                    background: (incomeStatementData.totals?.net_income || 0) >= 0
                      ? 'linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%)'
                      : 'linear-gradient(90deg, #fee2e2 0%, #fecaca 100%)',
                    borderTop: '4px solid ' + ((incomeStatementData.totals?.net_income || 0) >= 0 ? '#059669' : '#dc2626'),
                    borderBottom: '2px solid ' + ((incomeStatementData.totals?.net_income || 0) >= 0 ? '#a7f3d0' : '#fecaca')
                  }}>
                    <td style={{
                      padding: '16px 20px',
                      fontWeight: 800,
                      color: (incomeStatementData.totals?.net_income || 0) >= 0 ? '#059669' : '#dc2626',
                      fontSize: '0.9rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Net Income
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      textAlign: 'right',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      color: (incomeStatementData.totals?.net_income || 0) >= 0 ? '#059669' : '#dc2626'
                    }}>
                      {formatCurrency(incomeStatementData.totals?.net_income)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && !incomeStatementData && !showComparisonView && (
          <div style={{
            background: 'white',
            border: '1px solid var(--border-color)',
            padding: '60px 30px',
            textAlign: 'center',
            borderRadius: '4px'
          }}>
            <FontAwesomeIcon icon={faChartLine} style={{ color: 'var(--text-secondary)', fontSize: '3rem', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              No Income Statement Data
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Select a period and click Search to view the income statement data.
            </p>
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
                Save Income Statement
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
                  placeholder="e.g., Income Statement - October 2024"
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
                Load Saved Income Statement
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
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No saved income statements found</p>
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
                              <span style={{ color: report.report_summary.net_income >= 0 ? '#059669' : '#dc2626' }}>
                                Net Income: {formatCurrency(report.report_summary.net_income)}
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
                <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Compare Income Statements
                </h2>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
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
                  <FontAwesomeIcon icon={faBalanceScale} style={{ fontSize: '3rem', color: 'var(--text-secondary)', marginBottom: '12px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No saved income statements found</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {savedReports.map((report) => (
                      <div
                        key={report.id}
                        style={{
                          border: `1px solid ${selectedReportsForComparison.includes(report.id) ? '#ea580c' : 'var(--border-color)'}`,
                          padding: '15px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          background: selectedReportsForComparison.includes(report.id) ? '#fff7ed' : 'white',
                          transition: 'all 0.2s'
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
                              onChange={() => { }}
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
                                <span style={{ color: report.report_summary.net_income >= 0 ? '#059669' : '#dc2626' }}>
                                  Net Income: {formatCurrency(report.report_summary.net_income)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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
                  backgroundColor: '#ea580c',
                  opacity: selectedReportsForComparison.length < 2 ? 0.5 : 1,
                  cursor: selectedReportsForComparison.length < 2 ? 'not-allowed' : 'pointer'
                }}
              >
                <FontAwesomeIcon icon={faBalanceScale} style={{ marginRight: '6px' }} />
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

export default IncomeStatement;
