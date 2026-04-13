import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui';
import { useAppStore } from '../store';
import { authApi } from '../api';
import clsx from 'clsx';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  
  const [email, setEmail] = useState(() => localStorage.getItem('remembered_phone') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 3) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}.${numbers.slice(7, 11)}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.replace(/\D/g, '');
    if (!cleanEmail || !password) {
      setError('Preencha telefone e senha');
      return;
    }
    if (cleanEmail.length < 10) {
      setError('Telefone inválido');
      return;
    }
    setIsLoading(true);
    setError('');
    
    try {
      let response = await authApi.login(cleanEmail, password);
      
      // Retry automático se falhar com erro de rede (Supabase Free pode estar "acordando")
      if (!response.success && response.error?.toLowerCase().includes('sem conexão')) {
        setError('Conectando ao servidor... Tentando novamente.');
        response = await authApi.login(cleanEmail, password);
      }
      
      if (response.success && response.data) {
        if (rememberMe) {
          localStorage.setItem('remembered_phone', email);
        } else {
          localStorage.removeItem('remembered_phone');
        }
        login(response.data.user, response.data.token);
        navigate('/dashboard');
      } else {
        setError(response.error || 'Credenciais inválidas');
      }
    } catch (err) {
      setError('Sem conexão com o servidor. Verifique sua internet e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotMessage('Digite seu email');
      return;
    }
    setForgotLoading(true);
    setForgotMessage('');
    
    try {
      const response = await authApi.forgotPassword(forgotEmail);
      if (response.success) {
        setForgotMessage('Se o email existir, você receberá um link.');
      } else {
        setForgotMessage(response.error || 'Erro ao processar');
      }
    } catch (err) {
      setForgotMessage('Erro ao conectar');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-black" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial_gradient(ellipse_at_top,rgba(30,30,30,0.5)_0%,transparent_60%)] pointer-events-none" />
      
      <div className="relative z-10 mb-8">
        <img 
          src="https://i.postimg.cc/gY9KR36Q/Chat-GPT-Image-7-de-abr-de-2026-13-14-27.png" 
          alt="7 Finance" 
          className="w-24 h-24 object-contain mx-auto"
        />
        <h1 className="text-2xl font-bold text-white text-center mt-2 tracking-tight">7Finance</h1>
        <p className="text-xs text-gray-500 text-center mt-1 uppercase tracking-widest">Mais Que Uma Gestão Financeira</p>
      </div>

      <div className="relative z-10 w-full max-w-[360px] bg-[#0d0d0d] border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white text-center mb-6">
          {showForgotPassword ? 'Recuperar Senha' : 'Bem-vindo de volta'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {!showForgotPassword && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(formatPhone(e.target.value))}
              placeholder="(00) 0 0000.0000"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#22C55E] text-base"
              autoComplete="username"
            />
            
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#22C55E] text-base pr-12"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className={clsx(
                  "w-5 h-5 rounded border flex items-center justify-center transition-all",
                  rememberMe ? "bg-[#22C55E] border-[#22C55E]" : "border-white/30"
                )}
              >
                {rememberMe && <span className="text-white text-xs">✓</span>}
              </button>
              <span className="text-gray-400 text-sm ml-2">Lembrar acesso</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 font-semibold"
              isLoading={isLoading}
            >
              Entrar
              <ArrowRight className="w-4 h-4 ml-2 inline" />
            </Button>

            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-center w-full text-[#22C55E] text-sm hover:underline"
            >
              Esqueci minha senha
            </button>

            <div className="pt-4 border-t border-white/10">
              <p className="text-gray-400 text-sm text-center">
                Não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-[#22C55E] hover:underline font-medium"
                >
                  Criar conta
                </button>
              </p>
            </div>
          </form>
        )}

        {showForgotPassword && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-gray-400 text-sm text-center mb-4">
              Digite seu email para receber o link de recuperação.
            </p>

            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="Seu email"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#22C55E] text-base"
            />

            {forgotMessage && (
              <div className={clsx(
                "p-3 rounded-lg text-xs text-center",
                forgotMessage.includes('receber') 
                  ? "bg-green-500/10 text-green-400 border border-green-500/30" 
                  : "bg-red-500/10 text-red-400 border border-red-500/30"
              )}>
                {forgotMessage}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 font-semibold"
              isLoading={forgotLoading}
            >
              Enviar link
            </Button>

            <button
              type="button"
              onClick={() => { setShowForgotPassword(false); setError(''); }}
              className="text-center w-full text-gray-400 text-sm hover:text-white"
            >
              Voltar para login
            </button>
          </form>
        )}
      </div>

      <p className="relative z-10 text-gray-600 text-xs mt-8 text-center">
        © 2024 7Finance. Todos os direitos reservados.
      </p>
    </div>
  );
}