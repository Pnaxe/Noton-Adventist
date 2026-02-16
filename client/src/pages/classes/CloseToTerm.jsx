import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faPlay,
  faLock,
  faDoorOpen
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';

const CloseToTerm = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showOpenFormModal, setShowOpenFormModal] = useState(false);

  const [formData, setFormData] = useState({
    new_term: '',
    new_academic_year: ''
  });

  const [viewMode, setViewMode] = useState('close'); // 'close' | 'open'
  const [toast, setToast] = useState({ message: null, type: 'success', visible: false });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type, visible: true });
    if (duration > 0) {
      setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
        setTimeout(() => setToast({ message: null, type: 'success', visible: false }), 300);
      }, duration);
    }
  };

  const getToastIcon = (type) => {
    const iconProps = { width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' };
    if (type === 'success') return <svg {...iconProps}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
    if (type === 'error') return <svg {...iconProps}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
    return null;
  };

  const getToastBackgroundColor = (type) => {
    switch (type) { case 'success': return '#10b981'; case 'error': return '#ef4444'; default: return '#10b981'; }
  };

  const handleCloseToTerm = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(`${BASE_URL}/close-to-term/close-to-term`, {}, { headers: authHeaders });
      const msg = `Close Term completed successfully! ${response.data.data?.closed_count ?? 0} enrollments closed.`;
      setSuccess(msg);
      showToast(msg, 'success');
      setShowConfirmation(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to close term';
      setError(msg);
      showToast(msg, 'error');
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenToTerm = async () => {
    if (!formData.new_term?.trim() || !formData.new_academic_year?.trim()) {
      setError('Please enter both term and academic year');
      showToast('Please enter both term and academic year', 'error');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(`${BASE_URL}/close-to-term/open-to-term`, formData, { headers: authHeaders });
      const msg = `Open to Term completed successfully! ${response.data.data?.classes_updated ?? 0} classes updated.`;
      setSuccess(msg);
      showToast(msg, 'success');
      setShowConfirmation(false);
      setShowOpenFormModal(false);
      setFormData({ new_term: '', new_academic_year: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to open term';
      setError(msg);
      showToast(msg, 'error');
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleRunCloseTerm = () => {
    setError(null);
    setViewMode('close');
    setShowConfirmation(true);
  };

  const handleRunOpenTerm = () => {
    setError(null);
    setViewMode('open');
    setShowOpenFormModal(true);
  };

  const handleOpenFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.new_term?.trim() || !formData.new_academic_year?.trim()) {
      setError('Please enter both term and academic year');
      return;
    }
    setShowOpenFormModal(false);
    setShowConfirmation(true);
  };

  const handleExecuteAction = () => {
    if (viewMode === 'close') handleCloseToTerm();
    else handleOpenToTerm();
  };

  const actions = [
    {
      id: 'close',
      name: 'Close Term',
      description: 'De-enroll all students from the current term. No balance changes will be made.',
      icon: faLock,
      onRun: handleRunCloseTerm
    },
    {
      id: 'open',
      name: 'Open to Term',
      description: 'Set the next term and academic year for all classes.',
      icon: faDoorOpen,
      onRun: handleRunOpenTerm
    }
  ];

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
      {/* Report Header */}
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          <h2 className="report-title">Close Term</h2>
          <p className="report-subtitle">Close current term or open to the next term.</p>
        </div>
      </div>

      {/* Error Display - same as Class Configurations */}
      {error && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', flexShrink: 0 }}>
          {error}
        </div>
      )}

      {/* Action cards */}
      <div
        className="report-content-container"
        style={{
          flex: 1,
          overflow: 'auto',
          minHeight: 0,
          padding: '24px 30px'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
            maxWidth: '720px'
          }}
        >
          {actions.map((action) => (
            <div
              key={action.id}
              style={{
                background: 'var(--card-bg, #fff)',
                border: '1px solid var(--border-color, #e5e7eb)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'var(--sidebar-bg)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem'
                  }}
                >
                  <FontAwesomeIcon icon={action.icon} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {action.name}
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {action.description}
              </p>
              <button
                type="button"
                onClick={action.onRun}
                disabled={loading}
                className="btn-checklist"
                style={{ alignSelf: 'flex-start', marginTop: '4px' }}
              >
                <FontAwesomeIcon icon={faPlay} style={{ marginRight: '6px' }} />
                Run
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Open to Term - Form Modal (like Add Stream / Add Subject) */}
      {showOpenFormModal && (
        <div className="modal-overlay" onClick={() => setShowOpenFormModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Open to Term</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowOpenFormModal(false)}
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Enter the next term and academic year. This will update all classes to the new term/year.
              </p>
              <form onSubmit={handleOpenFormSubmit} className="modal-form">
                <div className="form-group">
                  <label className="form-label">New Term <span className="required">*</span></label>
                  <input
                    type="text"
                    name="new_term"
                    value={formData.new_term}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="e.g., Term 1, Term 2, Term 3"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New Academic Year <span className="required">*</span></label>
                  <input
                    type="text"
                    name="new_academic_year"
                    value={formData.new_academic_year}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="e.g., 2025, 2026"
                  />
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                  <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowOpenFormModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn modal-btn-confirm">
                    Continue
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="modal-overlay" onClick={() => !loading && handleCancelConfirmation()}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                Confirm {viewMode === 'close' ? 'Close Term' : 'Open to Term'}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !loading && handleCancelConfirmation()}
                aria-label="Close"
                disabled={loading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  padding: '12px 16px',
                  background: '#fffbeb',
                  border: '1px solid #fcd34d',
                  borderRadius: '6px',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#d97706', fontSize: '0.875rem' }} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#92400e' }}>Warning</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#92400e', margin: 0, lineHeight: 1.5 }}>
                  {viewMode === 'close' ? (
                    <>
                      Are you sure you want to close all active enrollments? This will de-enroll all students from both grade-level and subject classes. Student balances will not be affected.
                    </>
                  ) : (
                    <>
                      Are you sure you want to set all classes to <strong>{formData.new_term} {formData.new_academic_year}</strong>? This will update the class term year for all classes.
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={handleCancelConfirmation}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn modal-btn-confirm"
                onClick={handleExecuteAction}
                disabled={loading}
              >
                {loading ? 'Processing...' : `Yes, ${viewMode === 'close' ? 'Close Term' : 'Open to Term'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast - top right */}
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

export default CloseToTerm;
