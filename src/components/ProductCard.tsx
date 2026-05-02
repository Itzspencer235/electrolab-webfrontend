'use client';
import Image from 'next/image';
import Link  from 'next/link';
import { ShoppingCart, Heart, MessageCircle, Lock } from 'lucide-react';
import { useCart }     from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth }     from '@/context/AuthContext';
import { useLang }     from '@/context/LangContext';
import { formatPrice, whatsappUrl } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Props { product: any; }

export default function ProductCard({ product }: Props) {
  const { lang } = useLang();
  const { user } = useAuth();
  const cart     = useCart();
  const wishlist = useWishlist();
  const router   = useRouter();

  const inCart   = cart.isInCart(product._id);
  const isWished = wishlist.isWished(product._id);
  const inStock  = (product.stock ?? 0) > 0;

  const t = {
    fr: { outOfStock: 'Rupture', inCart: 'Dans le panier', addCart: 'Panier',
          whatsapp: 'WhatsApp', loginRequired: 'Ajouter dans Panier' },
    en: { outOfStock: 'Out of stock', inCart: 'In cart', addCart: 'Cart',
          whatsapp: 'WhatsApp', loginRequired: 'Add to Cart' },
    ar: { outOfStock: 'نفد', inCart: 'في السلة', addCart: 'السلة',
          whatsapp: 'واتساب', loginRequired: 'سجّل دخولك' },
  }[lang];

  const waMsg = {
    fr: `Bonjour ! Je souhaite commander : ${product.name} - ${product.price} FCFA`,
    en: `Hello! I want to order: ${product.name} - ${product.price} FCFA`,
    ar: `مرحباً! أريد طلب: ${product.name} - ${product.price} FCFA`,
  }[lang]!;

  const handleCart = () => {
    if (!user) { router.push('/login'); return; }
    if (inCart) { cart.remove(product._id); return; }
    cart.add({
      id: product._id, name: product.name,
      price: product.price, imageUrl: product.imageUrl || '',
      category: product.category || '',
    });
  };

  const handleWish = () => {
    if (!user) { router.push('/login'); return; }
    wishlist.toggle({
      id: product._id, name: product.name,
      price: product.price, imageUrl: product.imageUrl || '',
      category: product.category || '',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm
                    hover:shadow-md hover:-translate-y-0.5 transition-all
                    overflow-hidden flex flex-col group">
      {/* Image */}
      <Link href={`/boutique/${product._id}`}
        className="block relative h-44 bg-blue-50 overflow-hidden">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name}
            fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl">
            🔌
          </div>
        )}

        {/* Stock badge */}
        <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full
          ${inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {inStock
            ? (lang === 'fr' ? 'En stock' : lang === 'en' ? 'In stock' : 'متوفر')
            : t.outOfStock}
        </span>

        {/* Wishlist heart */}
        <button onClick={e => { e.preventDefault(); handleWish(); }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center
            justify-center transition shadow-sm
            ${isWished
              ? 'bg-red-500 text-white'
              : 'bg-white text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100'}`}>
          {!user
            ? <Lock size={13} />
            : <Heart size={14} fill={isWished ? 'currentColor' : 'none'} />}
        </button>

        {/* Category */}
        <span className="absolute bottom-2 left-2 bg-blue-700/80 text-white
                         text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
          {product.category}
        </span>
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <Link href={`/boutique/${product._id}`}>
          <h3 className="font-semibold text-gray-800 text-sm leading-snug
                         line-clamp-2 hover:text-blue-700 transition mb-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-blue-700 font-bold text-base">
          {formatPrice(product.price)}
        </p>

        {/* Action buttons */}
        <div className="mt-auto pt-3 flex gap-1.5">
          {/* WhatsApp — always available */}
          <a href={inStock ? whatsappUrl(waMsg) : '#'}
            target="_blank" rel="noreferrer"
            className={`flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl
              text-xs font-bold transition
              ${inStock
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed pointer-events-none'}`}>
            <MessageCircle size={13} />
            <span className="hidden sm:inline">{t.whatsapp}</span>
          </a>

          {/* Add to cart — requires login */}
          <button onClick={handleCart} disabled={!inStock}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl
              text-xs font-bold transition
              ${!inStock
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : !user
                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                  : inCart
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-blue-700 hover:bg-blue-800 text-white'}`}>
            {!user
              ? <><Lock size={11} /> {t.loginRequired}</>
              : inCart
                ? <><ShoppingCart size={13} /> {t.inCart}</>
                : <><ShoppingCart size={13} /> {t.addCart}</>}
          </button>
        </div>
      </div>
    </div>
  );
}