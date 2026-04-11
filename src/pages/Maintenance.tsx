import { useEffect, useState } from 'react';
import { Plus, Wrench, AlertTriangle, CheckCircle, Clock, Edit2, Trash2, Car } from 'lucide-react';
import { Card, CardHeader, Button, Input, Select, Modal, ConfirmModal } from '../components/ui';
import { MainLayout } from '../components/layout/MainLayout';
import { useAppStore } from '../store';
import { maintenanceApi, kmApi, veiculosApi } from '../api';
import type { Maintenance, MaintenanceType, MaintenanceStatus, Veiculo } from '../types';
import { getLocalDatetimeForInput, displayLocaleDatetime } from '../utils/date';

const maintenanceTypeOptions = [
  { value: 'oleo', label: 'Troca de Óleo' },
  { value: 'pneus', label: 'Pneus' },
  { value: 'freios', label: 'Freios' },
  { value: 'revisao', label: 'Revisão Geral' },
  { value: 'documentacao', label: 'Documentação' },
  { value: 'seguro', label: 'Seguro' },
];

const statusOptions = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'urgente', label: 'Urgente' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'concluido', label: 'Concluído' },
];

export function MaintenancePage() {
  const { maintenances, addMaintenance, updateMaintenance, deleteMaintenance, setMaintenances, kmRegistries } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Veículos
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [filterVeiculoId, setFilterVeiculoId] = useState<string>('all');

  // Form state
  const [tipo, setTipo] = useState<MaintenanceType>('oleo');
  const [veiculoId, setVeiculoId] = useState<string>('');
  const [proximaManutencaoKm, setProximaManutencaoKm] = useState('');
  const [dataManutencao, setDataManutencao] = useState('');
  const [valor, setValor] = useState('');
  const [obs, setObs] = useState('');

  // Get current KM (km_final, or km_inicial if final not yet filled)
  const currentKm = kmRegistries.length > 0 
    ? (Number(kmRegistries[0].km_final) || Number(kmRegistries[0].km_inicial) || 0)
    : 0;

  useEffect(() => {
    loadMaintenances();
    loadVeiculos();
  }, []);

  const loadVeiculos = async () => {
    try {
      const response = await veiculosApi.getAll();
      if (response.success && response.data) {
        setVeiculos(response.data);
      }
    } catch (error) {
      console.error('Error loading veiculos:', error);
    }
  };

  const loadMaintenances = async () => {
    setIsLoading(true);
    try {
      const response = await maintenanceApi.getAll();
      if (response.success && response.data) {
        setMaintenances(response.data);
      }
    } catch (error) {
      console.error('Error loading maintenances:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const openModal = (maintenance?: Maintenance) => {
    if (maintenance) {
      setSelectedMaintenance(maintenance);
      // Tenta inferir o tipo a partir da descrição
      const inferredType = maintenanceTypeOptions.find(o => maintenance.descricao?.toLowerCase().includes(o.label.toLowerCase()));
      setTipo((inferredType?.value as MaintenanceType) || 'oleo');
      setVeiculoId(maintenance.veiculo_id?.toString() || (veiculos.length > 0 ? veiculos[0].id.toString() : ''));
      setProximaManutencaoKm(maintenance.proxima_manutencao_km?.toString() || '');
      setDataManutencao(maintenance.data ? getLocalDatetimeForInput(maintenance.data) : '');
      setValor(maintenance.valor?.toString() || '');
      setObs(maintenance.descricao || '');
    } else {
      setSelectedMaintenance(null);
      setTipo('oleo');
      setVeiculoId(filterVeiculoId !== 'all' ? filterVeiculoId : (veiculos.length > 0 ? veiculos[0].id.toString() : ''));
      setProximaManutencaoKm('');
      setDataManutencao(getLocalDatetimeForInput());
      setValor('');
      setObs('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const maintenanceData = {
        descricao: obs || getTypeLabel(tipo),
        km_registro: proximaManutencaoKm ? parseInt(proximaManutencaoKm) : null,
        proxima_manutencao_km: proximaManutencaoKm ? parseInt(proximaManutencaoKm) : null,
        valor: valor ? parseFloat(valor) : 0,
        data: dataManutencao || new Date().toISOString(),
        status: selectedMaintenance?.status || 'pendente',
        veiculo_id: veiculoId ? parseInt(veiculoId) : null,
      };

      let response;
      if (selectedMaintenance) {
        response = await maintenanceApi.update(selectedMaintenance.id, maintenanceData);
        if (response.success) {
          // Since backend only returns true on update currently, manual update in store
          updateMaintenance(selectedMaintenance.id, { ...selectedMaintenance, ...maintenanceData } as any);
        }
      } else {
        response = await maintenanceApi.create(maintenanceData);
        if (response.success && response.data) {
          addMaintenance(response.data);
        }
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving maintenance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setIsLoading(true);
    try {
      const response = await maintenanceApi.delete(deleteId);
      if (response.success) {
        deleteMaintenance(deleteId);
      }
    } catch (error) {
      console.error('Error deleting maintenance:', error);
    } finally {
      setIsLoading(false);
      setDeleteId(null);
    }
  };

  const handleMarkComplete = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await maintenanceApi.update(id, { status: 'concluido' });
      if (response.success && response.data) {
        updateMaintenance(id, response.data);
      }
    } catch (error) {
      console.error('Error updating maintenance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedMaintenance(null);
    setTipo('oleo');
    setVeiculoId(veiculos.length > 0 ? veiculos[0].id.toString() : '');
    setProximaManutencaoKm('');
    setDataManutencao('');
    setValor('');
    setObs('');
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getTypeLabel = (type: MaintenanceType) => {
    const option = maintenanceTypeOptions.find(o => o.value === type);
    return option?.label || type;
  };

  const getStatusColor = (status: MaintenanceStatus) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-500/20 text-yellow-400';
      case 'urgente': return 'bg-orange-500/20 text-orange-400';
      case 'atrasado': return 'bg-red-500/20 text-red-400';
      case 'concluido': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusIcon = (status: MaintenanceStatus) => {
    switch (status) {
      case 'concluido': return <CheckCircle className="w-4 h-4" />;
      case 'atrasado': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getVeiculoLabel = (maintenance: Maintenance) => {
    if (maintenance.veiculos) {
      return `${maintenance.veiculos.modelo}${maintenance.veiculos.placa ? ` (${maintenance.veiculos.placa})` : ''}`;
    }
    return null;
  };

  // Filter maintenances by selected vehicle
  const filteredMaintenances = filterVeiculoId === 'all' 
    ? maintenances 
    : maintenances.filter(m => m.veiculo_id?.toString() === filterVeiculoId);

  // Calculate alerts
  const alerts = filteredMaintenances.filter(m => {
    if (m.status === 'concluido') return false;
    if (m.proxima_manutencao_km && (currentKm ?? 0) >= m.proxima_manutencao_km) return true;
    if (m.data && new Date(m.data) <= new Date()) return true;
    return false;
  });

  const pending = filteredMaintenances.filter(m => m.status === 'pendente').length;
  const urgent = filteredMaintenances.filter(m => m.status === 'urgente').length;
  const overdue = filteredMaintenances.filter(m => m.status === 'atrasado').length;
  const completed = filteredMaintenances.filter(m => m.status === 'concluido').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Manutenção</h1>
            <p className="text-gray-400 mt-1">Controle de manutenção por veículo</p>
          </div>
          
          <div className="flex items-center gap-3">
            {veiculos.length > 0 && (
              <select
                value={filterVeiculoId}
                onChange={(e) => setFilterVeiculoId(e.target.value)}
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
            <Button onClick={() => openModal()} disabled={veiculos.length === 0} variant="primary">
              <Plus className="w-5 h-5 mr-2" />
              Nova Manutenção
            </Button>
          </div>
        </div>

        {/* No vehicles warning */}
        {veiculos.length === 0 && (
          <Card variant="warning">
            <div className="flex items-center gap-3 p-2">
              <Car className="w-8 h-8 text-orange-400 shrink-0" />
              <div>
                <p className="text-white font-bold">Nenhum veículo cadastrado</p>
                <p className="text-gray-400 text-sm">Cadastre um veículo na página de KM antes de registrar manutenções.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="highlight">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-premium-gold/20 rounded-premium">
                <Wrench className="w-6 h-6 text-premium-gold" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Pendentes</p>
                <p className="text-xl font-bold text-white">{pending}</p>
              </div>
            </div>
          </Card>

          <Card variant="warning">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/20 rounded-premium">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Urgentes</p>
                <p className="text-xl font-bold text-white">{urgent}</p>
              </div>
            </div>
          </Card>

          <Card variant="warning">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/20 rounded-premium">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Atrasados</p>
                <p className="text-xl font-bold text-white">{overdue}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-premium">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Concluídos</p>
                <p className="text-xl font-bold text-white">{completed}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card variant="warning">
            <CardHeader 
              title="Alertas de Manutenção" 
              subtitle={`${alerts.length} item(s) precisam de atenção`}
            />
            <div className="space-y-2 mt-4">
              {alerts.map(alert => (
                <div 
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-premium"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-medium text-white">{alert.descricao || 'Manutenção'}</p>
                      <p className="text-sm text-gray-400">
                        {alert.proxima_manutencao_km && (currentKm ?? 0) >= alert.proxima_manutencao_km 
                          ? `KM atual (${formatNumber(currentKm ?? 0)}) excedeu limite (${formatNumber(alert.proxima_manutencao_km)})`
                          : alert.data && new Date(alert.data) <= new Date()
                            ? `Data limite excedida: ${displayLocaleDatetime(alert.data)}`
                            : 'Atenção necessária'
                        }
                      </p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleMarkComplete(alert.id)}>
                    Marcar Concluído
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* List */}
        <Card>
          <CardHeader title="Histórico de Manutenção" subtitle={`${filteredMaintenances.length} registros${filterVeiculoId !== 'all' ? ` • ${veiculos.find(v => v.id.toString() === filterVeiculoId)?.modelo || ''}` : ''}`} />
          
          {filteredMaintenances.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma manutenção cadastrada ainda</p>
              <p className="text-sm mt-1">Clique em "Nova Manutenção" para começar</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-premium-gray/30">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Veículo</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Descrição</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Próx. KM</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Data</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaintenances.map((maintenance) => (
                      <tr key={maintenance.id} className="border-b border-premium-gray/20 hover:bg-premium-gray/20">
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-sm text-blue-400">
                            <Car className="w-3.5 h-3.5" />
                            {getVeiculoLabel(maintenance) || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-premium-gold/20 text-premium-gold rounded text-sm">
                            {maintenance.descricao || 'Manutenção'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white">
                          {maintenance.proxima_manutencao_km ? `${formatNumber(maintenance.proxima_manutencao_km)} km` : '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {displayLocaleDatetime(maintenance.data)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${getStatusColor(maintenance.status)}`}>
                            {getStatusIcon(maintenance.status)}
                            {maintenance.status.charAt(0).toUpperCase() + maintenance.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            {maintenance.status !== 'concluido' && (
                              <button
                                onClick={() => handleMarkComplete(maintenance.id)}
                                className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-500/10 rounded-premium transition-colors"
                                title="Marcar como concluído"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => openModal(maintenance)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-premium-gray rounded-premium transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteId(maintenance.id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-premium transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-premium-gray/20">
                {filteredMaintenances.map((maintenance) => (
                  <div key={maintenance.id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2 py-0.5 bg-premium-gold/20 text-premium-gold rounded text-xs font-medium">
                        {maintenance.descricao || 'Manutenção'}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${getStatusColor(maintenance.status)}`}>
                        {getStatusIcon(maintenance.status)}
                        {maintenance.status.charAt(0).toUpperCase() + maintenance.status.slice(1)}
                      </span>
                    </div>
                    {getVeiculoLabel(maintenance) && (
                      <p className="text-xs text-blue-400 flex items-center gap-1 mb-2">
                        <Car className="w-3 h-3" />
                        {getVeiculoLabel(maintenance)}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">{displayLocaleDatetime(maintenance.data)}</p>
                        {maintenance.proxima_manutencao_km && (
                          <p className="text-xs text-gray-500">Próx: {formatNumber(maintenance.proxima_manutencao_km)} km</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {maintenance.status !== 'concluido' && (
                          <button
                            onClick={() => handleMarkComplete(maintenance.id)}
                            className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openModal(maintenance)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-premium-gray rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setDeleteId(maintenance.id); setIsDeleteModalOpen(true); }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedMaintenance ? 'Editar Manutenção' : 'Nova Manutenção'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Veículo"
            value={veiculoId}
            onChange={(e) => setVeiculoId(e.target.value)}
            options={veiculos.map(v => ({ value: v.id.toString(), label: `${v.modelo}${v.placa ? ` (${v.placa})` : ''}` }))}
          />

          <Select
            label="Tipo de Manutenção"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as MaintenanceType)}
            options={maintenanceTypeOptions}
          />
          
          <Input
            label="Valor (R$)"
            type="number"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Ex: 150.00"
          />

          <Input
            label="Próxima Manutenção KM (opcional)"
            type="number"
            value={proximaManutencaoKm}
            onChange={(e) => setProximaManutencaoKm(e.target.value)}
            placeholder="Ex: 10000"
          />
          
          <Input
            label="Data"
            type="datetime-local"
            value={dataManutencao}
            onChange={(e) => setDataManutencao(e.target.value)}
          />
          
          <Input
            label="Observações (opcional)"
            type="text"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Ex: Óleo sintético"
          />
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading} className="flex-1">
              {selectedMaintenance ? 'Salvar' : 'Cadastrar'}
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
        title="Excluir Manutenção"
        message="Tem certeza que deseja excluir esta manutenção? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
      />
    </MainLayout>
  );
}
