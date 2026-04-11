import { useEffect, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Car,
  Save,
  Calendar,
  Palette,
  Tag,
  Hash,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, Button, Input, Select, Modal } from '../components/ui';
import { MainLayout } from '../components/layout/MainLayout';
import { veiculosApi } from '../api';
import { vehicleBrands, vehicleColors, vehicleYears, brandNames } from '../data/vehicleData';
import type { Veiculo } from '../types';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const statusOptions = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
];

const emptyForm = {
  id: null as number | null,
  marca: '',
  modelo: '',
  modeloCustom: '',
  placa: '',
  cor: '',
  ano: '' as string | number,
  status: 'ativo',
};

export function VehiclesPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchVeiculos();
  }, []);

  const fetchVeiculos = async () => {
    setIsLoading(true);
    const response = await veiculosApi.getAll();
    if (response.success && response.data) {
      setVeiculos(response.data);
    }
    setIsLoading(false);
  };

  const openNewModal = () => {
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEditModal = (v: Veiculo) => {
    const matchedBrand = brandNames.find(b => b === v.marca) || '';
    const models = matchedBrand ? vehicleBrands[matchedBrand] || [] : [];
    const isCustomModel = matchedBrand && !models.includes(v.modelo);

    setForm({
      id: v.id,
      marca: matchedBrand || 'Outro',
      modelo: isCustomModel ? '__custom__' : v.modelo,
      modeloCustom: isCustomModel ? v.modelo : '',
      placa: v.placa || '',
      cor: v.cor || '',
      ano: v.ano || '',
      status: v.status || 'ativo',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalModelo = form.modelo === '__custom__' ? form.modeloCustom : form.modelo;
    if (!finalModelo.trim()) {
      toast.error('Selecione ou digite o modelo');
      return;
    }

    const veiculoData = {
      marca: form.marca || null,
      modelo: form.marca && form.marca !== 'Outro' ? `${finalModelo}` : finalModelo,
      placa: form.placa.toUpperCase().trim() || null,
      cor: form.cor || null,
      ano: Number(form.ano) || null,
      status: form.status,
    };

    const response = form.id
      ? await veiculosApi.update(form.id, veiculoData)
      : await veiculosApi.create(veiculoData);

    if (response.success) {
      toast.success(form.id ? 'Veículo atualizado!' : 'Veículo adicionado!');
      setIsModalOpen(false);
      fetchVeiculos();
    } else {
      toast.error(response.error || 'Erro ao salvar veículo');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir este veículo?')) return;
    const response = await veiculosApi.delete(id);
    if (response.success) {
      toast.success('Veículo removido');
      fetchVeiculos();
    } else {
      toast.error(response.error || 'Erro ao remover');
    }
  };

  const availableModels = form.marca && form.marca !== 'Outro'
    ? vehicleBrands[form.marca] || []
    : [];

  const colorInfo = vehicleColors.find(c => c.value === form.cor);

  const filteredVeiculos = veiculos.filter(v => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (v.marca || '').toLowerCase().includes(s) ||
      v.modelo.toLowerCase().includes(s) ||
      (v.placa || '').toLowerCase().includes(s) ||
      (v.cor || '').toLowerCase().includes(s)
    );
  });

  const getColorHex = (cor: string | undefined) =>
    vehicleColors.find(c => c.value === cor)?.hex || '#6B7280';

  const getColorLabel = (cor: string | undefined) =>
    vehicleColors.find(c => c.value === cor)?.label || cor || '';

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Car className="w-7 h-7 text-primary" />
            Meus Veículos
          </h1>
          <p className="text-neutral text-sm mt-1">{veiculos.length} veículo{veiculos.length !== 1 ? 's' : ''} cadastrado{veiculos.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openNewModal} className="hidden sm:flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Veículo
        </Button>
      </div>

      {/* Search */}
      {veiculos.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar veículo..."
              className="w-full pl-10 pr-4 py-2.5 bg-premium-dark border border-white/10 rounded-xl text-white text-sm placeholder:text-neutral focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : veiculos.length === 0 ? (
        /* Empty State */
        <Card className="!p-12">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Car className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Nenhum veículo cadastrado</h3>
              <p className="text-neutral text-sm mt-1">Adicione seu primeiro veículo para controlar KM, manutenção e gastos.</p>
            </div>
            <Button onClick={openNewModal} className="mx-auto flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Veículo
            </Button>
          </div>
        </Card>
      ) : (
        /* Vehicle Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVeiculos.map(v => (
            <Card key={v.id} className="!p-0 overflow-hidden group hover:border-primary/30 transition-all">
              {/* Color bar */}
              <div className="h-1.5" style={{ backgroundColor: getColorHex(v.cor) }} />

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Brand + Model */}
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white truncate">
                        {v.marca && v.marca !== 'Outro' ? `${v.marca} ` : ''}{v.modelo}
                      </h3>
                      {v.status === 'inativo' && (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                          Inativo
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral mt-2">
                      {v.placa && (
                        <span className="inline-flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {v.placa}
                        </span>
                      )}
                      {v.ano && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {v.ano}
                        </span>
                      )}
                      {v.cor && (
                        <span className="inline-flex items-center gap-1">
                          <span
                            className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: getColorHex(v.cor) }}
                          />
                          {getColorLabel(v.cor)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Big car icon */}
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Car className="w-6 h-6 text-primary" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
                  <button
                    onClick={() => openEditModal(v)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-neutral hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-neutral hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remover
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={form.id ? 'Editar Veículo' : 'Adicionar Veículo'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Marca */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Marca</label>
            <Select
              value={form.marca}
              onChange={e => {
                setForm({ ...form, marca: e.target.value, modelo: '', modeloCustom: '' });
              }}
              options={[
                { value: '', label: 'Selecione a marca...' },
                ...brandNames.map(b => ({ value: b, label: b })),
              ]}
              required
            />
          </div>

          {/* Modelo */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Modelo</label>
            {form.marca && form.marca !== 'Outro' && availableModels.length > 0 ? (
              <>
                <Select
                  value={form.modelo}
                  onChange={e => setForm({ ...form, modelo: e.target.value, modeloCustom: '' })}
                  options={[
                    { value: '', label: 'Selecione o modelo...' },
                    ...availableModels.map(m => ({ value: m, label: m })),
                    { value: '__custom__', label: '✏️ Outro modelo...' },
                  ]}
                  required
                />
                {form.modelo === '__custom__' && (
                  <Input
                    value={form.modeloCustom}
                    onChange={e => setForm({ ...form, modeloCustom: e.target.value })}
                    placeholder="Digite o modelo..."
                    className="mt-2"
                    required
                  />
                )}
              </>
            ) : (
              <Input
                value={form.modelo === '__custom__' ? form.modeloCustom : form.modelo}
                onChange={e => setForm({ ...form, modelo: e.target.value })}
                placeholder="Ex: Corolla XEi 2.0"
                required
              />
            )}
          </div>

          {/* Placa + Ano */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Placa</label>
              <Input
                value={form.placa}
                onChange={e => setForm({ ...form, placa: e.target.value.toUpperCase() })}
                placeholder="ABC1D23"
                maxLength={8}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Ano</label>
              <Select
                value={String(form.ano)}
                onChange={e => setForm({ ...form, ano: e.target.value })}
                options={[
                  { value: '', label: 'Ano...' },
                  ...vehicleYears.map(y => ({ value: String(y), label: String(y) })),
                ]}
              />
            </div>
          </div>

          {/* Cor */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Cor</label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {vehicleColors.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm({ ...form, cor: c.value })}
                  className={clsx(
                    'flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all',
                    form.cor === c.value
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent hover:border-white/10 bg-premium-dark'
                  )}
                >
                  <span
                    className="w-6 h-6 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className={clsx(
                    'text-[10px] font-medium truncate max-w-full',
                    form.cor === c.value ? 'text-primary' : 'text-neutral'
                  )}>
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
            <Select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              options={statusOptions}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button className="flex-1 font-bold" type="submit">
              <Save className="w-4 h-4 mr-2" />
              {form.id ? 'Salvar Alterações' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* FAB mobile - botão flutuante acima da bottom nav */}
      <button
        onClick={openNewModal}
        className="sm:hidden fixed right-6 bottom-32 z-[110] w-14 h-14 rounded-full bg-primary text-premium-black shadow-lg shadow-primary/40 flex items-center justify-center active:scale-95 transition-transform border-4 border-premium-black"
        aria-label="Adicionar Veículo"
      >
        <Plus className="w-8 h-8" strokeWidth={3} />
      </button>
    </MainLayout>
  );
}
