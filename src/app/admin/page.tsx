'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, RefreshCw, Package, GraduationCap, ReceiptText, Users,
  Wallet, PieChart, Heart, ShoppingCart, History, PackageSearch, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';
import { formatPrice } from '@/lib/utils';
import { getAllProductRequests, apiError } from '@/lib/api';
import {
  getStats, tr, orderStatusLabel, orderStatusColor, ORDER_STATUSES,
  type AdminStats, type OrderStatus,
} from '@/lib/adminApi';
import { PageHeader, Card, Skeleton, Alert, btnGhost } from '@/components/admin/ui';

const BAR: Record<OrderStatus, string> = {
  pending: 'bg-orange-500', confirmed: 'bg-blue-600', delivered: 'bg-green-600', cancelled: 'bg-red-500',
};

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const { lang } = useLang();
  const [stats,   setStats]   = useState<AdminStats | null>(null);
  const [pending, setPending] = useState(0);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const [s, reqs] = await Promise.all([
        getStats(token),
        getAllProductRequests(token).catch(() => []),
      ]);
      setStats(s);
      setPending(reqs.filter(r => r.status === 'pending').length);
    } catch (e) {
      setError(apiError(e, 'Erreur'));
    }
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [token]);

  const totals = stats?.totals;
  const byStatus = stats?.ordersByStatus || {};
  const orderTotal = ORDER_STATUSES.reduce((a, s) => a + (byStatus[s] || 0), 0);

  const cards = [
    { label: tr(lang, 'Produits', 'Products', 'المنتجات'),        val: totals?.products,  icon: <Package size={20} />,       color: 'text-blue-600',   bg: 'bg-blue-50',   href: '/admin/produits' },
    { label: tr(lang, 'Tutoriels', 'Tutorials', 'الدروس'),        val: totals?.tutorials, icon: <GraduationCap size={20} />, color: 'text-green-600',  bg: 'bg-green-50',  href: '/admin/tutoriels' },
    { label: tr(lang, 'Commandes', 'Orders', 'الطلبات'),          val: totals?.orders,    icon: <ReceiptText size={20} />,   color: 'text-orange-600', bg: 'bg-orange-50', href: '/admin/commandes' },
    { label: tr(lang, 'Clients', 'Customers', 'العملاء'),         val: totals?.users,     icon: <Users size={20} />,         color: 'text-indigo-600', bg: 'bg-indigo-50', href: '/admin/utilisateurs' },
  ];

  return (
    <div>
      <PageHeader
        title={tr(lang, 'Tableau de bord', 'Dashboard', 'لوحة التحكم')}
        subtitle={`${tr(lang, 'Bienvenue', 'Welcome', 'مرحباً')}, ${user?.name || 'Admin'}`}
        icon={<LayoutDashboard size={22} />}
        actions={<button onClick={load} className={btnGhost}><RefreshCw size={14} /> {tr(lang, 'Actualiser', 'Refresh', 'تحديث')}</button>}
      />

      {error && <div className="mb-4"><Alert kind="error">{error}</Alert></div>}

      {loading && !stats ? <Skeleton rows={4} h="h-28" /> : stats && (
        <div className="space-y-6">
          {/* Revenue */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-3xl text-white p-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Wallet size={26} />
              </div>
              <div className="min-w-0">
                <p className="text-blue-200 text-sm">{tr(lang, 'Chiffre d\'affaires', 'Revenue', 'الإيرادات')}</p>
                <p className="text-2xl sm:text-3xl font-black break-words">{formatPrice(totals?.revenue || 0)}</p>
                <p className="text-blue-200 text-xs">{tr(lang, 'Commandes confirmées + livrées', 'Confirmed + delivered orders', 'الطلبات المؤكدة + المسلّمة')}</p>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {cards.map(c => (
              <Link key={c.href} href={c.href}
                className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4
                           hover:shadow-md hover:border-blue-200 transition min-w-0">
                <div className={`w-11 h-11 ${c.bg} ${c.color} rounded-2xl flex items-center justify-center shrink-0`}>{c.icon}</div>
                <div className="min-w-0">
                  <p className={`text-2xl font-black ${c.color}`}>{c.val ?? 0}</p>
                  <p className="text-gray-500 text-xs truncate">{c.label}</p>
                </div>
              </Link>
            ))}
          </div>

          {pending > 0 && (
            <Link href="/admin/demandes"
              className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-2xl
                         text-orange-800 hover:bg-orange-100 transition">
              <PackageSearch size={20} className="shrink-0" />
              <span className="flex-1 text-sm font-semibold">
                {pending} {tr(lang, 'demande(s) de produit en attente de réponse', 'product request(s) waiting for a reply', 'طلب منتج بانتظار الرد')}
              </span>
              <ChevronRight size={16} />
            </Link>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Orders by status */}
            <Card className="p-5 sm:p-6">
              <h2 className="font-black text-gray-800 mb-4 flex items-center gap-2">
                <PieChart size={16} className="text-blue-600" /> {tr(lang, 'Statuts des commandes', 'Orders by status', 'حالات الطلبات')}
              </h2>
              <div className="space-y-3">
                {ORDER_STATUSES.map(s => {
                  const n = byStatus[s] || 0;
                  const pct = orderTotal ? Math.round((n / orderTotal) * 100) : 0;
                  return (
                    <div key={s}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700">{orderStatusLabel[s][lang]}</span>
                        <span className="font-bold text-gray-800">{n} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${BAR[s]} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Recent orders */}
            <Card className="p-5 sm:p-6">
              <h2 className="font-black text-gray-800 mb-4 flex items-center gap-2">
                <History size={16} className="text-blue-600" /> {tr(lang, 'Commandes récentes', 'Recent orders', 'أحدث الطلبات')}
              </h2>
              {stats.recentOrders.length === 0 ? (
                <p className="text-sm text-gray-400">{tr(lang, 'Aucune commande', 'No orders', 'لا توجد طلبات')}</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {stats.recentOrders.map((o: any) => (
                    <div key={o._id} className="flex items-center gap-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{o.user?.name || '—'}</p>
                        <p className="text-xs text-gray-400">
                          #{String(o._id).slice(-8).toUpperCase()} · {new Date(o.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                        </p>
                      </div>
                      <span className="text-sm font-black text-blue-700 whitespace-nowrap">{formatPrice(o.totalPrice || 0)}</span>
                      <span className={`hidden sm:inline text-xs font-bold px-2.5 py-1 rounded-full ${orderStatusColor[o.status as OrderStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {orderStatusLabel[o.status as OrderStatus]?.[lang] || o.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <TopList
              title={tr(lang, 'Produits les + ajoutés aux favoris', 'Most wishlisted products', 'الأكثر إضافة للمفضلة')}
              icon={<Heart size={16} className="text-red-500" />}
              items={stats.topWishlisted.map(i => ({ name: i.name, value: `${i.count}` }))}
              empty={tr(lang, 'Aucune donnée', 'No data', 'لا توجد بيانات')}
            />
            <TopList
              title={tr(lang, 'Produits les + ajoutés au panier', 'Most added to cart', 'الأكثر إضافة للسلة')}
              icon={<ShoppingCart size={16} className="text-green-600" />}
              items={stats.topCarted.map(i => ({
                name: i.name,
                value: `${i.count}`,
                sub: `${i.totalQty} ${tr(lang, 'unités', 'units', 'وحدة')}`,
              }))}
              empty={tr(lang, 'Aucune donnée', 'No data', 'لا توجد بيانات')}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TopList({ title, icon, items, empty }: {
  title: string; icon: React.ReactNode; empty: string;
  items: { name: string; value: string; sub?: string }[];
}) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-black text-gray-800 mb-4 flex items-center gap-2">{icon} {title}</h2>
      {items.length === 0 ? <p className="text-sm text-gray-400">{empty}</p> : (
        <ol className="space-y-2.5">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="flex-1 min-w-0 text-sm text-gray-700 truncate">{it.name || '—'}</span>
              {it.sub && <span className="text-xs text-gray-400 whitespace-nowrap">{it.sub}</span>}
              <span className="text-sm font-black text-gray-800">{it.value}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
