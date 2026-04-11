import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../components/ui';
import { useAppStore } from '../store';
import { authApi } from '../api';
import type { DriverType } from '../types';
import clsx from 'clsx';

const StorageKey = 'register_step1_data';

export function RegisterStep2Page() {
  const navigate = useNavigate();
  const { login } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [tipo, setTipo] = useState<DriverType>('app');
  const [showPassword, setShowPassword] = useState(false);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 3) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}.${numbers.slice(7, 11)}`;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const savedData = localStorage.getItem(StorageKey);
    if (!savedData) {
      navigate('/register');
      return;
    }
    
    const step1Data = JSON.parse(savedData);
    
    if (!telefone.trim() || !password || !tipo) {
      setError('Preencha todos os campos');
      return;
    }
    if (password.length < 4) {
      setError('Senha deve ter pelo menos 4 caracteres');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await authApi.register({
        nome: step1Data.nome,
        telefone,
        email: step1Data.email,
        tipo: tipo,
        password,
      });
      
      if (response.success && response.data) {
        localStorage.removeItem(StorageKey);
        login(response.data.user, response.data.token);
        navigate('/dashboard');
      } else {
        setError(response.error || 'Erro ao criar conta');
      }
    } catch (err) {
      setError('Erro ao conectar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-black" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial_gradient(ellipse_at_top,rgba(30,30,30,0.5)_0%,transparent_60%)] pointer-events-none" />
      
      <div className="relative z-10 mb-6">
        <img 
          src="https://i.postimg.cc/gY9KR36Q/Chat-GPT-Image-7-de-abr-de-2026-13-14-27.png" 
          alt="7 Finance" 
          className="w-20 h-20 object-contain mx-auto"
        />
        <h1 className="text-xl font-bold text-white text-center mt-2 tracking-tight">7Finance</h1>
      </div>

      <div className="relative z-10 w-full max-w-[360px] bg-[#0d0d0d] border border-white/10 rounded-2xl p-6">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-[#1d9bf0] text-white">
              1
            </div>
            <div className="w-8 h-0.5 bg-[#1d9bf0]" />
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-[#1d9bf0] text-white">
              2
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-white text-center mb-4">
          Contato & Senha
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            value={telefone}
            onChange={(e) => setTelefone(formatPhone(e.target.value))}
            placeholder="(00) 0 0000.0000"
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#1d9bf0] text-base"
          />

          <div>
            <label className="text-xs text-gray-500 block mb-2">Tipo de atuação</label>
            <div className="flex gap-2">
              {[
                { id: 'app', label: 'App' },
                { id: 'particular', label: 'Particular' },
                { id: 'taxi', label: 'Táxi' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTipo(t.id as DriverType)}
                  className={clsx(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                    tipo === t.id 
                      ? "bg-[#1d9bf0] text-white" 
                      : "bg-[#1a1a1a] text-gray-400 border border-white/10"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crie uma senha"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#1d9bf0] text-base pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 font-semibold"
            isLoading={isLoading}
          >
            Criar conta
            <ArrowRight className="w-4 h-4 ml-2 inline" />
          </Button>

          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-center w-full text-gray-400 text-sm hover:text-white inline-flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </button>
        </form>
      </div>

      <p className="relative z-10 text-gray-600 text-xs mt-8 text-center">
        © 2024 7Finance. Todos os direitos reservados.
      </p>
    </div>
  );
}