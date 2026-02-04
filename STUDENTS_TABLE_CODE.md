# Complete Students Table Code with Design and Colors

Here's the complete code for the students table including all the design, colors, and styling.

## CSS Variables (Add to your :root)

```css
:root {
  --sidebar-bg: #1e3a5f;      /* Dark blue header background */
  --sidebar-hover: #2a4a6f;
  --sidebar-active: #3a5a7f;
  --main-bg: #e5e7eb;
  --card-bg: #ffffff;
  --text-primary: #1e293b;     /* Dark gray text */
  --text-secondary: #64748b;   /* Medium gray text */
  --text-light: #94a3b8;
  --border-color: #e2e8f0;     /* Light border color */
  --primary-blue: #2563eb;    /* Blue for buttons/actions */
}
```

## Complete Table JSX Code

```jsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faPlus,
  faEye,
  faEdit,
  faTrash,
  faUserGraduate,
  faPhone,
  faMapMarkerAlt,
  faSave,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

// Add this to your component state
const [students, setStudents] = useState([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState('');
const [activeSearchTerm, setActiveSearchTerm] = useState('');
const [genderFilter, setGenderFilter] = useState('');
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [totalStudents, setTotalStudents] = useState(0);
const [limit] = useState(25);

// Main container with overflow control
<div className="reports-container" style={{
  height: '100%',
  maxHeight: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative'
}}>
  {/* Report Header */}
  <div className="report-header" style={{ flexShrink: 0 }}>
    <div className="report-header-content">
      <h2 className="report-title">Students</h2>
      <p className="report-subtitle">Manage student registrations and information.</p>
    </div>
    <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <button
        onClick={handleOpenModal}
        className="btn-checklist"
      >
        <FontAwesomeIcon icon={faPlus} />
        Add Student
      </button>
    </div>
  </div>

  {/* Filters Section */}
  <div className="report-filters" style={{ flexShrink: 0 }}>
    <div className="report-filters-left">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="filter-group">
        <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, surname, or registration number..."
            className="filter-input search-input"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setActiveSearchTerm('');
                setCurrentPage(1);
              }}
              style={{
                position: 'absolute',
                right: '8px',
                padding: '4px 6px',
                background: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px'
              }}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </form>

      {/* Gender Filter */}
      <div className="filter-group">
        <label className="filter-label" style={{ marginRight: '8px' }}>Gender:</label>
        <select
          value={genderFilter}
          onChange={handleGenderFilterChange}
          className="filter-input"
          style={{ minWidth: '120px', width: '120px' }}
        >
          <option value="">All</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        {genderFilter && (
          <button
            onClick={handleClearGenderFilter}
            style={{
              marginLeft: '8px',
              padding: '6px 10px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.7rem',
              color: 'var(--text-secondary)'
            }}
            title="Clear gender filter"
          >
            ×
          </button>
        )}
      </div>
    </div>
  </div>

  {/* Table Container */}
  <div className="report-content-container ecl-table-container" style={{
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'auto',
    minHeight: 0,
    padding: 0,
    height: '100%'
  }}>
    {loading && students.length === 0 ? (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          gap: '16px'
        }}
      >
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading students...</p>
      </div>
    ) : (
      <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
        <thead style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--sidebar-bg)'
        }}>
          <tr>
            <th style={{ padding: '6px 10px' }}>REG NUMBER</th>
            <th style={{ padding: '6px 10px' }}>NAME</th>
            <th style={{ padding: '6px 10px' }}>SURNAME</th>
            <th style={{ padding: '6px 10px' }}>GENDER</th>
            <th style={{ padding: '6px 10px' }}>STATUS</th>
            <th style={{ padding: '6px 10px' }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr
              key={student.RegNumber}
              style={{
                height: '32px',
                backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
              }}
            >
              <td style={{ padding: '4px 10px' }}>
                {student.RegNumber}
              </td>
              <td style={{ padding: '4px 10px' }}>
                {student.Name}
              </td>
              <td style={{ padding: '4px 10px' }}>
                {student.Surname}
              </td>
              <td style={{ padding: '4px 10px' }}>
                {student.Gender || 'N/A'}
              </td>
              <td style={{ padding: '4px 10px' }}>
                {student.Active || 'Unknown'}
              </td>
              <td style={{ padding: '4px 10px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleViewStudent(student.RegNumber)}
                    style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    title="View"
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                  <button
                    onClick={() => handleEditStudent(student.RegNumber)}
                    style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    title="Edit"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(student)}
                    style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    title="Delete"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {/* Empty placeholder rows to always show 25 rows */}
          {Array.from({ length: Math.max(0, 25 - students.length) }).map((_, index) => (
            <tr
              key={`empty-${index}`}
              style={{
                height: '32px',
                backgroundColor: (students.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
              }}
            >
              <td style={{ padding: '4px 10px' }}>&nbsp;</td>
              <td style={{ padding: '4px 10px' }}>&nbsp;</td>
              <td style={{ padding: '4px 10px' }}>&nbsp;</td>
              <td style={{ padding: '4px 10px' }}>&nbsp;</td>
              <td style={{ padding: '4px 10px' }}>&nbsp;</td>
              <td style={{ padding: '4px 10px' }}>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>

  {/* Pagination Footer */}
  <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
    <div className="table-footer-left">
      Showing {displayStart} to {displayEnd} of {totalStudents || 0} results.
    </div>
    <div className="table-footer-right">
      {!activeSearchTerm && totalPages > 1 && (
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="pagination-info" style={{ fontSize: '0.7rem' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
      {!activeSearchTerm && totalPages <= 1 && (
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          All data displayed
        </div>
      )}
    </div>
  </div>
</div>
```

## Complete CSS Styles

```css
/* Main Container */
.reports-container {
  height: 100%;
  maxHeight: 100%;
  overflow: hidden;
  display: flex;
  flexDirection: column;
  position: relative;
}

/* Report Header */
.report-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  background: white;
  flex-shrink: 0;
}

.report-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
}

.report-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.report-subtitle {
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin: 0;
  margin-top: 4px;
}

.report-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Filters Section */
.report-filters {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  background: white;
  flex-shrink: 0;
}

.report-filters-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.filter-input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.75rem;
  font-family: 'Nunito', sans-serif;
  color: var(--text-primary);
  background: white;
  min-width: 140px;
  width: 140px;
  height: 36px;
  box-sizing: border-box;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-secondary);
  z-index: 2;
  width: 16px;
  height: 16px;
  font-size: 0.875rem;
}

.search-input {
  padding-left: 40px !important;
  padding-right: 40px !important;
}

/* Table Container */
.report-content-container.ecl-table-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
  min-height: 0;
  border-bottom: 1px solid #d1d5db;
  padding: 0;
  scrollbar-width: thin;
  scrollbar-color: #888 #f1f1f1;
}

.report-content-container.ecl-table-container::-webkit-scrollbar {
  height: 6px;
  width: 6px;
  display: block;
}

.report-content-container.ecl-table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.report-content-container.ecl-table-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.report-content-container.ecl-table-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Table Styles */
.ecl-table {
  font-size: 0.75rem;
  width: 100%;
  border-collapse: collapse;
  font-family: 'Nunito', sans-serif;
}

.ecl-table thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--sidebar-bg);
}

.ecl-table th {
  padding: 6px 10px;
  text-align: left;
  font-weight: 600;
  color: white;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-left: 2px solid rgba(255, 255, 255, 0.3);
  border-right: 2px solid rgba(255, 255, 255, 0.3);
  background: var(--sidebar-bg);
}

.ecl-table th:first-child {
  border-left: none;
}

.ecl-table th:last-child {
  border-right: none;
}

.ecl-table tbody tr {
  height: 32px;
}

.ecl-table tbody tr:nth-child(even) {
  background-color: #fafafa;
}

.ecl-table tbody tr:nth-child(odd) {
  background-color: #f3f4f6;
}

.ecl-table tbody tr:hover {
  background: rgba(249, 250, 251, 0.5);
}

.ecl-table td {
  padding: 4px 10px;
  color: var(--text-primary);
  vertical-align: top;
  line-height: 1.2;
  border-left: 2px solid #e5e7eb;
  border-right: 2px solid #e5e7eb;
  font-size: 0.75rem;
}

.ecl-table td:first-child {
  border-left: none;
}

.ecl-table td:last-child {
  border-right: none;
}

/* Table Footer */
.ecl-table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.75rem;
  color: var(--text-secondary);
  flex-shrink: 0;
  background: white;
}

.table-footer-left {
  color: var(--text-secondary);
  font-weight: 700;
}

.table-footer-right {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 400;
}

/* Pagination */
.pagination-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pagination-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Nunito', sans-serif;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 80px;
  text-align: center;
}

/* Loading Spinner */
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Button Styles */
.btn-checklist {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Nunito', sans-serif;
}

.btn-checklist:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}
```

## Color Scheme Summary

**Header Colors:**
- Background: `#1e3a5f` (Dark Navy Blue)
- Text: `white`

**Row Colors:**
- Even rows: `#fafafa` (Very Light Gray)
- Odd rows: `#f3f4f6` (Light Gray)
- Hover: `rgba(249, 250, 251, 0.5)` (Semi-transparent light blue)

**Action Button Colors:**
- View: `#2563eb` (Blue)
- Edit: `#6366f1` (Purple)
- Delete: `#dc2626` (Red)

**Border Colors:**
- Light borders: `#e5e7eb` (Gray)
- Dark borders: `#d1d5db` (Medium Gray)

**Text Colors:**
- Primary: `#1e293b` (Dark Gray)
- Secondary: `#64748b` (Medium Gray)

## Key Features

1. **Fixed Header/Footer**: Header and footer stay visible while table scrolls
2. **Sticky Table Header**: Column headers remain visible when scrolling
3. **Alternating Row Colors**: Visual distinction between rows
4. **Empty Placeholder Rows**: Consistent table height (25 rows minimum)
5. **Responsive Design**: Adapts to container size
6. **Loading State**: Spinner and message during data loading
7. **Pagination**: Previous/Next buttons with page info
8. **Search & Filters**: Real-time search with filter options

## Usage Notes

- The main container uses `overflow: hidden` to prevent page scrolling
- Table container uses `overflow: auto` for internal scrolling
- Flexbox layout ensures proper space distribution
- All measurements use `rem` units for scalability
- Font family is 'Nunito' for consistent typography