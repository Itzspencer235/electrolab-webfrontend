// Prices from the API: price (original), finalPrice, discountPercent, discountEndsAt.
export const finalPrice = (p: any): number => Number(p?.finalPrice ?? p?.price ?? 0);
export const originalPrice = (p: any): number => Number(p?.price ?? 0);
export const discountOf = (p: any): number => Math.round(Number(p?.discountPercent ?? 0)) || 0;
export const isDiscounted = (p: any) => discountOf(p) > 0 && originalPrice(p) > finalPrice(p);
