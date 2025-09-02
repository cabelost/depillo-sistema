import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, Coffee, Send } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const DepiladoraStatus = ({ depiladoras, statuses, onSetPreferential }) => {
    
    const getStatus = (depiladoraId) => statuses[depiladoraId]?.status || 'offline';
    
    const onlineDepiladoras = depiladoras
        .filter(d => getStatus(d.id) === 'online')
        .sort((a, b) => new Date(statuses[a.id]?.last_login) - new Date(statuses[b.id]?.last_login));

    const inServiceDepiladoras = depiladoras.filter(d => getStatus(d.id) === 'em-atendimento');

    const offlineDepiladoras = depiladoras.filter(d => {
        const status = getStatus(d.id);
        return status === 'offline' || status === undefined;
    });

    const DepiladoraItem = ({ depiladora, index, isOnline }) => (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-slate-100 p-3 rounded-lg flex items-center justify-between border"
        >
            <span className="font-medium text-slate-700">{isOnline ? `${index + 1}. ${depiladora.full_name}`: depiladora.full_name}</span>
            {isOnline && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="px-2 py-1 h-auto">...</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                        <Button 
                            variant="ghost" 
                            className="w-full justify-start"
                            onClick={() => onSetPreferential(depiladora)}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Direcionar Atendimento
                        </Button>
                    </PopoverContent>
                </Popover>
            )}
        </motion.div>
    );

    const renderList = (title, list, color, icon, isOnlineList = false) => (
        <div className="flex-1 min-w-[200px]">
            <h3 className={`text-lg font-semibold text-slate-800 mb-3 border-l-4 pl-3 flex items-center ${color}`}>
                {icon} {title} <span className="text-base font-normal text-slate-500 ml-2">({list.length})</span>
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {list.length > 0 ? list.map((depiladora, index) => (
                    <DepiladoraItem 
                        key={depiladora.id}
                        depiladora={depiladora}
                        index={index}
                        isOnline={isOnlineList}
                    />
                )) : <p className="text-slate-400 text-sm p-3">Nenhuma depiladora.</p>}
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-200"
        >
            <h2 className="text-xl font-bold text-slate-800 mb-4">Status da Equipe</h2>
            <div className="flex flex-col md:flex-row gap-6 flex-wrap">
                {renderList("Fila de Atendimento", onlineDepiladoras, "border-green-500", <Users className="mr-2 text-green-500"/>, true)}
                {renderList("Em Atendimento", inServiceDepiladoras, "border-yellow-500", <UserCheck className="mr-2 text-yellow-500"/>)}
                {renderList("Offline", offlineDepiladoras, "border-red-500", <Coffee className="mr-2 text-red-500"/>)}
            </div>
        </motion.div>
    );
};

export default DepiladoraStatus;