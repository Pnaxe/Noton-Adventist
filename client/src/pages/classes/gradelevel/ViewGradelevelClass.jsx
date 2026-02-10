import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import BASE_URL from '../../../contexts/Api';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faBook, faChalkboardTeacher } from '@fortawesome/free-solid-svg-icons';
import StudentsTab from './StudentsTab';
import SubjectClassesTab from '../subject/SubjectClassesTab';

const ViewGradelevelClass = () => {
  const { token } = useAuth();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('subjectclasses');
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClass();
    // eslint-disable-next-line
  }, [id]);

  const fetchClass = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${BASE_URL}/classes/gradelevel-classes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setClassData(response.data.data);
      } else {
        setError('Failed to load class information.');
      }
    } catch (err) {
      setError('Failed to load class information.');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return <div className="text-xs text-gray-500">Loading...</div>;
    }
    if (error) {
      return <div className="text-xs text-red-600">{error}</div>;
    }
    if (!classData) {
      return <div className="text-xs text-gray-500">No data found.</div>;
    }
    switch (activeTab) {
      case 'students':
        return <StudentsTab classId={classData.id} />;
      case 'subjectclasses':
        return <SubjectClassesTab classId={classData.id} streamId={classData.stream_id} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen">
      <div className="bg-white border border-gray-200 rounded-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          {loading ? (
            <div className="text-xs text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-xs text-red-600">{error}</div>
          ) : classData ? (
            <>
              <div className="text-xl text-gray-900 font-semibold">{classData.name}</div>
              <div className="text-sm text-gray-500 mt-1">
                {classData.stream_name} ({classData.stream_stage})
              </div>
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:gap-8 text-sm text-gray-700">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faChalkboardTeacher} className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Teacher:</span>
                  <span className="ml-1 text-gray-900">{classData.teacher_name || 'Not Assigned'}</span>
                </div>
                <div className="flex items-center mt-2 sm:mt-0">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="ml-1 text-gray-900">{classData.capacity || 'Unlimited'}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-gray-200">
          <nav className="flex flex-wrap gap-6">
            <button
              onClick={() => setActiveTab('students')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors duration-150 ${
                activeTab === 'students'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300'
              }`}
            >
              <FontAwesomeIcon icon={faUsers} className="mr-2 h-4 w-4" />
              Students
            </button>
            <button
              onClick={() => setActiveTab('subjectclasses')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors duration-150 ${
                activeTab === 'subjectclasses'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300'
              }`}
            >
              <FontAwesomeIcon icon={faBook} className="mr-2 h-4 w-4" />
              Subject Classes
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="px-6 py-5">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default ViewGradelevelClass;
