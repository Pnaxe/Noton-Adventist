import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faCog,
  faSignOutAlt,
  faBars,
  faCalendarAlt,
  faUsers,
  faBullhorn,
  faMoneyBillWave,
  faShoppingCart,
  faList,
  faWarehouse,
  faChartLine,
  faBoxes,
  faPlus,
  faTshirt,
  faCogs,
  faColumns,
  faBed,
  faBalanceScale,
  faHistory,
  faFileInvoiceDollar,
  faHandHoldingUsd,
  faFileContract,
  faUserShield,
  faKey,
  faUserPlus,
  faSchool,
  faCalendarCheck,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSports } from '../contexts/SportsContext';
import { useAccounting } from '../contexts/AccountingContext';
import { useInventory } from '../contexts/InventoryContext';
import { useBilling } from '../contexts/BillingContext';
import { useSettings } from '../contexts/SettingsContext';
import { useBoarding } from '../contexts/BoardingContext';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/norton_logo.png';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isMenuOverflowing, setIsMenuOverflowing] = useState(false);
  const [accountingVisibleCount, setAccountingVisibleCount] = useState(6);
  const [accountingMoreOpen, setAccountingMoreOpen] = useState(false);
  const [billingVisibleCount, setBillingVisibleCount] = useState(6);
  const [billingMoreOpen, setBillingMoreOpen] = useState(false);
  const [sportsVisibleCount, setSportsVisibleCount] = useState(4);
  const [sportsMoreOpen, setSportsMoreOpen] = useState(false);
  const [classesVisibleCount, setClassesVisibleCount] = useState(4);
  const [classesMoreOpen, setClassesMoreOpen] = useState(false);
  const [boardingVisibleCount, setBoardingVisibleCount] = useState(2);
  const [boardingMoreOpen, setBoardingMoreOpen] = useState(false);
  const dropdownRef = useRef(null);
  const accountingMoreRef = useRef(null);
  const billingMoreRef = useRef(null);
  const sportsMoreRef = useRef(null);
  const classesMoreRef = useRef(null);
  const boardingMoreRef = useRef(null);
  const topNavContentRef = useRef(null);
  const topNavLeftRef = useRef(null);
  const topNavRightRef = useRef(null);
  const topNavUserInfoRef = useRef(null);
  const topNavMenuRef = useRef(null);

  // Get sports context (will return default if not in provider)
  const sportsContext = useSports();
  const { activeTab: activeSportsTab, setActiveTab: onSportsTabChange, showCalendar } = sportsContext;

  // Get accounting context (will return default if not in provider)
  const accountingContext = useAccounting();
  const { activeTab: activeAccountingTab, setActiveTab: onAccountingTabChange } = accountingContext;

  // Get inventory context (will return default if not in provider)
  const inventoryContext = useInventory();
  const { activeTab: activeInventoryTab, setActiveTab: onInventoryTabChange } = inventoryContext;

  // Get billing context (will return default if not in provider)
  const billingContext = useBilling();
  const { activeTab: activeBillingTab, setActiveTab: onBillingTabChange } = billingContext;

  // Get settings context (will return default if not in provider)
  const settingsContext = useSettings();
  const { activeTab: activeSettingsTab, setActiveTab: onSettingsTabChange } = settingsContext;

  // Get boarding context (will return default if not in provider)
  const boardingContext = useBoarding();
  const { activeTab: activeBoardingTab, setActiveTab: onBoardingTabChange } = boardingContext;

  // Check if we're on the sports page
  const isSportsPage = location.pathname.startsWith('/dashboard/sports');

  // Check if we're on an accounting page
  const isAccountingPage = location.pathname.startsWith('/dashboard/accounting') ||
    location.pathname.startsWith('/dashboard/expenses') ||
    location.pathname.startsWith('/dashboard/assets') ||
    location.pathname.startsWith('/dashboard/reports');

  // Check if we're on an inventory page
  const isInventoryPage = location.pathname.startsWith('/dashboard/inventory');

  // Check if we're on a billing page
  const isBillingPage = location.pathname.startsWith('/dashboard/billing');

  // Check if we're on a settings page
  const isSettingsPage = location.pathname.startsWith('/dashboard/settings');

  // Check if we're on a boarding page
  const isBoardingPage = location.pathname.startsWith('/dashboard/boarding');

  // Check if we're on a classes page
  const isClassesPage = location.pathname.startsWith('/dashboard/classes');

  // Set active accounting tab based on current route
  useEffect(() => {
    if (isAccountingPage && onAccountingTabChange) {
      if (location.pathname.startsWith('/dashboard/accounting')) {
        onAccountingTabChange('chart-of-accounts');
      } else if (location.pathname.startsWith('/dashboard/expenses')) {
        onAccountingTabChange('expenses');
      } else if (location.pathname.startsWith('/dashboard/assets')) {
        onAccountingTabChange('fixed-assets');
      } else if (location.pathname.startsWith('/dashboard/reports')) {
        onAccountingTabChange('financial-reports');
      }
    }
  }, [location.pathname, isAccountingPage, onAccountingTabChange]);

  // Set active inventory tab based on current route (if needed in future)
  useEffect(() => {
    if (isInventoryPage && onInventoryTabChange) {
      // For now, keep the current tab from context
      // Can be extended to set based on route if needed
    }
  }, [location.pathname, isInventoryPage, onInventoryTabChange]);

  // Set active billing tab based on current route
  useEffect(() => {
    if (isBillingPage && onBillingTabChange) {
      // Keep the current tab from context
      // Can be extended to set based on route if needed
    }
  }, [location.pathname, isBillingPage, onBillingTabChange]);

  // Set active boarding tab based on current route
  useEffect(() => {
    if (isBoardingPage && onBoardingTabChange) {
      // Check URL query parameter or path to determine tab
      const params = new URLSearchParams(location.search);
      const tab = params.get('tab');
      if (tab === 'configuration') {
        onBoardingTabChange('configuration');
      } else {
        onBoardingTabChange('allocation');
      }
    }
  }, [location.pathname, location.search, isBoardingPage, onBoardingTabChange]);

  // Determine active classes tab from route (for display)
  const getActiveClassesTab = () => {
    if (!isClassesPage) return 'classes';
    const p = location.pathname;
    if (p === '/dashboard/classes/class-term-year') return 'class-term-year';
    if (p === '/dashboard/classes/configurations') return 'configurations';
    if (p === '/dashboard/classes/close-to-term') return 'close-to-term';
    return 'classes'; // main list and any view/add/edit
  };
  const displayActiveClassesTab = getActiveClassesTab();

  // Determine active accounting tab from route (for display)
  const getActiveAccountingTab = () => {
    if (location.pathname.startsWith('/dashboard/accounting')) {
      return 'chart-of-accounts';
    } else if (location.pathname.startsWith('/dashboard/expenses')) {
      if (location.pathname.startsWith('/dashboard/expenses/accounts-payable')) {
        return 'liabilities';
      }
      if (location.pathname.startsWith('/dashboard/expenses/suppliers')) {
        return 'suppliers';
      }
      return 'expenses';
    } else if (location.pathname.startsWith('/dashboard/assets')) {
      return 'fixed-assets';
    } else if (location.pathname.startsWith('/dashboard/reports')) {
      return 'financial-reports';
    }
    return activeAccountingTab;
  };

  const displayActiveAccountingTab = getActiveAccountingTab();

  // Determine active billing tab for display
  const displayActiveBillingTab = activeBillingTab;

  // Determine active tab for display (calendar is shown separately)
  const displayActiveTab = showCalendar ? 'calendar' : activeSportsTab;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (accountingMoreRef.current && !accountingMoreRef.current.contains(event.target)) {
        setAccountingMoreOpen(false);
      }
      if (billingMoreRef.current && !billingMoreRef.current.contains(event.target)) {
        setBillingMoreOpen(false);
      }
      if (sportsMoreRef.current && !sportsMoreRef.current.contains(event.target)) {
        setSportsMoreOpen(false);
      }
      if (classesMoreRef.current && !classesMoreRef.current.contains(event.target)) {
        setClassesMoreOpen(false);
      }
      if (boardingMoreRef.current && !boardingMoreRef.current.contains(event.target)) {
        setBoardingMoreOpen(false);
      }
    };

    if (showDropdown || accountingMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, accountingMoreOpen, billingMoreOpen, sportsMoreOpen, classesMoreOpen, boardingMoreOpen]);

  // Track screen size for compact menu rendering
  useEffect(() => {
    const updateSmallScreen = () => {
      setIsSmallScreen(window.innerWidth <= 768);
    };

    updateSmallScreen();
    window.addEventListener('resize', updateSmallScreen);
    return () => window.removeEventListener('resize', updateSmallScreen);
  }, []);

  // Reserve space for right side so menu never overlaps user block at mid-widths (e.g. 829px)
  const RESERVED_RIGHT_WIDTH = 60; // user block (avatar only)
  const CENTER_GAP = 24;
  const ACCOUNTING_TAB_WIDTH = 150; // conservative width per tab (labels like "Chart of Accounts")
  const ACCOUNTING_MORE_BUTTON_WIDTH = 80;

  // Detect menu overflow to switch to dropdown when needed; compute visible tab count for accounting
  useEffect(() => {
    const checkOverflow = () => {
      if (!topNavContentRef.current || !topNavLeftRef.current || !topNavRightRef.current) {
        return;
      }

      const contentWidth = topNavContentRef.current.clientWidth;
      const leftWidth = topNavLeftRef.current.offsetWidth;
      const available = Math.max(0, contentWidth - leftWidth - RESERVED_RIGHT_WIDTH - CENTER_GAP);

      // Accounting: how many tabs fit; leave room for More button so count fits in available
      if (isAccountingPage) {
        const spaceForTabs = Math.max(0, available - ACCOUNTING_MORE_BUTTON_WIDTH);
        const count = Math.min(6, Math.max(1, Math.floor(spaceForTabs / ACCOUNTING_TAB_WIDTH)));
        setAccountingVisibleCount(count);
      }
      // Billing: how many tabs fit; leave room for More button so count fits in available
      if (isBillingPage) {
        const spaceForTabs = Math.max(0, available - ACCOUNTING_MORE_BUTTON_WIDTH);
        const count = Math.min(6, Math.max(1, Math.floor(spaceForTabs / ACCOUNTING_TAB_WIDTH)));
        setBillingVisibleCount(count);
      }
      // Sports: how many tabs fit
      if (isSportsPage) {
        const spaceForTabs = Math.max(0, available - ACCOUNTING_MORE_BUTTON_WIDTH);
        const count = Math.min(4, Math.max(1, Math.floor(spaceForTabs / ACCOUNTING_TAB_WIDTH)));
        setSportsVisibleCount(count);
      }
      // Classes: how many tabs fit
      if (isClassesPage) {
        const spaceForTabs = Math.max(0, available - ACCOUNTING_MORE_BUTTON_WIDTH);
        const count = Math.min(4, Math.max(1, Math.floor(spaceForTabs / ACCOUNTING_TAB_WIDTH)));
        setClassesVisibleCount(count);
      }
      // Boarding: how many tabs fit
      if (isBoardingPage) {
        const spaceForTabs = Math.max(0, available - ACCOUNTING_MORE_BUTTON_WIDTH);
        const count = Math.min(2, Math.max(1, Math.floor(spaceForTabs / ACCOUNTING_TAB_WIDTH)));
        setBoardingVisibleCount(count);
      }

      if (!topNavMenuRef.current) return;
      const menuWidth = topNavMenuRef.current.scrollWidth;
      const leftRect = topNavLeftRef.current.getBoundingClientRect();
      const rightRect = topNavUserInfoRef.current
        ? topNavUserInfoRef.current.getBoundingClientRect()
        : topNavRightRef.current.getBoundingClientRect();
      const menuRect = topNavMenuRef.current.getBoundingClientRect();
      const overlapsLeft = menuRect.left <= leftRect.right + 8;
      const overlapsRight = menuRect.right >= rightRect.left - 8;
      const overflow = menuWidth > available || overlapsLeft || overlapsRight;

      setIsMenuOverflowing((prev) => (prev !== overflow ? overflow : prev));
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [location.pathname, isSportsPage, isAccountingPage, isBillingPage, isSettingsPage, isBoardingPage, isClassesPage]);

  const useDropdown = isSmallScreen || isMenuOverflowing;

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowDropdown(false);
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user || !user.username) return 'U';
    const parts = user.username.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };


  return (
    <nav className={`top-nav-bar ${useDropdown ? 'top-nav-bar--compact' : ''}`}>
      <div className="top-nav-content" ref={topNavContentRef}>
        {/* Left - Menu Button (Mobile) & Logo */}
        <div className="top-nav-left flex items-center gap-4" ref={topNavLeftRef}>
          <button
            type="button"
            className="lg:hidden -m-2.5 p-2.5 text-gray-700"
            onClick={onMenuClick}
          >
            <span className="sr-only">Open sidebar</span>
            <FontAwesomeIcon icon={faBars} className="h-6 w-6" aria-hidden="true" />
          </button>
          {!isSportsPage && !isAccountingPage && !isBillingPage && !isClassesPage && !isBoardingPage && !isSettingsPage && (
            <>
              <img src={logo} alt="Logo" className="top-nav-logo" />
              <span className="hidden md:inline" style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                marginLeft: '4px',
                whiteSpace: 'nowrap'
              }}>Norton Adventist</span>
            </>
          )}
        </div>

        {/* Center - Sports Navigation Menu */}
        {isSportsPage && (() => {
          const sportsTabs = [
            { id: 'fixtures', label: 'Fixtures', icon: faCalendarAlt },
            { id: 'teams', label: 'Teams', icon: faUsers },
            { id: 'announcements', label: 'Announcements', icon: faBullhorn },
            { id: 'calendar', label: 'Calendar', icon: faCalendarAlt }
          ];
          const visibleTabs = sportsTabs.slice(0, sportsVisibleCount);
          const overflowTabs = sportsTabs.slice(sportsVisibleCount);
          const showMore = overflowTabs.length > 0 && !isSmallScreen;
          const activeInMore = overflowTabs.some(t => t.id === displayActiveTab);
          return (
            <div className={`top-nav-center ${isSmallScreen ? 'top-nav-center--hidden' : ''}`} style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '0'
            }} ref={topNavMenuRef}>
              {visibleTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => onSportsTabChange && onSportsTabChange(tab.id)}
                  className={`top-nav-menu-item ${displayActiveTab === tab.id ? 'active' : ''}`}
                  style={{
                    padding: '12px 20px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: displayActiveTab === tab.id ? '#2563eb' : 'var(--text-secondary)',
                    borderBottom: displayActiveTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    if (displayActiveTab !== tab.id) {
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (displayActiveTab !== tab.id) {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <FontAwesomeIcon icon={tab.icon} style={{ fontSize: '0.75rem' }} />
                  {tab.label}
                </button>
              ))}
              {showMore && (
                <div ref={sportsMoreRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setSportsMoreOpen(!sportsMoreOpen)}
                    className={`top-nav-menu-item ${activeInMore ? 'active' : ''}`}
                    style={{
                      padding: '12px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: activeInMore ? '#2563eb' : 'var(--text-secondary)',
                      borderBottom: activeInMore ? '2px solid #2563eb' : '2px solid transparent',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      background: 'transparent',
                      borderTop: 'none',
                      borderLeft: 'none',
                      borderRight: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    More <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '0.7rem' }} />
                  </button>
                  {sportsMoreOpen && (
                    <div
                      className="avatar-dropdown"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '2px',
                        minWidth: '180px',
                        zIndex: 1000
                      }}
                    >
                      {overflowTabs.map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            if (onSportsTabChange) onSportsTabChange(tab.id);
                            setSportsMoreOpen(false);
                          }}
                        >
                          <FontAwesomeIcon icon={tab.icon} className="dropdown-icon" />
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
        {isAccountingPage && (() => {
          const accountingTabs = [
            { id: 'chart-of-accounts', label: 'Chart of Accounts', icon: faMoneyBillWave, path: '/dashboard/accounting/chart-of-accounts' },
            { id: 'expenses', label: 'Expenses', icon: faShoppingCart, path: '/dashboard/expenses/expenses' },
            { id: 'liabilities', label: 'Liabilities', icon: faBalanceScale, path: '/dashboard/expenses/accounts-payable' },
            { id: 'suppliers', label: 'Suppliers', icon: faUserPlus, path: '/dashboard/expenses/suppliers' },
            { id: 'fixed-assets', label: 'Fixed Assets', icon: faWarehouse, path: '/dashboard/assets' },
            { id: 'financial-reports', label: 'Financial Reports', icon: faChartLine, path: '/dashboard/reports/income-statement' }
          ];
          const visibleTabs = accountingTabs.slice(0, accountingVisibleCount);
          const overflowTabs = accountingTabs.slice(accountingVisibleCount);
          const showMore = overflowTabs.length > 0 && !isSmallScreen;
          const activeInMore = overflowTabs.some(t => t.id === displayActiveAccountingTab);
          return (
            <div className={`top-nav-center ${isSmallScreen ? 'top-nav-center--hidden' : ''}`} style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '0'
            }} ref={topNavMenuRef}>
              {visibleTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (onAccountingTabChange) onAccountingTabChange(tab.id);
                    navigate(tab.path);
                  }}
                  className={`top-nav-menu-item ${displayActiveAccountingTab === tab.id ? 'active' : ''}`}
                  style={{
                    padding: '12px 20px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: displayActiveAccountingTab === tab.id ? '#2563eb' : 'var(--text-secondary)',
                    borderBottom: displayActiveAccountingTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    if (displayActiveAccountingTab !== tab.id) {
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (displayActiveAccountingTab !== tab.id) {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <FontAwesomeIcon icon={tab.icon} style={{ fontSize: '0.75rem' }} />
                  {tab.label}
                </button>
              ))}
              {showMore && (
                <div ref={accountingMoreRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setAccountingMoreOpen(!accountingMoreOpen)}
                    className={`top-nav-menu-item ${activeInMore ? 'active' : ''}`}
                    style={{
                      padding: '12px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: activeInMore ? '#2563eb' : 'var(--text-secondary)',
                      borderBottom: activeInMore ? '2px solid #2563eb' : '2px solid transparent',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      background: 'transparent',
                      borderTop: 'none',
                      borderLeft: 'none',
                      borderRight: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    More <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '0.7rem' }} />
                  </button>
                  {accountingMoreOpen && (
                    <div
                      className="avatar-dropdown"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '2px',
                        minWidth: '180px',
                        zIndex: 1000
                      }}
                    >
                      {overflowTabs.map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            if (onAccountingTabChange) onAccountingTabChange(tab.id);
                            navigate(tab.path);
                            setAccountingMoreOpen(false);
                          }}
                        >
                          <FontAwesomeIcon icon={tab.icon} className="dropdown-icon" />
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
        {isClassesPage && (() => {
          const classesTabs = [
            { id: 'classes', label: 'Classes', icon: faSchool, path: '/dashboard/classes' },
            { id: 'class-term-year', label: 'Class Term Year', icon: faCalendarAlt, path: '/dashboard/classes/class-term-year' },
            { id: 'configurations', label: 'Class Configurations', icon: faCogs, path: '/dashboard/classes/configurations' },
            { id: 'close-to-term', label: 'Close Term', icon: faCalendarCheck, path: '/dashboard/classes/close-to-term' }
          ];
          const visibleTabs = classesTabs.slice(0, classesVisibleCount);
          const overflowTabs = classesTabs.slice(classesVisibleCount);
          const showMore = overflowTabs.length > 0 && !isSmallScreen;
          const activeInMore = overflowTabs.some(t => t.id === displayActiveClassesTab);
          return (
            <div className={`top-nav-center ${isSmallScreen ? 'top-nav-center--hidden' : ''}`} style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '0'
            }} ref={topNavMenuRef}>
              {visibleTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`top-nav-menu-item ${displayActiveClassesTab === tab.id ? 'active' : ''}`}
                  style={{
                    padding: '12px 20px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: displayActiveClassesTab === tab.id ? '#2563eb' : 'var(--text-secondary)',
                    borderBottom: displayActiveClassesTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    if (displayActiveClassesTab !== tab.id) {
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (displayActiveClassesTab !== tab.id) {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <FontAwesomeIcon icon={tab.icon} style={{ fontSize: '0.75rem' }} />
                  {tab.label}
                </button>
              ))}
              {showMore && (
                <div ref={classesMoreRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setClassesMoreOpen(!classesMoreOpen)}
                    className={`top-nav-menu-item ${activeInMore ? 'active' : ''}`}
                    style={{
                      padding: '12px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: activeInMore ? '#2563eb' : 'var(--text-secondary)',
                      borderBottom: activeInMore ? '2px solid #2563eb' : '2px solid transparent',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      background: 'transparent',
                      borderTop: 'none',
                      borderLeft: 'none',
                      borderRight: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    More <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '0.7rem' }} />
                  </button>
                  {classesMoreOpen && (
                    <div
                      className="avatar-dropdown"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '2px',
                        minWidth: '180px',
                        zIndex: 1000
                      }}
                    >
                      {overflowTabs.map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            navigate(tab.path);
                            setClassesMoreOpen(false);
                          }}
                        >
                          <FontAwesomeIcon icon={tab.icon} className="dropdown-icon" />
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
        {isInventoryPage && (
          <div className="top-nav-center">
            {/* Empty when on inventory page */}
          </div>
        )}
        {isBoardingPage && (() => {
          const boardingTabs = [
            { id: 'allocation', label: 'Hostel Allocation', icon: faUserPlus, path: '/dashboard/boarding' },
            { id: 'configuration', label: 'Hostel Configuration', icon: faBed, path: '/dashboard/boarding?tab=configuration' }
          ];
          const visibleTabs = boardingTabs.slice(0, boardingVisibleCount);
          const overflowTabs = boardingTabs.slice(boardingVisibleCount);
          const showMore = overflowTabs.length > 0 && !isSmallScreen;
          const activeInMore = overflowTabs.some(t => t.id === activeBoardingTab);
          return (
            <div className={`top-nav-center ${isSmallScreen ? 'top-nav-center--hidden' : ''}`} style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '0'
            }} ref={topNavMenuRef}>
              {visibleTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (onBoardingTabChange) {
                      onBoardingTabChange(tab.id);
                    }
                    navigate(tab.path);
                  }}
                  className={`top-nav-menu-item ${activeBoardingTab === tab.id ? 'active' : ''}`}
                  style={{
                    padding: '12px 20px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: activeBoardingTab === tab.id ? '#2563eb' : 'var(--text-secondary)',
                    borderBottom: activeBoardingTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    if (activeBoardingTab !== tab.id) {
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeBoardingTab !== tab.id) {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <FontAwesomeIcon icon={tab.icon} style={{ fontSize: '0.75rem' }} />
                  {tab.label}
                </button>
              ))}
              {showMore && (
                <div ref={boardingMoreRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setBoardingMoreOpen(!boardingMoreOpen)}
                    className={`top-nav-menu-item ${activeInMore ? 'active' : ''}`}
                    style={{
                      padding: '12px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: activeInMore ? '#2563eb' : 'var(--text-secondary)',
                      borderBottom: activeInMore ? '2px solid #2563eb' : '2px solid transparent',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      background: 'transparent',
                      borderTop: 'none',
                      borderLeft: 'none',
                      borderRight: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    More <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '0.7rem' }} />
                  </button>
                  {boardingMoreOpen && (
                    <div
                      className="avatar-dropdown"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '2px',
                        minWidth: '180px',
                        zIndex: 1000
                      }}
                    >
                      {overflowTabs.map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            if (onBoardingTabChange) {
                              onBoardingTabChange(tab.id);
                            }
                            navigate(tab.path);
                            setBoardingMoreOpen(false);
                          }}
                        >
                          <FontAwesomeIcon icon={tab.icon} className="dropdown-icon" />
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
        {isSettingsPage && (
          <div className={`top-nav-center ${useDropdown ? 'top-nav-center--hidden' : ''}`} style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0'
          }} ref={topNavMenuRef}>
            {[
              { id: 'users', label: 'User Management', icon: faUsers },
              { id: 'roles', label: 'Role Management', icon: faUserShield },
              { id: 'password', label: 'Change Password', icon: faKey }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (onSettingsTabChange) {
                    onSettingsTabChange(tab.id);
                  }
                }}
                className={`top-nav-menu-item ${activeSettingsTab === tab.id ? 'active' : ''}`}
                style={{
                  padding: '12px 20px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: activeSettingsTab === tab.id ? '#2563eb' : 'var(--text-secondary)',
                  borderBottom: activeSettingsTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  background: 'transparent',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  if (activeSettingsTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSettingsTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <FontAwesomeIcon icon={tab.icon} style={{ fontSize: '0.75rem' }} />
                {tab.label}
              </button>
            ))}
          </div>
        )}
        {isBillingPage && (() => {
          const billingTabs = [
            { id: 'record-payment', label: 'Record Payment', icon: faMoneyBillWave },
            { id: 'outstanding-balance', label: 'Outstanding Balance', icon: faBalanceScale },
            { id: 'opening-balance', label: 'Student Opening Balance', icon: faHistory },
            { id: 'waivers', label: 'Waivers', icon: faHandHoldingUsd },
            { id: 'financial-record', label: 'Student Financial', icon: faFileInvoiceDollar },
            { id: 'invoice-structures', label: 'Invoice Structures', icon: faFileContract }
          ];
          const visibleTabs = billingTabs.slice(0, billingVisibleCount);
          const overflowTabs = billingTabs.slice(billingVisibleCount);
          const showMore = overflowTabs.length > 0 && !isSmallScreen;
          const activeInMore = overflowTabs.some(t => t.id === displayActiveBillingTab);
          return (
            <div className={`top-nav-center ${isSmallScreen ? 'top-nav-center--hidden' : ''}`} style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '0'
            }} ref={topNavMenuRef}>
              {visibleTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (onBillingTabChange) {
                      onBillingTabChange(tab.id);
                    }
                  }}
                  className={`top-nav-menu-item ${displayActiveBillingTab === tab.id ? 'active' : ''}`}
                  style={{
                    padding: '12px 20px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: displayActiveBillingTab === tab.id ? '#2563eb' : 'var(--text-secondary)',
                    borderBottom: displayActiveBillingTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    if (displayActiveBillingTab !== tab.id) {
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (displayActiveBillingTab !== tab.id) {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <FontAwesomeIcon icon={tab.icon} style={{ fontSize: '0.75rem' }} />
                  {tab.label}
                </button>
              ))}
              {showMore && (
                <div ref={billingMoreRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setBillingMoreOpen(!billingMoreOpen)}
                    className={`top-nav-menu-item ${activeInMore ? 'active' : ''}`}
                    style={{
                      padding: '12px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: activeInMore ? '#2563eb' : 'var(--text-secondary)',
                      borderBottom: activeInMore ? '2px solid #2563eb' : '2px solid transparent',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      background: 'transparent',
                      borderTop: 'none',
                      borderLeft: 'none',
                      borderRight: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    More <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '0.7rem' }} />
                  </button>
                  {billingMoreOpen && (
                    <div
                      className="avatar-dropdown"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '2px',
                        minWidth: '180px',
                        zIndex: 1000
                      }}
                    >
                      {overflowTabs.map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            if (onBillingTabChange) {
                              onBillingTabChange(tab.id);
                            }
                            setBillingMoreOpen(false);
                          }}
                        >
                          <FontAwesomeIcon icon={tab.icon} className="dropdown-icon" />
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
        {!isSportsPage && !isAccountingPage && !isInventoryPage && !isBillingPage && !isSettingsPage && !isClassesPage && (
          <div className="top-nav-center">
            {/* Empty when not on sports, accounting, inventory, billing, settings, or classes page */}
          </div>
        )}

        {/* Right - User Info */}
        <div className="top-nav-right" ref={topNavRightRef}>
          {/* Compact page menu dropdown (mobile / overflow) */}
          {isSmallScreen && (isSportsPage || isAccountingPage || isBillingPage || isSettingsPage || isBoardingPage || isClassesPage) && (
            <div className="top-nav-compact-menu">
              {isSportsPage && (
                <select
                  className="top-nav-dropdown"
                  value={displayActiveTab}
                  onChange={(e) => onSportsTabChange && onSportsTabChange(e.target.value)}
                >
                  <option value="fixtures">Fixtures</option>
                  <option value="teams">Teams</option>
                  <option value="announcements">Announcements</option>
                  <option value="calendar">Calendar</option>
                </select>
              )}
              {isAccountingPage && isSmallScreen && (
                <select
                  className="top-nav-dropdown"
                  value={displayActiveAccountingTab}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    if (onAccountingTabChange) {
                      onAccountingTabChange(nextId);
                    }
                    const paths = {
                      'chart-of-accounts': '/dashboard/accounting/chart-of-accounts',
                      expenses: '/dashboard/expenses/expenses',
                      liabilities: '/dashboard/expenses/accounts-payable',
                      suppliers: '/dashboard/expenses/suppliers',
                      'fixed-assets': '/dashboard/assets',
                      'financial-reports': '/dashboard/reports/income-statement'
                    };
                    navigate(paths[nextId]);
                  }}
                >
                  <option value="chart-of-accounts">Chart of Accounts</option>
                  <option value="expenses">Expenses</option>
                  <option value="liabilities">Liabilities</option>
                  <option value="suppliers">Suppliers</option>
                  <option value="fixed-assets">Fixed Assets</option>
                  <option value="financial-reports">Financial Reports</option>
                </select>
              )}
              {isBoardingPage && isSmallScreen && (
                <select
                  className="top-nav-dropdown"
                  value={activeBoardingTab}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    if (onBoardingTabChange) {
                      onBoardingTabChange(nextId);
                    }
                    if (nextId === 'configuration') {
                      navigate('/dashboard/boarding?tab=configuration');
                    } else {
                      navigate('/dashboard/boarding');
                    }
                  }}
                >
                  <option value="allocation">Hostel Allocation</option>
                  <option value="configuration">Hostel Configuration</option>
                </select>
              )}
              {isClassesPage && isSmallScreen && (
                <select
                  className="top-nav-dropdown"
                  value={displayActiveClassesTab}
                  onChange={(e) => {
                    const paths = {
                      classes: '/dashboard/classes',
                      'class-term-year': '/dashboard/classes/class-term-year',
                      configurations: '/dashboard/classes/configurations',
                      'close-to-term': '/dashboard/classes/close-to-term'
                    };
                    navigate(paths[e.target.value]);
                  }}
                >
                  <option value="classes">Classes</option>
                  <option value="class-term-year">Class Term Year</option>
                  <option value="configurations">Class Configurations</option>
                  <option value="close-to-term">Close Term</option>
                </select>
              )}
              {isSettingsPage && (
                <select
                  className="top-nav-dropdown"
                  value={activeSettingsTab}
                  onChange={(e) => {
                    if (onSettingsTabChange) {
                      onSettingsTabChange(e.target.value);
                    }
                  }}
                >
                  <option value="users">User Management</option>
                  <option value="roles">Role Management</option>
                  <option value="password">Change Password</option>
                </select>
              )}
              {isBillingPage && isSmallScreen && (
                <select
                  className="top-nav-dropdown"
                  value={displayActiveBillingTab}
                  onChange={(e) => {
                    if (onBillingTabChange) {
                      onBillingTabChange(e.target.value);
                    }
                  }}
                >
                  <option value="record-payment">Record Payment</option>
                  <option value="outstanding-balance">Outstanding Balance</option>
                  <option value="opening-balance">Student Opening Balance</option>
                  <option value="waivers">Waivers</option>
                  <option value="financial-record">Student Financial</option>
                  <option value="invoice-structures">Invoice Structures</option>
                </select>
              )}
            </div>
          )}
          {/* User Info with Dropdown - margin keeps gap from center menu at mid-widths */}
          <div
            className="top-nav-user-info"
            ref={topNavUserInfoRef}
            style={{
              marginLeft: (isAccountingPage || isSportsPage || isClassesPage || isBoardingPage || isSettingsPage || isBillingPage) ? 16 : undefined
            }}
          >
            <div ref={dropdownRef} className="top-nav-user-info-inner">
              <div
                className="top-nav-avatar"
                onClick={() => setShowDropdown(!showDropdown)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowDropdown(!showDropdown); } }}
                aria-label="User menu"
              >
                {getInitials()}
              </div>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="avatar-dropdown">
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      navigate('/dashboard/settings');
                      setShowDropdown(false);
                    }}
                  >
                    <FontAwesomeIcon icon={faUser} className="dropdown-icon" />
                    <span>Profile</span>
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      navigate('/dashboard/settings');
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
      </div>
    </nav>
  );
};

export default Header;
