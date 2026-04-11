import { useEffect, useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import { useFollowStore } from '../../store/followStore';
import { FollowButton } from './FollowButton';
import { useAppStore } from '../../store';

export function FollowSuggestions() {
  const { suggestions, fetchSuggestions } = useFollowStore();
  const { user } = useAppStore();

  useEffect(() => {
    if (user?.id) fetchSuggestions();
  }, [user?.id]);

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-neutral uppercase tracking-wider">
        Sugestões para você
      </h3>
      <div className="space-y-2">
        {suggestions.slice(0, 5).map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between p-3 bg-premium-darkGray/50 rounded-2xl hover:bg-primary/5 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-premium-dark border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                {u.avatar_url || u.foto_url ? (
                  <img
                    src={u.avatar_url || u.foto_url}
                    alt={u.nome || u.name || ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-5 h-5 text-neutral" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {u.nome || u.name || 'Usuário'}
                </p>
                <p className="text-xs text-neutral truncate">
                  {u.role === 'admin' ? 'Admin' : 'Motorista'}
                </p>
              </div>
            </div>
            <FollowButton targetUserId={u.id} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
