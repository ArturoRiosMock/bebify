import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingCart, Menu, X, MapPin, Package, Search, Heart, LogIn, LogOut, ChevronDown, ChevronUp, Wine, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@/app/context/CartContext';
import { useWishlist } from '@/app/context/WishlistContext';
import { useAuth } from '@/app/context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { PLACEHOLDER_IMAGES } from '@/assets/placeholders';
import { SearchDrawer } from '@/app/components/SearchDrawer';
import { MENU_ITEMS, STATIC_LINKS, getCategoryHref } from '@/data/navigation-menu';
import type { MenuItem, MenuLink, MenuAccordion } from '@/data/navigation-menu';

const logo = PLACEHOLDER_IMAGES.logo;

interface HeaderProps {
  onCartClick: () => void;
  onWishlistClick?: () => void;
  searchDrawerOpen: boolean;
  onSearchDrawerChange: (open: boolean) => void;
}

const announcements = [
  'Bebify – La Plataforma de Bebidas B2B. +2,000 productos de +200 proveedores.',
  'Entregas en menos de 24 horas en toda la CDMX. ¡Pedidos sin errores!',
  '¿Aún no tienes cuenta? Regístrate y accede a precios exclusivos B2B.'
];

/** Código postal + botón Rastreo en la barra oscura (reactivar cuando haya integración). */
const SHOW_HEADER_LOCATION_AND_TRACKING = false;

export const Header = ({ onCartClick, onWishlistClick, searchDrawerOpen, onSearchDrawerChange }: HeaderProps) => {
  const { getTotalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [zipCode, setZipCode] = useState('');
  const setSearchDrawerOpen = onSearchDrawerChange;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setHoveredCategory(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <header className="bg-white text-[#212121] sticky top-0 z-40 shadow-md">
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-[#4da6ff] to-[#0055a2] py-2 overflow-hidden">
        <div className="container mx-auto px-3 sm:px-4 max-w-[100vw]">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentAnnouncementIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center text-sm text-white font-medium"
            >
              {announcements[currentAnnouncementIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-[#212121]">
        <div className="container mx-auto px-3 sm:px-4 max-w-[100vw]">
          <div className="flex items-center justify-between py-3 sm:py-4 gap-2 sm:gap-4 min-w-0">
            {/* Logo */}
            <img
              src={logo}
              alt="Bebify"
              className="h-8 sm:h-9 md:h-11 flex-shrink-0 cursor-pointer object-contain"
              onClick={() => navigate('/')}
            />

            {SHOW_HEADER_LOCATION_AND_TRACKING && (
              <>
                <div className="hidden lg:flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-[#0055a2]" />
                  <input
                    type="text"
                    placeholder="Ingresa tu código postal"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="border-b border-gray-500 focus:border-[#0055a2] outline-none px-2 py-1 w-40 bg-transparent text-white placeholder-gray-400"
                  />
                </div>
                <button
                  type="button"
                  className="hidden lg:flex items-center gap-2 bg-[#0055a2] text-white px-4 py-2 rounded-lg hover:bg-[#004488] transition-colors"
                >
                  <Package className="w-4 h-4" />
                  <span className="text-sm font-medium">Rastreo</span>
                </button>
              </>
            )}

            {/* Right Icons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                onClick={() => setSearchDrawerOpen(true)}
                aria-label="Abrir búsqueda"
              >
                <Search className="w-6 h-6" />
              </button>
              {isAuthenticated ? (
                <div className="hidden lg:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/cuenta')}
                    className="flex items-center gap-1.5 text-sm text-[#4da6ff] font-medium hover:text-white transition-colors max-w-[140px] truncate"
                    title="Mi cuenta"
                  >
                    <User className="w-4 h-4 shrink-0" />
                    {user?.firstName || 'Mi cuenta'}
                  </button>
                  <button
                    onClick={logout}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-5 h-5 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="hidden lg:flex items-center gap-1.5 bg-[#0055a2] text-white px-4 py-2 rounded-lg hover:bg-[#004488] transition-colors text-sm font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </button>
              )}
              <button
                onClick={onWishlistClick}
                className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Favoritos"
              >
                <Heart className={`w-6 h-6 ${wishlistCount > 0 ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                    {wishlistCount}
                  </span>
                )}
              </button>
              <button
                onClick={onCartClick}
                data-cart-icon
                className="relative bg-[#0055a2] text-white p-2 rounded-lg hover:bg-[#004488] transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#FF6B35] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {getTotalItems()}
                  </span>
                )}
              </button>
              <button
                className="lg:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu - Desktop */}
      <nav className="hidden lg:block border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-1 py-2">
            {MENU_ITEMS.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.type === 'accordion' ? setHoveredCategory(item.label) : undefined}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                {item.type === 'link' ? (
                  <Link
                    to={getCategoryHref(item.handle)}
                    onClick={closeMenus}
                    className="flex items-center gap-1 text-[#212121] hover:text-[#0055a2] transition-colors font-medium text-sm whitespace-nowrap px-3 py-2 rounded hover:bg-gray-50"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <>
                    <button
                      className="flex items-center gap-1 text-[#212121] hover:text-[#0055a2] transition-colors font-medium text-sm whitespace-nowrap px-3 py-2 rounded hover:bg-gray-50"
                    >
                      {item.label}
                      <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                    {hoveredCategory === item.label && (
                        <div className="absolute top-full left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
                          style={{ minWidth: 280 }}
                        >
                          <div className="p-3">
                            <div className="grid grid-cols-2 gap-0.5">
                              {item.children.map((child) => (
                                <Link
                                  key={child.handle}
                                  to={getCategoryHref(child.handle)}
                                  onClick={closeMenus}
                                  className="text-left px-3 py-2 rounded-lg text-sm text-[#212121] hover:bg-[#f0f7ff] hover:text-[#0055a2] transition-colors block"
                                >
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                            <div className="border-t border-gray-100 mt-2 pt-2">
                              <Link
                                to={getCategoryHref(item.parentHandle)}
                                onClick={closeMenus}
                                className="block w-full text-center text-xs font-semibold text-[#0055a2] hover:text-[#004488] py-1.5 transition-colors"
                              >
                                Ver todos los {item.label.toLowerCase()} →
                              </Link>
                            </div>
                          </div>
                        </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {/* Separador */}
            <div className="w-px h-5 bg-gray-300 mx-2" />

            {STATIC_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={
                  link.href === '/registro'
                    ? 'flex items-center gap-1.5 bg-[#0055a2] text-white px-4 py-2 rounded-lg hover:bg-[#004488] transition-colors text-sm font-medium whitespace-nowrap'
                    : 'flex items-center gap-1 text-[#212121] hover:text-[#0055a2] transition-colors font-medium text-sm whitespace-nowrap px-3 py-2 rounded hover:bg-gray-50'
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden border-t border-gray-200 overflow-hidden"
          >
            <nav className="container mx-auto px-4 py-4 space-y-1">
              {/* Mobile Auth */}
              {isAuthenticated ? (
                <div className="mb-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => { setMobileMenuOpen(false); navigate('/cuenta'); }}
                    className="flex items-center gap-2 w-full text-left text-[#0055a2] bg-blue-50 py-2.5 px-4 rounded-lg font-medium"
                  >
                    <User className="w-5 h-5" />
                    Mi cuenta / Pedidos
                  </button>
                  <div className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg">
                    <span className="text-sm text-[#212121] font-medium truncate">
                      {user?.firstName || user?.email}
                    </span>
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="text-sm text-red-500 font-medium flex items-center gap-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Salir
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                  className="flex items-center gap-2 w-full text-left text-white bg-[#0055a2] py-2.5 px-4 rounded-lg font-medium mb-2"
                >
                  <LogIn className="w-5 h-5" />
                  Iniciar Sesión
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchDrawerOpen(true);
                }}
                className="flex items-center gap-2 w-full text-left text-[#212121] py-2 px-4 hover:bg-gray-100 rounded-lg transition-colors font-medium mb-2 border border-gray-200"
              >
                <Search className="w-5 h-5 text-[#0055a2]" />
                Buscar productos
              </button>

              {/* Menu items */}
              {MENU_ITEMS.map((item) => (
                item.type === 'link' ? (
                  <Link
                    key={item.handle}
                    to={getCategoryHref(item.handle)}
                    onClick={closeMenus}
                    className="block w-full text-left text-[#212121] py-3 px-4 hover:bg-gray-50 transition-colors font-medium border-b border-gray-100 last:border-0"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <div key={item.label} className="border-b border-gray-100">
                    <button
                      onClick={() => setOpenAccordion(openAccordion === item.label ? null : item.label)}
                      className="flex items-center justify-between w-full text-left text-[#212121] py-3 px-4 hover:bg-gray-50 transition-colors font-medium"
                    >
                      <span className="flex items-center gap-2">
                        {item.label}
                      </span>
                      {openAccordion === item.label
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    <AnimatePresence>
                      {openAccordion === item.label && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden bg-gray-50"
                        >
                          {item.children.map((child) => (
                            <Link
                              key={child.handle}
                              to={getCategoryHref(child.handle)}
                              onClick={closeMenus}
                              className="block w-full text-left text-[#444] py-2.5 pl-8 pr-4 hover:bg-blue-50 hover:text-[#0055a2] transition-colors text-sm border-t border-gray-100"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              ))}

              {/* ENLACES */}
              <div className="pt-3">
                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase px-4 pb-1">
                  ENLACES
                </p>
                {STATIC_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-left text-[#212121] py-2.5 px-4 hover:bg-gray-50 transition-colors font-medium border-b border-gray-100 last:border-0"
                  >
                    {link.label}
                  </Link>
                ))}
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
