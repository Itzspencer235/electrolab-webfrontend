'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  ReceiptText, RefreshCw, Search, Clock, User, Phone, MapPin, Package, Check, X, Truck, MessageCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';
import { formatPrice } from '@/lib/utils';
import { apiError } from '@/lib/api';
import {
  getOrders, updateOrderStatus, tr, orderStatusLabel, orderStatusColor, ORDER_STATUSES,
  type OrderStatus,
} from '@/lib/adminApi';
import { PageHeader, Card, Skeleton, Alert, btnGhost, inputCls } from '@/components/admin/ui';

type Filter = 'all' | OrderStatus;

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const { lang }  = useLang();
  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [filter,  setFilter]  = useState<Filter>('all');
  const [search,  setSearch]  = useState('');
  const [asking,  setAsking]  = useState<{ id: string; status: OrderStatus } | null>(null);
  const [busy,    setBusy]    = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try { setItems(await getOrders(token)); }
    catch (e) { setError(apiError(e, 'Erreur')); }
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [token]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    ORDER_STATUSES.forEach(s => { c[s] = items.filter(o => o.status === s).length; });
    return c;
  }, [items]);

  const shown = items.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [o._id, o.user?.name, o.user?.phone, o.user?.location]
      .some(v => String(v || '').toLowerCase().includes(q));
  });

  const apply = async (id: string, status: OrderStatus) => {
    if (!token) return;
    setAsking(null); setBusy(id);
    try {
      const updated = await updateOrderStatus(id, status, token);
      setItems(l => l.map(o => (o._id === id ? { ...o, ...updated, status } : o)));
    } catch (e) { setError(apiError(e, 'Erreur')); }
    setBusy(null);
  };

  const actions = (status: OrderStatus): { to: OrderStatus; label: string; icon: React.ReactNode; cls: string }[] => {
    if (status === 'pending') return [
      { to: 'confirmed', label: tr(lang, 'Confirmer', 'Confirm', 'تأكيد'), icon: <Check size={14} />, cls: 'bg-blue-700 text-white hover:bg-blue-800' },
      { to: 'cancelled', label: tr(lang, 'Annuler', 'Cancel', 'إلغاء'),   icon: <X size={14} />,     cls: 'bg-red-50 text-red-600 hover:bg-red-100' },
    ];
    if (status === 'confirmed') return [
      { to: 'delivered', label: tr(lang, 'Marquer livrée', 'Mark delivered', 'تم التسليم'), icon: <Truck size={14} />, cls: 'bg-green-600 text-white hover:bg-green-700' },
      { to: 'cancelled', label: tr(lang, 'Annuler', 'Cancel', 'إلغاء'), icon: <X size={14} />, cls: 'bg-red-50 text-red-600 hover:bg-red-100' },
    ];
    return [];
  };

  return (
    <div>
      <PageHeader
        title={tr(lang, 'Commandes', 'Orders', 'الطلبات')}
        icon={<ReceiptText size={22} />}
        actions={<button onClick={load} className={btnGhost}><RefreshCw size={14} /> {tr(lang, 'Actualiser', 'Refresh', 'تحديث')}</button>}
      />

      <div className="relative mb-3">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={tr(lang, 'Rechercher (n°, client, téléphone, lieu)...', 'Search (no., customer, phone, place)...', 'بحث (رقم، عميل، هاتف، مكان)...')}
          className={`${inputCls} pl-11`} />
      </div>
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {(['all', ...ORDER_STATUSES] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 transition
              ${filter === f ? 'bg-blue-700 text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
            {f === 'all' ? tr(lang, 'Toutes', 'All', 'الكل') : orderStatusLabel[f][lang]}
            {counts[f] > 0 && (
              <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${filter === f ? 'bg-white/20' : 'bg-blue-100 text-blue-700'}`}>{counts[f]}</span>
            )}
          </button>
        ))}
      </div>

      {error && <div className="mb-4"><Alert kind="error">{error}</Alert></div>}

      {loading ? <Skeleton rows={4} h="h-36" /> : shown.length === 0 ? (
        <Card className="text-center py-16 text-gray-400">
          <ReceiptText size={48} className="mx-auto mb-3 text-gray-200" />
          {tr(lang, 'Aucune commande', 'No orders', 'لا توجد طلبات')}
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {shown.map(o => {
            const status = (o.status || 'pending') as OrderStatus;
            const products = o.products || [];
            const phone = (o.user?.phone || '').replace(/[^\d+]/g, '');
            return (
              <Card key={o._id} className="overflow-hidden flex flex-col">
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
                  <div className="min-w-0">
                    <p className="font-black text-gray-800 text-sm">#{String(o._id).slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock size={11} /> {new Date(o.createdAt).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${orderStatusColor[status] || 'bg-gray-100 text-gray-600'}`}>
                    {orderStatusLabel[status]?.[lang] || status}
                  </span>
                </div>

                <div className="px-5 py-3 space-y-1 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-gray-800"><User size={14} className="text-blue-600" /> {o.user?.name || '—'}</p>
                  {o.user?.phone && (
                    <p className="flex flex-wrap items-center gap-2 text-gray-500">
                      <Phone size={13} /> {o.user.phone}
                      {phone && (
                        <a href={`https://wa.me/${phone.replace('+', '')}`} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-green-600 hover:underline">
                          <MessageCircle size={12} /> WhatsApp
                        </a>
                      )}
                    </p>
                  )}
                  {o.user?.location && <p className="flex items-start gap-2 text-gray-500"><MapPin size={13} className="mt-0.5 shrink-0" /> <span className="break-words">{o.user.location}</span></p>}
                </div>

                <div className="px-5 py-3 border-t border-gray-100 space-y-1.5 flex-1">
                  {products.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-1.5 text-gray-700 min-w-0">
                        <Package size={12} className="text-blue-400 shrink-0" />
                        <span className="truncate">{p.name || 'Produit'}</span>
                        <span className="text-gray-400 shrink-0">x{p.quantity || 1}</span>
                      </span>
                      <span className="text-gray-500 text-xs whitespace-nowrap">{formatPrice((p.price || 0) * (p.quantity || 1))}</span>
                    </div>
                  ))}
                  {o.note && <p className="text-xs text-gray-500 italic pt-1">“{o.note}”</p>}
                </div>

                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-gray-500">{tr(lang, 'Total', 'Total', 'المجموع')}: <span className="font-black text-blue-700 text-base">{formatPrice(o.totalPrice || 0)}</span></p>
                  {asking && asking.id === o._id ? (
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">{orderStatusLabel[asking.status][lang]} ?</span>
                      <button onClick={() => apply(o._id, asking.status)} className="font-bold text-blue-700 hover:underline">{tr(lang, 'Oui', 'Yes', 'نعم')}</button>
                      <button onClick={() => setAsking(null)} className="text-gray-500 hover:underline">{tr(lang, 'Non', 'No', 'لا')}</button>
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {actions(status).map(a => (
                        <button key={a.to} disabled={busy === o._id} onClick={() => setAsking({ id: o._id, status: a.to })}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition disabled:opacity-60 ${a.cls}`}>
                          {a.icon} {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
