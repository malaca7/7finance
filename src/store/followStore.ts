import { create } from 'zustand';
import { followsApi } from '../api/follows';
import type { FollowCounts, FollowWithUser, User } from '../types';

interface FollowState {
  // Dados por userId
  counts: Record<string, FollowCounts>;
  followingMap: Record<string, boolean>; // userId -> true se eu sigo
  followers: Record<string, FollowWithUser[]>;
  following: Record<string, FollowWithUser[]>;
  suggestions: User[];
  isLoading: boolean;

  // Actions
  fetchCounts: (userId: string) => Promise<void>;
  checkIsFollowing: (userId: string) => Promise<void>;
  follow: (targetUserId: string) => Promise<boolean>;
  unfollow: (targetUserId: string) => Promise<boolean>;
  fetchFollowers: (userId: string) => Promise<void>;
  fetchFollowing: (userId: string) => Promise<void>;
  fetchSuggestions: () => Promise<void>;
  reset: () => void;
}

export const useFollowStore = create<FollowState>((set, get) => ({
  counts: {},
  followingMap: {},
  followers: {},
  following: {},
  suggestions: [],
  isLoading: false,

  fetchCounts: async (userId) => {
    const res = await followsApi.getCounts(userId);
    if (res.success && res.data) {
      set((s) => ({ counts: { ...s.counts, [userId]: res.data! } }));
    }
  },

  checkIsFollowing: async (userId) => {
    const isF = await followsApi.isFollowing(userId);
    set((s) => ({ followingMap: { ...s.followingMap, [userId]: isF } }));
  },

  follow: async (targetUserId) => {
    // Atualização otimista
    set((s) => {
      const prev = s.counts[targetUserId] || { followers_count: 0, following_count: 0 };
      return {
        followingMap: { ...s.followingMap, [targetUserId]: true },
        counts: {
          ...s.counts,
          [targetUserId]: { ...prev, followers_count: prev.followers_count + 1 },
        },
      };
    });

    const res = await followsApi.follow(targetUserId);
    if (!res.success) {
      // Reverter otimismo
      set((s) => {
        const prev = s.counts[targetUserId] || { followers_count: 0, following_count: 0 };
        return {
          followingMap: { ...s.followingMap, [targetUserId]: false },
          counts: {
            ...s.counts,
            [targetUserId]: { ...prev, followers_count: Math.max(0, prev.followers_count - 1) },
          },
        };
      });
      return false;
    }

    // Remove da lista de sugestões
    set((s) => ({
      suggestions: s.suggestions.filter((u) => u.id !== targetUserId),
    }));

    return true;
  },

  unfollow: async (targetUserId) => {
    // Atualização otimista
    set((s) => {
      const prev = s.counts[targetUserId] || { followers_count: 0, following_count: 0 };
      return {
        followingMap: { ...s.followingMap, [targetUserId]: false },
        counts: {
          ...s.counts,
          [targetUserId]: { ...prev, followers_count: Math.max(0, prev.followers_count - 1) },
        },
      };
    });

    const res = await followsApi.unfollow(targetUserId);
    if (!res.success) {
      // Reverter otimismo
      set((s) => {
        const prev = s.counts[targetUserId] || { followers_count: 0, following_count: 0 };
        return {
          followingMap: { ...s.followingMap, [targetUserId]: true },
          counts: {
            ...s.counts,
            [targetUserId]: { ...prev, followers_count: prev.followers_count + 1 },
          },
        };
      });
      return false;
    }
    return true;
  },

  fetchFollowers: async (userId) => {
    set({ isLoading: true });
    const res = await followsApi.getFollowers(userId);
    if (res.success && res.data) {
      set((s) => ({ followers: { ...s.followers, [userId]: res.data! }, isLoading: false }));
    } else {
      set({ isLoading: false });
    }
  },

  fetchFollowing: async (userId) => {
    set({ isLoading: true });
    const res = await followsApi.getFollowing(userId);
    if (res.success && res.data) {
      set((s) => ({ following: { ...s.following, [userId]: res.data! }, isLoading: false }));
    } else {
      set({ isLoading: false });
    }
  },

  fetchSuggestions: async () => {
    const res = await followsApi.getSuggestions(10);
    if (res.success && res.data) {
      set({ suggestions: res.data });
    }
  },

  reset: () => {
    set({ counts: {}, followingMap: {}, followers: {}, following: {}, suggestions: [], isLoading: false });
  },
}));
