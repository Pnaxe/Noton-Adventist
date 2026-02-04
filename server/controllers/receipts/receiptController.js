const PDFDocument = require('pdfkit');
const { pool } = require('../../config/database');

class ReceiptController {
  /**
   * Generate fee payment receipt
   */
  async generateFeePaymentReceipt(req, res) {
    try {
      const { payment_id } = req.params;

      // Fetch payment details with student information
      const [payments] = await pool.execute(
        `SELECT 
          fp.*,
          s.Name as student_name,
          s.Surname as student_surname,
          s.RegNumber as student_reg_number,
          c.code as currency_code,
          c.symbol as currency_symbol,
          c.name as currency_name
        FROM fee_payments fp
        LEFT JOIN students s ON fp.student_reg_number = s.RegNumber
        LEFT JOIN currencies c ON fp.payment_currency = c.id
        WHERE fp.id = ?`,
        [payment_id]
      );

      if (payments.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      const payment = payments[0];

      // Generate PDF
      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 60, bottom: 60, left: 60, right: 60 }
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=receipt-${payment.receipt_number}.pdf`);

      // Pipe PDF to response
      doc.pipe(res);

      // Generate simple receipt format
      this.drawSimpleReceipt(doc, payment);

      // Finalize PDF
      doc.end();

    } catch (error) {
      console.error('Error generating receipt:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate receipt',
        error: error.message
      });
    }
  }

  /**
   * Generate boarding payment receipt
   * Can accept payment_id in params or receipt_number/other data in body
   */
  async generateBoardingPaymentReceipt(req, res) {
    try {
      let { payment_id } = req.params;
      
      // If payment_id not in params, try to find it from receipt_number in body
      if (!payment_id && req.body && req.body.receipt_number) {
        const [payments] = await pool.execute(
          'SELECT id FROM boarding_fees_payments WHERE receipt_number = ? LIMIT 1',
          [req.body.receipt_number]
        );
        if (payments.length > 0) {
          payment_id = payments[0].id;
        }
      }
      
      if (!payment_id) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID or receipt number is required'
        });
      }

      // Fetch payment details with student information
      const [payments] = await pool.execute(
        `SELECT 
          bfp.*,
          s.Name as student_name,
          s.Surname as student_surname,
          s.RegNumber as student_reg_number,
          h.name as hostel_name,
          c.code as currency_code,
          c.symbol as currency_symbol,
          c.name as currency_name
        FROM boarding_fees_payments bfp
        LEFT JOIN students s ON bfp.student_reg_number = s.RegNumber
        LEFT JOIN hostels h ON bfp.hostel_id = h.id
        LEFT JOIN currencies c ON bfp.currency_id = c.id
        WHERE bfp.id = ?`,
        [payment_id]
      );

      if (payments.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      const payment = payments[0];

      // Generate PDF
      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 60, bottom: 60, left: 60, right: 60 }
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=receipt-${payment.receipt_number}.pdf`);

      doc.pipe(res);

      // Generate simple receipt format
      this.drawSimpleReceipt(doc, payment);

      doc.end();

    } catch (error) {
      console.error('Error generating receipt:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate receipt',
        error: error.message
      });
    }
  }

  // Helper Methods - Simple Receipt Format
  drawSimpleReceipt(doc, payment) {
    const margin = 60;
    const pageWidth = doc.page.width;
    let currentY = margin;

    // Title: PAYMENT RECEIPT
    doc.fillColor('#000000')
       .fontSize(32)
       .font('Helvetica-Bold')
       .text('PAYMENT RECEIPT', margin, currentY, {
         width: pageWidth - margin * 2,
         align: 'center'
       });

    currentY += 50;

    // Horizontal line
    doc.strokeColor('#000000')
       .lineWidth(1)
       .moveTo(margin, currentY)
       .lineTo(pageWidth - margin, currentY)
       .stroke();

    currentY += 30;

    // Receipt Information Section
    doc.fillColor('#000000')
       .fontSize(12)
       .font('Helvetica')
       .text('Receipt Number:', margin, currentY)
       .font('Helvetica')
       .text(payment.receipt_number || 'N/A', margin + 120, currentY);

    currentY += 25;

    const paymentDate = payment.payment_date 
      ? new Date(payment.payment_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    doc.fontSize(12)
       .font('Helvetica')
       .text('Date:', margin, currentY)
       .font('Helvetica')
       .text(paymentDate, margin + 120, currentY);

    currentY += 40;

    // Student Information Section
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Student Information:', margin, currentY);

    currentY += 25;

    const studentName = `${payment.student_name || ''} ${payment.student_surname || ''}`.trim();
    
    doc.fontSize(12)
       .font('Helvetica')
       .text('Name:', margin, currentY)
       .font('Helvetica')
       .text(studentName || 'N/A', margin + 120, currentY);

    currentY += 25;

    doc.fontSize(12)
       .font('Helvetica')
       .text('Registration:', margin, currentY)
       .font('Helvetica')
       .text(payment.student_reg_number || 'N/A', margin + 120, currentY);

    currentY += 40;

    // Payment Details Section
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Payment Details:', margin, currentY);

    currentY += 25;

    const amount = parseFloat(payment.base_currency_amount || payment.amount_paid || 0);
    const currencySymbol = payment.currency_symbol || '$';

    doc.fontSize(12)
       .font('Helvetica')
       .text('Amount:', margin, currentY)
       .font('Helvetica')
       .text(`${amount.toFixed(2)} ${currencySymbol}`, margin + 120, currentY);

    currentY += 25;

    doc.fontSize(12)
       .font('Helvetica')
       .text('Payment Method:', margin, currentY)
       .font('Helvetica')
       .text(payment.payment_method || 'N/A', margin + 120, currentY);

    currentY += 25;

    doc.fontSize(12)
       .font('Helvetica')
       .text('Reference:', margin, currentY)
       .font('Helvetica')
       .text(payment.reference_number || payment.receipt_number || 'N/A', margin + 120, currentY);
  }

  // Legacy methods (kept for backwards compatibility but not used)
  drawHeader(doc, payment, primaryColor, textColor) {
    const pageWidth = doc.page.width;
    const margin = 50;

    // Logo area placeholder (you can add actual logo image here)
    doc.fillColor(primaryColor)
       .rect(margin, margin, 60, 60)
       .fill();

    // School Name
    doc.fillColor(primaryColor)
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('SCHOOL NAME', margin + 70, margin + 5, {
         width: pageWidth - margin * 2 - 150,
         align: 'left'
       });

    // Tagline
    doc.fillColor(textColor)
       .fontSize(10)
       .font('Helvetica')
       .text('TAGLINE WILL GO HERE', margin + 70, margin + 30, {
         width: pageWidth - margin * 2 - 150,
         align: 'left'
       });

    // Decorative shape (top right)
    doc.fillColor(primaryColor)
       .moveTo(pageWidth - 120, margin)
       .lineTo(pageWidth - margin, margin)
       .lineTo(pageWidth - margin, margin + 80)
       .lineTo(pageWidth - 150, margin + 60)
       .fill();

    // FEE RECEIPT Title
    doc.fillColor(primaryColor)
       .fontSize(36)
       .font('Helvetica-Bold')
       .text('FEE RECEIPT', margin, margin + 100, {
         width: 300,
         align: 'left'
       });

    // Underline
    doc.strokeColor(primaryColor)
       .lineWidth(3)
       .moveTo(margin, margin + 142)
       .lineTo(margin + 200, margin + 142)
       .stroke();
  }

  drawInvoiceInfo(doc, payment, primaryColor, textColor) {
    const pageWidth = doc.page.width;
    const margin = 50;

    doc.fillColor(textColor)
       .fontSize(10)
       .font('Helvetica')
       .text(`Invoice No: ${payment.receipt_number || 'N/A'}`, pageWidth - 250, margin + 110, {
         width: 200,
         align: 'left'
       });

    const invoiceDate = payment.payment_date 
      ? new Date(payment.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    doc.text(`Invoice Date: ${invoiceDate}`, pageWidth - 250, margin + 125, {
      width: 200,
      align: 'left'
    });
  }

  drawInvoiceTo(doc, payment, primaryColor, textColor) {
    const margin = 50;
    const startY = 200;

    doc.fillColor(textColor)
       .fontSize(10)
       .font('Helvetica')
       .text('Invoice to', margin, startY, {
         width: 400,
         align: 'left'
       });

    const studentName = `${payment.student_name || ''} ${payment.student_surname || ''}`.trim();
    
    doc.fillColor(primaryColor)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text(studentName || 'Student Name', margin, startY + 15, {
         width: 400,
         align: 'left'
       });

    doc.fillColor(textColor)
       .fontSize(9)
       .font('Helvetica')
       .text('Lorem Ipsum School Pvt Ltd', margin, startY + 35, {
         width: 400,
         align: 'left'
       })
       .text('Phone: +123 456 9870', margin, startY + 48, {
         width: 400,
         align: 'left'
       })
       .text('Email: info@email.com', margin, startY + 61, {
         width: 400,
         align: 'left'
       });
  }

  drawFeeTable(doc, feeItems, payment, startY, primaryColor, textColor, lightGray) {
    const margin = 50;
    const pageWidth = doc.page.width;
    const tableWidth = pageWidth - margin * 2;
    const col1Width = 60; // NO.
    const col2Width = tableWidth - col1Width - 150; // FEE DESCRIPTION
    const col3Width = 150; // AMOUNT

    // Table Header
    doc.fillColor(primaryColor)
       .rect(margin, startY, tableWidth, 25)
       .fill();

    doc.fillColor('#FFFFFF')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('NO.', margin + 5, startY + 7, { width: col1Width - 10, align: 'left' })
       .text('FEE DESCRIPTION', margin + col1Width + 5, startY + 7, { width: col2Width - 10, align: 'left' })
       .text('AMOUNT', margin + col1Width + col2Width + 5, startY + 7, { width: col3Width - 10, align: 'right' });

    // Table Rows
    let currentY = startY + 25;
    feeItems.forEach((item, index) => {
      const rowHeight = 25;
      const isEven = index % 2 === 0;

      // Background color for alternating rows
      if (isEven) {
        doc.fillColor(lightGray)
           .rect(margin, currentY, tableWidth, rowHeight)
           .fill();
      }

      // Row content
      doc.fillColor(textColor)
         .fontSize(10)
         .font('Helvetica')
         .text(String(index + 1).padStart(2, '0'), margin + 5, currentY + 7, { width: col1Width - 10, align: 'left' })
         .text(item.description, margin + col1Width + 5, currentY + 7, { width: col2Width - 10, align: 'left' })
         .font('Helvetica-Bold')
         .text(`${payment.currency_symbol || '$'}${item.amount.toFixed(2)}`, margin + col1Width + col2Width + 5, currentY + 7, { width: col3Width - 10, align: 'right' });

      // Row separator
      doc.strokeColor('#CCCCCC')
         .lineWidth(0.5)
         .moveTo(margin, currentY + rowHeight)
         .lineTo(margin + tableWidth, currentY + rowHeight)
         .stroke();

      currentY += rowHeight;
    });

    return currentY;
  }

  drawSummary(doc, feeItems, payment, startY, primaryColor, textColor) {
    const pageWidth = doc.page.width;
    const margin = 50;
    const summaryWidth = 250;
    const summaryX = pageWidth - margin - summaryWidth;

    let currentY = startY;

    // Calculate totals
    const subtotal = feeItems.reduce((sum, item) => sum + item.amount, 0);
    const discount = 0; // Can be added from payment data if available
    const total = subtotal - discount;

    // Summary items
    doc.fillColor(textColor)
       .fontSize(10)
       .font('Helvetica')
       .text('Subtotal:', summaryX, currentY, { width: summaryWidth - 80, align: 'left' })
       .text(`${payment.currency_symbol || '$'}${subtotal.toFixed(2)}`, summaryX + summaryWidth - 80, currentY, { width: 80, align: 'right' });

    currentY += 15;

    doc.text('Discount:', summaryX, currentY, { width: summaryWidth - 80, align: 'left' })
       .text(`${payment.currency_symbol || '$'}${discount.toFixed(2)}`, summaryX + summaryWidth - 80, currentY, { width: 80, align: 'right' });

    currentY += 20;

    // Total bar
    doc.fillColor(primaryColor)
       .rect(summaryX, currentY, summaryWidth, 25)
       .fill();

    doc.fillColor('#FFFFFF')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('TOTAL:', summaryX + 5, currentY + 7, { width: summaryWidth - 100, align: 'left' })
       .text(`${payment.currency_symbol || '$'}${total.toFixed(2)}`, summaryX + summaryWidth - 100, currentY + 7, { width: 95, align: 'right' });
  }

  drawPaymentMethod(doc, payment, primaryColor, textColor) {
    const margin = 50;
    const startY = doc.page.height - 250;

    doc.fillColor(primaryColor)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('Payment Method', margin, startY, {
         width: 400,
         align: 'left'
       });

    doc.fillColor(textColor)
       .fontSize(9)
       .font('Helvetica')
       .text(`Account No: ${payment.reference_number || 'N/A'}`, margin, startY + 18, {
         width: 400,
         align: 'left'
       })
       .text(`Account Name: ${payment.payment_method || 'N/A'}`, margin, startY + 31, {
         width: 400,
         align: 'left'
       })
       .text('Branch Name: XYZ', margin, startY + 44, {
         width: 400,
         align: 'left'
       });
  }

  drawTermsAndConditions(doc, primaryColor, textColor) {
    const margin = 50;
    const startY = doc.page.height - 180;

    doc.fillColor(primaryColor)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('Terms & Conditions', margin, startY, {
         width: 400,
         align: 'left'
       });

    doc.fillColor(textColor)
       .fontSize(8)
       .font('Helvetica')
       .text('Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s.', margin, startY + 18, {
         width: 400,
         align: 'left',
         lineGap: 3
       });
  }

  drawFooter(doc, primaryColor) {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 50;

    // Decorative shape (bottom left)
    doc.fillColor(primaryColor)
       .moveTo(margin, pageHeight - 80)
       .lineTo(margin + 70, pageHeight - 100)
       .lineTo(margin, pageHeight - 120)
       .lineTo(margin + 50, pageHeight - 120)
       .fill();
  }
}

module.exports = new ReceiptController();

