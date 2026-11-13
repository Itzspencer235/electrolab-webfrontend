'use client';
import { ReactNode, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert, Loader2, LayoutDashboard, Package, GraduationCap,
  ReceiptText, Users, PackageSearch,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';

/** Only admins can see /admin/*. (The API also checks the admin role.) */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const { lang } = useLang();
  const pathname  = usePathname();
  const tabsRef   = useRef<HTMLElement>(null);

  // Phone/tablet tab row: keep the current page's tab visible
  useEffect(() => {
    const el = tabsRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [pathname, lang, loading, isAdmin]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 size={32} className="text-blue-700 animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    const t = {
      fr: { title: 'Accès réservé', msg: 'Cette page est réservée aux administrateurs.',
            login: 'Se connecter', home: 'Retour à l\'accueil' },
      en: { title: 'Restricted', msg: 'This page is for administrators only.',
            login: 'Sign in', home: 'Back to home' },
      ar: { title: 'وصول مقيد', msg: 'هذه الصفحة مخصصة للمسؤولين فقط.',
            login: 'تسجيل الدخول', home: 'العودة للرئيسية' },
    }[lang];
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
          <ShieldAlert size={30} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-gray-800 mb-2">{t.title}</h1>
        <p className="text-gray-500 mb-6">{t.msg}</p>
        <Link href={user ? '/' : '/login?next=/admin'}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 text-white
                     font-bold rounded-2xl text-sm hover:bg-blue-800 transition">
          {user ? t.home : t.login}
        </Link>
      </div>
    );
  }

  const nav = [
    { href: '/admin',              icon: <LayoutDashboard size={18} />, label: { fr: 'Tableau de bord', en: 'Dashboard', ar: 'لوحة التحكم' } },
    { href: '/admin/produits',     icon: <Package size={18} />,         label: { fr: 'Produits',        en: 'Products',  ar: 'المنتجات' } },
    { href: '/admin/tutoriels',    icon: <GraduationCap size={18} />,   label: { fr: 'Tutoriels',       en: 'Tutorials', ar: 'الدروس' } },
    { href: '/admin/commandes',    icon: <ReceiptText size={18} />,     label: { fr: 'Commandes',       en: 'Orders',    ar: 'الطلبات' } },
    { href: '/admin/utilisateurs', icon: <Users size={18} />,           label: { fr: 'Utilisateurs',    en: 'Users',     ar: 'المستخدمون' } },
    { href: '/admin/demandes',     icon: <PackageSearch size={18} />,   label: { fr: 'Demandes',        en: 'Requests',  ar: 'طلبات المنتجات' } },
  ];
  const active = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname?.startsWith(href);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8 lg:flex lg:gap-6">
      {/* Desktop: sticky sidebar */}
      <aside className="hidden lg:block w-60 shrink-0">
        <nav className="sticky top-24 bg-white rounded-3xl border border-gray-100 shadow-sm p-3 space-y-1">
          <p className="px-3 pt-1 pb-2 text-xs font-black uppercase tracking-wider text-gray-400">Admin</p>
          {nav.map(n => (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition
                ${active(n.href)
                  ? 'bg-blue-700 text-white shadow-md shadow-blue-200'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
              {n.icon} {n.label[lang]}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile / tablet: scrollable tabs */}
      <nav ref={tabsRef} className="lg:hidden -mx-4 px-4 mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {nav.map(n => (
          <Link key={n.href} href={n.href} data-active={active(n.href) ? 'true' : 'false'}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold
                        whitespace-nowrap shrink-0 transition
              ${active(n.href)
                ? 'bg-blue-700 text-white shadow-md shadow-blue-200'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
            {n.icon} {n.label[lang]}
          </Link>
        ))}
      </nav>

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
