import { createContext, useContext, useState, useCallback } from 'react';
import { Database } from '../data/database';

const DatabaseContext = createContext(null);

export function DatabaseProvider({ children }) {
  const [tick, setTick] = useState(0);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Call this after any mutation to trigger re-renders across the app
  const refresh = useCallback(() => setTick(t => t + 1), []);

  return (
    <DatabaseContext.Provider value={{ db: Database, refresh, tick, isSidebarOpen, setSidebarOpen }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
