import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StepDots } from '@/components/StepDots';
import { listExercises } from '@/db/repositories/exercises';
import { isProgramSetupComplete } from '@/db/repositories/userPrograms';
import type { Exercise } from '@/db/schema';
import { dayLabel, exerciseName, splitLabel } from '@/i18n/format';
import { useAppStore } from '@/store/appStore';
import { useProgramDraftStore, type DraftEntry } from '@/store/programDraftStore';
import { useTheme } from '@/theme';
import { moveItem } from '@/utils/list';

import { newExerciseHref } from '@/features/exercises/routes';

import { ExercisePicker } from './components/ExercisePicker';
import { SelectedExercisesSheet, SelectedSummaryButton } from './components/SelectedExercisesPanel';
import { TargetEditorModal } from './components/TargetEditorModal';
import {
  getIncompleteActiveProgram,
  getWizardContext,
  loadDayEntries,
  saveDayEntries,
} from './programService';
import { DEFAULT_TARGETS } from './targets';

const dayHref = (dayId: number) => ({
  pathname: '/onboarding/day/[dayId]' as const,
  params: { dayId: String(dayId) },
});

export function DayWizardScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<{ dayId: string; mode?: string }>();
  const dayId = Number(params.dayId);
  const isEdit = params.mode === 'edit';

  const language = useAppStore((s) => s.language);
  const setSetupComplete = useAppStore((s) => s.setSetupComplete);
  const setDraft = useProgramDraftStore((s) => s.setDraft);
  const clearDraft = useProgramDraftStore((s) => s.clearDraft);
  const clearAllDrafts = useProgramDraftStore((s) => s.clearAll);

  const [context] = useState(() => getWizardContext(dayId));
  // Archived exercises are kept in the lookup so an existing selection still shows its name.
  const [allExercises, setAllExercises] = useState(() => listExercises({ includeArchived: true }));
  // Reload when returning from the custom exercise form so new exercises show up.
  useFocusEffect(useCallback(() => setAllExercises(listExercises({ includeArchived: true })), []));
  const pickable = useMemo(() => allExercises.filter((e) => !e.isArchived), [allExercises]);
  const exercisesById = useMemo(() => new Map(allExercises.map((e) => [e.id, e])), [allExercises]);

  const [savedEntries] = useState(() => loadDayEntries(dayId));
  const [entries, setEntriesState] = useState<DraftEntry[]>(() => {
    const draft = useProgramDraftStore.getState().drafts[dayId];
    return !isEdit && draft ? draft : savedEntries;
  });
  const [listOpen, setListOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const selectedIds = useMemo(() => new Set(entries.map((e) => e.exerciseId)), [entries]);

  if (!context) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title={t('onboarding.wizard.dayNotFound')}
          actionLabel={t('common.back')}
          onAction={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
      </Screen>
    );
  }

  const { program, days, index, day, suggestedMuscleGroups } = context;
  const isLast = index === days.length - 1;
  const title = dayLabel(program.splitType, day.dayKey);

  const setEntries = (next: DraftEntry[]) => {
    setEntriesState(next);
    if (!isEdit) setDraft(dayId, next);
  };

  const toggle = (exercise: Exercise) => {
    void Haptics.selectionAsync().catch(() => undefined);
    if (selectedIds.has(exercise.id)) {
      setEntries(entries.filter((e) => e.exerciseId !== exercise.id));
    } else {
      setEntries([...entries, { exerciseId: exercise.id, ...DEFAULT_TARGETS, restSeconds: null }]);
    }
  };

  const removeAt = (i: number) => {
    setEntries(entries.filter((_, idx) => idx !== i));
    setEditingIndex(null);
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    const previous = days[index - 1];
    router.replace(
      !isEdit && previous ? dayHref(previous.id) : isEdit ? '/settings' : '/onboarding',
    );
  };

  const handleBack = () => {
    const dirty = JSON.stringify(entries) !== JSON.stringify(savedEntries);
    if (!isEdit || !dirty) {
      goBack();
      return;
    }
    setConfirmDiscard(true);
  };

  const handleNext = () => {
    if (entries.length === 0) return;
    saveDayEntries(dayId, entries);
    clearDraft(dayId);

    if (isEdit) {
      router.back();
      return;
    }
    const next = days[index + 1];
    if (next) {
      router.push(dayHref(next.id));
      return;
    }
    if (isProgramSetupComplete(program.id)) {
      clearAllDrafts();
      // The root layout navigates home once the guard for the tabs has updated.
      setSetupComplete(true);
      return;
    }
    // A previous day was left empty (e.g. setup resumed after a restart): go fill it.
    const incomplete = getIncompleteActiveProgram();
    if (incomplete) router.push(dayHref(incomplete.nextDayId));
  };

  const editing = editingIndex === null ? undefined : entries[editingIndex];
  const editingExercise = editing ? exercisesById.get(editing.exerciseId) : undefined;
  const primaryLabel = isEdit
    ? t('common.save')
    : isLast
      ? t('onboarding.wizard.finish')
      : t('common.next');

  return (
    <Screen padded={false}>
      <View
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.sm,
          gap: theme.spacing.sm,
        }}
      >
        <ScreenHeader
          title={title}
          subtitle={isEdit ? t('onboarding.wizard.editSubtitle') : splitLabel(program.splitType)}
          onBack={handleBack}
          backLabel={t('common.back')}
        />
        {!isEdit ? (
          <StepDots
            current={index}
            total={days.length}
            label={t('onboarding.wizard.progress', { current: index + 1, total: days.length })}
          />
        ) : null}
      </View>

      <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg }}>
        <ExercisePicker
          exercises={pickable}
          suggestedMuscleGroups={suggestedMuscleGroups}
          selectedIds={selectedIds}
          onToggle={toggle}
          onCreate={() => router.push(newExerciseHref)}
        />
      </View>

      <View
        style={{
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        }}
      >
        {entries.length === 0 ? (
          <AppText variant="caption" color="textMuted">
            {t('onboarding.wizard.pickAtLeastOne')}
          </AppText>
        ) : null}
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <SelectedSummaryButton
            entries={entries}
            exercisesById={exercisesById}
            onPress={() => setListOpen(true)}
          />
          <Button
            label={primaryLabel}
            onPress={handleNext}
            disabled={entries.length === 0}
            icon={isEdit || isLast ? 'checkmark' : 'arrow-forward'}
            haptic="medium"
            style={{ flex: 1 }}
          />
        </View>
      </View>

      <SelectedExercisesSheet
        visible={listOpen}
        onClose={() => setListOpen(false)}
        entries={entries}
        exercisesById={exercisesById}
        onMove={(i, direction) => setEntries(moveItem(entries, i, i + direction))}
        onEdit={(i) => {
          setListOpen(false);
          setEditingIndex(i);
        }}
        onRemove={removeAt}
      />
      <ConfirmSheet
        visible={confirmDiscard}
        title={t('onboarding.wizard.discardTitle')}
        message={t('onboarding.wizard.discardMessage')}
        confirmLabel={t('onboarding.wizard.discard')}
        cancelLabel={t('common.cancel')}
        destructive
        onClose={() => setConfirmDiscard(false)}
        onConfirm={goBack}
      />
      <TargetEditorModal
        visible={editing !== undefined}
        title={editingExercise ? exerciseName(editingExercise, language) : ''}
        targets={editing ?? DEFAULT_TARGETS}
        onChange={(targets) => {
          if (editingIndex === null || !editing) return;
          setEntries(entries.map((e, i) => (i === editingIndex ? { ...e, ...targets } : e)));
        }}
        restSeconds={editing?.restSeconds ?? null}
        onChangeRest={(restSeconds) => {
          if (editingIndex === null || !editing) return;
          setEntries(entries.map((e, i) => (i === editingIndex ? { ...e, restSeconds } : e)));
        }}
        onRemove={() => editingIndex !== null && removeAt(editingIndex)}
        onClose={() => setEditingIndex(null)}
      />
    </Screen>
  );
}
