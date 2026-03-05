import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';
import { getActivePrograms, Program } from '../../src/services/programs';

const WEEKDAY_LABELS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

interface ProgramByDay {
  dayIndex: number;
  programs: Program[];
}

const parseTimeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map((v) => parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
};

const isNowPlaying = (program: Program, now: Date): boolean => {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const start = parseTimeToMinutes(program.start_time);
  const end = parseTimeToMinutes(program.end_time);
  const today = now.getDay();

  return program.weekdays.includes(today) && nowMinutes >= start && nowMinutes <= end;
};

export default function ScheduleScreen() {
  const [loading, setLoading] = useState(true);
  const [programsByDay, setProgramsByDay] = useState<ProgramByDay[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const today = now.getDay();

        const programs = await getActivePrograms();
        const byDay: ProgramByDay[] = [];
        for (let day = 0; day < 7; day += 1) {
          const dayPrograms = programs
            .filter((p) => (p.weekdays || []).includes(day))
            .sort(
              (a, b) => parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time),
            );
          if (dayPrograms.length > 0) {
            byDay.push({ dayIndex: day, programs: dayPrograms });
          }
        }

        byDay.sort((a, b) => {
          const aIsToday = a.dayIndex === today;
          const bIsToday = b.dayIndex === today;
          if (aIsToday && !bIsToday) return -1;
          if (!aIsToday && bIsToday) return 1;
          return a.dayIndex - b.dayIndex;
        });

        setProgramsByDay(byDay);

        if (byDay.length > 0) {
          const hasToday = byDay.some((d) => d.dayIndex === today);
          setSelectedDayIndex(hasToday ? today : byDay[0].dayIndex);
        } else {
          setSelectedDayIndex(null);
        }
      } catch (e) {
        console.error('[ScheduleScreen] Erro ao carregar programação:', e);
        setError('Não foi possível carregar a programação. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const now = new Date();
  const today = now.getDay();
  const effectiveSelectedDay =
    selectedDayIndex !== null
      ? selectedDayIndex
      : programsByDay.length > 0
        ? programsByDay[0].dayIndex
        : today;
  const selectedDayData =
    programsByDay.find((d) => d.dayIndex === effectiveSelectedDay) || null;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando programação...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Programação</Text>
      <Text style={styles.headerSubtitle}>
        Confira os programas da Rádio Centro ao longo da semana.
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {programsByDay.length === 0 && !error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nenhum programa cadastrado.</Text>
          <Text style={styles.emptySubText}>
            Em breve você verá aqui a grade completa da rádio.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.daySelector}>
            {programsByDay.map(({ dayIndex }) => {
              const isSelected = dayIndex === effectiveSelectedDay;
              const isToday = dayIndex === today;
              return (
                <Text
                  key={dayIndex}
                  style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                  onPress={() => setSelectedDayIndex(dayIndex)}
                >
                  {isToday ? 'Hoje' : WEEKDAY_LABELS_FULL[dayIndex].slice(0, 3)}
                </Text>
              );
            })}
          </View>

          {selectedDayData && (
            <View style={styles.daySection}>
              <Text style={styles.dayTitle}>
                {selectedDayData.dayIndex === today ? 'Hoje - ' : ''}
                {WEEKDAY_LABELS_FULL[selectedDayData.dayIndex]}
              </Text>

              {selectedDayData.programs.map((program) => {
                const playing = isNowPlaying(program, now);
                return (
                  <View
                    key={program.id}
                    style={[styles.programCard, playing && styles.programCardNow]}
                  >
                    <View style={styles.programHeader}>
                      <Text style={styles.programName}>{program.name}</Text>
                      <Text style={styles.programTime}>
                        {program.start_time.slice(0, 5)} - {program.end_time.slice(0, 5)}
                      </Text>
                    </View>
                    {program.host ? (
                      <Text style={styles.programHost}>com {program.host}</Text>
                    ) : null}
                    {program.description ? (
                      <Text style={styles.programDescription}>{program.description}</Text>
                    ) : null}
                    {playing && <Text style={styles.nowBadge}>No ar agora</Text>}
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
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
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  emptyState: {
    marginTop: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptySubText: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
  },
  daySelector: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  dayChip: {
    marginRight: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  dayChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    color: Colors.white,
  },
  daySection: {
    marginBottom: Spacing.lg,
  },
  dayTitle: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  programCard: {
    backgroundColor: Colors.gray,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  programCardNow: {
    borderColor: Colors.secondary,
    backgroundColor: '#FFF3E0',
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  programName: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  programTime: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
  },
  programHost: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  programDescription: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  nowBadge: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.secondary,
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: 'bold',
  },
});

