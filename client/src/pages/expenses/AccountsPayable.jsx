import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faSearch, faPlus } from '@fortawesome/free-solid-svg-icons';

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
    await fetchTransactions(payable.id);
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
                        <FontAwesomeIcon icon={faEye} className="h-3 w-3" />
                      </button>
                      {payable.status !== 'paid' && (
                        <button type="button" onClick={() => handleMakePayment(payable)} style={{ color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Pay</button>
                      )}
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

      {/* View Transactions Modal */}
      {showViewModal && selectedPayableForView && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 className="modal-title">Transaction History</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowViewModal(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="modal-body" style={{ overflow: 'auto' }}>
              <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--sidebar-bg)', color: '#fff', borderRadius: '8px', fontSize: '0.8125rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  <div><span style={{ opacity: 0.9 }}>Payable To</span><div style={{ fontWeight: 600 }}>{selectedPayableForView.payable_to || 'Non-Supplier'}</div></div>
                  <div><span style={{ opacity: 0.9 }}>Outstanding</span><div style={{ fontWeight: 600 }}>{formatCurrency(selectedPayableForView.outstanding_balance, selectedPayableForView.currency_code)}</div></div>
                  <div><span style={{ opacity: 0.9 }}>Status</span><div><span className={`px-2 py-1 text-xs rounded ${getStatusColor(selectedPayableForView.status)}`}>{selectedPayableForView.status}</span></div></div>
                </div>
              </div>
              {transactionsLoading ? (
                <div className="loading-spinner" style={{ margin: '24px auto' }} />
              ) : transactions.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No transactions found.</p>
              ) : (
                <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
                  <thead><tr><th style={{ padding: '6px 10px' }}>DATE</th><th style={{ padding: '6px 10px' }}>AMOUNT</th><th style={{ padding: '6px 10px' }}>METHOD</th><th style={{ padding: '6px 10px' }}>DESCRIPTION</th></tr></thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} style={{ backgroundColor: '#fafafa' }}>
                        <td style={{ padding: '6px 10px' }}>{new Date(t.payment_date).toLocaleDateString()}</td>
                        <td style={{ padding: '6px 10px' }}>{formatCurrency(t.amount_paid, selectedPayableForView.currency_code)}</td>
                        <td style={{ padding: '6px 10px' }}>{t.payment_method}</td>
                        <td style={{ padding: '6px 10px' }}>{t.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
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

export default AccountsPayable;
