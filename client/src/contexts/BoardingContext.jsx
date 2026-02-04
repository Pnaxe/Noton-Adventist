import React, { createContext, useContext, useState } from 'react';

const BoardingContext = createContext();

export const useBoarding = () => {
  const context = useContext(BoardingContext);
  if (!context) {
    return { activeTab: 'allocation', setActiveTab: () => {} };
  }
  return context;
};

export const BoardingProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('allocation');

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <BoardingContext.Provider value={{ 
      activeTab, 
      setActiveTab: handleTabChange
    }}>
      {children}
    </BoardingContext.Provider>
  );
};

