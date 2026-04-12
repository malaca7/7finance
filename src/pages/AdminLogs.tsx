import { useEffect, useState } from 'react';
import { 
  FileText, Search, Activity, UserCheck, Edit2, Trash2, 
  LogIn, LogOut, Download, Key, User
} from 'lucide-react';
import { Card, CardHeader, Button } from '../components/ui';
import { MainLayout } from '../components/layout/MainLayout';
import { useAppStore } from '../store';
import { logsApi, usersApi } from '../api';
import type { User as UserType } from '../types';
import { clsx } from 'clsx';

export function AdminLogsPage() {
  const { allUsers } = useAppStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logFilterAction, setLogFilterAction] = useState<string>('all');
  const [logFilterRole, setLogFilterRole] = useState<string>('all');
  const [logDateStart, setLogDateStart] = useState<string>('');
  const [logDateEnd, setLogDateEnd] = useState<string>('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await logsApi.getAll({
        action: logFilterAction !== 'all' ? logFilterAction : undefined,
        startDate: logDateStart || undefined,
        endDate: logDateEnd ? `${logDateEnd}T23:59:59` : undefined,
        role: logFilterRole === 'admin' || logFilterRole === 'user' ? logFilterRole : undefined
      });
      if (res.success) setLogs(res.data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!logSearchTerm) return true;
    const userName = log.users?.name || log.users?.email || 'Usuário';
    return (
      (log.action || '').toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      (log.entity || '').toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      userName.toLowerCase().includes(logSearchTerm.toLowerCase())
    );
  });

  const actionColors: Record<string, string> = {
    'CRIAR_USUARIO': 'bg-green-500/20 text-green-400 border-green-500/30',
    'EDITAR_USUARIO': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'EXCLUIR_USUARIO': 'bg-red-500/20 text-red-400 border-red-500/30',
    'EXPORTAR': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'LOGIN': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'LOGOUT': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'REGISTRO': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'CRIAR_REGISTRO': 'bg-green-500/20 text-green-400',
    'EDITAR_REGISTRO': 'bg-yellow-500/20 text-yellow-400',
    'EXCLUIR_REGISTRO': 'bg-red-500/20 text-red-400',
    'REDEFINIR_SENHA': 'bg-cyan-500/20 text-cyan-400',
    'ALTERAR_PERFIL': 'bg-pink-500/20 text-pink-400',
    'ALTERAR_PLANO': 'bg-amber-500/20 text-amber-400',
  };

  const actionLabels: Record<string, string> = {
    'CRIAR_USUARIO': 'Criar Usuário',
    'EDITAR_USUARIO': 'Editar Usuário',
    'EXCLUIR_USUARIO': 'Excluir Usuário',
    'EXPORTAR': 'Exportação',
    'LOGIN': 'Login',
    'LOGOUT': 'Logout',
    'REGISTRO': 'Cadastro',
    'CRIAR_REGISTRO': 'Criar Registro',
    'EDITAR_REGISTRO': 'Editar Registro',
    'EXCLUIR_REGISTRO': 'Excluir Registro',
    'REDEFINIR_SENHA': 'Redefinir Senha',
    'ALTERAR_PERFIL': 'Alterar Perfil',
    'ALTERAR_PLANO': 'Alterar Plano',
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN': return <LogIn className="w-4 h-4" />;
      case 'LOGOUT': return <LogOut className="w-4 h-4" />;
      case 'CRIAR_USUARIO':
      case 'CRIAR_REGISTRO': return <User className="w-4 h-4" />;
      case 'EDITAR_USUARIO':
      case 'EDITAR_REGISTRO': return <Edit2 className="w-4 h-4" />;
      case 'EXCLUIR_USUARIO':
      case 'EXCLUIR_REGISTRO': return <Trash2 className="w-4 h-4" />;
      case 'REDEFINIR_SENHA': return <Key className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 pb-24 lg:pb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Logs de Auditoria</h1>
            <p className="text-gray-400 text-sm">Registro completo de todas as ações do sistema</p>
          </div>
        </div>

        <Card className="!p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text"
                placeholder="Buscar nos logs..."
                value={logSearchTerm}
                onChange={(e) => setLogSearchTerm(e.target.value)}
                className="w-full bg-premium-black border border-premium-gray/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-premium-gold transition-all"
              />
            </div>
            
            <select
              value={logFilterRole}
              onChange={(e) => {
                setLogFilterRole(e.target.value);
                loadLogs();
              }}
              className="bg-premium-darkGray border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Todos os Usuários</option>
              <option value="admin">Apenas Administradores</option>
              <option value="user">Apenas Usuários</option>
            </select>
            
            <select
              value={logFilterAction}
              onChange={(e) => {
                setLogFilterAction(e.target.value);
                loadLogs();
              }}
              className="bg-premium-darkGray border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Todas Ações</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="REGISTRO">Cadastro</option>
              <option value="CRIAR_REGISTRO">Criar Registro</option>
              <option value="EDITAR_REGISTRO">Editar Registro</option>
              <option value="EXCLUIR_REGISTRO">Excluir Registro</option>
              <option value="CRIAR_USUARIO">Criar Usuário</option>
              <option value="EDITAR_USUARIO">Editar Usuário</option>
              <option value="EXCLUIR_USUARIO">Excluir Usuário</option>
              <option value="REDEFINIR_SENHA">Redefinir Senha</option>
              <option value="EXPORTAR">Exportar</option>
              <option value="ALTERAR_PERFIL">Alterar Perfil</option>
              <option value="ALTERAR_PLANO">Alterar Plano</option>
            </select>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral">De:</label>
              <input
                type="date"
                value={logDateStart}
                onChange={(e) => setLogDateStart(e.target.value)}
                className="bg-premium-darkGray border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral">Até:</label>
              <input
                type="date"
                value={logDateEnd}
                onChange={(e) => setLogDateEnd(e.target.value)}
                className="bg-premium-darkGray border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button variant="primary" size="sm" onClick={loadLogs} className="!py-2">
              <Activity className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
            {(logFilterRole !== 'all' || logFilterAction !== 'all' || logDateStart || logDateEnd) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setLogFilterRole('all');
                  setLogFilterAction('all');
                  setLogDateStart('');
                  setLogDateEnd('');
                  loadLogs();
                }}
                className="!py-2"
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{logs.length}</p>
                <p className="text-[10px] text-gray-500 uppercase">Total Registros</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <UserCheck className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{logs.filter(l => l.action === 'LOGIN').length}</p>
                <p className="text-[10px] text-gray-500 uppercase">Logins</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Edit2 className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{logs.filter(l => l.action?.includes('EDITAR')).length}</p>
                <p className="text-[10px] text-gray-500 uppercase">Edições</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Trash2 className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{logs.filter(l => l.action?.includes('EXCLUIR')).length}</p>
                <p className="text-[10px] text-gray-500 uppercase">Exclusões</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-premium-dark border-b border-premium-gray/30">
                  <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Data / Hora</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Usuário</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Ação</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-premium-gray/20">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 text-gray-600" />
                        <p>Nenhum registro encontrado</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="text-xs hover:bg-premium-gray/10 transition-colors">
                      <td className="p-4">
                        <p className="text-gray-300 font-medium">{new Date(log.created_at || '').toLocaleDateString('pt-BR')}</p>
                        <p className="text-gray-500 text-[10px]">{new Date(log.created_at || '').toLocaleTimeString('pt-BR')}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                            {(log.users?.name || log.users?.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white font-medium">{log.users?.name || log.users?.email || 'Usuário do Sistema'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={clsx("px-2 py-1 rounded text-[9px] font-bold uppercase flex items-center gap-1 w-fit", actionColors[log.action] || 'bg-white/5 text-gray-400 border-white/10')}>
                          {getActionIcon(log.action)}
                          {actionLabels[log.action] || log.action}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 max-w-xs truncate">
                        {log.entity || (log.metadata as any)?.descricao || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-premium-gray/30 flex items-center justify-between bg-premium-dark/50">
            <span className="text-xs text-gray-500">{logs.length} registros de auditoria</span>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}