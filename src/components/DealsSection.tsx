'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, ChevronRight } from 'lucide-react';
import { useLang } from '@/context/LangContext';
import { getActiveSales, getProducts, type ActiveSale } from '@/lib/api';
import { discountOf } from '@/lib/pricing';
import ProductCard from '@/components/ProductCard';
import Countdown from '@/components/Countdown';

/** Red sale banner (with countdown) for the biggest running sale. */
export function SaleBanner({ sale }: { sale: ActiveSale }) {
  const { lang } = useLang();
  const t = (fr: string, en: string, ar: string) => (lang === 'en' ? en : lang === 'ar' ? ar : fr);
  const where = sale.scope === 'all'
    ? t('Sur toute la boutique', 'On the whole shop', 'على كل المتجر')
    : `${t('Sur', 'On', 'على')} ${sale.categories.join(', ')}`;
  const href = sale.scope === 'categories' && sale.categories[0]
    ? `/boutique?category=${encodeURIComponent(sale.categories[0])}` : '/boutique';
  return (
    <Link href={href}
      className="group relative flex flex-col sm:flex-row sm:items-center gap-4 overflow-hidden rounded-3xl
                 bg-gradient-to-br from-red-500 via-red-600 to-red-800 p-5 sm:p-7 text-white
                 shadow-xl shadow-red-200 hover:shadow-2xl transition">
      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
      <div className="absolute right-24 -bottom-16 w-40 h-40 rounded-full bg-white/5" />
      <div className="relative flex-1 min-w-0">
        <p className="flex items-center gap-2 text-sm font-black tracking-widest uppercase">
          <Flame size={18} className="text-amber-300" />
          {sale.title || t('Promotion', 'Sale', 'تخفيضات')}
        </p>
        <p className="mt-1 text-white/90">{where}</p>
        {sale.endsAt && (
          <Countdown until={sale.endsAt} className="mt-3 bg-black/20 rounded-xl px-3 py-1.5 text-sm" />
        )}
      </div>
      <div className="relative self-start sm:self-auto bg-white text-red-600 rounded-2xl px-5 py-3 text-center
                      group-hover:scale-105 transition">
        <p className="text-4xl font-black leading-none">-{sale.percent}%</p>
        <p className="text-xs font-black mt-1">{t('J\'en profite', 'Shop now', 'تسوق الآن')}</p>
      </div>
    </Link>
  );
}

/** Home: sale banner + discounted products. Renders nothing when there are no deals. */
export default function DealsSection() {
  const { lang } = useLang();
  const [sales, setSales] = useState<ActiveSale[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const t = (fr: string, en: string, ar: string) => (lang === 'en' ? en : lang === 'ar' ? ar : fr);

  useEffect(() => {
    getActiveSales(lang).then(setSales).catch(() => setSales([]));
    getProducts(lang).then((list: any[]) =>
      setDeals(list.filter(p => discountOf(p) > 0).sort((a, b) => discountOf(b) - discountOf(a)).slice(0, 8)),
    ).catch(() => setDeals([]));
  }, [lang]);

  if (!sales.length && !deals.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 pt-12 sm:pt-16">
      {sales[0] && <SaleBanner sale={sales[0]} />}
      {deals.length > 0 && (
        <>
          <div className="flex items-end justify-between mt-10 mb-5">
            <h2 className="flex items-center gap-2 text-2xl sm:text-3xl font-black text-gray-900">
              <Flame className="text-red-500" /> {t('Promotions', 'Deals', 'العروض')}
            </h2>
            <Link href="/boutique" className="flex items-center text-sm font-bold text-blue-700 hover:underline">
              {t('Tout voir', 'See all', 'عرض الكل')} <ChevronRight size={16} />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x [scrollbar-width:thin]">
            {deals.map(p => (
              <div key={p._id} className="w-[46%] sm:w-56 shrink-0 snap-start">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
