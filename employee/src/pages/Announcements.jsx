import { useState, useEffect } from 'react';
import { useEmployeeAuth } from '../contexts/EmployeeAuthContext';
import BASE_URL from '../contexts/Api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullhorn,
  faSearch,
  faCalendarAlt,
  faUser,
  faExclamationTriangle,
  faInfoCircle,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

const Announcements = () => {
  const { employee, token } = useEmployeeAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    priority: '',
    search: ''
  });

  const fetchAnnouncements = async () => {
    if (!employee?.id) return;
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`${BASE_URL}/employee-announcements?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error('Fetch announcements error:', err);
      setError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employee?.id) {
      fetchAnnouncements();
    } else {
      setLoading(false);
    }
  }, [employee?.id, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ priority: '', search: '' });
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-xs" />;
      case 'high':
        return <FontAwesomeIcon icon={faExclamationTriangle} className="text-orange-500 text-xs" />;
      case 'medium':
        return <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 text-xs" />;
      case 'low':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-xs" />;
      default:
        return <FontAwesomeIcon icon={faInfoCircle} className="text-gray-500 text-xs" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="reports-container" style={{
      height: '100%',
      maxHeight: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Report Header - match admin (no Add button for employees) */}
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          <h2 className="report-title">Announcements</h2>
          <p className="report-subtitle">Stay updated with school news and important information.</p>
        </div>
      </div>

      {/* Filters - match admin Announcements filters card */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left">
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Search:</label>
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search announcements..."
                className="filter-input search-input"
              />
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Priority:</label>
            <select
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              className="filter-input"
              style={{ minWidth: '140px' }}
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-xs font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded"
            style={{ height: '36px' }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Content - match admin white card with list */}
      <div className="flex-1 overflow-auto min-h-0" style={{ background: '#e5e7eb', padding: '0 20px 20px' }}>
        <div className="bg-white border border-gray-200 shadow" style={{ marginTop: 0 }}>
          {error && (
            <div className="p-4 border-b border-gray-200">
              <div className="p-3 bg-red-100 border border-red-200 text-red-700 text-xs">
                {error}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="mt-3 text-xs text-gray-500">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 md:py-12 px-4">
              <FontAwesomeIcon icon={faBullhorn} className="text-gray-300 text-3xl md:text-4xl mb-4" />
              <h3 className="text-sm md:text-base font-medium text-gray-900 mb-2">No announcements found</h3>
              <p className="text-gray-500 text-xs md:text-sm">
                There are no announcements at this time.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="p-3 md:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {announcement.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(announcement.priority)}`}>
                            {announcement.priority || 'medium'}
                          </span>
                          {getPriorityIcon(announcement.priority)}
                        </div>
                      </div>

                      <p className="text-gray-600 text-xs mb-3 line-clamp-2">{announcement.content}</p>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faUser} className="text-xs" />
                          <span className="truncate">{announcement.created_by_username || 'System'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-xs" />
                          <span className="hidden sm:inline">{formatDate(announcement.created_at)}</span>
                          <span className="sm:hidden">{new Date(announcement.created_at).toLocaleDateString()}</span>
                        </div>
                        {announcement.target_name && (
                          <div className="flex items-center gap-1">
                            <span className="text-blue-600 truncate">{announcement.target_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Announcements;
