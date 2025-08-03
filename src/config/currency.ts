// Currency configuration for the entire application

export interface CurrencyConfig {
  code: string;         // Currency code (e.g., 'INR', 'USD')
  symbol: string;       // Currency symbol (e.g., '₹', '$')
  name: string;         // Full currency name (e.g., 'Indian Rupee', 'US Dollar')
  locale: string;       // Locale for number formatting (e.g., 'en-IN', 'en-US')
  alternateSymbol?: string; // Alternative symbol if needed (e.g., 'Rs.')
  decimalPlaces: number;    // Default decimal places to show
  groupingStyle: 'western' | 'indian'; // Number grouping style (e.g., 1,000.00 vs 1,00,000.00)
}

// Default currency configuration
const currencyConfig: CurrencyConfig = {
  code: 'INR',
  symbol: '₹',
  name: 'Indian Rupee',
  locale: 'en-IN',
  alternateSymbol: 'Rs.',
  decimalPlaces: 2,
  groupingStyle: 'indian'
};

// Format a number as currency according to the configuration
export const formatCurrency = (value: string | number): string => {
  const number = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(number)) return `${currencyConfig.symbol}0.00`;

  return number.toLocaleString(currencyConfig.locale, {
    style: "currency",
    currency: currencyConfig.code,
    minimumFractionDigits: currencyConfig.decimalPlaces,
    maximumFractionDigits: currencyConfig.decimalPlaces,
  });
};

// Format a number as currency but with a specific number of decimal places
export const formatCurrencyWithPrecision = (value: string | number, decimalPlaces: number): string => {
  const number = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(number)) return `${currencyConfig.symbol}0.00`;

  return number.toLocaleString(currencyConfig.locale, {
    style: "currency",
    currency: currencyConfig.code,
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
};

// Format a number as plain number with Indian number system
export const formatNumber = (value: string | number): string => {
  const number = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(number)) return "0";

  return number.toLocaleString(currencyConfig.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: currencyConfig.decimalPlaces,
  });
};

// Get currency symbol
export const getCurrencySymbol = (): string => {
  return currencyConfig.symbol;
};

// Get alternate currency symbol if available
export const getAlternateCurrencySymbol = (): string => {
  return currencyConfig.alternateSymbol || currencyConfig.symbol;
};

// Get currency code
export const getCurrencyCode = (): string => {
  return currencyConfig.code;
};

// Get locale
export const getLocale = (): string => {
  return currencyConfig.locale;
};

export default currencyConfig;