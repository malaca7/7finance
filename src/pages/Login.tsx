import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { useAppStore } from '../store';
import { authApi } from '../api';
import type { DriverType } from '../types';
import clsx from 'clsx';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAppStore();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [telefone, setTelefone] = useState(() => localStorage.getItem('remembered_phone') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  // Register form
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [tipos, setTipos] = useState<DriverType[]>(['app']); // Multiple selection state

  const toggleTipo = (tipo: DriverType) => {
    setTipos(prev => 
      prev.includes(tipo) 
        ? prev.filter(t => t !== tipo) 
        : [...prev, tipo]
    );
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 3) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}.${numbers.slice(7, 11)}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await authApi.login(telefone, password);
      
      if (response.success && response.data) {
        if (rememberMe) {
          localStorage.setItem('remembered_phone', telefone);
        } else {
          localStorage.removeItem('remembered_phone');
        }
        login(response.data.user, response.data.token);
        navigate('/dashboard');
      } else {
        setError(response.error || 'Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tipos.length === 0) {
      setError('Selecione ao menos um tipo de atuação');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await authApi.register({
        nome,
        telefone,
        email,
        tipo: tipos.join(','), // Envia como string separada por vírgula
        password,
      });
      
      if (response.success && response.data) {
        login(response.data.user, response.data.token);
        navigate('/dashboard');
      } else {
        setError(response.error || 'Erro ao criar conta');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(212,175,55,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(59,130,246,0.05),transparent_50%)] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src="https://i.postimg.cc/gY9KR36Q/Chat-GPT-Image-7-de-abr-de-2026-13-14-27.png" 
              alt="7 Finance Logo" 
              className="w-32 h-32 object-contain drop-shadow-glow"
            />
          </div>
          <p className="text-gray-400 mt-2 font-medium text-sm tracking-widest uppercase">Premium Driver Management</p>
        </div>

        {/* Login Card */}
        <div className="bg-premium-dark/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-premium-gold/10 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-premium-gold/40 to-transparent" />
          
          <h2 className="text-xl font-light tracking-widest text-white mb-8 text-center uppercase">
            {isLogin ? 'Autenticação' : 'Novo Cadastro'}
          </h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-950/30 border border-red-500/30 rounded-xl text-red-400 text-xs text-center animate-shake">
              {error}
            </div>
          )}
          
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Número de Telefone"
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(formatPhone(e.target.value))}
                placeholder="(00) 0 0000.0000"
                required
                className="bg-black/40 border-premium-gold/10 focus:border-premium-gold/40 transition-all duration-300"
                icon={<Phone className="w-4 h-4 text-premium-gold/60" />}
              />
              
              <Input
                label="Sua Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-black/40 border-premium-gold/10 focus:border-premium-gold/40 transition-all duration-300"
                icon={<Lock className="w-4 h-4 text-premium-gold/60" />}
              />

              <div className="flex items-center gap-2 mt-2 px-1">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={clsx(
                    "w-4 h-4 rounded border flex items-center justify-center transition-all duration-300",
                    rememberMe 
                      ? "bg-premium-gold border-premium-gold text-black" 
                      : "bg-black/40 border-white/20 text-transparent"
                  )}
                >
                  <div className={clsx("w-2 h-2 bg-current rounded-sm", rememberMe ? "scale-100" : "scale-0")} />
                </button>
                <span 
                  className="text-[10px] text-gray-500 uppercase tracking-widest font-bold cursor-pointer hover:text-gray-300 transition-colors"
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  Lembrar telefone para o próximo acesso
                </span>
              </div>
              
              <Button
                type="submit"
                className="w-full mt-4 py-6 bg-gradient-to-r from-premium-gold/80 to-premium-gold hover:from-premium-gold hover:to-premium-gold/80 text-black font-bold tracking-widest transition-all duration-500 shadow-xl shadow-premium-gold/10 group overflow-hidden relative"
                isLoading={isLoading}
              >
                <span className="relative z-10">ENTRAR NO SISTEMA</span>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 slant" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                label="Nome Completo"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome e Sobrenome"
                required
                className="bg-black/40 border-premium-gold/10"
                icon={<User className="w-4 h-4 text-premium-gold/60" />}
              />

              <Input
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                required
                className="bg-black/40 border-premium-gold/10"
                icon={<Mail className="w-4 h-4 text-premium-gold/60" />}
              />

              <Input
                label="Telefone / Login"
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(formatPhone(e.target.value))}
                placeholder="(00) 0 0000.0000"
                required
                className="bg-black/40 border-premium-gold/10"
                icon={<Phone className="w-4 h-4 text-premium-gold/60" />}
              />

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Tipo de Atuação (Selecione um ou mais)
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'app', label: 'Motorista de Aplicativo' },
                    { id: 'particular', label: 'Motorista Particular' },
                    { id: 'taxi', label: 'Motorista de Táxi' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleTipo(option.id as DriverType)}
                      className={clsx(
                        "flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300 text-sm font-medium",
                        tipos.includes(option.id as DriverType)
                          ? "bg-premium-gold/20 border-premium-gold/40 text-premium-gold shadow-glow-sm"
                          : "bg-black/40 border-white/5 text-gray-400 hover:border-white/20"
                      )}
                    >
                      <span>{option.label}</span>
                      {tipos.includes(option.id as DriverType) && (
                        <div className="w-2 h-2 rounded-full bg-premium-gold animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Crie uma Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-black/40 border-premium-gold/10"
                icon={<Lock className="w-4 h-4 text-premium-gold/60" />}
              />
              
              <Button
                type="submit"
                className="w-full mt-4 py-6 bg-gradient-to-r from-premium-gold/80 to-premium-gold text-black font-bold tracking-widest"
                isLoading={isLoading}
              >
                CRIAR MINHA CONTA
              </Button>
            </form>
          )}

          <div className="mt-8 text-center pt-6 border-t border-white/5">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-gray-400 hover:text-premium-gold text-xs tracking-widest transition-colors duration-300 flex items-center justify-center gap-2 mx-auto"
            >
              {isLogin ? (
                <>NÃO TEM CONTA? <span className="text-premium-gold font-bold">CADASTRE-SE</span></>
              ) : (
                <>JÁ É MEMBRO? <span className="text-premium-gold font-bold">FAZER LOGIN</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
