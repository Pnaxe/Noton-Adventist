const { pool } = require('../../config/database');
const AccountBalanceService = require('../../services/accountBalanceService');

/** Get a journal id for cash/bank entries (General Journal or first available). */
async function getJournalId(connection) {
    const [rows] = await connection.execute(
        `SELECT id FROM journals WHERE name IN ('General Journal', 'Cash Book', 'Bank Journal') AND is_active = 1 LIMIT 1`
    );
    if (rows.length > 0) return rows[0].id;
    const [any] = await connection.execute('SELECT id FROM journals LIMIT 1');
    return any.length > 0 ? any[0].id : null;
}

class CashBankController {
    // Get Cash and Bank account balances from COA
    static async getAccountBalances(req, res) {
        try {
            const [accounts] = await pool.execute(`
                SELECT 
                    coa.id,
                    coa.name as account_name,
                    coa.type as account_type,
                    coa.code,
                    'USD' as currency_code,
                    'US Dollar' as currency_name,
                    COALESCE(ab.balance, 0) as current_balance
                FROM chart_of_accounts coa
                LEFT JOIN account_balances ab ON coa.id = ab.account_id AND ab.currency_id = 1
                WHERE (coa.name = 'Cash on Hand' OR coa.name = 'Bank Account')
                AND coa.type = 'Asset'
                ORDER BY coa.code
            `);

            res.json({
                success: true,
                data: accounts
            });
        } catch (error) {
            console.error('Error fetching cash/bank balances:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching account balances',
                error: error.message
            });
        }
    }

    // Record cash injection (add cash to business)
    static async recordCashInjection(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { amount, currency_id, description, reference } = req.body;

            if (!amount || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount and description are required'
                });
            }

            // Get Cash account from COA
            const [cashAccount] = await connection.execute(`
                SELECT id FROM chart_of_accounts 
                WHERE name = 'Cash on Hand' AND type = 'Asset'
                LIMIT 1
            `);

            if (cashAccount.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cash account not found in Chart of Accounts'
                });
            }

            const cashAccountId = cashAccount[0].id;
            const finalReferenceNumber = reference || `CASH-INJ-${Date.now()}`;
            const journalId = await getJournalId(connection);
            if (!journalId) {
                return res.status(500).json({ success: false, message: 'No journal found. Please set up journals first.' });
            }

            // Create journal entry
            const [journalResult] = await connection.execute(`
                INSERT INTO journal_entries (journal_id, entry_date, reference, description, created_by)
                VALUES (?, CURDATE(), ?, ?, ?)
            `, [journalId, finalReferenceNumber, description, req.user?.id || null]);

            const journalEntryId = journalResult.insertId;

            // Create journal entry line (Debit Cash)
            await connection.execute(`
                INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id)
                VALUES (?, ?, ?, ?, ?)
            `, [journalEntryId, cashAccountId, parseFloat(amount), 0, currency_id || 1]);

            // Update account balances
            await AccountBalanceService.updateAccountBalancesFromJournalEntry(connection, journalEntryId, currency_id || 1);

            await connection.commit();

            res.json({
                success: true,
                message: 'Cash injection recorded successfully',
                data: { journalEntryId }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error recording cash injection:', error);
            res.status(500).json({
                success: false,
                message: 'Error recording cash injection',
                error: error.message
            });
        } finally {
            connection.release();
        }
    }

    // Record bank deposit (add money to bank)
    static async recordBankDeposit(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { amount, currency_id, description, reference } = req.body;

            if (!amount || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount and description are required'
                });
            }

            // Get Bank account from COA
            const [bankAccount] = await connection.execute(`
                SELECT id FROM chart_of_accounts 
                WHERE name = 'Bank Account' AND type = 'Asset'
                LIMIT 1
            `);

            if (bankAccount.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Bank account not found in Chart of Accounts'
                });
            }

            const bankAccountId = bankAccount[0].id;
            const finalReferenceNumber = reference || `BANK-DEP-${Date.now()}`;
            const journalId = await getJournalId(connection);
            if (!journalId) {
                return res.status(500).json({ success: false, message: 'No journal found. Please set up journals first.' });
            }

            // Create journal entry
            const [journalResult] = await connection.execute(`
                INSERT INTO journal_entries (journal_id, entry_date, reference, description, created_by)
                VALUES (?, CURDATE(), ?, ?, ?)
            `, [journalId, finalReferenceNumber, description, req.user?.id || null]);

            const journalEntryId = journalResult.insertId;

            // Create journal entry line (Debit Bank)
            await connection.execute(`
                INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id)
                VALUES (?, ?, ?, ?, ?)
            `, [journalEntryId, bankAccountId, parseFloat(amount), 0, currency_id || 1]);

            // Update account balances
            await AccountBalanceService.updateAccountBalancesFromJournalEntry(connection, journalEntryId, currency_id || 1);

            await connection.commit();

            res.json({
                success: true,
                message: 'Bank deposit recorded successfully',
                data: { journalEntryId }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error recording bank deposit:', error);
            res.status(500).json({
                success: false,
                message: 'Error recording bank deposit',
                error: error.message
            });
        } finally {
            connection.release();
        }
    }

    // Record cash to bank transfer
    static async recordCashToBankTransfer(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { amount, currency_id, description, reference } = req.body;

            if (!amount || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount and description are required'
                });
            }

            // Get Cash and Bank accounts from COA
            const [cashAccount] = await connection.execute(`
                SELECT id FROM chart_of_accounts 
                WHERE name = 'Cash on Hand' AND type = 'Asset'
                LIMIT 1
            `);

            const [bankAccount] = await connection.execute(`
                SELECT id FROM chart_of_accounts 
                WHERE name = 'Bank Account' AND type = 'Asset'
                LIMIT 1
            `);

            if (cashAccount.length === 0 || bankAccount.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cash or Bank account not found in Chart of Accounts'
                });
            }

            const cashAccountId = cashAccount[0].id;
            const bankAccountId = bankAccount[0].id;
            const finalReferenceNumber = reference || `CASH-BANK-${Date.now()}`;
            const journalId = await getJournalId(connection);
            if (!journalId) {
                return res.status(500).json({ success: false, message: 'No journal found. Please set up journals first.' });
            }

            // Create journal entry
            const [journalResult] = await connection.execute(`
                INSERT INTO journal_entries (journal_id, entry_date, reference, description, created_by)
                VALUES (?, CURDATE(), ?, ?, ?)
            `, [journalId, finalReferenceNumber, description, req.user?.id || null]);

            const journalEntryId = journalResult.insertId;
            const amountFloat = parseFloat(amount);

            // Create journal entry lines
            // Debit Bank, Credit Cash
            await connection.execute(`
                INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id)
                VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)
            `, [
                journalEntryId, bankAccountId, amountFloat, 0, currency_id || 1,
                journalEntryId, cashAccountId, 0, amountFloat, currency_id || 1
            ]);

            // Update account balances
            await AccountBalanceService.updateAccountBalancesFromJournalEntry(connection, journalEntryId, currency_id || 1);

            await connection.commit();

            res.json({
                success: true,
                message: 'Cash to Bank transfer recorded successfully',
                data: { journalEntryId }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error recording cash to bank transfer:', error);
            res.status(500).json({
                success: false,
                message: 'Error recording transfer',
                error: error.message
            });
        } finally {
            connection.release();
        }
    }

    // Record bank to cash transfer
    static async recordBankToCashTransfer(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { amount, currency_id, description, reference } = req.body;

            if (!amount || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount and description are required'
                });
            }

            // Get Cash and Bank accounts from COA
            const [cashAccount] = await connection.execute(`
                SELECT id FROM chart_of_accounts 
                WHERE name = 'Cash on Hand' AND type = 'Asset'
                LIMIT 1
            `);

            const [bankAccount] = await connection.execute(`
                SELECT id FROM chart_of_accounts 
                WHERE name = 'Bank Account' AND type = 'Asset'
                LIMIT 1
            `);

            if (cashAccount.length === 0 || bankAccount.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cash or Bank account not found in Chart of Accounts'
                });
            }

            const cashAccountId = cashAccount[0].id;
            const bankAccountId = bankAccount[0].id;
            const finalReferenceNumber = reference || `BANK-CASH-${Date.now()}`;
            const journalId = await getJournalId(connection);
            if (!journalId) {
                return res.status(500).json({ success: false, message: 'No journal found. Please set up journals first.' });
            }

            // Create journal entry
            const [journalResult] = await connection.execute(`
                INSERT INTO journal_entries (journal_id, entry_date, reference, description, created_by)
                VALUES (?, CURDATE(), ?, ?, ?)
            `, [journalId, finalReferenceNumber, description, req.user?.id || null]);

            const journalEntryId = journalResult.insertId;
            const amountFloat = parseFloat(amount);

            // Create journal entry lines
            // Debit Cash, Credit Bank
            await connection.execute(`
                INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id)
                VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)
            `, [
                journalEntryId, cashAccountId, amountFloat, 0, currency_id || 1,
                journalEntryId, bankAccountId, 0, amountFloat, currency_id || 1
            ]);

            // Update account balances
            await AccountBalanceService.updateAccountBalancesFromJournalEntry(connection, journalEntryId, currency_id || 1);

            await connection.commit();

            res.json({
                success: true,
                message: 'Bank to Cash transfer recorded successfully',
                data: { journalEntryId }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error recording bank to cash transfer:', error);
            res.status(500).json({
                success: false,
                message: 'Error recording transfer',
                error: error.message
            });
        } finally {
            connection.release();
        }
    }

    // Record cash withdrawal (take cash out of business)
    static async recordCashWithdrawal(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { amount, currency_id, description, reference } = req.body;

            if (!amount || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount and description are required'
                });
            }

            // Get Cash account from COA
            const [cashAccount] = await connection.execute(`
                SELECT id FROM chart_of_accounts 
                WHERE name = 'Cash on Hand' AND type = 'Asset'
                LIMIT 1
            `);

            if (cashAccount.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cash account not found in Chart of Accounts'
                });
            }

            const cashAccountId = cashAccount[0].id;
            const finalReferenceNumber = reference || `CASH-WD-${Date.now()}`;
            const journalId = await getJournalId(connection);
            if (!journalId) {
                return res.status(500).json({ success: false, message: 'No journal found. Please set up journals first.' });
            }

            // Create journal entry
            const [journalResult] = await connection.execute(`
                INSERT INTO journal_entries (journal_id, entry_date, reference, description, created_by)
                VALUES (?, CURDATE(), ?, ?, ?)
            `, [journalId, finalReferenceNumber, description, req.user?.id || null]);

            const journalEntryId = journalResult.insertId;

            // Create journal entry line (Credit Cash)
            await connection.execute(`
                INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id)
                VALUES (?, ?, ?, ?, ?)
            `, [journalEntryId, cashAccountId, 0, parseFloat(amount), currency_id || 1]);

            // Update account balances
            await AccountBalanceService.updateAccountBalancesFromJournalEntry(connection, journalEntryId, currency_id || 1);

            await connection.commit();

            res.json({
                success: true,
                message: 'Cash withdrawal recorded successfully',
                data: { journalEntryId }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error recording cash withdrawal:', error);
            res.status(500).json({
                success: false,
                message: 'Error recording cash withdrawal',
                error: error.message
            });
        } finally {
            connection.release();
        }
    }

    // Record bank withdrawal (take money from bank)
    static async recordBankWithdrawal(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { amount, currency_id, description, reference } = req.body;

            if (!amount || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount and description are required'
                });
            }

            // Get Bank account from COA
            const [bankAccount] = await connection.execute(`
                SELECT id FROM chart_of_accounts 
                WHERE name = 'Bank Account' AND type = 'Asset'
                LIMIT 1
            `);

            if (bankAccount.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Bank account not found in Chart of Accounts'
                });
            }

            const bankAccountId = bankAccount[0].id;
            const finalReferenceNumber = reference || `BANK-WD-${Date.now()}`;
            const journalId = await getJournalId(connection);
            if (!journalId) {
                return res.status(500).json({ success: false, message: 'No journal found. Please set up journals first.' });
            }

            // Create journal entry
            const [journalResult] = await connection.execute(`
                INSERT INTO journal_entries (journal_id, entry_date, reference, description, created_by)
                VALUES (?, CURDATE(), ?, ?, ?)
            `, [journalId, finalReferenceNumber, description, req.user?.id || null]);

            const journalEntryId = journalResult.insertId;

            // Create journal entry line (Credit Bank)
            await connection.execute(`
                INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, currency_id)
                VALUES (?, ?, ?, ?, ?)
            `, [journalEntryId, bankAccountId, 0, parseFloat(amount), currency_id || 1]);

            // Update account balances
            await AccountBalanceService.updateAccountBalancesFromJournalEntry(connection, journalEntryId, currency_id || 1);

            await connection.commit();

            res.json({
                success: true,
                message: 'Bank withdrawal recorded successfully',
                data: { journalEntryId }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error recording bank withdrawal:', error);
            res.status(500).json({
                success: false,
                message: 'Error recording bank withdrawal',
                error: error.message
            });
        } finally {
            connection.release();
        }
    }

    // Get one journal entry with lines (for edit form)
    static async getJournalEntryById(req, res) {
        try {
            const { id } = req.params;
            const [entries] = await pool.execute(`
                SELECT je.id, je.journal_id, je.entry_date, je.reference, je.description,
                       jel.id as line_id, jel.account_id, jel.debit, jel.credit, jel.description as line_description, jel.currency_id
                FROM journal_entries je
                LEFT JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
                WHERE je.id = ?
            `, [id]);
            if (!entries.length) {
                return res.status(404).json({ success: false, message: 'Journal entry not found' });
            }
            const first = entries[0];
            const data = {
                id: first.id,
                journal_id: first.journal_id,
                entry_date: first.entry_date ? new Date(first.entry_date).toISOString().split('T')[0] : null,
                reference: first.reference,
                description: first.description,
                lines: entries.filter(e => e.line_id).map(e => ({
                    id: e.line_id,
                    account_id: e.account_id,
                    debit: parseFloat(e.debit || 0),
                    credit: parseFloat(e.credit || 0),
                    description: e.line_description,
                    currency_id: e.currency_id
                }))
            };
            res.json({ success: true, data });
        } catch (error) {
            console.error('Error fetching journal entry:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch journal entry', error: error.message });
        }
    }

    // Update journal entry (description, reference, entry_date; optional amount + account_id to update one line)
    static async updateJournalEntry(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;
            const { description, reference, entry_date, amount, account_id } = req.body;
            const jeId = id;

            // Update header
            await connection.execute(
                'UPDATE journal_entries SET description = ?, reference = ?, entry_date = ? WHERE id = ?',
                [description || null, reference || null, entry_date || null, jeId]
            );

            const currencyId = 1;

            // If amount and account_id provided, update the account's line and counter line(s), and adjust balances
            if (amount != null && account_id != null && !Number.isNaN(parseFloat(amount))) {
                const newAmount = parseFloat(amount);
                if (newAmount < 0) {
                    await connection.rollback();
                    return res.status(400).json({ success: false, message: 'Amount must be non-negative' });
                }

                const [lines] = await connection.execute(`
                    SELECT jel.id as line_id, jel.account_id, jel.debit, jel.credit, jel.currency_id,
                           coa.type as account_type
                    FROM journal_entry_lines jel
                    INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
                    WHERE jel.journal_entry_id = ?
                `, [jeId]);

                if (lines.length === 0) {
                    await connection.rollback();
                    return res.status(400).json({ success: false, message: 'Journal entry has no lines' });
                }

                const accountIdNum = parseInt(account_id, 10);
                const ourLine = lines.find((l) => l.account_id === accountIdNum);
                if (!ourLine) {
                    await connection.rollback();
                    return res.status(400).json({ success: false, message: 'Account not found in this transaction' });
                }

                // Reverse existing balance changes for all lines
                for (const line of lines) {
                    const lineCurrencyId = line.currency_id || currencyId;
                    const balanceChange = (line.account_type === 'Asset' || line.account_type === 'Expense')
                        ? parseFloat(line.debit || 0) - parseFloat(line.credit || 0)
                        : parseFloat(line.credit || 0) - parseFloat(line.debit || 0);
                    const reverseChange = -balanceChange;
                    if (Math.abs(reverseChange) < 0.01) continue;

                    const [currentBalance] = await connection.execute(
                        'SELECT id, balance FROM account_balances WHERE account_id = ? AND currency_id = ? ORDER BY as_of_date DESC LIMIT 1',
                        [line.account_id, lineCurrencyId]
                    );
                    if (currentBalance.length > 0) {
                        const newBalance = parseFloat(currentBalance[0].balance) + reverseChange;
                        await connection.execute(
                            'UPDATE account_balances SET balance = ?, as_of_date = CURRENT_DATE WHERE id = ?',
                            [newBalance, currentBalance[0].id]
                        );
                    }
                }

                const otherLines = lines.filter((l) => l.account_id !== accountIdNum);

                // Only allow amount change for 2-line entries (one debit, one credit)
                if (lines.length !== 2 || otherLines.length !== 1) {
                    await connection.rollback();
                    return res.status(400).json({ success: false, message: 'Amount can only be edited for simple two-line transactions' });
                }

                const wasDebit = parseFloat(ourLine.debit || 0) > 0;
                const otherLine = otherLines[0];
                if (!otherLine) {
                    await connection.rollback();
                    return res.status(400).json({ success: false, message: 'Counter line not found' });
                }

                // Update our line: same side (debit or credit), new amount
                if (wasDebit) {
                    await connection.execute(
                        'UPDATE journal_entry_lines SET debit = ?, credit = 0 WHERE id = ?',
                        [newAmount, ourLine.line_id]
                    );
                } else {
                    await connection.execute(
                        'UPDATE journal_entry_lines SET debit = 0, credit = ? WHERE id = ?',
                        [newAmount, ourLine.line_id]
                    );
                }

                // Update counter line: same amount on the other side
                if (wasDebit) {
                    await connection.execute(
                        'UPDATE journal_entry_lines SET debit = 0, credit = ? WHERE id = ?',
                        [newAmount, otherLine.line_id]
                    );
                } else {
                    await connection.execute(
                        'UPDATE journal_entry_lines SET debit = ?, credit = 0 WHERE id = ?',
                        [newAmount, otherLine.line_id]
                    );
                }

                // Apply new balance changes for all lines (re-read updated lines)
                const [updatedLines] = await connection.execute(`
                    SELECT jel.account_id, jel.debit, jel.credit, jel.currency_id,
                           coa.type as account_type
                    FROM journal_entry_lines jel
                    INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
                    WHERE jel.journal_entry_id = ?
                `, [jeId]);

                for (const line of updatedLines) {
                    const lineCurrencyId = line.currency_id || currencyId;
                    const balanceChange = (line.account_type === 'Asset' || line.account_type === 'Expense')
                        ? parseFloat(line.debit || 0) - parseFloat(line.credit || 0)
                        : parseFloat(line.credit || 0) - parseFloat(line.debit || 0);
                    if (Math.abs(balanceChange) < 0.01) continue;

                    const [currentBalance] = await connection.execute(
                        'SELECT id, balance FROM account_balances WHERE account_id = ? AND currency_id = ? ORDER BY as_of_date DESC LIMIT 1',
                        [line.account_id, lineCurrencyId]
                    );
                    if (currentBalance.length > 0) {
                        const newBalance = parseFloat(currentBalance[0].balance) + balanceChange;
                        await connection.execute(
                            'UPDATE account_balances SET balance = ?, as_of_date = CURRENT_DATE WHERE id = ?',
                            [newBalance, currentBalance[0].id]
                        );
                    }
                }
            }

            await connection.commit();
            res.json({ success: true, message: 'Transaction updated successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Error updating journal entry:', error);
            res.status(500).json({ success: false, message: 'Failed to update transaction', error: error.message });
        } finally {
            connection.release();
        }
    }

    // Delete journal entry and reverse account balances
    static async deleteJournalEntry(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;

            const [lines] = await connection.execute(`
                SELECT jel.account_id, jel.debit, jel.credit, jel.currency_id,
                       coa.type as account_type
                FROM journal_entry_lines jel
                INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
                WHERE jel.journal_entry_id = ?
            `, [id]);

            const currencyId = 1;
            for (const line of lines) {
                const lineCurrencyId = line.currency_id || currencyId;
                const balanceChange = (line.account_type === 'Asset' || line.account_type === 'Expense')
                    ? parseFloat(line.debit || 0) - parseFloat(line.credit || 0)
                    : parseFloat(line.credit || 0) - parseFloat(line.debit || 0);
                const reverseChange = -balanceChange;
                if (Math.abs(reverseChange) < 0.01) continue;

                const [currentBalance] = await connection.execute(`
                    SELECT id, balance FROM account_balances
                    WHERE account_id = ? AND currency_id = ? ORDER BY as_of_date DESC LIMIT 1
                `, [line.account_id, lineCurrencyId]);

                if (currentBalance.length > 0) {
                    const newBalance = parseFloat(currentBalance[0].balance) + reverseChange;
                    await connection.execute(
                        'UPDATE account_balances SET balance = ?, as_of_date = CURRENT_DATE WHERE id = ?',
                        [newBalance, currentBalance[0].id]
                    );
                }
            }

            await connection.execute('DELETE FROM journal_entry_lines WHERE journal_entry_id = ?', [id]);
            await connection.execute('DELETE FROM journal_entries WHERE id = ?', [id]);
            await connection.commit();
            res.json({ success: true, message: 'Transaction deleted successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Error deleting journal entry:', error);
            res.status(500).json({ success: false, message: 'Failed to delete transaction', error: error.message });
        } finally {
            connection.release();
        }
    }
}

module.exports = CashBankController;

