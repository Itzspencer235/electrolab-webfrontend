'use client';
import { PromoDialog } from '@/components/PromoPopup';

/** Admin preview: same pop-up, the button just closes it (nothing is counted). */
export default function PromoPreview({ promo, onClose }: { promo: any; onClose: () => void }) {
  return <PromoDialog promo={promo} onClose={onClose} onAct={onClose} />;
}
