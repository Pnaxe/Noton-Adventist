import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faArrowLeft, faSearch, faTag, faTimes } from '@fortawesome/free-solid-svg-icons';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';

const WaiverCategories = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [toast, setToast] = useState({ message: null, type: 'success', visible: false });

  const [formData, setFormData] = useState({
    category_name: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/waivers/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCategories(response.data.data || []);
        setError('');
      } else {
        setError('Failed to fetch waiver categories.');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch waiver categories.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'info': return '#2563eb';
      case 'warning': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({
      category_name: '',
      description: '',
      is_active: true
    });
    setShowAddModal(true);
    setError('');
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name || '',
      description: category.description || '',
      is_active: category.is_active !== undefined ? category.is_active : true
    });
    setShowAddModal(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setError('');

    try {
      const url = editingCategory
        ? `${BASE_URL}/waivers/categories/${editingCategory.id}`
        : `${BASE_URL}/waivers/categories`;
      
      const method = editingCategory ? 'put' : 'post';
      
      const response = await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        showToast(editingCategory ? 'Waiver category updated successfully' : 'Waiver category created successfully', 'success');
        setShowAddModal(false);
        setEditingCategory(null);
        await fetchCategories();
      } else {
        setError(response.data.error || response.data.message || 'Failed to save waiver category.');
      }
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save waiver category.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setDeleteLoading(true);
      await axios.delete(`${BASE_URL}/waivers/categories/${categoryToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showToast('Waiver category deleted successfully', 'success');
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      await fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      showToast(err.response?.data?.error || err.response?.data?.message || 'Failed to delete waiver category.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const displayList = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const q = searchTerm.trim().toLowerCase();
    return categories.filter(
      (c) =>
        (c.category_name && c.category_name.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
  };

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
          <h2 className="report-title">Waiver Categories</h2>
          <p className="report-subtitle">Manage waiver categories and their settings.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn-checklist"
            onClick={() => navigate('/dashboard/waivers')}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Waivers
          </button>
          <button
            onClick={handleAdd}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Category
          </button>
        </div>
      </div>

      {/* Filters Section - same structure as Students */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left">
          <form onSubmit={handleSearch} className="filter-group">
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or description..."
                className="filter-input search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
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

      {/* Error Display - same as Students */}
      {error && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }}>
          {error}
        </div>
      )}

      {/* Table Container - same as Students */}
      <div className="report-content-container ecl-table-container" style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
        padding: 0,
        height: '100%'
      }}>
        {loading && categories.length === 0 ? (
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
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading categories...</p>
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
                <th style={{ padding: '6px 10px', verticalAlign: 'middle' }}>CATEGORY NAME</th>
                <th style={{ padding: '6px 10px', verticalAlign: 'middle' }}>DESCRIPTION</th>
                <th style={{ padding: '6px 10px', verticalAlign: 'middle' }}>STATUS</th>
                <th style={{ padding: '6px 10px', verticalAlign: 'middle' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {displayList.length === 0 ? (
                <tr style={{ height: '32px', backgroundColor: '#fafafa' }}>
                  <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem', verticalAlign: 'middle' }}>
                    {categories.length === 0
                      ? ''
                      : 'No matching categories.'}
                  </td>
                </tr>
              ) : (
                displayList.map((category, index) => (
                  <tr
                    key={category.id}
                    style={{
                      height: '32px',
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                    }}
                  >
                    <td style={{ padding: '4px 10px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faTag} style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }} />
                        <span>{category.category_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '4px 10px', verticalAlign: 'middle' }}>{category.description || '—'}</td>
                    <td style={{ padding: '4px 10px', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          background: category.is_active ? '#d1fae5' : '#fee2e2',
                          color: category.is_active ? '#065f46' : '#991b1b'
                        }}
                      >
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '4px 10px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                          onClick={() => handleEdit(category)}
                          style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Delete"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {/* Empty placeholder rows - same as Students (25 rows total) */}
              {Array.from({ length: Math.max(0, 25 - displayList.length) }).map((_, index) => (
                <tr
                  key={`empty-${index}`}
                  style={{
                    height: '32px',
                    backgroundColor: (displayList.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px', verticalAlign: 'middle' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px', verticalAlign: 'middle' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px', verticalAlign: 'middle' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px', verticalAlign: 'middle' }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer - same as Students */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayList.length === 0 ? 0 : 1} to {displayList.length} of {categories.length} results.
        </div>
        <div className="table-footer-right">
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            All data displayed
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={() => !addLoading && setShowAddModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
        >
          <div
            className="modal-dialog"
            style={{ maxWidth: '600px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="category-modal-title" className="modal-title">
                {editingCategory ? 'Edit Waiver Category' : 'Add New Waiver Category'}
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !addLoading && setShowAddModal(false)}
                disabled={addLoading}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit} style={{ border: 'none', padding: '16px', gap: '16px' }}>
              <div className="modal-body" style={{ padding: 0, maxHeight: 'none', boxShadow: 'none' }}>
                {error && (
                  <div className="form-group" style={{ marginBottom: 8 }}>
                    <div style={{ padding: '10px 12px', background: '#fee2e2', color: '#dc2626', fontSize: '0.8rem', borderRadius: 4 }}>
                      {error}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      Category Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="category_name"
                      className="form-control"
                      placeholder="e.g., Staff Child, Scholarship"
                      value={formData.category_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      className="form-control"
                      rows="3"
                      placeholder="Brief description of this waiver category..."
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span className="form-label" style={{ margin: 0 }}>Active (can be used for new waivers)</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px' }}>
                <button
                  type="button"
                  className="modal-btn modal-btn-cancel"
                  onClick={() => setShowAddModal(false)}
                  disabled={addLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-btn modal-btn-confirm"
                  disabled={addLoading}
                >
                  {addLoading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && categoryToDelete && (
        <div
          className="modal-overlay"
          onClick={() => !deleteLoading && setShowDeleteModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div
            className="modal-dialog"
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="delete-modal-title" className="modal-title">Confirm Delete</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !deleteLoading && setShowDeleteModal(false)}
                disabled={deleteLoading}
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.75rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                  Are you sure you want to delete this waiver category?
                </p>
                <div style={{ background: '#f3f4f6', padding: '12px', borderRadius: '4px', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {categoryToDelete.category_name}
                  </div>
                  {categoryToDelete.description && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {categoryToDelete.description}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Status: <span style={{ fontWeight: 500, color: categoryToDelete.is_active ? '#065f46' : '#991b1b' }}>
                      {categoryToDelete.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: '8px' }}>
                  This action cannot be undone. Existing waivers using this category will not be affected.
                </p>
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px' }}>
              <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn modal-btn-delete"
                onClick={confirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
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

export default WaiverCategories;
