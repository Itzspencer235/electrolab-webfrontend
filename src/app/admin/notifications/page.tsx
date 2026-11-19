'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Megaphone, Smartphone, Mail, Send, Loader2, Search, User as UserIcon, X, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';
import { apiError } from '@/lib/api';
import { getUsers, getNotifyStatus, sendNotification, tr, type NotifyTarget } from '@/lib/adminApi';
import { PageHeader, Section, Label, Alert, inputCls, btnPrimary } from '@/components/admin/ui';

export default function AdminNotificationsPage() {
  const { token } = useAuth();
  const { lang }  = useLang();

  const [target,  setTarget]  = useState<NotifyTarget>('all');
  const [user,    setUser]    = useState<any | null>(null);
  const [users,   setUsers]   = useState<any[] | null>(null);
  const [uq,      setUq]      = useState('');
  const [title,   setTitle]   = useState('');
  const [body,    setBody]    = useState('');
  const [inApp,   setInApp]   = useState(true);
  const [email,   setEmail]   = useState(false);
  const [status,  setStatus]  = useState<{ push: boolean; email: boolean } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [done,    setDone]    = useState<string | null>(null);

  useEffect(() => {
    if (token) getNotifyStatus(token).then(setStatus).catch(() => setStatus(null));
  }, [token]);
  useEffect(() => {
    if (target === 'user' && !users && token) getUsers(token).then(setUsers).catch(() => setUsers([]));
  }, [target, users, token]);

  const shownUsers = useMemo(() => (users || []).filter(u =>
    [u.name, u.email, u.phone].some(v => (v || '').toLowerCase().includes(uq.trim().toLowerCase()))).slice(0, 30),
  [users, uq]);

  const who = target === 'user' ? (user?.name || '')
    : target === 'customers' ? tr(lang, 'tous les clients', 'all customers', 'كل العملاء')
    : tr(lang, 'tout le monde', 'everyone', 'الجميع');

  const validate = () => {
    if (!title.trim()) return tr(lang, 'Le titre est obligatoire', 'Title is required', 'العنوان مطلوب');
    if (!inApp && !email) return tr(lang, 'Choisissez au moins un canal', 'Choose at least one channel', 'اختر قناة واحدة على الأقل');
    if (target === 'user' && !user) return tr(lang, 'Choisissez un utilisateur', 'Choose a user', 'اختر مستخدماً');
    return null;
  };

  const send = async () => {
    if (!token) return;
    setConfirm(false); setSending(true); setError(null); setDone(null);
    try {
      const r = await sendNotification({
        target, userId: target === 'user' ? user?._id : undefined,
        title: title.trim(), body: body.trim(),
        channels: { inApp, push: inApp, email },
      }, token);
      const parts = [
        inApp && `${r.inApp} ${tr(lang, 'dans l\'app', 'in app', 'في التطبيق')}`,
        inApp && `${r.push} push`,
        email && `${r.emailQueued} email(s)`,
      ].filter(Boolean);
      setDone(`${tr(lang, 'Envoyé à', 'Sent to', 'أرسل إلى')} ${r.users} ${tr(lang, 'utilisateur(s)', 'user(s)', 'مستخدم')} — ${parts.join(' · ')}`);
      setTitle(''); setBody('');
    } catch (e) {
      setError(apiError(e, 'Erreur'));
    }
    setSending(false);
  };

  const targets: { k: NotifyTarget; label: string }[] = [
    { k: 'all',       label: tr(lang, 'Tout le monde', 'Everyone', 'الجميع') },
    { k: 'customers', label: tr(lang, 'Clients', 'Customers', 'العملاء') },
    { k: 'user',      label: tr(lang, 'Un utilisateur', 'One user', 'مستخدم واحد') },
  ];

  return (
    <div>
      <PageHeader
        title={tr(lang, 'Notifications', 'Notifications', 'الإشعارات')}
        subtitle={tr(lang, 'Annonce dans l\'app (avec notification push) et/ou par email',
          'Announcement in the app (with push) and/or by email', 'إعلان في التطبيق (مع إشعار فوري) و/أو بالبريد')}
        icon={<Megaphone size={22} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          <Section title={tr(lang, 'Destinataires', 'Recipients', 'المستلمون')}>
            <div className="flex flex-wrap gap-2">
              {targets.map(t => (
                <button key={t.k} type="button" onClick={() => setTarget(t.k)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition
                    ${target === t.k ? 'bg-blue-700 text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            {target === 'user' && (
              user ? (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl">
                  <UserIcon size={18} className="text-blue-700 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email || user.phone}</p>
                  </div>
                  <button type="button" onClick={() => setUser(null)} className="p-1.5 text-gray-400 hover:text-red-500"><X size={16} /></button>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="relative border-b border-gray-100">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={uq} onChange={e => setUq(e.target.value)}
                      placeholder={tr(lang, 'Rechercher un utilisateur...', 'Search a user...', 'ابحث عن مستخدم...')}
                      className="w-full pl-9 pr-3 py-2.5 text-sm outline-none" />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {!users ? (
                      <div className="flex justify-center py-6"><Loader2 className="animate-spin text-blue-700" /></div>
                    ) : shownUsers.map(u => (
                      <button key={u._id} type="button" onClick={() => setUser(u)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 text-left transition">
                        <span className="w-8 h-8 rounded-xl bg-blue-700 text-white text-xs font-black flex items-center justify-center shrink-0">
                          {(u.name || '?')[0].toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-gray-800 truncate">{u.name}</span>
                          <span className="block text-xs text-gray-400 truncate">{u.email || u.phone}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}
          </Section>

          <Section title={tr(lang, 'Message', 'Message', 'الرسالة')}>
            <label className="block">
              <Label required>{tr(lang, 'Titre', 'Title', 'العنوان')}</Label>
              <input value={title} onChange={e => setTitle(e.target.value)} maxLength={140}
                placeholder={tr(lang, 'ex. Promo -20% sur les capteurs', 'e.g. 20% off sensors', 'مثال: خصم 20٪ على الحساسات')}
                className={inputCls} />
            </label>
            <label className="block">
              <Label>{tr(lang, 'Texte', 'Text', 'النص')}</Label>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={6} maxLength={2000}
                placeholder={tr(lang, 'Détails de l\'annonce...', 'Announcement details...', 'تفاصيل الإعلان...')}
                className={`${inputCls} resize-y`} />
              <span className="block text-right text-xs text-gray-400 mt-1">{body.length}/2000</span>
            </label>
          </Section>
        </div>

        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Section title={tr(lang, 'Envoyer par', 'Send by', 'الإرسال عبر')}>
            <Channel
              checked={inApp} onChange={setInApp}
              icon={<Smartphone size={18} />}
              title={tr(lang, 'Dans l\'app + push', 'In the app + push', 'في التطبيق + إشعار فوري')}
              note={status && !status.push
                ? tr(lang, 'Push non configuré sur le serveur (FIREBASE_SERVICE_ACCOUNT) : visible seulement dans la liste de l\'app',
                    'Push not configured on the server: only shown in the app list', 'الإشعار الفوري غير مهيأ: يظهر داخل التطبيق فقط')
                : tr(lang, 'Liste des notifications + notification sur le téléphone', 'Notification list + phone notification', 'قائمة الإشعارات + إشعار على الهاتف')}
              warn={!!status && !status.push}
            />
            <Channel
              checked={email} onChange={setEmail} disabled={!!status && !status.email}
              icon={<Mail size={18} />}
              title="Email"
              note={status && !status.email
                ? tr(lang, 'Email non configuré sur le serveur (BREVO_API_KEY)', 'Email not configured on the server (BREVO_API_KEY)', 'البريد غير مهيأ على الخادم')
                : tr(lang, 'Seulement aux comptes qui ont un email', 'Only to accounts with an email', 'فقط للحسابات التي لديها بريد')}
              warn={!!status && !status.email}
            />
          </Section>

          {/* Preview of how it looks on the phone */}
          <div className="bg-gray-900 rounded-3xl p-4">
            <p className="text-xs text-gray-400 mb-2">{tr(lang, 'Aperçu', 'Preview', 'معاينة')}</p>
            <div className="bg-white/95 rounded-2xl p-3 flex gap-3">
              <span className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0"><Megaphone size={16} /></span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 break-words">{title || tr(lang, 'Titre de la notification', 'Notification title', 'عنوان الإشعار')}</p>
                <p className="text-xs text-gray-600 line-clamp-3 break-words">{body || '…'}</p>
              </div>
            </div>
          </div>

          {error && <Alert kind="error">{error}</Alert>}
          {done && <Alert kind="success">{done}</Alert>}

          {confirm ? (
            <div className="p-4 bg-blue-50 rounded-2xl">
              <p className="text-sm text-gray-700 mb-3">
                {tr(lang, 'Envoyer', 'Send', 'إرسال')} « <b>{title.trim()}</b> » {tr(lang, 'à', 'to', 'إلى')} <b>{who}</b> ?
              </p>
              <div className="flex gap-2">
                <button onClick={send} className={btnPrimary}><Send size={14} /> {tr(lang, 'Oui, envoyer', 'Yes, send', 'نعم، أرسل')}</button>
                <button onClick={() => setConfirm(false)} className="px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-white rounded-xl">
                  {tr(lang, 'Annuler', 'Cancel', 'إلغاء')}
                </button>
              </div>
            </div>
          ) : (
            <button disabled={sending} className={`${btnPrimary} w-full py-3.5`}
              onClick={() => { const v = validate(); if (v) { setError(v); return; } setError(null); setConfirm(true); }}>
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {tr(lang, 'Envoyer', 'Send', 'إرسال')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Channel({ checked, onChange, icon, title, note, warn, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; icon: React.ReactNode;
  title: string; note: string; warn?: boolean; disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-3 p-3 rounded-2xl border-2 transition
      ${disabled ? 'opacity-60 cursor-not-allowed border-gray-100' : 'cursor-pointer'}
      ${checked && !disabled ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100 hover:border-blue-200'}`}>
      <input type="checkbox" className="mt-1 w-4 h-4 accent-blue-700" checked={checked && !disabled}
        disabled={disabled} onChange={e => onChange(e.target.checked)} />
      <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-gray-800">{title}</span>
        <span className={`flex items-start gap-1 text-xs mt-0.5 ${warn ? 'text-orange-600' : 'text-gray-500'}`}>
          {warn && <AlertTriangle size={12} className="mt-0.5 shrink-0" />} {note}
        </span>
      </span>
    </label>
  );
}
