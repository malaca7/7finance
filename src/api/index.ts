import { 
  User, DateFilter, Earnings, Expense, Maintenance, KmRegistry, ApiResponse,
  Goal, GoalProgress, Insight, PricingAnalysis, PlanType, PlanFeature, UserPlan
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
  // Try with normal client first, fallback to admin client if RLS blocks
  let { data } = await supabase.from('users').select('id').eq('auth_id', user.id).maybeSingle();
  if (!data) {
    const { createAdminClient } = await import('./supabase');
    const admin = await createAdminClient();
    const res = await admin.from('users').select('id').eq('auth_id', user.id).maybeSingle();
    data = res.data;
  }
  // Fallback: if users table has no match, try matching by id directly (some tables use auth uid as usuario_id)
  if (!data) {
    // Check if the auth uid itself exists as a users.id
    const { createAdminClient } = await import('./supabase');
    const admin = await createAdminClient();
    const res = await admin.from('users').select('id').eq('id', user.id).maybeSingle();
    data = res.data;
  }
  _cachedUserId = data?.id || null;
  return _cachedUserId;
}

// Limpa cache ao trocar sessão
supabase.auth.onAuthStateChange(() => { _cachedUserId = null; });

// Fire-and-forget audit log helper
function logAction(action: string, entity: string, entityId?: string) {
  (async () => {
    try {
      const userId = await getMyUserId();
      const insertData: any = { action, entity, metadata: { action, descricao: entity } };
      if (userId) insertData.user_id = userId;
      if (entityId) insertData.entity_id = entityId;
      await supabase.from('audit_logs').insert(insertData);
    } catch (e) {
      // silently ignore logging errors
    }
  })();
}

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
  /**
   * Login com telefone + senha.
   * O Supabase Auth usa {phone}@7finance.com como email interno.
   */
  async login(telefone: string, senha: string): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const cleanPhone = telefone.replace(/\D/g, '');
      const authEmail = `${cleanPhone}@7finance.com`;

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: senha,
      });

      if (authError) {
        return {
          success: false,
          error: authError.message.includes('Invalid')
            ? 'Telefone ou senha incorretos'
            : authError.message,
        };
      }

      if (!authData.user || !authData.session) {
        return { success: false, error: 'Erro na autenticação' };
      }

      // Busca perfil na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authData.user.id)
        .single();

      if (userError || !userData) {
        // Cria perfil se não existir
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            auth_id: authData.user.id,
            phone: cleanPhone,
            name: 'Usuário',
          })
          .select()
          .single();

        if (createError) {
          return { success: false, error: 'Erro ao criar perfil: ' + createError.message };
        }

        return {
          success: true,
          data: { user: adaptUser(newUser), token: authData.session.access_token },
        };
      }

      logAction('LOGIN', `Login: ${userData.name || userData.email}`, userData.id);

      return {
        success: true,
        data: { user: adaptUser(userData), token: authData.session.access_token },
      };
    } catch (err: any) {
      console.error('Login exception:', err);
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network')) {
        return { success: false, error: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.' };
      }
      return { success: false, error: err.message || 'Erro no login' };
    }
  },

  /**
   * Registro: Supabase Auth usa {phone}@7finance.com. Email real fica na tabela users.
   */
  async register(userData: any): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const cleanPhone = (userData.telefone || '').replace(/\D/g, '');
      if (!cleanPhone) return { success: false, error: 'Telefone é obrigatório' };

      const authEmail = `${cleanPhone}@7finance.com`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password: userData.password,
        options: {
          data: { name: userData.nome },
        },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('rate limit')) {
          return { success: false, error: 'Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.' };
        }
        if (authError.message.toLowerCase().includes('already registered')) {
          return { success: false, error: 'Este telefone já está cadastrado.' };
        }
        return { success: false, error: authError.message };
      }

      // Se retornou user sem session, tentar login direto
      if (authData.user && !authData.session) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: userData.password,
        });
        if (!loginError && loginData.session) {
          authData.session = loginData.session;
        }
      }

      const newUser = {
        name: userData.nome,
        phone: cleanPhone,
        email: userData.email || '',
        auth_id: authData.user?.id,
        role: 'user',
      };

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (profileError) return { success: false, error: profileError.message };

      logAction('REGISTRO', `Novo cadastro: ${userData.nome} (${cleanPhone})`, profile?.id);

      return {
        success: true,
        data: {
          user: adaptUser(profile),
          token: authData.session?.access_token || '',
        },
      };
    } catch (err: any) {
      console.error('Register exception:', err);
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('failed to fetch') || msg.includes('network')) {
        return { success: false, error: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.' };
      }
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

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    try {
      // Busca usuário pelo email na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        // Por segurança, não revela se o email existe ou não
        return { success: true, data: { message: 'Se o email existir, você receberá um link de recuperação.' } };
      }

      // Envia email de recuperação via Supabase Auth
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Reset password error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: { message: 'Se o email existir, você receberá um link de recuperação.' } };
    } catch (err: any) {
      console.error('Forgot password exception:', err);
      return { success: false, error: err.message || 'Erro ao processar solicitação' };
    }
  },
};

export const usersApi = {
  async getAll() { 
    // Usa service-role para bypassing RLS (chamado apenas de páginas admin)
    const { createAdminClient } = await import('./supabase');
    const adminClient = await createAdminClient();
    const { data, error } = await adminClient.from('users').select('*');
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
    if (updateData.bio !== undefined) mapped.bio = updateData.bio;
    if (updateData.username !== undefined) mapped.username = updateData.username;
    if (updateData.userlink !== undefined) mapped.userlink = updateData.userlink;
    // Campos que já são do banco passam direto
    if (updateData.name !== undefined) mapped.name = updateData.name;
    if (updateData.phone !== undefined) mapped.phone = updateData.phone;
    if (updateData.avatar_url !== undefined) mapped.avatar_url = updateData.avatar_url;
    if (updateData.is_active !== undefined) mapped.is_active = updateData.is_active;

    const { data: result, error } = await supabase.from('users').update(mapped).eq('id', id).select().single();
    if (error) return apiResponse<User>(null, error);
    const changedFields = Object.keys(mapped).filter(k => k !== 'avatar_url').join(', ');
    if (changedFields) logAction('ALTERAR_PERFIL', `Atualizou perfil: ${changedFields}`, String(id));
    return { success: true, data: adaptUser(result) };
  },
  async delete(id: string | number) {
    const { createAdminClient } = await import('./supabase');
    const adminClient = await createAdminClient();
    
    // Buscar auth_id antes de deletar
    const { data: userData } = await adminClient.from('users').select('auth_id').eq('id', id).single();
    
    // Deletar dados relacionados e o usuário
    const { error } = await adminClient.from('users').delete().eq('id', id);
    if (error) return apiResponse<void>(null, error);
    
    // Deletar do Supabase Auth também
    if (userData?.auth_id) {
      await adminClient.auth.admin.deleteUser(userData.auth_id);
    }
    
    return { success: true, data: undefined };
  },
  async resetPassword(userId: string | number, customPassword?: string): Promise<ApiResponse<{ newPassword: string; email: string; name: string }>> {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email, name, phone, auth_id')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      if (!userData.auth_id) {
        return { success: false, error: 'Usuário não possui auth_id' };
      }

      const newPassword = customPassword || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '!';

      // Usar admin client para alterar senha no Supabase Auth
      const { createAdminClient } = await import('./supabase');
      const supabaseAdmin = await createAdminClient();

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userData.auth_id, {
        password: newPassword
      });

      if (updateError) {
        return { success: false, error: updateError.message || 'Erro ao alterar senha no auth' };
      }

      return {
        success: true,
        data: {
          newPassword,
          email: userData.email || userData.phone || '',
          name: userData.name || 'Usuário'
        }
      };
    } catch (err: any) {
      console.error('Reset password error:', err);
      return { success: false, error: err.message || 'Erro ao redefinir senha' };
    }
  },
};

export const veiculosApi = {
  async getAll() { 
    const { data, error } = await supabase.from('veiculos').select('*');
    return apiResponse<any[]>(data, error);
  },
  async create(data: any) { 
    const userId = await getMyUserId();
    if (!userId) {
      return { success: false, error: 'Não foi possível identificar o usuário. Faça login novamente.' };
    }
    const { data: result, error } = await supabase.from('veiculos').insert({ ...data, usuario_id: userId }).select().single();
    if (!error) logAction('CRIAR_REGISTRO', `Adicionou veículo: ${data.modelo || ''} ${data.placa || ''}`, String(result?.id));
    return apiResponse<any>(result, error);
  },
  async update(id: number, data: any) { 
    const { data: result, error } = await supabase.from('veiculos').update(data).eq('id', id).select().single();
    if (!error) logAction('EDITAR_REGISTRO', `Editou veículo: ${data.modelo || ''} ${data.placa || ''}`, String(id));
    return apiResponse<any>(result, error);
  },
  async delete(id: number) { 
    const { error } = await supabase.from('veiculos').delete().eq('id', id);
    if (!error) logAction('EXCLUIR_REGISTRO', `Excluiu veículo ID ${id}`, String(id));
    return apiResponse<void>(null, error);
  },
};

export const kmApi = {
  async getAll(filter?: DateFilter) { 
    let query = supabase.from('km_registry').select('*, veiculos(id, modelo, placa)').order('data', { ascending: false });
    const startDate = getFilterStartDate(filter);
    if (startDate) query = query.gte('data', startDate);
    const { data, error } = await query;
    return apiResponse<KmRegistry[]>(data, error);
  },
  async create(data: any) { 
    const userId = await getMyUserId();
    const { data: result, error } = await supabase.from('km_registry').insert({ ...data, usuario_id: userId }).select().single();
    if (!error) logAction('CRIAR_REGISTRO', `Registrou KM: ${data.km_atual || ''} km`, String(result?.id));
    return apiResponse<KmRegistry>(result, error);
  },
  async update(id: number, data: any) { 
    const { data: result, error } = await supabase.from('km_registry').update(data).eq('id', id).select().single();
    if (!error) logAction('EDITAR_REGISTRO', `Editou registro KM ID ${id}`, String(id));
    return apiResponse<KmRegistry>(result, error);
  },
  async delete(id: number) { 
    const { error } = await supabase.from('km_registry').delete().eq('id', id);
    if (!error) logAction('EXCLUIR_REGISTRO', `Excluiu registro KM ID ${id}`, String(id));
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
    if (!error) logAction('CRIAR_REGISTRO', `Adicionou ganho: R$ ${data.valor || 0} - ${data.plataforma || data.descricao || ''}`, String(result?.id));
    return apiResponse<Earnings>(result, error);
  },
  async update(id: number, data: any) { 
    const { data: result, error } = await supabase.from('earnings').update(data).eq('id', id).select().single();
    if (!error) logAction('EDITAR_REGISTRO', `Editou ganho ID ${id}: R$ ${data.valor || ''}`, String(id));
    return apiResponse<Earnings>(result, error);
  },
  async delete(id: number) { 
    const { error } = await supabase.from('earnings').delete().eq('id', id);
    if (!error) logAction('EXCLUIR_REGISTRO', `Excluiu ganho ID ${id}`, String(id));
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
    if (!error) logAction('CRIAR_REGISTRO', `Adicionou despesa: R$ ${data.valor || 0} - ${data.categoria || data.descricao || ''}`, String(result?.id));
    return apiResponse<Expense>(result, error);
  },
  async update(id: number, data: any) { 
    const { data: result, error } = await supabase.from('expenses').update(data).eq('id', id).select().single();
    if (!error) logAction('EDITAR_REGISTRO', `Editou despesa ID ${id}: R$ ${data.valor || ''}`, String(id));
    return apiResponse<Expense>(result, error);
  },
  async delete(id: number) { 
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) logAction('EXCLUIR_REGISTRO', `Excluiu despesa ID ${id}`, String(id));
    return apiResponse<void>(null, error);
  },
};

export const maintenanceApi = {
  async getAll(filter?: DateFilter) { 
    let query = supabase.from('maintenance').select('*, veiculos(id, modelo, placa)').order('data', { ascending: false });
    const startDate = getFilterStartDate(filter);
    if (startDate) query = query.gte('data', startDate);
    const { data, error } = await query;
    return apiResponse<Maintenance[]>(data, error);
  },
  async create(data: any) { 
    const userId = await getMyUserId();
    const { data: result, error } = await supabase.from('maintenance').insert({ ...data, usuario_id: userId }).select('*, veiculos(id, modelo, placa)').single();
    if (!error) logAction('CRIAR_REGISTRO', `Adicionou manutenção: ${data.tipo || data.descricao || ''} - R$ ${data.valor || 0}`, String(result?.id));
    return apiResponse<Maintenance>(result, error);
  },
  async update(id: number, data: any) { 
    const { data: result, error } = await supabase.from('maintenance').update(data).eq('id', id).select('*, veiculos(id, modelo, placa)').single();
    if (!error) logAction('EDITAR_REGISTRO', `Editou manutenção ID ${id}: ${data.tipo || data.descricao || ''}`, String(id));
    return apiResponse<Maintenance>(result, error);
  },
  async delete(id: number) { 
    const { error } = await supabase.from('maintenance').delete().eq('id', id);
    if (!error) logAction('EXCLUIR_REGISTRO', `Excluiu manutenção ID ${id}`, String(id));
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
  async updateUserPassword(userId: string | number, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('auth_id, name')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      if (!userData.auth_id) {
        return { success: false, error: 'Usuário não possui auth_id' };
      }

      const { createAdminClient } = await import('./supabase');
      const supabaseAdmin = await createAdminClient();
      
      if (!supabaseAdmin) {
        return { success: false, error: 'Configuração de admin não disponível. Configure VITE_SUPABASE_SERVICE_KEY no arquivo .env' };
      }
      
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userData.auth_id, {
        password: newPassword
      });

      if (error) {
        if (error.message.includes('User not allowed')) {
          return { success: false, error: 'Não é possível alterar senha via API. Use o painel de autenticação do Supabase.' };
        }
        return { success: false, error: error.message };
      }

      return { success: true, data: { message: 'Senha atualizada com sucesso' } };
    } catch (err: any) {
      console.error('Update password error:', err);
      return { success: false, error: err.message || 'Erro ao atualizar senha' };
    }
  },

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
  async getAll(filters?: { userId?: string; action?: string; startDate?: string; endDate?: string; role?: string }) {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*, users:users!audit_logs_user_id_fkey(name, email, role)')
        .order('created_at', { ascending: false })
        .limit(500);

      if (filters?.userId && filters.userId !== 'admin' && filters.userId !== 'user') {
        query = query.eq('user_id', filters.userId);
      }
      
      if (filters?.role === 'admin') {
        query = query.eq('users.role', 'admin');
      } else if (filters?.role === 'user') {
        query = query.neq('users.role', 'admin');
      }
      
      if (filters?.action && filters.action !== 'all') {
        query = query.eq('action', filters.action);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return { success: true, data: (data || []) as any[] };
    } catch (e: any) {
      console.error('Error loading logs:', e);
      return { success: false, error: e.message };
    }
  },
  async create(acao: string, descricao: string) {
    const userId = await getMyUserId();
    const insertData: any = { 
      action: acao, 
      entity: descricao,
      metadata: { acao, descricao }
    };
    if (userId) insertData.user_id = userId;
    const { error } = await supabase.from('audit_logs').insert(insertData);
    return apiResponse<void>(null, error);
  },
  async getAvailableActions() {
    return [
      { value: 'all', label: 'Todas Ações' },
      { value: 'LOGIN', label: 'Login' },
      { value: 'LOGOUT', label: 'Logout' },
      { value: 'REGISTRO', label: 'Cadastro' },
      { value: 'CRIAR_REGISTRO', label: 'Criar Registro' },
      { value: 'EDITAR_REGISTRO', label: 'Editar Registro' },
      { value: 'EXCLUIR_REGISTRO', label: 'Excluir Registro' },
      { value: 'CRIAR_USUARIO', label: 'Criar Usuário' },
      { value: 'EDITAR_USUARIO', label: 'Editar Usuário' },
      { value: 'EXCLUIR_USUARIO', label: 'Excluir Usuário' },
      { value: 'REDEFINIR_SENHA', label: 'Redefinir Senha' },
      { value: 'EXPORTAR', label: 'Exportar' },
      { value: 'ALTERAR_PERFIL', label: 'Alterar Perfil' },
      { value: 'ALTERAR_PLANO', label: 'Alterar Plano' },
    ];
  }
};

// ============== METAS FINANCEIRAS ==============
export const goalsApi = {
  async getCurrent(monthYear?: string): Promise<ApiResponse<Goal>> {
    const mesAno = monthYear || new Date().toISOString().slice(0, 7);
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('mes_ano', mesAno)
      .single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as Goal };
  },

  async createOrUpdate(mesAno: string, valorMeta: number): Promise<ApiResponse<Goal>> {
    const userId = await getMyUserId();
    if (!userId) return { success: false, error: 'Usuário não autenticado' };

    const { data, error } = await supabase
      .from('goals')
      .upsert({
        usuario_id: userId,
        mes_ano: mesAno,
        valor_meta: valorMeta,
        valor_atual: 0
      }, { onConflict: 'usuario_id,mes_ano' })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as Goal };
  },

  async updateProgress(valorAtual: number): Promise<ApiResponse<void>> {
    const mesAno = new Date().toISOString().slice(0, 7);
    const userId = await getMyUserId();
    if (!userId) return { success: false, error: 'Usuário não autenticado' };

    const { error } = await supabase
      .from('goals')
      .update({ valor_atual: valorAtual })
      .eq('mes_ano', mesAno)
      .eq('usuario_id', userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  async calculateProgress(goal: Goal): Promise<GoalProgress> {
    const percentual = goal.valor_meta > 0 
      ? Math.min((goal.valor_atual / goal.valor_meta) * 100, 100) 
      : 0;
    
    const falta = Math.max(goal.valor_meta - goal.valor_atual, 0);
    const hoje = new Date();
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
    const diasRestantes = Math.max(ultimoDiaMes - hoje.getDate(), 0);
    const mediaDiaria = diasRestantes > 0 ? falta / diasRestantes : 0;

    let nivel: 'iniciante' | 'bronze' | 'prata' | 'ouro' | 'diamante';
    const pontos = goal.valor_atual;

    if (pontos >= 10000) nivel = 'diamante';
    else if (pontos >= 5000) nivel = 'ouro';
    else if (pontos >= 2000) nivel = 'prata';
    else if (pontos >= 500) nivel = 'bronze';
    else nivel = 'iniciante';

    return { percentual, falta, mediaDiaria, diasRestantes, nivel, pontos };
  }
};

// ============== INSIGHTS INTELIGENTES ==============
export const insightsApi = {
  async getInsights(): Promise<ApiResponse<Insight[]>> {
    try {
      const userId = await getMyUserId();
      if (!userId) return { success: false, error: 'Usuário não autenticado' };

      // Buscar dados dos últimos 30 dias
      const data30Dias = new Date();
      data30Dias.setDate(data30Dias.getDate() - 30);

      const [earningsRes, expensesRes] = await Promise.all([
        supabase.from('earnings').select('valor, tipo, data').gte('data', data30Dias.toISOString()),
        supabase.from('expenses').select('valor, tipo, data').gte('data', data30Dias.toISOString())
      ]);

      const earnings = earningsRes.data || [];
      const expenses = expensesRes.data || [];

      const insights: Insight[] = [];
      const totalGanhos = earnings.reduce((sum, e) => sum + (e.valor || 0), 0);
      const totalDespesas = expenses.reduce((sum, e) => sum + (e.valor || 0), 0);
      const lucro = totalGanhos - totalDespesas;

      // Insight de lucro
      if (lucro > 0) {
        insights.push({
          id: 'lucro-positivo',
          tipo: 'positivo',
          categoria: 'lucro',
          titulo: 'Lucro Positivo!',
          descricao: `Você teve R$ ${lucro.toFixed(2)} de lucro este mês. Continue assim!`,
          valor: lucro,
          prioridade: 'alta'
        });
      } else {
        insights.push({
          id: 'lucro-negativo',
          tipo: 'negativo',
          categoria: 'lucro',
          titulo: 'Atenção ao Lucro',
          descricao: `Seu lucro está negativo este mês. Revise suas despesas.`,
          valor: lucro,
          prioridade: 'alta'
        });
      }

      // Insight de gastos por categoria
      const gastosPorTipo: Record<string, number> = {};
      expenses.forEach(e => {
        gastosPorTipo[e.tipo] = (gastosPorTipo[e.tipo] || 0) + (e.valor || 0);
      });

      const maiorGasto = Object.entries(gastosPorTipo).sort((a, b) => b[1] - a[1])[0];
      if (maiorGasto) {
        insights.push({
          id: 'maior-gasto',
          tipo: 'neutro',
          categoria: 'gastos',
          titulo: 'Maior Gasto',
          descricao: `Sua maior despesa é ${maiorGasto[0]} com R$ ${maiorGasto[1].toFixed(2)}`,
          valor: maiorGasto[1],
          prioridade: 'media'
        });
      }

      // Melhor dia da semana
      const ganhosPorDia: Record<string, number> = {};
      earnings.forEach(e => {
        const diaSemana = new Date(e.data).toLocaleDateString('pt-BR', { weekday: 'short' });
        ganhosPorDia[diaSemana] = (ganhosPorDia[diaSemana] || 0) + (e.valor || 0);
      });

      const melhorDia = Object.entries(ganhosPorDia).sort((a, b) => b[1] - a[1])[0];
      if (melhorDia) {
        insights.push({
          id: 'melhor-dia',
          tipo: 'positivo',
          categoria: 'produtividade',
          titulo: 'Seu Melhor Dia',
          descricao: `Você ganha mais às ${melhorDia[0]}s (R$ ${melhorDia[1].toFixed(2)})`,
          valor: melhorDia[1],
          prioridade: 'baixa'
        });
      }

      return { success: true, data: insights };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
};

// ============== PRECIFICAÇÃO INTELIGENTE ==============
export const pricingApi = {
  async analyze(): Promise<ApiResponse<PricingAnalysis>> {
    try {
      const userId = await getMyUserId();
      if (!userId) return { success: false, error: 'Usuário não autenticado' };

      const data30Dias = new Date();
      data30Dias.setDate(data30Dias.getDate() - 30);

      const [earningsRes, expensesRes, kmRes] = await Promise.all([
        supabase.from('earnings').select('valor, tipo, data').gte('data', data30Dias.toISOString()),
        supabase.from('expenses').select('valor').eq('tipo', 'abastecimento'),
        supabase.from('km_registry').select('km_inicial, km_final').gte('data', data30Dias.toISOString())
      ]);

      const earnings = earningsRes.data || [];
      const expenses = expensesRes.data || [];
      const kmRegistries = kmRes.data || [];

      // Calcular KM total
      let kmTotal = 0;
      kmRegistries.forEach(k => {
        const km = (k.km_final || 0) - k.km_inicial;
        if (km > 0) kmTotal += km;
      });

      // Calcular custo por KM
      const custoAbastecimento = expenses.reduce((sum, e) => sum + (e.valor || 0), 0);
      const custoPorKm = kmTotal > 0 ? custoAbastecimento / kmTotal : 0;

      // Calcular ganhos totais de corridas
      const ganhosCorridas = earnings
        .filter(e => e.tipo === 'corrida')
        .reduce((sum, e) => sum + (e.valor || 0), 0);

      const totalCorridas = earnings.filter(e => e.tipo === 'corrida').length;
      const mediaValorCorrida = totalCorridas > 0 ? ganhosCorridas / totalCorridas : 0;
      const KMmediaCorrida = totalCorridas > 0 ? kmTotal / totalCorridas : 0;

      // Lucro por KM (considerando todas as despesas)
      const totalDespesas30Dias = expenses.reduce((sum, e) => sum + (e.valor || 0), 0);
      const lucroPorKm = kmTotal > 0 ? ((ganhosCorridas - totalDespesas30Dias) / kmTotal) : 0;

      // Valor ideal por KM (margem de 30% sobre custo)
      const valorIdealPorKm = custoPorKm * 1.3;

      // Verificar corridas com possível prejuízo
      const alertasPrejuizo: { tipo: string; valor: number; data: string }[] = [];
      
      // Se custo por KM for maior que valor ideal, gerar alerta
      if (valorIdealPorKm > custoPorKm * 1.5) {
        alertasPrejuizo.push({
          tipo: 'custo-alto',
          valor: custoPorKm,
          data: new Date().toISOString()
        });
      }

      return {
        success: true,
        data: {
          custoPorKm,
          lucroPorKm,
          mediaValorCorrida,
          KMmediaCorrida,
          totalCorridasLucro: totalCorridas,
          totalCorridasPrejuizo: alertasPrejuizo.length,
          valorIdealPorKm,
          alertasPrejuizo
        }
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
};

// ============== ASSINATURAS E PLANOS (Legacy - usar plansApi para novo sistema) ==============
// Re-export do novo sistema de planos
export { plansApi } from './plans';

export const subscriptionApi = {
  async getCurrent(): Promise<ApiResponse<any>> {
    try {
      const userId = await getMyUserId();
      if (!userId) return { success: false, error: 'Usuário não autenticado' };

      const { data, error } = await supabase
        .from('user_planos')
        .select('*, planos(*)')
        .eq('user_id', userId)
        .eq('status', 'ativo')
        .order('inicio_em', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return {
          success: true,
          data: {
            id: '0',
            user_id: userId,
            plano: 'free',
            status: 'ativo',
            inicio_em: new Date().toISOString()
          }
        };
      }

      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async upgrade(plano: PlanType): Promise<ApiResponse<any>> {
    try {
      const userId = await getMyUserId();
      if (!userId) return { success: false, error: 'Usuário não autenticado' };

      const { data, error } = await supabase.rpc('change_user_plan', {
        p_user_id: userId,
        p_new_plan_name: plano,
        p_periodo: 'mensal',
      });

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  getFeatures(): { id: string; nome: string; descricao: string; plano_free: boolean; plano_premium: boolean }[] {
    return [
      { id: 'dashboard', nome: 'Dashboard', descricao: 'Visualização básica do dashboard', plano_free: true, plano_premium: true },
      { id: 'metas', nome: 'Metas Financeiras', descricao: 'Defina e acompanhe suas metas mensais', plano_free: true, plano_premium: true },
      { id: 'relatorios', nome: 'Relatórios Detalhados', descricao: 'Relatórios completos com gráficos', plano_free: false, plano_premium: true },
      { id: 'insights', nome: 'Insights Inteligentes', descricao: 'Análise automática de seus dados', plano_free: false, plano_premium: true },
      { id: 'alertas', nome: 'Alertas Avançados', descricao: 'Alertas personalizados e priorizados', plano_free: false, plano_premium: true },
      { id: 'precificacao', nome: 'Precificação Inteligente', descricao: 'Análise de custo por KM', plano_free: false, plano_premium: true },
      { id: 'export', nome: 'Exportação de Dados', descricao: 'Exporte dados em PDF/Excel', plano_free: false, plano_premium: true },
      { id: 'multiple_users', nome: 'Múltiplos Usuários', descricao: 'Gerencie vários motoristas', plano_free: false, plano_premium: true },
    ];
  },

  hasAccess(subscription: any, featureId: string): boolean {
    const features = subscriptionApi.getFeatures();
    const feature = features.find(f => f.id === featureId);
    if (!feature) return false;
    const plano = subscription?.planos?.nome || subscription?.plano || 'free';
    return plano === 'premium' || plano === 'pro' ? feature.plano_premium : feature.plano_free;
  }
};