import { memo, useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SearchBar } from '@/components/SearchBar';
import { ToggleRow } from '@/components/ToggleRow';
import { EQUIPMENT, type Equipment, type MuscleGroup } from '@/constants/muscles';
import { listExercises } from '@/db/repositories/exercises';
import type { Exercise } from '@/db/schema';
import { buildPickerSections } from '@/features/program/pickerSections';
import { exerciseName } from '@/i18n/format';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme';
import { mirrorInRtl } from '@/utils/direction';

import { ExerciseThumb } from './components/ExerciseThumb';
import { editExerciseHref, newExerciseHref } from './routes';

type LibraryRow =
  | { type: 'header'; key: string; muscleGroup: MuscleGroup }
  | { type: 'exercise'; key: string; exercise: Exercise };

export function ExerciseLibraryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useAppStore((s) => s.language);
  const [showArchived, setShowArchived] = useState(false);
  const [all, setAll] = useState<Exercise[]>(() => listExercises({ includeArchived: true }));
  const [query, setQuery] = useState('');
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  useFocusEffect(useCallback(() => setAll(listExercises({ includeArchived: true })), []));

  const rows = useMemo((): LibraryRow[] => {
    const visible = showArchived ? all : all.filter((e) => !e.isArchived);
    const { other } = buildPickerSections(visible, [], { query, equipment }, (e) =>
      exerciseName(e, language),
    );
    return other.flatMap((section) => [
      {
        type: 'header' as const,
        key: `h-${section.muscleGroup}`,
        muscleGroup: section.muscleGroup,
      },
      ...section.exercises.map((exercise) => ({
        type: 'exercise' as const,
        key: `e-${exercise.id}`,
        exercise,
      })),
    ]);
  }, [all, showArchived, query, equipment, language]);

  const toggleEquipment = (value: Equipment) =>
    setEquipment((prev) =>
      prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value],
    );

  return (
    <Screen padded={false}>
      <View
        style={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.sm,
          gap: theme.spacing.sm,
        }}
      >
        <ScreenHeader
          title={t('exercises.title')}
          onBack={() => router.back()}
          backLabel={t('common.back')}
          trailing={
            <Button
              label={t('exercises.create')}
              icon="add"
              onPress={() => router.push(newExerciseHref)}
            />
          }
        />
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('exercises.search')}
          clearLabel={t('exercises.clearSearch')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: theme.spacing.xs }}
        >
          <Chip
            label={t('exercises.allEquipment')}
            selected={equipment.length === 0}
            onPress={() => setEquipment([])}
          />
          {EQUIPMENT.map((value) => (
            <Chip
              key={value}
              label={t(`equipment.${value}`)}
              selected={equipment.includes(value)}
              onPress={() => toggleEquipment(value)}
            />
          ))}
        </ScrollView>
        <ToggleRow
          label={t('exercises.showArchived')}
          value={showArchived}
          onValueChange={setShowArchived}
        />
      </View>
      <FlashList
        data={rows}
        keyExtractor={(row) => row.key}
        getItemType={(row) => row.type}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
        }}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title={t('exercises.noResults')}
            actionLabel={t('exercises.create')}
            onAction={() => router.push(newExerciseHref)}
          />
        }
        renderItem={({ item: row }) =>
          row.type === 'header' ? (
            <AppText
              variant="label"
              color="textSecondary"
              accessibilityRole="header"
              style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.sm }}
            >
              {t(`muscleGroups.${row.muscleGroup}`)}
            </AppText>
          ) : (
            <LibraryRowCard
              exercise={row.exercise}
              name={exerciseName(row.exercise, language)}
              equipmentLabel={t(`equipment.${row.exercise.equipment}`)}
            />
          )
        }
      />
    </Screen>
  );
}

type LibraryRowCardProps = { exercise: Exercise; name: string; equipmentLabel: string };

const LibraryRowCard = memo(function LibraryRowCard({
  exercise,
  name,
  equipmentLabel,
}: LibraryRowCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View style={{ paddingBottom: theme.spacing.sm }}>
      <Card
        onPress={() => router.push(editExerciseHref(exercise.id))}
        accessibilityLabel={name}
        style={{ paddingVertical: theme.spacing.md }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <ExerciseThumb exercise={exercise} size={52} />
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <AppText
              variant="bodyStrong"
              color={exercise.isArchived ? 'textMuted' : 'textPrimary'}
              numberOfLines={2}
            >
              {name}
            </AppText>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: theme.spacing.xs,
                alignItems: 'center',
              }}
            >
              <AppText variant="caption" color="textSecondary">
                {equipmentLabel}
              </AppText>
              {exercise.isCustom ? <Chip label={t('exercises.custom')} /> : null}
              {exercise.isArchived ? <Chip label={t('exercises.archived')} /> : null}
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textMuted}
            style={mirrorInRtl()}
          />
        </View>
      </Card>
    </View>
  );
});
