import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faUser,
  faCog,
  faSignOutAlt,
  faBars,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useEmployeeAuth } from '../contexts/EmployeeAuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/brooklyne.png';
import SettingsModal from './SettingsModal';

const Header = ({ onMenuClick }) => {
  const { employee, logout } = useEmployeeAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowDropdown(false);
  };

  // Get employee initials for avatar
  const getInitials = () => {
    if (!employee) return 'E';
    const name = employee.full_name || '';
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return 'E';
  };

  // Get employee name display
  const getEmployeeName = () => {
    if (!employee) return 'Employee';
    return employee.full_name || 'Employee';
  };

  // Get employee ID display
  const getEmployeeID = () => {
    if (!employee) return 'Employee';
    return employee.employee_id || 'Employee';
  };

  return (
    <nav className="top-nav-bar">
      <div className="top-nav-content">
        {/* Left - Menu Button (Mobile) & Logo - always visible on small screens */}
        <div className="top-nav-left flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink-0">
          <button
            type="button"
            className="top-nav-menu-btn lg:hidden flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <FontAwesomeIcon icon={faBars} className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </button>
          <img src={logo} alt="Logo" className="top-nav-logo flex-shrink-0" />
          <span className="hidden md:inline" style={{
            fontSize: '1rem',
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            marginLeft: '4px',
            whiteSpace: 'nowrap'
          }}>Norton Adventist Secondary School</span>
        </div>

        {/* Center - Empty */}
        <div className="top-nav-center hidden sm:block">
        </div>

        {/* Right - User Info */}
        <div className="top-nav-right flex-shrink-0">
          {/* Notifications */}
          <button
            type="button"
            className="top-nav-icon-btn -m-2.5 p-2.5 text-gray-400 hover:text-gray-500 transition-colors"
            onClick={() => navigate('/notifications')}
          >
            <span className="sr-only">View notifications</span>
            <FontAwesomeIcon icon={faBell} className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* User Info with Dropdown - hide text on very small screens so menu has room */}
          <div className="top-nav-user-info" ref={dropdownRef}>
            <div className="top-nav-user-details hidden sm:block">
              <p className="top-nav-username">{getEmployeeName()}</p>
              <p className="top-nav-user-role">{getEmployeeID()}</p>
            </div>
            <div
              className="top-nav-avatar"
              onClick={() => setShowDropdown(!showDropdown)}
              role="button"
              aria-label="Account menu"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowDropdown(!showDropdown); }}
            >
              {getInitials()}
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="avatar-dropdown">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate('/profile');
                    setShowDropdown(false);
                  }}
                >
                  <FontAwesomeIcon icon={faUser} className="dropdown-icon" />
                  <span>Profile</span>
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowSettingsModal(true);
                    setShowDropdown(false);
                  }}
                >
                  <FontAwesomeIcon icon={faCog} className="dropdown-icon" />
                  <span>Settings</span>
                </button>
                <button
                  className="dropdown-item logout"
                  onClick={handleLogout}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="dropdown-icon" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
      )}
    </nav>
  );
};

export default Header;
