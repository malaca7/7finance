import { useEffect } from 'react';
import { useFollowStore } from '../../store/followStore';
import { useAppStore } from '../../store';
import { clsx } from 'clsx';

interface FollowCountsProps {
  userId: string;
  onClickFollowers?: () => void;
  onClickFollowing?: () => void;
}

export function FollowCounts({ userId, onClickFollowers, onClickFollowing }: FollowCountsProps) {
  const { counts, fetchCounts } = useFollowStore();
  const c = counts[userId] || { followers_count: 0, following_count: 0 };

  useEffect(() => {
    fetchCounts(userId);
  }, [userId]);

  return (
    <div className="flex items-center gap-6">
      <button
        onClick={onClickFollowers}
        className={clsx(
          'flex flex-col items-center gap-0.5 transition-colors',
          onClickFollowers ? 'hover:text-primary cursor-pointer' : 'cursor-default',
        )}
      >
        <span className="text-xl font-bold text-white">{c.followers_count}</span>
        <span className="text-xs text-neutral">Seguidores</span>
      </button>

      <div className="w-px h-8 bg-white/10" />

      <button
        onClick={onClickFollowing}
        className={clsx(
          'flex flex-col items-center gap-0.5 transition-colors',
          onClickFollowing ? 'hover:text-primary cursor-pointer' : 'cursor-default',
        )}
      >
        <span className="text-xl font-bold text-white">{c.following_count}</span>
        <span className="text-xs text-neutral">Seguindo</span>
      </button>
    </div>
  );
}
