// User types
export type UserStatus = 'ativo' | 'inativo' | 'bloqueado' | 'pendente' | 'problema_financeiro';
export type UserRole = 'admin' | 'user' | 'manager' | 'barber' | 'customer' | 'usuario';
export type DriverType = 'particular' | 'app' | 'taxi';

// Interface User sincronizada com banco Supabase (public.users)
// DB columns: id(uuid), auth_id(uuid), tenant_id(uuid), phone(text), name(text),
//             email(text), role(text), avatar_url(text), is_active(boolean),
//             created_at(timestamptz), updated_at(timestamptz)
export interface User {
  id: string;
  auth_id?: string | null;
  tenant_id?: string | null;
  phone?: string | null;
  name?: string | null;
  email?: string | null;
  role: string;
  avatar_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  // Aliases de compatibilidade (preenchidos pelo adaptador adaptUser)
  nome?: string;
  telefone?: string;
  foto_url?: string;
  status?: string;
  veiculo?: string;
  placa?: string;
  tipo?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Earnings types
export type EarningsType = 'corrida' | 'gorjeta' | 'dinheiro';

export interface Earnings {
  id: number;
  usuario_id?: string;
  tipo: EarningsType;
  valor: number;
  descricao?: string;
  data: string;
  created_at?: string;
}

// Expenses types
export type ExpenseType = 'abastecimento' | 'manutencao' | 'lavagem' | 'pedagio' | 'alimentacao' | 'aluguel' | 'parcela';

export interface Expense {
  id: number;
  usuario_id?: string;
  tipo: ExpenseType;
  valor: number;
  descricao?: string;
  data: string;
  created_at?: string;
}

// KM Registry types
export interface KmRegistry {
  id: number;
  usuario_id?: string;
  veiculo_id?: number | null;
  km_inicial: number;
  km_final?: number | null;
  data: string;
  observacao?: string;
  created_at?: string;
  // Join data from veiculos table
  veiculos?: { id: number; modelo: string; placa?: string } | null;
}

export interface Veiculo {
  id: number;
  usuario_id?: string;
  modelo: string;
  placa?: string;
  cor?: string;
  ano?: number;
  status?: string;
  created_at?: string;
}

// Maintenance types
export type MaintenanceType = 'oleo' | 'pneus' | 'freios' | 'revisao' | 'documentacao' | 'seguro';
export type MaintenanceStatus = 'pendente' | 'urgente' | 'atrasado' | 'concluido';

export interface Maintenance {
  id: number;
  usuario_id?: string;
  veiculo_id?: number | null;
  descricao: string;
  valor: number;
  km_registro?: number;
  data: string;
  proxima_manutencao_km?: number;
  status: MaintenanceStatus;
  created_at?: string;
  // Join data from veiculos table
  veiculos?: { id: number; modelo: string; placa?: string } | null;
}

// Dashboard summary types
export interface DashboardSummary {
  totalGanhos: number;
  totalDespesas: number;
  lucroLiquido: number;
  kmRodados: number;
  ganhosPorTipo: Record<EarningsType, number>;
  despesasPorTipo: Record<ExpenseType, number>;
}

// Filter types
export type DateFilter = 'diario' | 'semanal' | 'mensal' | 'personalizado';

export interface AdminStats {
  totalUsuarios: number;
  usuariosAtivos: number;
  novosUsuarios7Dias: number;
  totalGanhosGlobal: number;
  totalDespesasGlobal: number;
  lucroMedioPorMotorista: number;
  receitaPlataforma: number;
  ticketMedioPorCorrida: number;
  percentualBaixoLucro: number;
  usuariosInativos: number;
}

export interface SmartAlert {
  id: string;
  tipo: 'info' | 'warning' | 'error' | 'critical';
  usuario_id?: number;
  usuario_nome?: string;
  mensagem: string;
  data: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  tenant_id?: string;
  action: string;
  entity: string;
  entity_id?: string;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  admin_name?: string; // Preenchido via RPC admin_get_logs
}

export interface TopDriver {
  id: string;
  nome: string;
  email: string;
  ganhoTotal: number;
  lucroLiquido: number;
}

export interface AdminDashboardData {
  stats: AdminStats;
  alerts: SmartAlert[];
  topDrivers: TopDriver[];
  graficoCrescimento: { data: string; usuarios: number; receita: number }[];
  distribuicaoDespesas: { name: string; value: number }[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Form types
export interface LoginFormData {
  telefone: string;
  password: string;
}

export interface RegisterFormData {
  nome: string;
  email: string;
  telefone: string;
  tipo: DriverType;
  password: string;
}

// ============== METAS FINANCEIRAS ==============
export interface Goal {
  id: number;
  usuario_id?: string;
  valor_meta: number;
  mes_ano: string; // formato: YYYY-MM
  valor_atual: number;
  created_at?: string;
}

export interface GoalProgress {
  percentual: number;
  falta: number;
  mediaDiaria: number;
  diasRestantes: number;
  nivel: 'iniciante' | 'bronze' | 'prata' | 'ouro' | 'diamante';
  pontos: number;
}

// ============== INSIGHTS INTELIGENTES ==============
export interface Insight {
  id: string;
  tipo: 'positivo' | 'negativo' | 'neutro';
  categoria: 'gastos' | 'lucro' | 'produtividade' | 'manutencao';
  titulo: string;
  descricao: string;
  valor?: number;
  prioridade: 'alta' | 'media' | 'baixa';
  created_at?: string;
}

// ============== PRECIFICAÇÃO INTELIGENTE ==============
export interface PricingAnalysis {
  custoPorKm: number;
  lucroPorKm: number;
  mediaValorCorrida: number;
  KMmediaCorrida: number;
  totalCorridasLucro: number;
  totalCorridasPrejuizo: number;
  valorIdealPorKm: number;
  alertasPrejuizo: {
    tipo: string;
    valor: number;
    data: string;
  }[];
}

// ============== PLANOS E ASSINATURAS ==============
export type PlanType = 'free' | 'pro' | 'premium';
export type PlanStatus = 'ativo' | 'cancelado' | 'trial' | 'expirado' | 'pendente';
export type PlanPeriod = 'mensal' | 'anual';

export interface Plan {
  id: string;
  nome: PlanType;
  nome_display: string;
  descricao?: string;
  preco: number;
  preco_anual?: number;
  stripe_price_id?: string;
  stripe_price_id_anual?: string;
  features: PlanFeatureItem[];
  is_active: boolean;
  ordem: number;
  created_at?: string;
}

export interface PlanFeatureItem {
  key: string;
  label: string;
}

export interface UserPlan {
  id: string;
  user_id: string;
  plano_id: string;
  status: PlanStatus;
  periodo: PlanPeriod;
  inicio_em?: string;
  fim_em?: string;
  trial_fim_em?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  cancelado_em?: string;
  motivo_cancelamento?: string;
  created_at?: string;
  // Join
  planos?: Plan;
}

export interface UserActivePlan {
  subscription_id: string | null;
  plano_id: string;
  plano_nome: PlanType;
  plano_display: string;
  preco: number;
  preco_anual?: number;
  status: PlanStatus | 'sem_plano';
  periodo?: PlanPeriod;
  inicio_em?: string;
  fim_em?: string;
  features: PlanFeatureItem[];
}

export interface PlanFeature {
  id: string;
  feature_key: string;
  nome: string;
  descricao?: string;
  plano_minimo: PlanType;
}

export interface PlanChangeResult {
  success: boolean;
  subscription_id?: string;
  change_type?: 'upgrade' | 'downgrade' | 'cancelamento' | 'reativacao' | 'trial';
  old_plan?: string;
  new_plan?: string;
  error?: string;
}

// Hierarquia de planos (para comparação)
export const PLAN_HIERARCHY: Record<PlanType, number> = {
  free: 0,
  pro: 1,
  premium: 2,
};

// ============== ALERTAS DO SISTEMA ==============
export interface SystemAlert {
  id: string;
  tipo: 'manutencao' | 'km' | 'despesa' | 'lucro' | 'geral';
  prioridade: 'verde' | 'amarelo' | 'vermelho';
  titulo: string;
  mensagem: string;
  acao?: string;
  created_at?: string;
}
