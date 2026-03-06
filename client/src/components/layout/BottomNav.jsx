import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, HardHat, FileText, Menu, Calendar } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Projects', icon: Building2 },
  { path: '/laborers', label: 'Laborers', icon: HardHat },
  { path: '/attendance', label: 'Attendance', icon: Calendar },
  { path: '/invoices', label: 'Invoices', icon: FileText }
];

const BottomNav = () => {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--bg-card)',
        borderTop: `1px solid var(--border)`,
        display: 'flex',
        justifyContent: 'space-around',
        padding: '0.5rem 0',
        zIndex: 50,
        display: 'none'
      }}
      className="bottom-nav"
    >
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: '0.75rem'
          })}
        >
          <item.icon size={20} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
