import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User as UserIcon, ArrowLeft, Users } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui';
import { FollowButton } from '../components/social/FollowButton';
import { useFollowStore } from '../store/followStore';
import { useAppStore } from '../store';
import { clsx } from 'clsx';

type Tab = 'followers' | 'following';

export function FollowListPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const { followers, following, fetchFollowers, fetchFollowing, checkIsFollowing, isLoading } = useFollowStore();

  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = (searchParams.get('tab') as Tab) || 'followers';
  const [tab, setTab] = useState<Tab>(initialTab);

  const targetId = userId || user?.id;

  useEffect(() => {
    if (!targetId) return;
    fetchFollowers(targetId);
    fetchFollowing(targetId);
  }, [targetId]);

  const followersList = followers[targetId || ''] || [];
  const followingList = following[targetId || ''] || [];

  // Check follow status for each user displayed
  useEffect(() => {
    const list = tab === 'followers' ? followersList : followingList;
    list.forEach((f) => {
      if (f.user?.id && f.user.id !== user?.id) {
        checkIsFollowing(f.user.id);
      }
    });
  }, [tab, followersList, followingList]);

  const currentList = tab === 'followers' ? followersList : followingList;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-neutral hover:text-white hover:bg-premium-darkGray rounded-full transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Conexões</h1>
            <p className="text-sm text-neutral">Seguidores e seguindo</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-premium-darkGray/50 rounded-2xl p-1">
          <button
            onClick={() => setTab('followers')}
            className={clsx(
              'flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all',
              tab === 'followers'
                ? 'bg-primary text-black shadow-glow-green'
                : 'text-neutral hover:text-white',
            )}
          >
            Seguidores ({followersList.length})
          </button>
          <button
            onClick={() => setTab('following')}
            className={clsx(
              'flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all',
              tab === 'following'
                ? 'bg-primary text-black shadow-glow-green'
                : 'text-neutral hover:text-white',
            )}
          >
            Seguindo ({followingList.length})
          </button>
        </div>

        {/* List */}
        <Card>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-3 text-neutral/50" />
              <p className="text-neutral font-medium">
                {tab === 'followers' ? 'Nenhum seguidor ainda' : 'Não segue ninguém ainda'}
              </p>
              <p className="text-sm text-neutral/60 mt-1">
                {tab === 'followers'
                  ? 'Quando alguém seguir, aparecerá aqui'
                  : 'Explore sugestões de perfis para seguir'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-primary/5 transition-colors"
                >
                  <Link to={`/user/${item.user?.id}`} className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-premium-dark border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {item.user?.avatar_url || item.user?.foto_url ? (
                        <img
                          src={item.user.avatar_url || item.user.foto_url}
                          alt={item.user.nome || item.user.name || ''}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-5 h-5 text-neutral" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate hover:text-primary transition-colors">
                        {item.user?.nome || item.user?.name || 'Usuário'}
                      </p>
                      <p className="text-xs text-neutral">
                        {item.user?.role === 'admin' ? 'Administrador' : 'Motorista'}
                      </p>
                    </div>
                  </Link>

                  {/* Não mostrar botão para si mesmo */}
                  {item.user?.id !== user?.id && (
                    <FollowButton targetUserId={item.user?.id || ''} size="sm" />
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
