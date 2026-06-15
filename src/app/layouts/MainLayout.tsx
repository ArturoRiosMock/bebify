import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { CartProvider } from '@/app/context/CartContext';
import { WishlistProvider } from '@/app/context/WishlistContext';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';
import { WhatsAppButton } from '@/app/components/WhatsAppButton';
import { Cart } from '@/app/components/Cart';
import { WishlistDrawer } from '@/app/components/WishlistDrawer';
import { AddToCartAnimation } from '@/app/components/AddToCartAnimation';
import { AgeVerification } from '@/app/components/AgeVerification';
import { CookieBanner } from '@/app/components/CookieBanner';

export const MainLayout: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);

  const handleCartAnimationComplete = useCallback(() => {
    if (!isSearchDrawerOpen) {
      setIsCartOpen(true);
    }
  }, [isSearchDrawerOpen]);

  return (
    <AgeVerification>
      <CartProvider>
        <WishlistProvider>
          <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden max-w-[100vw]">
            <Header
              onCartClick={() => setIsCartOpen(true)}
              onWishlistClick={() => setIsWishlistOpen(true)}
              searchDrawerOpen={isSearchDrawerOpen}
              onSearchDrawerChange={setIsSearchDrawerOpen}
            />

            <main className="flex-1">
              <Outlet />
            </main>

            <Footer />
            <WhatsAppButton />
            <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <WishlistDrawer isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
            <AddToCartAnimation onAnimationComplete={handleCartAnimationComplete} />
            <CookieBanner />
          </div>
        </WishlistProvider>
      </CartProvider>
    </AgeVerification>
  );
};
