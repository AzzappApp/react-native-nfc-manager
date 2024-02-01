import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { COVER_RATIO, COVER_CARD_RADIUS } from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

const ImagePickerCardMediaWrapper = ({ children }: { children: ReactNode }) => {
  const [height, setHeight] = useState(0);
  const onLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    setHeight(nativeEvent.layout.height);
  }, []);

  const styles = useStyleSheet(styleSheet);

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={[styles.shadowBox, { height }]}>
        <View
          style={[
            styles.radiusBox,
            {
              borderRadius: height * COVER_RATIO * COVER_CARD_RADIUS,
            },
          ]}
        >
          {children}
        </View>
      </View>
    </View>
  );
};

export default ImagePickerCardMediaWrapper;

const styleSheet = createStyleSheet(apperance => ({
  radiusBox: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.grey100,
  },
  shadowBox: [
    {
      flex: 1,
      aspectRatio: COVER_RATIO,
    },
    shadow(apperance, 'center'),
  ],
  container: {
    flex: 1,
    marginBottom: 39,
    marginTop: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));
