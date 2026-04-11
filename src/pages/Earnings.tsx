import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardHeader, Button, Input, Select, Modal, ConfirmModal } from '../components/ui';
import { MainLayout } from '../components/layout/MainLayout';
import { useAppStore } from '../store';
import { earningsApi } from '../api';
import type { Earnings, EarningsType, DateFilter } from '../types';
import { getLocalDatetimeForInput, displayLocaleDatetime } from '../utils/date';

const EARNINGS_COLORS = ['#D4AF37', '#22C55E', '#3B82F6'];

const earningsTypeOptions = [
  { value: 'corrida', label: 'Corrida' },
  { value: 'gorjeta', label: 'Gorjeta' },
  { value: 'dinheiro', label: 'Dinheiro por Fora' },
];

const filterOptions = [
  { value: 'diario', label: 'Hoje' },
  { value: 'semanal', label: 'Esta Semana' },
  { value: 'mensal', label: 'Este Mês' },
];

export function EarningsPage() {
  const { earnings, addEarnings, updateEarnings, deleteEarnings, dateFilter, setDateFilter, setEarnings } = useAppStore();
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Escutar mudanças no localStorage (disparadas pelo Sidebar)
    const handleStorageChange = () => {
      setIsCollapsed(localStorage.getItem('sidebar_collapsed') === 'true');
    };
    
    // Custom event para mudanças no mesmo documento
    window.addEventListener('sidebar-toggle', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('sidebar-toggle', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEarning, setSelectedEarning] = useState<Earnings | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  // Form state
  const [tipo, setTipo] = useState<EarningsType>('corrida');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(getLocalDatetimeForInput());

  useEffect(() => {
    loadEarnings();
  }, [dateFilter]);

  const loadEarnings = async () => {
    setIsLoading(true);
    try {
      const response = await earningsApi.getAll(dateFilter);
      if (response.success && response.data) {
        setEarnings(response.data);
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (earning?: Earnings) => {
    if (earning) {
      setSelectedEarning(earning);
      setTipo(earning.tipo);
      setValor(earning.valor.toString());
      setDescricao(earning.descricao || '');
      setData(earning.data); // Mantém a data original do registro
    } else {
      setSelectedEarning(null);
      setTipo('corrida');
      setValor('');
      setDescricao('');
      setData(getLocalDatetimeForInput());
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const earningData = {
        tipo,
        valor: parseFloat(valor),
        descricao: descricao || undefined,
        data, // Já possui a data/hora local correta
      };

      let response;
      if (selectedEarning) {
        response = await earningsApi.update(selectedEarning.id, earningData);
        if (response.success && response.data) {
          updateEarnings(selectedEarning.id, response.data);
        }
      } else {
        response = await earningsApi.create(earningData);
        if (response.success && response.data) {
          addEarnings(response.data);
        }
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving earning:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setIsLoading(true);
    try {
      const response = await earningsApi.delete(deleteId);
      if (response.success) {
        deleteEarnings(deleteId);
      }
    } catch (error) {
      console.error('Error deleting earning:', error);
    } finally {
      setIsLoading(false);
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setSelectedEarning(null);
    setTipo('corrida');
    setValor('');
    setDescricao('');
    setData(getLocalDatetimeForInput());
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getTypeLabel = (type: EarningsType) => {
    const option = earningsTypeOptions.find(o => o.value === type);
    return option?.label || type;
  };

  // Calculate totals
  const totalEarnings = earnings.reduce((sum, e) => sum + e.valor, 0);
  const byType = earnings.reduce((acc, e) => {
    acc[e.tipo] = (acc[e.tipo] || 0) + e.valor;
    return acc;
  }, {} as Record<EarningsType, number>);

  const chartData = [
    { name: 'Corridas', value: byType.corrida || 0 },
    { name: 'Gorjetas', value: byType.gorjeta || 0 },
    { name: 'Dinheiro', value: byType.dinheiro || 0 },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 pb-32 md:pb-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Ganhos</h1>
            <p className="text-gray-400 mt-1">Registre suas fontes de renda</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              options={filterOptions}
              className="w-36"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="highlight">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-premium-gold/20 rounded-premium">
                <TrendingUp className="w-6 h-6 text-premium-gold" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total de Ganhos</p>
                <p className="text-xl font-bold text-white">{formatCurrency(totalEarnings)}</p>
              </div>
            </div>
          </Card>

          {earningsTypeOptions.map((option) => (
            <Card key={option.value}>
              <div className="flex items-center gap-3">
                <div 
                  className="p-3 rounded-premium"
                  style={{ backgroundColor: `${EARNINGS_COLORS[earningsTypeOptions.findIndex(o => o.value === option.value)]}20` }}
                >
                  <TrendingUp 
                    className="w-6 h-6" 
                    style={{ color: EARNINGS_COLORS[earningsTypeOptions.findIndex(o => o.value === option.value)] }}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-400">{option.label}</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(byType[option.value as EarningsType] || 0)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Distribuição por Tipo" subtitle="Visualize seus ganhos" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={EARNINGS_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {chartData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EARNINGS_COLORS[index] }} />
                  <span className="text-sm text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Total por Categoria" subtitle="Comparativo visual" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(v) => `R$ ${v}`} />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* List */}
        <Card>
          <CardHeader title="Histórico de Ganhos" subtitle={`${earnings.length} registros`} />
          
          {earnings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum ganho registrado ainda</p>
              <p className="text-sm mt-1">Clique em "Novo Ganho" para começar</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-premium-gray/30">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tipo</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Valor</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Descrição</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Data</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map((earning) => (
                      <tr key={earning.id} className="border-b border-premium-gray/20 hover:bg-premium-gray/20">
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-premium-gold/20 text-premium-gold rounded text-sm">
                            {getTypeLabel(earning.tipo)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white font-medium">
                          {formatCurrency(earning.valor)}
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {earning.descricao || '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {displayLocaleDatetime(earning.data)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openModal(earning)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-premium-gray rounded-premium transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteId(earning.id);
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
                {earnings.map((earning) => (
                  <div key={earning.id} className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-premium-gold/20 text-premium-gold rounded text-xs font-medium">
                          {getTypeLabel(earning.tipo)}
                        </span>
                        <span className="text-xs text-gray-500">{displayLocaleDatetime(earning.data)}</span>
                      </div>
                      <p className="text-white font-bold">{formatCurrency(earning.valor)}</p>
                      {earning.descricao && <p className="text-xs text-gray-500 truncate">{earning.descricao}</p>}
                    </div>
                    <div className="flex gap-1 ml-2 shrink-0">
                      <button
                        onClick={() => openModal(earning)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-premium-gray rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setDeleteId(earning.id); setIsDeleteModalOpen(true); }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
        title={selectedEarning ? 'Editar Ganho' : 'Novo Ganho'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Tipo de Ganho"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as EarningsType)}
            options={earningsTypeOptions}
          />
          
          <Input
            label="Valor"
            type="number"
            step="0.01"
            min="0"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            required
          />
          
          <Input
            label="Descrição (opcional)"
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Corrida para o aeroporto"
          />
          
          <Input
            label="Data"
            type="datetime-local"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
          />
          
          <div className="flex gap-3 pt-4">
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
              {selectedEarning ? 'Salvar' : 'Cadastrar'}
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
        title="Excluir Ganho"
        message="Tem certeza que deseja excluir este ganho? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
      />

      {/* Botão de Novo Ganho Flutuante e Centralizado (Mobile) */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-full px-4 flex justify-center">
        <Button 
          onClick={() => openModal()} 
          variant="primary"
          className="h-14 px-8 w-full max-w-sm font-bold text-lg"
        >
          <Plus className="w-6 h-6 mr-2" />
          <span>NOVO GANHO</span>
        </Button>
      </div>

      {/* Botão de Novo Ganho Flutuante (Desktop - Ao lado do Sidebar) */}
      <div className="hidden md:block fixed bottom-8 transition-all duration-300 pointer-events-none z-30" 
           style={{ 
             left: isCollapsed ? '80px' : '256px',
             width: 'auto'
           }}>
        <div className="pl-10 pointer-events-auto">
          <Button 
            onClick={() => openModal()} 
            className="h-14 px-6 bg-green-600 hover:bg-green-500 text-white rounded-full shadow-2xl shadow-green-900/40 border border-green-400/20 active:scale-95 transition-all flex items-center gap-2 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span className="font-bold text-sm">NOVO GANHO</span>
          <Button 
            onClick={() => openModal()} 
            variant="primary"
            className="h-14 px-6 flex items-center gap-2 group font-bold text-lg"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span>NOVO GANHO</span>
          </Button>
