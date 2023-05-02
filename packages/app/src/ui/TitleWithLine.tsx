import { View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { TAB_BAR_HEIGHT } from './TabsBar';
import Text from './Text';
import type { ViewProps } from 'react-native';

export type TitleWithLineProps = Omit<ViewProps, 'children'> & {
  title: string;
};

const TitleWithLine = ({ title, style, ...props }: TitleWithLineProps) => {
  const styles = useStyleSheet(stylesheet);
  return (
    <View style={[styles.root, style]} {...props}>
      <View style={styles.backgroundLine} />
      <Text variant="smallbold" style={styles.title}>
        {title}
      </Text>
      <View style={styles.backgroundLine} />
    </View>
  );
};

export default TitleWithLine;

const stylesheet = createStyleSheet(appearance => ({
  root: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
  },
  title: {
    paddingHorizontal: 15,
    textAlign: 'center',
  },
  backgroundLine: {
    flex: 1,
    height: 1,
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    alignSelf: 'center',
  },
}));
