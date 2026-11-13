'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link  from 'next/link';
import {
  RefreshCw, PackagePlus, SearchCheck, Clock, Headset, Store, X as XIcon, Cpu,
} from 'lucide-react';
import { useLang } from '@/context/LangContext';
import { formatPrice } from '@/lib/utils';
import {
  getMyProductRequests, cancelProductRequest, apiError,
  type ProductRequest,
} from '@/lib/api';
import {
  requestStatusLabel, requestStatusColor, requestStatusBorder, productName,
} from '@/lib/requests';
import RequestProductModal from '@/components/RequestProductModal';

/** "My requests" tab on the profile page: products the user asked us to stock. */
export default function MyRequests({ token, onCount }: {
  token: string | null;
  onCount?: (n: number) => void;
}) {
  const { lang } = useLang();
  const [items,     setItems]     = useState<ProductRequest[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [newOpen,   setNewOpen]   = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const t = {
    fr: { title: 'Mes demandes', refresh: 'Actualiser', new: 'Nouvelle demande',
          empty: 'Aucune demande pour l\'instant',
          emptySub: 'Vous ne trouvez pas un composant ? Demandez-le, nous vous répondrons ici.',
          reply: 'Réponse de l\'équipe', noReply: 'Notre équipe n\'a pas encore répondu.',
          view: 'Voir le produit', cancel: 'Annuler', confirm: 'Annuler cette demande ?',
          yes: 'Oui, annuler', no: 'Non', price: 'Prix souhaité' },
    en: { title: 'My requests', refresh: 'Refresh', new: 'New request',
          empty: 'No requests yet',
          emptySub: "Can't find a component? Request it and our reply will appear here.",
          reply: 'Team reply', noReply: 'Our team has not replied yet.',
          view: 'View product', cancel: 'Cancel', confirm: 'Cancel this request?',
          yes: 'Yes, cancel', no: 'No', price: 'Intended price' },
    ar: { title: 'طلباتي', refresh: 'تحديث', new: 'طلب جديد',
          empty: 'لا توجد طلبات بعد',
          emptySub: 'لم تجد مكوناً؟ اطلبه وسيظهر ردنا هنا.',
          reply: 'رد الفريق', noReply: 'لم يرد فريقنا بعد.',
          view: 'عرض المنتج', cancel: 'إلغاء', confirm: 'إلغاء هذا الطلب؟',
          yes: 'نعم، إلغاء', no: 'لا', price: 'السعر المقترح' },
  }[lang];

  const load = async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const data = await getMyProductRequests(token);
      setItems(data); onCount?.(data.length);
    } catch (e) {
      setError(apiError(e, 'Erreur'));
    }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [token]);

  const doCancel = async (id: string) => {
    if (!token) return;
    setConfirmId(null);
    try {
      await cancelProductRequest(id, token);
      load();
    } catch (e) {
      setError(apiError(e, 'Erreur'));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-black text-gray-800 text-lg">
          {t.title} ({items.length})
        </h2>
        <div className="flex items-center gap-4">
          <button onClick={load}
            className="flex items-center gap-1.5 text-sm text-blue-700 hover:underline font-semibold">
            <RefreshCw size={14} /> {t.refresh}
          </button>
          <button onClick={() => setNewOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white text-sm
                       font-bold rounded-xl hover:bg-blue-800 transition">
            <PackagePlus size={14} /> {t.new}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-gray-100">
          <SearchCheck size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="text-gray-400 mb-1">{t.empty}</p>
          <p className="text-gray-400 text-sm mb-5">{t.emptySub}</p>
          <button onClick={() => setNewOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700
                       text-white font-bold rounded-2xl text-sm hover:bg-blue-800 transition">
            <PackagePlus size={16} /> {t.new}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(r => {
            const date = new Date(r.createdAt);
            const msg  = r.adminMessage?.trim();
            return (
              <div key={r._id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm
                           overflow-hidden hover:shadow-md transition">
                <div className="flex items-start gap-4 p-5">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-blue-50 shrink-0
                                  flex items-center justify-center">
                    {r.imageUrl
                      ? <Image src={r.imageUrl} alt={r.name} fill className="object-cover" sizes="64px" />
                      : <Cpu size={24} className="text-blue-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-800 text-sm break-words">{r.name}</p>
                    <p className="text-xs text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar' : 'en-US')}
                      </span>
                      <span>x{r.quantity}</span>
                      {r.intendedPrice != null && (
                        <span>{t.price}: {formatPrice(r.intendedPrice)}</span>
                      )}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full
                                    ${requestStatusColor[r.status]}`}>
                    {requestStatusLabel[r.status]?.[lang] || r.status}
                  </span>
                </div>

                {msg ? (
                  <div className={`mx-5 mb-4 p-4 bg-gray-50 rounded-2xl border-l-4
                                   ${requestStatusBorder[r.status]}`}>
                    <p className="text-xs font-bold text-gray-500 flex items-center gap-1.5 mb-1">
                      <Headset size={12} /> {t.reply}
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{msg}</p>
                  </div>
                ) : r.status === 'pending' && (
                  <p className="mx-5 mb-4 text-xs italic text-gray-400">{t.noReply}</p>
                )}

                {(r.product || r.status === 'pending') && (
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100
                                  flex flex-wrap items-center justify-between gap-3">
                    {r.product ? (
                      <Link href={`/boutique/${r.product._id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white
                                   text-sm font-bold rounded-xl hover:bg-blue-800 transition">
                        <Store size={14} />
                        {t.view}: {productName(r.product, lang)}
                        {r.product.price != null && ` · ${formatPrice(r.product.price)}`}
                      </Link>
                    ) : <span />}
                    {r.status === 'pending' && (
                      confirmId === r._id ? (
                        <span className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">{t.confirm}</span>
                          <button onClick={() => doCancel(r._id)}
                            className="font-bold text-red-600 hover:underline">{t.yes}</button>
                          <button onClick={() => setConfirmId(null)}
                            className="text-gray-500 hover:underline">{t.no}</button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmId(r._id)}
                          className="flex items-center gap-1 text-sm text-red-500 hover:underline font-semibold">
                          <XIcon size={14} /> {t.cancel}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <RequestProductModal
        open={newOpen} query="" startAtForm
        onClose={() => { setNewOpen(false); load(); }}
      />
    </div>
  );
}
