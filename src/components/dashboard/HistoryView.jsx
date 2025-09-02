import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isThisWeek, isThisMonth, isToday, parseISO, differenceInSeconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User, Clock, WrapText as ClipboardText, FileText, BadgeDollarSign } from 'lucide-react';

const HistoryView = ({ orders, onBack }) => {
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const formatDuration = (start, end) => {
    if (!start || !end) return '00:00';
    const durationInSeconds = differenceInSeconds(parseISO(end), parseISO(start));
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = durationInSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const filteredOrders = useMemo(() => {
    const sorted = [...orders].sort((a, b) => new Date(b.end_time) - new Date(a.end_time));
    if (filter === 'today') {
      return sorted.filter(o => o.end_time && isToday(parseISO(o.end_time)));
    }
    if (filter === 'week') {
      return sorted.filter(o => o.end_time && isThisWeek(parseISO(o.end_time), { locale: ptBR }));
    }
    if (filter === 'month') {
      return sorted.filter(o => o.end_time && isThisMonth(parseISO(o.end_time), { locale: ptBR }));
    }
    return sorted;
  }, [orders, filter]);

  const FilterButton = ({ value, label }) => (
    <Button 
      onClick={() => setFilter(value)}
      variant={filter === value ? "secondary" : "ghost"}
      className={filter === value ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-red-50'}
    >
      {label}
    </Button>
  );

  return (
    <>
      <Helmet>
        <title>Histórico de Atendimentos</title>
        <meta name="description" content="Visualize seus atendimentos finalizados." />
      </Helmet>
      <div className="min-h-screen p-4 md:p-8 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
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
          <div className="flex items-center gap-2 mb-4">
            <FilterButton value="all" label="Todos" />
            <FilterButton value="today" label="Hoje" />
            <FilterButton value="week" label="Esta Semana" />
            <FilterButton value="month"label="Este Mês" />
          </div>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <AnimatePresence>
              {filteredOrders.length > 0 ? filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-50 p-4 rounded-lg cursor-pointer hover:bg-slate-100 border"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-800">{order.client_name}</p>
                      <p className="text-sm text-red-600">{order.service}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">{order.depiladora_name || 'N/A'}</p>
                      {order.end_time && <p className="text-xs text-slate-400">{format(parseISO(order.end_time), 'dd/MM/yy HH:mm')}</p>}
                    </div>
                  </div>
                </motion.div>
              )) : (
                <p className="text-center text-slate-500 py-8">Nenhum atendimento encontrado para este período.</p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
      
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl border"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Detalhes do Atendimento</h2>
              <div className="space-y-3 text-slate-700">
                {selectedOrder.order_number && <p className="flex items-center"><FileText className="w-5 h-5 mr-3 text-red-500" /> <strong>Nº Comanda:</strong> {selectedOrder.order_number}</p>}
                <p className="flex items-center"><User className="w-5 h-5 mr-3 text-red-500" /> <strong>Cliente:</strong> {selectedOrder.client_name}</p>
                <p className="flex items-center"><User className="w-5 h-5 mr-3 text-slate-500" /> <strong>Depiladora:</strong> {selectedOrder.depiladora_name}</p>
                <p className="flex items-center"><ClipboardText className="w-5 h-5 mr-3 text-red-500" /> <strong>Serviço:</strong> {selectedOrder.service}</p>
                {selectedOrder.total_value && <p className="flex items-center"><BadgeDollarSign className="w-5 h-5 mr-3 text-red-500" /> <strong>Valor Total:</strong> R$ {Number(selectedOrder.total_value).toFixed(2)}</p>}
                {selectedOrder.end_time && <p className="flex items-center"><Calendar className="w-5 h-5 mr-3 text-red-500" /> <strong>Data:</strong> {format(parseISO(selectedOrder.end_time), 'PPP', { locale: ptBR })}</p>}
                <p className="flex items-center"><Clock className="w-5 h-5 mr-3 text-red-500" /> <strong>Duração:</strong> {formatDuration(selectedOrder.start_time, selectedOrder.end_time)} min</p>
                <div className="pt-2">
                  <h3 className="flex items-center font-semibold mb-2"><FileText className="w-5 h-5 mr-3 text-red-500"/> Observações</h3>
                  <p className="text-sm bg-slate-100 p-3 rounded-md min-h-[60px] whitespace-pre-wrap border">{selectedOrder.observations || 'Nenhuma observação registrada.'}</p>
                </div>
              </div>
              <Button onClick={() => setSelectedOrder(null)} className="w-full mt-6 bg-slate-700 hover:bg-slate-800">Fechar</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HistoryView;