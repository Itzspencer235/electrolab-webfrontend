'use client';
import { useState, useEffect } from 'react';
import { useRouter }  from 'next/navigation';
import Link           from 'next/link';
import { Eye, EyeOff, LogIn, Phone, Mail, RefreshCw } from 'lucide-react';
import { useAuth }     from '@/context/AuthContext';
import { useCart }     from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useLang }     from '@/context/LangContext';

declare global {
  interface Window { FB: any; fbAsyncInit: any; google: any; }
}

const GOOGLE_CLIENT_ID  = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID  || '';
const FACEBOOK_APP_ID   = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID   || '';
const hasGoogle   = !!GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('your_');
const hasFacebook = !!FACEBOOK_APP_ID  && !FACEBOOK_APP_ID.includes('your_');

export default function LoginPage() {
  const { login, loginWithGoogle, loginWithFacebook } = useAuth();
  const cart     = useCart();
  const wishlist = useWishlist();
  const { lang } = useLang();
  const router   = useRouter();

  const [usePhone,  setUsePhone]  = useState(false);
  const [value,     setValue]     = useState('');
  const [password,  setPassword]  = useState('');
  const [obscure,   setObscure]   = useState(true);
  const [loading,   setLoading]   = useState(false);
  const [gLoading,  setGLoading]  = useState(false);
  const [fbLoading, setFbLoading] = useState(false);
  const [error,     setError]     = useState('');

  const t = {
    fr: {
      title: 'Connexion', sub: 'Bienvenue sur IP ElectroLab',
      email: 'Email', phone: 'Téléphone', password: 'Mot de passe',
      btn: 'Se connecter', noAccount: 'Pas de compte ?',
      register: 'S\'inscrire', guest: 'Continuer sans compte',
      togglePhone: 'Utiliser le téléphone', toggleEmail: 'Utiliser l\'email',
      or: 'ou continuer avec', google: 'Continuer avec Google',
      facebook: 'Continuer avec Facebook',
    },
    en: {
      title: 'Sign In', sub: 'Welcome back to IP ElectroLab',
      email: 'Email', phone: 'Phone', password: 'Password',
      btn: 'Sign in', noAccount: 'No account?',
      register: 'Register', guest: 'Continue without account',
      togglePhone: 'Use phone number', toggleEmail: 'Use email',
      or: 'or continue with', google: 'Continue with Google',
      facebook: 'Continue with Facebook',
    },
    ar: {
      title: 'تسجيل الدخول', sub: 'مرحباً بعودتك',
      email: 'البريد الإلكتروني', phone: 'الهاتف', password: 'كلمة المرور',
      btn: 'دخول', noAccount: 'ليس لديك حساب؟',
      register: 'إنشاء حساب', guest: 'متابعة بدون حساب',
      togglePhone: 'استخدام الهاتف', toggleEmail: 'استخدام البريد',
      or: 'أو تابع عبر', google: 'المتابعة مع Google',
      facebook: 'المتابعة مع Facebook',
    },
  }[lang];

  // ── Load Facebook SDK ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasFacebook) return;
    window.fbAsyncInit = () => {
      window.FB.init({
        appId: FACEBOOK_APP_ID, cookie: true,
        xfbml: true, version: 'v18.0',
      });
    };
    if (!document.getElementById('fb-sdk')) {
      const s = document.createElement('script');
      s.id = 'fb-sdk';
      s.src = 'https://connect.facebook.net/en_US/sdk.js';
      s.async = true; s.crossOrigin = 'anonymous';
      document.body.appendChild(s);
    }
  }, []);

  // ── After successful login ─────────────────────────────────────────────────
  const onSuccess = async () => {
    const token = localStorage.getItem('el_token');
    if (token) {
      await Promise.all([
        cart.loadFromServer(token),
        wishlist.loadFromServer(token),
      ]);
    }
    router.back();
  };

  // ── Email / phone login ────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const err = await login(
      usePhone ? null : value,
      usePhone ? value : null,
      password,
    );
    setLoading(false);
    if (err) { setError(err); return; }
    await onSuccess();
  };

  // ── Google login ───────────────────────────────────────────────────────────
  const handleGoogle = () => {
    if (!hasGoogle) {
      setError('Google login non configuré'); return;
    }
    setGLoading(true); setError('');

    // Load Google Identity Services dynamically
    const loadAndLogin = () => {
      if (!window.google) {
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.onload = () => openGooglePopup();
        document.body.appendChild(s);
      } else {
        openGooglePopup();
      }
    };

    const openGooglePopup = () => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile',
        callback: async (response: any) => {
          if (response.error) {
            setError('Connexion Google échouée');
            setGLoading(false); return;
          }
          const err = await loginWithGoogle(response.access_token);
          setGLoading(false);
          if (err) { setError(err); return; }
          await onSuccess();
        },
      });
      client.requestAccessToken();
    };

    loadAndLogin();
  };

  // ── Facebook login ─────────────────────────────────────────────────────────
  const handleFacebook = () => {
    if (!hasFacebook) {
      setError('Facebook login non configuré'); return;
    }
    if (!window.FB) { setError('Facebook SDK pas encore chargé'); return; }
    setFbLoading(true); setError('');

    window.FB.login(async (response: any) => {
      if (response.authResponse) {
        const { accessToken, userID } = response.authResponse;
        const err = await loginWithFacebook(accessToken, userID);
        setFbLoading(false);
        if (err) { setError(err); return; }
        await onSuccess();
      } else {
        setError('Connexion Facebook annulée');
        setFbLoading(false);
      }
    }, { scope: 'email,public_profile' });
  };

  const showSocial = hasGoogle || hasFacebook;

  return (
    <div className="min-h-screen flex items-center justify-center
                    px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center
                          justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <span className="text-white font-black text-xl">IP</span>
          </div>
          <h1 className="text-2xl font-black text-gray-800">{t.title}</h1>
          <p className="text-gray-400 mt-1 text-sm">{t.sub}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {/* Error */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-100
                            rounded-2xl text-red-600 text-sm">
              ❌ {error}
            </div>
          )}

          {/* Social buttons */}
          {showSocial && (
            <>
              <div className="space-y-3 mb-6">
                {hasGoogle && (
                  <button onClick={handleGoogle} disabled={gLoading || loading}
                    className="w-full flex items-center justify-center gap-3
                               py-3.5 border-2 border-gray-200 rounded-2xl
                               font-semibold text-gray-700 hover:bg-gray-50
                               hover:border-gray-300 transition
                               disabled:opacity-50 disabled:cursor-not-allowed">
                    {gLoading ? (
                      <RefreshCw size={18} className="animate-spin text-blue-600" />
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" className="w-5 h-5">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {t.google}
                      </>
                    )}
                  </button>
                )}

                {hasFacebook && (
                  <button onClick={handleFacebook} disabled={fbLoading || loading}
                    className="w-full flex items-center justify-center gap-3
                               py-3.5 bg-[#1877F2] hover:bg-[#166FE5] rounded-2xl
                               font-semibold text-white transition
                               disabled:opacity-50 disabled:cursor-not-allowed">
                    {fbLoading ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        {t.facebook}
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-gray-400 text-xs font-medium">{t.or}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </>
          )}

          {/* Email / phone form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {usePhone ? <Phone size={16} /> : <Mail size={16} />}
                </div>
                <input
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  type={usePhone ? 'tel' : 'email'}
                  placeholder={usePhone ? t.phone : t.email}
                  className="w-full pl-11 pr-4 py-4 border border-gray-200
                             rounded-2xl text-sm outline-none
                             focus:border-blue-400 focus:ring-2
                             focus:ring-blue-100 transition"
                  required
                />
              </div>
              <button type="button"
                onClick={() => { setUsePhone(!usePhone); setValue(''); }}
                className="text-xs text-blue-700 mt-2 hover:underline font-medium">
                {usePhone ? t.toggleEmail : t.togglePhone}
              </button>
            </div>

            <div className="relative">
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type={obscure ? 'password' : 'text'}
                placeholder={t.password}
                className="w-full px-4 py-4 border border-gray-200 rounded-2xl
                           text-sm outline-none focus:border-blue-400
                           focus:ring-2 focus:ring-blue-100 transition pr-12"
                required
              />
              <button type="button" onClick={() => setObscure(!obscure)}
                className="absolute right-4 top-1/2 -translate-y-1/2
                           text-gray-400 hover:text-gray-600 transition">
                {obscure ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>

            <button type="submit" disabled={loading || gLoading || fbLoading}
              className="w-full flex items-center justify-center gap-2 py-4
                         bg-blue-700 hover:bg-blue-800 disabled:bg-gray-200
                         text-white font-bold rounded-2xl transition">
              {loading
                ? <RefreshCw size={16} className="animate-spin" />
                : <><LogIn size={16} /> {t.btn}</>}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-500">
              {t.noAccount}{' '}
              <Link href="/register"
                className="text-blue-700 font-bold hover:underline">
                {t.register}
              </Link>
            </p>
            <button onClick={() => router.back()}
              className="text-xs text-gray-400 hover:text-gray-600 transition">
              {t.guest}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}