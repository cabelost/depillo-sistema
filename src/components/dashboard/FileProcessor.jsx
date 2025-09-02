import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Send, ArrowLeft, UploadCloud, XCircle, Loader2, User, ClipboardList, BadgeDollarSign, FileText, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createWorker } from 'tesseract.js';

const FileProcessor = ({ onProcessFile, onBack, preferentialTargetName }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const workerRef = useRef(null);

  const initializeTesseract = async () => {
    if (!workerRef.current) {
        const worker = await createWorker('por');
        workerRef.current = worker;
    }
    return workerRef.current;
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      const tempPreview = URL.createObjectURL(selectedFile);
      setPreview(tempPreview);
      setIsProcessing(true);
      setExtractedData(null);
      toast({
        title: "🧠 Processando imagem...",
        description: "A inteligência artificial está lendo a comanda. Isso pode levar alguns segundos.",
      });

      try {
        const worker = await initializeTesseract();
        const { data: { text } } = await worker.recognize(selectedFile);
        
        const orderNumberMatch = text.match(/Nº:?\s*(\d+)/i);
        const dateMatch = text.match(/Data:?\s*(\d{2}\/\d{2}\/\d{4}\s*\d{2}:\d{2}:\d{2})/i);
        const clientNameMatch = text.match(/Cliente:?\s*([^\n(]*)/i);
        const totalValueMatch = text.match(/TOTAL\s+([\d,.]+)/i);

        const itemsBlockMatch = text.match(/Qtd\.\s+Item[\s\S]*?(?:TOTAL|Parc\.)/i);
        let services = [];
        if (itemsBlockMatch) {
            const lines = itemsBlockMatch[0].split('\n');
            let capturing = false;
            lines.forEach(line => {
                if (/Qtd\.\s+Item/.test(line)) {
                    capturing = true;
                    return;
                }
                if (/TOTAL|Parc\./.test(line)) {
                    capturing = false;
                    return;
                }
                if (capturing) {
                    const serviceMatch = line.match(/^\d+\s+(.*?)(?:\s+[\d,.-]+)?$/);
                    if (serviceMatch && serviceMatch[1]) {
                        const cleanedService = serviceMatch[1]
                          .replace(/Profissional:?.*/i, '')
                          .replace(/Depil\s*Linha\s*-\s*/, '') // Clean "Depil Linha - "
                          .trim();
                        if(cleanedService && cleanedService.length > 1) {
                            services.push(cleanedService);
                        }
                    }
                }
            });
        }
        
        const data = {
            orderNumber: orderNumberMatch ? orderNumberMatch[1].trim() : null,
            attendanceDate: dateMatch ? dateMatch[1].trim() : null,
            clientName: clientNameMatch ? clientNameMatch[1].trim() : null,
            services: services.length > 0 ? services.join(', ') : null,
            totalValue: totalValueMatch ? parseFloat(totalValueMatch[1].replace(/\./g, '').replace(',', '.')) : null,
        };

        if (!data.orderNumber || !data.attendanceDate || !data.clientName || !data.services || data.totalValue === null) {
            toast({
                title: "⚠️ Falha na Extração",
                description: "Não foi possível ler todos os dados da comanda. Tente uma imagem mais nítida.",
                variant: "destructive",
            });
            setExtractedData(null);
        } else {
            setExtractedData(data);
            toast({
                title: "✅ Dados Extraídos!",
                description: "Comanda lida com sucesso. Confirme e envie para a fila.",
            });
        }

      } catch (error) {
        console.error("OCR Error:", error);
        toast({
          title: "❌ Erro ao ler imagem",
          description: "Ocorreu um erro inesperado durante o processamento.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.webp'] },
    multiple: false,
    disabled: isProcessing,
  });

  const handleRemoveFile = () => {
    setFile(null);
    setExtractedData(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  };
  
  const handleProcess = () => {
    if (!extractedData) {
      toast({
        title: "⚠️ Nenhum dado extraído",
        description: "Por favor, carregue uma imagem válida da comanda.",
        variant: "destructive",
      });
      return;
    }
    
    onProcessFile({ 
        clientName: extractedData.clientName, 
        service: extractedData.services, 
        orderNumber: extractedData.orderNumber,
        attendanceDate: extractedData.attendanceDate,
        totalValue: extractedData.totalValue,
        details: '', 
        imageFile: file 
    });
    handleRemoveFile();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl p-6 shadow-md border border-gray-200"
    >
      {onBack && (
        <Button onClick={onBack} variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2" /> Voltar
        </Button>
      )}
      <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center">
        <ImageIcon className="mr-2 text-red-500" />
        {preferentialTargetName ? `Comanda para ${preferentialTargetName}` : 'Processar Comanda'}
      </h2>
      <p className="text-slate-500 text-sm mb-4">
        Anexe a imagem da comanda para leitura automática dos dados.
      </p>

      {!preview ? (
        <div
          {...getRootProps()}
          className={`mt-1 flex justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors cursor-pointer
            ${isDragActive ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-red-400'}
            ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <div className="text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
            <div className="mt-4 flex text-sm leading-6 text-slate-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md font-semibold text-red-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-red-600 focus-within:ring-offset-2 hover:text-red-500"
              >
                <span>Carregue um arquivo</span>
                <input {...getInputProps()} id="file-upload" name="file-upload" type="file" className="sr-only" />
              </label>
              <p className="pl-1">ou arraste e solte</p>
            </div>
            <p className="text-xs leading-5 text-slate-500">PNG, JPG, etc.</p>
          </div>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative mb-4"
          >
            <img-replace src={preview} alt="Pré-visualização da comanda" className="rounded-lg w-full object-contain max-h-48 border"/>
            {!isProcessing && (
                <button 
                  onClick={handleRemoveFile} 
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  aria-label="Remover imagem"
                >
                  <XCircle className="h-5 w-5" />
                </button>
            )}
            {isProcessing && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                    <p className="mt-2 text-sm font-semibold text-red-800">Lendo comanda...</p>
                </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {extractedData && (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 space-y-3 bg-slate-50 p-4 rounded-lg border"
            >
                <h3 className="font-bold text-slate-800">Dados Extraídos para Confirmação:</h3>
                <p className="flex items-center text-sm"><FileText className="w-4 h-4 mr-2 text-red-500" /> <strong>Código Cliente:</strong> {extractedData.orderNumber}</p>
                <p className="flex items-center text-sm"><Calendar className="w-4 h-4 mr-2 text-red-500" /> <strong>Data:</strong> {extractedData.attendanceDate}</p>
                <p className="flex items-center text-sm"><User className="w-4 h-4 mr-2 text-red-500" /> <strong>Cliente:</strong> {extractedData.clientName}</p>
                <p className="flex items-center text-sm"><ClipboardList className="w-4 h-4 mr-2 text-red-500" /> <strong>Item(s):</strong> {extractedData.services}</p>
                <p className="flex items-center text-sm"><BadgeDollarSign className="w-4 h-4 mr-2 text-red-500" /> <strong>Valor Total:</strong> R$ {extractedData.totalValue.toFixed(2)}</p>
            </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex flex-col sm:flex-row gap-2 mt-6">
        <Button onClick={handleProcess} className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={isProcessing || !extractedData}>
          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          {isProcessing ? 'Processando...' : preferentialTargetName ? 'Enviar Preferencial' : 'Enviar para Fila'}
        </Button>
      </div>
    </motion.div>
  );
};

export default FileProcessor;