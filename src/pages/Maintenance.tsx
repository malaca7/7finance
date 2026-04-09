import { useEffect, useState } from 'react';
import { Plus, Wrench, AlertTriangle, CheckCircle, Clock, Edit2, Trash2 } from 'lucide-react';
import { Card, CardHeader, Button, Input, Select, Modal, ConfirmModal } from '../components/ui';
import { MainLayout } from '../components/layout/MainLayout';
import { useAppStore } from '../store';
import { maintenanceApi, kmApi } from '../api';
import type { Maintenance, MaintenanceType, MaintenanceStatus } from '../types';
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

  // Form state
  const [tipo, setTipo] = useState<MaintenanceType>('oleo');
  const [kmLimite, setKmLimite] = useState('');
  const [dataLimite, setDataLimite] = useState('');
  const [obs, setObs] = useState('');

  // Get current KM
  const currentKm = kmRegistries.length > 0 ? kmRegistries[0].km_final : 0;

  useEffect(() => {
    loadMaintenances();
  }, []);

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
      setTipo(maintenance.tipo || 'oleo');
      setKmLimite(maintenance.km_limite?.toString() || '');
      setDataLimite(maintenance.data_limite ? getLocalDatetimeForInput(maintenance.data_limite) : '');
      setObs(maintenance.observacao || '');
    } else {
      setSelectedMaintenance(null);
      setTipo('oleo');
      setKmLimite('');
      setDataLimite(getLocalDatetimeForInput());
      setObs('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const maintenanceData = {
        tipo,
        km_realizada: kmLimite ? parseInt(kmLimite) : 0, // Mapping to backend column
        valor: 0,
        descricao: obs || '',
        data: dataLimite, // Usa a data preenchida no modal
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
    setKmLimite('');
    setDataLimite('');
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

  // Calculate alerts
  const alerts = maintenances.filter(m => {
    if (m.status === 'concluido') return false;
    if (m.km_limite && currentKm >= m.km_limite) return true;
    if (m.data_limite && new Date(m.data_limite) <= new Date()) return true;
    return false;
  });

  const pending = maintenances.filter(m => m.status === 'pendente').length;
  const urgent = maintenances.filter(m => m.status === 'urgente').length;
  const overdue = maintenances.filter(m => m.status === 'atrasado').length;
  const completed = maintenances.filter(m => m.status === 'concluido').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Manutenção</h1>
            <p className="text-gray-400 mt-1">Controle de manutenção do veículo</p>
          </div>
          
          <Button onClick={() => openModal()}>
            <Plus className="w-5 h-5 mr-2" />
            Nova Manutenção
          </Button>
        </div>

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
                      <p className="font-medium text-white">{getTypeLabel(alert.tipo)}</p>
                      <p className="text-sm text-gray-400">
                        {alert.km_limite && currentKm >= alert.km_limite 
                          ? `KM atual (${formatNumber(currentKm)}) excedeu limite (${formatNumber(alert.km_limite)})`
                          : alert.data_limite && new Date(alert.data_limite) <= new Date()
                            ? `Data limite excedida: ${displayLocaleDatetime(alert.data_limite)}`
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
          <CardHeader title="Histórico de Manutenção" subtitle={`${maintenances.length} registros`} />
          
          {maintenances.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma manutenção cadastrada ainda</p>
              <p className="text-sm mt-1">Clique em "Nova Manutenção" para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-premium-gray/30">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tipo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">KM Limite</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Data Limite</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenances.map((maintenance) => (
                    <tr key={maintenance.id} className="border-b border-premium-gray/20 hover:bg-premium-gray/20">
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-premium-gold/20 text-premium-gold rounded text-sm">
                          {getTypeLabel(maintenance.tipo)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white">
                        {maintenance.km_limite ? `${formatNumber(maintenance.km_limite)} km` : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {displayLocaleDatetime(maintenance.data_limite)}
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
            label="Tipo de Manutenção"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as MaintenanceType)}
            options={maintenanceTypeOptions}
          />
          
          <Input
            label="KM Limite (opcional)"
            type="number"
            value={kmLimite}
            onChange={(e) => setKmLimite(e.target.value)}
            placeholder="Ex: 10000"
          />
          
          <Input
            label="Data Limite (opcional)"
            type="datetime-local"
            value={dataLimite}
            onChange={(e) => setDataLimite(e.target.value)}
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
