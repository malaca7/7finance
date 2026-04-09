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
  X,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    // Disparar evento customizado para os componentes que dependem da largura
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { isCollapsed: newState } }));
  };

  return (
    <>
      {/* Top Bar - Mobile Only */}
      <header className="lg:hidden fixed top-0 left-0 w-full h-16 bg-premium-black/80 backdrop-blur-md border-b border-premium-gold/10 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img 
            src="https://i.postimg.cc/gY9KR36Q/Chat-GPT-Image-7-de-abr-de-2026-13-14-27.png" 
            alt="7 Finance" 
            className="h-10 w-auto drop-shadow-glow-sm"
          />
          <span className="text-white font-bold tracking-tighter text-lg italic">7<span className="text-premium-gold">FINANCE</span></span>
        </div>
        <button
          className="p-2 bg-premium-gold/10 rounded-full border border-premium-gold/20 text-premium-gold transition-all active:scale-90"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <LayoutDashboard className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={clsx(
        "lg:hidden fixed inset-0 z-40 bg-premium-black/95 backdrop-blur-lg transition-transform duration-500 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full pt-20 p-6">
          {/* User Info Mobile */}
          <div className="flex items-center gap-4 mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="w-12 h-12 rounded-full bg-premium-dark border-2 border-premium-gold flex items-center justify-center shadow-glow-sm overflow-hidden">
              {(user?.foto_url || user?.avatar_url) ? (
                <img 
                  src={user.foto_url || user.avatar_url || ''} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-premium-gold font-extrabold text-xl">
                  {(user?.nome || user?.name || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold truncate leading-none mb-1">{user?.nome || user?.name}</h4>
              <p className="text-xs text-premium-gold font-medium uppercase tracking-widest">{user?.role === 'admin' ? 'Admin' : 'Motorista'}</p>
            </div>
          </div>

          {/* Nav Links Mobile */}
          <div className="flex-1 space-y-2 overflow-y-auto">
            {personalMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    "flex items-center gap-4 p-4 rounded-xl transition-all border",
                    isActive 
                      ? "bg-premium-gold/20 border-premium-gold/30 text-premium-gold shadow-glow-sm translate-x-2" 
                      : "bg-white/5 border-transparent text-gray-400"
                  )}
                >
                  <Icon className={clsx("w-5 h-5", isActive ? "animate-pulse" : "")} />
                  <span className="font-bold tracking-wide">{item.label}</span>
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
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    "flex items-center gap-4 p-4 rounded-xl transition-all border mt-4",
                    isActive 
                      ? "bg-blue-500/20 border-blue-500/30 text-blue-400 shadow-blue-500/10 translate-x-2" 
                      : "bg-blue-500/5 border-blue-500/10 text-blue-300/60"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-bold tracking-wide">Administração</span>
                </Link>
              );
            })}
          </div>

          {/* Logout Mobile */}
          <button
            onClick={handleLogout}
            className="mt-6 flex items-center justify-center gap-3 w-full py-4 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20 font-bold"
          >
            <LogOut className="w-5 h-5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </div>
      {/* Desktop Sidebar */}
      <aside className={clsx(
        "hidden lg:flex sticky top-0 h-screen bg-premium-black border-r border-premium-gray/30 flex-col z-40 transition-all duration-300 ease-in-out shrink-0",
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
        <div className={clsx("p-6 border-b border-premium-gray/30 flex flex-col items-center", isCollapsed ? "px-2" : "p-6")}>
          <img 
            src="https://i.postimg.cc/gY9KR36Q/Chat-GPT-Image-7-de-abr-de-2026-13-14-27.png" 
            alt="7 Finance Logo" 
            className={clsx("w-auto drop-shadow-glow transition-all", isCollapsed ? "h-10" : "h-16")}
          />
          {!isCollapsed && <p className="text-xs text-center text-gray-500 mt-2 uppercase tracking-wider font-medium">Gestão Profissional</p>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Categoria Pessoal */}
          <div className="space-y-1">
            {!isCollapsed && (
              <button 
                onClick={() => setIsPersonalOpen(!isPersonalOpen)}
                className="w-full flex items-center justify-between px-3 mb-2 group outline-none"
              >
                <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em]">Pessoal</h3>
                {isPersonalOpen ? <ChevronDown className="w-3 h-3 text-gray-600" /> : <ChevronRight className="w-3 h-3 text-gray-600" />}
              </button>
            )}
            
            {(isCollapsed || isPersonalOpen) && personalMenuItems.map((item) => {
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
                      ? 'bg-premium-gold/10 text-premium-gold font-bold border-premium-gold/20 shadow-glow-sm'
                      : 'text-gray-400 hover:bg-premium-gray/50 hover:text-white'
                  )}
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

      {/* Bottom Tab Bar - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-premium-dark border-t border-premium-gray/30 flex items-center justify-around px-2 pb-safe pt-2 z-40">
        {[...personalMenuItems.slice(0, 4), { path: '/perfil', label: 'Eu', icon: UserIcon }].map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex flex-col items-center justify-center w-16 h-14 rounded-lg',
                isActive ? 'text-premium-gold' : 'text-gray-400 hover:text-gray-300'
              )}
            >
              <Icon className={clsx('w-6 h-6 mb-1 transition-transform', isActive && 'scale-110')} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
        {/* Botão de Sair Mobile */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center w-16 h-14 rounded-lg text-red-500/80 hover:text-red-400"
        >
          <LogOut className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium leading-none">Sair</span>
        </button>
      </nav>
    </>
  );
}