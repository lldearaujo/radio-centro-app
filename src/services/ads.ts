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

const getActiveBannerByPosition = async (position: string): Promise<HomeBanner | null> => {
  const client = ensureClient();

  const baseQuery = client
    .from('ads_banners')
    .select('id, title, image_url, target_url, position, is_active, kind')
    .eq('is_active', true)
    .eq('kind', 'image')
    .order('created_at', { ascending: false });

  // Primeiro tenta pela posição específica configurada
  const { data, error } = await baseQuery.eq('position', position);

  if (error) {
    console.error('[Ads] Erro ao buscar banner ativo:', error);
    throw error;
  }

  let rows = (data ?? []) as any[];

  // Fallback: se não encontrar nada nessa posição, tenta qualquer banner ativo
  if (!rows.length) {
    const { data: fallbackData, error: fallbackError } = await baseQuery;
    if (fallbackError) {
      console.error('[Ads] Erro ao buscar banner ativo (fallback):', fallbackError);
      throw fallbackError;
    }
    rows = (fallbackData ?? []) as any[];
  }

  if (!rows.length) return null;

  const randomIndex = Math.floor(Math.random() * rows.length);
  const chosen = rows[randomIndex];

  return {
    id: chosen.id as string,
    title: (chosen.title as string) ?? '',
    imageUrl: (chosen.image_url as string) ?? '',
    targetUrl: (chosen.target_url as string | null) ?? null,
  };
};

export const getActiveHomeBanner = async (): Promise<HomeBanner | null> => {
  return getActiveBannerByPosition('home_radio');
};

export const getActiveVideoBanner = async (): Promise<HomeBanner | null> => {
  return getActiveBannerByPosition('video_top');
};

