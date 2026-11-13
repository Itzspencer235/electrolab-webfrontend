'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link  from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Info, Image as ImageIcon, FileText, Code2, Cpu, Save, Loader2, Plus, Minus, X, ArrowLeft,
  GraduationCap, Search,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';
import { getProducts, apiError } from '@/lib/api';
import { formatPrice, levelLabel } from '@/lib/utils';
import {
  getTutorialFull, createTutorial, updateTutorial, toML, emptyML, tr,
  type ML, type TutorialInput,
} from '@/lib/adminApi';
import {
  PageHeader, Section, Label, Alert, Skeleton, MultiLangField, ImageField, GalleryField,
  inputCls, btnPrimary, btnGhost,
} from '@/components/admin/ui';

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const CATEGORIES = ['Arduino', 'ESP32', 'Sensors', 'GSM', 'IoT', 'General'];
const CODE_LANGS = ['cpp', 'python', 'javascript', 'other'];

interface Comp { product: string; name: string; imageUrl: string; price: number; quantity: number }

const withFallback = (m: ML, fallbackToFr = true): ML => ({
  fr: m.fr.trim(),
  en: m.en.trim() || (fallbackToFr ? m.fr.trim() : ''),
  ar: m.ar.trim() || (fallbackToFr ? m.fr.trim() : ''),
});

const mlName = (n: any, lang: string) =>
  n && typeof n === 'object' ? (n[lang] || n.fr || '') : (n || '');

export default function TutorialForm({ id }: { id?: string }) {
  const { token } = useAuth();
  const { lang }  = useLang();
  const router    = useRouter();
  const editing   = !!id;

  const [title,   setTitle]   = useState<ML>(emptyML);
  const [desc,    setDesc]    = useState<ML>(emptyML);
  const [content, setContent] = useState<ML>(emptyML);
  const [level,   setLevel]   = useState('beginner');
  const [category, setCategory] = useState('General');
  const [duration, setDuration] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [images,   setImages]   = useState<string[]>([]);
  const [youtube,  setYoutube]  = useState('');
  const [code,     setCode]     = useState('');
  const [codeLang, setCodeLang] = useState('cpp');
  const [steps,    setSteps]    = useState<{ title: string; content: string }[]>([]); // kept as-is
  const [comps,    setComps]    = useState<Comp[]>([]);

  const [products, setProducts] = useState<any[] | null>(null);
  const [picking,  setPicking]  = useState(false);
  const [pq,       setPq]       = useState('');

  const [loading, setLoading] = useState(editing);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [done,    setDone]    = useState<string | null>(null);

  useEffect(() => {
    if (!id || !token) return;
    getTutorialFull(id, token).then(t => {
      setTitle(toML(t.title)); setDesc(toML(t.description)); setContent(toML(t.content));
      if (LEVELS.includes(t.level)) setLevel(t.level);
      setCategory(t.category || 'General');
      setDuration(t.duration ? String(t.duration) : '');
      setImageUrl(t.imageUrl || ''); setImages(t.images || []);
      setYoutube(t.youtubeUrl || ''); setCode(t.codeSnippet || ''); setCodeLang(t.codeLanguage || 'cpp');
      setSteps((t.steps || []).map((s: any) => ({ title: s.title || '', content: s.content || '' })));
      setComps((t.components || []).map((c: any) => {
        const pop = (c.product && typeof c.product === 'object') ? c.product
                  : (c.productId && typeof c.productId === 'object') ? c.productId : null;
        return {
          product:  pop?._id || c.product || c.productId || '',
          name:     mlName(pop?.name, lang) || mlName(c.name, lang),
          imageUrl: pop?.imageUrl || c.imageUrl || '',
          price:    pop?.price ?? c.price ?? 0,
          quantity: c.quantity || 1,
        };
      }).filter((c: Comp) => c.product));
      setLoading(false);
    }).catch(e => { setError(apiError(e, 'Erreur')); setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  useEffect(() => {
    if (picking && !products) getProducts(lang).then(setProducts).catch(() => setProducts([]));
  }, [picking, products, lang]);

  const toggleComp = (p: any) => setComps(list =>
    list.some(c => c.product === p._id)
      ? list.filter(c => c.product !== p._id)
      : [...list, { product: p._id, name: p.name, imageUrl: p.imageUrl || '', price: p.price || 0, quantity: 1 }]);
  const setQty = (pid: string, d: number) => setComps(list =>
    list.map(c => c.product === pid ? { ...c, quantity: Math.max(1, c.quantity + d) } : c));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null); setDone(null);
    if (!title.fr.trim()) return setError(tr(lang, 'Le titre en français est obligatoire', 'The French title is required', 'العنوان بالفرنسية مطلوب'));
    if (youtube.trim() && !/^https?:\/\//i.test(youtube.trim()))
      return setError(tr(lang, 'Lien YouTube invalide', 'Invalid YouTube link', 'رابط يوتيوب غير صالح'));

    const body: TutorialInput = {
      title: withFallback(title),
      description: withFallback(desc),
      content: withFallback(content),
      level, category: category.trim() || 'General',
      duration: Math.max(0, parseInt(duration || '0', 10) || 0),
      imageUrl, images, youtubeUrl: youtube.trim(),
      codeSnippet: code.trim(), codeLanguage: codeLang,
      steps,
      components: comps.map(c => ({ product: c.product, quantity: c.quantity })),
    };

    setSaving(true);
    try {
      if (editing) await updateTutorial(id!, body, token);
      else await createTutorial(body, token);
      setDone(editing ? tr(lang, 'Tutoriel mis à jour !', 'Tutorial updated!', 'تم تحديث الدرس!')
                      : tr(lang, 'Tutoriel ajouté !', 'Tutorial added!', 'تمت إضافة الدرس!'));
      setTimeout(() => router.push('/admin/tutoriels'), 700);
    } catch (err) {
      setError(apiError(err, 'Erreur'));
      setSaving(false);
    }
  };

  const shownProducts = (products || []).filter(p =>
    (p.name || '').toLowerCase().includes(pq.trim().toLowerCase()));

  return (
    <form onSubmit={save}>
      <Link href="/admin/tutoriels" className="inline-flex items-center gap-1.5 text-sm text-blue-700 font-semibold hover:underline mb-3">
        <ArrowLeft size={14} /> {tr(lang, 'Tutoriels', 'Tutorials', 'الدروس')}
      </Link>
      <PageHeader
        title={editing ? tr(lang, 'Modifier le tutoriel', 'Edit tutorial', 'تعديل الدرس') : tr(lang, 'Nouveau tutoriel', 'New tutorial', 'درس جديد')}
        icon={<GraduationCap size={22} />}
      />

      {loading ? <Skeleton rows={4} h="h-40" /> : (
        <div className="space-y-4 sm:space-y-6">
          <Section title={tr(lang, 'Informations de base', 'Basic information', 'المعلومات الأساسية')} icon={<Info size={16} />}>
            <MultiLangField label={tr(lang, 'Titre', 'Title', 'العنوان')} required
              fieldContext="tutorial title (short, 3-8 words)" value={title} onChange={setTitle} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="block">
                <Label>{tr(lang, 'Niveau', 'Level', 'المستوى')}</Label>
                <select value={level} onChange={e => setLevel(e.target.value)} className={inputCls}>
                  {LEVELS.map(l => <option key={l} value={l}>{levelLabel[l][lang]}</option>)}
                </select>
              </label>
              <label className="block">
                <Label>{tr(lang, 'Catégorie', 'Category', 'الفئة')}</Label>
                <input value={category} onChange={e => setCategory(e.target.value)} list="tuto-cats" className={inputCls} />
                <datalist id="tuto-cats">{CATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
              </label>
              <label className="block">
                <Label>{tr(lang, 'Durée (minutes)', 'Duration (minutes)', 'المدة (دقائق)')}</Label>
                <input value={duration} onChange={e => setDuration(e.target.value)} inputMode="numeric" className={inputCls} />
              </label>
            </div>
            <label className="block">
              <Label>{tr(lang, 'Lien YouTube', 'YouTube link', 'رابط يوتيوب')}</Label>
              <input value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="https://youtube.com/watch?v=..." className={inputCls} dir="ltr" />
            </label>
          </Section>

          <Section title={tr(lang, 'Images', 'Images', 'الصور')} icon={<ImageIcon size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{tr(lang, 'Image principale', 'Main image', 'الصورة الرئيسية')}</Label>
                <ImageField tall value={imageUrl} onChange={setImageUrl} folder="ipelectrolab/tutorials" />
              </div>
              <div>
                <Label>{tr(lang, 'Autres images', 'More images', 'صور أخرى')}</Label>
                <GalleryField values={images} onChange={setImages} folder="ipelectrolab/tutorials" />
              </div>
            </div>
          </Section>

          <Section title={tr(lang, 'Contenu', 'Content', 'المحتوى')} icon={<FileText size={16} />}>
            <MultiLangField multiline rows={3} label={tr(lang, 'Description', 'Description', 'الوصف')}
              fieldContext="tutorial short description" value={desc} onChange={setDesc} />
            <MultiLangField multiline rows={12} label={tr(lang, 'Contenu complet', 'Full content', 'المحتوى الكامل')}
              fieldContext="full electronics tutorial content" value={content} onChange={setContent} />
          </Section>

          <Section title={tr(lang, 'Composants nécessaires', 'Required components', 'المكونات المطلوبة')} icon={<Cpu size={16} />}>
            {comps.length > 0 && (
              <div className="space-y-2">
                {comps.map(c => (
                  <div key={c.product} className="flex items-center gap-3 p-2 pr-3 bg-gray-50 rounded-2xl">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-blue-50 shrink-0 flex items-center justify-center">
                      {c.imageUrl ? <Image src={c.imageUrl} alt="" fill className="object-cover" sizes="48px" /> : <Cpu size={18} className="text-blue-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{c.name || '—'}</p>
                      <p className="text-xs text-gray-400">{formatPrice(c.price)}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1">
                      <button type="button" onClick={() => setQty(c.product, -1)} disabled={c.quantity <= 1}
                        className="p-1.5 text-blue-700 disabled:text-gray-300"><Minus size={14} /></button>
                      <span className="w-6 text-center text-sm font-bold">{c.quantity}</span>
                      <button type="button" onClick={() => setQty(c.product, 1)} className="p-1.5 text-blue-700"><Plus size={14} /></button>
                    </div>
                    <button type="button" onClick={() => setComps(l => l.filter(x => x.product !== c.product))}
                      className="p-1.5 text-gray-400 hover:text-red-500"><X size={16} /></button>
                  </div>
                ))}
              </div>
            )}
            {picking ? (
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="relative border-b border-gray-100">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input autoFocus value={pq} onChange={e => setPq(e.target.value)}
                    placeholder={tr(lang, 'Rechercher un composant...', 'Search a component...', 'ابحث عن مكون...')}
                    className="w-full pl-9 pr-24 py-2.5 text-sm outline-none" />
                  <button type="button" onClick={() => setPicking(false)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-bold text-blue-700 bg-blue-50 rounded-lg">
                    {tr(lang, 'Terminé', 'Done', 'تم')}
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {!products ? (
                    <div className="flex justify-center py-6"><Loader2 className="animate-spin text-blue-700" /></div>
                  ) : shownProducts.map(p => {
                    const sel = comps.some(c => c.product === p._id);
                    return (
                      <button key={p._id} type="button" onClick={() => toggleComp(p)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left transition ${sel ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0
                          ${sel ? 'bg-blue-700 border-blue-700 text-white' : 'border-gray-300'}`}>
                          {sel && <span className="text-[10px] font-black">✓</span>}
                        </span>
                        <span className="flex-1 min-w-0 text-sm text-gray-800 truncate">{p.name}</span>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{formatPrice(p.price || 0)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setPicking(true)} className={btnGhost}>
                <Plus size={14} /> {tr(lang, 'Ajouter des composants', 'Add components', 'إضافة مكونات')}
              </button>
            )}
          </Section>

          <Section title={tr(lang, 'Code', 'Code', 'الكود')} icon={<Code2 size={16} />}>
            <div className="flex flex-wrap gap-2">
              {CODE_LANGS.map(l => (
                <button key={l} type="button" onClick={() => setCodeLang(l)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition
                    ${codeLang === l ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}>
                  {l === 'cpp' ? 'C++ / Arduino' : l === 'other' ? tr(lang, 'Autre', 'Other', 'أخرى') : l}
                </button>
              ))}
            </div>
            <textarea value={code} onChange={e => setCode(e.target.value)} rows={10} dir="ltr" spellCheck={false}
              placeholder="// ..."
              className="w-full px-4 py-3 bg-gray-900 text-green-300 font-mono text-xs rounded-2xl outline-none
                         focus:ring-2 focus:ring-blue-300 resize-y" />
          </Section>

          {error && <Alert kind="error">{error}</Alert>}
          {done && <Alert kind="success">{done}</Alert>}

          <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-gray-50/95 backdrop-blur border-t border-gray-100
                          flex justify-end gap-2 sm:static sm:mx-0 sm:px-0 sm:bg-transparent sm:border-0">
            <Link href="/admin/tutoriels" className={btnGhost}>{tr(lang, 'Annuler', 'Cancel', 'إلغاء')}</Link>
            <button type="submit" disabled={saving} className={btnPrimary}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {tr(lang, 'Enregistrer', 'Save', 'حفظ')}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
