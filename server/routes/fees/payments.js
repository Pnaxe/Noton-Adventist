const express = require('express');
const router = express.Router();

// Import controllers
const feePaymentController = require('../../controllers/fees/feePaymentController');
const ReceiptController = require('../../controllers/receipts/receiptController');

// Import middleware
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Fee payment routes
router.post('/', requireRole('STUDENT_BILLING'), feePaymentController.processPayment);
router.get('/', requireRole(['STUDENT_BILLING', 'ACCOUNTING_MANAGEMENT', 'ACCOUNTING_VIEW', 'ADMIN']), feePaymentController.getAllPayments);

// Other fee payment routes
router.get('/:id', requireRole('STUDENT_BILLING'), feePaymentController.getPaymentById);
router.get('/student/:student_reg_number', requireRole('STUDENT_BILLING'), feePaymentController.getPaymentsByStudent);
router.post('/:id/refund', requireRole('STUDENT_BILLING'), feePaymentController.refundPayment);
router.get('/student/:student_reg_number/summary', requireRole('STUDENT_BILLING'), feePaymentController.getPaymentSummary);

// Receipt generation route
router.get('/:id/receipt', requireRole(['STUDENT_BILLING', 'ACCOUNTING_MANAGEMENT', 'ACCOUNTING_VIEW', 'ADMIN']), async (req, res, next) => {
  try {
    req.params.payment_id = req.params.id;
    return await ReceiptController.generateFeePaymentReceipt(req, res);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
