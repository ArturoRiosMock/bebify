import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Menu, X, Search, MessageCircle, User, ChevronDown, Heart, PartyPopper, Truck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '@/app/context/CartContext';
import { useWishlist } from '@/app/context/WishlistContext';
import { motion, AnimatePresence } from 'motion/react';
import { PLACEHOLDER_IMAGES } from '@/assets/placeholders';
import { useShopifyCollections } from '@/shopify/hooks/useShopifyCollections';
import { SearchDrawer } from '@/app/components/SearchDrawer';
import { MegaMenuPanel } from '@/app/components/MegaMenuPanel';
import { resolveDesktopNav, catalogEntryHref, type CatalogEntry } from '@/config/category-catalog';
import { DEFAULT_CATEGORY_ICON, getCategoryIcon, getNavGroupIcon } from '@/config/category-icons';

const logo = PLACEHOLDER_IMAGES.logo;

interface HeaderProps {
  onCartClick: () => void;
  onWishlistClick?: () => void;
  onCategoryClick: (collectionHandle: string) => void;
  searchDrawerOpen: boolean;
  onSearchDrawerChange: (open: boolean) => void;
}

const announcements = [
  '¡Envios GRATIS en compras mayores a $2000 MXN!',
  '¡Cotiza tu evento y hazlo inolvidable! Barras libres, eventos corporativos y más.',
];

export const Header = ({ onCartClick, onWishlistClick, onCategoryClick, searchDrawerOpen, onSearchDrawerChange }: HeaderProps) => {
  const { getTotalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const { collections, loading: collectionsLoading } = useShopifyCollections();

  const handleNewsletterClick = () => {
    if (location.pathname === '/') {
      document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/#newsletter');
    }
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const setSearchDrawerOpen = onSearchDrawerChange;

  const desktopNavItems = useMemo(() => resolveDesktopNav(collections), [collections]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const handleCategoryClick = (collectionHandle: string) => {
    onCategoryClick(collectionHandle);
    setMobileMenuOpen(false);
  };

  const goToNavEntry = (entry: CatalogEntry) => {
    if (entry.type === 'heading') return;
    if (entry.type === 'route') {
      navigate(entry.path);
      setMobileMenuOpen(false);
      return;
    }
    navigate(catalogEntryHref(entry));
    setMobileMenuOpen(false);
  };

  const MobileEntryIcon = ({ entry }: { entry: CatalogEntry }) => {
    if (entry.type === 'heading') return null;
    const iconHandle =
      entry.type === 'collection' ? entry.handle : entry.collectionHandle;
    const Icon =
      entry.type === 'route' ? DEFAULT_CATEGORY_ICON : getCategoryIcon(iconHandle);
    return <Icon className="h-5 w-5 shrink-0 text-[#0c3c1f]" aria-hidden />;
  };

  return (
    <header className="bg-white text-[#212121] sticky top-0 z-40 shadow-md">
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-[#FDB93A] to-[#FF8A00] py-2 overflow-hidden">
        <div className="container mx-auto px-3 sm:px-4 max-w-[100vw]">
          {/* Desktop: ambos mensajes lado a lado con separador */}
          <div className="hidden md:flex items-center justify-center gap-6 text-sm font-medium text-[#212121]">
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4 shrink-0" aria-hidden />
              ¡Envíos GRATIS en compras mayores a $2.000 MXN!
            </span>
            <span className="h-4 w-px bg-[#212121]/30" aria-hidden />
            <span className="flex items-center gap-2">
              <PartyPopper className="h-4 w-4 shrink-0" aria-hidden />
              ¡Cotiza tu evento y hazlo inolvidable!
            </span>
          </div>
          {/* Mobile: carrusel rotativo */}
          <AnimatePresence mode="wait">
            <motion.p
              key={currentAnnouncementIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="md:hidden text-center text-sm text-[#212121] font-medium"
            >
              {announcements[currentAnnouncementIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Main Header */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-3 sm:px-4 max-w-[100vw]">
          <div className="flex items-center justify-between py-3 sm:py-4 gap-2 sm:gap-4 min-w-0">
            {/* Logo */}
            <button
              type="button"
              onClick={() => {
                navigate('/');
                setMobileMenuOpen(false);
              }}
              className="flex-shrink-0"
              aria-label="Ir al inicio"
            >
              <img
                src={logo}
                alt="Mr. Brown"
                className="h-9 sm:h-10 md:h-12 max-h-12 object-contain"
              />
            </button>

            {/* Search Trigger - Desktop */}
            <button
              onClick={() => setSearchDrawerOpen(true)}
              className="flex-1 max-w-xl hidden md:flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-400 hover:border-gray-400 transition-colors cursor-text bg-transparent"
            >
              <Search className="w-4 h-4" />
              <span>¿Qué estás buscando?</span>
            </button>

            {/* Right Icons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#212121]"
                onClick={() => setSearchDrawerOpen(true)}
                aria-label="Abrir búsqueda"
              >
                <Search className="w-6 h-6" />
              </button>
              <button
                type="button"
                className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => navigate('/contacto')}
                aria-label="Ir a contacto"
              >
                <MessageCircle className="w-6 h-6 text-[#212121]" />
              </button>
              <button
                type="button"
                className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={handleNewsletterClick}
                aria-label="Ir al boletín"
              >
                <User className="w-6 h-6 text-[#212121]" />
              </button>
              <button
                onClick={onWishlistClick}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Favoritos"
              >
                <Heart className={`w-6 h-6 ${wishlistCount > 0 ? 'fill-red-500 text-red-500' : 'text-[#212121]'}`} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                    {wishlistCount}
                  </span>
                )}
              </button>
              <button
                onClick={onCartClick}
                data-cart-icon
                className="relative bg-[#0c3c1f] text-white p-2 rounded-lg hover:bg-[#0a3019] transition-colors"
                aria-label={`Abrir carrito de compras${getTotalItems() > 0 ? ` (${getTotalItems()} artículos)` : ''}`}
              >
                <ShoppingCart className="w-6 h-6" aria-hidden />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#FF6B35] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {getTotalItems()}
                  </span>
                )}
              </button>
              <button
                type="button"
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-primary-nav"
                aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú de categorías'}
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-[#212121]" /> : <Menu className="w-6 h-6 text-[#212121]" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu - Desktop */}
      <nav className="hidden lg:block border-b border-gray-200" aria-label="Categorías">
        <div className="container mx-auto px-4">
          <div className="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-2 py-3">
            <button
              type="button"
              onClick={() => navigate('/cotizar-evento')}
              className="flex items-center gap-1.5 rounded-full bg-[#FDB93A] px-4 py-1.5 text-sm font-bold text-[#212121] transition-colors hover:bg-[#FF8A00] flex-shrink-0"
            >
              <PartyPopper className="h-4 w-4" />
              Cotiza tu Evento
            </button>

            <button
              type="button"
              onClick={() => handleCategoryClick('Todos')}
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-[#212121] transition-colors hover:bg-[#0a5028] hover:text-white"
            >
              Todos
            </button>

            <button
              type="button"
              onClick={() => {
                navigate('/blog');
                setMobileMenuOpen(false);
              }}
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-[#212121] transition-colors hover:bg-[#0a5028] hover:text-white"
            >
              Blog
            </button>

            {collectionsLoading ? (
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
                ))}
              </div>
            ) : (
              desktopNavItems.map((item) =>
                item.kind === 'link' ? (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToNavEntry(item.entry)}
                    className="rounded-full px-3 py-1.5 text-sm font-semibold text-[#212121] transition-colors hover:bg-[#0a5028] hover:text-white"
                  >
                    {item.title}
                  </button>
                ) : (
                  <div key={item.id} className="group/nav relative">
                    <button
                      type="button"
                      className="flex items-center gap-0.5 rounded-full px-3 py-1.5 text-sm font-semibold text-[#212121] transition-colors group-hover/nav:bg-[#0a5028] group-hover/nav:text-white"
                      aria-haspopup="menu"
                    >
                      {item.title}
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:-rotate-180" aria-hidden />
                    </button>
                    <div className="pointer-events-none invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-1 opacity-0 transition-opacity duration-150 group-hover/nav:visible group-hover/nav:opacity-100 group-hover/nav:pointer-events-auto">
                      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-xl">
                        <MegaMenuPanel
                          entries={item.entries}
                          featuredImage={item.featuredImage}
                          featuredTitle={item.featuredTitle}
                          viewAllLabel={item.viewAllLabel}
                          viewAllHandle={item.viewAllHandle}
                          onSelectCategory={goToNavEntry}
                          onViewAll={handleCategoryClick}
                        />
                      </div>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </nav>

      {/* Mobile / tablet: mismo contenido que desktop, en panel deslizable */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden border-t border-gray-200 bg-white"
            id="mobile-primary-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            <nav
              className="container mx-auto max-h-[min(85dvh,calc(100vh-5rem))] overflow-y-auto overscroll-contain px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
              aria-label="Categorías y enlaces"
            >
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchDrawerOpen(true);
                }}
                className="mb-3 flex min-h-[48px] w-full items-center gap-3 rounded-xl border border-gray-200 px-4 text-left text-sm font-medium text-[#212121] transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                <Search className="h-5 w-5 shrink-0 text-[#0c3c1f]" aria-hidden />
                Buscar productos
              </button>

              <button
                type="button"
                onClick={() => handleCategoryClick('Todos')}
                className="mb-2 flex min-h-[48px] w-full items-center rounded-xl px-4 text-left text-sm font-semibold text-[#0c3c1f] transition-colors hover:bg-gray-100 active:bg-gray-200"
              >
                Todos los productos
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/blog');
                }}
                className="mb-2 flex min-h-[48px] w-full items-center rounded-xl px-4 text-left text-sm font-semibold text-[#0c3c1f] transition-colors hover:bg-gray-100 active:bg-gray-200"
              >
                Blog
              </button>

              {collectionsLoading ? (
                <div className="space-y-2 py-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {desktopNavItems.map((item) => {
                    if (item.kind === 'link') {
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => goToNavEntry(item.entry)}
                          className="flex min-h-[48px] w-full items-center rounded-xl px-4 text-left text-sm font-medium text-[#212121] transition-colors hover:bg-gray-100 active:bg-gray-200"
                        >
                          {item.title}
                        </button>
                      );
                    }
                    const SummaryIcon = getNavGroupIcon(item.id);
                    return (
                      <details
                        key={item.id}
                        className="rounded-xl border border-gray-200 bg-gray-50/50 open:border-[#0c3c1f]/20 open:bg-white open:[&_summary_svg]:rotate-180"
                      >
                        <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-[#0c3c1f] marker:content-none [&::-webkit-details-marker]:hidden">
                          <span className="flex min-w-0 flex-1 items-center gap-2">
                            <SummaryIcon className="h-5 w-5 shrink-0 text-[#0c3c1f]" aria-hidden />
                            <span className="min-w-0">{item.title}</span>
                          </span>
                          <ChevronDown
                            className="h-5 w-5 shrink-0 text-[#0c3c1f] transition-transform duration-200"
                            aria-hidden
                          />
                        </summary>
                        <div className="border-t border-gray-100 px-2 py-2">
                          {item.entries.map((entry, index) => {
                            if (entry.type === 'heading') {
                              return (
                                <p
                                  key={`${item.id}-h-${index}`}
                                  className="px-4 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] first:pt-0"
                                >
                                  {entry.label}
                                </p>
                              );
                            }
                            const key =
                              entry.type === 'route'
                                ? entry.path
                                : entry.type === 'tag'
                                  ? `tag-${entry.tag}`
                                  : entry.handle;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => goToNavEntry(entry)}
                                className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm text-[#212121] transition-colors hover:bg-[#0a5028] hover:text-white active:bg-[#0a5028]/80 active:text-white"
                              >
                                <MobileEntryIcon entry={entry} />
                                {entry.label}
                              </button>
                            );
                          })}
                          {item.viewAllLabel && item.viewAllHandle ? (
                            <button
                              type="button"
                              onClick={() => handleCategoryClick(item.viewAllHandle)}
                              className="mt-1 flex min-h-[44px] w-full items-center justify-center rounded-lg border border-[#0c3c1f]/25 bg-[#0c3c1f]/5 px-4 py-2.5 text-center text-sm font-semibold text-[#0c3c1f] transition-colors hover:bg-[#0c3c1f]/10 active:bg-[#0c3c1f]/15"
                            >
                              {item.viewAllLabel}
                            </button>
                          ) : null}
                        </div>
                      </details>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-[#717182]">Enlaces</p>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/contacto');
                    setMobileMenuOpen(false);
                  }}
                  className="flex min-h-[44px] w-full items-center rounded-xl px-4 text-left text-sm font-medium text-[#212121] transition-colors hover:bg-gray-100"
                >
                  Contacto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/cotizar-evento');
                  }}
                  className="flex min-h-[48px] w-full items-center gap-2 rounded-xl bg-[#FDB93A]/15 px-4 py-3 text-left text-sm font-bold text-[#212121] transition-colors hover:bg-[#FDB93A]/25 active:bg-[#FDB93A]/35"
                >
                  <PartyPopper className="h-5 w-5 shrink-0 text-[#0c3c1f]" aria-hidden />
                  Cotiza tu evento
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Drawer */}
      <SearchDrawer
        isOpen={searchDrawerOpen}
        onClose={() => onSearchDrawerChange(false)}
        onOpenCart={onCartClick}
      />
    </header>
  );
};
