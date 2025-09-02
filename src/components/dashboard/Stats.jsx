import React from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, Database } from 'lucide-react';

const StatCard = ({ icon, label, value, colorClass, textColor, onClick }) => (
  <motion.div 
    whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
    className={`bg-white rounded-lg p-4 shadow-md border ${colorClass} cursor-pointer`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-sm font-medium ${textColor}`}>{label}</p>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
      </div>
      {icon}
    </div>
  </motion.div>
);

const Stats = ({ pendingCount, completedTodayCount, totalCount, onCardClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
  >
    <StatCard 
      icon={<Bell className="w-8 h-8 text-yellow-500" />} 
      label="Pendentes"
      value={pendingCount} 
      colorClass="border-yellow-200"
      textColor="text-yellow-700"
      onClick={() => onCardClick('pending')}
    />
    <StatCard 
      icon={<CheckCircle className="w-8 h-8 text-green-500" />} 
      label="Concluídos Hoje" 
      value={completedTodayCount} 
      colorClass="border-green-200"
      textColor="text-green-700"
      onClick={() => onCardClick('completedToday')}
    />
     <StatCard 
      icon={<Database className="w-8 h-8 text-blue-500" />} 
      label="Total" 
      value={totalCount} 
      colorClass="border-blue-200"
      textColor="text-blue-700"
      onClick={() => onCardClick('total')}
    />
  </motion.div>
);

export default Stats;