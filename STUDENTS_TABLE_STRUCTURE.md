# Students Page Table Structure

This document contains the complete table structure from the Students page that can be applied to other projects.

## 1. Main Container Structure

```jsx
<div className="reports-container" style={{
  height: '100%',
  maxHeight: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative'
}}>
```

## 2. Header Section

```jsx
<div className="report-header" style={{ flexShrink: 0 }}>
  <div className="report-header-content">
    <h2 className="report-title">Students</h2>
    <p className="report-subtitle">Manage student registrations and information.</p>
  </div>
  <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <button onClick={handleOpenModal} className="btn-checklist">
      <FontAwesomeIcon icon={faPlus} />
      Add Student
    </button>
  </div>
</div>
```

## 3. Filters Section

```jsx
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

    {/* Additional Filters */}
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
        <button onClick={handleClearGenderFilter} style={{ marginLeft: '8px', padding: '6px 10px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          ×
        </button>
      )}
    </div>
  </div>
</div>
```

## 4. Error Display

```jsx
{error && (
  <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }}>
    {error}
  </div>
)}
```

## 5. Table Container (Scrollable)

```jsx
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
    // Loading State
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '200px',
      gap: '16px'
    }}>
      <div className="loading-spinner"></div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading students...</p>
    </div>
  ) : (
    // Table
    <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
      {/* Table content */}
    </table>
  )}
</div>
```

## 6. Table Structure

```jsx
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
```

## 7. Pagination Footer

```jsx
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
```

## 8. CSS Styles

### Main Container
```css
.reports-container {
  height: 100%;
  maxHeight: 100%;
  overflow: hidden;
  display: flex;
  flexDirection: column;
  position: relative;
}
```

### Table Container
```css
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
```

### Table Styles
```css
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
```

### Table Footer
```css
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
```

### Loading Spinner
```css
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
```

## 9. Key Features

1. **Fixed Header/Footer**: Header and footer remain visible while table scrolls
2. **Sticky Table Header**: Table header stays at top when scrolling
3. **Alternating Row Colors**: Even rows (#fafafa), odd rows (#f3f4f6)
4. **Empty Placeholder Rows**: Maintains consistent table height
5. **Loading State**: Shows spinner and message while loading
6. **Responsive Scrolling**: Only table content scrolls, not entire page
7. **Pagination**: Shows current page, total pages, and navigation buttons
8. **Search & Filters**: Live search with debouncing and filter options

## 10. CSS Variables Used

```css
:root {
  --sidebar-bg: #1e3a5f;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --primary-blue: #2563eb;
}
```

## 11. Complete Layout Flow

```
┌─────────────────────────────────────┐
│ Report Header (flexShrink: 0)       │
├─────────────────────────────────────┤
│ Filters Section (flexShrink: 0)    │
├─────────────────────────────────────┤
│ Error Display (if any)             │
├─────────────────────────────────────┤
│                                     │
│ Table Container (flex: 1)           │
│ ┌─────────────────────────────────┐ │
│ │ Sticky Header                   │ │
│ ├─────────────────────────────────┤ │
│ │ Scrollable Rows                 │ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ Pagination Footer (flexShrink: 0)  │
└─────────────────────────────────────┘
```

## Notes

- The main container uses `overflow: hidden` to prevent page scrolling
- The table container uses `overflow: auto` to enable scrolling within it
- All sections except the table container have `flexShrink: 0` to maintain their size
- The table container has `flex: 1` to take up remaining space
- Empty placeholder rows ensure the table always shows 25 rows for consistency
- Row colors alternate using `index % 2 === 0` for even rows
