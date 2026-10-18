import { useState } from 'react';
import { View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { formatDate, formatGroupedNumber } from '@/i18n/format';
import { useTheme } from '@/theme';

import {
  chartBaseline,
  labelIndexes,
  metricValue,
  type ProgressMetric,
  type SessionPoint,
} from '../progressSeries';

type ProgressChartProps = {
  points: readonly SessionPoint[];
  metric: ProgressMetric;
  accessibilityLabel: string;
};

const HEIGHT = 180;
const Y_LABEL_WIDTH = 44;

export function ProgressChart({ points, metric, accessibilityLabel }: ProgressChartProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const values = points.map((p) => metricValue(p, metric));
  const labels = labelIndexes(points.length);
  const data = points.map((point, index) => ({
    value: metricValue(point, metric),
    label: labels.has(index) ? formatDate(point.date, 'short') : '',
  }));
  const plotWidth = Math.max(0, width - Y_LABEL_WIDTH - theme.spacing.lg);

  return (
    // Charts keep time flowing left → right in both languages, so the layout is pinned to LTR
    // (otherwise RTL would mirror the axis labels but not the SVG drawing).
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ direction: 'ltr', minHeight: HEIGHT + 40 }}
    >
      {plotWidth > 0 ? (
        <LineChart
          key={`${metric}-${points.length}-${plotWidth}`}
          data={data}
          width={plotWidth}
          height={HEIGHT}
          adjustToWidth
          initialSpacing={theme.spacing.md}
          endSpacing={theme.spacing.md}
          yAxisOffset={chartBaseline(values)}
          noOfSections={4}
          curved
          areaChart
          isAnimated
          thickness={3}
          color={theme.colors.primary}
          dataPointsColor={theme.colors.primary}
          startFillColor={theme.colors.primary}
          endFillColor={theme.colors.background}
          startOpacity={0.35}
          endOpacity={0.02}
          rulesColor={theme.colors.border}
          rulesType="solid"
          xAxisColor={theme.colors.border}
          yAxisColor={theme.colors.transparent}
          yAxisLabelWidth={Y_LABEL_WIDTH}
          yAxisTextStyle={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.xs }}
          xAxisLabelTextStyle={{
            color: theme.colors.textSecondary,
            fontSize: theme.fontSizes.xs,
            width: 60,
          }}
          formatYLabel={(label) => formatGroupedNumber(Number(label))}
          disableScroll
        />
      ) : null}
    </View>
  );
}
