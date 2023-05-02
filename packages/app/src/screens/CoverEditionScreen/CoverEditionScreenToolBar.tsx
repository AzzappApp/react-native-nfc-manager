import React from 'react';
import { View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { TOOL_BAR_HEIGHT } from './coverEditionConstants';
import type { ViewProps } from 'react-native';

const CoverEditionScreenToolBar = ({ style, ...props }: ViewProps) => {
  const styles = useStyleSheet(stylesheet);
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

const stylesheet = createStyleSheet(appearance => ({
  toolbar: {
    flexDirection: 'row',
    height: TOOL_BAR_HEIGHT,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    shadowColor: appearance === 'light' ? colors.grey900 : colors.grey600,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
    rowGap: 22,
  },
}));
