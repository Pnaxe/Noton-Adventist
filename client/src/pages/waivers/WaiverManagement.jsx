import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faEye,
  faEdit,
  faTrash,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';

const WaiverManagement = forwardRef((props, ref) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [waivers, setWaivers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalWaivers: 0,
    limit: 25,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWaiver, setSelectedWaiver] = useState(null);
  const [viewModalLoading, setViewModalLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    waiver_amount: '',
    reason: '',
    notes: '',
    term: '',
    academic_year: '',
    status: 'Active'
  });
  const [deleteReason, setDeleteReason] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Live search effect with debouncing
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setActiveSearchTerm(searchTerm);
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    fetchWaivers();
  }, [pagination.currentPage, activeSearchTerm]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWaivers();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Expose refresh method to parent
  useImperativeHandle(ref, () => ({
    refresh: () => {
      fetchWaivers();
    }
  }));

  const fetchWaivers = async () => {
    try {
      setTableLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit
      });

      if (activeSearchTerm) {
        params.append('search', activeSearchTerm.trim());
      }

      const response = await axios.get(`${BASE_URL}/waivers/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setWaivers(response.data.data.waivers || []);
        const paginationData = response.data.data.pagination || {};
        setPagination(prev => ({
          ...prev,
          totalPages: paginationData.totalPages || 1,
          totalWaivers: paginationData.total || 0,
          hasNextPage: paginationData.hasNext || false,
          hasPreviousPage: paginationData.hasPrev || false
        }));
      }
    } catch (error) {
      console.error('Error fetching waivers:', error);
      setError('Failed to fetch waivers');
      setWaivers([]);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(Math.abs(amount || 0));
  };

  const handleViewWaiver = async (waiver) => {
    try {
      setViewModalLoading(true);
      const response = await axios.get(`${BASE_URL}/waivers/${waiver.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success && response.data.data) {
        setSelectedWaiver(response.data.data);
        setShowViewModal(true);
      } else {
        setErrorMessage('Invalid response from server');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error fetching waiver details:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch waiver details';
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setViewModalLoading(false);
    }
  };

  const handleEditWaiver = (waiver) => {
    setSelectedWaiver(waiver);
    setEditFormData({
      waiver_amount: waiver.waiver_amount || '',
      reason: waiver.reason || '',
      notes: waiver.notes || '',
      term: waiver.term || '',
      academic_year: waiver.academic_year || '',
      status: waiver.status || 'Active'
    });
    setShowEditModal(true);
  };

  const handleUpdateWaiver = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${BASE_URL}/waivers/${selectedWaiver.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        setSuccessMessage('Waiver updated successfully');
        setShowSuccessModal(true);
        setShowEditModal(false);
        setSelectedWaiver(null);
        fetchWaivers();
      }
    } catch (error) {
      console.error('Error updating waiver:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update waiver';
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    }
  };

  const handleDeleteWaiver = (waiver) => {
    setSelectedWaiver(waiver);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const confirmDeleteWaiver = async () => {
    try {
      const response = await axios.delete(`${BASE_URL}/waivers/${selectedWaiver.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { reversal_reason: deleteReason || 'Reversed by administrator' }
      });

      if (response.data && response.data.success) {
        setSuccessMessage('Waiver reversed successfully');
        setShowSuccessModal(true);
        setShowDeleteModal(false);
        setSelectedWaiver(null);
        setDeleteReason('');
        fetchWaivers();
      }
    } catch (error) {
      console.error('Error reversing waiver:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to reverse waiver';
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    }
  };

  const displayStart = waivers.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0;
  const displayEnd = Math.min(pagination.currentPage * pagination.limit, pagination.totalWaivers);

  return (
    <>
      {/* Filters Section */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left">
          {/* Search Bar */}
          <div className="filter-group">
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name or registration number..."
                className="filter-input search-input"
                style={{ width: '300px' }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    padding: '4px 6px',
                    background: 'transparent',
                    border: 'none',
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
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }}>
          {error}
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
        {tableLoading && waivers.length === 0 ? (
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
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading waivers...</p>
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
                <th style={{ padding: '6px 10px' }}>STUDENT NAME</th>
                <th style={{ padding: '6px 10px' }}>REG NUMBER</th>
                <th style={{ padding: '6px 10px', textAlign: 'right' }}>WAIVER AMOUNT</th>
                <th style={{ padding: '6px 10px' }}>CATEGORY</th>
                <th style={{ padding: '6px 10px' }}>TERM</th>
                <th style={{ padding: '6px 10px' }}>ACADEMIC YEAR</th>
                <th style={{ padding: '6px 10px' }}>DATE</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {waivers.map((waiver, index) => (
                <tr
                  key={waiver.id}
                  style={{
                    height: '32px',
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px', fontWeight: 600 }}>
                    {waiver.Name} {waiver.Surname}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {waiver.student_reg_number}
                  </td>
                  <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                    {formatCurrency(waiver.waiver_amount)} {waiver.currency_symbol || ''}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {waiver.category_name || waiver.waiver_type || 'N/A'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {waiver.term || 'N/A'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {waiver.academic_year || 'N/A'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {formatDate(waiver.granted_date || waiver.created_at)}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleViewWaiver(waiver)}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="View Waiver Details"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      {waiver.status === 'Active' && (
                        <>
                          <button
                            onClick={() => handleEditWaiver(waiver)}
                            style={{ color: '#059669', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            title="Edit Waiver"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => handleDeleteWaiver(waiver)}
                            style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            title="Reverse Waiver"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {/* Empty placeholder rows to always show 25 rows */}
              {Array.from({ length: Math.max(0, pagination.limit - waivers.length) }).map((_, index) => (
                <tr
                  key={`empty-${index}`}
                  style={{
                    height: '32px',
                    backgroundColor: (waivers.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
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

      {/* Pagination Footer */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {pagination.totalWaivers || 0} results.
        </div>
        <div className="table-footer-right">
          {!activeSearchTerm && pagination.totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(Math.max(1, pagination.currentPage - 1))}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </button>
              <span className="pagination-info" style={{ fontSize: '0.7rem' }}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </button>
            </div>
          )}
          {!activeSearchTerm && pagination.totalPages <= 1 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              All data displayed
            </div>
          )}
        </div>
      </div>

      {/* View Waiver Modal */}
      {showViewModal && selectedWaiver && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)} style={{ zIndex: 1003 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Waiver Details</h3>
              <button className="modal-close-btn" onClick={() => setShowViewModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              {viewModalLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                  <div className="loading-spinner"></div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                        Student Name
                      </label>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
                        {selectedWaiver.student_name && selectedWaiver.student_surname 
                          ? `${selectedWaiver.student_name} ${selectedWaiver.student_surname}`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                        Registration Number
                      </label>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
                        {selectedWaiver.student_reg_number || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                        Waiver Amount
                      </label>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0, fontWeight: 600, color: '#059669' }}>
                        {formatCurrency(selectedWaiver.waiver_amount)} {selectedWaiver.currency_symbol || ''}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                        Category
                      </label>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
                        {selectedWaiver.category_name || selectedWaiver.waiver_type || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                        Waiver Type
                      </label>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
                        {selectedWaiver.waiver_type || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                        Status
                      </label>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          background: selectedWaiver.status === 'Active' ? '#d1fae5' : '#fee2e2',
                          color: selectedWaiver.status === 'Active' ? '#065f46' : '#991b1b'
                        }}>
                          {selectedWaiver.status || 'Active'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                        Term
                      </label>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
                        {selectedWaiver.term || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                        Academic Year
                      </label>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
                        {selectedWaiver.academic_year || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                        Granted Date
                      </label>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
                        {formatDate(selectedWaiver.granted_date || selectedWaiver.created_at)}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                        Granted By
                      </label>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
                        {selectedWaiver.granted_by_username || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                      Reason
                    </label>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0, padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                      {selectedWaiver.reason || 'N/A'}
                    </p>
                  </div>
                  {selectedWaiver.notes && (
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                        Notes
                      </label>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0, padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                        {selectedWaiver.notes}
                      </p>
                    </div>
                  )}
                  {selectedWaiver.reversal_reason && (
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                        Reversal Reason
                      </label>
                      <p style={{ fontSize: '0.875rem', color: '#dc2626', margin: 0, padding: '8px', background: '#fee2e2', borderRadius: '4px' }}>
                        {selectedWaiver.reversal_reason}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedWaiver(null);
                }}
                className="modal-btn modal-btn-cancel"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Waiver Modal */}
      {showEditModal && selectedWaiver && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)} style={{ zIndex: 1004 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Waiver</h3>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateWaiver} className="modal-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      Waiver Amount <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.waiver_amount}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, waiver_amount: e.target.value }))}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="form-control"
                    >
                      <option value="Active">Active</option>
                      <option value="Reversed">Reversed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Term</label>
                    <input
                      type="text"
                      value={editFormData.term}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, term: e.target.value }))}
                      className="form-control"
                      placeholder="e.g., Term 1"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Academic Year</label>
                    <input
                      type="text"
                      value={editFormData.academic_year}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, academic_year: e.target.value }))}
                      className="form-control"
                      placeholder="e.g., 2025"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">
                      Reason <span className="required">*</span>
                    </label>
                    <textarea
                      value={editFormData.reason}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, reason: e.target.value }))}
                      className="form-control"
                      rows="3"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Notes</label>
                    <textarea
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="form-control"
                      rows="2"
                    />
                  </div>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedWaiver(null);
                    }}
                    className="modal-btn modal-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-btn modal-btn-confirm"
                  >
                    Update Waiver
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete/Reverse Waiver Modal */}
      {showDeleteModal && selectedWaiver && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)} style={{ zIndex: 1005 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Reverse Waiver</h3>
              <button className="modal-close-btn" onClick={() => setShowDeleteModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.75rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                  Are you sure you want to reverse this waiver? This action will mark the waiver as reversed.
                </p>
                <div style={{ background: '#f3f4f6', padding: '12px', borderRadius: '4px', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {selectedWaiver.student_name && selectedWaiver.student_surname 
                      ? `${selectedWaiver.student_name} ${selectedWaiver.student_surname}`
                      : selectedWaiver.student_reg_number}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Amount: {formatCurrency(selectedWaiver.waiver_amount)} {selectedWaiver.currency_symbol || ''}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Category: {selectedWaiver.category_name || 'N/A'}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reversal Reason</label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="form-control"
                    rows="3"
                    placeholder="Enter reason for reversing this waiver..."
                  />
                </div>
                <p style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: '8px' }}>
                  This action cannot be undone. The waiver will be marked as reversed.
                </p>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedWaiver(null);
                    setDeleteReason('');
                  }}
                  className="modal-btn modal-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteWaiver}
                  className="modal-btn modal-btn-delete"
                >
                  Reverse Waiver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />
    </>
  );
});

WaiverManagement.displayName = 'WaiverManagement';

export default WaiverManagement;
