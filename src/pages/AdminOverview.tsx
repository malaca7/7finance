import { useEffect, useState } from 'react';
import { 
  Users, TrendingUp, DollarSign, AlertCircle, 
  Activity, Zap, Download, Shield
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, Button } from '../components/ui';
import { MainLayout } from '../components/layout/MainLayout';
import { useAppStore } from '../store';
import { adminApi } from '../api';
import type { AdminDashboardData } from '../types';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

export function AdminOverviewPage() {
  const { user } = useAppStore();
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getDashboardData();
      if (res.success) setDashboardData(res.data || null);
    } catch (error) {
      console.error('Error loading dashboard:', error);
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
            <h1 className="text-3xl font-bold text-white tracking-tight">
              7 <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent drop-shadow-[0_0_8px_#39FF14]">Admin</span>
            </h1>
            <p className="text-gray-400 text-sm">Controle total da plataforma e gestão de usuários</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Link to="/admin/settings">
              <Button variant="secondary" size="sm">
                <Shield className="w-4 h-4 mr-2" />
                Configurações
              </Button>
            </Link>
          </div>
        </div>

        {dashboardData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card variant="highlight" className="border-l-4 border-l-primary">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Usuários Ativos</p>
                    <h3 className="text-2xl font-bold text-white">{dashboardData.stats.usuariosAtivos}</h3>
                    <p className="text-[10px] text-green-500 mt-1 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" /> +{dashboardData.stats.novosUsuarios7Dias} esta semana
                    </p>
                  </div>
                  <div className="p-2 bg-premium-gold/10 rounded-lg">
                    <Users className="w-5 h-5 text-premium-gold" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Ganhos Globais</p>
                    <h3 className="text-2xl font-bold text-white">{formatCurrency(dashboardData.stats.totalGanhosGlobal)}</h3>
                    <p className="text-[10px] text-gray-500 mt-1">Total acumulado na rede</p>
                  </div>
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Lucro Médio/Mot.</p>
                    <h3 className="text-2xl font-bold text-white">{formatCurrency(dashboardData.stats.lucroMedioPorMotorista)}</h3>
                    <p className="text-[10px] text-blue-400 mt-1">Desempenho por motorista</p>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </Card>

              <Card variant="warning">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Alertas Críticos</p>
                    <h3 className="text-2xl font-bold text-white">{dashboardData.alerts.length}</h3>
                    <p className="text-[10px] text-red-400 mt-1">Ações necessárias</p>
                  </div>
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader title="Crescimento da Plataforma" subtitle="Usuários vs Faturamento" />
                <div className="h-72 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData.graficoCrescimento}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="data" stroke="#4B5563" fontSize={12} />
                      <YAxis stroke="#4B5563" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid #1F1F1F', borderRadius: '12px' }}
                        itemStyle={{ color: '#F0F0F0' }}
                      />
                      <Area type="monotone" dataKey="usuarios" stroke="#D4AF37" fillOpacity={1} fill="url(#colorUsers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-premium-dark to-premium-black border-premium-gold/20">
                  <h4 className="flex items-center gap-2 text-premium-gold font-bold mb-4">
                    <Zap className="w-4 h-4" /> Smart Insights
                  </h4>
                  <div className="space-y-4">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-xs text-gray-400">Eficiência</p>
                      <p className="text-sm text-white font-medium mt-1">
                        {dashboardData.stats.percentualBaixoLucro}% dos motoristas estão com lucro abaixo do ideal.
                      </p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-xs text-gray-400">Inatividade</p>
                      <p className="text-sm text-white font-medium mt-1">
                        {dashboardData.stats.usuariosInativos} motoristas não trabalham há mais de 3 dias.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h4 className="text-white font-bold mb-4">Ações Rápidas</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/admin/analytics">
                      <Button variant="primary" className="p-3 text-xs flex flex-col items-center gap-2 w-full">
                        <Download className="w-4 h-4" /> Relatório Geral
                      </Button>
                    </Link>
                    <Link to="/admin/logs">
                      <Button variant="primary" className="p-3 text-xs flex flex-col items-center gap-2 w-full">
                        <Activity className="w-4 h-4" /> Auditoria
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </div>

            {dashboardData.alerts.length > 0 && (
              <Card>
                <CardHeader title="Alertas Inteligentes" subtitle="Monitoramento em tempo real" />
                <div className="space-y-3 mt-4">
                  {dashboardData.alerts.map(alert => (
                    <div 
                      key={alert.id} 
                      className="flex items-start gap-4 p-4 bg-premium-gray/20 rounded-app border border-premium-gray/30 group hover:border-premium-gold/30 transition-all"
                    >
                      <div className={clsx(
                        "p-2 rounded-full",
                        alert.tipo === 'error' ? "bg-red-500/20 text-red-500" : "bg-orange-500/20 text-orange-500"
                      )}>
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-bold text-white">{alert.usuario_nome}</h5>
                          <span className="text-[10px] text-gray-500">{new Date(alert.data).toLocaleTimeString('pt-BR')}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{alert.mensagem}</p>
                      </div>
                      <Link to="/admin/alerts">
                        <Button className="opacity-0 group-hover:opacity-100 p-2 text-[10px] font-bold" variant="primary">
                          AGIR
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}