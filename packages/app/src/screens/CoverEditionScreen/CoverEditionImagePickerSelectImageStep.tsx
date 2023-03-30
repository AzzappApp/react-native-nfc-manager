import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { COVER_RATIO, COVER_CARD_RADIUS } from '@azzapp/shared/cardHelpers';
import { colors } from '#theme';
import { SelectImageStep } from '#components/ImagePicker';
import type { SelectImageStepProps } from '#components/ImagePicker/SelectImageStep';
import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

const MediaContainerComponent = ({ children }: { children: ReactNode }) => {
  const [height, setHeight] = useState(0);
  const onLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    setHeight(nativeEvent.layout.height);
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={[styles.shadowBox, { height }]}>
        <View
          style={[
            styles.radiusBox,
            { borderRadius: height * COVER_RATIO * COVER_CARD_RADIUS },
          ]}
        >
          {children}
        </View>
      </View>
    </View>
  );
};

const CoverEditionImagePickerSelectImageStep = (
  props: SelectImageStepProps,
) => {
  return (
    <SelectImageStep
      {...props}
      MediaContainerComponent={MediaContainerComponent}
      initialCameraPosition="front"
    />
  );
};

export default CoverEditionImagePickerSelectImageStep;

const styles = StyleSheet.create({
  radiusBox: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.grey100,
  },
  shadowBox: {
    flex: 1,
    aspectRatio: COVER_RATIO,
    shadowColor: colors.black,
    shadowOpacity: 0.42,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 17,
  },
  container: {
    flex: 1,
    marginBottom: 39,
    marginTop: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
