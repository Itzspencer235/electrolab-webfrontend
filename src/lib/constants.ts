export const WHATSAPP_NUMBER = '+23566823123';
export const SITE_NAME       = 'IP ElectroLab';

export const LANGS = ['fr', 'en', 'ar'] as const;
export type Lang = typeof LANGS[number];

export const NAV_LINKS = {
  fr: [
    { href: '/',          label: 'Accueil' },
    { href: '/boutique',  label: 'Boutique' },
    { href: '/tutoriels', label: 'Tutoriels' },
    { href: '/assistant', label: '🤖 Assistant IA' },
    { href: '/contact',   label: 'Contact' },
  ],
  en: [
    { href: '/',          label: 'Home' },
    { href: '/boutique',  label: 'Shop' },
    { href: '/tutoriels', label: 'Tutorials' },
    { href: '/assistant', label: '🤖 AI Assistant' },
    { href: '/contact',   label: 'Contact' },
  ],
  ar: [
    { href: '/',          label: 'الرئيسية' },
    { href: '/boutique',  label: 'المتجر' },
    { href: '/tutoriels', label: 'الدروس' },
    { href: '/assistant', label: '🤖 المساعد الذكي' },
    { href: '/contact',   label: 'تواصل' },
  ],
};