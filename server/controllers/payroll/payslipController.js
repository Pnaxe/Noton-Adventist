const { pool } = require('../../config/database');

class PayslipController {
  // Create a new payslip
  static async createPayslip(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const {
        employee_id,
        pay_period,
        pay_date,
        currency: currencyBody,
        payment_method,
        bank_account_id: bankAccountIdRaw,
        earnings,
        deductions: deductionsRaw,
        notes
      } = req.body;

      const created_by = req.user?.id ?? null;
      const currency = currencyBody || 'USD';
      const deductions = Array.isArray(deductionsRaw) ? deductionsRaw : [];
      // Use null for bank_account_id when empty string or when not bank transfer (avoids FK violation)
      const bank_account_id =
        payment_method === 'bank' && bankAccountIdRaw != null && bankAccountIdRaw !== ''
          ? (typeof bankAccountIdRaw === 'number' ? bankAccountIdRaw : parseInt(bankAccountIdRaw, 10))
          : null;

      // Validate required fields
      if (!employee_id || !pay_period || !pay_date || !payment_method || !earnings || earnings.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID, pay period, pay date, payment method, and at least one earning are required'
        });
      }

      // Validate bank account for bank transfers
      if (payment_method === 'bank' && (bank_account_id == null || isNaN(bank_account_id))) {
        return res.status(400).json({
          success: false,
          message: 'Bank account is required for bank transfer payments'
        });
      }

      // Calculate totals
      const totalEarnings = earnings
        .filter(e => e && (e.label || e.label === 0) && (e.amount != null && e.amount !== ''))
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

      const totalDeductions = deductions
        .filter(d => d && (d.label || d.label === 0) && (d.amount != null && d.amount !== ''))
        .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

      const netPay = totalEarnings - totalDeductions;

      const employeeIdInt = parseInt(employee_id, 10);
      if (isNaN(employeeIdInt)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid employee ID'
        });
      }

      // Insert payslip (use null for created_by if not set)
      const [payslipResult] = await connection.execute(
        `INSERT INTO payslips (
          employee_id, pay_period, pay_date, currency, 
          payment_method, bank_account_id,
          total_earnings, total_deductions, net_pay, 
          notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [employeeIdInt, pay_period, pay_date, currency, payment_method, bank_account_id, totalEarnings, totalDeductions, netPay, notes || null, created_by]
      );

      const payslipId = payslipResult.insertId;

      // Insert earnings
      for (const earning of earnings) {
        if (earning.label && earning.amount) {
          await connection.execute(
            `INSERT INTO payslip_earnings (payslip_id, label, amount, currency) 
             VALUES (?, ?, ?, ?)`,
            [payslipId, earning.label, earning.amount, earning.currency || currency]
          );
        }
      }

      // Insert deductions
      for (const deduction of deductions) {
        if (deduction.label && deduction.amount) {
          await connection.execute(
            `INSERT INTO payslip_deductions (payslip_id, label, amount, currency) 
             VALUES (?, ?, ?, ?)`,
            [payslipId, deduction.label, deduction.amount, deduction.currency || currency]
          );
        }
      }

      await connection.commit();

      // Fetch the created payslip with details
      const [payslip] = await connection.execute(
        `SELECT p.*, e.full_name as employee_name, e.employee_id, d.name as department_name, jt.title as job_title
         FROM payslips p
         JOIN employees e ON p.employee_id = e.id
         LEFT JOIN departments d ON e.department_id = d.id
         LEFT JOIN job_titles jt ON e.job_title_id = jt.id
         WHERE p.id = ?`,
        [payslipId]
      );

      const [earningsData] = await connection.execute(
        'SELECT * FROM payslip_earnings WHERE payslip_id = ?',
        [payslipId]
      );

      const [deductionsData] = await connection.execute(
        'SELECT * FROM payslip_deductions WHERE payslip_id = ?',
        [payslipId]
      );

      res.status(201).json({
        success: true,
        message: 'Payslip created successfully',
        data: {
          ...payslip[0],
          earnings: earningsData,
          deductions: deductionsData
        }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error creating payslip:', error);
      const message = error.message || 'Failed to create payslip';
      res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Failed to create payslip' : message,
        error: error.message
      });
    } finally {
      connection.release();
    }
  }

  // Get all payslips with filters
  static async getPayslips(req, res) {
    try {
      const {
        employee_id,
        pay_period,
        status,
        page = 1,
        limit = 10,
        search
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (employee_id) {
        whereClause += ' AND p.employee_id = ?';
        params.push(employee_id);
      }

      if (pay_period) {
        whereClause += ' AND p.pay_period = ?';
        params.push(pay_period);
      }

      if (status) {
        whereClause += ' AND p.status = ?';
        params.push(status);
      }

      if (search) {
        whereClause += ' AND (e.full_name LIKE ? OR e.employee_id LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      // Get total count
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total
         FROM payslips p
         JOIN employees e ON p.employee_id = e.id
         LEFT JOIN departments d ON e.department_id = d.id
         LEFT JOIN job_titles jt ON e.job_title_id = jt.id
         ${whereClause}`,
        params
      );

      const total = countResult[0].total;

      // Get payslips
      const [payslips] = await pool.execute(
        `SELECT p.*, e.full_name as employee_name, e.employee_id, d.name as department_name, jt.title as job_title
         FROM payslips p
         JOIN employees e ON p.employee_id = e.id
         LEFT JOIN departments d ON e.department_id = d.id
         LEFT JOIN job_titles jt ON e.job_title_id = jt.id
         ${whereClause}
         ORDER BY p.created_at DESC
         LIMIT ${limitNum} OFFSET ${offset}`,
        params
      );

      res.json({
        success: true,
        data: payslips,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });

    } catch (error) {
      console.error('Error fetching payslips:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payslips',
        error: error.message
      });
    }
  }

  // Get single payslip by ID
  static async getPayslipById(req, res) {
    try {
      const { id } = req.params;

      const [payslip] = await pool.execute(
        `SELECT p.*, e.full_name as employee_name, e.employee_id as employee_code, d.name as department_name, jt.title as job_title
         FROM payslips p
         JOIN employees e ON p.employee_id = e.id
         LEFT JOIN departments d ON e.department_id = d.id
         LEFT JOIN job_titles jt ON e.job_title_id = jt.id
         WHERE p.id = ?`,
        [id]
      );

      if (payslip.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payslip not found'
        });
      }

      const [earnings] = await pool.execute(
        'SELECT * FROM payslip_earnings WHERE payslip_id = ?',
        [id]
      );

      const [deductions] = await pool.execute(
        'SELECT * FROM payslip_deductions WHERE payslip_id = ?',
        [id]
      );

      res.json({
        success: true,
        data: {
          ...payslip[0],
          earnings,
          deductions
        }
      });

    } catch (error) {
      console.error('Error fetching payslip:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payslip',
        error: error.message
      });
    }
  }

  // Update payslip status
  static async updatePayslipStatus(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'processed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be pending, processed, or cancelled'
        });
      }

      const [result] = await connection.execute(
        'UPDATE payslips SET status = ? WHERE id = ?',
        [status, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payslip not found'
        });
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Payslip status updated successfully'
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error updating payslip status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payslip status',
        error: error.message
      });
    } finally {
      connection.release();
    }
  }

  // Update full payslip (only when status is pending)
  static async updatePayslip(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { id } = req.params;
      const {
        employee_id,
        pay_period,
        pay_date,
        currency: currencyBody,
        payment_method,
        bank_account_id: bankAccountIdRaw,
        earnings,
        deductions: deductionsRaw,
        notes,
        status
      } = req.body;

      const currency = currencyBody || 'USD';
      const deductions = Array.isArray(deductionsRaw) ? deductionsRaw : [];
      const bank_account_id =
        payment_method === 'bank' && bankAccountIdRaw != null && bankAccountIdRaw !== ''
          ? (typeof bankAccountIdRaw === 'number' ? bankAccountIdRaw : parseInt(bankAccountIdRaw, 10))
          : null;

      const [existing] = await connection.execute(
        'SELECT id, status FROM payslips WHERE id = ?',
        [id]
      );
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Payslip not found' });
      }
      if (existing[0].status === 'processed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot edit payslip after it has been processed'
        });
      }

      if (!employee_id || !pay_period || !pay_date || !payment_method || !earnings || earnings.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID, pay period, pay date, payment method, and at least one earning are required'
        });
      }
      if (payment_method === 'bank' && (bank_account_id == null || isNaN(bank_account_id))) {
        return res.status(400).json({
          success: false,
          message: 'Bank account is required for bank transfer payments'
        });
      }

      const totalEarnings = earnings
        .filter(e => e && (e.label || e.label === 0) && (e.amount != null && e.amount !== ''))
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      const totalDeductions = deductions
        .filter(d => d && (d.label || d.label === 0) && (d.amount != null && d.amount !== ''))
        .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
      const netPay = totalEarnings - totalDeductions;

      const employeeIdInt = parseInt(employee_id, 10);
      if (isNaN(employeeIdInt)) {
        return res.status(400).json({ success: false, message: 'Invalid employee ID' });
      }

      const newStatus = status && ['pending', 'processed', 'cancelled'].includes(status) ? status : existing[0].status;

      await connection.execute(
        `UPDATE payslips SET
          employee_id = ?, pay_period = ?, pay_date = ?, currency = ?,
          payment_method = ?, bank_account_id = ?,
          total_earnings = ?, total_deductions = ?, net_pay = ?,
          notes = ?, status = ?
        WHERE id = ?`,
        [employeeIdInt, pay_period, pay_date, currency, payment_method, bank_account_id, totalEarnings, totalDeductions, netPay, notes || null, newStatus, id]
      );

      await connection.execute('DELETE FROM payslip_earnings WHERE payslip_id = ?', [id]);
      await connection.execute('DELETE FROM payslip_deductions WHERE payslip_id = ?', [id]);

      for (const earning of earnings) {
        if (earning.label && earning.amount) {
          await connection.execute(
            `INSERT INTO payslip_earnings (payslip_id, label, amount, currency) VALUES (?, ?, ?, ?)`,
            [id, earning.label, earning.amount, earning.currency || currency]
          );
        }
      }
      for (const deduction of deductions) {
        if (deduction.label && deduction.amount) {
          await connection.execute(
            `INSERT INTO payslip_deductions (payslip_id, label, amount, currency) VALUES (?, ?, ?, ?)`,
            [id, deduction.label, deduction.amount, deduction.currency || currency]
          );
        }
      }

      await connection.commit();

      const [payslip] = await connection.execute(
        `SELECT p.*, e.full_name as employee_name, e.employee_id, d.name as department_name, jt.title as job_title
         FROM payslips p
         JOIN employees e ON p.employee_id = e.id
         LEFT JOIN departments d ON e.department_id = d.id
         LEFT JOIN job_titles jt ON e.job_title_id = jt.id
         WHERE p.id = ?`,
        [id]
      );
      const [earningsData] = await connection.execute('SELECT * FROM payslip_earnings WHERE payslip_id = ?', [id]);
      const [deductionsData] = await connection.execute('SELECT * FROM payslip_deductions WHERE payslip_id = ?', [id]);

      res.json({
        success: true,
        message: 'Payslip updated successfully',
        data: {
          ...payslip[0],
          earnings: earningsData,
          deductions: deductionsData
        }
      });
    } catch (error) {
      await connection.rollback();
      console.error('Error updating payslip:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payslip',
        error: error.message
      });
    } finally {
      connection.release();
    }
  }

  // Delete payslip
  static async deletePayslip(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { id } = req.params;

      // Check if payslip exists and is not processed
      const [payslip] = await connection.execute(
        'SELECT status FROM payslips WHERE id = ?',
        [id]
      );

      if (payslip.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payslip not found'
        });
      }

      if (payslip[0].status === 'processed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete processed payslip'
        });
      }

      // Delete payslip (earnings and deductions will be deleted automatically due to CASCADE)
      await connection.execute('DELETE FROM payslips WHERE id = ?', [id]);

      await connection.commit();

      res.json({
        success: true,
        message: 'Payslip deleted successfully'
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error deleting payslip:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete payslip',
        error: error.message
      });
    } finally {
      connection.release();
    }
  }

  // Get payroll summary
  static async getPayrollSummary(req, res) {
    try {
      const { pay_period } = req.query;

      let whereClause = '';
      const params = [];

      if (pay_period) {
        whereClause = 'WHERE p.pay_period = ?';
        params.push(pay_period);
      }

      const [summary] = await pool.execute(
        `SELECT 
          COUNT(*) as total_payslips,
          SUM(CASE WHEN p.status = 'pending' THEN 1 ELSE 0 END) as pending_payslips,
          SUM(CASE WHEN p.status = 'processed' THEN 1 ELSE 0 END) as processed_payslips,
          SUM(p.total_earnings) as total_earnings,
          SUM(p.total_deductions) as total_deductions,
          SUM(p.net_pay) as total_net_pay
         FROM payslips p
         ${whereClause}`,
        params
      );

      res.json({
        success: true,
        data: summary[0]
      });

    } catch (error) {
      console.error('Error fetching payroll summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payroll summary',
        error: error.message
      });
    }
  }

  // Get payslips for a specific employee (for employee portal)
  static async getEmployeePayslips(req, res) {
    try {
      console.log('🔍 getEmployeePayslips called');
      console.log('📝 Request params:', req.params);
      console.log('📝 Request query:', req.query);
      console.log('👤 Request user:', req.user);
      
      const { employeeId } = req.params;
      const { pay_period, status, page = 1, limit = 10 } = req.query;

      console.log('🆔 Employee ID from params:', employeeId);

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;
      
      let whereClause = 'WHERE p.employee_id = ?';
      const params = [employeeId];

      if (pay_period) {
        whereClause += ' AND p.pay_period = ?';
        params.push(pay_period);
      }

      if (status) {
        whereClause += ' AND p.status = ?';
        params.push(status);
      }

      console.log('🔍 Where clause:', whereClause);
      console.log('📊 Query params:', params);

      // Get total count
      console.log('🔢 Getting total count...');
      const countQuery = `SELECT COUNT(*) as total
         FROM payslips p
         JOIN employees e ON p.employee_id = e.id
         LEFT JOIN departments d ON e.department_id = d.id
         LEFT JOIN job_titles jt ON e.job_title_id = jt.id
         ${whereClause}`;
      console.log('📊 Count query:', countQuery);
      
      const [countResult] = await pool.execute(countQuery, params);
      console.log('📊 Count result:', countResult);

      const total = countResult[0].total;
      console.log('📊 Total payslips found:', total);

      // Get payslips
      console.log('📋 Getting payslips...');
      const payslipsQuery = `SELECT p.*, e.full_name as employee_name, e.employee_id, d.name as department_name, jt.title as job_title
         FROM payslips p
         JOIN employees e ON p.employee_id = e.id
         LEFT JOIN departments d ON e.department_id = d.id
         LEFT JOIN job_titles jt ON e.job_title_id = jt.id
         ${whereClause}
         ORDER BY p.created_at DESC
         LIMIT ${limitNum} OFFSET ${offset}`;
      console.log('📋 Payslips query:', payslipsQuery);
      
      const [payslips] = await pool.execute(payslipsQuery, params);
      console.log('📋 Payslips found:', payslips.length);
      console.log('📋 Payslips data:', payslips);

      const response = {
        success: true,
        data: payslips,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      };
      
      console.log('✅ Sending response:', response);
      res.json(response);

    } catch (error) {
      console.error('Error fetching employee payslips:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch employee payslips',
        error: error.message
      });
    }
  }
}

module.exports = PayslipController;
