import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../../../contexts/Api';
import { useAuth } from '../../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faDollarSign, faUser, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const ViewCOA = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [parent, setParent] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [balances, setBalances] = useState([]);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerPagination, setLedgerPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_records: 0,
    limit: 25
  });
  const [ledgerFilters, setLedgerFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    transactionType: ''
  });

  useEffect(() => {
    fetchAccount();
  }, [id]);

  useEffect(() => {
    if (account) {
      fetchCurrenciesAndBalances();
      fetchLedgerEntries();
    }
  }, [account, ledgerFilters, ledgerPagination.current_page]);

  const fetchAccount = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${BASE_URL}/accounting/chart-of-accounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAccount(response.data.data);
        if (response.data.data.parent_id) {
          const parentRes = await axios.get(`${BASE_URL}/accounting/chart-of-accounts/${response.data.data.parent_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (parentRes.data.success) setParent(parentRes.data.data);
        }
      } else {
        setError('Failed to load account.');
      }
    } catch (err) {
      setError('Failed to load account.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrenciesAndBalances = async () => {
    setBalancesLoading(true);
    try {
      const curRes = await axios.get(`${BASE_URL}/accounting/currencies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (curRes.data.success) {
        setCurrencies(curRes.data.data || []);
        const balancesArr = await Promise.all(
          (curRes.data.data || []).map(async (cur) => {
            try {
              const balRes = await axios.get(`${BASE_URL}/accounting/account-balances/${id}?currency_id=${cur.id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              return {
                currency: cur,
                balance: balRes.data.data ? balRes.data.data.balance : 0,
                as_of_date: balRes.data.data ? balRes.data.data.as_of_date : ''
              };
            } catch {
              return { currency: cur, balance: 0, as_of_date: '' };
            }
          })
        );
        setBalances(balancesArr);
      }
    } catch {
      setBalances([]);
    } finally {
      setBalancesLoading(false);
    }
  };

  const fetchLedgerEntries = async () => {
    if (!account) return;
    setLedgerLoading(true);
    try {
      const params = {
        page: ledgerPagination.current_page,
        limit: ledgerPagination.limit,
        ...ledgerFilters,
        accountId: id
      };
      const response = await axios.get(`${BASE_URL}/accounting/general-ledger/journal-entries/account/${id}`, {
        params,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = response.data;
      setLedgerEntries(data.data || []);
      setLedgerPagination(data.pagination || ledgerPagination);
    } catch (err) {
      console.error('Error fetching ledger entries:', err);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleLedgerFilterChange = (field, value) => {
    setLedgerFilters((prev) => ({ ...prev, [field]: value }));
    setLedgerPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  const handleLedgerPageChange = (page) => {
    setLedgerPagination((prev) => ({ ...prev, current_page: page }));
  };

  const formatDate = (dateString) => (dateString ? new Date(dateString).toLocaleDateString() : '—');
  const formatCurrency = (amount, currencySymbol = '$') => `${currencySymbol}${parseFloat(amount || 0).toFixed(2)}`;
  const getSourceIcon = (source) => (source === 'fee_payment' ? faDollarSign : faUser);

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
      {/* Report Header - account title when loaded, Back button */}
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          {account && (
            <>
              <h2 className="report-title">{account.code} — {account.name}</h2>
              <p className="report-subtitle" style={{ marginBottom: 0 }}>
                {account.type}
                {parent ? ` · Parent: ${parent.code} — ${parent.name}` : ''}
              </p>
            </>
          )}
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn-checklist"
            onClick={() => navigate('/dashboard/accounting/chart-of-accounts')}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Chart of Accounts
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', flexShrink: 0 }}>
          {error}
        </div>
      )}

      {/* Content - gray bg and padding on container when showing account */}
      <div
        className={`report-content-container ${account ? 'bg-gray-50' : ''}`}
        style={{
          flex: 1,
          overflow: 'auto',
          minHeight: 0,
          padding: loading || !account ? 0 : '24px 30px 32px'
        }}
      >
        {loading ? (
          <div className="bg-gray-50 min-h-full flex flex-col items-center justify-center" style={{ padding: '48px 24px' }}>
            <div className="loading-spinner" />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '16px' }}>Loading account...</p>
          </div>
        ) : !account ? (
          <div className="bg-gray-50 min-h-full flex items-center justify-center" style={{ padding: '48px 24px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Account not found.</p>
          </div>
        ) : (
          <>
            {/* Account Balances - no wrapper, heading + table on gray */}
            <div style={{ flexShrink: 0 }}>
              <h3 className="font-semibold text-gray-900 mb-4" style={{ fontSize: '1rem' }}>
                Account Balances
              </h3>
              {balancesLoading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                  Loading balances...
                </div>
              ) : (
                <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
                  <thead style={{ background: 'var(--sidebar-bg)' }}>
                    <tr>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>CURRENCY</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>SYMBOL</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>BALANCE</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>AS OF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.map((b, idx) => {
                      const balanceStr = b.balance === 0 ? '0.00' : `${formatCurrency(Math.abs(b.balance), b.currency.symbol || '')} ${b.balance < 0 ? 'CR' : 'DR'}`;
                      return (
                        <tr key={b.currency.id} style={{ backgroundColor: idx % 2 === 0 ? '#fafafa' : '#f3f4f6' }}>
                          <td style={{ padding: '6px 10px' }}>{b.currency.code} — {b.currency.name}</td>
                          <td style={{ padding: '6px 10px' }}>{b.currency.symbol || '—'}</td>
                          <td style={{ padding: '6px 10px', fontWeight: 600, color: b.balance < 0 ? '#16a34a' : b.balance > 0 ? '#dc2626' : undefined }}>{balanceStr}</td>
                          <td style={{ padding: '6px 10px' }}>{b.as_of_date ? b.as_of_date.slice(0, 10) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Ledger Entries - same layout as Account Balances table */}
            <div style={{ marginTop: '24px', flexShrink: 0 }}>
              <h3 className="font-semibold text-gray-900 mb-4" style={{ fontSize: '1rem' }}>
                Ledger Entries & Transactions
              </h3>
              {ledgerLoading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                  Loading ledger entries...
                </div>
              ) : (
                <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
                  <thead style={{ background: 'var(--sidebar-bg)', display: 'table-header-group' }}>
                    <tr>
                      <th style={{ padding: '8px 10px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>DATE</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>DESCRIPTION</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', color: '#fff', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>DR</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', color: '#fff', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>CR</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>REFERENCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerEntries.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                          No ledger entries found.
                        </td>
                      </tr>
                    ) : (
                      ledgerEntries.map((entry, idx) => (
                        <tr key={`${entry.source}-${entry.id}-${idx}`} style={{ backgroundColor: idx % 2 === 0 ? '#fafafa' : '#f3f4f6' }}>
                          <td style={{ padding: '6px 10px' }}>{formatDate(entry.transaction_date)}</td>
                          <td style={{ padding: '6px 10px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <FontAwesomeIcon icon={getSourceIcon(entry.source)} style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }} />
                              {entry.description || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                            {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '—'}
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                            {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '—'}
                          </td>
                          <td style={{ padding: '6px 10px' }}>{entry.reference || entry.receipt_number || entry.reference_number || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewCOA;
