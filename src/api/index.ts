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

// Cache do users.id (diferente do auth.uid()!)
let _cachedUserId: string | null = null;

async function getMyUserId(): Promise<string | null> {
  if (_cachedUserId) return _cachedUserId;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
  _cachedUserId = data?.id || null;
  return _cachedUserId;
}

// Limpa cache ao trocar sessão
supabase.auth.onAuthStateChange(() => { _cachedUserId = null; });

// Calcula data início baseado no filtro
function getFilterStartDate(filter?: DateFilter): string | null {
  if (!filter || filter === 'personalizado') return null;
  const now = new Date();
  if (filter === 'diario') {
    return now.toISOString().split('T')[0];
  } else if (filter === 'semanal') {
    now.setDate(now.getDate() - 7);
    return now.toISOString().split('T')[0];
  } else if (filter === 'mensal') {
    now.setMonth(now.getMonth() - 1);
    return now.toISOString().split('T')[0];
  }
  return null;
}

// Adaptador: converte dados do banco (inglês) para aliases usados no frontend (português)
function adaptUser(raw: any): User {
  if (!raw) return raw;
  return {
    ...raw,
    nome: raw.name || '',
    telefone: raw.phone || '',
    foto_url: raw.avatar_url || '',
    status: raw.is_active === false ? 'inativo' : 'ativo',
    veiculo: '',
    placa: '',
    tipo: raw.role || 'user',
  };
}

export const authApi = {
  async login(telefone: string, senha: string): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      // Se já tem @, usa como email direto; senão, converte telefone → email
      const email = telefone.includes('@') ? telefone : `${telefone.replace(/\D/g, '')}@7finance.com`;
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
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
          user: adaptUser(userData),
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
      const email = userData.email;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: userData.password,
        options: {
          data: { name: userData.nome },
        },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('rate limit')) {
          return { success: false, error: 'Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.' };
        }
        return { success: false, error: authError.message };
      }

      // Se o Supabase retornou user sem session, pode ser que o email já exista
      // ou que a confirmação ainda esteja ativa
      if (authData.user && !authData.session) {
        // Tenta fazer login direto caso o confirm email esteja desativado
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password: userData.password,
        });
        if (!loginError && loginData.session) {
          // Login funcionou, o user já existia — seguir com o fluxo
          authData.session = loginData.session;
        }
      }

      // Colunas REAIS do banco: name, phone, email, auth_id, role
      const newUser = {
        name: userData.nome,
        phone: userData.telefone?.replace(/\D/g, ''),
        email: userData.email,
        auth_id: authData.user?.id,
        role: 'user',
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
          user: adaptUser(profile),
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
      
      if (error) return { success: false, error: error.message };
      return { success: true, data: adaptUser(profile) };
    } catch (err) {
      return { success: false, error: 'Erro ao buscar perfil' };
    }
  },
};

export const usersApi = {
  async getAll() { 
    const { data, error } = await supabase.from('users').select('*');
    if (error) return apiResponse<User[]>(null, error);
    return { success: true, data: (data || []).map(adaptUser) };
  },
  async update(id: string | number, updateData: any) {
    // Proteção: rejeitar IDs inválidos (ex: 0, vazio, não-UUID)
    if (!id || id === 0 || id === '0' || id === '') {
      return { success: false, error: 'ID de usuário inválido' };
    }

    // Converte aliases PT → colunas reais EN
    const mapped: any = {};
    if (updateData.nome !== undefined) mapped.name = updateData.nome;
    if (updateData.telefone !== undefined) mapped.phone = updateData.telefone?.replace(/\D/g, '');
    if (updateData.email !== undefined) mapped.email = updateData.email;
    if (updateData.foto_url !== undefined) mapped.avatar_url = updateData.foto_url;
    if (updateData.role !== undefined) mapped.role = updateData.role;
    if (updateData.status !== undefined) mapped.is_active = updateData.status === 'ativo';
    // Campos que já são do banco passam direto
    if (updateData.name !== undefined) mapped.name = updateData.name;
    if (updateData.phone !== undefined) mapped.phone = updateData.phone;
    if (updateData.avatar_url !== undefined) mapped.avatar_url = updateData.avatar_url;
    if (updateData.is_active !== undefined) mapped.is_active = updateData.is_active;

    const { data: result, error } = await supabase.from('users').update(mapped).eq('id', id).select().single();
    if (error) return apiResponse<User>(null, error);
    return { success: true, data: adaptUser(result) };
  },
  async delete(id: string | number) {
    const { error } = await supabase.from('users').delete().eq('id', id);
    return apiResponse<void>(null, error);
  },
};

export const veiculosApi = {
  async getAll() { 
    const { data, error } = await supabase.from('veiculos').select('*');
    return apiResponse<any[]>(data, error);
  },
  async create(data: any) { 
    const userId = await getMyUserId();
    const { data: result, error } = await supabase.from('veiculos').insert({ ...data, usuario_id: userId }).select().single();
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
    const { data, error } = await supabase.from('km_registry').select('*, veiculos(id, modelo, placa)').order('data', { ascending: false });
    return apiResponse<KmRegistry[]>(data, error);
  },
  async create(data: any) { 
    const userId = await getMyUserId();
    const { data: result, error } = await supabase.from('km_registry').insert({ ...data, usuario_id: userId }).select().single();
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
  async getAll(filter?: DateFilter) { 
    let query = supabase.from('earnings').select('*').order('data', { ascending: false });
    const startDate = getFilterStartDate(filter);
    if (startDate) query = query.gte('data', startDate);
    const { data, error } = await query;
    return apiResponse<Earnings[]>(data, error);
  },
  async create(data: any) { 
    const userId = await getMyUserId();
    const { data: result, error } = await supabase.from('earnings').insert({ ...data, usuario_id: userId }).select().single();
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
  async getAll(filter?: DateFilter) { 
    let query = supabase.from('expenses').select('*').order('data', { ascending: false });
    const startDate = getFilterStartDate(filter);
    if (startDate) query = query.gte('data', startDate);
    const { data, error } = await query;
    return apiResponse<Expense[]>(data, error);
  },
  async create(data: any) { 
    const userId = await getMyUserId();
    const { data: result, error } = await supabase.from('expenses').insert({ ...data, usuario_id: userId }).select().single();
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
    const { data, error } = await supabase.from('maintenance').select('*, veiculos(id, modelo, placa)').order('data', { ascending: false });
    return apiResponse<Maintenance[]>(data, error);
  },
  async create(data: any) { 
    const userId = await getMyUserId();
    const { data: result, error } = await supabase.from('maintenance').insert({ ...data, usuario_id: userId }).select('*, veiculos(id, modelo, placa)').single();
    return apiResponse<Maintenance>(result, error);
  },
  async update(id: number, data: any) { 
    const { data: result, error } = await supabase.from('maintenance').update(data).eq('id', id).select('*, veiculos(id, modelo, placa)').single();
    return apiResponse<Maintenance>(result, error);
  },
  async delete(id: number) { 
    const { error } = await supabase.from('maintenance').delete().eq('id', id);
    return apiResponse<void>(null, error);
  },
};

export const dashboardApi = {
  async getSummary(filter?: DateFilter) {
    try {
      const startDate = getFilterStartDate(filter);
      let earningsQuery = supabase.from('earnings').select('valor, tipo');
      let expensesQuery = supabase.from('expenses').select('valor, tipo');
      if (startDate) {
        earningsQuery = earningsQuery.gte('data', startDate);
        expensesQuery = expensesQuery.gte('data', startDate);
      }
      const [{ data: earnings, error: earningsError }, { data: expenses, error: expensesError }] = await Promise.all([
        earningsQuery,
        expensesQuery,
      ]);
      
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
  async getDashboardData(): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.rpc('admin_dashboard_data');
      if (error) throw error;
      
      // A função retorna jsonb com a estrutura completa AdminDashboardData
      const dashboard = data as any;
      
      return {
        success: true,
        data: {
          stats: {
            totalUsuarios: dashboard.stats?.totalUsuarios ?? 0,
            usuariosAtivos: dashboard.stats?.usuariosAtivos ?? 0,
            novosUsuarios7Dias: dashboard.stats?.novosUsuarios7Dias ?? 0,
            totalGanhosGlobal: Number(dashboard.stats?.totalGanhosGlobal ?? 0),
            totalDespesasGlobal: Number(dashboard.stats?.totalDespesasGlobal ?? 0),
            lucroMedioPorMotorista: Number(dashboard.stats?.lucroMedioPorMotorista ?? 0),
            receitaPlataforma: Number(dashboard.stats?.receitaPlataforma ?? 0),
            ticketMedioPorCorrida: Number(dashboard.stats?.ticketMedioPorCorrida ?? 0),
            percentualBaixoLucro: Number(dashboard.stats?.percentualBaixoLucro ?? 0),
            usuariosInativos: dashboard.stats?.usuariosInativos ?? 0,
          },
          alerts: dashboard.alerts ?? [],
          topDrivers: (dashboard.topDrivers ?? []).map((d: any) => ({
            id: d.id,
            nome: d.nome || 'Sem nome',
            email: d.email || '',
            ganhoTotal: Number(d.ganho_total ?? 0),
            lucroLiquido: Number(d.lucro_liquido ?? 0),
          })),
          graficoCrescimento: (dashboard.graficoCrescimento ?? []).map((g: any) => ({
            data: g.data,
            usuarios: Number(g.usuarios ?? 0),
            receita: Number(g.receita ?? 0),
          })),
          distribuicaoDespesas: (dashboard.distribuicaoDespesas ?? []).map((d: any) => ({
            name: d.name || 'Outros',
            value: Number(d.value ?? 0),
          })),
        }
      };
    } catch (e: any) {
      console.error('Admin dashboard error:', e);
      return { success: false, error: e.message || 'Erro ao buscar dados do painel admin' };
    }
  },

  // Criar usuário via RPC admin_create_user (cria auth + public.users)
  async createUser(params: { name: string; email?: string; phone?: string; password?: string; role?: string }): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.rpc('admin_create_user', {
        p_name: params.name,
        p_email: params.email || null,
        p_phone: params.phone || null,
        p_password: params.password || '123456',
        p_role: params.role || 'user',
      });
      if (error) throw error;
      return { success: true, data };
    } catch (e: any) {
      console.error('Admin create user error:', e);
      return { success: false, error: e.message || 'Erro ao criar usuário' };
    }
  },
};

export const logsApi = {
  async getAll() {
    try {
      const { data, error } = await supabase.rpc('admin_get_logs', { p_limit: 200 });
      if (error) throw error;
      // RPC retorna jsonb array com admin_name já populado
      return { success: true, data: (data || []) as any[] };
    } catch (e: any) {
      // Fallback: busca direto da tabela (sem nome do admin)
      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
      return apiResponse<any[]>(data, error);
    }
  },
  async create(acao: string, descricao: string) {
    const userId = await getMyUserId();
    const insertData: any = { 
      action: acao, 
      entity: descricao,
      metadata: { acao, descricao }
    };
    // Só inclui user_id se conseguiu resolver (evita erro de FK com null/inválido)
    if (userId) insertData.user_id = userId;
    const { error } = await supabase.from('audit_logs').insert(insertData);
    return apiResponse<void>(null, error);
  }
};