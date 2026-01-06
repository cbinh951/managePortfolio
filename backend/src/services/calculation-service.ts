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
    const minRate = -0.99; // -99% minimum rate (investment can't lose more than 100%)
    const maxRate = 100; // 10000% maximum rate (to handle very high short-term returns)

    console.log('calculateXIRR - Starting calculation');

    if (cashFlows.length < 2) {
        console.log('calculateXIRR - Not enough cash flows');
        return 0;
    }

    // Validate cash flows
    const hasPositive = cashFlows.some(cf => cf.amount > 0);
    const hasNegative = cashFlows.some(cf => cf.amount < 0);

    console.log('calculateXIRR - Validation: hasPositive=', hasPositive, 'hasNegative=', hasNegative);

    // Need both positive and negative cash flows for valid XIRR
    if (!hasPositive || !hasNegative) {
        console.log('calculateXIRR - Invalid cash flows: need both positive and negative');
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

            // Prevent extreme values
            if (years < 0) continue;

            const discountFactor = Math.pow(1 + rate, years);

            // Check for invalid discount factor
            if (!isFinite(discountFactor) || discountFactor === 0) {
                return 0;
            }

            npv += cf.amount / discountFactor;
            dnpv -= (years * cf.amount) / (discountFactor * (1 + rate));
        }

        // Check if derivative is too small (would cause huge rate changes)
        if (Math.abs(dnpv) < 1e-10) {
            return 0;
        }

        const newRate = rate - npv / dnpv;

        if (i < 5 || i % 10 === 0) {
            console.log(`  Iteration ${i}: rate=${rate.toFixed(6)}, npv=${npv.toFixed(2)}, dnpv=${dnpv.toFixed(2)}, newRate=${newRate.toFixed(6)}`);
        }

        // Validate new rate
        if (!isFinite(newRate) || isNaN(newRate)) {
            return 0;
        }

        // Check convergence
        if (Math.abs(newRate - rate) < tolerance) {
            // Final validation: ensure rate is within reasonable bounds
            if (newRate < minRate || newRate > maxRate) {
                return 0;
            }
            return newRate;
        }

        // Bound the rate to prevent runaway calculations
        rate = Math.max(minRate, Math.min(maxRate, newRate));
    }

    // Failed to converge within max iterations
    return 0;
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

    console.log('prepareXIRRCashFlows - Input transactions:', transactions.length);

    // Add all deposits and withdrawals
    // For XIRR: money IN is negative, money OUT is positive
    transactions.forEach(t => {
        if (t.type === 'DEPOSIT') {
            // Deposits are money going INTO the investment (negative for XIRR)
            const amount = -Math.abs(t.amount);
            console.log('  DEPOSIT:', t.date, 'Amount:', t.amount, '=> Cash flow:', amount);
            cashFlows.push({
                date: new Date(t.date),
                amount: amount, // Make negative
            });
        } else if (t.type === 'WITHDRAW') {
            // Withdrawals are money coming OUT of the investment (positive for XIRR)
            const amount = Math.abs(t.amount);
            console.log('  WITHDRAW:', t.date, 'Amount:', t.amount, '=> Cash flow:', amount);
            cashFlows.push({
                date: new Date(t.date),
                amount: amount, // Make positive
            });
        } else {
            console.log('  Skipping', t.type, 'transaction');
        }
        // Note: TRANSFER transactions are not included in portfolio XIRR
        // as they are internal movements between accounts
    });

    // Add current NAV as positive (represents liquidation value at current date)
    if (currentNAV > 0) {
        console.log('  Current NAV:', currentDate.toISOString().split('T')[0], '=> Cash flow:', currentNAV);
        cashFlows.push({
            date: currentDate,
            amount: currentNAV,
        });
    }

    console.log('prepareXIRRCashFlows - Total cash flows:', cashFlows.length);
    console.log('prepareXIRRCashFlows - Cash flows:', JSON.stringify(cashFlows, null, 2));

    return cashFlows;
}

/**
 * Calculate average XIRR from an array of XIRR values
 * Filters out zero values and returns the arithmetic mean
 */
export function calculateAverageXIRR(xirrs: number[]): number {
    // Filter out zero values (represents portfolios with no valid XIRR)
    const validXirrs = xirrs.filter(x => x !== 0);

    if (validXirrs.length === 0) {
        return 0;
    }

    const sum = validXirrs.reduce((acc, xirr) => acc + xirr, 0);
    return sum / validXirrs.length;
}
