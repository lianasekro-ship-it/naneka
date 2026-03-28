/**
 * ActiveDelivery model — query layer for the active_deliveries table.
 *
 * Phase 1: single vehicle. One row per in-progress delivery.
 */

import { supabase } from '../config/supabase.js';

export async function createDelivery({ orderId, traccarDeviceId, driverName = '', driverPhone = '' }) {
  const { data, error } = await supabase
    .from('active_deliveries')
    .insert({
      order_id:          orderId,
      traccar_device_id: String(traccarDeviceId),
      driver_name:       driverName,
      driver_phone:      driverPhone,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function findDeliveryByOrderId(orderId) {
  const { data, error } = await supabase
    .from('active_deliveries')
    .select('*')
    .eq('order_id', orderId)
    .is('completed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updatePosition(deliveryId, latitude, longitude) {
  const { error } = await supabase
    .from('active_deliveries')
    .update({ last_lat: latitude, last_lng: longitude, last_polled_at: new Date().toISOString() })
    .eq('id', deliveryId);
  if (error) throw error;
}

export async function completeDelivery(deliveryId) {
  const { error } = await supabase
    .from('active_deliveries')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', deliveryId);
  if (error) throw error;
}
