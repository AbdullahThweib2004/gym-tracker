import { useEffect, useState } from 'react';
import { Alert, AppState, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { ActionSheet } from '@/components/ActionSheet';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { haptic } from '@/components/haptics';
import { PressableScale } from '@/components/PressableScale';
import { ExerciseMotion } from '@/features/exercises/components/ExerciseMotion';
import { suggestNextWeight } from '@/features/progress/overload';
import { recordsForSet } from '@/features/progress/progressService';
import type { RecordKind } from '@/features/progress/records';
import { resolveRestSeconds } from '@/features/restTimer/restMath';
import { useRestTimerStore } from '@/features/restTimer/restTimerStore';
import { exerciseName, formatDate, formatSetsLine, formatTarget } from '@/i18n/format';
import { useAppStore } from '@/store/appStore';
import { useReduceMotion, useTheme } from '@/theme';
import { createDebouncer } from '@/utils/debounce';

import { SetCard, type SetCardMode } from './components/SetCard';
import { SuggestionCard } from './components/SuggestionCard';
import { exerciseHistoryHref } from './routes';
import {
  appendRow,
  fillEmptySuggestions,
  hasPendingEdits,
  restoreRows,
  validateRow,
  workingOrdinals,
  type SetRow,
} from './setRows';
import {
  loadDraftRows,
  loadExerciseLog,
  persistDraftRows,
  removeSet,
  saveSet,
  setWarmup,
} from './workoutService';

type Invalid = Record<string, { weight: boolean; reps: boolean }>;

type ExerciseLogPanelProps = {
  sessionId: number;
  exerciseId: number;
  /** Called after sets change so the screen can update the workout progress. */
  onSetsChanged: () => void;
};

/** Everything for logging one exercise. Mounted per exercise inside the workout pager. */
export function ExerciseLogPanel({ sessionId, exerciseId, onSetsChanged }: ExerciseLogPanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const language = useAppStore((s) => s.language);
  const restSettings = useRestTimerStore((s) => s.settings);
  const startRest = useRestTimerStore((s) => s.start);

  const [data] = useState(() => loadExerciseLog(sessionId, exerciseId));
  const lastSets = data?.last?.sets ?? [];
  // Unconfirmed edits come back from the persisted draft, confirmed sets from the database.
  const [rows, setRowsState] = useState<SetRow[]>(() =>
    data
      ? restoreRows(
          loadDraftRows(sessionId, exerciseId),
          data.savedSets,
          lastSets,
          data.item.targetSets,
        )
      : [],
  );
  const [invalid, setInvalid] = useState<Invalid>({});
  const [records, setRecords] = useState<Record<string, RecordKind[]>>({});
  const [chosenKey, setChosenKey] = useState<string | null>(null);
  const [menuRow, setMenuRow] = useState<SetRow | null>(null);
  // Draft writes are debounced so typing stays smooth; flushed on blur, unmount and backgrounding.
  const [draftSaver] = useState(() =>
    createDebouncer<SetRow[]>((next) => persistDraftRows(sessionId, exerciseId, next), 400),
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') draftSaver.flush();
    });
    return () => {
      sub.remove();
      draftSaver.flush();
    };
  }, [draftSaver]);

  if (!data) return null;

  const { item, last } = data;
  const name = exerciseName(item.exercise, language);
  const suggestion = suggestNextWeight(lastSets, item, item.exercise);
  const canApply =
    suggestion !== null &&
    rows.some(
      (row) => row.state === 'suggested' && !row.isWarmup && row.weightKg !== suggestion.weightKg,
    );
  const ordinals = workingOrdinals(rows);
  // The active set: the one the user picked, otherwise the first one not logged yet.
  const activeKey =
    rows.find((r) => r.key === chosenKey && r.state !== 'saved')?.key ??
    rows.find((r) => r.state !== 'saved')?.key;
  const layout = reduceMotion ? undefined : LinearTransition.duration(theme.motion.normal);

  const setRows = (next: SetRow[]) => {
    setRowsState(next);
    draftSaver.schedule(next);
    // Nothing pending (e.g. a set was just confirmed): remove the draft right away.
    if (!hasPendingEdits(next)) draftSaver.flush();
  };
  const patchRow = (key: string, patch: Partial<SetRow>) =>
    setRows(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const clearInvalid = (key: string) => {
    if (!invalid[key]) return;
    const { [key]: _removed, ...rest } = invalid;
    setInvalid(rest);
  };

  const change = (row: SetRow, field: 'weightKg' | 'reps', value: number | null) => {
    clearInvalid(row.key);
    patchRow(row.key, { [field]: value, state: 'edited' });
  };

  const confirm = (index: number) => {
    const row = rows[index];
    if (!row) return;
    const result = validateRow(row);
    if (!result.ok) {
      setInvalid({ ...invalid, [row.key]: { weight: result.weight, reps: result.reps } });
      haptic('error');
      return;
    }
    try {
      const isNew = row.setId === null;
      const stored = saveSet({
        id: row.setId,
        sessionId,
        exerciseId,
        setNumber: index + 1,
        weightKg: result.weightKg,
        reps: result.reps,
        isWarmup: row.isWarmup,
      });
      clearInvalid(row.key);
      setChosenKey(null);
      setRows(
        fillEmptySuggestions(
          rows.map((r) =>
            r.key === row.key
              ? {
                  ...r,
                  setId: stored.id,
                  weightKg: stored.weightKg,
                  reps: stored.reps,
                  state: 'saved' as const,
                }
              : r,
          ),
          index,
          { weightKg: stored.weightKg, reps: stored.reps },
        ),
      );

      const broken = recordsForSet(stored);
      setRecords({ ...records, [row.key]: broken });
      haptic(broken.length > 0 ? 'heavy' : 'success');
      if (isNew && restSettings.autoStart) {
        void startRest(resolveRestSeconds(item.restSeconds, restSettings.defaultRestSeconds));
      }
      onSetsChanged();
    } catch (error) {
      haptic('error');
      // Data safety: say so if a set could not be saved (the row keeps its values to retry).
      Alert.alert(t('workout.saveFailedTitle'), t('workout.saveFailedMessage'));
      console.error(error);
    }
  };

  const remove = (row: SetRow) => {
    const remaining = rows.filter((r) => r.key !== row.key);
    if (row.setId !== null) {
      removeSet(
        row.setId,
        remaining.flatMap((r, position) =>
          r.setId === null ? [] : [{ id: r.setId, setNumber: position + 1 }],
        ),
      );
      onSetsChanged();
    }
    clearInvalid(row.key);
    setRows(remaining);
  };

  const toggleWarmup = (row: SetRow) => {
    const isWarmup = !row.isWarmup;
    if (row.setId !== null && row.state === 'saved') {
      setWarmup(row.setId, isWarmup);
      onSetsChanged();
    }
    patchRow(row.key, { isWarmup });
  };

  const activate = (row: SetRow) => {
    haptic('selection');
    if (row.state === 'saved') patchRow(row.key, { state: 'edited' });
    setChosenKey(row.key);
  };

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <ExerciseMotion
        exercise={item.exercise}
        height={200}
        accessibilityLabel={t('exercises.motion.label', { name })}
      />

      <View style={{ gap: theme.spacing.xs }}>
        <AppText variant="title" accessibilityRole="header">
          {name}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <AppText variant="bodyStrong" color="primary">
            {formatTarget(item.targetSets, item.targetRepsMin, item.targetRepsMax)}
          </AppText>
          <PressableScale
            accessibilityRole="link"
            onPress={() => router.push(exerciseHistoryHref(exerciseId))}
            hitSlop={theme.spacing.md}
            style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}
          >
            <Ionicons name="stats-chart" size={14} color={theme.colors.textSecondary} />
            <AppText variant="caption" color="textSecondary">
              {t('workout.viewHistory')}
            </AppText>
          </PressableScale>
        </View>
      </View>

      {/* "Last time": the most useful number on this screen, in a highlighted strip. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.radius.md,
          borderStartWidth: 4,
          borderStartColor: last ? theme.colors.primary : theme.colors.borderStrong,
          backgroundColor: theme.colors.surface,
        }}
      >
        <Ionicons
          name="time-outline"
          size={20}
          color={last ? theme.colors.primary : theme.colors.textMuted}
        />
        <View style={{ flex: 1 }}>
          <AppText variant="label" color="textSecondary">
            {t('workout.lastTime')}
            {last ? ` · ${formatDate(last.date, 'medium')}` : ''}
          </AppText>
          <AppText
            variant={last ? 'bodyStrong' : 'caption'}
            color={last ? 'textPrimary' : 'textSecondary'}
          >
            {last && last.sets.length > 0 ? formatSetsLine(last.sets) : t('workout.firstTime')}
          </AppText>
        </View>
      </View>

      {suggestion ? (
        <SuggestionCard
          suggestion={suggestion}
          targetRepsMin={item.targetRepsMin}
          targetRepsMax={item.targetRepsMax}
          canApply={canApply}
          onApply={() =>
            setRows(
              rows.map((row) =>
                row.state === 'suggested' && !row.isWarmup
                  ? { ...row, weightKg: suggestion.weightKg }
                  : row,
              ),
            )
          }
        />
      ) : null}

      <View style={{ gap: theme.spacing.sm }}>
        {rows.map((row, index) => {
          const mode: SetCardMode =
            row.key === activeKey ? 'active' : row.state === 'saved' ? 'done' : 'pending';
          return (
            <Animated.View
              key={row.key}
              layout={layout}
              entering={reduceMotion ? undefined : FadeIn.duration(theme.motion.normal)}
              exiting={reduceMotion ? undefined : FadeOut.duration(theme.motion.fast)}
            >
              <SetCard
                ordinal={ordinals[index] ?? null}
                row={row}
                mode={mode}
                invalid={invalid[row.key]}
                records={records[row.key]}
                onChangeWeight={(value) => change(row, 'weightKg', value)}
                onChangeReps={(value) => change(row, 'reps', value)}
                onConfirm={() => confirm(index)}
                onActivate={() => activate(row)}
                onOptions={() => setMenuRow(row)}
                onBlur={draftSaver.flush}
              />
            </Animated.View>
          );
        })}
      </View>

      <Button
        label={t('workout.addSet')}
        variant="secondary"
        icon="add"
        haptic="light"
        onPress={() => {
          const next = appendRow(rows, lastSets);
          setRows(next);
          setChosenKey(next[next.length - 1]?.key ?? null);
        }}
        fullWidth
      />

      <ActionSheet
        visible={menuRow !== null}
        onClose={() => setMenuRow(null)}
        title={
          menuRow
            ? menuRow.isWarmup
              ? t('workout.warmup')
              : t('workout.set', { number: ordinals[rows.indexOf(menuRow)] ?? '' })
            : undefined
        }
        actions={
          menuRow
            ? [
                {
                  label: menuRow.isWarmup ? t('workout.markWorking') : t('workout.markWarmup'),
                  icon: 'flame-outline',
                  onPress: () => toggleWarmup(menuRow),
                },
                {
                  label: t('workout.deleteSet'),
                  icon: 'trash-outline',
                  destructive: true,
                  onPress: () => remove(menuRow),
                },
              ]
            : []
        }
      />
    </View>
  );
}
