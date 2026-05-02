'use client';
import { useEffect, useState } from 'react';
import { useParams }           from 'next/navigation';
import Image  from 'next/image';
import Link   from 'next/link';
import {
  ChevronLeft, Play, Copy,
  Check, Clock, Eye, BookOpen, Code,
  Cpu, MessageCircle, ChevronRight,
} from 'lucide-react';
import { useLang } from '@/context/LangContext';
import { getTutorial } from '@/lib/api';
import { levelColor, levelLabel, whatsappUrl } from '@/lib/utils';

export default function TutorialDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const { lang } = useLang();

  const [tutorial, setTutorial] = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('content');
  const [copied,   setCopied]   = useState(false);

  useEffect(() => {
    getTutorial(id, lang).then(d => {
      setTutorial(d);
      setLoading(false);
    });
  }, [id, lang]);

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse space-y-4">
      <div className="h-64 bg-gray-200 rounded-3xl" />
      <div className="h-8 bg-gray-200 rounded-xl w-3/4" />
      <div className="h-4 bg-gray-200 rounded-xl w-1/2" />
    </div>
  );

  if (!tutorial) return (
    <div className="text-center py-32 text-gray-400">
      <BookOpen size={48} className="mx-auto mb-4 text-gray-200" />
      <p>{lang === 'fr' ? 'Tutoriel introuvable' : lang === 'en' ? 'Tutorial not found' : 'الدرس غير موجود'}</p>
    </div>
  );

  const hasSteps      = (tutorial.steps      || []).length > 0;
  const hasComponents = (tutorial.components || []).length > 0;
  const hasCode       = !!tutorial.codeSnippet;
  const hasVideo      = !!tutorial.youtubeUrl;

  const tabs = [
    { key: 'content',    label: { fr: 'Contenu',    en: 'Content',    ar: 'المحتوى' }[lang]!,    show: true },
    { key: 'steps',      label: { fr: 'Étapes',     en: 'Steps',      ar: 'الخطوات' }[lang]!,    show: hasSteps },
    { key: 'components', label: { fr: 'Composants', en: 'Components', ar: 'المكونات' }[lang]!,   show: hasComponents },
    { key: 'code',       label: 'Code',                                                            show: hasCode },
  ].filter(t => t.show);

  const copyCode = () => {
    navigator.clipboard.writeText(tutorial.codeSnippet || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openYouTube = () => {
    if (tutorial.youtubeUrl) window.open(tutorial.youtubeUrl, '_blank');
  };

  const waMsg = () => {
    const comps = (tutorial.components || [])
      .map((c: any) => `• ${c.name || 'Composant'}`)
      .join('\n');
    return {
      fr: `Bonjour ! Je souhaite commander les composants du tutoriel "${tutorial.title}" :\n${comps}`,
      en: `Hello! I want to order components for tutorial "${tutorial.title}" :\n${comps}`,
      ar: `مرحباً! أريد طلب مكونات درس "${tutorial.title}" :\n${comps}`,
    }[lang]!;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back */}
        <Link href="/tutoriels"
          className="inline-flex items-center gap-1.5 text-blue-700 text-sm
                     font-semibold mb-6 hover:underline">
          <ChevronLeft size={16} />
          {lang === 'fr' ? 'Retour tutoriels' : lang === 'en' ? 'Back to tutorials' : 'العودة للدروس'}
        </Link>

        {/* ── Hero image ───────────────────────────────────────────────────── */}
        <div className="relative h-64 md:h-80 bg-blue-900 rounded-3xl overflow-hidden mb-6 shadow-xl">
          {tutorial.imageUrl ? (
            <Image src={tutorial.imageUrl} alt={tutorial.title}
              fill className="object-cover opacity-80" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen size={80} className="text-blue-700" />
            </div>
          )}
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Top controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full
              ${levelColor[tutorial.level] || 'bg-gray-100 text-gray-700'}`}>
              {levelLabel[tutorial.level]?.[lang] || tutorial.level}
            </span>
          </div>

          {/* YouTube play button */}
          {hasVideo && (
            <button onClick={openYouTube}
              className="absolute inset-0 flex items-center justify-center group">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center
                              justify-center shadow-2xl group-hover:scale-110 transition">
                <Play size={28} className="text-white ml-1" fill="currentColor" />
              </div>
            </button>
          )}

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center gap-3 text-white/70 text-xs mb-2">
              <span className="bg-white/20 px-2 py-1 rounded-full">{tutorial.category}</span>
              {tutorial.duration > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {tutorial.duration} min
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye size={11} /> {tutorial.views || 0}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white leading-tight">
              {tutorial.title}
            </h1>
          </div>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-semibold
                whitespace-nowrap transition shrink-0
                ${tab === t.key
                  ? 'bg-blue-700 text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ──────────────────────────────────────────────────── */}

        {/* CONTENT */}
        {tab === 'content' && (
          <div className="space-y-4">
            {/* Description */}
            {tutorial.description && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-gray-700 leading-relaxed">{tutorial.description}</p>
              </div>
            )}

            {/* Content */}
            {tutorial.content && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {tutorial.content}
                </p>
              </div>
            )}

            {/* Images */}
            {(tutorial.images || []).length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-gray-800">
                  {lang === 'fr' ? '📸 Images' : lang === 'en' ? '📸 Images' : '📸 الصور'}
                </h3>
                {tutorial.images.map((img: string, i: number) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                    <Image src={img} alt={`Image ${i+1}`}
                      width={800} height={450} className="w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEPS */}
        {tab === 'steps' && (
          <div className="space-y-4">
            {(tutorial.steps || []).map((step: any, i: number) => (
              <div key={i} className="flex gap-4">
                {/* Step number */}
                <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center
                                justify-center text-white font-black text-sm shrink-0 mt-1">
                  {i + 1}
                </div>

                {/* Step card */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-100
                                shadow-sm p-5 hover:shadow-md transition">
                  {step.title && (
                    <h3 className="font-bold text-gray-800 mb-2">{step.title}</h3>
                  )}
                  {step.content && (
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                      {step.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* COMPONENTS */}
        {tab === 'components' && (
          <div className="space-y-4">
            {/* Components list */}
            {(tutorial.components || []).map((comp: any, i: number) => {
              const name = typeof comp.name === 'string'
                ? comp.name
                : comp.name?.fr || comp.name?.en || comp.name?.ar || `Composant ${i + 1}`;
              const productId = comp.product?.toString() || comp._id?.toString() || '';
              const imageUrl  = comp.imageUrl || '';
              const price     = comp.price || 0;
              const qty       = comp.quantity || 1;
              const category  = comp.category || '';

              return (
                <div key={i}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm
                             overflow-hidden hover:shadow-md transition">
                  <div className="flex items-center gap-4 p-4">
                    {/* Index */}
                    <div className="w-8 h-8 bg-blue-700 rounded-xl flex items-center
                                    justify-center text-white font-black text-sm shrink-0">
                      {i + 1}
                    </div>

                    {/* Image */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden
                                    bg-blue-50 shrink-0">
                      {imageUrl ? (
                        <Image src={imageUrl} alt={name} fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl">
                          🔌
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 truncate">{name}</p>
                      {category && (
                        <p className="text-xs text-gray-400">{category}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        {price > 0 && (
                          <span className="text-blue-700 font-bold text-sm">
                            {price} FCFA
                          </span>
                        )}
                        {qty > 1 && (
                          <span className="text-xs bg-blue-50 text-blue-700
                                           px-2 py-0.5 rounded-full font-semibold">
                            ×{qty}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* View product */}
                    {productId && productId.length === 24 && (
                      <Link href={`/boutique/${productId}`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-50
                                   text-blue-700 text-xs font-bold rounded-xl
                                   hover:bg-blue-100 transition border border-blue-200 shrink-0">
                        <Cpu size={12} />
                        {lang === 'fr' ? 'Détail' : lang === 'en' ? 'Detail' : 'تفاصيل'}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Order all components */}
            {hasComponents && (
              <a href={whatsappUrl(waMsg())} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4
                           bg-green-500 hover:bg-green-600 text-white font-black
                           rounded-2xl transition shadow-md">
                <MessageCircle size={18} />
                {lang === 'fr' ? 'Commander tous les composants'
                 : lang === 'en' ? 'Order all components'
                 : 'اطلب جميع المكونات'}
              </a>
            )}
          </div>
        )}

        {/* CODE */}
        {tab === 'code' && (
          <div className="space-y-4">
            {/* Code block */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3
                              border-b border-gray-100 bg-gray-50">
                <span className="text-xs font-black px-3 py-1 bg-blue-100
                                 text-blue-700 rounded-full">
                  {(tutorial.codeLanguage || 'cpp').toUpperCase()}
                </span>
                <button onClick={copyCode}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-700
                             text-white text-xs font-bold rounded-xl
                             hover:bg-blue-800 transition">
                  {copied
                    ? <><Check size={13} /> {lang === 'fr' ? 'Copié !' : 'Copied!'}</>
                    : <><Copy size={13} /> {lang === 'fr' ? 'Copier' : 'Copy'}</>}
                </button>
              </div>
              {/* Code */}
              <pre className="bg-gray-900 text-cyan-400 p-5 text-xs md:text-sm
                              overflow-x-auto font-mono leading-relaxed max-h-[500px]">
                {tutorial.codeSnippet}
              </pre>
            </div>
          </div>
        )}

        {/* ── Bottom bar ────────────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          {hasVideo && (
            <button onClick={openYouTube}
              className="flex-1 flex items-center justify-center gap-2 py-4
                         bg-red-600 hover:bg-red-700 text-white font-black
                         rounded-2xl transition shadow-md">
              <Play size={18} fill="currentColor" />
              {lang === 'fr' ? 'Voir sur YouTube' : lang === 'en' ? 'Watch on YouTube' : 'مشاهدة على يوتيوب'}
            </button>
          )}
          {hasComponents && (
            <a href={whatsappUrl(waMsg())} target="_blank" rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-4
                         bg-green-500 hover:bg-green-600 text-white font-black
                         rounded-2xl transition shadow-md">
              <MessageCircle size={18} />
              {lang === 'fr' ? 'Commander composants' : lang === 'en' ? 'Order components' : 'اطلب المكونات'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}