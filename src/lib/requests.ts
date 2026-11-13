import type { ProductRequest, RequestStatus } from '@/lib/api';
import type { Lang } from '@/lib/constants';

export const REQUEST_STATUSES: RequestStatus[] = ['pending', 'in_progress', 'available', 'rejected'];

export const requestStatusLabel: Record<RequestStatus, Record<Lang, string>> = {
  pending:     { fr: 'En attente', en: 'Pending',     ar: 'قيد الانتظار' },
  in_progress: { fr: 'En cours',   en: 'In progress', ar: 'قيد المعالجة' },
  available:   { fr: 'Disponible', en: 'Available',   ar: 'متوفر' },
  rejected:    { fr: 'Refusée',    en: 'Declined',    ar: 'مرفوض' },
};

// Same palette as the order status pills on the profile page
export const requestStatusColor: Record<RequestStatus, string> = {
  pending:     'bg-orange-100 text-orange-700',
  in_progress: 'bg-blue-100 text-blue-700',
  available:   'bg-green-100 text-green-700',
  rejected:    'bg-red-100 text-red-600',
};

export const requestStatusBorder: Record<RequestStatus, string> = {
  pending:     'border-orange-400',
  in_progress: 'border-blue-500',
  available:   'border-green-500',
  rejected:    'border-red-400',
};

/** Linked product names come back as {fr, en, ar}. */
export function productName(p: ProductRequest['product'] | any, lang: Lang): string {
  const n = p?.name;
  if (n && typeof n === 'object') return n[lang] || n.fr || '';
  return n || '';
}
