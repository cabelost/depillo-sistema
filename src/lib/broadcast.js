export function broadcastEvent(eventData) {
  console.warn("BroadcastChannel is not suitable for cross-device sync and is deprecated. Use Supabase Realtime.");
}

export function listenToBroadcast(callback) {
  console.warn("BroadcastChannel is not suitable for cross-device sync and is deprecated. Use Supabase Realtime.");
  return () => {};
}