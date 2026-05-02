'use client';
import { useLang } from '@/context/LangContext';
import { WHATSAPP_NUMBER } from '@/lib/constants';
import { MessageCircle, Mail, MapPin, Clock } from 'lucide-react';

export default function ContactPage() {
  const { lang } = useLang();

  const t = {
    fr: {
      title:   'Contactez-nous',
      sub:     'Notre équipe est disponible pour vous aider avec vos projets électroniques.',
      wa:      'Écrire sur WhatsApp',
      waSub:   'Réponse en quelques minutes',
      email:   'Envoyer un email',
      hours:   'Horaires',
      hoursV:  'Lun–Sam : 8h–20h',
      loc:     'Localisation',
      locV:    'N\'Djamena, Tchad',
      faq:     'Questions fréquentes',
      faqs: [
        { q: 'Comment commander ?', a: 'Via WhatsApp ou le formulaire en ligne. Paiement à la livraison.' },
        { q: 'Livraison disponible ?', a: 'Oui, livraison dans tout N\'Djamena.' },
        { q: 'Arduino pour débutant ?', a: 'Oui ! Nous proposons des kits et tutoriels pour débutants.' },
      ],
    },
    en: {
      title:   'Contact Us',
      sub:     'Our team is available to help with your electronics projects.',
      wa:      'Message on WhatsApp',
      waSub:   'Reply in minutes',
      email:   'Send an email',
      hours:   'Hours',
      hoursV:  'Mon–Sat: 8am–8pm',
      loc:     'Location',
      locV:    'N\'Djamena, Chad',
      faq:     'Frequently Asked Questions',
      faqs: [
        { q: 'How to order?', a: 'Via WhatsApp or online form. Cash on delivery.' },
        { q: 'Delivery available?', a: 'Yes, delivery across N\'Djamena.' },
        { q: 'Arduino for beginners?', a: 'Yes! We offer starter kits and tutorials for beginners.' },
      ],
    },
    ar: {
      title:   'تواصل معنا',
      sub:     'فريقنا متاح لمساعدتك في مشاريعك الإلكترونية.',
      wa:      'الكتابة على واتساب',
      waSub:   'رد خلال دقائق',
      email:   'إرسال بريد إلكتروني',
      hours:   'أوقات العمل',
      hoursV:  'الاثنين–السبت: 8ص–8م',
      loc:     'الموقع',
      locV:    'إنجامينا، تشاد',
      faq:     'الأسئلة الشائعة',
      faqs: [
        { q: 'كيف أطلب؟', a: 'عبر واتساب أو النموذج الإلكتروني. الدفع عند الاستلام.' },
        { q: 'هل يوجد توصيل؟', a: 'نعم، توصيل في جميع أنحاء إنجامينا.' },
        { q: 'Arduino للمبتدئين؟', a: 'نعم! لدينا مجموعات ودروس للمبتدئين.' },
      ],
    },
  }[lang];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-gray-800 mb-2">{t.title}</h1>
      <p className="text-gray-500 mb-10">{t.sub}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* WhatsApp */}
        <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer"
          className="flex items-center gap-4 p-6 bg-green-50 border border-green-100
                     rounded-2xl hover:bg-green-100 transition">
          <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
            <MessageCircle size={24} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-800">{t.wa}</div>
            <div className="text-sm text-green-600">{t.waSub}</div>
            <div className="text-xs text-gray-400 mt-0.5">{WHATSAPP_NUMBER}</div>
          </div>
        </a>

        {/* Email */}
        <a href="mailto:contact@ipelectrolab.com"
          className="flex items-center gap-4 p-6 bg-blue-50 border border-blue-100
                     rounded-2xl hover:bg-blue-100 transition">
          <div className="w-12 h-12 bg-blue-700 rounded-2xl flex items-center justify-center">
            <Mail size={24} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-800">{t.email}</div>
            <div className="text-sm text-blue-600">contact@ipelectrolab.com</div>
          </div>
        </a>

        {/* Hours */}
        <div className="flex items-center gap-4 p-6 bg-white border border-gray-100 rounded-2xl">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
            <Clock size={24} className="text-orange-500" />
          </div>
          <div>
            <div className="font-bold text-gray-800">{t.hours}</div>
            <div className="text-sm text-gray-500">{t.hoursV}</div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-4 p-6 bg-white border border-gray-100 rounded-2xl">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
            <MapPin size={24} className="text-red-500" />
          </div>
          <div>
            <div className="font-bold text-gray-800">{t.loc}</div>
            <div className="text-sm text-gray-500">{t.locV}</div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">{t.faq}</h2>
      <div className="space-y-3">
        {t.faqs.map((f, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5">
            <h3 className="font-semibold text-gray-800 mb-2">❓ {f.q}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}