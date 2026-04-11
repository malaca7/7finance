import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  User as UserIcon,
  ArrowLeft,
  Calendar,
  MessageCircle,
  UserPlus,
  Shield,
  Share2,
  MoreHorizontal,
  Copy,
  Check,
  MapPin,
  Briefcase,
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui';
import { FollowButton } from '../components/social/FollowButton';
import { FollowCounts } from '../components/social/FollowCounts';
import { FollowSuggestions } from '../components/social/FollowSuggestions';
import { useFollowStore } from '../store/followStore';
import { useAppStore } from '../store';
import { usePlanAccess } from '../hooks/usePlanAccess';
import { PlanBadge } from '../components/plans/PlanBadge';
import { followsApi } from '../api/follows';
import type { User, FollowCounts as FollowCountsType } from '../types';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

type ProfileTab = 'about' | 'activity';

export function UserProfilePage() {
  const { userId, username: routeUsername } = useParams<{ userId?: string; username?: string }>();
  const navigate = useNavigate();
  const { user: me } = useAppStore();
  const { planName } = usePlanAccess();
  const { checkIsFollowing, followingMap, followers, fetchFollowers } = useFollowStore();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profileCounts, setProfileCounts] = useState<FollowCountsType>({ followers_count: 0, following_count: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ProfileTab>('about');
  const [copied, setCopied] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(userId || null);

  const isMe = resolvedUserId === me?.id;

  useEffect(() => {
    if (!userId && !routeUsername) return;
    loadProfile();
  }, [userId, routeUsername]);

  const loadProfile = async () => {
    setLoading(true);
    let res;
    if (routeUsername) {
      // Load by username (/perfil/:username)
      res = await followsApi.getUserProfileByUsername(routeUsername);
    } else if (userId) {
      // Load by ID (/user/:userId)
      res = await followsApi.getUserProfile(userId);
    } else {
      setLoading(false);
      return;
    }

    if (res.success && res.data) {
      setProfileUser(res.data.user);
      setProfileCounts(res.data.counts);
      const uid = res.data.user.id;
      setResolvedUserId(uid);
      if (uid !== me?.id) await checkIsFollowing(uid);
      await fetchFollowers(uid);
    }
    setLoading(false);
  };

  // Mutual followers (people I follow that also follow this user)
  const mutualFollowers = useMemo(() => {
    if (isMe || !resolvedUserId) return [];
    const userFollowers = followers[resolvedUserId] || [];
    return userFollowers
      .filter((f) => f.user?.id && followingMap[f.user.id])
      .slice(0, 3);
  }, [followers, followingMap, resolvedUserId, isMe]);

  const copyProfileLink = () => {
    const profileUrl = profileUser?.userlink
      ? `${window.location.origin}/perfil/${profileUser.userlink}`
      : window.location.href;
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!profileUser) {
    return (
      <MainLayout>
        <div className="text-center py-24 space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-premium-darkGray/50 flex items-center justify-center">
            <UserIcon className="w-10 h-10 text-neutral/30" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg">Usuário não encontrado</p>
            <p className="text-neutral text-sm mt-1">Este perfil pode ter sido removido ou não existe.</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-primary text-sm hover:underline"
          >
            Voltar
          </button>
        </div>
      </MainLayout>
    );
  }

  const displayName = profileUser.nome || profileUser.name || 'Usuário';
  const avatar = profileUser.foto_url || profileUser.avatar_url;
  const username = profileUser.username;
  const bio = profileUser.bio;
  const joinDate = profileUser.created_at
    ? new Date(profileUser.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : null;
  const roleBadge = profileUser.role === 'admin' ? 'Administrador' : 'Motorista';
  const isFollowing = followingMap[resolvedUserId!] ?? false;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-5 pb-24 lg:pb-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-neutral hover:text-white hover:bg-premium-darkGray rounded-full transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white truncate">{displayName}</h1>
              {username && <p className="text-xs text-neutral">@{username}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={copyProfileLink}
              className="p-2 text-neutral hover:text-white hover:bg-premium-darkGray rounded-full transition-all"
              title="Copiar link do perfil"
            >
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMore(!showMore)}
                className="p-2 text-neutral hover:text-white hover:bg-premium-darkGray rounded-full transition-all"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showMore && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-premium-dark border border-white/10 rounded-2xl shadow-xl overflow-hidden">
                    <button
                      onClick={() => { copyProfileLink(); setShowMore(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <Copy className="w-4 h-4" /> Copiar link
                    </button>
                    {!isMe && (
                      <button
                        onClick={() => setShowMore(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <Shield className="w-4 h-4" /> Reportar
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="relative overflow-hidden !p-0">
          {/* Banner Gradient */}
          <div className="h-28 sm:h-32 bg-gradient-to-br from-primary/30 via-secondary/20 to-primary/10 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(57,255,20,0.15),transparent_60%)]" />
          </div>

          <div className="relative px-5 pb-5">
            {/* Avatar - overlapping banner */}
            <div className="-mt-14 flex items-end justify-between">
              <div className="w-28 h-28 rounded-full bg-premium-black border-4 border-premium-black flex items-center justify-center overflow-hidden shadow-xl ring-2 ring-primary/20">
                {avatar ? (
                  <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pb-1">
                {isMe ? (
                  <Link
                    to="/perfil"
                    className="px-4 py-2 text-sm font-semibold text-white bg-premium-darkGray hover:bg-premium-gray border border-white/10 rounded-full transition-all"
                  >
                    Editar perfil
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/chat')}
                      className="p-2.5 rounded-full border border-white/10 bg-premium-darkGray hover:bg-premium-gray text-neutral hover:text-white transition-all"
                      title="Enviar mensagem"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <FollowButton targetUserId={resolvedUserId!} />
                  </>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white">{displayName}</h2>
                {profileUser.role === 'admin' && (
                  <div className="p-1 bg-blue-500/20 rounded-full" title="Administrador verificado">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                )}
              </div>

              {username && (
                <p className="text-sm text-neutral">@{username}</p>
              )}

              {bio && (
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{bio}</p>
              )}

              {/* Metadata Row */}
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-neutral">
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {roleBadge}
                </span>
                {joinDate && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Desde {joinDate}
                  </span>
                )}
              </div>

              {/* Follow Counts - inline style */}
              <div className="flex items-center gap-4 pt-1">
                <button
                  onClick={() => navigate(`/user/${resolvedUserId}/follows?tab=following`)}
                  className="group text-sm"
                >
                  <span className="font-bold text-white group-hover:text-primary transition-colors">
                    {profileCounts.following_count}
                  </span>{' '}
                  <span className="text-neutral group-hover:text-neutral/80">seguindo</span>
                </button>
                <button
                  onClick={() => navigate(`/user/${resolvedUserId}/follows?tab=followers`)}
                  className="group text-sm"
                >
                  <span className="font-bold text-white group-hover:text-primary transition-colors">
                    {profileCounts.followers_count}
                  </span>{' '}
                  <span className="text-neutral group-hover:text-neutral/80">seguidores</span>
                </button>
              </div>

              {/* Mutual Followers */}
              {!isMe && mutualFollowers.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex -space-x-2">
                    {mutualFollowers.map((f) => (
                      <div
                        key={f.id}
                        className="w-6 h-6 rounded-full bg-premium-darkGray border-2 border-premium-black overflow-hidden"
                      >
                        {f.user?.foto_url || f.user?.avatar_url ? (
                          <img
                            src={f.user.foto_url || f.user.avatar_url || ''}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                            {(f.user?.nome || f.user?.name || '?').charAt(0)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-neutral">
                    Seguido por{' '}
                    <span className="text-white font-medium">
                      {mutualFollowers[0]?.user?.nome || mutualFollowers[0]?.user?.name}
                    </span>
                    {mutualFollowers.length > 1 && (
                      <> e outros <span className="text-white font-medium">{mutualFollowers.length - 1}</span></>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 bg-premium-darkGray/50 rounded-2xl p-1">
          {([
            { key: 'about' as ProfileTab, label: 'Sobre' },
            { key: 'activity' as ProfileTab, label: 'Atividade' },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                'flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all',
                tab === t.key
                  ? 'bg-primary text-black shadow-glow-green'
                  : 'text-neutral hover:text-white',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'about' && (
          <div className="space-y-5">
            {/* Info Card */}
            <Card>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Informações</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-4 h-4 text-neutral mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-white font-medium">{roleBadge}</p>
                    <p className="text-xs text-neutral">Função na plataforma</p>
                  </div>
                </div>
                {joinDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-neutral mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium">Desde {joinDate}</p>
                      <p className="text-xs text-neutral">Data de cadastro</p>
                    </div>
                  </div>
                )}
                {bio && (
                  <div className="flex items-start gap-3">
                    <UserIcon className="w-4 h-4 text-neutral mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-300 leading-relaxed">{bio}</p>
                      <p className="text-xs text-neutral">Bio</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Suggestions (only for other profiles) */}
            {!isMe && <FollowSuggestions />}
          </div>
        )}

        {tab === 'activity' && (
          <Card>
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto rounded-full bg-premium-darkGray/50 flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-neutral/40" />
              </div>
              <p className="text-white font-semibold">Em breve</p>
              <p className="text-sm text-neutral mt-1">
                O histórico de atividades estará disponível em uma atualização futura.
              </p>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
