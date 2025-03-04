import { useState } from 'react';
import { View } from 'react-native';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

const ImagePickerContactCardMediaWrapper = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [height, setHeight] = useState(0);
  const onLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    setHeight(nativeEvent.layout.height);
  };

  const styles = useStyleSheet(styleSheet);

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={[styles.shadowBox, { height, borderRadius: height / 2 }]}>
        <View style={[styles.radiusBox, { borderRadius: height / 2 }]}>
          {children}
        </View>
      </View>
    </View>
  );
};

export default ImagePickerContactCardMediaWrapper;

const styleSheet = createStyleSheet(appearance => ({
  radiusBox: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.grey100,
    borderWidth: 4,
    borderColor: appearance === 'dark' ? colors.black : colors.white,
  },
  shadowBox: [
    {
      flex: 1,
      aspectRatio: 1,
    },
    shadow({ appearance, direction: 'bottom' }),
  ],
  container: {
    flex: 1,
    maxHeight: 300,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));
