
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

const notificationSoundUrl = '/notification.mp3';

export const useSupabaseRealtime = (currentUser) => {
  const [orders, setOrders] = useState([]);
  const [depiladoras, setDepiladoras] = useState([]);
  const [depiladorasStatus, setDepiladorasStatus] = useState({});
  const [queue, setQueue] = useState([]);
  const { play: playNotification, unlockAudio } = useAudioPlayer(notificationSoundUrl);
  
  const fetchDepiladorasAndStatus = useCallback(async () => {
    if (!supabase) return;
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'depiladora');

    if (profilesError) console.error("Error fetching profiles:", profilesError);
    else setDepiladoras(profilesData || []);

    const { data: statusData, error: statusError } = await supabase.from('depiladoras_status').select('*');
    if (statusError) {
      console.error("Error fetching status:", statusError);
    } else {
      const statuses = {};
      statusData.forEach(item => {
        statuses[item.id] = item;
      });
      setDepiladorasStatus(statuses);

      const onlineQueue = statusData
        .filter(d => d.status === 'online' && d.last_login)
        .sort((a, b) => new Date(a.last_login) - new Date(b.last_login))
        .map(d => d.id);
      setQueue(onlineQueue);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
     if (!supabase) return;
     const { data: ordersData, error: ordersError } = await supabase.from('orders').select('*');
      if (ordersError) console.error("Error fetching orders:", ordersError);
      else setOrders(ordersData || []);
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const statusChannel = supabase.channel('public:depiladoras_status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'depiladoras_status' }, fetchDepiladorasAndStatus)
      .subscribe();

    const ordersChannel = supabase.channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.new?.status === 'pending' && payload.new?.depiladora_id === currentUser.id) {
          playNotification();
        }
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [fetchDepiladorasAndStatus, fetchOrders, currentUser.id, playNotification]);

  const fetchInitialData = useCallback(() => {
    fetchDepiladorasAndStatus();
    fetchOrders();
  }, [fetchDepiladorasAndStatus, fetchOrders]);

  return {
    orders,
    depiladoras,
    depiladorasStatus,
    queue,
    playNotification: unlockAudio,
    fetchInitialData
  };
};
