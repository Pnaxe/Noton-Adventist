import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBalanceScale, 
  faCalendarAlt, 
  faDownload, 
  faPrint,
  faFilter,
  faSave,
  faFolderOpen,
  faTimes,
  faCheckCircle,
  faSpinner,
  faExclamationTriangle,
  faChevronDown,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BASE_URL from '../../contexts/Api';

const BalanceSheet = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('monthly'); // monthly | custom
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customEnd, setCustomEnd] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [data, setData] = useState(null);

  // Toast states (for success popup, like saving a student)
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

  // UI state for expanding / collapsing detail sections
  const [expandedSections, setExpandedSections] = useState({
    currentAssets: true,
    fixedAssets: true,
    otherAssets: true,
    currentLiabilities: true,
    longTermLiabilities: true,
    equity: true
  });

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0.00';
    
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(absAmount);
    
    // Use parentheses for negative values
    return amount < 0 ? `(${formatted})` : formatted;
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(null);

      if (reportType === 'monthly') {
        const resp = await axios.get(`${BASE_URL}/accounting/balance-sheet/month/${selectedMonth}/year/${selectedYear}`, {
          headers: authHeaders
        });
        setData(resp.data);
      } else if (reportType === 'custom') {
        if (!customEnd) {
          setError('Please select an as-of end date');
          setLoading(false);
          return;
        }
        const params = new URLSearchParams({ end: customEnd }).toString();
        const resp = await axios.get(`${BASE_URL}/accounting/balance-sheet/range?${params}`, {
          headers: authHeaders
        });
        setData(resp.data);
      }
    } catch (e) {
      console.error('Error loading balance sheet:', e);
      setError(e.response?.data?.error || 'Failed to load balance sheet');
    } finally {
      setLoading(false);
    }
  };

  const totals = data?.totals || { total_assets: 0, total_liabilities: 0, total_equity: 0 };
  const totalLiabilitiesAndEquity = (totals.total_liabilities || 0) + (totals.total_equity || 0);

  const handleSaveReport = async () => {
    if (!data) {
      setError('Please generate a balance sheet first');
      return;
    }
    setShowSaveModal(true);
    // Auto-populate report name
    let periodName = '';
    if (reportType === 'monthly') {
      periodName = `Balance Sheet - ${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    } else {
      periodName = `Balance Sheet - As of ${customEnd}`;
    }
    setReportName(periodName);
  };

  const saveReport = async () => {
    if (!reportName.trim()) {
      setSaveError('Please enter a report name');
      return;
    }

    try {
      setLoading(true);
      setSaveError('');
      await axios.post(`${BASE_URL}/accounting/saved-reports`, {
        report_type: 'balance_sheet',
        report_name: reportName,
        report_description: reportDescription,
        period_start_date: reportType === 'custom' ? customEnd : null,
        period_end_date: reportType === 'custom' ? customEnd : null,
        report_data: data,
        report_summary: {
          total_assets: totals.total_assets,
          total_liabilities: totals.total_liabilities,
          total_equity: totals.total_equity,
          is_balanced: Math.abs((totals.total_assets || 0) - totalLiabilitiesAndEquity) < 0.01
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
      const msg = err.response?.data?.error || 'Failed to save report';
      setSaveError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedReports = async () => {
    setLoadingReports(true);
    setError(null);
    try {
      const response = await axios.get(`${BASE_URL}/accounting/saved-reports`, {
        params: { report_type: 'balance_sheet' },
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
        params: { report_type: 'balance_sheet' },
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

      // Build comparison data for all account types
      const allAssets = new Map();
      const allLiabilities = new Map();
      const allEquity = new Map();
      
      reports.forEach((report, idx) => {
        // Process all asset categories
        ['current_assets', 'fixed_assets', 'other_assets'].forEach(category => {
          if (report.report_data[category]) {
            report.report_data[category].forEach(account => {
              if (!allAssets.has(account.account_code)) {
                allAssets.set(account.account_code, {
                  account_code: account.account_code,
                  account_name: account.account_name,
                  category: category,
                  amounts: []
                });
              }
              allAssets.get(account.account_code).amounts[idx] = account.balance || 0;
            });
          }
        });

        // Process all liability categories
        ['current_liabilities', 'long_term_liabilities'].forEach(category => {
          if (report.report_data[category]) {
            report.report_data[category].forEach(account => {
              if (!allLiabilities.has(account.account_code)) {
                allLiabilities.set(account.account_code, {
                  account_code: account.account_code,
                  account_name: account.account_name,
                  category: category,
                  amounts: []
                });
              }
              allLiabilities.get(account.account_code).amounts[idx] = account.balance || 0;
            });
          }
        });

        // Process equity
        if (report.report_data.equity) {
          report.report_data.equity.forEach(account => {
            if (!allEquity.has(account.account_code)) {
              allEquity.set(account.account_code, {
                account_code: account.account_code,
                account_name: account.account_name,
                amounts: []
              });
            }
            allEquity.get(account.account_code).amounts[idx] = account.balance || 0;
          });
        }
      });

      // Fill missing amounts with zeros
      [allAssets, allLiabilities, allEquity].forEach(map => {
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
          date: r.period_start_date || 'N/A',
          totals: r.report_data.totals
        })),
        assets: Array.from(allAssets.values()),
        liabilities: Array.from(allLiabilities.values()),
        equity: Array.from(allEquity.values())
      });

      setShowCompareModal(false);
      setShowComparisonView(true);
      setSuccess(`Comparing ${reports.length} balance sheets`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error comparing reports:', err);
      setError('Failed to load reports for comparison');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) {
      showToast('No data to export. Please generate a report first.', 'error');
      return;
    }

    const periodLabel =
      data.period?.period_name && data.period?.end_date
        ? `${data.period.period_name} (As of ${data.period.end_date})`
        : data.as_of_date
        ? `As of ${data.as_of_date}`
        : 'Balance Sheet';

    let csv = 'Balance Sheet\n';
    csv += `${periodLabel}\n\n`;

    const appendSection = (title, rows) => {
      csv += `${title}\n`;
      csv += 'Account Code,Account Name,Balance\n';
      if (!rows || rows.length === 0) {
        csv += ',"No accounts in this section",$0.00\n\n';
        return;
      }
      rows.forEach((item) => {
        csv += `${item.account_code || ''},"${item.account_name || ''}",${item.balance || 0}\n`;
      });
      csv += '\n';
    };

    appendSection('Current Assets', data.current_assets || []);
    appendSection('Fixed Assets', data.fixed_assets || []);
    appendSection('Other Assets', data.other_assets || []);
    appendSection('Current Liabilities', data.current_liabilities || []);
    appendSection('Long-term Liabilities', data.long_term_liabilities || []);
    appendSection('Equity', data.equity || []);

    csv += `Total Assets,,${totals.total_assets || 0}\n`;
    csv += `Total Liabilities,,${totals.total_liabilities || 0}\n`;
    csv += `Total Equity,,${totals.total_equity || 0}\n`;
    csv += `Total Liabilities and Equity,,${totalLiabilitiesAndEquity || 0}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safePeriod = periodLabel.replace(/[^a-zA-Z0-9-_]+/g, '_');
    link.href = url;
    link.setAttribute('download', `balance_sheet_${safePeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Balance Sheet exported successfully.', 'success');
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
    if (type === 'info') {
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      );
    }
    return null;
  };

  const getToastBackgroundColor = (type) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'info': return '#2563eb';
      case 'warning': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
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
          <h2 className="report-title">Balance Sheet</h2>
          <p className="report-subtitle">Financial Position Report</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={handleExport}
            disabled={!data}
            className="btn-checklist"
            style={{ 
              backgroundColor: '#4b5563',
              opacity: !data ? 0.5 : 1,
              cursor: !data ? 'not-allowed' : 'pointer',
              fontSize: '0.7rem',
              padding: '6px 10px'
            }}
          >
            <FontAwesomeIcon icon={faDownload} style={{ marginRight: '4px', fontSize: '0.75rem' }} />
            Export
          </button>
          <button 
            onClick={handleSaveReport}
            disabled={!data}
            className="btn-checklist"
            style={{ 
              backgroundColor: '#2563eb',
              opacity: !data ? 0.5 : 1,
              cursor: !data ? 'not-allowed' : 'pointer'
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

      {/* Inline error (for filters / compare selection issues) */}
      {error && (
        <div style={{ padding: '8px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', flexShrink: 0 }}>
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
              value="balance"
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

          {/* Period Type */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Period Type:</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="filter-input"
              style={{ minWidth: '150px', width: '150px' }}
            >
              <option value="monthly">Monthly</option>
              <option value="custom">Custom (As of Date)</option>
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
            <div className="filter-group">
              <label className="filter-label" style={{ marginRight: '8px' }}>As of Date:</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="filter-input"
                style={{ minWidth: '150px', width: '150px' }}
              />
            </div>
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
        overflow: 'auto',
        minHeight: 0,
        padding: '20px 30px',
        height: '100%',
        position: 'relative'
      }}>
        {/* Loading State */}
        {loading && !data && (
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
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading balance sheet...</p>
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
              background: '#f9fafb'
            }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                Balance Sheet Comparison ({comparisonData.reports.length} Reports)
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
                          {report.date !== 'N/A' ? new Date(report.date).toLocaleDateString() : report.date}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Assets Section */}
                  <tr style={{ 
                    background: 'linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)', 
                    borderTop: '2px solid #93c5fd'
                  }}>
                    <td colSpan={2 + comparisonData.reports.length} style={{ 
                      padding: '12px 15px', 
                      fontWeight: 700, 
                      color: '#1e40af', 
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      ASSETS
                    </td>
                  </tr>
                  {comparisonData.assets.map((account, idx) => (
                    <tr 
                      key={idx} 
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
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
                    background: '#e0e7ff',
                    borderTop: '2px solid #93c5fd',
                    fontWeight: 700
                  }}>
                    <td colSpan="2" style={{ padding: '12px 15px', borderRight: '1px solid var(--border-color)' }}>Total Assets</td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} style={{ 
                        padding: '12px 15px', 
                        textAlign: 'right', 
                        fontFamily: 'monospace',
                        borderLeft: '1px solid var(--border-color)',
                        color: '#1e40af'
                      }}>
                        {formatCurrency(report.totals.total_assets)}
                      </td>
                    ))}
                  </tr>

                  {/* Liabilities Section */}
                  <tr style={{ 
                    background: 'linear-gradient(90deg, #fef2f2 0%, #fee2e2 100%)', 
                    borderTop: '2px solid #fca5a5'
                  }}>
                    <td colSpan={2 + comparisonData.reports.length} style={{ 
                      padding: '12px 15px', 
                      fontWeight: 700, 
                      color: '#991b1b', 
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      LIABILITIES
                    </td>
                  </tr>
                  {comparisonData.liabilities.map((account, idx) => (
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
                    <td colSpan="2" style={{ padding: '12px 15px', borderRight: '1px solid var(--border-color)' }}>Total Liabilities</td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} style={{ 
                        padding: '12px 15px', 
                        textAlign: 'right', 
                        fontFamily: 'monospace',
                        borderLeft: '1px solid var(--border-color)',
                        color: '#991b1b'
                      }}>
                        {formatCurrency(report.totals.total_liabilities)}
                      </td>
                    ))}
                  </tr>

                  {/* Equity Section */}
                  <tr style={{ 
                    background: 'linear-gradient(90deg, #f0fdf4 0%, #d1fae5 100%)', 
                    borderTop: '2px solid #86efac'
                  }}>
                    <td colSpan={2 + comparisonData.reports.length} style={{ 
                      padding: '12px 15px', 
                      fontWeight: 700, 
                      color: '#166534', 
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      EQUITY
                    </td>
                  </tr>
                  {comparisonData.equity.map((account, idx) => (
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
                    <td colSpan="2" style={{ padding: '12px 15px', borderRight: '1px solid var(--border-color)' }}>Total Equity</td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} style={{ 
                        padding: '12px 15px', 
                        textAlign: 'right', 
                        fontFamily: 'monospace',
                        borderLeft: '1px solid var(--border-color)',
                        color: '#166534'
                      }}>
                        {formatCurrency(report.totals.total_equity)}
                      </td>
                    ))}
                  </tr>

                  {/* Total Liabilities & Equity */}
                  <tr style={{ 
                    background: 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)',
                    borderTop: '3px solid #6b7280',
                    fontWeight: 700
                  }}>
                    <td colSpan="2" style={{ padding: '14px 15px', borderRight: '1px solid var(--border-color)', fontSize: '0.85rem' }}>Total Liabilities & Equity</td>
                    {comparisonData.reports.map((report, idx) => (
                      <td key={idx} style={{ 
                        padding: '14px 15px', 
                        textAlign: 'right', 
                        fontFamily: 'monospace',
                        borderLeft: '1px solid var(--border-color)',
                        fontSize: '0.85rem',
                        color: '#1f2937'
                      }}>
                        {formatCurrency((report.totals.total_liabilities || 0) + (report.totals.total_equity || 0))}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && !data && !error && !showComparisonView && (
          <div style={{ 
            background: 'white', 
            border: '1px solid var(--border-color)', 
            padding: '60px 30px', 
            textAlign: 'center',
            borderRadius: '4px'
          }}>
            <FontAwesomeIcon icon={faBalanceScale} style={{ color: 'var(--text-secondary)', fontSize: '3rem', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              No Balance Sheet Data
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Select a period and click Search to view the balance sheet data.
            </p>
          </div>
        )}

        {/* Main Balance Sheet View */}
        {!loading && !error && data && !showComparisonView && (
          <div className="bg-white">
            {/* Header */}
            <div
              className="border-b border-gray-200"
              style={{
                padding: '6px 0 6px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#111827'
                }}
              >
                BALANCE SHEET
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: '#4b5563',
                  fontWeight: 600
                }}
              >
                {data.period?.period_name
                  ? `${data.period.period_name} (As of ${data.period.end_date})`
                  : (data.as_of_date ? `As of ${data.as_of_date}` : '')}
              </span>
              {/* Period Status Badge */}
              {data.period && (
                <span style={{ marginLeft: 'auto' }}>
                  {data.period.is_closed ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-600 text-white">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                      </svg>
                      Period Closed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                      </svg>
                      Period Open
                    </span>
                  )}
                </span>
              )}
            </div>

            <div style={{ paddingTop: '8px', paddingBottom: '20px' }}>
            {/* ASSETS SECTION */}
            <div className="mb-6">
              <div
                style={{
                  background: 'linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)',
                  borderTop: '2px solid #93c5fd',
                  padding: '8px 12px',
                  marginBottom: '8px'
                }}
              >
                <h3
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: '#1e40af'
                  }}
                >
                  ASSETS
                </h3>
              </div>

              {/* Current Assets */}
              {(data.current_assets && data.current_assets.length > 0) && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-semibold text-gray-700">Current Assets</h4>
                    <button
                      type="button"
                      onClick={() => toggleSection('currentAssets')}
                      className="text-gray-500 hover:text-gray-700"
                      style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FontAwesomeIcon icon={expandedSections.currentAssets ? faChevronDown : faChevronRight} />
                      <span>Details</span>
                    </button>
                  </div>
                  {expandedSections.currentAssets && data.current_assets.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center hover:bg-gray-50"
                      style={{ padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}
                    >
                      <span
                        className="text-xs text-gray-600"
                        style={{ flex: 1, paddingRight: '12px' }}
                      >
                        {item.account_name}
                      </span>
                      <span
                        className="text-xs text-gray-900"
                        style={{
                          minWidth: '120px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          borderLeft: '1px solid #e5e7eb',
                          paddingLeft: '12px'
                        }}
                      >
                        {formatCurrency(item.balance)}
                      </span>
                    </div>
                  ))}
                  {expandedSections.currentAssets && (
                    <div
                      className="flex items-center border-t border-gray-300 mt-1"
                      style={{ padding: '6px 0' }}
                    >
                      <span className="text-xs font-semibold text-gray-900" style={{ flex: 1, paddingRight: '12px' }}>
                        Total Current Assets
                      </span>
                      <span
                        className="text-xs font-semibold text-gray-900"
                        style={{
                          minWidth: '120px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          borderLeft: '1px solid #e5e7eb',
                          paddingLeft: '12px'
                        }}
                      >
                        {formatCurrency(totals.total_current_assets || 0)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Fixed Assets */}
              {(data.fixed_assets && data.fixed_assets.length > 0) && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-semibold text-gray-700">Fixed Assets</h4>
                    <button
                      type="button"
                      onClick={() => toggleSection('fixedAssets')}
                      className="text-gray-500 hover:text-gray-700"
                      style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FontAwesomeIcon icon={expandedSections.fixedAssets ? faChevronDown : faChevronRight} />
                      <span>Details</span>
                    </button>
                  </div>
                  {expandedSections.fixedAssets && data.fixed_assets.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center hover:bg-gray-50"
                      style={{ padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}
                    >
                      <span
                        className="text-xs text-gray-600"
                        style={{ flex: 1, paddingRight: '12px' }}
                      >
                        {item.account_name}
                      </span>
                      <span
                        className="text-xs text-gray-900"
                        style={{
                          minWidth: '120px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          borderLeft: '1px solid #e5e7eb',
                          paddingLeft: '12px'
                        }}
                      >
                        {formatCurrency(item.balance)}
                      </span>
                    </div>
                  ))}
                  {expandedSections.fixedAssets && (
                    <div
                      className="flex items-center border-t border-gray-300 mt-1"
                      style={{ padding: '6px 0' }}
                    >
                      <span className="text-xs font-semibold text-gray-900" style={{ flex: 1, paddingRight: '12px' }}>
                        Total Fixed Assets
                      </span>
                      <span
                        className="text-xs font-semibold text-gray-900"
                        style={{
                          minWidth: '120px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          borderLeft: '1px solid #e5e7eb',
                          paddingLeft: '12px'
                        }}
                      >
                        {formatCurrency(totals.total_fixed_assets || 0)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Other Assets */}
              {(data.other_assets && data.other_assets.length > 0) && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-semibold text-gray-700">Other Assets</h4>
                    <button
                      type="button"
                      onClick={() => toggleSection('otherAssets')}
                      className="text-gray-500 hover:text-gray-700"
                      style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FontAwesomeIcon icon={expandedSections.otherAssets ? faChevronDown : faChevronRight} />
                      <span>Details</span>
                    </button>
                  </div>
                  {expandedSections.otherAssets && data.other_assets.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center hover:bg-gray-50"
                      style={{ padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}
                    >
                      <span
                        className="text-xs text-gray-600"
                        style={{ flex: 1, paddingRight: '12px' }}
                      >
                        {item.account_name}
                      </span>
                      <span
                        className="text-xs text-gray-900"
                        style={{
                          minWidth: '120px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          borderLeft: '1px solid #e5e7eb',
                          paddingLeft: '12px'
                        }}
                      >
                        {formatCurrency(item.balance)}
                      </span>
                    </div>
                  ))}
                  {expandedSections.otherAssets && (
                    <div
                      className="flex items-center border-t border-gray-300 mt-1"
                      style={{ padding: '6px 0' }}
                    >
                      <span className="text-xs font-semibold text-gray-900" style={{ flex: 1, paddingRight: '12px' }}>
                        Total Other Assets
                      </span>
                      <span
                        className="text-xs font-semibold text-gray-900"
                        style={{
                          minWidth: '120px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          borderLeft: '1px solid #e5e7eb',
                          paddingLeft: '12px'
                        }}
                      >
                        {formatCurrency(totals.total_other_assets || 0)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* TOTAL ASSETS */}
              <div
                className="flex justify-between items-center"
                style={{
                  padding: '10px 12px',
                  background: '#e0e7ff',
                  borderTop: '2px solid #93c5fd',
                  borderBottom: '1px solid #c7d2fe'
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e3a8a' }}>TOTAL ASSETS</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace' }}>
                  {formatCurrency(totals.total_assets)}
                </span>
              </div>
            </div>

            {/* LIABILITIES SECTION */}
            <div className="mb-6">
              <div
                style={{
                  background: 'linear-gradient(90deg, #fef2f2 0%, #fee2e2 100%)',
                  borderTop: '2px solid #fca5a5',
                  padding: '8px 12px',
                  marginBottom: '8px'
                }}
              >
                <h3
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: '#991b1b'
                  }}
                >
                  LIABILITIES
                </h3>
              </div>

              {/* Current Liabilities */}
              {(data.current_liabilities && data.current_liabilities.length > 0) && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-semibold text-gray-700">Current Liabilities</h4>
                    <button
                      type="button"
                      onClick={() => toggleSection('currentLiabilities')}
                      className="text-gray-500 hover:text-gray-700"
                      style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FontAwesomeIcon icon={expandedSections.currentLiabilities ? faChevronDown : faChevronRight} />
                      <span>Details</span>
                    </button>
                  </div>
                  {expandedSections.currentLiabilities && data.current_liabilities.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center hover:bg-gray-50"
                      style={{ padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}
                    >
                      <span
                        className="text-xs text-gray-600"
                        style={{ flex: 1, paddingRight: '12px' }}
                      >
                        {item.account_name}
                      </span>
                      <span
                        className="text-xs text-gray-900"
                        style={{
                          minWidth: '120px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          borderLeft: '1px solid #e5e7eb',
                          paddingLeft: '12px'
                        }}
                      >
                        {formatCurrency(item.balance)}
                      </span>
                    </div>
                  ))}
                  {expandedSections.currentLiabilities && (
                    <div
                      className="flex items-center border-t border-gray-300 mt-1"
                      style={{ padding: '6px 0' }}
                    >
                      <span className="text-xs font-semibold text-gray-900" style={{ flex: 1, paddingRight: '12px' }}>
                        Total Current Liabilities
                      </span>
                      <span
                        className="text-xs font-semibold text-gray-900"
                        style={{
                          minWidth: '120px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          borderLeft: '1px solid #e5e7eb',
                          paddingLeft: '12px'
                        }}
                      >
                        {formatCurrency(totals.total_current_liabilities || 0)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Long-term Liabilities */}
              {(data.long_term_liabilities && data.long_term_liabilities.length > 0) && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-semibold text-gray-700">Long-term Liabilities</h4>
                    <button
                      type="button"
                      onClick={() => toggleSection('longTermLiabilities')}
                      className="text-gray-500 hover:text-gray-700"
                      style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FontAwesomeIcon icon={expandedSections.longTermLiabilities ? faChevronDown : faChevronRight} />
                      <span>Details</span>
                    </button>
                  </div>
                  {expandedSections.longTermLiabilities && data.long_term_liabilities.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center hover:bg-gray-50"
                      style={{ padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}
                    >
                      <span
                        className="text-xs text-gray-600"
                        style={{ flex: 1, paddingRight: '12px' }}
                      >
                        {item.account_name}
                      </span>
                      <span
                        className="text-xs text-gray-900"
                        style={{
                          minWidth: '120px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          borderLeft: '1px solid #e5e7eb',
                          paddingLeft: '12px'
                        }}
                      >
                        {formatCurrency(item.balance)}
                      </span>
                    </div>
                  ))}
                  {expandedSections.longTermLiabilities && (
                    <div
                      className="flex items-center border-t border-gray-300 mt-1"
                      style={{ padding: '6px 0' }}
                    >
                      <span className="text-xs font-semibold text-gray-900" style={{ flex: 1, paddingRight: '12px' }}>
                        Total Long-term Liabilities
                      </span>
                      <span
                        className="text-xs font-semibold text-gray-900"
                        style={{
                          minWidth: '120px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          borderLeft: '1px solid #e5e7eb',
                          paddingLeft: '12px'
                        }}
                      >
                        {formatCurrency(totals.total_long_term_liabilities || 0)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* TOTAL LIABILITIES */}
              <div
                className="flex justify-between items-center"
                style={{
                  padding: '10px 12px',
                  background: '#fee2e2',
                  borderTop: '2px solid #fca5a5',
                  borderBottom: '1px solid #fecaca'
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7f1d1d' }}>TOTAL LIABILITIES</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7f1d1d', fontFamily: 'monospace' }}>
                  {formatCurrency(totals.total_liabilities)}
                </span>
              </div>
            </div>

            {/* EQUITY SECTION */}
            <div className="mb-6">
              <div
                style={{
                  background: 'linear-gradient(90deg, #f0fdf4 0%, #d1fae5 100%)',
                  borderTop: '2px solid #86efac',
                  padding: '8px 12px',
                  marginBottom: '8px'
                }}
              >
                <h3
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: '#166534'
                  }}
                >
                  EQUITY
                </h3>
              </div>

              {(data.equity || []).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center hover:bg-gray-50"
                  style={{ padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}
                >
                  <span
                    className="text-xs text-gray-600"
                    style={{ flex: 1, paddingRight: '12px' }}
                  >
                    {item.account_name}
                  </span>
                  <span
                    className="text-xs text-gray-900"
                    style={{
                      minWidth: '120px',
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      borderLeft: '1px solid #e5e7eb',
                      paddingLeft: '12px'
                    }}
                  >
                    {formatCurrency(item.balance)}
                  </span>
                </div>
              ))}
              
              {/* TOTAL EQUITY */}
              <div
                className="flex justify-between items-center"
                style={{
                  padding: '10px 12px',
                  background: '#d1fae5',
                  borderTop: '2px solid #86efac',
                  borderBottom: '1px solid #bbf7d0',
                  marginTop: '8px'
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>TOTAL EQUITY</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', fontFamily: 'monospace' }}>
                  {formatCurrency(totals.total_equity)}
                </span>
              </div>
            </div>

            {/* TOTAL LIABILITIES & EQUITY */}
            <div
              className="flex justify-between items-center"
              style={{
                padding: '12px 14px',
                background: 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)',
                borderTop: '3px solid #6b7280'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827' }}>
                  TOTAL LIABILITIES &amp; EQUITY
                </span>
                {Math.abs(totals.total_assets - totalLiabilitiesAndEquity) < 0.01 ? (
                  <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#16a34a' }}>
                    Balance Sheet is Balanced
                  </span>
                ) : (
                  <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#dc2626' }}>
                    Out of Balance: {formatCurrency(Math.abs(totals.total_assets - totalLiabilitiesAndEquity))} difference
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>
                {formatCurrency(totalLiabilitiesAndEquity)}
              </span>
            </div>
            </div>
          </div>
        )}
      </div>

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
                Save Balance Sheet
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
                  placeholder="e.g., Balance Sheet - October 2024"
                  className="form-control"
                />
                {saveError && (
                  <p style={{ marginTop: '4px', fontSize: '0.7rem', color: '#dc2626' }}>
                    {saveError}
                  </p>
                )}
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
                Load Saved Balance Sheet
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
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No saved balance sheets found</p>
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
                              <span style={{ color: report.report_summary.is_balanced ? '#059669' : '#dc2626' }}>
                                {report.report_summary.is_balanced ? '✓ Balanced' : '✗ Out of Balance'}
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
                  Compare Balance Sheets
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
                  <FontAwesomeIcon icon={faBalanceScale} style={{ fontSize: '3rem', color: 'var(--text-secondary)', marginBottom: '12px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No saved balance sheets found</p>
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
                              <span style={{ color: report.report_summary.is_balanced ? '#059669' : '#dc2626' }}>
                                {report.report_summary.is_balanced ? '✓ Balanced' : '✗ Out of Balance'}
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
                <FontAwesomeIcon icon={faBalanceScale} style={{ marginRight: '6px' }} />
                Compare {selectedReportsForComparison.length} Reports
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceSheet;
