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
      <StudentFinancialRecordComponent />
    </div>
  );
};

export default StudentFinancialRecord;
