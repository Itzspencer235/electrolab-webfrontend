'use client';
import './globals.css';
import { Inter }            from 'next/font/google';
import { LangProvider }     from '@/context/LangContext';
import { AuthProvider }     from '@/context/AuthContext';
import { CartProvider }     from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { useEffect }        from 'react';
import { useAuth }          from '@/context/AuthContext';
import { useCart }          from '@/context/CartContext';
import { useWishlist }      from '@/context/WishlistContext';
import Navbar         from '@/components/Navbar';
import Footer         from '@/components/Footer';
import CartDrawer     from '@/components/CartDrawer';
import WishlistDrawer from '@/components/WishlistDrawer';

const inter = Inter({ subsets: ['latin'] });

function AppWiring({ children }: { children: React.ReactNode }) {
  const auth     = useAuth();
  const cart     = useCart();
  const wishlist = useWishlist();

  useEffect(() => {
    auth.setOnLoginSuccess(async (token: string) => {
      await Promise.all([
        cart.loadFromServer(token),
        wishlist.loadFromServer(token),
      ]);
    });
  }, []);

  useEffect(() => {
    if (auth.token && !auth.loading) {
      cart.loadFromServer(auth.token);
      wishlist.loadFromServer(auth.token);
    }
  }, [auth.loading]);

  return <>{children}</>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const content = (
    <LangProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppWiring>
              <Navbar />
              <CartDrawer />
              <WishlistDrawer />
              {/* pb-20 keeps the old gap above the footer, now in the page's own grey */}
              <main className="pt-16 pb-20 min-h-screen bg-gray-50">
                {children}
              </main>
              <Footer />
            </AppWiring>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </LangProvider>
  );

  // Only wrap with Google provider if client ID is configured
  if (googleClientId && googleClientId !== 'your_actual_google_client_id.apps.googleusercontent.com') {
    const { GoogleOAuthProvider } = require('@react-oauth/google');
    return (
      <html lang="fr">
        <body className={inter.className}>
          <GoogleOAuthProvider clientId={googleClientId}>
            {content}
          </GoogleOAuthProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="fr">
      <body className={inter.className}>
        {content}
      </body>
    </html>
  );
}