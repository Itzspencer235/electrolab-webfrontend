'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const { lang }     = useLang();
  const router       = useRouter();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [obscure,  setObscure]  = useState(true);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const t = {
    fr: { title: 'Créer un compte', name: 'Nom complet *', email: 'Email',
          phone: 'Téléphone', password: 'Mot de passe *', confirm: 'Confirmer *',
          btn: 'Créer mon compte', hasAccount: 'Déjà un compte ?', login: 'Se connecter' },
    en: { title: 'Create account', name: 'Full name *', email: 'Email',
          phone: 'Phone', password: 'Password *', confirm: 'Confirm *',
          btn: 'Create my account', hasAccount: 'Already have an account?', login: 'Sign in' },
    ar: { title: 'إنشاء حساب', name: 'الاسم الكامل *', email: 'البريد الإلكتروني',
          phone: 'الهاتف', password: 'كلمة المرور *', confirm: 'تأكيد *',
          btn: 'إنشاء حسابي', hasAccount: 'لديك حساب بالفعل؟', login: 'تسجيل الدخول' },
  }[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Nom requis'); return; }
    if (!email && !phone) { setError('Email ou téléphone requis'); return; }
    if (password.length < 6) { setError('Mot de passe: 6 caractères minimum'); return; }
    if (password !== confirm) { setError('Mots de passe différents'); return; }
    setLoading(true);
    const err = await register(name, email || null, phone || null, password);
    setLoading(false);
    if (err) { setError(err); return; }
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center
                          justify-center mx-auto mb-4">
            <span className="text-white font-black text-xl">IP</span>
          </div>
          <h1 className="text-2xl font-black text-gray-800">{t.title}</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl
                            text-red-600 text-sm">❌ {error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { val: name,     set: setName,     ph: t.name,     type: 'text' },
              { val: email,    set: setEmail,    ph: t.email,    type: 'email' },
              { val: phone,    set: setPhone,    ph: t.phone,    type: 'tel' },
            ].map((f, i) => (
              <input key={i}
                value={f.val} onChange={e => f.set(e.target.value)}
                type={f.type} placeholder={f.ph}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl
                           text-sm outline-none focus:border-blue-400
                           focus:ring-2 focus:ring-blue-100 transition"
              />
            ))}

            {/* Password */}
            <div className="relative">
              <input value={password} onChange={e => setPassword(e.target.value)}
                type={obscure ? 'password' : 'text'} placeholder={t.password}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl
                           text-sm outline-none focus:border-blue-400
                           focus:ring-2 focus:ring-blue-100 transition pr-11" />
              <button type="button" onClick={() => setObscure(!obscure)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {obscure ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <input value={confirm} onChange={e => setConfirm(e.target.value)}
              type={obscure ? 'password' : 'text'} placeholder={t.confirm}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl
                         text-sm outline-none focus:border-blue-400
                         focus:ring-2 focus:ring-blue-100 transition" />

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5
                         bg-blue-700 hover:bg-blue-800 disabled:bg-gray-200
                         text-white font-bold rounded-2xl transition text-sm mt-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white
                                   rounded-full animate-spin" />
                : <><UserPlus size={16} /> {t.btn}</>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t.hasAccount}{' '}
            <Link href="/login" className="text-blue-700 font-bold hover:underline">
              {t.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}