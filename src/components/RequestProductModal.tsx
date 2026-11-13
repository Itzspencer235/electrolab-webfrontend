'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link  from 'next/link';
import {
  X, SearchX, PackagePlus, ImagePlus, Minus, Plus, Send,
  CheckCircle2, LogIn, Lightbulb, AlertCircle, Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';
import { createProductRequest, uploadImage, apiError } from '@/lib/api';

type Step = 'prompt' | 'form' | 'done';

interface Props {
  open: boolean;
  /** What the user searched for; pre-fills the product name. */
  query: string;
  /** Skip the "not found" question and go straight to the form. */
  startAtForm?: boolean;
  onClose: () => void;
}

export default function RequestProductModal({ open, query, startAtForm, onClose }: Props) {
  const { user, token, logout } = useAuth();
  const { lang }        = useLang();
  const fileRef         = useRef<HTMLInputElement>(null);

  const [step,      setStep]      = useState<Step>('prompt');
  const [name,      setName]      = useState('');
  const [desc,      setDesc]      = useState('');
  const [price,     setPrice]     = useState('');
  const [qty,       setQty]       = useState(1);
  const [imageUrl,  setImageUrl]  = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending,   setSending]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Reset every time the modal opens
  useEffect(() => {
    if (!open) return;
    setStep(startAtForm ? 'form' : 'prompt');
    setName(query.trim()); setDesc(''); setPrice(''); setQty(1);
    setImageUrl(''); setError(null); setUploading(false); setSending(false);
  }, [open, query, startAtForm]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const t = {
    fr: {
      notFound: 'Produit introuvable',
      notFoundMsg: `Nous n'avons pas encore « ${query} ». Voulez-vous nous le demander ? Nous essaierons de le trouver pour vous.`,
      later: 'Plus tard', request: 'Faire une demande',
      title: 'Demander un produit',
      intro: 'Dites-nous ce que vous cherchez, nous essaierons de le trouver pour vous.',
      name: 'Nom du produit', nameHint: 'ex. Module ESP32-CAM', nameReq: 'Le nom du produit est obligatoire',
      image: 'Photo (facultatif)', addImage: 'Ajouter une photo', remove: 'Retirer',
      uploadErr: "Échec de l'envoi de la photo", imgType: 'Choisissez une image JPG, PNG ou WEBP (max 5 Mo)',
      price: 'Prix souhaité (FCFA)', priceHint: 'Facultatif', priceErr: 'Prix invalide',
      qty: 'Quantité',
      desc: 'Détails (facultatif)', descHint: 'Référence, caractéristiques, usage prévu...',
      send: 'Envoyer la demande', cancel: 'Annuler',
      loginMsg: "Connectez-vous pour faire une demande et suivre la réponse de notre équipe.",
      login: 'Se connecter',
      expired: 'Votre session a expiré. Veuillez vous reconnecter.',
      doneTitle: 'Demande envoyée !',
      doneMsg: 'Notre équipe va l\'étudier. Vous verrez la réponse dans « Mes demandes ».',
      ok: 'OK', seeMine: 'Mes demandes',
    },
    en: {
      notFound: 'Product not found',
      notFoundMsg: `We don't have "${query}" yet. Would you like to request it? We will try to get it for you.`,
      later: 'Later', request: 'Request it',
      title: 'Request a product',
      intro: 'Tell us what you are looking for and we will try to get it for you.',
      name: 'Product name', nameHint: 'e.g. ESP32-CAM module', nameReq: 'Product name is required',
      image: 'Photo (optional)', addImage: 'Add a photo', remove: 'Remove',
      uploadErr: 'Photo upload failed', imgType: 'Choose a JPG, PNG or WEBP image (max 5 MB)',
      price: 'Intended price (FCFA)', priceHint: 'Optional', priceErr: 'Invalid price',
      qty: 'Quantity',
      desc: 'Details (optional)', descHint: 'Reference, specs, what you need it for...',
      send: 'Send request', cancel: 'Cancel',
      loginMsg: "Sign in to send a request and follow our team's reply.",
      login: 'Sign in',
      expired: 'Your session has expired. Please sign in again.',
      doneTitle: 'Request sent!',
      doneMsg: 'Our team will review it. You will see the reply in "My requests".',
      ok: 'OK', seeMine: 'My requests',
    },
    ar: {
      notFound: 'المنتج غير موجود',
      notFoundMsg: `لا يتوفر لدينا «${query}» حالياً. هل تريد طلبه؟ سنحاول توفيره لك.`,
      later: 'لاحقاً', request: 'اطلبه',
      title: 'طلب منتج',
      intro: 'أخبرنا بما تبحث عنه وسنحاول توفيره لك.',
      name: 'اسم المنتج', nameHint: 'مثال: وحدة ESP32-CAM', nameReq: 'اسم المنتج مطلوب',
      image: 'صورة (اختياري)', addImage: 'أضف صورة', remove: 'إزالة',
      uploadErr: 'فشل رفع الصورة', imgType: 'اختر صورة JPG أو PNG أو WEBP (5 ميغابايت كحد أقصى)',
      price: 'السعر المقترح (فرنك)', priceHint: 'اختياري', priceErr: 'سعر غير صالح',
      qty: 'الكمية',
      desc: 'تفاصيل (اختياري)', descHint: 'المرجع، المواصفات، الاستخدام...',
      send: 'إرسال الطلب', cancel: 'إلغاء',
      loginMsg: 'سجّل الدخول لإرسال طلب ومتابعة رد فريقنا.',
      login: 'تسجيل الدخول',
      expired: 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.',
      doneTitle: 'تم إرسال الطلب!',
      doneMsg: 'سيقوم فريقنا بدراسته. سترى الرد في «طلباتي».',
      ok: 'حسناً', seeMine: 'طلباتي',
    },
  }[lang];

  if (!open) return null;

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError(t.imgType); return;
    }
    setError(null); setUploading(true);
    try {
      setImageUrl(await uploadImage(file));
    } catch {
      setError(t.uploadErr);
    }
    setUploading(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || uploading) return;
    if (!name.trim()) { setError(t.nameReq); return; }
    const p = price.replace(/\s/g, '');
    if (p && (!Number.isFinite(Number(p)) || Number(p) < 0)) { setError(t.priceErr); return; }

    setSending(true); setError(null);
    try {
      await createProductRequest({
        name: name.trim(),
        description: desc.trim(),
        imageUrl,
        intendedPrice: p ? Number(p) : undefined,
        quantity: qty,
        searchQuery: query.trim(),
      }, token);
      setStep('done');
    } catch (err: any) {
      if (err?.response?.status === 401) {
        // Old/invalid session: sign out so the modal shows the sign-in prompt
        logout();
        setError(t.expired);
      } else {
        setError(apiError(err, 'Erreur'));
      }
    }
    setSending(false);
  };

  const loginHref = `/login?next=${encodeURIComponent(`/boutique?request=${encodeURIComponent(name || query)}`)}`;
  const inputCls  = `w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm
                     outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition`;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div role="dialog" aria-modal="true"
          className="pointer-events-auto w-full max-w-lg max-h-[92vh] bg-white rounded-3xl
                     shadow-2xl flex flex-col overflow-hidden">

          {/* ── Step 1: not found ─────────────────────────────────────────── */}
          {step === 'prompt' && (
            <div className="p-7 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full
                              flex items-center justify-center">
                <SearchX size={30} className="text-blue-700" />
              </div>
              <h2 className="text-xl font-black text-gray-800 mb-2">{t.notFound}</h2>
              <p className="text-gray-500 text-sm mb-6">{t.notFoundMsg}</p>
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-center">
                <button onClick={onClose}
                  className="px-5 py-3 rounded-2xl text-sm font-semibold text-gray-500
                             hover:bg-gray-100 transition">
                  {t.later}
                </button>
                <button onClick={() => setStep('form')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-700
                             text-white font-bold rounded-2xl text-sm hover:bg-blue-800 transition
                             shadow-md shadow-blue-200">
                  <PackagePlus size={16} /> {t.request}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: form ──────────────────────────────────────────────── */}
          {step === 'form' && (
            <>
              <div className="flex items-center justify-between px-5 py-4 bg-blue-700 text-white shrink-0">
                <div className="flex items-center gap-2">
                  <PackagePlus size={20} />
                  <span className="font-bold text-lg">{t.title}</span>
                </div>
                <button onClick={onClose} aria-label={t.cancel}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition">
                  <X size={20} />
                </button>
              </div>

              {!user ? (
                <div className="p-7 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-2xl
                                  flex items-center justify-center">
                    <LogIn size={28} className="text-blue-700" />
                  </div>
                  <p className={`text-sm mb-6 ${error ? 'text-red-600' : 'text-gray-600'}`}>
                    {error || t.loginMsg}
                  </p>
                  <Link href={loginHref}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 text-white
                               font-bold rounded-2xl text-sm hover:bg-blue-800 transition">
                    <LogIn size={16} /> {t.login}
                  </Link>
                </div>
              ) : (
                <form onSubmit={submit} className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div className="flex gap-3 items-start bg-blue-50 rounded-2xl p-4">
                    <Lightbulb size={18} className="text-blue-700 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{t.intro}</p>
                  </div>

                  <label className="block">
                    <span className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t.name} <span className="text-red-500">*</span>
                    </span>
                    <input value={name} onChange={e => setName(e.target.value)}
                      maxLength={120} placeholder={t.nameHint} className={inputCls} autoFocus />
                  </label>

                  <div>
                    <span className="block text-sm font-semibold text-gray-700 mb-1.5">{t.image}</span>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                      className="hidden" onChange={onPickFile} />
                    {uploading ? (
                      <div className="h-36 rounded-2xl bg-blue-50 border border-gray-200
                                      flex items-center justify-center">
                        <Loader2 size={28} className="text-blue-700 animate-spin" />
                      </div>
                    ) : imageUrl ? (
                      <div className="relative h-44 rounded-2xl overflow-hidden border border-gray-200">
                        <Image src={imageUrl} alt="" fill className="object-cover" sizes="512px" />
                        <button type="button" onClick={() => setImageUrl('')}
                          className="absolute top-2 right-2 flex items-center gap-1 px-3 py-1.5
                                     bg-black/55 hover:bg-black/70 text-white text-xs rounded-lg transition">
                          <X size={12} /> {t.remove}
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="w-full h-32 rounded-2xl border-2 border-dashed border-blue-200
                                   hover:border-blue-400 hover:bg-blue-50/50 transition
                                   flex flex-col items-center justify-center gap-2">
                        <span className="w-11 h-11 bg-blue-50 rounded-full flex items-center justify-center">
                          <ImagePlus size={22} className="text-blue-700" />
                        </span>
                        <span className="text-sm font-semibold text-blue-700">{t.addImage}</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-5 gap-3">
                    <label className="col-span-3 block">
                      <span className="block text-sm font-semibold text-gray-700 mb-1.5">{t.price}</span>
                      <input value={price} onChange={e => setPrice(e.target.value)}
                        inputMode="numeric" placeholder={t.priceHint} className={inputCls} />
                    </label>
                    <div className="col-span-2">
                      <span className="block text-sm font-semibold text-gray-700 mb-1.5">{t.qty}</span>
                      <div className="flex items-center justify-between h-[46px] px-2 bg-white
                                      border border-gray-200 rounded-2xl">
                        <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
                          disabled={qty <= 1}
                          className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-50 disabled:text-gray-300">
                          <Minus size={16} />
                        </button>
                        <span className="font-bold text-gray-800">{qty}</span>
                        <button type="button" onClick={() => setQty(q => Math.min(999, q + 1))}
                          className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-50">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <label className="block">
                    <span className="block text-sm font-semibold text-gray-700 mb-1.5">{t.desc}</span>
                    <textarea value={desc} onChange={e => setDesc(e.target.value)}
                      rows={3} maxLength={1000} placeholder={t.descHint}
                      className={`${inputCls} resize-none`} />
                  </label>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                      <AlertCircle size={16} className="shrink-0" /> {error}
                    </div>
                  )}

                  <button type="submit" disabled={sending || uploading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-700
                               text-white font-bold rounded-2xl hover:bg-blue-800 transition
                               disabled:opacity-60 shadow-md shadow-blue-200">
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
                    {t.send}
                  </button>
                </form>
              )}
            </>
          )}

          {/* ── Step 3: done ──────────────────────────────────────────────── */}
          {step === 'done' && (
            <div className="p-7 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full
                              flex items-center justify-center">
                <CheckCircle2 size={34} className="text-green-600" />
              </div>
              <h2 className="text-xl font-black text-gray-800 mb-2">{t.doneTitle}</h2>
              <p className="text-gray-500 text-sm mb-6">{t.doneMsg}</p>
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-center">
                <button onClick={onClose}
                  className="px-5 py-3 rounded-2xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition">
                  {t.ok}
                </button>
                <Link href="/profil?tab=requests" onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-700
                             text-white font-bold rounded-2xl text-sm hover:bg-blue-800 transition">
                  {t.seeMine}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
