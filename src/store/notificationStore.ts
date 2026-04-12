import { create } from 'zustand';
import { supabase, createAdminClient } from '../api/supabase';
import toast from 'react-hot-toast';

// ================================================
// NOTIFICATION TYPES
// ================================================
export type NotificationType = 'info' | 'alerta' | 'sucesso';
export type TargetType = 'all' | 'user';

export interface Notification {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: NotificationType;
  target_type: TargetType;
  target_id: string | null;
  admin_id: string | null;
  criada_em: string;
}

// ================================================
// READ TRACKING (localStorage per user)
// ================================================
function getReadIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`notif_read_${userId}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveReadIds(userId: string, ids: Set<string>) {
  localStorage.setItem(`notif_read_${userId}`, JSON.stringify([...ids]));
}

// ================================================
// STORE
// ================================================
interface NotificationState {
  notifications: Notification[];
  readIds: Set<string>;
  userId: string | null;
  userCreatedAt: string | null;
  isLoading: boolean;
  soundEnabled: boolean;

  // Computed
  unreadCount: () => number;

  // Actions
  init: (userId: string, userCreatedAt?: string) => void;
  fetchNotifications: () => Promise<void>;
  syncReadIds: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  toggleSound: () => void;
  cleanup: () => void;

  // Admin actions
  sendNotification: (data: { titulo: string; mensagem: string; tipo: NotificationType; targetType: TargetType; targetId?: string }) => Promise<boolean>;
}

// Realtime subscription reference
let realtimeSub: any = null;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  readIds: new Set<string>(),
  userId: null,
  userCreatedAt: null,
  isLoading: false,
  soundEnabled: localStorage.getItem('notif_sound') !== 'off',

  unreadCount: () => {
    const { notifications, readIds } = get();
    return notifications.filter(n => !readIds.has(n.id)).length;
  },

  init: (userId: string, userCreatedAt?: string) => {
    // Start with localStorage reads for instant UI, then merge DB reads
    const localReadIds = getReadIds(userId);
    set({ userId, userCreatedAt: userCreatedAt || null, readIds: localReadIds });
    get().fetchNotifications();
    // Also fetch reads from DB and merge
    get().syncReadIds();

    // Subscribe to realtime
    if (realtimeSub) {
      supabase.removeChannel(realtimeSub);
    }

    realtimeSub = supabase
      .channel('notificacoes-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes' },
        (payload: any) => {
          const newNotif = payload.new as Notification;
          const { userId, notifications, soundEnabled } = get();

          // Check if this notification is for the current user
          if (newNotif.target_type === 'all' || newNotif.target_id === userId) {
            // Avoid duplicates
            if (!notifications.find(n => n.id === newNotif.id)) {
              set({ notifications: [newNotif, ...notifications] });

              // Toast notification
              const icon = newNotif.tipo === 'sucesso' ? '✅' : newNotif.tipo === 'alerta' ? '⚠️' : 'ℹ️';
              toast(newNotif.titulo, {
                icon,
                duration: 4000,
                style: {
                  background: '#0a0a0a',
                  color: '#fff',
                  border: '1px solid rgba(57,255,20,0.2)',
                },
              });

              // Play sound
              if (soundEnabled) {
                try {
                  const audio = new Audio('data:audio/wav;base64,UklGRlQFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTAFAACAgICAgICAgICAgICAgICA');
                  audio.volume = 0.3;
                  audio.play().catch(() => {});
                } catch {}
              }
            }
          }
        }
      )
      .subscribe();
  },

  syncReadIds: async () => {
    const { userId, readIds } = get();
    if (!userId) return;
    try {
      const { data } = await supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', userId);
      if (data && data.length > 0) {
        const merged = new Set(readIds);
        data.forEach((r: any) => merged.add(r.notification_id));
        saveReadIds(userId, merged);
        set({ readIds: merged });
      }
    } catch {}
  },

  fetchNotifications: async () => {
    const { userId, userCreatedAt } = get();
    if (!userId) return;

    set({ isLoading: true });
    try {
      let query = supabase
        .from('notificacoes')
        .select('*')
        .or(`target_type.eq.all,target_id.eq.${userId}`)
        .order('criada_em', { ascending: false })
        .limit(50);

      // Only show notifications from after user registration
      if (userCreatedAt) {
        query = query.gte('criada_em', userCreatedAt);
      }

      const { data, error } = await query;

      if (!error && data) {
        set({ notifications: data });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: (id: string) => {
    const { userId, readIds } = get();
    if (!userId) return;
    const newReadIds = new Set(readIds);
    newReadIds.add(id);
    saveReadIds(userId, newReadIds);
    set({ readIds: newReadIds });
    // Persist to DB (fire-and-forget)
    supabase.from('notification_reads').upsert(
      { notification_id: id, user_id: userId },
      { onConflict: 'notification_id,user_id' }
    ).then(() => {});
  },

  markAllAsRead: () => {
    const { userId, notifications, readIds } = get();
    if (!userId) return;
    const newReadIds = new Set(readIds);
    const newIds = notifications.filter(n => !readIds.has(n.id)).map(n => n.id);
    notifications.forEach(n => newReadIds.add(n.id));
    saveReadIds(userId, newReadIds);
    set({ readIds: newReadIds });
    // Persist to DB (fire-and-forget)
    if (newIds.length > 0) {
      const rows = newIds.map(nid => ({ notification_id: nid, user_id: userId }));
      supabase.from('notification_reads').upsert(
        rows,
        { onConflict: 'notification_id,user_id' }
      ).then(() => {});
    }
  },

  toggleSound: () => {
    const { soundEnabled } = get();
    const newVal = !soundEnabled;
    localStorage.setItem('notif_sound', newVal ? 'on' : 'off');
    set({ soundEnabled: newVal });
  },

  cleanup: () => {
    if (realtimeSub) {
      supabase.removeChannel(realtimeSub);
      realtimeSub = null;
    }
    set({ notifications: [], userId: null, userCreatedAt: null, readIds: new Set() });
  },

  sendNotification: async ({ titulo, mensagem, tipo, targetType, targetId }) => {
    try {
      const admin = await createAdminClient();
      const { error } = await admin.from('notificacoes').insert({
        titulo,
        mensagem,
        tipo,
        target_type: targetType,
        target_id: targetType === 'user' ? targetId : null,
        admin_id: get().userId,
      });
      if (error) {
        console.error('Error sending notification:', error);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },
}));
