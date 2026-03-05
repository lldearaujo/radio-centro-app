import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';
import { useVoterId } from '../../src/hooks/useVoterId';
import {
  getActivePolls,
  getPollResults,
  getPollWithOptions,
  getUserVoteForPoll,
  PollResults,
  PollWithOptions,
} from '../../src/services/polls';
import { PollCard } from '../../src/components/PollCard';

export default function PollsScreen() {
  const voterId = useVoterId();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [polls, setPolls] = useState<PollWithOptions[]>([]);
  const [resultsByPoll, setResultsByPoll] = useState<Record<string, PollResults | null>>({});
  const [votedPolls, setVotedPolls] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(
    async (isRefresh: boolean) => {
      if (!voterId) return;

      isRefresh ? setRefreshing(true) : setLoading(true);
      setErrorMessage(null);

      try {
        const activePolls = await getActivePolls();

        const fullPolls: PollWithOptions[] = [];
        const resultsMap: Record<string, PollResults | null> = {};
        const votedMap: Record<string, boolean> = {};

        for (const poll of activePolls) {
          const full = await getPollWithOptions(poll.id);
          if (!full) continue;

          fullPolls.push(full);

          try {
            const [results, userVote] = await Promise.all([
              getPollResults(poll.id),
              getUserVoteForPoll(poll.id, voterId),
            ]);

            resultsMap[poll.id] = results;
            votedMap[poll.id] = !!userVote;
          } catch (innerError) {
            console.warn('[PollsScreen] Erro ao carregar detalhes da enquete:', innerError);
            resultsMap[poll.id] = null;
            votedMap[poll.id] = false;
          }
        }

        setPolls(fullPolls);
        setResultsByPoll(resultsMap);
        setVotedPolls(votedMap);
      } catch (error) {
        console.error('[PollsScreen] Erro ao carregar enquetes:', error);
        setErrorMessage('Não foi possível carregar as enquetes. Tente novamente mais tarde.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [voterId],
  );

  useEffect(() => {
    if (voterId) {
      loadData(false);
    }
  }, [voterId, loadData]);

  const handleRefresh = () => {
    if (!voterId) return;
    loadData(true);
  };

  const handleVoteFactory = (pollId: string) => async (optionId: string) => {
    if (!voterId) return;

    setVotedPolls((prev) => ({ ...prev, [pollId]: true }));

    try {
      // Reaproveita serviço de voto definido em polls.ts
      const { voteOnPoll } = await import('../../src/services/polls');
      await voteOnPoll(pollId, optionId, voterId);

      const updatedResults = await getPollResults(pollId);
      setResultsByPoll((prev) => ({ ...prev, [pollId]: updatedResults }));
    } catch (error: any) {
      console.error('[PollsScreen] Erro ao votar:', error);
      // Se falhar (ex: já votou), reverte flag local e mostra mensagem genérica
      setVotedPolls((prev) => ({ ...prev, [pollId]: false }));
      setErrorMessage(
        error?.message === 'Você já votou nesta enquete.'
          ? 'Você já votou nesta enquete.'
          : 'Não foi possível registrar seu voto. Tente novamente.',
      );
    }
  };

  if (!voterId) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Preparando enquetes...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando enquetes...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
      }
    >
      <Text style={styles.headerTitle}>Enquetes</Text>
      <Text style={styles.headerSubtitle}>
        Participe das enquetes da Rádio Centro em tempo real.
      </Text>

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      {polls.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nenhuma enquete ativa no momento.</Text>
          <Text style={styles.emptySubText}>Volte em breve para participar das próximas!</Text>
        </View>
      ) : (
        polls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            results={resultsByPoll[poll.id]}
            isLoadingResults={false}
            hasVoted={!!votedPolls[poll.id]}
            onVote={handleVoteFactory(poll.id)}
            defaultCollapsed={false}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingVertical: Spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textLight,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    color: Colors.error,
    fontSize: FontSize.sm,
  },
  emptyState: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptySubText: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    textAlign: 'center',
  },
});

