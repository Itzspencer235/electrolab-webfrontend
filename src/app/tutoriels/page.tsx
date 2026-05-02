'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link  from 'next/link';
import { BookOpen, Clock, Eye } from 'lucide-react';
import { useLang } from '@/context/LangContext';
import { getTutorials } from '@/lib/api';
import { levelColor, levelLabel } from '@/lib/utils';

export default function TutorielsPage() {
  const { lang } = useLang();
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [level,     setLevel]     = useState('');
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    setLoading(true);
    getTutorials(lang, level || undefined)
      .then(d => { setTutorials(d); setLoading(false); });
  }, [lang, level]);

  const filtered = search
    ? tutorials.filter(t => t.title?.toLowerCase().includes(search.toLowerCase()))
    : tutorials;

  const levels = [
    { key: '',             label: { fr: 'Tous', en: 'All', ar: 'الكل' }[lang] },
    { key: 'beginner',     label: { fr: 'Débutant', en: 'Beginner', ar: 'مبتدئ' }[lang] },
    { key: 'intermediate', label: { fr: 'Intermédiaire', en: 'Intermediate', ar: 'متوسط' }[lang] },
    { key: 'advanced',     label: { fr: 'Avancé', en: 'Advanced', ar: 'متقدم' }[lang] },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-gray-800 mb-2">
        {lang === 'fr' ? 'Tutoriels' : lang === 'en' ? 'Tutorials' : 'الدروس'}
      </h1>
      <p className="text-gray-500 mb-8">{filtered.length} tutoriels</p>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={lang === 'fr' ? 'Rechercher...' : lang === 'en' ? 'Search...' : 'بحث...'}
          className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-2xl
                     text-sm outline-none focus:border-blue-400 transition" />
        <div className="flex gap-2 flex-wrap">
          {levels.map(l => (
            <button key={l.key} onClick={() => setLevel(l.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition
                ${level === l.key
                  ? 'bg-blue-700 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(tut => (
            <Link key={tut._id} href={`/tutoriels/${tut._id}`}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100
                         shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="relative h-48 bg-blue-50">
                {tut.imageUrl ? (
                  <Image src={tut.imageUrl} alt={tut.title} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen size={48} className="text-blue-200" />
                  </div>
                )}
                <span className={`absolute top-3 left-3 text-xs font-bold
                  px-2.5 py-1 rounded-full ${levelColor[tut.level] ?? 'bg-gray-100 text-gray-600'}`}>
                  {levelLabel[tut.level]?.[lang] ?? tut.level}
                </span>
              </div>
              <div className="p-5">
                <span className="text-xs text-blue-600 font-semibold">{tut.category}</span>
                <h3 className="font-bold text-gray-800 mt-1 leading-snug line-clamp-2">
                  {tut.title}
                </h3>
                <p className="text-gray-500 text-sm mt-1.5 line-clamp-2">
                  {tut.description}
                </p>
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {tut.duration} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={12} /> {tut.views}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}