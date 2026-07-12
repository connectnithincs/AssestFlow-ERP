import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../sdk/tanstack-query-hooks';

export type UserRole = 'admin' | 'manager' | 'head' | 'employee';

export interface AppState {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  // Auth simulation via PostgreSQL role switching
  simulateLogin: (role: UserRole) => Promise<void>;
  userId: string;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentRole, setRole] = useState<UserRole>('admin');
  const [userId, setUserId] = useState<string>('f1111111-1111-4111-8111-111111111111');

  // Set the JWT token or PostgREST role headers based on selected role
  const simulateLogin = async (role: UserRole) => {
    setRole(role);
    
    let token = '';
    let uid = '';
    
    if (role === 'admin') {
      token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmMTExMTExMS0xMTExLTQxMTEtODExMS0xMTExMTExMTExMTEiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImVtYWlsIjoiYWRtaW5AYXNzZXRmbG93LmxvY2FsIiwiaXNzIjoic3VwYWJhc2UifQ.UW_WzaiEWx98djPFE9BwhL81k5--DzagSOaNKEFalkc';
      uid = 'f1111111-1111-4111-8111-111111111111';
    } else if (role === 'manager') {
      token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmMjIyMjIyMi0yMjIyLTQyMjItODIyMi0yMjIyMjIyMjIyMjIiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImVtYWlsIjoicHJpeWEuc2hhcm1hQGFzc2V0Zmxvdy5sb2NhbCIsImlzcyI6InN1cGFiYXNlIn0.qphY6WdNMDa6saWOsUbqf_cXbP-QBxvP5n37wRPUeVc';
      uid = 'f2222222-2222-4222-8222-222222222222';
    } else if (role === 'head') {
      token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmMzMzMzMzMy0zMzMzLTQzMzMtODMzMy0zMzMzMzMzMzMzMzMiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImVtYWlsIjoicmFqZXNoLmt1bWFyQGFzc2V0Zmxvdy5sb2NhbCIsImlzcyI6InN1cGFiYXNlIn0.BA5J96pKhEJDVV7BBzizNABs8K5HSV3o40Hd1A7yslg';
      uid = 'f3333333-3333-4333-8333-333333333333';
    } else if (role === 'employee') {
      token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNDQ0NDQ0NC00NDQ0LTQ0NDQtODQ0NC00NDQ0NDQ0NDQ0NDQiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImVtYWlsIjoiYW5hbnlhLml5ZXJAYXNzZXRmbG93LmxvY2FsIiwiaXNzIjoic3VwYWJhc2UifQ.gNA3u6bH4JxTDkmz6yUaTwOG5qPQi2Mk1oYeAGpCoKw';
      uid = 'f4444444-4444-4444-8444-444444444444';
    }
    
    setUserId(uid);
    if ((supabase as any).rest) {
      (supabase as any).rest.headers['Authorization'] = `Bearer ${token}`;
    }
  };

  React.useEffect(() => {
    simulateLogin('admin');
  }, []);

  return (
    <AppStateContext.Provider value={{ currentRole, setRole, simulateLogin, userId }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
