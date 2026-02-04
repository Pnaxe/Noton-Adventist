import { useState, useEffect } from 'react';
import { useEmployeeAuth } from '../contexts/EmployeeAuthContext';
import BASE_URL from '../contexts/Api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faEye,
  faDownload
} from '@fortawesome/free-solid-svg-icons';

const Payslips = () => {
  const { employee, token } = useEmployeeAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    pay_period: ''
  });

  const fetchPayslips = async () => {
    if (!employee?.id) return;
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.pay_period) params.append('pay_period', filters.pay_period);

      const response = await fetch(`${BASE_URL}/employee-payroll/${employee.id}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();
      setPayslips(data.data || []);
    } catch (err) {
      console.error('Fetch payslips error:', err);
      setError(err.message || 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employee?.id) {
      fetchPayslips();
    } else {
      setLoading(false);
    }
  }, [employee?.id, filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearchTerm(searchTerm);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ status: '', pay_period: '' });
    setSearchTerm('');
    setActiveSearchTerm('');
  };

  const filteredPayslips = payslips.filter((p) => {
    if (!activeSearchTerm) return true;
    const term = activeSearchTerm.toLowerCase();
    return (
      (p.pay_period && p.pay_period.toLowerCase().includes(term)) ||
      (p.employee_name && p.employee_name.toLowerCase().includes(term))
    );
  });

  const limit = 25;
  const displayStart = filteredPayslips.length > 0 ? 1 : 0;
  const displayEnd = filteredPayslips.length;
  const totalPayslips = filteredPayslips.length;

  return (
    <div className="reports-container" style={{
      height: '100%',
      maxHeight: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Report Header - match Test Marks */}
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          <h2 className="report-title">Payslips</h2>
          <p className="report-subtitle">View your salary information and payslips.</p>
        </div>
      </div>

      {/* Filters Section - match Test Marks */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left">
          <form onSubmit={handleSearch} className="filter-group">
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search payslips..."
                className="filter-input search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setActiveSearchTerm(''); }}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    padding: '4px 6px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px'
                  }}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </form>

          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Status:</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="filter-input"
              style={{ minWidth: '120px', width: '120px' }}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processed">Processed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Pay Period:</label>
            <input
              type="text"
              name="pay_period"
              value={filters.pay_period}
              onChange={handleFilterChange}
              placeholder="e.g. 2024-12"
              className="filter-input"
              style={{ width: '100px' }}
            />
          </div>

          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-xs font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded"
            style={{ height: '36px' }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Display - match Test Marks */}
      {error && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }}>
          {error}
        </div>
      )}

      {/* Table Container - pixel perfect to Test Marks */}
      <div className="report-content-container ecl-table-container" style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
        padding: 0,
        height: '100%'
      }}>
        {loading && payslips.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            gap: '16px'
          }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading payslips...</p>
          </div>
        ) : filteredPayslips.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem'
          }}>
            {payslips.length === 0 ? 'No payslips found.' : 'No payslips match your search or filters.'}
          </div>
        ) : (
          <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
            <thead style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              background: 'var(--sidebar-bg)'
            }}>
              <tr>
                <th style={{ padding: '6px 10px' }}>PAY PERIOD</th>
                <th style={{ padding: '6px 10px' }}>NET PAY</th>
                <th style={{ padding: '6px 10px' }}>STATUS</th>
                <th style={{ padding: '6px 10px' }}>PAY DATE</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayslips.map((payslip, index) => (
                <tr
                  key={payslip.id}
                  style={{
                    height: '32px',
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>{payslip.pay_period || 'N/A'}</td>
                  <td style={{ padding: '4px 10px' }}>
                    ${payslip.net_pay != null ? Number(payslip.net_pay).toFixed(2) : '0.00'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                      payslip.status === 'processed'
                        ? 'bg-green-100 text-green-800'
                        : payslip.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {payslip.status || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {payslip.pay_date ? new Date(payslip.pay_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => window.open(`/payslips/${payslip.id}`, '_blank')}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="View Payslip"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        style={{ color: '#059669', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Download Payslip"
                      >
                        <FontAwesomeIcon icon={faDownload} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Empty placeholder rows - match Test Marks (25 rows) */}
              {Array.from({ length: Math.max(0, limit - filteredPayslips.length) }).map((_, index) => (
                <tr
                  key={`empty-${index}`}
                  style={{
                    height: '32px',
                    backgroundColor: (filteredPayslips.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer - match Test Marks */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {totalPayslips} results.
        </div>
        <div className="table-footer-right">
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            All data displayed
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payslips;
