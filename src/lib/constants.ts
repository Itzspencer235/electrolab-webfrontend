export const WHATSAPP_NUMBER = '+23566823123';
export const SITE_NAME       = 'IP ElectroLab';

// Privacy policy + account deletion pages are served by the backend
// (same pages the App Store / Google Play listings link to).
const LEGAL_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://electrolab-backend.onrender.com/api')
  .replace(/\/api\/?$/, '');
export const PRIVACY_URL        = `${LEGAL_BASE}/privacy`;
export const DELETE_ACCOUNT_URL = `${LEGAL_BASE}/delete-account`;

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