'use client';
import Image from 'next/image';
import Link  from 'next/link';
import { ShoppingCart, Heart, MessageCircle, Lock, Check, Cpu } from 'lucide-react';
import { useCart }     from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth }     from '@/context/AuthContext';
import { useLang }     from '@/context/LangContext';
import { formatPrice, whatsappUrl } from '@/lib/utils';
import { finalPrice } from '@/lib/pricing';
import PriceTag, { DiscountBadge } from '@/components/PriceTag';
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
  const price    = finalPrice(product);

  const t = {
    fr: { outOfStock: 'Épuisé', inCart: 'Ajouté', addCart: 'Panier', login: 'Panier' },
    en: { outOfStock: 'Sold out', inCart: 'Added', addCart: 'Cart', login: 'Cart' },
    ar: { outOfStock: 'نفد', inCart: 'في السلة', addCart: 'السلة', login: 'السلة' },
  }[lang];

  const waMsg = {
    fr: `Bonjour ! Je souhaite commander : ${product.name} - ${formatPrice(price)}`,
    en: `Hello! I want to order: ${product.name} - ${formatPrice(price)}`,
    ar: `مرحباً! أريد طلب: ${product.name} - ${formatPrice(price)}`,
  }[lang]!;

  const item = {
    id: product._id, name: product.name, price,
    imageUrl: product.imageUrl || '', category: product.category || '',
  };
  const handleCart = () => {
    if (!user) { router.push('/login'); return; }
    if (inCart) { cart.remove(product._id); return; }
    cart.add(item);
  };
  const handleWish = () => {
    if (!user) { router.push('/login'); return; }
    wishlist.toggle(item);
  };

  return (
    <div className="bg-white rounded-3xl shadow-[0_6px_24px_-8px_rgba(21,101,192,0.18)]
                    hover:shadow-[0_14px_34px_-10px_rgba(21,101,192,0.32)] hover:-translate-y-1
                    transition-all duration-300 overflow-hidden flex flex-col group">
      {/* Image */}
      <Link href={`/boutique/${product._id}`}
        className="block relative m-2 mb-0 aspect-square rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 640px) 50vw, 25vw"
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-blue-300"><Cpu size={44} /></div>
        )}

        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          <DiscountBadge product={product} />
          {!inStock && (
            <span className="bg-gray-900/70 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-sm">
              {t.outOfStock}
            </span>
          )}
        </div>

        <button onClick={e => { e.preventDefault(); handleWish(); }}
          aria-label="wishlist"
          className={`absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center
            transition shadow-sm backdrop-blur
            ${isWished ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-400 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100'}`}>
          {!user ? <Lock size={13} /> : <Heart size={15} fill={isWished ? 'currentColor' : 'none'} />}
        </button>
      </Link>

      {/* Info */}
      <div className="p-3.5 pt-3 flex flex-col flex-1">
        {product.category && (
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 mb-0.5 truncate">
            {product.category}
          </span>
        )}
        <Link href={`/boutique/${product._id}`}>
          <h3 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2 min-h-[2.5rem]
                         hover:text-blue-700 transition">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-2.5 flex items-end justify-between gap-2">
          <PriceTag product={product} size="md" />
          <div className="flex gap-1.5 shrink-0">
            <a href={inStock ? whatsappUrl(waMsg) : undefined} target="_blank" rel="noreferrer"
              aria-label="WhatsApp"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition
                ${inStock ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-100 text-gray-300 pointer-events-none'}`}>
              <MessageCircle size={15} />
            </a>
            <button onClick={handleCart} disabled={!inStock} aria-label={t.addCart}
              title={!user ? t.login : inCart ? t.inCart : t.addCart}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition
                ${!inStock ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : inCart ? 'bg-green-100 text-green-700'
                  : 'bg-blue-700 hover:bg-blue-800 text-white shadow-md shadow-blue-200'}`}>
              {!user ? <Lock size={14} /> : inCart ? <Check size={16} /> : <ShoppingCart size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
