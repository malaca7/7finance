import { useEffect, useState } from 'react';
import { AlertCircle, Zap, Car, Gauge, TrendingDown, TrendingUp, Wrench, CheckCircle } from 'lucide-react';
import { Card, CardHeader, Button } from '../components/ui';
import { MainLayout } from '../components/layout/MainLayout';
import { adminApi } from '../api';
import type { SmartAlert, AdminDashboardData } from '../types';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

export function AdminAlertsPage() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getDashboardData();
      if (res.success) setDashboardData(res.data || null);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAlertIcon = (tipo: string) => {
    switch (tipo) {
      case 'manutencao': return <Wrench className="w-5 h-5" />;
      case 'km': return <Gauge className="w-5 h-5" />;
      case 'despesa': return <TrendingDown className="w-5 h-5" />;
      case 'lucro': return <TrendingUp className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getAlertColor = (tipo: string) => {
    switch (tipo) {
      case 'error': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'warning': return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
      default: return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'critico': return { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-400', label: 'Crítico' };
      case 'urgente': return { bg: 'bg-orange-500/10', border: 'border-orange-500', text: 'text-orange-400', label: 'Urgente' };
      case 'atencao': return { bg: 'bg-yellow-500/10', border: 'border-yellow-500', text: 'text-yellow-400', label: 'Atenção' };
      default: return { bg: 'bg-blue-500/10', border: 'border-blue-500', text: 'text-blue-400', label: 'Info' };
    }
  };

  const alerts = dashboardData?.alerts || [];

  const criticalAlerts = alerts.filter(a => a.tipo === 'error');
  const warningAlerts = alerts.filter(a => a.tipo === 'warning');
  const infoAlerts = alerts.filter(a => a.tipo === 'info');

  return (
    <MainLayout>
      <div className="space-y-6 pb-24 lg:pb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Alertas do Sistema</h1>
            <p className="text-gray-400 text-sm">Monitoramento em tempo real de todas as ocorrências</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant={criticalAlerts.length > 0 ? 'warning' : 'default'} className="border-l-4 border-l-red-500">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/20 rounded-2xl">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-neutral">Críticos</p>
                <p className="text-2xl font-bold text-white">{criticalAlerts.length}</p>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/20 rounded-2xl">
                <Zap className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-neutral">Atenção</p>
                <p className="text-2xl font-bold text-white">{warningAlerts.length}</p>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-2xl">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-neutral">Informativos</p>
                <p className="text-2xl font-bold text-white">{infoAlerts.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {alerts.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Tudo sob controle!</h3>
              <p className="text-gray-400">Nenhum alerta pendente no momento.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {alerts.length > 0 && (
              <>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  Críticos ({criticalAlerts.length})
                </h2>
                <div className="space-y-3">
                  {criticalAlerts.map(alert => (
                    <Card key={alert.id} className="border-l-4 border-l-red-500">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-red-500/20 rounded-full">
                          {getAlertIcon(alert.tipo)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="text-sm font-bold text-white">{alert.usuario_nome || 'Sistema'}</h5>
                            <span className="text-[10px] text-gray-500">{new Date(alert.data).toLocaleString('pt-BR')}</span>
                          </div>
                          <p className="text-xs text-gray-400">{alert.mensagem}</p>
                        </div>
                        <Link to="/admin/users">
                          <Button size="sm" variant="primary">Ver Usuário</Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {warningAlerts.length > 0 && (
              <>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Atenção ({warningAlerts.length})
                </h2>
                <div className="space-y-3">
                  {warningAlerts.map(alert => (
                    <Card key={alert.id} className="border-l-4 border-l-orange-500">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-orange-500/20 rounded-full">
                          {getAlertIcon(alert.tipo)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="text-sm font-bold text-white">{alert.usuario_nome || 'Sistema'}</h5>
                            <span className="text-[10px] text-gray-500">{new Date(alert.data).toLocaleString('pt-BR')}</span>
                          </div>
                          <p className="text-xs text-gray-400">{alert.mensagem}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {infoAlerts.length > 0 && (
              <>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Informativos ({infoAlerts.length})
                </h2>
                <div className="space-y-3">
                  {infoAlerts.map(alert => (
                    <Card key={alert.id} className="border-l-4 border-l-blue-500">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-500/20 rounded-full">
                          {getAlertIcon(alert.tipo)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="text-sm font-bold text-white">{alert.usuario_nome || 'Sistema'}</h5>
                            <span className="text-[10px] text-gray-500">{new Date(alert.data).toLocaleString('pt-BR')}</span>
                          </div>
                          <p className="text-xs text-gray-400">{alert.mensagem}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}