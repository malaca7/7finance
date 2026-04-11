import { Link, useLocation, useNavigate } from 'react-router-dom';
// ...existing code...
import { useTheme } from '../ThemeContext';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Gauge,
  Wrench,
  Users,
  Shield,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  User as UserIcon
} from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../../store';
import { clsx } from 'clsx';

const personalMenuItems = [
  { path: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { path: '/ganhos', label: 'Ganhos', icon: TrendingUp },
  { path: '/despesas', label: 'Gastos', icon: TrendingDown },
  { path: '/km', label: 'KM', icon: Gauge },
  { path: '/manutencao', label: 'Carro', icon: Wrench },
  { path: '/perfil', label: 'Perfil', icon: UserIcon },
];
const adminMenuItems = [
  { path: '/admin', label: 'Admin', icon: Users },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAppStore();
  const [isPersonalOpen, setIsPersonalOpen] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const isAdmin = user?.role === 'admin';
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', String(newState));
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { isCollapsed: newState } }));
  };

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <>
      {/* Sidebar Desktop */}
      <aside
        className={clsx(
          "hidden lg:flex fixed top-0 left-0 h-screen bg-premium-black border-r border-premium-gray/30 flex-col z-40 transition-all duration-300 ease-in-out shrink-0",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Botão de abrir/fechar */}
        <button
          onClick={toggleSidebar}
          className={clsx(
            "absolute -right-3 top-6 bg-premium-limao text-white rounded-full p-1 shadow-glow hover:scale-110 transition-transform z-50 border-2 border-premium-black",
            isCollapsed ? "" : ""
          )}
          title={isCollapsed ? "Abrir menu" : "Fechar menu"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4 text-white" /> : <ChevronLeft className="w-4 h-4 text-white" />}
        </button>
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto py-6 px-2">
          {personalMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors font-bold",
                  isActive
                    ? isDark
                      ? "bg-primary text-white shadow-[0_0_16px_0_rgba(57,255,20,0.15)]"
                      : "bg-primary text-black shadow-[0_0_16px_0_rgba(57,255,20,0.15)]"
                    : "text-primary hover:bg-primary/10 hover:text-primary"
                )}
              >
                <Icon className="w-6 h-6" />
                {!isCollapsed && <span className="text-sm font-bold leading-none">{item.label}</span>}
              </Link>
            );
          })}
          {isAdmin && adminMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors font-bold",
                  isActive
                    ? isDark
                      ? "bg-primary text-white shadow-[0_0_16px_0_rgba(57,255,20,0.15)]"
                      : "bg-primary text-black shadow-[0_0_16px_0_rgba(57,255,20,0.15)]"
                    : "text-primary hover:bg-primary/10 hover:text-primary"
                )}
              >
                <Icon className="w-6 h-6" />
                {!isCollapsed && <span className="text-sm font-bold leading-none">Admin</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-primary hover:text-white hover:bg-primary/80 font-bold transition-all"
          >
            <LogOut className="w-6 h-6" />
            {!isCollapsed && <span className="text-sm font-bold leading-none">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Bottom Tab Bar - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full h-16 bg-premium-black/95 border-t border-premium-limao/30 z-50 flex justify-around items-center px-1">
        {personalMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all",
                isActive ? "text-premium-limao" : "text-premium-lightGray hover:text-premium-limao"
              )}
              style={{ fontSize: 12 }}
            >
              <Icon className={clsx("w-6 h-6 mb-0.5", isActive ? "scale-110" : "")}/>
            </Link>
          );
        })}
        {isAdmin && adminMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all",
                isActive ? "text-blue-400" : "text-blue-300/60 hover:text-blue-400"
              )}
              style={{ fontSize: 12 }}
            >
              <Icon className={clsx("w-6 h-6 mb-0.5", isActive ? "scale-110" : "")}/>
            </Link>
          );
        })}
        {/* Logout botão */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-red-500 hover:text-red-400 transition-all"
          style={{ fontSize: 12 }}
        >
          <LogOut className="w-6 h-6 mb-0.5" />
        </button>
      </nav>
    </>
  );
}