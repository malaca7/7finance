import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  Gauge, 
  Wrench, 
  Users, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  User as UserIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';
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
  { path: '/admin', label: 'Geral', icon: Activity },
  { path: '/admin/users', label: 'Usuários', icon: Users },
  { path: '/admin/analytics', label: 'Financeiro', icon: DollarSign },
  { path: '/admin/logs', label: 'Auditoria', icon: History },
  { path: '/admin/alerts', label: 'Alertas', icon: Zap },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAppStore();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      setIsCollapsed(e.detail?.isCollapsed);
    };
    window.addEventListener('sidebar-toggle', handler);
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

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

  return (
    <>
      {/* Sidebar Desktop */}
      <aside
        className={clsx(
          "hidden lg:flex fixed top-0 left-0 h-screen bg-premium-dark border-r border-white/5 flex-col z-40 transition-all duration-300 ease-in-out shrink-0",
          isCollapsed ? "w-24" : "w-72"
        )}
      >
        <button
          onClick={toggleSidebar}
          className={clsx(
            "hidden lg:block absolute -right-3 top-6 z-[60]",
          )}
          title={isCollapsed ? "Abrir menu" : "Fechar menu"}
        >
          <div className="bg-primary text-black rounded-full p-1.5 shadow-glow-green hover:scale-110 transition-transform border-2 border-premium-dark">
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </div>
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
                  "flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 font-semibold",
                  isActive
                    ? "bg-primary text-black shadow-glow-green font-bold"
                    : "text-neutral hover:bg-primary/10 hover:text-primary"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium leading-none truncate">{item.label}</span>}
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
                  "flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 font-semibold",
                  isActive
                    ? "bg-primary text-black shadow-glow-green font-bold"
                    : "text-neutral hover:bg-primary/10 hover:text-primary"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium leading-none">Admin</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-2xl px-4 py-3 text-neutral hover:text-negative hover:bg-negative/10 font-semibold transition-all duration-200"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium leading-none">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Bottom Tab Bar - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full h-16 bg-premium-dark/95 border-t border-white/5 z-50 flex justify-around items-center px-1">
        {personalMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 rounded-2xl",
                isActive ? "bg-primary text-black" : "text-neutral hover:text-primary hover:bg-primary/10"
              )}
              style={{ fontSize: 11 }}
            >
              <Icon className={clsx("w-5 h-5 mb-0.5", isActive ? "scale-110" : "")}/>
              <span className={clsx("truncate max-w-[60px] text-[10px]", isActive ? "text-black font-bold" : "text-neutral")}>{item.label}</span>
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
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 rounded-2xl",
                isActive ? "bg-primary text-black" : "text-neutral hover:text-primary hover:bg-primary/10"
              )}
              style={{ fontSize: 11 }}
            >
              <Icon className={clsx("w-5 h-5 mb-0.5", isActive ? "scale-110" : "")}/>
              <span className={clsx("truncate max-w-[60px] text-[10px]", isActive ? "text-black font-bold" : "text-neutral")}>Admin</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-neutral hover:text-negative transition-all duration-200"
          style={{ fontSize: 11 }}
        >
          <LogOut className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Sair</span>
        </button>
      </nav>
    </>
  );
}