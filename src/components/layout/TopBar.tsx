import { useState } from 'react';
import { Bell, Sun, Moon, Maximize, Minimize, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store';
import { useTheme } from '../ThemeContext';
import { clsx } from 'clsx';

export function TopBar() {
  const { user } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);

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

        {/* Avatar */}
        <Link to="/perfil" className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 transition-all duration-200">
          {user?.avatar_url || user?.foto_url ? (
            <img
              src={user.avatar_url || user.foto_url}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
              {(user?.nome || user?.name || '?')[0]?.toUpperCase()}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
