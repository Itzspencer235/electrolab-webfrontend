'use client';
import { X, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart }     from '@/context/CartContext';
import { useLang }     from '@/context/LangContext';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import Link  from 'next/link';

export default function WishlistDrawer() {
  const wishlist = useWishlist();
  const cart     = useCart();
  const { lang } = useLang();

  const t = {
    fr: { title: 'Favoris', empty: 'Votre liste est vide', shop: 'Voir la boutique',
          add: 'Ajouter au panier', inCart: 'Dans le panier' },
    en: { title: 'Wishlist', empty: 'Your wishlist is empty', shop: 'Visit shop',
          add: 'Add to cart', inCart: 'In cart' },
    ar: { title: 'المفضلة', empty: 'قائمتك فارغة', shop: 'تسوق الآن',
          add: 'أضف للسلة', inCart: 'في السلة' },
  }[lang];

  if (!wishlist.open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
           onClick={() => wishlist.setOpen(false)} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white
                      z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4
                        bg-red-500 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Heart size={20} />
            <span className="font-bold text-lg">{t.title}</span>
            {wishlist.count > 0 && (
              <span className="bg-white text-red-500 text-xs font-black
                               px-2 py-0.5 rounded-full">
                {wishlist.count}
              </span>
            )}
          </div>
          <button onClick={() => wishlist.setOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {wishlist.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center">
                <Heart size={36} className="text-red-200" />
              </div>
              <p className="text-gray-400 font-medium">{t.empty}</p>
              <Link href="/boutique" onClick={() => wishlist.setOpen(false)}
                className="px-6 py-2.5 bg-blue-700 text-white font-bold
                           rounded-xl text-sm hover:bg-blue-800 transition">
                {t.shop}
              </Link>
            </div>
          ) : (
            wishlist.items.map(item => {
              const inCart = cart.isInCart(item.id);
              return (
                <div key={item.id}
                  className="flex gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                  {/* Image */}
                  <Link href={`/boutique/${item.id}`}
                    onClick={() => wishlist.setOpen(false)}
                    className="relative w-16 h-16 rounded-xl overflow-hidden bg-blue-50 shrink-0">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name}
                        fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-2xl">
                        🔌
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/boutique/${item.id}`}
                      onClick={() => wishlist.setOpen(false)}>
                      <p className="font-semibold text-gray-800 text-sm
                                    truncate hover:text-blue-700 transition">
                        {item.name}
                      </p>
                    </Link>
                    <p className="text-xs text-gray-400">{item.category}</p>
                    <p className="text-blue-700 font-bold text-sm mt-1">
                      {formatPrice(item.price)}
                    </p>
                    {/* Add to cart */}
                    <button onClick={() => {
                      if (!inCart) cart.add(item);
                    }}
                      className={`mt-2 flex items-center gap-1 text-xs font-bold
                        px-3 py-1.5 rounded-lg transition
                        ${inCart
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-700 text-white hover:bg-blue-800'}`}>
                      <ShoppingCart size={11} />
                      {inCart ? t.inCart : t.add}
                    </button>
                  </div>

                  {/* Remove */}
                  <button onClick={() => wishlist.toggle(item)}
                    className="p-1.5 text-red-400 hover:text-red-600
                               hover:bg-red-50 rounded-lg transition shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}