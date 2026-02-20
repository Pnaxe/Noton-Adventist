import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faSearch, faPlus, faEdit, faTrash, faUndo, faFileInvoiceDollar, faReceipt } from '@fortawesome/free-solid-svg-icons';

const AccountsPayable = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [payables, setPayables] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    currency_id: '',
    payment_date: '',
    payment_method: 'cash',
    description: ''
  });
  const [currencies, setCurrencies] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentModalError, setPaymentModalError] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPayableForView, setSelectedPayableForView] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const [showOpeningBalanceModal, setShowOpeningBalanceModal] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [openingBalanceForm, setOpeningBalanceForm] = useState({
    supplier_id: '',
    amount: '',
    description: '',
    reference_number: '',
    due_date: '',
    opening_balance_date: '',
    currency_id: 1
  });
  const [openingBalanceLoading, setOpeningBalanceLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReversePaymentModal, setShowReversePaymentModal] = useState(false);
  const [selectedPayableForEdit, setSelectedPayableForEdit] = useState(null);
  const [selectedPayableForDelete, setSelectedPayableForDelete] = useState(null);
  const [selectedPaymentToReverse, setSelectedPaymentToReverse] = useState(null);
  const [showReverseConfirmModal, setShowReverseConfirmModal] = useState(false);
  const [editForm, setEditForm] = useState({ description: '', due_date: '', reference_number: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);

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

  const fetchCurrencies = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/accounting/currencies`, { headers: { Authorization: `Bearer ${token}` } });
      setCurrencies(res.data.data || []);
    } catch {}
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/expenses/suppliers`, { headers: { Authorization: `Bearer ${token}` } });
      setSuppliers(res.data.data || []);
    } catch {}
  };

  const fetchPayables = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await axios.get(`${BASE_URL}/expenses/accounts-payable?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      setPayables(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError('Failed to load accounts payable');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/expenses/accounts-payable/summary`, { headers: { Authorization: `Bearer ${token}` } });
      setSummary(res.data.data || {});
    } catch {}
  };

  const fetchTransactions = async (payableId) => {
    try {
      setTransactionsLoading(true);
      const res = await axios.get(`${BASE_URL}/expenses/accounts-payable/${payableId}/payments`, { headers: { Authorization: `Bearer ${token}` } });
      setTransactions(res.data.data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
    fetchSuppliers();
    fetchPayables();
    fetchSummary();
  }, [page, pageSize, search, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleMakePayment = (payable) => {
    setSelectedPayable(payable);
    setPaymentForm({
      amount: payable.outstanding_balance,
      currency_id: payable.currency_id,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      description: `Payment for ${payable.expense_description}`
    });
    setPaymentModalError('');
    setShowPaymentModal(true);
  };

  const handleViewTransactions = async (payable) => {
    setSelectedPayableForView(payable);
    setShowViewModal(true);
    setTransactionsLoading(true);
    await fetchTransactions(payable.id);
  };

  const handleEdit = (payable) => {
    setSelectedPayableForEdit(payable);
    setEditForm({
      description: payable.description || '',
      due_date: payable.due_date || '',
      reference_number: payable.reference_number || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await axios.put(`${BASE_URL}/expenses/accounts-payable/${selectedPayableForEdit.id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowEditModal(false);
      fetchPayables();
      fetchSummary();
      showToast('Accounts payable updated successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update accounts payable', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = (payable) => {
    setSelectedPayableForDelete(payable);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPayableForDelete) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`${BASE_URL}/expenses/accounts-payable/${selectedPayableForDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowDeleteModal(false);
      fetchPayables();
      fetchSummary();
      showToast('Accounts payable deleted successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete accounts payable', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleReversePayment = async (payable) => {
    // Fetch transactions to show in modal
    await fetchTransactions(payable.id);
    setSelectedPayableForView(payable);
    setShowReversePaymentModal(true);
  };

  const handleReversePaymentClick = (payment) => {
    setSelectedPaymentToReverse(payment);
    setShowReverseConfirmModal(true);
  };

  const handleConfirmReversePayment = async () => {
    if (!selectedPayableForView || !selectedPaymentToReverse) return;
    setReverseLoading(true);
    try {
      await axios.post(
        `${BASE_URL}/expenses/accounts-payable/${selectedPayableForView.id}/payments/${selectedPaymentToReverse.id}/reverse`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowReverseConfirmModal(false);
      setShowReversePaymentModal(false);
      setSelectedPaymentToReverse(null);
      fetchPayables();
      fetchSummary();
      await fetchTransactions(selectedPayableForView.id);
      showToast('Payment reversed successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reverse payment', 'error');
    } finally {
      setReverseLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    setPaymentModalError('');
    try {
      await axios.post(`${BASE_URL}/expenses/accounts-payable/${selectedPayable.id}/pay`, {
        amount: parseFloat(paymentForm.amount),
        currency_id: selectedPayable.currency_id,
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        description: paymentForm.description
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowPaymentModal(false);
      fetchPayables();
      fetchSummary();
      showToast('Payment recorded successfully.', 'success');
    } catch (err) {
      setPaymentModalError(err.response?.data?.message || err.message || 'Payment failed');
      showToast(err.response?.data?.message || 'Payment failed', 'error');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleOpeningBalanceSubmit = async (e) => {
    e.preventDefault();
    setOpeningBalanceLoading(true);
    try {
      await axios.post(`${BASE_URL}/expenses/accounts-payable/opening-balance`, {
        supplier_id: openingBalanceForm.supplier_id || null,
        amount: parseFloat(openingBalanceForm.amount),
        description: openingBalanceForm.description,
        reference_number: openingBalanceForm.reference_number,
        due_date: openingBalanceForm.due_date || null,
        opening_balance_date: openingBalanceForm.opening_balance_date,
        currency_id: openingBalanceForm.currency_id
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowOpeningBalanceModal(false);
      setOpeningBalanceForm({
        supplier_id: '',
        amount: '',
        description: '',
        reference_number: '',
        due_date: '',
        opening_balance_date: '',
        currency_id: 1
      });
      fetchPayables();
      fetchSummary();
      showToast('Opening balance created successfully.', 'success');
    } catch (err) {
      console.error('Opening balance error:', err);
      showToast('Failed to create opening balance: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setOpeningBalanceLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'outstanding': return 'text-red-600 bg-red-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'paid': return 'text-green-600 bg-green-100';
      case 'overdue': return 'text-red-800 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount, currencyCode) => `${currencyCode} ${parseFloat(amount).toFixed(2)}`;

  const displayStart = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const displayEnd = Math.min(page * pageSize, total);

  return (
    <div className="reports-container" style={{ height: '100%', maxHeight: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Report Header - like Students */}
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          <h2 className="report-title">Liabilities</h2>
          <p className="report-subtitle">Manage accounts payable and outstanding payments.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button type="button" onClick={() => setShowOpeningBalanceModal(true)} className="btn-checklist">
            <FontAwesomeIcon icon={faPlus} />
            Opening Balance
          </button>
        </div>
      </div>

      {/* Filters - like Students */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} className="filter-group">
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by supplier, description..."
                className="filter-input search-input"
              />
            </div>
          </form>
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Status:</label>
            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              className="filter-input"
              style={{ minWidth: '140px' }}
            >
              <option value="">All</option>
              <option value="outstanding">Outstanding</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
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

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', flexShrink: 0 }}>{error}</div>
      )}

      {/* Table Container - like Students */}
      <div className="report-content-container ecl-table-container" style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '16px' }}>
            <div className="loading-spinner" />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading...</p>
          </div>
        ) : (
          <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--sidebar-bg)' }}>
              <tr>
                <th style={{ padding: '6px 10px' }}>PAYABLE TO</th>
                <th style={{ padding: '6px 10px' }}>DESCRIPTION</th>
                <th style={{ padding: '6px 10px' }}>ORIGINAL</th>
                <th style={{ padding: '6px 10px' }}>PAID</th>
                <th style={{ padding: '6px 10px' }}>OUTSTANDING</th>
                <th style={{ padding: '6px 10px' }}>STATUS</th>
                <th style={{ padding: '6px 10px' }}>DUE DATE</th>
                <th style={{ padding: '6px 10px', width: '110px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {payables.map((payable, index) => (
                <tr key={payable.id} style={{ height: '32px', backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' }}>
                  <td style={{ padding: '4px 10px' }}>{payable.payable_to || 'Non-Supplier'}</td>
                  <td style={{ padding: '4px 10px' }}>{payable.expense_description}</td>
                  <td style={{ padding: '4px 10px' }}>{formatCurrency(payable.original_amount, payable.currency_code)}</td>
                  <td style={{ padding: '4px 10px' }}>{formatCurrency(payable.paid_amount, payable.currency_code)}</td>
                  <td style={{ padding: '4px 10px', fontWeight: 600 }}>{formatCurrency(payable.outstanding_balance, payable.currency_code)}</td>
                  <td style={{ padding: '4px 10px' }}>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(payable.status)}`}>{payable.status}</span>
                  </td>
                  <td style={{ padding: '4px 10px' }}>{payable.due_date || '—'}</td>
                  <td style={{ padding: '4px 10px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button type="button" onClick={() => handleViewTransactions(payable)} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title="View Transactions">
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      {payable.status !== 'paid' && (
                        <button type="button" onClick={() => handleMakePayment(payable)} style={{ color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title="Make Payment">
                          Pay
                        </button>
                      )}
                      {payable.paid_amount > 0 && (
                        <button type="button" onClick={() => handleReversePayment(payable)} style={{ color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title="Reverse Payment">
                          <FontAwesomeIcon icon={faUndo} />
                        </button>
                      )}
                      <button type="button" onClick={() => handleEdit(payable)} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title="Edit">
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button type="button" onClick={() => handleDelete(payable)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title="Delete">
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, pageSize - payables.length) }).map((_, i) => (
                <tr key={`empty-${i}`} style={{ height: '32px', backgroundColor: (payables.length + i) % 2 === 0 ? '#fafafa' : '#f3f4f6' }}>
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

      {/* Footer - like Students */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {total} results.
        </div>
        <div className="table-footer-right">
          {total > pageSize ? (
            <div className="pagination-controls">
              <button type="button" className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
              <span className="pagination-info" style={{ fontSize: '0.7rem' }}>Page {page} of {Math.ceil(total / pageSize) || 1}</span>
              <button type="button" className="pagination-btn" onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))} disabled={page * pageSize >= total}>Next</button>
            </div>
          ) : (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>All data displayed</div>
          )}
        </div>
      </div>

      {/* Payment Modal - modal-overlay/dialog like Students */}
      {showPaymentModal && selectedPayable && (
        <div className="modal-overlay" onClick={() => { setShowPaymentModal(false); setPaymentModalError(''); }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Make Payment</h3>
              <button type="button" className="modal-close-btn" onClick={() => { setShowPaymentModal(false); setPaymentModalError(''); }} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="modal-body">
              {paymentModalError && (
                <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>{paymentModalError}</div>
              )}
              <form onSubmit={handlePaymentSubmit} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Amount <span className="required">*</span></label>
                  <input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))} className="form-control" required step="0.01" max={selectedPayable.outstanding_balance} />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Date <span className="required">*</span></label>
                  <input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))} className="form-control" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select value={paymentForm.payment_method} onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))} className="form-control">
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input type="text" value={paymentForm.description} onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))} className="form-control" />
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                  <button type="button" className="modal-btn modal-btn-cancel" onClick={() => { setShowPaymentModal(false); setPaymentModalError(''); }}>Cancel</button>
                  <button type="submit" className="modal-btn modal-btn-confirm" disabled={paymentLoading}>{paymentLoading ? 'Processing...' : 'Make Payment'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Transactions Modal - styled like Students modal */}
      {showViewModal && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', minHeight: transactionsLoading ? '400px' : 'auto' }}
          >
            {transactionsLoading ? (
              // Loading State
              <>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ height: '20px', width: '200px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ width: '18px', height: '18px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
                <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: '1', minHeight: '300px' }}>
                  <div className="loading-spinner"></div>
                  <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading payable details...</p>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <div style={{ height: '32px', width: '80px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
              </>
            ) : selectedPayableForView ? (
              // Content State
              <>
                <div className="modal-header">
                  <h3 className="modal-title" style={{ color: '#000000' }}>
                    Accounts Payable Details
                  </h3>
                  <button className="modal-close-btn" onClick={() => setShowViewModal(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div className="modal-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Payable Information Section */}
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#2563eb' }} />
                        Payable Information
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Payable To
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {selectedPayableForView.payable_to || 'Non-Supplier'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Status
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            <span className={`px-2 py-1 text-xs rounded ${getStatusColor(selectedPayableForView.status)}`}>{selectedPayableForView.status}</span>
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Original Amount
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {formatCurrency(selectedPayableForView.original_amount, selectedPayableForView.currency_code)}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Paid Amount
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>
                            {formatCurrency(selectedPayableForView.paid_amount, selectedPayableForView.currency_code)}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Outstanding Balance
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: '600' }}>
                            {formatCurrency(selectedPayableForView.outstanding_balance, selectedPayableForView.currency_code)}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Currency
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {selectedPayableForView.currency_code || 'USD'}
                          </div>
                        </div>

                        {selectedPayableForView.due_date && (
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              Due Date
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                              {new Date(selectedPayableForView.due_date).toLocaleDateString()}
                            </div>
                          </div>
                        )}

                        {selectedPayableForView.reference_number && (
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              Reference Number
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                              {selectedPayableForView.reference_number}
                            </div>
                          </div>
                        )}

                        {selectedPayableForView.description && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              Description
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                              {selectedPayableForView.description}
                            </div>
                          </div>
                        )}

                        {selectedPayableForView.expense_date && (
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              Expense Date
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                              {new Date(selectedPayableForView.expense_date).toLocaleDateString()}
                            </div>
                          </div>
                        )}

                        {selectedPayableForView.source_type && (
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                              Source Type
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                              {selectedPayableForView.source_type}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment History Section */}
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faReceipt} style={{ color: '#10b981' }} />
                        Payment History
                      </h4>

                      {transactions.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No payment transactions found.</p>
                      ) : (
                        <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
                          <thead>
                            <tr>
                              <th style={{ padding: '6px 10px' }}>DATE</th>
                              <th style={{ padding: '6px 10px' }}>AMOUNT</th>
                              <th style={{ padding: '6px 10px' }}>METHOD</th>
                              <th style={{ padding: '6px 10px' }}>DESCRIPTION</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.map((t, index) => (
                              <tr key={t.id} style={{ backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' }}>
                                <td style={{ padding: '6px 10px' }}>{new Date(t.payment_date).toLocaleDateString()}</td>
                                <td style={{ padding: '6px 10px', fontWeight: '600', color: '#10b981' }}>
                                  {formatCurrency(t.amount_paid, selectedPayableForView.currency_code)}
                                </td>
                                <td style={{ padding: '6px 10px' }}>{t.payment_method || '—'}</td>
                                <td style={{ padding: '6px 10px' }}>{t.description || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={() => setShowViewModal(false)}>
                    Close
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Opening Balance Modal - like Students add modal */}
      {showOpeningBalanceModal && (
        <div className="modal-overlay" onClick={() => setShowOpeningBalanceModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 className="modal-title">Opening Balance</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowOpeningBalanceModal(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="modal-body" style={{ overflow: 'auto' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Record a historical liability or payable. This will create a journal entry and add the payable to the list.</p>
              <form onSubmit={handleOpeningBalanceSubmit} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Supplier <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>(optional)</span></label>
                  <select
                    value={openingBalanceForm.supplier_id}
                    onChange={(e) => setOpeningBalanceForm(prev => ({ ...prev, supplier_id: e.target.value }))}
                    className="form-control"
                  >
                    <option value="">Select supplier (optional)</option>
                    {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount <span className="required">*</span></label>
                  <input type="number" step="0.01" value={openingBalanceForm.amount} onChange={(e) => setOpeningBalanceForm(prev => ({ ...prev, amount: e.target.value }))} className="form-control" required placeholder="e.g. 50000.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description <span className="required">*</span></label>
                  <textarea value={openingBalanceForm.description} onChange={(e) => setOpeningBalanceForm(prev => ({ ...prev, description: e.target.value }))} className="form-control" rows={3} required placeholder="e.g. City Council – historical debt" />
                </div>
                <div className="form-group">
                  <label className="form-label">Reference number</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" value={openingBalanceForm.reference_number} onChange={(e) => setOpeningBalanceForm(prev => ({ ...prev, reference_number: e.target.value }))} className="form-control" placeholder="e.g. OB-2024-001" />
                    <button
                      type="button"
                      className="modal-btn"
                      style={{ background: '#6b7280', color: 'white', whiteSpace: 'nowrap', padding: '8px 12px' }}
                      onClick={() => setOpeningBalanceForm(prev => ({ ...prev, reference_number: `OB-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}-${Date.now().toString().slice(-4)}` }))}
                    >
                      Generate
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Opening balance date <span className="required">*</span></label>
                    <input type="date" value={openingBalanceForm.opening_balance_date} onChange={(e) => setOpeningBalanceForm(prev => ({ ...prev, opening_balance_date: e.target.value }))} className="form-control" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due date</label>
                    <input type="date" value={openingBalanceForm.due_date} onChange={(e) => setOpeningBalanceForm(prev => ({ ...prev, due_date: e.target.value }))} className="form-control" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select value={openingBalanceForm.currency_id} onChange={(e) => setOpeningBalanceForm(prev => ({ ...prev, currency_id: Number(e.target.value) }))} className="form-control">
                    {currencies.map((c) => (<option key={c.id} value={c.id}>{c.code || c.name}</option>))}
                  </select>
                </div>
                <div style={{ marginTop: '16px', padding: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.75rem', color: '#1e40af' }}>
                  This creates a journal entry (e.g. Retained Earnings / Accounts Payable). The payable will appear in the list and can be paid like any other.
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                  <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowOpeningBalanceModal(false)}>Cancel</button>
                  <button type="submit" className="modal-btn modal-btn-confirm" disabled={openingBalanceLoading}>{openingBalanceLoading ? 'Creating...' : 'Create Opening Balance'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPayableForEdit && (
        <div className="modal-overlay" onClick={() => !editLoading && setShowEditModal(false)} role="dialog" aria-modal="true">
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Accounts Payable</h3>
              <button type="button" className="modal-close-btn" onClick={() => !editLoading && setShowEditModal(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditSubmit} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea value={editForm.description} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} className="form-control" rows={3} />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" value={editForm.due_date} onChange={(e) => setEditForm(prev => ({ ...prev, due_date: e.target.value }))} className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Reference Number</label>
                  <input type="text" value={editForm.reference_number} onChange={(e) => setEditForm(prev => ({ ...prev, reference_number: e.target.value }))} className="form-control" />
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', marginTop: '16px' }}>
                  <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowEditModal(false)} disabled={editLoading}>Cancel</button>
                  <button type="submit" className="modal-btn modal-btn-confirm" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedPayableForDelete && (
        <div className="modal-overlay" onClick={() => !deleteLoading && setShowDeleteModal(false)} role="dialog" aria-modal="true">
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Accounts Payable</h3>
              <button type="button" className="modal-close-btn" onClick={() => !deleteLoading && setShowDeleteModal(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <p className="report-subtitle" style={{ marginBottom: 0 }}>
                Are you sure you want to delete this accounts payable? {selectedPayableForDelete.reference_number && <strong>{selectedPayableForDelete.reference_number}</strong>} This action cannot be undone.
                {selectedPayableForDelete.paid_amount > 0 && (
                  <span style={{ display: 'block', marginTop: '8px', color: '#dc2626', fontSize: '0.75rem' }}>
                    Note: Cannot delete if payments have been made. Reverse payments first.
                  </span>
                )}
              </p>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>Cancel</button>
                <button type="button" className="modal-btn modal-btn-confirm" onClick={handleConfirmDelete} disabled={deleteLoading} style={{ background: '#dc2626' }}>{deleteLoading ? 'Deleting...' : 'Delete'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reverse Payment Modal - styled like Students modal */}
      {showReversePaymentModal && selectedPayableForView && (
        <div className="modal-overlay" onClick={() => !reverseLoading && setShowReversePaymentModal(false)} role="dialog" aria-modal="true">
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', minHeight: transactionsLoading ? '400px' : 'auto' }}
          >
            {transactionsLoading ? (
              // Loading State
              <>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ height: '20px', width: '200px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ width: '18px', height: '18px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
                <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: '1', minHeight: '300px' }}>
                  <div className="loading-spinner"></div>
                  <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading payment history...</p>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <div style={{ height: '32px', width: '80px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
              </>
            ) : (
              // Content State
              <>
                <div className="modal-header">
                  <h3 className="modal-title" style={{ color: '#000000' }}>
                    Reverse Payment
                  </h3>
                  <button className="modal-close-btn" onClick={() => !reverseLoading && setShowReversePaymentModal(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div className="modal-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Payable Summary Section */}
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#2563eb' }} />
                        Payable Summary
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Payable To
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {selectedPayableForView.payable_to || 'Non-Supplier'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Outstanding Balance
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: '600' }}>
                            {formatCurrency(selectedPayableForView.outstanding_balance, selectedPayableForView.currency_code)}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Paid Amount
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>
                            {formatCurrency(selectedPayableForView.paid_amount, selectedPayableForView.currency_code)}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Status
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            <span className={`px-2 py-1 text-xs rounded ${getStatusColor(selectedPayableForView.status)}`}>{selectedPayableForView.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment History Section */}
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faReceipt} style={{ color: '#f59e0b' }} />
                        Select Payment to Reverse
                      </h4>

                      {transactions.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No payments found to reverse.</p>
                      ) : (
                        <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
                          <thead>
                            <tr>
                              <th style={{ padding: '6px 10px' }}>DATE</th>
                              <th style={{ padding: '6px 10px' }}>AMOUNT</th>
                              <th style={{ padding: '6px 10px' }}>METHOD</th>
                              <th style={{ padding: '6px 10px' }}>DESCRIPTION</th>
                              <th style={{ padding: '6px 10px', width: '80px' }}>ACTION</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.map((t, index) => (
                              <tr key={t.id} style={{ backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' }}>
                                <td style={{ padding: '6px 10px' }}>{new Date(t.payment_date).toLocaleDateString()}</td>
                                <td style={{ padding: '6px 10px', fontWeight: '600', color: '#10b981' }}>
                                  {formatCurrency(t.amount_paid, selectedPayableForView.currency_code)}
                                </td>
                                <td style={{ padding: '6px 10px' }}>{t.payment_method || '—'}</td>
                                <td style={{ padding: '6px 10px' }}>{t.description || '—'}</td>
                                <td style={{ padding: '6px 10px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleReversePaymentClick(t)}
                                    disabled={reverseLoading}
                                    style={{
                                      color: '#f59e0b',
                                      background: 'none',
                                      border: 'none',
                                      cursor: reverseLoading ? 'not-allowed' : 'pointer',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      fontWeight: '600',
                                      opacity: reverseLoading ? 0.5 : 1
                                    }}
                                    title="Reverse this payment"
                                  >
                                    <FontAwesomeIcon icon={faUndo} style={{ marginRight: '4px' }} />
                                    Reverse
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={() => setShowReversePaymentModal(false)} disabled={reverseLoading}>
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reverse Payment Confirmation Modal */}
      {showReverseConfirmModal && selectedPaymentToReverse && selectedPayableForView && (
        <div className="modal-overlay" onClick={() => !reverseLoading && setShowReverseConfirmModal(false)} role="dialog" aria-modal="true">
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Reverse Payment</h3>
              <button type="button" className="modal-close-btn" onClick={() => !reverseLoading && setShowReverseConfirmModal(false)} aria-label="Close" disabled={reverseLoading}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
                  Are you sure you want to reverse this payment?
                </p>
                <div style={{ padding: '12px', background: '#f3f4f6', borderRadius: '8px', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Payment Date</div>
                      <div style={{ fontWeight: '600' }}>{new Date(selectedPaymentToReverse.payment_date).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Amount</div>
                      <div style={{ fontWeight: '600', color: '#10b981' }}>
                        {formatCurrency(selectedPaymentToReverse.amount_paid, selectedPayableForView.currency_code)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Method</div>
                      <div style={{ fontWeight: '600' }}>{selectedPaymentToReverse.payment_method || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Payable To</div>
                      <div style={{ fontWeight: '600' }}>{selectedPayableForView.payable_to || 'Non-Supplier'}</div>
                    </div>
                  </div>
                  {selectedPaymentToReverse.description && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Description</div>
                      <div style={{ fontSize: '0.8125rem' }}>{selectedPaymentToReverse.description}</div>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: '12px', padding: '10px', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '6px', fontSize: '0.75rem', color: '#92400e' }}>
                  <strong>Warning:</strong> This action will reverse the journal entry, restore the outstanding balance, and cannot be undone.
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowReverseConfirmModal(false)} disabled={reverseLoading}>
                  Cancel
                </button>
                <button type="button" className="modal-btn modal-btn-confirm" onClick={handleConfirmReversePayment} disabled={reverseLoading} style={{ background: '#f59e0b' }}>
                  {reverseLoading ? 'Reversing...' : 'Confirm Reverse'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast - top right */}
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

export default AccountsPayable;
