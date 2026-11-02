import { Product } from '../types';

// Règles de stock communes à toute l'application. Une prestation (isService) n'a pas de stock :
// elle n'est jamais en rupture et ne compte pas dans la valeur du stock.

export const tracksStock = (p: Product): boolean => !p.isService;
export const isOutOfStock = (p: Product): boolean => tracksStock(p) && p.stockQuantity <= 0;
export const isLowStock = (p: Product): boolean => tracksStock(p) && p.stockQuantity > 0 && p.stockQuantity <= p.minAlertThreshold;
/** À racheter : en rupture ou sous le seuil d'alerte. */
export const needsRestock = (p: Product): boolean => tracksStock(p) && p.stockQuantity <= p.minAlertThreshold;

export const stockUnits = (ps: Product[]): number =>
  ps.reduce((n, p) => (tracksStock(p) ? n + Math.max(0, p.stockQuantity) : n), 0);
export const stockCostValue = (ps: Product[]): number =>
  ps.reduce((n, p) => (tracksStock(p) ? n + Math.max(0, p.stockQuantity) * p.purchasePrice : n), 0);
export const stockSalesValue = (ps: Product[]): number =>
  ps.reduce((n, p) => (tracksStock(p) ? n + Math.max(0, p.stockQuantity) * p.sellingPrice : n), 0);
