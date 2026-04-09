import { 
  User, DateFilter, Earnings, Expense, Maintenance, KmRegistry, ApiResponse
} from '../types';
import { supabase } from './supabase';

const apiResponse = <T>(data: T | null, error: any): ApiResponse<T> => {
  if (error) {
    console.error('API Error:', error);
    return { success: false, error: error.message || 'Erro desconhecido' };
  }
  return { success: true, data: data as T };
};

export const authApi = {
  async login(telefone: string, senha_hash: string): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const email = `${telefone.replace(/\D/g, '')}@7finance.com`;
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha_hash,
      });

      if (authError) return { success: false, error: authError.message };

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authData.user.id)
        .single();

      if (userError) return { success: false, error: userError.message };

      return {
        success: true,
        data: {
          user: userData as User,
          token: authData.session?.access_token || '',
        },
      };
    } catch (err: any) {
      console.error('Login exception:', err);
      return { success: false, error: err.message || 'Erro no login' };
    }
  },

  async register(userData: any): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) return { success: false, error: authError.message };

      const newUser = {
        nome: userData.nome,
        telefone: userData.telefone,
        email: userData.email,
        auth_id: authData.user?.id,
        role: 'user',
        status: 'ativo'
      };

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (profileError) return { success: false, error: profileError.message };

      return {
        success: true,
        data: {
          user: profile as User,
          token: authData.session?.access_token || '',
        },
      };
    } catch (err: any) {
      console.error('Register exception:', err);
      return { success: false, error: err.message || 'Erro no registro' };
    }
  },

  async getMe() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Não autenticado' };
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single();
        
      return apiResponse<User>(profile, error);
    } catch (err) {
      return { success: false, error: 'Erro ao buscar perfil' };
    }
  },
};

export const usersApi = {
  async getAll() { 
    const { data, error } = await supabase.from('users').select('*');
    return apiResponse<User[]>(data, error);
  },
  async update(id: string | number, data: any) { 
    const { data: result, error } = await supabase.from('users').update(data).eq('id', id).select().single();
    return apiResponse<User>(result, error);
  },
};

export const veiculosApi = {
  async getAll() { 
    const { data, error } = await supabase.from('veiculos').select('*');
    return apiResponse<any[]>(data, error);
  },
  async create(data: any) { 
    const { data: result, error } = await supabase.from('veiculos').insert(data).select().single();
    return apiResponse<any>(result, error);
  },
  async update(id: number, data: any) { 
    const { data: result, error } = await supabase.from('veiculos').update(data).eq('id', id).select().single();
    return apiResponse<any>(result, error);
  },
  async delete(id: number) { 
    const { error } = await supabase.from('veiculos').delete().eq('id', id);
    return apiResponse<void>(null, error);
  },
};

export const kmApi = {
  async getAll() { 
    const { data, error } = await supabase.from('km_registry').select('*').order('data', { ascending: false });
    return apiResponse<KmRegistry[]>(data, error);
  },
  async create(data: any) { 
    const { data: result, error } = await supabase.from('km_registry').insert(data).select().single();
    return apiResponse<KmRegistry>(result, error);
  },
  async update(id: number, data: any) { 
    const { data: result, error } = await supabase.from('km_registry').update(data).eq('id', id).select().single();
    return apiResponse<KmRegistry>(result, error);
  },
  async delete(id: number) { 
    const { error } = await supabase.from('km_registry').delete().eq('id', id);
    return apiResponse<void>(null, error);
  },
};

export const earningsApi = {
  async getAll() { 
    const { data, error } = await supabase.from('earnings').select('*').order('data', { ascending: false });
    return apiResponse<Earnings[]>(data, error);
  },
  async create(data: any) { 
    const { data: result, error } = await supabase.from('earnings').insert(data).select().single();
    return apiResponse<Earnings>(result, error);
  },
  async update(id: number, data: any) { 
    const { data: result, error } = await supabase.from('earnings').update(data).eq('id', id).select().single();
    return apiResponse<Earnings>(result, error);
  },
  async delete(id: number) { 
    const { error } = await supabase.from('earnings').delete().eq('id', id);
    return apiResponse<void>(null, error);
  },
};

export const expensesApi = {
  async getAll() { 
    const { data, error } = await supabase.from('expenses').select('*').order('data', { ascending: false });
    return apiResponse<Expense[]>(data, error);
  },
  async create(data: any) { 
    const { data: result, error } = await supabase.from('expenses').insert(data).select().single();
    return apiResponse<Expense>(result, error);
  },
  async update(id: number, data: any) { 
    const { data: result, error } = await supabase.from('expenses').update(data).eq('id', id).select().single();
    return apiResponse<Expense>(result, error);
  },
  async delete(id: number) { 
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    return apiResponse<void>(null, error);
  },
};

export const maintenanceApi = {
  async getAll() { 
    const { data, error } = await supabase.from('maintenance').select('*').order('data', { ascending: false });
    return apiResponse<Maintenance[]>(data, error);
  },
  async create(data: any) { 
    const { data: result, error } = await supabase.from('maintenance').insert(data).select().single();
    return apiResponse<Maintenance>(result, error);
  },
  async update(id: number, data: any) { 
    const { data: result, error } = await supabase.from('maintenance').update(data).eq('id', id).select().single();
    return apiResponse<Maintenance>(result, error);
  },
  async delete(id: number) { 
    const { error } = await supabase.from('maintenance').delete().eq('id', id);
    return apiResponse<void>(null, error);
  },
};

export const dashboardApi = {
  async getSummary(_filter?: DateFilter) {
    try {
      const { data: earnings, error: earningsError } = await supabase.from('earnings').select('valor, tipo');
      const { data: expenses, error: expensesError } = await supabase.from('expenses').select('valor, tipo');
      
      if (earningsError) throw earningsError;
      if (expensesError) throw expensesError;

      const ganhosPorTipo: any = { corrida: 0, gorjeta: 0, dinheiro: 0 };
      const despesasPorTipo: any = { abastecimento: 0, manutencao: 0, lavagem: 0, pedagio: 0, alimentacao: 0, aluguel: 0, parcela: 0 };

      const totalEarnings = (earnings || []).reduce((acc: number, curr: any) => {
        const val = Number(curr.valor) || 0;
        if (curr.tipo && ganhosPorTipo[curr.tipo] !== undefined) ganhosPorTipo[curr.tipo] += val;
        return acc + val;
      }, 0);

      const totalExpenses = (expenses || []).reduce((acc: number, curr: any) => {
        const val = Number(curr.valor) || 0;
        if (curr.tipo && despesasPorTipo[curr.tipo] !== undefined) despesasPorTipo[curr.tipo] += val;
        return acc + val;
      }, 0);
      
      return { 
        success: true, 
        data: { 
          totalGanhos: totalEarnings, 
          totalDespesas: totalExpenses, 
          lucroLiquido: totalEarnings - totalExpenses,
          kmRodados: 0,
          ganhosPorTipo,
          despesasPorTipo
        } as any 
      };
    } catch (e: any) {
      console.error('getSummary error:', e);
      return { success: false, error: e.message || 'Erro ao calcular sumário' };
    }
  },
  async getAdminDashboardData() {
    try {
      const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { data: earnings } = await supabase.from('earnings').select('valor');
      
      return {
        success: true,
        data: {
          totalUsers: totalUsers || 0,
          totalRevenue: (earnings || []).reduce((acc: number, curr: any) => acc + Number(curr.valor), 0)
        } as any
      };
    } catch (e) {
      return { success: false, error: 'Erro ao buscar dados admin' };
    }
  }
};

export const adminApi = {
  async getDashboardData() {
    return dashboardApi.getAdminDashboardData();
  }
};

export const logsApi = {
  async getAll() {
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
    return apiResponse<any[]>(data, error);
  },
  async create(acao: string, descricao: string) {
    const { error } = await supabase.from('audit_logs').insert({ acao, descricao });
    return apiResponse<void>(null, error);
  }
};