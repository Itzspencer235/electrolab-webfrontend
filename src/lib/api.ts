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