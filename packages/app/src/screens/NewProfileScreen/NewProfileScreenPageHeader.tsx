import { StyleSheet, View } from 'react-native';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
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
          <IconButton
            icon="arrow_left"
            onPress={onBack}
            iconSize={28}
            variant="icon"
            style={styles.backIcon}
          />
        )}
      </View>
      <Text variant="xlarge" style={styles.titleText}>
        {title}
      </Text>
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
    flex: 1,
    textAlign: 'center',
    paddingTop: 0,
    textAlignVertical: 'center',
  },
});
