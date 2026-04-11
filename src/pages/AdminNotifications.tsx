import { useEffect, useState } from 'react';
import {
  Send, Users, User, Info, AlertTriangle, CheckCircle,
  Loader2, RefreshCw, Search, Filter, Bell, Eye,
  ChevronDown
} from 'lucide-react';
import { Card, CardHeader, Button, Input, Modal } from '../components/ui';
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

export function AdminNotificationsPanel() {
  const { sendNotification } = useNotificationStore();
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [recentNotifs, setRecentNotifs] = useState<Notification[]>([]);

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersRes] = await Promise.all([usersApi.getAll()]);
      if (usersRes.success && usersRes.data) {
        setAllUsers(usersRes.data);
      }

      // Load recent notifications
      const admin = await createAdminClient();
      const { data: notifs } = await admin
        .from('notificacoes')
        .select('*')
        .order('criada_em', { ascending: false })
        .limit(50);

      if (notifs) {
        setRecentNotifs(notifs);
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
        loadData(); // Refresh stats
      } else {
        toast.error('Erro ao enviar notificação');
      }
    } catch {
      toast.error('Erro ao enviar notificação');
    } finally {
      setIsSending(false);
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

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const tipoConfig: Record<string, { color: string; label: string }> = {
    info: { color: 'bg-blue-500/20 text-blue-400', label: 'Info' },
    alerta: { color: 'bg-amber-500/20 text-amber-400', label: 'Alerta' },
    sucesso: { color: 'bg-primary/20 text-primary', label: 'Sucesso' },
  };

  return (
    <MainLayout>
      <div className="space-y-6 pb-24 md:pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Enviar Notificações</h1>
            <p className="text-neutral mt-1">Envie notificações para usuários específicos ou todos</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Send Form */}
          <div className="lg:col-span-2">
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

          {/* Recent Notifications */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader
                title="Enviadas Recentemente"
                subtitle={`${recentNotifs.length} notificações`}
              />

              {isLoading ? (
                <div className="text-center py-8 text-neutral">Carregando...</div>
              ) : recentNotifs.length === 0 ? (
                <div className="text-center py-12 text-neutral">
                  <Bell className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nenhuma notificação enviada</p>
                </div>
              ) : (
                <div className="space-y-2 mt-4 max-h-[600px] overflow-y-auto">
                  {recentNotifs.map(notif => {
                    const cfg = tipoConfig[notif.tipo] || tipoConfig.info;
                    return (
                      <div
                        key={notif.id}
                        className="flex items-start gap-3 p-3 bg-premium-darkGray/50 hover:bg-white/[0.03] rounded-xl transition-all"
                      >
                        <div className={clsx(
                          'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                          notif.tipo === 'info' && 'bg-blue-500/15',
                          notif.tipo === 'alerta' && 'bg-amber-500/15',
                          notif.tipo === 'sucesso' && 'bg-primary/15',
                        )}>
                          {notif.tipo === 'info' && <Info className="w-4 h-4 text-blue-400" />}
                          {notif.tipo === 'alerta' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                          {notif.tipo === 'sucesso' && <CheckCircle className="w-4 h-4 text-primary" />}
                        </div>
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
                          <p className="text-xs text-neutral/60 mt-0.5 line-clamp-1">{notif.mensagem}</p>
                          <p className="text-[10px] text-neutral/40 mt-1">{formatDate(notif.criada_em)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
