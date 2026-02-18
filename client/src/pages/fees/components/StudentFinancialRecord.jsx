import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faUserGraduate, 
  faDollarSign,
  faFileInvoice,
  faReceipt,
  faEye,
  faTimes,
  faCheck,
  faExclamationTriangle,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../contexts/AuthContext';
import BASE_URL from '../../../contexts/Api';
import axios from 'axios';
import ErrorModal from '../../../components/ErrorModal';

const StudentFinancialRecord = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [financialData, setFinancialData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(25);
  const [allTransactions, setAllTransactions] = useState([]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentFinancialData();
    }
  }, [selectedStudent]);

  // Pagination logic
  useEffect(() => {
    if (allTransactions.length > 0) {
      const startIndex = (currentPage - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTransactions = allTransactions.slice(startIndex, endIndex);
      setTransactions(paginatedTransactions);
    } else {
      setTransactions([]);
    }
  }, [currentPage, allTransactions, limit]);

  const searchStudents = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/students/search?query=${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.data || []);
    } catch (error) {
      console.error('Error searching students:', error);
      setStudents([]);
      setErrorMessage('Failed to search students');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setStudents([]);
    setSearchTerm('');
    setFinancialData(null);
    setTransactions([]);
    setAllTransactions([]);
    setCurrentPage(1);
  };

  const fetchStudentFinancialData = async () => {
    if (!selectedStudent) return;

    setLoading(true);
    try {
      // Fetch financial summary
      const summaryResponse = await axios.get(
        `${BASE_URL}/student-financial-records/${selectedStudent.RegNumber}/summary`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Fetch all transactions
      const transactionsResponse = await axios.get(
        `${BASE_URL}/student-financial-records/${selectedStudent.RegNumber}/transactions`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setFinancialData(summaryResponse.data.data || {});
      const allTrans = transactionsResponse.data.data || [];
      setAllTransactions(allTrans);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      setErrorMessage(`Failed to fetch financial data: ${error.response?.data?.message || error.message}`);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate pagination values
  const totalTransactions = allTransactions.length;
  const totalPages = Math.ceil(totalTransactions / limit);
  const displayStart = totalTransactions > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalTransactions);

  const handleSearch = (e) => {
    e.preventDefault();
    searchStudents();
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setStudents([]);
  };

  return (
    <>
      <style>
        {`
          @media print {
            body { margin: 0; }
            .print-break { page-break-before: always; }
            table { page-break-inside: avoid; }
            .print-header { display: block !important; }
            .print-hidden { display: none !important; }
          }
        `}
      </style>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Filters Section */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="filter-group">
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or registration number..."
                className="filter-input search-input"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
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
        </div>
      </div>

      {/* Student Search Results Dropdown */}
      {students.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '30px',
          right: '30px',
          zIndex: 1000,
          backgroundColor: 'white',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          maxHeight: '200px',
          overflowY: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          marginTop: '4px'
        }}>
          {students.map((student) => (
            <div
              key={student.RegNumber}
              onClick={() => selectStudent(student)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-color)',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                {student.Name} {student.Surname}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Reg: {student.RegNumber} | Class: {student.ClassName || 'Not Assigned'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Student Info */}
      {selectedStudent && (
        <div style={{
          padding: '12px 30px',
          background: '#f9fafb',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '0.75rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Name:</span>
              <span style={{ marginLeft: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {selectedStudent.Name} {selectedStudent.Surname}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Registration No:</span>
              <span style={{ marginLeft: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {selectedStudent.RegNumber}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Class:</span>
              <span style={{ marginLeft: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {selectedStudent.ClassName || 'Not Assigned'}
              </span>
            </div>
            {financialData && (
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Balance:</span>
                <span style={{
                  marginLeft: '8px',
                  fontWeight: 600,
                  color: (financialData.balance || 0) >= 0 ? '#16a34a' : '#dc2626'
                }}>
                  {formatCurrency(financialData.balance || 0)}
                  {' '}
                  {(financialData.balance || 0) >= 0 ? 'CR' : 'DR'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="report-content-container ecl-table-container" style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
        padding: 0,
        height: '100%'
      }}>
        <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
          <thead style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'var(--sidebar-bg)'
          }}>
            <tr>
              <th style={{ padding: '6px 10px' }}>DATE</th>
              <th style={{ padding: '6px 10px' }}>TYPE</th>
              <th style={{ padding: '6px 10px' }}>DESCRIPTION</th>
              <th style={{ padding: '6px 10px', textAlign: 'right' }}>DR</th>
              <th style={{ padding: '6px 10px', textAlign: 'right' }}>CR</th>
              <th style={{ padding: '6px 10px', textAlign: 'right' }}>BALANCE</th>
            </tr>
          </thead>
          <tbody>
            {loading && !selectedStudent ? (
              <>
                {Array.from({ length: 25 }).map((_, index) => (
                  <tr
                    key={`loading-${index}`}
                    style={{
                      height: '32px',
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                    }}
                  >
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  </tr>
                ))}
              </>
            ) : !selectedStudent ? (
              <>
                {Array.from({ length: 25 }).map((_, index) => (
                  <tr
                    key={`empty-${index}`}
                    style={{
                      height: '32px',
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                    }}
                  >
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  </tr>
                ))}
              </>
            ) : loading && transactions.length === 0 ? (
              <>
                {Array.from({ length: 25 }).map((_, index) => (
                  <tr
                    key={`loading-trans-${index}`}
                    style={{
                      height: '32px',
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                    }}
                  >
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  </tr>
                ))}
              </>
            ) : transactions.length > 0 ? (
              <>
                {transactions.map((transaction, index) => (
                  <tr
                    key={transaction.id || index}
                    style={{
                      height: '32px',
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                    }}
                  >
                    <td style={{ padding: '4px 10px' }}>
                      {formatDate(transaction.payment_date)}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      {transaction.fee_type || 'N/A'}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      {transaction.notes || `${transaction.fee_type || 'Payment'}`}
                    </td>
                    <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                      {transaction.transaction_type === 'DEBIT' ? formatCurrency(Math.abs(transaction.amount), transaction.currency_symbol) : '—'}
                    </td>
                    <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                      {transaction.transaction_type === 'CREDIT' ? formatCurrency(Math.abs(transaction.amount), transaction.currency_symbol) : '—'}
                    </td>
                    <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: 600 }}>
                      <span style={{ color: (transaction.running_balance || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                        {formatCurrency(transaction.running_balance || 0, transaction.currency_symbol)}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Empty placeholder rows to always show 25 rows */}
                {Array.from({ length: Math.max(0, 25 - transactions.length) }).map((_, index) => (
                  <tr
                    key={`empty-${index}`}
                    style={{
                      height: '32px',
                      backgroundColor: (transactions.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
                    }}
                  >
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  </tr>
                ))}
              </>
            ) : (
              <>
                {Array.from({ length: 25 }).map((_, index) => (
                  <tr
                    key={`no-data-${index}`}
                    style={{
                      height: '32px',
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                    }}
                  >
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                    <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          {selectedStudent && allTransactions.length > 0 ? (
            `Showing ${displayStart} to ${displayEnd} of ${totalTransactions} results.`
          ) : (
            'Showing 0 to 0 of 0 results.'
          )}
        </div>
        <div className="table-footer-right">
          {selectedStudent && allTransactions.length > 0 ? (
            totalPages > 1 ? (
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="pagination-info" style={{ fontSize: '0.7rem' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                All data displayed
              </div>
            )
          ) : (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              All data displayed
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />
    </>
  );
};

export default StudentFinancialRecord;
