import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import type { Split } from '@/constants/splits';
import { dayLabel, splitLabel } from '@/i18n/format';
import { useTheme } from '@/theme';
import { mirrorInRtl } from '@/utils/direction';

type SplitCardProps = {
  split: Split;
  onSelect: () => void;
};

export function SplitCard({ split, onSelect }: SplitCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const name = splitLabel(split.key);

  return (
    <Card
      onPress={onSelect}
      accessibilityLabel={`${name}, ${t('splits.daysCount', { count: split.days.length })}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <AppText variant="subheading">{name}</AppText>
          <AppText variant="caption" color="textSecondary">
            {t('splits.daysCount', { count: split.days.length })}
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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
        {split.days.map((day) => (
          <Chip key={day.key} label={dayLabel(split.key, day.key)} />
        ))}
      </View>
    </Card>
  );
}
