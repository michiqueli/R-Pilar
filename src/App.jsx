
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { useSidebarState } from '@/hooks/useSidebarState'; 
import { cn } from '@/lib/utils'; 
import { themeService } from '@/services/themeService';
import { tiposCambioService } from '@/services/tiposCambioService';

// Public Pages
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import RequestAccessPage from '@/pages/RequestAccessPage';

// Protected Pages
import ProjectsListPage from '@/pages/ProjectsListPage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import TasksPage from '@/pages/TasksPage'; 
import TaskDetailPage from '@/pages/TaskDetailPage';
import ClientsPage from '@/pages/ClientsPage';
import ClientDetailPage from '@/pages/ClientDetailPage';
import ProvidersPage from '@/pages/ProvidersPage';
import ProviderDetailPage from '@/pages/ProviderDetailPage';
import MovimientosTesoreriaPage from '@/pages/MovimientosTesoreriaPage';
import NewMovementPage from '@/pages/NewMovementPage'; // Import New Page
import DocumentsPage from '@/pages/DocumentsPage';
import InvestorsPage from '@/pages/InvestorsPage';
import InvestorDetailPage from '@/pages/InvestorDetailPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import CatalogsPage from '@/pages/CatalogsPage';
import SettingsPage from '@/pages/SettingsPage';
import ConfiguracionPage from '@/pages/ConfiguracionPage'; 
import CuentasPage from '@/pages/CuentasPage';
import CuentaDetallePage from '@/pages/CuentaDetallePage';
import InformesPage from '@/pages/InformesPage';
import UsuariosPage from '@/pages/UsuariosPage'; // Nueva Página

// Layout & Components
import Sidebar from '@/components/layout/Sidebar.jsx'; 
import NotFoundPage from '@/components/layout/NotFoundPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Helper component to initialize app state and user config
const AppInitializer = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  useEffect(() => {
    const initApp = async () => {
      // 1. Load and Apply Theme immediately
      const theme = await themeService.getThemePreference(user?.id);
      
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      
      if (theme === 'system') {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }

      // 2. Initialize User Config if Authenticated
      if (isAuthenticated() && user) {
        const existingConfig = await tiposCambioService.getUSDARSConfig(user.id);
        
        if (!existingConfig) {
          await themeService.saveThemePreference(user.id, 'light');
          
          const liveRate = await tiposCambioService.getUSDARSRate();
          const initialRate = liveRate.rate || 1200;
          
          await tiposCambioService.saveUSDARSConfig(user.id, {
            rate: initialRate,
            sourceType: 'manual',
            provider: 'System Init'
          });
        } else {
           if (existingConfig.theme && existingConfig.theme !== theme) {
             root.classList.remove("light", "dark");
             root.classList.add(existingConfig.theme);
             localStorage.setItem('theme_preference', existingConfig.theme);
           }
        }
      }
    };

    initApp();
  }, [user, isAuthenticated]);

  return children;
};

// Internal layout wrapper to use hook context
const MainLayout = ({ children }) => {
  const { isCollapsed, toggleCollapsed } = useSidebarState();

  return (
    <div className="flex min-h-screen transition-colors duration-200 bg-[var(--theme-bg)]">
      <Sidebar isCollapsed={isCollapsed} onToggle={toggleCollapsed} />
      <div 
        className={cn(
          "flex-1 transition-all duration-300 print:ml-0",
          isCollapsed ? "ml-20" : "ml-64"
        )}
      >
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Toaster />
      <AuthProvider>
        <AppInitializer>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/request-access" element={<Navigate to="/solicitar-acceso" replace />} />
              <Route path="/solicitar-acceso" element={<RequestAccessPage />} />

              {/* Protected Routes Layout */}
              <Route
                path="*"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Routes>
                        <Route path="/" element={<Navigate to="/projects" replace />} />
                        <Route path="/projects" element={<ProjectsListPage />} />
                        <Route path="/projects/:id" element={<ProjectDetailPage />} />
                        <Route path="/clients" element={<ClientsPage />} />
                        <Route path="/clients/:id" element={<ClientDetailPage />} />
                        <Route path="/tasks" element={<TasksPage />} />
                        <Route path="/tasks/:id" element={<TaskDetailPage />} />
                        
                        <Route path="/cuentas" element={<CuentasPage />} />
                        <Route path="/cuentas/:cuenta_id" element={<CuentaDetallePage />} />
                        <Route path="/providers" element={<ProvidersPage />} />
                        <Route path="/providers/:id" element={<ProviderDetailPage />} />
                        
                        {/* New Sidebar Structure Routes */}
                        <Route path="/movimientos" element={<MovimientosTesoreriaPage />} />
                        <Route path="/movements/new" element={<NewMovementPage />} /> {/* New Route */}
                        
                        <Route path="/inversionistas" element={<InvestorsPage />} />
                        <Route path="/inversionistas/:id" element={<InvestorDetailPage />} />
                        <Route path="/informes" element={<InformesPage />} />
                        
                        <Route path="/documents" element={<DocumentsPage />} />
                        <Route path="/analytics" element={<AnalyticsPage />} />
                        <Route path="/catalogs" element={<CatalogsPage />} />
                        
                        {/* Settings Routes */}
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/configuracion" element={<ConfiguracionPage />} />
                        <Route path="/usuarios" element={<UsuariosPage />} />

                        {/* Deprecated/Redirected Routes */}
                        <Route path="/compras" element={<Navigate to="/providers" replace />} />
                        <Route path="/expenses" element={<Navigate to="/movimientos" replace />} />
                        <Route path="/incomes" element={<Navigate to="/movimientos" replace />} />
                        
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AppInitializer>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
