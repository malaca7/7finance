import { useEffect, useState, useMemo } from 'react';
import { 
  Users, UserCheck, Shield, TrendingUp, TrendingDown, 
  DollarSign, AlertCircle, FileText, Search, Filter, 
  Download, Plus, Ban, Eye, Edit2, Trash2, 
  ChevronLeft, ChevronRight, Activity, Zap, History
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Card, CardHeader, Button, Input, Select, Modal, ConfirmModal } from '../components/ui';
import { MainLayout } from '../components/layout/MainLayout';
import { useAppStore } from '../store';
import { usersApi, adminApi, logsApi } from '../api';
import type { 
  User, UserRole, DriverType, AdminDashboardData, 
  AuditLog, SmartAlert, UserStatus, DateFilter 
} from '../types';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const roleOptions = [
  { value: 'user', label: 'Usuário' },
  { value: 'admin', label: 'Administrador' },
];

const statusOptions = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'bloqueado', label: 'Bloqueado' },
  { value: 'problema_financeiro', label: 'Problema Financeiro' },
];

const periodOptions = [
  { value: 'diario', label: 'Hoje' },
  { value: 'semanal', label: '7 Dias' },
  { value: 'mensal', label: '30 Dias' },
];

export function AdminPage() {
  const { allUsers, setAllUsers, user: currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics' | 'logs' | 'alerts'>('overview');
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Advanced Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<DateFilter>('mensal');

  // Modal states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Form states for Create/Edit
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formStatus, setFormStatus] = useState<UserStatus>('ativo');
  const [formRole, setFormRole] = useState<UserRole>('user');
  const [formPassword, setFormPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Logs filtering
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logFilterAction, setLogFilterAction] = useState<string>('all');

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, dashRes, logsRes] = await Promise.all([
        usersApi.getAll(),
        adminApi.getDashboardData(),
        logsApi.getAll()
      ]);

      if (usersRes.success) setAllUsers((usersRes.data as User[]) || []);
      if (dashRes.success) setDashboardData(dashRes.data || null);
      if (logsRes.success) setLogs(logsRes.data || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openUserModal = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setFormNome(user.nome || user.name || '');
      setFormEmail(user.email || '');
      setFormTelefone(user.telefone || user.phone || '');
      setFormStatus((user.status || (user.is_active === false ? 'inativo' : 'ativo')) as UserStatus);
      setFormRole(user.role as UserRole);
      setFormPassword('');
    } else {
      setSelectedUser(null);
      setFormNome('');
      setFormEmail('');
      setFormTelefone('');
      setFormStatus('ativo');
      setFormRole('user');
      setFormPassword('');
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!formNome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      let res;
      if (selectedUser) {
        // EDITAR usuário existente
        const userData: any = {
          nome: formNome,
          email: formEmail || undefined,
          telefone: formTelefone || undefined,
          status: formStatus,
          role: formRole,
        };
        res = await usersApi.update(selectedUser.id, userData);
        if (res.success) {
          await logsApi.create('EDITAR_USUARIO', `Editou usuário "${formNome}" (${selectedUser.id})`);
          toast.success('Usuário atualizado com sucesso!');
        }
      } else {
        // CRIAR novo usuário via RPC admin_create_user
        if (!formTelefone.trim() && !formEmail.trim()) {
          toast.error('Informe email ou telefone');
          setIsSaving(false);
          return;
        }
        if (!formPassword.trim()) {
          toast.error('Senha é obrigatória para novos usuários');
          setIsSaving(false);
          return;
        }

        res = await adminApi.createUser({
          name: formNome,
          email: formEmail || undefined,
          phone: formTelefone || undefined,
          password: formPassword,
          role: formRole,
        });
        if (res.success) {
          // Se criou com status inativo, atualizar
          if (formStatus !== 'ativo' && res.data?.user_id) {
            await usersApi.update(res.data.user_id, { status: formStatus });
          }
          await logsApi.create('CRIAR_USUARIO', `Criou usuário "${formNome}" (${res.data?.email || formEmail})`);
          toast.success('Usuário criado com sucesso!');
        }
      }
      
      if (res?.success) {
        setIsUserModalOpen(false);
        loadAllAdminData();
      } else {
        toast.error(res?.error || 'Erro ao salvar usuário');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    toast.success(`Exportando dados em formato ${format.toUpperCase()}...`);
    logsApi.create('EXPORTAR', `Exportou relatórios em ${format}`);
  };

  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      const matchesSearch = 
        ((user.nome || user.name) || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        ((user.telefone || user.phone) || '').includes(searchTerm);
      
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesStatus = filterStatus === 'all' || (user.status || (user.is_active === false ? 'inativo' : 'ativo')) === filterStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [allUsers, searchTerm, filterRole, filterStatus]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusColor = (status?: UserStatus) => {
    switch (status || 'ativo') {
      case 'ativo': return 'text-green-500 bg-green-500/10';
      case 'inativo': return 'text-gray-400 bg-gray-500/10';
      case 'bloqueado': return 'text-red-500 bg-red-500/10';
      case 'problema_financeiro': return 'text-orange-500 bg-orange-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 pb-24 lg:pb-8">
        {/* Header Admin */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">7 <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent drop-shadow-[0_0_8px_#39FF14]">Admin</span></h1>
            <p className="text-gray-400 text-sm">Controle total da plataforma e gestão de usuários</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm" onClick={() => openUserModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
          <div className="flex items-center gap-1 bg-premium-dark p-1 rounded-app w-fit border border-premium-gray/30">
            {[
              { id: 'overview', label: 'Geral', icon: Activity },
              { id: 'users', label: 'Usuários', icon: Users },
              { id: 'analytics', label: 'Financeiro', icon: DollarSign },
              { id: 'logs', label: 'Auditoria', icon: History },
              { id: 'alerts', label: 'Alertas', icon: Zap },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-2 rounded-app text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-gradient-to-r from-primary via-accent to-primary text-premium-black shadow-[0_0_16px_0_rgba(57,255,20,0.25)]" 
                    : "text-gray-400 hover:text-white hover:bg-premium-gray/50"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card variant="highlight" className="border-l-4 border-l-primary">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Usuários Ativos</p>
                    <h3 className="text-2xl font-bold text-white">{dashboardData.stats.usuariosAtivos}</h3>
                    <p className="text-[10px] text-green-500 mt-1 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" /> +{dashboardData.stats.novosUsuarios7Dias} esta semana
                    </p>
                  </div>
                  <div className="p-2 bg-premium-gold/10 rounded-lg">
                    <Users className="w-5 h-5 text-premium-gold" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Ganhos Globais</p>
                    <h3 className="text-2xl font-bold text-white">{formatCurrency(dashboardData.stats.totalGanhosGlobal)}</h3>
                    <p className="text-[10px] text-gray-500 mt-1">Total acumulado na rede</p>
                  </div>
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Lucro Médio/Mot.</p>
                    <h3 className="text-2xl font-bold text-white">{formatCurrency(dashboardData.stats.lucroMedioPorMotorista)}</h3>
                    <p className="text-[10px] text-blue-400 mt-1">Desempenho por motorista</p>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </Card>

              <Card variant="warning">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Alertas Críticos</p>
                    <h3 className="text-2xl font-bold text-white">{dashboardData.alerts.length}</h3>
                    <p className="text-[10px] text-red-400 mt-1">Ações necessárias</p>
                  </div>
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Growth Chart */}
              <Card className="lg:col-span-2">
                <CardHeader title="Crescimento da Plataforma" subtitle="Usuários vs Faturamento" />
                <div className="h-72 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData.graficoCrescimento}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="data" stroke="#4B5563" fontSize={12} />
                      <YAxis stroke="#4B5563" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid #1F1F1F', borderRadius: '12px' }}
                        itemStyle={{ color: '#F0F0F0' }}
                      />
                      <Area type="monotone" dataKey="usuarios" stroke="#D4AF37" fillOpacity={1} fill="url(#colorUsers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Insights & Actions */}
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-premium-dark to-premium-black border-premium-gold/20">
                  <h4 className="flex items-center gap-2 text-premium-gold font-bold mb-4">
                    <Zap className="w-4 h-4" /> Smart Insights
                  </h4>
                  <div className="space-y-4">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-xs text-gray-400">Eficiência</p>
                      <p className="text-sm text-white font-medium mt-1">
                        {dashboardData.stats.percentualBaixoLucro}% dos motoristas estão com lucro abaixo do ideal.
                      </p>
                      <button className="text-premium-gold text-xs mt-2 font-bold hover:underline">Ver quem são</button>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-xs text-gray-400">Inatividade</p>
                      <p className="text-sm text-white font-medium mt-1">
                        {dashboardData.stats.usuariosInativos} motoristas não trabalham há mais de 3 dias.
                      </p>
                      <button className="text-premium-gold text-xs mt-2 font-bold hover:underline">Enviar Notificação</button>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h4 className="text-white font-bold mb-4">Ações Rápidas</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-3 bg-premium-gray/30 hover:bg-premium-gold/20 text-gray-300 hover:text-premium-gold rounded-lg transition-all text-xs flex flex-col items-center gap-2">
                      <Download className="w-4 h-4" /> Relatório Geral
                    </button>
                    <button className="p-3 bg-premium-gray/30 hover:bg-premium-gold/20 text-gray-300 hover:text-premium-gold rounded-lg transition-all text-xs flex flex-col items-center gap-2">
                      <Shield className="w-4 h-4" /> Auditoria
                    </button>
                  </div>
                </Card>
              </div>
            </div>

            {/* Smart Alerts Feed */}
            <Card>
              <CardHeader title="Alertas Inteligentes" subtitle="Monitoramento em tempo real" />
              <div className="space-y-3 mt-4">
                {dashboardData.alerts.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Tudo sob controle. Nenhum alerta pendente.</p>
                ) : (
                  dashboardData.alerts.map(alert => (
                    <div key={alert.id} className="flex items-start gap-4 p-4 bg-premium-gray/20 rounded-app border border-premium-gray/30 group hover:border-premium-gold/30 transition-all">
                      <div className={clsx(
                        "p-2 rounded-full",
                        alert.tipo === 'error' ? "bg-red-500/20 text-red-500" : "bg-orange-500/20 text-orange-500"
                      )}>
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-bold text-white">{alert.usuario_nome}</h5>
                          <span className="text-[10px] text-gray-500">{new Date(alert.data).toLocaleTimeString('pt-BR')}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{alert.mensagem}</p>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-2 bg-premium-gold text-premium-black rounded-lg transition-all text-[10px] font-bold">
                        AGIR
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in">
            {/* Filters bar */}
            <Card className="!p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text"
                    placeholder="Buscar por nome, email ou placa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-premium-black border border-premium-gray/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-premium-gold transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <Select 
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    options={[{ value: 'all', label: 'Todos Perfis' }, ...roleOptions]}
                    className="!w-40"
                  />
                  <Select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    options={[{ value: 'all', label: 'Todos Status' }, ...statusOptions]}
                    className="!w-40"
                  />
                </div>
              </div>
            </Card>

            {/* Users Table */}
            <Card className="!p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-premium-dark border-b border-premium-gray/30">
                      <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Usuário</th>
                      <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Telefone</th>
                      <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Perfil</th>
                      <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Cadastro</th>
                      <th className="text-right p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-premium-gray/20">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">Nenhum usuário encontrado</td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-premium-gray/10 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 via-accent/10 to-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold shadow-[0_0_8px_#39FF14]">
                                {(user.nome || user.name || 'U').charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">{user.nome || user.name || 'Sem nome'}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-gray-300">{user.telefone || user.phone || '-'}</p>
                          </td>
                          <td className="p-4">
                            <span className={clsx(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              user.role === 'admin' ? "bg-gradient-to-r from-primary/20 via-accent/10 to-primary/10 text-primary" : "bg-blue-500/20 text-blue-400"
                            )}>
                              {user.role === 'admin' ? 'Admin' : 'Usuário'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={clsx(
                              "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              getStatusColor((user.status || (user.is_active === false ? 'inativo' : 'ativo')) as UserStatus)
                            )}>
                              {(user.status || (user.is_active === false ? 'inativo' : 'ativo')).replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="text-xs text-gray-500">{user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}</p>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => openUserModal(user)}
                                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => { setUserToDelete(user.id); setIsDeleteModalOpen(true); }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="p-4 border-t border-premium-gray/30 flex items-center justify-between bg-premium-dark/50">
                <span className="text-xs text-gray-500">Mostrando {filteredUsers.length} de {allUsers.length} usuários</span>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-premium-gray/50 hover:bg-premium-gray text-white text-xs rounded transition-all disabled:opacity-30">Anterior</button>
                  <button className="px-3 py-1 bg-gradient-to-r from-primary via-accent to-primary text-premium-black text-xs font-bold rounded transition-all shadow-[0_0_8px_#39FF14]">Próxima</button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'analytics' && dashboardData && (
          <div className="space-y-6 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader title="Distribuição de Custos" subtitle="Análise global por categoria" />
                  <div className="h-64 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardData.distribuicaoDespesas}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {dashboardData.distribuicaoDespesas.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={[ '#D4AF37', '#E5C158', '#9CA3AF', '#3A3A3A' ][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                    {dashboardData.distribuicaoDespesas.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: [ '#D4AF37', '#E5C158', '#9CA3AF', '#3A3A3A' ][i % 4] }} />
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Faturamento da Plataforma" subtitle="Crescimento Mensal" />
                  <div className="h-64 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.graficoCrescimento}>
                        <XAxis dataKey="data" stroke="#4B5563" fontSize={10} />
                        <YAxis stroke="#4B5563" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid #1F1F1F' }} />
                        <Bar dataKey="receita" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
             </div>

             <Card>
                <CardHeader title="Top Motoristas mais Lucrativos" subtitle="Baseado em dados de desempenho real" />
                <div className="space-y-4 mt-6">
                  {dashboardData.topDrivers.map((driver, index) => (
                    <div key={driver.id} className="flex items-center justify-between p-4 bg-premium-gray/10 border border-premium-gray/30 rounded-app">
                      <div className="flex items-center gap-4">
                        <div className="text-xl font-bold text-premium-gold/30 w-6">#{index + 1}</div>
                        <div className="w-10 h-10 rounded-full bg-premium-gray flex items-center justify-center font-bold text-white border border-premium-gold/20">
                          {driver.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{driver.nome}</p>
                          <p className="text-xs text-gray-500">{driver.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-500">{formatCurrency(driver.lucroLiquido)}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Lucro Líquido</p>
                      </div>
                    </div>
                  ))}
                </div>
             </Card>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4 animate-fade-in">
            {/* Filtros de Logs */}
            <Card className="!p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text"
                    placeholder="Buscar nos logs por ação, descrição ou admin..."
                    value={logSearchTerm}
                    onChange={(e) => setLogSearchTerm(e.target.value)}
                    className="w-full bg-premium-black border border-premium-gray/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-premium-gold transition-all"
                  />
                </div>
                <Select 
                  value={logFilterAction}
                  onChange={(e) => setLogFilterAction(e.target.value)}
                  options={[
                    { value: 'all', label: 'Todas Ações' },
                    { value: 'CRIAR_USUARIO', label: 'Criar Usuário' },
                    { value: 'EDITAR_USUARIO', label: 'Editar Usuário' },
                    { value: 'EXCLUIR_USUARIO', label: 'Excluir Usuário' },
                    { value: 'EXPORTAR', label: 'Exportar' },
                    { value: 'LOGIN', label: 'Login' },
                  ]}
                  className="!w-48"
                />
                <Button variant="outline" size="sm" onClick={loadAllAdminData}>
                  <Activity className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </Card>

            {/* Stats rápidos dos logs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="!p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{logs.length}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Total Registros</p>
                  </div>
                </div>
              </Card>
              <Card className="!p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <UserCheck className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{logs.filter(l => l.action === 'CRIAR_USUARIO').length}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Usuários Criados</p>
                  </div>
                </div>
              </Card>
              <Card className="!p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Edit2 className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{logs.filter(l => l.action === 'EDITAR_USUARIO').length}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Edições</p>
                  </div>
                </div>
              </Card>
              <Card className="!p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{logs.filter(l => l.action === 'EXCLUIR_USUARIO').length}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Exclusões</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Tabela de logs */}
            <Card className="!p-0 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full">
                    <thead>
                      <tr className="bg-premium-dark border-b border-premium-gray/30">
                        <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Data / Hora</th>
                        <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Administrador</th>
                        <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Ação</th>
                        <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-premium-gray/20">
                      {(() => {
                        const filtered = logs.filter(log => {
                          const matchesSearch = logSearchTerm === '' || 
                            (log.action || '').toLowerCase().includes(logSearchTerm.toLowerCase()) ||
                            (log.entity || '').toLowerCase().includes(logSearchTerm.toLowerCase()) ||
                            ((log as any).admin_name || '').toLowerCase().includes(logSearchTerm.toLowerCase());
                          const matchesAction = logFilterAction === 'all' || log.action === logFilterAction;
                          return matchesSearch && matchesAction;
                        });
                        
                        if (filtered.length === 0) {
                          return (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">
                              <div className="flex flex-col items-center gap-2">
                                <History className="w-8 h-8 text-gray-600" />
                                <p>Nenhum registro de auditoria encontrado</p>
                              </div>
                            </td></tr>
                          );
                        }
                        
                        return filtered.map(log => {
                          const actionColors: Record<string, string> = {
                            'CRIAR_USUARIO': 'bg-green-500/20 text-green-400 border-green-500/30',
                            'EDITAR_USUARIO': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                            'EXCLUIR_USUARIO': 'bg-red-500/20 text-red-400 border-red-500/30',
                            'EXPORTAR': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                            'LOGIN': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                          };
                          const actionLabels: Record<string, string> = {
                            'CRIAR_USUARIO': 'Criar Usuário',
                            'EDITAR_USUARIO': 'Editar Usuário',
                            'EXCLUIR_USUARIO': 'Excluir Usuário',
                            'EXPORTAR': 'Exportação',
                            'LOGIN': 'Login',
                            'CREATE': 'Criar',
                          };
                          const colorClass = actionColors[log.action] || 'bg-white/5 text-gray-400 border-white/10';
                          
                          return (
                            <tr key={log.id} className="text-xs hover:bg-premium-gray/10 transition-colors">
                              <td className="p-4">
                                <p className="text-gray-300 font-medium">{new Date(log.created_at || '').toLocaleDateString('pt-BR')}</p>
                                <p className="text-gray-500 text-[10px]">{new Date(log.created_at || '').toLocaleTimeString('pt-BR')}</p>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-premium-gold/10 flex items-center justify-center text-premium-gold text-[10px] font-bold">
                                    {((log as any).admin_name || 'S').charAt(0)}
                                  </div>
                                  <span className="text-premium-gold font-bold">{(log as any).admin_name || 'Sistema'}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={clsx("px-2 py-0.5 border rounded text-[9px] font-bold uppercase", colorClass)}>
                                  {actionLabels[log.action] || log.action}
                                </span>
                              </td>
                              <td className="p-4 text-gray-400 max-w-xs truncate">{log.entity || (log.metadata as any)?.descricao || '-'}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                 </table>
               </div>
               {/* Footer dos logs */}
               <div className="p-4 border-t border-premium-gray/30 flex items-center justify-between bg-premium-dark/50">
                 <span className="text-xs text-gray-500">
                   {logs.length} registros de auditoria
                 </span>
                 <span className="text-xs text-gray-600">
                   Últimas 200 ações registradas
                 </span>
               </div>
            </Card>
          </div>
        )}
      </div>

      {/* User Modal Edit/Create */}
      <Modal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
        title={selectedUser ? "Editar Usuário" : "Criar Novo Usuário"}
      >
        <div className="space-y-4">
           <Input 
             label="Nome Completo" 
             placeholder="Nome do motorista" 
             value={formNome} 
             onChange={(e) => setFormNome(e.target.value)} 
           />
           <Input 
             label="Telefone" 
             placeholder="81996138924" 
             value={formTelefone} 
             onChange={(e) => setFormTelefone(e.target.value)} 
           />
           <Input 
             label="Email (opcional se informar telefone)" 
             placeholder="exemplo@email.com" 
             value={formEmail} 
             onChange={(e) => setFormEmail(e.target.value)} 
           />
           <p className="text-[10px] text-gray-500 -mt-2">
             {!formEmail && formTelefone 
               ? `Login será: ${formTelefone.replace(/\D/g, '')}@7finance.com`
               : formEmail 
                 ? `Login será: ${formEmail}`
                 : 'Informe email ou telefone para gerar o login'}
           </p>
           <div className="grid grid-cols-2 gap-4">
              <Select 
                label="Status" 
                options={statusOptions} 
                value={formStatus} 
                onChange={(e) => setFormStatus(e.target.value as UserStatus)} 
              />
              <Select 
                label="Perfil de Acesso" 
                options={roleOptions} 
                value={formRole} 
                onChange={(e) => setFormRole(e.target.value as UserRole)} 
              />
           </div>
           
           {!selectedUser ? (
             <Input 
               label="Senha Inicial" 
               type="password"
               placeholder="Mínimo 6 caracteres" 
               value={formPassword} 
               onChange={(e) => setFormPassword(e.target.value)} 
             />
           ) : (
             <div className="p-3 bg-white/5 rounded-lg border border-white/10">
               <p className="text-[10px] text-gray-400 mb-1">💡 Alterar senha</p>
               <p className="text-xs text-gray-500">Para redefinir a senha, o usuário pode usar o fluxo de "Esqueci minha senha" ou você pode recriá-lo.</p>
             </div>
           )}

           <div className="flex gap-2 pt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setIsUserModalOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSaveUser} disabled={isSaving}>
                {isSaving ? 'Salvando...' : selectedUser ? "Salvar Alterações" : "Criar Usuário"}
              </Button>
           </div>
        </div>
      </Modal>

      {/* Confirm Modal for Delete */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          if (userToDelete) {
            const deletedUser = allUsers.find(u => u.id === userToDelete);
            const res = await usersApi.delete(userToDelete);
            if (res.success !== false) {
              await logsApi.create('EXCLUIR_USUARIO', `Excluiu usuário "${deletedUser?.nome || deletedUser?.name || userToDelete}"`);
              toast.success('Usuário excluído com sucesso');
              loadAllAdminData();
            } else {
              toast.error('Erro ao excluir usuário');
            }
          }
          setIsDeleteModalOpen(false);
        }}
        title="Confirmar Exclusão"
        message="Esta ação é irreversível e removerá todos os dados financeiros associados a este usuário."
        confirmText="Sim, Excluir Definitivamente"
        variant="danger"
      />
    </MainLayout>
  );
}

