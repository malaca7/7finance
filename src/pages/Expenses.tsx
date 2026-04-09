import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, TrendingDown, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardHeader, Button, Input, Select, Modal, ConfirmModal } from '../components/ui';
import { MainLayout } from '../components/layout/MainLayout';
import { useAppStore } from '../store';
import { expensesApi } from '../api';
import type { Expense, ExpenseType, DateFilter } from '../types';
import { getLocalDatetimeForInput, displayLocaleDatetime } from '../utils/date';

const EXPENSES_COLORS = ['#EF4444', '#F97316', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#E5C158'];

const expenseTypeOptions = [
  { value: 'abastecimento', label: 'Abastecimento' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'lavagem', label: 'Lavagem' },
  { value: 'pedagio', label: 'Pedágio' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'aluguel', label: 'Aluguel do Carro' },
  { value: 'parcela', label: 'Parcelas' },
];

const filterOptions = [
  { value: 'diario', label: 'Hoje' },
  { value: 'semanal', label: 'Esta Semana' },
  { value: 'mensal', label: 'Este Mês' },
];

export function ExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense, dateFilter, setDateFilter, earnings, setExpenses } = useAppStore();
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setIsCollapsed(localStorage.getItem('sidebar_collapsed') === 'true');
    };
    window.addEventListener('sidebar-toggle', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('sidebar-toggle', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Form state
  const [tipo, setTipo] = useState<ExpenseType>('abastecimento');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(getLocalDatetimeForInput());

  useEffect(() => {
    loadExpenses();
  }, [dateFilter]);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await expensesApi.getAll(dateFilter);
      if (response.success && response.data) {
        setExpenses(response.data);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const openModal = (expense?: Expense) => {
    if (expense) {
      setSelectedExpense(expense);
      setTipo(expense.tipo);
      setValor(expense.valor.toString());
      setDescricao(expense.descricao || '');
      setData(expense.data); // Mantém a data original do registro
    } else {
      setSelectedExpense(null);
      setTipo('abastecimento');
      setValor('');
      setDescricao('');
      setData(getLocalDatetimeForInput());
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate - no negative values
    if (parseFloat(valor) < 0) {
      alert('Valor não pode ser negativo');
      return;
    }
    
    setIsLoading(true);

    try {
      const expenseData = {
        tipo,
        valor: parseFloat(valor),
        descricao: descricao || undefined,
        data, // Já possui a data/hora local correta
      };

      let response;
      if (selectedExpense) {
        response = await expensesApi.update(selectedExpense.id, expenseData);
        if (response.success && response.data) {
          updateExpense(selectedExpense.id, response.data);
        }
      } else {
        response = await expensesApi.create(expenseData);
        if (response.success && response.data) {
          addExpense(response.data);
        }
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setIsLoading(true);
    try {
      const response = await expensesApi.delete(deleteId);
      if (response.success) {
        deleteExpense(deleteId);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    } finally {
      setIsLoading(false);
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setSelectedExpense(null);
    setTipo('abastecimento');
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

  const getTypeLabel = (type: ExpenseType) => {
    const option = expenseTypeOptions.find(o => o.value === type);
    return option?.label || type;
  };

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, e) => sum + e.valor, 0);
  const totalEarnings = earnings.reduce((sum, e) => sum + e.valor, 0);
  const netProfit = totalEarnings - totalExpenses;
  
  const byType = expenses.reduce((acc, e) => {
    acc[e.tipo] = (acc[e.tipo] || 0) + e.valor;
    return acc;
  }, {} as Record<ExpenseType, number>);

  const chartData = expenseTypeOptions.map(option => ({
    name: option.label,
    value: byType[option.value as ExpenseType] || 0,
  })).filter(d => d.value > 0);

  return (
    <MainLayout>
      <div className="space-y-6 pb-40 md:pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Despesas</h1>
            <p className="text-gray-400 mt-1">Controle seus custos operacionais</p>
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
          <Card variant="warning">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/20 rounded-premium">
                <TrendingDown className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total de Despesas</p>
                <p className="text-xl font-bold text-white">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-premium-gold/20 rounded-premium">
                <TrendingDown className="w-6 h-6 text-premium-gold" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total de Ganhos</p>
                <p className="text-xl font-bold text-green-500">{formatCurrency(totalEarnings)}</p>
              </div>
            </div>
          </Card>

          <Card variant={netProfit >= 0 ? 'highlight' : 'warning'}>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-premium ${netProfit >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <TrendingDown className={`w-6 h-6 ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Lucro Líquido</p>
                <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(netProfit)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Despesas por Categoria" subtitle="Visualize seus gastos" />
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
                      <Cell key={`cell-${index}`} fill={EXPENSES_COLORS[index % EXPENSES_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {chartData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EXPENSES_COLORS[index % EXPENSES_COLORS.length] }} />
                  <span className="text-sm text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Total por Categoria" subtitle="Comparativo visual" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" stroke="#6B7280" fontSize={12} tickFormatter={(v) => `R$ ${v}`} />
                  <YAxis type="category" dataKey="name" stroke="#6B7280" fontSize={12} width={90} />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" fill="#EF4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* List */}
        <Card>
          <CardHeader title="Histórico de Despesas" subtitle={`${expenses.length} registros`} />
          
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma despesa registrada ainda</p>
              <p className="text-sm mt-1">Clique em "Nova Despesa" para começar</p>
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
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="border-b border-premium-gray/20 hover:bg-premium-gray/20">
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-sm">
                            {getTypeLabel(expense.tipo)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white font-medium">
                          {formatCurrency(expense.valor)}
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {expense.descricao || '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {displayLocaleDatetime(expense.data)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openModal(expense)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-premium-gray rounded-premium transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteId(expense.id);
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
                {expenses.map((expense) => (
                  <div key={expense.id} className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                          {getTypeLabel(expense.tipo)}
                        </span>
                        <span className="text-xs text-gray-500">{displayLocaleDatetime(expense.data)}</span>
                      </div>
                      <p className="text-white font-bold">{formatCurrency(expense.valor)}</p>
                      {expense.descricao && <p className="text-xs text-gray-500 truncate">{expense.descricao}</p>}
                    </div>
                    <div className="flex gap-1 ml-2 shrink-0">
                      <button
                        onClick={() => openModal(expense)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-premium-gray rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setDeleteId(expense.id); setIsDeleteModalOpen(true); }}
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
        title={selectedExpense ? 'Editar Despesa' : 'Nova Despesa'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Tipo de Despesa"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as ExpenseType)}
            options={expenseTypeOptions}
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
            placeholder="Ex: Posto Shell"
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
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading} variant="danger" className="flex-1">
              {selectedExpense ? 'Salvar' : 'Cadastrar'}
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
        title="Excluir Despesa"
        message="Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
      />

      {/* Botão de Nova Despesa Flutuante e Centralizado (Mobile) */}
      <div className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-full px-4 flex justify-center text-center">
        <Button 
          onClick={() => openModal()} 
          variant="danger"
          className="h-14 px-8 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-2xl shadow-red-900/40 border border-red-400/20 active:scale-95 transition-all w-full max-w-sm font-bold text-lg"
        >
          <Plus className="w-6 h-6 mr-2" />
          <span>NOVA DESPESA</span>
        </Button>
      </div>

      {/* Botão de Nova Despesa Flutuante (Desktop - Ao lado do Sidebar) */}
      <div className="hidden md:block fixed bottom-8 transition-all duration-300 pointer-events-none z-30" 
           style={{ 
             left: isCollapsed ? '80px' : '256px',
             width: 'auto'
           }}>
        <div className="pl-10 pointer-events-auto">
          <Button 
            onClick={() => openModal()} 
            variant="danger"
            className="h-14 px-6 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-2xl shadow-red-900/40 border border-red-400/20 active:scale-95 transition-all flex items-center gap-2 group"
          >
            <Plus className="w-5 h-5 group-hover:scale-125 transition-transform" />
            <span className="font-bold text-sm">NOVA DESPESA</span>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
