import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const PdfProcessor = () => {
    const fileInputRef = useRef(null);
    const [extractedData, setExtractedData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const processPdf = async (file) => {
        if (!file) return;
        setIsLoading(true);
        setExtractedData(null);

        try {
            const fileReader = new FileReader();
            fileReader.onload = async (e) => {
                const typedarray = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
                
                let allTextItems = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    allTextItems.push(...textContent.items);
                }

                const fullTextForDebug = allTextItems.map(item => item.str).join(' ');
                let comandaNum, clienteNome, dataAtendimento, valorTotal;
                const servicos = [];
                const errorMessages = [];

                // --- STRATEGY 1: Regex on full text (most reliable for varied formats) ---
                const clienteRegex = /Cliente:?\s*([^\n\r]*)/i;
                const clienteMatch = fullTextForDebug.match(clienteRegex);
                if (clienteMatch && clienteMatch[1]) {
                    clienteNome = clienteMatch[1].split(/CPF:|Tel:/i)[0].trim();
                }

                const comandaRegex = /Nº:?\s*(\S+)/i;
                const comandaMatch = fullTextForDebug.match(comandaRegex);
                if (comandaMatch && comandaMatch[1]) {
                    comandaNum = comandaMatch[1].trim();
                }

                // --- STRATEGY 2: Coordinate-based search (fallback) ---
                if (!clienteNome || !comandaNum) {
                    const lines = {};
                    allTextItems.forEach(item => {
                        const y = Math.round(item.transform[5]);
                        if (!lines[y]) lines[y] = [];
                        lines[y].push({ text: item.str, x: item.transform[4] });
                    });

                    const sortedLines = Object.values(lines).map(lineItems => 
                        lineItems.sort((a, b) => a.x - b.x).map(item => item.text).join(' ')
                    );

                    for (const line of sortedLines) {
                        if (!clienteNome) {
                            const match = line.match(/Cliente:?\s*(.*)/i);
                            if (match && match[1]) clienteNome = match[1].trim();
                        }
                        if (!comandaNum) {
                            const match = line.match(/Nº:?\s*(\S+)/i);
                            if (match && match[1]) comandaNum = match[1].trim();
                        }
                    }
                }

                if (!clienteNome) {
                    errorMessages.push(`Falha ao extrair o nome do cliente. Verifique se o rótulo "Cliente:" está legível.`);
                }
                if (!comandaNum) {
                    errorMessages.push(`Falha ao extrair o número da comanda. Verifique se o rótulo "Nº:" está legível.`);
                }

                if (errorMessages.length > 0) {
                    toast({
                        title: 'Erro de Extração Detalhado',
                        description: (
                            <div className="text-sm">
                                {errorMessages.map((msg, i) => <p key={i}>{msg}</p>)}
                                <details className="mt-2 text-xs text-gray-400">
                                    <summary>Clique para ver o texto extraído (debug)</summary>
                                    <pre className="mt-1 p-2 bg-gray-100 rounded text-gray-600 max-h-40 overflow-auto">{fullTextForDebug}</pre>
                                </details>
                            </div>
                        ),
                        variant: 'destructive',
                        duration: 15000,
                    });
                    setIsLoading(false);
                    return;
                }

                const dataMatch = fullTextForDebug.match(/Data:\s*(\d{2}\/\d{2}\/\d{4})/);
                if(dataMatch) dataAtendimento = dataMatch[1];

                const totalMatch = fullTextForDebug.match(/Total\s+R\$\s*([\d,.]+)/i) || fullTextForDebug.match(/TOTAL\s+([\d,.]+)/i);
                if(totalMatch) valorTotal = parseFloat(totalMatch[1].replace(/\./g, '').replace(',', '.'));

                const itemsRegex = /Qtd\.\s+Item[\s\S]*?Total/i;
                const itemsBlockMatch = fullTextForDebug.match(itemsRegex);
                if (itemsBlockMatch) {
                    const itemLines = itemsBlockMatch[0].split(/\n|\r/);
                    itemLines.forEach(line => {
                        const match = line.match(/^\d+\s+(.*?)\s+([\d,]+\.\d{2}|[\d,]+)$/);
                        if (match) {
                            servicos.push({
                                item: match[1].replace(/Depiladora:.*/, '').trim(),
                                valor: parseFloat(match[2].replace('.', '').replace(',', '.'))
                            });
                        }
                    });
                }

                const data = {
                    comanda_numero: comandaNum,
                    cliente_nome: clienteNome,
                    data_atendimento: dataAtendimento ? new Date(dataAtendimento.split('/').reverse().join('-')) : new Date(),
                    servicos,
                    valor_total: valorTotal || 0
                };

                setExtractedData(data);
                toast({ title: 'PDF Processado!', description: 'Dados extraídos com sucesso. Verifique e salve.' });
            };
            fileReader.readAsArrayBuffer(file);
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro Crítico ao Processar PDF', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = async () => {
        if (!extractedData || !supabase) return;
        setIsLoading(true);

        const { error } = await supabase
            .from('atendimentos')
            .insert([
                { 
                    comanda_numero: extractedData.comanda_numero,
                    cliente_nome: extractedData.cliente_nome,
                    data_atendimento: extractedData.data_atendimento,
                    servicos: extractedData.servicos,
                    valor_total: extractedData.valor_total
                }
            ]);

        if (error) {
            toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Salvo com sucesso!', description: 'A comanda foi adicionada ao histórico.' });
            setExtractedData(null);
        }
        setIsLoading(false);
    };

    return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-md border border-gray-200"
        >
            <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center">
                <FileText className="mr-2 text-red-500" />
                Extrair Comanda de PDF
            </h2>
            <p className="text-slate-500 text-sm mb-4">
                Carregue um arquivo PDF de comanda para extrair e salvar os dados.
            </p>
            <input
                type="file"
                accept="application/pdf"
                ref={fileInputRef}
                onChange={(e) => processPdf(e.target.files[0])}
                className="hidden"
            />
            <Button onClick={() => fileInputRef.current.click()} className="w-full" variant="outline" disabled={isLoading || !supabase}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2" />}
                {isLoading ? 'Processando...' : 'Carregar PDF'}
            </Button>
            
            <AnimatePresence>
            {extractedData && (
                <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="text-sm space-y-2 text-slate-700"
                >
                    <p><strong>Comanda:</strong> {extractedData.comanda_numero}</p>
                    <p><strong>Cliente:</strong> {extractedData.cliente_nome}</p>
                    <p><strong>Data:</strong> {extractedData.data_atendimento ? new Date(extractedData.data_atendimento).toLocaleDateString('pt-BR') : 'N/A'}</p>
                    <div>
                        <strong>Serviços:</strong>
                        <ul className="list-disc list-inside ml-4">
                            {extractedData.servicos.length > 0 ? 
                                extractedData.servicos.map((s, i) => <li key={i}>{s.item} - R$ {s.valor}</li>) :
                                <li>Nenhum serviço extraído.</li>
                            }
                        </ul>
                    </div>
                    <p className="font-bold"><strong>Total:</strong> R$ {extractedData.valor_total}</p>
                    <Button onClick={handleSave} className="w-full mt-2 bg-red-600 hover:bg-red-700" disabled={isLoading || !supabase}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2" />}
                        Salvar no Histórico
                    </Button>
                </motion.div>
            )}
            </AnimatePresence>
        </motion.div>
    );
};

export default PdfProcessor;