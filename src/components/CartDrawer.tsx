'use client';
import { X, Plus, Minus, Trash2, ShoppingBag, MessageCircle } from 'lucide-react';
import { useCart }     from '@/context/CartContext';
import { useAuth }     from '@/context/AuthContext';
import { useLang }     from '@/context/LangContext';
import { formatPrice, whatsappUrl } from '@/lib/utils';
import Image from 'next/image';
import Link  from 'next/link';

export default function CartDrawer() {
  const { items, count, total, remove, increment, decrement, clear, open, setOpen } = useCart();
  const { user } = useAuth();
  const { lang } = useLang();

  const t = {
    fr: { title: 'Panier', empty: 'Votre panier est vide', shop: 'Voir la boutique',
          total: 'Total', order: 'Commander via WhatsApp', clear: 'Vider', items: 'article(s)' },
    en: { title: 'Cart',   empty: 'Your cart is empty',   shop: 'Visit shop',
          total: 'Total',  order: 'Order via WhatsApp',   clear: 'Clear', items: 'item(s)' },
    ar: { title: 'السلة', empty: 'سلتك فارغة',            shop: 'تسوق الآن',
          total: 'المجموع', order: 'اطلب عبر واتساب',     clear: 'إفراغ', items: 'منتج' },
  }[lang];

  const waMsg = () => {
    const lines = items.map(i => `• ${i.name} x${i.quantity} = ${i.price * i.quantity} FCFA`).join('\n');
    return {
      fr: `Bonjour IP ElectroLab ! Je souhaite commander :\n\n${lines}\n\nTotal : ${total} FCFA`,
      en: `Hello IP ElectroLab! I want to order:\n\n${lines}\n\nTotal: ${total} FCFA`,
      ar: `مرحباً IP ElectroLab! أريد طلب:\n\n${lines}\n\nالمجموع: ${total} FCFA`,
    }[lang]!;
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
           onClick={() => setOpen(false)} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50
                      shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4
                        bg-blue-700 text-white shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} />
            <span className="font-bold text-lg">{t.title}</span>
            {count > 0 && (
              <span className="bg-white text-blue-700 text-xs font-black
                               px-2 py-0.5 rounded-full">
                {count} {t.items}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button onClick={clear}
                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5
                           rounded-lg font-semibold transition">
                {t.clear}
              </button>
            )}
            <button onClick={() => setOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center">
                <ShoppingBag size={36} className="text-blue-300" />
              </div>
              <p className="text-gray-400 font-medium">{t.empty}</p>
              <Link href="/boutique" onClick={() => setOpen(false)}
                className="px-6 py-2.5 bg-blue-700 text-white font-bold
                           rounded-xl text-sm hover:bg-blue-800 transition">
                {t.shop}
              </Link>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id}
                className="flex gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                {/* Image */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden
                                bg-blue-50 shrink-0">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name}
                      fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">
                      🔌
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.category}</p>
                  <p className="text-blue-700 font-bold text-sm mt-1">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-end justify-between shrink-0">
                  <button onClick={() => remove(item.id)}
                    className="p-1 hover:text-red-500 text-gray-400 transition">
                    <Trash2 size={14} />
                  </button>
                  <div className="flex items-center gap-1 bg-white border
                                  border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => decrement(item.id)}
                      className="w-7 h-7 flex items-center justify-center
                                 hover:bg-blue-50 text-blue-700 transition">
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-gray-800">
                      {item.quantity}
                    </span>
                    <button onClick={() => increment(item.id)}
                      className="w-7 h-7 flex items-center justify-center
                                 hover:bg-blue-50 text-blue-700 transition">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-4 py-4 border-t border-gray-100 bg-white shrink-0 space-y-3">
            {/* Breakdown */}
            <div className="space-y-1">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-xs text-gray-400">
                  <span className="truncate max-w-[200px]">
                    {item.name} x{item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2
                            border-t border-gray-100">
              <span className="font-bold text-gray-800">{t.total}</span>
              <span className="text-xl font-black text-blue-700">
                {formatPrice(total)}
              </span>
            </div>
            {/* WhatsApp order */}
            <a href={whatsappUrl(waMsg())} target="_blank" rel="noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3.5
                         bg-green-500 hover:bg-green-600 text-white font-bold
                         rounded-2xl transition text-sm">
              <MessageCircle size={18} />
              {t.order}
            </a>
          </div>
        )}
      </div>
    </>
  );
}