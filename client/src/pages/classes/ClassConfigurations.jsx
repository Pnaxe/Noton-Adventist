import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faBook,
  faEdit,
  faTrash,
  faTimes,
  faSave,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const ClassConfigurations = () => {
  const { token } = useAuth();

  const [viewMode, setViewMode] = useState('streams'); // 'streams' | 'subjects'
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(25);

  const [streamForm, setStreamForm] = useState({ name: '', stage: '' });
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState('');
  const [streamSuccess, setStreamSuccess] = useState('');
  const [streams, setStreams] = useState([]);
  const [streamsLoading, setStreamsLoading] = useState(false);
  const [streamsError, setStreamsError] = useState('');
  const [editingStreamId, setEditingStreamId] = useState(null);
  const [editStreamForm, setEditStreamForm] = useState({ name: '', stage: '' });
  const [updateStreamLoading, setUpdateStreamLoading] = useState(false);
  const [deleteStreamLoading, setDeleteStreamLoading] = useState(null);

  const [subjectForm, setSubjectForm] = useState({ code: '', name: '', syllabus: '' });
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [subjectError, setSubjectError] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editSubjectForm, setEditSubjectForm] = useState({ code: '', name: '', syllabus: '' });
  const [updateSubjectLoading, setUpdateSubjectLoading] = useState(false);
  const [deleteSubjectLoading, setDeleteSubjectLoading] = useState(null);

  const [showAddStreamModal, setShowAddStreamModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [streamToDelete, setStreamToDelete] = useState(null);
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  const [toast, setToast] = useState({ message: null, type: 'success', visible: false });

  useEffect(() => {
    if (!token) return;
    fetchStreams();
    fetchSubjects();
  }, [token]);

  const fetchStreams = async () => {
    setStreamsLoading(true);
    setStreamsError('');
    try {
      const response = await axios.get(`${BASE_URL}/classes/streams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) setStreams(response.data.data || []);
      else setStreamsError('Failed to load streams.');
    } catch (err) {
      setStreamsError(err.response?.data?.message || 'Failed to load streams.');
    } finally {
      setStreamsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    setSubjectsLoading(true);
    setSubjectsError('');
    try {
      const response = await axios.get(`${BASE_URL}/classes/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) setSubjects(response.data.data || []);
      else setSubjectsError('Failed to load subjects.');
    } catch (err) {
      setSubjectsError(err.response?.data?.message || 'Failed to load subjects.');
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleStreamInputChange = (e) => {
    const { name, value } = e.target;
    setStreamForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddStream = async (e) => {
    e.preventDefault();
    setStreamError('');
    setStreamSuccess('');
    if (!streamForm.name.trim() || !streamForm.stage.trim()) {
      setStreamError('Both name and stage are required.');
      return;
    }
    try {
      setStreamLoading(true);
      const response = await axios.post(`${BASE_URL}/classes/streams`, streamForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStreamSuccess('Stream added successfully!');
        setStreamForm({ name: '', stage: '' });
        fetchStreams();
        setShowAddStreamModal(false);
        showToast('Stream added successfully!', 'success');
      } else {
        setStreamError(response.data.message || 'Failed to add stream.');
        showToast(response.data.message || 'Failed to add stream.', 'error');
      }
    } catch (err) {
      setStreamError(err.response?.data?.message || 'Failed to add stream.');
      showToast(err.response?.data?.message || 'Failed to add stream.', 'error');
    } finally {
      setStreamLoading(false);
    }
  };

  const handleOpenEditStream = (stream) => {
    setEditingStreamId(stream.id);
    setEditStreamForm({ name: stream.name, stage: stream.stage });
  };

  const handleCloseEditStreamModal = () => {
    setEditingStreamId(null);
    setEditStreamForm({ name: '', stage: '' });
  };

  const handleUpdateStream = async (streamId) => {
    if (!editStreamForm.name.trim() || !editStreamForm.stage.trim()) {
      setStreamsError('Both name and stage are required.');
      return;
    }
    try {
      setUpdateStreamLoading(true);
      setStreamsError('');
      const response = await axios.put(`${BASE_URL}/classes/streams/${streamId}`, editStreamForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        handleCloseEditStreamModal();
        fetchStreams();
        showToast('Stream updated successfully!', 'success');
      } else {
        setStreamsError(response.data.message || 'Failed to update stream.');
        showToast(response.data.message || 'Failed to update stream.', 'error');
      }
    } catch (err) {
      setStreamsError(err.response?.data?.message || 'Failed to update stream.');
      showToast(err.response?.data?.message || 'Failed to update stream.', 'error');
    } finally {
      setUpdateStreamLoading(false);
    }
  };

  const handleDeleteStream = async (streamId) => {
    try {
      setDeleteStreamLoading(streamId);
      setStreamsError('');
      const response = await axios.delete(`${BASE_URL}/classes/streams/${streamId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        fetchStreams();
        setStreamToDelete(null);
        showToast('Stream deleted successfully!', 'success');
      } else {
        setStreamsError(response.data.message || 'Failed to delete stream.');
        showToast(response.data.message || 'Failed to delete stream.', 'error');
      }
    } catch (err) {
      setStreamsError(err.response?.data?.message || 'Failed to delete stream.');
      showToast(err.response?.data?.message || 'Failed to delete stream.', 'error');
    } finally {
      setDeleteStreamLoading(null);
    }
  };

  const handleSubjectInputChange = (e) => {
    const { name, value } = e.target;
    setSubjectForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setSubjectError('');
    if (!subjectForm.code.trim() || !subjectForm.name.trim()) {
      setSubjectError('Both code and name are required.');
      return;
    }
    try {
      setSubjectLoading(true);
      const response = await axios.post(`${BASE_URL}/classes/subjects`, subjectForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setSubjectForm({ code: '', name: '', syllabus: '' });
        fetchSubjects();
        setShowAddSubjectModal(false);
        showToast('Subject added successfully!', 'success');
      } else {
        setSubjectError(response.data.message || 'Failed to add subject.');
        showToast(response.data.message || 'Failed to add subject.', 'error');
      }
    } catch (err) {
      setSubjectError(err.response?.data?.message || 'Failed to add subject.');
      showToast(err.response?.data?.message || 'Failed to add subject.', 'error');
    } finally {
      setSubjectLoading(false);
    }
  };

  const generateSubjectCode = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    setSubjectForm((prev) => ({ ...prev, code: `SUBJ${random}` }));
  };

  const handleOpenEditSubject = (subject) => {
    setEditingSubjectId(subject.id);
    setEditSubjectForm({ code: subject.code, name: subject.name, syllabus: subject.syllabus || '' });
  };

  const handleCloseEditSubjectModal = () => {
    setEditingSubjectId(null);
    setEditSubjectForm({ code: '', name: '', syllabus: '' });
  };

  const handleUpdateSubject = async (subjectId) => {
    if (!editSubjectForm.code.trim() || !editSubjectForm.name.trim()) {
      setSubjectsError('Both code and name are required.');
      return;
    }
    try {
      setUpdateSubjectLoading(true);
      setSubjectsError('');
      const response = await axios.put(`${BASE_URL}/classes/subjects/${subjectId}`, editSubjectForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        handleCloseEditSubjectModal();
        fetchSubjects();
        showToast('Subject updated successfully!', 'success');
      } else {
        setSubjectsError(response.data.message || 'Failed to update subject.');
        showToast(response.data.message || 'Failed to update subject.', 'error');
      }
    } catch (err) {
      setSubjectsError(err.response?.data?.message || 'Failed to update subject.');
      showToast(err.response?.data?.message || 'Failed to update subject.', 'error');
    } finally {
      setUpdateSubjectLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    try {
      setDeleteSubjectLoading(subjectId);
      setSubjectsError('');
      const response = await axios.delete(`${BASE_URL}/classes/subjects/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        fetchSubjects();
        setSubjectToDelete(null);
        showToast('Subject deleted successfully!', 'success');
      } else {
        setSubjectsError(response.data.message || 'Failed to delete subject.');
        showToast(response.data.message || 'Failed to delete subject.', 'error');
      }
    } catch (err) {
      setSubjectsError(err.response?.data?.message || 'Failed to delete subject.');
      showToast(err.response?.data?.message || 'Failed to delete subject.', 'error');
    } finally {
      setDeleteSubjectLoading(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
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

  const errorDisplay = streamsError || subjectsError;

  const filteredStreams = activeSearchTerm.trim()
    ? streams.filter((s) => {
        const q = activeSearchTerm.trim().toLowerCase();
        return (s.name || '').toLowerCase().includes(q) || (s.stage || '').toLowerCase().includes(q);
      })
    : streams;

  const filteredSubjects = activeSearchTerm.trim()
    ? subjects.filter((s) => {
        const q = activeSearchTerm.trim().toLowerCase();
        return (
          (s.code || '').toLowerCase().includes(q) ||
          (s.name || '').toLowerCase().includes(q) ||
          (s.syllabus || '').toLowerCase().includes(q)
        );
      })
    : subjects;

  const list = viewMode === 'streams' ? filteredStreams : filteredSubjects;
  const totalFiltered = list.length;
  const usePagination = !activeSearchTerm.trim();
  const totalPages = usePagination ? Math.max(1, Math.ceil(totalFiltered / limit)) : 1;
  const startIndex = usePagination ? (currentPage - 1) * limit : 0;
  const endIndex = usePagination ? startIndex + limit : totalFiltered;
  const paginatedList = list.slice(startIndex, endIndex);

  const displayStart = totalFiltered > 0 ? startIndex + 1 : 0;
  const displayEnd = Math.min(endIndex, totalFiltered);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearchTerm, viewMode]);

  const loading = viewMode === 'streams' ? streamsLoading : subjectsLoading;
  const listLength = viewMode === 'streams' ? streams.length : subjects.length;

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
          <h2 className="report-title">Class Configurations</h2>
          <p className="report-subtitle">Manage streams and subjects for class setup.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button type="button" onClick={() => setShowAddStreamModal(true)} className="btn-checklist">
            <FontAwesomeIcon icon={faUsers} />
            Add Stream
          </button>
          <button type="button" onClick={() => setShowAddSubjectModal(true)} className="btn-checklist">
            <FontAwesomeIcon icon={faBook} />
            Add Subject
          </button>
        </div>
      </div>

      {/* Filters Section - match Classes page */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} className="filter-group">
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by stream name, stage, subject code or name..."
                className="filter-input search-input"
              />
              {searchTerm && (
                <button
                  type="button"
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
          <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="filter-label" style={{ marginRight: '4px', fontSize: '0.75rem' }}>View:</span>
            <button
              type="button"
              onClick={() => setViewMode('streams')}
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 500,
                border: `1px solid ${viewMode === 'streams' ? '#2563eb' : 'var(--border-color)'}`,
                borderRadius: '4px',
                background: viewMode === 'streams' ? '#2563eb' : 'transparent',
                color: viewMode === 'streams' ? 'white' : 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              Streams
            </button>
            <button
              type="button"
              onClick={() => setViewMode('subjects')}
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 500,
                border: `1px solid ${viewMode === 'subjects' ? '#2563eb' : 'var(--border-color)'}`,
                borderRadius: '4px',
                background: viewMode === 'subjects' ? '#2563eb' : 'transparent',
                color: viewMode === 'subjects' ? 'white' : 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              Subjects
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {errorDisplay && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', flexShrink: 0 }}>
          {errorDisplay}
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
        {loading && listLength === 0 ? (
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
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Loading {viewMode}...
            </p>
          </div>
        ) : viewMode === 'streams' ? (
          <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--sidebar-bg)' }}>
              <tr>
                <th style={{ padding: '6px 10px' }}>STREAM NAME</th>
                <th style={{ padding: '6px 10px' }}>STAGE</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.map((stream, index) => (
                <tr
                  key={stream.id}
                  style={{
                    height: '32px',
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>{stream.name}</td>
                  <td style={{ padding: '4px 10px' }}>{stream.stage}</td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditStream(stream)}
                        style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setStreamToDelete(stream)}
                        disabled={deleteStreamLoading === stream.id}
                        style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 25 - paginatedList.length) }).map((_, index) => (
                <tr
                  key={`empty-${index}`}
                  style={{
                    height: '32px',
                    backgroundColor: (paginatedList.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--sidebar-bg)' }}>
              <tr>
                <th style={{ padding: '6px 10px' }}>CODE</th>
                <th style={{ padding: '6px 10px' }}>SUBJECT NAME</th>
                <th style={{ padding: '6px 10px' }}>SYLLABUS</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.map((subject, index) => (
                <tr
                  key={subject.id}
                  style={{
                    height: '32px',
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px', fontFamily: 'monospace' }}>{subject.code}</td>
                  <td style={{ padding: '4px 10px' }}>{subject.name}</td>
                  <td style={{ padding: '4px 10px' }}>{subject.syllabus || '-'}</td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditSubject(subject)}
                        style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubjectToDelete(subject)}
                        disabled={deleteSubjectLoading === subject.id}
                        style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 25 - paginatedList.length) }).map((_, index) => (
                <tr
                  key={`empty-${index}`}
                  style={{
                    height: '32px',
                    backgroundColor: (paginatedList.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
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
                type="button"
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
                type="button"
                className="pagination-btn"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
          {!activeSearchTerm && totalPages <= 1 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>All data displayed</div>
          )}
        </div>
      </div>

      {/* Add Stream Modal */}
      {showAddStreamModal && (
        <div className="modal-overlay" onClick={() => setShowAddStreamModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Stream</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setShowAddStreamModal(false);
                  setStreamForm({ name: '', stage: '' });
                  setStreamError('');
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
              {streamError && (
                <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                  {streamError}
                </div>
              )}
              {streamSuccess && (
                <div style={{ padding: '10px', background: '#d1fae5', color: '#065f46', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                  {streamSuccess}
                </div>
              )}
              <form onSubmit={handleAddStream} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Stream Name <span className="required">*</span></label>
            <input
              type="text"
              name="name"
              value={streamForm.name}
              onChange={handleStreamInputChange}
                    className="form-control"
                    placeholder="e.g., Grade 1, Form 2"
              required
            />
          </div>
                <div className="form-group">
                  <label className="form-label">Stage <span className="required">*</span></label>
            <input
              type="text"
              name="stage"
              value={streamForm.stage}
              onChange={handleStreamInputChange}
                    className="form-control"
                    placeholder="e.g., Primary, Secondary"
              required
            />
          </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                  <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowAddStreamModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn modal-btn-confirm" disabled={streamLoading}>
              {streamLoading ? 'Adding...' : 'Add Stream'}
            </button>
          </div>
        </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="modal-overlay" onClick={() => setShowAddSubjectModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Subject</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setShowAddSubjectModal(false);
                  setSubjectForm({ code: '', name: '', syllabus: '' });
                  setSubjectError('');
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
              {subjectError && (
                <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                  {subjectError}
      </div>
              )}
              <form onSubmit={handleAddSubject} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Subject Code <span className="required">*</span></label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                name="code"
                value={subjectForm.code}
                onChange={handleSubjectInputChange}
                      className="form-control"
                placeholder="e.g., ENG101"
                required
              />
                    <button type="button" onClick={generateSubjectCode} className="modal-btn modal-btn-cancel" style={{ flexShrink: 0 }}>
                Auto
              </button>
            </div>
          </div>
                <div className="form-group">
                  <label className="form-label">Subject Name <span className="required">*</span></label>
            <input
              type="text"
              name="name"
              value={subjectForm.name}
              onChange={handleSubjectInputChange}
                    className="form-control"
              placeholder="e.g., English Language"
              required
            />
          </div>
                <div className="form-group">
                  <label className="form-label">Syllabus</label>
            <input
              type="text"
              name="syllabus"
              value={subjectForm.syllabus}
              onChange={handleSubjectInputChange}
                    className="form-control"
              placeholder="e.g., ZIMSEC, Cambridge"
            />
          </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                  <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowAddSubjectModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn modal-btn-confirm" disabled={subjectLoading}>
              {subjectLoading ? 'Adding...' : 'Add Subject'}
            </button>
          </div>
        </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stream Modal */}
      {editingStreamId !== null && (
        <div className="modal-overlay" onClick={handleCloseEditStreamModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Stream</h3>
              <button type="button" className="modal-close-btn" onClick={handleCloseEditStreamModal} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
      </div>
            <div className="modal-body">
        {streamsError && (
                <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                  {streamsError}
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateStream(editingStreamId);
                }}
                className="modal-form"
              >
                <div className="form-group">
                  <label className="form-label">Stream Name <span className="required">*</span></label>
                          <input
                            type="text"
                            value={editStreamForm.name}
                    onChange={(e) => setEditStreamForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="form-control"
                    placeholder="e.g., Grade 1, Form 2"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stage <span className="required">*</span></label>
                          <input
                            type="text"
                            value={editStreamForm.stage}
                    onChange={(e) => setEditStreamForm((prev) => ({ ...prev, stage: e.target.value }))}
                    className="form-control"
                    placeholder="e.g., Primary, Secondary"
                    required
                  />
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                  <button type="button" className="modal-btn modal-btn-cancel" onClick={handleCloseEditStreamModal}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn modal-btn-confirm" disabled={updateStreamLoading}>
                    {updateStreamLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubjectId !== null && (
        <div className="modal-overlay" onClick={handleCloseEditSubjectModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Subject</h3>
              <button type="button" className="modal-close-btn" onClick={handleCloseEditSubjectModal} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {subjectsError && (
                <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                  {subjectsError}
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateSubject(editingSubjectId);
                }}
                className="modal-form"
              >
                <div className="form-group">
                  <label className="form-label">Subject Code <span className="required">*</span></label>
                  <input
                    type="text"
                    value={editSubjectForm.code}
                    onChange={(e) => setEditSubjectForm((prev) => ({ ...prev, code: e.target.value }))}
                    className="form-control"
                    placeholder="e.g., ENG101"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject Name <span className="required">*</span></label>
                  <input
                    type="text"
                    value={editSubjectForm.name}
                    onChange={(e) => setEditSubjectForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="form-control"
                    placeholder="e.g., English Language"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Syllabus</label>
                  <input
                    type="text"
                    value={editSubjectForm.syllabus || ''}
                    onChange={(e) => setEditSubjectForm((prev) => ({ ...prev, syllabus: e.target.value }))}
                    className="form-control"
                    placeholder="e.g., ZIMSEC, Cambridge"
                  />
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                  <button type="button" className="modal-btn modal-btn-cancel" onClick={handleCloseEditSubjectModal}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn modal-btn-confirm" disabled={updateSubjectLoading}>
                    {updateSubjectLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Stream Confirmation Modal */}
      {streamToDelete && (
        <div className="modal-overlay" onClick={() => !deleteStreamLoading && setStreamToDelete(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Stream</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !deleteStreamLoading && setStreamToDelete(null)}
                aria-label="Close"
                disabled={deleteStreamLoading === streamToDelete.id}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
                Are you sure you want to delete the stream <strong>{streamToDelete.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                            <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={() => !deleteStreamLoading && setStreamToDelete(null)}
                disabled={deleteStreamLoading === streamToDelete.id}
              >
                Cancel
                            </button>
                            <button
                type="button"
                className="modal-btn modal-btn-delete"
                onClick={() => handleDeleteStream(streamToDelete.id)}
                disabled={deleteStreamLoading === streamToDelete.id}
              >
                {deleteStreamLoading === streamToDelete.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Subject Confirmation Modal */}
      {subjectToDelete && (
        <div className="modal-overlay" onClick={() => !deleteSubjectLoading && setSubjectToDelete(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Subject</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !deleteSubjectLoading && setSubjectToDelete(null)}
                aria-label="Close"
                disabled={deleteSubjectLoading === subjectToDelete.id}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                            </button>
                          </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
                Are you sure you want to delete the subject <strong>{subjectToDelete.name}</strong> ({subjectToDelete.code})? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                            <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={() => !deleteSubjectLoading && setSubjectToDelete(null)}
                disabled={deleteSubjectLoading === subjectToDelete.id}
              >
                Cancel
                            </button>
                            <button
                type="button"
                className="modal-btn modal-btn-delete"
                onClick={() => handleDeleteSubject(subjectToDelete.id)}
                disabled={deleteSubjectLoading === subjectToDelete.id}
              >
                {deleteSubjectLoading === subjectToDelete.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
          </div>
          </div>
        )}

      {/* Toast - top right success/error popup */}
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

export default ClassConfigurations;
