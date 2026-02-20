import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBox,
  faDollarSign,
  faCalendarAlt,
  faMapMarkerAlt,
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
  faEdit,
  faArrowLeft,
  faChartLine,
  faTag,
  faWarehouse
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';

const AssetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
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

  // Edit details modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(false);
  const [assetForm, setAssetForm] = useState({
    asset_name: '',
    description: '',
    location: '',
    registration_number: '',
    serial_number: '',
    supplier_name: ''
  });

  useEffect(() => {
    fetchAssetDetails();
  }, [id]);

  const fetchAssetDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/assets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const assetData = response.data.data;
      setAsset(assetData);
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
      setError(err.response?.data?.message || 'Failed to load asset details');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      setPaymentLoading(true);
      setError('');
      await axios.post(
        `${BASE_URL}/assets/${id}/payments`,
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
      
      fetchAssetDetails();
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to process payment';
      setError(errorMessage);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleAssetUpdate = async (e) => {
    e.preventDefault();
    try {
      setEditingAsset(true);
      await axios.put(
        `${BASE_URL}/assets/${id}`,
        assetForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowEditModal(false);
      fetchAssetDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update asset');
    } finally {
      setEditingAsset(false);
    }
  };

  const formatCurrency = (amount, currencyCode = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const statusClasses = {
      'Active': 'bg-green-100 text-green-800',
      'Disposed': 'bg-red-100 text-red-800',
      'Lost': 'bg-red-100 text-red-800',
      'Damaged': 'bg-orange-100 text-orange-800',
      'Under Repair': 'bg-yellow-100 text-yellow-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

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

  return (
    <div className="main-content-scrollable" style={{ padding: '20px' }}>
      {/* Header */}
      <div className="report-header" style={{ marginBottom: '20px' }}>
        <div className="report-header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/dashboard/assets')}
              className="modal-btn modal-btn-secondary"
              style={{ padding: '8px 12px' }}
            >
              <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: '6px' }} />
              Back
            </button>
            <h2 className="report-title">Fixed Asset Details</h2>
          </div>
          <p className="report-subtitle">View and manage asset information</p>
        </div>
        {asset && (
          <div className="report-header-right" style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowEditModal(true)}
              className="modal-btn modal-btn-secondary"
            >
              <FontAwesomeIcon icon={faEdit} style={{ marginRight: '6px' }} />
              Edit
            </button>
            {asset.outstanding_balance > 0 && (
              <button
                onClick={() => {
                  setError('');
                  setShowPaymentModal(true);
                }}
                className="modal-btn modal-btn-confirm"
                style={{ background: '#10b981' }}
              >
                <FontAwesomeIcon icon={faDollarSign} style={{ marginRight: '6px' }} />
                Make Payment
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          padding: '12px', 
          background: '#fee2e2', 
          color: '#dc2626', 
          fontSize: '0.75rem', 
          marginBottom: '16px', 
          borderRadius: '4px',
          border: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        // Loading State
        <div className="modal-dialog" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ height: '20px', width: '200px', background: '#e5e7eb', borderRadius: '4px' }}></div>
            <div style={{ width: '18px', height: '18px', background: '#e5e7eb', borderRadius: '4px' }}></div>
          </div>
          <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', minHeight: '400px' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading asset details...</p>
          </div>
        </div>
      ) : asset ? (
        // Content State
        <div className="modal-dialog" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="modal-header">
            <h3 className="modal-title" style={{ color: '#000000', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FontAwesomeIcon icon={getAssetTypeIcon(asset.asset_type_name)} style={{ color: '#2563eb' }} />
              {asset.asset_name}
              <span className={`px-2 py-1 text-xs rounded ${getStatusColor(asset.status)}`} style={{ marginLeft: '8px' }}>
                {asset.status}
              </span>
            </h3>
          </div>

          <div className="modal-body">
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
                      {asset.asset_code || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Asset Type
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FontAwesomeIcon icon={getAssetTypeIcon(asset.asset_type_name)} style={{ color: '#6366f1', fontSize: '0.75rem' }} />
                      {asset.asset_type_name || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Purchase Date
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FontAwesomeIcon icon={faCalendarAlt} style={{ color: '#6366f1', fontSize: '0.75rem' }} />
                      {formatDate(asset.purchase_date)}
                    </div>
                  </div>

                  {asset.location && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Location
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#6366f1', fontSize: '0.75rem' }} />
                        {asset.location}
                      </div>
                    </div>
                  )}

                  {asset.registration_number && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Registration Number
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {asset.registration_number}
                      </div>
                    </div>
                  )}

                  {asset.serial_number && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Serial Number
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {asset.serial_number}
                      </div>
                    </div>
                  )}

                  {asset.supplier_name && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Supplier
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {asset.supplier_name}
                      </div>
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Condition
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                      {asset.condition || 'N/A'}
                    </div>
                  </div>

                  {asset.description && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Description
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {asset.description}
                      </div>
                    </div>
                  )}

                  {/* Custom Fields */}
                  {asset.custom_fields && Object.keys(asset.custom_fields).length > 0 && (
                    <div style={{ gridColumn: '1 / -1', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        Additional Information
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                        {Object.entries(asset.custom_fields).map(([key, value]) => (
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
                      {formatCurrency(asset.total_cost, asset.currency_code)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Currency
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                      {asset.currency_code || 'USD'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Amount Paid
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>
                      {formatCurrency(asset.amount_paid, asset.currency_code)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Outstanding Balance
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: '600' }}>
                      {formatCurrency(asset.outstanding_balance, asset.currency_code)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Payment Progress
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                      {((asset.amount_paid / asset.total_cost) * 100).toFixed(1)}%
                    </div>
                    <div style={{ width: '100%', background: '#e5e7eb', height: '8px', borderRadius: '4px', marginTop: '6px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${(asset.amount_paid / asset.total_cost) * 100}%`,
                          background: '#10b981',
                          height: '100%',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  </div>

                  {asset.is_opening_balance && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Opening Balance Date
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {formatDate(asset.opening_balance_date)}
                      </div>
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Chart of Account
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                      {asset.coa_account_code} - {asset.coa_account_name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment History Section */}
              {asset.payments && asset.payments.length > 0 && (
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
                      {asset.payments.map((payment, index) => (
                        <tr key={payment.id || index} style={{ backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' }}>
                          <td style={{ padding: '6px 10px' }}>{formatDate(payment.payment_date)}</td>
                          <td style={{ padding: '6px 10px', fontWeight: '600', color: '#10b981' }}>
                            {formatCurrency(payment.amount, asset.currency_code)}
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
              {asset.depreciation_method && (
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
                        {asset.depreciation_method}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Useful Life
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {asset.useful_life_years} years
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Salvage Value
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {formatCurrency(asset.salvage_value, asset.currency_code)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Depreciable Amount
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                        {formatCurrency(asset.total_cost - (asset.salvage_value || 0), asset.currency_code)}
                      </div>
                    </div>

                    {asset.depreciation_method === 'Straight Line' && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          Annual Depreciation
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                          {formatCurrency((asset.total_cost - (asset.salvage_value || 0)) / asset.useful_life_years, asset.currency_code)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="modal-btn modal-btn-cancel" onClick={() => navigate('/dashboard/assets')}>
              Close
            </button>
          </div>
        </div>
      ) : null}

      {/* Payment Modal */}
      {showPaymentModal && asset && (
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
              {error && (
                <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                  {error}
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
                    max={asset.outstanding_balance}
                    className="form-control"
                    placeholder="0.00"
                  />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Outstanding: {formatCurrency(asset.outstanding_balance, asset.currency_code)}
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
                        const ref = `PAY-${asset.asset_code}-${Date.now()}`;
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
      {showEditModal && asset && (
        <div className="modal-overlay" onClick={() => !editingAsset && setShowEditModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Asset Details</h3>
              <button type="button" className="modal-close-btn" onClick={() => !editingAsset && setShowEditModal(false)} disabled={editingAsset}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
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
                  <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowEditModal(false)} disabled={editingAsset}>
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
    </div>
  );
};

export default AssetDetails;
