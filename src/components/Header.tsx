import React, { useState } from 'react';
import { Download, RefreshCw, Sun, Moon, FileSpreadsheet, Lightbulb, Save, FolderOpen, LogOut } from 'lucide-react';
import { useCanvas } from '../context/CanvasContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { exportToPDF, exportToXLS, exportInsightsToXLS, exportInsightsToPDF, exportCanvasToPDF } from '../utils/export';
import SaveCanvasModal from './SaveCanvasModal';
import CanvasList from './CanvasList';

const Header: React.FC = () => {
  const { resetFields, isDarkMode, toggleTheme, fields, loadCanvas } = useCanvas();
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCanvasList, setShowCanvasList] = useState(false);

  const handleLoadCanvas = (canvasData: any) => {
    loadCanvas(canvasData);
    setShowCanvasList(false);
  };

  const handleSaveSuccess = () => {
    // Mensagem de sucesso pode ser adicionada aqui
    console.log('Canvas salvo com sucesso!');
  };

  return (
    <>
      {/* Logo centralizado no topo - sempre usa a logo original */}
      <div className="w-full flex justify-center py-8">
        <img 
          src={isDarkMode ? "/logo-dark.png.png" : "/logo-light.png.png"} 
          alt="Logo da empresa" 
          className="max-h-32 max-w-96 object-contain"
        />
      </div>
      
      <header className={`py-6 px-4 md:px-8 flex flex-col md:flex-row items-center justify-end ${
        isDarkMode ? 'border-purple-800' : 'border-gray-200'
      }`}>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button
            onClick={toggleTheme}
            className={`flex items-center px-3 py-2 rounded-md transition-colors ${
              isDarkMode 
                ? 'bg-purple-700 hover:bg-purple-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          
          <button
            onClick={() => exportCanvasToPDF('canvas-container', 'innov-ai-canvas')}
            className={`flex items-center px-3 py-2 rounded-md transition-colors ${
              isDarkMode 
                ? 'bg-purple-700 hover:bg-purple-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            <Download size={16} className="mr-1" />
            PDF
          </button>
          
          <button
            onClick={() => exportToXLS('canvas-container', 'innov-ai-canvas')}
            className={`flex items-center px-3 py-2 rounded-md transition-colors ${
              isDarkMode 
                ? 'bg-purple-700 hover:bg-purple-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            <FileSpreadsheet size={16} className="mr-1" />
            XLS
          </button>
          
          <div className="relative group">
            <button
              className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                isDarkMode 
                  ? 'bg-green-700 hover:bg-green-600 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <Lightbulb size={16} className="mr-1" />
              <span className="hidden md:inline">Exportar Insights</span>
              <span className="md:hidden">Insights</span>
            </button>
            
            {/* Dropdown menu */}
            <div className={`absolute right-0 mt-1 w-48 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <div className="py-1">
                <button
                  onClick={() => exportInsightsToXLS('canvas-container', 'innov-ai-canvas-insights')}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FileSpreadsheet size={14} className="inline mr-2" />
                  Exportar como XLS
                </button>
                <button
                  onClick={() => exportInsightsToPDF('canvas-container', 'innov-ai-canvas-insights')}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Download size={14} className="inline mr-2" />
                  Exportar como PDF
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowSaveModal(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              isDarkMode 
                ? 'bg-blue-700 hover:bg-blue-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Save size={16} />
            <span className="hidden md:inline">Salvar Canvas</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowCanvasList(!showCanvasList)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isDarkMode 
                  ? 'bg-purple-700 hover:bg-purple-600 text-white' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              <FolderOpen size={16} />
              <span className="hidden md:inline">Abrir Canvas</span>
            </button>
            {showCanvasList && (
              <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-xl p-4 z-50 ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
                <h3 className={`font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Canvas Salvos
                </h3>
                <CanvasList onLoadCanvas={handleLoadCanvas} />
              </div>
            )}
          </div>

          {profile?.role === 'super_admin' && (
            <div className={`px-3 py-2 text-xs rounded-md ${
              isDarkMode 
                ? 'bg-yellow-600 text-white' 
                : 'bg-yellow-500 text-white'
            }`}>
              Admin
            </div>
          )}
          
          <button
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            <LogOut size={16} />
            <span className="hidden md:inline">Sair</span>
          </button>
          
          <button
            onClick={resetFields}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              isDarkMode 
                ? 'bg-red-700 hover:bg-red-600 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <RefreshCw size={16} />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </header>

      <SaveCanvasModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        canvasData={fields}
        onSaveSuccess={handleSaveSuccess}
      />
    </>
  );
};

export default Header;