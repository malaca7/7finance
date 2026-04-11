import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../components/ui';
import type { DriverType } from '../types';
import clsx from 'clsx';

const StorageKey = 'register_step1_data';

interface Step1Data {
  nome: string;
  email: string;
}

export function RegisterStep1Page() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [nome, setNome] = useState(() => {
    const saved = localStorage.getItem(StorageKey);
    return saved ? JSON.parse(saved).nome : '';
  });
  
  const [email, setEmail] = useState(() => {
    const saved = localStorage.getItem(StorageKey);
    return saved ? JSON.parse(saved).email : '';
  });
  
  const [error, setError] = useState('');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim() || !email.trim()) {
      setError('Preencha nome e email');
      return;
    }
    if (!email.includes('@')) {
      setError('Email inválido');
      return;
    }
    
    localStorage.setItem(StorageKey, JSON.stringify({ nome, email }));
    navigate('/register-step2');
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
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-[#22C55E] text-white">
              1
            </div>
            <div className="w-8 h-0.5 bg-[#22C55E]" />
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-[#1a1a1a] text-gray-500">
              2
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-white text-center mb-4">
          Dados Pessoais
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleNext} className="space-y-4">
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome completo"
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#22C55E] text-base"
          />
          
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Seu email"
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#22C55E] text-base"
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 font-semibold"
          >
            Continuar
            <ArrowRight className="w-4 h-4 ml-2 inline" />
          </Button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-center w-full text-gray-400 text-sm hover:text-white inline-flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar para login
          </button>
        </form>
      </div>

      <p className="relative z-10 text-gray-600 text-xs mt-8 text-center">
        © 2024 7Finance. Todos os direitos reservados.
      </p>
    </div>
  );
}