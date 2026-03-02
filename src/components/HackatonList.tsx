import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCanvas } from '../context/CanvasContext';
import {
  Calendar, Trash2, User, ArrowLeft, Search,
  CheckCircle, Circle, ChevronDown, ChevronUp,
  Building2, Globe, Hash, LayoutGrid, FileText, BookOpen,
  Download, Paperclip, Pencil, Save, X,
} from 'lucide-react';
import { HACKATON_QUADRANTES } from '../constants/hackatonQuadrantes';

export interface SavedHackaton {
  id: string;
  user_id: string;
  nome_empresa: string;
  site_empresa: string | null;
  insights_file_path: string | null;
  numero_insight: string;
  quadrante_insight: string;
  descricao_insight: string;
  book_operacionalizacao: string;
  concluido: boolean;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  hackaton_count?: number;
}

type FilterConcluido = 'todos' | 'concluidos' | 'nao_concluidos';

interface HackatonListProps {
  onDataChange?: () => void;
}

const HackatonList: React.FC<HackatonListProps> = ({ onDataChange }) => {
  const { user, profile } = useAuth();
  const { isDarkMode } = useCanvas();
  const [hackatons, setHackatons] = useState<SavedHackaton[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterConcluido, setFilterConcluido] = useState<FilterConcluido>('todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editBookValue, setEditBookValue] = useState('');
  const [savingBook, setSavingBook] = useState(false);

  useEffect(() => {
    if (profile?.role === 'super_admin' && !selectedUserId) {
      fetchUsers();
    } else {
      fetchHackatons();
    }
  }, [user, profile?.role, selectedUserId, filterConcluido]);

  const fetchUsers = async () => {
    if (!user) { setLoading(false); return; }
    try {
      setLoading(true);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles').select('id, email').order('created_at', { ascending: false });
      if (profilesError) throw profilesError;
      if (!profilesData?.length) { setUsers([]); setLoading(false); return; }

      const { data: hackatonsData, error: hackatonsError } = await supabase
        .from('hackaton').select('user_id');
      if (hackatonsError) throw hackatonsError;

      const mapped = profilesData.map((p) => ({
        ...p,
        hackaton_count: hackatonsData?.filter((h) => h.user_id === p.id).length || 0,
      }));
      setUsers(mapped.sort((a, b) => (b.hackaton_count || 0) - (a.hackaton_count || 0)));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHackatons = async () => {
    if (!user) { setLoading(false); return; }
    try {
      setLoading(true);
      let query = supabase.from('hackaton').select('*').order('created_at', { ascending: false });

      if (profile?.role === 'super_admin') {
        if (selectedUserId) query = query.eq('user_id', selectedUserId);
      } else {
        query = query.eq('user_id', user.id);
      }

      if (filterConcluido === 'concluidos') query = query.eq('concluido', true);
      if (filterConcluido === 'nao_concluidos') query = query.eq('concluido', false);

      const { data, error } = await query;
      if (error) throw error;
      setHackatons((data as SavedHackaton[]) || []);
    } catch (error) {
      console.error('Error fetching hackatons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este hackaton?')) return;
    const { error } = await supabase.from('hackaton').delete().eq('id', id);
    if (error) { console.error('Error deleting hackaton:', error); return; }
    setExpandedId(null);
    fetchHackatons();
    onDataChange?.();
    if (profile?.role === 'super_admin' && !selectedUserId) fetchUsers();
  };

  const handleToggleConcluido = async (id: string, currentConcluido: boolean) => {
    const { error } = await supabase
      .from('hackaton')
      .update({ concluido: !currentConcluido, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user!.id);
    if (error) { console.error('Error updating hackaton:', error); return; }
    fetchHackatons();
    onDataChange?.();
  };

  const handleDownloadAttachment = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('hackaton-insights')
        .download(filePath);
      if (error) throw error;
      if (!data) return;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      const fileName = filePath.split('/').pop() || 'insights';
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
    }
  };

  const startEditBook = (h: SavedHackaton) => {
    setEditingBookId(h.id);
    setEditBookValue(h.book_operacionalizacao);
  };

  const cancelEditBook = () => {
    setEditingBookId(null);
    setEditBookValue('');
  };

  const saveEditBook = async (id: string) => {
    if (!editBookValue.trim()) return;
    setSavingBook(true);
    const { error } = await supabase
      .from('hackaton')
      .update({ book_operacionalizacao: editBookValue.trim(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user!.id);
    setSavingBook(false);
    if (error) { console.error('Error saving book:', error); return; }
    setEditingBookId(null);
    setEditBookValue('');
    fetchHackatons();
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      cancelEditBook();
    }
    setExpandedId(expandedId === id ? null : id);
  };
  const handleUserSelect = (userId: string) => setSelectedUserId(userId);
  const handleBackToUsers = () => { setSelectedUserId(null); setHackatons([]); };

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const getQuadranteLabel = (value: string) =>
    HACKATON_QUADRANTES.find((q) => q.value === value)?.label ?? value;

  // --- Admin: lista de usuários ---
  if (profile?.role === 'super_admin' && !selectedUserId) {
    return (
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-3 py-2 rounded-md border ${
              isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-purple-500`}
          />
        </div>
        {loading ? (
          <div className={`text-center py-8 ${isDarkMode ? 'text-purple-300' : 'text-gray-600'}`}>
            Carregando usuários...
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className={`text-center py-8 ${isDarkMode ? 'text-purple-300/70' : 'text-gray-500'}`}>
            {searchTerm ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((up) => (
              <button
                key={up.id}
                onClick={() => handleUserSelect(up.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
                  isDarkMode
                    ? 'bg-purple-900/30 border border-purple-700/40 hover:bg-purple-800/40'
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <User size={16} className="text-purple-500" />
                  <div>
                    <div className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{up.email}</div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {up.hackaton_count || 0} hackaton(s)
                    </div>
                  </div>
                </div>
                <ArrowLeft size={16} className="text-gray-400 rotate-180" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- Lista de hackatons (usuário ou admin com user selecionado) ---
  return (
    <div className="p-4 space-y-4">
      {/* Voltar (admin) */}
      {profile?.role === 'super_admin' && selectedUserId && (
        <button
          onClick={handleBackToUsers}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${
            isDarkMode ? 'text-purple-300 hover:text-purple-200' : 'text-purple-600 hover:text-purple-700'
          }`}
        >
          <ArrowLeft size={16} />
          Voltar para usuários
        </button>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(['todos', 'nao_concluidos', 'concluidos'] as const).map((f) => {
          const label = f === 'todos' ? 'Todos' : f === 'concluidos' ? 'Concluídos' : 'Em aberto';
          const isActive = filterConcluido === f;
          return (
            <button
              key={f}
              onClick={() => setFilterConcluido(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-purple-600 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading ? (
        <div className={`text-center py-8 ${isDarkMode ? 'text-purple-300' : 'text-gray-600'}`}>
          Carregando hackatons...
        </div>
      ) : hackatons.length === 0 ? (
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhum hackaton encontrado</p>
          <p className="text-sm mt-1">
            {filterConcluido !== 'todos' ? 'Tente alterar o filtro acima.' : 'Crie seu primeiro hackaton.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {hackatons.map((h) => {
            const isExpanded = expandedId === h.id;
            const isOwner = h.user_id === user?.id;
            const isAdmin = profile?.role === 'super_admin';

            return (
              <div
                key={h.id}
                className={`rounded-lg border overflow-hidden transition-all ${
                  isDarkMode
                    ? `border-gray-700 ${h.concluido ? 'bg-gray-800/40' : 'bg-purple-900/20 border-purple-700/40'}`
                    : `border-gray-200 ${h.concluido ? 'bg-gray-50' : 'bg-white'}`
                }`}
              >
                {/* Card header - clicável */}
                <button
                  onClick={() => toggleExpand(h.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  {/* Status indicator */}
                  <div className="flex-shrink-0">
                    {h.concluido ? (
                      <CheckCircle size={20} className="text-green-500" />
                    ) : (
                      <div className="relative">
                        <Circle size={20} className={isDarkMode ? 'text-purple-400' : 'text-purple-500'} />
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full animate-pulse ${
                          isDarkMode ? 'bg-purple-400' : 'bg-purple-500'
                        }`} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {h.nome_empresa}
                    </div>
                    <div className={`text-xs mt-0.5 flex items-center gap-2 flex-wrap ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span className="flex items-center gap-1">
                        <Hash size={12} />{h.numero_insight}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <LayoutGrid size={12} />{getQuadranteLabel(h.quadrante_insight)}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />{formatDate(h.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Badge + chevron */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      h.concluido
                        ? 'bg-green-900/30 text-green-400 border border-green-700/50'
                        : isDarkMode
                          ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50'
                          : 'bg-purple-100 text-purple-700 border border-purple-200'
                    }`}>
                      {h.concluido ? 'Concluído' : 'Em aberto'}
                    </span>
                    {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </button>

                {/* Detalhe expandido */}
                {isExpanded && (
                  <div className={`border-t px-4 pb-4 pt-3 space-y-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    {/* Dados do hackaton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DetailField icon={<Building2 size={14} />} label="Empresa" value={h.nome_empresa} isDarkMode={isDarkMode} />
                      <DetailField icon={<Globe size={14} />} label="Site" value={h.site_empresa || '—'} isDarkMode={isDarkMode} />
                      <DetailField icon={<Hash size={14} />} label="Insight" value={h.numero_insight} isDarkMode={isDarkMode} />
                      <DetailField icon={<LayoutGrid size={14} />} label="Quadrante" value={getQuadranteLabel(h.quadrante_insight)} isDarkMode={isDarkMode} />
                    </div>

                    {/* Anexo de insights */}
                    {h.insights_file_path && (
                      <div className={`flex items-center gap-3 rounded-md p-2.5 ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-50'}`}>
                        <Paperclip size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-medium mb-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Arquivo de insights
                          </div>
                          <div className={`text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {h.insights_file_path.split('/').pop()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadAttachment(h.insights_file_path!)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            isDarkMode
                              ? 'bg-purple-700 hover:bg-purple-600 text-white'
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                          }`}
                        >
                          <Download size={14} />
                          Baixar
                        </button>
                      </div>
                    )}

                    <DetailBlock
                      icon={<FileText size={14} />}
                      label="Descrição do insight"
                      value={h.descricao_insight}
                      isDarkMode={isDarkMode}
                    />

                    {/* Book de Operacionalização — editável pelo dono quando não concluído */}
                    <div>
                      <div className={`flex items-center justify-between mb-1`}>
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <BookOpen size={14} />Book de Operacionalização
                        </div>
                        {isOwner && !h.concluido && editingBookId !== h.id && (
                          <button
                            onClick={() => startEditBook(h)}
                            className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                              isDarkMode ? 'text-purple-300 hover:text-purple-200' : 'text-purple-600 hover:text-purple-700'
                            }`}
                          >
                            <Pencil size={12} />
                            Editar
                          </button>
                        )}
                      </div>
                      {editingBookId === h.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editBookValue}
                            onChange={(e) => setEditBookValue(e.target.value)}
                            className={`w-full px-3 py-2 rounded-md border min-h-[140px] text-sm ${
                              isDarkMode
                                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={cancelEditBook}
                              disabled={savingBook}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <X size={14} />
                              Cancelar
                            </button>
                            <button
                              onClick={() => saveEditBook(h.id)}
                              disabled={savingBook || !editBookValue.trim()}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50"
                            >
                              <Save size={14} />
                              {savingBook ? 'Salvando...' : 'Salvar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`text-sm whitespace-pre-wrap rounded-md p-3 ${
                          isDarkMode ? 'bg-gray-800/60 text-gray-200' : 'bg-gray-50 text-gray-800'
                        }`}>
                          {h.book_operacionalizacao}
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className={`flex items-center gap-2 pt-3 border-t flex-wrap ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      {isOwner && !h.concluido && (
                        <button
                          onClick={() => handleToggleConcluido(h.id, h.concluido)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-green-700 hover:bg-green-600 text-white transition-colors"
                        >
                          <CheckCircle size={14} />
                          Marcar como concluído
                        </button>
                      )}
                      {isOwner && h.concluido && (
                        <button
                          onClick={() => handleToggleConcluido(h.id, h.concluido)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            isDarkMode
                              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                        >
                          <Circle size={14} />
                          Reabrir
                        </button>
                      )}
                      {(isAdmin || isOwner) && (
                        <button
                          onClick={() => handleDelete(h.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-red-400 hover:bg-red-900/30 transition-colors ml-auto"
                        >
                          <Trash2 size={14} />
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DetailField: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  isDarkMode: boolean;
}> = ({ icon, label, value, isDarkMode }) => (
  <div className={`rounded-md p-2.5 ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-50'}`}>
    <div className={`flex items-center gap-1.5 text-xs font-medium mb-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
      {icon}{label}
    </div>
    <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</div>
  </div>
);

const DetailBlock: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  isDarkMode: boolean;
}> = ({ icon, label, value, isDarkMode }) => (
  <div>
    <div className={`flex items-center gap-1.5 text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
      {icon}{label}
    </div>
    <div className={`text-sm whitespace-pre-wrap rounded-md p-3 ${
      isDarkMode ? 'bg-gray-800/60 text-gray-200' : 'bg-gray-50 text-gray-800'
    }`}>
      {value}
    </div>
  </div>
);

export default HackatonList;
