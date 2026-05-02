'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useLang } from '@/context/LangContext';
import { WHATSAPP_NUMBER } from '@/lib/constants';
import { MapPin, Phone, Mail } from 'lucide-react';
import logo from '@/assets/images/icon.png';

export default function Footer() {
  const { lang } = useLang();

  const t = {
    fr: { desc: 'Boutique d\'électronique & plateforme d\'apprentissage Arduino, ESP32 et IoT au Tchad.',
          links: 'Liens', shop: 'Boutique', tutos: 'Tutoriels', ai: 'Assistant IA',
          contact: 'Contact', rights: 'Tous droits réservés' },
    en: { desc: 'Electronics shop & Arduino, ESP32 and IoT learning platform in Chad.',
          links: 'Links', shop: 'Shop', tutos: 'Tutorials', ai: 'AI Assistant',
          contact: 'Contact', rights: 'All rights reserved' },
    ar: { desc: 'متجر إلكترونيات ومنصة تعلم Arduino وESP32 وإنترنت الأشياء في تشاد.',
          links: 'روابط', shop: 'المتجر', tutos: 'الدروس', ai: 'المساعد الذكي',
          contact: 'تواصل', rights: 'جميع الحقوق محفوظة' },
  }[lang];

  return (
    <footer className="bg-blue-950 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* Brand */}
        <div>
          <Link href="/" className="inline-flex items-center gap-2 mb-5">
            <Image
              src={logo}
              alt="IP ElectroLab"
              height={50}
              className="h-10 w-auto brightness-0 invert" /* invert makes it white on dark bg */
            />
          </Link>
          <p className="text-blue-200 text-sm leading-relaxed">{t.desc}</p>
        </div>

        {/* Links */}
        <div>
          <h3 className="font-bold text-lg mb-4">{t.links}</h3>
          <ul className="space-y-2 text-blue-200 text-sm">
            {[
              { href: '/boutique',  label: t.shop },
              { href: '/tutoriels', label: t.tutos },
              { href: '/assistant', label: t.ai },
              { href: '/contact',   label: t.contact },
            ].map(l => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white transition">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-bold text-lg mb-4">{t.contact}</h3>
          <ul className="space-y-3 text-blue-200 text-sm">
            <li className="flex items-center gap-2">
              <MapPin size={15} className="text-blue-400 shrink-0" />
              N'Djamena, Tchad
            </li>
            <li className="flex items-center gap-2">
              <Phone size={15} className="text-blue-400 shrink-0" />
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="hover:text-white transition">
                {WHATSAPP_NUMBER}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={15} className="text-blue-400 shrink-0" />
              contact@ipelectrolab.com
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-blue-900 py-4 text-center text-blue-400 text-xs">
        © {new Date().getFullYear()} IP ElectroLab — {t.rights}
      </div>
    </footer>
  );
}