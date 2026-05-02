'use client';
import {
  createContext, useContext, useState,
  useEffect, useRef, ReactNode,
} from 'react';
import { syncWishlistAPI, getWishlist } from '@/lib/api';

export interface WishItem {
  id: string; name: string; price: number;
  imageUrl: string; category: string;
}

interface WishCtx {
  items:          WishItem[];
  count:          number;
  syncing:        boolean;
  toggle:         (item: WishItem) => void;
  remove:         (id: string) => void;
  isWished:       (id: string) => boolean;
  open:           boolean;
  setOpen:        (v: boolean) => void;
  loadFromServer: (token: string) => Promise<void>;
  refresh:        () => Promise<void>;
}

const Ctx = createContext<WishCtx>({} as WishCtx);

const AUTO_REFRESH_MS = 30_000;

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items,   setItems]   = useState<WishItem[]>([]);
  const [open,    setOpen]    = useState(false);
  const [syncing, setSyncing] = useState(false);
  const mounted      = useRef(false);
  const syncTimer    = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load from localStorage on mount ───────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('el_wishlist');
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
        if (token) await loadFromServer(token);
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
    localStorage.setItem('el_wishlist', JSON.stringify(items));

    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      const token = localStorage.getItem('el_token');
      if (!token) return;
      setSyncing(true);
      try {
        await syncWishlistAPI(
          items.map(i => ({
            product:  i.id,
            name:     i.name,
            price:    i.price,
            imageUrl: i.imageUrl,
            category: i.category,
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
      const wishlist = await getWishlist(token);
      if (Array.isArray(wishlist?.items)) {
        const mapped: WishItem[] = wishlist.items
          .map((i: any) => ({
            id:       i.product?.toString() || '',
            name:     i.name     || '',
            price:    Number(i.price)    || 0,
            imageUrl: i.imageUrl || '',
            category: i.category || '',
          }))
          .filter((i: WishItem) => i.id);

        setItems(mapped);
        localStorage.setItem('el_wishlist', JSON.stringify(mapped));
      }
    } catch {}
  };

  const refresh = async () => {
    const token = localStorage.getItem('el_token');
    if (token) await loadFromServer(token);
  };

  const toggle = (item: WishItem) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      return exists ? prev.filter(i => i.id !== item.id) : [...prev, item];
    });
  };

  const remove   = (id: string) => setItems(p => p.filter(i => i.id !== id));
  const isWished = (id: string) => items.some(i => i.id === id);

  return (
    <Ctx.Provider value={{
      items, count: items.length, syncing,
      toggle, remove, isWished,
      open, setOpen, loadFromServer, refresh,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useWishlist = () => useContext(Ctx);