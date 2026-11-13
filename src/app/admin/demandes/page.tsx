'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link  from 'next/link';
import {
  PackageSearch, RefreshCw, Clock, User, AtSign, Search, Smartphone, Globe,
  Reply, Trash2, X, Link2, Unlink, Loader2, Cpu, MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';
import { formatPrice } from '@/lib/utils';
import {
  getAllProductRequests, updateProductRequest, adminDeleteProductRequest,
  getProducts, apiError, type ProductRequest, type RequestStatus,
} from '@/lib/api';
import {
  REQUEST_STATUSES, requestStatusLabel, requestStatusColor, productName,
} from '@/lib/requests';
import { PageHeader, btnGhost } from '@/components/admin/ui';

type Filter = 'all' | RequestStatus;

export default function AdminRequestsPage() {
  const { token } = useAuth();
  const { lang }  = useLang();

  const [items,    setItems]    = useState<ProductRequest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [filter,   setFilter]   = useState<Filter>('all');
  const [search,   setSearch]   = useState('');
  const [editing,  setEditing]  = useState<ProductRequest | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [zoom,     setZoom]     = useState<string | null>(null);

  const t = {
    fr: { title: 'Demandes de produits', refresh: 'Actualiser',
          all: 'Toutes', search: 'Rechercher (produit, client)...', empty: 'Aucune demande',
          reply: 'Répondre', del: 'Supprimer', confirmDel: 'Supprimer ?', yes: 'Oui', no: 'Non',
          searched: 'Recherche', price: 'Prix souhaité' },
    en: { title: 'Product requests', refresh: 'Refresh',
          all: 'All', search: 'Search (product, customer)...', empty: 'No requests',
          reply: 'Reply', del: 'Delete', confirmDel: 'Delete?', yes: 'Yes', no: 'No',
          searched: 'Searched', price: 'Intended price' },
    ar: { title: 'طلبات المنتجات', refresh: 'تحديث',
          all: 'الكل', search: 'بحث (منتج، عميل)...', empty: 'لا توجد طلبات',
          reply: 'رد', del: 'حذف', confirmDel: 'حذف؟', yes: 'نعم', no: 'لا',
          searched: 'بحث', price: 'السعر المقترح' },
  }[lang];

  const load = async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try { setItems(await getAllProductRequests(token)); }
    catch (e) { setError(apiError(e, 'Erreur')); }
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [token]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    REQUEST_STATUSES.forEach(s => { c[s] = items.filter(r => r.status === s).length; });
    return c;
  }, [items]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(r =>
      (filter === 'all' || r.status === filter) &&
      (!q || [r.name, r.user?.name, r.user?.contact, r.searchQuery]
        .some(v => (v || '').toLowerCase().includes(q))));
  }, [items, filter, search]);

  const doDelete = async (id: string) => {
    if (!token) return;
    setDeleting(null);
    try { await adminDeleteProductRequest(id, token); load(); }
    catch (e) { setError(apiError(e, 'Erreur')); }
  };

  return (
    <div>
      <PageHeader title={t.title} icon={<PackageSearch size={22} />}
        actions={
          <button onClick={load} className={btnGhost}>
            <RefreshCw size={14} /> {t.refresh}
          </button>
        } />

      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search}
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl
                     text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {(['all', ...REQUEST_STATUSES] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
                        whitespace-nowrap transition shrink-0
              ${filter === f
                ? 'bg-blue-700 text-white shadow'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
            {f === 'all' ? t.all : requestStatusLabel[f][lang]}
            {counts[f] > 0 && (
              <span className={`text-xs font-black px-1.5 py-0.5 rounded-full
                ${filter === f ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}

      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 text-gray-400">
          <MessageSquare size={48} className="mx-auto mb-4 text-gray-200" />
          {t.empty}
        </div>
      ) : (
        <div className="space-y-4">
          {shown.map(r => (
            <div key={r._id}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
              <div className="flex items-start gap-4 p-5">
                <button type="button" disabled={!r.imageUrl} onClick={() => setZoom(r.imageUrl)}
                  className="relative w-20 h-20 rounded-2xl overflow-hidden bg-blue-50 shrink-0
                             flex items-center justify-center disabled:cursor-default">
                  {r.imageUrl
                    ? <Image src={r.imageUrl} alt={r.name} fill className="object-cover" sizes="80px" />
                    : <Cpu size={28} className="text-blue-300" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-800 break-words">{r.name}</p>
                  <p className="text-xs text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(r.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                    </span>
                    <span>x{r.quantity}</span>
                    {r.intendedPrice != null && <span>{t.price}: {formatPrice(r.intendedPrice)}</span>}
                    <span className="flex items-center gap-1">
                      {r.source === 'web' ? <Globe size={11} /> : <Smartphone size={11} />}
                      {r.source === 'web' ? 'Web' : 'App'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                    <span className="flex items-center gap-1 font-semibold">
                      <User size={13} className="text-blue-600" /> {r.user?.name}
                    </span>
                    {r.user?.contact && (
                      <span className="flex items-center gap-1 text-gray-500">
                        <AtSign size={13} /> {r.user.contact}
                      </span>
                    )}
                  </p>
                  {r.searchQuery && r.searchQuery.toLowerCase() !== r.name.toLowerCase() && (
                    <p className="text-xs text-gray-400 mt-1">{t.searched}: “{r.searchQuery}”</p>
                  )}
                  {r.description && (
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{r.description}</p>
                  )}
                </div>
                <span className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full ${requestStatusColor[r.status]}`}>
                  {requestStatusLabel[r.status]?.[lang] || r.status}
                </span>
              </div>

              {(r.adminMessage || r.product) && (
                <div className="mx-5 mb-4 p-4 bg-blue-50 rounded-2xl text-sm space-y-1.5">
                  {r.adminMessage && <p className="text-gray-700 whitespace-pre-line">💬 {r.adminMessage}</p>}
                  {r.product && (
                    <p className="flex items-center gap-1.5 text-blue-700 font-semibold">
                      <Link2 size={14} />
                      <Link href={`/boutique/${r.product._id}`} className="hover:underline">
                        {productName(r.product, lang)}
                      </Link>
                      {r.product.price != null && <span>· {formatPrice(r.product.price)}</span>}
                    </p>
                  )}
                </div>
              )}

              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                {deleting === r._id ? (
                  <span className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">{t.confirmDel}</span>
                    <button onClick={() => doDelete(r._id)} className="font-bold text-red-600 hover:underline">{t.yes}</button>
                    <button onClick={() => setDeleting(null)} className="text-gray-500 hover:underline">{t.no}</button>
                  </span>
                ) : (
                  <button onClick={() => setDeleting(r._id)}
                    className="flex items-center gap-1.5 text-sm text-red-500 hover:underline font-semibold">
                    <Trash2 size={14} /> {t.del}
                  </button>
                )}
                <button onClick={() => setEditing(r)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white text-sm
                             font-bold rounded-xl hover:bg-blue-800 transition">
                  <Reply size={14} /> {t.reply}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && token && (
        <ReplyModal
          request={editing} token={token}
          onClose={() => setEditing(null)}
          onSaved={updated => {
            setItems(list => list.map(x => (x._id === updated._id ? updated : x)));
            setEditing(null);
          }}
        />
      )}

      {zoom && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
             onClick={() => setZoom(null)}>
          <div className="relative w-full max-w-2xl aspect-square">
            <Image src={zoom} alt="" fill className="object-contain" sizes="672px" />
          </div>
          <button className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg">
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Reply: status + message + linked product ──────────────────────────────────

function ReplyModal({ request, token, onClose, onSaved }: {
  request: ProductRequest; token: string;
  onClose: () => void; onSaved: (r: ProductRequest) => void;
}) {
  const { lang } = useLang();
  const [status,  setStatus]  = useState<RequestStatus>(request.status);
  const [message, setMessage] = useState(request.adminMessage || '');
  const [linked,  setLinked]  = useState<{ _id: string; name: any; price?: number } | null>(
    request.product ? { _id: request.product._id, name: request.product.name, price: request.product.price } : null);
  const [picking,  setPicking]  = useState(false);
  const [products, setProducts] = useState<any[] | null>(null);
  const [pq,       setPq]       = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const t = {
    fr: { title: 'Répondre à la demande', status: 'Statut', msg: 'Message au client',
          msgHint: 'ex. Disponible dès lundi, 6 500 FCFA', link: 'Produit de la boutique (lien)',
          pick: 'Lier un produit', search: 'Rechercher un produit...', none: 'Aucun produit',
          save: 'Enregistrer', cancel: 'Annuler', unlink: 'Retirer le lien' },
    en: { title: 'Reply to request', status: 'Status', msg: 'Message to customer',
          msgHint: 'e.g. Available from Monday, 6,500 FCFA', link: 'Shop product (link)',
          pick: 'Link a product', search: 'Search a product...', none: 'No products',
          save: 'Save', cancel: 'Cancel', unlink: 'Remove link' },
    ar: { title: 'الرد على الطلب', status: 'الحالة', msg: 'رسالة للعميل',
          msgHint: 'مثال: متوفر من الإثنين', link: 'منتج المتجر (رابط)',
          pick: 'ربط منتج', search: 'ابحث عن منتج...', none: 'لا توجد منتجات',
          save: 'حفظ', cancel: 'إلغاء', unlink: 'إزالة الرابط' },
  }[lang];

  useEffect(() => {
    if (picking && !products) getProducts(lang).then(setProducts).catch(() => setProducts([]));
  }, [picking, products, lang]);

  const save = async () => {
    setSaving(true); setError(null);
    const before = request.product?._id || '';
    const after  = linked?._id || '';
    try {
      const updated = await updateProductRequest(request._id, {
        status,
        adminMessage: message.trim(),
        ...(before !== after ? { product: after } : {}),
      }, token);
      onSaved(updated);
    } catch (e) {
      setError(apiError(e, 'Erreur'));
      setSaving(false);
    }
  };

  const shownProducts = (products || []).filter(p =>
    (p.name || '').toLowerCase().includes(pq.trim().toLowerCase()));

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg max-h-[92vh] bg-white rounded-3xl
                        shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 bg-blue-700 text-white shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Reply size={20} />
              <span className="font-bold text-lg truncate">{t.title}</span>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <p className="font-black text-gray-800">{request.name}</p>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">{t.status}</p>
              <div className="flex flex-wrap gap-2">
                {REQUEST_STATUSES.map(s => (
                  <button key={s} type="button" onClick={() => setStatus(s)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition border-2
                      ${status === s
                        ? `${requestStatusColor[s]} border-current`
                        : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'}`}>
                    {requestStatusLabel[s][lang]}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="block text-sm font-semibold text-gray-700 mb-2">{t.msg}</span>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                rows={3} maxLength={1000} placeholder={t.msgHint}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm resize-none
                           outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
            </label>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">{t.link}</p>
              {linked ? (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-2xl">
                  <Link2 size={16} className="text-blue-700 shrink-0" />
                  <span className="flex-1 text-sm font-semibold text-gray-800 truncate">
                    {productName(linked, lang)}
                    {linked.price != null && <span className="text-gray-500 font-normal"> · {formatPrice(linked.price)}</span>}
                  </span>
                  <button type="button" onClick={() => setLinked(null)} title={t.unlink}
                    className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-white rounded-lg transition">
                    <Unlink size={16} />
                  </button>
                </div>
              ) : picking ? (
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="relative border-b border-gray-100">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input autoFocus value={pq} onChange={e => setPq(e.target.value)} placeholder={t.search}
                      className="w-full pl-9 pr-3 py-2.5 text-sm outline-none" />
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {!products ? (
                      <div className="flex justify-center py-6"><Loader2 className="animate-spin text-blue-700" /></div>
                    ) : shownProducts.length === 0 ? (
                      <p className="text-center text-sm text-gray-400 py-6">{t.none}</p>
                    ) : shownProducts.map(p => (
                      <button key={p._id} type="button"
                        onClick={() => {
                          setLinked({ _id: p._id, name: p.name, price: p.price });
                          setPicking(false);
                          if (status === 'pending' || status === 'in_progress') setStatus('available');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 text-left transition">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-blue-50 shrink-0">
                          {p.imageUrl && <Image src={p.imageUrl} alt="" fill className="object-cover" sizes="40px" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">{formatPrice(p.price || 0)} · {p.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setPicking(true)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-2xl
                             text-sm font-semibold text-blue-700 hover:border-blue-300 transition">
                  <Link2 size={16} /> {t.pick}
                </button>
              )}
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition">
              {t.cancel}
            </button>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-700 text-white text-sm font-bold
                         rounded-xl hover:bg-blue-800 transition disabled:opacity-60">
              {saving && <Loader2 size={16} className="animate-spin" />} {t.save}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
