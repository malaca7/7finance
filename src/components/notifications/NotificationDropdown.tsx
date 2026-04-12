import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle, Volume2, VolumeX } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

const tipoConfig = {
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/20' },
  alerta: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20' },
  sucesso: { icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/15', border: 'border-primary/20' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    notifications,
    readIds,
    unreadCount,
    markAsRead,
    markAllAsRead,
    soundEnabled,
    toggleSound,
  } = useNotificationStore();

  const count = unreadCount();
  const visibleNotifs = notifications.slice(0, 20);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'relative p-2 rounded-xl transition-all duration-200',
          isOpen ? 'bg-primary/15 text-primary' : 'hover:bg-white/5 text-neutral hover:text-white'
        )}
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-black bg-primary text-premium-black rounded-full animate-pulse shadow-[0_0_12px_rgba(57,255,20,0.5)]">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] max-h-[480px] bg-[#0f1117] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-white">Notificações</span>
              {count > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary/20 text-primary rounded-full">
                  {count}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleSound}
                title={soundEnabled ? 'Desativar som' : 'Ativar som'}
                className="p-1.5 rounded-lg hover:bg-white/5 text-neutral hover:text-white transition-all"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              {count > 0 && (
                <button
                  onClick={markAllAsRead}
                  title="Marcar todas como lidas"
                  className="p-1.5 rounded-lg hover:bg-primary/10 text-neutral hover:text-primary transition-all"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[360px] custom-scrollbar">
            {visibleNotifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-neutral">
                <Bell className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              visibleNotifs.map((notif) => {
                const isRead = readIds.has(notif.id);
                const config = tipoConfig[notif.tipo as keyof typeof tipoConfig] || tipoConfig.info;
                const Icon = config.icon;

                return (
                  <div
                    key={notif.id}
                    onClick={() => !isRead && markAsRead(notif.id)}
                    className={clsx(
                      'flex gap-3 px-4 py-3 border-b border-white/[0.03] transition-all duration-200 cursor-pointer',
                      isRead
                        ? 'hover:bg-white/[0.02] opacity-60'
                        : 'bg-primary/[0.03] hover:bg-primary/[0.06]'
                    )}
                  >
                    {/* Icon */}
                    <div className={clsx('shrink-0 w-9 h-9 rounded-xl flex items-center justify-center', config.bg)}>
                      <Icon className={clsx('w-4 h-4', config.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={clsx(
                          'text-sm leading-snug truncate',
                          isRead ? 'text-neutral font-normal' : 'text-white font-semibold'
                        )}>
                          {notif.titulo}
                        </p>
                        <span className="text-[10px] text-neutral/60 shrink-0 mt-0.5">
                          {timeAgo(notif.criada_em)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral/70 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.mensagem}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!isRead && (
                      <div className="shrink-0 mt-2">
                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(57,255,20,0.6)]" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-white/5 px-4 py-2.5">
              <button
                onClick={() => { setIsOpen(false); navigate('/notifications'); }}
                className="w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-all"
              >
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
