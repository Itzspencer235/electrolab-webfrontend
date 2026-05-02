export const whatsappUrl = (msg: string) =>
  `https://wa.me/23500000000?text=${encodeURIComponent(msg)}`;

export const formatPrice = (p: number) =>
  new Intl.NumberFormat('fr-FR').format(p) + ' FCFA';

export const levelColor: Record<string, string> = {
  beginner:     'bg-green-100 text-green-700',
  intermediate: 'bg-orange-100 text-orange-700',
  advanced:     'bg-red-100 text-red-700',
};

export const levelLabel: Record<string, Record<string, string>> = {
  beginner:     { fr: 'Débutant',      en: 'Beginner',     ar: 'مبتدئ' },
  intermediate: { fr: 'Intermédiaire', en: 'Intermediate', ar: 'متوسط' },
  advanced:     { fr: 'Avancé',        en: 'Advanced',     ar: 'متقدم' },
};