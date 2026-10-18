import { useMemo, useState } from 'react';
import { Pressable, ScrollView, SectionList, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Chip';
import { SearchBar } from '@/components/SearchBar';
import { EQUIPMENT, type Equipment, type MuscleGroup } from '@/constants/muscles';
import type { Exercise } from '@/db/schema';
import { ExerciseThumb } from '@/features/exercises/components/ExerciseThumb';
import { exerciseName } from '@/i18n/format';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme';
import { mirrorInRtl } from '@/utils/direction';

import { buildPickerSections } from '../pickerSections';

type PickerSection =
  | {
      kind: 'group';
      key: string;
      muscleGroup: MuscleGroup;
      total: number;
      selectedCount: number;
      data: Exercise[];
    }
  | { kind: 'divider'; key: string; data: Exercise[] };

type ExercisePickerProps = {
  exercises: readonly Exercise[];
  suggestedMuscleGroups: readonly MuscleGroup[];
  selectedIds: ReadonlySet<number>;
  onToggle: (exercise: Exercise) => void;
};

export function ExercisePicker({
  exercises,
  suggestedMuscleGroups,
  selectedIds,
  onToggle,
}: ExercisePickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useAppStore((s) => s.language);
  const [query, setQuery] = useState('');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [expanded, setExpanded] = useState<ReadonlySet<MuscleGroup>>(
    () => new Set(suggestedMuscleGroups),
  );

  const searching = query.trim().length > 0;

  const sections = useMemo((): PickerSection[] => {
    const { suggested, other } = buildPickerSections(
      exercises,
      suggestedMuscleGroups,
      { query, equipment },
      (exercise) => exerciseName(exercise, language),
    );
    const toGroup = ({
      muscleGroup,
      exercises: list,
    }: (typeof suggested)[number]): PickerSection => ({
      kind: 'group',
      key: muscleGroup,
      muscleGroup,
      total: list.length,
      selectedCount: list.filter((e) => selectedIds.has(e.id)).length,
      // Collapsed sections render no rows; searching expands every matching group.
      data: searching || expanded.has(muscleGroup) ? list : [],
    });
    const result = suggested.map(toGroup);
    if (other.length > 0) {
      if (suggested.length > 0) result.push({ kind: 'divider', key: 'other', data: [] });
      result.push(...other.map(toGroup));
    }
    return result;
  }, [
    exercises,
    suggestedMuscleGroups,
    query,
    equipment,
    language,
    selectedIds,
    expanded,
    searching,
  ]);

  const toggleGroup = (group: MuscleGroup) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });

  const toggleEquipment = (value: Equipment) =>
    setEquipment((prev) =>
      prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value],
    );

  return (
    <View style={{ flex: 1, gap: theme.spacing.sm }}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t('exercises.search')}
        clearLabel={t('exercises.clearSearch')}
      />
      <View>
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
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{ flex: 1 }}
        ListEmptyComponent={
          <AppText color="textSecondary" align="center" style={{ padding: theme.spacing.xl }}>
            {t('exercises.noResults')}
          </AppText>
        }
        renderSectionHeader={({ section }) => {
          if (section.kind === 'divider') {
            return (
              <AppText
                variant="label"
                color="textMuted"
                style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.xs }}
              >
                {t('exercises.otherMuscles')}
              </AppText>
            );
          }
          const isOpen = searching || expanded.has(section.muscleGroup);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              onPress={() => toggleGroup(section.muscleGroup)}
              disabled={searching}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm,
                paddingVertical: theme.spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
                backgroundColor: theme.colors.background,
              }}
            >
              <AppText variant="bodyStrong" style={{ flex: 1 }}>
                {t(`muscleGroups.${section.muscleGroup}`)}
              </AppText>
              {section.selectedCount > 0 ? (
                <Chip
                  label={t('exercises.selectedInGroup', { count: section.selectedCount })}
                  selected
                />
              ) : null}
              <AppText variant="caption" color="textMuted">
                {section.total}
              </AppText>
              <Ionicons
                name={isOpen ? 'chevron-down' : 'chevron-forward'}
                size={18}
                color={theme.colors.textSecondary}
                style={isOpen ? undefined : mirrorInRtl()}
              />
            </Pressable>
          );
        }}
        renderItem={({ item }) => {
          const selected = selectedIds.has(item.id);
          const name = exerciseName(item, language);
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${name}, ${t(`equipment.${item.equipment}`)}`}
              onPress={() => onToggle(item)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.xs,
                borderRadius: theme.radius.md,
                backgroundColor: pressed ? theme.colors.surface : theme.colors.transparent,
              })}
            >
              <ExerciseThumb muscleGroup={item.muscleGroup} size={40} />
              <View style={{ flex: 1 }}>
                <AppText variant="body" numberOfLines={2}>
                  {name}
                </AppText>
                <AppText variant="caption" color="textSecondary">
                  {t(`equipment.${item.equipment}`)}
                </AppText>
              </View>
              <Ionicons
                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={selected ? theme.colors.success : theme.colors.border}
              />
            </Pressable>
          );
        }}
      />
    </View>
  );
}
