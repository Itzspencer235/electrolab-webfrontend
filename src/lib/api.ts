import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
});

export default API;

// ── Products ──────────────────────────────────────────────────────────────────
export async function getProducts(lang = 'fr', category?: string) {
  let url = `/products?lang=${lang}`;
  if (category && category !== 'Tous') url += `&category=${encodeURIComponent(category)}`;
  const { data } = await API.get(url);
  return data;
}

export async function getProduct(id: string, lang = 'fr') {
  const { data } = await API.get(`/products/${id}?lang=${lang}`);
  return data;
}

export async function getCategories(): Promise<string[]> {
  const { data } = await API.get('/products/categories');
  return data;
}

// ── Tutorials ─────────────────────────────────────────────────────────────────
export async function getTutorials(lang = 'fr', level?: string, category?: string) {
  let url = `/tutorials?lang=${lang}`;
  if (level)    url += `&level=${level}`;
  if (category) url += `&category=${encodeURIComponent(category)}`;
  const { data } = await API.get(url);
  return data;
}

export async function getTutorial(id: string, lang = 'fr') {
  const { data } = await API.get(`/tutorials/${id}?lang=${lang}`);
  return data;
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export async function sendChat(
  message: string,
  lang = 'fr',
  history: { role: string; text: string }[] = [],
  context?: string,
) {
  const { data } = await API.post('/chat', { message, lang, history, context });
  return data;
}

// ── Orders ────────────────────────────────────────────────────────────────────
export async function createOrder(orderData: Record<string, unknown>) {
  const { data } = await API.post('/orders', orderData);
  return data;
}

export async function getMyOrders(token: string) {
  const { data } = await API.get('/orders/my', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function googleAuthAPI(idToken: string) {
  const { data } = await API.post('/users/google', { idToken });
  return data;
}

export async function facebookAuthAPI(accessToken: string, userId: string) {
  const { data } = await API.post('/users/facebook', { accessToken, userId });
  return data;
}

// ── Cart ──────────────────────────────────────────────────────────────────────
export async function getCart(token: string) {
  const { data } = await API.get('/cart', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export async function syncCartAPI(
  items: {
    product: string; name: string; price: number;
    imageUrl: string; category: string; quantity: number;
  }[],
  token: string,
) {
  const { data } = await API.put('/cart/sync', { items }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

// ── Wishlist ──────────────────────────────────────────────────────────────────
export async function getWishlist(token: string) {
  const { data } = await API.get('/wishlist', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export async function syncWishlistAPI(
  items: {
    product: string; name: string; price: number;
    imageUrl: string; category: string;
  }[],
  token: string,
) {
  const { data } = await API.put('/wishlist/sync', { items }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

// ── Product requests ──────────────────────────────────────────────────────────
// A logged-in customer asks for a product the shop doesn't have yet.

export type RequestStatus = 'pending' | 'in_progress' | 'available' | 'rejected';

export interface ProductRequest {
  _id: string;
  user: { userId: string; name: string; contact: string };
  name: string;
  description: string;
  imageUrl: string;
  intendedPrice?: number;
  quantity: number;
  searchQuery: string;
  source: 'app' | 'web';
  status: RequestStatus;
  adminMessage: string;
  product?: {
    _id: string;
    name: { fr?: string; en?: string; ar?: string } | string;
    price?: number; imageUrl?: string; category?: string; stock?: number;
  } | null;
  respondedAt?: string;
  createdAt: string;
}

const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

export async function createProductRequest(
  body: {
    name: string; description?: string; imageUrl?: string;
    intendedPrice?: number; quantity?: number; searchQuery?: string;
  },
  token: string,
): Promise<ProductRequest> {
  const { data } = await API.post('/requests', { ...body, source: 'web' }, auth(token));
  return data;
}

export async function getMyProductRequests(token: string): Promise<ProductRequest[]> {
  const { data } = await API.get('/requests/my', auth(token));
  return data;
}

export async function cancelProductRequest(id: string, token: string) {
  const { data } = await API.delete(`/requests/${id}`, auth(token));
  return data;
}

// Admin
export async function getAllProductRequests(token: string): Promise<ProductRequest[]> {
  const { data } = await API.get('/requests', auth(token));
  return data;
}

/** product: id to link, '' to remove the link, omit to leave it unchanged. */
export async function updateProductRequest(
  id: string,
  body: { status?: RequestStatus; adminMessage?: string; product?: string },
  token: string,
): Promise<ProductRequest> {
  const { data } = await API.put(`/requests/${id}`, body, auth(token));
  return data;
}

export async function adminDeleteProductRequest(id: string, token: string) {
  const { data } = await API.delete(`/requests/${id}/admin`, auth(token));
  return data;
}

// ── Image upload (Cloudinary unsigned preset, same one the mobile app uses) ──
export async function uploadImage(file: File, folder = 'ipelectrolab/requests'): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', 'ipelectrolab');
  form.append('folder', folder);
  const res = await fetch('https://api.cloudinary.com/v1_1/digjv1djy/image/upload', {
    method: 'POST', body: form,
  });
  if (!res.ok) throw new Error('Upload failed');
  const json = await res.json();
  return json.secure_url as string;
}

/** Pulls a readable message out of an axios error. */
export function apiError(e: any, fallback = 'Erreur'): string {
  return e?.response?.data?.message || fallback;
}
