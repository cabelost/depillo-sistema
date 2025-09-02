import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const PublicQueue = ({ onLogout }) => {
  const [depiladorasStatus, setDepiladorasStatus] = useState([]);
  const [attending, setAttending] = useState(null);

  const fetchData = useCallback(async () => {
    const { data, error } = await supabase
      .from('depiladoras_status')
      .select('id, name, status, last_login')
      .in('status', ['online', 'em-atendimento'])
      .order('last_login', { ascending: true });

    if (error) {
      console.error("Error fetching statuses:", error);
      return;
    }

    const onlineQueue = data.filter(d => d.status === 'online');
    const inAttendance = data.find(d => d.status === 'em-atendimento');
    
    setDepiladorasStatus(onlineQueue);

    if (inAttendance) {
      if (attending?.id !== inAttendance.id) {
        setAttending(inAttendance);
      }
    } else {
        setAttending(null);
    }
  }, [attending]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('public:depiladoras_status_public_queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'depiladoras_status' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const blinkingAnimation = {
    scale: [1, 1.05, 1],
    color: ["#DC2626", "#EF4444", "#DC2626"],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <>
      <Helmet>
        <title>Fila de Atendimento</title>
        <meta name="description" content="Visualização pública da fila de atendimento." />
      </Helmet>
      <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 flex flex-col items-center justify-center relative">
        <Button onClick={onLogout} variant="ghost" className="absolute top-4 right-4 text-gray-400 hover:bg-gray-700 hover:text-white">
            <LogOut className="w-5 h-5 mr-2" />
            Sair
        </Button>
        <img src="https://storage.googleapis.com/hostinger-horizons-assets-prod/f2177655-6c43-40d3-891d-9ff6f60fa816/a342e8069d452785e953f9867a4e92bb.png" alt="Logotipo" className="w-24 h-24 rounded-full mb-8" />
        
        <div className="w-full max-w-2xl">
          <AnimatePresence>
            {attending && (
              <motion.div
                key={attending.id}
                initial={{ opacity: 0, y: -50, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 100 }}
                className="text-center mb-8 p-6 bg-white rounded-lg shadow-2xl"
              >
                <h2 className="text-3xl font-bold text-gray-800 tracking-wider">ATENDIMENTO</h2>
                <motion.p 
                  className="text-5xl font-extrabold mt-2"
                  animate={blinkingAnimation}
                >
                  {attending.name.toUpperCase()}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-gray-800 rounded-lg p-6 shadow-inner w-full">
            <h2 className="text-2xl font-bold text-center mb-6 text-red-400 tracking-widest">FILA DE ESPERA</h2>
            <div className="space-y-4">
              <AnimatePresence>
                {depiladorasStatus.slice(0, 10).map((depiladora, index) => (
                  <motion.div
                    key={depiladora.id}
                    layout
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ type: 'spring', stiffness: 120, delay: index * 0.1 }}
                    className="flex items-center bg-gray-700 p-4 rounded-md shadow-md"
                  >
                    <span className="text-3xl font-bold text-red-400 mr-6">{String(index + 1).padStart(2, '0')}</span>
                    <span className="text-3xl font-medium tracking-wide">{depiladora.name}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {depiladorasStatus.length === 0 && !attending && (
                 <p className="text-center text-gray-400 py-8 text-xl">Nenhuma depiladora na fila.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PublicQueue;