import chunk from 'lodash/chunk';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Image, Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';
import type { ModalProps } from 'react-native';

type ModuleSelectionListModalProps = Exclude<ModalProps, 'onRequestClose'> & {
  onSelectModuleKind: (module: ModuleKind) => void;
  onRequestClose: () => void;
};

const ModuleSelectionListModal = ({
  onSelectModuleKind,
  onRequestClose,
  ...props
}: ModuleSelectionListModalProps) => {
  const intl = useIntl();
  const modules = useMemo(
    () =>
      [
        {
          moduleKind: 'simpleButton',
          label: intl.formatMessage({
            defaultMessage: 'Simple Button',
            description:
              'Module selection list modal simple button module label',
          }),
          image: require('./assets/simple-button.png'),
          ready: true,
        },
        {
          moduleKind: 'simpleText',
          label: intl.formatMessage({
            defaultMessage: 'Simple Text',
            description: 'Module selection list modal simple text module label',
          }),
          image: require('./assets/simple-text.png'),
          ready: true,
        },
        {
          moduleKind: 'blockText',
          label: intl.formatMessage({
            defaultMessage: 'Block Text',
            description: 'Module selection list modal block text module label',
          }),
          image: require('./assets/simple-text.png'),
          ready: false,
        },
        {
          moduleKind: 'simpleTitle',
          label: intl.formatMessage({
            defaultMessage: 'Simple Title',
            description:
              'Module selection list modal simple title module label',
          }),
          image: require('./assets/simple-button.png'),
          ready: true,
        },
        {
          moduleKind: 'horizontalPhoto',
          label: intl.formatMessage({
            defaultMessage: 'Horizontal Photo',
            description:
              'Module selection list modal horizontal photo module label',
          }),
          image: require('./assets/simple-button.png'),
          ready: true,
        },
        {
          moduleKind: 'carousel',
          label: intl.formatMessage({
            defaultMessage: 'Image Carousel',
            description:
              'Module selection list modal Image Carousel module label',
          }),
          image: require('./assets/simple-button.png'),
          ready: true,
        },
        {
          moduleKind: 'lineDivider',
          label: intl.formatMessage({
            defaultMessage: 'Line Divider',
            description:
              'Module selection list modal Line Divider module label',
          }),
          image: require('./assets/simple-button.png'),
          ready: true,
        },
        {
          moduleKind: 'photoWithTextAndTitle',
          label: intl.formatMessage({
            defaultMessage: 'Photo With Text and title',
            description:
              'Module selection list modal Photo With Text and title module label',
          }),
          image: require('./assets/simple-button.png'),
          ready: true,
        },
        {
          moduleKind: 'openingHours',
          label: intl.formatMessage({
            defaultMessage: 'Opening Hours',
            description:
              'Module selection list modal Opening Hours module label',
          }),
          image: require('./assets/simple-button.png'),
          ready: false,
        },
        {
          moduleKind: 'webCardsCarousel',
          label: intl.formatMessage({
            defaultMessage: 'WebCards Carousel',
            description:
              'Module selection list modal WebCards Carousel module label',
          }),
          image: require('./assets/simple-button.png'),
          ready: false,
        },
        {
          moduleKind: 'socialLinks',
          label: intl.formatMessage({
            defaultMessage: 'Social Links',
            description:
              'Module selection list modal Social Links module label',
          }),
          image: require('./assets/simple-button.png'),
          ready: false,
        },
      ] as const,
    [intl],
  );

  const { top, bottom } = useSafeAreaInsets();
  const styles = useStyleSheet(styleSheet);

  return (
    <Modal onRequestClose={onRequestClose} {...props}>
      <Container style={{ flex: 1, paddingTop: top }}>
        <Header
          leftElement={
            <IconButton icon="arrow_down" onPress={onRequestClose} />
          }
          middleElement={intl.formatMessage({
            defaultMessage: 'Add a new section',
            description: 'Module selection list modal header title',
          })}
        />
        <ScrollView
          style={{ flex: 1, paddingBottom: bottom }}
          contentContainerStyle={styles.buttonContainer}
        >
          {chunk(modules, 2).map((line, index) => (
            <View key={index} style={styles.buttonLine}>
              {line.map(({ image, label, ready, moduleKind }) => (
                <PressableNative
                  key={moduleKind}
                  style={styles.button}
                  onPress={() => onSelectModuleKind(moduleKind)}
                  disabled={!ready}
                  accessibilityRole="button"
                >
                  <Image source={image} style={styles.buttonImage} />
                  <Text variant="button">{label}</Text>
                </PressableNative>
              ))}
            </View>
          ))}
        </ScrollView>
      </Container>
    </Modal>
  );
};

export default ModuleSelectionListModal;

const styleSheet = createStyleSheet(appearance => ({
  buttonContainer: {
    padding: 20,
    gap: 10,
  },
  buttonLine: {
    flexDirection: 'row',
    gap: 10,
  },
  button: [
    {
      padding: 10,
      borderRadius: 10,
      gap: 10,
    },
    shadow(appearance),
  ],
  buttonImage: {
    padding: 10,
    aspectRatio: 1,
  },
}));
