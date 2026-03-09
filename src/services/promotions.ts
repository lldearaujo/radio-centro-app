import { supabase } from './supabaseClient';
import { Poll } from './polls';

export type PromotionType = 'promo_quizz';

export type PromotionStatus = 'draft' | 'active' | 'scheduled' | 'closed';

export type PromotionSelectionMode = 'sorteio' | 'ranking';

export interface Promotion {
  id: string;
  title: string;
  description_short?: string | null;
  description_full?: string | null;
  image_url?: string | null;
  type: PromotionType;
  status: PromotionStatus;
  start_at?: string | null;
  end_at?: string | null;
  selection_mode: PromotionSelectionMode;
  max_entries_per_user?: number | null;
  min_age?: number | null;
  created_at: string;
  updated_at?: string | null;
}

export type PromotionQualificationMode = 'any_participation';

export interface PromotionQuizzRule {
  id: string;
  promotion_id: string;
  poll_id: string;
  qualification_mode: PromotionQualificationMode;
  min_score?: number | null;
  min_correct_answers?: number | null;
  allow_multiple_attempts?: boolean | null;
  count_best_attempt_only?: boolean | null;
}

export interface PromotionParticipant {
  id: string;
  promotion_id: string;
  user_id: string;
  qualified: boolean;
  qualification_reason?: string | null;
  entries_count: number;
  created_at: string;
}

export type PromotionWinnerStatus = 'selected' | 'contacted' | 'confirmed' | 'disqualified';

export interface PromotionWinner {
  id: string;
  promotion_id: string;
  user_id: string;
  prize_name?: string | null;
  position?: number | null;
  status: PromotionWinnerStatus;
  notes?: string | null;
  selected_at: string;
}

export interface PromotionWithPoll extends Promotion {
  rule: PromotionQuizzRule;
  poll: Poll;
}

const ensureClient = () => {
  if (!supabase) {
    throw new Error(
      'Supabase não está configurado. Defina supabaseUrl e supabaseAnonKey em expo.extra.',
    );
  }
  return supabase;
};

export const getActiveQuizPromotions = async (): Promise<Promotion[]> => {
  const client = ensureClient();

  const { data, error } = await client
    .from('promotions')
    .select('*')
    .eq('type', 'promo_quizz')
    .in('status', ['active', 'scheduled'])
    .order('start_at', { ascending: true });

  if (error) {
    console.error('[Promotions] Erro ao buscar promoções via quizz:', error);
    throw error;
  }

  const now = new Date();

  return (data ?? []).filter((promo) => {
    const p = promo as Promotion;
    const startsOk = !p.start_at || new Date(p.start_at) <= now;
    const endsOk = !p.end_at || new Date(p.end_at) >= now;
    return startsOk && endsOk;
  }) as Promotion[];
};

export const getPromotionRuleForPromotion = async (
  promotionId: string,
): Promise<PromotionQuizzRule | null> => {
  const client = ensureClient();

  const { data, error } = await client
    .from('promotion_quizz_rules')
    .select('*')
    .eq('promotion_id', promotionId)
    .maybeSingle();

  if (error) {
    console.error(
      '[Promotions] Erro ao buscar regra de quizz para promoção:',
      promotionId,
      error,
    );
    throw error;
  }

  return (data as PromotionQuizzRule) ?? null;
};

export const getPromotionWithPoll = async (
  promotionId: string,
): Promise<PromotionWithPoll | null> => {
  const [promotion, rule] = await Promise.all([
    (async () => {
      const client = ensureClient();
      const { data, error } = await client
        .from('promotions')
        .select('*')
        .eq('id', promotionId)
        .single();

      if (error) {
        console.error('[Promotions] Erro ao buscar promoção:', error);
        throw error;
      }

      return data as Promotion;
    })(),
    getPromotionRuleForPromotion(promotionId),
  ]);

  if (!rule) {
    return null;
  }

  const client = ensureClient();
  const { data: poll, error: pollError } = await client
    .from('polls')
    .select('*')
    .eq('id', rule.poll_id)
    .single();

  if (pollError) {
    console.error('[Promotions] Erro ao buscar enquete vinculada à promoção:', pollError);
    throw pollError;
  }

  return {
    ...(promotion as Promotion),
    rule,
    poll: poll as Poll,
  };
};

export const getPromotionParticipantsForUser = async (
  promotionId: string,
  userId: string,
): Promise<PromotionParticipant | null> => {
  const client = ensureClient();

  const { data, error } = await client
    .from('promotion_participants')
    .select('*')
    .eq('promotion_id', promotionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Promotions] Erro ao buscar participação do usuário na promoção:', error);
    throw error;
  }

  return (data as PromotionParticipant) ?? null;
};

