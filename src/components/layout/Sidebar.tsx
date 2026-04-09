import { Link, useLocation, useNavigate } from 'react-router-dom';
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

  return (
    <>
      {/* Bottom Tab Bar - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full h-16 bg-premium-black/95 border-t border-premium-gold/10 z-50 flex justify-around items-center px-1">
        {personalMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all",
                isActive ? "text-premium-gold" : "text-gray-400 hover:text-premium-gold/80"
              )}
              style={{ fontSize: 12 }}
            >
              <Icon className={clsx("w-6 h-6 mb-0.5", isActive ? "scale-110" : "")}/>
              <span className="text-xs font-bold leading-none">{item.label}</span>
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
              <span className="text-xs font-bold leading-none">Admin</span>
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
          <span className="text-xs font-bold leading-none">Sair</span>
        </button>
      </nav>
        {/* Desktop Sidebar */}
        <aside className={clsx(
          "hidden lg:flex sticky top-0 h-screen bg-premium-black border-r border-premium-gray/30 flex-col z-40 transition-all duration-300 ease-in-out shrink-0",
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

            return (
              <>
                {/* Bottom Tab Bar - Mobile Only */}
                <nav className="lg:hidden fixed bottom-0 left-0 w-full h-16 bg-premium-black/95 border-t border-premium-gold/10 z-50 flex justify-around items-center px-1">
                  {personalMenuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={clsx(
                          "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all",
                          isActive ? "text-premium-gold" : "text-gray-400 hover:text-premium-gold/80"
                        )}
                        style={{ fontSize: 12 }}
                      >
                        <Icon className={clsx("w-6 h-6 mb-0.5", isActive ? "scale-110" : "")}/>
                        <span className="text-xs font-bold leading-none">{item.label}</span>
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
                        <span className="text-xs font-bold leading-none">Admin</span>
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
                    <span className="text-xs font-bold leading-none">Sair</span>
                  </button>
                </nav>
                {/* Desktop Sidebar */}
                <aside className={clsx(
                  "hidden lg:flex bg-premium-black border-r border-premium-gray/30 flex-col z-40 transition-all duration-300 ease-in-out shrink-0",
                  isCollapsed ? "w-20" : "w-64"
                )}>
                  {/* Toggle Button Desktop */}
                  <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-20 bg-premium-gold text-premium-black rounded-full p-1 shadow-glow hover:scale-110 transition-transform z-50"
                  >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </button>

                  {/* Logo */}
                  <div className={clsx("p-6 border-b border-premium-gray/30 flex flex-col items-center", isCollapsed ? "px-2" : "p-6")}>...
              </>
            );
          }
                >
                  <Icon className={clsx("transition-all", isCollapsed ? "w-6 h-6" : "w-4 h-4")} />
                  {!isCollapsed && <span className="text-xs">{item.label}</span>}
                </Link>
              );
            })}
          </div>

          {/* Categoria Administração */}
          {isAdmin && (
            <div className="space-y-1">
              {!isCollapsed && (
                <button 
                  onClick={() => setIsAdminOpen(!isAdminOpen)}
                  className="w-full flex items-center justify-between px-3 mb-2 group outline-none"
                >
                  <h3 className="text-[9px] font-bold text-premium-gold uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <Shield className="w-2.5 h-2.5" />
                    Admin
                  </h3>
                  {isAdminOpen ? <ChevronDown className="w-3 h-3 text-premium-gold/50" /> : <ChevronRight className="w-3 h-3 text-premium-gold/50" />}
                </button>
              )}

              {(isCollapsed || isAdminOpen) && adminMenuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={isCollapsed ? item.label : ""}
                    className={clsx(
                      'flex items-center rounded-lg transition-all duration-200 border border-transparent',
                      isCollapsed ? "justify-center p-3 mb-2" : "gap-2.5 px-3 py-2",
                      isActive
                        ? 'bg-premium-gold text-premium-black font-bold shadow-glow border-premium-gold'
                        : 'text-gray-400 hover:bg-premium-gold/10 hover:text-premium-gold border-premium-gold/5'
                    )}
                  >
                    <Icon className={clsx("transition-all", isCollapsed ? "w-6 h-6" : "w-4 h-4")} />
                    {!isCollapsed && <span className="text-xs">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* User info & Logout */}
        <div className={clsx("p-4 border-t border-premium-gray/30", isCollapsed ? "px-2 items-center flex flex-col pt-4 gap-4" : "p-4")}>
          <Link to="/perfil" className={clsx("flex items-center hover:bg-premium-gray/30 rounded-app transition-all group", isCollapsed ? "p-1" : "gap-3 mb-4 p-2")}>
            <div className={clsx("rounded-full bg-premium-dark border-2 border-premium-gold flex items-center justify-center shadow-glow-sm group-hover:scale-105 transition-transform shrink-0 overflow-hidden", isCollapsed ? "w-10 h-10" : "w-10 h-10")}>
              {(user?.foto_url || user?.avatar_url) ? (
                <img 
                  src={user.foto_url || user.avatar_url || ''} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-premium-gold font-bold">
                  {(user?.nome || user?.name || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{user?.nome || user?.name}</p>
                <p className="text-[10px] text-premium-gold font-bold uppercase tracking-tighter truncate">Meu Perfil</p>
              </div>
            )}
          </Link>
          
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Sair" : ""}
            className={clsx(
              "flex items-center text-gray-400 hover:text-red-400 rounded-app hover:bg-premium-gray/50 transition-colors",
              isCollapsed ? "justify-center p-3 w-10 h-10" : "gap-3 w-full px-4 py-2"
            )}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="font-medium text-sm">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Bottom Tab Bar mobile já implementada acima */}
    </>
  );
}