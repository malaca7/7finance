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

  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [filterVeiculoId, setFilterVeiculoId] = useState<string>('all');

  const [tipo, setTipo] = useState<MaintenanceType>('oleo');
  const [veiculoId, setVeiculoId] = useState<string>('');
  const [proximaManutencaoKm, setProximaManutencaoKm] = useState('');
  const [dataManutencao, setDataManutencao] = useState('');
  const [valor, setValor] = useState('');
  const [obs, setObs] = useState('');

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getTypeLabel = (type: MaintenanceType) => {
    const option = maintenanceTypeOptions.find(o => o.value === type);
    return option?.label || type;
  };

  const getStatusColor = (status: MaintenanceStatus) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-500/20 text-yellow-400';
      case 'urgente': return 'bg-orange-500/20 text-orange-400';
      case 'atrasado': return 'bg-negative/20 text-negative';
      case 'concluido': return 'bg-primary/20 text-primary';
      default: return 'bg-neutral/20 text-neutral';
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

  const filteredMaintenances = filterVeiculoId === 'all' 
    ? maintenances 
    : maintenances.filter(m => m.veiculo_id?.toString() === filterVeiculoId);

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Manutenção</h1>
            <p className="text-neutral mt-1">Controle de manutenção por veículo</p>
          </div>
          
          <div className="flex items-center gap-3">
            {veiculos.length > 0 && (
              <select
                value={filterVeiculoId}
                onChange={(e) => setFilterVeiculoId(e.target.value)}
                className="bg-premium-darkGray border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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

        {veiculos.length === 0 && (
          <Card variant="warning">
            <div className="flex items-center gap-3 p-2">
              <Car className="w-8 h-8 text-orange-400 shrink-0" />
              <div>
                <p className="text-white font-bold">Nenhum veículo cadastrado</p>
                <p className="text-neutral text-sm">Cadastre um veículo na página de KM antes de registrar manutenções.</p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="highlight">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-2xl">
                <Wrench className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-neutral">Pendentes</p>
                <p className="text-xl font-bold text-white">{pending}</p>
              </div>
            </div>
          </Card>

          <Card variant="warning">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/20 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-neutral">Urgentes</p>
                <p className="text-xl font-bold text-white">{urgent}</p>
              </div>
            </div>
          </Card>

          <Card variant="warning">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-negative/20 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-negative" />
              </div>
              <div>
                <p className="text-sm text-neutral">Atrasados</p>
                <p className="text-xl font-bold text-white">{overdue}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-2xl">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-neutral">Concluídos</p>
                <p className="text-xl font-bold text-white">{completed}</p>
              </div>
            </div>
          </Card>
        </div>

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
                  className="flex items-center justify-between p-4 bg-negative/10 border border-negative/30 rounded-full"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-negative" />
                    <div>
                      <p className="font-medium text-white">{alert.descricao || 'Manutenção'}</p>
                      <p className="text-sm text-neutral">
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
                    Concluir
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <CardHeader title="Histórico de Manutenção" subtitle={`${filteredMaintenances.length} registros${filterVeiculoId !== 'all' ? ` • ${veiculos.find(v => v.id.toString() === filterVeiculoId)?.modelo || ''}` : ''}`} />
          
          {filteredMaintenances.length === 0 ? (
            <div className="text-center py-8 text-neutral">
              <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma manutenção cadastrada ainda</p>
              <p className="text-sm mt-1">Clique em "Nova Manutenção" para começar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMaintenances.map((maintenance) => (
                <div 
                  key={maintenance.id} 
                  className="flex items-center justify-between p-4 bg-premium-darkGray/50 rounded-full hover:bg-primary/10 hover:shadow-glow-green-sm transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                      <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                        {maintenance.descricao || 'Manutenção'}
                      </span>
                      {maintenance.valor && (
                        <span className="text-neutral text-sm">{formatCurrency(maintenance.valor)}</span>
                      )}
                      <span className="text-neutral text-sm">{displayLocaleDatetime(maintenance.data)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(maintenance.status)}`}>
                      {getStatusIcon(maintenance.status)}
                      {maintenance.status.charAt(0).toUpperCase() + maintenance.status.slice(1)}
                    </span>
                    <div className="flex gap-1">
                      {maintenance.status !== 'concluido' && (
                        <button
                          onClick={() => handleMarkComplete(maintenance.id)}
                          className="p-2 text-neutral hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-200"
                          title="Marcar como concluído"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openModal(maintenance)}
                        className="p-2 text-neutral hover:text-white hover:bg-premium-darkGray rounded-full transition-all duration-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(maintenance.id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 text-neutral hover:text-negative hover:bg-negative/10 rounded-full transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

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