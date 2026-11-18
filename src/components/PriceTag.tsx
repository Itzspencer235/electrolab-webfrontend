import { formatPrice } from '@/lib/utils';
import { finalPrice, originalPrice, isDiscounted, discountOf } from '@/lib/pricing';

/** Final price, plus the crossed-out original price when discounted. */
export default function PriceTag({ product, size = 'md', inline = false }: {
  product: any; size?: 'sm' | 'md' | 'lg' | 'xl'; inline?: boolean;
}) {
  const off = isDiscounted(product);
  const main = { sm: 'text-sm', md: 'text-base', lg: 'text-xl', xl: 'text-3xl' }[size];
  const old  = { sm: 'text-[11px]', md: 'text-xs', lg: 'text-sm', xl: 'text-lg' }[size];
  return (
    <div className={inline ? 'flex items-baseline flex-wrap gap-x-2' : 'flex flex-col'}>
      <span className={`${main} font-black tracking-tight ${off ? 'text-red-600' : 'text-blue-700'}`}>
        {formatPrice(finalPrice(product))}
      </span>
      {off && <span className={`${old} text-gray-400 line-through`}>{formatPrice(originalPrice(product))}</span>}
    </div>
  );
}

export function DiscountBadge({ product, percent, className = '' }: { product?: any; percent?: number; className?: string }) {
  const p = percent ?? discountOf(product);
  if (!p) return null;
  return (
    <span className={`inline-flex items-center bg-gradient-to-r from-red-500 to-red-700 text-white
                      text-xs font-black px-2 py-0.5 rounded-lg shadow-md shadow-red-200 ${className}`}>
      -{p}%
    </span>
  );
}
