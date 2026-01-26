import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth, getDefaultRoute } from '@/contexts';
import { MainLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ToastProvider, Loading } from '@/components/ui';
import { Login } from '@/pages/auth';
import './App.css';

// Lazy load pages for performance
const DashboardOperador = lazy(() => import('@/pages/dashboard').then(module => ({ default: module.DashboardOperador })));
const DashboardGestao = lazy(() => import('@/pages/dashboard').then(module => ({ default: module.DashboardGestao })));
const DashboardCadastroGR = lazy(() => import('@/pages/dashboard').then(module => ({ default: module.DashboardCadastroGR })));
const TvDisplay = lazy(() => import('@/pages/dashboard').then(module => ({ default: module.TvDisplay })));
const KpiDetalhes = lazy(() => import('@/pages/dashboard').then(module => ({ default: module.KpiDetalhes })));

const TvMapa = lazy(() => import('@/pages/tv').then(module => ({ default: module.TvMapa })));
const TvKpis = lazy(() => import('@/pages/tv').then(module => ({ default: module.TvKpis })));
const TvCadastros = lazy(() => import('@/pages/tv').then(module => ({ default: module.TvCadastros })));
const TvAlertas = lazy(() => import('@/pages/tv').then(module => ({ default: module.TvAlertas })));

const Configuracoes = lazy(() => import('@/pages/Configuracoes').then(module => ({ default: module.Configuracoes })));
const Auditoria = lazy(() => import('@/pages/Auditoria').then(module => ({ default: module.Auditoria })));
const Notificacoes = lazy(() => import('@/pages/Notificacoes').then(module => ({ default: module.Notificacoes })));

const queryClient = new QueryClient();

// Redirect baseado no role do usuario
function DefaultRedirect() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <Loading />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  return <Navigate to={getDefaultRoute(user.role)} replace />;
}

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
                  <ProtectedRoute permission="viewDashboardOperador">
                    <MainLayout>
                      <Suspense fallback={<Loading />}>
                        <DashboardOperador />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/gestao"
                element={
                  <ProtectedRoute permission="viewDashboardGestao">
                    <MainLayout>
                      <Suspense fallback={<Loading />}>
                        <DashboardGestao />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/cadastro-gr"
                element={
                  <ProtectedRoute permission="viewDashboardCadastroGR">
                    <MainLayout>
                      <Suspense fallback={<Loading />}>
                        <DashboardCadastroGR />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/kpi/:tipo"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Suspense fallback={<Loading />}>
                        <KpiDetalhes />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/auditoria"
                element={
                  <ProtectedRoute permission="viewAuditoria">
                    <MainLayout>
                      <Suspense fallback={<Loading />}>
                        <Auditoria />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notificacoes"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Suspense fallback={<Loading />}>
                        <Notificacoes />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Suspense fallback={<Loading />}>
                        <Configuracoes />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Redirect root to user's default dashboard */}
              <Route path="/" element={<DefaultRedirect />} />

              {/* Catch all - redirect to user's default dashboard */}
              <Route path="*" element={<DefaultRedirect />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
