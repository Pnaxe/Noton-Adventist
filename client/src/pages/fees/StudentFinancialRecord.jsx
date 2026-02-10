import React from 'react';
import StudentFinancialRecordComponent from './components/StudentFinancialRecord';

const StudentFinancialRecord = () => {
  return (
    <div className="reports-container" style={{
      height: '100%',
      maxHeight: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          <h2 className="report-title">Student Financial Record</h2>
          <p className="report-subtitle">View and manage student financial statements.</p>
        </div>
      </div>
      <div className="report-content-container ecl-table-container" style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
        padding: '0 20px 20px',
        height: '100%'
      }}>
        <StudentFinancialRecordComponent />
      </div>
    </div>
  );
};

export default StudentFinancialRecord;
