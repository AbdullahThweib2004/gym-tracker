import { useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ExerciseMotion } from '@/features/exercises/components/ExerciseMotion';
import { suggestNextWeight } from '@/features/progress/overload';
import { recordsForSet } from '@/features/progress/progressService';
import type { RecordKind } from '@/features/progress/records';
import { resolveRestSeconds } from '@/features/restTimer/restMath';
import { RestTimerBar } from '@/features/restTimer/RestTimerBar';
import { useRestTimerStore } from '@/features/restTimer/restTimerStore';
import {
  exerciseName,
  formatDate,
  formatSetsLine,
  formatTarget,
  formatWeight,
} from '@/i18n/format';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme';
import { createDebouncer } from '@/utils/debounce';

import { SetRowView } from './components/SetRowView';
import { exerciseHistoryHref, exerciseLogHref } from './routes';
import {
  appendRow,
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

const haptic = (type: Haptics.NotificationFeedbackType) => {
  void Haptics.notificationAsync(type).catch(() => undefined);
};

export function ExerciseLogScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useAppStore((s) => s.language);
  const restSettings = useRestTimerStore((s) => s.settings);
  const startRest = useRestTimerStore((s) => s.start);
  const params = useLocalSearchParams<{ sessionId: string; exerciseId: string }>();
  const sessionId = Number(params.sessionId);
  const exerciseId = Number(params.exerciseId);

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
  const [records, setRecords] = useState<Record<string, RecordKind[]>>({});

  if (!data) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title={t('workout.notFound')}
          actionLabel={t('common.back')}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const { item, last, nextExerciseId } = data;
  const name = exerciseName(item.exercise, language);
  const suggestion = suggestNextWeight(lastSets, item, item.exercise);
  const canApply =
    suggestion !== null &&
    rows.some(
      (row) => row.state === 'suggested' && !row.isWarmup && row.weightKg !== suggestion.weightKg,
    );

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

  const applySuggestion = () => {
    if (!suggestion) return;
    setRows(
      rows.map((row) =>
        row.state === 'suggested' && !row.isWarmup
          ? { ...row, weightKg: suggestion.weightKg }
          : row,
      ),
    );
  };

  const confirm = (index: number) => {
    const row = rows[index];
    if (!row) return;
    const result = validateRow(row);
    if (!result.ok) {
      setInvalid({ ...invalid, [row.key]: { weight: result.weight, reps: result.reps } });
      haptic(Haptics.NotificationFeedbackType.Error);
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
      patchRow(row.key, {
        setId: stored.id,
        weightKg: stored.weightKg,
        reps: stored.reps,
        state: 'saved',
      });

      const broken = recordsForSet(stored);
      setRecords({ ...records, [row.key]: broken });
      haptic(Haptics.NotificationFeedbackType.Success);
      if (broken.length > 0) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
      }
      if (isNew && restSettings.autoStart) {
        void startRest(resolveRestSeconds(item.restSeconds, restSettings.defaultRestSeconds));
      }
    } catch (error) {
      haptic(Haptics.NotificationFeedbackType.Error);
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
    }
    clearInvalid(row.key);
    setRows(remaining);
  };

  const toggleWarmup = (row: SetRow) => {
    const isWarmup = !row.isWarmup;
    if (row.setId !== null && row.state === 'saved') setWarmup(row.setId, isWarmup);
    patchRow(row.key, { isWarmup });
  };

  const ordinals = workingOrdinals(rows);

  const openRowMenu = (row: SetRow, ordinal: number | null) => {
    void Haptics.selectionAsync().catch(() => undefined);
    Alert.alert(
      ordinal === null ? t('workout.warmup') : t('workout.set', { number: ordinal }),
      undefined,
      [
        {
          text: row.isWarmup ? t('workout.markWorking') : t('workout.markWarmup'),
          onPress: () => toggleWarmup(row),
        },
        { text: t('workout.deleteSet'), style: 'destructive', onPress: () => remove(row) },
        { text: t('common.cancel'), style: 'cancel' },
      ],
    );
  };

  const goNext = () => {
    if (nextExerciseId === null) router.back();
    else router.replace(exerciseLogHref(sessionId, nextExerciseId));
  };

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
        >
          <ScreenHeader
            title={name}
            subtitle={t('workout.target', {
              target: formatTarget(item.targetSets, item.targetRepsMin, item.targetRepsMax),
            })}
            onBack={() => router.back()}
            backLabel={t('common.back')}
          />
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push(exerciseHistoryHref(exerciseId))}
            hitSlop={theme.spacing.sm}
            style={{ alignSelf: 'flex-start' }}
          >
            <AppText variant="caption" color="primary">
              {t('workout.viewHistory')}
            </AppText>
          </Pressable>

          <ExerciseMotion
            exercise={item.exercise}
            height={180}
            accessibilityLabel={t('exercises.motion.label', { name })}
          />

          <Card>
            <AppText variant="label" color="textSecondary">
              {t('workout.lastTime')}
              {last ? ` · ${formatDate(last.date, 'medium')}` : ''}
            </AppText>
            <AppText
              variant={last ? 'bodyStrong' : 'body'}
              color={last ? 'textPrimary' : 'textSecondary'}
            >
              {last && last.sets.length > 0 ? formatSetsLine(last.sets) : t('workout.firstTime')}
            </AppText>
          </Card>

          {suggestion ? (
            <Card
              style={{
                borderColor:
                  suggestion.reasonKey === 'increase' ? theme.colors.success : theme.colors.border,
              }}
            >
              <AppText
                variant="label"
                color={suggestion.reasonKey === 'increase' ? 'success' : 'textSecondary'}
              >
                {t('progress.suggestionTitle')}
              </AppText>
              <AppText variant="body">
                {t(`progress.suggestion.${suggestion.reasonKey}`, {
                  weight: formatWeight(suggestion.weightKg),
                  reps: item.targetRepsMax,
                  min: item.targetRepsMin,
                  max: item.targetRepsMax,
                })}
              </AppText>
              {canApply ? (
                <Button
                  label={t('progress.apply')}
                  variant="secondary"
                  icon="checkmark-done"
                  onPress={applySuggestion}
                  style={{ alignSelf: 'flex-start' }}
                />
              ) : null}
            </Card>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              gap: theme.spacing.xs,
              paddingHorizontal: theme.spacing.xs,
            }}
          >
            <AppText variant="label" color="textMuted" align="center" style={{ width: 24 }}>
              {t('workout.setShort')}
            </AppText>
            <AppText variant="label" color="textMuted" align="center" style={{ flex: 1.15 }}>
              {t('workout.weightKg')}
            </AppText>
            <AppText variant="label" color="textMuted" align="center" style={{ flex: 1 }}>
              {t('workout.reps')}
            </AppText>
            <View style={{ width: 46 }} />
          </View>

          <View style={{ gap: theme.spacing.xs }}>
            {rows.map((row, index) => (
              <SetRowView
                key={row.key}
                ordinal={ordinals[index] ?? null}
                row={row}
                invalid={invalid[row.key]}
                records={records[row.key]}
                onChangeWeight={(value) => change(row, 'weightKg', value)}
                onChangeReps={(value) => change(row, 'reps', value)}
                onConfirm={() => confirm(index)}
                onEdit={() => patchRow(row.key, { state: 'edited' })}
                onLongPress={() => openRowMenu(row, ordinals[index] ?? null)}
                onBlur={draftSaver.flush}
              />
            ))}
          </View>
          {Object.keys(invalid).length > 0 ? (
            <AppText variant="caption" color="danger">
              {t('workout.invalidSet')}
            </AppText>
          ) : null}
          <AppText variant="caption" color="textMuted">
            {t('workout.rowsHelp')}
          </AppText>

          <Button
            label={t('workout.addSet')}
            variant="secondary"
            icon="add"
            onPress={() => setRows(appendRow(rows, lastSets))}
            fullWidth
          />
        </ScrollView>

        <RestTimerBar />
        <View
          style={{
            padding: theme.spacing.lg,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Button
            label={nextExerciseId === null ? t('workout.backToWorkout') : t('workout.nextExercise')}
            icon={nextExerciseId === null ? 'list' : 'arrow-forward'}
            onPress={goNext}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
