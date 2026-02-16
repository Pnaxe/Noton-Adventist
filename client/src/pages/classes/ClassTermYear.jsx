import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPlay, faSearch } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';

const ClassTermYear = () => {
  const { token } = useAuth();
  const [classTermYears, setClassTermYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showViewModal, setShowViewModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [bulkFormData, setBulkFormData] = useState({
    term: '',
    academic_year: '',
    start_date: '',
    end_date: ''
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(25);

  useEffect(() => {
    fetchClasses();
    fetchClassTermYears();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearchTerm]);

  const fetchClassTermYears = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BASE_URL}/classes/class-term-years`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClassTermYears(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch class term years');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/classes/gradelevel-classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data.data || []);
    } catch (err) {
      // non-blocking
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${BASE_URL}/classes/class-term-years/bulk-populate`, bulkFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage(response.data.message);
      setShowSuccessModal(true);
      setShowBulkModal(false);
      resetBulkForm();
      fetchClassTermYears();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to bulk populate class term years');
      setShowErrorModal(true);
    }
  };

  const handleView = (record) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const resetBulkForm = () => {
    setBulkFormData({
      term: '',
      academic_year: '',
      start_date: '',
      end_date: ''
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  // Filter by search (class name, stream, term, academic year)
  const filteredRecords = activeSearchTerm.trim()
    ? classTermYears.filter((r) => {
        const q = activeSearchTerm.trim().toLowerCase();
        const className = (r.class_name || '').toLowerCase();
        const streamName = (r.stream_name || '').toLowerCase();
        const term = (r.term || '').toLowerCase();
        const year = String(r.academic_year || '').toLowerCase();
        return className.includes(q) || streamName.includes(q) || term.includes(q) || year.includes(q);
      })
    : classTermYears;

  const totalFiltered = filteredRecords.length;
  const usePagination = !activeSearchTerm.trim();
  const totalPages = usePagination ? Math.max(1, Math.ceil(totalFiltered / limit)) : 1;
  const startIndex = usePagination ? (currentPage - 1) * limit : 0;
  const endIndex = usePagination ? startIndex + limit : totalFiltered;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  const displayStart = totalFiltered > 0 ? startIndex + 1 : 0;
  const displayEnd = Math.min(endIndex, totalFiltered);
  const hasData = paginatedRecords.length > 0;

  return (
    <div
      className="reports-container"
      style={{
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* Report Header - same as Classes */}
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          <h2 className="report-title">Class Term Year</h2>
          <p className="report-subtitle">Manage class assignments for terms and academic years.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setShowBulkModal(true)} className="btn-checklist">
            <FontAwesomeIcon icon={faPlay} />
            Bulk Populate
          </button>
        </div>
      </div>

      {/* Filters Section - match Classes page */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left">
          <form onSubmit={handleSearch} className="filter-group">
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by class name, stream, term or year..."
                className="filter-input search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setActiveSearchTerm('');
                    setCurrentPage(1);
                  }}
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

      {/* Error Display */}
      {error && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', flexShrink: 0 }}>
          {error}
        </div>
      )}

      {/* Table Container - same as Classes */}
      <div
        className="report-content-container ecl-table-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'auto',
          minHeight: 0,
          padding: 0,
          height: '100%'
        }}
      >
        {loading && classTermYears.length === 0 ? (
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
            <div className="loading-spinner" />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading class term years...</p>
          </div>
        ) : (
          <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
            <thead
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'var(--sidebar-bg)'
              }}
            >
              <tr>
                <th style={{ padding: '6px 10px' }}>CLASS NAME</th>
                <th style={{ padding: '6px 10px' }}>STREAM</th>
                <th style={{ padding: '6px 10px' }}>TERM</th>
                <th style={{ padding: '6px 10px' }}>ACADEMIC YEAR</th>
                <th style={{ padding: '6px 10px' }}>START DATE</th>
                <th style={{ padding: '6px 10px' }}>END DATE</th>
                <th style={{ padding: '6px 10px' }}>STATUS</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map((record, index) => (
                <tr
                  key={record.id}
                  style={{
                    height: '32px',
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>{record.class_name || 'N/A'}</td>
                  <td style={{ padding: '4px 10px' }}>{record.stream_name || 'N/A'}</td>
                  <td style={{ padding: '4px 10px' }}>{record.term || 'N/A'}</td>
                  <td style={{ padding: '4px 10px' }}>{record.academic_year || 'N/A'}</td>
                  <td style={{ padding: '4px 10px' }}>
                    {record.start_date ? new Date(record.start_date).toLocaleDateString() : '-'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {record.end_date ? new Date(record.end_date).toLocaleDateString() : '-'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>{record.is_active ? 'Active' : 'Inactive'}</td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleView(record)}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="View"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 25 - paginatedRecords.length) }).map((_, index) => (
                <tr
                  key={`empty-${index}`}
                  style={{
                    height: '32px',
                    backgroundColor: (paginatedRecords.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
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

      {/* Pagination Footer - same as Classes */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {totalFiltered || 0} results.
        </div>
        <div className="table-footer-right">
          {!activeSearchTerm && totalPages > 1 && (
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
          )}
          {!activeSearchTerm && totalPages <= 1 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              All data displayed
            </div>
          )}
        </div>
      </div>

      {/* Bulk Populate Modal - same modal classes as Classes page */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Bulk Populate Class Term Years</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setShowBulkModal(false);
                  resetBulkForm();
                }}
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                This will create class term year records for all active classes for the specified term and academic year.
              </p>
              <form onSubmit={handleBulkSubmit} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Term <span className="required">*</span></label>
                  <select
                    value={bulkFormData.term}
                    onChange={(e) => setBulkFormData((prev) => ({ ...prev, term: e.target.value }))}
                    className="form-control"
                    required
                  >
                    <option value="">Select Term</option>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Academic Year <span className="required">*</span></label>
                  <input
                    type="text"
                    value={bulkFormData.academic_year}
                    onChange={(e) => setBulkFormData((prev) => ({ ...prev, academic_year: e.target.value }))}
                    placeholder="e.g., 2025"
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    value={bulkFormData.start_date}
                    onChange={(e) => setBulkFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    value={bulkFormData.end_date}
                    onChange={(e) => setBulkFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                    className="form-control"
                  />
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                  <button
                    type="button"
                    className="modal-btn modal-btn-cancel"
                    onClick={() => {
                      setShowBulkModal(false);
                      resetBulkForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn modal-btn-confirm">
                    Populate All Classes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Class Term Year Details</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowViewModal(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Class</span>
                  <div style={{ color: 'var(--text-primary)', marginTop: '4px' }}>{selectedRecord.class_name}</div>
                </div>
                <div>
                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Stream</span>
                  <div style={{ color: 'var(--text-primary)', marginTop: '4px' }}>{selectedRecord.stream_name}</div>
                </div>
                <div>
                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Term</span>
                  <div style={{ color: 'var(--text-primary)', marginTop: '4px' }}>{selectedRecord.term}</div>
                </div>
                <div>
                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Academic Year</span>
                  <div style={{ color: 'var(--text-primary)', marginTop: '4px' }}>{selectedRecord.academic_year}</div>
                </div>
                <div>
                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Start Date</span>
                  <div style={{ color: 'var(--text-primary)', marginTop: '4px' }}>{selectedRecord.start_date || '-'}</div>
                </div>
                <div>
                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>End Date</span>
                  <div style={{ color: 'var(--text-primary)', marginTop: '4px' }}>{selectedRecord.end_date || '-'}</div>
                </div>
                <div>
                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Status</span>
                  <div style={{ color: 'var(--text-primary)', marginTop: '4px' }}>{selectedRecord.is_active ? 'Active' : 'Inactive'}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
      />
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default ClassTermYear;
