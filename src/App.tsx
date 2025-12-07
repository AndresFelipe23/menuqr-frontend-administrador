import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RestaurantPage from './pages/RestaurantPage';
import EnlacesPage from './pages/EnlacesPage';
import CategoriasPage from './pages/CategoriasPage';
import MesasPage from './pages/MesasPage';
import ItemsMenuPage from './pages/ItemsMenuPage';
import AdicionesPage from './pages/AdicionesPage';
import UsersPage from './pages/UsersPage';
import PedidosPage from './pages/PedidosPage';
import TablesPage from './pages/TablesPage';
import SettingsPage from './pages/SettingsPage';
import PlanesPage from './pages/PlanesPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rutas protegidas con layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/restaurant" element={<RestaurantPage />} />
            <Route path="/dashboard/enlaces" element={<EnlacesPage />} />
            <Route path="/dashboard/categorias" element={<CategoriasPage />} />
            <Route path="/dashboard/mesas" element={<MesasPage />} />
            <Route path="/dashboard/menu" element={<ItemsMenuPage />} />
            <Route path="/dashboard/adiciones" element={<AdicionesPage />} />
            <Route path="/dashboard/users" element={<UsersPage />} />
            <Route path="/dashboard/orders" element={<PedidosPage />} />
            <Route path="/dashboard/tables" element={<TablesPage />} />
            <Route path="/dashboard/settings" element={<SettingsPage />} />
            <Route path="/dashboard/planes" element={<PlanesPage />} />
          </Route>
        </Route>

        {/* Landing page como página inicial */}
        <Route path="/" element={<LandingPage />} />

        {/* 404 - Redirigir a login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function AuthRedirect() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <svg
            className="animate-spin h-8 w-8 text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-gray-600">Cargando...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

export default App;
