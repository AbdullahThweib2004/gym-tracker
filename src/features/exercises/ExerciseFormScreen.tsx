import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TextField } from '@/components/TextField';
import { EQUIPMENT, MUSCLE_GROUPS, type Equipment, type MuscleGroup } from '@/constants/muscles';
import { getExerciseById } from '@/db/repositories/exercises';
import type { Exercise } from '@/db/schema';
import { exerciseHistoryHref } from '@/features/workout/routes';
import { exerciseName } from '@/i18n/format';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme';

import { ExerciseThumb } from './components/ExerciseThumb';
import {
  archiveExercise,
  createCustomExercise,
  deleteExercise,
  removeExercisePhoto,
  setExercisePhoto,
  updateCustomExercise,
} from './exerciseService';
import { pickSquarePhoto, type PhotoSource } from './photoStorage';

/** Create (route `/exercises/new`) or edit (`/exercises/[id]`) an exercise. */
export function ExerciseFormScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useAppStore((s) => s.language);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isNew = id === undefined || id === 'new';
  const [exercise, setExercise] = useState<Exercise | undefined>(() =>
    isNew ? undefined : getExerciseById(Number(id)),
  );

  const [nameEn, setNameEn] = useState(exercise?.nameEn ?? '');
  const [nameAr, setNameAr] = useState(exercise?.nameAr ?? '');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(exercise?.muscleGroup ?? 'chest');
  const [equipment, setEquipment] = useState<Equipment>(exercise?.equipment ?? 'machine');
  /** For a new exercise the photo is copied into storage only when it's saved. */
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [nameError, setNameError] = useState(false);

  if (!isNew && !exercise) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title={t('exercises.notFound')}
          actionLabel={t('common.back')}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const editable = isNew || Boolean(exercise?.isCustom);
  const title = isNew
    ? t('exercises.createTitle')
    : exercise
      ? exerciseName(exercise, language)
      : '';
  const previewExercise = {
    muscleGroup,
    imageUri: pendingPhoto ?? exercise?.imageUri ?? null,
  };

  const choosePhoto = async (source: PhotoSource) => {
    const { uri, denied } = await pickSquarePhoto(source);
    if (denied) {
      Alert.alert(t('exercises.photo.deniedTitle'), t(`exercises.photo.denied.${source}`));
      return;
    }
    if (!uri) return;
    if (isNew || !exercise) {
      setPendingPhoto(uri);
      return;
    }
    try {
      setExercise(setExercisePhoto(exercise.id, uri) ?? exercise);
    } catch (error) {
      console.error(error);
      Alert.alert(t('exercises.photo.failedTitle'), t('exercises.photo.failedMessage'));
    }
  };

  const removePhoto = () => {
    if (pendingPhoto) setPendingPhoto(null);
    else if (exercise) setExercise(removeExercisePhoto(exercise.id) ?? exercise);
  };

  const save = () => {
    const input = { nameEn, nameAr, muscleGroup, equipment };
    const result = isNew
      ? createCustomExercise(input, pendingPhoto)
      : updateCustomExercise(exercise!.id, input);
    if (!result.ok) {
      setNameError(result.reason === 'nameRequired');
      return;
    }
    router.back();
  };

  const confirmDelete = () => {
    if (!exercise) return;
    Alert.alert(t('exercises.deleteTitle'), t('exercises.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          const result = deleteExercise(exercise.id);
          if (result === 'deleted') {
            router.back();
            return;
          }
          Alert.alert(t('exercises.inUseTitle'), t('exercises.inUseMessage'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('exercises.archive'),
              onPress: () => {
                archiveExercise(exercise.id, true);
                router.back();
              },
            },
          ]);
        },
      },
    ]);
  };

  const hasPhoto = Boolean(previewExercise.imageUri);

  return (
    <Screen padded={false}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        // iOS: keep focused inputs above the keyboard (Android resizes the window instead).
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}
      >
        <ScreenHeader title={title} onBack={() => router.back()} backLabel={t('common.back')} />

        <Card style={{ alignItems: 'center' }}>
          <ExerciseThumb exercise={previewExercise} size={160} />
          <AppText variant="caption" color="textSecondary" align="center">
            {t('exercises.photo.hint')}
          </AppText>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: theme.spacing.sm,
              justifyContent: 'center',
            }}
          >
            <Button
              label={t('exercises.photo.take')}
              icon="camera-outline"
              variant="secondary"
              onPress={() => void choosePhoto('camera')}
            />
            <Button
              label={t('exercises.photo.choose')}
              icon="images-outline"
              variant="secondary"
              onPress={() => void choosePhoto('library')}
            />
            {hasPhoto ? (
              <Button
                label={t('exercises.photo.remove')}
                icon="trash-outline"
                variant="ghost"
                onPress={removePhoto}
              />
            ) : null}
          </View>
        </Card>

        {editable ? (
          <>
            <TextField
              label={t('exercises.nameEn')}
              value={nameEn}
              onChangeText={(v) => {
                setNameEn(v);
                setNameError(false);
              }}
              placeholder={t('exercises.nameEnPlaceholder')}
              autoCapitalize="words"
              returnKeyType="next"
              error={nameError ? t('exercises.nameRequired') : undefined}
            />
            <TextField
              label={t('exercises.nameAr')}
              value={nameAr}
              onChangeText={(v) => {
                setNameAr(v);
                setNameError(false);
              }}
              placeholder={t('exercises.nameArPlaceholder')}
              hint={t('exercises.nameFallbackHint')}
            />
            <View style={{ gap: theme.spacing.xs }}>
              <AppText variant="label" color="textSecondary">
                {t('exercises.muscleGroup')}
              </AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                {MUSCLE_GROUPS.map((group) => (
                  <Chip
                    key={group}
                    label={t(`muscleGroups.${group}`)}
                    selected={muscleGroup === group}
                    onPress={() => setMuscleGroup(group)}
                  />
                ))}
              </View>
            </View>
            <View style={{ gap: theme.spacing.xs }}>
              <AppText variant="label" color="textSecondary">
                {t('exercises.equipmentLabel')}
              </AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                {EQUIPMENT.map((value) => (
                  <Chip
                    key={value}
                    label={t(`equipment.${value}`)}
                    selected={equipment === value}
                    onPress={() => setEquipment(value)}
                  />
                ))}
              </View>
            </View>
            <Button label={t('common.save')} icon="checkmark" onPress={save} fullWidth />
          </>
        ) : (
          <Card>
            <AppText variant="caption" color="textSecondary">
              {t('exercises.builtInHint')}
            </AppText>
            <AppText>
              {t(`muscleGroups.${exercise!.muscleGroup}`)} · {t(`equipment.${exercise!.equipment}`)}
            </AppText>
          </Card>
        )}

        {!isNew && exercise ? (
          <View style={{ gap: theme.spacing.sm }}>
            <Button
              label={t('workout.viewHistory')}
              variant="secondary"
              icon="stats-chart-outline"
              onPress={() => router.push(exerciseHistoryHref(exercise.id))}
              fullWidth
            />
            {exercise.isArchived ? (
              <Button
                label={t('exercises.unarchive')}
                variant="secondary"
                icon="arrow-undo-outline"
                onPress={() => {
                  archiveExercise(exercise.id, false);
                  setExercise({ ...exercise, isArchived: false });
                }}
                fullWidth
              />
            ) : (
              <Button
                label={t('exercises.archive')}
                variant="ghost"
                icon="archive-outline"
                onPress={() => {
                  archiveExercise(exercise.id, true);
                  setExercise({ ...exercise, isArchived: true });
                }}
                fullWidth
              />
            )}
            {exercise.isCustom ? (
              <Button
                label={t('exercises.delete')}
                variant="ghost"
                icon="trash-outline"
                onPress={confirmDelete}
                fullWidth
              />
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
