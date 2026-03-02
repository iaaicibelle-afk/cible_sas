import React, { useState, useRef } from 'react';
import { Paperclip, Video, X } from 'lucide-react';
import { useCanvas } from '../context/CanvasContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import VideoModal from './VideoModal';
import { HACKATON_QUADRANTES } from '../constants/hackatonQuadrantes';

const BUCKET_NAME = 'hackaton-insights';

interface HackatonFormProps {
  onSaveSuccess: () => void;
  onCancel: () => void;
  hasUnfinishedHackaton: boolean;
}

const HackatonForm: React.FC<HackatonFormProps> = ({
  onSaveSuccess,
  onCancel,
  hasUnfinishedHackaton,
}) => {
  const { isDarkMode } = useCanvas();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nome_empresa, setNomeEmpresa] = useState('');
  const [site_empresa, setSiteEmpresa] = useState('');
  const [insightsFile, setInsightsFile] = useState<File | null>(null);
  const [numero_insight, setNumeroInsight] = useState('');
  const [quadrante_insight, setQuadranteInsight] = useState('');
  const [descricao_insight, setDescricaoInsight] = useState('');
  const [book_operacionalizacao, setBookOperacionalizacao] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoHackatonOpen, setVideoHackatonOpen] = useState(false);

  const validateVerbStart = (text: string): boolean => {
    const trimmed = text.trim();
    if (!trimmed) return true;
    const verbPattern = /^(analisar|automatizar|criar|desenvolver|implementar|melhorar|otimizar|reduzir|aumentar|integrar|avaliar|definir|documentar|treinar|testar|validar|executar|monitorar|revisar|comunicar|priorizar|operacionalizar|materializar)/i;
    return verbPattern.test(trimmed);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setInsightsFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (hasUnfinishedHackaton) {
      setError('Conclua o book atual antes de criar outro hackaton.');
      return;
    }

    if (!nome_empresa.trim()) {
      setError('Preencha o nome da empresa.');
      return;
    }
    if (!numero_insight.trim()) {
      setError('Preencha o número do insight.');
      return;
    }
    if (!quadrante_insight) {
      setError('Selecione o quadrante do insight.');
      return;
    }
    if (!descricao_insight.trim()) {
      setError('Descreva o insight.');
      return;
    }
    if (!book_operacionalizacao.trim()) {
      setError('Preencha o Book de Operacionalização.');
      return;
    }

    if (!validateVerbStart(descricao_insight)) {
      setError('O insight deve começar com um verbo de ação (ex.: Analisar, Automatizar, Criar).');
      return;
    }

    if (!user) {
      setError('Você precisa estar logado para salvar.');
      return;
    }

    setSaving(true);
    let insights_file_path: string | null = null;

    try {
      if (insightsFile) {
        const ext = insightsFile.name.split('.').pop() || 'bin';
        const path = `${user.id}/${crypto.randomUUID()}/insights.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(path, insightsFile, { upsert: false });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          setError('Falha ao enviar o arquivo de insights. Tente novamente.');
          setSaving(false);
          return;
        }
        insights_file_path = path;
      }

      const { error: insertError } = await supabase.from('hackaton').insert({
        user_id: user.id,
        nome_empresa: nome_empresa.trim(),
        site_empresa: site_empresa.trim() || null,
        insights_file_path,
        numero_insight: numero_insight.trim(),
        quadrante_insight,
        descricao_insight: descricao_insight.trim(),
        book_operacionalizacao: book_operacionalizacao.trim(),
        concluido: false,
      });

      if (insertError) throw insertError;
      onSaveSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar hackaton.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full px-3 py-2 rounded-md border ${
    isDarkMode
      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
  } focus:outline-none focus:ring-2 focus:ring-purple-500`;
  const labelClass = `block text-sm font-medium mb-1 ${isDarkMode ? 'text-purple-200' : 'text-gray-700'}`;
  const helpClass = `text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
  const sectionClass = `rounded-lg border p-4 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`;

  return (
    <>
      {/* Alerta superior em toda a página */}
      {error && (
        <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between gap-4 px-4 py-3 bg-red-700 text-white shadow-lg">
          <p className="flex-1 text-center font-medium">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="flex-shrink-0 p-1 rounded hover:bg-red-600 transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Hackathon de IA
        </h2>

        <div className={sectionClass}>
          <label className={labelClass}>Nome da empresa *</label>
          <input
            type="text"
            value={nome_empresa}
            onChange={(e) => setNomeEmpresa(e.target.value)}
            className={inputClass}
            placeholder="Nome da empresa"
          />
        </div>

        <div className={sectionClass}>
          <label className={labelClass}>Site da empresa</label>
          <input
            type="url"
            value={site_empresa}
            onChange={(e) => setSiteEmpresa(e.target.value)}
            className={inputClass}
            placeholder="https://..."
          />
        </div>

        <div className={sectionClass}>
          <label className={labelClass}>Importar insights</label>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.pdf,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isDarkMode
                  ? 'bg-purple-700 hover:bg-purple-600 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              <Paperclip size={16} />
              Anexar arquivo
            </button>
            {insightsFile && (
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {insightsFile.name}
              </span>
            )}
          </div>
          <p className={helpClass}>
            Faça download do seu insight: basta clicar no botão Exportar Insights no seu canvas.
          </p>
        </div>

        <div className={sectionClass}>
          <label className={labelClass}>Número do insight *</label>
          <input
            type="text"
            value={numero_insight}
            onChange={(e) => setNumeroInsight(e.target.value)}
            className={inputClass}
            placeholder="Ex.: Insight #16"
          />
        </div>

        <div className={sectionClass}>
          <label className={labelClass}>Em qual quadrante do AICanvas este insight aparece? *</label>
          <select
            value={quadrante_insight}
            onChange={(e) => setQuadranteInsight(e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione o quadrante</option>
            {HACKATON_QUADRANTES.map((q) => (
              <option key={q.value} value={q.value}>
                {q.label}
              </option>
            ))}
          </select>
        </div>

        <div className={sectionClass}>
          <label className={labelClass}>Descreva o insight *</label>
          <textarea
            value={descricao_insight}
            onChange={(e) => setDescricaoInsight(e.target.value)}
            className={`${inputClass} min-h-[120px]`}
            placeholder="Copie e cole o insight aqui. Lembre-se: os insights devem sempre iniciar com verbo."
          />
          <p className={helpClass}>
            Lembre-se: insights devem sempre iniciar com verbo. Dúvidas,{' '}
            <button
              type="button"
              onClick={() => setVideoHackatonOpen(true)}
              className="text-purple-500 hover:text-purple-400 underline inline-flex items-center gap-1"
            >
              <Video size={14} />
              assista ao vídeo de apresentação
            </button>
          </p>
        </div>

        <div className={sectionClass}>
          <label className={labelClass}>Book de Operacionalização *</label>
          <p className={`${helpClass} mb-2`}>
            Escreva aqui o Passo a Passo que você irá executar para materializar este insight.
          </p>
          <textarea
            value={book_operacionalizacao}
            onChange={(e) => setBookOperacionalizacao(e.target.value)}
            className={`${inputClass} min-h-[160px]`}
            placeholder="Passo 1: ... Passo 2: ..."
          />
          <p className={helpClass}>
            Tem dúvidas de como fazer o seu passo a passo?{' '}
            <button
              type="button"
              onClick={() => setVideoHackatonOpen(true)}
              className="text-purple-500 hover:text-purple-400 underline inline-flex items-center gap-1"
            >
              <Video size={14} />
              Assista ao vídeo de apresentação
            </button>
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 rounded-md transition-colors ${
              isDarkMode
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>

      <VideoModal
        isOpen={videoHackatonOpen}
        onClose={() => setVideoHackatonOpen(false)}
        videoSrc="/video-hackaton.mp4"
        title="Vídeo de Apresentação - Hackathon"
      />
    </>
  );
};

export default HackatonForm;
