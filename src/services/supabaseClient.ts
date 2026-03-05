import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as
  | { supabaseUrl?: string; supabaseAnonKey?: string }
  | undefined;

const supabaseUrl = extra?.supabaseUrl;
const supabaseAnonKey = extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  // Não lançar erro aqui para não quebrar o app em tempo de build;
  // os callers devem tratar ausência de cliente configurado.
  console.warn(
    '[Supabase] supabaseUrl ou supabaseAnonKey não configurados em expo.extra. ' +
      'Funcionalidades de enquetes ficarão indisponíveis.',
  );
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
        },
      })
    : null;

