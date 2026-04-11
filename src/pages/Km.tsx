import { useEffect, useState } from 'react';
import { Plus, Gauge, Calendar, TrendingUp, Edit2, ChevronRight, Play, Car } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, Button, Input, Modal, ConfirmModal, Select } from '../components/ui';
import { MainLayout } from '../components/layout/MainLayout';
import { useAppStore } from '../store';
import { kmApi, veiculosApi } from '../api';
import type { KmRegistry } from '../types';
import { getLocalDatetimeForInput, displayLocaleDatetime } from '../utils/date';
import toast from 'react-hot-toast';

export function KmPage() {
  const { kmRegistries, addKmRegistry, updateKmRegistry, deleteKmRegistry, setKmRegistries, user } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRegistry, setSelectedRegistry] = useState<KmRegistry | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<'inicio' | 'fim' | 'novo' | 'editar'>('novo');
  
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [selectedVeiculoId, setSelectedVeiculoId] = useState('all');
  // Filtro de histórico por veículo
  const filteredKmRegistries = selectedVeiculoId === 'all'
    ? kmRegistries
    : kmRegistries.filter(k => (k.veiculo_id ? String(k.veiculo_id) : '') === selectedVeiculoId);

  // Form state
  const [kmValue, setKmValue] = useState('');
  const [kmFinalValue, setKmFinalValue] = useState('');
  const [data, setData] = useState(getLocalDatetimeForInput());

  useEffect(() => {
    loadKmRegistries();
    fetchVeiculos();
  }, []);

  const fetchVeiculos = async () => {
    const response = await veiculosApi.getAll();
    if (response.success && response.data) {
      setVeiculos(response.data);
      // Se não houver filtro, default para 'all'
      if (response.data.length > 0 && selectedVeiculoId === '') {
        setSelectedVeiculoId('all');
      }
    }
  };

  const loadKmRegistries = async () => {
    setIsLoading(true);
    try {
      const response = await kmApi.getAll();
      if (response.success && response.data) {
        setKmRegistries(response.data);
      }
    } catch (error) {
      console.error('Error loading KM:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const openModalInicio = () => {
    setModalMode('inicio');
    setKmValue('');
    
    // Default to first vehicle if available
    if (veiculos.length > 0) {
      const firstVeiculo = veiculos[0];
      setSelectedVeiculoId(firstVeiculo.id.toString());
      setKmValue('');
    }

    setData(getLocalDatetimeForInput());
    setSelectedRegistry(null);
    setIsModalOpen(true);
  };

  const openModalFim = () => {
    setModalMode('fim');
    // Find today's record with km_inicial
    const todayReg = kmRegistries.find(r => r.data === getLocalDatetimeForInput() && r.km_inicial);
    setSelectedRegistry(todayReg || null);
    setKmValue(todayReg?.km_inicial?.toString() || '');
    setKmFinalValue('');
    setData(getLocalDatetimeForInput());
    setIsModalOpen(true);
  };

  const openModalEdit = (registry: any) => {
    setModalMode('editar');
    setSelectedRegistry(registry);
    setKmValue(registry.km_inicial?.toString() || '');
    setKmFinalValue(registry.km_final?.toString() || '');
    // Ensure we use getLocalDatetimeForInput to format the DB date for the HTML input
    setData(registry.data ? getLocalDatetimeForInput(registry.data) : getLocalDatetimeForInput());
    setIsModalOpen(true);
  };

  const handleVeiculoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vId = e.target.value;
    setSelectedVeiculoId(vId);
    
    // Update kmValue with selected vehicle's current mileage if in 'inicio' mode
    if (modalMode === 'inicio') {
      const v = veiculos.find(veiculo => veiculo.id.toString() === vId);
      if (v) setKmValue('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const km = parseFloat(kmValue);
    if (isNaN(km) || km <= 0) {
      alert('Digite um valor de KM válido');
      return;
    }

    if (!selectedVeiculoId) {
      toast.error('Selecione um veículo.');
      return;
    }
    
    setIsLoading(true);

    // Corrigir formato da data para ISO completo (YYYY-MM-DDTHH:mm:ss)
    function toIsoWithSeconds(dt: string) {

      // dt: '2026-04-09T09:00' => '2026-04-09'
      return dt.split('T')[0];
    }
    const dataIso = toIsoWithSeconds(data);

    try {
      if (modalMode === 'inicio') {
        const inputDateOnly = dataIso.split('T')[0];
        // Check duplication for THIS vehicle and THIS user in THAT day
        const existingRegInDay = kmRegistries.find(r => 
          r.data.split('T')[0] === inputDateOnly && 
          Number(r.veiculo_id) === Number(selectedVeiculoId)
        );
        
        if (existingRegInDay) {
          toast.error('Já existe um registro para este veículo hoje. Edite o registro existente.');
          setIsLoading(false);
          return;
        }

        const response = await kmApi.create({ 
          km_inicial: km, 
          km_final: 0, 
          data: dataIso, 
          veiculo_id: Number(selectedVeiculoId) 
        });
        if (response.success && response.data) {
          addKmRegistry(response.data);
          toast.success('Início de KM registrado!');
          // Refresh vehicles to get updated KM
          fetchVeiculos();
        }
      } else if (modalMode === 'fim') {
        const kmFim = parseFloat(kmFinalValue);
        if (isNaN(kmFim)) {
          alert('Digite um valor de KM final válido');
          setIsLoading(false);
          return;
        }

        if (selectedRegistry) {
          // Update existing record
          const response = await kmApi.update(selectedRegistry.id, { 
            km_final: kmFim, 
            data: dataIso,
            veiculo_id: selectedRegistry.veiculo_id 
          });
          if (response.success && response.data) {
            updateKmRegistry(selectedRegistry.id, response.data);
            toast.success('KM Final registrado!');
            fetchVeiculos();
          }
        } else {
          // Create new record with both values
          const inputDateOnly = dataIso.split('T')[0];
          const existingRegInDay = kmRegistries.find(r => r.data.split('T')[0] === inputDateOnly);
          
          if (existingRegInDay) {
            toast.error('Já existe um registro para este dia.');
            setIsLoading(false);
            return;
          }

          const response = await kmApi.create({ 
            km_inicial: km, 
            km_final: kmFim, 
            data: dataIso, 
            veiculo_id: Number(selectedVeiculoId) 
          });
          if (response.success && response.data) {
            addKmRegistry(response.data);
            toast.success('Registro de KM completo salvo!');
            fetchVeiculos();
          }
        }
      } else {
        // Edit mode - both values
        const inicial = parseFloat(kmValue);
        const final = parseFloat(kmFinalValue);
        
        if (final <= inicial) {
          toast.error('KM final deve ser maior que KM inicial');
          setIsLoading(false);
          return;
        }
        
        const response = await kmApi.update(selectedRegistry!.id, { 
          km_inicial: inicial, 
          km_final: final, 
          data,
          veiculo_id: selectedRegistry!.veiculo_id
        });
        if (response.success && response.data) {
          updateKmRegistry(selectedRegistry!.id, response.data);
          toast.success('Registro de KM atualizado!');
          fetchVeiculos();
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar registro de KM');
      console.error('Error saving KM:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setIsLoading(true);
    try {
      const response = await kmApi.delete(deleteId);
      if (response.success) {
        deleteKmRegistry(deleteId);
      }
    } catch (error) {
      console.error('Error deleting KM:', error);
    } finally {
      setIsLoading(false);
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setSelectedRegistry(null);
    setKmValue('');
    setKmFinalValue('');
    setData(getLocalDatetimeForInput());
    setModalMode('novo');
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Get today's record
  const todayReg = kmRegistries.find(r => r.data === getLocalDatetimeForInput());
  const hasInicioToday = todayReg?.km_inicial !== null && todayReg?.km_inicial !== undefined;
  const hasFimToday = todayReg?.km_final !== null && todayReg?.km_final !== undefined && todayReg.km_final > 0;

  // Helper para calcular km rodado de um registro
  const getKmTotal = (k: { km_inicial?: number | null; km_final?: number | null }): number => {
    const ini = Number(k.km_inicial) || 0;
    const fim = Number(k.km_final) || 0;
    return fim > ini ? (fim - ini) : 0;
  };

  // Calculate totals - USA FILTRADOS
  const totalKm = filteredKmRegistries.reduce((sum, k) => sum + getKmTotal(k), 0);
  const registriesWithKm = filteredKmRegistries.filter(k => getKmTotal(k) > 0);
  const avgKmPerDay = registriesWithKm.length > 0 
    ? Math.round(totalKm / registriesWithKm.length) 
    : 0;
  
  // Current KM (latest km_final, or km_inicial if km_final not yet filled) - USA FILTRADOS
  const currentKm = filteredKmRegistries.length > 0 
    ? (Number(filteredKmRegistries[0].km_final) || Number(filteredKmRegistries[0].km_inicial) || 0)
    : 0;

  // Get last 7 days for chart - USA FILTRADOS
  const last7Days = filteredKmRegistries.filter(k => getKmTotal(k) > 0).slice(0, 7).reverse();
  const chartData = last7Days.map(k => ({
    date: displayLocaleDatetime(k.data),
    km: getKmTotal(k),
  }));

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Header + Filtro de veículo */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-premium-darkGray rounded-app">
          <div>
            <h1 className="text-xl font-bold text-white">Quilometragem</h1>
            <p className="text-sm text-gray-400">Controle de KM por veículo</p>
          </div>
          {veiculos.length > 0 && (
            <select
              value={selectedVeiculoId}
              onChange={e => setSelectedVeiculoId(e.target.value)}
              className="bg-premium-dark border border-premium-gray/50 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-premium-gold transition-all"
            >
              <option value="all">Todos os Carros</option>
              {veiculos.map(v => (
                <option key={v.id} value={v.id.toString()}>
                  {v.modelo}{v.placa ? ` (${v.placa})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Today's Status - App Style */}
        <div className="bg-premium-darkGray rounded-app p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Hoje</span>
            <span className="text-xs text-gray-500">{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {/* KM Início */}
            <button
              onClick={openModalInicio}
              className={`p-4 rounded-app border-2 transition-all flex items-center justify-between ${
                hasInicioToday 
                  ? 'border-green-500/30 bg-green-500/10' 
                  : 'border-dashed border-gray-600 hover:border-premium-gold'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${hasInicioToday ? 'bg-green-500/20' : 'bg-gray-800'}`}>
                  <Play className={`w-5 h-5 ${hasInicioToday ? 'text-green-500' : 'text-gray-500'}`} />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block text-left">Quilometragem Inicial</span>
                  <p className={`text-lg font-bold ${hasInicioToday ? 'text-green-500' : 'text-gray-400'}`}>
                    {hasInicioToday ? `${formatNumber(todayReg!.km_inicial!)} km` : 'Registrar Início'}
                  </p>
                </div>
              </div>
              {!hasInicioToday && (
                <Plus className="w-5 h-5 text-premium-gold animate-pulse" />
              )}
            </button>
          </div>

          {/* Today's Total - Só aparece se tiver o registro completo (pelo histórico) */}
          {hasFimToday && (
            <div className="mt-3 pt-3 border-t border-premium-gray/30">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Rodado hoje</span>
                <span className="text-xl font-bold text-green-500">
                  +{formatNumber(getKmTotal(todayReg!))} km
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-premium-darkGray rounded-app p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-premium-gold/20 rounded-lg">
                <Gauge className="w-4 h-4 text-premium-gold" />
              </div>
              <span className="text-xs text-gray-400">Atual</span>
            </div>
            <p className="text-lg font-bold text-white">{formatNumber(currentKm || 0)}</p>
            <p className="text-xs text-gray-500">km no odômetro</p>
          </div>

          <div className="bg-premium-darkGray rounded-app p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-500/20 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-xs text-gray-400">Média</span>
            </div>
            <p className="text-lg font-bold text-white">{formatNumber(avgKmPerDay)}</p>
            <p className="text-xs text-gray-500">km/dia</p>
          </div>
        </div>

        {/* Vehicle Info */}
        {(user?.veiculo) && (
          <div className="bg-premium-darkGray rounded-app p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-premium-gray rounded-full flex items-center justify-center">
                <span className="text-premium-gold font-bold">{(user.veiculo || '?').charAt(0)}</span>
              </div>
              <div>
                <p className="font-medium text-white">{user.veiculo}</p>
                <p className="text-sm text-gray-400">{user.placa || 'Sem placa'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Últimos dias</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141414', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                  <Bar dataKey="km" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* List */}
        <div className="bg-premium-darkGray rounded-app overflow-hidden">
          <div className="p-4 border-b border-premium-gray/30">
            <h3 className="font-medium text-white">Histórico</h3>
          </div>
          {filteredKmRegistries.length === 0 ? (
            <div className="p-8 text-center">
              <Gauge className="w-10 h-10 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">Nenhum registro</p>
              <p className="text-sm text-gray-500 mt-1">Registre o KM de início</p>
            </div>
          ) : (
            <div className="divide-y divide-premium-gray/20">
              {filteredKmRegistries.slice(0, 15).map((registry) => {
                const veiculo = registry.veiculos || veiculos.find(v => v.id === registry.veiculo_id);
                return (
                  <button
                    key={registry.id}
                    onClick={() => openModalEdit(registry as any)}
                    className="w-full p-4 flex items-center justify-between hover:bg-premium-gray/30 transition-colors text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Car className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-blue-400 font-medium">
                          {veiculo ? `${veiculo.modelo}${veiculo.placa ? ` (${veiculo.placa})` : ''}` : 'Veículo' }
                        </span>
                      </div>
                      <p className="font-medium text-white">{displayLocaleDatetime(registry.data)}</p>
                      <p className="text-sm text-gray-400">
                        {registry.km_inicial 
                          ? `${formatNumber(registry.km_inicial)} → ${registry.km_final ? formatNumber(registry.km_final) : '...'}`
                          : 'Aguardando início'
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getKmTotal(registry) > 0 ? (
                        <span className="text-premium-gold font-medium">+{formatNumber(getKmTotal(registry))}</span>
                      ) : (
                        <span className="text-xs text-gray-500">Pendente</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={
          modalMode === 'inicio' ? 'Registrar KM Início' : 
          modalMode === 'fim' ? 'Registrar KM Fim' : 
          'Editar Registro'
        }
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalMode === 'fim' && (
            <>
              <div className="bg-premium-gray/30 p-3 rounded-app">
                <p className="text-xs text-gray-400">KM Início</p>
                <p className="text-lg font-bold text-green-500">{formatNumber(parseFloat(kmValue) || 0)} km</p>
              </div>
              <Input
                label="KM Final"
                type="number"
                value={kmFinalValue}
                onChange={(e) => setKmFinalValue(e.target.value)}
                placeholder="0"
                required
              />
            </>
          )}

          {modalMode === 'inicio' && (
            <Input
              label="KM Início"
              type="number"
              value={kmValue}
              onChange={(e) => setKmValue(e.target.value)}
              placeholder="0"
              required
            />
          )}

          {modalMode === 'editar' && (
            <>
              <Input
                label="KM Início"
                type="number"
                value={kmValue}
                onChange={(e) => setKmValue(e.target.value)}
                placeholder="0"
                required
              />
              <Input
                label="KM Final"
                type="number"
                value={kmFinalValue}
                onChange={(e) => setKmFinalValue(e.target.value)}
                placeholder="0"
                required
              />
            </>
          )}

          <Input
            label="Data"
            type="datetime-local"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
          />

          {/* Veículo - apenas no início ou novo */}
          {modalMode !== 'fim' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Selecione o Veículo</label>
              <Select
                value={selectedVeiculoId}
                onChange={(e) => {
                  const vId = e.target.value;
                  setSelectedVeiculoId(vId);
                  if (modalMode === 'inicio') {
                    const v = veiculos.find(veiculo => veiculo.id.toString() === vId);
                    if (v) setKmValue('');
                  }
                }}
                disabled={modalMode === 'editar'}
                options={veiculos.map(v => ({ value: v.id, label: `${v.modelo} (${v.placa})` }))}
                required
              />
            </div>
          )}

          {/* Preview of calculated value */}
          {(modalMode === 'fim' && kmFinalValue) && (
            <div className="bg-premium-gold/10 p-3 rounded-app border border-premium-gold/30">
              <p className="text-xs text-gray-400">KM do dia:</p>
              <p className="text-lg font-bold text-premium-gold">
                +{formatNumber(parseFloat(kmFinalValue) - (parseFloat(kmValue) || 0))} km
              </p>
            </div>
          )}
          
          {modalMode === 'editar' && kmValue && kmFinalValue && (
            <div className="bg-premium-gold/10 p-3 rounded-app border border-premium-gold/30">
              <p className="text-xs text-gray-400">Total:</p>
              <p className="text-lg font-bold text-premium-gold">
                +{formatNumber(parseFloat(kmFinalValue) - parseFloat(kmValue))} km
              </p>
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            {modalMode === 'editar' && selectedRegistry && (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  setDeleteId(selectedRegistry.id);
                  setIsDeleteModalOpen(true);
                }}
                className="flex-1"
              >
                Excluir
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading} variant="primary" className="flex-1">
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteId(null);
        }}
        onConfirm={handleDelete}
        title="Excluir Registro"
        message="Tem certeza que deseja excluir este registro?"
        confirmText="Excluir"
        variant="danger"
      />
    </MainLayout>
  );
}
