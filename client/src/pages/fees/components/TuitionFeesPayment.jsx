import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faUserGraduate, 
  faGraduationCap,
  faDollarSign,
  faCalendarAlt,
  faList,
  faCheck,
  faTimes,
  faPlus,
  faEye,
  faEdit,
  faTrash,
  faFileInvoiceDollar
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../contexts/AuthContext';
import BASE_URL from '../../../contexts/Api';
import axios from 'axios';
import SuccessModal from '../../../components/SuccessModal';
import ErrorModal from '../../../components/ErrorModal';
import { jsPDF } from 'jspdf';
import logo from '../../../assets/norton_logo.png';

const formatDate = (value) => {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return value;
  }
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return value;
  }
};

const TuitionFeesPayment = forwardRef((props, ref) => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [payments, setPayments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [limit] = useState(25);

  // Filter states
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState('tuition'); // 'tuition', 'additional'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [paymentMethods] = useState([
    { id: 'cash', name: 'Cash' },
    { id: 'bank_transfer', name: 'Bank Transfer' }
  ]);
  const [invoiceStructures, setInvoiceStructures] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chartAccounts, setChartAccounts] = useState([]);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState('');
  
  // View modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewModalLoading, setViewModalLoading] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [editPaymentLoading, setEditPaymentLoading] = useState(false);
  const [editReason, setEditReason] = useState('');
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [editFormData, setEditFormData] = useState({
    payment_amount: '',
    payment_currency: '',
    payment_method_id: '',
    payment_account_id: '',
    payment_date: '',
    reference_number: '',
    notes: ''
  });

  // Form states - Tuition
  const [tuitionFormData, setTuitionFormData] = useState({
    student_reg_number: '',
    gradelevel_class_id: '',
    term: '',
    academic_year: '',
    invoice_structure_id: '',
    amount: '',
    currency_id: '',
    payment_method_id: '',
    payment_account_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });


  // Form states - Additional Fees
  const [additionalFormData, setAdditionalFormData] = useState({
    student_reg_number: '',
    fee_assignment_id: '',
    payment_amount: '',
    currency_id: '',
    payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });

  // Success/Error modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Live search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setActiveSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    fetchPayments();
  }, [currentPage, activeSearchTerm, paymentMethodFilter, currencyFilter]);

  useEffect(() => {
    if (showPaymentModal) {
      fetchClasses();
      fetchCurrencies();
      fetchChartAccounts();
    }
  }, [showPaymentModal, paymentType]);

  // Fetch currencies on mount for filter
  useEffect(() => {
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (tuitionFormData.gradelevel_class_id && tuitionFormData.term && tuitionFormData.academic_year) {
      fetchInvoiceStructures();
    }
  }, [tuitionFormData.gradelevel_class_id, tuitionFormData.term, tuitionFormData.academic_year]);

  useEffect(() => {
    if (paymentType !== 'tuition') {
      return;
    }
    if (!tuitionFormData.payment_method_id) {
      setTuitionFormData(prev => ({ ...prev, payment_account_id: '' }));
      return;
    }
    const options = getAccountOptions(tuitionFormData.payment_method_id);
    if (options.length === 1) {
      setTuitionFormData(prev => ({ ...prev, payment_account_id: String(options[0].id) }));
      return;
    }
    if (options.length > 1) {
      const exists = options.some(opt => String(opt.id) === String(tuitionFormData.payment_account_id));
      if (!exists) {
        setTuitionFormData(prev => ({ ...prev, payment_account_id: '' }));
      }
    }
  }, [paymentType, tuitionFormData.payment_method_id, chartAccounts]);

  const handleOpenPaymentModal = () => {
    setShowPaymentModal(true);
    setPaymentType('tuition');
    setTuitionFormData({
      student_reg_number: '',
      gradelevel_class_id: '',
      term: '',
      academic_year: '',
      invoice_structure_id: '',
      amount: '',
      currency_id: '',
      payment_method_id: '',
      payment_account_id: '',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: ''
    });
    setAdditionalFormData({
      student_reg_number: '',
      fee_assignment_id: '',
      payment_amount: '',
      currency_id: '',
      payment_method: 'Cash',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: ''
    });
    setSelectedStudent(null);
    setSelectedStructure(null);
    setStudents([]);
    setSearchTerm('');
  };

  const isSysadmin = user?.username === 'sysadmin';

  const normalizePaymentMethodId = (method) => {
    const lower = String(method || '').toLowerCase();
    if (lower.includes('bank')) return 'bank_transfer';
    return 'cash';
  };

  const openEditPaymentModal = (payment) => {
    if (!payment) return;
    const methodId = normalizePaymentMethodId(payment.payment_method);
    setEditFormData({
      payment_amount: payment.payment_amount || payment.base_currency_amount || '',
      payment_currency: payment.payment_currency || payment.currency_id || '',
      payment_method_id: methodId,
      payment_account_id: payment.payment_account_id || '',
      payment_date: payment.payment_date ? payment.payment_date.split('T')[0] : '',
      reference_number: payment.reference_number || payment.receipt_number || '',
      notes: payment.notes || ''
    });
    setEditReason('');
    setShowEditPaymentModal(true);
    if (chartAccounts.length === 0) {
      fetchChartAccounts();
    }
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;
    if (!editReason.trim()) {
      setErrorMessage('Reason is required for editing a payment');
      setShowErrorModal(true);
      return;
    }
    if (['cash', 'bank_transfer'].includes(editFormData.payment_method_id) && !editFormData.payment_account_id) {
      setErrorMessage('Please select a payment account for the chosen payment method');
      setShowErrorModal(true);
      return;
    }
    setEditPaymentLoading(true);
    try {
      const payload = {
        payment_amount: parseFloat(editFormData.payment_amount),
        payment_currency: editFormData.payment_currency,
        payment_method: editFormData.payment_method_id === 'bank_transfer' ? 'Bank Transfer' : 'Cash',
        payment_date: editFormData.payment_date,
        reference_number: editFormData.reference_number,
        notes: editFormData.notes || '',
        payment_account_id: editFormData.payment_account_id || null,
        reason: editReason.trim()
      };

      await axios.put(`${BASE_URL}/fees/payments/${selectedPayment.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowEditPaymentModal(false);
      setShowViewModal(false);
      setSelectedPayment(null);
      await fetchPayments();
      setSuccessMessage('Payment updated successfully');
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error updating payment:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to update payment');
      setShowErrorModal(true);
    } finally {
      setEditPaymentLoading(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;
    if (!deleteReason.trim()) {
      setErrorMessage('Reason is required for deleting a payment');
      setShowErrorModal(true);
      return;
    }
    try {
      await axios.delete(`${BASE_URL}/fees/payments/${selectedPayment.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { reason: deleteReason.trim() }
      });
      setShowDeletePaymentModal(false);
      setShowViewModal(false);
      setSelectedPayment(null);
      await fetchPayments();
      setSuccessMessage('Payment deleted successfully');
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error deleting payment:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to delete payment');
      setShowErrorModal(true);
    }
  };

  // Expose openModal method to parent via ref
  useImperativeHandle(ref, () => ({
    openModal: handleOpenPaymentModal
  }));

  const fetchPayments = async () => {
    try {
      setTableLoading(true);
      setError(null);

      // Fetch fee payments
      const params = {
        page: currentPage,
        limit: limit
      };

      if (activeSearchTerm) {
        params.search = activeSearchTerm.trim();
      }

      if (paymentMethodFilter) {
        params.payment_method = paymentMethodFilter;
      }

      if (currencyFilter) {
        params.currency_id = currencyFilter;
      }

      const response = await axios.get(`${BASE_URL}/fees/payments`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        const paymentData = response.data.data || [];
        // Transform to include student name and format
        const formattedPayments = paymentData.map(payment => ({
          ...payment,
          student_name: payment.student_name || 'N/A',
          student_surname: payment.student_surname || 'N/A',
          student_reg_number: payment.student_reg_number || 'N/A',
          amount: payment.base_currency_amount || payment.payment_amount || 0,
          currency: payment.currency_symbol || payment.currency_name || '',
          payment_date: payment.payment_date || payment.created_at,
          payment_method: payment.payment_method || 'N/A',
          receipt_number: payment.receipt_number || 'N/A',
          reference_number: payment.reference_number || 'N/A'
        }));

        setPayments(formattedPayments);
        setTotalPages(response.data.pagination?.total_pages || 1);
        setTotalPayments(response.data.pagination?.total_items || 0);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      if (err.response) {
        setError(`Error: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`);
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const fetchChartAccounts = async () => {
    try {
      setAccountLoading(true);
      setAccountError('');
      const response = await axios.get(`${BASE_URL}/accounting/chart-of-accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setChartAccounts(response.data.data || []);
      } else {
        setAccountError('Failed to load chart of accounts.');
      }
    } catch (err) {
      setAccountError(err.response?.data?.message || 'Failed to load chart of accounts.');
    } finally {
      setAccountLoading(false);
    }
  };

  const getAccountOptions = (paymentMethodId) => {
    if (!paymentMethodId || chartAccounts.length === 0) {
      return [];
    }
    const isCash = paymentMethodId === 'cash';
    const preferredCode = isCash ? '1000' : '1010';
    const parentByCode = chartAccounts.find(acc => acc.code === preferredCode);
    const parentByName = chartAccounts.find(acc => {
      const name = (acc.name || '').toLowerCase();
      return isCash ? name.includes('cash') : name.includes('bank');
    });
    const parent = parentByCode || parentByName;
    if (!parent) {
      return [];
    }
    const children = chartAccounts.filter(acc => acc.parent_id === parent.id && acc.is_active !== 0);
    return children.length > 0 ? children : [parent];
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/classes/gradelevel-classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/currencies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrencies(response.data.data || []);
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };


  const fetchInvoiceStructures = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/fees/invoice-structures/class/${tuitionFormData.gradelevel_class_id}?term=${tuitionFormData.term}&academic_year=${tuitionFormData.academic_year}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setInvoiceStructures(response.data.data || []);
    } catch (error) {
      console.error('Error fetching invoice structures:', error);
      setInvoiceStructures([]);
    }
  };

  const searchStudents = async () => {
    if (!searchTerm.trim()) {
      setStudents([]);
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/students/search?query=${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.data || []);
    } catch (error) {
      console.error('Error searching students:', error);
      setStudents([]);
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setTuitionFormData(prev => ({
      ...prev,
      student_reg_number: student.RegNumber
    }));
    setAdditionalFormData(prev => ({
      ...prev,
      student_reg_number: student.RegNumber
    }));
    setStudents([]);
    setSearchTerm('');
  };

  const selectInvoiceStructure = (structure) => {
    setSelectedStructure(structure);
    setTuitionFormData(prev => ({
      ...prev,
      invoice_structure_id: structure.id,
      currency_id: structure.currency_id
    }));
  };

  const generateReferenceNumber = () => {
    return `REF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentType('tuition');
    setSelectedStudent(null);
    setSelectedStructure(null);
    setTuitionFormData({
      student_reg_number: '',
      gradelevel_class_id: '',
      term: '',
      academic_year: '',
      invoice_structure_id: '',
      amount: '',
      currency_id: '',
      payment_method_id: '',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: ''
    });
    setAdditionalFormData({
      student_reg_number: '',
      fee_assignment_id: '',
      payment_amount: '',
      currency_id: '',
      payment_method: 'Cash',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      setErrorMessage('Please select a student');
      setShowErrorModal(true);
      return;
    }

    // Validate based on payment type
    if (paymentType === 'tuition') {
      if (!tuitionFormData.amount || parseFloat(tuitionFormData.amount) <= 0) {
        setErrorMessage('Please enter a valid payment amount');
        setShowErrorModal(true);
        return;
      }
      if (!tuitionFormData.currency_id) {
        setErrorMessage('Please select a currency');
        setShowErrorModal(true);
        return;
      }
      if (!tuitionFormData.payment_method_id) {
        setErrorMessage('Please select a payment method');
        setShowErrorModal(true);
        return;
      }
      if (['cash', 'bank_transfer'].includes(tuitionFormData.payment_method_id)) {
        const options = getAccountOptions(tuitionFormData.payment_method_id);
        if (options.length > 0 && !tuitionFormData.payment_account_id) {
          setErrorMessage('Please select a payment account');
          setShowErrorModal(true);
          return;
        }
      }
      if (!tuitionFormData.reference_number) {
        setErrorMessage('Please enter a reference number');
        setShowErrorModal(true);
        return;
      }
    } else if (paymentType === 'additional') {
      if (!additionalFormData.payment_amount || parseFloat(additionalFormData.payment_amount) <= 0) {
        setErrorMessage('Please enter a valid payment amount');
        setShowErrorModal(true);
        return;
      }
      if (!additionalFormData.currency_id) {
        setErrorMessage('Please select a currency');
        setShowErrorModal(true);
        return;
      }
      if (!additionalFormData.fee_assignment_id) {
        setErrorMessage('Please select a fee assignment');
        setShowErrorModal(true);
        return;
      }
      if (!additionalFormData.reference_number) {
        setErrorMessage('Please enter a reference number');
        setShowErrorModal(true);
        return;
      }
    }

    setShowConfirmation(true);
  };

  const confirmPayment = async () => {
    setIsProcessing(true);
    try {
      let response;
      let receiptData;

      if (paymentType === 'tuition') {
        const paymentPayload = {
          student_reg_number: tuitionFormData.student_reg_number,
          payment_amount: parseFloat(tuitionFormData.amount),
          payment_currency: tuitionFormData.currency_id,
          payment_method: paymentMethods.find(m => m.id === tuitionFormData.payment_method_id)?.name || 'Cash',
          payment_date: tuitionFormData.payment_date,
          reference_number: tuitionFormData.reference_number,
          notes: tuitionFormData.notes || ''
        };

        if (tuitionFormData.payment_account_id) {
          paymentPayload.payment_account_id = tuitionFormData.payment_account_id;
        }
        
        if (tuitionFormData.invoice_structure_id) {
          paymentPayload.invoice_structure_id = tuitionFormData.invoice_structure_id;
        }

        response = await axios.post(`${BASE_URL}/fees/payments`, paymentPayload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const currencyInfo = currencies.find(c => c.id === tuitionFormData.currency_id);
          const currencyDisplay = currencyInfo
            ? `${currencyInfo.symbol || ''}${currencyInfo.code ? ` ${currencyInfo.code}` : ''}`.trim() || currencyInfo.name
            : '';
          receiptData = {
            receipt_number: response.data.data.receipt_number,
            student_name: `${selectedStudent.Name} ${selectedStudent.Surname}`,
            student_reg: selectedStudent.RegNumber,
            amount: tuitionFormData.amount,
            currency: currencyDisplay,
            payment_date: tuitionFormData.payment_date,
            payment_method: paymentMethods.find(m => m.id === tuitionFormData.payment_method_id)?.name || 'Cash',
            fee_type: 'tuition',
            reference_number: tuitionFormData.reference_number,
            class_name: selectedStructure?.class_name || 'N/A',
            term: selectedStructure?.term || 'N/A',
            academic_year: selectedStructure?.academic_year || 'N/A',
            notes: tuitionFormData.notes || ''
          };
        }
      } else if (paymentType === 'additional') {
        const paymentPayload = {
          student_reg_number: additionalFormData.student_reg_number,
          fee_assignment_id: additionalFormData.fee_assignment_id,
          payment_amount: parseFloat(additionalFormData.payment_amount),
          currency_id: additionalFormData.currency_id,
          payment_method: additionalFormData.payment_method,
          payment_date: additionalFormData.payment_date,
          reference_number: additionalFormData.reference_number,
          notes: additionalFormData.notes || ''
        };

        response = await axios.post(`${BASE_URL}/fees/additional/payments`, paymentPayload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const currencyInfo = currencies.find(c => c.id === additionalFormData.currency_id);
          const currencyDisplay = currencyInfo
            ? `${currencyInfo.symbol || ''}${currencyInfo.code ? ` ${currencyInfo.code}` : ''}`.trim() || currencyInfo.name
            : '';
          receiptData = {
            receipt_number: response.data.data.receipt_number,
            student_name: `${selectedStudent.Name} ${selectedStudent.Surname}`,
            student_reg: selectedStudent.RegNumber,
            amount: additionalFormData.payment_amount,
            currency: currencyDisplay,
            payment_date: additionalFormData.payment_date,
            payment_method: additionalFormData.payment_method,
            fee_type: 'additional',
            reference_number: additionalFormData.reference_number,
            notes: additionalFormData.notes || ''
          };
        }
      }

      if (response && response.data.success) {
        setReceipt(receiptData);
        setShowConfirmation(false);
        setShowPaymentModal(false);
        setShowReceipt(true);
        setSuccessMessage('Payment processed successfully');
        setShowSuccessModal(true);
        
        // Reset form
        handleClosePaymentModal();
        
        // Refresh payments table
        fetchPayments();
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Failed to process payment');
      }
      setShowErrorModal(true);
      setShowConfirmation(false);
      setShowPaymentModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setErrorMessage('');
  };

  const downloadReceipt = async () => {
    if (!receipt) return;

    const safe = (value) => (value === null || value === undefined || value === '' ? 'N/A' : value);
    const amountLine = `${safe(receipt.amount)} ${safe(receipt.currency)}`;

    const loadLogo = () => new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = logo;
    });

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;

    const logoImg = await loadLogo();
    if (logoImg) {
      const logoHeight = 40;
      const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
      doc.addImage(logoImg, 'PNG', margin, 40, logoWidth, logoHeight);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Norton Adventist', margin + 52, 60);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Payment Receipt', pageWidth - margin, 50, { align: 'right' });
    doc.text(safe(receipt.receipt_number), pageWidth - margin, 64, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 90, pageWidth - margin, 90);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Receipt Details', margin, 112);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Thank you for your payment.', margin, 126);

    const leftX = margin;
    const rightX = margin + contentWidth / 2 + 8;
    let y = 152;
    const rowGap = 34;

    const label = (text, x, yPos) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(text, x, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
    };

    label('Date', leftX, y);
    doc.text(safe(receipt.payment_date), leftX, y + 14);

    label('Reference', rightX, y);
    doc.text(safe(receipt.reference_number), rightX, y + 14);

    y += rowGap;
    label('Student', leftX, y);
    doc.text(safe(receipt.student_name), leftX, y + 14);

    label('Student Reg', rightX, y);
    doc.text(safe(receipt.student_reg), rightX, y + 14);

    y += rowGap;
    label('Payment Method', leftX, y);
    doc.text(safe(receipt.payment_method), leftX, y + 14);

    label('Class / Term', rightX, y);
    doc.text(`${safe(receipt.class_name)} • ${safe(receipt.term)} ${safe(receipt.academic_year)}`, rightX, y + 14);

    y += rowGap + 8;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 42, 6, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Amount Paid', margin + 12, y + 17);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(amountLine, pageWidth - margin - 12, y + 18, { align: 'right' });

    y += 70;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Generated by Norton Adventist', margin, y);
    doc.text('Keep this receipt for your records.', pageWidth - margin, y, { align: 'right' });

    doc.save(`receipt-${receipt.receipt_number}.pdf`);
  };

  const printReceipt = () => {
    if (!receipt) return;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      return;
    }

    const safe = (value) => (value === null || value === undefined || value === '' ? 'N/A' : value);
    const amountLine = `${safe(receipt.amount)} ${safe(receipt.currency)}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Nunito', Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #f8fafc; }
            .receipt { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; }
            .receipt-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
            .brand { display: flex; align-items: center; gap: 12px; }
            .brand img { height: 42px; }
            .brand h1 { font-size: 1.05rem; margin: 0; font-weight: 700; }
            .meta { text-align: right; font-size: 0.8rem; color: #64748b; }
            .receipt-body { padding: 18px 20px 8px 20px; }
            .title { font-size: 0.95rem; font-weight: 700; margin: 0 0 4px 0; }
            .subtitle { font-size: 0.75rem; color: #64748b; margin: 0 0 16px 0; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 20px; }
            .label { font-size: 0.7rem; color: #64748b; margin-bottom: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; }
            .value { font-size: 0.85rem; color: #0f172a; }
            .amount { margin-top: 16px; padding: 12px; background: #f1f5f9; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; }
            .amount .label { margin: 0; }
            .amount .value { font-size: 1rem; font-weight: 700; }
            .receipt-footer { padding: 14px 20px; border-top: 1px dashed #cbd5f5; font-size: 0.7rem; color: #64748b; display: flex; justify-content: space-between; align-items: center; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="receipt-header">
              <div class="brand">
                <img src="${logo}" alt="Logo" />
                <h1>Norton Adventist</h1>
              </div>
              <div class="meta">
                <div>Payment Receipt</div>
                <div>${safe(receipt.receipt_number)}</div>
              </div>
            </div>
            <div class="receipt-body">
              <div class="title">Receipt Details</div>
              <div class="subtitle">Thank you for your payment.</div>
              <div class="grid">
                <div>
                  <div class="label">Date</div>
                  <div class="value">${safe(receipt.payment_date)}</div>
                </div>
                <div>
                  <div class="label">Reference</div>
                  <div class="value">${safe(receipt.reference_number)}</div>
                </div>
                <div>
                  <div class="label">Student</div>
                  <div class="value">${safe(receipt.student_name)}</div>
                </div>
                <div>
                  <div class="label">Student Reg</div>
                  <div class="value">${safe(receipt.student_reg)}</div>
                </div>
                <div>
                  <div class="label">Payment Method</div>
                  <div class="value">${safe(receipt.payment_method)}</div>
                </div>
                <div>
                  <div class="label">Class / Term</div>
                  <div class="value">${safe(receipt.class_name)} • ${safe(receipt.term)} ${safe(receipt.academic_year)}</div>
                </div>
              </div>
              <div class="amount">
                <div class="label">Amount Paid</div>
                <div class="value">${amountLine}</div>
              </div>
            </div>
            <div class="receipt-footer">
              <div>Generated by Norton Adventist</div>
              <div>Keep this receipt for your records.</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const buildViewReceiptData = () => {
    if (!selectedPayment) return null;
    const studentName = selectedPayment.student_name && selectedPayment.student_surname
      ? `${selectedPayment.student_name} ${selectedPayment.student_surname}`
      : selectedPayment.student_name || 'N/A';
    const currencyLabel = `${selectedPayment.currency_symbol || ''}${selectedPayment.currency_name ? ` ${selectedPayment.currency_name}` : ''}`.trim();
    return {
      receipt_number: selectedPayment.receipt_number || 'N/A',
      payment_date: formatDate(selectedPayment.payment_date || selectedPayment.created_at),
      student_name: studentName,
      student_reg: selectedPayment.student_reg_number || 'N/A',
      amount: selectedPayment.base_currency_amount || selectedPayment.payment_amount || 0,
      currency: currencyLabel || 'N/A',
      payment_method: selectedPayment.payment_method || 'N/A',
      reference_number: selectedPayment.reference_number || 'N/A',
      class_name: selectedPayment.class_name || 'N/A',
      term: selectedPayment.term || 'N/A',
      academic_year: selectedPayment.academic_year || 'N/A',
      notes: selectedPayment.notes || ''
    };
  };

  const downloadViewReceipt = async () => {
    if (!selectedPayment) return;
    const data = buildViewReceiptData();
    if (!data) return;

    const safe = (value) => (value === null || value === undefined || value === '' ? 'N/A' : value);
    const amountLine = `${safe(data.amount)} ${safe(data.currency)}`;

    const loadLogo = () => new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = logo;
    });

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;

    const logoImg = await loadLogo();
    if (logoImg) {
      const logoHeight = 40;
      const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
      doc.addImage(logoImg, 'PNG', margin, 40, logoWidth, logoHeight);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Norton Adventist', margin + 52, 60);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Payment Receipt', pageWidth - margin, 50, { align: 'right' });
    doc.text(safe(data.receipt_number), pageWidth - margin, 64, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 90, pageWidth - margin, 90);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Receipt Details', margin, 112);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Thank you for your payment.', margin, 126);

    const leftX = margin;
    const rightX = margin + contentWidth / 2 + 8;
    let y = 152;
    const rowGap = 34;

    const label = (text, x, yPos) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(text, x, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
    };

    label('Date', leftX, y);
    doc.text(safe(data.payment_date), leftX, y + 14);

    label('Reference', rightX, y);
    doc.text(safe(data.reference_number), rightX, y + 14);

    y += rowGap;
    label('Student', leftX, y);
    doc.text(safe(data.student_name), leftX, y + 14);

    label('Student Reg', rightX, y);
    doc.text(safe(data.student_reg), rightX, y + 14);

    y += rowGap;
    label('Payment Method', leftX, y);
    doc.text(safe(data.payment_method), leftX, y + 14);

    label('Class / Term', rightX, y);
    doc.text(`${safe(data.class_name)} • ${safe(data.term)} ${safe(data.academic_year)}`, rightX, y + 14);

    y += rowGap + 8;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 42, 6, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Amount Paid', margin + 12, y + 17);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(amountLine, pageWidth - margin - 12, y + 18, { align: 'right' });

    y += 70;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Generated by Norton Adventist', margin, y);
    doc.text('Keep this receipt for your records.', pageWidth - margin, y, { align: 'right' });

    doc.save(`receipt-${safe(data.receipt_number)}.pdf`);
  };

  const printViewReceipt = () => {
    if (!selectedPayment) return;
    const data = buildViewReceiptData();
    if (!data) return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      return;
    }

    const safe = (value) => (value === null || value === undefined || value === '' ? 'N/A' : value);
    const amountLine = `${safe(data.amount)} ${safe(data.currency)}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Nunito', Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #f8fafc; }
            .receipt { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; }
            .receipt-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
            .brand { display: flex; align-items: center; gap: 12px; }
            .brand img { height: 42px; }
            .brand h1 { font-size: 1.05rem; margin: 0; font-weight: 700; }
            .meta { text-align: right; font-size: 0.8rem; color: #64748b; }
            .receipt-body { padding: 18px 20px 8px 20px; }
            .title { font-size: 0.95rem; font-weight: 700; margin: 0 0 4px 0; }
            .subtitle { font-size: 0.75rem; color: #64748b; margin: 0 0 16px 0; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 20px; }
            .label { font-size: 0.7rem; color: #64748b; margin-bottom: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; }
            .value { font-size: 0.85rem; color: #0f172a; }
            .amount { margin-top: 16px; padding: 12px; background: #f1f5f9; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; }
            .amount .label { margin: 0; }
            .amount .value { font-size: 1rem; font-weight: 700; }
            .receipt-footer { padding: 14px 20px; border-top: 1px dashed #cbd5f5; font-size: 0.7rem; color: #64748b; display: flex; justify-content: space-between; align-items: center; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="receipt-header">
              <div class="brand">
                <img src="${logo}" alt="Logo" />
                <h1>Norton Adventist</h1>
              </div>
              <div class="meta">
                <div>Payment Receipt</div>
                <div>${safe(data.receipt_number)}</div>
              </div>
            </div>
            <div class="receipt-body">
              <div class="title">Receipt Details</div>
              <div class="subtitle">Thank you for your payment.</div>
              <div class="grid">
                <div>
                  <div class="label">Date</div>
                  <div class="value">${safe(data.payment_date)}</div>
                </div>
                <div>
                  <div class="label">Reference</div>
                  <div class="value">${safe(data.reference_number)}</div>
                </div>
                <div>
                  <div class="label">Student</div>
                  <div class="value">${safe(data.student_name)}</div>
                </div>
                <div>
                  <div class="label">Student Reg</div>
                  <div class="value">${safe(data.student_reg)}</div>
                </div>
                <div>
                  <div class="label">Payment Method</div>
                  <div class="value">${safe(data.payment_method)}</div>
                </div>
                <div>
                  <div class="label">Class / Term</div>
                  <div class="value">${safe(data.class_name)} • ${safe(data.term)} ${safe(data.academic_year)}</div>
                </div>
              </div>
              <div class="amount">
                <div class="label">Amount Paid</div>
                <div class="value">${amountLine}</div>
              </div>
            </div>
            <div class="receipt-footer">
              <div>Generated by Norton Adventist</div>
              <div>Keep this receipt for your records.</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setPaymentMethodFilter('');
    setCurrencyFilter('');
    setSearchTerm('');
    setActiveSearchTerm('');
    setCurrentPage(1);
  };

  const hasActiveFilters = paymentMethodFilter || currencyFilter;

  const handleViewPayment = async (payment) => {
    try {
      setViewModalLoading(true);
      const response = await axios.get(`${BASE_URL}/fees/payments/${payment.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success && response.data.data) {
        setSelectedPayment(response.data.data);
        setShowViewModal(true);
      } else {
        setErrorMessage('Invalid response from server');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch payment details';
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setViewModalLoading(false);
    }
  };

  // Calculate display ranges for pagination
  const displayStart = payments.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalPayments);

  return (
    <>
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
                placeholder="Search by student name, registration number, or receipt number..."
                className="filter-input search-input"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
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

          {/* Payment Method Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px', fontSize: '0.75rem' }}>Payment Method:</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => {
                setPaymentMethodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-input"
              style={{ minWidth: '150px', width: '150px', fontSize: '0.75rem' }}
            >
              <option value="">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          {/* Currency Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px', fontSize: '0.75rem' }}>Currency:</label>
            <select
              value={currencyFilter}
              onChange={(e) => {
                setCurrencyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-input"
              style={{ minWidth: '150px', width: '150px', fontSize: '0.75rem' }}
            >
              <option value="">All Currencies</option>
              {currencies.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.name} ({currency.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="filter-group">
              <button
                onClick={handleClearFilters}
                className="filter-input"
                style={{
                  minWidth: 'auto',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                title="Clear all filters"
              >
                Clear Filters
              </button>
            </div>
          )}
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
        {tableLoading && payments.length === 0 ? (
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
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading payments...</p>
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
                <th style={{ padding: '6px 10px' }}>RECEIPT NUMBER</th>
                <th style={{ padding: '6px 10px' }}>STUDENT NAME</th>
                <th style={{ padding: '6px 10px' }}>REG NUMBER</th>
                <th style={{ padding: '6px 10px' }}>AMOUNT</th>
                <th style={{ padding: '6px 10px' }}>PAYMENT DATE</th>
                <th style={{ padding: '6px 10px' }}>PAYMENT METHOD</th>
                <th style={{ padding: '6px 10px' }}>REFERENCE</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr
                  key={payment.id}
                  style={{
                    height: '32px',
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>
                    {payment.receipt_number}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {payment.student_name} {payment.student_surname}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {payment.student_reg_number}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {payment.amount} {payment.currency}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {payment.payment_method}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {payment.reference_number}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleViewPayment(payment)}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="View Payment Details"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      {isSysadmin && (
                        <>
                          <button
                            onClick={() => openEditPaymentModal(payment)}
                            style={{ color: '#0f766e', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            title="Edit Payment"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setDeleteReason('');
                              setShowDeletePaymentModal(true);
                            }}
                            style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            title="Delete Payment"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {/* Empty placeholder rows to always show 25 rows */}
              {Array.from({ length: Math.max(0, 25 - payments.length) }).map((_, index) => (
                <tr
                  key={`empty-${index}`}
                  style={{
                    height: '32px',
                    backgroundColor: (payments.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer - Separate Container */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {totalPayments || 0} results.
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

      {/* Record Payment Modal */}
      {showPaymentModal && !showConfirmation && (
        <div className="modal-overlay" onClick={handleClosePaymentModal} style={{ zIndex: 1000 }}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Record Payment</h3>
              <button className="modal-close-btn" onClick={handleClosePaymentModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit} className="modal-form">
                {/* Payment Type Selection */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faList} style={{ color: '#10b981' }} />
                    Payment Type <span className="required">*</span>
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setPaymentType('tuition')}
                      style={{
                        padding: '12px',
                        border: `2px solid ${paymentType === 'tuition' ? '#2563eb' : 'var(--border-color)'}`,
                        borderRadius: '6px',
                        background: paymentType === 'tuition' ? '#eff6ff' : 'white',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: paymentType === 'tuition' ? 600 : 400,
                        color: paymentType === 'tuition' ? '#2563eb' : 'var(--text-primary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <FontAwesomeIcon icon={faGraduationCap} style={{ marginRight: '6px' }} />
                      Tuition Fees
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType('additional')}
                      style={{
                        padding: '12px',
                        border: `2px solid ${paymentType === 'additional' ? '#2563eb' : 'var(--border-color)'}`,
                        borderRadius: '6px',
                        background: paymentType === 'additional' ? '#eff6ff' : 'white',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: paymentType === 'additional' ? 600 : 400,
                        color: paymentType === 'additional' ? '#2563eb' : 'var(--text-primary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ marginRight: '6px' }} />
                      Additional Fees
                    </button>
                  </div>
                </div>

                {/* Student Search */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#10b981' }} />
                    Student Selection <span className="required">*</span>
                  </h4>
                  <div style={{ position: 'relative' }}>
                    <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <FontAwesomeIcon icon={faSearch} className="search-icon" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          searchStudents();
                        }}
                        placeholder="Search by name or registration number..."
                        className="filter-input search-input"
                      />
                    </div>
                    {students.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        marginTop: '4px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}>
                        {students.map((student) => (
                          <div
                            key={student.RegNumber}
                            onClick={() => selectStudent(student)}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f3f4f6',
                              fontSize: '0.75rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                              {student.Name} {student.Surname}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                              Reg: {student.RegNumber} | Class: {student.Class || 'N/A'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedStudent && (
                    <div style={{ 
                      marginTop: '12px',
                      background: '#d1fae5', 
                      border: '1px solid #6ee7b7', 
                      padding: '12px',
                      borderRadius: '4px',
                      fontSize: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <FontAwesomeIcon icon={faCheck} style={{ color: '#059669', marginRight: '8px', fontSize: '0.75rem' }} />
                        <span style={{ fontWeight: 500, color: '#065f46' }}>Student Selected Successfully</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        <div>
                          <span style={{ color: 'var(--text-secondary)' }}>Name:</span>
                          <span style={{ marginLeft: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>{selectedStudent.Name} {selectedStudent.Surname}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-secondary)' }}>Registration No:</span>
                          <span style={{ marginLeft: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>{selectedStudent.RegNumber}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tuition Form - Invoice Structure Selection (Optional) */}
                {paymentType === 'tuition' && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FontAwesomeIcon icon={faList} style={{ color: '#10b981' }} />
                      Invoice Structure <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>(Optional)</span>
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Class</label>
                        <select
                          value={tuitionFormData.gradelevel_class_id}
                          onChange={(e) => setTuitionFormData(prev => ({ ...prev, gradelevel_class_id: e.target.value, term: '', academic_year: '', invoice_structure_id: '' }))}
                          className="form-control"
                        >
                          <option value="">Select Class (Optional)</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name} - {cls.stream_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Term</label>
                        <select
                          value={tuitionFormData.term}
                          onChange={(e) => setTuitionFormData(prev => ({ ...prev, term: e.target.value, academic_year: '', invoice_structure_id: '' }))}
                          className="form-control"
                          disabled={!tuitionFormData.gradelevel_class_id}
                        >
                          <option value="">Select Term (Optional)</option>
                          <option value="Term 1">Term 1</option>
                          <option value="Term 2">Term 2</option>
                          <option value="Term 3">Term 3</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Academic Year</label>
                        <input
                          type="text"
                          value={tuitionFormData.academic_year}
                          onChange={(e) => setTuitionFormData(prev => ({ ...prev, academic_year: e.target.value, invoice_structure_id: '' }))}
                          placeholder="e.g., 2025 (Optional)"
                          className="form-control"
                          disabled={!tuitionFormData.gradelevel_class_id || !tuitionFormData.term}
                        />
                      </div>
                    </div>

                  {invoiceStructures.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ 
                        background: '#eff6ff', 
                        padding: '8px 12px', 
                        border: '1px solid var(--border-color)', 
                        marginBottom: '8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        color: '#1e40af',
                        fontWeight: 500
                      }}>
                        <p>Click on an invoice structure below to select (optional):</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {invoiceStructures.map((structure) => (
                          <div
                            key={structure.id}
                            onClick={() => selectInvoiceStructure(structure)}
                            style={{
                              padding: '12px',
                              border: `1px solid ${selectedStructure?.id === structure.id ? '#6b7280' : 'var(--border-color)'}`,
                              cursor: 'pointer',
                              borderRadius: '4px',
                              background: selectedStructure?.id === structure.id ? '#f9fafb' : 'transparent',
                              fontSize: '0.75rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <div>
                                <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                  {structure.class_name} - {structure.term} {structure.academic_year}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                  {structure.invoice_items?.length || 0} items
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                  {structure.total_amount} {structure.currency_symbol}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedStructure && (
                    <div style={{ 
                      marginTop: '16px',
                      background: '#d1fae5', 
                      border: '1px solid #6ee7b7', 
                      padding: '12px',
                      borderRadius: '4px',
                      fontSize: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <FontAwesomeIcon icon={faCheck} style={{ color: '#059669', marginRight: '8px', fontSize: '0.75rem' }} />
                          <span style={{ fontWeight: 500, color: '#065f46' }}>Invoice Structure Selected</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStructure(null);
                            setTuitionFormData(prev => ({ ...prev, invoice_structure_id: '' }));
                          }}
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-secondary)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 8px'
                          }}
                        >
                          Clear
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        <div>
                          <span style={{ color: 'var(--text-secondary)' }}>Selected:</span>
                          <span style={{ marginLeft: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>{selectedStructure.class_name} - {selectedStructure.term} {selectedStructure.academic_year}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-secondary)' }}>Total Amount:</span>
                          <span style={{ marginLeft: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>{selectedStructure.total_amount} {selectedStructure.currency_symbol}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                )}

                {/* Payment Details - Conditional based on payment type */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faDollarSign} style={{ color: '#10b981' }} />
                    Payment Details
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">
                        Amount <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={paymentType === 'tuition' ? tuitionFormData.amount : additionalFormData.payment_amount}
                        onChange={(e) => {
                          if (paymentType === 'tuition') {
                            setTuitionFormData(prev => ({ ...prev, amount: e.target.value }));
                          } else {
                            setAdditionalFormData(prev => ({ ...prev, payment_amount: e.target.value }));
                          }
                        }}
                        className="form-control"
                        required
                        placeholder="0.00"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Currency <span className="required">*</span>
                      </label>
                      <select
                        value={paymentType === 'tuition' ? tuitionFormData.currency_id : additionalFormData.currency_id}
                        onChange={(e) => {
                          if (paymentType === 'tuition') {
                            setTuitionFormData(prev => ({ ...prev, currency_id: e.target.value }));
                          } else {
                            setAdditionalFormData(prev => ({ ...prev, currency_id: e.target.value }));
                          }
                        }}
                        className="form-control"
                        required
                      >
                        <option value="">Select Currency</option>
                        {currencies.map((currency) => (
                          <option key={currency.id} value={currency.id}>
                            {currency.name} ({currency.symbol})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Payment Method <span className="required">*</span>
                      </label>
                      {paymentType === 'tuition' ? (
                        <select
                          value={tuitionFormData.payment_method_id}
                          onChange={(e) => setTuitionFormData(prev => ({ ...prev, payment_method_id: e.target.value, payment_account_id: '' }))}
                          className="form-control"
                          required
                        >
                          <option value="">Select Payment Method</option>
                          {paymentMethods.map((method) => (
                            <option key={method.id} value={method.id}>
                              {method.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={additionalFormData.payment_method}
                          onChange={(e) => {
                            setAdditionalFormData(prev => ({ ...prev, payment_method: e.target.value }));
                          }}
                          className="form-control"
                          required
                        >
                          <option value="">Select Payment Method</option>
                          <option value="Cash">Cash</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                      )}
                    </div>

                    {paymentType === 'tuition' && ['cash', 'bank_transfer'].includes(tuitionFormData.payment_method_id) && (
                      <div className="form-group">
                        <label className="form-label">
                          Payment Account <span className="required">*</span>
                        </label>
                        <select
                          value={tuitionFormData.payment_account_id}
                          onChange={(e) => setTuitionFormData(prev => ({ ...prev, payment_account_id: e.target.value }))}
                          className="form-control"
                          required
                          disabled={accountLoading}
                        >
                          <option value="">
                            {accountLoading ? 'Loading accounts...' : 'Select Account'}
                          </option>
                          {getAccountOptions(tuitionFormData.payment_method_id).map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.code} - {account.name}
                            </option>
                          ))}
                        </select>
                        {accountError && (
                          <div style={{ marginTop: '6px', fontSize: '0.7rem', color: '#dc2626' }}>
                            {accountError}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">
                        Payment Date <span className="required">*</span>
                      </label>
                      <input
                        type="date"
                        value={paymentType === 'tuition' ? tuitionFormData.payment_date : additionalFormData.payment_date}
                        onChange={(e) => {
                          if (paymentType === 'tuition') {
                            setTuitionFormData(prev => ({ ...prev, payment_date: e.target.value }));
                          } else {
                            setAdditionalFormData(prev => ({ ...prev, payment_date: e.target.value }));
                          }
                        }}
                        className="form-control"
                        required
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">
                        Reference Number <span className="required">*</span>
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={paymentType === 'tuition' ? tuitionFormData.reference_number : additionalFormData.reference_number}
                          onChange={(e) => {
                            if (paymentType === 'tuition') {
                              setTuitionFormData(prev => ({ ...prev, reference_number: e.target.value }));
                            } else {
                              setAdditionalFormData(prev => ({ ...prev, reference_number: e.target.value }));
                            }
                          }}
                          placeholder="Enter reference number"
                          className="form-control"
                          style={{ flex: 1 }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const refNum = generateReferenceNumber();
                            if (paymentType === 'tuition') {
                              setTuitionFormData(prev => ({ ...prev, reference_number: refNum }));
                            } else {
                              setAdditionalFormData(prev => ({ ...prev, reference_number: refNum }));
                            }
                          }}
                          className="modal-btn"
                          style={{ 
                            background: '#6b7280', 
                            color: 'white', 
                            padding: '6px 12px',
                            whiteSpace: 'nowrap',
                            fontSize: '0.7rem'
                          }}
                        >
                          Auto
                        </button>
                      </div>
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Notes</label>
                      <textarea
                        value={paymentType === 'tuition' ? tuitionFormData.notes : additionalFormData.notes}
                        onChange={(e) => {
                          if (paymentType === 'tuition') {
                            setTuitionFormData(prev => ({ ...prev, notes: e.target.value }));
                          } else {
                            setAdditionalFormData(prev => ({ ...prev, notes: e.target.value }));
                          }
                        }}
                        placeholder="Additional notes..."
                        className="form-control"
                        rows="2"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleClosePaymentModal}
                    className="modal-btn modal-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="modal-btn modal-btn-confirm"
                  >
                    {isProcessing ? 'Processing...' : 'Process Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && !showSuccessModal && !showErrorModal && (
        <div className="modal-overlay" onClick={handleCancelConfirmation} style={{ zIndex: 1001 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Payment</h3>
              <button className="modal-close-btn" onClick={handleCancelConfirmation}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}><strong>Student:</strong> {selectedStudent?.Name} {selectedStudent?.Surname}</p>
                <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}>
                  <strong>Amount:</strong> {
                    paymentType === 'tuition' ? tuitionFormData.amount :
                    additionalFormData.payment_amount
                  } {
                    currencies.find(c => c.id == (
                      paymentType === 'tuition' ? tuitionFormData.currency_id :
                      additionalFormData.currency_id
                    ))?.symbol
                  }
                </p>
                <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}>
                  <strong>Reference:</strong> {
                    paymentType === 'tuition' ? tuitionFormData.reference_number :
                    additionalFormData.reference_number
                  }
                </p>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={handleCancelConfirmation} className="modal-btn modal-btn-cancel">Cancel</button>
                <button onClick={confirmPayment} disabled={isProcessing} className="modal-btn modal-btn-confirm">
                  {isProcessing ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && receipt && !showSuccessModal && !showErrorModal && (
        <div className="modal-overlay" onClick={() => setShowReceipt(false)} style={{ zIndex: 1002 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Payment Receipt</h3>
              <button className="modal-close-btn" onClick={() => setShowReceipt(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={logo} alt="Logo" style={{ height: '34px' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Norton Adventist</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#64748b' }}>
                    <div>Payment Receipt</div>
                    <div style={{ fontWeight: 600 }}>{receipt.receipt_number}</div>
                  </div>
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Receipt Details</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '12px' }}>Thank you for your payment.</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Date</div>
                      <div style={{ fontSize: '0.8rem', color: '#0f172a' }}>{receipt.payment_date}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Reference</div>
                      <div style={{ fontSize: '0.8rem', color: '#0f172a' }}>{receipt.reference_number || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Student</div>
                      <div style={{ fontSize: '0.8rem', color: '#0f172a' }}>{receipt.student_name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Student Reg</div>
                      <div style={{ fontSize: '0.8rem', color: '#0f172a' }}>{receipt.student_reg}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Payment Method</div>
                      <div style={{ fontSize: '0.8rem', color: '#0f172a' }}>{receipt.payment_method}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Class / Term</div>
                      <div style={{ fontSize: '0.8rem', color: '#0f172a' }}>
                        {receipt.class_name || 'N/A'} • {receipt.term || 'N/A'} {receipt.academic_year || ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '14px', padding: '10px 12px', background: '#f1f5f9', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>Amount Paid</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                      {receipt.amount} {receipt.currency}
                    </div>
                  </div>
                </div>
                <div style={{ padding: '10px 16px', borderTop: '1px dashed #cbd5f5', fontSize: '0.65rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Generated by Norton Adventist</span>
                  <span>Keep this receipt for your records.</span>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={printReceipt} className="modal-btn modal-btn-confirm">Print</button>
                <button onClick={downloadReceipt} className="modal-btn modal-btn-confirm">Download PDF</button>
                <button onClick={() => setShowReceipt(false)} className="modal-btn modal-btn-cancel">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Payment Modal */}
      {showViewModal && selectedPayment && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)} style={{ zIndex: 1003 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Payment Receipt</h3>
              <button className="modal-close-btn" onClick={() => setShowViewModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              {viewModalLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                  <div className="loading-spinner"></div>
                </div>
              ) : (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={logo} alt="Logo" style={{ height: '34px' }} />
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Norton Adventist</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#64748b' }}>
                      <div>Payment Receipt</div>
                      <div style={{ fontWeight: 600 }}>{selectedPayment.receipt_number || 'N/A'}</div>
                    </div>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Receipt Details</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '12px' }}>Thank you for your payment.</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Date</div>
                        <div style={{ fontSize: '0.8rem', color: '#0f172a' }}>{formatDate(selectedPayment.payment_date || selectedPayment.created_at)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Reference</div>
                        <div style={{ fontSize: '0.8rem', color: '#0f172a' }}>{selectedPayment.reference_number || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Student</div>
                        <div style={{ fontSize: '0.8rem', color: '#0f172a' }}>
                          {selectedPayment.student_name && selectedPayment.student_surname 
                            ? `${selectedPayment.student_name} ${selectedPayment.student_surname}`
                            : selectedPayment.student_name || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Student Reg</div>
                        <div style={{ fontSize: '0.8rem', color: '#0f172a' }}>{selectedPayment.student_reg_number || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Payment Method</div>
                        <div style={{ fontSize: '0.8rem', color: '#0f172a' }}>{selectedPayment.payment_method || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Class / Term</div>
                        <div style={{ fontSize: '0.8rem', color: '#0f172a' }}>
                          {selectedPayment.class_name || 'N/A'} • {selectedPayment.term || 'N/A'} {selectedPayment.academic_year || ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '14px', padding: '10px 12px', background: '#f1f5f9', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>Amount Paid</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                        {selectedPayment.base_currency_amount || selectedPayment.payment_amount || 0} {selectedPayment.currency_symbol || selectedPayment.currency_name || ''}
                      </div>
                    </div>
                    {selectedPayment.notes && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Notes</div>
                        <div style={{ fontSize: '0.75rem', color: '#0f172a', background: '#f8fafc', borderRadius: '6px', padding: '8px' }}>
                          {selectedPayment.notes}
                        </div>
                      </div>
                    )}
                    {selectedPayment.created_at && (
                      <div style={{ marginTop: '12px', fontSize: '0.65rem', color: '#64748b' }}>
                        Created at: {formatDateTime(selectedPayment.created_at)}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: '1px dashed #cbd5f5', fontSize: '0.65rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Generated by Norton Adventist</span>
                    <span>Keep this receipt for your records.</span>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              {isSysadmin && (
                <>
                  <button
                    onClick={() => openEditPaymentModal(selectedPayment)}
                    className="modal-btn modal-btn-confirm"
                  >
                    Edit Payment
                  </button>
                  <button
                    onClick={() => {
                      setDeleteReason('');
                      setShowDeletePaymentModal(true);
                    }}
                    className="modal-btn modal-btn-delete"
                  >
                    Delete Payment
                  </button>
                </>
              )}
              <button onClick={printViewReceipt} className="modal-btn modal-btn-confirm">Print</button>
              <button onClick={downloadViewReceipt} className="modal-btn modal-btn-confirm">Download PDF</button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedPayment(null);
                }}
                className="modal-btn modal-btn-cancel"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditPaymentModal && selectedPayment && (
        <div className="modal-overlay" onClick={() => setShowEditPaymentModal(false)} style={{ zIndex: 1004 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Payment</h3>
              <button className="modal-close-btn" onClick={() => setShowEditPaymentModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '12px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                  {selectedPayment.student_name && selectedPayment.student_surname
                    ? `${selectedPayment.student_name} ${selectedPayment.student_surname}`
                    : selectedPayment.student_name || 'Student'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {selectedPayment.student_reg_number || 'N/A'}
                </div>
              </div>
              <form onSubmit={handleUpdatePayment} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Amount <span className="required">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={editFormData.payment_amount}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, payment_amount: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Currency <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={editFormData.payment_currency}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, payment_currency: e.target.value }))}
                    required
                  >
                    <option value="">Select Currency</option>
                    {currencies.map((currency) => (
                      <option key={currency.id} value={currency.id}>
                        {currency.name} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={editFormData.payment_method_id}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, payment_method_id: e.target.value, payment_account_id: '' }))}
                    required
                  >
                    <option value="">Select Payment Method</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                {['cash', 'bank_transfer'].includes(editFormData.payment_method_id) && (
                  <div className="form-group">
                    <label className="form-label">Payment Account <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={editFormData.payment_account_id}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, payment_account_id: e.target.value }))}
                      required
                      disabled={accountLoading}
                    >
                      <option value="">
                        {accountLoading ? 'Loading accounts...' : 'Select Account'}
                      </option>
                      {getAccountOptions(editFormData.payment_method_id).map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </select>
                    {accountError && (
                      <div style={{ marginTop: '6px', fontSize: '0.7rem', color: '#dc2626' }}>
                        {accountError}
                      </div>
                    )}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Payment Date <span className="required">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={editFormData.payment_date}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reference Number <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFormData.reference_number}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reason <span className="required">*</span></label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    required
                  />
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" onClick={() => setShowEditPaymentModal(false)} className="modal-btn modal-btn-cancel">
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn modal-btn-confirm" disabled={editPaymentLoading}>
                    {editPaymentLoading ? 'Updating...' : 'Update Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Payment Modal */}
      {showDeletePaymentModal && selectedPayment && (
        <div className="modal-overlay" onClick={() => setShowDeletePaymentModal(false)} style={{ zIndex: 1005 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Payment</h3>
              <button className="modal-close-btn" onClick={() => setShowDeletePaymentModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
                This will permanently delete the payment and recompute balances. This action cannot be undone.
              </div>
              <div className="form-group">
                <label className="form-label">Reason <span className="required">*</span></label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="modal-btn modal-btn-cancel" onClick={() => setShowDeletePaymentModal(false)}>
                Cancel
              </button>
              <button className="modal-btn modal-btn-delete" onClick={handleDeletePayment}>
                Delete Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />
    </>
  );
});

export default TuitionFeesPayment;
