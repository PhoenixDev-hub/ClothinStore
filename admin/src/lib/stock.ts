export type StockState = 'out' | 'low' | 'ok';

export function stockState(totalStock: number): StockState {
  if (totalStock <= 0) return 'out';
  if (totalStock < 5) return 'low';
  return 'ok';
}
