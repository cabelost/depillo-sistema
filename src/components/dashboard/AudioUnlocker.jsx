import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';

const AudioUnlocker = ({ show, onUnlock }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 150 }}
            className="bg-white rounded-2xl p-8 text-center shadow-xl max-w-sm w-full"
          >
            <Volume2 className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Ativar Notificações Sonoras</h2>
            <p className="text-slate-600 mb-6">
              Para garantir que você não perca nenhum atendimento, precisamos da sua permissão para tocar sons de alerta.
            </p>
            <Button onClick={onUnlock} size="lg" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3">
              Ativar Sons
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AudioUnlocker;