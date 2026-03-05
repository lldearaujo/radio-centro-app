import { supabase } from './supabaseClient';

export interface HomeBanner {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl?: string | null;
}

const ensureClient = () => {
  if (!supabase) {
    throw new Error(
      'Supabase não está configurado. Defina supabaseUrl e supabaseAnonKey em expo.extra.',
    );
  }
  return supabase;
};

export const getActiveHomeBanner = async (): Promise<HomeBanner | null> => {
  const client = ensureClient();

  const { data, error } = await client
    .from('ads_banners')
    .select('id, title, image_url, target_url, position, is_active')
    .eq('position', 'home_radio')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // PGRST116 = no rows returned for single/maybeSingle
    if ((error as any).code === 'PGRST116') {
      return null;
    }
    console.error('[Ads] Erro ao buscar banner ativo:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id as string,
    title: (data.title as string) ?? '',
    imageUrl: (data.image_url as string) ?? '',
    targetUrl: (data.target_url as string | null) ?? null,
  };
};

