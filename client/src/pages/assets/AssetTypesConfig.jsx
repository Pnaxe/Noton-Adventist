import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faBox, faArrowLeft, faSearch } from '@fortawesome/free-solid-svg-icons';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';

const AssetTypesConfig = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [assetTypes, setAssetTypes] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [addLoading, setAddLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    chart_of_account_id: '',
    depreciation_account_id: '',
    expense_account_id: '',
    requires_registration: false,
    requires_serial_number: false,
    icon: 'faBox'
  });

  useEffect(() => {
    fetchData();
    fetchChartOfAccounts();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/assets/types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAssetTypes(response.data.data || []);
        setError('');
      } else {
        setError('Failed to fetch asset types.');
      }
    } catch (err) {
      console.error('Error fetching asset types:', err);
      setError('Failed to fetch asset types.');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartOfAccounts = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/chart-of-accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setChartOfAccounts(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching chart of accounts:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAdd = () => {
    setEditingType(null);
    setFormData({
      name: '',
      description: '',
      chart_of_account_id: '',
      depreciation_account_id: '',
      expense_account_id: '',
      requires_registration: false,
      requires_serial_number: false,
      icon: 'faBox'
    });
    setShowAddModal(true);
    setError('');
    setSuccess('');
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name || '',
      description: type.description || '',
      chart_of_account_id: type.chart_of_account_id || '',
      depreciation_account_id: type.depreciation_account_id || '',
      expense_account_id: type.expense_account_id || '',
      requires_registration: type.requires_registration || false,
      requires_serial_number: type.requires_serial_number || false,
      icon: type.icon || 'faBox'
    });
    setShowAddModal(true);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = editingType
        ? `${BASE_URL}/assets/types/${editingType.id}`
        : `${BASE_URL}/assets/types`;

      const method = editingType ? 'put' : 'post';

      const response = await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess(editingType ? 'Asset type updated successfully' : 'Asset type created successfully');
        setShowAddModal(false);
        setEditingType(null);
        await fetchData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.error || 'Failed to save asset type.');
      }
    } catch (err) {
      console.error('Error saving asset type:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save asset type.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset type? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${BASE_URL}/assets/types/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Asset type deleted successfully');
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting asset type:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to delete asset type.');
    } finally {
      setLoading(false);
    }
  };

  const getAssetAccounts = () => {
    return chartOfAccounts.filter(acc =>
      acc.type === 'Asset' && acc.is_active
    );
  };

  const getExpenseAccounts = () => {
    return chartOfAccounts.filter(acc =>
      acc.type === 'Expense' && acc.is_active
    );
  };

  const displayList = useMemo(() => {
    if (!searchTerm.trim()) return assetTypes;
    const q = searchTerm.trim().toLowerCase();
    return assetTypes.filter(
      (t) =>
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.account_name && t.account_name.toLowerCase().includes(q))
    );
  }, [assetTypes, searchTerm]);

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
          <h2 className="report-title">Fixed Assets Configuration</h2>
          <p className="report-subtitle">Manage asset types and their settings.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn-checklist"
            onClick={() => navigate('/dashboard/assets')}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Fixed Assets
          </button>
          <button
            onClick={handleAdd}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Asset Type
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
        {loading && assetTypes.length === 0 ? (
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
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading asset types...</p>
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
                <th style={{ padding: '6px 10px', verticalAlign: 'middle' }}>NAME</th>
                <th style={{ padding: '6px 10px', verticalAlign: 'middle' }}>DESCRIPTION</th>
                <th style={{ padding: '6px 10px', verticalAlign: 'middle' }}>CHART OF ACCOUNT</th>
                <th style={{ padding: '6px 10px', verticalAlign: 'middle' }}>REQUIRES REGISTRATION</th>
                <th style={{ padding: '6px 10px', verticalAlign: 'middle' }}>REQUIRES SERIAL #</th>
                <th style={{ padding: '6px 10px', verticalAlign: 'middle' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {displayList.length === 0 ? (
                <tr style={{ height: '32px', backgroundColor: '#fafafa' }}>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem', verticalAlign: 'middle' }}>
                    {assetTypes.length === 0
                      ? ''
                      : 'No matching asset types.'}
                  </td>
                </tr>
              ) : (
                displayList.map((type, index) => (
                  <tr
                    key={type.id}
                    style={{
                      height: '32px',
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                    }}
                  >
                    <td style={{ padding: '4px 10px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faBox} style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }} />
                        <span>{type.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '4px 10px', verticalAlign: 'middle' }}>{type.description || '—'}</td>
                    <td style={{ padding: '4px 10px', verticalAlign: 'middle' }}>{type.account_code} — {type.account_name}</td>
                    <td style={{ padding: '4px 10px', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          background: type.requires_registration ? '#d1fae5' : '#f3f4f6',
                          color: type.requires_registration ? '#065f46' : '#374151'
                        }}
                      >
                        {type.requires_registration ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td style={{ padding: '4px 10px', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          background: type.requires_serial_number ? '#d1fae5' : '#f3f4f6',
                          color: type.requires_serial_number ? '#065f46' : '#374151'
                        }}
                      >
                        {type.requires_serial_number ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td style={{ padding: '4px 10px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                          onClick={() => handleEdit(type)}
                          style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleDelete(type.id)}
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
          Showing {displayList.length === 0 ? 0 : 1} to {displayList.length} of {assetTypes.length} results.
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
          aria-labelledby="asset-type-modal-title"
        >
          <div
            className="modal-dialog"
            style={{ maxWidth: '600px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="asset-type-modal-title" className="modal-title">
                {editingType ? 'Edit Asset Type' : 'Add New Asset Type'}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">
                      Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="e.g., Vehicles, Equipment"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      className="form-control"
                      rows="2"
                      placeholder="Brief description of this asset type"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Chart of Account <span className="required">*</span>
                    </label>
                    <select
                      name="chart_of_account_id"
                      className="form-control"
                      value={formData.chart_of_account_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Account</option>
                      {getAssetAccounts().map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} — {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Depreciation Account</label>
                    <select
                      name="depreciation_account_id"
                      className="form-control"
                      value={formData.depreciation_account_id}
                      onChange={handleChange}
                    >
                      <option value="">Select Account (Optional)</option>
                      {getExpenseAccounts().map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} — {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expense Account</label>
                    <select
                      name="expense_account_id"
                      className="form-control"
                      value={formData.expense_account_id}
                      onChange={handleChange}
                    >
                      <option value="">Select Account (Optional)</option>
                      {getExpenseAccounts().map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} — {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          name="requires_registration"
                          checked={formData.requires_registration}
                          onChange={handleChange}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span className="form-label" style={{ margin: 0 }}>Requires Registration Number</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          name="requires_serial_number"
                          checked={formData.requires_serial_number}
                          onChange={handleChange}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span className="form-label" style={{ margin: 0 }}>Requires Serial Number</span>
                      </label>
                    </div>
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
                  {addLoading ? 'Saving...' : editingType ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetTypesConfig;
