import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface UnreadCounts {
  inbox: number;
  sent: number;
  'need-action': number;
  handled: number;
  all: number;
}

interface UnreadContextValue {
  counts: UnreadCounts;
  updateCounts: (newCounts: Partial<UnreadCounts>) => void;
  resetCounts: () => void;
}

const initialCounts: UnreadCounts = {
  inbox: 0,
  sent: 0,
  'need-action': 0,
  handled: 0,
  all: 0,
};

const UnreadCountsContext = createContext<UnreadContextValue | null>(null);

export function UnreadCountsProvider({ children }: { children: ReactNode }) {
  const [counts, setCounts] = useState<UnreadCounts>(initialCounts);

  const updateCounts = useCallback((newCounts: Partial<UnreadCounts>) => {
    setCounts((prev) => ({ ...prev, ...newCounts }));
  }, []);

  const resetCounts = useCallback(() => setCounts(initialCounts), []);

  return (
    <UnreadCountsContext.Provider value={{ counts, updateCounts, resetCounts }}>
      {children}
    </UnreadCountsContext.Provider>
  );
}

export function useUnreadCounts() {
  const ctx = useContext(UnreadCountsContext);
  if (!ctx) throw new Error('useUnreadCounts must be used within UnreadCountsProvider');
  return ctx;
}