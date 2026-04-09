// User types
export type UserStatus = 'ativo' | 'inativo' | 'bloqueado' | 'pendente' | 'problema_financeiro';
export type UserRole = 'admin' | 'user';
export type DriverType = 'particular' | 'app' | 'taxi';

export interface User {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  tipo: string | DriverType[]; // Can be a string like "app,taxi" or array
  role: UserRole;
  status: UserStatus;
  veiculo?: string;
  placa?: string;
  foto_url?: string;
  google_id?: string;
  criado_em: string;
  atualizado_em?: string;
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
  usuario_id: number;
  tipo: EarningsType;
  valor: number;
  descricao?: string;
  data: string;
  criado_em: string;
}

// Expenses types
export type ExpenseType = 'abastecimento' | 'manutencao' | 'lavagem' | 'pedagio' | 'alimentacao' | 'aluguel' | 'parcela';

export interface Expense {
  id: number;
  usuario_id: number;
  tipo: ExpenseType;
  valor: number;
  descricao?: string;
  data: string;
  criado_em: string;
}

// KM Registry types
export interface KmRegistry {
  id: number;
  usuario_id: number;
  veiculo_id: number | null;
  km_inicial: number | null;
  km_final: number | null;
  km_total: number | null;
  data: string;
  criado_em: string;
}

export interface Veiculo {
  id: number;
  usuario_id: number;
  modelo: string;
  placa: string;
  km_atual: number;
  tipo: string;
  criado_em: string;
}

// Maintenance types
export type MaintenanceType = 'oleo' | 'pneus' | 'freios' | 'revisao' | 'documentacao' | 'seguro';
export type MaintenanceStatus = 'pendente' | 'urgente' | 'atrasado' | 'concluido';

export interface Maintenance {
  id: number;
  usuario_id: number;
  tipo: MaintenanceType;
  km_limite?: number;
  data_limite?: string;
  status: MaintenanceStatus;
  obs?: string;
  criado_em: string;
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
  id: number;
  usuario_id: number; // Admin who did the action
  usuario_nome: string;
  acao: string;
  descricao: string;
  data: string;
}

export interface TopDriver {
  id: number;
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
  email: string;
  password: string;
}

export interface RegisterFormData {
  nome: string;
  email: string;
  telefone: string;
  tipo: DriverType;
  veiculo?: string;
  placa?: string;
}
