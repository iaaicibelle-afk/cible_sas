import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useCanvas } from '../context/CanvasContext';
import { getColorOptions } from '../utils/colors';
import { FieldColor, BulletPoint } from '../types';

const EditModal: React.FC = () => {
  const { fields, updateFieldBulletPoints, activeField, setActiveField, isDarkMode } = useCanvas();
  const [bulletPoints, setBulletPoints] = useState<BulletPoint[]>([]);
  const [newBulletText, setNewBulletText] = useState('');
  const [newBulletColor, setNewBulletColor] = useState<FieldColor>('blue');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeField) {
      const fieldData = fields[activeField];
      if (fieldData?.bulletPoints && fieldData.bulletPoints.length > 0) {
        setBulletPoints(fieldData.bulletPoints);
      } else {
        // Se não há bullet points, criar um vazio para começar
        setBulletPoints([]);
      }
      setNewBulletText('');
      setNewBulletColor('blue');
      
      // Focar no input após um pequeno delay
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [activeField, fields]);

  // Campos centrais que não devem ter alteração de cor
  const centralFields = ['company-name', 'project-leader', 'management-team', 'contact-point', 'start-date', 'end-date'];
  const isCentralField = activeField ? centralFields.includes(activeField) : false;

  const addBulletPoint = () => {
    if (newBulletText.trim()) {
      const newBullet: BulletPoint = {
        id: Date.now().toString(),
        text: newBulletText.trim(),
        color: isCentralField ? undefined : newBulletColor
      };
      setBulletPoints([...bulletPoints, newBullet]);
      setNewBulletText('');
      
      // Focar novamente no input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  };

  const removeBulletPoint = (id: string) => {
    setBulletPoints(bulletPoints.filter(bullet => bullet.id !== id));
  };

  const updateBulletPoint = (id: string, text: string, color: FieldColor) => {
    setBulletPoints(bulletPoints.map(bullet => 
      bullet.id === id ? { ...bullet, text, color: isCentralField ? undefined : color } : bullet
    ));
  };

  const moveBulletPointUp = (index: number) => {
    if (index === 0) return;
    const newBulletPoints = [...bulletPoints];
    [newBulletPoints[index - 1], newBulletPoints[index]] = [newBulletPoints[index], newBulletPoints[index - 1]];
    setBulletPoints(newBulletPoints);
  };

  const moveBulletPointDown = (index: number) => {
    if (index === bulletPoints.length - 1) return;
    const newBulletPoints = [...bulletPoints];
    [newBulletPoints[index], newBulletPoints[index + 1]] = [newBulletPoints[index + 1], newBulletPoints[index]];
    setBulletPoints(newBulletPoints);
  };

  const handleSave = () => {
    if (activeField) {
      updateFieldBulletPoints(activeField, bulletPoints);
      setActiveField(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setActiveField(null);
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Enter' && e.target === inputRef.current) {
      e.preventDefault();
      addBulletPoint();
    }
  };

  const handleConfirm = () => {
    addBulletPoint();
  };

  if (!activeField) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pt-16">
      <div className={`${isDarkMode ? 'bg-deep-purple border-purple-500' : 'bg-white border-purple-400'} border rounded-xl max-w-lg w-full p-5 animate-fadeIn max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg">Editar Campo - Bullet Points</h3>
          <button 
            onClick={() => setActiveField(null)}
            className={`${isDarkMode ? 'text-purple-300 hover:text-white' : 'text-purple-500 hover:text-purple-700'} transition-colors`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Lista de bullet points existentes */}
        <div className="mb-6 space-y-3">
          {bulletPoints.map((bullet, index) => (
            <div key={bullet.id} className={`flex items-center gap-3 p-3 rounded-lg ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-50'}`}>
              {/* Bullet point colorido */}
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                !isCentralField && bullet.color === 'blue' ? 'bg-blue-400' :
                !isCentralField && bullet.color === 'red' ? 'bg-red-400' :
                !isCentralField && bullet.color === 'purple' ? 'bg-purple-400' :
                'bg-gray-400'
              }`} />
              
              {/* Botões de movimento */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveBulletPointUp(index)}
                  disabled={index === 0}
                  className={`p-0.5 rounded transition-colors ${
                    index === 0
                      ? 'text-gray-500 cursor-not-allowed opacity-40'
                      : isDarkMode 
                        ? 'text-purple-300 hover:text-white hover:bg-purple-700' 
                        : 'text-purple-500 hover:text-purple-700 hover:bg-purple-100'
                  }`}
                  title="Mover para cima"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => moveBulletPointDown(index)}
                  disabled={index === bulletPoints.length - 1}
                  className={`p-0.5 rounded transition-colors ${
                    index === bulletPoints.length - 1
                      ? 'text-gray-500 cursor-not-allowed opacity-40'
                      : isDarkMode 
                        ? 'text-purple-300 hover:text-white hover:bg-purple-700' 
                        : 'text-purple-500 hover:text-purple-700 hover:bg-purple-100'
                  }`}
                  title="Mover para baixo"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              
              {/* Texto editável */}
              <input
                type="text"
                value={bullet.text}
                onChange={(e) => updateBulletPoint(bullet.id, e.target.value, bullet.color)}
                className={`flex-1 bg-transparent border-none outline-none ${
                  isDarkMode ? 'text-white placeholder-purple-300' : 'text-gray-800 placeholder-gray-400'
                }`}
                placeholder="Digite o texto do bullet point..."
              />
              
              {/* Seletor de cor (apenas para campos não centrais) */}
              {!isCentralField && (
                <div className="flex gap-1">
                  {getColorOptions(isDarkMode).map(({ value, bgClass }) => (
                    <button
                      key={value}
                      onClick={() => updateBulletPoint(bullet.id, bullet.text, value)}
                      className={`w-6 h-6 rounded-full ${bgClass} ${
                        bullet.color === value ? 'ring-2 ring-offset-1 ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={`Cor ${value}`}
                    />
                  ))}
                </div>
              )}
              
              {/* Botão remover */}
              <button
                onClick={() => removeBulletPoint(bullet.id)}
                className={`p-1 rounded ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'} transition-colors`}
                title="Remover bullet point"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Adicionar novo bullet point */}
        <div className={`p-4 rounded-lg border-2 border-dashed ${isDarkMode ? 'border-purple-600 bg-purple-900/30' : 'border-purple-300 bg-purple-50/50'}`}>
          <div className="flex items-center gap-3 mb-3">
            {/* Preview do bullet point */}
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
              !isCentralField && newBulletColor === 'blue' ? 'bg-blue-400' :
              !isCentralField && newBulletColor === 'red' ? 'bg-red-400' :
              !isCentralField && newBulletColor === 'purple' ? 'bg-purple-400' :
              'bg-gray-400'
            }`} />
            
            {/* Input para novo bullet */}
            <input
              ref={inputRef}
              type="text"
              value={newBulletText}
              onChange={(e) => setNewBulletText(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`flex-1 px-3 py-2 rounded-md border ${
                isDarkMode 
                  ? 'bg-purple-800 border-purple-600 text-white placeholder-purple-300' 
                  : 'bg-white border-purple-200 text-gray-800 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              placeholder="Digite um novo bullet point..."
            />
            
            {/* Botão adicionar */}
            <button
              onClick={addBulletPoint}
              disabled={!newBulletText.trim()}
              className={`p-2 rounded-md transition-colors ${
                newBulletText.trim()
                  ? 'bg-purple-600 text-white hover:bg-purple-500'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title="Adicionar bullet point"
            >
              <Plus size={16} />
            </button>
            
            {/* Botão confirmar */}
            <button
              onClick={handleConfirm}
              disabled={!newBulletText.trim()}
              className={`px-3 py-2 rounded-md transition-colors text-xs font-medium ${
                newBulletText.trim()
                  ? 'bg-green-600 text-white hover:bg-green-500'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title="Confirmar bullet point"
            >
              OK
            </button>
          </div>
          
          {/* Seletor de cor para novo bullet (apenas para campos não centrais) */}
          {!isCentralField && (
            <div className="flex gap-2 items-center">
              <span className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                Cor:
              </span>
              {getColorOptions(isDarkMode).map(({ value, label, bgClass }) => (
                <button
                  key={value}
                  onClick={() => setNewBulletColor(value)}
                  className={`px-3 py-1 rounded-full text-xs text-white ${bgClass} ${
                    newBulletColor === value ? 'ring-2 ring-offset-1 ring-white' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Instruções */}
        <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
            💡 <strong>Dicas:</strong>
          </p>
          <ul className={`text-xs mt-1 space-y-1 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`}>
            <li>• Pressione Enter ou clique em OK para adicionar um novo bullet point</li>
            <li>• Cada bullet point pode ter sua própria cor</li>
            <li>• Use Ctrl+Enter para salvar ou Esc para cancelar</li>
          </ul>
        </div>
        
        <div className="flex justify-end mt-6 gap-3">
          <button 
            onClick={() => setActiveField(null)} 
            className={`px-4 py-2 rounded-md transition-colors ${
              isDarkMode 
                ? 'border border-purple-600 hover:bg-purple-800' 
                : 'border border-purple-400 hover:bg-purple-50'
            }`}
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-500 transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;