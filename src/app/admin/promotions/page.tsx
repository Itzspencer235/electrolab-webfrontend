'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  BadgePercent, Plus, RefreshCw, Pencil, Trash2, Megaphone, Eye, MousePointerClick, X, Save, Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';
import { apiError, getCategories, getProducts } from '@/lib/api';
import { adminList, adminSave, adminRemove, tr, emptyML, toML, type ML, type MarketingKind } from '@/lib/adminApi';
import {
  PageHeader, Card, Skeleton, Alert, ConfirmButton, Label, MultiLangField, ImageField,
  btnPrimary, btnGhost, inputCls,
} from '@/components/admin/ui';
import PromoPreview from '@/components/PromoPreview';

const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toIso = (v: string) => (v ? new Date(v).toISOString() : null);

function status(x: any, lang: 'fr' | 'en' | 'ar'): [string, string] {
  const now = Date.now();
  if (!x.active) return [tr(lang, 'Désactivée', 'Off', 'متوقف'), 'bg-gray-100 text-gray-500'];
  if (x.endsAt && new Date(x.endsAt).getTime() < now) return [tr(lang, 'Terminée', 'Ended', 'انتهى'), 'bg-gray-100 text-gray-500'];
  if (x.startsAt && new Date(x.startsAt).getTime() > now) return [tr(lang, 'Programmée', 'Scheduled', 'مجدول'), 'bg-orange-100 text-orange-700'];
  return [tr(lang, 'En cours', 'Running', 'جارٍ'), 'bg-green-100 text-green-700'];
}
const period = (x: any, lang: 'fr' | 'en' | 'ar') => {
  const f = (v: string) => new Date(v).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB');
  if (!x.startsAt && !x.endsAt) return tr(lang, 'Sans limite de date', 'No end date', 'بدون تاريخ');
  return [x.startsAt && `${tr(lang, 'du', 'from', 'من')} ${f(x.startsAt)}`, x.endsAt && `${tr(lang, 'au', 'to', 'إلى')} ${f(x.endsAt)}`]
    .filter(Boolean).join(' ');
};

export default function AdminPromotionsPage() {
  const { token } = useAuth();
  const { lang }  = useLang();
  const [tab, setTab] = useState<MarketingKind>('sales');
  const [sales, setSales] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ kind: MarketingKind; item: any | null } | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const [s, p] = await Promise.all([adminList('sales', token), adminList('promotions', token)]);
      setSales(s); setPromos(p);
    } catch (e) { setError(apiError(e, 'Erreur')); }
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [token]);

  const toggle = async (kind: MarketingKind, item: any) => {
    if (!token) return;
    try { await adminSave(kind, { ...item, active: !item.active }, token, item._id); load(); }
    catch (e) { setError(apiError(e, 'Erreur')); }
  };
  const remove = async (kind: MarketingKind, id: string) => {
    if (!token) return;
    try { await adminRemove(kind, id, token); load(); } catch (e) { setError(apiError(e, 'Erreur')); }
  };

  const tabs: [MarketingKind, string, number][] = [
    ['sales', tr(lang, 'Soldes', 'Sales', 'تخفيضات'), sales.length],
    ['promotions', tr(lang, 'Pop-ups', 'Pop-ups', 'النوافذ'), promos.length],
  ];

  return (
    <div>
      <PageHeader
        title={tr(lang, 'Promotions & pop-ups', 'Sales & pop-ups', 'العروض والنوافذ')}
        subtitle={tr(lang, 'Réductions sur toute la boutique ou par catégorie, et annonces à l\'ouverture',
          'Discounts on everything or by category, and pop-ups when people visit', 'تخفيضات ونوافذ إعلانية')}
        icon={<BadgePercent size={22} />}
        actions={<>
          <button onClick={load} className={btnGhost}><RefreshCw size={14} /></button>
          <button onClick={() => setEditing({ kind: tab, item: null })} className={btnPrimary}>
            <Plus size={16} /> {tab === 'sales' ? tr(lang, 'Nouvelle promo', 'New sale', 'تخفيض جديد') : tr(lang, 'Nouveau pop-up', 'New pop-up', 'نافذة جديدة')}
          </button>
        </>}
      />

      <div className="flex gap-2 mb-5">
        {tabs.map(([k, label, n]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition
              ${tab === k ? 'bg-blue-700 text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
            {label}
            <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${tab === k ? 'bg-white/20' : 'bg-blue-100 text-blue-700'}`}>{n}</span>
          </button>
        ))}
      </div>

      {error && <div className="mb-4"><Alert kind="error">{error}</Alert></div>}

      {loading ? <Skeleton rows={3} h="h-24" /> : tab === 'sales' ? (
        sales.length === 0 ? (
          <Card className="text-center py-14 text-gray-400">
            <BadgePercent size={44} className="mx-auto mb-3 text-gray-200" />
            {tr(lang, 'Aucune promotion. Créez « -15% sur tout » ou une promo par catégorie.',
              'No sales yet. Create "15% off everything" or a category sale.', 'لا توجد تخفيضات بعد.')}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sales.map(s => {
              const [label, cls] = status(s, lang);
              return (
                <Card key={s._id} className="p-4 flex items-center gap-4">
                  <div className="w-20 h-20 shrink-0 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white
                                  flex items-center justify-center text-xl font-black shadow-md shadow-red-200">
                    -{s.percent}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-800 truncate">{s.title?.[lang] || s.title?.fr || tr(lang, 'Promotion', 'Sale', 'تخفيض')}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {s.scope === 'all' ? tr(lang, 'Toute la boutique', 'Whole shop', 'كل المتجر') : (s.categories || []).join(', ')}
                    </p>
                    <p className="text-xs text-gray-400">{period(s, lang)}</p>
                    <span className={`inline-block mt-1.5 text-xs font-bold px-2 py-0.5 rounded-md ${cls}`}>{label}</span>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Switch on={s.active} onChange={() => toggle('sales', s)} />
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditing({ kind: 'sales', item: s })}
                        className="p-2 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100"><Pencil size={15} /></button>
                      <ConfirmButton label={<Trash2 size={15} />} confirmLabel={tr(lang, 'Supprimer ?', 'Delete?', 'حذف؟')}
                        onConfirm={() => remove('sales', s._id)} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : promos.length === 0 ? (
        <Card className="text-center py-14 text-gray-400">
          <Megaphone size={44} className="mx-auto mb-3 text-gray-200" />
          {tr(lang, 'Aucun pop-up. Annoncez une promo, une info ou un partenaire.',
            'No pop-ups yet. Announce a sale, some news or a partner.', 'لا توجد نوافذ بعد.')}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promos.map(p => {
            const [label, cls] = status(p, lang);
            const rate = p.views ? Math.round((p.clicks * 100) / p.views) : 0;
            return (
              <Card key={p._id} className="overflow-hidden flex flex-col">
                <div className="flex gap-4 p-4 flex-1">
                  <div className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-blue-50 flex items-center justify-center">
                    {p.imageUrl ? <Image src={p.imageUrl} alt="" fill sizes="96px" className="object-cover" />
                      : <Megaphone size={30} className="text-blue-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                        {{ sale: tr(lang, 'Promo', 'Sale', 'عرض'), info: 'Info', partner: tr(lang, 'Partenaire', 'Partner', 'شريك') }[p.kind as 'sale']}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${cls}`}>{label}</span>
                    </div>
                    <p className="font-black text-gray-800 line-clamp-2">{p.title?.[lang] || p.title?.fr}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {{ all: tr(lang, 'App + site', 'App + web', 'التطبيق + الموقع'), app: 'App', web: tr(lang, 'Site', 'Web', 'الموقع') }[p.audience as 'all']}
                      {' · '}
                      {{ daily: tr(lang, '1×/jour', 'daily', 'يومياً'), once: tr(lang, 'une fois', 'once', 'مرة'), every_visit: tr(lang, 'chaque visite', 'every visit', 'كل زيارة') }[p.frequency as 'daily']}
                      {' · '}{period(p, lang)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1"><Eye size={12} /> {p.views || 0}</span>
                      <span className="flex items-center gap-1"><MousePointerClick size={12} /> {p.clicks || 0} ({rate}%)</span>
                    </p>
                  </div>
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <Switch on={p.active} onChange={() => toggle('promotions', p)} />
                  <div className="flex items-center gap-2">
                    <ConfirmButton label={<><Trash2 size={14} /> {tr(lang, 'Supprimer', 'Delete', 'حذف')}</>}
                      confirmLabel={tr(lang, 'Supprimer ?', 'Delete?', 'حذف؟')} onConfirm={() => remove('promotions', p._id)} />
                    <button onClick={() => setEditing({ kind: 'promotions', item: p })}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100">
                      <Pencil size={14} /> {tr(lang, 'Modifier', 'Edit', 'تعديل')}
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editing && token && (
        editing.kind === 'sales'
          ? <SaleEditor item={editing.item} token={token} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
          : <PromoEditor item={editing.item} token={token} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

function Switch({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} role="switch" aria-checked={on}
      className={`w-11 h-6 rounded-full relative transition ${on ? 'bg-blue-700' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-2xl max-h-[94vh] bg-gray-50 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white shrink-0">
            <span className="font-bold text-lg">{title}</span>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">{children}</div>
          <div className="px-5 py-4 bg-white border-t border-gray-100 flex justify-end gap-2 shrink-0">{footer}</div>
        </div>
      </div>
    </>
  );
}

function Chips<T extends string>({ options, value, onChange }: { options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([k, label]) => (
        <button key={k} type="button" onClick={() => onChange(k)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition
            ${value === k ? 'bg-blue-700 text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

function SaleEditor({ item, token, onClose, onSaved }: { item: any | null; token: string; onClose: () => void; onSaved: () => void }) {
  const { lang } = useLang();
  const [title, setTitle] = useState<ML>(toML(item?.title) || emptyML());
  const [percent, setPercent] = useState(item?.percent ? String(item.percent) : '');
  const [scope, setScope] = useState<'all' | 'categories'>(item?.scope || 'all');
  const [cats, setCats] = useState<string[]>(item?.categories || []);
  const [allCats, setAllCats] = useState<string[]>([]);
  const [start, setStart] = useState(toLocalInput(item?.startsAt));
  const [end, setEnd] = useState(toLocalInput(item?.endsAt));
  const [active, setActive] = useState(item?.active !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { getCategories().then(setAllCats).catch(() => {}); }, []);

  const save = async () => {
    const pct = parseInt(percent, 10);
    if (!(pct >= 1 && pct <= 90)) return setError(tr(lang, 'La réduction doit être entre 1 et 90%', 'Discount must be 1–90%', 'التخفيض بين 1 و 90٪'));
    if (scope === 'categories' && !cats.length) return setError(tr(lang, 'Choisissez au moins une catégorie', 'Choose at least one category', 'اختر فئة واحدة على الأقل'));
    setSaving(true); setError(null);
    try {
      await adminSave('sales', { title, percent: pct, scope, categories: cats, startsAt: toIso(start), endsAt: toIso(end), active }, token, item?._id);
      onSaved();
    } catch (e) { setError(apiError(e, 'Erreur')); setSaving(false); }
  };

  return (
    <Modal title={item ? tr(lang, 'Modifier la promotion', 'Edit sale', 'تعديل التخفيض') : tr(lang, 'Nouvelle promotion', 'New sale', 'تخفيض جديد')}
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className={btnGhost}>{tr(lang, 'Annuler', 'Cancel', 'إلغاء')}</button>
        <button onClick={save} disabled={saving} className={btnPrimary}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {tr(lang, 'Enregistrer', 'Save', 'حفظ')}</button>
      </>}>
      <MultiLangField label={tr(lang, 'Nom affiché (ex. Black Friday)', 'Display name (e.g. Black Friday)', 'الاسم المعروض')}
        fieldContext="sale name (1-3 words)" value={title} onChange={setTitle} />
      <label className="block">
        <Label required>{tr(lang, 'Réduction (%)', 'Discount (%)', 'التخفيض (٪)')}</Label>
        <input value={percent} onChange={e => setPercent(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))} inputMode="numeric" placeholder="15" className={inputCls} />
      </label>
      <div>
        <Label>{tr(lang, 'Sur quels produits ?', 'Which products?', 'أي المنتجات؟')}</Label>
        <Chips options={[['all', tr(lang, 'Toute la boutique', 'Whole shop', 'كل المتجر')], ['categories', tr(lang, 'Certaines catégories', 'Some categories', 'فئات محددة')]]}
          value={scope} onChange={setScope} />
        {scope === 'categories' && (
          <div className="flex flex-wrap gap-2 mt-3">
            {allCats.map(c => {
              const on = cats.includes(c);
              return (
                <button key={c} type="button" onClick={() => setCats(on ? cats.filter(x => x !== c) : [...cats, c])}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition
                    ${on ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                  {on ? '✓ ' : ''}{c}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block"><Label>{tr(lang, 'Début (optionnel)', 'Start (optional)', 'البداية')}</Label>
          <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} className={inputCls} /></label>
        <label className="block"><Label>{tr(lang, 'Fin (optionnel)', 'End (optional)', 'النهاية')}</Label>
          <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} className={inputCls} /></label>
      </div>
      <label className="flex items-center gap-3"><Switch on={active} onChange={() => setActive(!active)} />
        <span className="text-sm font-semibold text-gray-700">{tr(lang, 'Activée', 'Active', 'مفعل')}</span></label>
      {Number(percent) > 0 && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">
          {tr(lang, 'Exemple : 10 000 FCFA → ', 'Example: 10,000 FCFA → ', 'مثال: 10000 ← ')}
          <b>{Math.round(10000 * (100 - Math.min(90, Number(percent))) / 100).toLocaleString('fr-FR')} FCFA</b>.
          {' '}{tr(lang, 'Si un produit a sa propre réduction plus forte, c\'est la sienne qui s\'applique.',
            'If a product has its own bigger discount, that one applies.', 'إذا كان للمنتج تخفيض أكبر فسيُطبق.')}
        </p>
      )}
      {error && <Alert kind="error">{error}</Alert>}
    </Modal>
  );
}

function PromoEditor({ item, token, onClose, onSaved }: { item: any | null; token: string; onClose: () => void; onSaved: () => void }) {
  const { lang } = useLang();
  const [kind, setKind] = useState<'sale' | 'info' | 'partner'>(item?.kind || 'sale');
  const [title, setTitle] = useState<ML>(item ? toML(item.title) : emptyML());
  const [body, setBody] = useState<ML>(item ? toML(item.body) : emptyML());
  const [ctaLabel, setCtaLabel] = useState<ML>(item ? toML(item.ctaLabel) : emptyML());
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || '');
  const [ctaType, setCtaType] = useState<'none' | 'shop' | 'product' | 'category' | 'url'>(item?.ctaType || 'shop');
  const [ctaValue, setCtaValue] = useState(item?.ctaValue || '');
  const [audience, setAudience] = useState<'all' | 'app' | 'web'>(item?.audience || 'all');
  const [frequency, setFrequency] = useState<'daily' | 'once' | 'every_visit'>(item?.frequency || 'daily');
  const [start, setStart] = useState(toLocalInput(item?.startsAt));
  const [end, setEnd] = useState(toLocalInput(item?.endsAt));
  const [priority, setPriority] = useState(String(item?.priority ?? 0));
  const [active, setActive] = useState(item?.active !== false);
  const [products, setProducts] = useState<any[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProducts(lang).then(setProducts).catch(() => {});
    getCategories().then(setCats).catch(() => {});
  }, [lang]);

  const save = async () => {
    if (!title.fr.trim() && !title.en.trim() && !title.ar.trim()) return setError(tr(lang, 'Le titre est obligatoire', 'Title is required', 'العنوان مطلوب'));
    if (ctaType === 'url' && !/^https:\/\//.test(ctaValue)) return setError(tr(lang, 'Le lien doit commencer par https://', 'Link must start with https://', 'يجب أن يبدأ الرابط بـ https://'));
    if ((ctaType === 'product' || ctaType === 'category') && !ctaValue) return setError(tr(lang, 'Choisissez la destination du bouton', 'Choose where the button goes', 'اختر وجهة الزر'));
    setSaving(true); setError(null);
    try {
      await adminSave('promotions', {
        kind, title, body, ctaLabel, imageUrl, ctaType, ctaValue, audience, frequency,
        startsAt: toIso(start), endsAt: toIso(end), priority: Number(priority) || 0, active,
      }, token, item?._id);
      onSaved();
    } catch (e) { setError(apiError(e, 'Erreur')); setSaving(false); }
  };

  return (
    <Modal title={item ? tr(lang, 'Modifier le pop-up', 'Edit pop-up', 'تعديل النافذة') : tr(lang, 'Nouveau pop-up', 'New pop-up', 'نافذة جديدة')}
      onClose={onClose}
      footer={<>
        <button onClick={() => setPreview(true)} className={btnGhost}><Eye size={16} /> {tr(lang, 'Aperçu', 'Preview', 'معاينة')}</button>
        <button onClick={save} disabled={saving} className={btnPrimary}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {tr(lang, 'Enregistrer', 'Save', 'حفظ')}</button>
      </>}>
      <div>
        <Label>{tr(lang, 'Type', 'Type', 'النوع')}</Label>
        <Chips options={[['sale', `🏷️ ${tr(lang, 'Promotion', 'Sale', 'عرض')}`], ['info', `ℹ️ ${tr(lang, 'Information', 'Info', 'معلومة')}`], ['partner', `🤝 ${tr(lang, 'Partenaire', 'Partner', 'شريك')}`]]}
          value={kind} onChange={setKind} />
      </div>
      <div>
        <Label>{tr(lang, 'Image (recommandé, paysage)', 'Image (recommended, landscape)', 'صورة')}</Label>
        <ImageField tall value={imageUrl} onChange={setImageUrl} folder="ipelectrolab/promotions" />
      </div>
      <MultiLangField label={tr(lang, 'Titre', 'Title', 'العنوان')} required fieldContext="pop-up title (short, catchy)" value={title} onChange={setTitle} />
      <MultiLangField label={tr(lang, 'Texte', 'Text', 'النص')} multiline rows={3} fieldContext="pop-up message (1-2 sentences)" value={body} onChange={setBody} />
      <div>
        <Label>{tr(lang, 'Bouton', 'Button', 'الزر')}</Label>
        <Chips options={[
          ['shop', tr(lang, 'Boutique', 'Shop', 'المتجر')], ['category', tr(lang, 'Catégorie', 'Category', 'فئة')],
          ['product', tr(lang, 'Produit', 'Product', 'منتج')], ['url', tr(lang, 'Lien web', 'Web link', 'رابط')],
          ['none', tr(lang, 'Juste fermer', 'Just close', 'إغلاق فقط')]]}
          value={ctaType} onChange={v => { setCtaType(v); setCtaValue(''); }} />
        <div className="mt-3">
          {ctaType === 'category' && (
            <select value={ctaValue} onChange={e => setCtaValue(e.target.value)} className={inputCls}>
              <option value="">{tr(lang, 'Choisir la catégorie', 'Choose a category', 'اختر الفئة')}</option>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {ctaType === 'product' && (
            <select value={ctaValue} onChange={e => setCtaValue(e.target.value)} className={inputCls}>
              <option value="">{tr(lang, 'Choisir le produit', 'Choose a product', 'اختر المنتج')}</option>
              {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          )}
          {ctaType === 'url' && (
            <input value={ctaValue} onChange={e => setCtaValue(e.target.value.trim())} placeholder="https://…" className={inputCls} dir="ltr" />
          )}
        </div>
      </div>
      {ctaType !== 'none' && (
        <MultiLangField label={tr(lang, 'Texte du bouton', 'Button text', 'نص الزر')} fieldContext="button label (1-3 words)" value={ctaLabel} onChange={setCtaLabel} />
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>{tr(lang, 'Où ?', 'Where?', 'أين؟')}</Label>
          <Chips options={[['all', tr(lang, 'App + site', 'App + web', 'الكل')], ['app', 'App'], ['web', tr(lang, 'Site', 'Web', 'الموقع')]]} value={audience} onChange={setAudience} />
        </div>
        <div>
          <Label>{tr(lang, 'Fréquence', 'How often', 'التكرار')}</Label>
          <Chips options={[['daily', tr(lang, '1×/jour', 'Daily', 'يومياً')], ['once', tr(lang, 'Une fois', 'Once', 'مرة')], ['every_visit', tr(lang, 'Chaque visite', 'Every visit', 'كل زيارة')]]}
            value={frequency} onChange={setFrequency} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="block"><Label>{tr(lang, 'Début (optionnel)', 'Start (optional)', 'البداية')}</Label>
          <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} className={inputCls} /></label>
        <label className="block"><Label>{tr(lang, 'Fin (optionnel)', 'End (optional)', 'النهاية')}</Label>
          <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} className={inputCls} /></label>
        <label className="block"><Label>{tr(lang, 'Priorité', 'Priority', 'الأولوية')}</Label>
          <input value={priority} onChange={e => setPriority(e.target.value.replace(/[^0-9-]/g, ''))} inputMode="numeric" className={inputCls} /></label>
      </div>
      <label className="flex items-center gap-3"><Switch on={active} onChange={() => setActive(!active)} />
        <span className="text-sm font-semibold text-gray-700">{tr(lang, 'Activé', 'Active', 'مفعل')}</span></label>
      {error && <Alert kind="error">{error}</Alert>}

      {preview && (
        <PromoPreview onClose={() => setPreview(false)} promo={{
          kind, imageUrl, ctaType,
          title: title[lang] || title.fr, body: body[lang] || body.fr, ctaLabel: ctaLabel[lang] || ctaLabel.fr,
        }} />
      )}
    </Modal>
  );
}
