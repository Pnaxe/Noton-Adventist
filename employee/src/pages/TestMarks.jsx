import { useState, useEffect } from 'react';
import { useEmployeeAuth } from '../contexts/EmployeeAuthContext';
import BASE_URL from '../contexts/Api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit,
  faTrash,
  faSpinner,
  faSave
} from '@fortawesome/free-solid-svg-icons';

const TestMarks = () => {
  const { employee, token } = useEmployeeAuth();
  const [subjectClasses, setSubjectClasses] = useState([]);
  const [subjectClassesFetched, setSubjectClassesFetched] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedTerm, setSelectedTerm] = useState('1');
  const [selectedType, setSelectedType] = useState('');

  const [showAddMarksModal, setShowAddMarksModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  const [studentMarks, setStudentMarks] = useState([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  useEffect(() => {
    if (employee?.id) {
      fetchSubjectClasses();
    }
  }, [employee]);

  useEffect(() => {
    if (selectedClass) {
      fetchTests();
    } else {
      setTests([]);
    }
  }, [selectedClass, selectedYear, selectedTerm, selectedType]);

  const fetchSubjectClasses = async () => {
    try {
      const response = await fetch(`${BASE_URL}/employee-classes/${employee.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        const classes = data.data.filter(cls => cls.class_type === 'Subject Class');
        setSubjectClasses(classes);
        setSubjectClassesFetched(true);
        if (classes.length > 0) {
          setSelectedClass(classes[0].id);
        }
      } else {
        setSubjectClassesFetched(true);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      setSubjectClassesFetched(true);
    }
  };

  const fetchTests = async () => {
    if (!selectedClass) return;
    setLoading(true);
    setError(null);
    try {
      let url = `${BASE_URL}/student-enrollments/subject-classes/${selectedClass}/tests?academic_year=${selectedYear}&term=${selectedTerm}`;
      if (selectedType) url += `&test_type=${selectedType}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setTests(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch tests');
      }
    } catch (err) {
      console.error('Error fetching tests:', err);
      setError('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddMarks = async (test) => {
    setSelectedTest(test);
    setShowAddMarksModal(true);
    setMarksLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/student-enrollments/class/${selectedClass}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const studentsData = await response.json();

      const marksResponse = await fetch(`${BASE_URL}/student-enrollments/tests/${test.id}/marks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const existingMarksData = await marksResponse.json();

      const students = studentsData.data || [];
      const existingMarks = existingMarksData.data || [];

      const marksList = students.map(student => {
        const markRecord = existingMarks.find(m => m.student_regnumber === student.RegNumber);
        return {
          regNumber: student.RegNumber,
          name: `${student.Name} ${student.Surname}`,
          mark: markRecord ? markRecord.mark : '',
          isExisting: !!markRecord,
          id: markRecord ? markRecord.id : null
        };
      });

      setStudentMarks(marksList);
    } catch (err) {
      console.error('Error loading marks:', err);
    } finally {
      setMarksLoading(false);
    }
  };

  const handleSaveMarks = async () => {
    setSavingMarks(true);
    try {
      for (const record of studentMarks) {
        if (record.mark === '') continue;
        const payload = {
          student_regnumber: record.regNumber,
          test_id: selectedTest.id,
          mark: parseFloat(record.mark)
        };
        const method = record.isExisting ? 'PUT' : 'POST';
        const url = record.isExisting
          ? `${BASE_URL}/student-enrollments/marks/${record.id}`
          : `${BASE_URL}/student-enrollments/marks`;

        await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }
      setShowAddMarksModal(false);
      fetchTests();
    } catch (err) {
      console.error('Error saving marks:', err);
    } finally {
      setSavingMarks(false);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test? All marks will be lost.')) return;
    try {
      await fetch(`${BASE_URL}/student-enrollments/tests/${testId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTests();
    } catch (err) {
      console.error('Error deleting test:', err);
    }
  };

  const limit = 25;
  const displayStart = tests.length > 0 ? 1 : 0;
  const displayEnd = tests.length;
  const totalTests = tests.length;

  return (
    <div className="reports-container" style={{
      height: '100%',
      maxHeight: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Report Header - no Add button, match Students page */}
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          <h2 className="report-title">Test Marks</h2>
          <p className="report-subtitle">View and manage student test scores for your subject classes.</p>
        </div>
      </div>

      {/* Filters Section - scrollable so all headers are accessible on small screens */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div
          className="report-filters-left"
          style={{
            overflowX: 'auto',
            overflowY: 'hidden',
            paddingBottom: '10px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            minWidth: 0,
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <style>{`
            .report-filters-left::-webkit-scrollbar { display: none; }
          `}</style>
          <div className="flex" style={{ gap: '12px', flexWrap: 'nowrap' }}>
          <div className="filter-group" style={{ flexShrink: 0 }}>
            <label className="filter-label" style={{ marginRight: '8px' }}>Term:</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="filter-input"
              style={{ minWidth: '100px', width: '100px' }}
            >
              <option value="1">Term 1</option>
              <option value="2">Term 2</option>
              <option value="3">Term 3</option>
            </select>
          </div>

          <div className="filter-group" style={{ flexShrink: 0 }}>
            <label className="filter-label" style={{ marginRight: '8px' }}>Year:</label>
            <input
              type="text"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="filter-input text-center"
              style={{ width: '70px' }}
            />
          </div>

          <div className="filter-group" style={{ flexShrink: 0 }}>
            <label className="filter-label" style={{ marginRight: '8px' }}>Type:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="filter-input"
              style={{ minWidth: '120px', width: '120px' }}
            >
              <option value="">All</option>
              <option value="Test">Test</option>
              <option value="Exam">Exam</option>
              <option value="Quiz">Quiz</option>
              <option value="Assignment">Assignment</option>
            </select>
          </div>
          </div>
        </div>
      </div>

      {/* Error Display - match Students page */}
      {error && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }}>
          {error}
        </div>
      )}

      {/* Table Container - pixel perfect to admin Students page */}
      <div className="report-content-container ecl-table-container" style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
        padding: 0,
        height: '100%'
      }}>
        {!subjectClassesFetched || (loading && tests.length === 0) ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            gap: '16px'
          }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {!subjectClassesFetched ? 'Loading...' : 'Loading tests...'}
            </p>
          </div>
        ) : subjectClassesFetched && !selectedClass ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem'
          }}>
            You are not assigned to any subject class.
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
                <th style={{ padding: '6px 10px' }}>TEST TITLE</th>
                <th style={{ padding: '6px 10px' }}>TYPE</th>
                <th style={{ padding: '6px 10px' }}>MAX MARK</th>
                <th style={{ padding: '6px 10px' }}>DATE</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test, index) => (
                <tr
                  key={test.id}
                  style={{
                    height: '32px',
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>{test.title}</td>
                  <td style={{ padding: '4px 10px' }}>{test.test_type}</td>
                  <td style={{ padding: '4px 10px' }}>{test.max_mark}</td>
                  <td style={{ padding: '4px 10px' }}>
                    {test.created_at ? new Date(test.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleOpenAddMarks(test)}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Manage Marks"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDeleteTest(test.id)}
                        style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Empty placeholder rows to always show 25 rows - match Students page */}
              {Array.from({ length: Math.max(0, limit - tests.length) }).map((_, index) => (
                <tr
                  key={`empty-${index}`}
                  style={{
                    height: '32px',
                    backgroundColor: (tests.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
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

      {/* Pagination Footer - match admin Students page */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {totalTests} results.
        </div>
        <div className="table-footer-right">
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            All data displayed
          </div>
        </div>
      </div>

      {/* Manage Marks Modal - match admin modal, wider for table */}
      {showAddMarksModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="mb-4 flex-shrink-0">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Manage Marks: {selectedTest?.title}
              </h3>
              <p className="text-xs text-gray-500">Max Marks: {selectedTest?.max_mark}</p>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 border border-gray-200 rounded">
              {marksLoading ? (
                <div className="px-4 py-8 text-center text-xs text-gray-500">
                  Loading students...
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reg Number
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mark
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {studentMarks.map((record, index) => (
                      <tr key={record.regNumber} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 font-mono">
                          {record.regNumber}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {record.name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <input
                            type="number"
                            value={record.mark}
                            max={selectedTest?.max_mark}
                            onChange={(e) => {
                              const newList = [...studentMarks];
                              newList[index].mark = e.target.value;
                              setStudentMarks(newList);
                            }}
                            className="w-20 text-right text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-4 flex-shrink-0">
              <button
                onClick={() => setShowAddMarksModal(false)}
                className="px-4 py-2 text-xs bg-gray-300 text-gray-700 hover:bg-gray-400 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMarks}
                disabled={savingMarks}
                className="px-4 py-2 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded disabled:opacity-50 inline-flex items-center gap-2"
              >
                {savingMarks ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="h-3 w-3" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="h-3 w-3" />
                    Save All Marks
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestMarks;
