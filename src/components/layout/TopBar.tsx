import { useState, useRef, useEffect } from 'react';
import { Bell, Sun, Moon, Maximize, Minimize, ChevronDown, User, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { usePlanStore } from '../../store/planStore';
import { useTheme } from '../ThemeContext';
import { clsx } from 'clsx';

export function TopBar() {
  const { user, logout } = useAppStore();
  const { userPlan } = usePlanStore();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const planDisplay = userPlan?.plano_display || 'Free';
  const planName = userPlan?.plano_nome || 'free';

  const planBadgeClass = planName === 'premium'
    ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300'
    : planName === 'pro'
    ? 'bg-gradient-to-r from-violet-500/20 to-blue-500/20 border-violet-500/30 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400'
    : 'bg-white/5 border-white/10 text-neutral';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-premium-dark/95 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-white">
          7<span className="text-primary">Finance</span>
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          className="p-2 rounded-xl hover:bg-white/5 transition-all duration-200 text-neutral hover:text-amber-400"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          className="hidden md:block p-2 rounded-xl hover:bg-white/5 transition-all duration-200 text-neutral hover:text-white"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-white/5 transition-all duration-200 text-neutral hover:text-white">
          <Bell className="w-5 h-5" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-white/5 transition-all duration-200"
          >
            {user?.avatar_url || user?.foto_url ? (
              <img
                src={user.avatar_url || user.foto_url}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover border border-white/10"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                {(user?.nome || user?.name || '?')[0]?.toUpperCase()}
              </div>
            )}
            <div className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-sm font-medium text-white truncate max-w-[120px]">
                {user?.nome || user?.name || 'Usuário'}
              </span>
              <span className={clsx(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block mt-0.5",
                planName === 'premium' && "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30",
                planName === 'pro' && "bg-gradient-to-r from-violet-500/20 to-blue-500/20 border-violet-500/30",
                planName === 'free' && "bg-white/5 border-white/10"
              )}>
                <span className={clsx(
                  "font-bold",
                  planName === 'premium' && "bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent",
                  planName === 'pro' && "bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent",
                  planName === 'free' && "text-neutral"
                )}>
                  {planDisplay}
                </span>
              </span>
            </div>
            <ChevronDown className={clsx(
              "w-3.5 h-3.5 text-neutral transition-transform duration-200 hidden sm:block",
              showUserMenu && "rotate-180"
            )} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-premium-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-50">
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-sm font-medium text-white truncate">{user?.nome || user?.name}</p>
                <p className="text-xs text-neutral truncate">{user?.email || user?.telefone || user?.phone}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/perfil'); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral hover:text-white hover:bg-white/5 transition-all"
                >
                  <User className="w-4 h-4" />
                  Ver perfil
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); logout(); navigate('/login'); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-negative/80 hover:text-negative hover:bg-negative/5 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
