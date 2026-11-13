'use client';
// Shared building blocks for the admin pages (same look as the rest of the site).
import { ReactNode, useRef, useState } from 'react';
import Image from 'next/image';
import { Languages, Loader2, ImagePlus, X, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLang } from '@/context/LangContext';
import { useAuth } from '@/context/AuthContext';
import { uploadImage, apiError } from '@/lib/api';
import { translate, tr, type ML } from '@/lib/adminApi';
import type { Lang } from '@/lib/constants';

export const inputCls = `w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm
  outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition`;
export const btnPrimary = `inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-700
  text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition disabled:opacity-60`;
export const btnGhost = `inline-flex items-center justify-center gap-2 px-4 py-2.5 border
  border-gray-200 bg-white text-sm font-semibold text-gray-600 rounded-xl hover:border-blue-300
  hover:text-blue-700 transition disabled:opacity-60`;

export function PageHeader({ title, subtitle, icon, actions }: {
  title: string; subtitle?: string; icon: ReactNode; actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-800 truncate">{title}</h1>
          {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Section({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-black text-gray-800 text-base mb-4 flex items-center gap-2">
        {icon && <span className="text-blue-600">{icon}</span>} {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

export function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="block text-sm font-semibold text-gray-700 mb-1.5">
      {children}{required && <span className="text-red-500"> *</span>}
    </span>
  );
}

export function Alert({ kind, children }: { kind: 'error' | 'success'; children: ReactNode }) {
  const err = kind === 'error';
  return (
    <div className={`flex items-center gap-2 p-3 rounded-xl text-sm
      ${err ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
      {err ? <AlertCircle size={16} className="shrink-0" /> : <CheckCircle2 size={16} className="shrink-0" />}
      <span>{children}</span>
    </div>
  );
}

export function Skeleton({ rows = 4, h = 'h-24' }: { rows?: number; h?: string }) {
  return (
    <div className="space-y-3">
      {Array(rows).fill(0).map((_, i) => <div key={i} className={`${h} bg-gray-100 rounded-2xl animate-pulse`} />)}
    </div>
  );
}

const FLAGS: Record<Lang, string> = { fr: '🇫🇷 FR', en: '🇬🇧 EN', ar: '🇸🇦 AR' };

/** One field in three languages: FR/EN/AR tabs + Gemini auto-translate from the open tab. */
export function MultiLangField({ label, value, onChange, required, multiline, rows = 4, fieldContext }: {
  label: string; value: ML; onChange: (v: ML) => void;
  required?: boolean; multiline?: boolean; rows?: number; fieldContext: string;
}) {
  const { lang } = useLang();
  const { token } = useAuth();
  const [tab, setTab]   = useState<Lang>('fr');
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState<string | null>(null);

  const doTranslate = async () => {
    const text = value[tab].trim();
    if (!text || !token) {
      setErr(tr(lang, 'Saisissez d\'abord le texte dans cet onglet.', 'Type the text in this tab first.', 'اكتب النص في هذا التبويب أولاً.'));
      return;
    }
    setBusy(true); setErr(null);
    try {
      const out = await translate(text, tab, fieldContext, token);
      onChange({ fr: out.fr, en: out.en, ar: out.ar, [tab]: text } as ML);
    } catch (e) {
      setErr(apiError(e, tr(lang, 'Échec de la traduction', 'Translation failed', 'فشلت الترجمة')));
    }
    setBusy(false);
  };

  const Input = multiline ? 'textarea' : 'input';
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        <Label required={required}>{label}</Label>
        <div className="flex items-center gap-1">
          {(['fr', 'en', 'ar'] as Lang[]).map(l => (
            <button key={l} type="button" onClick={() => setTab(l)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition relative
                ${tab === l ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-500 hover:bg-blue-50'}`}>
              {FLAGS[l]}
              {value[l].trim() && tab !== l && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
              )}
            </button>
          ))}
          <button type="button" onClick={doTranslate} disabled={busy}
            title={tr(lang, 'Traduire automatiquement vers les autres langues',
              'Auto-translate to the other languages', 'ترجمة تلقائية للغات الأخرى')}
            className="ml-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold
                       bg-green-50 text-green-700 hover:bg-green-100 transition disabled:opacity-60">
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}
            <span className="hidden sm:inline">{tr(lang, 'Traduire', 'Translate', 'ترجمة')}</span>
          </button>
        </div>
      </div>
      <Input
        value={value[tab]}
        onChange={(e: any) => onChange({ ...value, [tab]: e.target.value })}
        dir={tab === 'ar' ? 'rtl' : 'ltr'}
        rows={multiline ? rows : undefined}
        className={`${inputCls} ${multiline ? 'resize-y' : ''}`}
      />
      {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
    </div>
  );
}

/** Upload one image (value = url) or a gallery (values = urls). */
export function ImageField({ value, onChange, folder = 'ipelectrolab/products', tall }: {
  value: string; onChange: (url: string) => void; folder?: string; tall?: boolean;
}) {
  const { lang } = useLang();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState<string | null>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    setBusy(true); setErr(null);
    try { onChange(await uploadImage(f, folder)); }
    catch { setErr(tr(lang, 'Échec de l\'envoi', 'Upload failed', 'فشل الرفع')); }
    setBusy(false);
  };

  const h = tall ? 'h-48' : 'h-32';
  return (
    <div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} />
      {busy ? (
        <div className={`${h} rounded-2xl bg-blue-50 border border-gray-200 flex items-center justify-center`}>
          <Loader2 className="text-blue-700 animate-spin" />
        </div>
      ) : value ? (
        <div className={`relative ${h} rounded-2xl overflow-hidden border border-gray-200 bg-gray-50`}>
          <Image src={value} alt="" fill className="object-contain" sizes="400px" />
          <div className="absolute top-2 right-2 flex gap-1">
            <button type="button" onClick={() => ref.current?.click()}
              className="px-2.5 py-1 bg-black/55 hover:bg-black/70 text-white text-xs rounded-lg">
              {tr(lang, 'Changer', 'Change', 'تغيير')}
            </button>
            <button type="button" onClick={() => onChange('')}
              className="p-1 bg-black/55 hover:bg-black/70 text-white rounded-lg"><X size={14} /></button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()}
          className={`w-full ${h} rounded-2xl border-2 border-dashed border-blue-200 hover:border-blue-400
                      hover:bg-blue-50/50 transition flex flex-col items-center justify-center gap-2`}>
          <ImagePlus size={22} className="text-blue-700" />
          <span className="text-sm font-semibold text-blue-700">
            {tr(lang, 'Ajouter une image', 'Add an image', 'أضف صورة')}
          </span>
        </button>
      )}
      {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
    </div>
  );
}

export function GalleryField({ values, onChange, folder = 'ipelectrolab/products' }: {
  values: string[]; onChange: (urls: string[]) => void; folder?: string;
}) {
  const { lang } = useLang();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState<string | null>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); e.target.value = '';
    if (!files.length) return;
    setBusy(true); setErr(null);
    const urls: string[] = [];
    for (const f of files) {
      try { urls.push(await uploadImage(f, folder)); }
      catch { setErr(tr(lang, 'Certaines images n\'ont pas pu être envoyées', 'Some images failed to upload', 'تعذر رفع بعض الصور')); }
    }
    onChange([...values, ...urls]);
    setBusy(false);
  };

  return (
    <div>
      <input ref={ref} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} />
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        {values.map((u, i) => (
          <div key={u + i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            <Image src={u} alt="" fill className="object-cover" sizes="160px" />
            <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 p-1 bg-black/55 hover:bg-black/70 text-white rounded-lg">
              <X size={12} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => ref.current?.click()} disabled={busy}
          className="aspect-square rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400
                     hover:bg-blue-50/50 transition flex items-center justify-center">
          {busy ? <Loader2 className="text-blue-700 animate-spin" /> : <Plus className="text-blue-700" />}
        </button>
      </div>
      {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
    </div>
  );
}

/** "Delete" button that asks "Sure? Yes / No" inline (no browser dialogs). */
export function ConfirmButton({ label, confirmLabel, onConfirm, className = '' }: {
  label: ReactNode; confirmLabel: string; onConfirm: () => void; className?: string;
}) {
  const { lang } = useLang();
  const [ask, setAsk] = useState(false);
  if (ask) {
    return (
      <span className="inline-flex items-center gap-2 text-sm">
        <span className="text-gray-500">{confirmLabel}</span>
        <button type="button" onClick={() => { setAsk(false); onConfirm(); }}
          className="font-bold text-red-600 hover:underline">{tr(lang, 'Oui', 'Yes', 'نعم')}</button>
        <button type="button" onClick={() => setAsk(false)}
          className="text-gray-500 hover:underline">{tr(lang, 'Non', 'No', 'لا')}</button>
      </span>
    );
  }
  return (
    <button type="button" onClick={() => setAsk(true)}
      className={`inline-flex items-center gap-1.5 text-sm text-red-500 hover:underline font-semibold ${className}`}>
      {label}
    </button>
  );
}
