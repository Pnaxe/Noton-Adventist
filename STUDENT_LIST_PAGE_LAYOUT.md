# Student List Page - Complete Layout Documentation

This document contains the complete layout structure for the Student List page, including the table, filters, pagination, and all modals (Add, View, Edit, Delete).

---

## Table of Contents
1. [Page Structure Overview](#page-structure-overview)
2. [Main Container Layout](#main-container-layout)
3. [Header Section](#header-section)
4. [Filters Section](#filters-section)
5. [Table Structure](#table-structure)
6. [Pagination Footer](#pagination-footer)
7. [Add Student Modal](#add-student-modal)
8. [View Student Modal](#view-student-modal)
9. [Edit Student Modal](#edit-student-modal)
10. [Delete Confirmation Modal](#delete-confirmation-modal)
11. [Toast Notifications](#toast-notifications)
12. [Complete CSS Styles](#complete-css-styles)
13. [State Management](#state-management)

---

## Page Structure Overview

```
┌─────────────────────────────────────────────────────────┐
│ Report Header (Title + Add Button)                     │
├─────────────────────────────────────────────────────────┤
│ Filters Section (Search + Gender + Class Filters)      │
├─────────────────────────────────────────────────────────┤
│ Error Display (if any)                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Table Container (Scrollable)                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Sticky Table Header                                 │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Scrollable Table Rows                               │ │
│ │ (with empty placeholder rows)                       │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Pagination Footer (Results count + Navigation)         │
└─────────────────────────────────────────────────────────┘
```

---

## Main Container Layout

```jsx
<div className="reports-container" style={{
  height: '100%',
  maxHeight: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative'
}}>
  {/* All sections go here */}
</div>
```

---

## Header Section

```jsx
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
```

---

## Filters Section

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

    {/* Class Filter */}
    <div className="filter-group">
      <label className="filter-label" style={{ marginRight: '8px' }}>Class:</label>
      <select
        value={classFilter}
        onChange={handleClassFilterChange}
        className="filter-input"
        style={{ minWidth: '180px', width: '180px' }}
        disabled={loadingClasses}
      >
        <option value="">All Classes</option>
        {classes.map((cls) => (
          <option key={cls.id} value={cls.id}>
            {cls.name}
          </option>
        ))}
      </select>
      {classFilter && (
        <button
          onClick={handleClearClassFilter}
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
          title="Clear class filter"
        >
          ×
        </button>
      )}
    </div>
  </div>
</div>
```

---

## Table Structure

```jsx
{/* Error Display */}
{error && (
  <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }}>
    {error}
  </div>
)}

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
```

---

## Pagination Footer

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

---

## Add Student Modal

```jsx
{showAddModal && (
  <div className="modal-overlay" onClick={handleCloseModal}>
    <div
      className="modal-dialog"
      onClick={(e) => e.stopPropagation()}
      style={{ maxWidth: '800px', minHeight: isLoading ? '400px' : 'auto' }}
    >
      {isLoading ? (
        // Loading State
        <>
          <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ height: '20px', width: '200px', background: '#e5e7eb', borderRadius: '4px' }}></div>
            <div style={{ width: '18px', height: '18px', background: '#e5e7eb', borderRadius: '4px' }}></div>
          </div>
          <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: '1', minHeight: '300px' }}>
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <div style={{ height: '32px', width: '80px', background: '#e5e7eb', borderRadius: '4px' }}></div>
            <div style={{ height: '32px', width: '100px', background: '#e5e7eb', borderRadius: '4px' }}></div>
          </div>
        </>
      ) : (
        // Content State
        <>
          <div className="modal-header">
            <h3 className="modal-title">Add Student</h3>
            <button className="modal-close-btn" onClick={handleCloseModal}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="modal-body">
            {formError && (
              <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="modal-form">
              {/* Student Information Section */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#2563eb' }} />
                  Student Information
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      Registration Number <span className="required">*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        name="regNumber"
                        className="form-control"
                        placeholder="Enter or generate"
                        value={formData.regNumber}
                        onChange={handleInputChange}
                        required
                      />
                      <button
                        type="button"
                        onClick={handleGenerateRegNumber}
                        disabled={generatingRegNumber}
                        className="modal-btn"
                        style={{
                          background: '#6b7280',
                          color: 'white',
                          padding: '6px 12px',
                          whiteSpace: 'nowrap',
                          fontSize: '0.7rem'
                        }}
                      >
                        {generatingRegNumber ? 'Generating...' : 'Generate'}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      First Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="Enter first name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Surname <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="surname"
                      className="form-control"
                      placeholder="Enter surname"
                      value={formData.surname}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Date of Birth <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      className="form-control"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">National ID Number</label>
                    <input
                      type="text"
                      name="nationalIDNumber"
                      className="form-control"
                      placeholder="Enter national ID"
                      value={formData.nationalIDNumber}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Gender <span className="required">*</span>
                    </label>
                    <select
                      name="gender"
                      className="form-control"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      name="address"
                      className="form-control"
                      placeholder="Enter full address"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Guardian Information Section */}
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#10b981' }} />
                  Guardian Information
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      Guardian First Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="guardianName"
                      className="form-control"
                      placeholder="Enter guardian first name"
                      value={formData.guardianName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Guardian Surname <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="guardianSurname"
                      className="form-control"
                      placeholder="Enter guardian surname"
                      value={formData.guardianSurname}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Guardian National ID</label>
                    <input
                      type="text"
                      name="guardianNationalIDNumber"
                      className="form-control"
                      placeholder="Enter guardian national ID"
                      value={formData.guardianNationalIDNumber}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Relationship to Student</label>
                    <input
                      type="text"
                      name="relationshipToStudent"
                      className="form-control"
                      placeholder="e.g., Father, Mother, Uncle"
                      value={formData.relationshipToStudent}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">
                      Guardian Phone Number <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      name="guardianPhoneNumber"
                      className="form-control"
                      placeholder="Enter phone number"
                      value={formData.guardianPhoneNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="modal-footer">
            <button className="modal-btn modal-btn-cancel" onClick={handleCloseModal}>
              Cancel
            </button>
            <button
              className="modal-btn modal-btn-confirm"
              onClick={handleSave}
              disabled={!isFormValid() || isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Student'}
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}
```

---

## View Student Modal

```jsx
{showViewModal && (
  <div className="modal-overlay" onClick={handleCloseViewModal}>
    <div
      className="modal-dialog"
      onClick={(e) => e.stopPropagation()}
      style={{ maxWidth: '800px', minHeight: viewModalLoading ? '400px' : 'auto' }}
    >
      {viewModalLoading ? (
        // Loading State
        <>
          <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ height: '20px', width: '200px', background: '#e5e7eb', borderRadius: '4px' }}></div>
            <div style={{ width: '18px', height: '18px', background: '#e5e7eb', borderRadius: '4px' }}></div>
          </div>
          <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: '1', minHeight: '300px' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading student details...</p>
          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <div style={{ height: '32px', width: '80px', background: '#e5e7eb', borderRadius: '4px' }}></div>
          </div>
        </>
      ) : selectedStudent ? (
        // Content State
        <>
          <div className="modal-header">
            <h3 className="modal-title" style={{ color: '#000000' }}>
              Student Profile - {selectedStudent.Name} {selectedStudent.Surname}
            </h3>
            <button className="modal-close-btn" onClick={handleCloseViewModal}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="modal-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Student Information Section */}
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#2563eb' }} />
                  Student Information
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Registration Number
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                      {selectedStudent.RegNumber || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      First Name
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                      {selectedStudent.Name || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Surname
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                      {selectedStudent.Surname || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Date of Birth
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                      {formatDate(selectedStudent.DateOfBirth) || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      National ID Number
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                      {selectedStudent.NationalIDNumber || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Gender
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                      {selectedStudent.Gender || 'N/A'}
                    </div>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Address
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                      {selectedStudent.Address || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Status
                    </div>
                    <div style={{ fontSize: '0.85rem', color: selectedStudent.Active === 'Yes' ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                      {selectedStudent.Active || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Guardian Information Section */}
              {selectedStudent.guardians && selectedStudent.guardians.length > 0 && (
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#10b981' }} />
                    Guardian Information
                  </h4>

                  {selectedStudent.guardians.map((guardian, index) => (
                    <div key={index} style={{ marginBottom: index < selectedStudent.guardians.length - 1 ? '20px' : '0' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Guardian First Name
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {guardian.Name || 'N/A'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Guardian Surname
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {guardian.Surname || 'N/A'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            National ID Number
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {guardian.NationalIDNumber || 'N/A'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Phone Number
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {guardian.PhoneNumber || 'N/A'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Relationship to Student
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                            {guardian.RelationshipToStudent || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="modal-btn modal-btn-cancel" onClick={handleCloseViewModal}>
              Close
            </button>
          </div>
        </>
      ) : null}
    </div>
  </div>
)}
```

---

## Edit Student Modal

```jsx
{showEditModal && (
  <div className="modal-overlay" onClick={handleCloseEditModal}>
    <div
      className="modal-dialog"
      onClick={(e) => e.stopPropagation()}
      style={{ maxWidth: '800px', minHeight: editModalLoading ? '400px' : 'auto' }}
    >
      {editModalLoading ? (
        // Loading State (same as View Modal)
        <>
          <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ height: '20px', width: '200px', background: '#e5e7eb', borderRadius: '4px' }}></div>
            <div style={{ width: '18px', height: '18px', background: '#e5e7eb', borderRadius: '4px' }}></div>
          </div>
          <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: '1', minHeight: '300px' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Loading student details...</p>
          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <div style={{ height: '32px', width: '80px', background: '#e5e7eb', borderRadius: '4px' }}></div>
            <div style={{ height: '32px', width: '100px', background: '#e5e7eb', borderRadius: '4px' }}></div>
          </div>
        </>
      ) : (
        // Content State (similar to Add Modal but with pre-filled data)
        <>
          <div className="modal-header">
            <h3 className="modal-title">Edit Student</h3>
            <button className="modal-close-btn" onClick={handleCloseEditModal}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="modal-body">
            {editFormError && (
              <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                {editFormError}
              </div>
            )}

            <form onSubmit={handleUpdateStudent} className="modal-form">
              {/* Student Information Section */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#2563eb' }} />
                  Student Information
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      Registration Number <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="regNumber"
                      className="form-control"
                      placeholder="Enter registration number"
                      value={editFormData.regNumber}
                      onChange={handleEditInputChange}
                      required
                      readOnly
                      style={{ backgroundColor: '#f9fafb', cursor: 'not-allowed' }}
                    />
                  </div>

                  {/* Other fields same as Add Modal */}
                  {/* ... */}
                </div>
              </div>

              {/* Guardian Information Section */}
              {/* Same structure as Add Modal */}
            </form>
          </div>

          <div className="modal-footer">
            <button className="modal-btn modal-btn-cancel" onClick={handleCloseEditModal}>
              Cancel
            </button>
            <button
              className="modal-btn modal-btn-confirm"
              onClick={handleUpdateStudent}
              disabled={!isEditFormValid() || isSaving}
            >
              {isSaving ? 'Saving...' : 'Update Student'}
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}
```

---

## Delete Confirmation Modal

```jsx
{showDeleteModal && studentToDelete && (
  <div className="modal-overlay" onClick={handleCloseDeleteModal}>
    <div
      className="modal-dialog"
      onClick={(e) => e.stopPropagation()}
      style={{ maxWidth: '500px' }}
    >
      <div className="modal-header">
        <h3 className="modal-title">Confirm Delete</h3>
        <button className="modal-close-btn" onClick={handleCloseDeleteModal}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="modal-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Are you sure you want to delete this student?
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div style={{
          padding: '12px',
          background: '#f9fafb',
          borderRadius: '4px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Student Information
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            <strong>Name:</strong> {studentToDelete.Name} {studentToDelete.Surname}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            <strong>Registration Number:</strong> {studentToDelete.RegNumber}
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button
          className="modal-btn modal-btn-cancel"
          onClick={handleCloseDeleteModal}
          disabled={isDeleting}
        >
          Cancel
        </button>
        <button
          className="modal-btn modal-btn-delete"
          onClick={handleConfirmDelete}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete Student'}
        </button>
      </div>
    </div>
  </div>
)}
```

---

## Toast Notifications

```jsx
{/* Success Toast */}
{toast.visible && toast.message && (
  <div className="success-toast">
    <div
      className="success-toast-content"
      style={{ background: getToastBackgroundColor(toast.type) }}
    >
      {getToastIcon(toast.type)}
      <span>{toast.message}</span>
    </div>
  </div>
)}
```

---

## Complete CSS Styles

```css
/* CSS Variables */
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

/* Main Container */
.reports-container {
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-dialog {
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.modal-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background: #f3f4f6;
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

.modal-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Nunito', sans-serif;
  border: none;
}

.modal-btn-cancel {
  background: white;
  color: var(--text-primary);
  border: 1px solid #e5e7eb;
}

.modal-btn-cancel:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.modal-btn-confirm {
  background: var(--primary-blue);
  color: white;
}

.modal-btn-confirm:hover:not(:disabled) {
  background: #1d4ed8;
}

.modal-btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-btn-delete {
  background: #ef4444;
  color: white;
}

.modal-btn-delete:hover:not(:disabled) {
  background: #dc2626;
}

.modal-btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Form Styles */
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
}

.form-label .required {
  color: #ef4444;
}

.form-control {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 0.75rem;
  font-family: 'Nunito', sans-serif;
  color: var(--text-primary);
  background: white;
  transition: all 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-control:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

/* Toast Styles */
.success-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  animation: slideInRight 0.3s ease-out;
}

.success-toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

---

## State Management

### Required State Variables

```jsx
// Table Data
const [students, setStudents] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

// Filters & Search
const [searchTerm, setSearchTerm] = useState('');
const [activeSearchTerm, setActiveSearchTerm] = useState('');
const [genderFilter, setGenderFilter] = useState('');
const [classFilter, setClassFilter] = useState('');
const [classes, setClasses] = useState([]);
const [loadingClasses, setLoadingClasses] = useState(false);

// Pagination
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [totalStudents, setTotalStudents] = useState(0);
const [limit] = useState(25);

// Add Modal
const [showAddModal, setShowAddModal] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [generatingRegNumber, setGeneratingRegNumber] = useState(false);
const [formError, setFormError] = useState(null);
const [formData, setFormData] = useState({
  regNumber: '',
  name: '',
  surname: '',
  dateOfBirth: '',
  nationalIDNumber: '',
  address: '',
  gender: '',
  active: 'Yes',
  guardianName: '',
  guardianSurname: '',
  guardianNationalIDNumber: '',
  guardianPhoneNumber: '',
  relationshipToStudent: ''
});

// View Modal
const [showViewModal, setShowViewModal] = useState(false);
const [viewModalLoading, setViewModalLoading] = useState(false);
const [selectedStudent, setSelectedStudent] = useState(null);

// Edit Modal
const [showEditModal, setShowEditModal] = useState(false);
const [editModalLoading, setEditModalLoading] = useState(false);
const [editFormData, setEditFormData] = useState({ /* same structure as formData */ });
const [editFormError, setEditFormError] = useState(null);
const [isSaving, setIsSaving] = useState(false);

// Delete Modal
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [studentToDelete, setStudentToDelete] = useState(null);
const [isDeleting, setIsDeleting] = useState(false);

// Toast
const [toast, setToast] = useState({ message: null, type: 'success', visible: false });
```

---

## Key Features Summary

1. **Fixed Layout Structure**: Header, filters, and footer remain fixed while table scrolls
2. **Sticky Table Header**: Column headers stay visible when scrolling
3. **Alternating Row Colors**: Even rows (#fafafa), odd rows (#f3f4f6)
4. **Empty Placeholder Rows**: Maintains consistent table height (25 rows minimum)
5. **Loading States**: Spinner and skeleton loading for all modals
6. **Search & Filters**: Live search with debouncing, gender filter, class filter
7. **Pagination**: Shows current page, total pages, and navigation buttons
8. **Four Modals**: Add, View, Edit, Delete with proper validation
9. **Toast Notifications**: Success/error messages for user actions
10. **Responsive Design**: Adapts to container size with proper scrolling

---

## Color Scheme

- **Header Background**: `#1e3a5f` (Dark Navy Blue)
- **Even Rows**: `#fafafa` (Very Light Gray)
- **Odd Rows**: `#f3f4f6` (Light Gray)
- **View Button**: `#2563eb` (Blue)
- **Edit Button**: `#6366f1` (Purple)
- **Delete Button**: `#dc2626` (Red)
- **Primary Blue**: `#2563eb`
- **Text Primary**: `#1e293b` (Dark Gray)
- **Text Secondary**: `#64748b` (Medium Gray)

---

This layout can be applied to any system by adapting the data structure and API endpoints while maintaining the same visual design and user experience.
