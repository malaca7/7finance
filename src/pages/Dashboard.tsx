import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, Gauge, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardHeader, Select } from '../components/ui';
import { MainLayout } from '../components/layout/MainLayout';
import { useAppStore } from '../store';
import { dashboardApi, earningsApi, expensesApi, kmApi } from '../api';
import { PlanBadge } from '../components/plans';
import { usePlanAccess } from '../hooks/usePlanAccess';
import type { DateFilter } from '../types';

const EARNINGS_COLORS = ['#22C55E', '#16A34A', '#065F46'];
const EXPENSES_COLORS = ['#EF4444', '#F97316', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#22C55E'];

const filterOptions = [
  { value: 'diario', label: 'Hoje' },
  { value: 'semanal', label: 'Esta Semana' },
  { value: 'mensal', label: 'Este Mês' },
];

export function DashboardPage() {
  const { user, setEarnings, setExpenses, setKmRegistries, dateFilter, setDateFilter, dashboardSummary, setDashboardSummary, setLoading } = useAppStore();
  const { planName } = usePlanAccess();

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-white">
                Olá, <span className="text-primary">{user?.nome?.split(' ')[0]}</span>!
              </h1>
              <PlanBadge plan={planName} size="sm" />
            </div>
            <p className="text-neutral mt-1 text-lg">Veja o resumo das suas finanças</p>
          </div>
          
          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            options={filterOptions}
            className="w-40"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="highlight" className="relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-full -mr-8 -mt-8" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <span className="text-primary text-base font-semibold">Total Ganhos</span>
              </div>
              <p className="text-3xl font-extrabold text-white">
                {formatCurrency(summary?.totalGanhos || 0)}
              </p>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-negative/20 to-transparent rounded-full -mr-8 -mt-8" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-negative/20 rounded-2xl">
                  <TrendingDown className="w-5 h-5 text-negative" />
                </div>
                <span className="text-neutral text-base font-semibold">Total Despesas</span>
              </div>
              <p className="text-3xl font-extrabold text-white">
                {formatCurrency(summary?.totalDespesas || 0)}
              </p>
            </div>
          </Card>

          <Card variant={(summary?.lucroLiquido || 0) >= 0 ? 'highlight' : 'warning'} className="relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-primary/20 to-transparent rounded-full -mr-8 -mt-8" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-2xl ${(summary?.lucroLiquido || 0) >= 0 ? 'bg-primary/20' : 'bg-negative/20'}`}>
                  <DollarSign className={`w-5 h-5 ${(summary?.lucroLiquido || 0) >= 0 ? 'text-primary' : 'text-negative'}`} />
                </div>
                <span className={`text-base font-semibold ${(summary?.lucroLiquido || 0) >= 0 ? 'text-primary' : 'text-negative'}`}>Lucro Líquido</span>
              </div>
              <p className={`text-3xl font-extrabold ${(summary?.lucroLiquido || 0) >= 0 ? 'text-primary' : 'text-negative'}`}>
                {formatCurrency(summary?.lucroLiquido || 0)}
              </p>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full -mr-8 -mt-8" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-2xl">
                  <Gauge className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-neutral text-base font-semibold">KM Rodados</span>
              </div>
              <p className="text-3xl font-extrabold text-white">
                {formatNumber(summary?.kmRodados || 0)} km
              </p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      backgroundColor: '#111827',
                      border: '1px solid rgba(34,197,94,0.2)',
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
                  <span className="text-sm text-neutral">{item.name}</span>
                </div>
              ))}
            </div>
          </Card>

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
                      backgroundColor: '#111827',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill="#EF4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader title="Ações Rápidas" subtitle="Acesse as principais funcionalidades" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/ganhos"
              className="flex flex-col items-center gap-2 p-4 bg-premium-darkGray/50 rounded-2xl hover:bg-primary/10 hover:shadow-glow-green-sm transition-all duration-300 group"
            >
              <TrendingUp className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-sm text-gray-300">Registrar Ganho</span>
            </Link>
            <Link
              to="/despesas"
              className="flex flex-col items-center gap-2 p-4 bg-premium-darkGray/50 rounded-2xl hover:bg-negative/10 transition-all duration-300 group"
            >
              <TrendingDown className="w-8 h-8 text-negative group-hover:scale-110 transition-transform" />
              <span className="text-sm text-gray-300">Registrar Despesa</span>
            </Link>
            <Link
              to="/km"
              className="flex flex-col items-center gap-2 p-4 bg-premium-darkGray/50 rounded-2xl hover:bg-blue-500/10 transition-all duration-300 group"
            >
              <Gauge className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
              <span className="text-sm text-gray-300">Registrar KM</span>
            </Link>
            <Link
              to="/manutencao"
              className="flex flex-col items-center gap-2 p-4 bg-premium-darkGray/50 rounded-2xl hover:bg-orange-500/10 transition-all duration-300 group"
            >
              <AlertTriangle className="w-8 h-8 text-orange-500 group-hover:scale-110 transition-transform" />
              <span className="text-sm text-gray-300">Manutenção</span>
            </Link>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}