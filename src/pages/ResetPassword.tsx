import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { supabase } from '../api/supabase';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Check for token in URL - Supabase sends it as hash or query param
  const token = searchParams.get('token') || searchParams.get('access_token');

  useEffect(() => {
    // If no token, redirect to login
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem');
      return;
    }

    setIsLoading(true);
    try {
      // Update the password using the token
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Reset password error:', error);
        setError(error.message || 'Erro ao redefinir senha');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-premium-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="https://i.postimg.cc/gY9KR36Q/Chat-GPT-Image-7-de-abr-de-2026-13-14-27.png" 
            alt="7 Finance Logo" 
            className="w-32 h-32 mx-auto object-contain drop-shadow-glow"
          />
        </div>

        <Card className="p-8">
          <h2 className="text-xl font-bold text-white text-center mb-6">
            {success ? 'Senha Redefinida!' : 'Nova Senha'}
          </h2>

          {success ? (
            <div className="text-center">
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-2xl mb-4">
                <p className="text-primary font-medium">Sua senha foi alterada com sucesso!</p>
              </div>
              <p className="text-neutral text-sm">Redirecionando para o login...</p>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <div className="p-4 bg-negative/10 border border-negative/30 rounded-xl text-negative text-sm">
                  {error}
                </div>
              )}

              <div className="relative">
                <Input
                  label="Nova Senha"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  icon={<Lock className="w-4 h-4" />}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[38px] text-neutral hover:text-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Input
                label="Confirmar Nova Senha"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                required
                icon={<Lock className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-4"
                isLoading={isLoading}
              >
                DEFINIR NOVA SENHA
              </Button>
            </form>
          )}
        </Card>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/login')}
            className="text-neutral hover:text-primary text-sm"
          >
            Voltar para o login
          </button>
        </div>
      </div>
    </div>
  );
}