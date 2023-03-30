import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamilies } from '#theme';
import IconButton from '#ui/IconButton';
import NewProfileScreenPagerIndicator from './NewProfileScreenPagerIndicator';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type NewProfileScreenPageHeaderProps = Omit<ViewProps, 'children'> & {
  onBack?: (() => void) | null;
  title: React.ReactNode;
  activeIndex: number;
};

const NewProfileScreenPageHeader = ({
  onBack,
  title,
  activeIndex,
  ...props
}: NewProfileScreenPageHeaderProps) => (
  <View {...props}>
    <View style={styles.header}>
      <View style={styles.headerSegment}>
        {onBack && (
          <IconButton icon="back" onPress={onBack} style={styles.backIcon} />
        )}
      </View>
      <Text style={styles.titleText}>{title}</Text>
      <View style={styles.headerSegment} />
    </View>
    <NewProfileScreenPagerIndicator activeIndex={activeIndex} />
  </View>
);

export default NewProfileScreenPageHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  headerSegment: {
    width: 40,
  },
  backIcon: {
    height: 17,
    width: 10,
  },
  titleText: {
    ...fontFamilies.semiBold,
    flex: 1,
    fontSize: 20,
    textAlign: 'center',
    paddingTop: 0,
    color: colors.black,
    textAlignVertical: 'center',
  },
});
