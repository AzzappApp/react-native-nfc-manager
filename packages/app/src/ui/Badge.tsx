import { View } from 'react-native';
import { colors } from '#theme';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
};

const Badge = ({ children, style }: Props) => {
  return (
    <View
      style={[
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 8,
          paddingVertical: 5,
          backgroundColor: colors.white,
          borderRadius: 28,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default Badge;
