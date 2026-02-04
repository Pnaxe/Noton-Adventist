/**
 * One-off script: delete all students from the database.
 * Related rows (guardians, balances, enrollments, etc.) are removed by ON DELETE CASCADE.
 * Run from server folder: node clear-students.js
 */

require('dotenv').config();
const { pool } = require('./config/database');

async function clearStudents() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.execute('DELETE FROM students');
    console.log(`Deleted ${result.affectedRows} student(s) from the database.`);
  } catch (err) {
    console.error('Error clearing students:', err.message);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

clearStudents();
