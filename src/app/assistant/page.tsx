'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Lock } from 'lucide-react';
import { useLang } from '@/context/LangContext';
import { useAuth } from '@/context/AuthContext';
import { sendChat } from '@/lib/api';
import Link from 'next/link';

interface Msg { role: 'user' | 'bot'; text: string; time: Date; }

export default function AssistantPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const [msgs,    setMsgs]    = useState<Msg[]>([]);
  const [history, setHistory] = useState<{ role: string; text: string }[]>([]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const t = {
    fr: {
      title:   'Assistant IA',
      sub:     'Posez vos questions sur les composants électroniques, projets, code...',
      ph:      'Posez votre question...',
      welcome: '👋 Bonjour ! Je suis l\'assistant IA de **IP ElectroLab**.\n\nJe peux vous aider avec :\n• Questions sur tous les composants électroniques\n• Projets Arduino, ESP32, Raspberry Pi\n• LCD, CI, capteurs, relais, moteurs\n• Débogage et câblage\n• Recommandations de composants\n\nComment puis-je vous aider ?',
      tips:    ['Comment utiliser un LCD I2C ?', 'Différence entre NPN et PNP ?', 'Code pour capteur ultrasonique', 'Comment câbler un relais ?', 'Arduino vs ESP32 ?'],
      loginTitle: 'Connexion requise',
      loginSub:   'Connectez-vous pour accéder à l\'assistant IA et sauvegarder vos conversations.',
      loginBtn:   'Se connecter',
      registerBtn:'Créer un compte',
    },
    en: {
      title:   'AI Assistant',
      sub:     'Ask questions about electronic components, projects, code...',
      ph:      'Ask your question...',
      welcome: '👋 Hello! I\'m the AI assistant of **IP ElectroLab**.\n\nI can help with:\n• Questions about all electronic components\n• Arduino, ESP32, Raspberry Pi projects\n• LCD, IC, sensors, relays, motors\n• Debugging and wiring\n• Component recommendations\n\nHow can I help you?',
      tips:    ['How to use an I2C LCD?', 'Difference between NPN and PNP?', 'Ultrasonic sensor code', 'How to wire a relay?', 'Arduino vs ESP32?'],
      loginTitle: 'Login required',
      loginSub:   'Sign in to access the AI assistant and save your conversations.',
      loginBtn:   'Sign in',
      registerBtn:'Create account',
    },
    ar: {
      title:   'المساعد الذكي',
      sub:     'اطرح أسئلتك عن المكونات الإلكترونية والمشاريع والكود...',
      ph:      'اطرح سؤالك...',
      welcome: '👋 مرحباً! أنا المساعد الذكي لـ **IP ElectroLab**.\n\nيمكنني مساعدتك في:\n• أسئلة عن جميع المكونات الإلكترونية\n• مشاريع Arduino وESP32 وRaspberry Pi\n• LCD وCI والمستشعرات والمرحلات والمحركات\n• تصحيح الأخطاء والتوصيل\n\nكيف يمكنني مساعدتك؟',
      tips:    ['كيف أستخدم شاشة LCD I2C؟', 'الفرق بين NPN وPNP؟', 'كود حساس الموجات فوق الصوتية', 'كيف أوصل الريلي؟', 'Arduino مقابل ESP32؟'],
      loginTitle: 'يجب تسجيل الدخول',
      loginSub:   'سجّل دخولك للوصول إلى المساعد الذكي وحفظ محادثاتك.',
      loginBtn:   'تسجيل الدخول',
      registerBtn:'إنشاء حساب',
    },
  }[lang];

  useEffect(() => {
    if (user) {
      setMsgs([{ role: 'bot', text: t.welcome, time: new Date() }]);
      setHistory([]);
    }
  }, [lang, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading]);

  const send = async (text = input) => {
    const msg = text.trim();
    if (!msg || loading || !user) return;
    setInput('');
    setMsgs(m => [...m, { role: 'user', text: msg, time: new Date() }]);
    setHistory(h => [...h, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const { reply } = await sendChat(msg, lang, history.slice(-10));
      setMsgs(m => [...m, { role: 'bot', text: reply, time: new Date() }]);
      setHistory(h => [...h, { role: 'model', text: reply }]);
    } catch {
      setMsgs(m => [...m, { role: 'bot', text: '❌ Erreur.', time: new Date() }]);
    }
    setLoading(false);
  };

  const fmt = (d: Date) =>
    `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;

  const renderText = (text: string) =>
    text.split('\n').map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (line.startsWith('•') || line.startsWith('-'))
        return <p key={i} className="flex gap-1.5 items-start"
          dangerouslySetInnerHTML={{ __html: '• ' + bold.replace(/^[•\-]\s*/, '') }} />;
      return <p key={i} className={line.trim() ? '' : 'h-2'}
        dangerouslySetInnerHTML={{ __html: bold }} />;
    });

  // ── Login gate ───────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center
                          justify-center mx-auto mb-6">
            <Lock size={36} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-black text-gray-800 mb-3">{t.loginTitle}</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">{t.loginSub}</p>
          <div className="flex flex-col gap-3">
            <Link href="/login"
              className="flex items-center justify-center gap-2 py-3.5 bg-blue-700
                         hover:bg-blue-800 text-white font-bold rounded-2xl transition">
              {t.loginBtn}
            </Link>
            <Link href="/register"
              className="flex items-center justify-center gap-2 py-3.5 border-2
                         border-blue-200 text-blue-700 font-bold rounded-2xl
                         hover:bg-blue-50 transition">
              {t.registerBtn}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col"
         style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-black text-gray-800 text-lg">{t.title}</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <p className="text-gray-400 text-xs">{t.sub}</p>
            </div>
          </div>
        </div>
        <button onClick={() => {
          setMsgs([{ role: 'bot', text: t.welcome, time: new Date() }]);
          setHistory([]);
        }}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition">
          <Trash2 size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'bot' && (
              <div className="w-8 h-8 shrink-0 bg-blue-700 rounded-xl
                              flex items-center justify-center">
                <Bot size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-[80%] flex flex-col
              ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed space-y-1
                ${m.role === 'user'
                  ? 'bg-blue-700 text-white rounded-br-sm'
                  : 'bg-white border border-gray-100 shadow-sm text-gray-700 rounded-bl-sm'}`}>
                {renderText(m.text)}
              </div>
              <span className="text-xs text-gray-400 mt-1">{fmt(m.time)}</span>
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 shrink-0 bg-blue-100 rounded-xl
                              flex items-center justify-center">
                {user.avatar
                  ? <img src={user.avatar} className="w-8 h-8 rounded-xl object-cover" alt="" />
                  : <span className="text-blue-700 font-bold text-xs">
                      {user.name[0].toUpperCase()}
                    </span>}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 bg-blue-700 rounded-xl flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-white border border-gray-100 shadow-sm
                            px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1 items-center">
                {[0,1,2].map(i => (
                  <div key={i}
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {msgs.length <= 1 && !loading && (
          <div className="flex flex-wrap gap-2 pt-2">
            {t.tips.map(tip => (
              <button key={tip} onClick={() => send(tip)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-full
                           text-xs text-blue-700 font-medium hover:bg-blue-50
                           hover:border-blue-300 transition">
                {tip}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={t.ph}
          className="flex-1 px-5 py-3.5 bg-white border border-gray-200 rounded-2xl
                     text-sm outline-none focus:border-blue-400 focus:ring-2
                     focus:ring-blue-100 transition"
        />
        <button onClick={() => send()} disabled={loading || !input.trim()}
          className="px-5 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-200
                     text-white rounded-2xl transition flex items-center gap-2 font-semibold">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}