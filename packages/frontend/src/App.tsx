import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Suspense, lazy } from 'react';
import { AuthProvider } from '@/contexts';
import { MainLayout } from '@/components/layout';
import { ToastProvider, Loading } from '@/components/ui';
import { Login } from '@/pages/auth';
import './App.css';

// Lazy load pages for performance
const DashboardOperador = lazy(() => import('@/pages/dashboard').then(module => ({ default: module.DashboardOperador })));
const DashboardGestao = lazy(() => import('@/pages/dashboard').then(module => ({ default: module.DashboardGestao })));
const DashboardCadastroGR = lazy(() => import('@/pages/dashboard').then(module => ({ default: module.DashboardCadastroGR })));
const TvDisplay = lazy(() => import('@/pages/dashboard').then(module => ({ default: module.TvDisplay })));

const TvMapa = lazy(() => import('@/pages/tv').then(module => ({ default: module.TvMapa })));
const TvKpis = lazy(() => import('@/pages/tv').then(module => ({ default: module.TvKpis })));
const TvCadastros = lazy(() => import('@/pages/tv').then(module => ({ default: module.TvCadastros })));
const TvAlertas = lazy(() => import('@/pages/tv').then(module => ({ default: module.TvAlertas })));

const Configuracoes = lazy(() => import('@/pages/Configuracoes').then(module => ({ default: module.Configuracoes })));
const Auditoria = lazy(() => import('@/pages/Auditoria').then(module => ({ default: module.Auditoria })));
const Notificacoes = lazy(() => import('@/pages/Notificacoes').then(module => ({ default: module.Notificacoes })));
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />

              {/* TV Display - Legacy (redirects to new) */}
              <Route path="/tv-display" element={<Suspense fallback={<Loading />}><TvDisplay /></Suspense>} />

              {/* TV Pages - Full screen, no layout */}
              <Route path="/tv/mapa" element={<Suspense fallback={<Loading />}><TvMapa /></Suspense>} />
              <Route path="/tv/kpis" element={<Suspense fallback={<Loading />}><TvKpis /></Suspense>} />
              <Route path="/tv/cadastros" element={<Suspense fallback={<Loading />}><TvCadastros /></Suspense>} />
              <Route path="/tv/alertas" element={<Suspense fallback={<Loading />}><TvAlertas /></Suspense>} />

              {/* Protected Routes with Layout */}
              <Route
                path="/dashboard/operador"
                element={
                  <MainLayout>
                    <Suspense fallback={<Loading />}>
                      <DashboardOperador />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/dashboard/gestao"
                element={
                  <MainLayout>
                    <Suspense fallback={<Loading />}>
                      <DashboardGestao />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/dashboard/cadastro-gr"
                element={
                  <MainLayout>
                    <Suspense fallback={<Loading />}>
                      <DashboardCadastroGR />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/auditoria"
                element={
                  <MainLayout>
                    <Suspense fallback={<Loading />}>
                      <Auditoria />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/notificacoes"
                element={
                  <MainLayout>
                    <Suspense fallback={<Loading />}>
                      <Notificacoes />
                    </Suspense>
                  </MainLayout>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <MainLayout>
                    <Suspense fallback={<Loading />}>
                      <Configuracoes />
                    </Suspense>
                  </MainLayout>
                }
              />

              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard/operador" replace />} />

              {/* Catch all - redirect to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard/operador" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
