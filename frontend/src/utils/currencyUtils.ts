import { Currency } from '@/contexts/SettingsContext';

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency,
    exchangeRate: number
): number {
    // If currencies are the same, no conversion needed
    if (fromCurrency === toCurrency) {
        return amount;
    }

    // Convert VND to USD
    if (fromCurrency === 'VND' && toCurrency === 'USD') {
        return amount / exchangeRate;
    }

    // Convert USD to VND
    if (fromCurrency === 'USD' && toCurrency === 'VND') {
        return amount * exchangeRate;
    }

    return amount;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
    switch (currency) {
        case 'VND':
            return '₫';
        case 'USD':
            return '$';
        default:
            return '';
    }
}

/**
 * Format currency with proper symbol and locale
 */
export function formatCurrency(
    amount: number,
    sourceCurrency: Currency = 'VND',
    displayCurrency: Currency = 'VND',
    exchangeRate: number = 25000
): string {
    // Convert if needed
    const convertedAmount = convertCurrency(
        amount,
        sourceCurrency,
        displayCurrency,
        exchangeRate
    );

    const symbol = getCurrencySymbol(displayCurrency);

    // Format based on display currency
    if (displayCurrency === 'VND') {
        // VND: no decimals, symbol after
        return `${Math.round(convertedAmount).toLocaleString('en-US')} ${symbol}`;
    } else {
        // USD: 2 decimals, symbol before
        return `${symbol}${convertedAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    }
}

/**
 * Format currency for display in tables and cards
 * Uses the amount as-is (assumes already in correct currency)
 */
export function formatDisplayCurrency(
    amount: number,
    currency: Currency
): string {
    const symbol = getCurrencySymbol(currency);

    if (currency === 'VND') {
        return `${Math.round(amount).toLocaleString('en-US')} ${symbol}`;
    } else {
        return `${symbol}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    }
}

/**
 * Parse formatted currency string to number
 */
export function parseCurrency(value: string): number {
    // Remove all non-numeric characters except decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
}
