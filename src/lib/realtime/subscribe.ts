// lib/realtime/subscribe.ts
import { supabaseBrowser } from '../supabase/browser';

const client = supabaseBrowser();
import type { RealtimeChannel } from '@supabase/supabase-js';

const ENABLED = process.env.NEXT_PUBLIC_REALTIME_ENABLED === 'true';

type Callback<T> = (payload: T) => void;

function logSub(table: string, filters: any) {
  if (process.env.NODE_ENV === 'development') {
    console.info('[Realtime] subscribed', { table, filters });
  }
}

function logWarn(table: string) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[Realtime] disabled for table ${table}`);
  }
}

export function subscribeRuns(
  runId: string,
  onUpdate: Callback<any>
): () => void {
  if (!ENABLED) return () => {};

  const channel: RealtimeChannel = client
    .channel(`runs:${runId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'runs',
        filter: `run_id=eq.${runId}`,
      },
      (payload) => onUpdate(payload.new)
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') logSub('runs', { runId });
      if (status === 'CHANNEL_ERROR') logWarn('runs');
    });

  return () => {
    client.removeChannel(channel);
  };
}

export function subscribeProperties(
  propertyId: string,
  onUpdate: Callback<any>
): () => void {
  if (!ENABLED) return () => {};

  const channel: RealtimeChannel = client
    .channel(`properties:${propertyId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'properties',
        filter: `property_id=eq.${propertyId}`,
      },
      (payload) => onUpdate(payload.new)
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') logSub('properties', { propertyId });
      if (status === 'CHANNEL_ERROR') logWarn('properties');
    });

  return () => {
    client.removeChannel(channel);
  };
}

export function subscribeMissingRoomRequests(
  propertyId: string,
  onUpsert: Callback<any>,
  onDelete: Callback<{ id: string }>
): () => void {
  if (!ENABLED) return () => {};

  const channel: RealtimeChannel = client
    .channel(`missing_room_requests:${propertyId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'missing_room_requests',
        filter: `property_id=eq.${propertyId}`,
      },
      (payload) => onUpsert(payload.new)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'missing_room_requests',
        filter: `property_id=eq.${propertyId}`,
      },
      (payload) => onUpsert(payload.new)
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'missing_room_requests',
        filter: `property_id=eq.${propertyId}`,
      },
      (payload) => onDelete(payload.old as { id: string })
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') logSub('missing_room_requests', { propertyId });
      if (status === 'CHANNEL_ERROR') logWarn('missing_room_requests');
    });

  return () => {
    client.removeChannel(channel);
  };
}
