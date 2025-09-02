import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useUserStatus = (currentUser, depiladorasStatus, toast) => {
  const [myCurrentStatus, setMyCurrentStatus] = useState(null);

  useEffect(() => {
    if (currentUser && currentUser.role === 'depiladora') {
      const myStatus = depiladorasStatus[currentUser.id]?.status || 'offline';
      setMyCurrentStatus(myStatus);
    }
  }, [currentUser, depiladorasStatus]);

  const toggleDepiladoraStatus = async (newStatus) => {
    if (!supabase) {
        toast({ title: "❌ Integração Incompleta", description: "A integração do Supabase é necessária para mudar o status.", variant: "destructive" });
        return;
    }
    if (currentUser.role !== 'depiladora' || !currentUser.id) {
        toast({ title: "❌ Erro de Autenticação", description: "Usuário não identificado para mudar o status.", variant: "destructive" });
        return;
    }
    
    setMyCurrentStatus(newStatus);
    const { error } = await supabase
        .from('depiladoras_status')
        .upsert({ 
            id: currentUser.id, 
            name: currentUser.name,
            status: newStatus, 
            last_login: newStatus === 'online' ? new Date().toISOString() : null 
        }, { onConflict: 'id' });

    if (error) {
        toast({ title: "❌ Erro ao atualizar status", variant: 'destructive', description: error.message });
        setMyCurrentStatus(newStatus === 'online' ? 'offline' : 'online'); // revert on error
    } else {
        toast({ 
            title: newStatus === 'online' ? "🟢 Online" : "🔴 Offline", 
            description: newStatus === 'online' ? "Você está na fila para atendimentos." : "Você não receberá novos atendimentos.",
        });
    }
  };

  return { myCurrentStatus, toggleDepiladoraStatus };
};