import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    let subscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    // Processar o token do email quando a página carregar
    const processToken = async () => {
      try {
        // Verificar se há hash na URL (token do email) - formato padrão do Supabase
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        
        // Também verificar query params (caso o Supabase use esse formato)
        const urlParams = new URLSearchParams(window.location.search);
        const queryToken = urlParams.get('access_token');
        const queryType = urlParams.get('type');

        const token = accessToken || queryToken;
        const tokenType = type || queryType;

        console.log('Processing reset password token:', { token: !!token, type: tokenType, hash: window.location.hash, search: window.location.search });

        // Se não houver token, verificar se já há sessão (usuário pode ter clicado no link novamente)
        if (!token || tokenType !== 'recovery') {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // Já autenticado, pode resetar senha
            console.log('Session already exists, allowing password reset');
            setLoading(false);
            return;
          } else {
            // Limpar hash/query params da URL para evitar confusão
            if (window.location.hash || window.location.search) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
            setError('Link inválido ou expirado. Por favor, solicite um novo link de reset de senha.');
            setLoading(false);
            return;
          }
        }

        // O Supabase processa automaticamente o hash quando a página carrega
        // Ouvir mudanças de autenticação
        const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state changed:', event, session ? 'has session' : 'no session');
          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
            // Token processado com sucesso
            console.log('Password recovery successful');
            setLoading(false);
            // Limpar hash da URL após processar
            if (window.location.hash) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } else if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
            // Token inválido ou expirado
            console.error('Token invalid or expired');
            setError('Token inválido ou expirado. Solicite um novo link de reset.');
            setLoading(false);
          }
        });
        subscription = { data: { subscription: sub } };

        // Verificar sessão após um breve delay para dar tempo do Supabase processar
        timeoutId = setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('Session verified after timeout');
            setLoading(false);
            // Limpar hash da URL
            if (window.location.hash) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } else {
            console.error('No session after timeout');
            setError('Token inválido ou expirado. Solicite um novo link de reset.');
            setLoading(false);
          }
        }, 2000);
      } catch (err: any) {
        console.error('Error processing token:', err);
        setError('Erro ao processar o link de reset. Tente novamente.');
        setLoading(false);
      }
    };

    processToken();

    // Cleanup
    return () => {
      if (subscription?.data?.subscription) {
        subscription.data.subscription.unsubscribe();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setProcessing(true);

    try {
      // Verificar se há sessão ativa
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sessão expirada. Por favor, solicite um novo link de reset.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        supabase.auth.signOut();
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao resetar senha');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 px-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        {/* Logo centralizada */}
        <div className="w-full flex justify-center mb-6">
          <img 
            src="/logo-dark.png.png" 
            alt="InnovAI Canvas Logo" 
            className="max-h-24 max-w-64 object-contain"
          />
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          Resetar Senha
        </h2>

        {loading ? (
          <div className="text-center">
            <div className="text-gray-600 dark:text-gray-300">Processando link de reset...</div>
          </div>
        ) : success ? (
          <div className="text-center">
            <div className="text-green-500 mb-4">Senha alterada com sucesso!</div>
            <p className="text-gray-600 dark:text-gray-300">Redirecionando para o login...</p>
          </div>
        ) : error && !password ? (
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nova Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <button
              type="submit"
              disabled={processing}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
            >
              {processing ? 'Alterando senha...' : 'Alterar Senha'}
            </button>
          </form>
        )}

        <button
          onClick={() => navigate('/login')}
          className="mt-4 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 w-full text-center"
        >
          Voltar para o login
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;

