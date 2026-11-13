'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';

/** Only admins can see /admin/*. (The API also checks the admin role.) */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const { lang } = useLang();

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

  return <>{children}</>;
}
