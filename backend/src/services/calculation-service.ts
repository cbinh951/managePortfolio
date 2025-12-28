import { Transaction } from '../types/models';

/**
 * XIRR Calculation using Newton-Raphson method
 * Extended Internal Rate of Return calculation for irregular cash flows
 */
export function calculateXIRR(
    cashFlows: { date: Date; amount: number }[],
    guess: number = 0.1
): number {
    const maxIterations = 100;
    const tolerance = 0.0001;

    if (cashFlows.length < 2) {
        return 0;
    }

    // Sort by date
    const sorted = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime());
    const firstDate = sorted[0].date;

    let rate = guess;

    for (let i = 0; i < maxIterations; i++) {
        let npv = 0;
        let dnpv = 0;

        for (const cf of sorted) {
            const daysDiff = daysBetween(firstDate, cf.date);
            const years = daysDiff / 365;
            const discountFactor = Math.pow(1 + rate, years);

            npv += cf.amount / discountFactor;
            dnpv -= (years * cf.amount) / (discountFactor * (1 + rate));
        }

        const newRate = rate - npv / dnpv;

        if (Math.abs(newRate - rate) < tolerance) {
            return newRate;
        }

        rate = newRate;
    }

    return rate;
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date2.getTime() - date1.getTime()) / oneDay);
}

/**
 * Calculate total invested amount from transactions
 */
export function calculateTotalInvested(transactions: Transaction[]): number {
    return transactions
        .filter(t => ['DEPOSIT', 'TRANSFER'].includes(t.type))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/**
 * Calculate total withdrawn amount from transactions
 */
export function calculateTotalWithdrawn(transactions: Transaction[]): number {
    return transactions
        .filter(t => t.type === 'WITHDRAW')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/**
 * Calculate cash balance from transactions
 */
export function calculateCashBalance(transactions: Transaction[]): number {
    return transactions.reduce((sum, t) => {
        // DEPOSIT and incoming TRANSFER are positive
        if (t.type === 'DEPOSIT' || (t.type === 'TRANSFER' && t.amount > 0)) {
            return sum + t.amount;
        }
        // WITHDRAW: amounts are stored as positive in CSV, so we need to subtract them
        if (t.type === 'WITHDRAW') {
            return sum - t.amount;
        }
        // Outgoing TRANSFER: amounts are already negative in CSV
        if (t.type === 'TRANSFER' && t.amount < 0) {
            return sum + t.amount;
        }
        return sum;
    }, 0);
}

/**
 * Prepare XIRR cash flows from transactions and current NAV
 */
export function prepareXIRRCashFlows(
    transactions: Transaction[],
    currentNAV: number,
    currentDate: Date = new Date()
): { date: Date; amount: number }[] {
    const cashFlows: { date: Date; amount: number }[] = [];

    // Add all deposits and withdrawals (inverted signs for XIRR)
    transactions.forEach(t => {
        if (['DEPOSIT', 'TRANSFER'].includes(t.type) && t.amount < 0) {
            // Money going into investment is negative for XIRR
            cashFlows.push({
                date: new Date(t.date),
                amount: t.amount, // Already negative
            });
        } else if (t.type === 'WITHDRAW' || (t.type === 'TRANSFER' && t.amount > 0)) {
            // Money coming out is positive for XIRR
            cashFlows.push({
                date: new Date(t.date),
                amount: t.amount, // Already positive
            });
        }
    });

    // Add current NAV as positive (liquidation value)
    if (currentNAV > 0) {
        cashFlows.push({
            date: currentDate,
            amount: currentNAV,
        });
    }

    return cashFlows;
}
