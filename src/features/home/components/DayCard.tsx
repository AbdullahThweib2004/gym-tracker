import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { useTheme } from '@/theme';
import { mirrorInRtl } from '@/utils/direction';

type DayCardProps = {
  name: string;
  exerciseCount: number;
  previewNames: readonly string[];
  lastDone: string | null;
  isSuggested: boolean;
  onPress: () => void;
};

export function DayCard({
  name,
  exerciseCount,
  previewNames,
  lastDone,
  isSuggested,
  onPress,
}: DayCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const remaining = exerciseCount - previewNames.length;

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${name}${isSuggested ? `, ${t('home.upNext')}` : ''}`}
      style={isSuggested ? { borderColor: theme.colors.primary, borderWidth: 2 } : undefined}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <View style={{ flex: 1, gap: theme.spacing.xxs }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.sm,
              flexWrap: 'wrap',
            }}
          >
            <AppText variant="subheading">{name}</AppText>
            {isSuggested ? <Chip label={t('home.upNext')} selected /> : null}
          </View>
          <AppText variant="caption" color="textSecondary">
            {t('home.exerciseCount', { count: exerciseCount })}
          </AppText>
        </View>
        {/* Decorative: the whole card is the button (nested buttons are invalid on web). */}
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.textSecondary}
          style={mirrorInRtl()}
        />
      </View>
      {previewNames.length > 0 ? (
        <AppText variant="body" color="textSecondary" numberOfLines={2}>
          {previewNames.join(' · ')}
          {remaining > 0 ? ` ${t('home.andMore', { count: remaining })}` : ''}
        </AppText>
      ) : null}
      <AppText variant="caption" color={lastDone ? 'textSecondary' : 'textMuted'}>
        {lastDone ? t('home.lastDone', { when: lastDone }) : t('home.notDoneYet')}
      </AppText>
    </Card>
  );
}
