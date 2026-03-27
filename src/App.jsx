import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Helmet } from "react-helmet";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Calendario from "@/pages/Calendario";
import Clientes from "@/pages/Clientes";
import ClientProfile from "@/pages/ClientProfile";
import Analitica from "@/pages/Analitica";
import Productos from "@/pages/Productos";
import FinancialDashboard from "@/pages/FinancialDashboard";
import Configuracion from "@/pages/Configuracion";
import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import PublicBookingPage from './pages/public/PublicBookingPage';
import ConsentPage from './pages/public/ConsentPage';
import config from '@/config';

function App() {
  const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }
    return user ? children : <Navigate to="/login" />;
  };

  return (
    <ThemeProvider>
      <Helmet>
        <title>{config.businessSubtitle ? `${config.appName} | ${config.businessSubtitle}` : config.appName}</title>
        <meta
          name="description"
          content={`Sistema de gestión profesional. Gestiona citas, clientes, analítica y contabilidad.`}
        />
      </Helmet>
      <Router>
        <AuthProvider>
          <TooltipProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/reservar" element={<PublicBookingPage />} />
              <Route path="/consent" element={<ConsentPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/calendario" element={<Calendario />} />
                        <Route path="/clientes" element={<Clientes />} />
                        <Route
                          path="/clientes/:id"
                          element={<ClientProfile />}
                        />
                        <Route path="/analitica" element={<Analitica />} />
                        <Route path="/productos" element={<Productos />} />
                        <Route path="/caja" element={<FinancialDashboard />} />
                        <Route path="/configuracion" element={<Configuracion />} />
                        <Route path="*" element={<Navigate to="/" />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster />
            </LocalizationProvider>
          </TooltipProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
