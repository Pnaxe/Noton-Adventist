const express = require('express');
const router = express.Router();
const ReceiptController = require('../../controllers/receipts/receiptController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Receipt generation routes
router.get('/fee-payment/:payment_id', requireRole(['STUDENT_BILLING', 'ACCOUNTING_MANAGEMENT', 'ACCOUNTING_VIEW', 'ADMIN']), ReceiptController.generateFeePaymentReceipt);
router.get('/boarding-payment/:payment_id', requireRole(['BOARDING_MANAGEMENT', 'BOARDING_VIEW', 'ACCOUNTING_MANAGEMENT', 'ACCOUNTING_VIEW', 'ADMIN']), ReceiptController.generateBoardingPaymentReceipt);

module.exports = router;

