import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  fetchClassifications,
  getActiveClassificationsForCountry,
  isExpired,
  type Classification as SupabaseClassification,
} from '@/lib/supabase';

const STORAGE_KEY = 'ern-active-classification';

export type Stance = 'yellow' | 'orange' | 'red';

interface PersistedState {
  country: string;
  classificationId: string | null;
  stance: Stance | null;
}

interface ClassificationContextValue {
  country: string | null;
  classification: SupabaseClassification | null;
  stance: Stance | null;
  allClassifications: SupabaseClassification[];
  countryClassifications: SupabaseClassification[];
  isLoading: boolean;
  fetchError: boolean;
  selectCountry: (country: string) => void;
  selectClassification: (cls: SupabaseClassification) => void;
  selectStanceDirectly: (stance: Stance) => void;
  clearClassification: () => void;
}

const ClassificationContext = createContext<ClassificationContextValue | null>(null);

export function useClassification() {
  const ctx = useContext(ClassificationContext);
  if (!ctx) throw new Error('useClassification must be used within ClassificationProvider');
  return ctx;
}

export function ClassificationProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useState<string | null>(null);
  const [classification, setClassification] = useState<SupabaseClassification | null>(null);
  const [stance, setStance] = useState<Stance | null>(null);
  const [allClassifications, setAllClassifications] = useState<SupabaseClassification[]>([]);
  const [countryClassifications, setCountryClassifications] = useState<SupabaseClassification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Fetch all classifications on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setFetchError(false);
      const data = await fetchClassifications();
      if (cancelled) return;
      if (data.length === 0) {
        // Could be a fetch error or genuinely empty
        setFetchError(true);
      }
      setAllClassifications(data);
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Restore persisted state once classifications are loaded
  useEffect(() => {
    if (isLoading) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved: PersistedState = JSON.parse(raw);
      if (!saved.country) return;

      setCountry(saved.country);

      if (saved.classificationId && allClassifications.length > 0) {
        const found = allClassifications.find(c => c.id === saved.classificationId);
        if (found && !isExpired(found.expirationDate) && found.stance?.toLowerCase() !== 'white') {
          setClassification(found);
          setStance(found.stance?.toLowerCase() as Stance);
          const active = getActiveClassificationsForCountry(allClassifications, saved.country);
          setCountryClassifications(active);
          return;
        }
      }

      // Classification expired or not found — keep country, clear classification
      if (saved.stance && !saved.classificationId) {
        // Manual stance selection (no Supabase classification)
        setStance(saved.stance);
      }

      const active = getActiveClassificationsForCountry(allClassifications, saved.country);
      setCountryClassifications(active);

      // If only one active classification, auto-select it
      if (active.length === 1) {
        setClassification(active[0]);
        setStance(active[0].stance?.toLowerCase() as Stance);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isLoading, allClassifications]);

  // Persist to localStorage on change
  useEffect(() => {
    if (country) {
      const state: PersistedState = {
        country,
        classificationId: classification?.id ?? null,
        stance,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [country, classification, stance]);

  const selectCountry = useCallback((c: string) => {
    setCountry(c);
    setClassification(null);
    setStance(null);
    const active = getActiveClassificationsForCountry(allClassifications, c);
    setCountryClassifications(active);
    // Auto-select if only one
    if (active.length === 1) {
      setClassification(active[0]);
      setStance(active[0].stance?.toLowerCase() as Stance);
    }
  }, [allClassifications]);

  const selectClassification = useCallback((cls: SupabaseClassification) => {
    setClassification(cls);
    setStance(cls.stance?.toLowerCase() as Stance);
  }, []);

  const selectStanceDirectly = useCallback((s: Stance) => {
    setClassification(null);
    setStance(s);
  }, []);

  const clearClassification = useCallback(() => {
    setCountry(null);
    setClassification(null);
    setStance(null);
    setCountryClassifications([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <ClassificationContext.Provider value={{
      country,
      classification,
      stance,
      allClassifications,
      countryClassifications,
      isLoading,
      fetchError,
      selectCountry,
      selectClassification,
      selectStanceDirectly,
      clearClassification,
    }}>
      {children}
    </ClassificationContext.Provider>
  );
}
