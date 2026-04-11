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
  Plus,
  Trash2
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Select, Modal } from '../components/ui';
import { useAppStore } from '../store';
import { usersApi, veiculosApi } from '../api';
import { PlanBadge } from '../components/plans';
import { usePlanAccess } from '../hooks/usePlanAccess';
import { clsx } from 'clsx';
import type { DriverType } from '../types';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [isVeiculoModalOpen, setIsVeiculoModalOpen] = useState(false);
  const [editingVeiculo, setEditingVeiculo] = useState<any>({
    modelo: '',
    placa: '',
    cor: '',
    ano: null
  });
  
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

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || user.name || '',
        email: user.email || '',
        telefone: user.telefone || user.phone || '',
        tipo: (user.tipo || user.role || 'app') as DriverType,
        foto_url: user.foto_url || user.avatar_url || '',
      });
      fetchVeiculos();
    }
  }, [user]);

  const fetchVeiculos = async () => {
    const response = await veiculosApi.getAll();
    if (response.success && response.data) {
      setVeiculos(response.data);
    }
  };

  const handleSaveVeiculo = async (e: React.FormEvent) => {
    e.preventDefault();
    const veiculoData = {
      modelo: editingVeiculo.modelo,
      placa: editingVeiculo.placa.toUpperCase(),
      cor: editingVeiculo.cor || null,
      ano: Number(editingVeiculo.ano) || null,
    };

    const response = editingVeiculo.id 
      ? await veiculosApi.update(editingVeiculo.id, veiculoData)
      : await veiculosApi.create(veiculoData);

    if (response.success) {
      toast.success(editingVeiculo.id ? 'Veículo atualizado!' : 'Veículo adicionado!');
      setIsVeiculoModalOpen(false);
      fetchVeiculos();
    } else {
      toast.error(response.error || 'Erro ao salvar veículo');
    }
  };

  const handleDeleteVeiculo = async (id: number) => {
    if (!confirm('Deseja realmente excluir este veículo?')) return;
    const response = await veiculosApi.delete(id);
    if (response.success) {
      toast.success('Veículo removido');
      fetchVeiculos();
    }
  };

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

        {/* Veículos Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Meus Veículos</h2>
            <Button 
              onClick={() => {
                setEditingVeiculo(null);
                setIsVeiculoModalOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Veículo
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {veiculos.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4 border border-premium-gray/30 rounded-lg">
                Nenhum veículo cadastrado. Adicione um veículo usando o botão acima.
              </p>
            ) : (
              veiculos.map((veiculo) => (
                <div key={veiculo.id} className="bg-premium-dark rounded-lg p-4 flex flex-col sm:flex-row gap-4 border border-premium-gray/30">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white truncate">{veiculo.modelo}</h3>
                    <p className="text-sm text-gray-400 truncate">{veiculo.placa}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        setEditingVeiculo(veiculo);
                        setIsVeiculoModalOpen(true);
                      }}
                      variant="primary"
                      className="flex-1"
                    >
                      <Settings2 className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={() => handleDeleteVeiculo(veiculo.id)} 
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
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

      {/* Modal de Veículo */}
      <Modal
        isOpen={isVeiculoModalOpen}
        onClose={() => setIsVeiculoModalOpen(false)}
        title={editingVeiculo ? "Editar Veículo" : "Adicionar Veículo"}
      >
        <form onSubmit={handleSaveVeiculo} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Modelo do Veículo</label>
              <Input 
                value={editingVeiculo?.modelo}
                onChange={(e) => setEditingVeiculo({...editingVeiculo, modelo: e.target.value})}
                placeholder="Ex: Toyota Corolla"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Placa</label>
              <Input 
                value={editingVeiculo?.placa}
                onChange={(e) => setEditingVeiculo({...editingVeiculo, placa: e.target.value})}
                placeholder="ABC-1234"
                maxLength={8}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
              <Select 
                value={editingVeiculo?.status || 'ativo'}
                onChange={(e) => setEditingVeiculo({...editingVeiculo, status: e.target.value})}
                options={[
                  { value: 'ativo', label: 'Ativo' },
                  { value: 'inativo', label: 'Inativo' },
                ]}
                required
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsVeiculoModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1 font-bold"
              type="submit"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingVeiculo ? 'Salvar Alterações' : 'Adicionar Veículo'}
            </Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
