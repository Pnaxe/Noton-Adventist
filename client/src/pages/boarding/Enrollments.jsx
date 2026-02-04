import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faEdit, faTrash, faSearch, faSignInAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const Enrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEnrollments, setTotalEnrollments] = useState(0);
  const [limit] = useState(25);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    student_reg_number: '',
    hostel_id: '',
    room_id: '',
    academic_year: new Date().getFullYear().toString(),
    term: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Student search in modal
  const [modalStudentSearchTerm, setModalStudentSearchTerm] = useState('');
  const [modalStudentSearchResults, setModalStudentSearchResults] = useState([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Student search in edit modal
  const [editModalStudentSearchTerm, setEditModalStudentSearchTerm] = useState('');
  const [editModalStudentSearchResults, setEditModalStudentSearchResults] = useState([]);
  const [isSearchingStudentsEdit, setIsSearchingStudentsEdit] = useState(false);
  const [selectedStudentEdit, setSelectedStudentEdit] = useState(null);

  // Toast states
  const [toast, setToast] = useState({ message: null, type: 'success', visible: false });

  useEffect(() => {
    fetchStudents();
    fetchHostels();
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [currentPage, activeSearchTerm]);

  // Live search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setActiveSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Student search in modal
  const searchStudentsInModal = async () => {
    if (!modalStudentSearchTerm.trim()) {
      setModalStudentSearchResults([]);
      return;
    }

    setIsSearchingStudents(true);
    try {
      const response = await axios.get(`${BASE_URL}/students/search`, {
        params: { query: modalStudentSearchTerm.trim() },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setModalStudentSearchResults(response.data.data || []);
    } catch (error) {
      console.error('Error searching students:', error);
      setModalStudentSearchResults([]);
    } finally {
      setIsSearchingStudents(false);
    }
  };

  // Debounced student search in modal
  useEffect(() => {
    if (!showAddModal) return;

    const delayDebounceFn = setTimeout(() => {
      searchStudentsInModal();
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [modalStudentSearchTerm, showAddModal]);

  // Student search in edit modal
  const searchStudentsInEditModal = async () => {
    if (!editModalStudentSearchTerm.trim()) {
      setEditModalStudentSearchResults([]);
      return;
    }

    setIsSearchingStudentsEdit(true);
    try {
      const response = await axios.get(`${BASE_URL}/students/search`, {
        params: { query: editModalStudentSearchTerm.trim() },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setEditModalStudentSearchResults(response.data.data || []);
    } catch (error) {
      console.error('Error searching students:', error);
      setEditModalStudentSearchResults([]);
    } finally {
      setIsSearchingStudentsEdit(false);
    }
  };

  // Debounced student search in edit modal
  useEffect(() => {
    if (!showEditModal) return;

    const delayDebounceFn = setTimeout(() => {
      searchStudentsInEditModal();
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [editModalStudentSearchTerm, showEditModal]);

  const selectStudentInEditModal = (student) => {
    setSelectedStudentEdit(student);
    setFormData(prev => ({
      ...prev,
      student_reg_number: student.RegNumber || student.reg_number || student.id
    }));
    setEditModalStudentSearchTerm(`${student.Name || student.name || ''} ${student.Surname || student.surname || ''}`.trim() || student.RegNumber || student.reg_number);
    setEditModalStudentSearchResults([]);
  };

  const selectStudentInModal = (student) => {
    setSelectedStudent(student);
    setFormData(prev => ({
      ...prev,
      student_reg_number: student.RegNumber || student.reg_number || student.id
    }));
    setModalStudentSearchTerm(`${student.Name || student.name || ''} ${student.Surname || student.surname || ''}`.trim() || student.RegNumber || student.reg_number);
    setModalStudentSearchResults([]);
  };

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeSearchTerm && activeSearchTerm.trim() !== '') {
        const response = await axios.get(`${BASE_URL}/boarding/enrollments`, {
          params: {
            search: activeSearchTerm.trim()
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const allEnrollments = response.data.data || response.data || [];
        const searchLower = activeSearchTerm.trim().toLowerCase();
        const filtered = allEnrollments.filter(enrollment => {
          const studentName = (enrollment.student_name && enrollment.student_surname 
            ? `${enrollment.student_name} ${enrollment.student_surname}` 
            : getStudentName(enrollment.student_reg_number || enrollment.student_id)).toLowerCase();
          const hostelName = (enrollment.hostel_name || getHostelName(enrollment.hostel_id)).toLowerCase();
          return studentName.includes(searchLower) || hostelName.includes(searchLower);
        });
        
        setEnrollments(filtered);
        setTotalPages(1);
        setTotalEnrollments(filtered.length);
      } else {
        const response = await axios.get(`${BASE_URL}/boarding/enrollments`, {
          params: {
            page: currentPage,
            limit: limit
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = response.data;
        if (data.pagination) {
          // Server-side pagination
          setEnrollments(data.data || []);
          setTotalPages(data.pagination.totalPages || 1);
          setTotalEnrollments(data.pagination.totalEnrollments || 0);
        } else {
          // Client-side pagination fallback
          const allEnrollments = data.data || data || [];
          const startIndex = (currentPage - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedEnrollments = allEnrollments.slice(startIndex, endIndex);
          const totalPages = Math.ceil(allEnrollments.length / limit);
          
          setEnrollments(paginatedEnrollments);
          setTotalPages(totalPages);
          setTotalEnrollments(allEnrollments.length);
        }
      }
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setError('Failed to load enrollments');
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (Array.isArray(response.data)) {
        setStudents(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setStudents(response.data.data);
      } else if (response.data && Array.isArray(response.data.students)) {
        setStudents(response.data.students);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const fetchHostels = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding/hostels`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (Array.isArray(response.data)) {
        setHostels(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setHostels(response.data.data);
      } else if (response.data && Array.isArray(response.data.hostels)) {
        setHostels(response.data.hostels);
      } else {
        setHostels([]);
      }
    } catch (error) {
      console.error('Error fetching hostels:', error);
      setHostels([]);
    }
  };

  const fetchRooms = async (hostelId) => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding/rooms/available/${hostelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (Array.isArray(response.data)) {
        setRooms(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setRooms(response.data.data);
      } else if (response.data && Array.isArray(response.data.rooms)) {
        setRooms(response.data.rooms);
      } else {
        setRooms([]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setCurrentPage(1);
  };

  const handleOpenModal = () => {
    setShowAddModal(true);
    setFormError(null);
    setFormData({
      student_reg_number: '',
      hostel_id: '',
      room_id: '',
      academic_year: new Date().getFullYear().toString(),
      term: '',
      enrollment_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setRooms([]);
    setModalStudentSearchTerm('');
    setModalStudentSearchResults([]);
    setSelectedStudent(null);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormError(null);
    setIsLoading(false);
    setFormData({
      student_reg_number: '',
      hostel_id: '',
      room_id: '',
      academic_year: new Date().getFullYear().toString(),
      term: '',
      enrollment_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setRooms([]);
    setModalStudentSearchTerm('');
    setModalStudentSearchResults([]);
    setSelectedStudent(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'hostel_id' && value) {
      fetchRooms(value);
    } else if (name === 'hostel_id' && !value) {
      setRooms([]);
      setFormData(prev => ({ ...prev, room_id: '' }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      // Convert term format from "Term 1" to "1" if needed
      let termValue = formData.term;
      if (termValue && termValue.startsWith('Term ')) {
        termValue = termValue.replace('Term ', '');
      }

      const response = await axios.post(`${BASE_URL}/boarding/enrollments`, {
        student_reg_number: formData.student_reg_number,
        hostel_id: formData.hostel_id,
        room_id: formData.room_id,
        enrollment_date: formData.enrollment_date,
        term: termValue,
        academic_year: formData.academic_year,
        notes: formData.notes || null
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        await fetchEnrollments();
        handleCloseModal();
        const studentName = getStudentName(formData.student_reg_number);
        showToast(`Student ${studentName} has been successfully allocated!`, 'success');
      } else {
        setFormError(response.data.message || 'Failed to allocate student');
      }
    } catch (err) {
      console.error('Error allocating student:', err);
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

  const handleEdit = (enrollment) => {
    setSelectedEnrollment(enrollment);
    const studentName = getStudentName(enrollment);
    setFormData({
      student_reg_number: enrollment.student_reg_number || enrollment.student_id || '',
      hostel_id: enrollment.hostel_id || '',
      room_id: enrollment.room_id || '',
      academic_year: enrollment.academic_year || new Date().getFullYear().toString(),
      term: enrollment.term ? (enrollment.term.startsWith('Term ') ? enrollment.term : `Term ${enrollment.term}`) : '',
      enrollment_date: enrollment.enrollment_date ? enrollment.enrollment_date.split('T')[0] : new Date().toISOString().split('T')[0],
      notes: enrollment.notes || ''
    });
    // Set initial search term and selected student for edit modal
    setEditModalStudentSearchTerm(studentName);
    setSelectedStudentEdit(null); // Will be set when user searches
    setEditModalStudentSearchResults([]);
    if (enrollment.hostel_id) {
      fetchRooms(enrollment.hostel_id);
    }
    setFormError(null);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedEnrollment(null);
    setFormError(null);
    setIsLoading(false);
    setFormData({
      student_reg_number: '',
      hostel_id: '',
      room_id: '',
      academic_year: new Date().getFullYear().toString(),
      term: '',
      enrollment_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setRooms([]);
    setEditModalStudentSearchTerm('');
    setEditModalStudentSearchResults([]);
    setSelectedStudentEdit(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedEnrollment) return;

    setIsLoading(true);
    setFormError(null);

    try {
      // Convert term format from "Term 1" to "1" if needed
      let termValue = formData.term;
      if (termValue && termValue.startsWith('Term ')) {
        termValue = termValue.replace('Term ', '');
      }

      await axios.put(`${BASE_URL}/boarding/enrollments/${selectedEnrollment.id}`, {
        student_reg_number: formData.student_reg_number,
        hostel_id: formData.hostel_id,
        room_id: formData.room_id,
        enrollment_date: formData.enrollment_date,
        term: termValue,
        academic_year: formData.academic_year,
        notes: formData.notes || null
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await fetchEnrollments();
      handleCloseEditModal();
      showToast(`Enrollment has been successfully updated!`, 'success');
    } catch (err) {
      console.error('Error updating enrollment:', err);
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

  const handleView = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedEnrollment(null);
  };

  const handleDeleteClick = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedEnrollment(null);
    setIsDeleting(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEnrollment) return;

    setIsDeleting(true);
    try {
      await axios.delete(`${BASE_URL}/boarding/enrollments/${selectedEnrollment.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await fetchEnrollments();
      handleCloseDeleteModal();
      showToast(`Enrollment has been successfully cancelled!`, 'success');
    } catch (err) {
      console.error('Error deleting enrollment:', err);
      let errorMessage = 'Failed to cancel enrollment';
      
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

  const handleCheckIn = async (enrollment) => {
    try {
      await axios.post(`${BASE_URL}/boarding/enrollments/${enrollment.id}/checkin`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      await fetchEnrollments();
      showToast(`Student has been checked in successfully!`, 'success');
    } catch (error) {
      console.error('Error checking in student:', error);
      showToast('Failed to check in student', 'error');
    }
  };

  const handleCheckOut = async (enrollment) => {
    try {
      await axios.post(`${BASE_URL}/boarding/enrollments/${enrollment.id}/checkout`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      await fetchEnrollments();
      showToast(`Student has been checked out successfully!`, 'success');
    } catch (error) {
      console.error('Error checking out student:', error);
      showToast('Failed to check out student', 'error');
    }
  };

  const getStudentName = (enrollment) => {
    if (enrollment.student_name && enrollment.student_surname) {
      return `${enrollment.student_name} ${enrollment.student_surname}`;
    }
    if (enrollment.student_reg_number) {
      const student = students.find(s => 
        (s.RegNumber || s.reg_number || s.id) === enrollment.student_reg_number ||
        s.id === enrollment.student_reg_number
      );
      if (student) {
        return `${student.Name || student.name || ''} ${student.Surname || student.surname || ''}`.trim() || student.RegNumber || student.reg_number || 'Unknown Student';
      }
    }
    return 'Unknown Student';
  };

  const getHostelName = (enrollment) => {
    if (enrollment.hostel_name) {
      return enrollment.hostel_name;
    }
    if (enrollment.hostel_id) {
      const hostel = hostels.find(h => h.id === enrollment.hostel_id);
      return hostel ? hostel.name : 'Unknown Hostel';
    }
    return 'Unknown Hostel';
  };

  const getRoomNumber = (enrollment) => {
    if (enrollment.room_number) {
      return enrollment.room_number;
    }
    if (enrollment.room_id) {
      const room = rooms.find(r => r.id === enrollment.room_id);
      if (room) return room.room_number;
    }
    return 'Unknown Room';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'enrolled': { bg: '#d1fae5', text: '#059669', label: 'Enrolled' },
      'checked_in': { bg: '#dbeafe', text: '#2563eb', label: 'Checked In' },
      'checked_out': { bg: '#fef3c7', text: '#d97706', label: 'Checked Out' },
      'cancelled': { bg: '#fee2e2', text: '#dc2626', label: 'Cancelled' },
      'ACTIVE': { bg: '#d1fae5', text: '#059669', label: 'Active' },
      'CHECKED_IN': { bg: '#dbeafe', text: '#2563eb', label: 'Checked In' },
      'CHECKED_OUT': { bg: '#fef3c7', text: '#d97706', label: 'Checked Out' },
      'CANCELLED': { bg: '#fee2e2', text: '#dc2626', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig['enrolled'];
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.7rem',
        fontWeight: 600,
        background: config.bg,
        color: config.text
      }}>
        {config.label}
      </span>
    );
  };

  const isFormValid = () => {
    return (
      formData.student_reg_number &&
      formData.hostel_id &&
      formData.room_id &&
      formData.academic_year &&
      formData.term &&
      formData.enrollment_date
    );
  };

  const displayStart = enrollments.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalEnrollments);

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
    return null;
  };

  const getToastBackgroundColor = (type) => {
    if (type === 'success') return '#10b981';
    if (type === 'error') return '#ef4444';
    return '#6b7280';
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
          <h2 className="report-title">Hostel Allocations</h2>
          <p className="report-subtitle">Manage student enrollments in boarding facilities.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleOpenModal}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faPlus} />
            Allocate Student
          </button>
        </div>
      </div>

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
                placeholder="Search by student name or hostel..."
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
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }}>
          {error}
        </div>
      )}

      {/* Content Container */}
      <div className="report-content-container" style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
        minHeight: 0,
        padding: 0
      }}>
      {/* Table Container */}
        <div className="ecl-table-container" style={{
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1, 
        overflow: 'auto', 
        minHeight: 0,
        padding: 0,
        height: '100%'
      }}>
        {loading && enrollments.length === 0 ? (
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
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading enrollments...</p>
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
                <th style={{ padding: '6px 10px' }}>STUDENT</th>
                <th style={{ padding: '6px 10px' }}>HOSTEL</th>
                <th style={{ padding: '6px 10px' }}>ROOM</th>
                <th style={{ padding: '6px 10px' }}>ACADEMIC YEAR</th>
                <th style={{ padding: '6px 10px' }}>TERM</th>
                <th style={{ padding: '6px 10px' }}>STATUS</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment, index) => (
                <tr 
                  key={enrollment.id || index} 
                  style={{ 
                    height: '32px', 
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>
                    {getStudentName(enrollment)}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {getHostelName(enrollment)}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {getRoomNumber(enrollment)}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {enrollment.academic_year || 'N/A'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {enrollment.term ? (enrollment.term.startsWith('Term ') ? enrollment.term : `Term ${enrollment.term}`) : 'N/A'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {getStatusBadge(enrollment.status)}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleView(enrollment)}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="View"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        onClick={() => handleEdit(enrollment)}
                        style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      {(enrollment.status === 'enrolled' || enrollment.status === 'ACTIVE') && (
                        <button
                          onClick={() => handleCheckIn(enrollment)}
                          style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Check In"
                        >
                          <FontAwesomeIcon icon={faSignInAlt} />
                        </button>
                      )}
                      {(enrollment.status === 'checked_in' || enrollment.status === 'CHECKED_IN') && (
                        <button
                          onClick={() => handleCheckOut(enrollment)}
                          style={{ color: '#d97706', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Check Out"
                        >
                          <FontAwesomeIcon icon={faSignOutAlt} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteClick(enrollment)}
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
              {Array.from({ length: Math.max(0, 25 - enrollments.length) }).map((_, index) => (
                <tr 
                  key={`empty-${index}`}
                  style={{ 
                    height: '32px', 
                    backgroundColor: (enrollments.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                  }}
                >
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
      </div>

      {/* Pagination Footer - Separate Container */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {totalEnrollments || 0} results.
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

      {/* Add Enrollment Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '600px', minHeight: isLoading ? '400px' : 'auto' }}
          >
            {isLoading ? (
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
              <>
                <div className="modal-header">
                  <h3 className="modal-title">Allocate Student</h3>
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
                        Student <span className="required">*</span>
                      </label>
                      <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <FontAwesomeIcon icon={faSearch} className="search-icon" />
                        <input
                          type="text"
                          value={modalStudentSearchTerm}
                          onChange={(e) => {
                            setModalStudentSearchTerm(e.target.value);
                            if (!e.target.value.trim()) {
                              setSelectedStudent(null);
                              setFormData(prev => ({ ...prev, student_reg_number: '' }));
                              setModalStudentSearchResults([]);
                            }
                          }}
                          placeholder="Search by name or registration number..."
                          className="filter-input search-input"
                          required={!selectedStudent}
                        />
                        {isSearchingStudents && (
                          <div style={{ position: 'absolute', right: '30px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Searching...
                          </div>
                        )}
                      </div>
                      {modalStudentSearchResults.length > 0 && (
                        <div style={{
                          marginTop: '8px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          background: 'white',
                          zIndex: 1000
                        }}>
                          {modalStudentSearchResults.map((student) => (
                            <div
                              key={student.RegNumber || student.id || student.reg_number}
                              onClick={() => selectStudentInModal(student)}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f3f4f6',
                                fontSize: '0.75rem'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                {student.Name || student.name || ''} {student.Surname || student.surname || ''}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                Reg: {student.RegNumber || student.reg_number || student.id}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedStudent && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px 12px',
                          background: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          borderRadius: '4px',
                          fontSize: '0.75rem'
                        }}>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                            Selected: {selectedStudent.Name || selectedStudent.name || ''} {selectedStudent.Surname || selectedStudent.surname || ''}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            Reg: {selectedStudent.RegNumber || selectedStudent.reg_number || selectedStudent.id}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Hostel <span className="required">*</span>
                      </label>
                      <select
                        name="hostel_id"
                        className="form-control"
                        value={formData.hostel_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Hostel</option>
                        {hostels.map((hostel) => (
                          <option key={hostel.id} value={hostel.id}>
                            {hostel.name} ({hostel.gender === 'Male' ? 'Boys Hostel' : hostel.gender === 'Female' ? 'Girls Hostel' : hostel.gender})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Room <span className="required">*</span>
                      </label>
                      <select
                        name="room_id"
                        className="form-control"
                        value={formData.room_id}
                        onChange={handleInputChange}
                        required
                        disabled={!formData.hostel_id || rooms.length === 0}
                      >
                        <option value="">
                          {!formData.hostel_id 
                            ? 'Select a hostel first' 
                            : rooms.length === 0 
                            ? 'No available rooms' 
                            : 'Select Room'}
                        </option>
                        {rooms.map((room) => {
                          const available = (room.capacity || 0) - (room.current_occupancy || room.current_enrollments || 0);
                          return (
                            <option key={room.id} value={room.id}>
                              {room.room_number} - {room.room_type} (Capacity: {room.capacity || 0}, Available: {available})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">
                          Enrollment Date <span className="required">*</span>
                        </label>
                        <input
                          type="date"
                          name="enrollment_date"
                          className="form-control"
                          value={formData.enrollment_date}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">
                          Academic Year <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          name="academic_year"
                          className="form-control"
                          placeholder="e.g., 2025"
                          value={formData.academic_year}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Term <span className="required">*</span>
                      </label>
                      <select
                        name="term"
                        className="form-control"
                        value={formData.term}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Term</option>
                        <option value="Term 1">Term 1</option>
                        <option value="Term 2">Term 2</option>
                        <option value="Term 3">Term 3</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Notes (Optional)</label>
                      <textarea
                        name="notes"
                        className="form-control"
                        placeholder="Enter any additional notes..."
                        rows="3"
                        value={formData.notes}
                        onChange={handleInputChange}
                      />
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
                    {isLoading ? 'Allocating...' : 'Allocate Student'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Enrollment Modal */}
      {showEditModal && selectedEnrollment && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '600px', minHeight: isLoading ? '400px' : 'auto' }}
          >
            {isLoading ? (
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
              <>
                <div className="modal-header">
                  <h3 className="modal-title">Edit Enrollment</h3>
                  <button className="modal-close-btn" onClick={handleCloseEditModal}>
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
                  
                  <form onSubmit={handleUpdate} className="modal-form">
                    <div className="form-group">
                      <label className="form-label">
                        Student <span className="required">*</span>
                      </label>
                      <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <FontAwesomeIcon icon={faSearch} className="search-icon" />
                        <input
                          type="text"
                          value={editModalStudentSearchTerm}
                          onChange={(e) => {
                            setEditModalStudentSearchTerm(e.target.value);
                            if (!e.target.value.trim()) {
                              setSelectedStudentEdit(null);
                              setFormData(prev => ({ ...prev, student_reg_number: '' }));
                              setEditModalStudentSearchResults([]);
                            }
                          }}
                          placeholder="Search by name or registration number..."
                          className="filter-input search-input"
                          required={!selectedStudentEdit && !formData.student_reg_number}
                        />
                        {isSearchingStudentsEdit && (
                          <div style={{ position: 'absolute', right: '30px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Searching...
                          </div>
                        )}
                      </div>
                      {editModalStudentSearchResults.length > 0 && (
                        <div style={{
                          marginTop: '8px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          background: 'white',
                          zIndex: 1000
                        }}>
                          {editModalStudentSearchResults.map((student) => (
                            <div
                              key={student.RegNumber || student.id || student.reg_number}
                              onClick={() => selectStudentInEditModal(student)}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f3f4f6',
                                fontSize: '0.75rem'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                {student.Name || student.name || ''} {student.Surname || student.surname || ''}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                Reg: {student.RegNumber || student.reg_number || student.id}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {(selectedStudentEdit || formData.student_reg_number) && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px 12px',
                          background: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          borderRadius: '4px',
                          fontSize: '0.75rem'
                        }}>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                            Selected: {selectedStudentEdit ? `${selectedStudentEdit.Name || selectedStudentEdit.name || ''} ${selectedStudentEdit.Surname || selectedStudentEdit.surname || ''}`.trim() : editModalStudentSearchTerm}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            Reg: {selectedStudentEdit ? (selectedStudentEdit.RegNumber || selectedStudentEdit.reg_number || selectedStudentEdit.id) : formData.student_reg_number}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Hostel <span className="required">*</span>
                      </label>
                      <select
                        name="hostel_id"
                        className="form-control"
                        value={formData.hostel_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Hostel</option>
                        {hostels.map((hostel) => (
                          <option key={hostel.id} value={hostel.id}>
                            {hostel.name} ({hostel.gender === 'Male' ? 'Boys Hostel' : hostel.gender === 'Female' ? 'Girls Hostel' : hostel.gender})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Room <span className="required">*</span>
                      </label>
                      <select
                        name="room_id"
                        className="form-control"
                        value={formData.room_id}
                        onChange={handleInputChange}
                        required
                        disabled={!formData.hostel_id || rooms.length === 0}
                      >
                        <option value="">
                          {!formData.hostel_id 
                            ? 'Select a hostel first' 
                            : rooms.length === 0 
                            ? 'No available rooms' 
                            : 'Select Room'}
                        </option>
                        {rooms.map((room) => {
                          const available = (room.capacity || 0) - (room.current_occupancy || room.current_enrollments || 0);
                          return (
                            <option key={room.id} value={room.id}>
                              {room.room_number} - {room.room_type} (Capacity: {room.capacity || 0}, Available: {available})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">
                          Enrollment Date <span className="required">*</span>
                        </label>
                        <input
                          type="date"
                          name="enrollment_date"
                          className="form-control"
                          value={formData.enrollment_date}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">
                          Academic Year <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          name="academic_year"
                          className="form-control"
                          placeholder="e.g., 2025"
                          value={formData.academic_year}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Term <span className="required">*</span>
                      </label>
                      <select
                        name="term"
                        className="form-control"
                        value={formData.term}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Term</option>
                        <option value="Term 1">Term 1</option>
                        <option value="Term 2">Term 2</option>
                        <option value="Term 3">Term 3</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Notes (Optional)</label>
                      <textarea
                        name="notes"
                        className="form-control"
                        placeholder="Enter any additional notes..."
                        rows="3"
                        value={formData.notes}
                        onChange={handleInputChange}
                      />
                    </div>
                  </form>
                </div>
                
                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={handleCloseEditModal}>
                    Cancel
                  </button>
                  <button 
                    className="modal-btn modal-btn-confirm" 
                    onClick={handleUpdate}
                    disabled={!isFormValid() || isLoading}
                  >
                    {isLoading ? 'Updating...' : 'Update Enrollment'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* View Enrollment Modal */}
      {showViewModal && selectedEnrollment && (
        <div className="modal-overlay" onClick={handleCloseViewModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '600px' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Enrollment Details</h3>
              <button className="modal-close-btn" onClick={handleCloseViewModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Enrollment Information
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Student
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {getStudentName(selectedEnrollment)}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Hostel
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {getHostelName(selectedEnrollment)}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Room
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {getRoomNumber(selectedEnrollment)}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Academic Year
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {selectedEnrollment.academic_year || 'N/A'}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Term
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {selectedEnrollment.term ? (selectedEnrollment.term.startsWith('Term ') ? selectedEnrollment.term : `Term ${selectedEnrollment.term}`) : 'N/A'}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Status
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {getStatusBadge(selectedEnrollment.status)}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Enrollment Date
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {selectedEnrollment.enrollment_date ? new Date(selectedEnrollment.enrollment_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    
                    {selectedEnrollment.check_in_date && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          Check In Date
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                          {new Date(selectedEnrollment.check_in_date).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    
                    {selectedEnrollment.check_out_date && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          Check Out Date
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                          {new Date(selectedEnrollment.check_out_date).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={handleCloseViewModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEnrollment && (
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
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Cancel Enrollment?
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Are you sure you want to cancel this enrollment? This action cannot be undone.
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
                  Enrollment Information
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Student:</strong> {getStudentName(selectedEnrollment)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Hostel:</strong> {getHostelName(selectedEnrollment)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Room:</strong> {getRoomNumber(selectedEnrollment)}
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
                {isDeleting ? 'Cancelling...' : 'Cancel Enrollment'}
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

export default Enrollments;
