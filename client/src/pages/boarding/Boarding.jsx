import React from 'react';
import { useBoarding } from '../../contexts/BoardingContext';
import HostelsTab from './HostelsTab';
import Enrollments from './Enrollments';

const Boarding = () => {
  const { activeTab } = useBoarding();

  const renderContent = () => {
    switch (activeTab) {
      case 'allocation':
        return <Enrollments />;
      case 'configuration':
        return <HostelsTab />;
      default:
        return <Enrollments />;
    }
  };

  return (
    <div style={{ flex: 1, overflow: 'hidden' }}>
      {renderContent()}
    </div>
  );
};

export default Boarding;
