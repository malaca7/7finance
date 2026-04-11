import { useEffect, useState, useMemo } from 'react';
import { 
  Users, Search, Plus, Edit2, Trash2, Activity, DollarSign, History, Zap,
  Key, Crown, Eye, EyeOff, Copy, Check
} from 'lucide-react';
import { Card, CardHeader, Button, Input, Select, Modal, ConfirmModal } from '../components/ui';
import { MainLayout } from '../components/layout/MainLayout';
import { useAppStore } from '../store';
import { usersApi, adminApi, logsApi } from '../api';
import { plansApi } from '../api/plans';
import { supabase } from '../api/supabase';
import type { User, UserRole, UserStatus, PlanType, Plan } from '../types';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { Link, useLocation } from 'react-router-dom';

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

export function AdminUsersPage() {
  const { allUsers, setAllUsers } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<{ password: string; email: string; name: string } | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetType, setResetType] = useState<'random' | 'manual'>('random');
  const [manualPassword, setManualPassword] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [userIdToReset, setUserIdToReset] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formStatus, setFormStatus] = useState<UserStatus>('ativo');
  const [formRole, setFormRole] = useState<UserRole>('user');
  const [formPassword, setFormPassword] = useState('');
  const [formPlan, setFormPlan] = useState<PlanType>('free');
  const [isSaving, setIsSaving] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userPlans, setUserPlans] = useState<Record<string, PlanType>>({});
  const [changingPlan, setChangingPlan] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
    loadPlans();
  }, []);

  const loadPlans = async () => {
    const res = await plansApi.getAll();
    if (res.success && res.data) setPlans(res.data);
  };

  const loadUserPlans = async (users: User[]) => {
    const { data } = await supabase
      .from('user_planos')
      .select('user_id, planos(nome)')
      .eq('status', 'ativo');
    if (data) {
      const map: Record<string, PlanType> = {};
      data.forEach((d: any) => { map[d.user_id] = d.planos?.nome || 'free'; });
      setUserPlans(map);
    }
  };

  const handleChangePlan = async (userId: string, newPlan: PlanType) => {
    setChangingPlan(userId);
    try {
      const { data, error } = await supabase.rpc('change_user_plan', {
        p_user_id: userId,
        p_new_plan_name: newPlan,
        p_periodo: 'mensal',
      });
      if (error) { toast.error(error.message); return; }
      const result = data as any;
      if (!result?.success) { toast.error(result?.error || 'Erro'); return; }
      await logsApi.create('ALTERAR_PLANO', `Alterou plano do usuário ${userId} para ${newPlan}`);
      toast.success(`Plano alterado para ${newPlan.toUpperCase()}`);
      setUserPlans(prev => ({ ...prev, [userId]: newPlan }));
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar plano');
    } finally {
      setChangingPlan(null);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await usersApi.getAll();
      if (res.success) {
        const users = (res.data as User[]) || [];
        setAllUsers(users);
        loadUserPlans(users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
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

  const openUserModal = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setFormNome(user.nome || user.name || '');
      setFormEmail(user.email || '');
      setFormTelefone(user.telefone || user.phone || '');
      setFormStatus((user.status || (user.is_active === false ? 'inativo' : 'ativo')) as UserStatus);
      setFormRole(user.role as UserRole);
      setFormPassword('');
      setFormPlan(userPlans[user.id] || 'free');
    } else {
      setSelectedUser(null);
      setFormNome('');
      setFormEmail('');
      setFormTelefone('');
      setFormStatus('ativo');
      setFormRole('user');
      setFormPassword('');
      setFormPlan('free');
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
        const userData: any = {
          nome: formNome,
          email: formEmail || undefined,
          telefone: formTelefone || undefined,
          status: formStatus,
          role: formRole,
        };
        res = await usersApi.update(selectedUser.id, userData);
        if (res.success) {
          // Alterar plano se mudou
          const currentPlan = userPlans[selectedUser.id] || 'free';
          if (formPlan !== currentPlan) {
            await handleChangePlan(selectedUser.id, formPlan);
          }
          await logsApi.create('EDITAR_USUARIO', `Editou usuário "${formNome}" (${selectedUser.id})`);
          toast.success('Usuário atualizado com sucesso!');
        }
      } else {
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
          if (formStatus !== 'ativo' && res.data?.user_id) {
            await usersApi.update(res.data.user_id, { status: formStatus });
          }
          await logsApi.create('CRIAR_USUARIO', `Criou usuário "${formNome}" (${res.data?.email || formEmail})`);
          toast.success('Usuário criado com sucesso!');
        }
      }
      
      if (res?.success) {
        setIsUserModalOpen(false);
        loadUsers();
      } else {
        toast.error(res?.error || 'Erro ao salvar usuário');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    const deletedUser = allUsers.find(u => u.id === userToDelete);
    const res = await usersApi.delete(userToDelete);
    if (res.success !== false) {
      await logsApi.create('EXCLUIR_USUARIO', `Excluiu usuário "${deletedUser?.nome || deletedUser?.name || userToDelete}"`);
      toast.success('Usuário excluído com sucesso');
      loadUsers();
    } else {
      toast.error('Erro ao excluir usuário');
    }
    setIsDeleteModalOpen(false);
  };

  const handleResetPassword = async () => {
    if (!userIdToReset) return;
    
    if (resetType === 'manual' && manualPassword.length < 6) {
      return toast.error('A senha manual deve ter pelo menos 6 caracteres');
    }

    setIsResettingPassword(true);
    try {
      const targetUser = allUsers.find(u => u.id === userIdToReset);
      const res = await usersApi.resetPassword(userIdToReset, resetType === 'manual' ? manualPassword : undefined);
      if (res.success && res.data) {
        setIsResetModalOpen(false);
        setGeneratedPassword({
          password: res.data.newPassword,
          email: targetUser?.email || targetUser?.phone || 'N/A',
          name: targetUser?.nome || targetUser?.name || 'N/A'
        });
        
        // Também atualiza o estado de visualização na tabela se o admin quiser ver lá também
        setVisiblePasswords(prev => ({ ...prev, [userIdToReset]: res.data!.newPassword }));
        
        await logsApi.create('REDEFINIR_SENHA', `Redefiniu senha do usuário ID ${userIdToReset} (${resetType})`);
        toast.success(resetType === 'random' ? 'Senha aleatória gerada!' : 'Senha manual definida!');
        setManualPassword('');
      } else {
        toast.error(res.error || 'Erro ao redefinir senha');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado');
    } finally {
      setIsResettingPassword(false);
    }
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Usuários</h1>
            <p className="text-gray-400 text-sm">Gerencie todos os usuários da plataforma</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => openUserModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
          <div className="flex items-center gap-1 bg-premium-dark p-1 rounded-app w-fit border border-premium-gray/30">
            {[
              { id: 'overview', label: 'Geral', icon: Activity, path: '/admin' },
              { id: 'users', label: 'Usuários', icon: Users, path: '/admin/users' },
              { id: 'analytics', label: 'Financeiro', icon: DollarSign, path: '/admin/analytics' },
              { id: 'logs', label: 'Auditoria', icon: History, path: '/admin/logs' },
              { id: 'alerts', label: 'Alertas', icon: Zap, path: '/admin/alerts' },
            ].map((tab) => {
              const isActive = location.pathname === tab.path;
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-2 rounded-app text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
                    isActive
                      ? "bg-primary text-black shadow-glow-green"
                      : "text-neutral hover:bg-premium-gray/50 hover:text-white"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <Card className="!p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text"
                placeholder="Buscar por nome, email ou telefone..."
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

        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-premium-dark border-b border-premium-gray/30">
                  <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Usuário</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Telefone</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Perfil</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Plano</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Senha</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Cadastro</th>
                  <th className="text-right p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-premium-gray/20">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">Nenhum usuário encontrado</td>
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
                        <select
                          value={userPlans[user.id] || 'free'}
                          onChange={(e) => handleChangePlan(user.id, e.target.value as PlanType)}
                          disabled={changingPlan === user.id}
                          className={clsx(
                            "text-xs font-bold uppercase px-2 py-1.5 rounded-lg border-0 cursor-pointer transition-all",
                            changingPlan === user.id && "opacity-50",
                            (userPlans[user.id] || 'free') === 'premium' ? 'bg-amber-500/20 text-amber-400' :
                            (userPlans[user.id] || 'free') === 'pro' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          )}
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="premium">Premium</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs font-mono text-gray-400 bg-premium-black px-2 py-1 rounded min-w-[80px] text-center">
                            {visiblePasswords[user.id] || '••••••••'}
                          </code>
                          {visiblePasswords[user.id] ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setVisiblePasswords(prev => { const n = {...prev}; delete n[user.id]; return n; })}
                                className="p-1.5 rounded-lg text-neutral hover:text-white hover:bg-white/5 transition-all outline-none"
                                title="Ocultar senha"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  const pass = visiblePasswords[user.id];
                                  if (navigator.clipboard) {
                                    navigator.clipboard.writeText(pass)
                                      .then(() => {
                                        setCopiedId(user.id);
                                        toast.success('Copiado!');
                                        setTimeout(() => setCopiedId(null), 2000);
                                      })
                                      .catch(() => toast.error('Erro ao copiar'));
                                  } else {
                                    const textArea = document.createElement("textarea");
                                    textArea.value = pass;
                                    document.body.appendChild(textArea);
                                    textArea.select();
                                    try {
                                      document.execCommand('copy');
                                      setCopiedId(user.id);
                                      toast.success('Copiado!');
                                      setTimeout(() => setCopiedId(null), 2000);
                                    } catch (err) {
                                      toast.error('Erro ao copiar');
                                    }
                                    document.body.removeChild(textArea);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-neutral hover:text-white hover:bg-white/5 transition-all outline-none"
                                title="Copiar senha"
                              >
                                {copiedId === user.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setUserIdToReset(user.id);
                                setIsResetModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-neutral hover:text-primary hover:bg-primary/10 transition-all"
                              title="Redefinir e visualizar senha"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-gray-500">{user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}</p>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            onClick={() => {
                              setUserIdToReset(user.id);
                              setIsResetModalOpen(true);
                            }}
                            variant="secondary"
                            size="sm"
                            className="p-2 rounded-lg transition-all"
                            title="Redefinir Senha"
                            disabled={isResettingPassword}
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button 
                            onClick={() => openUserModal(user)}
                            variant="primary"
                            size="sm"
                            className="p-2 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            onClick={() => { setUserToDelete(user.id); setIsDeleteModalOpen(true); }}
                            variant="danger"
                            size="sm"
                            className="p-2 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-premium-gray/30 flex items-center justify-between bg-premium-dark/50">
            <span className="text-xs text-gray-500">Mostrando {filteredUsers.length} de {allUsers.length} usuários</span>
          </div>
        </Card>

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
              label="Email (opcional)" 
              placeholder="exemplo@email.com" 
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
            
            {selectedUser && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Plano</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['free', 'pro', 'premium'] as PlanType[]).map(plan => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setFormPlan(plan)}
                      className={clsx(
                        "py-2.5 px-3 rounded-xl text-sm font-bold uppercase border-2 transition-all",
                        formPlan === plan
                          ? plan === 'premium' ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                          : plan === 'pro' ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                          : 'border-gray-500 bg-gray-500/20 text-gray-300'
                        : 'border-transparent bg-premium-darkGray/50 text-gray-500 hover:bg-premium-darkGray'
                      )}
                    >
                      {plan === 'premium' && <Crown className="w-3.5 h-3.5 inline mr-1" />}
                      {plan}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!selectedUser ? (
              <Input 
                label="Senha Inicial" 
                type="password"
                placeholder="Mínimo 6 caracteres" 
                value={formPassword} 
                onChange={(e) => setFormPassword(e.target.value)} 
              />
            ) : null}

            <div className="flex gap-2 pt-4">
              <Button variant="primary" className="flex-1" onClick={() => setIsUserModalOpen(false)}>Cancelar</Button>
              <Button variant="primary" className="flex-1" onClick={handleSaveUser} disabled={isSaving}>
                {isSaving ? 'Salvando...' : selectedUser ? "Salvar Alterações" : "Criar Usuário"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Password Reset Type Selection Modal */}
        <Modal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          title="Redefinir Senha"
          size="sm"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResetType('random')}
                className={clsx(
                  "p-3 rounded-xl border-2 transition-all text-sm font-bold",
                  resetType === 'random' 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-transparent bg-premium-darkGray/50 text-gray-500"
                )}
              >
                🔢 Aleatória
              </button>
              <button
                type="button"
                onClick={() => setResetType('manual')}
                className={clsx(
                  "p-3 rounded-xl border-2 transition-all text-sm font-bold",
                  resetType === 'manual' 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-transparent bg-premium-darkGray/50 text-gray-500"
                )}
              >
                ⌨️ Manual
              </button>
            </div>

            {resetType === 'manual' && (
              <Input
                label="Nova Senha"
                type="text"
                placeholder="Mínimo 6 caracteres"
                value={manualPassword}
                onChange={(e) => setManualPassword(e.target.value)}
                autoFocus
              />
            )}

            <div className="flex gap-2 pt-2">
              <Button 
                variant="secondary" 
                className="flex-1" 
                onClick={() => setIsResetModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                className="flex-1" 
                onClick={handleResetPassword}
                isLoading={isResettingPassword}
              >
                Redefinir
              </Button>
            </div>
          </div>
        </Modal>

        {/* Password Reset Modal */}
        {generatedPassword && (
          <Modal
            isOpen={!!generatedPassword}
            onClose={() => setGeneratedPassword(null)}
            title="Senha Redefinida"
            size="md"
          >
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-2xl">
                <p className="text-sm text-primary font-medium mb-2">
                  Nova senha gerada com sucesso!
                </p>
                <p className="text-xs text-neutral mb-3">
                  Copie e envie esta senha ao usuário via WhatsApp ou outro meio.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-lg font-mono text-white bg-premium-black p-3 rounded-lg text-center select-all">
                    {generatedPassword.password}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(generatedPassword.password)
                          .then(() => toast.success('Copiado para a área de transferência!'))
                          .catch(() => toast.error('Erro ao copiar'));
                      } else {
                        // Fallback para ambientes onde navigator.clipboard pode não estar disponível (ex: HTTP)
                        const textArea = document.createElement("textarea");
                        textArea.value = generatedPassword.password;
                        document.body.appendChild(textArea);
                        textArea.select();
                        try {
                          document.execCommand('copy');
                          toast.success('Copiado (fallback)!');
                        } catch (err) {
                          toast.error('Erro ao copiar');
                        }
                        document.body.removeChild(textArea);
                      }
                    }}
                    className="p-3 bg-primary/20 rounded-lg text-primary hover:bg-primary/30 transition-all"
                    title="Copiar"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-neutral">
                <p><strong>Email:</strong> {generatedPassword.email}</p>
                <p><strong>Nome:</strong> {generatedPassword.name}</p>
              </div>
              <Button variant="primary" className="w-full" onClick={() => setGeneratedPassword(null)}>
                Fechar
              </Button>
            </div>
          </Modal>
        )}

        <ConfirmModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Confirmar Exclusão"
          message="Esta ação é irreversível e removerá todos os dados financeiros associados a este usuário."
          confirmText="Sim, Excluir Definitivamente"
          variant="danger"
        />
      </div>
    </MainLayout>
  );
}