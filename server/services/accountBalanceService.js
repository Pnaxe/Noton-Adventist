const { pool } = require('../config/database');

class AccountBalanceService {
    /**
     * Update account balances based on journal entry lines
     * @param {object} conn - Database connection
     * @param {number} journalEntryId - Journal entry ID
     * @param {number} currencyId - Currency ID (optional, defaults to 1 for USD)
     */
    static async updateAccountBalancesFromJournalEntry(conn, journalEntryId, currencyId = 1) {
        try {
            console.log(`🔄 Updating account balances for journal entry ${journalEntryId}...`);

            // Get all journal entry lines for this journal entry with account type
            const [journalLines] = await conn.execute(`
                SELECT 
                    jel.account_id, 
                    jel.debit, 
                    jel.credit, 
                    jel.currency_id,
                    coa.type as account_type
                FROM journal_entry_lines jel
                INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
                WHERE jel.journal_entry_id = ?
            `, [journalEntryId]);

            if (journalLines.length === 0) {
                console.log('⚠️ No journal entry lines found for journal entry:', journalEntryId);
                return;
            }

            console.log(`📊 Found ${journalLines.length} journal entry lines to process`);

            // Process each journal entry line
            for (const line of journalLines) {
                const lineCurrencyId = line.currency_id || currencyId;
                
                // Calculate balance change based on account type
                // Assets & Expenses: Debit increases (+), Credit decreases (-)
                // Liabilities, Equity, Revenue: Credit increases (+), Debit decreases (-)
                const balanceChange = (line.account_type === 'Asset' || line.account_type === 'Expense')
                    ? parseFloat(line.debit || 0) - parseFloat(line.credit || 0)
                    : parseFloat(line.credit || 0) - parseFloat(line.debit || 0);
                
                if (Math.abs(balanceChange) < 0.01) {
                    console.log(`⏭️ Skipping account ${line.account_id} (${line.account_type}) - no significant balance change`);
                    continue;
                }

                console.log(`💰 Processing account ${line.account_id} (${line.account_type}): ${balanceChange > 0 ? '+' : ''}${balanceChange}`);

                // Get current balance for this account and currency
                const [currentBalance] = await conn.execute(`
                    SELECT id, balance 
                    FROM account_balances 
                    WHERE account_id = ? AND currency_id = ? 
                    ORDER BY as_of_date DESC 
                    LIMIT 1
                `, [line.account_id, lineCurrencyId]);

                let newBalance;
                if (currentBalance.length > 0) {
                    // Update existing balance
                    newBalance = parseFloat(currentBalance[0].balance) + balanceChange;
                    await conn.execute(`
                        UPDATE account_balances 
                        SET balance = ?, as_of_date = CURRENT_DATE 
                        WHERE id = ?
                    `, [newBalance, currentBalance[0].id]);
                    
                    console.log(`✅ Updated existing balance for account ${line.account_id}: ${currentBalance[0].balance} → ${newBalance}`);
                } else {
                    // Create new balance record
                    newBalance = balanceChange;
                    await conn.execute(`
                        INSERT INTO account_balances (account_id, currency_id, balance, as_of_date) 
                        VALUES (?, ?, ?, CURRENT_DATE)
                    `, [line.account_id, lineCurrencyId, newBalance]);
                    
                    console.log(`✅ Created new balance for account ${line.account_id}: ${newBalance}`);
                }
            }

            console.log(`✅ Successfully updated account balances for journal entry ${journalEntryId}`);
        } catch (error) {
            console.error('❌ Error updating account balances:', error);
            throw error;
        }
    }

    /**
     * Update account balances for multiple journal entries
     * @param {object} conn - Database connection
     * @param {Array} journalEntryIds - Array of journal entry IDs
     * @param {number} currencyId - Currency ID (optional, defaults to 1 for USD)
     */
    static async updateAccountBalancesFromMultipleJournalEntries(conn, journalEntryIds, currencyId = 1) {
        try {
            console.log(`🔄 Updating account balances for ${journalEntryIds.length} journal entries...`);

            for (const journalEntryId of journalEntryIds) {
                await this.updateAccountBalancesFromJournalEntry(conn, journalEntryId, currencyId);
            }

            console.log(`✅ Successfully updated account balances for all journal entries`);
        } catch (error) {
            console.error('❌ Error updating account balances for multiple journal entries:', error);
            throw error;
        }
    }

    /**
     * Recalculate all account balances from journal entries
     * This is useful for fixing existing data or after data migration
     * @param {object} conn - Database connection (optional)
     */
    static async recalculateAllAccountBalances(conn = null) {
        const shouldReleaseConnection = !conn;
        if (!conn) {
            conn = await pool.getConnection();
        }

        try {
            console.log('🔄 Starting full account balance recalculation...');

            // Clear all existing balances
            await conn.execute('DELETE FROM account_balances');
            console.log('🗑️ Cleared all existing account balances');

            // Get all journal entry lines grouped by account and currency with account type
            const [allLines] = await conn.execute(`
                SELECT 
                    jel.account_id,
                    coa.type as account_type,
                    COALESCE(jel.currency_id, 1) as currency_id,
                    SUM(COALESCE(jel.debit, 0)) as total_debit,
                    SUM(COALESCE(jel.credit, 0)) as total_credit
                FROM journal_entry_lines jel
                INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
                GROUP BY jel.account_id, coa.type, COALESCE(jel.currency_id, 1)
                HAVING (SUM(COALESCE(jel.debit, 0)) - SUM(COALESCE(jel.credit, 0))) != 0
            `);

            console.log(`📊 Found ${allLines.length} accounts with balances to recalculate`);

            // Create new balance records
            for (const line of allLines) {
                let balance;
                // Calculate balance based on account type
                // Assets and Expenses have DEBIT normal balance: Debit - Credit
                // Liabilities, Equity, and Revenue have CREDIT normal balance: Credit - Debit
                if (line.account_type === 'Asset' || line.account_type === 'Expense') {
                    balance = parseFloat(line.total_debit) - parseFloat(line.total_credit);
                } else {
                    balance = parseFloat(line.total_credit) - parseFloat(line.total_debit);
                }
                
                await conn.execute(`
                    INSERT INTO account_balances (account_id, currency_id, balance, as_of_date) 
                    VALUES (?, ?, ?, CURRENT_DATE)
                `, [line.account_id, line.currency_id, balance]);

                console.log(`✅ Recalculated balance for account ${line.account_id} (${line.account_type}): ${balance}`);
            }

            console.log('✅ Successfully recalculated all account balances');
        } catch (error) {
            console.error('❌ Error recalculating account balances:', error);
            throw error;
        } finally {
            if (shouldReleaseConnection) {
                conn.release();
            }
        }
    }

    /**
     * Reverse account balances based on journal entry lines (opposite of updateAccountBalancesFromJournalEntry)
     * @param {object} conn - Database connection
     * @param {number} journalEntryId - Journal entry ID
     * @param {number} currencyId - Currency ID (optional, defaults to 1 for USD)
     */
    static async reverseAccountBalancesFromJournalEntry(conn, journalEntryId, currencyId = 1) {
        try {
            console.log(`🔄 Reversing account balances for journal entry ${journalEntryId}...`);

            // Get all journal entry lines for this journal entry with account type
            const [journalLines] = await conn.execute(`
                SELECT 
                    jel.account_id, 
                    jel.debit, 
                    jel.credit, 
                    jel.currency_id,
                    coa.type as account_type
                FROM journal_entry_lines jel
                INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
                WHERE jel.journal_entry_id = ?
            `, [journalEntryId]);

            if (journalLines.length === 0) {
                console.log('⚠️ No journal entry lines found for journal entry:', journalEntryId);
                return;
            }

            console.log(`📊 Found ${journalLines.length} journal entry lines to reverse`);

            // Process each journal entry line (reverse the balance change)
            for (const line of journalLines) {
                const lineCurrencyId = line.currency_id || currencyId;
                
                // Calculate balance change based on account type (same as update)
                const balanceChange = (line.account_type === 'Asset' || line.account_type === 'Expense')
                    ? parseFloat(line.debit || 0) - parseFloat(line.credit || 0)
                    : parseFloat(line.credit || 0) - parseFloat(line.debit || 0);
                
                if (Math.abs(balanceChange) < 0.01) {
                    console.log(`⏭️ Skipping account ${line.account_id} (${line.account_type}) - no significant balance change`);
                    continue;
                }

                // Reverse the change (subtract instead of add)
                const reverseChange = -balanceChange;
                console.log(`💰 Reversing account ${line.account_id} (${line.account_type}): ${balanceChange} → ${reverseChange > 0 ? '+' : ''}${reverseChange}`);

                // Get current balance for this account and currency
                const [currentBalance] = await conn.execute(`
                    SELECT id, balance 
                    FROM account_balances 
                    WHERE account_id = ? AND currency_id = ? 
                    ORDER BY as_of_date DESC 
                    LIMIT 1
                `, [line.account_id, lineCurrencyId]);

                if (currentBalance.length > 0) {
                    // Update existing balance (reverse the change)
                    const newBalance = parseFloat(currentBalance[0].balance) + reverseChange;
                    await conn.execute(`
                        UPDATE account_balances 
                        SET balance = ?, as_of_date = CURRENT_DATE 
                        WHERE id = ?
                    `, [newBalance, currentBalance[0].id]);
                    
                    console.log(`✅ Reversed balance for account ${line.account_id}: ${currentBalance[0].balance} → ${newBalance}`);
                } else {
                    console.log(`⚠️ No balance record found for account ${line.account_id} to reverse`);
                }
            }

            console.log(`✅ Successfully reversed account balances for journal entry ${journalEntryId}`);
        } catch (error) {
            console.error('❌ Error reversing account balances:', error);
            throw error;
        }
    }

    /**
     * Get current balance for a specific account and currency
     * @param {object} conn - Database connection
     * @param {number} accountId - Account ID
     * @param {number} currencyId - Currency ID (optional, defaults to 1 for USD)
     */
    static async getAccountBalance(conn, accountId, currencyId = 1) {
        try {
            const [result] = await conn.execute(`
                SELECT balance 
                FROM account_balances 
                WHERE account_id = ? AND currency_id = ? 
                ORDER BY as_of_date DESC 
                LIMIT 1
            `, [accountId, currencyId]);

            return result.length > 0 ? parseFloat(result[0].balance) : 0;
        } catch (error) {
            console.error('❌ Error getting account balance:', error);
            throw error;
        }
    }
}

module.exports = AccountBalanceService;
