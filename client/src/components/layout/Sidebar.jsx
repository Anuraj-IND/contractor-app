import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Factory, 
  Users, 
  Building2, 
  HardHat, 
  Calendar,
  FileText, 
  Image as ImageIcon, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/suppliers', label: 'Suppliers', icon: Factory },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/projects', label: 'Projects', icon: Building2 },
  { path: '/laborers', label: 'Laborers', icon: HardHat },
  { path: '/attendance', label: 'Attendance', icon: Calendar },
  { path: '/invoices', label: 'Invoices', icon: FileText },
  { path: '/images', label: 'Site Images', icon: ImageIcon },
  { path: '/settings', label: 'Settings', icon: Settings }
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 100,
          background: 'var(--bg-card)',
          border: 'none',
          color: 'var(--text-primary)',
          padding: '0.5rem',
          borderRadius: '6px',
          display: 'none'
        }}
        className="mobile-menu-btn"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40,
            display: 'none'
          }}
          className="sidebar-overlay"
        />
      )}

      <aside
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          width: collapsed ? '80px' : '250px',
          backgroundColor: 'var(--bg-card)',
          borderRight: `1px solid var(--border)`,
          transition: 'width 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50
        }}
        className={`sidebar ${mobileOpen ? 'mobile-open' : ''} ${collapsed ? 'collapsed' : ''}`}
      >
        {/* Logo */}
        <div style={{
          padding: '1.5rem',
          borderBottom: `1px solid var(--border)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between'
        }}>
          {!collapsed && (
            <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem' }}>FieldBook</h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              display: 'none'
            }}
            className="collapse-btn"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem 1.5rem',
                color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
                borderLeft: isActive ? `3px solid var(--accent)` : '3px solid transparent',
                transition: 'all 0.2s ease'
              })}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info & Logout */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: `1px solid var(--border)`
        }}>
          {!collapsed && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontWeight: 600 }}>{user?.name}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {user?.role === 'admin' ? 'Administrator' : 'Laborer'}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'transparent',
              color: 'var(--danger)',
              border: 'none',
              borderRadius: '6px',
              justifyContent: collapsed ? 'center' : 'flex-start'
            }}
          >
            <LogOut size={20} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 1024px) {
          .collapse-btn {
            display: none !important;
          }
        }
        
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: block !important;
          }
          
          .sidebar-overlay {
            display: block !important;
          }
          
          .sidebar {
            transform: translateX(-100%);
          }
          
          .sidebar.mobile-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
