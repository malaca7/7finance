import { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Save, 
  Hash,
  Crop as CropIcon,
  Shield,
  Edit2,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Link as LinkIcon,
  AtSign,
  FileText,
  ExternalLink,
  Check,
  AlertCircle,
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Select, Modal } from '../components/ui';
import { useAppStore } from '../store';
import { usersApi } from '../api';
import { supabase } from '../api/supabase';
import { PlanBadge } from '../components/plans';
import { usePlanAccess } from '../hooks/usePlanAccess';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import type { DriverType } from '../types';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  
  // Crop state
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    tipo: 'app' as DriverType,
    foto_url: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password change state
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [senhaLoading, setSenhaLoading] = useState(false);
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);

  // Public profile state
  const [publicUsername, setPublicUsername] = useState('');
  const [publicUserlink, setPublicUserlink] = useState('');
  const [publicBio, setPublicBio] = useState('');
  const [userlinkStatus, setUserlinkStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [savingPublicProfile, setSavingPublicProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || user.name || '',
        email: user.email || '',
        telefone: user.telefone || user.phone || '',
        tipo: (user.tipo || user.role || 'app') as DriverType,
        foto_url: user.foto_url || user.avatar_url || '',
      });
      setPublicUsername(user.username || '');
      setPublicUserlink(user.userlink || '');
      setPublicBio(user.bio || '');
      if (user.userlink) setUserlinkStatus('available');
    }
  }, [user]);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    try {
      const image = new Image();
      image.src = imageToCrop;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Definir tamanho de saída quadrado padrão (400x400)
      canvas.width = 400;
      canvas.height = 400;

      // Calcular o fator de escala original para o canvas
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        400,
        400
      );

      const base64Image = canvas.toDataURL('image/jpeg', 0.82); // 82% quality to save space
      
      // SALVAR AUTOMATICAMENTE NO BANCO AO CORTAR
      if (user) {
        const response = await usersApi.update(user.id, { foto_url: base64Image });
        if (response.success && response.data) {
          useAppStore.setState((state) => ({ ...state, user: response.data }));
          toast.success('Foto de perfil atualizada!');
        } else {
          toast.error('Erro ao salvar foto de perfil');
        }
      }

      setFormData({ ...formData, foto_url: base64Image });
      setIsCropModalOpen(false);
      setImageToCrop(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
    if (!formData.telefone.trim()) newErrors.telefone = 'Telefone é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) return;

    setIsLoading(true);

    try {
      const response = await usersApi.update(user.id, {
        ...formData,
      });

      if (response.success && response.data) {
        useAppStore.setState((state) => ({
          ...state,
          user: response.data
        }));
        toast.success('Perfil atualizado com sucesso!');
      } else {
        toast.error(response.error || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      toast.error('Ocorreu um erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  // Userlink validation (letters and numbers only, unique)
  const validateUserlink = (value: string) => {
    if (!value) return 'idle' as const;
    if (!/^[a-zA-Z0-9]+$/.test(value)) return 'invalid' as const;
    return 'checking' as const;
  };

  const handleUserlinkChange = async (value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '');
    setPublicUserlink(cleaned);

    const status = validateUserlink(cleaned);
    if (status !== 'checking') {
      setUserlinkStatus(status);
      return;
    }

    // If it's the same as current userlink, it's available
    if (cleaned === (user?.userlink || '')) {
      setUserlinkStatus('available');
      return;
    }

    setUserlinkStatus('checking');
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('userlink', cleaned)
        .maybeSingle();

      if (error) {
        // Column may not exist yet — treat as available
        setUserlinkStatus('available');
        return;
      }
      setUserlinkStatus(data ? 'taken' : 'available');
    } catch {
      setUserlinkStatus('available');
    }
  };

  const handleSavePublicProfile = async () => {
    if (!user) return;
    
    // Only block if explicitly taken or invalid
    if (publicUserlink && (userlinkStatus === 'taken' || userlinkStatus === 'invalid')) {
      toast.error(userlinkStatus === 'taken' ? 'Este link já está em uso' : 'Use apenas letras e números');
      return;
    }

    setSavingPublicProfile(true);
    try {
      const response = await usersApi.update(user.id, {
        username: publicUsername || null,
        userlink: publicUserlink || null,
        bio: publicBio || null,
      });

      if (response.success && response.data) {
        useAppStore.setState((state) => ({
          ...state,
          user: response.data,
        }));
        toast.success('Perfil público atualizado!');
      } else {
        toast.error(response.error || 'Erro ao atualizar perfil público');
      }
    } catch {
      toast.error('Erro inesperado');
    } finally {
      setSavingPublicProfile(false);
    }
  };

  if (!user) return null;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6 pb-24 lg:pb-8">
        <header>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">Meu <span className="text-premium-gold">Perfil</span></h1>
            <PlanBadge plan={usePlanAccess().planName} />
          </div>
          <p className="text-gray-400 text-sm">Gerencie suas informações pessoais</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="relative overflow-hidden">
            {/* Header Avatar Section */}
            <div className="flex flex-col items-center mb-8 pt-4">
              <div className="relative group cursor-pointer">
                <div className="w-28 h-28 rounded-full bg-premium-dark border-2 border-premium-gold flex items-center justify-center text-premium-gold shadow-glow overflow-hidden relative">
                  {formData.foto_url ? (
                    <img 
                      src={formData.foto_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-14 h-14" />
                  )}
                  
                  {/* Overlay for upload */}
                  <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Save className="w-6 h-6 text-white" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload} 
                    />
                  </label>
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-premium-gold rounded-full border-4 border-premium-black flex items-center justify-center shadow-lg pointer-events-none">
                  <div className="w-2 h-2 bg-premium-black rounded-full animate-pulse" />
                </div>
              </div>
              <p className="text-[10px] text-premium-gold/60 mt-3 font-bold uppercase tracking-widest italic animate-pulse">Clique na foto para alterar</p>
              
              <h2 className="text-xl font-bold text-white mt-4">{user.nome || user.name}</h2>
              <span className="text-xs text-premium-gold font-bold uppercase tracking-widest px-3 py-1 bg-premium-gold/10 rounded-full mt-2 border border-premium-gold/20">
                {user.role === 'admin' ? 'Administrador' : 'Motorista ' + (user.tipo === 'app' ? 'App' : 'Particular')}
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <UserIcon className="w-3 h-3" /> Nome
                  </label>
                  <Input 
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    error={errors.nome}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <Mail className="w-3 h-3" /> Email
                  </label>
                  <Input 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    error={errors.email}
                    placeholder="seuemail@exemplo.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <Phone className="w-3 h-3" /> Telefone {user.role !== 'admin' && "(Bloqueado)"}
                  </label>
                  <div className="relative">
                    <Input 
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                      disabled={user.role !== 'admin'}
                      className={clsx(user.role !== 'admin' && "opacity-50 cursor-not-allowed bg-premium-black")}
                      error={errors.telefone}
                      placeholder="(00) 00000-0000"
                    />
                    {user.role !== 'admin' && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Shield className="w-4 h-4 text-premium-gold/30" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <Hash className="w-3 h-3" /> Tipo de Motorista
                  </label>
                  <Select 
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value as DriverType})}
                    options={[
                      { value: 'app', label: 'Motorista de Aplicativo' },
                      { value: 'particular', label: 'Motorista Particular / Taxista' }
                    ]}
                  />
                </div>


              </div>
            </div>
          </Card>

          <Button 
            type="submit" 
            isLoading={isLoading} 
            variant="primary"
            className="w-full py-4 text-lg font-bold shadow-glow"
          >
            <Save className="w-5 h-5 mr-3" />
            Salvar Alterações
          </Button>
        </form>

        {/* Perfil Público Section */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Perfil Público</h2>
              <p className="text-xs text-neutral">Personalize como outros veem seu perfil</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Username (display name) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <AtSign className="w-3 h-3" /> Nome de Usuário
              </label>
              <Input
                value={publicUsername}
                onChange={(e) => setPublicUsername(e.target.value)}
                placeholder="Seu nome de exibição"
                maxLength={50}
              />
              <p className="text-xs text-neutral">Aparece no seu perfil público</p>
            </div>

            {/* Userlink (unique link) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <LinkIcon className="w-3 h-3" /> Link do Perfil
              </label>
              <div className="relative">
                <Input
                  value={publicUserlink}
                  onChange={(e) => handleUserlinkChange(e.target.value)}
                  placeholder="seulink"
                  maxLength={30}
                />
                {userlinkStatus === 'checking' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {userlinkStatus === 'available' && publicUserlink && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                )}
                {userlinkStatus === 'taken' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  </div>
                )}
                {userlinkStatus === 'invalid' && publicUserlink && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  </div>
                )}
              </div>

              {/* Status messages */}
              {userlinkStatus === 'taken' && (
                <p className="text-xs text-red-400">Este link já está em uso</p>
              )}
              {userlinkStatus === 'invalid' && publicUserlink && (
                <p className="text-xs text-amber-400">
                  Use apenas letras e números, sem espaços ou caracteres especiais.
                </p>
              )}
              {userlinkStatus === 'available' && publicUserlink && (
                <p className="text-xs text-green-400">Disponível!</p>
              )}

              {/* Preview Link */}
              {publicUserlink && userlinkStatus === 'available' && (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
                  <LinkIcon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="text-xs text-neutral">Seu link:</span>
                  <span className="text-xs text-primary font-medium truncate">
                    {window.location.origin}/perfil/{publicUserlink}
                  </span>
                </div>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <FileText className="w-3 h-3" /> Bio
              </label>
              <textarea
                value={publicBio}
                onChange={(e) => setPublicBio(e.target.value.slice(0, 160))}
                placeholder="Escreva algo sobre você..."
                rows={3}
                maxLength={160}
                className="w-full bg-premium-dark border border-premium-gray/30 rounded-lg px-4 py-3 text-sm text-white placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none transition-all"
              />
              <p className="text-xs text-neutral text-right">{publicBio.length}/160</p>
            </div>

            {/* Preview + Save */}
            <div className="flex items-center justify-between gap-3 pt-2">
              {publicUserlink && userlinkStatus === 'available' ? (
                <a
                  href={`/perfil/${publicUserlink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ver perfil público
                </a>
              ) : (
                <span />
              )}
              <Button
                onClick={handleSavePublicProfile}
                isLoading={savingPublicProfile}
                variant="primary"
                className="px-6"
              >
                <Globe className="w-4 h-4 mr-2" />
                Salvar Perfil Público
              </Button>
            </div>
          </div>
        </Card>

        {/* Veículos Section */}
        <div className="mt-8">
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Alterar Senha</h2>
                <p className="text-xs text-neutral">Mantenha sua conta segura</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Senha atual</label>
                <div className="relative">
                  <Input
                    type={showSenhaAtual ? 'text' : 'password'}
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    placeholder="Digite sua senha atual"
                  />
                  <button type="button" onClick={() => setShowSenhaAtual(!showSenhaAtual)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral hover:text-white">
                    {showSenhaAtual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Nova senha</label>
                <div className="relative">
                  <Input
                    type={showNovaSenha ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button type="button" onClick={() => setShowNovaSenha(!showNovaSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral hover:text-white">
                    {showNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Confirmar nova senha</label>
                <Input
                  type="password"
                  value={confirmSenha}
                  onChange={(e) => setConfirmSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                />
              </div>
              <Button
                onClick={async () => {
                  if (!senhaAtual) return toast.error('Digite a senha atual');
                  if (novaSenha.length < 6) return toast.error('Nova senha deve ter pelo menos 6 caracteres');
                  if (novaSenha !== confirmSenha) return toast.error('As senhas não coincidem');
                  setSenhaLoading(true);
                  try {
                    const { supabase } = await import('../api/supabase');
                    
                    // Auth usa {phone}@7finance.com
                    const phone = user.telefone || user.phone || '';
                    const cleanPhone = phone.replace(/\D/g, '');
                    const authEmail = cleanPhone ? `${cleanPhone}@7finance.com` : '';
                    
                    if (!authEmail) {
                      toast.error('Telefone não encontrado no perfil');
                      setSenhaLoading(false);
                      return;
                    }
                    
                    const { error: reAuthErr } = await supabase.auth.signInWithPassword({ email: authEmail, password: senhaAtual });
                    const reauthed = !reAuthErr;
                    
                    if (!reauthed) {
                      toast.error('Senha atual incorreta');
                      setSenhaLoading(false);
                      return;
                    }
                    
                    // Agora atualizar a senha
                    const { error } = await supabase.auth.updateUser({ password: novaSenha });
                    if (error) {
                      toast.error(error.message || 'Erro ao alterar senha');
                    } else {
                      toast.success('Senha alterada com sucesso!');
                      setSenhaAtual('');
                      setNovaSenha('');
                      setConfirmSenha('');
                    }
                  } catch {
                    toast.error('Erro inesperado');
                  } finally {
                    setSenhaLoading(false);
                  }
                }}
                isLoading={senhaLoading}
                variant="primary"
                className="w-full"
              >
                <Lock className="w-4 h-4 mr-2" />
                Alterar Senha
              </Button>
            </div>
          </Card>
        </div>

        {/* Link para Veículos */}
        <div className="mt-8">
          <Link
            to="/veiculos"
            className="flex items-center justify-between p-4 rounded-xl border border-premium-gray/30 bg-premium-dark hover:border-primary/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-bold">Meus Veículos</h3>
                <p className="text-neutral text-xs">Gerenciar veículos, marcas, modelos e mais</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-neutral group-hover:text-primary transition-colors" />
          </Link>
        </div>
      </div>

      {/* Modal de Recorte de Foto */}
      <Modal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        title="Ajustar Foto de Perfil"
      >
        <div className="space-y-6">
          <div className="relative h-80 bg-black rounded-xl overflow-hidden border border-white/10">
            {imageToCrop && (
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e: any) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-premium-gold"
            />
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsCropModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1 font-bold"
              onClick={getCroppedImg}
            >
              <CropIcon className="w-4 h-4 mr-2" />
              Recortar e Aplicar
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
