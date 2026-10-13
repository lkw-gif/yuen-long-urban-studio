'use client';

import { createContext, useContext, type ReactNode } from 'react';

const SchoolAccount = createContext('');
export function SchoolAccountProvider({ email, children }: { email: string; children: ReactNode }) {
  return <SchoolAccount.Provider value={email}>{children}</SchoolAccount.Provider>;
}
export function useSchoolAccount() { return useContext(SchoolAccount); }
