import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../constants/theme';
import { PollWithOptions, PollResultsOption } from '../services/polls';

interface PollCardProps {
  poll: PollWithOptions;
  results?: {
    totalVotes: number;
    perOption: PollResultsOption[];
  } | null;
  isLoadingResults?: boolean;
  hasVoted: boolean;
  onVote: (optionId: string) => Promise<void>;
  defaultCollapsed?: boolean;
}

export const PollCard: React.FC<PollCardProps> = ({
  poll,
  results,
  isLoadingResults,
  hasVoted,
  onVote,
  defaultCollapsed,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isClosed =
    poll.status === 'closed' ||
    (poll.ends_at ? new Date(poll.ends_at) < new Date() : false);
  const initialCollapsed = defaultCollapsed ?? isClosed;
  const [collapsed, setCollapsed] = useState<boolean>(initialCollapsed);

  const optionsWithStats = useMemo(() => {
    if (!results) {
      return poll.options.map((opt) => ({
        optionId: opt.id,
        label: opt.label,
        votes: 0,
        percentage: 0,
      }));
    }

    const byId: Record<string, PollResultsOption> = {};
    results.perOption.forEach((opt) => {
      byId[opt.optionId] = opt;
    });

    return poll.options.map((opt) => {
      const stat = byId[opt.id];
      if (!stat) {
        return {
          optionId: opt.id,
          label: opt.label,
          votes: 0,
          percentage: 0,
        };
      }
      return stat;
    });
  }, [poll.options, results]);

  const handleVote = async () => {
    if (!selectedOptionId || isSubmitting || hasVoted || isClosed) return;
    try {
      setIsSubmitting(true);
      await onVote(selectedOptionId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showResults = hasVoted || isClosed;

  const headerResultLabel = useMemo(() => {
    if (!results || results.totalVotes <= 0) return null;

    const sorted = [...results.perOption].sort((a, b) => b.votes - a.votes);
    const winner = sorted[0];
    if (!winner) return null;

    const pct = winner.percentage;
    const total = results.totalVotes;
    const statusLabel = isClosed ? 'Encerrada' : 'Parcial';

    return `${statusLabel} • ${winner.label} (${pct.toFixed(0)}%) • ${total} voto${
      total === 1 ? '' : 's'
    }`;
  }, [results, isClosed]);

  return (
    <View style={[styles.card, isClosed ? styles.cardClosed : styles.cardActive]}>
      <TouchableOpacity
        style={styles.header}
        activeOpacity={0.8}
        onPress={() => setCollapsed((prev) => !prev)}
      >
        <View style={styles.headerTextWrapper}>
          <Text style={styles.title}>{poll.title}</Text>
          {showResults && headerResultLabel && (
            <Text style={styles.headerResult}>{headerResultLabel}</Text>
          )}
        </View>
        <MaterialIcons
          name={collapsed ? 'expand-more' : 'expand-less'}
          size={24}
          color={Colors.textLight}
        />
      </TouchableOpacity>

      {!collapsed && (
        <>
          {poll.description ? (
            <Text style={styles.description}>{poll.description}</Text>
          ) : null}

          {poll.starts_at || poll.ends_at ? (
            <Text style={styles.meta}>
              {poll.starts_at
                ? `Início: ${new Date(poll.starts_at).toLocaleDateString()}`
                : ''}
              {poll.ends_at
                ? `  •  Fim: ${new Date(poll.ends_at).toLocaleDateString()}`
                : ''}
            </Text>
          ) : null}

          <View style={styles.optionsContainer}>
            {optionsWithStats.map((opt) => {
              const isSelected = selectedOptionId === opt.optionId;
              const isDisabled = showResults || isSubmitting;
              const percentageLabel = `${opt.percentage.toFixed(0)}%`;

              return (
                <TouchableOpacity
                  key={opt.optionId}
                  style={[
                    styles.optionRow,
                    isSelected && !showResults && styles.optionRowSelected,
                  ]}
                  activeOpacity={0.8}
                  disabled={isDisabled}
                  onPress={() => setSelectedOptionId(opt.optionId)}
                >
                  <View style={styles.optionLabelWrapper}>
                    <View style={styles.radioOuter}>
                      {isSelected && !showResults && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.optionLabel}>{opt.label}</Text>
                  </View>

                  {showResults && (
                    <View style={styles.resultsWrapper}>
                      <View style={styles.resultsBarBackground}>
                        <View
                          style={[
                            styles.resultsBarFill,
                            { width: `${opt.percentage}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.resultsText}>{percentageLabel}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.footer}>
            {showResults ? (
              <Text style={styles.footerText}>
                {isLoadingResults ? 'Atualizando resultados...' : 'Resultados da enquete'}
              </Text>
            ) : (
              <TouchableOpacity
                style={[
                  styles.voteButton,
                  (!selectedOptionId || isSubmitting) && styles.voteButtonDisabled,
                ]}
                onPress={handleVote}
                disabled={!selectedOptionId || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.voteButtonText}>Votar</Text>
                )}
              </TouchableOpacity>
            )}
            {results && results.totalVotes > 0 && (
              <Text style={styles.totalVotes}>
                {results.totalVotes} voto{results.totalVotes === 1 ? '' : 's'}
              </Text>
            )}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF8F8',
    borderRadius: 16,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(211, 47, 47, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  headerTextWrapper: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  headerResult: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  cardActive: {
    backgroundColor: '#FFF8F8',
    borderColor: 'rgba(211, 47, 47, 0.18)',
  },
  cardClosed: {
    backgroundColor: '#F5F5F5',
    borderColor: Colors.border,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  meta: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginBottom: Spacing.sm,
  },
  optionsContainer: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  optionRow: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.gray,
  },
  optionLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  optionLabel: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  resultsWrapper: {
    alignItems: 'flex-end',
  },
  resultsBarBackground: {
    width: 80,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 2,
  },
  resultsBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  resultsText: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
  },
  voteButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
  voteButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  voteButtonText: {
    fontSize: FontSize.sm,
    color: Colors.white,
    fontWeight: 'bold',
  },
  totalVotes: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
});

