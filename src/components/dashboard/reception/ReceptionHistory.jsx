import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Search, History, ChevronsRight, FileText, Clock, Calendar, WrapText as ClipboardText, Flag, BadgeDollarSign, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, isToday, parseISO, differenceInSeconds, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const ReceptionHistory = ({ orders, depiladoras, initialFilter, onBack, currentUser, onForceFinish }) => {
  const [view, setView] = useState('main'); 
  const [selectedDepiladora, setSelectedDepiladora] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [mainFilter, setMainFilter] = useState(initialFilter);
  const [searchTerm, setSearchTerm] = useState('');
  const [depiladoraHistoryFilter, setDepiladoraHistoryFilter] = useState('day');
  const [isForceFinishConfirmOpen, setIsForceFinishConfirmOpen] = useState(false);
  const [orderToForceFinish, setOrderToForceFinish] = useState(null);

  const sortedDepiladoras = useMemo(() => {
    return [...depiladoras].sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [depiladoras]);

  const filteredOrders = useMemo(() => {
    let results = [];
    if (mainFilter === 'pending') {
      results = orders.filter(o => o.status !== 'completed');
    } else if (mainFilter === 'completedToday') {
      results = orders.filter(o => o.status === 'completed' && o.end_time && isToday(parseISO(o.end_time)));
    } else {
      results = orders;
    }
    return results
      .filter(o => o.client_name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [orders, mainFilter, searchTerm]);

  const depiladoraFilteredHistory = useMemo(() => {
    if (!selectedDepiladora) return [];
    const depiladoraOrders = orders.filter(o => o.depiladora_id === selectedDepiladora.id && o.status === 'completed' && o.end_time);
    if (depiladoraHistoryFilter === 'day') {
      return depiladoraOrders.filter(o => isToday(parseISO(o.end_time)));
    }
    if (depiladoraHistoryFilter === 'month') {
      return depiladoraOrders.filter(o => isThisMonth(parseISO(o.end_time)));
    }
    return depiladoraOrders;
  }, [orders, selectedDepiladora, depiladoraHistoryFilter]);

  const formatDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const durationInSeconds = differenceInSeconds(parseISO(end), parseISO(start));
    if (isNaN(durationInSeconds) || durationInSeconds < 0) return 'N/A';
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = durationInSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} min`;
  };

  const handleForceFinishClick = (order) => {
    setOrderToForceFinish(order);
    setIsForceFinishConfirmOpen(true);
  };

  const handleConfirmForceFinish = async () => {
    if (!orderToForceFinish) return;
    await onForceFinish(orderToForceFinish.id, orderToForceFinish.depiladora_id);
    setIsForceFinishConfirmOpen(false);
    setOrderToForceFinish(null);
    setSelectedOrder(null);
  };

  const renderMainView = () => (
    <>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 capitalize">
          {mainFilter === 'pending' ? 'Atendimentos Pendentes' : mainFilter === 'completedToday' ? 'Concluídos Hoje' : 'Todos Atendimentos'}
        </h1>
      </div>

       <div className="mb-4">
          <label htmlFor="search-client" className="block text-sm font-medium text-slate-700 mb-2">Buscar Atendimento</label>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              id="search-client"
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
       </div>

      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
        {filteredOrders.length > 0 ? filteredOrders.map(order => (
          <motion.div
            key={order.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg cursor-pointer border-l-4 ${order.status === 'completed' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}
            onClick={() => setSelectedOrder(order)}
          >
            <p className={`font-semibold ${order.status === 'completed' ? 'text-green-800' : 'text-red-800'}`}>{order.client_name}</p>
            <p className="text-sm text-slate-600">{order.depiladora_name} - {order.service}</p>
          </motion.div>
        )) : <p className="text-center py-8 text-slate-500">Nenhum atendimento encontrado.</p>}
      </div>
      <div className="mt-6 border-t pt-6">
        <Button onClick={() => setView('depiladoraList')} variant="outline" className="w-full text-lg py-6 border-red-200 text-red-600 hover:bg-red-50">
          <History className="mr-3" /> Histórico por Profissional
        </Button>
      </div>
    </>
  );

  const renderDepiladoraListView = () => (
    <>
      <div className="flex items-center mb-4">
        <Button onClick={() => setView('main')} variant="ghost" className="text-slate-600 mr-4"><ArrowLeft /></Button>
        <h1 className="text-2xl font-bold text-slate-800">Histórico por Profissional</h1>
      </div>
      <div className="space-y-3">
        {sortedDepiladoras.map(depiladora => (
          <motion.div
            key={depiladora.id}
            layout
            className="flex items-center justify-between p-4 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200"
            onClick={() => { setSelectedDepiladora(depiladora); setView('depiladoraHistory'); }}
          >
            <p className="font-semibold text-slate-800">{depiladora.full_name}</p>
            <ChevronsRight className="text-red-500"/>
          </motion.div>
        ))}
      </div>
    </>
  );
  
  const renderDepiladoraHistoryView = () => (
    <>
      <div className="flex items-center mb-4">
        <Button onClick={() => setView('depiladoraList')} variant="ghost" className="text-slate-600 mr-4"><ArrowLeft /></Button>
        <h1 className="text-2xl font-bold text-slate-800">Atendimentos de {selectedDepiladora?.full_name}</h1>
      </div>
       <div className="flex items-center gap-2 mb-4">
          <Button onClick={() => setDepiladoraHistoryFilter('day')} variant={depiladoraHistoryFilter === 'day' ? 'secondary' : 'ghost'} className={depiladoraHistoryFilter === 'day' ? 'bg-red-600 text-white' : ''}>Dia</Button>
          <Button onClick={() => setDepiladoraHistoryFilter('month')} variant={depiladoraHistoryFilter === 'month' ? 'secondary' : 'ghost'} className={depiladoraHistoryFilter === 'month' ? 'bg-red-600 text-white' : ''}>Mês</Button>
       </div>
       <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {depiladoraFilteredHistory.length > 0 ? depiladoraFilteredHistory.map(order => (
            <div key={order.id} className="p-4 rounded-lg bg-green-50 border-l-4 border-green-500">
                <p className="font-semibold text-green-800">{order.client_name}</p>
                <p className="text-sm text-slate-600">{order.service}</p>
                {order.end_time && <p className="text-xs text-slate-500 mt-1">{format(parseISO(order.end_time), 'PPPp', { locale: ptBR })}</p>}
            </div>
        )) : <p className="text-center py-8 text-slate-500">Nenhum atendimento encontrado para este período.</p>}
       </div>
    </>
  );


  return (
    <>
      <Helmet>
        <title>Histórico da Recepção</title>
        <meta name="description" content="Visualize e gerencie todos os atendimentos." />
      </Helmet>
      <div className="min-h-screen p-4 md:p-8 bg-gray-50">
        <Button onClick={onBack} variant="ghost" className="text-slate-600 hover:bg-red-50 mb-4">
          <ArrowLeft className="mr-2" /> Voltar ao Dashboard
        </Button>
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-200"
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.2 }}
                >
                    {view === 'main' && renderMainView()}
                    {view === 'depiladoraList' && renderDepiladoraListView()}
                    {view === 'depiladoraHistory' && renderDepiladoraHistoryView()}
                </motion.div>
            </AnimatePresence>
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
                <p className="flex items-center"><FileText className="w-5 h-5 mr-3 text-red-500" /> <strong>Código do Cliente:</strong> {selectedOrder.order_number}</p>
                <p className="flex items-center"><Calendar className="w-5 h-5 mr-3 text-red-500" /> <strong>Data:</strong> {selectedOrder.attendance_date}</p>
                <p className="flex items-center"><User className="w-5 h-5 mr-3 text-red-500" /> <strong>Cliente:</strong> {selectedOrder.client_name}</p>
                <p className="flex items-center"><ClipboardText className="w-5 h-5 mr-3 text-red-500" /> <strong>Item:</strong> {selectedOrder.service}</p>
                <p className="flex items-center"><UserCheck className="w-5 h-5 mr-3 text-red-500" /> <strong>Profissional:</strong> {selectedOrder.depiladora_name}</p>
                {selectedOrder.total_value && <p className="flex items-center"><BadgeDollarSign className="w-5 h-5 mr-3 text-red-500" /> <strong>Valor Total da Comanda:</strong> R$ {Number(selectedOrder.total_value).toFixed(2)}</p>}
                
                <div className="pt-2">
                  <h3 className="flex items-center font-semibold mb-2"><FileText className="w-5 h-5 mr-3 text-red-500"/> Observações</h3>
                  <p className="text-sm bg-slate-100 p-3 rounded-md min-h-[60px] whitespace-pre-wrap border">{selectedOrder.observations || 'Nenhuma observação registrada.'}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-6">
                <Button onClick={() => setSelectedOrder(null)} variant="outline" className="w-full">Fechar</Button>
                {currentUser.role === 'recepcao' && selectedOrder.status !== 'completed' && (
                  <Button onClick={() => handleForceFinishClick(selectedOrder)} className="w-full bg-green-600 hover:bg-green-700">
                    <Flag className="mr-2" /> Finalizar Atendimento
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AlertDialog open={isForceFinishConfirmOpen} onOpenChange={setIsForceFinishConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar Atendimento Manualmente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação marcará o atendimento como concluído e liberará o profissional. Use em casos onde o atendimento não foi finalizado corretamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsForceFinishConfirmOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmForceFinish}>Sim, Finalizar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ReceptionHistory;