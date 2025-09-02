import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Clock, User, Play, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';

const icons = {
  pending: <Bell className="w-5 h-5 mr-2 text-yellow-600" />,
};

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center py-8 text-slate-400"
  >
    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
    <p>Nenhuma comanda na fila</p>
  </motion.div>
);

const OrderCard = ({ order, onStartAttendance, playNotification }) => {
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef(null);
  const hasPlayed = useRef(false);

  useEffect(() => {
    if (!hasPlayed.current) {
        if (playNotification) playNotification();
        hasPlayed.current = true;
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [playNotification]);
  
  const handleAccept = () => {
    clearInterval(timerRef.current);
    onStartAttendance(order.id);
  };
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.9 }}
      transition={{ duration: 0.4, type: 'spring' }}
      className="rounded-lg p-4 bg-yellow-50 border border-yellow-200 relative overflow-hidden shadow-lg"
    >
      <motion.div 
        className="absolute inset-0 border-2 border-red-500 rounded-lg pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0, 1, 0] }}
        transition={{ duration: 1, repeat: 2 }}
      />
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800 text-lg">{order.client_name}</h3>
          <p className="text-yellow-700 font-medium">{order.service}</p>
          {order.details && <p className="text-slate-600 text-sm mt-1">{order.details}</p>}
           
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-slate-500 text-sm mt-2 gap-2">
              <span className="flex items-center"><User className="w-4 h-4 mr-2" />{order.depiladora_name}</span>
              <span className="flex items-center"><Clock className="w-4 h-4 mr-2" />{format(parseISO(order.created_at), "HH:mm")}</span>
          </div>
        </div>
        <div className="flex flex-col items-center ml-4">
            <Button
              onClick={handleAccept}
              className="bg-red-600 hover:bg-red-700 text-white ml-4 shrink-0"
            >
              <Play className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Iniciar</span>
            </Button>
            <div className="flex items-center text-sm text-red-600 font-semibold mt-2">
                <Timer className="w-4 h-4 mr-1 animate-pulse" />
                <span>{timeLeft}s</span>
            </div>
        </div>
      </div>
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1.5 bg-red-400"
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 15, ease: "linear" }}
      />
    </motion.div>
  );
};


const OrderList = ({ title, orders, onStartAttendance, playNotification }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-md border border-gray-200"
      >
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          {icons.pending}
          {title} ({orders.length})
        </h2>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <AnimatePresence>
            {orders.length === 0 ? (
              <EmptyState />
            ) : (
              orders.map((order) => (
                <OrderCard 
                    key={order.id} 
                    order={order} 
                    onStartAttendance={onStartAttendance}
                    playNotification={playNotification}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
};

export default OrderList;