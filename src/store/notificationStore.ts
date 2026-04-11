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
  isLoading: boolean;
  soundEnabled: boolean;

  // Computed
  unreadCount: () => number;

  // Actions
  init: (userId: string) => void;
  fetchNotifications: () => Promise<void>;
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
  isLoading: false,
  soundEnabled: localStorage.getItem('notif_sound') !== 'off',

  unreadCount: () => {
    const { notifications, readIds } = get();
    return notifications.filter(n => !readIds.has(n.id)).length;
  },

  init: (userId: string) => {
    const readIds = getReadIds(userId);
    set({ userId, readIds });
    get().fetchNotifications();

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

  fetchNotifications: async () => {
    const { userId } = get();
    if (!userId) return;

    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .or(`target_type.eq.all,target_id.eq.${userId}`)
        .order('criada_em', { ascending: false })
        .limit(50);

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
  },

  markAllAsRead: () => {
    const { userId, notifications, readIds } = get();
    if (!userId) return;
    const newReadIds = new Set(readIds);
    notifications.forEach(n => newReadIds.add(n.id));
    saveReadIds(userId, newReadIds);
    set({ readIds: newReadIds });
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
    set({ notifications: [], userId: null, readIds: new Set() });
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
