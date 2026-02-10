import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AddExpense = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    supplier_id: '', 
    amount: '', 
    currency_id: '', 
    expense_date: '', 
    description: '', 
    payment_method: 'cash', 
    payment_status: 'full', 
    expense_account_id: '',
    payment_account_id: '',
    amount_paid: '',
    reference_number: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [expenseAccounts, setExpenseAccounts] = useState([]);
  const [chartAccounts, setChartAccounts] = useState([]);

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

  const fetchExpenseAccounts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/accounting/chart-of-accounts`, { headers: { Authorization: `Bearer ${token}` } });
      const accounts = res.data.data || [];
      setChartAccounts(accounts);
      setExpenseAccounts(accounts.filter(acc => acc.type === 'Expense'));
    } catch {}
  };

  useEffect(() => { fetchSuppliers(); fetchCurrencies(); fetchExpenseAccounts(); }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Auto-calculate amount paid for partial payments
    if (name === 'amount' && form.payment_status === 'partial') {
      const totalAmount = parseFloat(value) || 0;
      const amountPaid = parseFloat(form.amount_paid) || 0;
      if (amountPaid > totalAmount) {
        setForm(prev => ({ ...prev, amount_paid: value }));
      }
    }
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

  const generateReferenceNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `EXP-${timestamp}-${random}`;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    
    try {
      if (!form.amount || !form.currency_id || !form.expense_date || !form.payment_method || !form.payment_status || !form.expense_account_id) {
        setFormError('Please fill all required fields.');
        setFormLoading(false);
        return;
      }

      if (!form.reference_number) {
        setFormError('Please add a reference number.');
        setFormLoading(false);
        return;
      }
      if (['cash', 'bank'].includes(form.payment_method) && !form.payment_account_id) {
        setFormError('Please select a payment account.');
        setFormLoading(false);
        return;
      }

      // Validate partial payment
      if (form.payment_status === 'partial') {
        if (!form.amount_paid || parseFloat(form.amount_paid) <= 0) {
          setFormError('Please enter the amount paid for partial payment.');
          setFormLoading(false);
          return;
        }
        if (parseFloat(form.amount_paid) >= parseFloat(form.amount)) {
          setFormError('Amount paid must be less than total amount for partial payment.');
          setFormLoading(false);
          return;
        }
      }

      await axios.post(`${BASE_URL}/expenses/expenses`, {
        ...form,
        supplier_id: form.supplier_id || null,
        amount: parseFloat(form.amount),
        amount_paid: form.payment_status === 'partial' ? parseFloat(form.amount_paid) : null,
        expense_account_id: form.expense_account_id,
        payment_account_id: form.payment_account_id || null,
        reference_number: form.reference_number
      }, { headers: { Authorization: `Bearer ${token}` } });
      navigate('/dashboard/expenses/expenses');
    } catch (err) {
      setFormError('Failed to save expense.');
    } finally {
      setFormLoading(false);
    }
  };

  const remainingAmount = form.amount && form.amount_paid ? 
    (parseFloat(form.amount) - parseFloat(form.amount_paid)).toFixed(2) : '';

  return (
    <div className="bg-white border border-gray-200 p-4 w-full">
      <h1 className="text-base font-medium text-gray-900 mb-4">Record Expense</h1>
      <form onSubmit={handleFormSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Supplier</label>
            <select name="supplier_id" value={form.supplier_id} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500">
              <option value="">-- None --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Total Amount</label>
            <input type="number" name="amount" value={form.amount} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" required step="0.01" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
            <select name="currency_id" value={form.currency_id} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" required>
              <option value="">-- Select --</option>
              {currencies.map((c) => (
                <option key={c.id} value={c.id}>{c.code}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
            <input type="date" name="expense_date" value={form.expense_date} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Expense Account</label>
            <select name="expense_account_id" value={form.expense_account_id} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" required>
              <option value="">-- Select --</option>
              {expenseAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              name="payment_method"
              value={form.payment_method}
              onChange={(e) => {
                handleFormChange(e);
                setForm(prev => ({ ...prev, payment_account_id: '' }));
              }}
              className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              required
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
            </select>
          </div>
          {['cash', 'bank'].includes(form.payment_method) && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Account</label>
              <select
                name="payment_account_id"
                value={form.payment_account_id}
                onChange={handleFormChange}
                className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
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
            <label className="block text-xs font-medium text-gray-700 mb-1">Payment Status</label>
            <select name="payment_status" value={form.payment_status} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" required>
              <option value="full">Full Payment</option>
              <option value="partial">Partial Payment</option>
              <option value="debt">Credit/Debt</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reference Number</label>
            <div className="flex space-x-2">
              <input type="text" name="reference_number" value={form.reference_number} onChange={handleFormChange} placeholder="Enter reference" className="flex-1 border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" />
              <button type="button" onClick={() => setForm(prev => ({...prev, reference_number: generateReferenceNumber()}))} className="bg-gray-600 text-white px-2 py-1.5 text-xs hover:bg-gray-700">Auto</button>
            </div>
          </div>
          {form.payment_status === 'partial' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount Paid</label>
              <input type="number" name="amount_paid" value={form.amount_paid} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" required step="0.01" />
              {remainingAmount && (
                <div className="text-xs text-gray-500 mt-1">
                  Remaining: {remainingAmount}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="w-full">
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <input type="text" name="description" value={form.description} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" />
        </div>
        {formError && <div className="text-xs text-red-600">{formError}</div>}
        <div className="flex justify-end space-x-2">
          <button type="button" className="px-3 py-1.5 border border-gray-300 text-xs text-gray-700 hover:bg-gray-50" onClick={() => navigate('/dashboard/expenses/expenses')}>Cancel</button>
          <button type="submit" className="px-3 py-1.5 bg-gray-900 text-white text-xs hover:bg-gray-800" disabled={formLoading}>{formLoading ? 'Saving...' : 'Save Expense'}</button>
        </div>
      </form>
    </div>
  );
};

export default AddExpense;
