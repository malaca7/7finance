import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Gauge, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardHeader, Select } from '../components/ui';
import { MainLayout } from '../components/layout/MainLayout';
import { useAppStore } from '../store';
import { dashboardApi, earningsApi, expensesApi, kmApi } from '../api';
import type { DateFilter } from '../types';

const COLORS = {
  gold: '#D4AF37',
  goldLight: '#E5C158',
  green: '#22C55E',
  red: '#EF4444',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  orange: '#F97316',
  pink: '#EC4899',
  cyan: '#06B6D4',
  lime: '#84CC16',
};

const EARNINGS_COLORS = ['#D4AF37', '#22C55E', '#3B82F6'];
const EXPENSES_COLORS = ['#EF4444', '#F97316', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#E5C158'];

const filterOptions = [
  { value: 'diario', label: 'Hoje' },
  { value: 'semanal', label: 'Esta Semana' },
  { value: 'mensal', label: 'Este Mês' },
];

export function DashboardPage() {
  const { user, setEarnings, setExpenses, setKmRegistries, dateFilter, setDateFilter, dashboardSummary, setDashboardSummary, setLoading } = useAppStore();

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      const [summaryRes, earningsRes, expensesRes, kmRes] = await Promise.all([
        dashboardApi.getSummary(dateFilter),
        earningsApi.getAll(dateFilter),
        expensesApi.getAll(dateFilter),
        kmApi.getAll(),
      ]);

      if (summaryRes.success && summaryRes.data) {
        setDashboardSummary(summaryRes.data);
      }
      if (earningsRes.success && earningsRes.data) {
        setEarnings(earningsRes.data);
      }
      if (expensesRes.success && expensesRes.data) {
        setExpenses(expensesRes.data);
      }
      if (kmRes.success && kmRes.data) {
        setKmRegistries(kmRes.data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const summary = dashboardSummary;

  const earningsData = summary ? [
    { name: 'Corridas', value: summary.ganhosPorTipo?.corrida || 0 },
    { name: 'Gorjetas', value: summary.ganhosPorTipo?.gorjeta || 0 },
    { name: 'Dinheiro', value: summary.ganhosPorTipo?.dinheiro || 0 },
  ] : [];

  const expensesData = summary ? [
    { name: 'Abastecimento', value: summary.despesasPorTipo?.abastecimento || 0 },
    { name: 'Manutenção', value: summary.despesasPorTipo?.manutencao || 0 },
    { name: 'Lavagem', value: summary.despesasPorTipo?.lavagem || 0 },
    { name: 'Pedágio', value: summary.despesasPorTipo?.pedagio || 0 },
    { name: 'Alimentação', value: summary.despesasPorTipo?.alimentacao || 0 },
    { name: 'Aluguel', value: summary.despesasPorTipo?.aluguel || 0 },
    { name: 'Parcelas', value: summary.despesasPorTipo?.parcela || 0 },
  ] : [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Olá, {user?.nome?.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-400 mt-1">Veja o resumo das suas finanças</p>
          </div>
          
          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            options={filterOptions}
            className="w-40"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Earnings */}
          <Card variant="highlight" className="relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-premium-gold/10 rounded-full -mr-8 -mt-8" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-premium-gold/20 rounded-premium">
                  <TrendingUp className="w-5 h-5 text-premium-gold" />
                </div>
                <span className="text-gray-400 text-sm">Total Ganhos</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(summary?.totalGanhos || 0)}
              </p>
            </div>
          </Card>

          {/* Total Expenses */}
          <Card className="relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/10 rounded-full -mr-8 -mt-8" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-500/20 rounded-premium">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-gray-400 text-sm">Total Despesas</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(summary?.totalDespesas || 0)}
              </p>
            </div>
          </Card>

          {/* Net Profit */}
          <Card variant={(summary?.lucroLiquido || 0) >= 0 ? 'highlight' : 'warning'} className="relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-green-500/10 rounded-full -mr-8 -mt-8" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-premium ${(summary?.lucroLiquido || 0) >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  <DollarSign className={`w-5 h-5 ${(summary?.lucroLiquido || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
                <span className="text-gray-400 text-sm">Lucro Líquido</span>
              </div>
              <p className={`text-2xl font-bold ${(summary?.lucroLiquido || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(summary?.lucroLiquido || 0)}
              </p>
            </div>
          </Card>

          {/* KM Rodados */}
          <Card className="relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-8 -mt-8" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-premium">
                  <Gauge className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-gray-400 text-sm">KM Rodados</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatNumber(summary?.kmRodados || 0)} km
              </p>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earnings Chart */}
          <Card>
            <CardHeader title="Ganhos por Tipo" subtitle="Distribuição das entradas" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={earningsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {earningsData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={EARNINGS_COLORS[index % EARNINGS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{
                      backgroundColor: '#1A1A1A',
                      border: '1px solid #2A2A2A',
                      borderRadius: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {earningsData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EARNINGS_COLORS[index] }} />
                  <span className="text-sm text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Expenses Chart */}
          <Card>
            <CardHeader title="Despesas por Tipo" subtitle="Categoria de gastos" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expensesData.filter(d => d.value > 0)} layout="vertical">
                  <XAxis type="number" tickFormatter={(value) => `R$ ${value}`} stroke="#6B7280" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#6B7280" fontSize={12} width={80} />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{
                      backgroundColor: '#1A1A1A',
                      border: '1px solid #2A2A2A',
                      borderRadius: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill="#EF4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader title="Ações Rápidas" subtitle="Acesse as principais funcionalidades" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/ganhos"
              className="flex flex-col items-center gap-2 p-4 bg-premium-gray/30 rounded-premium hover:bg-premium-gold/10 transition-colors group"
            >
              <TrendingUp className="w-8 h-8 text-premium-gold group-hover:text-premium-goldLight" />
              <span className="text-sm text-gray-300">Registrar Ganho</span>
            </a>
            <a
              href="/despesas"
              className="flex flex-col items-center gap-2 p-4 bg-premium-gray/30 rounded-premium hover:bg-red-500/10 transition-colors group"
            >
              <TrendingDown className="w-8 h-8 text-red-500 group-hover:text-red-400" />
              <span className="text-sm text-gray-300">Registrar Despesa</span>
            </a>
            <a
              href="/km"
              className="flex flex-col items-center gap-2 p-4 bg-premium-gray/30 rounded-premium hover:bg-blue-500/10 transition-colors group"
            >
              <Gauge className="w-8 h-8 text-blue-500 group-hover:text-blue-400" />
              <span className="text-sm text-gray-300">Registrar KM</span>
            </a>
            <a
              href="/manutencao"
              className="flex flex-col items-center gap-2 p-4 bg-premium-gray/30 rounded-premium hover:bg-orange-500/10 transition-colors group"
            >
              <AlertTriangle className="w-8 h-8 text-orange-500 group-hover:text-orange-400" />
              <span className="text-sm text-gray-300">Manutenção</span>
            </a>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
