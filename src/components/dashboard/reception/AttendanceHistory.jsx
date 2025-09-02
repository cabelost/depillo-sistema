import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, User, Calendar, FileText, BadgeDollarSign, MoreHorizontal, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AttendanceHistory = ({ onBack }) => {
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAttendance, setSelectedAttendance] = useState(null);
    const { toast } = useToast();

    const fetchAttendances = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('atendimentos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching attendances:', error);
            toast({ title: 'Erro ao buscar histórico', description: error.message, variant: 'destructive' });
        } else {
            setAttendances(data);
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchAttendances();
        
        const channel = supabase.channel('public:atendimentos')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'atendimentos' }, fetchAttendances)
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };

    }, [fetchAttendances]);

    const filteredAttendances = useMemo(() => {
        return attendances.filter(att => 
            att.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            att.comanda_numero.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [attendances, searchTerm]);
    
    return (
        <>
            <Helmet>
                <title>Histórico de Atendimentos</title>
                <meta name="description" content="Visualize todos os atendimentos processados." />
            </Helmet>
            <div className="min-h-screen p-4 md:p-8 bg-gray-50">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between mb-6 flex-wrap gap-4"
                >
                    <Button onClick={onBack} variant="ghost" className="text-slate-600 hover:bg-red-50">
                        <ArrowLeft className="mr-2" /> Voltar ao Dashboard
                    </Button>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Histórico de Atendimentos</h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-md border border-gray-200"
                >
                    <div className="relative mb-4 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input 
                            placeholder="Buscar por cliente ou nº da comanda..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    
                    <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
                        {loading ? (
                            <p className="text-center text-slate-500 py-8">Carregando...</p>
                        ) : filteredAttendances.length > 0 ? (
                            filteredAttendances.map(att => (
                                <motion.div
                                    key={att.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-lg bg-slate-50 border-l-4 border-red-400 flex items-center justify-between"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-800">{att.cliente_nome}</p>
                                        <p className="text-sm text-slate-600">Comanda: {att.comanda_numero}</p>
                                        <p className="text-xs text-slate-400">{format(new Date(att.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedAttendance(att)}>
                                        <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                </motion.div>
                            ))
                        ) : (
                            <p className="text-center text-slate-500 py-8">Nenhum atendimento encontrado.</p>
                        )}
                    </div>
                </motion.div>
            </div>
            
            <AnimatePresence>
              {selectedAttendance && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                  onClick={() => setSelectedAttendance(null)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl border"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Detalhes da Comanda</h2>
                    <div className="space-y-3 text-slate-700">
                      <p className="flex items-center"><FileText className="w-5 h-5 mr-3 text-red-500" /> <strong>Comanda:</strong> {selectedAttendance.comanda_numero}</p>
                      <p className="flex items-center"><User className="w-5 h-5 mr-3 text-red-500" /> <strong>Cliente:</strong> {selectedAttendance.cliente_nome}</p>
                      {selectedAttendance.cliente_cpf && <p className="flex items-center"><User className="w-5 h-5 mr-3 text-red-500" /> <strong>CPF:</strong> {selectedAttendance.cliente_cpf}</p>}
                      <p className="flex items-center"><Calendar className="w-5 h-5 mr-3 text-red-500" /> <strong>Data:</strong> {format(new Date(selectedAttendance.data_atendimento), 'PPP', { locale: ptBR })}</p>
                      <div className="pt-2">
                        <h3 className="font-semibold mb-2">Serviços</h3>
                        <ul className="list-disc list-inside bg-slate-100 p-3 rounded-md">
                            {selectedAttendance.servicos?.map((serv, index) => (
                                <li key={index}>{serv.item} - R$ {serv.valor}</li>
                            ))}
                        </ul>
                      </div>
                      <p className="flex items-center text-lg font-bold"><BadgeDollarSign className="w-6 h-6 mr-3 text-green-500" /> <strong>Total:</strong> R$ {selectedAttendance.valor_total}</p>
                    </div>
                    <Button onClick={() => setSelectedAttendance(null)} className="w-full mt-6 bg-slate-700 hover:bg-slate-800">Fechar</Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
        </>
    );
};

export default AttendanceHistory;