const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class ExpenseAccountPayablesController {
  // Get all accounts payable balances with pagination and search
  async getAllAccountsPayable(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const pageSize = parseInt(req.query.pageSize, 10) || 20;
      const offset = (page - 1) * pageSize;
      const search = req.query.search ? `%${req.query.search}%` : null;
      const status = req.query.status; // 'outstanding', 'partial', 'paid', 'overdue'
      
      let where = 'WHERE 1=1';
      const params = [];
      
      if (search) {
        where += ' AND (s.name LIKE ? OR e.description LIKE ? OR apb.status LIKE ?)';
        params.push(search, search, search);
      }
      
      if (status) {
        where += ' AND apb.status = ?';
        params.push(status);
      }
      
      // Get total count
      const [[{ count }]] = await pool.execute(
        `SELECT COUNT(*) as count
         FROM accounts_payable_balances apb
         LEFT JOIN expenses e ON apb.original_expense_id = e.id
         LEFT JOIN suppliers s ON apb.supplier_id = s.id
         ${where}`,
        params
      );
      
      // Get paginated results
      const limit = Number(pageSize);
      const off = Number(offset);
      const [payables] = await pool.query(
        `SELECT apb.*, 
                COALESCE(apb.paid_amount, 0) as paid_amount,
                COALESCE(apb.outstanding_balance, 0) as outstanding_balance,
                COALESCE(apb.description, e.description) as description,
                e.expense_date, 
                s.name as supplier_name, 
                c.code as currency_code,
                CASE 
                  WHEN apb.supplier_id IS NULL THEN 'Non-Supplier'
                  ELSE s.name 
                END as payable_to,
                CASE
                  WHEN apb.is_opening_balance = TRUE THEN 'Opening Balance'
                  ELSE 'Expense'
                END as source_type
         FROM accounts_payable_balances apb
         LEFT JOIN expenses e ON apb.original_expense_id = e.id
         LEFT JOIN suppliers s ON apb.supplier_id = s.id
         LEFT JOIN currencies c ON apb.currency_id = c.id
         ${where}
         ORDER BY apb.due_date ASC, apb.outstanding_balance DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, off]
      );
      
      res.json({ 
        success: true, 
        data: payables, 
        total: count, 
        page, 
        pageSize 
      });
    } catch (error) {
      console.error('Error fetching accounts payable:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch accounts payable' });
    }
  }

  // Get accounts payable by ID
  async getAccountsPayableById(req, res) {
    try {
      const { id } = req.params;
      const [payables] = await pool.execute(
        `SELECT apb.*, 
                COALESCE(apb.paid_amount, 0) as paid_amount,
                COALESCE(apb.outstanding_balance, 0) as outstanding_balance,
                e.description as expense_description, e.expense_date, e.amount as original_expense_amount,
                s.name as supplier_name, c.code as currency_code,
                CASE 
                  WHEN apb.supplier_id IS NULL THEN 'Non-Supplier'
                  ELSE s.name 
                END as payable_to
         FROM accounts_payable_balances apb
         LEFT JOIN expenses e ON apb.original_expense_id = e.id
         LEFT JOIN suppliers s ON apb.supplier_id = s.id
         LEFT JOIN currencies c ON apb.currency_id = c.id
         WHERE apb.id = ?`,
        [id]
      );
      
      if (payables.length === 0) {
        return res.status(404).json({ success: false, message: 'Accounts payable not found' });
      }
      
      res.json({ success: true, data: payables[0] });
    } catch (error) {
      console.error('Error fetching accounts payable:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch accounts payable' });
    }
  }

  // Create opening balance payable (historical debt)
  async createOpeningBalance(req, res) {
    const conn = await pool.getConnection();
    
    try {
      const {
        supplier_id,
        amount,
        description,
        reference_number,
        due_date,
        opening_balance_date,
        currency_id = 1, // Default to USD
        expense_account_code = '5000' // Default to General Expenses
      } = req.body;

      // Validate required fields
      if (!amount || !description) {
        return res.status(400).json({ 
          success: false, 
          message: 'Amount and description are required' 
        });
      }

      await conn.beginTransaction();

      // 1. Resolve journal_id (General Journal or any active journal; create if none)
      let journal_id = null;
      const [journalByName] = await conn.execute(
        "SELECT id FROM journals WHERE name IN ('General Journal', 'Purchases Journal') AND is_active = 1 LIMIT 1"
      );
      if (journalByName.length > 0) {
        journal_id = journalByName[0].id;
      } else {
        const [anyJournal] = await conn.execute('SELECT id FROM journals WHERE is_active = 1 LIMIT 1');
        if (anyJournal.length > 0) {
          journal_id = anyJournal[0].id;
        } else {
          const [journalResult] = await conn.execute(
            "INSERT INTO journals (name, description, is_active) VALUES ('General Journal', 'General ledger entries', 1)"
          );
          journal_id = journalResult.insertId;
        }
      }
      if (!journal_id) {
        await conn.rollback();
        return res.status(500).json({ success: false, message: 'No journal found. Please set up journals in accounting.' });
      }

      // 2. Create journal entry for the opening balance
      const [journalResult] = await conn.execute(
        `INSERT INTO journal_entries (journal_id, entry_date, description, reference, created_by) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          journal_id,
          opening_balance_date || new Date(),
          `Opening Balance: ${description}`,
          reference_number || `OB-${Date.now()}`,
          req.user?.id || 1
        ]
      );
      const journalEntryId = journalResult.insertId;

      // 3. Get account IDs
      // Use Retained Earnings for opening balances, NOT expense accounts
      const [[retainedEarnings]] = await conn.execute(
        `SELECT id FROM chart_of_accounts WHERE code = '3998' LIMIT 1` // Retained Earnings
      );
      
      const [[payableAccount]] = await conn.execute(
        `SELECT id FROM chart_of_accounts WHERE code = '2000' LIMIT 1` // Accounts Payable
      );

      if (!retainedEarnings || !payableAccount) {
        throw new Error('Required accounts not found in chart of accounts (3998 - Retained Earnings or 2000 - Accounts Payable)');
      }

      // 4. Create journal entry lines (double-entry)
      // DEBIT: Retained Earnings (opening balance equity)
      // This records the historical liability without affecting current period expenses
      await conn.execute(
        `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id, description) 
         VALUES (?, ?, ?, 0, ?, ?)`,
        [journalEntryId, retainedEarnings.id, amount, currency_id, `Opening Balance - ${description}`]
      );

      // CREDIT: Accounts Payable (liability increases)
      await conn.execute(
        `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id, description) 
         VALUES (?, ?, 0, ?, ?, ?)`,
        [journalEntryId, payableAccount.id, amount, currency_id, `Opening Balance - ${description}`]
      );

      // 5. Create accounts payable balance record
      const openingDate = opening_balance_date
        ? (typeof opening_balance_date === 'string' ? opening_balance_date : new Date(opening_balance_date).toISOString().split('T')[0])
        : new Date().toISOString().split('T')[0];
      const dueDateVal = due_date
        ? (typeof due_date === 'string' ? due_date : new Date(due_date).toISOString().split('T')[0])
        : null;

      const [payableResult] = await conn.execute(
        `INSERT INTO accounts_payable_balances 
         (supplier_id, currency_id, original_expense_id, original_amount, paid_amount, outstanding_balance, 
          due_date, status, reference_number, description, is_opening_balance, opening_balance_date) 
         VALUES (?, ?, NULL, ?, 0, ?, ?, 'outstanding', ?, ?, TRUE, ?)`,
        [
          supplier_id || null,
          currency_id,
          parseFloat(amount),
          parseFloat(amount),
          dueDateVal,
          reference_number || `OB-${Date.now()}`,
          description || '',
          openingDate
        ]
      );

      // 6. Update account balances
      const AccountBalanceService = require('../../services/accountBalanceService');
      await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId, currency_id);

      // 7. Log audit event
      await AuditLogger.log({
        action: 'OPENING_BALANCE_PAYABLE_CREATED',
        table: 'accounts_payable_balances',
        record_id: payableResult.insertId,
        user_id: req.user?.id || 1,
        details: {
          supplier_id: supplier_id || null,
          amount,
          description,
          reference_number,
          due_date,
          opening_balance_date
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      await conn.commit();
      
      res.status(201).json({ 
        success: true, 
        message: 'Opening balance payable created successfully',
        data: { 
          id: payableResult.insertId,
          journal_entry_id: journalEntryId
        } 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error creating opening balance payable:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create opening balance payable',
        error: error.message 
      });
    } finally {
      conn.release();
    }
  }

  // Make a payment against accounts payable
  async makePayment(req, res) {
    const conn = await pool.getConnection();
    try {
      const { payable_id } = req.params;
      const { amount, currency_id, payment_date, payment_method, description } = req.body;
      
      if (!amount || !currency_id || !payment_date || !payment_method) {
        return res.status(400).json({ success: false, message: 'Required fields missing' });
      }
      
      await conn.beginTransaction();
      
      // 1. Get the accounts payable record
      const [[payable]] = await conn.execute(
        `SELECT * FROM accounts_payable_balances WHERE id = ?`,
        [payable_id]
      );
      
      if (!payable) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: 'Accounts payable not found' });
      }
      
      if (payable.outstanding_balance < amount) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'Payment amount exceeds outstanding balance' });
      }
      
      // 1.5. Check if sufficient funds are available in the payment account
      let paymentAccountCode;
      if (payment_method === 'cash') paymentAccountCode = '1000';  // Cash on Hand
      else if (payment_method === 'bank') paymentAccountCode = '1010';  // Bank Account
      else paymentAccountCode = '1000';  // Default to Cash on Hand
      
      const [[paymentAccount]] = await conn.execute(
        `SELECT coa.id, coa.name, coa.code, COALESCE(ab.balance, 0) as balance
         FROM chart_of_accounts coa
         LEFT JOIN (
           SELECT account_id, balance 
           FROM account_balances 
           WHERE currency_id = ?
           ORDER BY as_of_date DESC
         ) ab ON coa.id = ab.account_id
         WHERE coa.code = ?
         LIMIT 1`,
        [currency_id, paymentAccountCode]
      );
      
      if (!paymentAccount) {
        await conn.rollback();
        return res.status(400).json({ 
          success: false, 
          message: `Payment account (${paymentAccountCode}) not found` 
        });
      }
      
      const availableBalance = parseFloat(paymentAccount.balance) || 0;
      
      if (availableBalance < amount) {
        await conn.rollback();
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient funds in ${paymentAccount.name}. Available: ${availableBalance.toFixed(2)}, Required: ${amount}` 
        });
      }
      
      // 2. Resolve journal (by name, then any active, then create if none)
      const journalDesc = description || `Payment for ${payable.original_expense_id}`;
      let journalName;
      if (payment_method === 'cash') journalName = 'Cash Payments Journal';
      else if (payment_method === 'bank') journalName = 'Bank Payments Journal';
      else journalName = 'General Journal';

      let journal_id = null;
      const [journalByName] = await conn.execute('SELECT id FROM journals WHERE name = ? AND is_active = 1 LIMIT 1', [journalName]);
      if (journalByName.length > 0) {
        journal_id = journalByName[0].id;
      } else {
        const [anyJournal] = await conn.execute('SELECT id FROM journals WHERE is_active = 1 LIMIT 1');
        if (anyJournal.length > 0) {
          journal_id = anyJournal[0].id;
        } else {
          const [journalInsert] = await conn.execute(
            'INSERT INTO journals (name, description, is_active) VALUES (?, ?, 1)',
            [journalName, journalName === 'General Journal' ? 'General ledger entries' : `${journalName} entries`]
          );
          journal_id = journalInsert.insertId;
        }
      }
      if (!journal_id) {
        await conn.rollback();
        return res.status(500).json({ success: false, message: 'No journal found. Please set up journals in accounting.' });
      }

      const [journalResult] = await conn.execute(
        `INSERT INTO journal_entries (journal_id, entry_date, reference, description) VALUES (?, ?, ?, ?)`,
        [journal_id, payment_date, 'payments', journalDesc]
      );
      const journalEntryId = journalResult.insertId;
      
      // 3. Create transaction record
      const [transactionResult] = await conn.execute(
        `INSERT INTO transactions (transaction_type, amount, currency_id, transaction_date, payment_method, description, journal_entry_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['payment', amount, currency_id, payment_date, payment_method, description || 'Payment', journalEntryId]
      );
      const transactionId = transactionResult.insertId;
      
      // 4. Create accounts payable payment record
      const [paymentResult] = await conn.execute(
        `INSERT INTO accounts_payable_payments (transaction_id, original_expense_id, supplier_id, amount_paid, payment_date, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [transactionId, payable.original_expense_id || null, payable.supplier_id, amount, payment_date, 'completed']
      );
      
      // 5. Create journal entry lines (double-entry)
      // Debit: Accounts Payable (reduce liability)
      const [[payableAccount]] = await conn.execute(
        `SELECT id FROM chart_of_accounts WHERE code = '2000' LIMIT 1`
      );
      
      // Credit: Cash/Bank (reduce asset)
      let creditAccountCode;
      if (payment_method === 'cash') creditAccountCode = 1000;  // Cash on Hand
      else if (payment_method === 'bank') creditAccountCode = 1010;  // Bank Account
      else creditAccountCode = 1000;  // Default to Cash on Hand
      
      const [[creditAccount]] = await conn.execute(
        `SELECT id FROM chart_of_accounts WHERE code = ? LIMIT 1`,
        [creditAccountCode.toString()]
      );
      
      if (!payableAccount || !creditAccount) throw new Error('Account not found');
      
      // Debit accounts payable
      await conn.execute(
        `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id) VALUES (?, ?, ?, 0, ?)`,
        [journalEntryId, payableAccount.id, amount, currency_id]
      );
      
      // Credit cash/bank
      await conn.execute(
        `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id) VALUES (?, ?, 0, ?, ?)`,
        [journalEntryId, creditAccount.id, amount, currency_id]
      );
      
      // 6. Update accounts payable balance
      const currentPaidAmount = parseFloat(payable.paid_amount) || 0;
      const currentOutstanding = parseFloat(payable.outstanding_balance) || 0;
      const originalAmount = parseFloat(payable.original_amount) || currentPaidAmount + currentOutstanding;
      
      let newOutstandingBalance = Math.max(0, currentOutstanding - amount);
      let newPaidAmount = originalAmount - newOutstandingBalance;
      
      // Ensure paid_amount doesn't exceed original_amount
      newPaidAmount = Math.min(newPaidAmount, originalAmount);
      
      let newStatus = 'partial';
      if (newOutstandingBalance <= 0.01) { // Allow small rounding differences
        newStatus = 'paid';
        newOutstandingBalance = 0;
        newPaidAmount = originalAmount;
      }
      
      await conn.execute(
        `UPDATE accounts_payable_balances 
         SET paid_amount = ?, outstanding_balance = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [newPaidAmount, newOutstandingBalance, newStatus, payable_id]
      );
      
      // 7. Update account balances from journal entry
      const AccountBalanceService = require('../../services/accountBalanceService');
      await AccountBalanceService.updateAccountBalancesFromJournalEntry(conn, journalEntryId, currency_id);
      
      await conn.commit();
      
      // 8. Log audit event
      await AuditLogger.log({
        action: 'ACCOUNTS_PAYABLE_PAYMENT_MADE',
        table: 'accounts_payable_payments',
        record_id: paymentResult.insertId,
        user_id: req.user.id,
        details: {
          payable_id: payable_id,
          amount: amount,
          currency_id: currency_id,
          payment_method: payment_method,
          new_balance: newOutstandingBalance,
          new_status: newStatus,
          transaction_id: transactionId,
          journal_entry_id: journalEntryId
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      res.status(201).json({ 
        success: true, 
        data: { 
          payment_id: paymentResult.insertId,
          transaction_id: transactionId,
          new_balance: newOutstandingBalance,
          status: newStatus
        } 
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error making payment:', error);
      res.status(500).json({ success: false, message: 'Failed to make payment' });
    } finally {
      conn.release();
    }
  }

  // Get payment history for a specific accounts payable
  async getPaymentHistory(req, res) {
    try {
      const { payable_id } = req.params;
      
      const [payments] = await pool.execute(
        `SELECT app.*, t.transaction_date, t.payment_method, t.description,
                c.code as currency_code
         FROM accounts_payable_payments app
         LEFT JOIN transactions t ON app.transaction_id = t.id
         LEFT JOIN currencies c ON t.currency_id = c.id
         WHERE app.original_expense_id = (
           SELECT original_expense_id FROM accounts_payable_balances WHERE id = ?
         )
         ORDER BY app.payment_date DESC`,
        [payable_id]
      );
      
      res.json({ success: true, data: payments });
    } catch (error) {
      console.error('Error fetching payment history:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
    }
  }

  // Reverse a payment (delete payment and reverse journal entries)
  async reversePayment(req, res) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const { payable_id, payment_id } = req.params;

      // Get payment details
      const [payments] = await conn.execute(
        `SELECT app.*, t.journal_entry_id, t.transaction_date, t.amount, t.currency_id
         FROM accounts_payable_payments app
         LEFT JOIN transactions t ON app.transaction_id = t.id
         WHERE app.id = ? AND app.original_expense_id = (
           SELECT original_expense_id FROM accounts_payable_balances WHERE id = ?
         )`,
        [payment_id, payable_id]
      );

      if (payments.length === 0) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      const payment = payments[0];
      const amount = parseFloat(payment.amount_paid || payment.amount || 0);
      const journalEntryId = payment.journal_entry_id;

      // Get current payable balance
      const [[payable]] = await conn.execute(
        'SELECT * FROM accounts_payable_balances WHERE id = ?',
        [payable_id]
      );

      if (!payable) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: 'Accounts payable not found' });
      }

      // Reverse account balances from journal entry
      const AccountBalanceService = require('../../services/accountBalanceService');
      await AccountBalanceService.reverseAccountBalancesFromJournalEntry(conn, journalEntryId, payment.currency_id);

      // Delete journal entry lines
      await conn.execute('DELETE FROM journal_entry_lines WHERE journal_entry_id = ?', [journalEntryId]);
      // Delete journal entry
      await conn.execute('DELETE FROM journal_entries WHERE id = ?', [journalEntryId]);
      // Delete transaction
      await conn.execute('DELETE FROM transactions WHERE id = ?', [payment.transaction_id]);
      // Delete payment record
      await conn.execute('DELETE FROM accounts_payable_payments WHERE id = ?', [payment_id]);

      // Update accounts payable balance
      const currentPaidAmount = parseFloat(payable.paid_amount) || 0;
      const currentOutstanding = parseFloat(payable.outstanding_balance) || 0;
      const originalAmount = parseFloat(payable.original_amount) || currentPaidAmount + currentOutstanding;

      const newPaidAmount = Math.max(0, currentPaidAmount - amount);
      const newOutstandingBalance = originalAmount - newPaidAmount;
      let newStatus = 'partial';
      if (newOutstandingBalance >= originalAmount - 0.01) {
        newStatus = 'outstanding';
      } else if (newOutstandingBalance <= 0.01) {
        newStatus = 'paid';
      }

      await conn.execute(
        `UPDATE accounts_payable_balances 
         SET paid_amount = ?, outstanding_balance = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [newPaidAmount, newOutstandingBalance, newStatus, payable_id]
      );

      await conn.commit();

      // Log audit event
      await AuditLogger.log({
        action: 'ACCOUNTS_PAYABLE_PAYMENT_REVERSED',
        table: 'accounts_payable_payments',
        record_id: payment_id,
        user_id: req.user.id,
        details: {
          payable_id: payable_id,
          payment_id: payment_id,
          reversed_amount: amount,
          new_balance: newOutstandingBalance,
          new_status: newStatus
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({ success: true, message: 'Payment reversed successfully' });
    } catch (error) {
      await conn.rollback();
      console.error('Error reversing payment:', error);
      res.status(500).json({ success: false, message: 'Failed to reverse payment', error: error.message });
    } finally {
      conn.release();
    }
  }

  // Update accounts payable
  async updateAccountsPayable(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const { description, due_date, reference_number } = req.body;

      const [result] = await conn.execute(
        `UPDATE accounts_payable_balances 
         SET description = ?, due_date = ?, reference_number = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [description || null, due_date || null, reference_number || null, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Accounts payable not found' });
      }

      // Log audit event
      await AuditLogger.log({
        action: 'ACCOUNTS_PAYABLE_UPDATED',
        table: 'accounts_payable_balances',
        record_id: id,
        user_id: req.user.id,
        details: { description, due_date, reference_number },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({ success: true, message: 'Accounts payable updated successfully' });
    } catch (error) {
      console.error('Error updating accounts payable:', error);
      res.status(500).json({ success: false, message: 'Failed to update accounts payable', error: error.message });
    } finally {
      conn.release();
    }
  }

  // Delete accounts payable (only if no payments made)
  async deleteAccountsPayable(req, res) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const { id } = req.params;

      // Check if payable exists and has payments
      const [[payable]] = await conn.execute(
        'SELECT * FROM accounts_payable_balances WHERE id = ?',
        [id]
      );

      if (!payable) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: 'Accounts payable not found' });
      }

      // Check if there are any payments
      const [payments] = await conn.execute(
        'SELECT COUNT(*) as count FROM accounts_payable_payments WHERE original_expense_id = ?',
        [payable.original_expense_id]
      );

      if (payments[0].count > 0) {
        await conn.rollback();
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete accounts payable with payment history. Reverse payments first.' 
        });
      }

      // If it's an opening balance, reverse the journal entry
      if (payable.is_opening_balance && payable.opening_balance_journal_id) {
        const AccountBalanceService = require('../../services/accountBalanceService');
        await AccountBalanceService.reverseAccountBalancesFromJournalEntry(
          conn, 
          payable.opening_balance_journal_id, 
          payable.currency_id
        );
        await conn.execute('DELETE FROM journal_entry_lines WHERE journal_entry_id = ?', [payable.opening_balance_journal_id]);
        await conn.execute('DELETE FROM journal_entries WHERE id = ?', [payable.opening_balance_journal_id]);
      }

      // Delete the payable record
      await conn.execute('DELETE FROM accounts_payable_balances WHERE id = ?', [id]);

      await conn.commit();

      // Log audit event
      await AuditLogger.log({
        action: 'ACCOUNTS_PAYABLE_DELETED',
        table: 'accounts_payable_balances',
        record_id: id,
        user_id: req.user.id,
        details: { payable },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({ success: true, message: 'Accounts payable deleted successfully' });
    } catch (error) {
      await conn.rollback();
      console.error('Error deleting accounts payable:', error);
      res.status(500).json({ success: false, message: 'Failed to delete accounts payable', error: error.message });
    } finally {
      conn.release();
    }
  }

  // Get summary statistics
  async getSummary(req, res) {
    try {
      const [summary] = await pool.execute(
        `SELECT 
           COUNT(*) as total_payables,
           SUM(outstanding_balance) as total_outstanding,
           COUNT(CASE WHEN status = 'outstanding' THEN 1 END) as outstanding_count,
           COUNT(CASE WHEN status = 'partial' THEN 1 END) as partial_count,
           COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
           COUNT(CASE WHEN due_date < CURDATE() AND status != 'paid' THEN 1 END) as overdue_count
         FROM accounts_payable_balances`
      );
      
      res.json({ success: true, data: summary[0] });
    } catch (error) {
      console.error('Error fetching summary:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch summary' });
    }
  }
}

module.exports = new ExpenseAccountPayablesController();
