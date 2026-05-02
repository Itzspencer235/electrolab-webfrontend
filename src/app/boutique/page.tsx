'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useLang } from '@/context/LangContext';
import { getProducts, getCategories } from '@/lib/api';
import ProductCard from '@/components/ProductCard';

function BoutiqueContent() {
  const { lang } = useLang();
  const params   = useSearchParams();

  const [products,    setProducts]    = useState<any[]>([]);
  const [filtered,    setFiltered]    = useState<any[]>([]);
  const [categories,  setCategories]  = useState<string[]>([]);
  const [selCat,      setSelCat]      = useState(params.get('category') || 'Tous');
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(true);

  const t = {
    fr: { title: 'Boutique', search: 'Rechercher un produit...', all: 'Tous', results: 'produit(s)' },
    en: { title: 'Shop',     search: 'Search products...',       all: 'All',  results: 'product(s)' },
    ar: { title: 'المتجر',  search: 'ابحث عن منتج...',           all: 'الكل', results: 'منتج' },
  }[lang];

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    getProducts(lang, selCat === 'Tous' ? undefined : selCat)
      .then(d => { setProducts(d); setLoading(false); });
  }, [lang, selCat]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(products); return; }
    setFiltered(products.filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase())));
  }, [search, products]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-gray-800 mb-2">{t.title}</h1>
      <p className="text-gray-500 mb-8">
        {filtered.length} {t.results}
      </p>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t.search}
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl
                     text-sm outline-none focus:border-blue-400 focus:ring-2
                     focus:ring-blue-100 transition" />
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {['Tous', ...categories].map(cat => (
          <button key={cat} onClick={() => setSelCat(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition
              ${selCat === cat
                ? 'bg-blue-700 text-white shadow'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
            {cat === 'Tous' ? t.all : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <span className="text-5xl block mb-4">🔍</span>
          {lang === 'fr' ? 'Aucun produit trouvé' : lang === 'en' ? 'No products found' : 'لا توجد منتجات'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  );
}

export default function BoutiquePage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="h-10 w-48 bg-gray-100 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <BoutiqueContent />
    </Suspense>
  );
}