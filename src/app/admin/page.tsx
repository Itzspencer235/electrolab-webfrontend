'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PackageSearch, ChevronRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';
import { getAllProductRequests } from '@/lib/api';

/** Admin home. Other admin sections can be added to `sections` later. */
export default function AdminHome() {
  const { user, token } = useAuth();
  const { lang } = useLang();
  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    getAllProductRequests(token)
      .then(list => setPending(list.filter(r => r.status === 'pending').length))
      .catch(() => setPending(null));
  }, [token]);

  const t = {
    fr: { title: 'Administration', welcome: 'Bienvenue', pending: 'en attente' },
    en: { title: 'Admin panel',    welcome: 'Welcome',   pending: 'pending' },
    ar: { title: 'لوحة الإدارة',   welcome: 'مرحباً',    pending: 'قيد الانتظار' },
  }[lang];

  const sections = [
    {
      href: '/admin/demandes',
      icon: <PackageSearch size={26} />,
      color: 'text-red-500', bg: 'bg-red-50',
      title: { fr: 'Demandes de produits', en: 'Product requests', ar: 'طلبات المنتجات' }[lang],
      sub: { fr: 'Voir · Répondre · Lier un produit', en: 'View · Reply · Link a product',
             ar: 'عرض · رد · ربط منتج' }[lang],
      badge: pending,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-3xl
                      text-white p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }} />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30
                          flex items-center justify-center shrink-0">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black">{t.title}</h1>
            <p className="text-blue-200 text-sm mt-0.5">{t.welcome}, {user?.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(s => (
          <Link key={s.href} href={s.href}
            className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100
                       shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition">
            <div className={`w-14 h-14 ${s.bg} rounded-2xl flex items-center justify-center
                             ${s.color} shrink-0`}>
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-800">{s.title}</p>
              <p className="text-gray-500 text-sm">{s.sub}</p>
            </div>
            {(s.badge ?? 0) > 0 && (
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
                {s.badge} {t.pending}
              </span>
            )}
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}
