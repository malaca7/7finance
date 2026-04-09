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
