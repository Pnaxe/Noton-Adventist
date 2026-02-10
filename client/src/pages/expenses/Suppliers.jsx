import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';

const Suppliers = () => {
  const { token } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [form, setForm] = useState({ id: null, name: '', contact_person: '', phone: '', email: '', address: '', is_active: true });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

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

  useEffect(() => { fetchSuppliers(); }, []);

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
      if (!form.name) {
        setFormError('Name is required.');
        setFormLoading(false);
        return;
      }
      if (modalMode === 'add') {
        await axios.post(`${BASE_URL}/expenses/suppliers`, form, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.put(`${BASE_URL}/expenses/suppliers/${form.id}`, form, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err) {
      setFormError('Failed to save supplier.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await axios.delete(`${BASE_URL}/expenses/suppliers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchSuppliers();
    } catch (err) {
      alert('Failed to delete supplier.');
    }
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
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          <h2 className="report-title">Suppliers</h2>
          <p className="report-subtitle">Manage supplier contacts and details.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={openAddModal} className="btn-checklist">+ Add Supplier</button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', flexShrink: 0 }}>
          {error}
        </div>
      )}

      <div className="report-content-container ecl-table-container" style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
        padding: 0,
        height: '100%'
      }}>
        {loading ? (
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
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading suppliers...</p>
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
              {suppliers.map((s, index) => (
                <tr
                  key={s.id}
                  style={{
                    height: '32px',
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>{s.name || '-'}</td>
                  <td style={{ padding: '4px 10px' }}>{s.contact_person || '-'}</td>
                  <td style={{ padding: '4px 10px' }}>{s.phone || '-'}</td>
                  <td style={{ padding: '4px 10px' }}>{s.email || '-'}</td>
                  <td style={{ padding: '4px 10px' }}>{s.address || '-'}</td>
                  <td style={{ padding: '4px 10px' }}>
                    <span style={{ color: s.is_active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '4px 10px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        className="text-gray-700 hover:text-gray-900 text-xs"
                        style={{ borderRadius: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={() => openEditModal(s)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 text-xs"
                        style={{ borderRadius: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={() => handleDelete(s.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '12px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No suppliers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      {/* Modal for Add/Edit Supplier */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white border border-gray-200 p-6 w-full max-w-md" style={{ borderRadius: 0 }}>
            <h2 className="text-base font-semibold text-gray-800 mb-4">{modalMode === 'add' ? 'Add Supplier' : 'Edit Supplier'}</h2>
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Name</label>
                <input type="text" name="name" value={form.name} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1 text-xs" style={{ borderRadius: 0 }} required />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Contact Person</label>
                <input type="text" name="contact_person" value={form.contact_person} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1 text-xs" style={{ borderRadius: 0 }} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Phone</label>
                <input type="text" name="phone" value={form.phone} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1 text-xs" style={{ borderRadius: 0 }} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1 text-xs" style={{ borderRadius: 0 }} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Address</label>
                <input type="text" name="address" value={form.address} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1 text-xs" style={{ borderRadius: 0 }} />
              </div>
              <div className="flex items-center">
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleFormChange} className="mr-2" />
                <label className="text-xs text-gray-600">Active</label>
              </div>
              {formError && <div className="text-xs text-red-600">{formError}</div>}
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" className="px-3 py-1 text-xs text-gray-700 bg-gray-200 hover:bg-gray-300" style={{ borderRadius: 0 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="px-3 py-1 text-xs text-white bg-gray-900 hover:bg-gray-800" style={{ borderRadius: 0 }} disabled={formLoading}>{formLoading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
