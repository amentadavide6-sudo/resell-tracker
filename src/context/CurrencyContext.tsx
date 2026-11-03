import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  CurrencyPreference,
  getSavedCurrencyPreference,
  setCurrencyPreference as saveCurrencyPreference,
  getActiveCurrencyCode,
  getActiveCurrencySymbol,
} from '../services/fiscalManager';
import { formatCurrency as formatCurrencyService } from '../services/feeCalculator';

export interface CurrencyContextType {
  currencyPreference: CurrencyPreference;
  currencyCode: string;
  currencySymbol: string;
  setCurrencyPreference: (pref: CurrencyPreference) => void;
  formatCurrency: (val: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currencyPreference, setCurrencyPreferenceState] = useState<CurrencyPreference>(() =>
    getSavedCurrencyPreference()
  );

  const currencyCode = useMemo(() => getActiveCurrencyCode(), [currencyPreference]);
  const currencySymbol = useMemo(() => getActiveCurrencySymbol(), [currencyPreference]);

  const setCurrencyPreference = useCallback((pref: CurrencyPreference) => {
    saveCurrencyPreference(pref);
    setCurrencyPreferenceState(pref);
  }, []);

  const formatCurrency = useCallback(
    (val: number) => {
      return formatCurrencyService(val, currencySymbol);
    },
    [currencySymbol]
  );

  const value = useMemo(
    () => ({
      currencyPreference,
      currencyCode,
      currencySymbol,
      setCurrencyPreference,
      formatCurrency,
    }),
    [currencyPreference, currencyCode, currencySymbol, setCurrencyPreference, formatCurrency]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Graceful fallback if called outside provider
    const symbol = getActiveCurrencySymbol();
    return {
      currencyPreference: getSavedCurrencyPreference(),
      currencyCode: getActiveCurrencyCode(),
      currencySymbol: symbol,
      setCurrencyPreference: saveCurrencyPreference,
      formatCurrency: (val: number) => formatCurrencyService(val, symbol),
    };
  }
  return context;
};
