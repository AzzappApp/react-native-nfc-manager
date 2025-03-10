import { View } from 'react-native';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import FloatingIconButton from '#ui/FloatingIconButton';
import Icon from '#ui/Icon';
import Text from '#ui/Text';

export type CoverPreviewErrorRendererProps = {
  width: number;
  onRetry: () => void;
  label: React.ReactNode;
};

const CoverErrorRenderer = ({
  width,
  onRetry,
  label,
}: CoverPreviewErrorRendererProps) => {
  const styles = useStyleSheet(styleSheet);
  const height = width / COVER_RATIO;
  const borderRadius = width * COVER_CARD_RADIUS;
  return (
    <View
      style={[styles.templateErrorContainer, { borderRadius, width, height }]}
    >
      <Icon icon="warning" style={styles.templateErrorIcon} />
      <Text variant="smallbold" style={styles.templateErroText}>
        {label}
      </Text>
      <FloatingIconButton icon="reload" onPress={onRetry} />
    </View>
  );
};

export default CoverErrorRenderer;

const styleSheet = createStyleSheet(appearance => ({
  templateErrorContainer: {
    backgroundColor: appearance === 'light' ? '#fff' : '#000',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 20,
    gap: 5,
    ...shadow({ appearance, direction: 'center' }),
  },
  templateErrorIcon: {
    width: 34,
    height: 34,
    tintColor: appearance === 'light' ? colors.grey200 : colors.grey900,
  },
  templateErroText: {
    textAlign: 'center',
  },
}));
