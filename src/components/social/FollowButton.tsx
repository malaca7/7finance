import { useState } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useFollowStore } from '../../store/followStore';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface FollowButtonProps {
  targetUserId: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function FollowButton({ targetUserId, className, size = 'md' }: FollowButtonProps) {
  const { followingMap, follow, unfollow } = useFollowStore();
  const [loading, setLoading] = useState(false);
  const isFollowing = followingMap[targetUserId] ?? false;

  const handleClick = async () => {
    setLoading(true);
    try {
      if (isFollowing) {
        const ok = await unfollow(targetUserId);
        if (ok) toast.success('Deixou de seguir');
        else toast.error('Erro ao deixar de seguir');
      } else {
        const ok = await follow(targetUserId);
        if (ok) toast.success('Seguindo!');
        else toast.error('Erro ao seguir');
      }
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = size === 'sm'
    ? 'px-3 py-1.5 text-xs gap-1.5'
    : 'px-5 py-2.5 text-sm gap-2';

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={clsx(
        'inline-flex items-center font-semibold rounded-full transition-all duration-200 border',
        isFollowing
          ? 'bg-transparent border-primary/30 text-primary hover:border-negative/50 hover:text-negative hover:bg-negative/10'
          : 'bg-gradient-to-r from-primary to-secondary text-black border-transparent hover:shadow-glow-green hover:scale-[1.02]',
        loading && 'opacity-60 cursor-wait',
        sizeClasses,
        className,
      )}
    >
      {loading ? (
        <Loader2 className={clsx('animate-spin', size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />
      ) : isFollowing ? (
        <UserCheck className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      ) : (
        <UserPlus className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      )}
      {isFollowing ? 'Seguindo' : 'Seguir'}
    </button>
  );
}
