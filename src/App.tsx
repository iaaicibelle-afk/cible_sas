import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CanvasProvider, useCanvas } from './context/CanvasContext';
import Login from './components/Login';
import ResetPassword from './components/ResetPassword';
import AdminPanel from './components/AdminPanel';
import Header from './components/Header';
import Footer from './components/Footer';
import Canvas from './components/Canvas';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AppContent = () => {
  const { isDarkMode } = useCanvas();
  
  return (
    <div className={`min-h-screen flex flex-col ${
      isDarkMode 
        ? 'bg-deep-purple text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      <Header />
      <main className="flex-grow py-4 px-4 md:px-6 lg:px-8 overflow-x-hidden">
        <Canvas />
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CanvasProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/canvas"
              element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/canvas" />} />
          </Routes>
        </CanvasProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;