import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus } from '@fortawesome/free-solid-svg-icons';

const Suppliers = () => {
  const { token } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [form, setForm] = useState({ id: null, name: '', contact_person: '', phone: '', email: '', address: '', is_active: true });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState({ message: null, type: 'success', visible: false });

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
  const getToastBg = (type) => (type === 'success' ? '#10b981' : '#ef4444');

  const fetchSuppliers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${BASE_URL}/expenses/suppliers`, { headers: { Authorization: `Bearer ${token}` } });
      setSuppliers(res.data.data || []);
    } catch (err) {
      setError('Failed to load suppliers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filteredSuppliers = useMemo(() => {
    if (!searchTerm.trim()) return suppliers;
    const q = searchTerm.trim().toLowerCase();
    return suppliers.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.contact_person && s.contact_person.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q))
    );
  }, [suppliers, searchTerm]);

  const total = filteredSuppliers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginatedSuppliers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, page, pageSize]);

  const displayStart = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const displayEnd = Math.min(page * pageSize, total);

  const openAddModal = () => {
    setForm({ id: null, name: '', contact_person: '', phone: '', email: '', address: '', is_active: true });
    setModalMode('add');
    setShowModal(true);
    setFormError('');
  };

  const openEditModal = (supplier) => {
    setForm({ ...supplier });
    setModalMode('edit');
    setShowModal(true);
    setFormError('');
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      if (!form.name || !form.name.trim()) {
        setFormError('Name is required.');
        setFormLoading(false);
        return;
      }
      if (modalMode === 'add') {
        await axios.post(`${BASE_URL}/expenses/suppliers`, form, { headers: { Authorization: `Bearer ${token}` } });
        showToast('Supplier added successfully.', 'success');
      } else {
        await axios.put(`${BASE_URL}/expenses/suppliers/${form.id}`, form, { headers: { Authorization: `Bearer ${token}` } });
        showToast('Supplier updated successfully.', 'success');
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save supplier.');
      showToast(err.response?.data?.message || 'Failed to save supplier.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteModal = (supplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSupplierToDelete(null);
    setDeleteLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`${BASE_URL}/expenses/suppliers/${supplierToDelete.id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchSuppliers();
      closeDeleteModal();
      showToast('Supplier deleted successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete supplier.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="reports-container" style={{ height: '100%', maxHeight: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Report Header */}
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          <h2 className="report-title">Suppliers</h2>
          <p className="report-subtitle">Manage supplier contacts and details.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button type="button" onClick={openAddModal} className="btn-checklist">
            <FontAwesomeIcon icon={faPlus} />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Filters - like Students / Liabilities */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} className="filter-group">
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                placeholder="Search by name, contact, phone, email..."
                className="filter-input search-input"
              />
            </div>
          </form>
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Page size:</label>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="filter-input"
              style={{ minWidth: '80px' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', flexShrink: 0 }}>{error}</div>
      )}

      {/* Table - 25 rows default with placeholders */}
      <div className="report-content-container ecl-table-container" style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '16px' }}>
            <div className="loading-spinner" />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading suppliers...</p>
          </div>
        ) : (
          <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--sidebar-bg)' }}>
              <tr>
                <th style={{ padding: '6px 10px' }}>NAME</th>
                <th style={{ padding: '6px 10px' }}>CONTACT</th>
                <th style={{ padding: '6px 10px' }}>PHONE</th>
                <th style={{ padding: '6px 10px' }}>EMAIL</th>
                <th style={{ padding: '6px 10px' }}>ADDRESS</th>
                <th style={{ padding: '6px 10px' }}>STATUS</th>
                <th style={{ padding: '6px 10px', width: '110px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSuppliers.map((s, index) => (
                <tr key={s.id} style={{ height: '32px', backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' }}>
                  <td style={{ padding: '4px 10px' }}>{s.name || '—'}</td>
                  <td style={{ padding: '4px 10px' }}>{s.contact_person || '—'}</td>
                  <td style={{ padding: '4px 10px' }}>{s.phone || '—'}</td>
                  <td style={{ padding: '4px 10px' }}>{s.email || '—'}</td>
                  <td style={{ padding: '4px 10px' }}>{s.address || '—'}</td>
                  <td style={{ padding: '4px 10px' }}>
                    <span style={{ color: s.is_active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '4px 10px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button type="button" className="text-gray-700 hover:text-gray-900 text-xs" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => openEditModal(s)}>Edit</button>
                      <button type="button" className="text-red-600 hover:text-red-800 text-xs" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => openDeleteModal(s)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, pageSize - paginatedSuppliers.length) }).map((_, i) => (
                <tr key={`empty-${i}`} style={{ height: '32px', backgroundColor: (paginatedSuppliers.length + i) % 2 === 0 ? '#fafafa' : '#f3f4f6' }}>
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

      {/* Footer - like Students / Liabilities */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {total} results.
        </div>
        <div className="table-footer-right">
          {total > pageSize ? (
            <div className="pagination-controls">
              <button type="button" className="pagination-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
              <span className="pagination-info" style={{ fontSize: '0.7rem' }}>Page {page} of {totalPages}</span>
              <button type="button" className="pagination-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
            </div>
          ) : (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>All data displayed</div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal - modal-overlay/dialog */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{modalMode === 'add' ? 'Add Supplier' : 'Edit Supplier'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowModal(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="modal-body">
              {formError && (
                <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>{formError}</div>
              )}
              <form onSubmit={handleFormSubmit} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Name <span className="required">*</span></label>
                  <input type="text" name="name" value={form.name} onChange={handleFormChange} className="form-control" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input type="text" name="contact_person" value={form.contact_person} onChange={handleFormChange} className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" name="phone" value={form.phone} onChange={handleFormChange} className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" value={form.email} onChange={handleFormChange} className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input type="text" name="address" value={form.address} onChange={handleFormChange} className="form-control" />
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" name="is_active" id="supplier-is-active" checked={!!form.is_active} onChange={handleFormChange} />
                  <label className="form-label" htmlFor="supplier-is-active" style={{ marginBottom: 0 }}>Active</label>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                  <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="modal-btn modal-btn-confirm" disabled={formLoading}>{formLoading ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && supplierToDelete && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Supplier</h3>
              <button type="button" className="modal-close-btn" onClick={closeDeleteModal} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Are you sure you want to delete <strong>{supplierToDelete.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="modal-btn modal-btn-cancel" onClick={closeDeleteModal}>Cancel</button>
              <button type="button" className="modal-btn modal-btn-delete" onClick={handleConfirmDelete} disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.visible && toast.message && (
        <div className="success-toast">
          <div className="success-toast-content" style={{ background: getToastBg(toast.type) }}>
            {getToastIcon(toast.type)}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
