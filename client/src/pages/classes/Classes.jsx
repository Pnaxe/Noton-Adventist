import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import {
  faUsers,
  faPlus,
  faSearch,
  faEye,
  faEdit,
  faTrash,
  faSave,
  faTimes,
  faSchool,
  faCalendarAlt,
  faCog,
  faLock,
  faPlay,
  faBook
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';
import AddGradelevelClass from './gradelevel/AddGradelevelClass';

const Classes = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [gradelevelClasses, setGradelevelClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClasses, setTotalClasses] = useState(0);
  const [limit] = useState(25);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddGradelevelClassModal, setShowAddGradelevelClassModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    stream_id: '',
    capacity: '',
    homeroom_teacher_employee_number: ''
  });

  // Toast states
  const [toast, setToast] = useState({ message: null, type: 'success', visible: false });

  // View modal states removed (navigate to page instead)

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalLoading, setEditModalLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    stream_id: '',
    capacity: '',
    homeroom_teacher_employee_number: ''
  });
  const [editFormError, setEditFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Additional data for forms
  const [streams, setStreams] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Class Term Year states (used by modals; main UI for term-year/config/close-term is on separate routes)
  const [classTermYears, setClassTermYears] = useState([]);
  const [classTermYearLoading, setClassTermYearLoading] = useState(false);
  const [showBulkTermYearModal, setShowBulkTermYearModal] = useState(false);
  const [bulkTermYearForm, setBulkTermYearForm] = useState({
    term: '',
    academic_year: '',
    start_date: '',
    end_date: ''
  });

  // Class Configurations states
  const [streamForm, setStreamForm] = useState({ name: '', stage: '' });
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState('');
  const [streamSuccess, setStreamSuccess] = useState('');
  const [editingStreamId, setEditingStreamId] = useState(null);
  const [editStreamForm, setEditStreamForm] = useState({ name: '', stage: '' });
  const [streamToDelete, setStreamToDelete] = useState(null);
  const [isDeletingStream, setIsDeletingStream] = useState(false);
  const [clearStreamsLoading, setClearStreamsLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [subjectForm, setSubjectForm] = useState({ code: '', name: '', syllabus: '' });
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editSubjectForm, setEditSubjectForm] = useState({ code: '', name: '', syllabus: '' });
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [isDeletingSubject, setIsDeletingSubject] = useState(false);

  // Close to Term states
  const [closeTermLoading, setCloseTermLoading] = useState(false);
  const [closeTermError, setCloseTermError] = useState('');
  const [closeTermSuccess, setCloseTermSuccess] = useState('');

  useEffect(() => {
    fetchGradelevelClasses();
    fetchStreams();
    fetchTeachers();
  }, [currentPage, activeSearchTerm]);

  // Note: class view is now a dedicated page, not a modal. Class Term Year, Configurations, Close to Term are separate routes.

  const fetchStreams = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/classes/streams`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        setStreams(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching streams:', err);
    }
  };

  const fetchTeachers = async () => {
    try {
      // Fetch employees with a limit to avoid loading too many
      const response = await axios.get(`${BASE_URL}/employees`, {
        params: {
          limit: 100,
          page: 1
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        setTeachers(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  const fetchGradelevelClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we're searching
      if (activeSearchTerm && activeSearchTerm.trim() !== '') {
        console.log('🔍 Searching for:', activeSearchTerm);
        // Search mode - no pagination
        const response = await axios.get(`${BASE_URL}/classes/gradelevel-classes/search`, {
          params: {
            search: activeSearchTerm.trim()
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = response.data;
        console.log('🔍 Search results:', data);
        setGradelevelClasses(data.data || []);
        setTotalPages(1);
        setTotalClasses(data.data?.length || 0);
      } else {
        console.log('📄 Fetching all classes');
        // Normal fetch mode - get all classes
        const response = await axios.get(`${BASE_URL}/classes/gradelevel-classes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = response.data;
        console.log('📊 Raw response:', data);
        const allClasses = data.data || [];

        // Client-side pagination
        const startIndex = (currentPage - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedClasses = allClasses.slice(startIndex, endIndex);
        const totalPages = Math.ceil(allClasses.length / limit);

        setGradelevelClasses(paginatedClasses);
        setTotalPages(totalPages);
        setTotalClasses(allClasses.length);
      }
    } catch (err) {
      console.error('Error fetching grade-level classes:', err);
      if (err.response) {
        setError(`Error: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`);
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('🔍 Starting search with term:', searchTerm);
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    console.log('🧹 Clearing search');
    setSearchTerm('');
    setActiveSearchTerm('');
    setCurrentPage(1);
  };

  // Modal functions
  const handleOpenModal = () => {
    setShowAddModal(true);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setIsLoading(false);
    setFormError(null);
    setFormData({
      name: '',
      stream_id: '',
      capacity: '',
      homeroom_teacher_employee_number: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      const response = await axios.post(`${BASE_URL}/classes/gradelevel-classes`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await fetchGradelevelClasses();

      const className = formData.name;
      showToast(`Class ${className} has been successfully added!`, 'success');
      handleCloseModal();
    } catch (err) {
      console.error('Error adding class:', err);
      let errorMessage = 'An unexpected error occurred';

      if (err.response) {
        const errorData = err.response.data;
        if (errorData?.error) {
          errorMessage = errorData.error;
        } else {
          errorMessage = errorData?.message || `Server Error (${err.response.status})`;
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred';
      }

      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // View gradelevel class page
  const handleViewClass = (classId) => {
    navigate(`/dashboard/classes/gradelevel-classes/view/${classId}`);
  };

  // Edit modal functions
  const handleEditClass = async (classId) => {
    setShowEditModal(true);
    setEditModalLoading(true);
    setEditFormError(null);
    setEditFormData({
      id: '',
      name: '',
      stream_id: '',
      capacity: '',
      homeroom_teacher_employee_number: ''
    });

    try {
      const response = await axios.get(`${BASE_URL}/classes/gradelevel-classes/${classId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const classData = response.data.data;

      setEditFormData({
        id: classData.id || '',
        name: classData.name || '',
        stream_id: classData.stream_id || '',
        capacity: classData.capacity || '',
        homeroom_teacher_employee_number: classData.homeroom_teacher_employee_number || ''
      });
    } catch (err) {
      console.error('Error fetching class for edit:', err);
      showToast('Failed to load class details for editing', 'error');
      setShowEditModal(false);
    } finally {
      setEditModalLoading(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditFormData({
      id: '',
      name: '',
      stream_id: '',
      capacity: '',
      homeroom_teacher_employee_number: ''
    });
    setEditFormError(null);
    setIsSaving(false);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setEditFormError(null);

    try {
      await axios.put(`${BASE_URL}/classes/gradelevel-classes/${editFormData.id}`, editFormData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await fetchGradelevelClasses();
      handleCloseEditModal();
      showToast(`Class ${editFormData.name} has been successfully updated!`, 'success');
    } catch (err) {
      console.error('Error updating class:', err);
      let errorMessage = 'An unexpected error occurred';

      if (err.response) {
        const errorData = err.response.data;
        if (errorData?.error) {
          errorMessage = errorData.error;
        } else {
          errorMessage = errorData?.message || `Server Error (${err.response.status})`;
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred';
      }

      setEditFormError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const isEditFormValid = () => {
    return (
      editFormData.name &&
      editFormData.stream_id
    );
  };

  // Delete modal functions
  const handleDeleteClick = (classItem) => {
    setClassToDelete(classItem);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setClassToDelete(null);
    setIsDeleting(false);
  };

  const handleConfirmDelete = async () => {
    if (!classToDelete) return;

    setIsDeleting(true);
    try {
      await axios.delete(`${BASE_URL}/classes/gradelevel-classes/${classToDelete.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await fetchGradelevelClasses();
      handleCloseDeleteModal();
      showToast(`Class ${classToDelete.name} has been successfully deleted!`, 'success');
    } catch (err) {
      console.error('Error deleting class:', err);
      let errorMessage = 'Failed to delete class';

      if (err.response) {
        errorMessage = err.response.data?.message || `Server Error (${err.response.status})`;
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      }

      showToast(errorMessage, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toast functions
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
      width: "20",
      height: "20",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
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

  const isFormValid = () => {
    return (
      formData.name &&
      formData.stream_id
    );
  };

  // Class Term Year functions
  const fetchClassTermYears = async () => {
    setClassTermYearLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/classes/class-term-years`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setClassTermYears(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching class term years:', err);
    } finally {
      setClassTermYearLoading(false);
    }
  };

  const handleBulkTermYearSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${BASE_URL}/classes/class-term-years/bulk-populate`, bulkTermYearForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        showToast('Class term years bulk populated successfully!', 'success');
        setShowBulkTermYearModal(false);
        setBulkTermYearForm({ term: '', academic_year: '', start_date: '', end_date: '' });
        fetchClassTermYears();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to bulk populate', 'error');
    }
  };

  // Class Configurations functions
  const fetchSubjects = async () => {
    if (!token) {
      console.warn('Missing auth token while fetching subjects.');
      return;
    }
    try {
      const response = await axios.get(`${BASE_URL}/classes/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setSubjects(response.data.data || []);
      }
      else {
        console.warn('Failed to load subjects:', response.data?.message);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
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
      } else {
        setStreamError(response.data.message || 'Failed to add stream.');
      }
    } catch (err) {
      setStreamError(err.response?.data?.message || 'Failed to add stream.');
    } finally {
      setStreamLoading(false);
    }
  };

  const handleConfirmDeleteSubject = async () => {
    if (!subjectToDelete) return;
    try {
      setIsDeletingSubject(true);
      await axios.delete(`${BASE_URL}/classes/subjects/${subjectToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Subject deleted successfully!', 'success');
      setSubjectToDelete(null);
      fetchSubjects();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete subject', 'error');
    } finally {
      setIsDeletingSubject(false);
    }
  };

  const handleConfirmDeleteStream = async () => {
    if (!streamToDelete) return;
    try {
      setIsDeletingStream(true);
      await axios.delete(`${BASE_URL}/classes/streams/${streamToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Stream deleted successfully!', 'success');
      setStreamToDelete(null);
      fetchStreams();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete stream', 'error');
    } finally {
      setIsDeletingStream(false);
    }
  };

  const handleClearUnusedStreams = async () => {
    if (!window.confirm('Remove all streams that are not used by any class or student? Streams in use will be kept.')) return;
    try {
      setClearStreamsLoading(true);
      const response = await axios.delete(`${BASE_URL}/classes/streams/clear-unused`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        showToast(response.data.message || 'Streams cleared.', 'success');
        fetchStreams();
      } else {
        showToast(response.data.message || 'Failed to clear streams.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to clear streams.', 'error');
    } finally {
      setClearStreamsLoading(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    const code = subjectForm.code.trim();
    const name = subjectForm.name.trim();
    if (!code || !name) {
      showToast('Both code and name are required.', 'error');
      return;
    }
    try {
      setSubjectLoading(true);
      const syllabusValue = (subjectForm.syllabus && String(subjectForm.syllabus).trim()) || null;
      const payload = {
        code: String(code),
        name: String(name),
        syllabus: syllabusValue
      };
      const response = await axios.post(`${BASE_URL}/classes/subjects`, payload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.data.success) {
        showToast('Subject added successfully!', 'success');
        setSubjectForm({ code: '', name: '', syllabus: '' });
        fetchSubjects();
      } else {
        showToast(response.data.message || 'Failed to add subject.', 'error');
      }
    } catch (err) {
      const data = err.response?.data;
      const msg = (data && (data.message || data.error)) || err.message || 'Failed to add subject.';
      showToast(msg, 'error');
      if (err.response?.status === 400 && data) {
        console.warn('Add subject 400:', data);
      }
    } finally {
      setSubjectLoading(false);
    }
  };

  // Close to Term functions
  const handleCloseToTerm = async () => {
    try {
      if (!ensureCloseTermPermission()) {
        return;
      }
      setCloseTermLoading(true);
      setCloseTermError('');
      setCloseTermSuccess('');
      const response = await axios.post(`${BASE_URL}/close-to-term/close-to-term`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        setCloseTermSuccess(`Close to Term completed successfully! ${response.data.data.closed_count} enrollments closed.`);
      } else {
        setCloseTermError(response.data?.message || 'Failed to close term');
      }
    } catch (err) {
      setCloseTermError(err.response?.data?.message || 'Failed to close term');
    } finally {
      setCloseTermLoading(false);
    }
  };

  const ensureCloseTermPermission = () => {
    if (!token) {
      setCloseTermError('Missing authentication. Please log in again.');
      return false;
    }
    return true;
  };

  // Calculate display ranges for pagination
  const displayStart = gradelevelClasses.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalClasses);
  const hasData = gradelevelClasses.length > 0;

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
          <h2 className="report-title">Classes</h2>
          <p className="report-subtitle">Manage grade-level classes and student enrollments.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowAddGradelevelClassModal(true)}
              className="btn-checklist"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Grade Level Class
            </button>
        </div>
      </div>

      {/* Filters Section - match Students page */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left">
          <form onSubmit={handleSearch} className="filter-group">
              <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by class name or stream name..."
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

      {/* Table Container - match Students page */}
      <div className="report-content-container ecl-table-container" style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'auto',
            minHeight: 0,
            padding: 0,
            height: '100%'
          }}>
            {loading && gradelevelClasses.length === 0 ? (
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
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading classes...</p>
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
                    <th style={{ padding: '6px 10px' }}>CLASS NAME</th>
                    <th style={{ padding: '6px 10px' }}>STREAM</th>
                    <th style={{ padding: '6px 10px' }}>STAGE</th>
                    <th style={{ padding: '6px 10px' }}>TEACHER</th>
                    <th style={{ padding: '6px 10px' }}>CAPACITY</th>
                    <th style={{ padding: '6px 10px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {gradelevelClasses.map((classItem, index) => (
                    <tr
                      key={classItem.id}
                      style={{
                        height: '32px',
                        backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                      }}
                    >
                      <td style={{ padding: '4px 10px' }}>
                        {classItem.name}
                      </td>
                      <td style={{ padding: '4px 10px' }}>
                        {classItem.stream_name || 'N/A'}
                      </td>
                      <td style={{ padding: '4px 10px' }}>
                        {classItem.stream_stage || 'N/A'}
                      </td>
                      <td style={{ padding: '4px 10px' }}>
                        {classItem.teacher_name || 'Not Assigned'}
                      </td>
                      <td style={{ padding: '4px 10px' }}>
                        {classItem.capacity || 'Unlimited'}
                      </td>
                      <td style={{ padding: '4px 10px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleViewClass(classItem.id)}
                            style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            title="View"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          <button
                            onClick={() => handleEditClass(classItem.id)}
                            style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            title="Edit"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(classItem)}
                            style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            title="Delete"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {/* Empty placeholder rows to always show 25 rows */}
                  {Array.from({ length: Math.max(0, 25 - gradelevelClasses.length) }).map((_, index) => (
                    <tr
                      key={`empty-${index}`}
                      style={{
                        height: '32px',
                        backgroundColor: (gradelevelClasses.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
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
                </tbody>
              </table>
            )}

            </div>

      {/* Pagination Footer */}
        <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
          <div className="table-footer-left">
            Showing {displayStart} to {displayEnd} of {totalClasses || 0} results.
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

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px', minHeight: isLoading ? '400px' : 'auto' }}
          >
            {isLoading ? (
              // Loading State
              <>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ height: '20px', width: '200px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ width: '18px', height: '18px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
                <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: '1', minHeight: '300px' }}>
                  <div className="loading-spinner"></div>
                  <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading...</p>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <div style={{ height: '32px', width: '80px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ height: '32px', width: '100px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
              </>
            ) : (
              // Content State
              <>
                <div className="modal-header">
                  <h3 className="modal-title">Add Class</h3>
                  <button className="modal-close-btn" onClick={handleCloseModal}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div className="modal-body">
                  {formError && (
                    <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                      {formError}
                    </div>
                  )}

                  <form onSubmit={handleSave} className="modal-form">
                    <div className="form-group">
                      <label className="form-label">
                        Class Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        placeholder="Enter class name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Stream <span className="required">*</span>
                      </label>
                      <select
                        name="stream_id"
                        className="form-control"
                        value={formData.stream_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select stream</option>
                        {streams.map((stream) => (
                          <option key={stream.id} value={stream.id}>
                            {stream.name} - {stream.stage}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Capacity</label>
                      <input
                        type="number"
                        name="capacity"
                        className="form-control"
                        placeholder="Enter capacity (optional)"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        min="1"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Homeroom Teacher</label>
                      <select
                        name="homeroom_teacher_employee_number"
                        className="form-control"
                        value={formData.homeroom_teacher_employee_number}
                        onChange={handleInputChange}
                      >
                        <option value="">Select teacher (optional)</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.employee_id}>
                            {teacher.full_name || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </form>
                </div>

                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button
                    className="modal-btn modal-btn-confirm"
                    onClick={handleSave}
                    disabled={!isFormValid() || isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Class'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px', minHeight: editModalLoading ? '400px' : 'auto' }}
          >
            {editModalLoading ? (
              // Loading State
              <>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ height: '20px', width: '200px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ width: '18px', height: '18px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
                <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: '1', minHeight: '300px' }}>
                  <div className="loading-spinner"></div>
                  <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading class details...</p>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <div style={{ height: '32px', width: '80px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ height: '32px', width: '100px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
              </>
            ) : (
              // Content State
              <>
                <div className="modal-header">
                  <h3 className="modal-title">Edit Class</h3>
                  <button className="modal-close-btn" onClick={handleCloseEditModal}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div className="modal-body">
                  {editFormError && (
                    <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                      {editFormError}
                    </div>
                  )}

                  <form onSubmit={handleUpdateClass} className="modal-form">
                    <div className="form-group">
                      <label className="form-label">
                        Class Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        placeholder="Enter class name"
                        value={editFormData.name}
                        onChange={handleEditInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Stream <span className="required">*</span>
                      </label>
                      <select
                        name="stream_id"
                        className="form-control"
                        value={editFormData.stream_id}
                        onChange={handleEditInputChange}
                        required
                      >
                        <option value="">Select stream</option>
                        {streams.map((stream) => (
                          <option key={stream.id} value={stream.id}>
                            {stream.name} - {stream.stage}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Capacity</label>
                      <input
                        type="number"
                        name="capacity"
                        className="form-control"
                        placeholder="Enter capacity (optional)"
                        value={editFormData.capacity}
                        onChange={handleEditInputChange}
                        min="1"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Homeroom Teacher</label>
                      <select
                        name="homeroom_teacher_employee_number"
                        className="form-control"
                        value={editFormData.homeroom_teacher_employee_number}
                        onChange={handleEditInputChange}
                      >
                        <option value="">Select teacher (optional)</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.employee_id}>
                            {teacher.full_name || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </form>
                </div>

                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={handleCloseEditModal}>
                    Cancel
                  </button>
                  <button
                    className="modal-btn modal-btn-confirm"
                    onClick={handleUpdateClass}
                    disabled={!isEditFormValid() || isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Update Class'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && classToDelete && (
        <div className="modal-overlay" onClick={handleCloseDeleteModal}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Confirm Delete</h3>
              <button className="modal-close-btn" onClick={handleCloseDeleteModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Are you sure you want to delete this class?
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div style={{
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '4px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Class Information
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Name:</strong> {classToDelete.name}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Stream:</strong> {classToDelete.stream_name || 'N/A'}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-delete"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Class'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Stream Modal */}
      {streamToDelete && (
        <div className="modal-overlay" onClick={() => !isDeletingStream && setStreamToDelete(null)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Delete Stream</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isDeletingStream && setStreamToDelete(null)}
                disabled={isDeletingStream}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FontAwesomeIcon icon={faTrash} style={{ color: '#dc2626', fontSize: '1rem' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Are you sure you want to delete this stream?
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    This action cannot be undone. The stream must not be used by any class.
                  </p>
                </div>
              </div>
              <div style={{
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '4px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Stream
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>{streamToDelete.name}</strong> ({streamToDelete.stage})
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={() => setStreamToDelete(null)}
                disabled={isDeletingStream}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn modal-btn-delete"
                onClick={handleConfirmDeleteStream}
                disabled={isDeletingStream}
              >
                {isDeletingStream ? 'Deleting...' : 'Delete Stream'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Subject Modal */}
      {subjectToDelete && (
        <div className="modal-overlay" onClick={() => !isDeletingSubject && setSubjectToDelete(null)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Delete Subject</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isDeletingSubject && setSubjectToDelete(null)}
                disabled={isDeletingSubject}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FontAwesomeIcon icon={faTrash} style={{ color: '#dc2626', fontSize: '1rem' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Are you sure you want to delete this subject?
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    This action cannot be undone. The subject must not be used by any subject class.
                  </p>
                </div>
              </div>
              <div style={{
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '4px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Subject
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>{subjectToDelete.name}</strong> ({subjectToDelete.code})
                </div>
                {subjectToDelete.syllabus && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Syllabus: {subjectToDelete.syllabus}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={() => setSubjectToDelete(null)}
                disabled={isDeletingSubject}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn modal-btn-delete"
                onClick={handleConfirmDeleteSubject}
                disabled={isDeletingSubject}
              >
                {isDeletingSubject ? 'Deleting...' : 'Delete Subject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Term Year Modal */}
      {showBulkTermYearModal && (
        <div className="modal-overlay" onClick={() => setShowBulkTermYearModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Bulk Populate Class Term Year</h3>
              <button className="modal-close-btn" onClick={() => setShowBulkTermYearModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleBulkTermYearSubmit} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Term <span className="required">*</span></label>
                  <select
                    name="term"
                    value={bulkTermYearForm.term}
                    onChange={(e) => setBulkTermYearForm({ ...bulkTermYearForm, term: e.target.value })}
                    className="form-control"
                    required
                  >
                    <option value="">Select term</option>
                    <option value="1">Term 1</option>
                    <option value="2">Term 2</option>
                    <option value="3">Term 3</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Academic Year <span className="required">*</span></label>
                  <input
                    type="text"
                    name="academic_year"
                    value={bulkTermYearForm.academic_year}
                    onChange={(e) => setBulkTermYearForm({ ...bulkTermYearForm, academic_year: e.target.value })}
                    className="form-control"
                    placeholder="e.g., 2024"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Start Date <span className="required">*</span></label>
                  <input
                    type="date"
                    name="start_date"
                    value={bulkTermYearForm.start_date}
                    onChange={(e) => setBulkTermYearForm({ ...bulkTermYearForm, start_date: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Date <span className="required">*</span></label>
                  <input
                    type="date"
                    name="end_date"
                    value={bulkTermYearForm.end_date}
                    onChange={(e) => setBulkTermYearForm({ ...bulkTermYearForm, end_date: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={() => setShowBulkTermYearModal(false)}>
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-confirm"
                onClick={handleBulkTermYearSubmit}
              >
                Bulk Populate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Gradelevel Class Modal */}
      {showAddGradelevelClassModal && (
        <div className="modal-overlay" onClick={() => setShowAddGradelevelClassModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Add Grade Level Class</h3>
              <button className="modal-close-btn" onClick={() => setShowAddGradelevelClassModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <AddGradelevelClass onClose={() => {
                setShowAddGradelevelClassModal(false);
                fetchGradelevelClasses(); // Refresh the classes list
              }} />
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

export default Classes;
