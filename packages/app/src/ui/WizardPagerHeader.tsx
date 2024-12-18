import { View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import type { Icons } from '#ui/Icon';
import type { ColorSchemeName, ViewProps } from 'react-native';

export type WizardPagerHeaderProps = Omit<ViewProps, 'children'> & {
  title: React.ReactNode;
  currentPage: number;
  nbPages: number;
  backIcon?: Icons;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  rightElementWidth?: number;
};

type PageProgressProps = {
  nbPages: number;
  currentPage: number;
  appearance?: ColorSchemeName;
};

export const PageProgress = ({
  nbPages,
  currentPage,
  appearance,
}: PageProgressProps) => {
  const styles = useStyleSheet(styleSheet, appearance);

  return (
    <View style={styles.pagerContainer}>
      {Array.from({ length: nbPages }).map((_, index) => {
        if (index < currentPage) {
          return (
            <View
              accessibilityState={{ selected: false }}
              key={`NewProfilepager-${index}`}
              style={[styles.common, styles.previousCircle]}
            />
          );
        } else if (index === currentPage) {
          return (
            <View
              accessibilityRole="none"
              accessibilityState={{ selected: true }}
              key={`NewProfilepager-${index}`}
              style={[styles.common, styles.selectedCircle]}
            />
          );
        }
        return (
          <View
            accessibilityState={{ selected: false }}
            key={`NewProfilepager-${index}`}
            style={[styles.common, styles.smallCircle]}
          />
        );
      })}
      <View />
    </View>
  );
};

const WizardPagerHeader = ({
  onBack,
  title,
  nbPages,
  currentPage,
  style,
  backIcon,
  rightElement,
  rightElementWidth = 40,
  ...props
}: WizardPagerHeaderProps) => {
  const styles = useStyleSheet(styleSheet);
  return (
    <View {...props} style={[styles.root, style]}>
      <View style={styles.header}>
        <View style={styles.headerSegment}>
          {backIcon && (
            <IconButton
              icon={backIcon}
              onPress={onBack}
              iconSize={28}
              variant="icon"
              style={[styles.backIcon, { minWidth: rightElementWidth }]}
            />
          )}
        </View>
        <View
          key={currentPage}
          style={[
            styles.titleTextContainer,
            !backIcon && { marginLeft: rightElementWidth },
          ]}
        >
          {typeof title === 'string' ? (
            <Text variant="large" style={styles.titleText}>
              {title}
            </Text>
          ) : (
            title
          )}
        </View>
        <View
          style={[styles.headerSegment, { minWidth: rightElementWidth }]}
          collapsable={false}
        >
          {rightElement}
        </View>
      </View>
      <PageProgress nbPages={nbPages} currentPage={currentPage} />
    </View>
  );
};

export default WizardPagerHeader;

const CIRCLE_SIZE = 5;

export const PAGER_HEADER_HEIGHT = 85;

const styleSheet = createStyleSheet(appearance => ({
  root: {
    height: PAGER_HEADER_HEIGHT,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerSegment: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    height: 17,
    width: 10,
  },
  titleTextContainer: {
    alignSelf: 'center',
  },
  titleText: {
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  pagerContainer: {
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  common: {
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    marginLeft: CIRCLE_SIZE / 2,
    marginRight: CIRCLE_SIZE / 2,
  },
  previousCircle: {
    width: CIRCLE_SIZE,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
  },
  selectedCircle: {
    width: 20,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
  },
  smallCircle: {
    width: CIRCLE_SIZE,
    backgroundColor: appearance === 'light' ? colors.grey200 : colors.grey800,
  },
}));
