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
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  // Form states for Create/Edit
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formStatus, setFormStatus] = useState<UserStatus>('ativo');
  const [formRole, setFormRole] = useState<UserRole>('user');
  const [formPassword, setFormPassword] = useState('');

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
      setFormNome(user.nome);
      setFormEmail(user.email);
      setFormStatus(user.status || 'ativo');
      setFormRole(user.role);
      setFormPassword('');
    } else {
      setSelectedUser(null);
      setFormNome('');
      setFormEmail('');
      setFormStatus('ativo');
      setFormRole('user');
      setFormPassword('');
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async () => {
    const userData = {
      nome: formNome,
      email: formEmail,
      status: formStatus,
      role: formRole,
      password: formPassword || undefined
    };

    let res;
    if (selectedUser) {
      res = await usersApi.update(selectedUser.id, userData);
      if (res.success) {
        logsApi.create('Usuário Editado', `Admin ${currentUser?.nome} editou o usuário ${formNome}`);
      }
    } else {
      res = await usersApi.update(0, userData); // Admin create via POST /api.php?entity=usuario
      if (res.success) {
        logsApi.create('Usuário Criado', `Admin ${currentUser?.nome} criou o usuário ${formNome}`);
      }
    }
    
    if (res?.success) {
      setIsUserModalOpen(false);
      loadAllAdminData();
    } else {
      alert('Erro ao salvar usuário: ' + (res?.error || 'Erro desconhecido'));
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    alert(`Exportando dados em formato ${format.toUpperCase()}...`);
    logsApi.create('Exportação', `Admin exportou relatórios em ${format}`);
  };

  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      const matchesSearch = 
        (user.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.telefone || '').includes(searchTerm);
      
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesStatus = filterStatus === 'all' || (user.status || 'ativo') === filterStatus;

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
            <h1 className="text-3xl font-bold text-white tracking-tight">7 <span className="text-premium-gold">Admin</span></h1>
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
                "flex items-center gap-2 px-4 py-2 rounded-app text-sm font-medium transition-all",
                activeTab === tab.id 
                  ? "bg-premium-gold text-premium-black shadow-glow" 
                  : "text-gray-400 hover:text-white hover:bg-premium-gray/50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card variant="highlight" className="border-l-4 border-l-premium-gold">
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
                      <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Perfil & Tipo</th>
                      <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Veículo</th>
                      <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="text-right p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-premium-gray/20">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum usuário encontrado</td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-premium-gray/10 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-premium-gold/10 border border-premium-gold/20 flex items-center justify-center text-premium-gold font-bold">
                                {user.nome.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">{user.nome}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <span className={clsx(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                user.role === 'admin' ? "bg-premium-gold/20 text-premium-gold" : "bg-blue-500/20 text-blue-400"
                              )}>
                                {user.role}
                              </span>
                              <span className="px-2 py-0.5 bg-premium-gray rounded text-[10px] font-bold uppercase text-gray-400">
                                {user.tipo === 'app' ? 'Transporte App' : 'Particular'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-white">{user.veiculo || 'N/A'}</p>
                            <p className="text-xs text-gray-500 font-medium">{user.placa || 'Sem placa'}</p>
                          </td>
                          <td className="p-4">
                            <span className={clsx(
                              "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              getStatusColor(user.status)
                            )}>
                              {(user.status || 'ativo').replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => openUserModal(user)}
                                className="p-2 text-gray-400 hover:text-premium-gold hover:bg-premium-gold/10 rounded-lg transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => { setUserToDelete(user.id); setIsDeleteModalOpen(true); }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
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
                  <button className="px-3 py-1 bg-premium-gold text-premium-black text-xs font-bold rounded transition-all">Próxima</button>
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
            <Card className="!p-0 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full">
                    <thead>
                      <tr className="bg-premium-dark border-b border-premium-gray/30">
                        <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Data</th>
                        <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Admin</th>
                        <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Ação</th>
                        <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-premium-gray/20">
                      {logs.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-gray-500">Nenhum registro de auditoria</td></tr>
                      ) : (
                        logs.map(log => (
                          <tr key={log.id} className="text-xs hover:bg-premium-gray/10">
                            <td className="p-4 text-gray-500">{new Date(log.data).toLocaleString('pt-BR')}</td>
                            <td className="p-4 text-premium-gold font-bold">{log.usuario_nome}</td>
                            <td className="p-4"><span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded uppercase font-bold text-[9px] text-white">{log.acao}</span></td>
                            <td className="p-4 text-gray-400">{log.descricao}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                 </table>
               </div>
            </Card>
          </div>
        )}
      </div>

      {/* User Modal Edit/Create */}
      <Modal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
        title={selectedUser ? "Editar Usuário" : "Configurar Novo Usuário"}
      >
        <div className="space-y-4">
           <Input 
             label="Nome Completo" 
             placeholder="Nome do motorista" 
             value={formNome} 
             onChange={(e) => setFormNome(e.target.value)} 
           />
           <Input 
             label="Email Corporativo" 
             placeholder="exemplo@7finance.com" 
             value={formEmail} 
             onChange={(e) => setFormEmail(e.target.value)} 
           />
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
           
           <Input 
             label={selectedUser ? "Nova Senha (deixe em branco para manter)" : "Senha Inicial"} 
             type="password"
             placeholder="******" 
             value={formPassword} 
             onChange={(e) => setFormPassword(e.target.value)} 
           />

           <div className="flex gap-2 pt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setIsUserModalOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSaveUser}>
                {selectedUser ? "Salvar Alterações" : "Criar Usuário"}
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
            await usersApi.delete(userToDelete);
            logsApi.create('Exclusão', `Usuário ID ${userToDelete} foi removido do sistema.`);
            loadAllAdminData();
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

