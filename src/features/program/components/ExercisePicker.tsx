import { memo, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { PressableScale } from '@/components/PressableScale';
import { SearchBar } from '@/components/SearchBar';
import { EQUIPMENT, MUSCLE_GROUPS, type Equipment, type MuscleGroup } from '@/constants/muscles';
import type { Exercise } from '@/db/schema';
import { ExerciseThumb, muscleGroupIcon } from '@/features/exercises/components/ExerciseThumb';
import { exerciseName } from '@/i18n/format';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme';

import { buildPickerSections } from '../pickerSections';

type MuscleFilter = 'suggested' | 'all' | MuscleGroup;

type ExercisePickerProps = {
  exercises: readonly Exercise[];
  suggestedMuscleGroups: readonly MuscleGroup[];
  selectedIds: ReadonlySet<number>;
  onToggle: (exercise: Exercise) => void;
  /** Shows a "+ Create" button (e.g. to open the custom exercise form). */
  onCreate?: () => void;
  /** Space at the bottom of the grid (e.g. above a floating footer). */
  bottomInset?: number;
};

type GridCardProps = {
  exercise: Exercise;
  name: string;
  equipmentLabel: string;
  selected: boolean;
  onToggle: (exercise: Exercise) => void;
};

const GridCard = memo(function GridCard({
  exercise,
  name,
  equipmentLabel,
  selected,
  onToggle,
}: GridCardProps) {
  const theme = useTheme();
  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${name}, ${equipmentLabel}`}
      onPress={() => onToggle(exercise)}
      haptic="selection"
      scaleTo={0.96}
      style={{
        flex: 1,
        gap: theme.spacing.sm,
        padding: theme.spacing.sm,
        borderRadius: theme.radius.lg,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        backgroundColor: selected ? theme.colors.primaryMuted : theme.colors.surface,
      }}
    >
      <ExerciseThumb exercise={exercise} fill showAddPhotoHint radius={theme.radius.md} />
      {selected ? (
        <View
          style={{
            position: 'absolute',
            top: theme.spacing.md,
            end: theme.spacing.md,
            width: 28,
            height: 28,
            borderRadius: theme.radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.primary,
          }}
        >
          <Ionicons name="checkmark" size={18} color={theme.colors.onPrimary} />
        </View>
      ) : null}
      <View
        style={{
          gap: theme.spacing.xs,
          paddingHorizontal: theme.spacing.xs,
          paddingBottom: theme.spacing.xs,
        }}
      >
        <AppText variant="bodyStrong" numberOfLines={2} style={{ minHeight: 48 }}>
          {name}
        </AppText>
        <AppText variant="label" color="textSecondary" numberOfLines={1}>
          {equipmentLabel}
        </AppText>
      </View>
    </PressableScale>
  );
});

/** Exercise picker: sticky search and filters over a 2-column grid of image cards. */
export function ExercisePicker({
  exercises,
  suggestedMuscleGroups,
  selectedIds,
  onToggle,
  onCreate,
  bottomInset = 0,
}: ExercisePickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useAppStore((s) => s.language);
  const hasSuggestion =
    suggestedMuscleGroups.length > 0 && suggestedMuscleGroups.length < MUSCLE_GROUPS.length;
  const [query, setQuery] = useState('');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [muscle, setMuscle] = useState<MuscleFilter>(hasSuggestion ? 'suggested' : 'all');
  const searching = query.trim().length > 0;

  const data = useMemo(() => {
    const { suggested, other } = buildPickerSections(
      exercises,
      suggestedMuscleGroups,
      { query, equipment },
      (e) => exerciseName(e, language),
    );
    const sections =
      searching || muscle === 'all'
        ? [...suggested, ...other]
        : muscle === 'suggested'
          ? suggested
          : [...suggested, ...other].filter((s) => s.muscleGroup === muscle);
    return sections.flatMap((s) => s.exercises);
  }, [exercises, suggestedMuscleGroups, query, equipment, language, muscle, searching]);

  const toggleEquipment = (value: Equipment) =>
    setEquipment((prev) =>
      prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value],
    );

  const chipRow = { gap: theme.spacing.xs, paddingEnd: theme.spacing.lg };

  return (
    <View style={{ flex: 1 }}>
      {/* Sticky header: stays in place while the grid scrolls. */}
      <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder={t('exercises.search')}
              clearLabel={t('exercises.clearSearch')}
            />
          </View>
          {onCreate ? (
            <Button
              label={t('exercises.createShort')}
              icon="add"
              variant="secondary"
              onPress={onCreate}
            />
          ) : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={chipRow}
        >
          {hasSuggestion ? (
            <Chip
              label={t('exercises.forThisDay')}
              icon="flash"
              selected={!searching && muscle === 'suggested'}
              onPress={() => setMuscle('suggested')}
            />
          ) : null}
          <Chip
            label={t('exercises.allMuscles')}
            selected={!searching && muscle === 'all'}
            onPress={() => setMuscle('all')}
          />
          {MUSCLE_GROUPS.map((group) => {
            const selected = !searching && muscle === group;
            return (
              <Chip
                key={group}
                label={t(`muscleGroups.${group}`)}
                selected={selected}
                onPress={() => setMuscle(group)}
                leading={
                  <MaterialCommunityIcons
                    name={muscleGroupIcon(group)}
                    size={16}
                    color={selected ? theme.colors.onPrimary : theme.colors.primary}
                  />
                }
              />
            );
          })}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={chipRow}
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
      </View>

      <FlashList
        data={data}
        numColumns={2}
        keyExtractor={(item) => String(item.id)}
        extraData={selectedIds}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: bottomInset + theme.spacing.lg }}
        ListEmptyComponent={
          <View style={{ padding: theme.spacing.xl, alignItems: 'center', gap: theme.spacing.md }}>
            <AppText color="textSecondary" align="center">
              {t('exercises.noResults')}
            </AppText>
            {onCreate ? (
              <Button
                label={t('exercises.create')}
                icon="add"
                variant="secondary"
                onPress={onCreate}
              />
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <View
            style={{
              flex: 1,
              paddingBottom: theme.spacing.sm,
              paddingEnd: index % 2 === 0 ? theme.spacing.xs : 0,
              paddingStart: index % 2 === 1 ? theme.spacing.xs : 0,
            }}
          >
            <GridCard
              exercise={item}
              name={exerciseName(item, language)}
              equipmentLabel={t(`equipment.${item.equipment}`)}
              selected={selectedIds.has(item.id)}
              onToggle={onToggle}
            />
          </View>
        )}
      />
    </View>
  );
}
