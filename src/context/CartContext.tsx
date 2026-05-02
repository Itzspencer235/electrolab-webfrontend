'use client';
import {
  createContext, useContext, useState,
  useEffect, useRef, ReactNode,
} from 'react';
import { syncCartAPI, getCart } from '@/lib/api';

export interface CartItem {
  id: string; name: string; price: number;
  imageUrl: string; category: string; quantity: number;
}

interface CartCtx {
  items:          CartItem[];
  count:          number;
  total:          number;
  syncing:        boolean;
  add:            (item: Omit<CartItem, 'quantity'>) => void;
  remove:         (id: string) => void;
  increment:      (id: string) => void;
  decrement:      (id: string) => void;
  clear:          () => void;
  isInCart:       (id: string) => boolean;
  open:           boolean;
  setOpen:        (v: boolean) => void;
  loadFromServer: (token: string) => Promise<void>;
  refresh:        () => Promise<void>;
}

const Ctx = createContext<CartCtx>({} as CartCtx);

const AUTO_REFRESH_MS = 30_000; // auto-refresh every 30 seconds

export function CartProvider({ children }: { children: ReactNode }) {
  const [items,   setItems]   = useState<CartItem[]>([]);
  const [open,    setOpen]    = useState(false);
  const [syncing, setSyncing] = useState(false);
  const mounted      = useRef(false);
  const syncTimer    = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load from localStorage on mount ───────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('el_cart');
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    mounted.current = true;
  }, []);

  // ── Auto-refresh every 30s when logged in ──────────────────────────────────
  useEffect(() => {
    const startPolling = () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      refreshTimer.current = setInterval(async () => {
        const token = localStorage.getItem('el_token');
        if (token) {
          await loadFromServer(token);
        }
      }, AUTO_REFRESH_MS);
    };

    startPolling();
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, []);

  // ── Save + sync on every change ────────────────────────────────────────────
  useEffect(() => {
    if (!mounted.current) return;
    localStorage.setItem('el_cart', JSON.stringify(items));

    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      const token = localStorage.getItem('el_token');
      if (!token) return;
      setSyncing(true);
      try {
        await syncCartAPI(
          items.map(i => ({
            product:  i.id,
            name:     i.name,
            price:    i.price,
            imageUrl: i.imageUrl,
            category: i.category,
            quantity: i.quantity,
          })),
          token,
        );
      } catch {}
      setSyncing(false);
    }, 800);

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [items]);

  // ── Load from server ───────────────────────────────────────────────────────
  const loadFromServer = async (token: string) => {
    try {
      const cart = await getCart(token);
      if (Array.isArray(cart?.items)) {
        const mapped: CartItem[] = cart.items
          .map((i: any) => ({
            id:       i.product?.toString() || '',
            name:     i.name     || '',
            price:    Number(i.price)    || 0,
            imageUrl: i.imageUrl || '',
            category: i.category || '',
            quantity: Number(i.quantity) || 1,
          }))
          .filter((i: CartItem) => i.id);

        setItems(mapped);
        localStorage.setItem('el_cart', JSON.stringify(mapped));
      }
    } catch {}
  };

  const refresh = async () => {
    const token = localStorage.getItem('el_token');
    if (token) await loadFromServer(token);
  };

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const add = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === item.id);
      if (idx >= 0) {
        const n = [...prev];
        n[idx] = { ...n[idx], quantity: n[idx].quantity + 1 };
        return n;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setOpen(true);
  };

  const remove    = (id: string) => setItems(p => p.filter(i => i.id !== id));
  const increment = (id: string) => setItems(p =>
    p.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
  const decrement = (id: string) => setItems(p =>
    p.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i)
     .filter(i => i.quantity > 0));
  const clear    = () => { setItems([]); localStorage.removeItem('el_cart'); };
  const isInCart = (id: string) => items.some(i => i.id === id);

  return (
    <Ctx.Provider value={{
      items, count, total, syncing,
      add, remove, increment, decrement, clear, isInCart,
      open, setOpen, loadFromServer, refresh,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => useContext(Ctx);