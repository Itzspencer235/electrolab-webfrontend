'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Info, Image as ImageIcon, FileText, SlidersHorizontal, Code2, Save, Loader2, Plus, Trash2, ArrowLeft, Package,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';
import { getCategories, apiError } from '@/lib/api';
import {
  getProductFull, createProduct, updateProduct, toML, emptyML, tr,
  type ML, type ProductInput,
} from '@/lib/adminApi';
import {
  PageHeader, Section, Label, Alert, Skeleton, MultiLangField, ImageField, GalleryField,
  inputCls, btnPrimary, btnGhost,
} from '@/components/admin/ui';

const CODE_LANGS = ['cpp', 'python', 'javascript', 'other'];
const ML_FIELDS = ['description', 'workingPrinciple', 'features', 'specifications', 'applications', 'howToUse'] as const;

const blank = (): ProductInput => ({
  name: emptyML(), description: emptyML(), workingPrinciple: emptyML(), features: emptyML(),
  specifications: emptyML(), applications: emptyML(), howToUse: emptyML(),
  parameters: [], sampleCode: '', codeLanguage: 'cpp',
  price: 0, stock: 0, category: '', imageUrl: '', images: [], circuitImages: [],
});

// Empty EN/AR fall back to FR (same as the app), so every language shows something
const withFallback = (m: ML): ML => ({ fr: m.fr.trim(), en: m.en.trim() || m.fr.trim(), ar: m.ar.trim() || m.fr.trim() });

export default function ProductForm({ id }: { id?: string }) {
  const { token } = useAuth();
  const { lang }  = useLang();
  const router    = useRouter();
  const editing   = !!id;

  const [p,       setP]       = useState<ProductInput>(blank);
  const [price,   setPrice]   = useState('');
  const [stock,   setStock]   = useState('');
  const [cats,    setCats]    = useState<string[]>([]);
  const [loading, setLoading] = useState(editing);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [done,    setDone]    = useState<string | null>(null);

  useEffect(() => { getCategories().then(setCats).catch(() => {}); }, []);

  useEffect(() => {
    if (!id || !token) return;
    getProductFull(id, token).then(d => {
      setP({
        name: toML(d.name), description: toML(d.description), workingPrinciple: toML(d.workingPrinciple),
        features: toML(d.features), specifications: toML(d.specifications),
        applications: toML(d.applications), howToUse: toML(d.howToUse),
        parameters: (d.parameters || []).map((x: any) => ({ key: x.key || '', value: x.value || '' })),
        sampleCode: d.sampleCode || '', codeLanguage: d.codeLanguage || 'cpp',
        price: d.price || 0, stock: d.stock || 0, category: d.category || '',
        imageUrl: d.imageUrl || '', images: d.images || [], circuitImages: d.circuitImages || [],
      });
      setPrice(String(d.price ?? '')); setStock(String(d.stock ?? ''));
      setLoading(false);
    }).catch(e => { setError(apiError(e, 'Erreur')); setLoading(false); });
  }, [id, token]);

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setP(prev => ({ ...prev, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null); setDone(null);
    if (!p.name.fr.trim()) return setError(tr(lang, 'Le nom en français est obligatoire', 'The French name is required', 'الاسم بالفرنسية مطلوب'));
    if (price.trim() === '' || Number.isNaN(Number(price)) || Number(price) < 0)
      return setError(tr(lang, 'Prix invalide', 'Invalid price', 'سعر غير صالح'));
    if (!p.category.trim()) return setError(tr(lang, 'La catégorie est obligatoire', 'Category is required', 'الفئة مطلوبة'));

    const body: ProductInput = {
      ...p,
      name: withFallback(p.name),
      ...Object.fromEntries(ML_FIELDS.map(f => [f, withFallback(p[f])])),
      price: Number(price),
      stock: Math.max(0, parseInt(stock || '0', 10) || 0),
      category: p.category.trim(),
      sampleCode: p.sampleCode.trim(),
      parameters: p.parameters.filter(x => x.key.trim()).map(x => ({ key: x.key.trim(), value: x.value.trim() })),
    } as ProductInput;

    setSaving(true);
    try {
      if (editing) await updateProduct(id!, body, token);
      else await createProduct(body, token);
      setDone(editing ? tr(lang, 'Produit mis à jour !', 'Product updated!', 'تم تحديث المنتج!')
                      : tr(lang, 'Produit ajouté !', 'Product added!', 'تمت إضافة المنتج!'));
      setTimeout(() => router.push('/admin/produits'), 700);
    } catch (err) {
      setError(apiError(err, 'Erreur'));
      setSaving(false);
    }
  };

  const mlLabels: Record<typeof ML_FIELDS[number], [string, string]> = {
    description:      [tr(lang, 'Description', 'Description', 'الوصف'), 'product description'],
    workingPrinciple: [tr(lang, 'Principe de fonctionnement', 'Working principle', 'مبدأ العمل'), 'working principle of an electronic component'],
    features:         [tr(lang, 'Caractéristiques', 'Features', 'المميزات'), 'product features list'],
    specifications:   [tr(lang, 'Spécifications', 'Specifications', 'المواصفات'), 'technical specifications'],
    applications:     [tr(lang, 'Applications', 'Applications', 'التطبيقات'), 'typical applications'],
    howToUse:         [tr(lang, 'Mode d\'emploi', 'How to use', 'طريقة الاستخدام'), 'how to use instructions'],
  };

  return (
    <form onSubmit={save}>
      <Link href="/admin/produits" className="inline-flex items-center gap-1.5 text-sm text-blue-700 font-semibold hover:underline mb-3">
        <ArrowLeft size={14} /> {tr(lang, 'Produits', 'Products', 'المنتجات')}
      </Link>
      <PageHeader
        title={editing ? tr(lang, 'Modifier le produit', 'Edit product', 'تعديل المنتج') : tr(lang, 'Nouveau produit', 'New product', 'منتج جديد')}
        icon={<Package size={22} />}
      />

      {loading ? <Skeleton rows={4} h="h-40" /> : (
        <div className="space-y-4 sm:space-y-6">
          <Section title={tr(lang, 'Informations de base', 'Basic information', 'المعلومات الأساسية')} icon={<Info size={16} />}>
            <MultiLangField label={tr(lang, 'Nom du produit', 'Product name', 'اسم المنتج')} required
              fieldContext="product name (short, 1-5 words)" value={p.name} onChange={v => set('name', v)} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="block">
                <Label required>{tr(lang, 'Prix (FCFA)', 'Price (FCFA)', 'السعر (فرنك)')}</Label>
                <input value={price} onChange={e => setPrice(e.target.value)} inputMode="numeric" className={inputCls} />
              </label>
              <label className="block">
                <Label>{tr(lang, 'Stock', 'Stock', 'المخزون')}</Label>
                <input value={stock} onChange={e => setStock(e.target.value)} inputMode="numeric" className={inputCls} />
              </label>
              <label className="block">
                <Label required>{tr(lang, 'Catégorie', 'Category', 'الفئة')}</Label>
                <input value={p.category} onChange={e => set('category', e.target.value)} list="product-cats" className={inputCls} />
                <datalist id="product-cats">{cats.map(c => <option key={c} value={c} />)}</datalist>
              </label>
            </div>
          </Section>

          <Section title={tr(lang, 'Images', 'Images', 'الصور')} icon={<ImageIcon size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{tr(lang, 'Image principale', 'Main image', 'الصورة الرئيسية')}</Label>
                <ImageField tall value={p.imageUrl} onChange={v => set('imageUrl', v)} />
              </div>
              <div className="space-y-4">
                <div>
                  <Label>{tr(lang, 'Autres images', 'More images', 'صور أخرى')}</Label>
                  <GalleryField values={p.images} onChange={v => set('images', v)} />
                </div>
                <div>
                  <Label>{tr(lang, 'Schémas de câblage', 'Circuit diagrams', 'مخططات التوصيل')}</Label>
                  <GalleryField values={p.circuitImages} onChange={v => set('circuitImages', v)} />
                </div>
              </div>
            </div>
          </Section>

          <Section title={tr(lang, 'Description détaillée', 'Detailed description', 'الوصف التفصيلي')} icon={<FileText size={16} />}>
            {ML_FIELDS.map(f => (
              <MultiLangField key={f} multiline label={mlLabels[f][0]} fieldContext={mlLabels[f][1]}
                value={p[f]} onChange={v => set(f, v)} />
            ))}
          </Section>

          <Section title={tr(lang, 'Paramètres techniques', 'Technical parameters', 'المعايير التقنية')} icon={<SlidersHorizontal size={16} />}>
            {p.parameters.length === 0 && (
              <p className="text-sm text-gray-400">{tr(lang, 'ex. Tension → 5V, Courant → 20mA', 'e.g. Voltage → 5V, Current → 20mA', 'مثال: الجهد ← 5V')}</p>
            )}
            {p.parameters.map((x, i) => (
              <div key={i} className="flex gap-2">
                <input value={x.key} placeholder={tr(lang, 'Nom', 'Name', 'الاسم')}
                  onChange={e => set('parameters', p.parameters.map((y, j) => j === i ? { ...y, key: e.target.value } : y))}
                  className={`${inputCls} flex-1 min-w-0`} />
                <input value={x.value} placeholder={tr(lang, 'Valeur', 'Value', 'القيمة')}
                  onChange={e => set('parameters', p.parameters.map((y, j) => j === i ? { ...y, value: e.target.value } : y))}
                  className={`${inputCls} flex-1 min-w-0`} />
                <button type="button" onClick={() => set('parameters', p.parameters.filter((_, j) => j !== i))}
                  className="p-3 rounded-2xl text-red-500 hover:bg-red-50 transition shrink-0"><Trash2 size={16} /></button>
              </div>
            ))}
            <button type="button" onClick={() => set('parameters', [...p.parameters, { key: '', value: '' }])} className={btnGhost}>
              <Plus size={14} /> {tr(lang, 'Ajouter un paramètre', 'Add a parameter', 'إضافة معيار')}
            </button>
          </Section>

          <Section title={tr(lang, 'Code exemple', 'Sample code', 'كود مثال')} icon={<Code2 size={16} />}>
            <div className="flex flex-wrap gap-2">
              {CODE_LANGS.map(l => (
                <button key={l} type="button" onClick={() => set('codeLanguage', l)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition
                    ${p.codeLanguage === l ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}>
                  {l === 'cpp' ? 'C++ / Arduino' : l === 'other' ? tr(lang, 'Autre', 'Other', 'أخرى') : l}
                </button>
              ))}
            </div>
            <textarea value={p.sampleCode} onChange={e => set('sampleCode', e.target.value)} rows={10} dir="ltr"
              spellCheck={false} placeholder="// ..."
              className="w-full px-4 py-3 bg-gray-900 text-green-300 font-mono text-xs rounded-2xl outline-none
                         focus:ring-2 focus:ring-blue-300 resize-y" />
          </Section>

          {error && <Alert kind="error">{error}</Alert>}
          {done && <Alert kind="success">{done}</Alert>}

          {/* Sticky save bar so it's reachable on long forms / phones */}
          <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-gray-50/95 backdrop-blur border-t border-gray-100
                          flex justify-end gap-2 sm:static sm:mx-0 sm:px-0 sm:bg-transparent sm:border-0">
            <Link href="/admin/produits" className={btnGhost}>{tr(lang, 'Annuler', 'Cancel', 'إلغاء')}</Link>
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
