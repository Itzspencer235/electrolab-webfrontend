'use client';
import { useEffect, useState } from 'react';
import { Users, RefreshCw, Search, Mail, Phone, Shield, ShieldOff, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';
import { apiError } from '@/lib/api';
import { getUsers, setUserRole, tr } from '@/lib/adminApi';
import { PageHeader, Card, Skeleton, Alert, btnGhost, inputCls } from '@/components/admin/ui';

type Filter = 'all' | 'admin' | 'customer';

const PROVIDER: Record<string, string> = {
  google: 'bg-red-50 text-red-600', facebook: 'bg-blue-50 text-blue-700', local: 'bg-gray-100 text-gray-600',
};

export default function AdminUsersPage() {
  const { token, user: me } = useAuth();
  const { lang } = useLang();
  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [filter,  setFilter]  = useState<Filter>('all');
  const [search,  setSearch]  = useState('');
  const [asking,  setAsking]  = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try { setItems(await getUsers(token)); }
    catch (e) { setError(apiError(e, 'Erreur')); }
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [token]);

  const toggleRole = async (u: any) => {
    if (!token) return;
    setAsking(null);
    const role = u.role === 'admin' ? 'customer' : 'admin';
    try {
      await setUserRole(u._id, role, token);
      setItems(l => l.map(x => (x._id === u._id ? { ...x, role } : x)));
    } catch (e) { setError(apiError(e, 'Erreur')); }
  };

  const admins = items.filter(u => u.role === 'admin').length;
  const shown = items.filter(u => {
    if (filter !== 'all' && u.role !== filter) return false;
    const q = search.trim().toLowerCase();
    return !q || [u.name, u.email, u.phone].some(v => (v || '').toLowerCase().includes(q));
  });

  const filters: { k: Filter; label: string; n: number }[] = [
    { k: 'all',      label: tr(lang, 'Tous', 'All', 'الكل'),               n: items.length },
    { k: 'admin',    label: tr(lang, 'Admins', 'Admins', 'المسؤولون'),      n: admins },
    { k: 'customer', label: tr(lang, 'Clients', 'Customers', 'العملاء'),    n: items.length - admins },
  ];

  return (
    <div>
      <PageHeader
        title={tr(lang, 'Utilisateurs', 'Users', 'المستخدمون')}
        subtitle={`${items.length} ${tr(lang, 'compte(s)', 'account(s)', 'حساب')}`}
        icon={<Users size={22} />}
        actions={<button onClick={load} className={btnGhost}><RefreshCw size={14} /> {tr(lang, 'Actualiser', 'Refresh', 'تحديث')}</button>}
      />

      <div className="relative mb-3">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={tr(lang, 'Rechercher (nom, email, téléphone)...', 'Search (name, email, phone)...', 'بحث (الاسم، البريد، الهاتف)...')}
          className={`${inputCls} pl-11`} />
      </div>
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {filters.map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 transition
              ${filter === f.k ? 'bg-blue-700 text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
            {f.label}
            <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${filter === f.k ? 'bg-white/20' : 'bg-blue-100 text-blue-700'}`}>{f.n}</span>
          </button>
        ))}
      </div>

      {error && <div className="mb-4"><Alert kind="error">{error}</Alert></div>}

      {loading ? <Skeleton rows={6} h="h-20" /> : shown.length === 0 ? (
        <Card className="text-center py-16 text-gray-400">
          <Users size={48} className="mx-auto mb-3 text-gray-200" />
          {tr(lang, 'Aucun utilisateur trouvé', 'No users found', 'لا يوجد مستخدمون')}
        </Card>
      ) : (
        <Card className="divide-y divide-gray-100 overflow-hidden">
          {shown.map(u => {
            const isAdmin = u.role === 'admin';
            const isMe = u._id === me?.id;
            return (
              <div key={u._id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 p-4">
                <div className="w-11 h-11 rounded-2xl bg-blue-700 text-white font-black flex items-center justify-center shrink-0 overflow-hidden">
                  {u.avatar
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={u.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    : (u.name || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm flex flex-wrap items-center gap-2">
                    <span className="truncate">{u.name}</span>
                    {isMe && <span className="text-xs text-gray-400 font-normal">({tr(lang, 'vous', 'you', 'أنت')})</span>}
                    {isAdmin && <span className="text-xs bg-red-500 text-white font-black px-2 py-0.5 rounded-full">Admin</span>}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md capitalize ${PROVIDER[u.provider] || PROVIDER.local}`}>{u.provider || 'local'}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                    {u.email && <span className="flex items-center gap-1 min-w-0"><Mail size={11} className="shrink-0" /> <span className="truncate">{u.email}</span></span>}
                    {u.phone && <span className="flex items-center gap-1"><Phone size={11} /> {u.phone}</span>}
                    {u.createdAt && <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(u.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}</span>}
                  </div>
                </div>
                <div className="w-full sm:w-auto flex justify-end shrink-0">
                  {isMe ? null : asking === u._id ? (
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">
                        {isAdmin ? tr(lang, 'Retirer admin ?', 'Remove admin?', 'إزالة المسؤول؟') : tr(lang, 'Rendre admin ?', 'Make admin?', 'جعله مسؤولاً؟')}
                      </span>
                      <button onClick={() => toggleRole(u)} className="font-bold text-blue-700 hover:underline">{tr(lang, 'Oui', 'Yes', 'نعم')}</button>
                      <button onClick={() => setAsking(null)} className="text-gray-500 hover:underline">{tr(lang, 'Non', 'No', 'لا')}</button>
                    </span>
                  ) : (
                    <button onClick={() => setAsking(u._id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition
                        ${isAdmin ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                      {isAdmin ? <><ShieldOff size={14} /> {tr(lang, 'Retirer admin', 'Remove admin', 'إزالة المسؤول')}</>
                               : <><Shield size={14} /> {tr(lang, 'Rendre admin', 'Make admin', 'جعله مسؤولاً')}</>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
