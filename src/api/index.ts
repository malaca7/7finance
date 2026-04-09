import type { 
  User, Earnings, Expense, KmRegistry, Maintenance, ApiResponse,
  DashboardSummary, EarningsType, DateFilter,
  DriverType, MaintenanceType, AdminDashboardData, AuditLog
} from '../types';

const API_BASE_URL = 'http://192.168.1.5:8000/api_backend/api.php?entity=';
const AUTH_URL = 'http://192.168.1.5:8000/api_backend/auth.php?action=';

async function authCall<T>(action: string, data: any): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${AUTH_URL}${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok || result.success === false) {
      return { success: false, error: result.error || 'Erro na requisi��o' };
    }
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: 'Erro de conex�o com o backend.' };
  }
}

async function apiCall<T>(entity: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const storageStr = localStorage.getItem('malaca-finance-storage');
    let userId = 1;

    if (storageStr) {
      try {
        const storageData = JSON.parse(storageStr);
        const user = storageData?.state?.user;
        if (user && user.id) userId = user.id;
      } catch (e) {
        console.error("Erro ao ler userId do storage:", e);
      }
    }

    const filter = JSON.parse(localStorage.getItem('malaca-finance-storage') || '{}')?.state?.dateFilter || 'mensal';
    const token = JSON.parse(localStorage.getItem('malaca-finance-storage') || '{}')?.state?.token;

    const url = `${API_BASE_URL}${entity}&userId=${userId}&filter=${filter}`;    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options.headers) {
      Object.entries(options.headers).forEach(([k, v]) => headers[k] = v as string);
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { 
      ...options, 
      headers
    });
    
    const data = await response.json();
    if (!response.ok || data.success === false) return { success: false, error: data.error || 'Erro na requisi��o' };
    return { success: true, data: data.data || data };
  } catch (error) {
    return { success: false, error: 'Certifique-se que o banco de dados est� online (XAMPP rodando).' };
  }
}

export const authApi = {
  async login(telefone: string, password: string) {
    return authCall<{ user: User; token: string }>('login', { telefone, password });
  },
  async register(data: any) { 
    return authCall<{ user: User; token: string }>('register', data); 
  },
  async getMe() { 
    return apiCall<User>('user'); 
  },
};

export const usersApi = {
  async getAll() { return apiCall<User[]>('usuario'); },
  async getById(id: number) { return apiCall<User>(`usuario&id=${id}`); },
  async create(data: any) { return apiCall<User>('usuario', { method: 'POST', body: JSON.stringify(data) }); },
  async update(id: number, data: any) { 
    return apiCall<User>(id > 0 ? `usuario&id=${id}` : 'usuario', { method: 'POST', body: JSON.stringify(data) }); 
  },
  async delete(id: number) { return apiCall<void>(`usuario&id=${id}`, { method: 'DELETE' }); },
};

export const earningsApi = {
  async getAll(filter?: DateFilter) { return apiCall<Earnings[]>(`earnings${filter ? `&filter=${filter}` : ''}`); },
  async create(data: any) { return apiCall<Earnings>('earnings', { method: 'POST', body: JSON.stringify(data) }); },
  async update(id: number, data: any) { return apiCall<Earnings>(`earnings&id=${id}`, { method: 'POST', body: JSON.stringify(data) }); },
  async delete(id: number) { return apiCall<void>(`earnings&id=${id}`, { method: 'DELETE' }); },
};

export const expensesApi = {
  async getAll(filter?: DateFilter) { return apiCall<Expense[]>(`expenses${filter ? `&filter=${filter}` : ''}`); },
  async create(data: any) { return apiCall<Expense>('expenses', { method: 'POST', body: JSON.stringify(data) }); },
  async update(id: number, data: any) { return apiCall<Expense>(`expenses&id=${id}`, { method: 'POST', body: JSON.stringify(data) }); },
  async delete(id: number) { return apiCall<void>(`expenses&id=${id}`, { method: 'DELETE' }); },
};

export const kmApi = {
  async getAll() { return apiCall<KmRegistry[]>('km'); },
  async create(data: any) { return apiCall<KmRegistry>('km', { method: 'POST', body: JSON.stringify(data) }); },
  async update(id: number, data: any) { return apiCall<KmRegistry>(`km&id=${id}`, { method: 'POST', body: JSON.stringify(data) }); },
  async delete(id: number) { return apiCall<void>(`km&id=${id}`, { method: 'DELETE' }); },
};

export const dashboardApi = {
  async getSummary(filter?: DateFilter) { return apiCall<DashboardSummary>(`summary${filter ? `&filter=${filter}` : ''}`); },
  async getAdminDashboardData() { return apiCall<AdminDashboardData>('admin_dashboard'); },
};

export const maintenanceApi = {
  async getAll() { return apiCall<Maintenance[]>('maintenance'); },
  async create(data: any) { return apiCall<Maintenance>('maintenance', { method: 'POST', body: JSON.stringify(data) }); },
  async update(id: number, data: any) { return apiCall<Maintenance>(`maintenance&id=${id}`, { method: 'POST', body: JSON.stringify(data) }); },
  async delete(id: number) { return apiCall<void>(`maintenance&id=${id}`, { method: 'DELETE' }); },
};

export const veiculosApi = {
  async getAll() { return apiCall<any[]>('veiculos'); },
  async create(data: any) { return apiCall<any>('veiculos', { method: 'POST', body: JSON.stringify(data) }); },
  async update(id: number, data: any) { return apiCall<any>(`veiculos&id=${id}`, { method: 'POST', body: JSON.stringify(data) }); },
  async delete(id: number) { return apiCall<void>(`veiculos&id=${id}`, { method: 'DELETE' }); },
};

export const logsApi = {
  async getAll() { return apiCall<AuditLog[]>('logs'); },
  async create(acao: string, descricao: string) { return apiCall<void>('logs', { method: 'POST', body: JSON.stringify({ acao, descricao }) }); },
};

export const adminApi = {
  async getDashboardData() { return apiCall<AdminDashboardData>('admin_dashboard'); },
};