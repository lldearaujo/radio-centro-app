import { supabase } from './supabaseClient';

export interface Program {
  id: string;
  name: string;
  host?: string | null;
  description?: string | null;
  weekdays: number[];
  start_time: string;
  end_time: string;
  notify_on_start: boolean;
  is_active: boolean;
}

const ensureClient = () => {
  if (!supabase) {
    throw new Error(
      'Supabase não está configurado. Defina supabaseUrl e supabaseAnonKey em expo.extra.',
    );
  }
  return supabase;
};

export const getActivePrograms = async (): Promise<Program[]> => {
  const client = ensureClient();

  const { data, error } = await client
    .from('programs')
    .select('*')
    .eq('is_active', true)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('[Programs] Erro ao buscar programação:', error);
    throw error;
  }

  return (data ?? []) as Program[];
};

