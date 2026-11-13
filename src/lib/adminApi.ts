// Admin-only API calls (the backend checks the admin role on every one).
import API from '@/lib/api';
import type { Lang } from '@/lib/constants';

const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

export type ML = { fr: string; en: string; ar: string };
export const emptyML = (): ML => ({ fr: '', en: '', ar: '' });
export const toML = (v: any): ML =>
  v && typeof v === 'object'
    ? { fr: v.fr || '', en: v.en || '', ar: v.ar || '' }
    : { fr: v || '', en: '', ar: '' };

// ── Stats ─────────────────────────────────────────────────────────────────────
export interface AdminStats {
  totals: { products: number; users: number; orders: number; tutorials: number; revenue: number };
  recentOrders: any[];
  ordersByStatus: Record<string, number>;
  topWishlisted: { _id: string; name: string; count: number }[];
  topCarted: { _id: string; name: string; count: number; totalQty: number }[];
  usersByMonth: { _id: number; count: number }[];
  ordersByMonth: { _id: number; count: number; revenue: number }[];
}
export async function getStats(token: string): Promise<AdminStats> {
  const { data } = await API.get('/stats', auth(token));
  return data;
}

// ── Products ──────────────────────────────────────────────────────────────────
export interface ProductInput {
  name: ML; description: ML; workingPrinciple: ML; features: ML;
  specifications: ML; applications: ML; howToUse: ML;
  parameters: { key: string; value: string }[];
  sampleCode: string; codeLanguage: string;
  price: number; stock: number; category: string;
  imageUrl: string; images: string[]; circuitImages: string[];
}
export async function getProductFull(id: string, token: string) {
  const { data } = await API.get(`/products/${id}/full`, auth(token));
  return data;
}
export async function createProduct(body: ProductInput, token: string) {
  const { data } = await API.post('/products', body, auth(token));
  return data;
}
export async function updateProduct(id: string, body: ProductInput, token: string) {
  const { data } = await API.put(`/products/${id}`, body, auth(token));
  return data;
}
export async function deleteProduct(id: string, token: string) {
  const { data } = await API.delete(`/products/${id}`, auth(token));
  return data;
}

// ── Tutorials ─────────────────────────────────────────────────────────────────
export interface TutorialInput {
  title: ML; description: ML; content: ML;
  level: string; category: string; duration: number;
  imageUrl: string; images: string[]; youtubeUrl: string;
  codeSnippet: string; codeLanguage: string;
  steps: { title: string; content: string }[];
  components: { product: string; quantity: number }[];
}
export async function getTutorialFull(id: string, token: string) {
  const { data } = await API.get(`/tutorials/${id}/full`, auth(token));
  return data;
}
export async function createTutorial(body: TutorialInput, token: string) {
  const { data } = await API.post('/tutorials', body, auth(token));
  return data;
}
export async function updateTutorial(id: string, body: TutorialInput, token: string) {
  const { data } = await API.put(`/tutorials/${id}`, body, auth(token));
  return data;
}
export async function deleteTutorial(id: string, token: string) {
  const { data } = await API.delete(`/tutorials/${id}`, auth(token));
  return data;
}

// ── Orders ────────────────────────────────────────────────────────────────────
export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
export async function getOrders(token: string): Promise<any[]> {
  const { data } = await API.get('/orders', auth(token));
  return data;
}
export async function updateOrderStatus(id: string, status: OrderStatus, token: string) {
  const { data } = await API.put(`/orders/${id}/status`, { status }, auth(token));
  return data;
}

// ── Users ─────────────────────────────────────────────────────────────────────
export async function getUsers(token: string): Promise<any[]> {
  const { data } = await API.get('/users/all', auth(token));
  return data;
}
export async function setUserRole(id: string, role: 'admin' | 'customer', token: string) {
  const { data } = await API.put(`/users/${id}/role`, { role }, auth(token));
  return data;
}
export async function deleteUser(id: string, token: string) {
  const { data } = await API.delete(`/users/${id}`, auth(token));
  return data;
}

// ── Auto-translate (Gemini, server side) ──────────────────────────────────────
export async function translate(
  text: string, sourceLang: Lang, fieldContext: string, token: string,
): Promise<ML> {
  const { data } = await API.post('/translate', { text, sourceLang, fieldContext }, auth(token));
  return data;
}

// ── Shared labels ─────────────────────────────────────────────────────────────
export const orderStatusLabel: Record<OrderStatus, Record<Lang, string>> = {
  pending:   { fr: 'En attente', en: 'Pending',   ar: 'قيد الانتظار' },
  confirmed: { fr: 'Confirmée',  en: 'Confirmed', ar: 'مؤكدة' },
  delivered: { fr: 'Livrée',     en: 'Delivered', ar: 'مسلّمة' },
  cancelled: { fr: 'Annulée',    en: 'Cancelled', ar: 'ملغية' },
};
export const orderStatusColor: Record<OrderStatus, string> = {
  pending:   'bg-orange-100 text-orange-700',
  confirmed: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};
export const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'delivered', 'cancelled'];

/** Tiny helper for the three-language strings used across the admin. */
export const tr = (lang: Lang, fr: string, en: string, ar: string) =>
  lang === 'en' ? en : lang === 'ar' ? ar : fr;
