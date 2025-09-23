import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

const saveOriginalStyles = (element: HTMLElement) => {
  return {
    width: element.style.width,
    height: element.style.height,
    overflow: element.style.overflow,
  };
};

const setExportStyles = (element: HTMLElement, width: number, height: number) => {
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  element.style.overflow = 'visible';
};

const restoreStyles = (element: HTMLElement, originalStyles: any) => {
  element.style.width = originalStyles.width;
  element.style.height = originalStyles.height;
  element.style.overflow = originalStyles.overflow;
};

export const exportToPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    // Calcular tamanho total da viewport
    const width = Math.max(
      document.documentElement.scrollWidth, 
      window.innerWidth
    );
    const height = Math.max(
      document.documentElement.scrollHeight, 
      window.innerHeight
    );

    // Salvar estilos originais
    const originalStyles = saveOriginalStyles(element);
    setExportStyles(element, width, height);

    // Gerar canvas capturando o body inteiro
    const canvas = await html2canvas(document.body, {
      scale: 2, // Voltar para escala 2 para evitar problemas
      backgroundColor: '#1E1E2F',
      useCORS: true,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: width,
      windowHeight: height,
      width: width,
      height: height,
      letterRendering: true, // Melhor renderização de texto
      foreignObjectRendering: false, // Evitar problemas de posicionamento
      imageTimeout: 0, // Sem timeout para imagens
      removeContainer: true, // Remover container temporário
      logging: false, // Desabilitar logs
      proxy: undefined, // Evitar problemas de proxy
      onclone: (doc) => {
        const clonedElement = doc.getElementById(elementId);
        if (clonedElement) {
          setExportStyles(clonedElement, width, height);
        }
        doc.body.style.width = `${width}px`;
        doc.body.style.height = `${height}px`;
        doc.documentElement.style.width = `${width}px`;
        doc.documentElement.style.height = `${height}px`;
        
        // Aplicar correções sutis para alinhamento vertical de texto
        doc.body.style.lineHeight = '1.25';
        
        // Aplicar correções específicas para elementos de texto
        const textElements = doc.querySelectorAll('body, p, li, h1, h2, h3, h4, h5, h6, div, span');
        textElements.forEach((el: any) => {
          el.style.lineHeight = '1.25';
          el.style.verticalAlign = 'baseline';
          // Compensação sutil para baseline
          el.style.transform = 'translateY(-0.5px)';
        });
        
        // Definir vertical-align para imagens e ícones
        const inlineElements = doc.querySelectorAll('img, svg, i, .icon');
        inlineElements.forEach((el: any) => {
          el.style.verticalAlign = 'text-top';
        });
        
        // Aplicar estilos de renderização otimizados
        const allElements = doc.querySelectorAll('*');
        allElements.forEach((el: any) => {
          if (el.textContent && el.textContent.trim()) {
            el.style.textRendering = 'optimizeLegibility';
            el.style.fontKerning = 'normal';
            el.style.webkitFontSmoothing = 'subpixel-antialiased';
          }
        });
        
        // Forçar recálculo de layout
        doc.body.offsetHeight;
        
        // Aguardar renderização
        setTimeout(() => {
          doc.body.offsetHeight;
        }, 100);
      }
    });

    // Restaurar estilos originais
    restoreStyles(element, originalStyles);

    // Gerar e salvar PDF em formato A4 para melhor legibilidade
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Dimensões A4 em mm (landscape)
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calcular proporção para manter aspect ratio
    const canvasAspectRatio = canvas.width / canvas.height;
    const pdfAspectRatio = pdfWidth / pdfHeight;
    
    let imgWidth = pdfWidth;
    let imgHeight = pdfHeight;
    let offsetX = 0;
    let offsetY = 0;
    
    if (canvasAspectRatio > pdfAspectRatio) {
      // Canvas é mais largo que o PDF
      imgHeight = pdfWidth / canvasAspectRatio;
      offsetY = (pdfHeight - imgHeight) / 2;
    } else {
      // Canvas é mais alto que o PDF
      imgWidth = pdfHeight * canvasAspectRatio;
      offsetX = (pdfWidth - imgWidth) / 2;
    }
    
    pdf.addImage(imgData, 'PNG', offsetX, offsetY, imgWidth, imgHeight);
    pdf.save(`${filename}.pdf`);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Falha ao gerar PDF. Tente novamente.');
  }
};

// Função para extrair textos com tag [[purple]]
export const extractPurpleTexts = (elementId: string): string[] => {
  const element = document.getElementById(elementId);
  if (!element) return [];

  const purpleTexts: string[] = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );

  let node;
  while (node = walker.nextNode()) {
    const textContent = node.textContent || '';
    const purpleMatches = textContent.match(/\[\[purple\]\](.*?)\[\[\/purple\]\]/g);
    
    if (purpleMatches) {
      purpleMatches.forEach(match => {
        const text = match.replace(/\[\[purple\]\]|\[\[\/purple\]\]/g, '');
        if (text.trim()) {
          purpleTexts.push(text.trim());
        }
      });
    }
  }

  return purpleTexts;
};

// Função para exportar dados para XLS
export const exportToXLS = async (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Elemento canvas-container não encontrado');
      return;
    }

    // Mapeamento de IDs para títulos legíveis
    const fieldTitles: Record<string, string> = {
      'company-name': 'Nome da Empresa',
      'project-leader': 'Líder do projeto',
      'management-team': 'Equipe gestora',
      'contact-point': 'Ponto de contato',
      'start-date': 'Data Início',
      'end-date': 'Data Fim',
      'corporate-strategy': 'Estratégia Corporativa',
      'objectives-value': 'Objetivos e Proposta de Valor',
      'key-activities': 'Atividades Chave da Empresa',
      'internal-team': 'Equipe Interna',
      'external-team': 'Equipe Externa',
      'ai-tools-models': 'Ferramentas e Modelos de IA',
      'problems-pains': 'Problemas e Dores',
      'expected-benefits': 'Benefícios Esperados',
      'skills': 'Skills',
      'investment': 'Investimento',
      'mvp-poc': 'MVP / POC',
      'performance-metrics': 'Métricas de Desempenho',
      'governance-ethics': 'Governança e Ética em IA'
    };

    // Extrair dados do contexto React (localStorage)
    const savedFields = localStorage.getItem('innovAI-canvas');
    let fieldsData: Record<string, any> = {};
    
    if (savedFields) {
      try {
        fieldsData = JSON.parse(savedFields);
        console.log('Dados carregados do localStorage:', fieldsData);
        console.log('Total de campos encontrados:', Object.keys(fieldsData).length);
      } catch (e) {
        console.error('Error parsing saved data', e);
      }
    } else {
      console.warn('Nenhum dado encontrado no localStorage');
    }

    // Criar dados para a planilha
    const data: any[] = [];
    
    // Adicionar cabeçalhos
    data.push(['Campo', 'Conteúdo']);
    
    let fieldsWithContent = 0;
    let fieldsEmpty = 0;
    
    // Adicionar dados de cada campo
    Object.keys(fieldTitles).forEach(fieldId => {
      const title = fieldTitles[fieldId];
      const fieldData = fieldsData[fieldId];
      let content = '';
      
      // Verificar se há conteúdo direto no campo
      if (fieldData?.content && fieldData.content.trim()) {
        content = fieldData.content;
        // Limpar tags de formatação do conteúdo
        content = content.replace(/\[\[blue\]\]|\[\[\/blue\]\]/g, '');
        content = content.replace(/\[\[red\]\]|\[\[\/red\]\]/g, '');
        content = content.replace(/\[\[purple\]\]|\[\[\/purple\]\]/g, '');
      }
      
      // Verificar se há bullet points
      if (fieldData?.bulletPoints && Array.isArray(fieldData.bulletPoints) && fieldData.bulletPoints.length > 0) {
        const bulletTexts = fieldData.bulletPoints
          .filter((bullet: any) => bullet.text && bullet.text.trim())
          .map((bullet: any) => `• ${bullet.text.trim()}`)
          .join('\n');
        
        if (bulletTexts) {
          content = content ? `${content}\n\n${bulletTexts}` : bulletTexts;
        }
      }
      
      console.log(`Campo ${fieldId}:`, content ? `"${content}"` : 'VAZIO');
      
      if (content && content.trim()) {
        fieldsWithContent++;
        data.push([title, content]);
      } else {
        fieldsEmpty++;
        data.push([title, 'Clique para editar']);
      }
    });

    console.log(`Resumo da exportação: ${fieldsWithContent} campos com conteúdo, ${fieldsEmpty} campos vazios`);

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Ajustar largura das colunas
    const colWidths = [
      { wch: 35 }, // Campo
      { wch: 60 }  // Conteúdo
    ];
    ws['!cols'] = colWidths;
    
    // Estilizar cabeçalhos
    if (ws['A1']) ws['A1'].s = { font: { bold: true }, fill: { fgColor: { rgb: "CCCCCC" } } };
    if (ws['B1']) ws['B1'].s = { font: { bold: true }, fill: { fgColor: { rgb: "CCCCCC" } } };
    
    XLSX.utils.book_append_sheet(wb, ws, 'Canvas');
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
    console.log('Arquivo XLS gerado com sucesso!');
    
  } catch (error) {
    console.error('Error generating XLS:', error);
    alert('Falha ao gerar XLS. Tente novamente.');
  }
};

// Função para exportar apenas insights (textos roxos) para XLS
export const exportInsightsToXLS = async (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Mapeamento de IDs para títulos legíveis
    const fieldTitles: Record<string, string> = {
      'company-name': 'Nome da Empresa',
      'project-leader': 'Líder do projeto',
      'management-team': 'Equipe gestora',
      'contact-point': 'Ponto de contato',
      'start-date': 'Data Início',
      'end-date': 'Data Fim',
      'corporate-strategy': 'Estratégia Corporativa',
      'objectives-value': 'Objetivos e Proposta de Valor',
      'key-activities': 'Atividades Chave da Empresa',
      'internal-team': 'Equipe Interna',
      'external-team': 'Equipe Externa',
      'ai-tools-models': 'Ferramentas e Modelos de IA',
      'problems-pains': 'Problemas e Dores',
      'expected-benefits': 'Benefícios Esperados',
      'skills': 'Skills',
      'investment': 'Investimento',
      'mvp-poc': 'MVP / POC',
      'performance-metrics': 'Métricas de Desempenho',
      'governance-ethics': 'Governança e Ética em IA'
    };

    // Extrair dados do contexto React (localStorage)
    const savedFields = localStorage.getItem('innovAI-canvas');
    let fieldsData: Record<string, any> = {};
    
    if (savedFields) {
      try {
        fieldsData = JSON.parse(savedFields);
        console.log('Dados carregados do localStorage (Insights):', fieldsData);
      } catch (e) {
        console.error('Error parsing saved data', e);
      }
    } else {
      console.warn('Nenhum dado encontrado no localStorage (Insights)');
    }

    // Criar dados para a planilha
    const data: any[] = [];
    
    // Adicionar cabeçalhos
    data.push(['Campo', 'Insights']);
    
    // Adicionar dados apenas dos campos que contêm bullet points roxos
    let hasInsights = false;
    
    Object.keys(fieldTitles).forEach(fieldId => {
      const title = fieldTitles[fieldId];
      const fieldData = fieldsData[fieldId];
      
      // Verificar se o campo tem bullet points
      if (fieldData?.bulletPoints && Array.isArray(fieldData.bulletPoints)) {
        // Filtrar apenas bullet points roxos
        const purpleBullets = fieldData.bulletPoints.filter((bullet: any) => bullet.color === 'purple');
        
        if (purpleBullets.length > 0) {
          const insights = purpleBullets.map((bullet: any) => bullet.text).filter((text: string) => text && text.trim().length > 0);
          
          if (insights.length > 0) {
            data.push([title, insights.join(' | ')]);
            hasInsights = true;
          }
        }
      }
    });

    if (!hasInsights) {
      alert('Nenhum insight encontrado. Adicione bullet points com cor roxa para exportar.');
      return;
    }

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Ajustar largura das colunas
    const colWidths = [
      { wch: 35 }, // Campo
      { wch: 70 }  // Insights
    ];
    ws['!cols'] = colWidths;
    
    // Estilizar cabeçalhos
    if (ws['A1']) ws['A1'].s = { font: { bold: true }, fill: { fgColor: { rgb: "CCCCCC" } } };
    if (ws['B1']) ws['B1'].s = { font: { bold: true }, fill: { fgColor: { rgb: "CCCCCC" } } };
    
    XLSX.utils.book_append_sheet(wb, ws, 'Insights');
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
  } catch (error) {
    console.error('Error generating Insights XLS:', error);
    alert('Falha ao gerar XLS de Insights. Tente novamente.');
  }
};

// Função para exportar insights para PDF (otimizada para impressão)
export const exportInsightsToPDF = async (elementId: string, filename: string) => {
  try {
    // Mapeamento de IDs para títulos legíveis
    const fieldTitles: Record<string, string> = {
      'company-name': 'Nome da Empresa',
      'project-leader': 'Líder do projeto',
      'management-team': 'Equipe gestora',
      'contact-point': 'Ponto de contato',
      'start-date': 'Data Início',
      'end-date': 'Data Fim',
      'corporate-strategy': 'Estratégia Corporativa',
      'objectives-value': 'Objetivos e Proposta de Valor',
      'key-activities': 'Atividades Chave da Empresa',
      'internal-team': 'Equipe Interna',
      'external-team': 'Equipe Externa',
      'ai-tools-models': 'Ferramentas e Modelos de IA',
      'problems-pains': 'Problemas e Dores',
      'expected-benefits': 'Benefícios Esperados',
      'skills': 'Skills',
      'investment': 'Investimento',
      'mvp-poc': 'MVP / POC',
      'performance-metrics': 'Métricas de Desempenho',
      'governance-ethics': 'Governança e Ética em IA'
    };

    // Extrair dados do localStorage
    const savedFields = localStorage.getItem('innovAI-canvas');
    let fieldsData: Record<string, any> = {};
    
    if (savedFields) {
      try {
        fieldsData = JSON.parse(savedFields);
        console.log('Dados carregados do localStorage (Insights PDF):', fieldsData);
      } catch (e) {
        console.error('Error parsing saved data', e);
        return;
      }
    } else {
      console.warn('Nenhum dado encontrado no localStorage (Insights PDF)');
      alert('Nenhum dado encontrado para exportar.');
      return;
    }

    // Coletar insights
    const insights: Array<{field: string, content: string}> = [];
    
    Object.keys(fieldTitles).forEach(fieldId => {
      const title = fieldTitles[fieldId];
      const fieldData = fieldsData[fieldId];
      
      // Verificar se o campo tem bullet points
      if (fieldData?.bulletPoints && Array.isArray(fieldData.bulletPoints)) {
        // Filtrar apenas bullet points roxos
        const purpleBullets = fieldData.bulletPoints.filter((bullet: any) => bullet.color === 'purple');
        
        if (purpleBullets.length > 0) {
          const insightTexts = purpleBullets.map((bullet: any) => bullet.text).filter((text: string) => text && text.trim().length > 0);
          
          if (insightTexts.length > 0) {
            // Formatar cada bullet point em uma linha separada
            const formattedContent = insightTexts.map(text => `• ${text}`).join('\n');
            insights.push({
              field: title,
              content: formattedContent
            });
          }
        }
      }
    });

    if (insights.length === 0) {
      alert('Nenhum insight encontrado. Adicione bullet points com cor roxa para exportar.');
      return;
    }

    console.log(`Encontrados ${insights.length} insights para exportar`);

    // Criar PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 25; // Aumentado de 20 para 25
    const contentWidth = pageWidth - (margin * 2); // Largura efetiva reduzida
    
    let currentY = margin;
    
    // Definir fonte padrão no início
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);

    // Título do documento
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Insights do Canvas InnovAI', margin, currentY);
    currentY += 15;

    // Data de geração
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('pt-BR');
    pdf.text(`Gerado em: ${currentDate}`, margin, currentY);
    currentY += 20;

    // Processar cada insight
    pdf.setFontSize(12);
    
    // Definir posição fixa para o texto (fora do loop)
    let textStartX = margin + 15; // Margem fixa de 15mm para o texto
    
    insights.forEach((insight, index) => {
      // Título do campo com alinhamento fixo
      pdf.setFont('helvetica', 'bold');
      const numberText = `${index + 1}.`;
      const fieldText = insight.field;
      
      // Verificar se precisa de nova página para o título
      if (currentY > pageHeight - 50) {
        pdf.addPage();
        currentY = margin;
        // Redefinir fonte após nova página
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
      }
      
      // Posicionar número com largura fixa
      pdf.text(numberText, margin, currentY - 2);
      
      // Posicionar texto do campo com margem fixa (independente do tamanho do número)
      pdf.text(fieldText, textStartX, currentY - 2);
      currentY += 10;

      // Conteúdo do insight
      pdf.setFont('helvetica', 'normal');
      
      // Quebrar texto em linhas para caber na página com margem de segurança adicional
      const textWidth = contentWidth - 25; // Ajustar para considerar a margem do texto alinhado
      
      // Função personalizada para quebrar texto preservando palavras e quebras de linha
      const breakTextIntoLines = (text: string, maxWidth: number): string[] => {
        // Primeiro, dividir por quebras de linha existentes
        const paragraphs = text.split('\n');
        const allLines: string[] = [];
        
        // Definir fonte antes de medir o texto
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        
        paragraphs.forEach(paragraph => {
          if (!paragraph.trim()) {
            // Linha vazia, adicionar espaço
            allLines.push('');
            return;
          }
          
          const words = paragraph.split(' ');
          let currentLine = '';
          
          words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = pdf.getTextWidth(testLine);
            
            if (testWidth <= maxWidth) {
              currentLine = testLine;
            } else {
              if (currentLine) {
                allLines.push(currentLine);
                currentLine = word;
              } else {
                // Palavra muito longa, forçar quebra
                allLines.push(word);
              }
            }
          });
          
          if (currentLine) {
            allLines.push(currentLine);
          }
        });
        
        return allLines;
      };
      
      const lines = breakTextIntoLines(insight.content, textWidth);
      
      // Calcular altura necessária para todas as linhas
      const lineHeight = 7; // Aumentado de 6 para 7
      const linesHeight = lines.length * lineHeight;
      const spaceAfterInsight = 12; // Espaço após cada insight
      
      // Verificar se as linhas cabem na página atual (com margem de segurança)
      if (currentY + linesHeight + spaceAfterInsight > pageHeight - margin - 15) {
        pdf.addPage();
        currentY = margin;
        // Redefinir fonte após nova página
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
      }
      
      // Adicionar as linhas com espaçamento adequado e alinhamento fixo
      lines.forEach((line: string) => {
        // Verificar novamente se a linha atual cabe na página
        if (currentY + lineHeight > pageHeight - margin - 15) {
          pdf.addPage();
          currentY = margin;
          // Redefinir fonte após nova página
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(12);
        }
        
        // Garantir que a fonte esteja definida antes de adicionar o texto
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        
        // Garantir que o texto mantenha o alinhamento com a margem fixa
        pdf.text(line.trim(), textStartX, currentY - 2);
        currentY += lineHeight;
      });
      
      currentY += spaceAfterInsight; // Espaço entre insights
    });

    // Rodapé
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      // Posicionar o rodapé respeitando as margens
      pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 30, pageHeight - margin);
    }

    // Salvar PDF
    pdf.save(`${filename}.pdf`);
    console.log('PDF de insights gerado com sucesso!');
    
  } catch (error) {
    console.error('Error generating Insights PDF:', error);
    alert('Falha ao gerar PDF de Insights. Tente novamente.');
  }
};

// Função para exportar canvas completo para PDF (captura da tela real)
export const exportCanvasToPDF = async (elementId: string, filename: string) => {
  try {
    // Encontrar o elemento principal da aplicação (incluindo header com logo)
    const appElement = document.querySelector('#root') || document.body;
    
    if (!appElement) {
      console.error('Elemento da aplicação não encontrado');
      alert('Erro ao encontrar a página para exportar');
      return;
    }

    // Calcular dimensões reais da página completa
    const fullWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
      window.innerWidth
    );
    const fullHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      window.innerHeight
    );

    // Configurações do html2canvas para captura de alta qualidade
    const canvas = await html2canvas(appElement as HTMLElement, {
      scale: 2, // Escala para qualidade
      useCORS: true, // Permitir imagens de outras origens
      allowTaint: true, // Permitir elementos "tainted"
      backgroundColor: '#1E1E2F', // Fundo escuro padrão
      logging: false, // Desabilitar logs
      width: fullWidth,
      height: fullHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: fullWidth,
      windowHeight: fullHeight,
      letterRendering: true, // Melhor renderização de texto
      foreignObjectRendering: false, // Evitar problemas de posicionamento
      imageTimeout: 0, // Sem timeout para imagens
      removeContainer: true, // Remover container temporário
      proxy: undefined, // Evitar problemas de proxy
      onclone: (doc) => {
        // Garantir que o documento clonado tenha as dimensões corretas
        doc.body.style.width = `${fullWidth}px`;
        doc.body.style.height = `${fullHeight}px`;
        doc.documentElement.style.width = `${fullWidth}px`;
        doc.documentElement.style.height = `${fullHeight}px`;
        
        // Aplicar correções sutis para alinhamento vertical de texto
        doc.body.style.lineHeight = '1.25';
        
        // Aplicar correções específicas para elementos de texto
        const textElements = doc.querySelectorAll('body, p, li, h1, h2, h3, h4, h5, h6, div, span');
        textElements.forEach((el: any) => {
          el.style.lineHeight = '1.25';
          el.style.verticalAlign = 'baseline';
          // Compensação sutil para baseline
          el.style.transform = 'translateY(-0.5px)';
        });
        
        // Definir vertical-align para imagens e ícones
        const inlineElements = doc.querySelectorAll('img, svg, i, .icon');
        inlineElements.forEach((el: any) => {
          el.style.verticalAlign = 'text-top';
        });
        
        // Aplicar estilos de renderização otimizados
        const allElements = doc.querySelectorAll('*');
        allElements.forEach((el: any) => {
          if (el.textContent && el.textContent.trim()) {
            el.style.textRendering = 'optimizeLegibility';
            el.style.fontKerning = 'normal';
            el.style.webkitFontSmoothing = 'subpixel-antialiased';
          }
        });
        
        // Forçar recálculo de layout
        doc.body.offsetHeight;
        
        // Aguardar renderização
        setTimeout(() => {
          doc.body.offsetHeight;
        }, 100);
      },
      ignoreElements: (element) => {
        // Ignorar modais e elementos flutuantes
        return element.classList.contains('modal') || 
               element.classList.contains('tooltip') ||
               element.getAttribute('role') === 'dialog';
      }
    });

    // Criar PDF com dimensões dinâmicas baseadas no conteúdo
    const pdf = new jsPDF({
      orientation: fullWidth > fullHeight ? 'landscape' : 'portrait',
      unit: 'px',
      format: [fullWidth, fullHeight]
    });
    
    // Adicionar a imagem ocupando toda a página
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', 0, 0, fullWidth, fullHeight);
    
    // Salvar PDF
    pdf.save(`${filename}.pdf`);
    console.log('PDF da página completa gerado com sucesso!');
    
  } catch (error) {
    console.error('Error generating page PDF:', error);
    alert('Falha ao gerar PDF da página. Tente novamente.');
  }
};