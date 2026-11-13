'use client';
import { useEffect, useState }  from 'react';
import { useRouter }            from 'next/navigation';
import Image                    from 'next/image';
import Link                     from 'next/link';
import {
  User, ShoppingBag, Heart, LogOut, Package,
  ChevronRight, Clock, MapPin, Phone, Mail,
  ShoppingCart, Check, X as XIcon, RefreshCw, PackageSearch,
} from 'lucide-react';
import { useAuth }     from '@/context/AuthContext';
import { useCart }     from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useLang }     from '@/context/LangContext';
import { formatPrice } from '@/lib/utils';
import API             from '@/lib/api';
import MyRequests      from '@/components/MyRequests';

type Tab = 'profile' | 'orders' | 'wishlist' | 'cart' | 'requests';

export default function ProfilPage() {
  const { user, token, logout, isAdmin } = useAuth();
  const cart     = useCart();
  const wishlist = useWishlist();
  const { lang } = useLang();
  const router   = useRouter();

  const [tab,     setTab]     = useState<Tab>('profile');
  const [orders,  setOrders]  = useState<any[]>([]);
  const [ordLoad, setOrdLoad] = useState(true);
  const [reqCount, setReqCount] = useState(0);

  // /profil?tab=requests opens a tab directly
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('tab');
    if (q && ['profile', 'orders', 'wishlist', 'cart', 'requests'].includes(q)) setTab(q as Tab);
  }, []);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!token) return;
    setOrdLoad(true);
    try {
      const { data } = await API.get('/orders/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(data);
    } catch {}
    setOrdLoad(false);
  };

  if (!user) return null;

  const t = {
    fr: {
      profile:  'Profil',    orders:   'Commandes',
      wishlist: 'Favoris',   cart:     'Panier',
      logout:   'Déconnexion',
      name:     'Nom',       email:    'Email',
      phone:    'Téléphone', role:     'Rôle',
      joined:   'Membre depuis',
      noOrders: 'Aucune commande pour l\'instant',
      noWish:   'Votre liste de souhaits est vide',
      noCart:   'Votre panier est vide',
      total:    'Total',     status:   'Statut',
      shop:     'Voir la boutique',
      addCart:  'Ajouter au panier',
      inCart:   'Dans le panier',
      adminBtn: 'Accès Admin',
      statuses: { pending: 'En attente', confirmed: 'Confirmée',
                  delivered: 'Livrée', cancelled: 'Annulée' },
    },
    en: {
      profile:  'Profile',   orders:   'Orders',
      wishlist: 'Wishlist',  cart:     'Cart',
      logout:   'Sign out',
      name:     'Name',      email:    'Email',
      phone:    'Phone',     role:     'Role',
      joined:   'Member since',
      noOrders: 'No orders yet',
      noWish:   'Your wishlist is empty',
      noCart:   'Your cart is empty',
      total:    'Total',     status:   'Status',
      shop:     'Visit shop',
      addCart:  'Add to cart',
      inCart:   'In cart',
      adminBtn: 'Admin access',
      statuses: { pending: 'Pending', confirmed: 'Confirmed',
                  delivered: 'Delivered', cancelled: 'Cancelled' },
    },
    ar: {
      profile:  'الملف الشخصي', orders: 'الطلبات',
      wishlist: 'المفضلة',       cart:   'السلة',
      logout:   'تسجيل الخروج',
      name:     'الاسم',         email:  'البريد',
      phone:    'الهاتف',        role:   'الدور',
      joined:   'عضو منذ',
      noOrders: 'لا توجد طلبات بعد',
      noWish:   'قائمة رغباتك فارغة',
      noCart:   'سلتك فارغة',
      total:    'المجموع',       status: 'الحالة',
      shop:     'تسوق الآن',
      addCart:  'أضف للسلة',
      inCart:   'في السلة',
      adminBtn: 'لوحة الإدارة',
      statuses: { pending: 'قيد الانتظار', confirmed: 'مؤكدة',
                  delivered: 'مسلّمة', cancelled: 'ملغية' },
    },
  }[lang];

  const statusColors: Record<string, string> = {
    pending:   'bg-orange-100 text-orange-700',
    confirmed: 'bg-blue-100 text-blue-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'profile',  label: t.profile,  icon: <User size={16} /> },
    { key: 'orders',   label: t.orders,   icon: <ShoppingBag size={16} />, badge: orders.length },
    { key: 'wishlist', label: t.wishlist, icon: <Heart size={16} />, badge: wishlist.count },
    { key: 'cart',     label: t.cart,     icon: <ShoppingCart size={16} />, badge: cart.count },
    { key: 'requests',
      label: lang === 'fr' ? 'Demandes' : lang === 'en' ? 'Requests' : 'طلباتي',
      icon: <PackageSearch size={16} />, badge: reqCount },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* ── Header card ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-3xl
                      text-white p-6 mb-6 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }} />

        <div className="relative flex items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            {user.avatar ? (
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/30">
                <Image src={user.avatar} alt={user.name}
                  width={80} height={80} className="object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/30
                              flex items-center justify-center">
                <span className="text-3xl font-black">
                  {user.name[0]?.toUpperCase()}
                </span>
              </div>
            )}
            {isAdmin && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white
                               text-xs font-black px-2 py-0.5 rounded-full shadow">
                Admin
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate">{user.name}</h1>
            <p className="text-blue-200 text-sm mt-0.5 truncate">
              {user.email || user.phone}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="bg-white/20 text-white text-xs font-semibold
                               px-3 py-1 rounded-full capitalize">
                {user.provider !== 'local' ? `via ${user.provider}` : t.role + ': ' + user.role}
              </span>
              {/* Stats */}
              <span className="bg-white/10 text-white text-xs px-3 py-1 rounded-full">
                🛒 {cart.count}
              </span>
              <span className="bg-white/10 text-white text-xs px-3 py-1 rounded-full">
                ❤️ {wishlist.count}
              </span>
              <span className="bg-white/10 text-white text-xs px-3 py-1 rounded-full">
                📦 {orders.length}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button onClick={() => { logout(); router.push('/'); }}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-white/10
                       hover:bg-white/20 border border-white/20 rounded-xl
                       text-sm font-semibold transition">
            <LogOut size={14} />
            <span className="hidden sm:inline">{t.logout}</span>
          </button>
        </div>

        {/* Admin link */}
        {isAdmin && (
          <div className="relative mt-4 pt-4 border-t border-white/20">
            <Link href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20
                         hover:bg-white/30 rounded-xl text-sm font-bold transition">
              ⚙️ {t.adminBtn}
              <ChevronRight size={14} />
            </Link>
          </div>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm
              font-semibold whitespace-nowrap transition shrink-0
              ${tab === tb.key
                ? 'bg-blue-700 text-white shadow-md shadow-blue-200'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
            {tb.icon}
            {tb.label}
            {(tb.badge ?? 0) > 0 && (
              <span className={`text-xs font-black px-1.5 py-0.5 rounded-full
                ${tab === tb.key ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                {tb.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────────── */}

      {/* PROFILE TAB */}
      {tab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personal info */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-black text-gray-800 text-base mb-4 flex items-center gap-2">
              <User size={16} className="text-blue-600" />
              {lang === 'fr' ? 'Informations personnelles'
               : lang === 'en' ? 'Personal information' : 'المعلومات الشخصية'}
            </h2>
            <div className="space-y-4">
              {[
                { label: t.name,  value: user.name,          icon: <User size={14} /> },
                { label: t.email, value: user.email || '—',  icon: <Mail size={14} /> },
                { label: t.phone, value: user.phone || '—',  icon: <Phone size={14} /> },
                { label: t.role,  value: user.role,          icon: <Check size={14} /> },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3 pb-4
                                        border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center
                                  justify-center text-blue-600 shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{f.label}</p>
                    <p className="text-gray-800 font-semibold text-sm capitalize">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="space-y-4">
            {[
              { label: t.orders,   val: orders.length,  icon: <Package size={20} />,   color: 'text-blue-600',   bg: 'bg-blue-50',   tab: 'orders'   as Tab },
              { label: t.wishlist, val: wishlist.count, icon: <Heart size={20} />,      color: 'text-red-500',    bg: 'bg-red-50',    tab: 'wishlist' as Tab },
              { label: t.cart,     val: cart.count,     icon: <ShoppingCart size={20}/>,color: 'text-green-600',  bg: 'bg-green-50',  tab: 'cart'     as Tab },
            ].map((s, i) => (
              <button key={i} onClick={() => setTab(s.tab)}
                className="w-full flex items-center gap-4 bg-white rounded-2xl
                           border border-gray-100 shadow-sm p-5 hover:shadow-md
                           hover:border-blue-200 transition text-left">
                <div className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center
                                 justify-center ${s.color} shrink-0`}>
                  {s.icon}
                </div>
                <div className="flex-1">
                  <p className="text-gray-500 text-sm">{s.label}</p>
                  <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {tab === 'orders' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-800 text-lg">
              {t.orders} ({orders.length})
            </h2>
            <button onClick={loadOrders}
              className="flex items-center gap-1.5 text-sm text-blue-700
                         hover:underline font-semibold">
              <RefreshCw size={14} />
              {lang === 'fr' ? 'Actualiser' : lang === 'en' ? 'Refresh' : 'تحديث'}
            </button>
          </div>

          {ordLoad ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
              <ShoppingBag size={48} className="mx-auto mb-4 text-gray-200" />
              <p className="text-gray-400 mb-4">{t.noOrders}</p>
              <Link href="/boutique"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700
                           text-white font-bold rounded-2xl text-sm hover:bg-blue-800 transition">
                {t.shop}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => {
                const date = order.createdAt
                  ? new Date(order.createdAt) : null;
                const status = order.status || 'pending';
                const products = order.products || [];

                return (
                  <div key={order._id}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm
                               overflow-hidden hover:shadow-md transition">
                    {/* Order header */}
                    <div className="flex items-center justify-between px-5 py-4
                                    border-b border-gray-100">
                      <div>
                        <p className="font-black text-gray-800 text-sm">
                          #{order._id?.toString().slice(-8).toUpperCase()}
                        </p>
                        {date && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock size={11} />
                            {date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full
                        ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
                        {t.statuses[status as keyof typeof t.statuses] || status}
                      </span>
                    </div>

                    {/* Products */}
                    <div className="px-5 py-3 space-y-2">
                      {products.slice(0, 3).map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 flex items-center gap-1.5">
                            <Package size={12} className="text-blue-400" />
                            {p.name || 'Produit'}
                            <span className="text-gray-400">x{p.quantity || 1}</span>
                          </span>
                          <span className="text-gray-500 text-xs">
                            {formatPrice((p.price || 0) * (p.quantity || 1))}
                          </span>
                        </div>
                      ))}
                      {products.length > 3 && (
                        <p className="text-xs text-blue-600 font-semibold">
                          +{products.length - 3} {lang === 'fr' ? 'autres' : 'more'}
                        </p>
                      )}
                    </div>

                    {/* Delivery info + total */}
                    <div className="px-5 py-4 bg-gray-50 flex flex-wrap items-center
                                    justify-between gap-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {order.user?.location && (
                          <p className="flex items-center gap-1">
                            <MapPin size={11} /> {order.user.location}
                          </p>
                        )}
                        {order.user?.phone && (
                          <p className="flex items-center gap-1">
                            <Phone size={11} /> {order.user.phone}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{t.total}</p>
                        <p className="font-black text-blue-700 text-base">
                          {formatPrice(order.totalPrice || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* WISHLIST TAB */}
      {tab === 'wishlist' && (
        <div>
          <h2 className="font-black text-gray-800 text-lg mb-4">
            {t.wishlist} ({wishlist.count})
          </h2>

          {wishlist.items.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
              <Heart size={48} className="mx-auto mb-4 text-gray-200" />
              <p className="text-gray-400 mb-4">{t.noWish}</p>
              <Link href="/boutique"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700
                           text-white font-bold rounded-2xl text-sm hover:bg-blue-800 transition">
                {t.shop}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlist.items.map(item => {
                const inCart = cart.isInCart(item.id);
                return (
                  <div key={item.id}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm
                               overflow-hidden hover:shadow-md transition">
                    {/* Image */}
                    <Link href={`/boutique/${item.id}`}
                      className="block relative h-40 bg-blue-50">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name}
                          fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-4xl">
                          🔌
                        </div>
                      )}
                      {/* Remove from wishlist */}
                      <button onClick={() => wishlist.remove(item.id)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white
                                   rounded-full flex items-center justify-center
                                   shadow hover:bg-red-600 transition">
                        <XIcon size={14} />
                      </button>
                    </Link>

                    {/* Info */}
                    <div className="p-4">
                      <Link href={`/boutique/${item.id}`}>
                        <h3 className="font-bold text-gray-800 text-sm line-clamp-2
                                       hover:text-blue-700 transition mb-1">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-blue-700 font-black">{formatPrice(item.price)}</p>
                      <button onClick={() => {
                        if (!inCart) {
                          cart.add(item);
                        }
                      }}
                        className={`w-full mt-3 flex items-center justify-center gap-1.5
                          py-2.5 rounded-2xl text-xs font-bold transition
                          ${inCart
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-700 hover:bg-blue-800 text-white'}`}>
                        <ShoppingCart size={13} />
                        {inCart ? t.inCart : t.addCart}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CART TAB */}
      {tab === 'cart' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-800 text-lg">
              {t.cart} ({cart.count})
            </h2>
            {cart.items.length > 0 && (
              <button onClick={() => cart.clear()}
                className="text-sm text-red-500 hover:underline font-semibold">
                {lang === 'fr' ? 'Vider le panier' : lang === 'en' ? 'Clear cart' : 'إفراغ السلة'}
              </button>
            )}
          </div>

          {cart.items.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
              <ShoppingCart size={48} className="mx-auto mb-4 text-gray-200" />
              <p className="text-gray-400 mb-4">{t.noCart}</p>
              <Link href="/boutique"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700
                           text-white font-bold rounded-2xl text-sm hover:bg-blue-800 transition">
                {t.shop}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.items.map(item => (
                <div key={item.id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm
                             p-4 flex gap-4 items-center hover:shadow-md transition">
                  {/* Image */}
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden
                                  bg-blue-50 shrink-0">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name}
                        fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center
                                      justify-center text-2xl">🔌</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/boutique/${item.id}`}>
                      <p className="font-bold text-gray-800 text-sm truncate
                                    hover:text-blue-700 transition">
                        {item.name}
                      </p>
                    </Link>
                    <p className="text-xs text-gray-400">{item.category}</p>
                    <p className="text-blue-700 font-black text-sm mt-0.5">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => cart.decrement(item.id)}
                      className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-xl
                                 flex items-center justify-center transition">
                      <span className="font-bold text-gray-600">−</span>
                    </button>
                    <span className="w-6 text-center font-black text-gray-800">
                      {item.quantity}
                    </span>
                    <button onClick={() => cart.increment(item.id)}
                      className="w-8 h-8 bg-blue-700 hover:bg-blue-800 rounded-xl
                                 flex items-center justify-center transition">
                      <span className="font-bold text-white">+</span>
                    </button>
                  </div>

                  {/* Remove */}
                  <button onClick={() => cart.remove(item.id)}
                    className="text-gray-300 hover:text-red-500 transition shrink-0">
                    <XIcon size={18} />
                  </button>
                </div>
              ))}

              {/* Total + WhatsApp order */}
              <div className="bg-white rounded-3xl border border-gray-100 p-5">
                {/* Breakdown */}
                {cart.items.map(item => (
                  <div key={item.id}
                    className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span className="truncate max-w-[200px]">
                      {item.name} ×{item.quantity}
                    </span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3 mt-3 flex
                                justify-between items-center mb-4">
                  <span className="font-black text-gray-800">{t.total}</span>
                  <span className="text-2xl font-black text-blue-700">
                    {formatPrice(cart.total)}
                  </span>
                </div>
                {/* Order via WhatsApp */}
                <a href={`https://wa.me/23500000000?text=${encodeURIComponent(
                  cart.items.map(i =>
                    `• ${i.name} x${i.quantity} = ${i.price * i.quantity} FCFA`
                  ).join('\n') + `\n\nTotal: ${cart.total} FCFA`
                )}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4
                             bg-green-500 hover:bg-green-600 text-white font-black
                             rounded-2xl transition">
                  💬 {lang === 'fr' ? 'Commander via WhatsApp' : lang === 'en' ? 'Order via WhatsApp' : 'اطلب عبر واتساب'}
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REQUESTS TAB — always mounted so the badge count loads */}
      <div className={tab === 'requests' ? '' : 'hidden'}>
        <MyRequests token={token} onCount={setReqCount} />
      </div>
    </div>
  );
}