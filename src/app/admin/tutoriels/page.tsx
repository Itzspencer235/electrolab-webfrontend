'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link  from 'next/link';
import {
  GraduationCap, Plus, RefreshCw, Search, Pencil, Trash2, Clock, Eye, Cpu, ExternalLink, Youtube,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';
import { getTutorials, apiError } from '@/lib/api';
import { levelColor, levelLabel } from '@/lib/utils';
import { deleteTutorial, tr } from '@/lib/adminApi';
import { PageHeader, Card, Skeleton, Alert, ConfirmButton, btnPrimary, btnGhost, inputCls } from '@/components/admin/ui';

const LEVELS = ['beginner', 'intermediate', 'advanced'];

export default function AdminTutorialsPage() {
  const { token } = useAuth();
  const { lang }  = useLang();
  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [search,  setSearch]  = useState('');
  const [level,   setLevel]   = useState('');

  const load = async () => {
    setLoading(true); setError(null);
    try { setItems(await getTutorials(lang)); }
    catch (e) { setError(apiError(e, 'Erreur')); }
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [lang]);

  const shown = items.filter(t =>
    (!level || t.level === level) &&
    (!search.trim() || (t.title || '').toLowerCase().includes(search.trim().toLowerCase())));

  const remove = async (id: string) => {
    if (!token) return;
    try { await deleteTutorial(id, token); setItems(l => l.filter(t => t._id !== id)); }
    catch (e) { setError(apiError(e, 'Erreur')); }
  };

  return (
    <div>
      <PageHeader
        title={tr(lang, 'Tutoriels', 'Tutorials', 'الدروس')}
        subtitle={`${items.length} ${tr(lang, 'tutoriel(s)', 'tutorial(s)', 'درس')}`}
        icon={<GraduationCap size={22} />}
        actions={<>
          <button onClick={load} className={btnGhost}><RefreshCw size={14} /> <span className="hidden sm:inline">{tr(lang, 'Actualiser', 'Refresh', 'تحديث')}</span></button>
          <Link href="/admin/tutoriels/nouveau" className={btnPrimary}><Plus size={16} /> {tr(lang, 'Ajouter', 'Add', 'إضافة')}</Link>
        </>}
      />

      <div className="relative mb-3">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={tr(lang, 'Rechercher un tutoriel...', 'Search tutorials...', 'ابحث عن درس...')}
          className={`${inputCls} pl-11`} />
      </div>
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {['', ...LEVELS].map(l => (
          <button key={l || 'all'} onClick={() => setLevel(l)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 transition
              ${level === l ? 'bg-blue-700 text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
            {l ? levelLabel[l][lang] : tr(lang, 'Tous', 'All', 'الكل')}
          </button>
        ))}
      </div>

      {error && <div className="mb-4"><Alert kind="error">{error}</Alert></div>}

      {loading ? <Skeleton rows={4} h="h-28" /> : shown.length === 0 ? (
        <Card className="text-center py-16 text-gray-400">
          <GraduationCap size={48} className="mx-auto mb-3 text-gray-200" />
          {tr(lang, 'Aucun tutoriel', 'No tutorials', 'لا توجد دروس')}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shown.map(t => (
            <Card key={t._id} className="overflow-hidden flex flex-col">
              <div className="flex gap-4 p-4 flex-1">
                <div className="relative w-24 h-20 sm:w-28 sm:h-24 rounded-2xl overflow-hidden bg-blue-50 shrink-0 flex items-center justify-center">
                  {t.imageUrl
                    ? <Image src={t.imageUrl} alt={t.title} fill className="object-cover" sizes="112px" />
                    : <GraduationCap size={26} className="text-blue-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm line-clamp-2">{t.title}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {t.level && <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${levelColor[t.level] || 'bg-gray-100 text-gray-600'}`}>{levelLabel[t.level]?.[lang] || t.level}</span>}
                    {t.category && <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md">{t.category}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
                    {t.duration > 0 && <span className="flex items-center gap-1"><Clock size={11} /> {t.duration} min</span>}
                    <span className="flex items-center gap-1"><Eye size={11} /> {t.views || 0}</span>
                    <span className="flex items-center gap-1"><Cpu size={11} /> {(t.components || []).length}</span>
                    {t.youtubeUrl && <span className="flex items-center gap-1 text-red-500"><Youtube size={11} /> YouTube</span>}
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                <ConfirmButton
                  label={<><Trash2 size={14} /> {tr(lang, 'Supprimer', 'Delete', 'حذف')}</>}
                  confirmLabel={tr(lang, 'Supprimer ?', 'Delete?', 'حذف؟')}
                  onConfirm={() => remove(t._id)} />
                <div className="flex items-center gap-1">
                  <Link href={`/tutoriels/${t._id}`} target="_blank" title={tr(lang, 'Voir', 'View', 'عرض')}
                    className="p-2 rounded-xl text-gray-400 hover:text-blue-700 hover:bg-white transition">
                    <ExternalLink size={16} />
                  </Link>
                  <Link href={`/admin/tutoriels/${t._id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition">
                    <Pencil size={14} /> {tr(lang, 'Modifier', 'Edit', 'تعديل')}
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
