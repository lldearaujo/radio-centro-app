import { supabase } from './supabaseClient';

export type PollStatus = 'draft' | 'active' | 'closed';

export interface Poll {
  id: string;
  title: string;
  description?: string | null;
  status: PollStatus;
  starts_at?: string | null;
  ends_at?: string | null;
  highlight: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface PollOption {
  id: string;
  poll_id: string;
  label: string;
  sort_order: number;
}

export interface PollWithOptions extends Poll {
  options: PollOption[];
}

export interface PollResultsOption {
  optionId: string;
  label: string;
  votes: number;
  percentage: number;
}

export interface PollResults {
  totalVotes: number;
  perOption: PollResultsOption[];
}

const ensureClient = () => {
  if (!supabase) {
    throw new Error(
      'Supabase não está configurado. Defina supabaseUrl e supabaseAnonKey em expo.extra.',
    );
  }
  return supabase;
};

export const getActivePolls = async (): Promise<Poll[]> => {
  const client = ensureClient();

  const { data, error } = await client
    .from('polls')
    .select('*')
    .eq('status', 'active')
    .order('highlight', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Polls] Erro ao buscar enquetes ativas:', error);
    throw error;
  }

  const polls = (data ?? []) as Poll[];
  const now = new Date();

  return polls.filter((poll) => {
    const startsOk = !poll.starts_at || new Date(poll.starts_at) <= now;
    const endsOk = !poll.ends_at || new Date(poll.ends_at) >= now;
    return startsOk && endsOk;
  });
};

export const getPollWithOptions = async (
  pollId: string,
): Promise<PollWithOptions | null> => {
  const client = ensureClient();

  const { data: poll, error: pollError } = await client
    .from('polls')
    .select('*')
    .eq('id', pollId)
    .single();

  if (pollError) {
    console.error('[Polls] Erro ao buscar enquete:', pollError);
    throw pollError;
  }

  if (!poll) return null;

  const { data: options, error: optionsError } = await client
    .from('poll_options')
    .select('*')
    .eq('poll_id', pollId)
    .order('sort_order', { ascending: true });

  if (optionsError) {
    console.error('[Polls] Erro ao buscar opções da enquete:', optionsError);
    throw optionsError;
  }

  return {
    ...(poll as Poll),
    options: (options ?? []) as PollOption[],
  };
};

export const voteOnPoll = async (
  pollId: string,
  optionId: string,
  voterId: string,
): Promise<void> => {
  const client = ensureClient();

  const { error } = await client.from('poll_votes').insert({
    poll_id: pollId,
    option_id: optionId,
    voter_id: voterId,
  });

  if (error) {
    // Unique violation indica que o usuário já votou nesta enquete.
    const code = (error as any).code;
    if (code === '23505') {
      throw new Error('Você já votou nesta enquete.');
    }
    if (code === '42501') {
      throw new Error('Esta enquete já está encerrada.');
    }
    console.error('[Polls] Erro ao registrar voto:', error);
    throw error;
  }
};

export const getPollResults = async (pollId: string): Promise<PollResults> => {
  const client = ensureClient();

  const { data: options, error: optionsError } = await client
    .from('poll_options')
    .select('id, label')
    .eq('poll_id', pollId)
    .order('sort_order', { ascending: true });

  if (optionsError) {
    console.error('[Polls] Erro ao buscar opções para resultados:', optionsError);
    throw optionsError;
  }

  const { data: votes, error: votesError } = await client
    .from('poll_votes')
    .select('option_id')
    .eq('poll_id', pollId);

  if (votesError) {
    console.error('[Polls] Erro ao buscar votos da enquete:', votesError);
    throw votesError;
  }

  const counts: Record<string, number> = {};
  (votes ?? []).forEach((v) => {
    const key = (v as { option_id: string }).option_id;
    counts[key] = (counts[key] ?? 0) + 1;
  });

  const totalVotes = votes?.length ?? 0;

  const perOption: PollResultsOption[] = (options ?? []).map((opt) => {
    const votesCount = counts[opt.id] ?? 0;
    const percentage = totalVotes > 0 ? (votesCount / totalVotes) * 100 : 0;

    return {
      optionId: opt.id,
      label: opt.label,
      votes: votesCount,
      percentage,
    };
  });

  return {
    totalVotes,
    perOption,
  };
};

export const getUserVoteForPoll = async (
  pollId: string,
  voterId: string,
): Promise<{ optionId: string } | null> => {
  const client = ensureClient();

  const { data, error } = await client
    .from('poll_votes')
    .select('option_id')
    .eq('poll_id', pollId)
    .eq('voter_id', voterId)
    .maybeSingle();

  if (error) {
    console.error('[Polls] Erro ao buscar voto do usuário:', error);
    throw error;
  }

  if (!data) return null;

  return { optionId: (data as { option_id: string }).option_id };
};


