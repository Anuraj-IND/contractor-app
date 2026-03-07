import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Suppliers from './pages/Suppliers';
import SupplierDetail from './pages/SupplierDetail';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Laborers from './pages/Laborers';
import Attendance from './pages/Attendance';
import Invoices from './pages/Invoices';
import SiteImages from './pages/SiteImages';
import Settings from './pages/Settings';
import LaborerHome from './pages/LaborerHome';
import LaborerDetail from './pages/LaborerDetail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute adminOnly>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/suppliers"
              element={
                <ProtectedRoute adminOnly>
                  <Suppliers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/suppliers/:id"
              element={
                <ProtectedRoute adminOnly>
                  <SupplierDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute adminOnly>
                  <Customers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers/:id"
              element={
                <ProtectedRoute adminOnly>
                  <CustomerDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute adminOnly>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute adminOnly>
                  <ProjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/laborers"
              element={
                <ProtectedRoute adminOnly>
                  <Laborers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/laborers/:id"
              element={
                <ProtectedRoute adminOnly>
                  <LaborerDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute adminOnly>
                  <Attendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute adminOnly>
                  <Invoices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/images"
              element={
                <ProtectedRoute adminOnly>
                  <SiteImages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute adminOnly>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/laborer/home"
              element={
                <ProtectedRoute>
                  <LaborerHome />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)'
            },
            success: { iconTheme: { primary: '#2F855A', secondary: '#fff' } },
            error: { iconTheme: { primary: '#E53E3E', secondary: '#fff' } }
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
