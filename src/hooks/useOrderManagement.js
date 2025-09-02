
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const useOrderManagement = ({ currentUser, depiladoras, queue, toast }) => {
  const [activeAttendanceId, setActiveAttendanceId] = useState(() => JSON.parse(sessionStorage.getItem('activeAttendanceId')) || null);

  useEffect(() => {
    sessionStorage.setItem('activeAttendanceId', JSON.stringify(activeAttendanceId));
  }, [activeAttendanceId]);

  const processAndAssignOrder = async (orderData, targetDepiladoraId = null) => {
    if (!supabase) {
        toast({ title: "❌ Integração Incompleta", description: "A integração do Supabase é necessária para criar atendimentos.", variant: "destructive" });
        return;
    }
    const { clientName, service, details, orderNumber, totalValue, attendanceDate } = orderData;
    let depiladora;

    if (targetDepiladoraId) {
      depiladora = depiladoras.find(d => d.id === targetDepiladoraId);
      if (!depiladora) {
        toast({ title: "❌ Profissional não encontrada", description: "A profissional selecionada para atendimento preferencial não foi encontrada.", variant: "destructive" });
        return;
      }
    } else {
      if (queue.length === 0) {
        toast({ title: "⚠️ Nenhuma profissional disponível", description: "Não há profissionais na fila de atendimento. O atendimento não pode ser criado.", variant: "destructive" });
        return;
      }
      const depiladoraId = queue[0];
      depiladora = depiladoras.find(d => d.id === depiladoraId);
    }
    
    if (!depiladora) {
        toast({ title: "❌ Erro Crítico", description: "Não foi possível encontrar uma profissional para atribuir. O atendimento não foi criado.", variant: "destructive" });
        return;
    }

    if (clientName && service) {
        const { data: newOrder, error: orderError } = await supabase.from('orders').insert({
            client_name: clientName,
            service,
            details: details || '',
            order_number: orderNumber,
            total_value: totalValue,
            attendance_date: attendanceDate,
            depiladora_id: depiladora.id,
            depiladora_name: depiladora.full_name,
            status: 'pending',
        }).select().single();

        if (orderError) {
             toast({ title: "❌ Erro ao criar comanda", variant: "destructive", description: orderError.message });
             return;
        }
        
        const { error: statusError } = await supabase.from('depiladoras_status').update({ status: 'em-atendimento' }).eq('id', depiladora.id);
        if (statusError) {
            toast({ title: "❌ Erro ao atualizar status", variant: "destructive", description: statusError.message });
            return;
        }

        const { error: scheduleError } = await supabase.rpc('schedule_reassign', { order_id_param: newOrder.id });
        if (scheduleError) {
            console.error('Error scheduling timeout:', scheduleError);
        }

        toast({ title: "🚀 Comanda enviada!", description: `Comanda para ${clientName} foi enviada para ${depiladora.full_name}.` });
    } else {
      toast({ title: "❌ Erro ao processar", description: "Dados da comanda incompletos.", variant: "destructive" });
    }
  };

  const startAttendance = async (orderId) => {
    if (!supabase) return;
    const { error } = await supabase.from('orders').update({ status: 'in-progress', start_time: new Date().toISOString() }).eq('id', orderId);
    if (error) {
        toast({ title: "❌ Erro ao iniciar", variant: "destructive", description: error.message });
    } else {
        setActiveAttendanceId(orderId);
    }
  };

  const updateObservation = async (orderId, text) => {
    if (!supabase) return;
    await supabase.from('orders').update({ observations: text }).eq('id', orderId);
  };

  const finishAttendance = async (orderId) => {
    if (!supabase) return;
    if (!currentUser || !currentUser.id) {
        toast({ title: "❌ Erro de Autenticação", description: "Não foi possível identificar o usuário para finalizar o atendimento.", variant: "destructive" });
        return;
    }

    const { error: orderError } = await supabase.from('orders').update({ status: 'completed', end_time: new Date().toISOString() }).eq('id', orderId);
    if (orderError) {
      toast({ title: "❌ Erro ao finalizar", variant: "destructive", description: orderError.message });
      return;
    }

    const { error: statusError } = await supabase.from('depiladoras_status').update({ status: 'online', last_login: new Date().toISOString() }).eq('id', currentUser.id);
    if (statusError) {
      toast({ title: "❌ Erro ao atualizar status", variant: "destructive", description: statusError.message });
      return;
    }
    
    setActiveAttendanceId(null);
    toast({ title: "✅ Atendimento Finalizado!", description: "Você está disponível novamente." });
  };

  const forceFinishAttendance = async (orderId, depiladoraId) => {
    if (!supabase) return;
    if (currentUser.role !== 'recepcao') {
      toast({ title: "🚫 Acesso Negado", description: "Apenas a recepção pode forçar a finalização.", variant: "destructive" });
      return;
    }
    
    if (!depiladoraId) {
      toast({ title: "❌ Erro Crítico", description: "ID do profissional não encontrado para forçar finalização.", variant: "destructive" });
      return;
    }

    const { error: orderError } = await supabase.from('orders').update({ status: 'completed', end_time: new Date().toISOString() }).eq('id', orderId);
    if (orderError) {
      toast({ title: "❌ Erro ao finalizar", variant: "destructive", description: orderError.message });
      return;
    }

    const { error: statusError } = await supabase.from('depiladoras_status').update({ status: 'online', last_login: new Date().toISOString() }).eq('id', depiladoraId);
    if (statusError) {
      toast({ title: "❌ Erro ao atualizar status do profissional", variant: "destructive", description: statusError.message });
      return;
    }
    
    toast({ title: "✅ Atendimento Finalizado Manualmente!", description: "O profissional foi liberado." });
  };

  return {
    activeAttendanceId,
    processAndAssignOrder,
    startAttendance,
    updateObservation,
    finishAttendance,
    forceFinishAttendance,
    setActiveAttendanceId
  };
};
