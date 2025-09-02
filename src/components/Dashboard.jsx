import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';

import { useToast } from '@/components/ui/use-toast';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { useUserStatus } from '@/hooks/useUserStatus';
import { useOrderManagement } from '@/hooks/useOrderManagement';

import Header from '@/components/dashboard/Header';
import FileProcessor from '@/components/dashboard/FileProcessor';
import DepiladoraStatus from '@/components/dashboard/DepiladoraStatus';
import OrderList from '@/components/dashboard/OrderList';
import Stats from '@/components/dashboard/Stats';
import AttendanceScreen from '@/components/dashboard/AttendanceScreen';
import HistoryView from '@/components/dashboard/HistoryView';
import ReceptionHistory from '@/components/dashboard/reception/ReceptionHistory';
import AttendanceHistory from '@/components/dashboard/reception/AttendanceHistory';
import AudioUnlocker from '@/components/dashboard/AudioUnlocker';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { isToday, parseISO } from 'date-fns';

const Dashboard = ({ currentUser, onLogout }) => {
  const { toast } = useToast();
  
  const [view, setView] = useState('main');
  const [receptionHistoryFilter, setReceptionHistoryFilter] = useState('total');
  const [preferentialTarget, setPreferentialTarget] = useState(null);
  
  const [showAudioPrompt, setShowAudioPrompt] = useState(false);

  const {
    orders,
    depiladoras,
    depiladorasStatus,
    queue,
    playNotification,
    fetchInitialData
  } = useSupabaseRealtime(currentUser);

  const {
    myCurrentStatus,
    toggleDepiladoraStatus
  } = useUserStatus(currentUser, depiladorasStatus, toast);

  const {
    activeAttendanceId,
    processAndAssignOrder,
    startAttendance,
    updateObservation,
    finishAttendance,
    forceFinishAttendance,
    setActiveAttendanceId
  } = useOrderManagement({
      currentUser,
      depiladoras,
      queue,
      toast
  });

  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);
  const [orderToFinish, setOrderToFinish] = useState(null);
  
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (currentUser.role === 'depiladora') {
      const audioUnlocked = localStorage.getItem('audioUnlocked');
      if (audioUnlocked !== 'true') {
        setShowAudioPrompt(true);
      }
    }
  }, [currentUser.role]);

  const handleAudioUnlock = () => {
    if (playNotification()) {
        localStorage.setItem('audioUnlocked', 'true');
        setShowAudioPrompt(false);
        toast({
          title: "🔊 Sons Ativados!",
          description: "Você ouvirá um alerta para novos atendimentos.",
        });
    } else {
        toast({
          title: "❌ Erro de Áudio",
          description: "Não foi possível ativar os sons. Verifique as permissões do seu navegador.",
          variant: "destructive",
        });
    }
  };

  const handleFinishConfirmation = (orderId) => {
    setOrderToFinish(orderId);
    setIsFinishConfirmOpen(true);
  };
  
  const handleConfirmFinish = async () => {
    if (!orderToFinish) return;
    await finishAttendance(orderToFinish);
    setOrderToFinish(null);
    setIsFinishConfirmOpen(false);
  };

  const handleViewReceptionHistory = (filter) => {
    setReceptionHistoryFilter(filter);
    setView('receptionHistory');
  };

  const handleSetPreferential = (depiladora) => {
    setPreferentialTarget(depiladora);
    setView('preferentialFileProcessor');
  };

  const myPendingOrders = orders.filter(o => o.depiladora_id === currentUser.id && o.status === 'pending');
  const myCompletedOrders = orders.filter(o => o.depiladora_id === currentUser.id && o.status === 'completed');
  const activeOrder = orders.find(o => o.id === activeAttendanceId);
  
  const pendingCount = orders.filter(o => o.status !== 'completed').length;
  const completedTodayCount = orders.filter(o => o.status === 'completed' && o.end_time && isToday(parseISO(o.end_time))).length;
  const totalCount = orders.length;

  const MainReceptionView = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-1 flex flex-col gap-6">
        <FileProcessor onProcessFile={(data) => processAndAssignOrder(data)} />
      </div>
      <div className="xl:col-span-2">
        <DepiladoraStatus
          depiladoras={depiladoras}
          statuses={depiladorasStatus}
          onSetPreferential={handleSetPreferential}
        />
        <div className="mt-6">
          <Stats
            pendingCount={pendingCount}
            completedTodayCount={completedTodayCount}
            totalCount={totalCount}
            onCardClick={handleViewReceptionHistory}
          />
        </div>
      </div>
    </div>
  );
  
  const DepiladoraView = () => (
    <>
      {myCurrentStatus !== 'em-atendimento' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-lg shadow-md mb-6"
        >
          <div className="flex items-center justify-center gap-4">
            <p className="font-semibold text-slate-700">Seu status:</p>
            <AnimatePresence mode="wait">
              <motion.div
                key={myCurrentStatus}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                {myCurrentStatus === 'online' ? (
                  <button onClick={() => toggleDepiladoraStatus('offline')} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">Ficar Offline</button>
                ) : (
                  <button onClick={() => toggleDepiladoraStatus('online')} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">Ficar Online</button>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
      <OrderList
        title="Minhas Comandas Pendentes"
        orders={myPendingOrders}
        onStartAttendance={startAttendance}
        playNotification={playNotification}
      />
    </>
  );

  const renderContent = () => {
    if (activeAttendanceId && activeOrder) {
      return <AttendanceScreen
        order={activeOrder}
        onFinish={handleFinishConfirmation}
        onUpdateObservation={updateObservation}
      />;
    }

    switch (view) {
      case 'depiladoraHistory':
        return <HistoryView orders={myCompletedOrders} onBack={() => setView('main')} />;
      case 'receptionHistory':
        return <ReceptionHistory
          orders={orders}
          depiladoras={depiladoras}
          initialFilter={receptionHistoryFilter}
          onBack={() => setView('main')}
          currentUser={currentUser}
          onForceFinish={forceFinishAttendance}
        />;
      case 'attendanceHistory':
        return <AttendanceHistory onBack={() => setView('main')} />;
      case 'preferentialFileProcessor':
        if (preferentialTarget) {
          return (
            <div className="min-h-screen p-4 bg-gray-50">
              <Header currentUser={currentUser} onLogout={onLogout} />
              <FileProcessor
                onProcessFile={(content) => processAndAssignOrder(content, preferentialTarget.id)}
                onBack={() => { setPreferentialTarget(null); setView('main'); }}
                preferentialTargetName={preferentialTarget.full_name}
              />
            </div>
          );
        }
        setView('main'); // Fallback if target is lost
        return null;
      case 'main':
      default:
        return currentUser.role === 'recepcao' ? <MainReceptionView /> : <DepiladoraView />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - {currentUser.name}</title>
        <meta name="description" content={`Dashboard para ${currentUser.role}`} />
      </Helmet>
      <AudioUnlocker show={showAudioPrompt} onUnlock={handleAudioUnlock} />
      <div className="min-h-screen p-4 bg-gray-50">
        {!activeAttendanceId && (
          <Header
            currentUser={currentUser}
            onLogout={onLogout}
            onViewHistory={() => setView('depiladoraHistory')}
            onViewAttendanceHistory={() => setView('attendanceHistory')}
          />
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      <AlertDialog open={isFinishConfirmOpen} onOpenChange={setIsFinishConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você concluiu o atendimento e anotou todas as observações necessárias?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação finalizará o atendimento. Você será colocado de volta na fila de atendimento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOrderToFinish(null)}>Retornar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmFinish}>Concluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Dashboard;