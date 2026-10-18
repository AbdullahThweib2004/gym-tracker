import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReduceMotion, useTheme } from '@/theme';

import { AppText } from './AppText';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Use for long content; otherwise the sheet sizes to its content. */
  scrollable?: boolean;
};

/**
 * Themed bottom sheet (declarative): open while `visible`, swipe down or tap the backdrop to
 * close. Requires BottomSheetModalProvider at the root.
 */
export function Sheet({ visible, onClose, title, children, scrollable = false }: SheetProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible) ref.current?.present();
    else ref.current?.dismiss();
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.6}
      />
    ),
    [],
  );

  const body = (
    <View
      style={{
        paddingHorizontal: theme.spacing.xl,
        paddingBottom: insets.bottom + theme.spacing.xl,
        gap: theme.spacing.lg,
      }}
    >
      {title ? (
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
      ) : null}
      {children}
    </View>
  );

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      enableDynamicSizing
      animateOnMount={!reduceMotion}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.xl }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.borderStrong, width: 40 }}
      accessibilityLabel={title}
    >
      {scrollable ? (
        <BottomSheetScrollView keyboardShouldPersistTaps="handled">{body}</BottomSheetScrollView>
      ) : (
        <BottomSheetView>{body}</BottomSheetView>
      )}
    </BottomSheetModal>
  );
}
