import React, { createContext, useState, useContext, useEffect } from 'react';

interface BulletPoint {
  id: string;
  text: string;
  color?: 'blue' | 'red' | 'purple';
}

interface FieldData {
  content: string;
  color?: 'blue' | 'red' | 'purple';
  bulletPoints?: BulletPoint[];
}

interface CanvasContextType {
  fields: Record<string, FieldData>;
  updateField: (id: string, content: string) => void;
  updateFieldColor: (id: string, color?: 'blue' | 'red' | 'purple') => void;
  updateFieldBulletPoints: (id: string, bulletPoints: BulletPoint[]) => void;
  activeField: string | null;
  setActiveField: (id: string | null) => void;
  resetFields: () => void;
  loadCanvas: (canvasData: Record<string, FieldData>) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const defaultFields: Record<string, FieldData> = {
  'company-name': { content: '' },
  'project-leader': { content: '' },
  'management-team': { content: '' },
  'contact-point': { content: '' },
  'start-date': { content: '' },
  'end-date': { content: '' },
  'corporate-strategy': { content: '' },
  'objectives-value': { content: '' },
  'key-activities': { content: '' },
  'internal-team': { content: '' },
  'external-team': { content: '' },
  'ai-tools-models': { content: '' },
  'problems-pains': { content: '' },
  'expected-benefits': { content: '' },
  'skills': { content: '' },
  'investment': { content: '' },
  'mvp-poc': { content: '' },
  'performance-metrics': { content: '' },
  'governance-ethics': { content: '' },
};

const CanvasContext = createContext<CanvasContextType>({
  fields: defaultFields,
  updateField: () => {},
  updateFieldColor: () => {},
  updateFieldBulletPoints: () => {},
  activeField: null,
  setActiveField: () => {},
  resetFields: () => {},
  loadCanvas: () => {},
  isDarkMode: true,
  toggleTheme: () => {},
});

export const useCanvas = () => useContext(CanvasContext);

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fields, setFields] = useState<Record<string, FieldData>>({
    ...defaultFields
  });
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const savedFields = localStorage.getItem('innovAI-canvas');
    if (savedFields) {
      try {
        const parsedFields = JSON.parse(savedFields);
        setFields(parsedFields);
      } catch (e) {
        console.error('Error loading saved data', e);
      }
    }

    const savedTheme = localStorage.getItem('innovAI-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('innovAI-canvas', JSON.stringify(fields));
  }, [fields]);

  useEffect(() => {
    localStorage.setItem('innovAI-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const updateField = (id: string, content: string) => {
    setFields(prev => ({
      ...prev,
      [id]: { ...prev[id], content },
    }));
  };

  const updateFieldColor = (id: string, color?: 'blue' | 'red' | 'purple') => {
    setFields(prev => ({
      ...prev,
      [id]: { ...prev[id], color },
    }));
  };

  const updateFieldBulletPoints = (id: string, bulletPoints: BulletPoint[]) => {
    setFields(prev => ({
      ...prev,
      [id]: { ...prev[id], bulletPoints },
    }));
  };

  const resetFields = () => {
    setFields(defaultFields);
    localStorage.removeItem('innovAI-canvas');
  };

  const loadCanvas = (canvasData: Record<string, FieldData>) => {
    setFields(canvasData);
    localStorage.setItem('innovAI-canvas', JSON.stringify(canvasData));
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <CanvasContext.Provider value={{ 
      fields, 
      updateField,
      updateFieldColor,
      updateFieldBulletPoints, 
      activeField, 
      setActiveField, 
      resetFields,
      loadCanvas,
      isDarkMode,
      toggleTheme
    }}>
      {children}
    </CanvasContext.Provider>
  );
};