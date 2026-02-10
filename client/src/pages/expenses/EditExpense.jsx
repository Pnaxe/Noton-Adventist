import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

const EditExpense = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({ supplier_id: '', amount: '', currency_id: '', expense_date: '', description: '', payment_method: 'cash', payment_status: 'full', payment_account_id: '', expense_account_id: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [defaultExpenseAccount, setDefaultExpenseAccount] = useState(null);
  const [chartAccounts, setChartAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/expenses/suppliers`, { headers: { Authorization: `Bearer ${token}` } });
      setSuppliers(res.data.data || []);
    } catch {}
  };

  const fetchCurrencies = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/accounting/currencies`, { headers: { Authorization: `Bearer ${token}` } });
      setCurrencies(res.data.data || []);
    } catch {}
  };

  const fetchDefaultExpenseAccount = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/accounting/chart-of-accounts`, { headers: { Authorization: `Bearer ${token}` } });
      const accounts = res.data.data || [];
      setChartAccounts(accounts);
      // Use code 5000 as default expense account
      const acc = accounts.find(acc => acc.code === '5000') || accounts.find(acc => acc.type === 'Expense');
      setDefaultExpenseAccount(acc);
      if (acc && !form.expense_account_id) {
        setForm(prev => ({ ...prev, expense_account_id: acc.id }));
      }
    } catch {}
  };

  const fetchExpense = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/expenses/expenses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data.data;
      setForm({
        supplier_id: data.supplier_id || '',
        amount: data.amount || '',
        currency_id: data.currency_id || '',
        expense_date: data.expense_date || '',
        description: data.description || '',
        payment_method: data.payment_method || 'cash',
        payment_status: data.payment_status || 'full',
        payment_account_id: '',
        expense_account_id: data.expense_account_id || ''
      });
    } catch {
      setFormError('Failed to load expense.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); fetchCurrencies(); fetchDefaultExpenseAccount(); fetchExpense(); }, [id]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const getPaymentAccountOptions = (method) => {
    if (!method || chartAccounts.length === 0) return [];
    const isCash = method === 'cash';
    const preferredCode = isCash ? '1000' : '1010';
    const parentByCode = chartAccounts.find(acc => acc.code === preferredCode);
    const parentByName = chartAccounts.find(acc => {
      const name = (acc.name || '').toLowerCase();
      return isCash ? name.includes('cash') : name.includes('bank');
    });
    const parent = parentByCode || parentByName;
    if (!parent) return [];
    const children = chartAccounts.filter(acc => acc.parent_id === parent.id);
    return children.length > 0 ? children : [parent];
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      if (!form.amount || !form.currency_id || !form.expense_date || !form.payment_method || !form.payment_status) {
        setFormError('Please fill all required fields.');
        setFormLoading(false);
        return;
      }
      if (['cash', 'bank'].includes(form.payment_method) && !form.payment_account_id) {
        setFormError('Please select a payment account.');
        setFormLoading(false);
        return;
      }
      await axios.put(`${BASE_URL}/expenses/expenses/${id}`, {
        ...form,
        supplier_id: form.supplier_id || null,
        amount: parseFloat(form.amount),
        payment_account_id: form.payment_account_id || null,
        expense_account_id: form.expense_account_id || defaultExpenseAccount?.id || null
      }, { headers: { Authorization: `Bearer ${token}` } });
      navigate('/dashboard/expenses/expenses');
    } catch (err) {
      setFormError('Failed to update expense.');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-xs text-gray-500">Loading expense...</div>;
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
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          <h2 className="report-title">Edit Expense</h2>
          <p className="report-subtitle">Update expense details and payment information.</p>
        </div>
      </div>
      <div className="report-content-container ecl-table-container" style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
        padding: '0 20px 20px',
        height: '100%'
      }}>
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Supplier</label>
            <select name="supplier_id" value={form.supplier_id} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1 text-xs" style={{ borderRadius: 0 }}>
              <option value="">-- None --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Amount</label>
            <input type="number" name="amount" value={form.amount} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1 text-xs" style={{ borderRadius: 0 }} required step="0.01" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Currency</label>
            <select name="currency_id" value={form.currency_id} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1 text-xs" style={{ borderRadius: 0 }} required>
              <option value="">-- Select --</option>
              {currencies.map((c) => (
                <option key={c.id} value={c.id}>{c.code}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Date</label>
            <input type="date" name="expense_date" value={form.expense_date} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1 text-xs" style={{ borderRadius: 0 }} required />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Expense Account</label>
            <input type="text" value={defaultExpenseAccount ? `${defaultExpenseAccount.code} - ${defaultExpenseAccount.name}` : ''} className="w-full border border-gray-300 px-2 py-1 text-xs bg-gray-100" style={{ borderRadius: 0 }} readOnly />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Description</label>
            <input type="text" name="description" value={form.description} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1 text-xs" style={{ borderRadius: 0 }} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Payment Method</label>
            <select
              name="payment_method"
              value={form.payment_method}
              onChange={(e) => {
                handleFormChange(e);
                setForm(prev => ({ ...prev, payment_account_id: '' }));
              }}
              className="w-full border border-gray-300 px-2 py-1 text-xs"
              style={{ borderRadius: 0 }}
              required
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
            </select>
          </div>
          {['cash', 'bank'].includes(form.payment_method) && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">Payment Account</label>
              <select
                name="payment_account_id"
                value={form.payment_account_id}
                onChange={handleFormChange}
                className="w-full border border-gray-300 px-2 py-1 text-xs"
                style={{ borderRadius: 0 }}
                required
              >
                <option value="">-- Select --</option>
                {getPaymentAccountOptions(form.payment_method).map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Payment Status</label>
            <select name="payment_status" value={form.payment_status} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1 text-xs" style={{ borderRadius: 0 }} required>
              <option value="full">Full</option>
              <option value="partial">Partial</option>
              <option value="debt">Debt</option>
            </select>
          </div>
        </div>
        {formError && <div className="text-xs text-red-600">{formError}</div>}
        <div className="flex justify-end space-x-2 mt-4">
          <button type="button" className="px-3 py-1 text-xs text-gray-700 bg-gray-200 hover:bg-gray-300" style={{ borderRadius: 0 }} onClick={() => navigate('/dashboard/expenses/expenses')}>Cancel</button>
          <button type="submit" className="px-3 py-1 text-xs text-white bg-gray-900 hover:bg-gray-800" style={{ borderRadius: 0 }} disabled={formLoading}>{formLoading ? 'Saving...' : 'Save'}</button>
        </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpense;
