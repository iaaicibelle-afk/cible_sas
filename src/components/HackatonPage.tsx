import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCanvas } from '../context/CanvasContext';
import { supabase } from '../lib/supabase';
import { Plus, ArrowLeft, CheckCircle, X, Eye } from 'lucide-react';
import HackatonForm from './HackatonForm';
import HackatonList from './HackatonList';

type PageView = 'list' | 'form';

const HackatonPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isDarkMode } = useCanvas();
  const isAdmin = profile?.role === 'super_admin';

  const [view, setView] = useState<PageView>('list');
  const [hasUnfinished, setHasUnfinished] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const checkUnfinished = useCallback(async () => {
    if (!user) { setLoadingCheck(false); return; }
    try {
      const { data } = await supabase
        .from('hackaton')
        .select('id')
        .eq('user_id', user.id)
        .eq('concluido', false)
        .limit(1);
      setHasUnfinished((data?.length ?? 0) > 0);
    } catch {
      setHasUnfinished(false);
    } finally {
      setLoadingCheck(false);
    }
  }, [user]);

  useEffect(() => { checkUnfinished(); }, [checkUnfinished]);

  useEffect(() => {
    if (!loadingCheck && !hasUnfinished) {
      setView('form');
    }
  }, [loadingCheck, hasUnfinished]);

  const handleSaveSuccess = () => {
    setSuccessMsg('Hackaton salvo com sucesso!');
    setHasUnfinished(true);
    setView('list');
    setRefreshKey((k) => k + 1);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleListChange = () => {
    checkUnfinished();
    setRefreshKey((k) => k + 1);
  };

  const canCreateNew = !hasUnfinished;

  if (loadingCheck) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className={`text-lg ${isDarkMode ? 'text-purple-300' : 'text-gray-600'}`}>
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Alerta de sucesso */}
      {successMsg && (
        <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between gap-4 px-4 py-3 bg-green-700 text-white shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2 flex-1 justify-center">
            <CheckCircle size={20} />
            <p className="font-medium">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="p-1 rounded hover:bg-green-600">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Header da página */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Hackathon de IA
          </h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {view === 'form'
              ? 'Preencha o formulário para criar um novo hackaton'
              : isAdmin
                ? 'Visualize todos os hackatons por usuário'
                : 'Gerencie seus hackatons e acompanhe o progresso'}
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {view === 'list' && (
            <button
              onClick={() => setView('form')}
              disabled={!canCreateNew}
              title={!canCreateNew ? 'Conclua o hackaton em aberto antes de criar outro' : 'Criar novo hackaton'}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                canCreateNew
                  ? isDarkMode
                    ? 'bg-purple-700 hover:bg-purple-600 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              <Plus size={16} />
              Novo hackaton
            </button>
          )}
          {view === 'form' && (
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              {isAdmin ? <Eye size={16} /> : <ArrowLeft size={16} />}
              {isAdmin ? 'Ver todos os hackatons' : 'Ver meus hackatons'}
            </button>
          )}
          <button
            onClick={() => navigate('/canvas')}
            className={`px-4 py-2 rounded-md transition-colors text-sm ${
              isDarkMode
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Voltar ao Canvas
          </button>
        </div>
      </div>

      {/* Aviso de hackaton em aberto (na view de lista) */}
      {view === 'list' && hasUnfinished && (
        <div className={`flex items-start gap-3 p-4 rounded-lg border ${
          isDarkMode
            ? 'bg-purple-900/20 border-purple-700/50 text-purple-200'
            : 'bg-purple-50 border-purple-200 text-purple-800'
        }`}>
          <div className="flex-shrink-0 mt-0.5">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-purple-400' : 'bg-purple-600'}`} />
          </div>
          <div>
            <p className="font-medium text-sm">Hackaton em andamento</p>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-purple-300/70' : 'text-purple-600'}`}>
              Conclua o hackaton abaixo para liberar a criação de um novo.
            </p>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      {view === 'form' && (
        <HackatonForm
          onSaveSuccess={handleSaveSuccess}
          onCancel={() => hasUnfinished ? setView('list') : navigate('/canvas')}
          hasUnfinishedHackaton={hasUnfinished}
        />
      )}

      {view === 'list' && (
        <section>
          <div className={`rounded-xl border ${
            isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <HackatonList key={refreshKey} onDataChange={handleListChange} />
          </div>
        </section>
      )}
    </div>
  );
};

export default HackatonPage;
