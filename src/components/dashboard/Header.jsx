import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, History, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = ({ currentUser, onLogout, onViewHistory, onViewAttendanceHistory }) => (
  <motion.header
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl p-4 mb-6 shadow-md border border-gray-200"
  >
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center space-x-4">
        <img src="https://storage.googleapis.com/hostinger-horizons-assets-prod/f2177655-6c43-40d3-891d-9ff6f60fa816/a342e8069d452785e953f9867a4e92bb.png" alt="Logotipo" className="w-12 h-12 rounded-full" />
        <div>
          <h1 className="text-xl font-bold text-slate-800">Olá, {currentUser.name}!</h1>
          <p className="text-slate-500 capitalize">{currentUser.role} Dashboard</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {currentUser.role === 'depiladora' && (
          <Button
            onClick={onViewHistory}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <History className="w-4 h-4 mr-2" />
            Meu Histórico
          </Button>
        )}
        {currentUser.role === 'recepcao' && (
            <Button
              onClick={onViewAttendanceHistory}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Histórico de Atendimentos
            </Button>
        )}
        <Button
          onClick={onLogout}
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  </motion.header>
);

export default Header;