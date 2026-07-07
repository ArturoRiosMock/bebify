import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/app/context/AuthContext';
import { CookieConsentProvider } from '@/app/context/CookieConsentContext';
import { MainLayout } from '@/app/layouts/MainLayout';
import { HomePage } from '@/app/pages/HomePage';
import { CollectionPage } from '@/app/pages/CollectionPage';
import { ProductsPage } from '@/app/pages/ProductsPage';
import { ProductPage } from '@/app/pages/ProductPage';
import { BlogPage } from '@/app/pages/BlogPage';
import { BlogPostPage } from '@/app/pages/BlogPostPage';
import { LoginPage } from '@/app/pages/LoginPage';
import { ForgotPasswordPage } from '@/app/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/app/pages/ResetPasswordPage';
import { RegisterPage } from '@/app/pages/RegisterPage';
import { FAQPage } from '@/app/pages/FAQPage';
import { PrivacyPolicyPage } from '@/app/pages/PrivacyPolicyPage';
import { CookiePolicyPage } from '@/app/pages/CookiePolicyPage';
import { AdminBannersPage } from '@/app/pages/AdminBannersPage';
import { EdicionHomePage } from '@/app/pages/EdicionHomePage';
import { SearchResultsPage } from '@/app/pages/SearchResultsPage';
import { AccountPage } from '@/app/pages/AccountPage';
import { OrderDetailPage } from '@/app/pages/OrderDetailPage';
import { CartPage } from '@/app/pages/CartPage';

function App() {
  return (
    <CookieConsentProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
            <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />
            <Route path="/account/reset/:customerId/:resetToken" element={<ResetPasswordPage />} />
            <Route path="/registro" element={<RegisterPage />} />
            <Route path="/aviso-de-privacidad" element={<PrivacyPolicyPage />} />
            <Route path="/politica-de-cookies" element={<CookiePolicyPage />} />
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/productos" element={<ProductsPage />} />
              <Route path="/buscar" element={<SearchResultsPage />} />
              <Route path="/carrito" element={<CartPage />} />
              <Route path="/cuenta" element={<AccountPage />} />
              <Route path="/pedidos" element={<AccountPage />} />
              <Route path="/pedidos/:orderNumber" element={<OrderDetailPage />} />
              <Route path="/categorias/:handle" element={<CollectionPage />} />
              <Route path="/producto/:handle" element={<ProductPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:blogHandle/:articleHandle" element={<BlogPostPage />} />
              <Route path="/preguntas-frecuentes" element={<FAQPage />} />
            </Route>
            <Route path="/admin/banners" element={<AdminBannersPage />} />
            <Route path="/edicion" element={<EdicionHomePage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </CookieConsentProvider>
  );
}

export default App;
