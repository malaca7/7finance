import { supabase, createAdminClient } from './supabase';
import type { ApiResponse, Follow, FollowCounts, FollowWithUser, User } from '../types';

// Cache do users.id
let _cachedUserId: string | null = null;

async function getMyUserId(): Promise<string | null> {
  if (_cachedUserId) return _cachedUserId;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
  _cachedUserId = data?.id || null;
  return _cachedUserId;
}

supabase.auth.onAuthStateChange(() => { _cachedUserId = null; });

function adaptUser(raw: any): FollowWithUser['user'] {
  if (!raw) return raw;
  return {
    ...raw,
    nome: raw.name || '',
    foto_url: raw.avatar_url || '',
  };
}

export const followsApi = {
  /**
   * Seguir um usuário
   */
  async follow(targetUserId: string): Promise<ApiResponse<Follow>> {
    const myId = await getMyUserId();
    if (!myId) return { success: false, error: 'Não autenticado' };
    if (myId === targetUserId) return { success: false, error: 'Não é possível seguir a si mesmo' };

    const { data, error } = await supabase
      .from('follows')
      .insert({ follower_id: myId, following_id: targetUserId })
      .select()
      .single();

    if (error) {
      // Duplicidade = já segue, retornar sucesso idempotente
      if (error.code === '23505') {
        return { success: true, data: undefined as any, message: 'Já segue este usuário' };
      }
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  /**
   * Deixar de seguir um usuário
   */
  async unfollow(targetUserId: string): Promise<ApiResponse<void>> {
    const myId = await getMyUserId();
    if (!myId) return { success: false, error: 'Não autenticado' };

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', myId)
      .eq('following_id', targetUserId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  /**
   * Verificar se eu sigo um usuário
   */
  async isFollowing(targetUserId: string): Promise<boolean> {
    const myId = await getMyUserId();
    if (!myId) return false;

    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', myId)
      .eq('following_id', targetUserId)
      .maybeSingle();

    return !error && !!data;
  },

  /**
   * Obter contadores de seguidores/seguindo
   */
  async getCounts(userId: string): Promise<ApiResponse<FollowCounts>> {
    const { data, error } = await supabase.rpc('get_follow_counts', { target_user_id: userId });
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as FollowCounts };
  },

  /**
   * Listar seguidores de um usuário (quem segue ele)
   */
  async getFollowers(userId: string): Promise<ApiResponse<FollowWithUser[]>> {
    const { data, error } = await supabase
      .from('follows')
      .select('*, user:follower_id(id, name, avatar_url, role)')
      .eq('following_id', userId)
      .order('criada_em', { ascending: false });

    if (error) return { success: false, error: error.message };

    const adapted = (data || []).map((f: any) => ({
      ...f,
      user: adaptUser(f.user),
    }));

    return { success: true, data: adapted };
  },

  /**
   * Listar quem um usuário segue
   */
  async getFollowing(userId: string): Promise<ApiResponse<FollowWithUser[]>> {
    const { data, error } = await supabase
      .from('follows')
      .select('*, user:following_id(id, name, avatar_url, role)')
      .eq('follower_id', userId)
      .order('criada_em', { ascending: false });

    if (error) return { success: false, error: error.message };

    const adapted = (data || []).map((f: any) => ({
      ...f,
      user: adaptUser(f.user),
    }));

    return { success: true, data: adapted };
  },

  /**
   * Sugestões de usuários para seguir
   */
  async getSuggestions(limit: number = 10): Promise<ApiResponse<User[]>> {
    const myId = await getMyUserId();
    if (!myId) return { success: false, error: 'Não autenticado' };

    const { data, error } = await supabase.rpc('get_follow_suggestions', {
      my_user_id: myId,
      lim: limit,
    });

    if (error) return { success: false, error: error.message };

    const adapted = (data || []).map((u: any) => ({
      ...u,
      nome: u.name || '',
      foto_url: u.avatar_url || '',
    }));

    return { success: true, data: adapted };
  },

  /**
   * Obter perfil público de um usuário com contadores e status de follow
   */
  async getUserProfile(userId: string): Promise<ApiResponse<{ user: User; counts: FollowCounts; isFollowing: boolean }>> {
    const [userRes, countsRes, following] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      this.getCounts(userId),
      this.isFollowing(userId),
    ]);

    if (userRes.error) return { success: false, error: userRes.error.message };

    const user = {
      ...userRes.data,
      nome: userRes.data.name || '',
      foto_url: userRes.data.avatar_url || '',
    } as User;

    return {
      success: true,
      data: {
        user,
        counts: countsRes.data || { followers_count: 0, following_count: 0 },
        isFollowing: following,
      },
    };
  },

  async getUserProfileByUsername(userlink: string): Promise<ApiResponse<{ user: User; counts: FollowCounts; isFollowing: boolean }>> {
    // Use admin client to bypass RLS (public profiles)
    const admin = await createAdminClient();
    const { data: userData, error } = await admin
      .from('users')
      .select('*')
      .eq('userlink', userlink)
      .single();

    if (error || !userData) return { success: false, error: 'Usuário não encontrado' };

    const userId = userData.id;
    const [countsRes, following] = await Promise.all([
      this.getCounts(userId),
      this.isFollowing(userId),
    ]);

    const user = {
      ...userData,
      nome: userData.name || '',
      foto_url: userData.avatar_url || '',
    } as User;

    return {
      success: true,
      data: {
        user,
        counts: countsRes.data || { followers_count: 0, following_count: 0 },
        isFollowing: following,
      },
    };
  },
};
