'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { X, Tag, Info, Handshake } from 'lucide-react';
import { useLang } from '@/context/LangContext';
import { getActivePromotions, trackPromotion, type ActivePromotion } from '@/lib/api';

const KEY = (id: string) => `el_promo_${id}`;

function shouldShow(p: ActivePromotion): boolean {
  let seen: string | null = null;
  try { seen = localStorage.getItem(KEY(p._id)); } catch { return p.frequency === 'every_visit'; }
  if (!seen) return true;
  const [version, at] = seen.split('|');
  if (p.frequency === 'every_visit') return !sessionStorage.getItem(KEY(p._id)); // once per visit
  if (p.frequency === 'once') return version !== String(p.version);              // edited → again
  return Date.now() - Number(at || 0) > 20 * 3600 * 1000;                         // ~daily
}

function markSeen(p: ActivePromotion) {
  try {
    localStorage.setItem(KEY(p._id), `${p.version}|${Date.now()}`);
    sessionStorage.setItem(KEY(p._id), '1');
  } catch {}
}

/** Admin-controlled pop-up (sale, info, partner ad) shown when someone visits. */
export default function PromoPopup() {
  const { lang } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const [promo, setPromo] = useState<ActivePromotion | null>(null);
  const [open, setOpen] = useState(false);

  const hidden = !pathname || pathname.startsWith('/admin') || pathname.startsWith('/login') || pathname.startsWith('/register');

  useEffect(() => {
    if (hidden) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      getActivePromotions(lang).then(list => {
        if (cancelled) return;
        const p = list.find(shouldShow);
        if (!p) return;
        markSeen(p);
        trackPromotion(p._id, 'view');
        setPromo(p);
        setOpen(true);
      }).catch(() => {});
    }, 1200);
    return () => { cancelled = true; clearTimeout(timer); };
    // Only on first load of a page session (not on every navigation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!promo || !open || hidden) return null;

  const act = () => {
    trackPromotion(promo._id, 'click');
    setOpen(false);
    if (promo.ctaType === 'shop') router.push('/boutique');
    if (promo.ctaType === 'category') router.push(`/boutique?category=${encodeURIComponent(promo.ctaValue)}`);
    if (promo.ctaType === 'product') router.push(`/boutique/${promo.ctaValue}`);
    if (promo.ctaType === 'url' && promo.ctaValue.startsWith('https://')) window.open(promo.ctaValue, '_blank', 'noopener,noreferrer');
  };
  return <PromoDialog promo={promo} onClose={() => setOpen(false)} onAct={act} />;
}

type DialogPromo = Pick<ActivePromotion, 'kind' | 'title' | 'body' | 'imageUrl' | 'ctaLabel' | 'ctaType'>;

/** The pop-up itself (also used by the admin preview). */
export function PromoDialog({ promo, onClose, onAct }: { promo: DialogPromo; onClose: () => void; onAct: () => void }) {
  const { lang } = useLang();
  const t = (fr: string, en: string, ar: string) => (lang === 'en' ? en : lang === 'ar' ? ar : fr);

  const style = {
    info:    { accent: 'bg-blue-700 hover:bg-blue-800', chip: 'bg-blue-50 text-blue-700', grad: 'from-blue-600 to-blue-900',
               label: t('Information', 'Info', 'معلومة'), Icon: Info },
    partner: { accent: 'bg-purple-700 hover:bg-purple-800', chip: 'bg-purple-50 text-purple-700', grad: 'from-purple-600 to-purple-900',
               label: t('Partenaire', 'Partner', 'شريك'), Icon: Handshake },
    sale:    { accent: 'bg-red-600 hover:bg-red-700', chip: 'bg-red-50 text-red-600', grad: 'from-red-500 to-red-800',
               label: t('Promotion', 'Sale', 'عرض'), Icon: Tag },
  }[promo.kind] || { accent: '', chip: '', grad: '', label: '', Icon: Tag };

  const label = promo.ctaLabel || ({
    url: t('En savoir plus', 'Learn more', 'اعرف المزيد'),
    product: t('Voir le produit', 'View product', 'عرض المنتج'),
    none: t('Compris', 'Got it', 'حسناً'),
  } as Record<string, string>)[promo.ctaType] || t('J\'en profite', 'Shop now', 'تسوق الآن');


  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm animate-[fadeIn_.2s_ease]" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={promo.title}
        className="relative w-full max-w-md bg-white rounded-[28px] shadow-2xl overflow-hidden animate-[popIn_.28s_ease]">
        <button onClick={onClose} aria-label={t('Fermer', 'Close', 'إغلاق')}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center">
          <X size={18} />
        </button>
        {promo.imageUrl ? (
          <div className="relative aspect-[4/3] bg-gray-100">
            <Image src={promo.imageUrl} alt="" fill sizes="448px" className="object-cover" />
          </div>
        ) : (
          <div className={`h-36 bg-gradient-to-br ${style.grad} flex items-center justify-center`}>
            <style.Icon size={64} className="text-white/90" />
          </div>
        )}
        <div className="p-6 text-center">
          <span className={`inline-block text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${style.chip}`}>
            {style.label}
          </span>
          <h2 className="mt-3 text-2xl font-black text-gray-900 leading-tight">{promo.title}</h2>
          {promo.body && <p className="mt-2 text-gray-500 whitespace-pre-line">{promo.body}</p>}
          <button onClick={onAct}
            className={`mt-6 w-full py-3.5 rounded-2xl text-white font-black transition ${style.accent}`}>
            {label}
          </button>
          {promo.ctaType !== 'none' && (
            <button onClick={onClose} className="mt-2 text-sm text-gray-400 hover:text-gray-600">
              {t('Plus tard', 'Maybe later', 'لاحقاً')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
