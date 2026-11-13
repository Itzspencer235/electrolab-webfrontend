'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link  from 'next/link';
import {
  Package, Plus, RefreshCw, Search, Pencil, Trash2, CheckCircle2, XCircle, Cpu, ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';
import { formatPrice } from '@/lib/utils';
import { getProducts, apiError } from '@/lib/api';
import { deleteProduct, tr } from '@/lib/adminApi';
import { PageHeader, Card, Skeleton, Alert, ConfirmButton, btnPrimary, btnGhost, inputCls } from '@/components/admin/ui';

export default function AdminProductsPage() {
  const { token } = useAuth();
  const { lang }  = useLang();
  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [search,  setSearch]  = useState('');
  const [cat,     setCat]     = useState('');
  const [stockF,  setStockF]  = useState<'all' | 'in' | 'out'>('all');

  const load = async () => {
    setLoading(true); setError(null);
    try { setItems(await getProducts(lang)); }
    catch (e) { setError(apiError(e, 'Erreur')); }
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [lang]);

  const categories = useMemo(
    () => Array.from(new Set(items.map(p => p.category).filter(Boolean))).sort(), [items]);
  const inStock = items.filter(p => (p.stock || 0) > 0).length;

  const shown = items.filter(p => {
    const q = search.trim().toLowerCase();
    if (q && !(p.name || '').toLowerCase().includes(q)) return false;
    if (cat && p.category !== cat) return false;
    if (stockF === 'in'  && !((p.stock || 0) > 0)) return false;
    if (stockF === 'out' && (p.stock || 0) > 0) return false;
    return true;
  });

  const remove = async (id: string) => {
    if (!token) return;
    try { await deleteProduct(id, token); setItems(l => l.filter(p => p._id !== id)); }
    catch (e) { setError(apiError(e, 'Erreur')); }
  };

  const stats = [
    { k: 'all' as const, label: tr(lang, 'Total', 'Total', 'الإجمالي'),     val: items.length,           icon: <Package size={18} />,      color: 'text-blue-700',  bg: 'bg-blue-50' },
    { k: 'in'  as const, label: tr(lang, 'En stock', 'In stock', 'متوفر'),  val: inStock,                icon: <CheckCircle2 size={18} />, color: 'text-green-600', bg: 'bg-green-50' },
    { k: 'out' as const, label: tr(lang, 'Rupture', 'Out of stock', 'نفد'), val: items.length - inStock, icon: <XCircle size={18} />,      color: 'text-red-500',   bg: 'bg-red-50' },
  ];

  return (
    <div>
      <PageHeader
        title={tr(lang, 'Produits', 'Products', 'المنتجات')}
        icon={<Package size={22} />}
        actions={<>
          <button onClick={load} className={btnGhost}><RefreshCw size={14} /> <span className="hidden sm:inline">{tr(lang, 'Actualiser', 'Refresh', 'تحديث')}</span></button>
          <Link href="/admin/produits/nouveau" className={btnPrimary}><Plus size={16} /> {tr(lang, 'Ajouter', 'Add', 'إضافة')}</Link>
        </>}
      />

      {/* Stock counters double as filters */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
        {stats.map(s => (
          <button key={s.k} onClick={() => setStockF(s.k)}
            className={`flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 p-3 sm:p-4 rounded-2xl border
                        transition text-center sm:text-left
              ${stockF === s.k ? 'bg-white border-blue-400 ring-2 ring-blue-100' : 'bg-white border-gray-100 hover:border-blue-200'}`}>
            <span className={`w-9 h-9 sm:w-10 sm:h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center shrink-0`}>{s.icon}</span>
            <span className="min-w-0">
              <span className={`block text-xl font-black ${s.color}`}>{s.val}</span>
              <span className="block text-xs text-gray-500 truncate">{s.label}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tr(lang, 'Rechercher un produit...', 'Search products...', 'ابحث عن منتج...')}
            className={`${inputCls} pl-11`} />
        </div>
        <select value={cat} onChange={e => setCat(e.target.value)} className={`${inputCls} sm:w-56`}>
          <option value="">{tr(lang, 'Toutes les catégories', 'All categories', 'كل الفئات')}</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {error && <div className="mb-4"><Alert kind="error">{error}</Alert></div>}

      {loading ? <Skeleton rows={5} h="h-20" /> : shown.length === 0 ? (
        <Card className="text-center py-16 text-gray-400">
          <Package size={48} className="mx-auto mb-3 text-gray-200" />
          {tr(lang, 'Aucun produit', 'No products', 'لا توجد منتجات')}
        </Card>
      ) : (
        <Card className="divide-y divide-gray-100 overflow-hidden">
          {shown.map(p => {
            const ok = (p.stock || 0) > 0;
            return (
              <div key={p._id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50/60 transition">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-blue-50 shrink-0 flex items-center justify-center">
                  {p.imageUrl
                    ? <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="64px" />
                    : <Cpu size={22} className="text-blue-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{p.name}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                    {p.category && <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md">{p.category}</span>}
                    <span className="text-sm font-black text-blue-700">{formatPrice(p.price || 0)}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {ok ? `${tr(lang, 'Stock', 'Stock', 'المخزون')}: ${p.stock}` : tr(lang, 'Rupture', 'Out of stock', 'نفد')}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 shrink-0">
                  <div className="flex items-center gap-1">
                    <Link href={`/boutique/${p._id}`} target="_blank" title={tr(lang, 'Voir', 'View', 'عرض')}
                      className="p-2 rounded-xl text-gray-400 hover:text-blue-700 hover:bg-blue-50 transition">
                      <ExternalLink size={16} />
                    </Link>
                    <Link href={`/admin/produits/${p._id}`} title={tr(lang, 'Modifier', 'Edit', 'تعديل')}
                      className="p-2 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 transition">
                      <Pencil size={16} />
                    </Link>
                  </div>
                  <ConfirmButton
                    label={<><Trash2 size={14} /> <span className="hidden sm:inline">{tr(lang, 'Supprimer', 'Delete', 'حذف')}</span></>}
                    confirmLabel={tr(lang, 'Supprimer ?', 'Delete?', 'حذف؟')}
                    onConfirm={() => remove(p._id)} />
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
