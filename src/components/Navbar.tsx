'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Menu, X, ShoppingCart, Heart, Globe,
  User, LogOut, ChevronDown,
} from 'lucide-react';
import { useLang }     from '@/context/LangContext';
import { useAuth }     from '@/context/AuthContext';
import { useCart }     from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { NAV_LINKS, WHATSAPP_NUMBER } from '@/lib/constants';
import type { Lang } from '@/lib/constants';
import logo from '@/assets/images/logo.png';

export default function Navbar() {
  const { lang, setLang }  = useLang();
  const { user, logout, isAdmin } = useAuth();
  const cart     = useCart();
  const wishlist = useWishlist();
  const router   = useRouter();
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const links = NAV_LINKS[lang];

  const t = {
    fr: { login: 'Connexion', register: 'Inscription', profile: 'Mon profil',
          orders: 'Mes commandes', admin: 'Admin', logout: 'Déconnexion' },
    en: { login: 'Login', register: 'Register', profile: 'My profile',
          orders: 'My orders', admin: 'Admin', logout: 'Logout' },
    ar: { login: 'دخول', register: 'تسجيل', profile: 'حسابي',
          orders: 'طلباتي', admin: 'إدارة', logout: 'خروج' },
  }[lang];

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white border-b border-blue-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src={logo}
            alt="IP ElectroLab"
            height={50}
            className="h-9 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600
                         hover:text-blue-700 hover:bg-blue-50 transition whitespace-nowrap">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">

          {/* Language switcher */}
          <div className="relative group">
            <button className="flex items-center gap-1 px-2 py-2 rounded-lg
                               text-sm text-gray-600 hover:bg-blue-50 transition">
              <Globe size={15} />
              <span className="uppercase font-bold text-xs">{lang}</span>
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100
                            rounded-xl shadow-lg py-1 w-36 opacity-0 invisible
                            group-hover:opacity-100 group-hover:visible transition-all z-50">
              {(['fr', 'en', 'ar'] as Lang[]).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`block w-full px-4 py-2 text-sm text-left hover:bg-blue-50
                              ${lang === l ? 'text-blue-700 font-bold' : 'text-gray-600'}`}>
                  {l === 'fr' ? '🇫🇷 Français' : l === 'en' ? '🇬🇧 English' : '🇸🇦 العربية'}
                </button>
              ))}
            </div>
          </div>

          {/* Wishlist */}
          <button onClick={() => wishlist.setOpen(true)}
            className="relative p-2 rounded-lg text-gray-600 hover:bg-red-50
                       hover:text-red-500 transition">
            <Heart size={20} />
            {wishlist.count > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white
                               text-xs rounded-full flex items-center justify-center font-bold">
                {wishlist.count > 9 ? '9+' : wishlist.count}
              </span>
            )}
          </button>

          {/* Cart */}
          <button onClick={() => cart.setOpen(true)}
            className="relative p-2 rounded-lg text-gray-600 hover:bg-blue-50
                       hover:text-blue-700 transition">
            <ShoppingCart size={20} />
            {cart.count > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-blue-700 text-white
                               text-xs rounded-full flex items-center justify-center font-bold">
                {cart.count > 9 ? '9+' : cart.count}
              </span>
            )}
          </button>

          {/* User menu */}
          {user ? (
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                           bg-blue-50 hover:bg-blue-100 transition">
                <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center
                                justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                  {user.avatar
                    ? <img src={user.avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
                    : user.name[0].toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-blue-900 hidden sm:block max-w-20 truncate">
                  {user.name}
                </span>
                <ChevronDown size={14} className="text-blue-700" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100
                                  rounded-2xl shadow-xl py-2 w-48 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-semibold text-gray-800 text-sm truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email || user.phone}</p>
                      {isAdmin && (
                        <span className="text-xs bg-blue-700 text-white px-2 py-0.5
                                         rounded-full font-bold mt-1 inline-block">Admin</span>
                      )}
                    </div>
                    <Link href="/profil" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700
                                 hover:bg-blue-50 hover:text-blue-700 transition">
                      <User size={15} /> {t.profile}
                    </Link>
                    <Link href="/profil?tab=orders" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700
                                 hover:bg-blue-50 hover:text-blue-700 transition">
                      <ShoppingCart size={15} /> {t.orders}
                    </Link>
                    <button onClick={() => { logout(); setUserMenuOpen(false); router.push('/'); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm
                                 text-red-500 hover:bg-red-50 transition">
                      <LogOut size={15} /> {t.logout}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/login"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800
                         text-white text-sm font-bold rounded-xl transition">
              <User size={15} />
              <span className="hidden sm:block">{t.login}</span>
            </Link>
          )}

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-blue-50 transition">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 rounded-xl text-gray-700
                         hover:bg-blue-50 hover:text-blue-700 font-medium transition">
              {l.label}
            </Link>
          ))}
          {!user && (
            <Link href="/login" onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 rounded-xl bg-blue-700 text-white
                         font-bold text-center mt-2">
              {t.login}
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}