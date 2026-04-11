import { useEffect, useState } from 'react';
import {
  Bell, Search, Filter, Info, AlertTriangle, CheckCircle,
  CheckCheck, Calendar, ChevronDown, Eye, RefreshCw
} from 'lucide-react';
import { Card, CardHeader, Button } from '../components/ui';
import { MainLayout } from '../components/layout/MainLayout';
import { useNotificationStore, type Notification } from '../store/notificationStore';
import { clsx } from 'clsx';

const tipoConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/15', label: 'Informação' },
  alerta: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/15', label: 'Alerta' },
  sucesso: { icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/15', label: 'Sucesso' },
};

export function NotificationsHistoryPage() {
  const {
    notifications,
    readIds,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    unreadCount,
  } = useNotificationStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  const count = unreadCount();

  // Filter notifications
  const filtered = notifications.filter(n => {
    // Search
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      if (!n.titulo.toLowerCase().includes(s) && !n.mensagem.toLowerCase().includes(s)) return false;
    }
    // Tipo
    if (filterTipo !== 'all' && n.tipo !== filterTipo) return false;
    // Status (read/unread)
    if (filterStatus === 'lida' && !readIds.has(n.id)) return false;
    if (filterStatus === 'nao_lida' && readIds.has(n.id)) return false;
    // Date range
    if (filterDateStart) {
      const start = new Date(filterDateStart);
      if (new Date(n.criada_em) < start) return false;
    }
    if (filterDateEnd) {
      const end = new Date(filterDateEnd + 'T23:59:59');
      if (new Date(n.criada_em) > end) return false;
    }
    return true;
  });

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterTipo('all');
    setFilterStatus('all');
    setFilterDateStart('');
    setFilterDateEnd('');
  };

  const hasFilters = searchTerm || filterTipo !== 'all' || filterStatus !== 'all' || filterDateStart || filterDateEnd;

  return (
    <MainLayout>
      <div className="space-y-6 pb-24 md:pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Notificações</h1>
            <p className="text-neutral mt-1">
              {count > 0
                ? <>{count} não lida{count !== 1 ? 's' : ''} · {notifications.length} total</>
                : <>Todas lidas · {notifications.length} total</>
              }
            </p>
          </div>
          <div className="flex gap-2">
            {count > 0 && (
              <Button onClick={markAllAsRead} variant="secondary" className="gap-2">
                <CheckCheck className="w-4 h-4" />
                Marcar todas como lidas
              </Button>
            )}
            <Button onClick={fetchNotifications} variant="secondary" className="gap-2">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/5 rounded-2xl">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-neutral">Total</p>
                <p className="text-xl font-bold text-white">{notifications.length}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/15 rounded-2xl">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-neutral">Não Lidas</p>
                <p className="text-xl font-bold text-primary">{count}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/15 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-neutral">Alertas</p>
                <p className="text-xl font-bold text-white">{notifications.filter(n => n.tipo === 'alerta').length}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/15 rounded-2xl">
                <Info className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-neutral">Informações</p>
                <p className="text-xl font-bold text-white">{notifications.filter(n => n.tipo === 'info').length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral" />
              <input
                type="text"
                placeholder="Buscar por título ou mensagem..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-premium-darkGray border border-white/10 rounded-xl text-sm text-white placeholder-neutral focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <select
              value={filterTipo}
              onChange={e => setFilterTipo(e.target.value)}
              className="bg-premium-darkGray border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary transition-all"
            >
              <option value="all">Todos os Tipos</option>
              <option value="info">Informação</option>
              <option value="alerta">Alerta</option>
              <option value="sucesso">Sucesso</option>
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-premium-darkGray border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary transition-all"
            >
              <option value="all">Todas</option>
              <option value="nao_lida">Não Lidas</option>
              <option value="lida">Lidas</option>
            </select>
          </div>

          {/* Date range */}
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="w-4 h-4 text-neutral shrink-0" />
              <input
                type="date"
                value={filterDateStart}
                onChange={e => setFilterDateStart(e.target.value)}
                className="flex-1 bg-premium-darkGray border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-primary transition-all"
              />
              <span className="text-neutral text-xs">até</span>
              <input
                type="date"
                value={filterDateEnd}
                onChange={e => setFilterDateEnd(e.target.value)}
                className="flex-1 bg-premium-darkGray border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-primary transition-all"
              />
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-xs text-neutral hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </Card>

        {/* Notification List */}
        <Card>
          <CardHeader
            title="Histórico"
            subtitle={`${filtered.length} de ${notifications.length} notificações`}
          />

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-neutral">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">
                {hasFilters ? 'Nenhuma notificação com esses filtros' : 'Nenhuma notificação'}
              </p>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-primary mt-2 hover:underline">
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2 mt-4">
              {filtered.map(notif => {
                const isRead = readIds.has(notif.id);
                const cfg = tipoConfig[notif.tipo] || tipoConfig.info;
                const Icon = cfg.icon;

                return (
                  <div
                    key={notif.id}
                    className={clsx(
                      'flex gap-4 p-4 rounded-2xl border transition-all duration-200',
                      isRead
                        ? 'bg-premium-darkGray/30 border-white/5 opacity-70 hover:opacity-90'
                        : 'bg-primary/[0.03] border-primary/10 hover:bg-primary/[0.06]'
                    )}
                  >
                    {/* Icon */}
                    <div className={clsx('shrink-0 w-11 h-11 rounded-xl flex items-center justify-center', cfg.bg)}>
                      <Icon className={clsx('w-5 h-5', cfg.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={clsx(
                              'text-sm',
                              isRead ? 'text-neutral font-normal' : 'text-white font-semibold'
                            )}>
                              {notif.titulo}
                            </h3>
                            <span className={clsx(
                              'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase',
                              notif.tipo === 'info' && 'bg-blue-500/20 text-blue-400',
                              notif.tipo === 'alerta' && 'bg-amber-500/20 text-amber-400',
                              notif.tipo === 'sucesso' && 'bg-primary/20 text-primary',
                            )}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-neutral/60 mt-1 leading-relaxed">{notif.mensagem}</p>
                          <p className="text-[10px] text-neutral/40 mt-2">{formatDate(notif.criada_em)}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!isRead ? (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              title="Marcar como lida"
                              className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="px-2 py-1 text-[10px] text-neutral/40 bg-white/[0.03] rounded-lg">
                              Lida
                            </span>
                          )}
                          {!isRead && (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(57,255,20,0.6)]" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
