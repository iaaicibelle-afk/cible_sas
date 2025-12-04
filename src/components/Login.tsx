import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, getSiteUrl } from '../lib/supabase';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';

// ============================================
// CONFIGURAÇÃO DA IMAGEM DO HERO (LADO ESQUERDO)
// ============================================
// Para usar uma imagem local:
// 1. Coloque a imagem na pasta 'public' (ex: public/login-hero.jpg)
// 2. Altere a constante abaixo para: '/login-hero.jpg'
//
// Para usar uma URL externa:
// 1. Altere a constante abaixo para a URL da imagem
// ============================================
const HERO_IMAGE_URL = '/imagem-login.jpeg';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/canvas');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Digite seu email para resetar a senha');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Usa a função helper para obter a URL correta (produção ou desenvolvimento)
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getSiteUrl()}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setResetEmailSent(true);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar email de reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Image */}
      <div className="hidden md:flex md:w-1/2 relative bg-gray-900">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${HERO_IMAGE_URL}')`
          }}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Logo - Top Left */}
        <div className="absolute top-8 left-8 z-10">
          <img 
            src="/logo-dark.png.png" 
            alt="AI Canvas Logo" 
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* Content - Bottom Left */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-10">
          <div className="max-w-md">
            <p className="text-white text-lg md:text-xl leading-relaxed mb-4">
              <span className="font-semibold">AI CANVAS:</span> Framework visual de identificação de oportunidades / insights de Inteligência Artificial e gestão humanizada de projeto de inteligência artificial.
            </p>
            <div className="h-px bg-white/30 my-4"></div>
            <p className="text-white text-sm md:text-base uppercase tracking-wide">
              CIBELLE FERREIRA
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-black/90 p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Logo for Mobile */}
          <div className="md:hidden flex justify-center mb-8">
            <img 
              src="/logo-light.png.png" 
              alt="AI Canvas Logo" 
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Form Container */}
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                AI CANVAS
              </h1>
              <p className="text-lg text-white/80 mb-6">
                Artificial Intelligence Canvas
              </p>
              <h2 className="text-2xl font-semibold text-white mb-2">
                Bem-vindo de volta
              </h2>
              <p className="text-sm text-white/70">
                Insira seus dados para acessar sua área exclusiva
              </p>
            </div>

            {/* Form */}
            {resetEmailSent ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                  <p className="text-green-300 text-sm font-medium mb-2">
                    Email de reset enviado!
                  </p>
                  <p className="text-green-400/80 text-sm">
                    Verifique sua caixa de entrada e siga as instruções para resetar sua senha.
                  </p>
                </div>
                <button
                  onClick={() => setResetEmailSent(false)}
                  className="w-full text-sm text-white hover:text-white/80 transition-colors duration-200"
                >
                  Voltar ao login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                    E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Sua senha"
                      required
                      className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white placeholder:text-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                {/* Forgot Password Link */}
                {!isSignUp && (
                  <div className="flex justify-end">
                    <Link
                      to="/reset-password"
                      onClick={(e) => {
                        e.preventDefault();
                        handleForgotPassword();
                      }}
                      className="text-sm text-white hover:text-white/80 hover:underline transition-colors duration-200"
                    >
                      Esqueci minha senha.
                    </Link>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {loading ? 'Carregando...' : 'Entrar'}
                </button>

                {/* Sign Up / Login Toggle */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError(null);
                    }}
                    className="text-sm text-white hover:text-white/80 transition-colors duration-200"
                  >
                    {isSignUp ? (
                      <>Já tem conta? <span className="font-medium underline">Faça login</span></>
                    ) : (
                      <>Ainda não tem conta? <span className="font-medium underline">Cadastre-se agora</span></>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-700">
            <p className="text-center text-xs text-white/60">
              © 2025 Cibelle Ferreira. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

