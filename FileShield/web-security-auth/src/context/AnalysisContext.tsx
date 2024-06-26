
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';


export interface AnalysisContextType {
  data: any;
  setData: (data: any) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<any>(null);

  return (
    <AnalysisContext.Provider value={{ data, setData }}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
};
