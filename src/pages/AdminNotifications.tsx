import { useEffect, useState } from 'react';
import {
  Send, Users, User, Info, AlertTriangle, CheckCircle,
  RefreshCw, Search, Bell, Eye, Trash2, BarChart3,
  ChevronDown, ChevronUp, X
} from 'lucide-react';
import { Card, CardHeader, Button, Input, Modal, ConfirmModal } from '../components/ui';
import { MainLayout } from '../components/layout/MainLayout';
import { useNotificationStore, type NotificationType, type TargetType, type Notification } from '../store/notificationStore';
import { usersApi } from '../api';
import { createAdminClient } from '../api/supabase';
import type { User as UserType } from '../types';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const tipoOptions: { value: NotificationType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'info', label: 'Informação', icon: Info, color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
  { value: 'alerta', label: 'Alerta', icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
  { value: 'sucesso', label: 'Sucesso', icon: CheckCircle, color: 'text-primary bg-primary/15 border-primary/30' },
];

const tipoConfig: Record<string, { color: string; label: string }> = {
  info: { color: 'bg-blue-500/20 text-blue-400', label: 'Info' },
  alerta: { color: 'bg-amber-500/20 text-amber-400', label: 'Alerta' },
  sucesso: { color: 'bg-primary/20 text-primary', label: 'Sucesso' },
};

type Tab = 'enviar' | 'gerenciar';

interface NotifWithReads extends Notification {
  read_count: number;
}

export function AdminNotificationsPanel() {
  const { sendNotification } = useNotificationStore();
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [recentNotifs, setRecentNotifs] = useState<NotifWithReads[]>([]);

  // Tab
  const [activeTab, setActiveTab] = useState<Tab>('gerenciar');

  // Form state
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tipo, setTipo] = useState<NotificationType>('info');
  const [targetType, setTargetType] = useState<TargetType>('all');
  const [targetId, setTargetId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({ total: 0, info: 0, alerta: 0, sucesso: 0 });
  const [totalUsers, setTotalUsers] = useState(0);

  // Management
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteNotif, setDeleteNotif] = useState<NotifWithReads | null>(null);
  const [detailNotif, setDetailNotif] = useState<NotifWithReads | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersRes] = await Promise.all([usersApi.getAll()]);
      if (usersRes.success && usersRes.data) {
        setAllUsers(usersRes.data);
        setTotalUsers(usersRes.data.length);
      }

      const admin = await createAdminClient();

      // Load notifications
      const { data: notifs } = await admin
        .from('notificacoes')
        .select('*')
        .order('criada_em', { ascending: false })
        .limit(100);

      if (notifs) {
        // Load read counts for all notifications
        const notifIds = notifs.map((n: any) => n.id);
        const { data: reads } = await admin
          .from('notification_reads')
          .select('notification_id')
          .in('notification_id', notifIds);

        // Count reads per notification
        const readCounts: Record<string, number> = {};
        if (reads) {
          reads.forEach((r: any) => {
            readCounts[r.notification_id] = (readCounts[r.notification_id] || 0) + 1;
          });
        }

        const notifsWithReads: NotifWithReads[] = notifs.map((n: any) => ({
          ...n,
          read_count: readCounts[n.id] || 0,
        }));

        setRecentNotifs(notifsWithReads);
        setStats({
          total: notifs.length,
          info: notifs.filter((n: any) => n.tipo === 'info').length,
          alerta: notifs.filter((n: any) => n.tipo === 'alerta').length,
          sucesso: notifs.filter((n: any) => n.tipo === 'sucesso').length,
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!titulo.trim() || !mensagem.trim()) {
      toast.error('Preencha título e mensagem');
      return;
    }
    if (targetType === 'user' && !targetId) {
      toast.error('Selecione um usuário');
      return;
    }

    setIsSending(true);
    try {
      const success = await sendNotification({
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        tipo,
        targetType,
        targetId: targetType === 'user' ? targetId : undefined,
      });

      if (success) {
        toast.success(targetType === 'all'
          ? 'Notificação enviada para todos!'
          : 'Notificação enviada com sucesso!'
        );
        setTitulo('');
        setMensagem('');
        setTipo('info');
        setTargetType('all');
        setTargetId('');
        loadData();
      } else {
        toast.error('Erro ao enviar notificação');
      }
    } catch {
      toast.error('Erro ao enviar notificação');
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (notif: NotifWithReads) => {
    try {
      const admin = await createAdminClient();
      const { error } = await admin
        .from('notificacoes')
        .delete()
        .eq('id', notif.id);

      if (error) {
        toast.error('Erro ao excluir notificação');
        return;
      }
      toast.success('Notificação excluída');
      setDeleteNotif(null);
      loadData();
    } catch {
      toast.error('Erro ao excluir notificação');
    }
  };

  const filteredUsers = allUsers.filter(u => {
    if (!userSearch) return true;
    const s = userSearch.toLowerCase();
    return (
      (u.name || u.nome || '').toLowerCase().includes(s) ||
      (u.email || '').toLowerCase().includes(s)
    );
  });

  const filteredNotifs = recentNotifs
    .filter(n => {
      if (filterTipo !== 'all' && n.tipo !== filterTipo) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return n.titulo.toLowerCase().includes(q) || n.mensagem.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const da = new Date(a.criada_em).getTime();
      const db = new Date(b.criada_em).getTime();
      return sortOrder === 'desc' ? db - da : da - db;
    });

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getTargetLabel = (notif: Notification) => {
    if (notif.target_type === 'all') return 'Todos os usuários';
    const user = allUsers.find(u => u.id === notif.target_id);
    return user ? (user.name || user.nome || user.email) : 'Usuário específico';
  };

  const getReadPercent = (notif: NotifWithReads) => {
    const target = notif.target_type === 'all' ? totalUsers : 1;
    if (target === 0) return 0;
    return Math.min(100, Math.round((notif.read_count / target) * 100));
  };

  return (
    <MainLayout>
      <div className="space-y-6 pb-24 md:pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Notificações</h1>
            <p className="text-neutral mt-1">Envie e gerencie notificações do sistema</p>
          </div>
          <Button onClick={loadData} variant="secondary" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/5 rounded-2xl">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-neutral">Total Enviadas</p>
                <p className="text-xl font-bold text-white">{stats.total}</p>
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
                <p className="text-xl font-bold text-white">{stats.info}</p>
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
                <p className="text-xl font-bold text-white">{stats.alerta}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/15 rounded-2xl">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-neutral">Sucesso</p>
                <p className="text-xl font-bold text-white">{stats.sucesso}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-premium-darkGray rounded-xl p-1">
          <button
            onClick={() => setActiveTab('gerenciar')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
              activeTab === 'gerenciar'
                ? 'bg-primary/15 text-primary'
                : 'text-neutral hover:text-white'
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Gerenciar ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('enviar')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
              activeTab === 'enviar'
                ? 'bg-primary/15 text-primary'
                : 'text-neutral hover:text-white'
            )}
          >
            <Send className="w-4 h-4" />
            Enviar Nova
          </button>
        </div>

        {/* ======== TAB: GERENCIAR ======== */}
        {activeTab === 'gerenciar' && (
          <Card>
            <CardHeader
              title="Notificações Enviadas"
              subtitle={`${filteredNotifs.length} de ${recentNotifs.length} notificações`}
            />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral" />
                <input
                  type="text"
                  placeholder="Buscar por título ou mensagem..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-premium-darkGray border border-white/10 rounded-xl text-sm text-white placeholder-neutral focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <select
                value={filterTipo}
                onChange={e => setFilterTipo(e.target.value)}
                className="px-4 py-2.5 bg-premium-darkGray border border-white/10 rounded-xl text-sm text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="all">Todos os tipos</option>
                <option value="info">Informação</option>
                <option value="alerta">Alerta</option>
                <option value="sucesso">Sucesso</option>
              </select>
              <button
                onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-premium-darkGray border border-white/10 rounded-xl text-sm text-neutral hover:text-white transition-all"
              >
                {sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                {sortOrder === 'desc' ? 'Recentes' : 'Antigas'}
              </button>
            </div>

            {/* List */}
            {isLoading ? (
              <div className="text-center py-8 text-neutral">Carregando...</div>
            ) : filteredNotifs.length === 0 ? (
              <div className="text-center py-12 text-neutral">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Nenhuma notificação encontrada</p>
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                {filteredNotifs.map(notif => {
                  const cfg = tipoConfig[notif.tipo] || tipoConfig.info;
                  const readPct = getReadPercent(notif);
                  const isExpanded = expandedId === notif.id;

                  return (
                    <div
                      key={notif.id}
                      className="bg-premium-darkGray/50 hover:bg-white/[0.03] rounded-xl transition-all border border-white/5"
                    >
                      {/* Main Row */}
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : notif.id)}
                      >
                        {/* Icon */}
                        <div className={clsx(
                          'shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                          notif.tipo === 'info' && 'bg-blue-500/15',
                          notif.tipo === 'alerta' && 'bg-amber-500/15',
                          notif.tipo === 'sucesso' && 'bg-primary/15',
                        )}>
                          {notif.tipo === 'info' && <Info className="w-4 h-4 text-blue-400" />}
                          {notif.tipo === 'alerta' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                          {notif.tipo === 'sucesso' && <CheckCircle className="w-4 h-4 text-primary" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-white truncate">{notif.titulo}</p>
                            <span className={clsx('px-1.5 py-0.5 rounded text-[9px] font-bold uppercase', cfg.color)}>
                              {cfg.label}
                            </span>
                            <span className={clsx(
                              'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase',
                              notif.target_type === 'all'
                                ? 'bg-white/5 text-neutral'
                                : 'bg-violet-500/15 text-violet-400'
                            )}>
                              {notif.target_type === 'all' ? 'Todos' : 'Usuário'}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral/40 mt-0.5">{formatDate(notif.criada_em)}</p>
                        </div>

                        {/* Read Count Badge */}
                        <div className="shrink-0 flex items-center gap-3">
                          <div className="text-center hidden sm:block">
                            <div className="flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5 text-neutral/60" />
                              <span className={clsx(
                                'text-sm font-bold',
                                readPct >= 75 ? 'text-primary' : readPct >= 40 ? 'text-amber-400' : 'text-neutral/60'
                              )}>
                                {notif.read_count}
                              </span>
                              <span className="text-[10px] text-neutral/40">
                                ({readPct}%)
                              </span>
                            </div>
                            <p className="text-[9px] text-neutral/40">leram</p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={e => { e.stopPropagation(); setDetailNotif(notif); }}
                              className="p-1.5 rounded-lg text-neutral/60 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); setDeleteNotif(notif); }}
                              className="p-1.5 rounded-lg text-neutral/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral/40" /> : <ChevronDown className="w-4 h-4 text-neutral/40" />}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-white/5 pt-3 space-y-3">
                          <p className="text-xs text-neutral/80 leading-relaxed">{notif.mensagem}</p>

                          <div className="flex flex-wrap gap-4 text-[11px]">
                            <div>
                              <span className="text-neutral/40">Destino: </span>
                              <span className="text-white font-medium">{getTargetLabel(notif)}</span>
                            </div>
                            <div>
                              <span className="text-neutral/40">Leituras: </span>
                              <span className={clsx(
                                'font-bold',
                                readPct >= 75 ? 'text-primary' : readPct >= 40 ? 'text-amber-400' : 'text-neutral'
                              )}>
                                {notif.read_count} de {notif.target_type === 'all' ? totalUsers : 1}
                              </span>
                              <span className="text-neutral/40"> ({readPct}%)</span>
                            </div>
                          </div>

                          {/* Read Progress Bar */}
                          <div className="w-full bg-white/5 rounded-full h-1.5">
                            <div
                              className={clsx(
                                'h-1.5 rounded-full transition-all duration-500',
                                readPct >= 75 ? 'bg-primary' : readPct >= 40 ? 'bg-amber-400' : 'bg-neutral/30'
                              )}
                              style={{ width: `${readPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* ======== TAB: ENVIAR ======== */}
        {activeTab === 'enviar' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Send Form */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader title="Nova Notificação" subtitle="Preencha os dados para enviar" />

                <div className="space-y-4 mt-4">
                  {/* Tipo */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Tipo</label>
                    <div className="flex gap-2">
                      {tipoOptions.map(opt => {
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setTipo(opt.value)}
                            className={clsx(
                              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all',
                              tipo === opt.value
                                ? opt.color
                                : 'text-neutral border-white/10 hover:border-white/20'
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Destinatário */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Destinatário</label>
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => { setTargetType('all'); setTargetId(''); }}
                        className={clsx(
                          'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all',
                          targetType === 'all'
                            ? 'bg-primary/15 text-primary border-primary/30'
                            : 'text-neutral border-white/10 hover:border-white/20'
                        )}
                      >
                        <Users className="w-4 h-4" />
                        Todos
                      </button>
                      <button
                        onClick={() => setTargetType('user')}
                        className={clsx(
                          'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all',
                          targetType === 'user'
                            ? 'bg-primary/15 text-primary border-primary/30'
                            : 'text-neutral border-white/10 hover:border-white/20'
                        )}
                      >
                        <User className="w-4 h-4" />
                        Usuário
                      </button>
                    </div>

                    {targetType === 'user' && (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral" />
                          <input
                            type="text"
                            placeholder="Buscar usuário..."
                            value={userSearch}
                            onChange={e => setUserSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-premium-darkGray border border-white/10 rounded-xl text-sm text-white placeholder-neutral focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/5">
                          {filteredUsers.slice(0, 20).map(u => (
                            <button
                              key={u.id}
                              onClick={() => { setTargetId(u.id); setUserSearch(''); }}
                              className={clsx(
                                'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-all',
                                targetId === u.id
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-neutral hover:text-white hover:bg-white/[0.03]'
                              )}
                            >
                              <div className="w-7 h-7 rounded-full bg-premium-darkGray flex items-center justify-center text-[10px] font-bold shrink-0">
                                {(u.name || u.nome || '?')[0]?.toUpperCase()}
                              </div>
                              <div className="text-left min-w-0">
                                <p className="truncate font-medium text-xs">{u.name || u.nome || 'Sem nome'}</p>
                                <p className="truncate text-[10px] text-neutral/60">{u.email}</p>
                              </div>
                              {targetId === u.id && <CheckCircle className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Título */}
                  <Input
                    label="Título"
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    placeholder="Ex: Atualização do sistema"
                    maxLength={100}
                  />

                  {/* Mensagem */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Mensagem</label>
                    <textarea
                      value={mensagem}
                      onChange={e => setMensagem(e.target.value)}
                      placeholder="Descreva a notificação..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-3 bg-premium-darkGray border border-white/10 rounded-xl text-sm text-white placeholder-neutral resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <p className="text-[10px] text-neutral/50 mt-1 text-right">{mensagem.length}/500</p>
                  </div>

                  {/* Preview */}
                  {(titulo || mensagem) && (
                    <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                      <p className="text-[10px] text-neutral/40 uppercase font-bold mb-2">Preview</p>
                      <div className="flex gap-2.5 items-start">
                        <div className={clsx(
                          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                          tipo === 'info' && 'bg-blue-500/15',
                          tipo === 'alerta' && 'bg-amber-500/15',
                          tipo === 'sucesso' && 'bg-primary/15',
                        )}>
                          {tipo === 'info' && <Info className="w-4 h-4 text-blue-400" />}
                          {tipo === 'alerta' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                          {tipo === 'sucesso' && <CheckCircle className="w-4 h-4 text-primary" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{titulo || 'Título...'}</p>
                          <p className="text-xs text-neutral mt-0.5">{mensagem || 'Mensagem...'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Send Button */}
                  <Button
                    onClick={handleSend}
                    className="w-full font-bold gap-2"
                    isLoading={isSending}
                    disabled={!titulo.trim() || !mensagem.trim() || (targetType === 'user' && !targetId)}
                  >
                    <Send className="w-4 h-4" />
                    {targetType === 'all' ? 'Enviar para Todos' : 'Enviar para Usuário'}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Recent (sidebar) */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader title="Recentes" subtitle={`Últimas ${Math.min(5, recentNotifs.length)} enviadas`} />
                <div className="space-y-2 mt-4 max-h-[500px] overflow-y-auto">
                  {recentNotifs.slice(0, 5).map(notif => {
                    const cfg = tipoConfig[notif.tipo] || tipoConfig.info;
                    return (
                      <div
                        key={notif.id}
                        className="flex items-start gap-2.5 p-2.5 bg-premium-darkGray/50 rounded-xl"
                      >
                        <div className={clsx(
                          'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center',
                          notif.tipo === 'info' && 'bg-blue-500/15',
                          notif.tipo === 'alerta' && 'bg-amber-500/15',
                          notif.tipo === 'sucesso' && 'bg-primary/15',
                        )}>
                          {notif.tipo === 'info' && <Info className="w-3.5 h-3.5 text-blue-400" />}
                          {notif.tipo === 'alerta' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                          {notif.tipo === 'sucesso' && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{notif.titulo}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-neutral/40">{formatDate(notif.criada_em)}</span>
                            <span className="text-[10px] text-neutral/40">·</span>
                            <span className={clsx('text-[10px] font-medium', notif.read_count > 0 ? 'text-primary' : 'text-neutral/40')}>
                              {notif.read_count} leram
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ======== DETAIL MODAL ======== */}
        <Modal isOpen={!!detailNotif} onClose={() => setDetailNotif(null)} title="Detalhes da Notificação" size="lg">
          {detailNotif && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className={clsx(
                  'shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                  detailNotif.tipo === 'info' && 'bg-blue-500/15',
                  detailNotif.tipo === 'alerta' && 'bg-amber-500/15',
                  detailNotif.tipo === 'sucesso' && 'bg-primary/15',
                )}>
                  {detailNotif.tipo === 'info' && <Info className="w-5 h-5 text-blue-400" />}
                  {detailNotif.tipo === 'alerta' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                  {detailNotif.tipo === 'sucesso' && <CheckCircle className="w-5 h-5 text-primary" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{detailNotif.titulo}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={clsx('px-2 py-0.5 rounded text-[10px] font-bold uppercase', tipoConfig[detailNotif.tipo]?.color)}>
                      {tipoConfig[detailNotif.tipo]?.label}
                    </span>
                    <span className="text-xs text-neutral/50">{formatDate(detailNotif.criada_em)}</span>
                  </div>
                </div>
              </div>

              {/* Mensagem */}
              <div className="p-4 bg-premium-darkGray rounded-xl">
                <p className="text-sm text-neutral/80 leading-relaxed whitespace-pre-wrap">{detailNotif.mensagem}</p>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-premium-darkGray rounded-xl">
                  <p className="text-[10px] text-neutral/40 uppercase font-bold mb-1">Destinatário</p>
                  <p className="text-sm text-white font-medium">{getTargetLabel(detailNotif)}</p>
                </div>
                <div className="p-3 bg-premium-darkGray rounded-xl">
                  <p className="text-[10px] text-neutral/40 uppercase font-bold mb-1">Leituras</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className={clsx(
                      'text-xl font-bold',
                      getReadPercent(detailNotif) >= 75 ? 'text-primary' : getReadPercent(detailNotif) >= 40 ? 'text-amber-400' : 'text-neutral'
                    )}>
                      {detailNotif.read_count}
                    </span>
                    <span className="text-xs text-neutral/40">
                      de {detailNotif.target_type === 'all' ? totalUsers : 1} ({getReadPercent(detailNotif)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-[10px] text-neutral/40 mb-1">
                  <span>Taxa de leitura</span>
                  <span>{getReadPercent(detailNotif)}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div
                    className={clsx(
                      'h-2 rounded-full transition-all duration-700',
                      getReadPercent(detailNotif) >= 75 ? 'bg-primary' : getReadPercent(detailNotif) >= 40 ? 'bg-amber-400' : 'bg-neutral/30'
                    )}
                    style={{ width: `${getReadPercent(detailNotif)}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={() => setDetailNotif(null)} variant="secondary" className="flex-1">
                  Fechar
                </Button>
                <Button
                  onClick={() => { setDeleteNotif(detailNotif); setDetailNotif(null); }}
                  variant="secondary"
                  className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* ======== DELETE CONFIRM ======== */}
        <ConfirmModal
          isOpen={!!deleteNotif}
          onClose={() => setDeleteNotif(null)}
          onConfirm={() => deleteNotif && handleDelete(deleteNotif)}
          title="Excluir Notificação"
          message={`Tem certeza que deseja excluir a notificação "${deleteNotif?.titulo}"? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          variant="danger"
        />
      </div>
    </MainLayout>
  );
}
