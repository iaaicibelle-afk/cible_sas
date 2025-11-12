import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Calendar, Trash2, User, ArrowLeft, Search } from 'lucide-react';

interface SavedCanvas {
  id: string;
  canvas_data: any;
  saved_at: string;
  user_id: string;
}

interface UserProfile {
  id: string;
  email: string;
  canvas_count?: number;
}

const CanvasList: React.FC<{ onLoadCanvas: (data: any) => void }> = ({ onLoadCanvas }) => {
  const { user, profile } = useAuth();
  const [canvases, setCanvases] = useState<SavedCanvas[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profile?.role === 'super_admin' && !selectedUserId) {
      fetchUsers();
    } else {
      fetchCanvases();
    }
  }, [user, profile, selectedUserId]);

  const fetchUsers = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Buscar todos os usuários que têm canvas salvos
      const { data: canvasesData, error: canvasesError } = await supabase
        .from('saved_canvases')
        .select('user_id')
        .order('saved_at', { ascending: false });

      if (canvasesError) throw canvasesError;

      // Pegar IDs únicos de usuários
      const userIds = [...new Set(canvasesData?.map(c => c.user_id) || [])];

      if (userIds.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Buscar perfis dos usuários
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Contar canvas por usuário
      const usersWithCounts = (profilesData || []).map(profile => {
        const count = canvasesData?.filter(c => c.user_id === profile.id).length || 0;
        return {
          ...profile,
          canvas_count: count,
        };
      });

      setUsers(usersWithCounts.sort((a, b) => (b.canvas_count || 0) - (a.canvas_count || 0)));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCanvases = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const targetUserId = profile?.role === 'super_admin' && selectedUserId 
        ? selectedUserId 
        : user.id;

      const { data, error } = await supabase
        .from('saved_canvases')
        .select('id, canvas_data, saved_at, user_id')
        .eq('user_id', targetUserId)
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('Error fetching canvases:', error);
        throw error;
      }
      
      setCanvases(data || []);
    } catch (error) {
      console.error('Error fetching canvases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este canvas?')) return;

    const { error } = await supabase
      .from('saved_canvases')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting canvas:', error);
    } else {
      fetchCanvases();
      // Se for admin e estiver vendo lista de usuários, atualizar contagem
      if (profile?.role === 'super_admin' && !selectedUserId) {
        fetchUsers();
      }
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleBackToUsers = () => {
    setSelectedUserId(null);
    setCanvases([]);
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Se for super_admin e não tiver usuário selecionado, mostrar lista de usuários
  if (profile?.role === 'super_admin' && !selectedUserId) {
    return (
      <div className="space-y-3">
        {/* Barra de pesquisa */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Pesquisar usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-3 py-2 rounded-md border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
              loading ? 'opacity-50' : ''
            }`}
          />
        </div>

      {loading ? (
        <div className="text-center py-4 dark:text-purple-300">Carregando usuários...</div>
      ) : filteredUsers.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-purple-300/70 py-4">
          {searchTerm ? 'Nenhum usuário encontrado.' : 'Nenhum usuário com canvas salvo.'}
        </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.map((userProfile) => (
              <button
                key={userProfile.id}
                onClick={() => handleUserSelect(userProfile.id)}
                className="w-full flex items-center justify-between p-3 bg-gray-100 dark:bg-purple-900/40 dark:border dark:border-purple-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-purple-800/50 dark:hover:border-purple-600 transition-colors text-left"
              >
                <div className="flex items-center gap-3 flex-1">
                  <User size={16} className="text-purple-500 dark:text-purple-300" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white dark:font-semibold">{userProfile.email}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-300">
                      {userProfile.canvas_count || 0} canvas salvo{userProfile.canvas_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <ArrowLeft size={16} className="text-gray-400 dark:text-white dark:opacity-80" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Mostrar canvas do usuário selecionado ou do próprio usuário
  return (
    <div className="space-y-3">
      {/* Botão voltar (apenas para admin) */}
      {profile?.role === 'super_admin' && selectedUserId && (
        <button
          onClick={handleBackToUsers}
          className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-200 mb-2 transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para usuários
        </button>
      )}

      {loading ? (
        <div className="text-center py-4 dark:text-purple-300">Carregando canvas...</div>
      ) : canvases.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-purple-300/70 py-4">Nenhum canvas salvo ainda.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {canvases.map((canvas) => (
            <div
              key={canvas.id}
              className="flex items-center justify-between p-3 bg-gray-100 dark:bg-purple-900/40 dark:border dark:border-purple-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-purple-800/50 dark:hover:border-purple-600 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <Calendar size={16} className="text-purple-500 dark:text-purple-300" />
                <div className="flex-1">
                  <button
                    onClick={() => onLoadCanvas(canvas.canvas_data)}
                    className="text-left hover:text-purple-500 dark:hover:text-purple-300 transition-colors w-full"
                  >
                    <div className="font-medium text-gray-900 dark:text-white dark:font-semibold">
                      Canvas - {formatDate(canvas.saved_at)}
                    </div>
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleDelete(canvas.id)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CanvasList;

