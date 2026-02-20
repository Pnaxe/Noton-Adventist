import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faArrowRight,
    faArrowLeft,
    faDollarSign,
    faBuilding,
    faMinus,
    faEye,
    faSearch,
    faSync,
    faEdit,
    faTrash
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';

const ACCOUNT_TYPES = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

const CashBank = () => {
    const { token } = useAuth();
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [accountSearchTerm, setAccountSearchTerm] = useState('');
    const [accountTypeFilter, setAccountTypeFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        reference: '',
        currency_id: 1
    });
    const [toast, setToast] = useState({ message: null, type: 'success', visible: false });
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState(null);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [editForm, setEditForm] = useState({ entry_date: '', description: '', reference: '', amount: '' });
    const [editLoading, setEditLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState(null);
    const [accountToDelete, setAccountToDelete] = useState(null);
    const [editAccountForm, setEditAccountForm] = useState({ code: '', name: '', type: 'Asset', parent_id: '', is_active: true });
    const [allAccountsForEdit, setAllAccountsForEdit] = useState([]);
    const [editAccountLoading, setEditAccountLoading] = useState(false);
    const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

    useEffect(() => {
        loadBalances();
    }, []);

    const loadBalances = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${BASE_URL}/accounting/cash-bank/balances`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setBalances(response.data.data);
                setError('');
            } else {
                setError('Failed to load account balances');
            }
        } catch (error) {
            console.error('Error loading balances:', error);
            setError('Error loading account balances. Please try again.');
            setBalances([]);
        } finally {
            setLoading(false);
        }
    };

    const loadTransactions = async (accountId, page = 1) => {
        setTransactionsLoading(true);
        try {
            const params = {
                page: page,
                limit: 10,
                search: searchTerm,
                startDate: '',
                endDate: '',
                transactionType: ''
            };

            const response = await axios.get(`${BASE_URL}/accounting/general-ledger/journal-entries/account/${accountId}`, {
                params,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = response.data;
            setTransactions(data.data || []);
            setTotalPages(data.pagination?.total_pages || 1);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setTransactionsLoading(false);
        }
    };

    const viewAccountDetails = (account) => {
        setSelectedAccount(account);
        loadTransactions(account.id);
    };

    const openEditAccountModal = async (account) => {
        setAccountToEdit(account);
        setEditAccountLoading(true);
        try {
            const [accountRes, listRes] = await Promise.all([
                axios.get(`${BASE_URL}/accounting/chart-of-accounts/${account.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${BASE_URL}/accounting/chart-of-accounts`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            const full = accountRes.data?.data;
            const list = listRes.data?.data || [];
            setAllAccountsForEdit(list);
            setEditAccountForm({
                code: full?.code ?? account.code ?? '',
                name: full?.name ?? account.account_name ?? '',
                type: full?.type ?? account.account_type ?? 'Asset',
                parent_id: full?.parent_id != null ? String(full.parent_id) : '',
                is_active: full != null ? !!full.is_active : true
            });
        } catch (err) {
            setEditAccountForm({
                code: account.code || '',
                name: account.account_name || '',
                type: account.account_type || 'Asset',
                parent_id: '',
                is_active: true
            });
            setAllAccountsForEdit([]);
            showToast(err.response?.data?.message || 'Failed to load account details', 'error');
        } finally {
            setEditAccountLoading(false);
        }
    };

    const closeEditAccountModal = () => {
        setAccountToEdit(null);
        setAllAccountsForEdit([]);
        setEditAccountForm({ code: '', name: '', type: 'Asset', parent_id: '', is_active: true });
    };

    const handleEditAccountSubmit = async (e) => {
        e.preventDefault();
        if (!accountToEdit?.id) return;
        setEditAccountLoading(true);
        try {
            const res = await axios.put(
                `${BASE_URL}/accounting/chart-of-accounts/${accountToEdit.id}`,
                {
                    code: editAccountForm.code,
                    name: editAccountForm.name,
                    type: editAccountForm.type,
                    parent_id: editAccountForm.parent_id ? editAccountForm.parent_id : null,
                    is_active: !!editAccountForm.is_active
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                showToast('Account updated successfully.', 'success');
                closeEditAccountModal();
                loadBalances();
                if (selectedAccount?.id === accountToEdit.id) {
                    setSelectedAccount({ ...selectedAccount, ...editAccountForm, account_name: editAccountForm.name, code: editAccountForm.code, account_type: editAccountForm.type });
                }
            } else {
                showToast(res.data.message || 'Update failed', 'error');
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update account', 'error');
        } finally {
            setEditAccountLoading(false);
        }
    };

    const openDeleteAccountModal = (account) => {
        setAccountToDelete(account);
    };

    const closeDeleteAccountModal = () => {
        setAccountToDelete(null);
    };

    const handleDeleteAccountConfirm = async () => {
        if (!accountToDelete?.id) return;
        setDeleteAccountLoading(true);
        try {
            const res = await axios.delete(
                `${BASE_URL}/accounting/chart-of-accounts/${accountToDelete.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                showToast('Account deleted successfully.', 'success');
                closeDeleteAccountModal();
                if (selectedAccount?.id === accountToDelete.id) {
                    setSelectedAccount(null);
                }
                loadBalances();
            } else {
                showToast(res.data.message || 'Delete failed', 'error');
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete account', 'error');
        } finally {
            setDeleteAccountLoading(false);
        }
    };

    const openModal = (type) => {
        setModalType(type);
        setShowModal(true);
        setFormData({
            amount: '',
            description: '',
            reference: '',
            currency_id: 1
        });
    };

    const closeModal = () => {
        setShowModal(false);
        setModalType('');
        setFormData({
            amount: '',
            description: '',
            reference: '',
            currency_id: 1
        });
    };

    const showToast = (message, type = 'success', duration = 3000) => {
        setToast({ message, type, visible: true });
        if (duration > 0) {
            setTimeout(() => {
                setToast(prev => ({ ...prev, visible: false }));
                setTimeout(() => setToast({ message: null, type: 'success', visible: false }), 300);
            }, duration);
        }
    };

    const getToastBackgroundColor = (type) => {
        switch (type) {
            case 'success': return '#10b981';
            case 'error': return '#ef4444';
            default: return '#10b981';
        }
    };

    const getToastIcon = (type) => {
        const iconProps = { width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' };
        if (type === 'success') {
            return (
                <svg {...iconProps}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            );
        }
        if (type === 'error') {
            return (
                <svg {...iconProps}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            );
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.description) {
            showToast('Amount and description are required', 'error');
            return;
        }

        try {
            let endpoint = '';
            switch (modalType) {
                case 'cash-injection':
                    endpoint = '/accounting/cash-bank/cash/injection';
                    break;
                case 'cash-withdrawal':
                    endpoint = '/accounting/cash-bank/cash/withdrawal';
                    break;
                case 'bank-deposit':
                    endpoint = '/accounting/cash-bank/bank/deposit';
                    break;
                case 'bank-withdrawal':
                    endpoint = '/accounting/cash-bank/bank/withdrawal';
                    break;
                case 'cash-to-bank':
                    endpoint = '/accounting/cash-bank/transfer/cash-to-bank';
                    break;
                case 'bank-to-cash':
                    endpoint = '/accounting/cash-bank/transfer/bank-to-cash';
                    break;
                default:
                    return;
            }

            const response = await axios.post(`${BASE_URL}${endpoint}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data;
            if (data.success) {
                showToast('Transaction recorded successfully!', 'success');
                closeModal();
                loadBalances();
                if (selectedAccount) {
                    loadTransactions(selectedAccount.id, currentPage);
                }
            } else {
                showToast(data.message || 'Transaction failed', 'error');
            }
        } catch (err) {
            console.error('Error recording transaction:', err);
            const msg = err.response?.data?.message || err.response?.data?.error || 'Error recording transaction';
            showToast(msg, 'error');
        }
    };

    const getModalTitle = () => {
        switch (modalType) {
            case 'cash-injection': return 'Cash Injection';
            case 'cash-withdrawal': return 'Cash Withdrawal';
            case 'bank-deposit': return 'Bank Deposit';
            case 'bank-withdrawal': return 'Bank Withdrawal';
            case 'cash-to-bank': return 'Cash to Bank Transfer';
            case 'bank-to-cash': return 'Bank to Cash Transfer';
            default: return 'Transaction';
        }
    };

    const getModalDescription = () => {
        switch (modalType) {
            case 'cash-injection': return 'Add cash to the business';
            case 'cash-withdrawal': return 'Take cash out of the business';
            case 'bank-deposit': return 'Deposit money into bank account';
            case 'bank-withdrawal': return 'Withdraw money from bank account';
            case 'cash-to-bank': return 'Transfer cash to bank account';
            case 'bank-to-cash': return 'Transfer money from bank to cash';
            default: return '';
        }
    };

    const openEditModal = async (transaction) => {
        const jeId = transaction.journal_entry_id;
        if (!jeId) return;
        const amt = transaction.debit_amount > 0 ? transaction.debit_amount : transaction.credit_amount;
        setTransactionToEdit(transaction);
        setEditForm({
            entry_date: transaction.transaction_date ? new Date(transaction.transaction_date).toISOString().split('T')[0] : '',
            description: transaction.description || '',
            reference: transaction.reference || '',
            amount: amt != null ? String(parseFloat(amt)) : ''
        });
        setShowEditModal(true);
        setEditLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/accounting/cash-bank/journal-entries/${jeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success && res.data.data) {
                const d = res.data.data;
                setEditForm((prev) => ({
                    ...prev,
                    entry_date: d.entry_date || prev.entry_date,
                    description: d.description ?? prev.description,
                    reference: d.reference ?? prev.reference
                }));
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load transaction', 'error');
            setShowEditModal(false);
        } finally {
            setEditLoading(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!transactionToEdit?.journal_entry_id) return;
        setEditLoading(true);
        try {
            const payload = {
                entry_date: editForm.entry_date,
                description: editForm.description,
                reference: editForm.reference
            };
            const amountNum = parseFloat(editForm.amount);
            if (!Number.isNaN(amountNum) && selectedAccount?.id) {
                payload.amount = amountNum;
                payload.account_id = selectedAccount.id;
            }
            await axios.put(
                `${BASE_URL}/accounting/cash-bank/journal-entries/${transactionToEdit.journal_entry_id}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showToast('Transaction updated successfully.', 'success');
            setShowEditModal(false);
            setTransactionToEdit(null);
            if (selectedAccount) {
                loadTransactions(selectedAccount.id, currentPage);
                loadBalances();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update transaction', 'error');
        } finally {
            setEditLoading(false);
        }
    };

    const openDeleteModal = (transaction) => {
        setTransactionToDelete(transaction);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!transactionToDelete?.journal_entry_id) return;
        setDeleteLoading(true);
        try {
            await axios.delete(
                `${BASE_URL}/accounting/cash-bank/journal-entries/${transactionToDelete.journal_entry_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showToast('Transaction deleted successfully.', 'success');
            setShowDeleteModal(false);
            setTransactionToDelete(null);
            if (selectedAccount) {
                loadTransactions(selectedAccount.id, currentPage);
                loadBalances();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete transaction', 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    const filteredBalances = balances.filter((acc) => {
        const matchSearch = !accountSearchTerm || [acc.account_name, acc.code].some(
            (v) => String(v || '').toLowerCase().includes(accountSearchTerm.trim().toLowerCase())
        );
        const matchType = !accountTypeFilter || (accountTypeFilter === 'Cash' && (acc.account_name || '').toLowerCase().includes('cash')) || (accountTypeFilter === 'Bank' && (acc.account_name || '').toLowerCase().includes('bank'));
        return matchSearch && matchType;
    });

    const totalAccounts = filteredBalances.length;
    const displayStart = totalAccounts > 0 ? 1 : 0;
    const displayEnd = totalAccounts;

    if (loading && balances.length === 0) {
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
                        <h2 className="report-title">Transfer</h2>
                        <p className="report-subtitle">Cash and bank operations.</p>
                    </div>
                </div>
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
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading accounts...</p>
                </div>
            </div>
        );
    }

    /* Full-page View Account layout (pixel-perfect to other view pages) */
    if (selectedAccount) {
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
                        <h2 className="report-title">{selectedAccount.account_name}</h2>
                        <p className="report-subtitle">{selectedAccount.code} · {selectedAccount.account_type} · {selectedAccount.currency_code}</p>
                    </div>
                    <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button type="button" onClick={() => setSelectedAccount(null)} className="btn-checklist">
                            <FontAwesomeIcon icon={faArrowLeft} />
                            Back to Overview
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', flexShrink: 0 }}>
                        {error}
                    </div>
                )}

                <div className="report-filters" style={{ flexShrink: 0 }}>
                    <div className="report-filters-left">
                        <div className="filter-group">
                            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search transactions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="filter-input search-input"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        style={{
                                            position: 'absolute', right: '8px', padding: '4px 6px', background: 'transparent', border: 'none', borderRadius: '4px',
                                            cursor: 'pointer', fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px'
                                        }}
                                        title="Clear search"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>
                        <button type="button" onClick={() => loadTransactions(selectedAccount.id, 1)} className="btn-checklist">
                            Search
                        </button>
                    </div>
                    <div className="report-filters-right" style={{ alignItems: 'center' }}>
                        <div className="report-subtitle" style={{ marginRight: 8, marginBottom: 0 }}>Current Balance</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {selectedAccount.current_balance != null ? Number(selectedAccount.current_balance).toLocaleString() : '0'} {selectedAccount.currency_code}
                        </div>
                    </div>
                </div>

                <div className="report-content-container ecl-table-container" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    overflow: 'auto',
                    minHeight: 0,
                    padding: 0,
                    height: '100%'
                }}>
                    {transactionsLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '16px' }}>
                            <div className="loading-spinner" />
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading transactions...</p>
                        </div>
                    ) : (
                        <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--sidebar-bg)' }}>
                                <tr>
                                    <th style={{ padding: '6px 10px' }}>DATE</th>
                                    <th style={{ padding: '6px 10px' }}>DESCRIPTION</th>
                                    <th style={{ padding: '6px 10px' }}>DR</th>
                                    <th style={{ padding: '6px 10px' }}>CR</th>
                                    <th style={{ padding: '6px 10px' }}>REFERENCE</th>
                                    <th style={{ padding: '6px 10px', width: 90 }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction, index) => (
                                    <tr key={transaction.id || index} style={{ height: '32px', backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' }}>
                                        <td style={{ padding: '4px 10px' }}>{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                                        <td style={{ padding: '4px 10px' }}>{transaction.description || '-'}</td>
                                        <td style={{ padding: '4px 10px', color: transaction.debit_amount > 0 ? '#dc2626' : 'var(--text-secondary)' }}>
                                            {transaction.debit_amount > 0 ? `$${parseFloat(transaction.debit_amount || 0).toFixed(2)}` : '-'}
                                        </td>
                                        <td style={{ padding: '4px 10px', color: transaction.credit_amount > 0 ? '#059669' : 'var(--text-secondary)' }}>
                                            {transaction.credit_amount > 0 ? `$${parseFloat(transaction.credit_amount || 0).toFixed(2)}` : '-'}
                                        </td>
                                        <td style={{ padding: '4px 10px' }}>{transaction.reference || '-'}</td>
                                        <td style={{ padding: '4px 10px' }}>
                                            {transaction.journal_entry_id ? (
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <button type="button" onClick={() => openEditModal(transaction)} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title="Edit">
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </button>
                                                    <button type="button" onClick={() => openDeleteModal(transaction)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title="Delete">
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {Array.from({ length: Math.max(0, 25 - transactions.length) }).map((_, index) => (
                                    <tr
                                        key={`empty-${index}`}
                                        style={{
                                            height: '32px',
                                            backgroundColor: (transactions.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
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

                    <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
                        <div className="table-footer-left">
                            {transactions.length > 0 ? `Showing page ${currentPage} of ${totalPages}` : 'No transactions'}
                        </div>
                        <div className="table-footer-right">
                            {totalPages > 1 ? (
                                <div className="pagination-controls">
                                    <button className="pagination-btn" onClick={() => loadTransactions(selectedAccount.id, currentPage - 1)} disabled={currentPage === 1}>Previous</button>
                                    <span className="pagination-info" style={{ fontSize: '0.7rem' }}>Page {currentPage} of {totalPages}</span>
                                    <button className="pagination-btn" onClick={() => loadTransactions(selectedAccount.id, currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>All data displayed</div>
                            )}
                        </div>
                    </div>
                </div>

                {showModal && (
                    <div className="modal-overlay" onClick={closeModal} role="dialog" aria-modal="true" aria-labelledby="transfer-modal-title">
                        <div className="modal-dialog" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 id="transfer-modal-title" className="modal-title">{getModalTitle()}</h3>
                                <button type="button" className="modal-close-btn" onClick={closeModal} aria-label="Close">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                            <div className="modal-body">
                                <p className="report-subtitle" style={{ marginBottom: '16px' }}>{getModalDescription()}</p>
                                <form onSubmit={handleSubmit} className="modal-form">
                                    <div className="form-group">
                                        <label className="form-label">Amount <span className="required">*</span></label>
                                        <input type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="form-control" placeholder="Enter amount" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Description <span className="required">*</span></label>
                                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="form-control" placeholder="Enter description" rows={3} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Reference</label>
                                        <input type="text" value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} className="form-control" placeholder="Reference (optional)" />
                                    </div>
                                    <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', marginTop: '16px' }}>
                                        <button type="button" className="modal-btn modal-btn-cancel" onClick={closeModal}>Cancel</button>
                                        <button type="submit" className="modal-btn modal-btn-confirm">Record Transaction</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {showEditModal && (
                    <div className="modal-overlay" onClick={() => !editLoading && setShowEditModal(false)} role="dialog" aria-modal="true" aria-labelledby="edit-transaction-title">
                        <div className="modal-dialog" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 id="edit-transaction-title" className="modal-title">Edit Transaction</h3>
                                <button type="button" className="modal-close-btn" onClick={() => !editLoading && setShowEditModal(false)} aria-label="Close">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                            <div className="modal-body">
                                {editLoading && !editForm.entry_date ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                                        <div className="loading-spinner" />
                                        <span style={{ marginLeft: 8, fontSize: '0.875rem' }}>Loading...</span>
                                    </div>
                                ) : (
                                    <form onSubmit={handleEditSubmit} className="modal-form">
                                        <div className="form-group">
                                            <label className="form-label">Amount <span className="required">*</span></label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={editForm.amount}
                                                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                                className="form-control"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Date</label>
                                            <input type="date" value={editForm.entry_date} onChange={(e) => setEditForm({ ...editForm, entry_date: e.target.value })} className="form-control" required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Description</label>
                                            <input type="text" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="form-control" placeholder="Description" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Reference</label>
                                            <input type="text" value={editForm.reference} onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })} className="form-control" placeholder="Reference" />
                                        </div>
                                        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', marginTop: '16px' }}>
                                            <button type="button" className="modal-btn modal-btn-cancel" onClick={() => !editLoading && setShowEditModal(false)}>Cancel</button>
                                            <button type="submit" className="modal-btn modal-btn-confirm" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {showDeleteModal && transactionToDelete && (
                    <div className="modal-overlay" onClick={() => !deleteLoading && setShowDeleteModal(false)} role="dialog" aria-modal="true" aria-labelledby="delete-transaction-title">
                        <div className="modal-dialog" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 id="delete-transaction-title" className="modal-title">Delete Transaction</h3>
                                <button type="button" className="modal-close-btn" onClick={() => !deleteLoading && setShowDeleteModal(false)} aria-label="Close">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                            <div className="modal-body">
                                <p style={{ marginBottom: 16, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                    Are you sure you want to delete this transaction? This will reverse the account balance. This action cannot be undone.
                                </p>
                                {transactionToDelete.description && (
                                    <p style={{ marginBottom: 16, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {transactionToDelete.description}
                                    </p>
                                )}
                                <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', marginTop: 0 }}>
                                    <button type="button" className="modal-btn modal-btn-cancel" onClick={() => !deleteLoading && setShowDeleteModal(false)}>Cancel</button>
                                    <button type="button" className="modal-btn modal-btn-delete" onClick={handleConfirmDelete} disabled={deleteLoading} style={{ background: '#dc2626' }}>
                                        {deleteLoading ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {toast.visible && toast.message && (
                    <div className="success-toast">
                        <div className="success-toast-content" style={{ background: getToastBackgroundColor(toast.type) }}>
                            {getToastIcon(toast.type)}
                            <span>{toast.message}</span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

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
                    <h2 className="report-title">Transfer</h2>
                    <p className="report-subtitle">Manage cash and bank operations.</p>
                </div>
                <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => openModal('cash-injection')} className="btn-checklist">
                        <FontAwesomeIcon icon={faPlus} /> Cash In
                    </button>
                    <button type="button" onClick={() => openModal('cash-withdrawal')} className="btn-checklist" style={{ background: '#4b5563' }}>
                        <FontAwesomeIcon icon={faMinus} /> Cash Out
                    </button>
                    <button type="button" onClick={() => openModal('bank-deposit')} className="btn-checklist">
                        <FontAwesomeIcon icon={faPlus} /> Bank In
                    </button>
                    <button type="button" onClick={() => openModal('bank-withdrawal')} className="btn-checklist" style={{ background: '#4b5563' }}>
                        <FontAwesomeIcon icon={faMinus} /> Bank Out
                    </button>
                    <button type="button" onClick={() => openModal('cash-to-bank')} className="btn-checklist" style={{ background: '#3b82f6' }}>
                        <FontAwesomeIcon icon={faArrowRight} /> Cash → Bank
                    </button>
                    <button type="button" onClick={() => openModal('bank-to-cash')} className="btn-checklist" style={{ background: '#3b82f6' }}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Bank → Cash
                    </button>
                    <button type="button" onClick={loadBalances} className="btn-checklist">
                        <FontAwesomeIcon icon={faSync} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="report-filters" style={{ flexShrink: 0 }}>
                <div className="report-filters-left">
                    <div className="filter-group">
                        <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <FontAwesomeIcon icon={faSearch} className="search-icon" />
                            <input
                                type="text"
                                value={accountSearchTerm}
                                onChange={(e) => setAccountSearchTerm(e.target.value)}
                                placeholder="Search by account name or code..."
                                className="filter-input search-input"
                            />
                            {accountSearchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setAccountSearchTerm('')}
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
                    </div>
                    <div className="filter-group">
                        <label className="filter-label" style={{ marginRight: '8px' }}>Type:</label>
                        <select
                            value={accountTypeFilter}
                            onChange={(e) => setAccountTypeFilter(e.target.value)}
                            className="filter-input"
                            style={{ minWidth: '120px', width: '120px' }}
                        >
                            <option value="">All</option>
                            <option value="Cash">Cash</option>
                            <option value="Bank">Bank</option>
                        </select>
                        {accountTypeFilter && (
                            <button
                                type="button"
                                onClick={() => setAccountTypeFilter('')}
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
                <>
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
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading accounts...</p>
                        </div>
                    ) : filteredBalances.length > 0 ? (
                        <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
                            <thead style={{
                                position: 'sticky',
                                top: 0,
                                zIndex: 10,
                                background: 'var(--sidebar-bg)'
                            }}>
                                <tr>
                                    <th style={{ padding: '6px 10px' }}>ACCOUNT</th>
                                    <th style={{ padding: '6px 10px' }}>TYPE</th>
                                    <th style={{ padding: '6px 10px' }}>BALANCE</th>
                                    <th style={{ padding: '6px 10px' }}>CURRENCY</th>
                                    <th style={{ padding: '6px 10px' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBalances.map((account, index) => (
                                    <tr
                                        key={account.id}
                                        style={{
                                            height: '32px',
                                            backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                                        }}
                                    >
                                        <td style={{ padding: '4px 10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FontAwesomeIcon icon={(account.account_name || '').toLowerCase().includes('cash') ? faDollarSign : faBuilding} style={{ color: '#2563eb', fontSize: '0.875rem' }} />
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{account.account_name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{account.code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '4px 10px' }}>{account.account_type}</td>
                                        <td style={{ padding: '4px 10px' }}>{account.current_balance != null ? Number(account.current_balance).toLocaleString() : '0'}</td>
                                        <td style={{ padding: '4px 10px' }}>{account.currency_code}</td>
                                        <td style={{ padding: '4px 10px' }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => viewAccountDetails(account)}
                                                    style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                    title="View"
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openDeleteAccountModal(account)}
                                                    style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                    title="Delete"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {Array.from({ length: Math.max(0, 25 - filteredBalances.length) }).map((_, index) => (
                                    <tr
                                        key={`empty-${index}`}
                                        style={{
                                            height: '32px',
                                            backgroundColor: (filteredBalances.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
                                        }}
                                    >
                                        <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                                        <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                                        <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                                        <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                                        <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
                            <FontAwesomeIcon icon={faDollarSign} style={{ fontSize: '2rem', marginBottom: 12 }} />
                            <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>No Cash/Bank Accounts Found</p>
                            <p style={{ margin: '8px 0 0', fontSize: '0.8rem' }}>Set up Cash and Bank accounts in Chart of Accounts first.</p>
                        </div>
                    )}
                </>
            </div>

            {/* Pagination Footer - Main list only */}
            <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
                <div className="table-footer-left">
                    Showing {displayStart} to {displayEnd} of {totalAccounts || 0} results.
                </div>
                <div className="table-footer-right">
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        All data displayed
                    </div>
                </div>
            </div>

            {/* Transaction Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal} role="dialog" aria-modal="true" aria-labelledby="transfer-modal-title">
                    <div className="modal-dialog" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 id="transfer-modal-title" className="modal-title">{getModalTitle()}</h3>
                            <button type="button" className="modal-close-btn" onClick={closeModal} aria-label="Close">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="report-subtitle" style={{ marginBottom: '16px' }}>{getModalDescription()}</p>
                            <form onSubmit={handleSubmit} className="modal-form">
                                <div className="form-group">
                                    <label className="form-label">Amount <span className="required">*</span></label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="form-control"
                                        placeholder="Enter amount"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description <span className="required">*</span></label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="form-control"
                                        placeholder="Enter description"
                                        rows={3}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reference</label>
                                    <input
                                        type="text"
                                        value={formData.reference}
                                        onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                        className="form-control"
                                        placeholder="Reference (optional)"
                                    />
                                </div>
                                <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', marginTop: '16px' }}>
                                    <button type="button" className="modal-btn modal-btn-cancel" onClick={closeModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="modal-btn modal-btn-confirm">
                                        Record Transaction
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Account Modal */}
            {accountToEdit && (
                <div className="modal-overlay" onClick={() => !editAccountLoading && closeEditAccountModal()} role="dialog" aria-modal="true" aria-labelledby="edit-account-modal-title">
                    <div className="modal-dialog" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 id="edit-account-modal-title" className="modal-title">Edit Account</h3>
                            <button type="button" className="modal-close-btn" onClick={() => !editAccountLoading && closeEditAccountModal()} aria-label="Close">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleEditAccountSubmit} className="modal-form">
                                <div className="form-group">
                                    <label className="form-label">Code <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        value={editAccountForm.code}
                                        onChange={(e) => setEditAccountForm({ ...editAccountForm, code: e.target.value })}
                                        className="form-control"
                                        placeholder="Account code"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Name <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        value={editAccountForm.name}
                                        onChange={(e) => setEditAccountForm({ ...editAccountForm, name: e.target.value })}
                                        className="form-control"
                                        placeholder="Account name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type <span className="required">*</span></label>
                                    <select
                                        value={editAccountForm.type}
                                        onChange={(e) => setEditAccountForm({ ...editAccountForm, type: e.target.value })}
                                        className="form-control"
                                        required
                                    >
                                        <option value="">Select type</option>
                                        {ACCOUNT_TYPES.map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Parent Account</label>
                                    <select
                                        value={editAccountForm.parent_id}
                                        onChange={(e) => setEditAccountForm({ ...editAccountForm, parent_id: e.target.value })}
                                        className="form-control"
                                    >
                                        <option value="">None</option>
                                        {(editAccountForm.type
                                            ? allAccountsForEdit.filter((acc) => acc.type === editAccountForm.type && acc.id !== accountToEdit?.id)
                                            : allAccountsForEdit.filter((acc) => acc.id !== accountToEdit?.id)
                                        ).map((acc) => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <input
                                        type="checkbox"
                                        id="edit-account-is_active"
                                        checked={editAccountForm.is_active}
                                        onChange={(e) => setEditAccountForm({ ...editAccountForm, is_active: e.target.checked })}
                                        style={{ width: 'auto', height: 'auto' }}
                                    />
                                    <label htmlFor="edit-account-is_active" className="form-label" style={{ margin: 0 }}>Active</label>
                                </div>
                                <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', marginTop: '16px' }}>
                                    <button type="button" className="modal-btn modal-btn-cancel" onClick={closeEditAccountModal} disabled={editAccountLoading}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="modal-btn modal-btn-confirm" disabled={editAccountLoading}>
                                        {editAccountLoading ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Account Modal */}
            {accountToDelete && (
                <div className="modal-overlay" onClick={() => !deleteAccountLoading && closeDeleteAccountModal()} role="dialog" aria-modal="true" aria-labelledby="delete-account-modal-title">
                    <div className="modal-dialog" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 id="delete-account-modal-title" className="modal-title">Delete Account</h3>
                            <button type="button" className="modal-close-btn" onClick={() => !deleteAccountLoading && closeDeleteAccountModal()} aria-label="Close">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="report-subtitle" style={{ marginBottom: '16px' }}>
                                Are you sure you want to delete the account <strong>{accountToDelete.account_name}</strong> ({accountToDelete.code})? This action cannot be undone.
                            </p>
                            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" className="modal-btn modal-btn-cancel" onClick={closeDeleteAccountModal} disabled={deleteAccountLoading}>
                                    Cancel
                                </button>
                                <button type="button" className="modal-btn modal-btn-confirm" onClick={handleDeleteAccountConfirm} disabled={deleteAccountLoading} style={{ background: '#dc2626' }}>
                                    {deleteAccountLoading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast - top right */}
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

export default CashBank;

