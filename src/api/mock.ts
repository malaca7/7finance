import type { 
  User, Earnings, Expense, KmRegistry, Maintenance, ApiResponse, 
  DashboardSummary, EarningsType, ExpenseType, DateFilter, 
  DriverType, MaintenanceType, AuditLog, SmartAlert, 
  TopDriver, AdminDashboardData 
} from '../types';

// Mock API - Uses localStorage to simulate database
// Replace with real API calls when backend is connected

const STORAGE_KEYS = {
  USERS: 'malaca_users',
  EARNINGS: 'malaca_earnings',
  EXPENSES: 'malaca_expenses',
  KM: 'malaca_km',
  MAINTENANCES: 'malaca_maintenances',
  LOGS: 'malaca_logs',
};

// Helper to get data from localStorage
function getStorageData<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

// Helper to save data to localStorage
function setStorageData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Helper to generate IDs
function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

// Helper to get current user ID
function getCurrentUserId(): number | null {
  const userStr = localStorage.getItem('malaca_user');
  if (!userStr) return null;
  const user = JSON.parse(userStr);
  return user.id;
}

// Get token from localStorage
function getToken(): string | null {
  return localStorage.getItem('malaca_token');
}

// Helper to filter data by date
function filterByDate<T extends { data: string }>(data: T[], filter?: DateFilter): T[] {
  if (!filter || filter === 'personalizado') return data;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Start of week (Sunday)
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  
  // Start of month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return data.filter(item => {
    const itemDate = new Date(item.data);
    if (isNaN(itemDate.getTime())) return false; // Invalid date

    switch (filter) {
      case 'diario':
        return itemDate >= startOfDay;
      case 'semanal':
        return itemDate >= startOfWeek;
      case 'mensal':
        return itemDate >= startOfMonth;
      default:
        return true;
    }
  });
}

// Initialize demo data
function initializeDemoData() {
  const users = getStorageData<User>(STORAGE_KEYS.USERS);
  if (users.length === 0) {
    // Create demo admin user
    const adminUser: User = {
      id: 1,
      nome: 'malaca',
      email: 'malaca@malaca.com.br',
      telefone: '81996138924',
      tipo: 'particular',
      role: 'admin',
      status: 'ativo',
      veiculo: 'Fiat Cronos',
      placa: 'ABC-1234',
      google_id: 'admin-google-id',
      criado_em: new Date().toISOString(),
    };
    
    const demoUser: User = {
      id: 2,
      nome: 'João Motorista',
      email: 'joao@motorista.com',
      telefone: '(11) 98888-7777',
      tipo: 'app',
      role: 'user',
      status: 'ativo',
      veiculo: 'Renault Kwid',
      placa: 'XYZ-9876',
      criado_em: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    setStorageData(STORAGE_KEYS.USERS, [adminUser, demoUser]);
    
    // Add some demo earnings and expenses for stats
    const demoEarnings: Earnings[] = [
      { id: 101, usuario_id: 2, tipo: 'corrida', valor: 250, data: new Date().toISOString().split('T')[0], criado_em: new Date().toISOString() },
      { id: 102, usuario_id: 2, tipo: 'corrida', valor: 180, data: new Date(Date.now() - 86400000).toISOString().split('T')[0], criado_em: new Date().toISOString() },
    ];
    setStorageData(STORAGE_KEYS.EARNINGS, demoEarnings);

    const demoExpenses: Expense[] = [
      { id: 201, usuario_id: 2, tipo: 'abastecimento', valor: 100, data: new Date().toISOString().split('T')[0], criado_em: new Date().toISOString() },
    ];
    setStorageData(STORAGE_KEYS.EXPENSES, demoExpenses);
    
    localStorage.setItem('malaca_user', JSON.stringify(adminUser));
    localStorage.setItem('malaca_token', 'demo-admin-token');
  }
}

// Initialize on import
initializeDemoData();

// Auth API - Mock
export const authApi = {
  async login(email: string, _password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const users = getStorageData<User>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return { success: false, error: 'Usuário não encontrado' };
    }
    
    const token = `token_${user.id}_${Date.now()}`;
    localStorage.setItem('malaca_user', JSON.stringify(user));
    localStorage.setItem('malaca_token', token);
    
    return { success: true, data: { user, token } };
  },

  async register(data: {
    nome: string;
    email: string;
    telefone: string;
    tipo: DriverType;
    password: string;
    veiculo?: string;
    placa?: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    const users = getStorageData<User>(STORAGE_KEYS.USERS);
    
    // Check if email exists
    if (users.find(u => u.email === data.email)) {
      return { success: false, error: 'Email já cadastrado' };
    }
    
    const newUser: User = {
      id: generateId(),
      nome: data.nome,
      email: data.email,
      telefone: data.telefone,
      tipo: data.tipo,
      role: 'user',
      status: 'ativo',
      veiculo: data.veiculo,
      placa: data.placa,
      criado_em: new Date().toISOString(),
    };
    
    users.push(newUser);
    setStorageData(STORAGE_KEYS.USERS, users);
    
    const token = `token_${newUser.id}_${Date.now()}`;
    localStorage.setItem('malaca_user', JSON.stringify(newUser));
    localStorage.setItem('malaca_token', token);
    
    return { success: true, data: { user: newUser, token } };
  },

  async googleAuth(_googleToken: string): Promise<ApiResponse<{ user: User; token: string }>> {
    // Simulate Google OAuth - in production, verify with Google
    const users = getStorageData<User>(STORAGE_KEYS.USERS);
    
    // For demo, use first user or create new
    let user = users[0];
    if (!user) {
      user = {
        id: generateId(),
        nome: 'Usuário Google',
        email: 'user@gmail.com',
        telefone: '',
        tipo: 'app',
        role: 'user',
        status: 'ativo',
        google_id: 'google-123',
        criado_em: new Date().toISOString(),
      };
      users.push(user);
      setStorageData(STORAGE_KEYS.USERS, users);
    }
    
    const token = `token_${user.id}_${Date.now()}`;
    localStorage.setItem('malaca_user', JSON.stringify(user));
    localStorage.setItem('malaca_token', token);
    
    return { success: true, data: { user, token } };
  },

  async getMe(): Promise<ApiResponse<User>> {
    const userStr = localStorage.getItem('malaca_user');
    if (!userStr) {
      return { success: false, error: 'Não autenticado' };
    }
    
    const user = JSON.parse(userStr);
    return { success: true, data: user };
  },
};

// Users API - Mock
export const usersApi = {
  async getAll(): Promise<ApiResponse<User[]>> {
    try {
      const userId = getCurrentUserId();
      if (!userId) return { success: false, error: 'Não autenticado' };
      
      const admin = JSON.parse(localStorage.getItem('malaca_user') || '{}');
      if (admin.role !== 'admin') {
        return { success: false, error: 'Acesso negado. Apenas administradores podem listar usuários.' };
      }

      const users = getStorageData<User>(STORAGE_KEYS.USERS);
      return { success: true, data: users };
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return { success: false, error: 'Erro ao carregar usuários' };
    }
  },

  async getById(id: number): Promise<ApiResponse<User>> {
    const users = getStorageData<User>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.id === id);
    
    if (!user) {
      return { success: false, error: 'Usuário não encontrado' };
    }
    
    return { success: true, data: user };
  },

  async update(id: number, data: Partial<User>): Promise<ApiResponse<User>> {
    const users = getStorageData<User>(STORAGE_KEYS.USERS);
    const index = users.findIndex(u => u.id === id);
    
    if (index === -1) {
      return { success: false, error: 'Usuário não encontrado' };
    }
    
    users[index] = { ...users[index], ...data, atualizado_em: new Date().toISOString() };
    setStorageData(STORAGE_KEYS.USERS, users);
    
    return { success: true, data: users[index] };
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    let users = getStorageData<User>(STORAGE_KEYS.USERS);
    users = users.filter(u => u.id !== id);
    setStorageData(STORAGE_KEYS.USERS, users);
    
    return { success: true };
  },
};

// Earnings API - Mock
export const earningsApi = {
  async getAll(filter?: DateFilter): Promise<ApiResponse<Earnings[]>> {
    try {
      const userId = getCurrentUserId();
      if (!userId) return { success: false, error: 'Não autenticado' };
      
      let allEarnings = getStorageData<Earnings>(STORAGE_KEYS.EARNINGS);
      let userEarnings = allEarnings.filter(e => e.usuario_id === userId);
      
      // Apply date filtering
      userEarnings = filterByDate(userEarnings, filter);
      
      // Sort by date descending
      userEarnings.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      
      return { success: true, data: userEarnings };
    } catch (error) {
      console.error('Erro ao listar ganhos:', error);
      return { success: false, error: 'Erro ao carregar histórico de ganhos' };
    }
  },

  async create(data: {
    tipo: EarningsType;
    valor: number;
    descricao?: string;
    data: string;
  }): Promise<ApiResponse<Earnings>> {
    const userId = getCurrentUserId();
    if (!userId) return { success: false, error: 'Não autenticado' };
    
    const newEarning: Earnings = {
      id: generateId(),
      usuario_id: userId,
      tipo: data.tipo,
      valor: data.valor,
      descricao: data.descricao,
      data: data.data,
      criado_em: new Date().toISOString(),
    };
    
    const allEarnings = getStorageData<Earnings>(STORAGE_KEYS.EARNINGS);
    allEarnings.push(newEarning);
    setStorageData(STORAGE_KEYS.EARNINGS, allEarnings);
    
    return { success: true, data: newEarning };
  },

  async update(id: number, data: Partial<Earnings>): Promise<ApiResponse<Earnings>> {
    const allEarnings = getStorageData<Earnings>(STORAGE_KEYS.EARNINGS);
    const index = allEarnings.findIndex(e => e.id === id);
    
    if (index === -1) {
      return { success: false, error: 'Ganho não encontrado' };
    }
    
    allEarnings[index] = { ...allEarnings[index], ...data };
    setStorageData(STORAGE_KEYS.EARNINGS, allEarnings);
    
    return { success: true, data: allEarnings[index] };
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    let allEarnings = getStorageData<Earnings>(STORAGE_KEYS.EARNINGS);
    allEarnings = allEarnings.filter(e => e.id !== id);
    setStorageData(STORAGE_KEYS.EARNINGS, allEarnings);
    
    return { success: true };
  },
};

// Expenses API - Mock
export const expensesApi = {
  async getAll(filter?: DateFilter): Promise<ApiResponse<Expense[]>> {
    try {
      const userId = getCurrentUserId();
      if (!userId) return { success: false, error: 'Não autenticado' };
      
      let allExpenses = getStorageData<Expense>(STORAGE_KEYS.EXPENSES);
      let userExpenses = allExpenses.filter(e => e.usuario_id === userId);
      
      // Apply date filtering
      userExpenses = filterByDate(userExpenses, filter);
      
      // Sort by date descending
      userExpenses.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      
      return { success: true, data: userExpenses };
    } catch (error) {
      console.error('Erro ao listar despesas:', error);
      return { success: false, error: 'Erro ao carregar histórico de despesas' };
    }
  },

  async create(data: {
    tipo: ExpenseType;
    valor: number;
    descricao?: string;
    data: string;
  }): Promise<ApiResponse<Expense>> {
    const userId = getCurrentUserId();
    if (!userId) return { success: false, error: 'Não autenticado' };
    
    const newExpense: Expense = {
      id: generateId(),
      usuario_id: userId,
      tipo: data.tipo,
      valor: data.valor,
      descricao: data.descricao,
      data: data.data,
      criado_em: new Date().toISOString(),
    };
    
    const allExpenses = getStorageData<Expense>(STORAGE_KEYS.EXPENSES);
    allExpenses.push(newExpense);
    setStorageData(STORAGE_KEYS.EXPENSES, allExpenses);
    
    return { success: true, data: newExpense };
  },

  async update(id: number, data: Partial<Expense>): Promise<ApiResponse<Expense>> {
    const allExpenses = getStorageData<Expense>(STORAGE_KEYS.EXPENSES);
    const index = allExpenses.findIndex(e => e.id === id);
    
    if (index === -1) {
      return { success: false, error: 'Despesa não encontrada' };
    }
    
    allExpenses[index] = { ...allExpenses[index], ...data };
    setStorageData(STORAGE_KEYS.EXPENSES, allExpenses);
    
    return { success: true, data: allExpenses[index] };
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    let allExpenses = getStorageData<Expense>(STORAGE_KEYS.EXPENSES);
    allExpenses = allExpenses.filter(e => e.id !== id);
    setStorageData(STORAGE_KEYS.EXPENSES, allExpenses);
    
    return { success: true };
  },
};

// KM Registry API - Mock
export const kmApi = {
  async getAll(filter?: DateFilter): Promise<ApiResponse<KmRegistry[]>> {
    try {
      const userId = getCurrentUserId();
      if (!userId) return { success: false, error: 'Não autenticado' };
      
      let allKm = getStorageData<KmRegistry>(STORAGE_KEYS.KM);
      let userKm = allKm.filter(k => k.usuario_id === userId);

      // Apply date filtering
      userKm = filterByDate(userKm, filter);

      // Sort by date descending
      userKm.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      
      return { success: true, data: userKm };
    } catch (error) {
      console.error('Erro ao listar KM:', error);
      return { success: false, error: 'Erro ao carregar histórico de KM' };
    }
  },

  async create(data: {
    km_inicial: number;
    km_final: number | null;
    data: string;
  }): Promise<ApiResponse<KmRegistry>> {
    const userId = getCurrentUserId();
    if (!userId) return { success: false, error: 'Não autenticado' };
    
    const newKm: KmRegistry = {
      id: generateId(),
      usuario_id: userId,
      km_inicial: data.km_inicial,
      km_final: data.km_final,
      km_total: data.km_final && data.km_inicial ? data.km_final - data.km_inicial : null,
      data: data.data,
      criado_em: new Date().toISOString(),
    };
    
    const allKm = getStorageData<KmRegistry>(STORAGE_KEYS.KM);
    allKm.push(newKm);
    setStorageData(STORAGE_KEYS.KM, allKm);
    
    return { success: true, data: newKm };
  },

  async update(id: number, data: {
    km_inicial?: number | null;
    km_final?: number | null;
    data?: string;
  }): Promise<ApiResponse<KmRegistry>> {
    const allKm = getStorageData<KmRegistry>(STORAGE_KEYS.KM);
    const index = allKm.findIndex(k => k.id === id);
    
    if (index === -1) {
      return { success: false, error: 'Registro não encontrado' };
    }
    
    const current = allKm[index];
    const km_inicial = data.km_inicial !== undefined ? data.km_inicial : current.km_inicial;
    const km_final = data.km_final !== undefined ? data.km_final : current.km_final;
    
    const updatedKm: KmRegistry = {
      ...current,
      ...data,
      km_inicial,
      km_final,
      km_total: (km_inicial !== null && km_final !== null && km_final > 0) 
        ? km_final - km_inicial 
        : null,
    };
    
    allKm[index] = updatedKm;
    setStorageData(STORAGE_KEYS.KM, allKm);
    
    return { success: true, data: updatedKm };
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    let allKm = getStorageData<KmRegistry>(STORAGE_KEYS.KM);
    allKm = allKm.filter(k => k.id !== id);
    setStorageData(STORAGE_KEYS.KM, allKm);
    
    return { success: true };
  },
};

// Maintenance API - Mock
export const maintenanceApi = {
  async getAll(): Promise<ApiResponse<Maintenance[]>> {
    try {
      const userId = getCurrentUserId();
      if (!userId) return { success: false, error: 'Não autenticado' };
      
      const allMaintenances = getStorageData<Maintenance>(STORAGE_KEYS.MAINTENANCES);
      const userMaintenances = allMaintenances
        .filter(m => m.usuario_id === userId)
        .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
      
      return { success: true, data: userMaintenances };
    } catch (error) {
      console.error('Erro ao listar manutenções:', error);
      return { success: false, error: 'Erro ao carregar manutenções' };
    }
  },

  async create(data: {
    tipo: MaintenanceType;
    km_limite?: number;
    data_limite?: string;
    obs?: string;
  }): Promise<ApiResponse<Maintenance>> {
    const userId = getCurrentUserId();
    if (!userId) return { success: false, error: 'Não autenticado' };
    
    const newMaintenance: Maintenance = {
      id: generateId(),
      usuario_id: userId,
      tipo: data.tipo,
      km_limite: data.km_limite,
      data_limite: data.data_limite,
      status: 'pendente',
      obs: data.obs,
      criado_em: new Date().toISOString(),
    };
    
    const allMaintenances = getStorageData<Maintenance>(STORAGE_KEYS.MAINTENANCES);
    allMaintenances.push(newMaintenance);
    setStorageData(STORAGE_KEYS.MAINTENANCES, allMaintenances);
    
    return { success: true, data: newMaintenance };
  },

  async update(id: number, data: Partial<Maintenance>): Promise<ApiResponse<Maintenance>> {
    const allMaintenances = getStorageData<Maintenance>(STORAGE_KEYS.MAINTENANCES);
    const index = allMaintenances.findIndex(m => m.id === id);
    
    if (index === -1) {
      return { success: false, error: 'Manutenção não encontrada' };
    }
    
    allMaintenances[index] = { ...allMaintenances[index], ...data };
    setStorageData(STORAGE_KEYS.MAINTENANCES, allMaintenances);
    
    return { success: true, data: allMaintenances[index] };
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    let allMaintenances = getStorageData<Maintenance>(STORAGE_KEYS.MAINTENANCES);
    allMaintenances = allMaintenances.filter(m => m.id !== id);
    setStorageData(STORAGE_KEYS.MAINTENANCES, allMaintenances);
    
    return { success: true };
  },
};

// Dashboard API - Mock
export const dashboardApi = {
  async getSummary(filter?: DateFilter): Promise<ApiResponse<DashboardSummary>> {
    const userId = getCurrentUserId();
    if (!userId) return { success: false, error: 'Não autenticado' };
    
    const allEarnings = getStorageData<Earnings>(STORAGE_KEYS.EARNINGS);
    const allExpenses = getStorageData<Expense>(STORAGE_KEYS.EXPENSES);
    const allKm = getStorageData<KmRegistry>(STORAGE_KEYS.KM);
    
    let userEarnings = allEarnings.filter(e => e.usuario_id === userId);
    let userExpenses = allExpenses.filter(e => e.usuario_id === userId);
    let userKm = allKm.filter(k => k.usuario_id === userId);
    
    // Apply date filtering
    userEarnings = filterByDate(userEarnings, filter);
    userExpenses = filterByDate(userExpenses, filter);
    userKm = filterByDate(userKm, filter);
    
    const ganhosPorTipo = {
      corrida: 0,
      gorjeta: 0,
      dinheiro: 0,
    };
    
    const despesasPorTipo = {
      abastecimento: 0,
      manutencao: 0,
      lavagem: 0,
      pedagio: 0,
      alimentacao: 0,
      aluguel: 0,
      parcela: 0,
    };
    
    let totalGanhos = 0;
    let totalDespesas = 0;
    let kmRodados = 0;
    
    userEarnings.forEach(e => {
      totalGanhos += e.valor;
      ganhosPorTipo[e.tipo] += e.valor;
    });
    
    userExpenses.forEach(e => {
      totalDespesas += e.valor;
      despesasPorTipo[e.tipo] += e.valor;
    });
    
    userKm.forEach(k => {
      kmRodados += k.km_total || 0;
    });
    
    const summary: DashboardSummary = {
      totalGanhos,
      totalDespesas,
      lucroLiquido: totalGanhos - totalDespesas,
      kmRodados,
      ganhosPorTipo,
      despesasPorTipo,
    };
    
    return { success: true, data: summary };
  },
};

// Audit Logs API - Mock
export const logsApi = {
  async getAll(): Promise<ApiResponse<AuditLog[]>> {
    try {
      const admin = JSON.parse(localStorage.getItem('malaca_user') || '{}');
      if (admin.role !== 'admin') {
        return { success: false, error: 'Acesso negado.' };
      }
      
      const logs = getStorageData<AuditLog>(STORAGE_KEYS.LOGS);
      return { success: true, data: logs.sort((a, b) => b.id - a.id) };
    } catch (error) {
      console.error('Erro ao listar logs:', error);
      return { success: false, error: 'Falha ao carregar logs' };
    }
  },

  async create(acao: string, descricao: string): Promise<void> {
    try {
      const admin = JSON.parse(localStorage.getItem('malaca_user') || '{}');
      const logs = getStorageData<AuditLog>(STORAGE_KEYS.LOGS);
      const newLog: AuditLog = {
        id: generateId(),
        usuario_id: admin.id || 0,
        usuario_nome: admin.nome || 'Sistema',
        acao,
        descricao,
        data: new Date().toISOString(),
      };
      logs.push(newLog);
      setStorageData(STORAGE_KEYS.LOGS, logs);
    } catch (error) {
      console.error('Erro ao criar log:', error);
    }
  }
};

// Admin API - Mock
export const adminApi = {
  async getDashboardData(): Promise<ApiResponse<AdminDashboardData>> {
    try {
      const admin = JSON.parse(localStorage.getItem('malaca_user') || '{}');
      if (admin.role !== 'admin') {
        return { success: false, error: 'Acesso negado. Apenas administradores podem acessar o painel.' };
      }

      const users = getStorageData<User>(STORAGE_KEYS.USERS);
      const earnings = getStorageData<Earnings>(STORAGE_KEYS.EARNINGS);
      const expenses = getStorageData<Expense>(STORAGE_KEYS.EXPENSES);
      const kms = getStorageData<KmRegistry>(STORAGE_KEYS.KM);
      const maintenances = getStorageData<Maintenance>(STORAGE_KEYS.MAINTENANCES);

      const totalGanhos = earnings.reduce((acc, curr) => acc + curr.valor, 0);
      const totalDespesas = expenses.reduce((acc, curr) => acc + curr.valor, 0);
      
      const activeUsers = users.filter(u => u.status === 'ativo' || !u.status);
    const newUsers = users.filter(u => {
      const created = new Date(u.criado_em);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return created > sevenDaysAgo;
    });

    const driversCount = users.filter(u => u.role === 'user').length;
    const lucroMedio = driversCount > 0 ? (totalGanhos - totalDespesas) / driversCount : 0;

    // Smart Alerts Logic
    const alerts: SmartAlert[] = [];
    
    // Check for inactive users (no registries in last 3 days)
    users.forEach(user => {
      if (user.role === 'user') {
        const userKms = kms.filter(k => k.usuario_id === user.id);
        const lastKm = userKms.length > 0 ? new Date(Math.max(...userKms.map(k => new Date(k.data).getTime()))) : null;
        
        if (!lastKm || (Date.now() - lastKm.getTime()) > (3 * 24 * 60 * 60 * 1000)) {
          alerts.push({
            id: `alert-km-${user.id}`,
            tipo: 'warning',
            usuario_id: user.id,
            usuario_nome: user.nome,
            mensagem: 'Sem registro de KM nos últimos 3 dias',
            data: new Date().toISOString(),
          });
        }

        // Check for maintenance
        const userMaintenances = maintenances.filter(m => m.usuario_id === user.id && m.status !== 'concluido');
        if (userMaintenances.length > 0) {
          alerts.push({
            id: `alert-maint-${user.id}`,
            tipo: 'error',
            usuario_id: user.id,
            usuario_nome: user.nome,
            mensagem: 'Manutenções pendentes ou vencidas',
            data: new Date().toISOString(),
          });
        }
      }
    });

    // Top drivers calculation
    const topDrivers: TopDriver[] = users
      .filter(u => u.role === 'user')
      .map(u => {
        const userGanhos = earnings.filter(e => e.usuario_id === u.id).reduce((acc, curr) => acc + curr.valor, 0);
        const userDespesas = expenses.filter(e => e.usuario_id === u.id).reduce((acc, curr) => acc + curr.valor, 0);
        return {
          id: u.id,
          nome: u.nome,
          email: u.email,
          ganhoTotal: userGanhos,
          lucroLiquido: userGanhos - userDespesas,
        };
      })
      .sort((a, b) => b.lucroLiquido - a.lucroLiquido)
      .slice(0, 5);

    return {
      success: true,
      data: {
        stats: {
          totalUsuarios: users.length,
          usuariosAtivos: activeUsers.length,
          novosUsuarios7Dias: newUsers.length,
          totalGanhosGlobal: totalGanhos,
          totalDespesasGlobal: totalDespesas,
          lucroMedioPorMotorista: lucroMedio,
          receitaPlataforma: totalGanhos * 0.05, // Ex: platform fee simulated
          ticketMedioPorCorrida: totalGanhos / (earnings.filter(e => e.tipo === 'corrida').length || 1),
          percentualBaixoLucro: 15, // Mocked analytic
          usuariosInativos: driversCount - activeUsers.length,
        },
        alerts: alerts.slice(0, 5),
        topDrivers,
        graficoCrescimento: [
          { data: 'Nov', usuarios: 45, receita: 12000 },
          { data: 'Dez', usuarios: 68, receita: 18500 },
          { data: 'Jan', usuarios: 92, receita: 24000 },
          { data: 'Fev', usuarios: 124, receita: 31200 },
          { data: 'Mar', usuarios: 156, receita: 42000 },
        ],
        distribuicaoDespesas: [
          { name: 'Combustível', value: 45 },
          { name: 'Manutenção', value: 25 },
          { name: 'Aluguel', value: 20 },
          { name: 'Outros', value: 10 },
        ]
      }
    };
    } catch (error) {
      console.error('Erro no Dashboard Admin:', error);
      return { success: false, error: 'Falha ao processar dados do painel' };
    }
  }
};
