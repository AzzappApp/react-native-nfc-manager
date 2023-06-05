import React from 'react';
import { View } from 'react-native';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { TOOL_BAR_HEIGHT } from './coverEditionConstants';
import type { ViewProps } from 'react-native';

const CoverEditionScreenToolBar = ({ style, ...props }: ViewProps) => {
  const styles = useStyleSheet(styleSheet);
  const hasChildren =
    React.Children.toArray(props.children).filter(children => !!children)
      .length > 0;
  return (
    <View
      style={[styles.toolbar, !hasChildren && { opacity: 0 }, style]}
      {...props}
    />
  );
};

export default CoverEditionScreenToolBar;

const styleSheet = createStyleSheet(appearance => ({
  toolbar: [
    {
      flexDirection: 'row',
      height: TOOL_BAR_HEIGHT,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 15,
      backgroundColor: appearance === 'light' ? colors.white : colors.black,
    },
    shadow(appearance, 'center'),
  ],
}));
