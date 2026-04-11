import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, PieChart, BarChart } from 'lucide-react';
import { BarChart as RechartsBar, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardHeader } from '../components/ui';
import { MainLayout } from '../components/layout/MainLayout';
import { adminApi } from '../api';
import type { AdminDashboardData } from '../types';

const COLORS = ['#D4AF37', '#E5C158', '#9CA3AF', '#3A3A3A', '#22C55E', '#EF4444'];

export function AdminAnalyticsPage() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getDashboardData();
      if (res.success) setDashboardData(res.data || null);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <MainLayout>
      <div className="space-y-6 pb-24 lg:pb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Análise Financeira</h1>
            <p className="text-gray-400 text-sm">Dados detalhados sobre a plataforma</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="highlight">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-2xl">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-neutral">Total Ganhos</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(dashboardData?.stats.totalGanhosGlobal || 0)}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-negative/20 rounded-2xl">
                <TrendingDown className="w-6 h-6 text-negative" />
              </div>
              <div>
                <p className="text-sm text-neutral">Total Despesas</p>
                <p className="text-xl font-bold text-negative">{formatCurrency(dashboardData?.stats.totalDespesasGlobal || 0)}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-2xl">
                <DollarSign className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-neutral">Receita Plataforma</p>
                <p className="text-xl font-bold text-white">{formatCurrency(dashboardData?.stats.receitaPlataforma || 0)}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-premium-gold/20 rounded-2xl">
                <TrendingUp className="w-6 h-6 text-premium-gold" />
              </div>
              <div>
                <p className="text-sm text-neutral">Ticket Médio</p>
                <p className="text-xl font-bold text-white">{formatCurrency(dashboardData?.stats.ticketMedioPorCorrida || 0)}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Distribuição de Despesas" subtitle="Análise global por categoria" />
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={dashboardData?.distribuicaoDespesas || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(dashboardData?.distribuicaoDespesas || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px' }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {(dashboardData?.distribuicaoDespesas || []).map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Faturamento Mensal" subtitle="Crescimento ao longo do tempo" />
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBar data={dashboardData?.graficoCrescimento || []}>
                  <XAxis dataKey="data" stroke="#4B5563" fontSize={10} />
                  <YAxis stroke="#4B5563" fontSize={10} />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #1F1F1F' }}
                  />
                  <Bar dataKey="receita" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                </RechartsBar>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader title="Top Motoristas mais Lucrativos" subtitle="Baseado em dados de desempenho real" />
          <div className="space-y-4 mt-6">
            {(dashboardData?.topDrivers || []).map((driver, index) => (
              <div key={driver.id} className="flex items-center justify-between p-4 bg-premium-gray/10 border border-premium-gray/30 rounded-app">
                <div className="flex items-center gap-4">
                  <div className="text-xl font-bold text-premium-gold/30 w-6">#{index + 1}</div>
                  <div className="w-10 h-10 rounded-full bg-premium-gray flex items-center justify-center font-bold text-white border border-premium-gold/20">
                    {driver.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{driver.nome}</p>
                    <p className="text-xs text-gray-500">{driver.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-500">{formatCurrency(driver.lucroLiquido)}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Lucro Líquido</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}