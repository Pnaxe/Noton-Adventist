import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { SportsProvider } from '../contexts/SportsContext';
import { AccountingProvider } from '../contexts/AccountingContext';
import { InventoryProvider } from '../contexts/InventoryContext';
import { BillingProvider } from '../contexts/BillingContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { BoardingProvider } from '../contexts/BoardingContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isBillingPage = location.pathname.startsWith('/dashboard/billing');
  const isAccountingPage = location.pathname.startsWith('/dashboard/accounting') ||
    location.pathname.startsWith('/dashboard/expenses') ||
    location.pathname.startsWith('/dashboard/assets') ||
    location.pathname.startsWith('/dashboard/reports');

  return (
    <SportsProvider>
      <AccountingProvider>
        <InventoryProvider>
          <BillingProvider>
            <SettingsProvider>
              <BoardingProvider>
        <div className="dashboard-container">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          <main className="main-content">
            <Header onMenuClick={() => setSidebarOpen(true)} />
            <div
              className={`main-content-scrollable ${isBillingPage ? 'main-content-scrollable--billing' : ''} ${isAccountingPage ? 'main-content-scrollable--accounting' : ''}`}
            >
              <Outlet />
            </div>
          </main>
        </div>
              </BoardingProvider>
            </SettingsProvider>
          </BillingProvider>
        </InventoryProvider>
      </AccountingProvider>
    </SportsProvider>
  );
};

export default Layout;
