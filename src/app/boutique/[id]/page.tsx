'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link  from 'next/link';
import {
  ChevronLeft, MessageCircle, ShoppingCart, Heart,
  Package, Copy, Check, Lock, Star, Zap,
  ShoppingBag, X, MapPin, Phone, User, Minus, Plus,
} from 'lucide-react';
import { useLang }     from '@/context/LangContext';
import { useAuth }     from '@/context/AuthContext';
import { useCart }     from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { getProduct, createOrder } from '@/lib/api';
import { formatPrice, whatsappUrl } from '@/lib/utils';

export default function ProductDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const { lang } = useLang();
  const { user, token } = useAuth();
  const cart     = useCart();
  const wishlist = useWishlist();
  const router   = useRouter();

  const [product,   setProduct]   = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [selImg,    setSelImg]    = useState(0);
  const [tab,       setTab]       = useState('desc');
  const [copied,    setCopied]    = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);

  useEffect(() => {
    getProduct(id, lang).then(d => { setProduct(d); setLoading(false); });
  }, [id, lang]);

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-8 w-32 bg-gray-200 rounded-xl mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="h-80 bg-gray-200 rounded-3xl" />
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded-xl w-2/3" />
          <div className="h-10 bg-gray-200 rounded-xl" />
          <div className="h-8 bg-gray-200 rounded-xl w-1/3" />
          <div className="h-24 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="text-center py-32 text-gray-400">
      <Package size={48} className="mx-auto mb-4 text-gray-200" />
      <p>{lang === 'fr' ? 'Produit introuvable' : lang === 'en' ? 'Product not found' : 'المنتج غير موجود'}</p>
    </div>
  );

  const images  = [product.imageUrl, ...(product.images || [])].filter(Boolean);
  const inStock = (product.stock ?? 0) > 0;
  const inCart  = cart.isInCart(product._id);
  const isWished= wishlist.isWished(product._id);

  const waMsg = {
    fr: `Bonjour ! Je souhaite commander : ${product.name} - ${product.price} FCFA`,
    en: `Hello! I want to order: ${product.name} - ${product.price} FCFA`,
    ar: `مرحباً! أريد طلب: ${product.name} - ${product.price} FCFA`,
  }[lang]!;

  const tabs = [
    { key: 'desc', label: { fr: 'Description', en: 'Description', ar: 'الوصف' }[lang]! },
    ...(product.workingPrinciple ? [{ key: 'wp', label: { fr: 'Principe', en: 'How it works', ar: 'المبدأ' }[lang]! }] : []),
    ...(product.features ? [{ key: 'feat', label: { fr: 'Caractéristiques', en: 'Features', ar: 'المميزات' }[lang]! }] : []),
    ...((product.parameters?.length || product.specifications) ? [{ key: 'spec', label: { fr: 'Spécifications', en: 'Specs', ar: 'المواصفات' }[lang]! }] : []),
    ...(product.circuitImages?.length ? [{ key: 'circuit', label: { fr: 'Branchement', en: 'Circuit', ar: 'التوصيل' }[lang]! }] : []),
    ...(product.sampleCode ? [{ key: 'code', label: 'Code' }] : []),
    ...((product.howToUse || product.applications) ? [{ key: 'usage', label: { fr: 'Utilisation', en: 'Usage', ar: 'الاستخدام' }[lang]! }] : []),
  ];

  const copyCode = () => {
    navigator.clipboard.writeText(product.sampleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCart = () => {
    if (!user) { router.push('/login'); return; }
    if (inCart) { cart.remove(product._id); return; }
    cart.add({ id: product._id, name: product.name, price: product.price,
               imageUrl: product.imageUrl || '', category: product.category || '' });
  };

  const handleWish = () => {
    if (!user) { router.push('/login'); return; }
    wishlist.toggle({ id: product._id, name: product.name, price: product.price,
                      imageUrl: product.imageUrl || '', category: product.category || '' });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Order modal */}
      {orderOpen && (
        <OrderModal
          product={product} lang={lang} user={user}
          token={token} onClose={() => setOrderOpen(false)}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back */}
        <Link href="/boutique"
          className="inline-flex items-center gap-1.5 text-blue-700 text-sm
                     font-semibold mb-6 hover:underline">
          <ChevronLeft size={16} />
          {lang === 'fr' ? 'Retour boutique' : lang === 'en' ? 'Back to shop' : 'العودة للمتجر'}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* ── Left: Images ─────────────────────────────────────────────── */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative h-96 bg-white rounded-3xl overflow-hidden
                            border border-gray-100 shadow-sm group">
              {images[selImg] ? (
                <Image src={images[selImg]} alt={product.name}
                  fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package size={80} className="text-blue-100" />
                </div>
              )}
              {/* Stock badge */}
              <div className={`absolute top-4 left-4 flex items-center gap-1.5
                px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm
                ${inStock
                  ? 'bg-green-500/90 text-white'
                  : 'bg-red-500/90 text-white'}`}>
                <div className={`w-1.5 h-1.5 rounded-full
                  ${inStock ? 'bg-white animate-pulse' : 'bg-white'}`} />
                {inStock
                  ? (lang === 'fr' ? 'En stock' : lang === 'en' ? 'In stock' : 'متوفر')
                  : (lang === 'fr' ? 'Rupture' : lang === 'en' ? 'Out of stock' : 'نفد')}
              </div>
              {/* Wishlist */}
              <button onClick={handleWish}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full
                  flex items-center justify-center transition shadow-md
                  ${isWished ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:text-red-500'}`}>
                <Heart size={18} fill={isWished ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setSelImg(i)}
                    className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 transition
                      ${selImg === i ? 'border-blue-600 shadow-md' : 'border-gray-200 hover:border-blue-300'}`}>
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Circuit images */}
            {product.circuitImages?.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-bold text-gray-600 mb-2">
                  {lang === 'fr' ? '🔌 Schémas de branchement' : lang === 'en' ? '🔌 Wiring diagrams' : '🔌 مخططات التوصيل'}
                </h3>
                <div className="space-y-3">
                  {product.circuitImages.map((img: string, i: number) => (
                    <div key={i} className="relative rounded-2xl overflow-hidden border border-gray-100">
                      <Image src={img} alt={`Circuit ${i+1}`}
                        width={600} height={300} className="w-full object-contain bg-white" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Info ───────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Category + name */}
            <div>
              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold
                               px-3 py-1 rounded-full mb-3">
                {product.category}
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-gray-800 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-blue-700">
                {formatPrice(product.price)}
              </span>
            </div>

            {/* Stock count */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
              ${inStock ? 'bg-green-50 text-green-700 border border-green-100'
                        : 'bg-red-50 text-red-600 border border-red-100'}`}>
              <Package size={14} />
              {inStock
                ? `${product.stock} ${lang === 'fr' ? 'unités disponibles' : lang === 'en' ? 'units available' : 'وحدة متاحة'}`
                : (lang === 'fr' ? 'Rupture de stock' : lang === 'en' ? 'Out of stock' : 'غير متوفر')}
            </div>

            {/* Short description */}
            {product.description && (
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                {product.description}
              </p>
            )}

            {/* ── Action buttons ─────────────────────────────────────────── */}
            <div className="space-y-3 pt-2">
              {/* Row 1: Wishlist + Cart */}
              <div className="flex gap-3">
                {/* Wishlist */}
                <button onClick={handleWish}
                  className={`flex items-center justify-center gap-2 px-4 py-3.5
                    rounded-2xl font-bold text-sm transition border-2 shrink-0
                    ${isWished
                      ? 'bg-red-50 border-red-400 text-red-500'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500'}`}>
                  <Heart size={18} fill={isWished ? 'currentColor' : 'none'} />
                </button>

                {/* Add to cart */}
                <button onClick={handleCart} disabled={!inStock}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5
                    rounded-2xl font-bold text-sm transition
                    ${!inStock
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : !user
                        ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 hover:bg-blue-100'
                        : inCart
                          ? 'bg-green-50 text-green-700 border-2 border-green-300'
                          : 'bg-blue-700 hover:bg-blue-800 text-white shadow-md shadow-blue-200'}`}>
                  {!user
                    ? <><Lock size={16} /> {lang === 'fr' ? 'Ajouter dans Panier' : lang === 'en' ? 'Add to Cart' : 'سجّل دخولك'}</>
                    : inCart
                      ? <><Check size={16} /> {lang === 'fr' ? 'Dans le panier' : lang === 'en' ? 'In cart' : 'في السلة'}</>
                      : <><ShoppingCart size={16} /> {lang === 'fr' ? 'Ajouter au panier' : lang === 'en' ? 'Add to cart' : 'أضف للسلة'}</>}
                </button>
              </div>

              {/* Row 2: System order + WhatsApp */}
              <div className="flex gap-3">
                {/* System order */}
                <button onClick={() => {
                  if (!user) { router.push('/login'); return; }
                  if (inStock) setOrderOpen(true);
                }}
                  disabled={!inStock}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5
                    rounded-2xl font-bold text-sm transition
                    ${!inStock
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : 'bg-blue-900 hover:bg-blue-950 text-white shadow-md'}`}>
                  <ShoppingBag size={16} />
                  {lang === 'fr' ? 'Commander' : lang === 'en' ? 'Order now' : 'اطلب الآن'}
                </button>

                {/* WhatsApp */}
                <a href={inStock ? whatsappUrl(waMsg) : '#'}
                  target="_blank" rel="noreferrer"
                  className={`flex items-center justify-center gap-2 px-5 py-3.5
                    rounded-2xl font-bold text-sm transition
                    ${inStock
                      ? 'bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-200'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed pointer-events-none'}`}>
                  <MessageCircle size={16} />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              </div>

              {/* Payment note */}
              {inStock && (
                <p className="text-xs text-center text-gray-400 bg-orange-50
                              border border-orange-100 rounded-xl py-2.5 px-4">
                  💳 {lang === 'fr'
                    ? 'Paiement à la livraison — Mobile Money bientôt disponible'
                    : lang === 'en'
                      ? 'Cash on delivery — Mobile Money coming soon'
                      : 'الدفع عند الاستلام — موبايل ماني قريباً'}
                </p>
              )}
            </div>

            {/* Features highlight */}
            {product.features && (
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-2">
                  <Zap size={14} />
                  {lang === 'fr' ? 'Points clés' : lang === 'en' ? 'Key features' : 'النقاط الرئيسية'}
                </h4>
                <p className="text-blue-800 text-xs leading-relaxed line-clamp-4">
                  {product.features}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="mt-12">
          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto pb-1 mb-6
                          scrollbar-hide border-b border-gray-200">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-5 py-3 text-sm font-semibold whitespace-nowrap
                  border-b-2 transition -mb-px
                  ${tab === t.key
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
            {/* Description */}
            {tab === 'desc' && (
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                  {product.description || (lang === 'fr' ? 'Aucune description disponible.' : 'No description available.')}
                </p>
                {/* Parameters quick view */}
                {product.parameters?.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-800 mb-3">
                      {lang === 'fr' ? 'Paramètres principaux' : 'Main parameters'}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {product.parameters.slice(0, 6).map((p: any, i: number) => (
                        <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                          <p className="text-xs text-gray-400">{p.key}</p>
                          <p className="font-bold text-gray-800 text-sm">{p.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Working principle */}
            {tab === 'wp' && (
              <p className="text-gray-700 leading-relaxed text-sm md:text-base whitespace-pre-line">
                {product.workingPrinciple}
              </p>
            )}

            {/* Features */}
            {tab === 'feat' && (
              <p className="text-gray-700 leading-relaxed text-sm md:text-base whitespace-pre-line">
                {product.features}
              </p>
            )}

            {/* Specs */}
            {tab === 'spec' && (
              <div className="space-y-6">
                {product.specifications && (
                  <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                    {product.specifications}
                  </p>
                )}
                {product.parameters?.length > 0 && (
                  <div className="overflow-hidden rounded-2xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-blue-700 text-white">
                          <th className="text-left px-5 py-3 font-semibold">
                            {lang === 'fr' ? 'Paramètre' : 'Parameter'}
                          </th>
                          <th className="text-left px-5 py-3 font-semibold">
                            {lang === 'fr' ? 'Valeur' : 'Value'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.parameters.map((p: any, i: number) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-blue-50/50' : 'bg-white'}>
                            <td className="px-5 py-3 text-gray-500">{p.key}</td>
                            <td className="px-5 py-3 font-semibold text-gray-800">{p.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Circuit */}
            {tab === 'circuit' && (
              <div className="space-y-4">
                {product.circuitImages?.map((img: string, i: number) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-gray-100">
                    <Image src={img} alt={`Circuit ${i+1}`}
                      width={800} height={500} className="w-full object-contain bg-gray-50" />
                  </div>
                ))}
              </div>
            )}

            {/* Code */}
            {tab === 'code' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-blue-100 text-blue-700 text-xs font-black
                                   px-3 py-1.5 rounded-full">
                    {(product.codeLanguage || 'cpp').toUpperCase()}
                  </span>
                  <button onClick={copyCode}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2
                               bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition">
                    {copied ? <><Check size={13} /> Copié !</> : <><Copy size={13} /> Copier</>}
                  </button>
                </div>
                <pre className="bg-gray-900 text-cyan-400 rounded-2xl p-5 text-xs md:text-sm
                                overflow-x-auto font-mono leading-relaxed">
                  {product.sampleCode}
                </pre>
              </div>
            )}

            {/* Usage */}
            {tab === 'usage' && (
              <div className="space-y-6">
                {product.howToUse && (
                  <div>
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="text-blue-700">▶</span>
                      {lang === 'fr' ? 'Comment utiliser' : lang === 'en' ? 'How to use' : 'كيفية الاستخدام'}
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                      {product.howToUse}
                    </p>
                  </div>
                )}
                {product.applications && (
                  <div>
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="text-blue-700">◆</span>
                      {lang === 'fr' ? 'Applications' : 'Applications'}
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                      {product.applications}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Order Modal ────────────────────────────────────────────────────────────────

function OrderModal({ product, lang, user, token, onClose }: {
  product: any; lang: string; user: any; token: string | null; onClose: () => void;
}) {
  const [name,     setName]     = useState(user?.name || '');
  const [phone,    setPhone]    = useState(user?.phone || '');
  const [location, setLocation] = useState('');
  const [note,     setNote]     = useState('');
  const [qty,      setQty]      = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState('');

  const total = product.price * qty;

  const t = {
    fr: {
      title: 'Passer une commande', name: 'Nom complet *', phone: 'Téléphone *',
      location: 'Quartier / Adresse *', note: 'Note (optionnel)',
      total: 'Total', confirm: 'Confirmer la commande',
      success: 'Commande passée !', successSub: 'Votre commande a été enregistrée. Nous vous contacterons bientôt.',
      close: 'Fermer', also: 'Confirmer aussi sur WhatsApp',
      payment: '💳 Paiement à la livraison — Mobile Money bientôt',
      fill: 'Veuillez remplir tous les champs',
    },
    en: {
      title: 'Place an order', name: 'Full name *', phone: 'Phone *',
      location: 'Address *', note: 'Note (optional)',
      total: 'Total', confirm: 'Confirm order',
      success: 'Order placed!', successSub: 'Your order has been placed. We will contact you soon.',
      close: 'Close', also: 'Also confirm on WhatsApp',
      payment: '💳 Cash on delivery — Mobile Money coming soon',
      fill: 'Please fill all required fields',
    },
    ar: {
      title: 'تقديم طلب', name: 'الاسم الكامل *', phone: 'الهاتف *',
      location: 'العنوان *', note: 'ملاحظة (اختياري)',
      total: 'المجموع', confirm: 'تأكيد الطلب',
      success: 'تم الطلب!', successSub: 'تم تسجيل طلبك. سنتواصل معك قريباً.',
      close: 'إغلاق', also: 'تأكيد أيضاً عبر واتساب',
      payment: '💳 الدفع عند الاستلام — موبايل ماني قريباً',
      fill: 'يرجى ملء جميع الحقول',
    },
  }[lang as 'fr' | 'en' | 'ar']!;

  const waMsg = {
    fr: `Bonjour ! Je viens de commander : ${product.name} x${qty} = ${total} FCFA`,
    en: `Hello! I just ordered: ${product.name} x${qty} = ${total} FCFA`,
    ar: `مرحباً! لقد طلبت للتو: ${product.name} x${qty} = ${total} FCFA`,
  }[lang as 'fr' | 'en' | 'ar']!;

  const handleOrder = async () => {
    if (!name.trim() || !phone.trim() || !location.trim()) {
      setError(t.fill); return;
    }
    setError(''); setLoading(true);
    try {
      await createOrder({
        user: {
          userId: user?.id,
          name:   name.trim(),
          phone:  phone.trim(),
          location: location.trim(),
        },
        products: [{
          product:  product._id,
          name:     product.name,
          quantity: qty,
          price:    product.price,
        }],
        totalPrice: total,
        note:       note.trim(),
        status:     'pending',
      });
      setSuccess(true);
    } catch {
      setError('Erreur lors de la commande. Réessayez.');
    }
    setLoading(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
           onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto
                      md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg
                      bg-white rounded-3xl shadow-2xl z-50 overflow-hidden
                      max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
                        bg-blue-700 text-white">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} />
            <span className="font-bold">{t.title}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            /* Success screen */
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center
                              justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">{t.success}</h3>
              <p className="text-gray-500 text-sm mb-6">{t.successSub}</p>
              <div className="bg-blue-50 rounded-2xl p-4 mb-6 flex justify-between">
                <span className="text-gray-600">{t.total}</span>
                <span className="font-black text-blue-700 text-lg">
                  {formatPrice(total)}
                </span>
              </div>
              <div className="space-y-3">
                <button onClick={onClose}
                  className="w-full py-3 bg-blue-700 text-white font-bold rounded-2xl hover:bg-blue-800 transition">
                  {t.close}
                </button>
                <a href={whatsappUrl(waMsg)} target="_blank" rel="noreferrer"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 py-3
                             border-2 border-green-400 text-green-600 font-bold
                             rounded-2xl hover:bg-green-50 transition">
                  <MessageCircle size={16} />
                  {t.also}
                </a>
              </div>
            </div>
          ) : (
            /* Order form */
            <div className="space-y-4">
              {/* Product summary */}
              <div className="flex gap-3 bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden
                                bg-white shrink-0">
                  {product.imageUrl
                    ? <Image src={product.imageUrl} alt={product.name}
                        fill className="object-cover" />
                    : <Package size={24} className="text-blue-200 m-auto" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{product.name}</p>
                  <p className="text-blue-700 font-bold">{formatPrice(product.price)}/unité</p>
                </div>
                {/* Quantity */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-8 h-8 bg-white rounded-xl flex items-center justify-center
                               border border-gray-200 hover:bg-gray-50 transition">
                    <Minus size={14} className="text-blue-700" />
                  </button>
                  <span className="w-6 text-center font-black text-gray-800">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    className="w-8 h-8 bg-white rounded-xl flex items-center justify-center
                               border border-gray-200 hover:bg-gray-50 transition">
                    <Plus size={14} className="text-blue-700" />
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-100
                              rounded-xl px-4 py-3">❌ {error}</p>
              )}

              {/* Fields */}
              {[
                { val: name,     set: setName,     ph: t.name,     icon: <User size={15} /> },
                { val: phone,    set: setPhone,     ph: t.phone,    icon: <Phone size={15} /> },
                { val: location, set: setLocation,  ph: t.location, icon: <MapPin size={15} /> },
              ].map((f, i) => (
                <div key={i} className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    {f.icon}
                  </div>
                  <input value={f.val} onChange={e => f.set(e.target.value)}
                    placeholder={f.ph}
                    className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-2xl
                               text-sm outline-none focus:border-blue-400
                               focus:ring-2 focus:ring-blue-100 transition" />
                </div>
              ))}
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder={t.note} rows={2}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl
                           text-sm outline-none focus:border-blue-400
                           focus:ring-2 focus:ring-blue-100 transition resize-none" />

              {/* Total */}
              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex justify-between
                              items-center border border-gray-100">
                <span className="text-gray-500 text-sm">{t.total}</span>
                <span className="text-2xl font-black text-blue-700">
                  {formatPrice(total)}
                </span>
              </div>

              {/* Payment note */}
              <p className="text-xs text-center text-orange-600 bg-orange-50
                            border border-orange-100 rounded-xl py-2.5 px-4">
                {t.payment}
              </p>

              {/* Submit */}
              <button onClick={handleOrder} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4
                           bg-blue-700 hover:bg-blue-800 disabled:bg-gray-200
                           text-white font-bold rounded-2xl transition text-sm">
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white
                                     rounded-full animate-spin" />
                  : <><ShoppingBag size={16} /> {t.confirm}</>}
              </button>
            </div>  
          )}
        </div>
      </div>
    </>
  );
}