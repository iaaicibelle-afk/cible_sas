import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Log apenas em desenvolvimento
if (import.meta.env.DEV) {
  console.log('Supabase URL:', supabaseUrl);
}

// Função helper para obter a URL do site (produção ou desenvolvimento)
export const getSiteUrl = (): string => {
  // Prioriza a variável de ambiente VITE_SITE_URL se estiver definida
  if (import.meta.env.VITE_SITE_URL) {
    return import.meta.env.VITE_SITE_URL;
  }
  
  // Em produção (build), usa a URL atual do navegador
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const origin = window.location.origin;
    // Se não for localhost, retorna a URL de produção
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin;
    }
  }
  
  // Em desenvolvimento ou fallback, usa localhost
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback final
  return 'https://canvassas.netlify.app';
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Export URL for Edge Functions
export const SUPABASE_URL = supabaseUrl;

