import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faPlus, 
  faEye, 
  faEdit, 
  faTrash,
  faWarehouse,
  faTimes,
  faDollarSign,
  faCalendarAlt,
  faMapMarkerAlt,
  faCog,
  faBox,
  faBuilding,
  faCar,
  faLaptop,
  faPrint,
  faFlask,
  faFootballBall,
  faCouch,
  faLandmark,
  faReceipt,
  faFileInvoiceDollar,
  faChartLine,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

// Helper function to get asset type icon
const getAssetTypeIcon = (typeName) => {
  const iconMap = {
    'Land': faLandmark,
    'Buildings': faBuilding,
    'Vehicles': faCar,
    'Furniture': faCouch,
    'Computer Equipment': faLaptop,
    'Office Equipment': faPrint,
    'Laboratory Equipment': faFlask,
    'Sports Equipment': faFootballBall
  };
  return iconMap[typeName] || faBox;
};

const FixedAssets = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);
  const [limit] = useState(25);

  // Add Asset Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [selectedAssetType, setSelectedAssetType] = useState(null);
  const [dynamicFields, setDynamicFields] = useState([]);

  // View Asset Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [viewModalLoading, setViewModalLoading] = useState(false);
  const [viewModalError, setViewModalError] = useState('');

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: 'Bank Transfer',
    payment_account_code: '1000',
    reference_number: '',
    description: ''
  });
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Edit details modal state (from view modal)
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(false);
  const [assetForm, setAssetForm] = useState({
    asset_name: '',
    description: '',
    location: '',
    registration_number: '',
    serial_number: '',
    supplier_name: ''
  });

  // Edit Asset Modal states (full edit from table)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssetFull, setEditingAssetFull] = useState(false);
  const [editAssetId, setEditAssetId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    asset_type_id: '',
    asset_name: '',
    description: '',
    purchase_date: '',
    total_cost: '',
    supplier_name: '',
    registration_number: '',
    location: '',
    serial_number: '',
    status: 'Active',
    condition: '',
    custom_fields: {},
    enable_depreciation: false,
    depreciation_method: 'Straight Line',
    useful_life_years: '',
    salvage_value: '0'
  });
  const [editDynamicFields, setEditDynamicFields] = useState([]);
  const [editSelectedAssetType, setEditSelectedAssetType] = useState(null);

  // Delete Asset Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [deletingAsset, setDeletingAsset] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ message: null, type: 'success', visible: false });

  const [formData, setFormData] = useState({
    asset_type_id: '',
    asset_name: '',
    description: '',
    purchase_date: '',
    total_cost: '',
    supplier_name: '',
    registration_number: '',
    location: '',
    serial_number: '',
    status: 'Active',
    condition: '',
    custom_fields: {},
    enable_depreciation: false,
    depreciation_method: 'Straight Line',
    useful_life_years: '',
    salvage_value: '0',
    is_opening_balance: false,
    opening_balance_date: '',
    amount_paid: '0',
    payment_method: 'Bank Transfer'
  });

  useEffect(() => {
    fetchAssetTypes();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [currentPage, activeSearchTerm, typeFilter, statusFilter]);

  useEffect(() => {
    if (formData.asset_type_id) {
      const type = assetTypes.find(t => t.id === parseInt(formData.asset_type_id));
      setSelectedAssetType(type);
    } else {
      setSelectedAssetType(null);
    }
  }, [formData.asset_type_id, assetTypes]);

  const fetchAssetTypes = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/assets/types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAssetTypes(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching asset types:', err);
    }
  };

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: limit
      };

      if (activeSearchTerm) {
        params.search = activeSearchTerm;
      }
      if (typeFilter) {
        params.asset_type_id = typeFilter;
      }
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await axios.get(`${BASE_URL}/assets`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setAssets(response.data.data || []);
        setTotalPages(response.data.pagination?.total_pages || 1);
        setTotalAssets(response.data.pagination?.total_items || response.data.data?.length || 0);
      } else {
        setError(response.data.error || 'Failed to fetch assets');
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError(err.response?.data?.error || 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleClearTypeFilter = () => {
    setTypeFilter('');
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleClearStatusFilter = () => {
    setStatusFilter('');
    setCurrentPage(1);
  };

  const handleViewAsset = async (assetId) => {
    setShowViewModal(true);
    setViewModalLoading(true);
    setViewModalError('');
    try {
      const response = await axios.get(`${BASE_URL}/assets/${assetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const assetData = response.data.data;
      setSelectedAsset(assetData);
      // Populate form for editing
      setAssetForm({
        asset_name: assetData.asset_name || '',
        description: assetData.description || '',
        location: assetData.location || '',
        registration_number: assetData.registration_number || '',
        serial_number: assetData.serial_number || '',
        supplier_name: assetData.supplier_name || ''
      });
    } catch (err) {
      setViewModalError(err.response?.data?.message || 'Failed to load asset details');
    } finally {
      setViewModalLoading(false);
    }
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedAsset(null);
    setViewModalError('');
    setShowPaymentModal(false);
    setShowEditDetailsModal(false);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      setPaymentLoading(true);
      setViewModalError('');
      await axios.post(
        `${BASE_URL}/assets/${selectedAsset.id}/payments`,
        paymentForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowPaymentModal(false);
      setPaymentForm({
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method: 'Bank Transfer',
        payment_account_code: '1000',
        reference_number: '',
        description: ''
      });
      
      showToast('Payment recorded successfully.', 'success');
      // Refresh asset details
      await handleViewAsset(selectedAsset.id);
      fetchAssets(); // Refresh the list
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to process payment';
      setViewModalError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleAssetUpdate = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      setEditingAsset(true);
      await axios.put(
        `${BASE_URL}/assets/${selectedAsset.id}`,
        assetForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowEditDetailsModal(false);
      showToast('Asset details updated successfully.', 'success');
      // Refresh asset details
      await handleViewAsset(selectedAsset.id);
      fetchAssets(); // Refresh the list
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update asset';
      setViewModalError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setEditingAsset(false);
    }
  };

  const handleEditAsset = async (assetId) => {
    setEditAssetId(assetId);
    setShowEditModal(true);
    setEditingAssetFull(false);
    try {
      const response = await axios.get(`${BASE_URL}/assets/${assetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const assetData = response.data.data;
      
      // Populate edit form
      setEditFormData({
        asset_type_id: assetData.asset_type_id || '',
        asset_name: assetData.asset_name || '',
        description: assetData.description || '',
        purchase_date: assetData.purchase_date ? assetData.purchase_date.split('T')[0] : '',
        total_cost: assetData.total_cost || '',
        supplier_name: assetData.supplier_name || '',
        registration_number: assetData.registration_number || '',
        location: assetData.location || '',
        serial_number: assetData.serial_number || '',
        status: assetData.status || 'Active',
        condition: assetData.condition || '',
        custom_fields: assetData.custom_fields || {},
        enable_depreciation: assetData.enable_depreciation || false,
        depreciation_method: assetData.depreciation_method || 'Straight Line',
        useful_life_years: assetData.useful_life_years || '',
        salvage_value: assetData.salvage_value || '0'
      });

      // Set selected asset type
      const type = assetTypes.find(t => t.id === assetData.asset_type_id);
      setEditSelectedAssetType(type);

      // Populate dynamic fields from custom_fields
      if (assetData.custom_fields && Object.keys(assetData.custom_fields).length > 0) {
        const fields = Object.entries(assetData.custom_fields).map(([name, value]) => ({
          name,
          value: String(value)
        }));
        setEditDynamicFields(fields);
      } else {
        setEditDynamicFields([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load asset for editing');
      setShowEditModal(false);
    }
  };

  const handleDeleteAsset = (asset) => {
    setAssetToDelete(asset);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;
    try {
      setDeletingAsset(true);
      await axios.delete(`${BASE_URL}/assets/${assetToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowDeleteModal(false);
      setAssetToDelete(null);
      showToast('Asset deleted successfully.', 'success');
      fetchAssets(); // Refresh the list
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to delete asset';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setDeletingAsset(false);
    }
  };

  const handleEditAssetSubmit = async (e) => {
    e.preventDefault();
    if (!editAssetId) return;
    try {
      setEditingAssetFull(true);
      const submitData = {
        ...editFormData,
        total_cost: parseFloat(editFormData.total_cost),
        useful_life_years: editFormData.enable_depreciation ? parseInt(editFormData.useful_life_years) : null,
        salvage_value: editFormData.enable_depreciation ? parseFloat(editFormData.salvage_value || 0) : 0
      };

      await axios.put(`${BASE_URL}/assets/${editAssetId}`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowEditModal(false);
      setEditAssetId(null);
      showToast('Asset updated successfully.', 'success');
      fetchAssets(); // Refresh the list
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to update asset';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setEditingAssetFull(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditAssetId(null);
    setEditFormData({
      asset_type_id: '',
      asset_name: '',
      description: '',
      purchase_date: '',
      total_cost: '',
      supplier_name: '',
      registration_number: '',
      location: '',
      serial_number: '',
      status: 'Active',
      condition: '',
      custom_fields: {},
      enable_depreciation: false,
      depreciation_method: 'Straight Line',
      useful_life_years: '',
      salvage_value: '0'
    });
    setEditDynamicFields([]);
    setEditSelectedAssetType(null);
  };

  useEffect(() => {
    if (editFormData.asset_type_id) {
      const type = assetTypes.find(t => t.id === parseInt(editFormData.asset_type_id));
      setEditSelectedAssetType(type);
    } else {
      setEditSelectedAssetType(null);
    }
  }, [editFormData.asset_type_id, assetTypes]);

  // Toast notification functions
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

  // Add Asset Modal functions
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
    setDynamicFields([]);
    setFormData({
      asset_type_id: '',
      asset_name: '',
      description: '',
      purchase_date: '',
      total_cost: '',
      supplier_name: '',
      registration_number: '',
      location: '',
      serial_number: '',
      status: 'Active',
      condition: '',
      custom_fields: {},
      enable_depreciation: false,
      depreciation_method: 'Straight Line',
      useful_life_years: '',
      salvage_value: '0',
      is_opening_balance: false,
      opening_balance_date: '',
      amount_paid: '0',
      payment_method: 'Bank Transfer'
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addDynamicField = () => {
    setDynamicFields([...dynamicFields, { name: '', value: '' }]);
  };

  const updateDynamicField = (index, field, value) => {
    const updated = [...dynamicFields];
    updated[index][field] = value;
    setDynamicFields(updated);
    
    const customFields = {};
    updated.forEach(f => {
      if (f.name && f.value) {
        customFields[f.name] = f.value;
      }
    });
    setFormData(prev => ({
      ...prev,
      custom_fields: { ...prev.custom_fields, ...customFields }
    }));
  };

  const removeDynamicField = (index) => {
    const updated = dynamicFields.filter((_, i) => i !== index);
    setDynamicFields(updated);
    
    const customFields = {};
    updated.forEach(f => {
      if (f.name && f.value) {
        customFields[f.name] = f.value;
      }
    });
    setFormData(prev => ({
      ...prev,
      custom_fields: customFields
    }));
  };

  const handleCustomFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [fieldName]: value
      }
    }));
  };

  const renderCustomField = (field) => {
    const value = formData.custom_fields[field.field_name] || '';

    switch (field.field_type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
            className="form-control"
            required={field.is_required}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
            className="form-control"
            required={field.is_required}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
            className="form-control"
            required={field.is_required}
          />
        );
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
            className="form-control"
            rows="3"
            required={field.is_required}
          />
        );
      case 'select':
        const options = field.field_options ? JSON.parse(field.field_options) : [];
        return (
          <select
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
            className="form-control"
            required={field.is_required}
          >
            <option value="">Select...</option>
            {options.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value === true || value === 'true'}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
        );
      default:
        return null;
    }
  };

  const isFormValid = () => {
    return formData.asset_type_id && formData.asset_name && formData.purchase_date && formData.total_cost;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      const submitData = {
        ...formData,
        total_cost: parseFloat(formData.total_cost),
        amount_paid: parseFloat(formData.amount_paid || 0),
        useful_life_years: formData.enable_depreciation ? parseInt(formData.useful_life_years) : null,
        salvage_value: formData.enable_depreciation ? parseFloat(formData.salvage_value || 0) : 0
      };

      const response = await axios.post(`${BASE_URL}/assets`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        await fetchAssets();
        handleCloseModal();
        showToast('Asset created successfully.', 'success');
      } else {
        const errorMsg = response.data.error || 'Failed to create asset';
        setFormError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('Error creating asset:', err);
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
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': { background: '#d1fae5', color: '#065f46' },
      'Disposed': { background: '#f3f4f6', color: '#374151' },
      'Lost': { background: '#fee2e2', color: '#991b1b' },
      'Damaged': { background: '#fed7aa', color: '#9a3412' },
      'Under Repair': { background: '#fef3c7', color: '#92400e' }
    };
    return colors[status] || { background: '#f3f4f6', color: '#374151' };
  };

  const displayStart = assets.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalAssets);

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
          <h2 className="report-title">Fixed Assets</h2>
          <p className="report-subtitle">Manage school property, vehicles, and equipment.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => navigate('/dashboard/assets/configurations')}
            className="modal-btn modal-btn-secondary"
            style={{ marginRight: '8px' }}
          >
            <FontAwesomeIcon icon={faCog} />
            Configurations
          </button>
          <button
            onClick={handleOpenModal}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Asset
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
                placeholder="Search by asset code, name, or registration number..."
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
          
          {/* Asset Type Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Type:</label>
            <select
              value={typeFilter}
              onChange={handleTypeFilterChange}
              className="filter-input"
              style={{ minWidth: '150px', width: '150px' }}
            >
              <option value="">All Types</option>
              {assetTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            {typeFilter && (
              <button
                onClick={handleClearTypeFilter}
                style={{
                  marginLeft: '8px',
                  padding: '6px 10px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)'
                }}
                title="Clear type filter"
              >
                ×
              </button>
            )}
          </div>
          
          {/* Status Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Status:</label>
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="filter-input"
              style={{ minWidth: '150px', width: '150px' }}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Disposed">Disposed</option>
              <option value="Lost">Lost</option>
              <option value="Damaged">Damaged</option>
              <option value="Under Repair">Under Repair</option>
            </select>
            {statusFilter && (
              <button
                onClick={handleClearStatusFilter}
                style={{
                  marginLeft: '8px',
                  padding: '6px 10px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)'
                }}
                title="Clear status filter"
              >
                ×
              </button>
            )}
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
        {loading && assets.length === 0 ? (
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
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading assets...</p>
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
                <th style={{ padding: '6px 10px' }}>ASSET CODE</th>
                <th style={{ padding: '6px 10px' }}>ASSET NAME</th>
                <th style={{ padding: '6px 10px' }}>TYPE</th>
                <th style={{ padding: '6px 10px' }}>PURCHASE DATE</th>
                <th style={{ padding: '6px 10px' }}>TOTAL COST</th>
                <th style={{ padding: '6px 10px' }}>PAID</th>
                <th style={{ padding: '6px 10px' }}>OUTSTANDING</th>
                <th style={{ padding: '6px 10px' }}>STATUS</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, index) => (
                <tr 
                  key={asset.id} 
                  style={{ 
                    height: '32px', 
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>
                    {asset.asset_code}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ fontWeight: 500 }}>{asset.asset_name}</div>
                    {asset.registration_number && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Reg: {asset.registration_number}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {asset.asset_type_name || '-'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {formatDate(asset.purchase_date)}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {formatCurrency(asset.total_cost)}
                  </td>
                  <td style={{ padding: '4px 10px', color: '#10b981' }}>
                    {formatCurrency(asset.amount_paid)}
                  </td>
                  <td style={{ padding: '4px 10px', color: '#f59e0b' }}>
                    {formatCurrency(asset.outstanding_balance)}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        ...getStatusColor(asset.status)
                      }}
                    >
                      {asset.status || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleViewAsset(asset.id)}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="View"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        onClick={() => handleEditAsset(asset.id)}
                        style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset)}
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
              {Array.from({ length: Math.max(0, 25 - assets.length) }).map((_, index) => (
                <tr 
                  key={`empty-${index}`}
                  style={{ 
                    height: '32px', 
                    backgroundColor: (assets.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6' 
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
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer - Separate Container */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {totalAssets || 0} results.
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

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '800px', minHeight: isLoading ? '400px' : 'auto', maxHeight: '95vh', overflowY: 'auto' }}
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
                  <p>Loading...</p>
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
                  <h3 className="modal-title">Add Asset</h3>
                  <button className="modal-close-btn" onClick={handleCloseModal}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <div className="modal-body">
                  {formError && (
                    <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                      {formError}
                    </div>
                  )}
                  
                  <form onSubmit={handleSave} className="modal-form">
                    {/* Asset Information Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faWarehouse} style={{ color: '#2563eb' }} />
                        Asset Information
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">
                            Asset Type <span className="required">*</span>
                          </label>
                          <select
                            name="asset_type_id"
                            className="form-control"
                            value={formData.asset_type_id}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Select Asset Type</option>
                            {assetTypes.map(type => (
                              <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">
                            Asset Name <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            name="asset_name"
                            className="form-control"
                            placeholder="e.g., Toyota Hilux ABC-1234"
                            value={formData.asset_name}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">Description</label>
                          <textarea
                            name="description"
                            className="form-control"
                            rows="2"
                            placeholder="Additional details about the asset..."
                            value={formData.description}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Purchase Details Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faDollarSign} style={{ color: '#10b981' }} />
                        Purchase Details
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">
                            Purchase Date <span className="required">*</span>
                          </label>
                          <input
                            type="date"
                            name="purchase_date"
                            className="form-control"
                            value={formData.purchase_date}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">
                            Total Cost (USD) <span className="required">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            name="total_cost"
                            className="form-control"
                            placeholder="0.00"
                            value={formData.total_cost}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">Supplier Name</label>
                          <input
                            type="text"
                            name="supplier_name"
                            className="form-control"
                            placeholder="Name of supplier/vendor"
                            value={formData.supplier_name}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Asset Details Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#6366f1' }} />
                        Asset Details
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        {selectedAssetType?.requires_registration && (
                          <div className="form-group">
                            <label className="form-label">Registration Number</label>
                            <input
                              type="text"
                              name="registration_number"
                              className="form-control"
                              placeholder="e.g., ABC-1234"
                              value={formData.registration_number}
                              onChange={handleInputChange}
                            />
                          </div>
                        )}

                        {selectedAssetType?.requires_serial_number && (
                          <div className="form-group">
                            <label className="form-label">Serial Number</label>
                            <input
                              type="text"
                              name="serial_number"
                              className="form-control"
                              placeholder="e.g., SN123456789"
                              value={formData.serial_number}
                              onChange={handleInputChange}
                            />
                          </div>
                        )}

                        <div className="form-group">
                          <label className="form-label">Location</label>
                          <input
                            type="text"
                            name="location"
                            className="form-control"
                            placeholder="Where is this asset located?"
                            value={formData.location}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Status</label>
                          <select
                            name="status"
                            className="form-control"
                            value={formData.status}
                            onChange={handleInputChange}
                          >
                            <option value="Active">Active</option>
                            <option value="Disposed">Disposed</option>
                            <option value="Lost">Lost</option>
                            <option value="Damaged">Damaged</option>
                            <option value="Under Repair">Under Repair</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Condition</label>
                          <select
                            name="condition"
                            className="form-control"
                            value={formData.condition}
                            onChange={handleInputChange}
                          >
                            <option value="">Select Condition</option>
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Poor">Poor</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Custom Details Section */}
                    {dynamicFields.length > 0 && (
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Custom Details
                          </h4>
                          <button
                            type="button"
                            onClick={addDynamicField}
                            className="modal-btn"
                            style={{ background: '#2563eb', color: 'white', padding: '6px 12px', fontSize: '0.7rem' }}
                          >
                            <FontAwesomeIcon icon={faPlus} style={{ marginRight: '4px' }} />
                            Add Field
                          </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {dynamicFields.map((field, index) => (
                            <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
                              <input
                                type="text"
                                value={field.name}
                                onChange={(e) => updateDynamicField(index, 'name', e.target.value)}
                                placeholder="Field name (e.g., Color)"
                                className="form-control"
                              />
                              <input
                                type="text"
                                value={field.value}
                                onChange={(e) => updateDynamicField(index, 'value', e.target.value)}
                                placeholder="Value (e.g., Red)"
                                className="form-control"
                              />
                              <button
                                type="button"
                                onClick={() => removeDynamicField(index)}
                                style={{ 
                                  background: '#dc2626', 
                                  color: 'white', 
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.7rem'
                                }}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Fields from Asset Type */}
                    {selectedAssetType && selectedAssetType.custom_fields && selectedAssetType.custom_fields.length > 0 && (
                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Additional Information
                        </h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                          {selectedAssetType.custom_fields.map(field => (
                            <div key={field.id} className={field.field_type === 'textarea' ? 'form-group' : 'form-group'} style={field.field_type === 'textarea' ? { gridColumn: '1 / -1' } : {}}>
                              <label className="form-label">
                                {field.field_label}
                                {field.is_required && <span className="required">*</span>}
                              </label>
                              {renderCustomField(field)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Opening Balance Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <input
                          type="checkbox"
                          name="is_opening_balance"
                          checked={formData.is_opening_balance}
                          onChange={handleInputChange}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <label className="form-label" style={{ margin: 0 }}>
                          This is a historical asset (opening balance)
                        </label>
                      </div>

                      {formData.is_opening_balance && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', padding: '16px', background: '#eff6ff', borderRadius: '4px' }}>
                          <div className="form-group">
                            <label className="form-label">Opening Balance Date</label>
                            <input
                              type="date"
                              name="opening_balance_date"
                              className="form-control"
                              value={formData.opening_balance_date}
                              onChange={handleInputChange}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Amount Already Paid (USD)</label>
                            <input
                              type="number"
                              step="0.01"
                              name="amount_paid"
                              className="form-control"
                              placeholder="0.00"
                              value={formData.amount_paid}
                              onChange={handleInputChange}
                            />
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              Outstanding: ${(parseFloat(formData.total_cost || 0) - parseFloat(formData.amount_paid || 0)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Depreciation Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <input
                          type="checkbox"
                          name="enable_depreciation"
                          checked={formData.enable_depreciation}
                          onChange={handleInputChange}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <label className="form-label" style={{ margin: 0 }}>
                          Enable depreciation tracking (optional)
                        </label>
                      </div>

                      {formData.enable_depreciation && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '16px', background: '#f9fafb', borderRadius: '4px' }}>
                          <div className="form-group">
                            <label className="form-label">Depreciation Method</label>
                            <select
                              name="depreciation_method"
                              className="form-control"
                              value={formData.depreciation_method}
                              onChange={handleInputChange}
                            >
                              <option value="Straight Line">Straight Line</option>
                              <option value="Declining Balance">Declining Balance</option>
                              <option value="Units of Production">Units of Production</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Useful Life (years)</label>
                            <input
                              type="number"
                              name="useful_life_years"
                              className="form-control"
                              placeholder="e.g., 5"
                              value={formData.useful_life_years}
                              onChange={handleInputChange}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Salvage Value (USD)</label>
                            <input
                              type="number"
                              step="0.01"
                              name="salvage_value"
                              className="form-control"
                              placeholder="0.00"
                              value={formData.salvage_value}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      )}
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
                    {isLoading ? 'Creating...' : 'Create Asset'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* View Asset Modal */}
      {showViewModal && (
        <div className="modal-overlay" onClick={handleCloseViewModal}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '900px', minHeight: viewModalLoading ? '400px' : 'auto' }}
          >
            {viewModalLoading ? (
              // Loading State
              <>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ height: '20px', width: '200px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ width: '18px', height: '18px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
                <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: '1', minHeight: '300px' }}>
                  <div className="loading-spinner"></div>
                  <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading asset details...</p>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <div style={{ height: '32px', width: '80px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
              </>
            ) : selectedAsset ? (
              // Content State
              <>
                <div className="modal-header">
                  <h3 className="modal-title" style={{ color: '#000000', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FontAwesomeIcon icon={getAssetTypeIcon(selectedAsset.asset_type_name)} style={{ color: '#2563eb' }} />
                    {selectedAsset.asset_name}
                    <span className="px-2 py-1 text-xs rounded" style={{ marginLeft: '8px', ...getStatusColor(selectedAsset.status) }}>
                      {selectedAsset.status}
                    </span>
                  </h3>
                  <button className="modal-close-btn" onClick={handleCloseViewModal}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div className="modal-body">
                  {viewModalError && (
                    <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px', border: '1px solid #fecaca' }}>
                      {viewModalError}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Asset Information Section */}
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faBox} style={{ color: '#2563eb' }} />
                        Asset Information
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Asset Code
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {selectedAsset.asset_code || 'N/A'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Asset Type
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FontAwesomeIcon icon={getAssetTypeIcon(selectedAsset.asset_type_name)} style={{ color: '#6366f1', fontSize: '0.75rem' }} />
                            {selectedAsset.asset_type_name || 'N/A'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Purchase Date
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FontAwesomeIcon icon={faCalendarAlt} style={{ color: '#6366f1', fontSize: '0.75rem' }} />
                            {formatDate(selectedAsset.purchase_date)}
                          </div>
                        </div>

                        {selectedAsset.location && (
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              Location
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#6366f1', fontSize: '0.75rem' }} />
                              {selectedAsset.location}
                            </div>
                          </div>
                        )}

                        {selectedAsset.registration_number && (
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              Registration Number
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                              {selectedAsset.registration_number}
                            </div>
                          </div>
                        )}

                        {selectedAsset.serial_number && (
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              Serial Number
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                              {selectedAsset.serial_number}
                            </div>
                          </div>
                        )}

                        {selectedAsset.supplier_name && (
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              Supplier
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                              {selectedAsset.supplier_name}
                            </div>
                          </div>
                        )}

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Condition
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {selectedAsset.condition || 'N/A'}
                          </div>
                        </div>

                        {selectedAsset.description && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              Description
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                              {selectedAsset.description}
                            </div>
                          </div>
                        )}

                        {/* Custom Fields */}
                        {selectedAsset.custom_fields && Object.keys(selectedAsset.custom_fields).length > 0 && (
                          <div style={{ gridColumn: '1 / -1', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                              Additional Information
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                              {Object.entries(selectedAsset.custom_fields).map(([key, value]) => (
                                <div key={key}>
                                  <div style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                    {key.replace(/_/g, ' ')}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                                    {value || 'N/A'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financial Information Section */}
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faDollarSign} style={{ color: '#10b981' }} />
                        Financial Information
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Total Cost
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                            {formatCurrency(selectedAsset.total_cost)}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Currency
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {selectedAsset.currency_code || 'USD'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Amount Paid
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>
                            {formatCurrency(selectedAsset.amount_paid)}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Outstanding Balance
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: '600' }}>
                            {formatCurrency(selectedAsset.outstanding_balance)}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Payment Progress
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {((selectedAsset.amount_paid / selectedAsset.total_cost) * 100).toFixed(1)}%
                          </div>
                          <div style={{ width: '100%', background: '#e5e7eb', height: '8px', borderRadius: '4px', marginTop: '6px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${(selectedAsset.amount_paid / selectedAsset.total_cost) * 100}%`,
                                background: '#10b981',
                                height: '100%',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </div>
                        </div>

                        {selectedAsset.is_opening_balance && (
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              Opening Balance Date
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                              {formatDate(selectedAsset.opening_balance_date)}
                            </div>
                          </div>
                        )}

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Chart of Account
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {selectedAsset.coa_account_code} - {selectedAsset.coa_account_name}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment History Section */}
                    {selectedAsset.payments && selectedAsset.payments.length > 0 && (
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FontAwesomeIcon icon={faReceipt} style={{ color: '#f59e0b' }} />
                          Payment History
                        </h4>

                        <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
                          <thead>
                            <tr>
                              <th style={{ padding: '6px 10px' }}>DATE</th>
                              <th style={{ padding: '6px 10px' }}>AMOUNT</th>
                              <th style={{ padding: '6px 10px' }}>METHOD</th>
                              <th style={{ padding: '6px 10px' }}>REFERENCE</th>
                              <th style={{ padding: '6px 10px' }}>DESCRIPTION</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedAsset.payments.map((payment, index) => (
                              <tr key={payment.id || index} style={{ backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' }}>
                                <td style={{ padding: '6px 10px' }}>{formatDate(payment.payment_date)}</td>
                                <td style={{ padding: '6px 10px', fontWeight: '600', color: '#10b981' }}>
                                  {formatCurrency(payment.amount)}
                                </td>
                                <td style={{ padding: '6px 10px' }}>{payment.payment_method || '—'}</td>
                                <td style={{ padding: '6px 10px' }}>{payment.reference_number || '—'}</td>
                                <td style={{ padding: '6px 10px' }}>{payment.description || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Depreciation Section */}
                    {selectedAsset.depreciation_method && (
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FontAwesomeIcon icon={faChartLine} style={{ color: '#6366f1' }} />
                          Depreciation Information
                        </h4>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              Depreciation Method
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                              {selectedAsset.depreciation_method}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              Useful Life
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                              {selectedAsset.useful_life_years} years
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              Salvage Value
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                              {formatCurrency(selectedAsset.salvage_value)}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              Depreciable Amount
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                              {formatCurrency(selectedAsset.total_cost - (selectedAsset.salvage_value || 0))}
                            </div>
                          </div>

                          {selectedAsset.depreciation_method === 'Straight Line' && (
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                Annual Depreciation
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                                {formatCurrency((selectedAsset.total_cost - (selectedAsset.salvage_value || 0)) / selectedAsset.useful_life_years)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={handleCloseViewModal}>
                    Close
                  </button>
                  <button
                    className="modal-btn modal-btn-secondary"
                    onClick={() => setShowEditDetailsModal(true)}
                  >
                    <FontAwesomeIcon icon={faEdit} style={{ marginRight: '6px' }} />
                    Edit Details
                  </button>
                  {selectedAsset.outstanding_balance > 0 && (
                    <button
                      className="modal-btn modal-btn-confirm"
                      onClick={() => {
                        setViewModalError('');
                        setShowPaymentModal(true);
                      }}
                      style={{ background: '#10b981' }}
                    >
                      <FontAwesomeIcon icon={faDollarSign} style={{ marginRight: '6px' }} />
                      Make Payment
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedAsset && (
        <div className="modal-overlay" onClick={() => !paymentLoading && setShowPaymentModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Make Payment</h3>
              <button type="button" className="modal-close-btn" onClick={() => !paymentLoading && setShowPaymentModal(false)} disabled={paymentLoading}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {viewModalError && (
                <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                  {viewModalError}
                </div>
              )}
              <form onSubmit={handlePaymentSubmit} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Payment Date <span className="required">*</span></label>
                  <input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    required
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Amount <span className="required">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    required
                    max={selectedAsset.outstanding_balance}
                    className="form-control"
                    placeholder="0.00"
                  />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Outstanding: {formatCurrency(selectedAsset.outstanding_balance)}
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment From <span className="required">*</span></label>
                  <select
                    value={paymentForm.payment_account_code}
                    onChange={(e) => {
                      const code = e.target.value;
                      const method = code === '1000' ? 'Cash' : 'Bank Transfer';
                      setPaymentForm({ ...paymentForm, payment_account_code: code, payment_method: method });
                    }}
                    required
                    className="form-control"
                  >
                    <option value="1000">Cash</option>
                    <option value="1010">Bank Account</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Reference Number</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={paymentForm.reference_number}
                      onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                      className="form-control"
                      placeholder="Optional"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const ref = `PAY-${selectedAsset.asset_code}-${Date.now()}`;
                        setPaymentForm({ ...paymentForm, reference_number: ref });
                      }}
                      className="modal-btn modal-btn-secondary"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={paymentForm.description}
                    onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                    className="form-control"
                    rows="3"
                    placeholder="Payment notes..."
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowPaymentModal(false)} disabled={paymentLoading}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn modal-btn-confirm" disabled={paymentLoading}>
                    {paymentLoading ? 'Processing...' : 'Submit Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Asset Details Modal */}
      {showEditDetailsModal && selectedAsset && (
        <div className="modal-overlay" onClick={() => !editingAsset && setShowEditDetailsModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Asset Details</h3>
              <button type="button" className="modal-close-btn" onClick={() => !editingAsset && setShowEditDetailsModal(false)} disabled={editingAsset}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {viewModalError && (
                <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                  {viewModalError}
                </div>
              )}
              <form onSubmit={handleAssetUpdate} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Asset Name <span className="required">*</span></label>
                  <input
                    type="text"
                    value={assetForm.asset_name}
                    onChange={(e) => setAssetForm({ ...assetForm, asset_name: e.target.value })}
                    required
                    className="form-control"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      value={assetForm.location}
                      onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
                      className="form-control"
                      placeholder="Where is this asset located?"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Registration Number</label>
                    <input
                      type="text"
                      value={assetForm.registration_number}
                      onChange={(e) => setAssetForm({ ...assetForm, registration_number: e.target.value })}
                      className="form-control"
                      placeholder="e.g., ABC-1234"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Serial Number</label>
                    <input
                      type="text"
                      value={assetForm.serial_number}
                      onChange={(e) => setAssetForm({ ...assetForm, serial_number: e.target.value })}
                      className="form-control"
                      placeholder="e.g., SN123456789"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Supplier Name</label>
                    <input
                      type="text"
                      value={assetForm.supplier_name}
                      onChange={(e) => setAssetForm({ ...assetForm, supplier_name: e.target.value })}
                      className="form-control"
                      placeholder="Name of supplier/vendor"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={assetForm.description}
                    onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                    className="form-control"
                    rows="3"
                    placeholder="Additional details about the asset..."
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowEditDetailsModal(false)} disabled={editingAsset}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn modal-btn-confirm" disabled={editingAsset}>
                    {editingAsset ? 'Updating...' : 'Update Asset'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Asset Modal (Full Edit) */}
      {showEditModal && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Asset</h3>
              <button type="button" className="modal-close-btn" onClick={handleCloseEditModal} disabled={editingAssetFull}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body" style={{ overflow: 'auto' }}>
              {error && (
                <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                  {error}
                </div>
              )}
              <form onSubmit={handleEditAssetSubmit} className="modal-form">
                {/* Asset Information */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faBox} style={{ color: '#2563eb' }} />
                    Asset Information
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Asset Type <span className="required">*</span></label>
                      <select
                        name="asset_type_id"
                        value={editFormData.asset_type_id}
                        onChange={(e) => setEditFormData({ ...editFormData, asset_type_id: e.target.value })}
                        required
                        className="form-control"
                      >
                        <option value="">Select Asset Type</option>
                        {assetTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Asset Name <span className="required">*</span></label>
                      <input
                        type="text"
                        name="asset_name"
                        value={editFormData.asset_name}
                        onChange={(e) => setEditFormData({ ...editFormData, asset_name: e.target.value })}
                        required
                        className="form-control"
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Description</label>
                      <textarea
                        name="description"
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        className="form-control"
                        rows="2"
                      />
                    </div>
                  </div>
                </div>

                {/* Purchase Details */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faDollarSign} style={{ color: '#10b981' }} />
                    Purchase Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Purchase Date <span className="required">*</span></label>
                      <input
                        type="date"
                        name="purchase_date"
                        value={editFormData.purchase_date}
                        onChange={(e) => setEditFormData({ ...editFormData, purchase_date: e.target.value })}
                        required
                        className="form-control"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Total Cost <span className="required">*</span></label>
                      <input
                        type="number"
                        step="0.01"
                        name="total_cost"
                        value={editFormData.total_cost}
                        onChange={(e) => setEditFormData({ ...editFormData, total_cost: e.target.value })}
                        required
                        className="form-control"
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Supplier Name</label>
                      <input
                        type="text"
                        name="supplier_name"
                        value={editFormData.supplier_name}
                        onChange={(e) => setEditFormData({ ...editFormData, supplier_name: e.target.value })}
                        className="form-control"
                      />
                    </div>
                  </div>
                </div>

                {/* Asset Details */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#6366f1' }} />
                    Asset Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {editSelectedAssetType?.requires_registration && (
                      <div className="form-group">
                        <label className="form-label">Registration Number</label>
                        <input
                          type="text"
                          name="registration_number"
                          value={editFormData.registration_number}
                          onChange={(e) => setEditFormData({ ...editFormData, registration_number: e.target.value })}
                          className="form-control"
                        />
                      </div>
                    )}

                    {editSelectedAssetType?.requires_serial_number && (
                      <div className="form-group">
                        <label className="form-label">Serial Number</label>
                        <input
                          type="text"
                          name="serial_number"
                          value={editFormData.serial_number}
                          onChange={(e) => setEditFormData({ ...editFormData, serial_number: e.target.value })}
                          className="form-control"
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={editFormData.location}
                        onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                        className="form-control"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select
                        name="status"
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        className="form-control"
                      >
                        <option value="Active">Active</option>
                        <option value="Disposed">Disposed</option>
                        <option value="Lost">Lost</option>
                        <option value="Damaged">Damaged</option>
                        <option value="Under Repair">Under Repair</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Condition</label>
                      <select
                        name="condition"
                        value={editFormData.condition}
                        onChange={(e) => setEditFormData({ ...editFormData, condition: e.target.value })}
                        className="form-control"
                      >
                        <option value="">Select Condition</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Depreciation */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <input
                      type="checkbox"
                      name="enable_depreciation"
                      checked={editFormData.enable_depreciation}
                      onChange={(e) => setEditFormData({ ...editFormData, enable_depreciation: e.target.checked })}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <label className="form-label" style={{ margin: 0 }}>Enable Depreciation</label>
                  </div>

                  {editFormData.enable_depreciation && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                      <div className="form-group">
                        <label className="form-label">Depreciation Method</label>
                        <select
                          name="depreciation_method"
                          value={editFormData.depreciation_method}
                          onChange={(e) => setEditFormData({ ...editFormData, depreciation_method: e.target.value })}
                          className="form-control"
                        >
                          <option value="Straight Line">Straight Line</option>
                          <option value="Declining Balance">Declining Balance</option>
                          <option value="Units of Production">Units of Production</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Useful Life (years)</label>
                        <input
                          type="number"
                          name="useful_life_years"
                          value={editFormData.useful_life_years}
                          onChange={(e) => setEditFormData({ ...editFormData, useful_life_years: e.target.value })}
                          className="form-control"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Salvage Value</label>
                        <input
                          type="number"
                          step="0.01"
                          name="salvage_value"
                          value={editFormData.salvage_value}
                          onChange={(e) => setEditFormData({ ...editFormData, salvage_value: e.target.value })}
                          className="form-control"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="modal-btn modal-btn-cancel" onClick={handleCloseEditModal} disabled={editingAssetFull}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn modal-btn-confirm" disabled={editingAssetFull}>
                    {editingAssetFull ? 'Updating...' : 'Update Asset'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Asset Confirmation Modal */}
      {showDeleteModal && assetToDelete && (
        <div className="modal-overlay" onClick={() => !deletingAsset && setShowDeleteModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Delete</h3>
              <button type="button" className="modal-close-btn" onClick={() => !deletingAsset && setShowDeleteModal(false)} disabled={deletingAsset}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Are you sure you want to delete this asset?
              </p>
              <div style={{ padding: '12px', background: '#f3f4f6', borderRadius: '8px', fontSize: '0.8125rem', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Asset Code</div>
                    <div style={{ fontWeight: '600' }}>{assetToDelete.asset_code}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Asset Name</div>
                    <div style={{ fontWeight: '600' }}>{assetToDelete.asset_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Type</div>
                    <div style={{ fontWeight: '600' }}>{assetToDelete.asset_type_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Cost</div>
                    <div style={{ fontWeight: '600' }}>{formatCurrency(assetToDelete.total_cost)}</div>
                  </div>
                </div>
              </div>
              <div style={{ padding: '10px', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '6px', fontSize: '0.75rem', color: '#92400e' }}>
                <strong>Warning:</strong> This action cannot be undone. All associated data will be permanently deleted.
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowDeleteModal(false)} disabled={deletingAsset}>
                  Cancel
                </button>
                <button type="button" className="modal-btn modal-btn-confirm" onClick={handleConfirmDelete} disabled={deletingAsset} style={{ background: '#dc2626' }}>
                  {deletingAsset ? 'Deleting...' : 'Delete Asset'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification - top right */}
      {toast.visible && toast.message && (
        <div className="success-toast" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 2000 }}>
          <div className="success-toast-content" style={{ background: getToastBg(toast.type) }}>
            {getToastIcon(toast.type)}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedAssets;
