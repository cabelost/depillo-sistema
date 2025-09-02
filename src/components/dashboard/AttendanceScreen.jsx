import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { format, differenceInSeconds, isValid, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Clock, User, Clipboard, Flag, Zap } from 'lucide-react';

const AttendanceScreen = ({ order, onFinish, onUpdateObservation }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [observations, setObservations] = useState(order.observations || '');

  const startTime = order.start_time ? parseISO(order.start_time) : null;

  useEffect(() => {
    if (startTime && isValid(startTime)) {
      const timer = setInterval(() => {
        setElapsedTime(differenceInSeconds(new Date(), startTime));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [startTime]);

  const formatTime = (totalSeconds) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleSaveObservation = () => {
    onUpdateObservation(order.id, observations);
  };

  return (
    <>
      <Helmet>
        <title>Em Atendimento - {order.client_name}</title>
        <meta name="description" content={`Atendimento em progresso para ${order.client_name}`} />
      </Helmet>
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl bg-white rounded-2xl p-8 shadow-xl border border-gray-200"
        >
          <div className="text-center mb-6">
            <Zap className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
            <h1 className="text-3xl font-bold text-slate-800">Atendimento em Progresso</h1>
            <p className="text-slate-500">
              {startTime && isValid(startTime) 
                ? `Iniciado em: ${format(startTime, "HH:mm 'de' dd/MM/yyyy")}`
                : 'Aguardando início...'
              }
            </p>
          </div>

          <div className="bg-slate-100 p-6 rounded-xl mb-6 text-center">
            <p className="text-lg text-slate-600 mb-2">Tempo Decorrido</p>
            <p className="text-6xl font-bold text-red-600 tracking-wider">{formatTime(elapsedTime)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-50 p-6 rounded-xl border">
              <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center"><User className="mr-2 text-red-500" /> Cliente</h2>
              <p className="text-2xl text-slate-800">{order.client_name}</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border">
              <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center"><Clipboard className="mr-2 text-red-500" /> Serviço</h2>
              <p className="text-lg text-slate-800">{order.service}</p>
              {order.details && <p className="text-sm text-slate-500 mt-1">{order.details}</p>}
            </div>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-xl mb-8 border">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">Observações do Atendimento</h2>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              onBlur={handleSaveObservation}
              placeholder="Digite suas observações aqui..."
              className="w-full h-24 p-3 bg-white border border-gray-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-slate-400 mt-2">As observações são salvas automaticamente ao sair do campo de texto.</p>
          </div>

          <div className="text-center">
            <Button onClick={() => onFinish(order.id)} size="lg" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-10 rounded-lg text-lg">
              <Flag className="mr-3" /> Finalizar Atendimento
            </Button>
          </div>

        </motion.div>
      </div>
    </>
  );
};

export default AttendanceScreen;