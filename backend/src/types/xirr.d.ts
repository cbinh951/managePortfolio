declare module 'xirr' {
    interface CashFlow {
        amount: number;
        when: Date;
    }
    
    function xirr(cashFlows: CashFlow[]): number;
    export default xirr;
}
