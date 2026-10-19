import { useState } from 'react';
import { View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { AppText } from '@/components/AppText';
import { formatDate, formatGroupedNumber } from '@/i18n/format';
import { useReduceMotion, useTheme } from '@/theme';

import {
  chartBaseline,
  metricValue,
  type ProgressMetric,
  type SessionPoint,
} from '../progressSeries';

type ProgressChartProps = {
  points: readonly SessionPoint[];
  metric: ProgressMetric;
  accessibilityLabel: string;
  /** Tooltip text for a value (e.g. "62.5 kg"). */
  formatValue: (value: number) => string;
};

const HEIGHT = 180;
const Y_LABEL_WIDTH = 44;

export function ProgressChart({
  points,
  metric,
  accessibilityLabel,
  formatValue,
}: ProgressChartProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);
  const values = points.map((p) => metricValue(p, metric));
  const labelStyle = {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.xs,
    fontFamily: theme.fonts.regular,
  };
  // No x-axis labels (they'd be cut to the point spacing); the date range sits under the chart
  // and the tooltip shows each point's exact date.
  const data = points.map((point) => ({ value: metricValue(point, metric) }));
  const first = points[0];
  const last = points[points.length - 1];

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
          // Remount only when the size changes, so the entrance animation plays once per screen
          // rather than on every metric or range switch.
          key={plotWidth}
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
          isAnimated={!reduceMotion}
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
          yAxisTextStyle={labelStyle}
          xAxisLabelTextStyle={labelStyle}
          formatYLabel={(label) => formatGroupedNumber(Number(label))}
          disableScroll
          pointerConfig={{
            pointerStripColor: theme.colors.borderStrong,
            pointerStripWidth: 1,
            pointerColor: theme.colors.primary,
            radius: 6,
            pointerLabelWidth: 120,
            pointerLabelHeight: 56,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (_items: unknown, _secondary: unknown, index: number) => {
              const point = points[index];
              if (!point) return null;
              return (
                <View
                  style={{
                    padding: theme.spacing.sm,
                    borderRadius: theme.radius.sm,
                    borderWidth: 1,
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.surfaceElevated,
                  }}
                >
                  <AppText variant="bodyStrong" color="primary">
                    {formatValue(metricValue(point, metric))}
                  </AppText>
                  <AppText variant="label" color="textSecondary">
                    {formatDate(point.date, 'medium')}
                  </AppText>
                </View>
              );
            },
          }}
        />
      ) : null}
      {first && last ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingStart: Y_LABEL_WIDTH,
          }}
        >
          <AppText variant="label" color="textSecondary">
            {formatDate(first.date, 'short')}
          </AppText>
          <AppText variant="label" color="textSecondary">
            {formatDate(last.date, 'short')}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
