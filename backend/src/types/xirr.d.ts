declare module 'xirr' {
    export default function xirr(cashFlows: { amount: number; when: Date }[], options?: any): number;
}
