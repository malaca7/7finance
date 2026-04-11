import { useEffect, useState } from 'react';
import {
  Crown, Star, Sparkles, Edit2, Save, Users, Search, Filter,
  TrendingUp, DollarSign, Check, X, ChevronDown, RefreshCw
} from 'lucide-react';
import { Card, CardHeader, Button, Input, Modal } from '../components/ui';
import { MainLayout } from '../components/layout/MainLayout';
import { supabase } from '../api/supabase';
import { createAdminClient } from '../api/supabase';
import type { Plan, PlanType, PlanStatus, PlanPeriod } from '../types';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface UserPlanRow {
  id: string;
  user_id: string;
  plano_id: string;
  status: PlanStatus;
  periodo: PlanPeriod;
  inicio_em?: string;
  fim_em?: string;
  created_at?: string;
  users?: { id: string; name?: string; email?: string; phone?: string };
  planos?: { id: string; nome: PlanType; nome_display: string; preco: number };
}

const statusColors: Record<string, string> = {
  ativo: 'bg-primary/20 text-primary',
  cancelado: 'bg-negative/20 text-negative',
  trial: 'bg-blue-500/20 text-blue-400',
  expirado: 'bg-neutral/20 text-neutral',
  pendente: 'bg-yellow-500/20 text-yellow-400',
};

const planIcons: Record<string, React.ElementType> = {
  free: Star,
  pro: Sparkles,
  premium: Crown,
};

const planColors: Record<string, string> = {
  free: 'text-neutral',
  pro: 'text-blue-400',
  premium: 'text-amber-400',
};

export function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userPlans, setUserPlans] = useState<UserPlanRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Edit plan modal
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editPreco, setEditPreco] = useState('');
  const [editPrecoAnual, setEditPrecoAnual] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  // Change user plan modal
  const [changingUser, setChangingUser] = useState<UserPlanRow | null>(null);
  const [newPlanId, setNewPlanId] = useState('');
  const [newStatus, setNewStatus] = useState<PlanStatus>('ativo');
  const [newPeriodo, setNewPeriodo] = useState<PlanPeriod>('mensal');
  const [isSavingUserPlan, setIsSavingUserPlan] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const admin = await createAdminClient();

      const [plansRes, userPlansRes] = await Promise.all([
        admin.from('planos').select('*').order('ordem', { ascending: true }),
        admin.from('user_planos').select('*, users(id, name, email, phone), planos(id, nome, nome_display, preco)').order('created_at', { ascending: false }),
      ]);

      if (plansRes.data) setPlans(plansRes.data);
      if (userPlansRes.data) {
        // Deduplica: mantém apenas o registro mais recente de cada user_id
        const latestByUser = new Map<string, UserPlanRow>();
        for (const up of userPlansRes.data) {
          const existing = latestByUser.get(up.user_id);
          if (!existing || new Date(up.created_at || 0) > new Date(existing.created_at || 0)) {
            latestByUser.set(up.user_id, up);
          }
        }
        setUserPlans(Array.from(latestByUser.values()));
      }
    } catch (error) {
      console.error('Error loading admin plans data:', error);
      toast.error('Erro ao carregar dados de planos');
    } finally {
      setIsLoading(false);
    }
  };

  // === Stats ===
  const totalSubscribers = userPlans.filter(up => up.status === 'ativo').length;
  const proUsers = userPlans.filter(up => up.planos?.nome === 'pro' && up.status === 'ativo').length;
  const premiumUsers = userPlans.filter(up => up.planos?.nome === 'premium' && up.status === 'ativo').length;
  const estimatedMRR = userPlans
    .filter(up => up.status === 'ativo' && up.planos?.preco)
    .reduce((sum, up) => sum + (up.planos?.preco || 0), 0);

  // === Filtering ===
  const filteredUserPlans = userPlans.filter(up => {
    const userName = up.users?.name || '';
    const userEmail = up.users?.email || '';
    const matchesSearch = searchTerm === '' ||
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlan = filterPlan === 'all' || up.planos?.nome === filterPlan;
    const matchesStatus = filterStatus === 'all' || up.status === filterStatus;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  // === Edit Plan ===
  const openEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setEditPreco(plan.preco.toString());
    setEditPrecoAnual(plan.preco_anual?.toString() || '');
    setEditDescricao(plan.descricao || '');
    setEditIsActive(plan.is_active);
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    setIsSavingPlan(true);
    try {
      const admin = await createAdminClient();
      const { error } = await admin.from('planos').update({
        preco: parseFloat(editPreco),
        preco_anual: editPrecoAnual ? parseFloat(editPrecoAnual) : null,
        descricao: editDescricao,
        is_active: editIsActive,
      }).eq('id', editingPlan.id);

      if (error) throw error;

      toast.success(`Plano ${editingPlan.nome_display} atualizado!`);
      setEditingPlan(null);
      loadData();
    } catch (error: any) {
      toast.error('Erro ao salvar plano: ' + (error.message || ''));
    } finally {
      setIsSavingPlan(false);
    }
  };

  // === Change User Plan ===
  const openChangeUserPlan = (userPlan: UserPlanRow) => {
    setChangingUser(userPlan);
    setNewPlanId(userPlan.plano_id);
    setNewStatus(userPlan.status);
    setNewPeriodo(userPlan.periodo || 'mensal');
  };

  const handleSaveUserPlan = async () => {
    if (!changingUser) return;
    setIsSavingUserPlan(true);
    try {
      const admin = await createAdminClient();
      const { error } = await admin.from('user_planos').update({
        plano_id: newPlanId,
        status: newStatus,
        periodo: newPeriodo,
      }).eq('id', changingUser.id);

      if (error) throw error;

      toast.success('Plano do usuário atualizado!');
      setChangingUser(null);
      loadData();
    } catch (error: any) {
      toast.error('Erro ao atualizar: ' + (error.message || ''));
    } finally {
      setIsSavingUserPlan(false);
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  return (
    <MainLayout>
      <div className="space-y-6 pb-24 md:pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Gerenciar Planos</h1>
            <p className="text-neutral mt-1">Planos, preços e assinaturas dos usuários</p>
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
              <div className="p-3 bg-primary/20 rounded-2xl">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-neutral">Assinantes Ativos</p>
                <p className="text-xl font-bold text-white">{totalSubscribers}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-2xl">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-neutral">Usuários Pro</p>
                <p className="text-xl font-bold text-white">{proUsers}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 rounded-2xl">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-neutral">Usuários Premium</p>
                <p className="text-xl font-bold text-white">{premiumUsers}</p>
              </div>
            </div>
          </Card>

          <Card variant="highlight">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-2xl">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-neutral">MRR Estimado</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(estimatedMRR)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Plans Management */}
        <Card>
          <CardHeader title="Planos Disponíveis" subtitle="Edite preços e status dos planos" />
          
          {isLoading ? (
            <div className="text-center py-8 text-neutral">Carregando...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {plans.map(plan => {
                const Icon = planIcons[plan.nome] || Star;
                return (
                  <div
                    key={plan.id}
                    className={clsx(
                      'relative p-5 rounded-2xl border transition-all',
                      plan.nome === 'free' && 'bg-white/[0.02] border-white/10',
                      plan.nome === 'pro' && 'bg-blue-500/[0.03] border-blue-500/20',
                      plan.nome === 'premium' && 'bg-amber-500/[0.03] border-amber-500/20',
                      !plan.is_active && 'opacity-50',
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <Icon className={clsx('w-5 h-5', planColors[plan.nome])} />
                        <span className="text-white font-bold text-lg">{plan.nome_display}</span>
                      </div>
                      <button
                        onClick={() => openEditPlan(plan)}
                        className="p-2 text-neutral hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white">
                          {formatCurrency(plan.preco)}
                        </span>
                        <span className="text-xs text-neutral">/mês</span>
                      </div>
                      {plan.preco_anual && (
                        <p className="text-xs text-neutral">
                          Anual: {formatCurrency(plan.preco_anual)}/ano
                        </p>
                      )}
                      <p className="text-xs text-neutral/70 line-clamp-2">{plan.descricao}</p>

                      <div className="flex items-center gap-2 pt-1">
                        <span className={clsx(
                          'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                          plan.is_active ? 'bg-primary/20 text-primary' : 'bg-negative/20 text-negative',
                        )}>
                          {plan.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                        <span className="text-[10px] text-neutral">
                          Ordem: {plan.ordem}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* User Plans */}
        <Card>
          <CardHeader
            title="Assinaturas dos Usuários"
            subtitle={`${filteredUserPlans.length} de ${userPlans.length} assinaturas`}
          />

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-premium-darkGray border border-white/10 rounded-xl text-sm text-white placeholder-neutral focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <select
              value={filterPlan}
              onChange={e => setFilterPlan(e.target.value)}
              className="bg-premium-darkGray border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary transition-all"
            >
              <option value="all">Todos os Planos</option>
              {plans.map(p => (
                <option key={p.id} value={p.nome}>{p.nome_display}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-premium-darkGray border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary transition-all"
            >
              <option value="all">Todos os Status</option>
              <option value="ativo">Ativo</option>
              <option value="cancelado">Cancelado</option>
              <option value="trial">Trial</option>
              <option value="expirado">Expirado</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>

          {/* Table / List */}
          {isLoading ? (
            <div className="text-center py-8 text-neutral">Carregando...</div>
          ) : filteredUserPlans.length === 0 ? (
            <div className="text-center py-8 text-neutral">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Nenhuma assinatura encontrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUserPlans.map(up => {
                const userName = up.users?.name || 'Sem nome';
                const userEmail = up.users?.email || up.users?.phone || '';
                const planName = up.planos?.nome || 'free';
                const Icon = planIcons[planName] || Star;

                return (
                  <div
                    key={up.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-premium-darkGray/50 rounded-2xl hover:bg-white/[0.03] transition-all gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={clsx(
                        'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                        planName === 'free' && 'bg-white/5',
                        planName === 'pro' && 'bg-blue-500/15',
                        planName === 'premium' && 'bg-amber-500/15',
                      )}>
                        <Icon className={clsx('w-5 h-5', planColors[planName])} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{userName}</p>
                        <p className="text-xs text-neutral truncate">{userEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                      <span className={clsx(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase',
                        planName === 'free' && 'bg-white/5 text-neutral',
                        planName === 'pro' && 'bg-blue-500/15 text-blue-400',
                        planName === 'premium' && 'bg-amber-500/15 text-amber-400',
                      )}>
                        {up.planos?.nome_display || 'Free'}
                      </span>

                      <span className={clsx(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                        statusColors[up.status] || 'bg-neutral/20 text-neutral',
                      )}>
                        {up.status}
                      </span>

                      <span className="text-xs text-neutral">
                        {up.periodo || 'mensal'}
                      </span>

                      <span className="text-xs text-neutral hidden sm:block">
                        {formatDate(up.inicio_em)}
                      </span>

                      <button
                        onClick={() => openChangeUserPlan(up)}
                        className="p-2 text-neutral hover:text-primary hover:bg-primary/10 rounded-xl transition-all ml-auto sm:ml-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Edit Plan Modal */}
      <Modal
        isOpen={!!editingPlan}
        onClose={() => setEditingPlan(null)}
        title={`Editar Plano: ${editingPlan?.nome_display || ''}`}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Preço Mensal (R$)"
            type="number"
            step="0.01"
            min="0"
            value={editPreco}
            onChange={e => setEditPreco(e.target.value)}
          />
          <Input
            label="Preço Anual (R$)"
            type="number"
            step="0.01"
            min="0"
            value={editPrecoAnual}
            onChange={e => setEditPrecoAnual(e.target.value)}
            placeholder="Deixe vazio se não tiver"
          />
          <Input
            label="Descrição"
            type="text"
            value={editDescricao}
            onChange={e => setEditDescricao(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-neutral">Status:</label>
            <button
              onClick={() => setEditIsActive(!editIsActive)}
              className={clsx(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                editIsActive
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-negative/20 text-negative border border-negative/30',
              )}
            >
              {editIsActive ? 'Ativo' : 'Inativo'}
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setEditingPlan(null)}>
              Cancelar
            </Button>
            <Button className="flex-1 font-bold" onClick={handleSavePlan} isLoading={isSavingPlan}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change User Plan Modal */}
      <Modal
        isOpen={!!changingUser}
        onClose={() => setChangingUser(null)}
        title={`Alterar Plano: ${changingUser?.users?.name || ''}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Plano</label>
            <select
              value={newPlanId}
              onChange={e => setNewPlanId(e.target.value)}
              className="w-full bg-premium-darkGray border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            >
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.nome_display} — {formatCurrency(p.preco)}/mês</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value as PlanStatus)}
              className="w-full bg-premium-darkGray border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="ativo">Ativo</option>
              <option value="cancelado">Cancelado</option>
              <option value="trial">Trial</option>
              <option value="expirado">Expirado</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Período</label>
            <select
              value={newPeriodo}
              onChange={e => setNewPeriodo(e.target.value as PlanPeriod)}
              className="w-full bg-premium-darkGray border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="mensal">Mensal</option>
              <option value="anual">Anual</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setChangingUser(null)}>
              Cancelar
            </Button>
            <Button className="flex-1 font-bold" onClick={handleSaveUserPlan} isLoading={isSavingUserPlan}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
