import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegisterRestaurantPage from './pages/RegisterRestaurantPage';
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
        <Route path="/register/restaurant" element={<RegisterRestaurantPage />} />

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

export default App;
